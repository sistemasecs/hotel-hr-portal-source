const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Starting migration: adding has_seen_tour column to users...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN DEFAULT FALSE;
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
