const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Adding missing employee fields to users table...');
    
    await client.query('BEGIN');
    
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone VARCHAR(255),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS nationality VARCHAR(255),
      ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(255),
      ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS dpi VARCHAR(100),
      ADD COLUMN IF NOT EXISTS social_security_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS social_security_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS spouse_dpi VARCHAR(100),
      ADD COLUMN IF NOT EXISTS card_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
      ADD COLUMN IF NOT EXISTS criminal_record INTEGER,
      ADD COLUMN IF NOT EXISTS police_record INTEGER,
      ADD COLUMN IF NOT EXISTS hotel_contract VARCHAR(255),
      ADD COLUMN IF NOT EXISTS base_salary NUMERIC(15, 2),
      ADD COLUMN IF NOT EXISTS incentive_bonus NUMERIC(15, 2),
      ADD COLUMN IF NOT EXISTS renewal_date DATE,
      ADD COLUMN IF NOT EXISTS account_type VARCHAR(255),
      ADD COLUMN IF NOT EXISTS education_level VARCHAR(255),
      ADD COLUMN IF NOT EXISTS profession VARCHAR(255),
      ADD COLUMN IF NOT EXISTS children_names TEXT,
      ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100);
    `);

    await client.query('COMMIT');
    console.log('Successfully added missing fields!');
  } catch (error) {
    if (client) await client.query('ROLLBACK');
    console.error('Error adding fields:', error);
  } finally {
    if (client) client.release();
    pool.end();
  }
}

main();
