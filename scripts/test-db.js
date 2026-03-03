const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    const res = await pool.query('SELECT id FROM users LIMIT 1');
    console.log('User ID:', res.rows[0]?.id);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
test();
