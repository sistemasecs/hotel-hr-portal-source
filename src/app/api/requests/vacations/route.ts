import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // First, get the user's role and department to determine what they can see
        const userResult = await pool.query('SELECT role, department FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const user = userResult.rows[0];
        
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
            WHERE r.type = 'Vacation'
        `;
        
        const values: any[] = [];

        // Role-based filtering
        if (user.role === 'HR Admin') {
            // HR Admin sees all vacations, no additional WHERE clause needed
        } else if (user.role === 'Manager' || user.role === 'Supervisor') {
            // Managers/Supervisors see vacations for their department OR where they are the direct supervisor
            query += ` AND (u.department = $1 OR r.supervisor_id = $2)`;
            values.push(user.department, userId);
        } else {
            // Regular staff shouldn't be accessing this endpoint for the global calendar, 
            // but if they do, only show their own
            query += ` AND r.user_id = $1`;
            values.push(userId);
        }

        query += ` ORDER BY r.created_at DESC`;

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching vacations:', error);
        return NextResponse.json({ error: 'Failed to fetch vacations' }, { status: 500 });
    }
}
