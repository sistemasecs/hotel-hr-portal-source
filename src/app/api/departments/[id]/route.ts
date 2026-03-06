import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { name, managerId, parentId, areas } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const result = await pool.query(
            'UPDATE departments SET name = $1, manager_id = $2, parent_id = $3, areas = $4 WHERE id = $5 RETURNING *', 
            [name, managerId || null, parentId || null, areas || [], id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        const updatedDept = result.rows[0];
        await logActivity(null, 'UPDATE', 'DEPARTMENT', updatedDept.id, { name: updatedDept.name });

        return NextResponse.json(updatedDept);
    } catch (error) {
        console.error('Error updating department:', error);
        // @ts-ignore
        if (error.code === '23505') {
            return NextResponse.json({ error: 'Department already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING id', [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Department not found' }, { status: 404 });
        }

        await logActivity(null, 'DELETE', 'DEPARTMENT', id);

        return NextResponse.json({ success: true, id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting department:', error);
        return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
    }
}
