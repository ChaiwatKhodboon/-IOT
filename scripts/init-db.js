const fs = require('node:fs/promises');
const path = require('node:path');
const pool = require('../src/db');
(async () => {
  try {
    await pool.query(await fs.readFile(path.join(__dirname,'..','database','schema.sql'),'utf8'));
    await pool.query(await fs.readFile(path.join(__dirname,'..','database','seed.sql'),'utf8'));
    console.log('สร้างฐานข้อมูลและข้อมูลตัวอย่างเรียบร้อยแล้ว');
  } finally { await pool.end(); }
})().catch((error) => { console.error(error); process.exit(1); });
