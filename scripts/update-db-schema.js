const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateDb() {
  try {
    await pool.query(`
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id) ON DELETE SET NULL;
      ALTER TABLE departments ADD COLUMN IF NOT EXISTS areas TEXT[] DEFAULT '{}';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS area VARCHAR(100);
    `);
    console.log('Database schema updated successfully');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    await pool.end();
  }
}

updateDb();
