const { Pool } = require('pg');
const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL + (process.env.DATABASE_URL.includes('?') ? '&' : '?') + "sslmode=require",
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration...');

        // 1. Create shifts table
        await client.query(`
      CREATE TABLE IF NOT EXISTS shifts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        status VARCHAR(50) DEFAULT 'Scheduled',
        type VARCHAR(50) DEFAULT 'Custom',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Table "shifts" created or already exists.');

        // 2. Create attendance_logs table
        await client.query(`
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL, -- 'CLOCK_IN', 'CLOCK_OUT'
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('Table "attendance_logs" created or already exists.');

        // 3. Initialize default geofence config if not exists
        const configKeys = [
            ['hotel_latitude', '19.432608'], // Default CDMX coord as placeholder
            ['hotel_longitude', '-99.133209'],
            ['hotel_geofence_radius', '200'] // 200 meters
        ];

        for (const [key, value] of configKeys) {
            await client.query(`
        INSERT INTO hotel_config (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO NOTHING
      `, [key, value]);
        }
        console.log('Default geofence configuration initialized.');

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
