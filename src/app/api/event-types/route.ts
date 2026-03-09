import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM event_types ORDER BY name ASC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching event types:', error);
        return NextResponse.json({ error: 'Failed to fetch event types' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const result = await pool.query(
            'INSERT INTO event_types (name) VALUES ($1) RETURNING *',
            [name]
        );

        const newType = result.rows[0];
        await logActivity(null, 'CREATE', 'CONFIG' as any, newType.id, { name: newType.name, type: 'EVENT_TYPE' });

        return NextResponse.json(newType);
    } catch (error) {
        console.error('Error creating event type:', error);
        return NextResponse.json({ error: 'Failed to create event type' }, { status: 500 });
    }
}
