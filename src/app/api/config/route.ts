import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const result = await pool.query("SELECT key, value FROM hotel_config WHERE key IN ('hotel_logo', 'event_types', 'hotel_latitude', 'hotel_longitude', 'hotel_geofence_radius', 'clock_in_window_minutes', 'working_days')");

        const config: Record<string, any> = {
            hotelLogo: null,
            eventTypes: null,
            hotelLatitude: null,
            hotelLongitude: null,
            hotelGeofenceRadius: null,
            clockInWindowMinutes: null,
            workingDays: [1, 2, 3, 4, 5] // Default Mon-Fri
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
            if (row.key === 'hotel_latitude') config.hotelLatitude = parseFloat(row.value);
            if (row.key === 'hotel_longitude') config.hotelLongitude = parseFloat(row.value);
            if (row.key === 'hotel_geofence_radius') config.hotelGeofenceRadius = parseInt(row.value);
            if (row.key === 'clock_in_window_minutes') config.clockInWindowMinutes = parseInt(row.value);
            if (row.key === 'working_days') {
                try {
                    config.workingDays = JSON.parse(row.value);
                } catch (e) {
                    config.workingDays = [1, 2, 3, 4, 5];
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
        const { hotelLogo, eventTypes, hotelLatitude, hotelLongitude, hotelGeofenceRadius, clockInWindowMinutes, workingDays } = body;

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

        if (hotelLatitude !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('hotel_latitude', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [hotelLatitude.toString()]
            );
        }

        if (hotelLongitude !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('hotel_longitude', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [hotelLongitude.toString()]
            );
        }

        if (hotelGeofenceRadius !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('hotel_geofence_radius', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [hotelGeofenceRadius.toString()]
            );
        }

        if (clockInWindowMinutes !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('clock_in_window_minutes', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [clockInWindowMinutes.toString()]
            );
        }
        if (workingDays !== undefined) {
            await pool.query(
                "INSERT INTO hotel_config (key, value) VALUES ('working_days', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
                [JSON.stringify(workingDays)]
            );
        }
        
        return NextResponse.json({ success: true, hotelLogo, eventTypes, hotelLatitude, hotelLongitude, hotelGeofenceRadius, clockInWindowMinutes, workingDays });
    } catch (error) {
        console.error('Error updating hotel config:', error);
        return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }
}
