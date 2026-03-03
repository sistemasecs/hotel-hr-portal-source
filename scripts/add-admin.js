const { db } = require('./src/lib/db.ts');
const bcrypt = require('bcryptjs');

async function addAdminUser() {
  const email = 'sistemas@elcarmenhotel.com';
  const password = 'admin123';
  const name = 'Sistemas Admin';
  
  try {
    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (existingUser) {
      console.log('User already exists, updating password...');
      const hashedPassword = await bcrypt.hash(password, 10);
      db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashedPassword, email);
      console.log('Password updated successfully!');
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = db.prepare(`
        INSERT INTO users (id, name, email, password, role, department, birthday, hireDate, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(
        'u' + Date.now(),
        name,
        email,
        hashedPassword,
        'HR Admin',
        'IT',
        '1985-03-15',
        '2015-01-01'
      );
      
      console.log('Admin user created successfully!');
      console.log('Email: sistemas@elcarmenhotel.com');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addAdminUser();
