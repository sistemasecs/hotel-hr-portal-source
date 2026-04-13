const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addStaffFieldGroupConfig() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE staff_custom_fields
      ADD COLUMN IF NOT EXISTS group_key VARCHAR(100) NOT NULL DEFAULT 'custom',
      ADD COLUMN IF NOT EXISTS show_in_profile BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS employee_editable BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_staff_custom_fields_group_sort
      ON staff_custom_fields (group_key, sort_order);
    `);

    await client.query('COMMIT');
    console.log('Migration successful: staff_custom_fields group/profile config columns added.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

addStaffFieldGroupConfig();
