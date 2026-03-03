const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdmin() {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);

    const query = `
      INSERT INTO users (name, email, password_hash, role, department, birthday, hire_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $3, role = $4
      RETURNING id, name, email, role;
    `;
    
    const values = [
      'Sistemas Admin',
      'sistemas@elcarmenhotel.com',
      passwordHash,
      'HR Admin',
      'IT',
      '1985-03-15',
      '2015-01-01'
    ];

    const res = await pool.query(query, values);
    console.log('Admin user created/updated successfully!');
    console.log('Email:', res.rows[0].email);
    console.log('Role:', res.rows[0].role);
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    await pool.end();
  }
}

createAdmin();
