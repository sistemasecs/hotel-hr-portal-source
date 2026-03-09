import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const updates = await request.json();

        // Extract valid fields for update
        const allowedFields = ['title', 'date', 'time', 'type', 'description', 'location', 'coverImageUrl'];
        const updateClauses = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key) && value !== undefined) {
                const dbColumn = key === 'coverImageUrl' ? 'cover_image_url' : key;
                updateClauses.push(`${dbColumn} = ${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (updateClauses.length === 0) {
            return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
        }

        values.push(id);
        const query = `UPDATE events SET ${updateClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const row = result.rows[0];
        const updatedEvent = {
            ...row,
            coverImageUrl: row.cover_image_url
        };

        await logActivity(null, 'UPDATE', 'EVENT', updatedEvent.id, { updatedFields: Object.keys(updates) });

        return NextResponse.json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        await logActivity(null, 'DELETE', 'EVENT', id);

        return NextResponse.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
