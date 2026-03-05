import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query("SELECT key, value FROM hotel_config WHERE key IN ('hotel_logo', 'event_types')");

        const config: Record<string, any> = {
            hotelLogo: null,
            eventTypes: null
        };

        result.rows.forEach(row => {
            if (row.key === 'hotel_logo') config.hotelLogo = row.value;
            if (row.key === 'event_types') {
                try {
                    config.eventTypes = JSON.parse(row.value);
                } catch (e) {
                    config.eventTypes = row.value;
                }
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error('Error fetching hotel config:', error);
        return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { hotelLogo, eventTypes } = body;

        if (hotelLogo !== undefined) {
            if (hotelLogo === null) {
                await pool.query("DELETE FROM hotel_config WHERE key = 'hotel_logo'");
            } else {
                await pool.query(
                    "INSERT INTO hotel_config (key, value) VALUES ('hotel_logo', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                    [hotelLogo]
                );
            }
        }

        if (eventTypes !== undefined) {
            if (eventTypes === null) {
                await pool.query("DELETE FROM hotel_config WHERE key = 'event_types'");
            } else {
                const eventTypesStr = typeof eventTypes === 'string' ? eventTypes : JSON.stringify(eventTypes);
                await pool.query(
                    "INSERT INTO hotel_config (key, value) VALUES ('event_types', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                    [eventTypesStr]
                );
            }
        }

        return NextResponse.json({ success: true, hotelLogo, eventTypes });
    } catch (error) {
        console.error('Error updating hotel config:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
