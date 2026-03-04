import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query('SELECT user_id, module_id, status, TO_CHAR(completion_date, \'YYYY-MM-DD\') as completion_date FROM user_trainings');

        // Map snake_case to camelCase
        const formatted = result.rows.map(row => ({
            userId: row.user_id,
            moduleId: row.module_id,
            status: row.status,
            completionDate: row.completion_date || undefined
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching user trainings:', error);
        return NextResponse.json({ error: 'Failed to fetch user trainings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, moduleId, status, completionDate } = body;

        if (!userId || !moduleId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO user_trainings (user_id, module_id, status, completion_date) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, module_id) 
       DO UPDATE SET status = EXCLUDED.status, completion_date = EXCLUDED.completion_date
       RETURNING user_id, module_id, status, TO_CHAR(completion_date, 'YYYY-MM-DD') as completion_date`,
            [userId, moduleId, status, completionDate || null]
        );

        return NextResponse.json({
            userId: result.rows[0].user_id,
            moduleId: result.rows[0].module_id,
            status: result.rows[0].status,
            completionDate: result.rows[0].completion_date || undefined
        });
    } catch (error) {
        console.error('Error assigning/updating user training:', error);
        return NextResponse.json({ error: 'Failed to process user training' }, { status: 500 });
    }
}
