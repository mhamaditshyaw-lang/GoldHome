import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function wakeUpDatabase() {
  console.log('Attempting to wake up database...');
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`Attempt ${attempts}/${maxAttempts}...`);
      
      const result = await pool.query('SELECT NOW()');
      console.log('✓ Database is awake!', result.rows[0]);
      return true;
    } catch (error: any) {
      console.log(`Attempt ${attempts} failed:`, error.message);
      
      if (attempts < maxAttempts) {
        const waitTime = Math.min(2000 * attempts, 10000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error('Failed to wake up database after', maxAttempts, 'attempts');
  return false;
}

wakeUpDatabase()
  .then(success => {
    pool.end();
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    pool.end();
    process.exit(1);
  });
