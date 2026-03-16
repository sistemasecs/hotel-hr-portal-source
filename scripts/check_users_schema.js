const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = '/Users/carloslara/hotel-hr-portal/.env.local';
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const pool = new Pool({
    connectionString: envConfig.DATABASE_URL + (envConfig.DATABASE_URL.includes('?') ? '&' : '?') + "sslmode=require",
});

async function check() {
    try {
        const res = await pool.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'users'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
