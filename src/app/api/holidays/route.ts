import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM holidays ORDER BY start_date ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ error: 'Failed to fetch holidays' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, startDate, endDate, rateMultiplier } = await request.json();

    if (!name || !startDate || !endDate) {
      return NextResponse.json({ error: 'Name, startDate, and endDate are required' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO holidays (name, start_date, end_date, rate_multiplier) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, startDate, endDate, rateMultiplier || 1.0]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating holiday:', error);
    return NextResponse.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Holiday ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM holidays WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return NextResponse.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
