import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query('SELECT id, title, caption, image_url, event_type, event_date, uploaded_by, uploaded_at, event_id FROM celebration_photos ORDER BY uploaded_at DESC');

        const formatted = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            caption: row.caption || undefined,
            imageUrl: row.image_url,
            eventType: row.event_type,
            eventDate: row.event_date ? new Date(row.event_date).toISOString().split('T')[0] : '',
            uploadedBy: row.uploaded_by,
            uploadedAt: row.uploaded_at,
            eventId: row.event_id || undefined
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching celebration photos:', error);
        return NextResponse.json({ error: 'Failed to fetch celebrations' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const photo = await request.json();

        const id = photo.id && photo.id.includes('-') ? photo.id : undefined;
        
        // Handle synthetic birthday event IDs (e.g., 'carloslara2026')
        // The database event_id column is a UUID foreign key to the events table.
        // Since birthday events are generated on the fly and don't exist in the events table,
        // we must set event_id to null to avoid a foreign key constraint violation.
        // Real UUIDs contain hyphens, synthetic birthday IDs do not.
        const isBirthdayEvent = photo.eventId && !photo.eventId.includes('-');
        const dbEventId = isBirthdayEvent ? null : photo.eventId;

        let result;
        if (id) {
            result = await pool.query(
                `INSERT INTO celebration_photos (id, title, caption, image_url, event_type, event_date, uploaded_by, event_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
                [id, photo.title, photo.caption, photo.imageUrl, photo.eventType, photo.eventDate, photo.uploadedBy, dbEventId]
            );
        } else {
            result = await pool.query(
                `INSERT INTO celebration_photos (title, caption, image_url, event_type, event_date, uploaded_by, event_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [photo.title, photo.caption, photo.imageUrl, photo.eventType, photo.eventDate, photo.uploadedBy, dbEventId]
            );
        }

        return NextResponse.json({
            id: result.rows[0].id,
            title: result.rows[0].title,
            caption: result.rows[0].caption || undefined,
            imageUrl: result.rows[0].image_url,
            eventType: result.rows[0].event_type,
            eventDate: new Date(result.rows[0].event_date).toISOString().split('T')[0],
            uploadedBy: result.rows[0].uploaded_by,
            uploadedAt: result.rows[0].uploaded_at,
            // Return the original synthetic ID so the frontend state updates correctly
            eventId: isBirthdayEvent ? photo.eventId : (result.rows[0].event_id || undefined)
        });
    } catch (error) {
        console.error('Error creating celebration photo:', error);
        return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }
}
