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
      phone: row.phone,
      address: row.address,
      nationality: row.nationality,
      placeOfBirth: row.place_of_birth,
      motherName: row.mother_name,
      fatherName: row.father_name,
      dpi: row.dpi,
      socialSecurityNumber: row.social_security_number,
      socialSecurityCode: row.social_security_code,
      spouseDpi: row.spouse_dpi,
      cardNumber: row.card_number,
      occupation: row.occupation,
      criminalRecord: row.criminal_record,
      policeRecord: row.police_record,
      hotelContract: row.hotel_contract,
      baseSalary: row.base_salary ? parseFloat(row.base_salary) : null,
      incentiveBonus: row.incentive_bonus ? parseFloat(row.incentive_bonus) : null,
      renewalDate: row.renewal_date ? row.renewal_date.toISOString().split('T')[0] : null,
      accountType: row.account_type,
      educationLevel: row.education_level,
      profession: row.profession,
      childrenNames: row.children_names,
      emergencyContactRelationship: row.emergency_contact_relationship,
      customFields: row.custom_fields_json || {},
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
    const { name, email, password, role, employmentType, contractSigningDate, department, area, supervisorId, avatarUrl, birthday, hireDate, likes, dislikes, tShirtSize, allergies, isActive, inactiveDate, inactiveReason, currentUserId, emergencyContactName, emergencyContactPhone, maritalStatus, spouseName, childrenCount, taxId, healthCardUrl, foodHandlingCardUrl, criminalRecordUrl, policeRecordUrl, phone, address, nationality, placeOfBirth, motherName, fatherName, dpi, socialSecurityNumber, socialSecurityCode, spouseDpi, cardNumber, occupation, criminalRecord, policeRecord, hotelContract, baseSalary, incentiveBonus, renewalDate, accountType, educationLevel, profession, childrenNames, emergencyContactRelationship, customFields } = body;

    // Hash the password before storing
    const salt = await bcrypt.genSalt(10);
    let passwordToHash = password;
    if (!passwordToHash) {
      const currentYear = new Date().getFullYear();
      passwordToHash = `Carmen#${currentYear}`;
    }
    const passwordHash = await bcrypt.hash(passwordToHash, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, employment_type, contract_signing_date, department, area, supervisor_id, avatar_url, birthday, hire_date, likes, dislikes, t_shirt_size, allergies, is_active, inactive_date, inactive_reason, emergency_contact_name, emergency_contact_phone, marital_status, spouse_name, children_count, tax_id, health_card_url, food_handling_card_url, criminal_record_url, police_record_url, phone, address, nationality, place_of_birth, mother_name, father_name, dpi, social_security_number, social_security_code, spouse_dpi, card_number, occupation, criminal_record, police_record, hotel_contract, base_salary, incentive_bonus, renewal_date, account_type, education_level, profession, children_names, emergency_contact_relationship, custom_fields_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53)
       RETURNING *`,
      [name, email, passwordHash, role, employmentType || 'Contract', contractSigningDate || null, department, area || null, supervisorId || null, avatarUrl || null, birthday, hireDate, likes || [], dislikes || [], tShirtSize, allergies || [], isActive !== undefined ? isActive : true, inactiveDate || null, inactiveReason || null, emergencyContactName || null, emergencyContactPhone || null, maritalStatus || null, spouseName || null, childrenCount || 0, taxId || null, healthCardUrl || null, foodHandlingCardUrl || null, criminalRecordUrl || null, policeRecordUrl || null, phone || null, address || null, nationality || null, placeOfBirth || null, motherName || null, fatherName || null, dpi || null, socialSecurityNumber || null, socialSecurityCode || null, spouseDpi || null, cardNumber || null, occupation || null, criminalRecord || null, policeRecord || null, hotelContract || null, baseSalary || null, incentiveBonus || null, renewalDate || null, accountType || null, educationLevel || null, profession || null, childrenNames || null, emergencyContactRelationship || null, customFields || {}]
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
      phone: row.phone,
      address: row.address,
      nationality: row.nationality,
      placeOfBirth: row.place_of_birth,
      motherName: row.mother_name,
      fatherName: row.father_name,
      dpi: row.dpi,
      socialSecurityNumber: row.social_security_number,
      socialSecurityCode: row.social_security_code,
      spouseDpi: row.spouse_dpi,
      cardNumber: row.card_number,
      occupation: row.occupation,
      criminalRecord: row.criminal_record,
      policeRecord: row.police_record,
      hotelContract: row.hotel_contract,
      baseSalary: row.base_salary ? parseFloat(row.base_salary) : null,
      incentiveBonus: row.incentive_bonus ? parseFloat(row.incentive_bonus) : null,
      renewalDate: row.renewal_date ? row.renewal_date.toISOString().split('T')[0] : null,
      accountType: row.account_type,
      educationLevel: row.education_level,
      profession: row.profession,
      childrenNames: row.children_names,
      emergencyContactRelationship: row.emergency_contact_relationship,
      customFields: row.custom_fields_json || {},
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
