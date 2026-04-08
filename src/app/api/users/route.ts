import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activityLogger';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM users');
    // Convert snake_case to camelCase for the frontend
    const users = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      employmentType: row.employment_type || 'Contract',
      contractSigningDate: row.contract_signing_date ? row.contract_signing_date.toISOString().split('T')[0] : null,
      department: row.department,
      area: row.area,
      supervisorId: row.supervisor_id,
      avatarUrl: row.avatar_url,
      birthday: row.birthday.toISOString().split('T')[0],
      hireDate: row.hire_date.toISOString().split('T')[0],
      likes: row.likes || [],
      dislikes: row.dislikes || [],
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
    }));
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role, employmentType, contractSigningDate, department, area, supervisorId, avatarUrl, birthday, hireDate, likes, dislikes, tShirtSize, allergies, isActive, inactiveDate, inactiveReason, currentUserId, emergencyContactName, emergencyContactPhone, maritalStatus, spouseName, childrenCount, taxId, healthCardUrl, foodHandlingCardUrl, criminalRecordUrl, policeRecordUrl } = body;

    // Hash the password before storing
    const salt = await bcrypt.genSalt(10);
    let passwordToHash = password;
    if (!passwordToHash) {
      const currentYear = new Date().getFullYear();
      passwordToHash = `Carmen#${currentYear}`;
    }
    const passwordHash = await bcrypt.hash(passwordToHash, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, employment_type, contract_signing_date, department, area, supervisor_id, avatar_url, birthday, hire_date, likes, dislikes, t_shirt_size, allergies, is_active, inactive_date, inactive_reason, emergency_contact_name, emergency_contact_phone, marital_status, spouse_name, children_count, tax_id, health_card_url, food_handling_card_url, criminal_record_url, police_record_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
       RETURNING *`,
      [name, email, passwordHash, role, employmentType || 'Contract', contractSigningDate || null, department, area || null, supervisorId || null, avatarUrl || null, birthday, hireDate, likes || [], dislikes || [], tShirtSize, allergies || [], isActive !== undefined ? isActive : true, inactiveDate || null, inactiveReason || null, emergencyContactName || null, emergencyContactPhone || null, maritalStatus || null, spouseName || null, childrenCount || 0, taxId || null, healthCardUrl || null, foodHandlingCardUrl || null, criminalRecordUrl || null, policeRecordUrl || null]
    );

    const row = result.rows[0];
    const newUser = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      employmentType: row.employment_type || 'Contract',
      contractSigningDate: row.contract_signing_date ? row.contract_signing_date.toISOString().split('T')[0] : null,
      department: row.department,
      area: row.area,
      supervisorId: row.supervisor_id,
      avatarUrl: row.avatar_url,
      birthday: row.birthday.toISOString().split('T')[0],
      hireDate: row.hire_date.toISOString().split('T')[0],
      likes: row.likes || [],
      dislikes: row.dislikes || [],
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

    // Log activity
    await logActivity(currentUserId || null, 'CREATE', 'USER', newUser.id, { name: newUser.name, email: newUser.email, role: newUser.role });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user. Body:', await request.clone().json());
    console.error('Database Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
