import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const result = await pool.query(`
            SELECT 
                r.id, 
                r.request_id as "requestId", 
                r.template_id as "templateId", 
                r.content, 
                r.is_signed as "isSigned", 
                r.signature_data as "signatureData", 
                r.signed_at as "signedAt",
                t.name as "templateName"
            FROM request_documents r
            LEFT JOIN document_templates t ON r.template_id = t.id
            WHERE r.request_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Document not found for this request' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching request document:', error);
        return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
    }
}

// Signing the document
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { signatureData } = await request.json();

        if (!signatureData) {
            return NextResponse.json({ error: 'Signature data is required' }, { status: 400 });
        }

        const result = await pool.query(`
            UPDATE request_documents
            SET 
                is_signed = TRUE,
                signature_data = $1,
                signed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE request_id = $2
            RETURNING *
        `, [signatureData, id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error signing document:', error);
        return NextResponse.json({ error: 'Failed to sign document' }, { status: 500 });
    }
}
