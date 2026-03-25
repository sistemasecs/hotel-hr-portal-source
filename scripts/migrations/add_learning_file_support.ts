import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: [path.join(process.cwd(), '.env.local'), path.join(process.cwd(), '.env')] });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration for learning modules...');
    
    // Add columns to training_modules
    await client.query(`
      ALTER TABLE training_modules
      ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'Url',
      ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS file_size INT,
      ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
    `);
    
    console.log('Successfully added file support columns to training_modules table.');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
