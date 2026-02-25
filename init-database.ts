import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema';

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
  console.error('\nPlease create a .env file with:');
  console.error('DATABASE_URL=postgresql://user:password@localhost:5432/database\n');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function wakeAndInitialize() {
  console.log('🚀 Starting database initialization...');
  console.log(`📍 Database: ${process.env.DATABASE_URL!.replace(/:[^:@]+@/, ':***@')}\n`);
  
  let attempts = 0;
  const maxAttempts = 15;
  
  // Step 1: Wake up and test connection
  console.log('Step 1: Testing database connection...');
  while (attempts < maxAttempts) {
    try {
      attempts++;
      console.log(`  Attempt ${attempts}/${maxAttempts}...`);
      
      const result = await pool.query('SELECT NOW() as current_time, version()');
      console.log(`  ✅ Database connected!`);
      console.log(`  ⏰ Server time: ${result.rows[0].current_time}`);
      console.log(`  📦 PostgreSQL version: ${result.rows[0].version.split(',')[0]}\n`);
      break;
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      
      if (errorMsg.includes('disabled') || errorMsg.includes('waking')) {
        console.log(`  ⏳ Database is sleeping, waiting to wake up...`);
      } else if (errorMsg.includes('ECONNREFUSED')) {
        console.error(`  ❌ Connection refused! Is PostgreSQL running?`);
        console.error(`  💡 Try: sudo systemctl start postgresql`);
        process.exit(1);
      } else if (errorMsg.includes('authentication failed')) {
        console.error(`  ❌ Authentication failed! Check your DATABASE_URL credentials.`);
        process.exit(1);
      } else if (errorMsg.includes('does not exist')) {
        console.error(`  ❌ Database does not exist! Create it first.`);
        process.exit(1);
      } else {
        console.log(`  ⚠️  ${errorMsg}`);
      }
      
      if (attempts >= maxAttempts) {
        console.error('\n❌ Failed to connect after', maxAttempts, 'attempts');
        console.error('Please check your database configuration and try again.');
        process.exit(1);
      }
      
      const waitTime = Math.min(3000 * attempts, 15000);
      console.log(`  Waiting ${waitTime/1000}s before retry...\n`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // Step 2: Create tables using Drizzle schema
  console.log('Step 2: Creating database tables from schema...');
  try {
    // Check if tables exist
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (result.rows.length > 0) {
      console.log('  ℹ️  Tables already exist. Skipping schema creation.');
      console.log('  💡 To recreate tables, drop the database and run this script again.\n');
    } else {
      console.log('  📋 No tables found. Creating schema...');
      console.log('  ⏳ This may take a moment...\n');
      
      // Use drizzle-kit push to create tables from schema
      const { execSync } = await import('child_process');
      try {
        execSync('npm run db:push -- --force', {
          stdio: 'inherit',
          env: { ...process.env }
        });
        console.log('\n  ✅ All tables created successfully from Drizzle schema!');
      } catch (pushError) {
        console.error('\n  ❌ Error running drizzle-kit push');
        throw pushError;
      }
    }
    
    console.log('\n✅ Database initialization complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start your application: npm run dev');
    console.log('   2. The app will create a default admin user on first login attempt');
    console.log('   3. Login with username: admin, password: admin123');
    console.log('   4. ⚠️  Change the default password immediately!\n');
    
  } catch (error: any) {
    console.error('\n❌ Error during initialization:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

wakeAndInitialize()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n💥 Initialization failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check DATABASE_URL in .env file');
    console.error('  2. Ensure PostgreSQL is running');
    console.error('  3. Verify database exists and credentials are correct');
    console.error('  4. Check firewall allows database connections\n');
    process.exit(1);
  });
