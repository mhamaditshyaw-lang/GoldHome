#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load .env if present
const dotenvPath = path.join(process.cwd(), '.env');
if (fs.existsSync(dotenvPath)) require('dotenv').config({ path: dotenvPath });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, username, name, role, is_active, created_at, password FROM users WHERE username=$1 LIMIT 1', ['admin']);
    if (res.rowCount === 0) {
      console.log('No admin user found');
    } else {
      const r = res.rows[0];
      const pw = typeof r.password === 'string' ? (r.password.startsWith('$2') ? '<bcrypt-hash>' : '<plain-text>') : '<unknown>';
      console.log('Admin user:');
      console.log(` id: ${r.id}`);
      console.log(` username: ${r.username}`);
      console.log(` name: ${r.name}`);
      console.log(` role: ${r.role}`);
      console.log(` is_active: ${r.is_active}`);
      console.log(` created_at: ${r.created_at}`);
      console.log(` password: ${pw}`);
    }
  } catch (err) {
    console.error('Error querying users:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
