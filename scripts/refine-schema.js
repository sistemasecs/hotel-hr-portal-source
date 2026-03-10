const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Starting schema refinement...');

        // 1. Create shift_types table
        await client.query(`
      CREATE TABLE IF NOT EXISTS shift_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
        start_time_default TIME,
        end_time_default TIME,
        color TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ Table shift_types ensured.');

        // 2. Add actual_start_time to shifts
        await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifts' AND column_name='actual_start_time') THEN
              ALTER TABLE shifts ADD COLUMN actual_start_time TIMESTAMP WITH TIME ZONE;
          END IF;
      END
      $$;
    `);
        console.log('✓ Column actual_start_time ensured in shifts.');

        console.log('Schema refinement completed successfully.');
    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
