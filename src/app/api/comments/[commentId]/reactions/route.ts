import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request, context: { params: Promise<{ commentId: string }> }) {
    try {
        const { commentId } = await context.params;
        const { userId, emoji } = await request.json();

        if (!userId || !emoji) {
            return NextResponse.json({ error: 'User ID and emoji are required' }, { status: 400 });
        }

        // Check if the reaction already exists
        const checkQuery = `
            SELECT id FROM comment_reactions 
            WHERE comment_id = $1::uuid AND user_id = $2::uuid AND emoji = $3
        `;
        const checkResult = await pool.query(checkQuery, [commentId, userId, emoji]);

        if (checkResult.rows.length > 0) {
            // If it exists, remove it (toggle off)
            await pool.query('DELETE FROM comment_reactions WHERE id = $1', [checkResult.rows[0].id]);
            return NextResponse.json({ action: 'removed' });
        } else {
            // If it doesn't exist, add it (toggle on)
            await pool.query(
                'INSERT INTO comment_reactions (comment_id, user_id, emoji) VALUES ($1, $2, $3)',
                [commentId, userId, emoji]
            );
            return NextResponse.json({ action: 'added' });
        }
    } catch (error) {
        console.error('Error toggling reaction:', error);
        return NextResponse.json({ error: 'Failed to toggle reaction' }, { status: 500 });
    }
}