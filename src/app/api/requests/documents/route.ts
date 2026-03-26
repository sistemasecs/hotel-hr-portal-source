import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const userId = searchParams.get('userId');
        const requestIds = searchParams.get('requestIds');

        let query = `
            SELECT 
                rd.id, 
                rd.request_id as "request_id", 
                rd.template_id as "template_id", 
                rd.content, 
                rd.is_signed as "is_signed", 
                rd.signature_data as "signature_data", 
                rd.signed_at as "signed_at",
                t.name as "templateName"
            FROM request_documents rd
            LEFT JOIN document_templates t ON rd.template_id = t.id
            WHERE 1=1
        `;
        const values: any[] = [];
        let paramIndex = 1;

        if (type === 'YEARLY') {
            if (userId) {
                query += ` AND rd.request_id LIKE $${paramIndex}`;
                values.push(`YEARLY:${userId}:%`);
                paramIndex++;
            } else {
                query += ` AND rd.request_id LIKE 'YEARLY:%'`;
            }
        } else if (requestIds) {
            const ids = requestIds.split(',');
            query += ` AND rd.request_id = ANY($${paramIndex})`;
            values.push(ids);
            paramIndex++;
        }

        query += ` ORDER BY rd.created_at DESC`;

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { requestId, signatureData } = await request.json();

        if (!requestId) {
            return NextResponse.json({ error: 'RequestId is required' }, { status: 400 });
        }

        const result = await pool.query(`
            UPDATE request_documents
            SET 
                is_signed = TRUE,
                signature_data = COALESCE($1, signature_data),
                signed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            WHERE request_id::text = $2
            RETURNING *
        `, [signatureData || null, requestId]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating document:', error);
        return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }
}
