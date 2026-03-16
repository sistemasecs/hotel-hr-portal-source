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

        // --- Notification Logic ---
        const allUsersResult = await pool.query('SELECT id, name FROM users WHERE id != $1', [userId]);
        const allUsers = allUsersResult.rows;

        // 1. Detect Mentions (@Name)
        const mentions = content.match(/@([A-Za-z\s]+)/g);
        if (mentions) {
            for (const mention of mentions) {
                const nameToMatch = mention.substring(1).trim().toLowerCase();
                const matchedUser = allUsers.find(u => u.name.toLowerCase().includes(nameToMatch));
                
                if (matchedUser) {
                    await pool.query(`
                        INSERT INTO notifications (user_id, type, title, message, link)
                        VALUES ($1, $2, $3, $4, $5)
                    `, [
                        matchedUser.id,
                        'EVENT_TAG',
                        'You were tagged',
                        `${newComment.userName} tagged you in a comment.`,
                        `/dashboard/celebrations/${encodeURIComponent(id)}`
                    ]);
                }
            }
        }

        // 2. Birthday Notification
        // Check if event ID is synthetic birthday (doesn't contain hyphen and ends with a year)
        const isBirthday = !id.includes('-') && /\d{4}$/.test(id);
        if (isBirthday) {
            // Find the user whose birthday it is. The ID pattern is formattedName+Year
            const birthdayUser = allUsers.find(u => {
                const formatted = u.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                return id.startsWith(formatted);
            });

            if (birthdayUser && birthdayUser.id !== userId) {
                await pool.query(`
                    INSERT INTO notifications (user_id, type, title, message, link)
                    VALUES ($1, $2, $3, $4, $5)
                `, [
                    birthdayUser.id,
                    'BIRTHDAY_COMMENT',
                    'Happy Birthday Comment!',
                    `${newComment.userName} commented on your birthday photo album.`,
                    `/dashboard/celebrations/${encodeURIComponent(id)}`
                ]);
            }
        }

        return NextResponse.json(newComment, { status: 201 });
    } catch (error) {
        console.error('Error posting comment:', error);
        return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }
}