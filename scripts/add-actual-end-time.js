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
        console.log('Adding actual_end_time to shifts...');

        await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifts' AND column_name='actual_end_time') THEN
              ALTER TABLE shifts ADD COLUMN actual_end_time TIMESTAMP WITH TIME ZONE;
          END IF;
      END
      $$;
    `);
        console.log('✓ Column actual_end_time ensured in shifts.');

    } catch (err) {
        console.error('Error running migration:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
