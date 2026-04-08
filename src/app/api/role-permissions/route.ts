import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT role, feature_key, is_allowed FROM role_permissions ORDER BY role, feature_key'
    );

    // Build a nested map: { role: { featureKey: boolean } }
    const map: Record<string, Record<string, boolean>> = {};
    for (const row of result.rows) {
      if (!map[row.role]) map[row.role] = {};
      map[row.role][row.feature_key] = row.is_allowed;
    }

    return NextResponse.json(map);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { role, featureKey, isAllowed } = await request.json();

    if (!role || !featureKey || isAllowed === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // HR Admin always has full access — prevent accidental lockout
    if (role === 'HR Admin') {
      return NextResponse.json({ error: 'HR Admin permissions cannot be modified.' }, { status: 403 });
    }

    await pool.query(
      `INSERT INTO role_permissions (role, feature_key, is_allowed)
       VALUES ($1, $2, $3)
       ON CONFLICT (role, feature_key) DO UPDATE SET is_allowed = EXCLUDED.is_allowed`,
      [role, featureKey, isAllowed]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role permission:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
