import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { NATIVE_STAFF_FIELDS } from '@/lib/staffFieldRegistry';

const ALLOWED_TYPES = new Set(['text', 'number', 'date', 'boolean']);

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (body.label !== undefined) {
      updates.push(`label = $${i++}`);
      values.push(String(body.label).trim());
    }

    if (body.fieldType !== undefined) {
      const fieldType = String(body.fieldType).trim().toLowerCase();
      if (!ALLOWED_TYPES.has(fieldType)) {
        return NextResponse.json(
          { error: 'fieldType must be one of: text, number, date, boolean' },
          { status: 400 }
        );
      }
      updates.push(`field_type = $${i++}`);
      values.push(fieldType);
    }

    if (body.requiredForContract !== undefined) {
      updates.push(`required_for_contract = $${i++}`);
      values.push(Boolean(body.requiredForContract));
    }

    if (body.groupKey !== undefined) {
      updates.push(`group_key = $${i++}`);
      values.push(String(body.groupKey || '').trim() || 'custom');
    }

    if (body.showInProfile !== undefined) {
      updates.push(`show_in_profile = $${i++}`);
      values.push(Boolean(body.showInProfile));
    }

    if (body.employeeEditable !== undefined) {
      updates.push(`employee_editable = $${i++}`);
      values.push(Boolean(body.employeeEditable));
    }

    if (body.sortOrder !== undefined) {
      const parsedSort = Number(body.sortOrder);
      updates.push(`sort_order = $${i++}`);
      values.push(Number.isFinite(parsedSort) ? parsedSort : 0);
    }

    if (body.isActive !== undefined) {
      updates.push(`is_active = $${i++}`);
      values.push(Boolean(body.isActive));
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(id);
    const query = `
      UPDATE staff_custom_fields
      SET ${updates.join(', ')}
      WHERE id = $${i}
      RETURNING id, field_key, label, field_type, required_for_contract, is_active, group_key, show_in_profile, employee_editable, sort_order, created_at, updated_at
    `;

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating staff field:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const lookup = await pool.query(
      `SELECT id, field_key FROM staff_custom_fields WHERE id = $1`,
      [id]
    );

    if (lookup.rows.length === 0) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    const nativeKeySet = new Set(NATIVE_STAFF_FIELDS.map((f) => f.field_key));
    if (nativeKeySet.has(lookup.rows[0].field_key)) {
      return NextResponse.json(
        { error: 'System/native fields cannot be deleted' },
        { status: 403 }
      );
    }

    const result = await pool.query(
      `UPDATE staff_custom_fields
       SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error soft deleting staff field:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
