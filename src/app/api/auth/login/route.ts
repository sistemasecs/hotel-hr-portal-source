import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = result.rows[0];

    // If password_hash is null (e.g., for users created before this feature), 
    // we might want to handle it differently, but for now we'll just reject
    if (!user.password_hash) {
      return NextResponse.json({ error: 'Account not fully set up. Please contact admin.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.is_active === false) {
      return NextResponse.json({ error: 'Account is inactive. Please contact HR.' }, { status: 403 });
    }

    // Don't send the password hash back to the client
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatarUrl: user.avatar_url,
      birthday: user.birthday.toISOString().split('T')[0],
      hireDate: user.hire_date.toISOString().split('T')[0],
      likes: user.likes || [],
      dislikes: user.dislikes || [],
      tShirtSize: user.t_shirt_size,
      allergies: user.allergies || [],
    };

    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
