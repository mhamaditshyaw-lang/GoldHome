#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dotenvPath = path.join(process.cwd(), '.env');
if (fs.existsSync(dotenvPath)) require('dotenv').config({ path: dotenvPath });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

(async ()=>{
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT password FROM users WHERE username=$1 LIMIT 1', ['admin']);
    if (res.rowCount === 0) return console.log('No admin user');
    console.log('Admin password value:');
    console.log(res.rows[0].password);
  } catch (e) {
    console.error(e.message || e);
  } finally {
    client.release();
    await pool.end();
  }
})()
