import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const query = `
            SELECT 
                c.id, 
                c.event_reference as "eventId", 
                c.user_id as "userId", 
                c.content, 
                c.image_url as "imageUrl",
                c.created_at as "createdAt",
                u.name as "userName",
                u.avatar_url as "userAvatarUrl",
                COALESCE(
                    (
                        SELECT json_agg(
                            json_build_object(
                                'emoji', r.emoji,
                                'userIds', r.user_ids
                            )
                        )
                        FROM (
                            SELECT emoji, array_agg(user_id) as user_ids
                            FROM comment_reactions
                            WHERE comment_id = c.id
                            GROUP BY emoji
                        ) r
                    ),
                    '[]'::json
                ) as reactions
            FROM event_comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.event_reference = $1
            ORDER BY c.created_at ASC
        `;

        const result = await pool.query(query, [id]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching comments:', error);
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { userId, content, imageUrl } = await request.json();

        if (!userId || !content) {
            return NextResponse.json({ error: 'User ID and content are required' }, { status: 400 });
        }

        const insertQuery = `
            INSERT INTO event_comments (event_reference, user_id, content, image_url)
            VALUES ($1, $2, $3, $4)
            RETURNING id, event_reference as "eventId", user_id as "userId", content, image_url as "imageUrl", created_at as "createdAt"
        `;

        const insertResult = await pool.query(insertQuery, [id, userId, content, imageUrl || null]);
        const newComment = insertResult.rows[0];

        // Fetch user details to return the complete comment object
        const userQuery = `SELECT name, avatar_url FROM users WHERE id = $1`;
        const userResult = await pool.query(userQuery, [userId]);
        
        if (userResult.rows.length > 0) {
            newComment.userName = userResult.rows[0].name;
            newComment.userAvatarUrl = userResult.rows[0].avatar_url;
        }
        
        newComment.reactions = [];

        return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
        console.error('Error posting comment:', error);
        return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }
}