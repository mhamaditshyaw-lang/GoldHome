
# Gold Home Cleaning Management System

A comprehensive cleaning service management system with real-time tracking, customer management, and mobile support built with PostgreSQL database.

---

## 🎉 Just Remixed This App?

**👉 [Click here for the Quick Setup Guide](SETUP_FOR_REMIXERS.md)** - Get running in 2 minutes!

Or run this one command:
```bash
bash setup-database.sh
```

---

## 🚀 Quick Start with PostgreSQL

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (Replit built-in or external)
- npm or yarn package manager

### 1. Database Setup

#### Option A: Using Replit PostgreSQL (Recommended) ⭐

1. **Open the Database Tab** in Replit
2. **Click "Create a database"**
3. Your `DATABASE_URL` will be automatically set as an environment variable
4. No additional configuration needed!

#### Option B: Using External PostgreSQL Database

1. Create a PostgreSQL database on your hosting provider (Neon, Supabase, AWS RDS, etc.)
2. Get your connection string in this format:
   ```
   postgresql://username:password@host:5432/database_name
   ```
3. Add it to your environment variables (see step 2 below)

### 2. Environment Configuration

If using external PostgreSQL, create a `.env` file in the root directory:

```env
NODE_ENV=development
DATABASE_URL=postgresql://your_username:your_password@your_host:5432/your_database
SESSION_SECRET=your_secure_random_string_min_32_characters
PORT=5000

# Optional: Twilio SMS (for customer verification)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone
TWILIO_VERIFY_SERVICE_SID=your_verify_sid
```

**Note:** If using Replit's built-in PostgreSQL, the `DATABASE_URL` is automatically set - no need to add it manually.

### 3. Install Dependencies

```bash
npm install
```

### 4. Database Migration

Push the schema to your PostgreSQL database:

```bash
npm run db:push
```

### 5. Run the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

The application will be available at `http://localhost:5000`

## 📊 Default Credentials

The system creates a default admin account on first run:

**Admin User:**
- Username: `admin`
- Password: Check server console on first startup

You can create additional users from the Admin Panel.

## 🗄️ Database Technology Stack

### PostgreSQL Database
This system is built exclusively with **PostgreSQL** - a powerful, open-source relational database system.

**Why PostgreSQL?**
- ✅ Advanced data types (JSON, arrays, etc.)
- ✅ Superior performance and scalability
- ✅ Built-in full-text search
- ✅ ACID compliance for data integrity
- ✅ Robust indexing capabilities
- ✅ Native connection pooling support
- ✅ Seamless integration with Drizzle ORM

**Database Configuration:**
- **ORM**: Drizzle ORM with PostgreSQL adapter (`drizzle-orm/node-postgres`)
- **Client Library**: `pg` (node-postgres) with connection pooling
- **Migration Tool**: Drizzle Kit
- **Hosted on**: Neon (serverless PostgreSQL) via Replit integration

## 📋 Database Schema

The system uses **16 PostgreSQL tables**:

1. **users** - Admin and cleaner accounts with roles, avatars, active status
2. **customers** - Customer accounts with authentication
3. **services** - Cleaning service catalog with pricing
4. **invoices** - Service invoices with multi-service support
5. **customer_bookings** - Customer booking requests
6. **locations** - Real-time GPS tracking data
7. **live_tracking** - Active tracking sessions
8. **customer_locations** - Saved customer addresses
9. **expenses** - Business expense tracking
10. **debts** - Debt management
11. **debt_payments** - Payment records
12. **equipment** - Equipment inventory
13. **notifications** - System notifications
14. **settings** - Application settings
15. **user_settings** - Per-user permission controls
16. **invoice_settings** - Invoice customization
17. **customer_invoice_settings** - Customer-specific invoice settings
18. **password_reset_tokens** - Password reset functionality
19. **user_sessions** - Session storage

**Key PostgreSQL Features Used:**
- `pgTable` for table definitions
- PostgreSQL-specific types (`serial`, `numeric`, `json`, `varchar`, `timestamp`)
- Advanced indexing for query performance
- JSONB support for flexible data structures
- Connection pooling (max 10 connections, 30s idle timeout)
- Full transaction support

## 🔧 Configuration Files

- **drizzle.config.ts** - PostgreSQL Drizzle configuration
- **server/db.ts** - PostgreSQL connection pool setup (using `pg` library)
- **shared/schema.ts** - PostgreSQL schema definitions with Drizzle ORM
- **server/routes.ts** - API routes and business logic

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Start development server

# Production
npm run build           # Build for production
npm start              # Start production server

# Database
npm run db:push        # Push schema to PostgreSQL
npm run db:studio      # Open Drizzle Studio (database GUI)

