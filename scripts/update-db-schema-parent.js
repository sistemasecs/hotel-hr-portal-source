const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateDb() {
  try {
    await pool.query(`
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES departments(id) ON DELETE SET NULL;
    `);
    console.log('Database schema updated successfully with parent_id');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

updateDb();
