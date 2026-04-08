const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add employment_type and contract_signing_date...');
    await client.query('BEGIN');

    // Add new columns to the users table
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'Contract',
      ADD COLUMN IF NOT EXISTS contract_signing_date DATE;
    `);

    // Ensure backwards compatibility by explicitly setting the default for existing records
    await client.query(`
      UPDATE users 
      SET employment_type = 'Contract' 
      WHERE employment_type IS NULL;
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
