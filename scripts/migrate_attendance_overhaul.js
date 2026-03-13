const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add approval_status to shifts
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifts' AND column_name='approval_status') THEN
          ALTER TABLE shifts ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending';
        END IF;
      END$$;
    `);

    // 2. Add approved_by to shifts
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifts' AND column_name='approved_by') THEN
          ALTER TABLE shifts ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END$$;
    `);

    // 3. Add approval_notes to shifts
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifts' AND column_name='approval_notes') THEN
          ALTER TABLE shifts ADD COLUMN approval_notes TEXT;
        END IF;
      END$$;
    `);

    // 4. Add clock_in_reason to shifts (for floating shifts)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shifts' AND column_name='clock_in_reason') THEN
          ALTER TABLE shifts ADD COLUMN clock_in_reason TEXT;
        END IF;
      END$$;
    `);

    // 5. Add clock_in_reason to attendance_logs
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='attendance_logs' AND column_name='clock_in_reason') THEN
          ALTER TABLE attendance_logs ADD COLUMN clock_in_reason TEXT;
        END IF;
      END$$;
    `);

    await client.query('COMMIT');
    console.log('✅ Migration successful: attendance overhaul columns added.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
