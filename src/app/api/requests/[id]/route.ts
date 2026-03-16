import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { status, hrNotes, data, userId } = body;

        // Allow updating either status or data (for colleague agreement)
        if (!status && !data) {
            return NextResponse.json({ error: 'Status or data is required' }, { status: 400 });
        }

        let query = '';
        let values = [];

        if (data) {
            // Update data JSON (e.g., for colleague agreement)
            query = `
                UPDATE employee_requests
                SET 
                    data = $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING 
                    id, 
                    user_id as "userId", 
                    type, 
                    status, 
                    data, 
                    supervisor_id as "supervisorId", 
                    hr_notes as "hrNotes", 
                    created_at as "createdAt", 
                    updated_at as "updatedAt"
            `;
            values = [data, id];
        } else {
            // Update status and hrNotes
            query = `
                UPDATE employee_requests
                SET 
                    status = $1,
                    hr_notes = COALESCE($2, hr_notes),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING 
                    id, 
                    user_id as "userId", 
                    type, 
                    status, 
                    data, 
                    supervisor_id as "supervisorId", 
                    hr_notes as "hrNotes", 
                    created_at as "createdAt", 
                    updated_at as "updatedAt"
            `;
            values = [status, hrNotes || null, id];
        }

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        const updatedRequest = result.rows[0];
        await logActivity(userId || null, 'UPDATE', 'REQUEST', updatedRequest.id, { status: updatedRequest.status });

        // Add Notification on Approval
        if (status === 'Approved') {
            await pool.query(`
                INSERT INTO notifications (user_id, type, title, message, link)
                VALUES ($1, $2, $3, $4, $5)
            `, [
                updatedRequest.userId, 
                'REQUEST_APPROVED', 
                'Request Approved', 
                `Your ${updatedRequest.type} request has been approved.`,
                '/dashboard/requests'
            ]);
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}