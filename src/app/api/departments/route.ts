import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM departments ORDER BY name ASC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, managerId, parentId, areas } = await request.json();

        const result = await pool.query(
            'INSERT INTO departments (name, manager_id, parent_id, areas) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, managerId || null, parentId || null, areas || []]
        );

        const newDept = result.rows[0];
        await logActivity(null, 'CREATE', 'DEPARTMENT', newDept.id, { name: newDept.name });

        return NextResponse.json(newDept);
    } catch (error) {
        console.error('Error creating department:', error);
        // Handle unique constraint violation
        // @ts-ignore
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Department already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
    }
}
