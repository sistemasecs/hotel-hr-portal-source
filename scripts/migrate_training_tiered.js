const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Starting migration for tiered training system...');
    
    // Add category to training_modules
    await pool.query(`
      ALTER TABLE training_modules 
      ADD COLUMN IF NOT EXISTS category VARCHAR(255);
    `);
    console.log('Added category to training_modules');

    // Add ask_me_about and badges to users
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS ask_me_about TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';
    `);
    console.log('Added ask_me_about and badges to users');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

migrate();
