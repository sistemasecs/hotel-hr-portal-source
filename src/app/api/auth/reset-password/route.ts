import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
        }

        // Validate password strength? (min 8 chars)
        if (password.length < 6) {
            return NextResponse.json({ error: 'Password too short' }, { status: 400 });
        }

        // 1. Verify token exists and is not expired
        const tokenResult = await pool.query(
            `SELECT user_id, expires_at 
       FROM password_reset_tokens 
       WHERE token = $1`,
            [token]
        );

        if (tokenResult.rowCount === 0) {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
        }

        const resetRecord = tokenResult.rows[0];
        const now = new Date();

        if (new Date(resetRecord.expires_at) < now) {
            // Token expired, delete it and reject
            await pool.query('DELETE FROM password_reset_tokens WHERE token = $1', [token]);
            return NextResponse.json({ error: 'Token has expired. Please request a new one.' }, { status: 400 });
        }

        const userId = resetRecord.user_id;

        // 2. Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Update the user record
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, userId]
        );

        // 4. Delete the token (single use only)
        await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

        return NextResponse.json({ success: true, message: 'Password has been updated successfully.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
