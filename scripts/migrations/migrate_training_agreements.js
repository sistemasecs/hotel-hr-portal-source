const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creating tier_completions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tier_completions (
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        tier_id INTEGER NOT NULL CHECK (tier_id IN (1, 2, 3)),
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        signature_data TEXT NOT NULL,
        PRIMARY KEY (user_id, tier_id)
      );
    `);

    console.log('Seeding default agreement texts in hotel_config...');
    const defaultAgreements = [
      {
        key: 'tier_agreement_1',
        value: 'I, the undersigned, hereby acknowledge that I have completed the Module I: Corporate Induction. I understand and agree to comply with the organizational culture, internal policies, administrative processes, and general regulations mentioned in this training.'
      },
      {
        key: 'tier_agreement_2',
        value: 'I hereby certify that I have successfully completed the Module II: Technical Induction. I fully understand the functions of my position, the operating procedures of my area, and the safety protocols required to perform my duties safely and effectively.'
      },
      {
        key: 'tier_agreement_3',
        value: 'I acknowledge that I have completed the Module III: Competency Evaluation. I confirm that I have been evaluated on the knowledge and skills required for my role and that I am ready to begin my formal labor activities.'
      }
    ];

    for (const agreement of defaultAgreements) {
      await client.query(
        "INSERT INTO hotel_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING",
        [agreement.key, agreement.value]
      );
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during migration:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
