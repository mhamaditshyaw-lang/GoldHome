import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';
import { existsSync } from 'fs';

if (existsSync('.env') && process.env.NODE_ENV !== 'production') {
  console.log('Loading environment variables from .env file...');
  dotenv.config();
}

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
  console.error('\n❌ DATABASE_URL is not properly configured');
  console.error('\n📋 To fix this issue:');
  console.error('1. Open the Tools panel in Replit (left sidebar)');
  console.error('2. Click "Database"');
  console.error('3. You should see your PostgreSQL database connection details');
  console.error('4. Copy the DATABASE_URL value shown there');
  console.error('5. Go to Tools → Secrets');
  console.error('6. Add or update the DATABASE_URL secret with the copied value');
  console.error('7. Restart the application\n');
  console.error('Alternatively, create a .env file with:');
  console.error('DATABASE_URL=postgresql://username:password@host:port/database\n');
  
  // For local development, provide a helpful message but don't throw immediately
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Running in development mode without DATABASE_URL. Database operations will fail.');
    // Set a dummy value to prevent undefined errors later
    process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost:5432/dummy';
  } else {
    throw new Error(
      "DATABASE_URL is empty or not set. Please configure it in Replit Secrets or .env file.",
    );
  }
}

// Log the DATABASE_URL format (without exposing credentials)
const dbUrl = process.env.DATABASE_URL.trim();
const urlPattern = /^postgresql:\/\/([^:]+):([^@]+)@([^:\/]+):?(\d+)?\/(.+)$/;
const match = dbUrl.match(urlPattern);

if (!match) {
  console.error('❌ Invalid DATABASE_URL format detected');
  console.error('DATABASE_URL should be: postgresql://username:password@host:port/database');
  console.error('Current DATABASE_URL length:', dbUrl.length);
  console.error('Please check your Replit Database tool for the correct connection string.');
  throw new Error('Invalid DATABASE_URL format');
}

// Extract individual connection parameters
const PGUSER = match[1];
const PGPASSWORD = match[2];
const PGHOST = match[3];
const PGPORT = match[4] || '5432';
const PGDATABASE = match[5];

// Set individual environment variables
process.env.PGUSER = PGUSER;
process.env.PGPASSWORD = PGPASSWORD;
process.env.PGHOST = PGHOST;
process.env.PGPORT = PGPORT;
process.env.PGDATABASE = PGDATABASE;

console.log('✓ DATABASE_URL format validated');
console.log(`✓ Database connection details extracted:`);
console.log(`  - PGHOST: ${PGHOST}`);
console.log(`  - PGPORT: ${PGPORT}`);
console.log(`  - PGUSER: ${PGUSER}`);
console.log(`  - PGDATABASE: ${PGDATABASE}`);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test the connection
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

export const db = drizzle(pool, { schema });
