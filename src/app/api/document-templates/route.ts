import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query(`
            SELECT 
                id, 
                name, 
                request_type as "requestType", 
                content, 
                created_at as "createdAt", 
                updated_at as "updatedAt"
            FROM document_templates
            ORDER BY name ASC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching document templates:', error);
        return NextResponse.json({ error: 'Failed to fetch document templates' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, requestType, content } = await request.json();

        if (!name || !requestType || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await pool.query(`
            INSERT INTO document_templates (name, request_type, content)
            VALUES ($1, $2, $3)
            RETURNING 
                id, 
                name, 
                request_type as "requestType", 
                content, 
                created_at as "createdAt", 
                updated_at as "updatedAt"
        `, [name, requestType, content]);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating document template:', error);
        return NextResponse.json({ error: 'Failed to create document template' }, { status: 500 });
    }
}
