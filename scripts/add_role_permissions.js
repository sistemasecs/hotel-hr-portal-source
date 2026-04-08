const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// All feature keys we track
const FEATURES = [
  'nav_dashboard',
  'nav_culture',
  'nav_learning',
  'nav_schedules',
  'nav_requests',
  'nav_broadcasts',
  'nav_celebrations',
  'admin_panel',
  'admin_directory',
  'admin_hierarchy',
  'admin_training',
  'admin_departments',
  'admin_events',
  'admin_recognition',
  'admin_attendance',
  'admin_vacations',
  'admin_holidays',
  'admin_activity',
  'admin_documents',
  'admin_settings',
  'admin_roles',
];

// Default permissions: role -> Set of allowed features
const DEFAULTS = {
  'HR Admin': FEATURES, // Full access
  'Manager': [
    'nav_dashboard','nav_culture','nav_learning','nav_schedules',
    'nav_requests','nav_broadcasts','nav_celebrations',
    'admin_panel','admin_directory','admin_hierarchy','admin_attendance',
    'admin_vacations','admin_events','admin_recognition',
  ],
  'Supervisor': [
    'nav_dashboard','nav_culture','nav_learning','nav_schedules',
    'nav_requests','nav_broadcasts','nav_celebrations',
  ],
  'Staff': [
    'nav_dashboard','nav_culture','nav_learning','nav_schedules',
    'nav_requests','nav_broadcasts','nav_celebrations',
  ],
  'Weekly Staff': [
    'nav_dashboard','nav_learning',
  ],
};

const ALL_ROLES = ['HR Admin', 'Manager', 'Supervisor', 'Staff', 'Weekly Staff'];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting role_permissions migration...');
    await client.query('BEGIN');

    // Create the table
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        feature_key VARCHAR(100) NOT NULL,
        is_allowed BOOLEAN DEFAULT FALSE,
        UNIQUE(role, feature_key)
      );
    `);

    // Seed defaults
    for (const role of ALL_ROLES) {
      const allowed = new Set(DEFAULTS[role] || []);
      for (const feature of FEATURES) {
        await client.query(
          `INSERT INTO role_permissions (role, feature_key, is_allowed)
           VALUES ($1, $2, $3)
           ON CONFLICT (role, feature_key) DO NOTHING`,
          [role, feature, allowed.has(feature)]
        );
      }
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
