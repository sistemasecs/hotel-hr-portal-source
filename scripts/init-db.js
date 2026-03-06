const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

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
        allergies TEXT[],
        supervisor_id UUID REFERENCES users(id) ON DELETE SET NULL
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

      ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_fit VARCHAR(20) DEFAULT 'cover';

      CREATE TABLE IF NOT EXISTS celebration_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        caption TEXT,
        image_url TEXT NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_date DATE NOT NULL,
        uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        event_id UUID REFERENCES events(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS peer_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
        nominee_id UUID REFERENCES users(id) ON DELETE CASCADE,
        month VARCHAR(7) NOT NULL,
        reason TEXT,
        UNIQUE(voter_id, month)
      );

      CREATE TABLE IF NOT EXISTS supervisor_scores (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        month VARCHAR(7) NOT NULL,
        notes TEXT,
        UNIQUE(employee_id, month)
      );

      CREATE TABLE IF NOT EXISTS employee_of_the_month (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        month VARCHAR(7) NOT NULL,
        awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(month)
      );

      CREATE TABLE IF NOT EXISTS hotel_config (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        token VARCHAR(255) PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id VARCHAR(255),
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
