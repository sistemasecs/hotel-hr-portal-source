import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { name, startTimeDefault, endTimeDefault, color } = await request.json();

        const result = await pool.query(
            `UPDATE shift_types 
             SET name = $1, start_time_default = $2, end_time_default = $3, color = $4
             WHERE id = $5 RETURNING *`,
            [name, startTimeDefault, endTimeDefault, color, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Shift type not found' }, { status: 404 });
        }

        const updatedType = result.rows[0];
        await logActivity(null, 'UPDATE', 'SHIFT_TYPE', id, { name });

        return NextResponse.json(updatedType);
    } catch (error) {
        console.error('Error updating shift type:', error);
        return NextResponse.json({ error: 'Failed to update shift type' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        const result = await pool.query('DELETE FROM shift_types WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Shift type not found' }, { status: 404 });
        }

        await logActivity(null, 'DELETE', 'SHIFT_TYPE', id);

        return NextResponse.json({ message: 'Shift type deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift type:', error);
        return NextResponse.json({ error: 'Failed to delete shift type' }, { status: 500 });
    }
}
