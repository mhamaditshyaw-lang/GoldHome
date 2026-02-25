#!/bin/bash

echo "🚀 Gold Home Cleaning - Database Setup"
echo "======================================"
echo ""

# Check if DATABASE_URL exists
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found!"
    echo ""
    echo "📋 Setup Instructions:"
    echo "1. Go to the Replit Tools panel (left sidebar)"
    echo "2. Click 'Database' → 'Create a database'"
    echo "3. Wait for the database to be provisioned"
    echo "4. Run this script again: bash setup-database.sh"
    echo ""
    exit 1
fi

echo "✓ Database connection found"
echo "✓ Installing dependencies..."
echo ""

npm install

echo ""
echo "✓ Pushing schema to database..."
echo ""

npm run db:push

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📊 Tables created:"
echo "  - users"
echo "  - services"
echo "  - invoices"
echo "  - locations"
echo "  - settings"
echo "  - user_settings"
echo "  - expenses"
echo "  - debts"
echo "  - debt_payments"
echo "  - equipment"
echo "  - notifications"
echo "  - invoice_settings"
echo "  - cloudflare_config"
echo "  - cloudflare_dns_records"
echo "  - user_sessions"
echo ""
echo "🎉 Your app is ready to use!"
echo "💡 Start the app by clicking the 'Run' button or type: npm run dev"
echo ""
