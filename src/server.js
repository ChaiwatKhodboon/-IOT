const app = require('./app');
const pool = require('./db');
const { port } = require('./config');
const fs = require('node:fs/promises');
const path = require('node:path');
async function start() {
  await pool.query('SELECT 1');
  const migrationsDir = path.join(__dirname,'..','database','migrations');
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  const files = (await fs.readdir(migrationsDir)).filter(name=>name.endsWith('.sql')).sort();
  for (const name of files) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE name=$1',[name]);
    if (applied.rowCount) continue;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(await fs.readFile(path.join(migrationsDir,name),'utf8'));
      await client.query('INSERT INTO schema_migrations(name) VALUES($1)',[name]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
  app.listen(port, () => console.log(`IoT Equipment Loan System: http://localhost:${port}`));
}
start().catch((error) => { console.error('Cannot start server:', error.message); process.exit(1); });
