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

        // Check if the id was passed (e.g. from mock data or local generation)
        // If not, postgres gen_random_uuid() handles it
        const id = event.id && event.id.includes('-') ? event.id : undefined;

        let result;
        if (id) {
            result = await pool.query(
                'INSERT INTO events (id, title, date, time, type, description, location, cover_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
                [id, title, date, time, type, description, location, coverImageUrl]
            );
        } else {
            result = await pool.query(
                'INSERT INTO events (title, date, time, type, description, location, cover_image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
                [title, date, time, type, description, location, coverImageUrl]
            );
        }

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
