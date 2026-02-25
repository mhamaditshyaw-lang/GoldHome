import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...\n');

  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found!');
    console.error('\n📋 Setup Instructions:');
    console.error('1. Go to the Replit Tools panel');
    console.error('2. Click "Database" → "Create a database"');
    console.error('3. Wait for the database to be provisioned');
    console.error('4. Run this script again: npm run init-db\n');
    process.exit(1);
  }

  console.log('✓ Database connection found');
  console.log('✓ Pushing schema to database...\n');

  try {
    // Run db:push to create all tables
    const { stdout, stderr } = await execAsync('npm run db:push');
    
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('db:push')) console.error(stderr);

    console.log('\n✅ Database initialization complete!');
    console.log('\n📊 Tables created:');
    console.log('  - users');
    console.log('  - services');
    console.log('  - invoices');
    console.log('  - locations');
    console.log('  - settings');
    console.log('  - user_settings');
    console.log('  - expenses');
    console.log('  - debts');
    console.log('  - debt_payments');
    console.log('  - equipment');
    console.log('  - notifications');
    console.log('  - invoice_settings');
    console.log('  - cloudflare_config');
    console.log('  - cloudflare_dns_records');
    console.log('  - user_sessions');
    console.log('\n🎉 Your app is ready to use!');
    console.log('💡 Start the app with: npm run dev\n');

  } catch (error: any) {
    console.error('❌ Error during initialization:', error.message);
    
    if (error.message.includes('data loss')) {
      console.log('\n⚠️  Forcing schema push...');
      try {
        const { stdout } = await execAsync('npm run db:push -- --force');
        console.log(stdout);
        console.log('✅ Schema pushed successfully!\n');
      } catch (forceError: any) {
        console.error('❌ Force push failed:', forceError.message);
        process.exit(1);
      }
    } else {
      process.exit(1);
    }
  }
}

initializeDatabase();
