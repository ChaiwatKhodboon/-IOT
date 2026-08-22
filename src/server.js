const app = require('./app');
const pool = require('./db');
const { port } = require('./config');
async function start() {
  await pool.query('SELECT 1');
  app.listen(port, () => console.log(`IoT Equipment Loan System: http://localhost:${port}`));
}
start().catch((error) => { console.error('Cannot start server:', error.message); process.exit(1); });
