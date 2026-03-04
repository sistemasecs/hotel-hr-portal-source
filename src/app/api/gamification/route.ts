import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const peerVotesResult = await pool.query('SELECT * FROM peer_votes');
        const supervisorScoresResult = await pool.query('SELECT * FROM supervisor_scores');
        const eotmResult = await pool.query('SELECT * FROM employee_of_the_month');

        return NextResponse.json({
            peerVotes: peerVotesResult.rows.map(row => ({
                id: row.id,
                voterId: row.voter_id,
                nomineeId: row.nominee_id,
                month: row.month,
                reason: row.reason || undefined
            })),
            supervisorScores: supervisorScoresResult.rows.map(row => ({
                id: row.id,
                employeeId: row.employee_id,
                score: row.score,
                month: row.month,
                notes: row.notes || undefined
            })),
            employeesOfTheMonth: eotmResult.rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                month: row.month,
                awardedAt: row.awarded_at
            }))
        });
    } catch (error) {
        console.error('Error fetching gamification data:', error);
        return NextResponse.json({ error: 'Failed to fetch gamification data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const { action, payload } = data;

        if (action === 'peerVote') {
            const { voterId, nomineeId, month, reason } = payload;
            const result = await pool.query(
                `INSERT INTO peer_votes (voter_id, nominee_id, month, reason) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (voter_id, month) 
         DO UPDATE SET nominee_id = EXCLUDED.nominee_id, reason = EXCLUDED.reason 
         RETURNING *`,
                [voterId, nomineeId, month, reason]
            );
            return NextResponse.json(result.rows[0]);
        }

        if (action === 'supervisorScore') {
            const { employeeId, score, month, notes, submitterId } = payload;

            // Check submitter permissions
            if (!submitterId) {
                return NextResponse.json({ error: 'Submitter ID is required' }, { status: 400 });
            }
            const submitterCheck = await pool.query('SELECT role FROM users WHERE id = $1', [submitterId]);
            if (submitterCheck.rowCount === 0 || (submitterCheck.rows[0].role !== 'Supervisor' && submitterCheck.rows[0].role !== 'HR Admin')) {
                return NextResponse.json({ error: 'Unauthorized to submit supervisor scores' }, { status: 403 });
            }

            const result = await pool.query(
                `INSERT INTO supervisor_scores (employee_id, score, month, notes) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (employee_id, month) 
         DO UPDATE SET score = EXCLUDED.score, notes = EXCLUDED.notes 
         RETURNING *`,
                [employeeId, score, month, notes]
            );
            return NextResponse.json(result.rows[0]);
        }

        if (action === 'employeeOfTheMonth') {
            const { userId, month } = payload;
            const result = await pool.query(
                `INSERT INTO employee_of_the_month (user_id, month) 
         VALUES ($1, $2) 
         ON CONFLICT (month) 
         DO UPDATE SET user_id = EXCLUDED.user_id, awarded_at = CURRENT_TIMESTAMP
         RETURNING *`,
                [userId, month]
            );
            return NextResponse.json(result.rows[0]);
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Error in gamification POST:', error);
        return NextResponse.json({ error: 'Failed to save gamification data' }, { status: 500 });
    }
}
