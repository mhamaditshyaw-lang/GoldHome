# 🚀 Setup Guide for Remixed App

Welcome! You've remixed the Gold Home Cleaning Management System. Follow these simple steps to get it running.

## Quick Setup (2 minutes)

### Step 1: Create a Database
1. Look at the **left sidebar** in Replit
2. Click on **"Tools"** (or the database icon)
3. Click **"Database"** → **"Create a database"**
4. Wait ~10 seconds for the database to be created
5. ✓ Done! Replit automatically configures the connection

### Step 2: Initialize Database Tables

Run this command in the Shell:
```bash
bash setup-database.sh
```

This will:
- Install all dependencies
- Create all database tables automatically
- Set up the schema

### Step 3: Start the App

Click the **"Run"** button at the top, or run:
```bash
npm run dev
```

That's it! Your app is ready at `https://your-repl-name.replit.app`

---

## 🔐 Default Login

When you first start the app, it creates a default admin account:

- **Username**: `admin`
- **Password**: Check the console logs on first startup (it will be displayed)

You can change the password after logging in.

---

## 📊 What Gets Created

The setup creates these database tables:
- **users** - Admin and cleaner accounts
- **services** - Cleaning services catalog
- **invoices** - Service invoices
- **locations** - GPS tracking data
- **settings** - App configuration
- **expenses** - Business expenses
- **debts** - Debt management
- **equipment** - Equipment inventory
- **notifications** - System notifications
- And more...

---

## ⚠️ Important Notes

### Database Connection
- **Each remix gets its own database** - Your data is completely separate from the original
- The database credentials are **automatically managed** by Replit
- You don't need to manually configure any connection settings

### Do NOT Share
- Never share your `DATABASE_URL` or database credentials
- These are automatically secured by Replit's secrets management
- Each user who remixes gets their own unique credentials

---

## 🐛 Troubleshooting

### "DATABASE_URL must be set"
**Problem**: Database not created yet  
**Solution**: Go to Tools → Database → Create a database

### Port Already in Use
**Problem**: Old process still running  
**Solution**: Stop the app (Stop button) and click Run again

### Tables Not Created
**Problem**: Schema not pushed to database  
**Solution**: Run `bash setup-database.sh` again

### Can't Login
**Problem**: No admin user exists  
**Solution**: Check console logs for auto-generated admin password

---

## 🎯 Next Steps

After setup:
1. Log in with the admin account
2. Change the admin password
3. Create cleaner accounts from the Admin Panel
4. Add your cleaning services
5. Customize invoice settings
6. Start using the app!

---

## 📚 Full Documentation

For detailed documentation, deployment guides, and advanced features, see the main [README.md](README.md) file.

---

## ❓ Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console logs for error messages
3. Make sure the database is created in Replit Tools
4. Verify you ran the setup script: `bash setup-database.sh`

---

**Enjoy your cleaning management system!** 🧹✨
