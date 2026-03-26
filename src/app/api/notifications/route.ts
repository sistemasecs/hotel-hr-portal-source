import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }

    const typeParam = searchParams.get('type');

    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1 
    `;
    const params: any[] = [userId];

    if (typeParam) {
      query += ` AND type = $2 `;
      params.push(typeParam);
    }

    query += ` ORDER BY created_at DESC LIMIT 100 `;
    
    const { rows } = await pool.query(query, params);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, userId, markAllAsRead } = body;

    if (markAllAsRead && userId) {
      await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [userId]);
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'NotificationId is required' }, { status: 400 });
    }

    await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [notificationId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, title, message, link, broadcast } = body;

    if (broadcast) {
      if (!type || !title || !message) {
        return NextResponse.json({ error: 'Missing required fields for broadcast' }, { status: 400 });
      }

      // Insert for all active users
      const query = `
        INSERT INTO notifications (user_id, type, title, message, link)
        SELECT id, $1, $2, $3, $4
        FROM users
        WHERE is_active = true
        RETURNING *
      `;
      const { rows } = await pool.query(query, [type, title, message, link || null]);
      return NextResponse.json({ count: rows.length }, { status: 201 });
    }

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const query = `
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await pool.query(query, [userId, type, title, message, link || null]);

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
