const { Pool } = require('pg');
require('dotenv').config({ path: '/Users/carloslara/hotel-hr-portal/.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Adding new profile fields to users table...');
    
    // Add columns one by one in a transaction
    await client.query('BEGIN');
    
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(255),
      ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS children_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
      ADD COLUMN IF NOT EXISTS health_card_url TEXT,
      ADD COLUMN IF NOT EXISTS food_handling_card_url TEXT,
      ADD COLUMN IF NOT EXISTS criminal_record_url TEXT,
      ADD COLUMN IF NOT EXISTS police_record_url TEXT;
    `);

    await client.query('COMMIT');
    console.log('Successfully added new fields!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding fields:', error);
  } finally {
    client.release();
    pool.end();
  }
}

main();
