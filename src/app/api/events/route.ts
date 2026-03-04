import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY date ASC, time ASC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const event = await request.json();
        const { title, date, time, type, description, location } = event;

        // Check if the id was passed (e.g. from mock data or local generation)
        // If not, postgres gen_random_uuid() handles it
        const id = event.id && event.id.includes('-') ? event.id : undefined;

        let result;
        if (id) {
            result = await pool.query(
                'INSERT INTO events (id, title, date, time, type, description, location) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [id, title, date, time, type, description, location]
            );
        } else {
            result = await pool.query(
                'INSERT INTO events (title, date, time, type, description, location) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [title, date, time, type, description, location]
            );
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
