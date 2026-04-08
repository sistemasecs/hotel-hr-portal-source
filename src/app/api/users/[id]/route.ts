import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department,
      area: row.area,
      supervisorId: row.supervisor_id,
      avatarUrl: row.avatar_url,
      birthday: row.birthday.toISOString().split('T')[0],
      hireDate: row.hire_date.toISOString().split('T')[0],
      employmentType: row.employment_type || 'Contract',
      contractSigningDate: row.contract_signing_date ? row.contract_signing_date.toISOString().split('T')[0] : null,
      tShirtSize: row.t_shirt_size,
      allergies: row.allergies || [],
      isActive: row.is_active,
      inactiveDate: row.inactive_date ? row.inactive_date.toISOString().split('T')[0] : null,
      inactiveReason: row.inactive_reason,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      maritalStatus: row.marital_status,
      spouseName: row.spouse_name,
      childrenCount: row.children_count,
      taxId: row.tax_id,
      healthCardUrl: row.health_card_url,
      foodHandlingCardUrl: row.food_handling_card_url,
      criminalRecordUrl: row.criminal_record_url,
      policeRecordUrl: row.police_record_url,
    };

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { currentUserId, ...updateData } = body;
    
    // Build the SET clause dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      name: 'name',
      email: 'email',
      role: 'role',
      department: 'department',
      area: 'area',
      supervisorId: 'supervisor_id',
      avatarUrl: 'avatar_url',
      birthday: 'birthday',
      hireDate: 'hire_date',
      employmentType: 'employment_type',
      contractSigningDate: 'contract_signing_date',
      likes: 'likes',
      dislikes: 'dislikes',
      tShirtSize: 't_shirt_size',
      allergies: 'allergies',
      isActive: 'is_active',
      inactiveDate: 'inactive_date',
      inactiveReason: 'inactive_reason',
      emergencyContactName: 'emergency_contact_name',
      emergencyContactPhone: 'emergency_contact_phone',
      maritalStatus: 'marital_status',
      spouseName: 'spouse_name',
      childrenCount: 'children_count',
      taxId: 'tax_id',
      healthCardUrl: 'health_card_url',
      foodHandlingCardUrl: 'food_handling_card_url',
      criminalRecordUrl: 'criminal_record_url',
      policeRecordUrl: 'police_record_url',
    };

    for (const [key, value] of Object.entries(updateData)) {
      if (fieldMap[key] !== undefined) {
        updates.push(`${fieldMap[key]} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const query = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex} 
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const row = result.rows[0];
    const updatedUser = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      department: row.department,
      area: row.area,
      supervisorId: row.supervisor_id,
      avatarUrl: row.avatar_url,
      birthday: row.birthday.toISOString().split('T')[0],
      hireDate: row.hire_date.toISOString().split('T')[0],
      employmentType: row.employment_type || 'Contract',
      contractSigningDate: row.contract_signing_date ? row.contract_signing_date.toISOString().split('T')[0] : null,
      tShirtSize: row.t_shirt_size,
      allergies: row.allergies || [],
      isActive: row.is_active,
      inactiveDate: row.inactive_date ? row.inactive_date.toISOString().split('T')[0] : null,
      inactiveReason: row.inactive_reason,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      maritalStatus: row.marital_status,
      spouseName: row.spouse_name,
      childrenCount: row.children_count,
      taxId: row.tax_id,
      healthCardUrl: row.health_card_url,
      foodHandlingCardUrl: row.food_handling_card_url,
      criminalRecordUrl: row.criminal_record_url,
      policeRecordUrl: row.police_record_url,
    };

    await logActivity(currentUserId || null, 'UPDATE', 'USER', updatedUser.id, { updatedFields: Object.keys(updateData) });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await logActivity(null, 'DELETE', 'USER', id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
