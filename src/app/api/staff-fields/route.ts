import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { NATIVE_STAFF_FIELDS } from '@/lib/staffFieldRegistry';

const ALLOWED_TYPES = new Set(['text', 'number', 'date', 'boolean']);

async function ensureNativeFieldSeeds() {
  const existing = await pool.query(
    `SELECT field_key FROM staff_custom_fields`
  );
  const existingKeys = new Set(existing.rows.map((r: any) => r.field_key));

  for (const f of NATIVE_STAFF_FIELDS) {
    if (existingKeys.has(f.field_key)) continue;

    await pool.query(
      `INSERT INTO staff_custom_fields (
        field_key, label, field_type, required_for_contract, is_active,
        group_key, show_in_profile, employee_editable, sort_order
      )
      VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7, $8)`,
      [
        f.field_key,
        f.label,
        f.field_type,
        f.required_for_contract,
        f.group_key,
        f.show_in_profile,
        f.employee_editable,
        f.sort_order,
      ]
    );
  }
}

export async function GET() {
  try {
    await ensureNativeFieldSeeds();

    const result = await pool.query(
      `SELECT id, field_key, label, field_type, required_for_contract, is_active, group_key, show_in_profile, employee_editable, sort_order, created_at, updated_at
       FROM staff_custom_fields
       WHERE is_active = TRUE
       ORDER BY group_key ASC, sort_order ASC, created_at ASC`
    );

    const nativeKeySet = new Set(NATIVE_STAFF_FIELDS.map((f) => f.field_key));
    const rows = result.rows.map((row: any) => ({
      ...row,
      is_system: nativeKeySet.has(row.field_key),
      is_deletable: !nativeKeySet.has(row.field_key),
    }));

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching staff fields:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fieldKey = String(body.fieldKey || '').trim();
    const label = String(body.label || '').trim();
    const fieldType = String(body.fieldType || '').trim().toLowerCase();
    const requiredForContract = Boolean(body.requiredForContract);
    const groupKey = String(body.groupKey || 'custom').trim() || 'custom';
    const showInProfile = body.showInProfile !== undefined ? Boolean(body.showInProfile) : true;
    const employeeEditable = body.employeeEditable !== undefined ? Boolean(body.employeeEditable) : false;
    const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;

    if (!fieldKey || !label || !fieldType) {
      return NextResponse.json(
        { error: 'fieldKey, label and fieldType are required' },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(fieldKey)) {
      return NextResponse.json(
        { error: 'fieldKey must start with a letter and contain only letters, numbers, underscores' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(fieldType)) {
      return NextResponse.json(
        { error: 'fieldType must be one of: text, number, date, boolean' },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      `SELECT id FROM staff_custom_fields WHERE field_key = $1`,
      [fieldKey]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'A field with this key already exists' },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `INSERT INTO staff_custom_fields (
        field_key, label, field_type, required_for_contract, is_active,
        group_key, show_in_profile, employee_editable, sort_order
      )
       VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7, $8)
       RETURNING id, field_key, label, field_type, required_for_contract, is_active, group_key, show_in_profile, employee_editable, sort_order, created_at, updated_at`,
      [fieldKey, label, fieldType, requiredForContract, groupKey, showInProfile, employeeEditable, sortOrder]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating staff field:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
