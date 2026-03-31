import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate'); // ISO string
        const endDate = searchParams.get('endDate');     // ISO string
        const departmentId = searchParams.get('departmentId');

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
        }

        let query = `
            SELECT 
                u.id as user_id,
                u.name as user_name,
                u.department,
                COALESCE(SUM(EXTRACT(EPOCH FROM (s.end_time - s.start_time)) / 3600), 0) as scheduled_hours,
                COALESCE(SUM(CASE WHEN s.actual_start_time IS NOT NULL AND s.actual_end_time IS NOT NULL AND s.approval_status = 'approved'
                    THEN EXTRACT(EPOCH FROM (s.actual_end_time - s.actual_start_time)) / 3600 
                    ELSE 0 END), 0) as total_hours,
                COALESCE(SUM(CASE WHEN s.actual_start_time IS NOT NULL AND s.actual_end_time IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (s.actual_end_time - s.actual_start_time)) / 3600 
                    ELSE 0 END), 0) as actual_hours,
                COUNT(s.id) as total_shifts,
                COUNT(CASE WHEN s.approval_status = 'approved' THEN 1 END) as approved_shifts,
                COUNT(CASE WHEN s.status = 'Pending Approval' OR (s.actual_end_time IS NOT NULL AND COALESCE(s.approval_status, 'pending') = 'pending') THEN 1 END) as pending_shifts
            FROM users u
            LEFT JOIN shifts s ON s.user_id = u.id
                AND s.start_time >= $1 
                AND s.start_time <= $2
        `;

        let values: any[] = [startDate, endDate];

        if (departmentId) {
            query += ` WHERE u.department = (SELECT name FROM departments WHERE id = $3)`;
            values.push(departmentId);
        } else {
            query += ` WHERE 1=1`;
        }

        query += ` GROUP BY u.id, u.name, u.department ORDER BY u.name ASC`;

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching worked hours report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
