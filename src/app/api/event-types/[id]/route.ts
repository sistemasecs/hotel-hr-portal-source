import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const result = await pool.query(
            'UPDATE event_types SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
        }

        const updatedType = result.rows[0];
        await logActivity(null, 'UPDATE', 'EVENT_TYPE', updatedType.id, { name: updatedType.name });

        return NextResponse.json(updatedType);
    } catch (error) {
        console.error('Error updating event type:', error);
        return NextResponse.json({ error: 'Failed to update event type' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await pool.query(
            'DELETE FROM event_types WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
        }

        const deletedType = result.rows[0];
        await logActivity(null, 'DELETE', 'EVENT_TYPE', deletedType.id, { name: deletedType.name });

        return NextResponse.json({ message: 'Event type deleted' });
    } catch (error) {
        console.error('Error deleting event type:', error);
        return NextResponse.json({ error: 'Failed to delete event type' }, { status: 500 });
    }
}
