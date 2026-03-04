import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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
        const { name } = await request.json();

        const result = await pool.query(
            'INSERT INTO departments (name) VALUES ($1) RETURNING *',
            [name]
        );

        return NextResponse.json(result.rows[0]);
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