# Type Checking
npm run check          # Run TypeScript type checking
```

## 🌍 Features

- **Dashboard**: Real-time statistics and team status
- **Invoice Management**: Create, edit, and track invoices
- **Team Tracking**: Live GPS tracking of cleaners
- **Customer Portal**: Mobile-friendly customer interface
- **Booking System**: Customer booking requests with tracking
- **Expense Tracking**: Business expense management
- **Debt Management**: Track and manage debts
- **Equipment Management**: Monitor cleaning equipment
- **Multi-language**: English and Kurdish support with RTL
- **Real-time Notifications**: WebSocket-based notifications
- **Performance Optimization**: In-memory caching and PostgreSQL connection pooling

## 📱 Mobile Support

The customer portal is optimized for mobile devices with:
- Touch-friendly interface
- Responsive design
- Live tracking maps
- Easy booking process
- Mobile keyboard fixes

## 🔐 Security Features

- Session-based authentication with PostgreSQL session store
- Role-based access control (Admin, Cleaner, Customer)
- IP blocking for suspicious activity
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- Security headers middleware
- PostgreSQL parameterized queries (SQL injection protection)

## 🚀 Deployment

### Using Replit (Recommended) ⭐

1. **Click the "Deploy" button** in Replit
2. **Select "Autoscale Deployment"**
3. **Click "Deploy"**
4. Your app will be live in minutes!

**Why Deploy on Replit?**
- ✅ Built-in PostgreSQL database (Neon serverless) - zero setup
- ✅ Automatic SSL/HTTPS certificates
- ✅ Native WebSocket support
- ✅ Usage-based pricing ($0-20/month)
- ✅ 99.95% uptime guarantee
- ✅ Zero server maintenance
- ✅ One-click deployments
- ✅ Auto-scaling infrastructure

### Environment Variables for Deployment

Make sure these are set in your Replit Secrets or deployment environment:

- `DATABASE_URL` - Automatically set by Replit PostgreSQL
- `SESSION_SECRET` - Generate a random 32+ character string
- `NODE_ENV` - Set to `production`
- `PORT` - Set to `5000` (or as needed)

## 🚀 VPS Deployment Checklist

Before deploying to a VPS (Hostinger, DigitalOcean, etc.):

1. **Build the application:**
   ```bash
   npm install
   npm run build
   ```

2. **Verify build output:**
   - `dist/index.js` - Compiled backend (JavaScript)
   - `dist/public/` - Frontend static files
   
3. **Upload to VPS:**
   - Upload `dist/` folder
   - Upload `package.json`
   - Upload `.env.production` (create from template)
   
4. **On VPS, install production dependencies only:**
   ```bash
   npm install --production
   ```

5. **Start with:**
   ```bash
   NODE_ENV=production node dist/index.js
   ```
   Or use PM2:
   ```bash
   pm2 start dist/index.js --name gold-cleaning
   ```

**⚠️ Common VPS Errors:**
- ❌ `Cannot find module 'tsx'` - You're trying to run .ts files directly
  - ✅ Solution: Use `node dist/index.js` not `tsx server/index.ts`
- ❌ TypeScript syntax errors in production
  - ✅ Solution: Run `npm run build` before deploying
- ❌ Missing dist folder
  - ✅ Solution: Always run build step before deployment

## 🐛 Troubleshooting

### Database Connection Issues

**Error: `DATABASE_URL must be set`**
- Ensure you've created a database in the Replit Database tab
- Check that `DATABASE_URL` is available in your environment variables
- Verify the connection string format: `postgresql://user:pass@host:5432/dbname`

**PostgreSQL Connection Pool Issues**
- The system uses connection pooling (max 10 connections)
- Idle connections timeout after 30 seconds
- Connection errors are automatically retried
- Check `server/db.ts` for pool configuration

**Neon Database Sleep Mode**
- Free Neon databases sleep after 5 minutes of inactivity
- First query after sleep may take 1-2 seconds to wake up
- Upgrade to Neon paid plan for always-on databases
- This is normal behavior for serverless PostgreSQL

### Port Issues

**Port already in use:**
```bash
# Check what's using the port
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Cache Issues

If you experience stale data:
- Cache TTL is 30-60 seconds
- Cache automatically invalidates on data changes
- Restart the server to clear all cache

## 📚 Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn UI components
- React Query for data fetching
- Wouter for routing
- Leaflet/Mapbox for mapping

### Backend
- Express.js with TypeScript
- **PostgreSQL database** (Neon serverless via Replit)
- **Drizzle ORM** (PostgreSQL adapter)
- **pg** (node-postgres) client library with connection pooling
- WebSocket for real-time updates
- Session-based authentication with `connect-pg-simple`
- Multer for file uploads

### Database
- **PostgreSQL 15+** (Neon serverless on Replit)
- Drizzle ORM with Zod validation
- Connection pooling via `pg` Pool (10 max connections)
- Prepared statements for SQL injection protection
- Full ACID transaction support
- Advanced indexing for performance

## 🔄 Database Management

You can manage your PostgreSQL database using:

1. **Drizzle Studio** (Recommended):
   ```bash
   npm run db:studio
   ```

2. **Replit Database Tab**:
   - Built-in SQL explorer
   - Real-time query execution
   - Schema visualization

3. **External PostgreSQL Clients**:
   - pgAdmin
   - DBeaver
   - TablePlus
   - Any PostgreSQL-compatible tool

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Verify your PostgreSQL connection in the Database tab
3. Check server logs for errors
4. Ensure all environment variables are set correctly
5. Confirm database schema is up to date with `npm run db:push`

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Developer

Created by Muhammad Sartep

---

## Important Notes

### ⚠️ This System Uses PostgreSQL, Not MySQL

**Database Technology:**
- ✅ **PostgreSQL 15+** - Advanced open-source RDBMS
- ❌ **NOT MySQL** - This system is built exclusively for PostgreSQL

**Why PostgreSQL?**
- Superior JSON/JSONB support for flexible data
- Advanced indexing (GiST, GIN, etc.)
- Better concurrency control
- Native array and geometric types
- Full-text search built-in
- Better standards compliance

**Connection Details:**
- Library: `pg` (node-postgres)
- ORM: Drizzle with `drizzle-orm/node-postgres`
- Connection pooling enabled
- Prepared statements for security

### Database Schema

All schema definitions use PostgreSQL-specific types:
- `pgTable` instead of MySQL tables
- `serial` for auto-increment (not AUTO_INCREMENT)
- `numeric` for decimal values (not DECIMAL)
- `json` and `jsonb` for structured data
- `timestamp` with timezone support
- `varchar` with length constraints

### Migration Files

Located in `./migrations` directory (auto-generated by Drizzle Kit)

For detailed PostgreSQL connection examples, see the code snippets in `server/db.ts` and `drizzle.config.ts`.
