const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        department VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        birthday DATE NOT NULL,
        hire_date DATE NOT NULL,
        likes TEXT[],
        dislikes TEXT[],
        t_shirt_size VARCHAR(10),
        allergies TEXT[]
      );

      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        time TIME,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        location VARCHAR(255)
      );

      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS training_modules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        duration VARCHAR(50) NOT NULL,
        target_departments TEXT[] NOT NULL,
        required BOOLEAN NOT NULL DEFAULT false,
        content_url TEXT,
        passing_score INTEGER
      );

      CREATE TABLE IF NOT EXISTS quiz_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS user_trainings (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL,
        completion_date DATE,
        PRIMARY KEY (user_id, module_id)
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initDb();
