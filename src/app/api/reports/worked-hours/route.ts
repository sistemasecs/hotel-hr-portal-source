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
            WITH AttendancePairs AS (
                SELECT 
                    user_id,
                    timestamp as clock_in,
                    LEAD(timestamp) OVER (PARTITION BY user_id ORDER BY timestamp) as clock_out,
                    type,
                    LEAD(type) OVER (PARTITION BY user_id ORDER BY timestamp) as next_type
                FROM attendance_logs
                WHERE timestamp >= $1 AND timestamp <= $2
            )
            SELECT 
                u.id as user_id,
                u.name as user_name,
                u.department,
                SUM(EXTRACT(EPOCH FROM (clock_out - clock_in)) / 3600) as total_hours
            FROM AttendancePairs ap
            JOIN users u ON ap.user_id = u.id
            WHERE ap.type = 'CLOCK_IN' AND ap.next_type = 'CLOCK_OUT'
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
