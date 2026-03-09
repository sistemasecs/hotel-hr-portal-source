import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const departmentId = searchParams.get('departmentId');

        let query = `
            SELECT s.*, u.name as user_name, d.name as department_name 
            FROM shifts s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN departments d ON u.department = d.name
        `;
        let values: any[] = [];
        let conditions = [];

        if (userId) {
            conditions.push(`s.user_id = $${values.length + 1}`);
            values.push(userId);
        }

        if (status) {
            conditions.push(`s.status = $${values.length + 1}`);
            values.push(status);
        }

        if (startDate) {
            conditions.push(`s.start_time >= $${values.length + 1}`);
            values.push(startDate);
        }

        if (endDate) {
            conditions.push(`s.end_time <= $${values.length + 1}`);
            values.push(endDate);
        }

        if (departmentId) {
            // Join with departments to filter by ID
            conditions.push(`d.id = $${values.length + 1}`);
            values.push(departmentId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY s.start_time ASC';

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching shifts:', error);
        return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, startTime, endTime, type, status } = await request.json();

        if (!userId || !startTime || !endTime) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO shifts (user_id, start_time, end_time, type, status)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [userId, startTime, endTime, type || 'Custom', status || 'Scheduled']
        );

        const newShift = result.rows[0];
        await logActivity(null, 'CREATE', 'SHIFT', newShift.id, { userId, type });

        return NextResponse.json(newShift);
    } catch (error) {
        console.error('Error creating shift:', error);
        return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 });
    }
}
