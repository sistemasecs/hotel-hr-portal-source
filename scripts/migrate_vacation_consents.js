const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/carloslara/hotel-hr-portal/.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting vacation consents migration...');

    await client.query('BEGIN');

    // Create vacation_consents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vacation_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        year_number INTEGER NOT NULL,
        signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        signed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        UNIQUE(user_id, year_number)
      );
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
