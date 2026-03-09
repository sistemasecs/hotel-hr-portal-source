import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM events ORDER BY date ASC, time ASC');
        const formatted = result.rows.map(row => ({
            ...row,
            coverImageUrl: row.cover_image_url
        }));
        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const event = await request.json();
        const { title, date, time, type, description, location, coverImageUrl } = event;

        // We rely on the database to generate the UUID for us
        const result = await pool.query(
            'INSERT INTO events (title, date, time, type, description, location, cover_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, date, time, type, description, location, coverImageUrl]
        );

        const row = result.rows[0];
        const newEvent = {
            ...row,
            coverImageUrl: row.cover_image_url
        };

        await logActivity(null, 'CREATE', 'EVENT', newEvent.id, { title: newEvent.title, type: newEvent.type });

        return NextResponse.json(newEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}
