import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const query = `
            SELECT 
                a.id,
                a.user_id as "userId",
                u.name as "userName",
                a.action,
                a.entity_type as "entityType",
                a.entity_id as "entityId",
                a.details,
                a.created_at as "createdAt"
            FROM activity_logs a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 100
        `;
        
        const result = await pool.query(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }
}
