import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { status, hrNotes } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const query = `
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

        const result = await pool.query(query, [status, hrNotes || null, id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating request:', error);
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
    }
}