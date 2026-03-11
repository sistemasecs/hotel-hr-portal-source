const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addOnboardingRequirementColumn() {
  try {
    console.log('Connecting to database...');
    const result = await pool.query(`
      ALTER TABLE training_modules 
      ADD COLUMN IF NOT EXISTS is_onboarding_requirement BOOLEAN DEFAULT false;
    `);
    console.log('Successfully added is_onboarding_requirement column to training_modules table.');
  } catch (error) {
    console.error('Error adding column:', error);
  } finally {
    await pool.end();
  }
}

addOnboardingRequirementColumn();
