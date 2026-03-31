import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = 'SELECT * FROM vacation_consents';
    const params = [];

    if (userId) {
      query += ' WHERE user_id = $1::uuid';
      params.push(userId);
    }

    const { rows } = await pool.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching vacation consents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, yearNumber, signedById, notes } = body;

    if (!userId || !yearNumber) {
      return NextResponse.json({ error: 'UserId and YearNumber are required' }, { status: 400 });
    }

    const query = `
      INSERT INTO vacation_consents (user_id, year_number, signed_by_id, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, year_number) 
      DO UPDATE SET signed_at = CURRENT_TIMESTAMP, signed_by_id = $3, notes = $4
      RETURNING *
    `;

    const { rows } = await pool.query(query, [userId, yearNumber, signedById, notes]);
    
    await logActivity(signedById || null, 'SIGN', 'VACATION_CONSENT', rows[0].id, { userId, yearNumber });

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error signing vacation consent:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
