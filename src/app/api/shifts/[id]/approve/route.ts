import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { status, notes, approvedBy } = await request.json();

        if (!id || !status || !['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request. Status must be "approved" or "rejected".' }, { status: 400 });
        }

        // Update the shift's approval fields and also update the main status to 'Completed' if approved
        const newStatus = status === 'approved' ? 'Completed' : 'Pending Approval';

        const result = await pool.query(
            `UPDATE shifts 
             SET approval_status = $1, approved_by = $2, approval_notes = $3, status = $4
             WHERE id = $5 RETURNING *`,
            [status, approvedBy || null, notes || null, newStatus, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
        }

        const updatedShift = result.rows[0];
        await logActivity(approvedBy, 'UPDATE', 'SHIFT_APPROVAL', id, { status, notes });

        return NextResponse.json(updatedShift);
    } catch (error) {
        console.error('Error approving shift:', error);
        return NextResponse.json({ error: 'Failed to update shift approval' }, { status: 500 });
    }
}
