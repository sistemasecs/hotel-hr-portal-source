const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addStaffCustomFields() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS custom_fields_json JSONB DEFAULT '{}'::jsonb;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS staff_custom_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        field_key VARCHAR(100) NOT NULL UNIQUE,
        label VARCHAR(255) NOT NULL,
        field_type VARCHAR(20) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'boolean')),
        required_for_contract BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_staff_custom_fields_active
      ON staff_custom_fields (is_active);
    `);

    await client.query('COMMIT');
    console.log('Migration successful: users.custom_fields_json + staff_custom_fields created.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

addStaffCustomFields();
