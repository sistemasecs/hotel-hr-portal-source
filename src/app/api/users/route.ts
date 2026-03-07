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
    const { name, email, password, role, department, area, supervisorId, avatarUrl, birthday, hireDate, likes, dislikes, tShirtSize, allergies, currentUserId } = body;

    // Hash the password before storing
    const salt = await bcrypt.genSalt(10);
    let passwordToHash = password;
    if (!passwordToHash) {
      const currentYear = new Date().getFullYear();
      passwordToHash = `Carmen#${currentYear}`;
    }
    const passwordHash = await bcrypt.hash(passwordToHash, salt);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, department, area, supervisor_id, avatar_url, birthday, hire_date, likes, dislikes, t_shirt_size, allergies)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, email, passwordHash, role, department, area || null, supervisorId || null, avatarUrl || null, birthday, hireDate, likes || [], dislikes || [], tShirtSize, allergies || []]
    );

    const row = result.rows[0];
    const newUser = {
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
      likes: row.likes || [],
      dislikes: row.dislikes || [],
      tShirtSize: row.t_shirt_size,
      allergies: row.allergies || [],
    };

    // Log activity
    await logActivity(currentUserId || null, 'CREATE', 'USER', newUser.id, { name: newUser.name, email: newUser.email, role: newUser.role });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
