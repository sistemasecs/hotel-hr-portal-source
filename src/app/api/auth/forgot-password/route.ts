import { NextResponse } from 'next/server';
import crypto from 'crypto';
import pool from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/mail';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists
        const userResult = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
        if (userResult.rowCount === 0) {
            // Don't reveal whether user exists for security reasons
            return NextResponse.json({ success: true, message: 'If an account exists, a reset link was sent.' });
        }

        const userId = userResult.rows[0].id;

        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Upsert into reset tokens (clearing old tokens for this user)
        await pool.query('DELETE FROM password_reset_tokens WHERE user_id = $1::uuid', [userId]);
        await pool.query(
            'INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
            [token, userId, expiresAt.toISOString()]
        );

        // Build the reset link URL based on the request origin
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://personal.elcarmenhotel.com';
        const resetLink = `${origin}/reset-password?token=${token}`;

        try {
            await sendPasswordResetEmail(email, resetLink);
        } catch (mailError) {
            console.error('Failed to send reset email via SMTP. Check credentials in .env.local.', mailError);

            // If we are locally testing without SMTP credentials, just print it:
            if (!process.env.SMTP_PASS) {
                console.log(`\n\n[DEV MODE] Password Reset Link for ${email}: \n${resetLink}\n\n`);
            } else {
                return NextResponse.json({ error: 'Failed to send email. Please contact support.' }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true, message: 'Password reset link sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
