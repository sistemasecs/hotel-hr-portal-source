import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await pool.query('SELECT * FROM shifts WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching shift:', error);
        return NextResponse.json({ error: 'Failed to fetch shift' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { startTime, endTime, type, status, actualStartTime, actualEndTime } = await request.json();

        const result = await pool.query(
            `UPDATE shifts
             SET start_time = COALESCE($1, start_time),
                 end_time = COALESCE($2, end_time),
                 type = COALESCE($3, type),
                 status = COALESCE($4, status),
                 actual_start_time = COALESCE($5, actual_start_time),
                 actual_end_time = COALESCE($6, actual_end_time)
             WHERE id = $7 RETURNING *`,
            [startTime, endTime, type, status, actualStartTime, actualEndTime, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        const updatedShift = result.rows[0];
        await logActivity(null, 'UPDATE', 'SHIFT', id, { type, status, actualStartTime, actualEndTime });

        return NextResponse.json(updatedShift);
    } catch (error) {
        console.error('Error updating shift:', error);
        return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const result = await pool.query('DELETE FROM shifts WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        await logActivity(null, 'DELETE', 'SHIFT', id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting shift:', error);
        return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 });
    }
}
