import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { name, requestType, content } = await request.json();

        if (!name || !requestType || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await pool.query(`
            UPDATE document_templates
            SET 
                name = $1,
                request_type = $2,
                content = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
            RETURNING 
                id, 
                name, 
                request_type as "requestType", 
                content, 
                created_at as "createdAt", 
                updated_at as "updatedAt"
        `, [name, requestType, content, id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating document template:', error);
        return NextResponse.json({ error: 'Failed to update document template' }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const result = await pool.query('DELETE FROM document_templates WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting document template:', error);
        return NextResponse.json({ error: 'Failed to delete document template' }, { status: 500 });
    }
}
