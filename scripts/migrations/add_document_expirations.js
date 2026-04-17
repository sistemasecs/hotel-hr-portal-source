const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Starting migration: adding document expiration date fields to users...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS health_card_exp DATE,
      ADD COLUMN IF NOT EXISTS food_handling_card_exp DATE,
      ADD COLUMN IF NOT EXISTS criminal_record_exp DATE,
      ADD COLUMN IF NOT EXISTS police_record_exp DATE,
      ADD COLUMN IF NOT EXISTS dpi_exp DATE,
      ADD COLUMN IF NOT EXISTS dpi_url TEXT;
    `);
    
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
