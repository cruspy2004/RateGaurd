const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DB_URL || 'postgres://rg:rg@localhost:5432/rategaurd'
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

async function query(text, params) {
    return pool.query(text, params);
}

module.exports = { query, pool };
