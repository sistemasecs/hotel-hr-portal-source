import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const status = searchParams.get('status');

        let query = `
            SELECT 
                r.id, 
                r.user_id as "userId", 
                r.type, 
                r.status, 
                r.data, 
                r.supervisor_id as "supervisorId", 
                r.hr_notes as "hrNotes", 
                r.created_at as "createdAt", 
                r.updated_at as "updatedAt",
                u.name as "userName",
                u.department as "userDepartment"
            FROM employee_requests r
            JOIN users u ON r.user_id = u.id
            WHERE 1=1
        `;
        const values: any[] = [];
        let paramIndex = 1;

        if (userId) {
            query += ` AND r.user_id = $${paramIndex}`;
            values.push(userId);
            paramIndex++;
        }

        if (status) {
            query += ` AND r.status = $${paramIndex}`;
            values.push(status);
            paramIndex++;
        }

        query += ` ORDER BY r.created_at DESC`;

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, type, data, supervisorId } = body;

        if (!userId || !type || !data) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const query = `
            INSERT INTO employee_requests (user_id, type, data, supervisor_id)
            VALUES ($1, $2, $3, $4)
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

        const result = await pool.query(query, [userId, type, data, supervisorId || null]);
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating request:', error);
        return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }
}