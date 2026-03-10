import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get('departmentId');

        let query = 'SELECT * FROM shift_types';
        let values: any[] = [];

        if (departmentId) {
            query += ' WHERE department_id = $1';
            values.push(departmentId);
        }

        query += ' ORDER BY name ASC';

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching shift types:', error);
        return NextResponse.json({ error: 'Failed to fetch shift types' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, department_id, start_time_default, end_time_default, color } = await request.json();

        if (!name || !department_id) {
            return NextResponse.json({ error: 'Name and Department ID are required' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO shift_types (name, department_id, start_time_default, end_time_default, color)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [name, department_id, start_time_default || null, end_time_default || null, color || '#3b82f6']
        );

        const newType = result.rows[0];
        await logActivity(null, 'CREATE', 'SHIFT_TYPE', newType.id, { name, department_id });

        return NextResponse.json(newType);
    } catch (error) {
        console.error('Error creating shift type:', error);
        return NextResponse.json({ error: 'Failed to create shift type' }, { status: 500 });
    }
}
