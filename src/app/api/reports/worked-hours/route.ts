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
                SUM(EXTRACT(EPOCH FROM (s.actual_end_time - s.actual_start_time)) / 3600) as total_hours
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            WHERE s.status = 'Completed' 
              AND s.actual_start_time >= $1 
              AND s.actual_end_time <= $2
        `;

        let values: any[] = [startDate, endDate];

        if (departmentId) {
            query += ` AND u.department = (SELECT name FROM departments WHERE id = $3)`;
            values.push(departmentId);
        }

        query += ` GROUP BY u.id, u.name, u.department ORDER BY total_hours DESC`;

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching worked hours report:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
