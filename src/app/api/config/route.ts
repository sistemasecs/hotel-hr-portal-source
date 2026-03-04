import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query("SELECT value FROM hotel_config WHERE key = 'hotel_logo'");

        return NextResponse.json({
            hotelLogo: result.rows.length > 0 ? result.rows[0].value : null
        });
    } catch (error) {
        console.error('Error fetching hotel config:', error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { hotelLogo } = await request.json();

        if (hotelLogo === null) {
            await pool.query("DELETE FROM hotel_config WHERE key = 'hotel_logo'");
        } else {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('hotel_logo', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [hotelLogo]
            );
        }

        return NextResponse.json({ success: true, hotelLogo });
    } catch (error) {
        console.error('Error updating hotel config:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
