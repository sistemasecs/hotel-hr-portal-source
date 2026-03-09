const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.join(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const pool = new Pool({
    connectionString: envConfig.DATABASE_URL + "?sslmode=require",
});

async function check() {
    try {
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log("Tables:", tables.rows.map(r => r.table_name));

        const eventTypesTable = tables.rows.find(r => r.table_name === 'event_types');
        if (eventTypesTable) {
            const eventTypesCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'event_types'");
            console.log("event_types columns:", eventTypesCols.rows);
        } else {
            console.log("event_types table DOES NOT exist.");
        }

        const eventCols = await pool.query("SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'id'");
        console.log("events.id info:", eventCols.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
