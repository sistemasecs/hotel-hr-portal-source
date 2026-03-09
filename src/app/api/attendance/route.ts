import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { logActivity } from '@/lib/activityLogger';
import { isWithinRadius } from '@/lib/geoUtils';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        let query = 'SELECT * FROM attendance_logs';
        let values: any[] = [];

        if (userId) {
            query += ' WHERE user_id = $1';
            values.push(userId);
        }

        query += ' ORDER BY timestamp DESC LIMIT 100';

        const result = await pool.query(query, values);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching attendance logs:', error);
        return NextResponse.json({ error: 'Failed to fetch attendance logs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { userId, type, latitude, longitude, shiftId } = await request.json();

        if (!userId || !type || latitude === undefined || longitude === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch Geofence Config
        const configResult = await pool.query(
            "SELECT key, value FROM hotel_config WHERE key IN ('hotel_latitude', 'hotel_longitude', 'hotel_geofence_radius')"
        );

        let hotelLat = 19.432608;
        let hotelLon = -99.133209;
        let radius = 200;

        configResult.rows.forEach(row => {
            if (row.key === 'hotel_latitude') hotelLat = parseFloat(row.value);
            if (row.key === 'hotel_longitude') hotelLon = parseFloat(row.value);
            if (row.key === 'hotel_geofence_radius') radius = parseInt(row.value);
        });

        // 2. Verify Location
        const isVerified = isWithinRadius(latitude, longitude, hotelLat, hotelLon, radius);

        // 3. Log Attendance
        const result = await pool.query(
            `INSERT INTO attendance_logs (user_id, shift_id, type, latitude, longitude, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [userId, shiftId || null, type, latitude, longitude, isVerified]
        );

        const newLog = result.rows[0];

        // 4. Update Shift Status if shiftId provided
        if (shiftId) {
            const shiftStatus = type === 'CLOCK_IN' ? 'Clocked-in' : 'Completed';
            await pool.query(
                'UPDATE shifts SET status = $1 WHERE id = $2',
                [shiftStatus, shiftId]
            );
        }

        await logActivity(userId, 'CREATE', 'ATTENDANCE_LOG', newLog.id, { type, isVerified });

        return NextResponse.json(newLog);
    } catch (error) {
        console.error('Error logging attendance:', error);
        return NextResponse.json({ error: 'Failed to log attendance' }, { status: 500 });
    }
}
