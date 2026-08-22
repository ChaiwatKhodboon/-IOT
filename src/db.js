const { Pool } = require('pg');
const { databaseUrl, isProduction } = require('./config');

const pool = new Pool({ connectionString: databaseUrl, ssl: isProduction && !databaseUrl.includes('@db:') ? { rejectUnauthorized: false } : false });
pool.on('error', (error) => console.error('Unexpected PostgreSQL error', error));
module.exports = pool;
