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
            query += ' WHERE user_id = $1::uuid';
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
        const { userId, type, latitude, longitude, shiftId, clockInReason } = await request.json();

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
            `INSERT INTO attendance_logs (user_id, shift_id, type, latitude, longitude, is_verified, clock_in_reason)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [userId, shiftId || null, type, latitude, longitude, isVerified, clockInReason || null]
        );

        const newLog = result.rows[0];

        // 4. Update Shift Status or Create Floating Shift
        if (type === 'CLOCK_IN') {
            if (shiftId) {
                await pool.query(
                    'UPDATE shifts SET status = $1, actual_start_time = NOW() WHERE id = $2',
                    ['Clocked-in', shiftId]
                );
            } else {
                // Create a floating shift for unscheduled clock-ins, store the reason
                await pool.query(
                    `INSERT INTO shifts (user_id, start_time, end_time, type, status, actual_start_time, clock_in_reason)
                     VALUES ($1, NOW(), NOW() + interval '8 hours', $2, $3, NOW(), $4)`,
                    [userId, 'Floating', 'Clocked-in', clockInReason || null]
                );
            }
        } else if (type === 'CLOCK_OUT') {
            if (shiftId) {
                await pool.query(
                    'UPDATE shifts SET status = $1, actual_end_time = NOW() WHERE id = $2',
                    ['Pending Approval', shiftId]
                );
            } else {
                // Try to find the most recent active shift if shiftId was missing
                await pool.query(
                    `UPDATE shifts SET status = $1, actual_end_time = NOW() 
                     WHERE user_id = $2::uuid AND status = 'Clocked-in' 
                     AND actual_end_time IS NULL`,
                    ['Pending Approval', userId]
                );
            }
        }

        await logActivity(userId, 'CREATE', 'ATTENDANCE_LOG', newLog.id, { type, isVerified });

        return NextResponse.json(newLog);
    } catch (error) {
        console.error('Error logging attendance:', error);
        return NextResponse.json({ error: 'Failed to log attendance' }, { status: 500 });
    }
}
