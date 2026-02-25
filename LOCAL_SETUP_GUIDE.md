# Complete Local Setup Guide

This guide will help you run the Gold Home Cleaning Management System on your local server without errors.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **Git** (for cloning the repository)

## Step 1: Install PostgreSQL

### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### On macOS:
```bash
brew install postgresql@14
brew services start postgresql@14
```

### On Windows:
Download and install from: https://www.postgresql.org/download/windows/

## Step 2: Create Database and User

```bash
# Access PostgreSQL as superuser
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE cleaning_db;
CREATE USER cleaning_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE cleaning_db TO cleaning_user;
ALTER DATABASE cleaning_db OWNER TO cleaning_user;
\q
```

## Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Database Configuration
DATABASE_URL=postgresql://cleaning_user:your_secure_password@localhost:5432/cleaning_db

# Session Configuration
SESSION_SECRET=your-super-secret-key-minimum-32-characters-long-change-this

# Server Configuration
NODE_ENV=development
PORT=5000

# Optional: Google Maps API Key (for location features)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Important**: 
- Replace `your_secure_password` with the password you set in Step 2
- Replace `SESSION_SECRET` with a random 32+ character string
- For production, set `NODE_ENV=production`

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Initialize Database Schema

Run the database initialization script:

```bash
npx tsx init-database.ts
```

This will:
- Load environment variables from `.env`
- Test connection to your PostgreSQL database
- Use Drizzle to create all required tables from schema
- Set up indexes and relationships

**What to expect:**
- The script will retry connection attempts if database is sleeping
- It shows PostgreSQL version and current time when connected
- Tables are created using Drizzle's schema definition
- If tables already exist, it skips creation

**If you see errors:**

1. **"DATABASE_URL not set"**
   - Create `.env` file with DATABASE_URL as shown in Step 3

2. **"Connection refused"**
   - PostgreSQL is not running
   - Start it: `sudo systemctl start postgresql` (Linux) or `brew services start postgresql@14` (macOS)

3. **"Authentication failed"**
   - Check credentials in `.env` match those set in Step 2

4. **"Database does not exist"**
   - Create database as shown in Step 2

## Step 6: Start the Application

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

## Step 7: Default Login Credentials

After the first run, the system will create a default admin user:

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login!

## Troubleshooting

### Error: "Connection refused" or "ECONNREFUSED"

**Solution**: PostgreSQL is not running
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl status postgresql

# macOS
brew services start postgresql@14
```

### Error: "password authentication failed"

**Solution**: Check your `.env` file credentials match what you set in Step 2

### Error: "database does not exist"

**Solution**: Create the database again
```bash
sudo -u postgres psql
CREATE DATABASE cleaning_db;
GRANT ALL PRIVILEGES ON DATABASE cleaning_db TO cleaning_user;
```

### Error: "Port 5000 already in use"

**Solution**: Kill the process using port 5000
```bash
# Linux/macOS
lsof -ti:5000 | xargs kill -9

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F
```

## Production Deployment

### Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "cleaning-app" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

### Using systemd (Linux)

Create `/etc/systemd/system/cleaning-app.service`:

```ini
[Unit]
Description=Gold Home Cleaning Management System
After=network.target postgresql.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/project
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable cleaning-app
sudo systemctl start cleaning-app
sudo systemctl status cleaning-app
```

## Cloudflare DNS Integration

To manage DNS records for your custom domain:

1. **Get Cloudflare API Token**:
   - Login to Cloudflare Dashboard
   - Go to My Profile → API Tokens
   - Create Token with "Edit zone DNS" permissions

2. **Configure in Application**:
   - Login as admin
   - Navigate to Cloudflare DNS page
   - Click "Configure"
   - Enter:
     - API Token
     - Zone ID (found in Cloudflare Dashboard → Domain → Overview)
     - Zone Name (your domain, e.g., example.com)

3. **Manage DNS Records**:
   - Add A record pointing to your server IP
   - Add CNAME records for subdomains
   - Enable Cloudflare proxy for DDoS protection

## Custom Domain Setup

### For Local Network Access:

1. **Edit hosts file** on client devices:
   - **Windows**: `C:\Windows\System32\drivers\etc\hosts`
   - **Linux/Mac**: `/etc/hosts`
   
   Add:
   ```
   192.168.1.100  cleaning.local
   ```
   (Replace IP with your server's local IP)

2. **Access via**: `http://cleaning.local:5000`

### For Public Domain:

1. **Set up DNS**:
   - Point A record to your server's public IP
   - Point CNAME for www to your domain

2. **Set up Reverse Proxy** (Nginx recommended):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Enable HTTPS** with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

## Replit Deployment with Custom Domain

If you want to deploy on Replit with a custom domain:

1. **Publish Your App**:
   - Click "Deploy" button in Replit
   - Choose deployment type (Autoscale recommended)

2. **Add Custom Domain**:
   - Go to Deployments tab
   - Click Settings
   - Select "Link a domain"
   - Enter your custom domain
   - Add the provided DNS records to your domain registrar:
     - A record pointing to Replit's IP
     - TXT record for verification

3. **Wait for DNS Propagation** (up to 48 hours)

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong SESSION_SECRET (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Configure firewall to allow only necessary ports
- [ ] Regular database backups
- [ ] Keep dependencies updated: `npm audit fix`
- [ ] Set `NODE_ENV=production` in production
- [ ] Restrict database user permissions
- [ ] Use environment variables for secrets (never commit `.env`)

## Backup and Restore

The application includes built-in backup/restore functionality:

1. **Create Backup**:
   - Login as admin
   - Go to Backup & Restore page
   - Click "Create Backup"
   - Download the JSON file

2. **Restore from Backup**:
   - Upload backup JSON file
   - Click "Restore"
   - System will restore all data

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review application logs in console
3. Check PostgreSQL logs: `sudo journalctl -u postgresql`

## Additional Features

- **Live Location Tracking**: Requires Google Maps API key
- **SMS Notifications**: Configure Twilio credentials
- **Multi-language Support**: Kurdish and English included
- **Mobile Responsive**: Works on all device sizes
- **Real-time Updates**: WebSocket support included

---

**Last Updated**: November 2025
**Version**: 1.0.0
