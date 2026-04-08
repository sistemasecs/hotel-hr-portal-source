import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const result = await pool.query(
            'SELECT tier_id, signature_data, TO_CHAR(completed_at, \'YYYY-MM-DD HH24:MI:SS\') as completed_at FROM tier_completions WHERE user_id = $1',
            [userId]
        );

        const formatted = result.rows.map(row => ({
            tierId: row.tier_id,
            signatureData: row.signature_data,
            completedAt: row.completed_at
        }));

        return NextResponse.json(formatted);
    } catch (error) {
        console.error('Error fetching tier completions:', error);
        return NextResponse.json({ error: 'Failed to fetch tier completions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, tierId, signatureData } = body;

        if (!userId || !tierId || !signatureData) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await pool.query(
            `INSERT INTO tier_completions (user_id, tier_id, signature_data) 
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id, tier_id) 
             DO UPDATE SET signature_data = EXCLUDED.signature_data, completed_at = CURRENT_TIMESTAMP
             RETURNING user_id, tier_id, signature_data, TO_CHAR(completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed_at`,
            [userId, tierId, signatureData]
        );

        await logActivity(userId, 'COMPLETE', 'TRAINING_TIER', tierId.toString(), { tierId });

        return NextResponse.json({
            userId: result.rows[0].user_id,
            tierId: result.rows[0].tier_id,
            signatureData: result.rows[0].signature_data,
            completedAt: result.rows[0].completed_at
        });
    } catch (error) {
        console.error('Error saving tier completion:', error);
        return NextResponse.json({ error: 'Failed to save tier completion' }, { status: 500 });
    }
}
