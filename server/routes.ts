import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer as createHttpServer, type Server } from "http";
import { createHttpsServer } from "./https-server";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { invalidateAllDashboardCaches, cache, invalidateUserSettingsCache } from "./cache";
import { insertUserSchema, insertServiceSchema, insertInvoiceSchema, insertLocationSchema, insertBookingSchema, users, services, invoices, locations, expenses, debts, debtPayments, equipment, settings, notifications, userSettings, invoiceSettings, cloudflareConfig, cloudflareDnsRecords, User, Invoice, Service, Expense, Debt, DebtPayment, Settings, Notification, UserSettings } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, sql, count, isNull, isNotNull, exists, notExists, inArray, desc } from "drizzle-orm";
import { z } from "zod";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs";
import twilio from "twilio";
import bcrypt from 'bcrypt';
import {
  securityMonitor,
  ipBlockingMiddleware,
  rateLimitMiddleware,
  inputValidationMiddleware,
  securityHeadersMiddleware,
  sessionSecurityMiddleware
} from "./security-monitor";

// Add global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};

// Extend the Request interface to include session user
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    user?: {
      id: number;
      username: string;
      name: string;
      role: string;
      location?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    };
    clientIP?: string;
  }
}



// Admin-only middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// Permission check middleware factory
const requirePermission = (permissionKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    try {
      // Check if user has this permission
      const userSetting = await storage.getUserSetting(req.session.userId, permissionKey);

      // If no specific setting, check default permission based on role
      if (!userSetting) {
        // Define default permissions for different roles
        const defaultPermissions: { [key: string]: { [role: string]: boolean } } = {
          'dashboard_access': { admin: true, supervisor: true, cleaner: true },
          'invoices_view': { admin: true, supervisor: true, cleaner: true },
          'invoices_create': { admin: true, supervisor: true, cleaner: true },
          'invoices_edit': { admin: true, supervisor: true, cleaner: false },
          'team_view': { admin: true, supervisor: true, cleaner: true },
          'team_manage': { admin: true, supervisor: true, cleaner: false },
          'live_tracking': { admin: true, supervisor: true, cleaner: true },
          'admin_settings': { admin: true, supervisor: false, cleaner: false },
        };

        const userRole = req.session.user?.role || 'cleaner';
        const hasPermission = defaultPermissions[permissionKey]?.[userRole] ?? false;

        if (!hasPermission) {
          return res.status(403).json({ message: "Insufficient permissions" });
        }
      } else if (!userSetting.isEnabled) {
        return res.status(403).json({ message: "Permission denied" });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
};


// Configure multer for image uploads
const serviceImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads', 'service-images');
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'service-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadServiceImage = multer({
  storage: serviceImageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Request timing middleware: logs slow requests (helps find bottlenecks)
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      if (ms > 300) { // threshold for 'slow' (ms)
        console.log(`[SLOW] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
      }
    });
    next();
  });
  // Setup session middleware
  let sessionStore: any;

  if (process.env.NODE_ENV === 'production') {
    // Use PostgreSQL session store in production
    const ConnectPgSimple = await import('connect-pg-simple');
    const PgSession = ConnectPgSimple.default(session);
    const { pool } = await import('./db');

    sessionStore = new PgSession({
      pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    });
  } else {
    // Use in-memory session store in development for reliability
    const MemoryStore = await import('memorystore');
    const Store = MemoryStore.default(session);
    sessionStore = new Store({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // Test data routes removed

  // Apply security middleware
  app.use(securityHeadersMiddleware);
  app.use(ipBlockingMiddleware);
  app.use(rateLimitMiddleware);
  app.use(inputValidationMiddleware);

  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // Reduced to 24 hours for better memory management
      sameSite: 'strict'
    },
    // Add performance optimizations
    name: 'sessionId', // Custom session name
    proxy: true // Trust proxy for better performance
  }));

  app.use(sessionSecurityMiddleware);

  // Serve uploaded images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Image upload endpoint
  app.post("/api/upload/service-image", requireAuth, uploadServiceImage.single('image'), async (req, res) => {
    try {
      const userRole = req.session.user!.role;
      const userName = req.session.user!.name;

      // Only supervisors and admin can upload service images
      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Only supervisors and administrators can upload service images." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      // Log successful upload
      console.log(`Service image uploaded by ${userName} (${userRole}): ${req.file.filename}`);

      // Return the image URL with correct subdirectory path
      const imageUrl = `/uploads/service-images/${req.file.filename}`;
      res.json({
        imageUrl,
        message: "Image uploaded successfully",
        filename: req.file.filename,
        size: req.file.size
      });
    } catch (error: any) {
      console.error('Image upload error:', error);

      // Handle multer errors specifically
      if (error?.message === 'Only image files are allowed!') {
        return res.status(400).json({ error: 'Only image files are allowed (JPEG, PNG, GIF, WebP)' });
      }

      if (error?.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size too large. Maximum size is 5MB' });
      }

      res.status(500).json({ error: 'Failed to upload image. Please try again.' });
    }
  });

  // Manual admin user creation route (for emergency setup)
  app.post("/api/setup/admin", async (req, res) => {
    try {
      // Check if any admin users exist
      const allUsers = await storage.getAllUsers();
      const adminExists = allUsers.some(user => user.role === 'admin');

      if (adminExists) {
        return res.status(400).json({ message: "Admin user already exists" });
      }

      // Create admin user with plain text password
      const adminUser = await storage.createUser({
        username: 'admin',
        password: 'admin', // Plain text password
        name: 'Administrator',
        role: 'admin',
        isActive: true,
      });

      console.log('Emergency admin user created successfully:', adminUser.username);
      res.json({
        message: "Admin user created successfully",
        username: adminUser.username,
        note: "Default password is 'admin'"
      });
    } catch (error: any) {
      console.error('Error creating emergency admin user:', error);
      res.status(500).json({ message: "Failed to create admin user", error: error?.message });
    }
  });

  // Development-only endpoint to unblock IPs (no authentication required)
  app.post("/api/dev/unblock-ip", async (req, res) => {
    // Only available in development mode
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ message: "Not found" });
    }

    try {
      const { ip } = req.body;
      if (!ip) {
        return res.status(400).json({ error: 'IP address is required' });
      }

      securityMonitor.unblockIP(ip);
      console.log(`🔓 Development: IP ${ip} has been unblocked`);
      res.json({ message: `IP ${ip} has been unblocked successfully` });
    } catch (error) {
      console.error('Error unblocking IP:', error);
      res.status(500).json({ error: 'Failed to unblock IP' });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    try {
      // Trim username/password to avoid login failures due to whitespace
      const { username: rawUsername, password: rawPassword } = req.body;
      const username = typeof rawUsername === 'string' ? rawUsername.trim() : rawUsername;
      const password = typeof rawPassword === 'string' ? rawPassword.trim() : rawPassword;
      console.log('Login attempt for username:', username);

      if (!username || !password) {
        securityMonitor.logSecurityEvent({
          type: 'login_attempt',
          ip: clientIP,
          userAgent,
          details: { username, reason: 'Missing credentials' },
          severity: 'low',
        });
        return res.status(400).json({ message: "Username and password required" });
      }

      // Fallback: Create admin user if database is empty (happens when DB wakes up)
      try {
        const allUsers = await storage.getAllUsers();
        if (allUsers.length === 0 && username === 'admin') {
          console.log('Database is empty. Creating default admin user...');
          const hashedPassword = await bcrypt.hash('admin123', 10);
          await storage.createUser({
            username: 'admin',
            password: hashedPassword,
            name: 'Admin User',
            role: 'admin',
            isActive: true,
          });
          console.log('Default admin user created. Please retry login.');
        }
      } catch (initError) {
        console.log('Could not check/create admin user:', initError);
      }

      const user = await storage.getUserByUsername(username);
      console.log('User found:', user ? 'Yes' : 'No');
      if (user) {
        console.log('Stored password (first 10 chars):', user.password.substring(0, 10));
        console.log('Provided password:', password);
        console.log('Password match:', user.password === password);
      }

      if (!user) {
        securityMonitor.logSecurityEvent({
          type: 'failed_login',
          ip: clientIP,
          userAgent,
          details: { username, reason: 'User not found' },
          severity: 'medium',
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare password - support both plain text and bcrypt
      let passwordMatch = false;

      // Check if password is bcrypt hashed (starts with $2)
      if (user.password.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, user.password);
      } else {
        // Plain text comparison
        passwordMatch = user.password === password;
      }

      if (!passwordMatch) {
        securityMonitor.logSecurityEvent({
          type: 'failed_login',
          ip: clientIP,
          userAgent,
          details: { username, reason: 'Invalid password' },
          severity: 'medium',
        });
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user account is active
      if (!user.isActive) {
        securityMonitor.logSecurityEvent({
          type: 'failed_login',
          userId: user.id,
          ip: clientIP,
          userAgent,
          details: { username, reason: 'Account inactive' },
          severity: 'medium',
        });
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Create session
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      };
      req.session.clientIP = clientIP;

      const userResponse = { ...user };
      delete (userResponse as any).password;

      securityMonitor.logSecurityEvent({
        type: 'login_attempt',
        userId: user.id,
        ip: clientIP,
        userAgent,
        details: { username, success: true },
        severity: 'low',
      });

      console.log('Login successful for user:', user.username);

      // Ensure session is saved to database before responding
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: "Session error" });
        }
        res.json({ user: userResponse });
      });
    } catch (error: any) {
      console.error('Login error:', error);
      securityMonitor.logSecurityEvent({
        type: 'login_attempt',
        ip: clientIP,
        userAgent,
        details: { username: req.body.username, error: error?.message },
        severity: 'medium',
      });
      res.status(500).json({ message: "Internal server error" });
    }
  });


  // Session validation route
  app.get("/api/auth/session", (req, res) => {
    try {
      if (!req.session?.userId || !req.session?.user) {
        return res.status(401).json({ message: "No active session" });
      }

      res.json({
        user: req.session.user,
        isAuthenticated: true
      });
    } catch (error) {
      console.error('Staff session check error:', error);
      res.status(401).json({ message: "No active session" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User management routes (Admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await db.select()
        .from(users)
        .where(eq(users.username, userData.username))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      const [newUser] = await db.insert(users).values({
        ...userData,
        password: hashedPassword
      }).returning();

      // Don't return password in response
      const { password, ...userResponse } = newUser;

      console.log('User created successfully:', userResponse.name);

      // Invalidate dashboard stats cache
      invalidateAllDashboardCaches();

      // Broadcast the new user to all connected clients
      broadcastDataChange('users', userResponse, 'create');

      res.status(201).json(userResponse);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;

      // Hash password if it's being updated
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
      }

      const user = await storage.updateUser(userId, updates);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Don't return password in response
      const { password, ...userResponse } = user;

      // Invalidate dashboard stats cache
      invalidateAllDashboardCaches();

      // Broadcast the user update to all connected clients
      broadcastDataChange('users', userResponse, 'update');

      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);

      // Invalidate dashboard stats cache
      invalidateAllDashboardCaches();

      // Broadcast deletion
      broadcastDataChange('users', { id: userId }, 'delete');

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // User settings routes
  // Allow users to fetch their own settings, or admins/supervisors to fetch any user's settings
  app.get("/api/user-settings/:userId", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;
      const requestedUserId = parseInt(req.params.userId);

      // Users can fetch their own settings, or admins/supervisors can fetch any user's settings
      if (requestedUserId !== currentUserId && userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. You can only access your own settings." });
      }

      const userSettings = await storage.getUserSettings(requestedUserId);
      res.json(userSettings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  });

  // User Settings Endpoints
  app.post("/api/user-settings", requireAuth, async (req, res) => {
    // The original code had req.isAuthenticated() and req.user, which are not standard Express.
    // This has been replaced with checks for req.session.userId and req.session.user.role.

    try {
      const { userId, settingKey, isEnabled } = req.body;

      // Only admin and supervisor users can modify user settings
      if (req.session.user!.role !== 'admin' && req.session.user!.role !== 'supervisor') {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const userSetting = await storage.setUserSetting({ userId, settingKey, isEnabled });

      // Invalidate cache for this specific user's settings
      invalidateUserSettingsCache(userId);

      res.json(userSetting);
    } catch (error: any) {
      console.error("Error updating user setting:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/user-settings", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Supervisors and admin only." });
      }

      const userSettingData = req.body;
      const userSetting = await storage.setUserSetting(userSettingData);

      // Invalidate cache for this specific user's settings
      invalidateUserSettingsCache(userSettingData.userId);

      res.json(userSetting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user setting' });
    }
  });

  app.delete("/api/user-settings/:userId/:settingKey", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Supervisors and admin only." });
      }

      const userId = parseInt(req.params.userId);
      const settingKey = req.params.settingKey;
      await storage.deleteUserSetting(userId, settingKey);

      // Invalidate cache for this specific user's settings
      invalidateUserSettingsCache(userId);

      res.json({ message: 'User setting deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete user setting' });
    }
  });

  // Dashboard stats - User-specific (Optimized with caching)
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;
      const cacheKey = `dashboard-stats-${userRole}-${currentUserId}`;

      // Check cache first (30 second TTL for dashboard data)
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('Cache HIT for dashboard stats:', cacheKey);
        return res.json(cached);
      }

      console.log('Cache MISS for dashboard stats:', cacheKey);

      // Make parallel database calls for better performance
      const promises: Promise<any>[] = [];

      if (userRole === "admin" || userRole === "supervisor") {
        promises.push(
          storage.getInvoices(),
          storage.getAllExpenses(),
          storage.getAllUsers(),
          storage.getActiveLocations(),
          storage.getAllDebts()
        );
      } else {
        promises.push(
          storage.getInvoicesByUser(currentUserId),
          storage.getExpensesByUser(currentUserId),
          storage.getUserLocation(currentUserId),
          storage.getDebtsByUser(currentUserId)
        );
      }

      const results = await Promise.all(promises);

      let totalRevenue = 0;
      let totalExpenses = 0;
      let jobsCompleted = 0;
      let activeCleaners = 1;
      let workingNow = 0;
      let totalDebt = 0;

      let totalEmployeeSalary = 0;

      if (userRole === "admin" || userRole === "supervisor") {
        const [invoices, expenses, users, activeLocations, debts] = results;

        totalRevenue = invoices.reduce((sum: number, invoice: any) =>
          sum + parseFloat(invoice.totalAmount), 0);

        totalEmployeeSalary = invoices.reduce((sum: number, invoice: any) => {
          const meta = invoice.metadata || {};
          const salary = parseFloat(meta.dailySalary || meta.totalEmployeePay || "0");
          return sum + (isNaN(salary) ? 0 : salary);
        }, 0);

        totalExpenses = expenses.reduce((sum: number, expense: any) =>
          sum + parseFloat(expense.amount), 0);

        jobsCompleted = invoices.filter((invoice: any) =>
          invoice.status === "completed").length;

        activeCleaners = users.filter((user: any) =>
          user.role === "cleaner" && user.isActive).length;

        workingNow = activeLocations.length;

        totalDebt = debts
          .filter((debt: any) => debt.status === "pending")
          .reduce((sum: number, debt: any) => sum + parseFloat(debt.amount), 0);
      } else {
        const [invoices, expenses, userLocation, debts] = results;

        totalRevenue = invoices.reduce((sum: number, invoice: any) =>
          sum + parseFloat(invoice.totalAmount), 0);

        totalEmployeeSalary = invoices.reduce((sum: number, invoice: any) => {
          const meta = invoice.metadata || {};
          const salary = parseFloat(meta.dailySalary || meta.totalEmployeePay || "0");
          return sum + (isNaN(salary) ? 0 : salary);
        }, 0);

        totalExpenses = expenses.reduce((sum: number, expense: any) =>
          sum + parseFloat(expense.amount), 0);

        jobsCompleted = invoices.filter((invoice: any) =>
          invoice.status === "completed").length;

        workingNow = userLocation?.isWorking ? 1 : 0;

        totalDebt = debts
          .filter((debt: any) => debt.status === "pending")
          .reduce((sum: number, debt: any) => sum + parseFloat(debt.amount), 0);
      }

      const stats = {
        totalRevenue,
        totalExpenses,
        monthlyExpenses: totalExpenses,
        jobsCompleted,
        activeCleaners,
        workingNow,
        totalDebt,
        totalEmployeeSalary,
        averageRating: 4.8
      };

      // Cache for 2 minutes for better performance
      cache.set(cacheKey, stats, 120000);

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Daily performance data for dashboard charts (Optimized with caching)
  app.get("/api/dashboard/daily-performance", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;
      const cacheKey = `daily-performance-${userRole}-${currentUserId}`;

      // Check cache first (3 minute TTL for better performance)
      const cached = cache.get(cacheKey);
      if (cached) {
        console.log('Cache HIT for daily performance:', cacheKey);
        return res.json(cached);
      }

      console.log('Cache MISS for daily performance:', cacheKey);

      let invoices;

      // Get invoices based on user role
      if (userRole === "admin" || userRole === "supervisor") {
        invoices = await storage.getInvoices();
      } else {
        invoices = await storage.getInvoicesByUser(currentUserId);
      }

      // Get last 7 days of data
      const last7Days = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        // Filter invoices for this day
        const dayInvoices = invoices.filter(invoice => {
          const invoiceDate = new Date(invoice.createdAt);
          return invoiceDate >= date && invoiceDate < nextDay;
        });

        // Calculate daily stats
        const dailyRevenue = dayInvoices.reduce((sum, invoice) =>
          sum + parseFloat(invoice.totalAmount), 0);
        const dailyJobs = dayInvoices.length;

        // Get day name
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

        last7Days.push({
          day: dayName,
          date: date.toISOString().split('T')[0],
          revenue: Math.round(dailyRevenue),
          jobs: dailyJobs,
          width: dailyRevenue > 0 ? `${Math.min(100, (dailyRevenue / 1500) * 100)}%` : '5%'
        });
      }

      // Cache for 60 seconds
      cache.set(cacheKey, last7Days, 60000);

      res.json(last7Days);
    } catch (error) {
      console.error("Error fetching daily performance:", error);
      res.status(500).json({ message: "Failed to fetch daily performance data" });
    }
  });

  // Invoice routes - User-specific
  app.get("/api/invoices", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;

      let invoices;

      // Admin and supervisor can see all invoices, other users only see their own
      if (userRole === "admin" || userRole === "supervisor") {
        invoices = await storage.getInvoices();
      } else {
        invoices = await storage.getInvoicesByUser(currentUserId);
      }

      // Join with user data
      const invoicesWithUsers = await Promise.all(
        invoices.map(async (invoice) => {
          const cleaner = await storage.getUser(invoice.cleanerId);
          return {
            ...invoice,
            cleaner: cleaner ? { id: cleaner.id, name: cleaner.name } : null
          };
        })
      );

      res.json(invoicesWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      console.log("Invoices: Creating new invoice with data:", req.body);

      const validatedData = insertInvoiceSchema.parse({
        ...req.body,
        cleanerId: currentUserId // Always set the invoice to the current user
      });

      console.log("Invoices: Validated data for storage:", {
        ...validatedData,
        createdAt: validatedData.createdAt ? validatedData.createdAt.toISOString() : 'MISSING'
      });

      const invoice = await storage.createInvoice(validatedData);

      // Invalidate all dashboard caches (affects stats and performance data)
      invalidateAllDashboardCaches();

      const cleaner = await storage.getUser(invoice.cleanerId);
      const invoiceWithUser = {
        ...invoice,
        cleaner: cleaner ? { id: cleaner.id, name: cleaner.name } : null
      };

      res.status(201).json(invoiceWithUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid invoice data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.delete("/api/invoices/:id", requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;

      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }

      // Get the invoice to check ownership
      const invoice = await storage.getInvoice(invoiceId);

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Only admin, supervisor, or the invoice creator can delete
      if (userRole !== "admin" && userRole !== "supervisor" && invoice.cleanerId !== currentUserId) {
        return res.status(403).json({ message: "Access denied. You can only delete your own invoices." });
      }

      // Hard delete the invoice
      await storage.deleteInvoice(invoiceId);

      // Invalidate all dashboard caches to update stats immediately
      invalidateAllDashboardCaches();

      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // Team routes - Only admin can see team (Optimized with caching)
  app.get("/api/team", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      // Only admin can view team members
      if (userRole !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin only." });
      }

      const cacheKey = `team-data-${userRole}`;

      // Check cache first (30 second TTL for team data)
      const cached = cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const users = await storage.getAllUsers();
      const cleaners = users.filter(user => user.role === "cleaner" && user.isActive);

      // Add location data
      const cleanersWithLocation = await Promise.all(
        cleaners.map(async (cleaner) => {
          const location = await storage.getUserLocation(cleaner.id);
          const cleanerResponse = { ...cleaner };
          delete (cleanerResponse as any).password;
          return {
            ...cleanerResponse,
            location: location || null,
            isWorking: location?.isWorking || false
          };
        })
      );

      // Cache for 30 seconds
      cache.set(cacheKey, cleanersWithLocation, 30000);

      res.json(cleanersWithLocation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch team members" });
    }
  });

  // Location routes
  app.post("/api/locations", async (req, res) => {
    try {
      const validatedData = insertLocationSchema.parse(req.body);
      const location = await storage.updateUserLocation(validatedData);
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid location data", errors: error.issues });
      }
      res.status(500).json({ message: "Failed to update location" });
    }
  });

  app.get("/api/locations/active", async (req, res) => {
    try {
      const activeLocations = await storage.getActiveLocations();

      // Remove duplicates by userId and only include working users
      const uniqueActiveLocations = activeLocations.filter((location, index, self) =>
        location.isWorking &&
        index === self.findIndex(l => l.userId === location.userId)
      );

      // Join with user data and check if user is currently logged in
      const locationsWithUsers = await Promise.all(
        uniqueActiveLocations.map(async (location) => {
          const user = await storage.getUser(location.userId);
          // Only return if user exists, is active, and location was updated recently (within last 10 minutes)
          if (!user || !user.isActive) return null;

          const locationAge = Date.now() - new Date(location.updatedAt).getTime();
          const tenMinutes = 10 * 60 * 1000;

          // Don't show stale locations (users who haven't updated in 10+ minutes)
          if (locationAge > tenMinutes) return null;

          return {
            ...location,
            user: user ? { id: user.id, name: user.name, avatar: user.avatar, role: user.role } : null
          };
        })
      );

      // Filter out null entries
      const validLocations = locationsWithUsers.filter(location => location !== null);

      res.json(validLocations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active locations" });
    }
  });

  // Location history route
  app.get("/api/locations/history", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;
      const { startDate, endDate, userId, search } = req.query;

      // Only supervisors and admin can view location history
      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ message: "Access denied. Supervisors and admin only." });
      }

      const locations = await storage.getLocationHistory({
        startDate: startDate as string,
        endDate: endDate as string,
        userId: userId ? parseInt(userId as string) : undefined,
        search: search as string
      });

      // Join with user data
      const locationsWithUsers = await Promise.all(
        locations.map(async (location) => {
          const user = await storage.getUser(location.userId);
          return {
            ...location,
            user: user ? { id: user.id, name: user.name, avatar: user.avatar, role: user.role } : null
          };
        })
      );

      res.json(locationsWithUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location history" });
    }
  });

  // User profile routes
  app.get("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userResponse = { ...user };
      delete (userResponse as any).password;

      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Services routes
  // Public services endpoint (no auth required)
  app.get("/api/services/public", async (req, res) => {
    try {
      const services = await storage.getServices();
      // Only return active services for public endpoint
      const activeServices = services.filter(service => service.isActive);
      res.json(activeServices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  app.get("/api/services/all", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Supervisors and admin only." });
      }

      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch all services' });
    }
  });

  app.get("/api/services", requireAuth, async (req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch services' });
    }
  });

  app.post("/api/services", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      // Only supervisors and admin can create services
      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Supervisors and admin only." });
      }

      const serviceData = insertServiceSchema.parse(req.body);
      console.log('Creating service with data:', serviceData);

      const [newService] = await db.insert(services).values(serviceData).returning();
      console.log('Service created successfully:', newService);

      // Broadcast the new service to all connected clients
      broadcastDataChange('services', newService, 'create');

      res.status(201).json(newService);
    } catch (error: any) {
      console.error('Error creating service:', error);

      if (error?.name === 'ZodError') {
        return res.status(400).json({
          error: 'Invalid service data',
          details: error.issues
        });
      }

      res.status(500).json({
        error: 'Failed to create service',
        message: error?.message || 'Unknown error'
      });
    }
  });

  app.put("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      // Only supervisors and admin can update services
      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Supervisors and admin only." });
      }

      const serviceId = parseInt(req.params.id);
      const serviceData = insertServiceSchema.parse(req.body);

      console.log('Updating service:', serviceId, 'with data:', serviceData);

      const [updatedService] = await db
        .update(services)
        .set(serviceData)
        .where(eq(services.id, serviceId))
        .returning();

      if (!updatedService) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Broadcast the updated service to all connected clients
      broadcastDataChange('services', updatedService, 'update');

      res.json(updatedService);
    } catch (error: any) {
      console.error('Error updating service:', error);

      if (error?.name === 'ZodError') {
        return res.status(400).json({
          error: 'Invalid service data',
          details: error.issues
        });
      }

      res.status(500).json({
        error: 'Failed to update service',
        message: error?.message || 'Unknown error'
      });
    }
  });

  app.delete("/api/services/:id", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      // Only supervisors and admin can delete services
      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Supervisors and admin only." });
      }

      const serviceId = parseInt(req.params.id);
      console.log('Deleting service:', serviceId);

      const [deletedService] = await db
        .delete(services)
        .where(eq(services.id, serviceId))
        .returning();

      if (!deletedService) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Broadcast the service deletion to all connected clients
      broadcastDataChange('services', { id: serviceId }, 'delete');

      res.json({ success: true, deletedService });
    } catch (error: any) {
      console.error('Error deleting service:', error);
      res.status(500).json({
        error: 'Failed to delete service',
        message: error?.message || 'Unknown error'
      });
    }
  });

  // Customer Bookings routes
  app.get("/api/customer/bookings", requireAuth, async (req, res) => {
    try {
      const user = req.session.user!;
      let bookingsList;

      if (user.role === "admin" || user.role === "supervisor") {
        bookingsList = await storage.getBookings();
      } else {
        bookingsList = await storage.getBookingsByUser(user.id);
      }

      res.json(bookingsList);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  app.post("/api/customer/bookings", requireAuth, async (req, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);
      const newBooking = await storage.createBooking(bookingData);

      // Notify admins/supervisors
      const staffUsers = await storage.getAllUsers();
      const staffToNotify = staffUsers.filter(u => u.role === "admin" || u.role === "supervisor");

      for (const staff of staffToNotify) {
        try {
          await storage.createNotification({
            userId: staff.id,
            title: "New Booking Request",
            message: `New booking request from ${newBooking.customerName}`,
            type: "info",
            isRead: false
          });
        } catch (notifError) {
          console.error('Error creating notification:', notifError);
        }
      }

      broadcastDataChange('bookings', newBooking, 'create');
      res.status(201).json(newBooking);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      if (error?.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid booking data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create booking' });
    }
  });

  app.patch("/api/customer/bookings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const oldBooking = await storage.getBooking(id);

      if (!oldBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const updatedBooking = await storage.updateBooking(id, updates);

      // If booking is marked as completed, automatically create an invoice
      if (updates.status === "completed" && oldBooking.status !== "completed") {
        try {
          const invoiceDate = updatedBooking!.preferredDate || new Date();
          console.log(`Booking: Completing booking ${id}, using date ${invoiceDate.toISOString()} for invoice`);

          const invoice = await storage.createInvoice({
            customerName: updatedBooking!.customerName,
            services: updatedBooking!.services,
            totalAmount: updatedBooking!.totalAmount,
            cleanerId: updatedBooking!.assignedTo || req.session.userId!,
            status: "completed",
            notes: updatedBooking!.notes || "",
            createdAt: invoiceDate,
            expenses: [],
            photos: [],
            metadata: {
              invoiceType: "daily",
              bookingId: updatedBooking!.id,
              materials: []
            }
          });

          broadcastDataChange('invoices', invoice, 'create');
        } catch (invoiceError) {
          console.error('Error auto-creating invoice from booking:', invoiceError);
        }
      }

      broadcastDataChange('bookings', updatedBooking, 'update');
      res.json(updatedBooking);
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({ error: 'Failed to update booking' });
    }
  });

  app.delete("/api/customer/bookings/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteBooking(id);
      broadcastDataChange('bookings', { id }, 'delete');
      res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
      console.error('Error deleting booking:', error);
      res.status(500).json({ error: 'Failed to delete booking' });
    }
  });

  app.post("/api/customer/bookings/:id/add-service", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { serviceId, quantity } = req.body;

      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const existingServices = booking.services || [];
      const updatedServices = [...existingServices, {
        id: service.id,
        name: service.name,
        price: service.price,
        quantity: quantity
      }];

      const totalAmt = updatedServices.reduce((acc, s) => acc + (parseFloat(s.price) * s.quantity), 0).toFixed(2);

      const updatedBooking = await storage.updateBooking(id, {
        services: updatedServices,
        totalAmount: totalAmt
      });

      broadcastDataChange('bookings', updatedBooking, 'update');
      res.json(updatedBooking);
    } catch (error) {
      console.error('Error adding service to booking:', error);
      res.status(500).json({ error: 'Failed to add service' });
    }
  });

  // Expense management routes
  app.get("/api/expenses", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;

      let expenses;

      // Admin and supervisor can see all expenses, other users only see their own
      if (userRole === "admin" || userRole === "supervisor") {
        expenses = await storage.getAllExpenses();
      } else {
        expenses = await storage.getExpensesByUser(currentUserId);
      }

      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const expenseData = {
        ...req.body,
        userId: currentUserId,
        amount: parseFloat(req.body.amount).toFixed(2),
        date: new Date(req.body.date),
      };

      const expense = await storage.createExpense(expenseData);

      // Invalidate dashboard caches (expenses affect dashboard stats)
      invalidateAllDashboardCaches();

      res.status(201).json(expense);
    } catch (error) {
      console.error('Error creating expense:', error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;
      const expenseId = parseInt(req.params.id);

      // Check if user owns the expense or is supervisor/admin
      const expense = await storage.getExpense(expenseId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      if (expense.userId !== currentUserId && userRole !== "admin" && userRole !== "supervisor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedExpense = await storage.updateExpense(expenseId, {
        ...req.body,
        amount: parseFloat(req.body.amount).toFixed(2),
        date: new Date(req.body.date),
      });

      // Invalidate dashboard caches (expense update affects dashboard stats)
      invalidateAllDashboardCaches();

      res.json(updatedExpense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;
      const expenseId = parseInt(req.params.id);

      // Check if user owns the expense or is supervisor/admin
      const expense = await storage.getExpense(expenseId);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      if (expense.userId !== currentUserId && userRole !== "admin" && userRole !== "supervisor") {
        return res.status(403).json({ message: "Access denied" });
      }

      await storage.deleteExpense(expenseId);

      // Invalidate dashboard caches (expense deletion affects dashboard stats)
      invalidateAllDashboardCaches();

      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Equipment routes
  app.get('/api/equipment', requireAuth, async (req, res) => {
    try {
      const equipment = await storage.getAllEquipment();

      res.json(equipment);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      res.status(500).json({ error: 'Failed to fetch equipment' });
    }
  });

  app.post('/api/equipment', requireAuth, async (req, res) => {
    try {
      const { name, type, status, condition, notes } = req.body;

      const newEquipment = await storage.createEquipment({
        name,
        type,
        status: status || 'available',
        condition,
        notes,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.json(newEquipment);
    } catch (error) {
      console.error('Error creating equipment:', error);
      res.status(500).json({ error: 'Failed to create equipment' });
    }
  });

  app.put('/api/equipment/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, type, status, condition, notes } = req.body;

      const updatedEquipment = await storage.updateEquipment(id, {
        name,
        type,
        status,
        condition,
        notes,
        updatedAt: new Date()
      });

      if (!updatedEquipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      res.json(updatedEquipment);
    } catch (error) {
      console.error('Error updating equipment:', error);
      res.status(500).json({ error: 'Failed to update equipment' });
    }
  });

  app.delete('/api/equipment/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      await storage.deleteEquipment(id);

      res.json({ message: 'Equipment deleted successfully' });
    } catch (error) {
      console.error('Error deleting equipment:', error);
      res.status(500).json({ error: 'Failed to delete equipment' });
    }
  });

  // Settings routes - Read access for all users, write access for supervisors only
  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const allSettings = await storage.getAllSettings();
      res.json(allSettings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.get("/api/settings/:key", requireAuth, async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSetting(key);

      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  });

  app.put("/api/settings/:key", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Supervisors and admin only." });
      }

      const key = req.params.key;
      const { value } = req.body;

      const setting = await storage.updateSetting(key, value);

      // Broadcast the settings update to all connected clients
      broadcastDataChange('settings', setting, 'update');

      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update setting' });
    }
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const userRole = req.session.user!.role;

      if (userRole !== "supervisor" && userRole !== "admin") {
        return res.status(403).json({ error: "Access denied. Supervisors and admin only." });
      }

      const settingData = req.body;
      const setting = await storage.createSetting(settingData);

      // Broadcast the new settings to all connected clients
      broadcastDataChange('settings', setting, 'create');

      res.status(201).json(setting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create setting' });
    }
  });

  // Backup and Restore routes
  app.get("/api/backup/export", requireAdmin, async (req, res) => {
    try {
      const [
        allUsers,
        allServices,
        allInvoices,
        allLocations,
        allExpenses,
        allDebts,
        allDebtPayments,
        allEquipment,
        allSettings,
        allNotifications,
        allUserSettings,
        allInvoiceSettings,
        allCloudflareConfig,
        allCloudflareDnsRecords,
      ] = await Promise.all([
        db.select().from(users),
        db.select().from(services),
        db.select().from(invoices),
        db.select().from(locations),
        db.select().from(expenses),
        db.select().from(debts),
        db.select().from(debtPayments),
        db.select().from(equipment),
        db.select().from(settings),
        db.select().from(notifications),
        db.select().from(userSettings),
        db.select().from(invoiceSettings),
        db.select().from(cloudflareConfig),
        db.select().from(cloudflareDnsRecords),
      ]);

      const backup = {
        version: "1.2",
        timestamp: new Date().toISOString(),
        data: {
          users: allUsers,
          services: allServices,
          invoices: allInvoices,
          locations: allLocations,
          expenses: allExpenses,
          debts: allDebts,
          debtPayments: allDebtPayments,
          equipment: allEquipment,
          settings: allSettings,
          notifications: allNotifications,
          userSettings: allUserSettings,
          invoiceSettings: allInvoiceSettings,
          cloudflareConfig: allCloudflareConfig,
          cloudflareDnsRecords: allCloudflareDnsRecords,
        }
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
      res.json(backup);
    } catch (error) {
      console.error('Backup export error:', error);
      res.status(500).json({ error: 'Failed to export backup' });
    }
  });

  app.post("/api/backup/restore", requireAdmin, async (req, res) => {
    try {
      const backup = req.body;

      if (!backup.version || !backup.data) {
        return res.status(400).json({ error: 'Invalid backup file format' });
      }

      let restoredCount: Record<string, number> = {
        users: 0,
        services: 0,
        invoices: 0,
        locations: 0,
        expenses: 0,
        debts: 0,
        debtPayments: 0,
        equipment: 0,
        settings: 0,
        notifications: 0,
        userSettings: 0,
        invoiceSettings: 0,
        cloudflareConfig: 0,
        cloudflareDnsRecords: 0,
      };

      let skippedCount: Record<string, number> = {
        users: 0,
        services: 0,
      };

      let errors: string[] = [];

      // Restore users (skip if username already exists)
      if (backup.data.users && Array.isArray(backup.data.users)) {
        for (const user of backup.data.users) {
          try {
            const existing = await db.select().from(users).where(eq(users.username, user.username)).limit(1);
            if (existing.length === 0) {
              await db.insert(users).values({
                username: user.username,
                password: user.password,
                name: user.name,
                role: user.role,
                isActive: user.isActive ?? true,
                avatar: user.avatar,
              });
              restoredCount.users++;
            } else {
              skippedCount.users++;
            }
          } catch (error) {
            console.error('Error restoring user:', error);
          }
        }
      }

      // Restore services (skip if service name already exists with same details)
      if (backup.data.services && Array.isArray(backup.data.services)) {
        for (const service of backup.data.services) {
          try {
            const existing = await db.select().from(services).where(eq(services.name, service.name)).limit(1);
            if (existing.length === 0) {
              await db.insert(services).values({
                name: service.name,
                price: service.price,
                description: service.description,
                image: service.image,
                isActive: service.isActive ?? true,
              });
              restoredCount.services++;
            } else {
              skippedCount.services++;
            }
          } catch (error) {
            console.error('Error restoring service:', error);
          }
        }
      }

      // Restore settings (upsert: update if exists, insert if not)
      if (backup.data.settings && Array.isArray(backup.data.settings)) {
        for (const setting of backup.data.settings) {
          try {
            const existing = await db.select().from(settings).where(eq(settings.key, setting.key)).limit(1);
            if (existing.length === 0) {
              await db.insert(settings).values({
                key: setting.key,
                value: setting.value,
                description: setting.description,
                category: setting.category,
              });
              restoredCount.settings++;
            } else {
              await db.update(settings).set({
                value: setting.value,
                description: setting.description,
                category: setting.category,
              }).where(eq(settings.key, setting.key));
              restoredCount.settings++;
            }
          } catch (error) {
            console.error('Error restoring setting:', error);
          }
        }
      }

      // Restore user settings (skip if already exists for that user)
      if (backup.data.userSettings && Array.isArray(backup.data.userSettings)) {
        for (const userSetting of backup.data.userSettings) {
          try {
            const existing = await db.select().from(userSettings)
              .where(and(
                eq(userSettings.userId, userSetting.userId),
                eq(userSettings.settingKey, userSetting.settingKey)
              ))
              .limit(1);
            if (existing.length === 0) {
              await db.insert(userSettings).values({
                userId: userSetting.userId,
                settingKey: userSetting.settingKey,
                isEnabled: userSetting.isEnabled ?? true,
              });
              restoredCount.userSettings++;
            } else {
              skippedCount.userSettings++;
            }
          } catch (error) {
            console.error('Error restoring user setting:', error);
          }
        }
      }

      // Restore invoice settings (only one record, so update if exists)
      if (backup.data.invoiceSettings && Array.isArray(backup.data.invoiceSettings) && backup.data.invoiceSettings.length > 0) {
        try {
          const invoiceSetting = backup.data.invoiceSettings[0];
          const existing = await db.select().from(invoiceSettings).limit(1);
          if (existing.length === 0) {
            await db.insert(invoiceSettings).values({
              headerText: invoiceSetting.headerText,
              footerText: invoiceSetting.footerText,
              headerImage: invoiceSetting.headerImage,
              footerImage: invoiceSetting.footerImage,
              headerWidth: invoiceSetting.headerWidth,
              headerHeight: invoiceSetting.headerHeight,
              footerWidth: invoiceSetting.footerWidth,
              footerHeight: invoiceSetting.footerHeight,
            });
            restoredCount.invoiceSettings++;
          } else {
            await db.update(invoiceSettings).set({
              headerText: invoiceSetting.headerText,
              footerText: invoiceSetting.footerText,
              headerImage: invoiceSetting.headerImage,
              footerImage: invoiceSetting.footerImage,
              headerWidth: invoiceSetting.headerWidth,
              headerHeight: invoiceSetting.headerHeight,
              footerWidth: invoiceSetting.footerWidth,
              footerHeight: invoiceSetting.footerHeight,
            }).where(eq(invoiceSettings.id, existing[0].id));
            restoredCount.invoiceSettings++;
          }
        } catch (error) {
          console.error('Error restoring invoice settings:', error);
          errors.push('invoice settings: ' + (error as Error).message);
        }
      }

      // Restore invoices
      if (backup.data.invoices && Array.isArray(backup.data.invoices)) {
        for (const invoice of backup.data.invoices) {
          try {
            await db.insert(invoices).values({
              customerName: invoice.customerName,
              services: invoice.services,
              totalAmount: invoice.totalAmount,
              notes: invoice.notes,
              photos: invoice.photos,
              cleanerId: invoice.cleanerId,
              status: invoice.status ?? 'completed',
            });
            restoredCount.invoices++;
          } catch (error) {
            console.error('Error restoring invoice:', error);
          }
        }
      }

      // Restore locations
      if (backup.data.locations && Array.isArray(backup.data.locations)) {
        for (const location of backup.data.locations) {
          try {
            await db.insert(locations).values({
              userId: location.userId,
              latitude: location.latitude,
              longitude: location.longitude,
              isWorking: location.isWorking ?? false,
            });
            restoredCount.locations++;
          } catch (error) {
            console.error('Error restoring location:', error);
          }
        }
      }

      // Restore expenses
      if (backup.data.expenses && Array.isArray(backup.data.expenses)) {
        for (const expense of backup.data.expenses) {
          try {
            await db.insert(expenses).values({
              userId: expense.userId,
              description: expense.description,
              amount: expense.amount,
              category: expense.category,
              date: expense.date,
              receipt: expense.receipt,
            });
            restoredCount.expenses++;
          } catch (error) {
            console.error('Error restoring expense:', error);
          }
        }
      }

      // Restore debts
      if (backup.data.debts && Array.isArray(backup.data.debts)) {
        for (const debt of backup.data.debts) {
          try {
            await db.insert(debts).values({
              userId: debt.userId,
              creditorName: debt.creditorName,
              amount: debt.amount,
              description: debt.description,
              dueDate: debt.dueDate,
              priority: debt.priority ?? 'medium',
              category: debt.category,
              status: debt.status ?? 'pending',
            });
            restoredCount.debts++;
          } catch (error) {
            console.error('Error restoring debt:', error);
          }
        }
      }

      // Restore debt payments
      if (backup.data.debtPayments && Array.isArray(backup.data.debtPayments)) {
        for (const payment of backup.data.debtPayments) {
          try {
            await db.insert(debtPayments).values({
              debtId: payment.debtId,
              amount: payment.amount,
              remainingBalance: payment.remainingBalance,
              notes: payment.notes,
            });
            restoredCount.debtPayments++;
          } catch (error) {
            console.error('Error restoring debt payment:', error);
          }
        }
      }

      // Restore equipment
      if (backup.data.equipment && Array.isArray(backup.data.equipment)) {
        for (const item of backup.data.equipment) {
          try {
            await db.insert(equipment).values({
              name: item.name,
              type: item.type,
              status: item.status ?? 'available',
              condition: item.condition,
              purchaseDate: item.purchaseDate,
              lastMaintenance: item.lastMaintenance,
              assignedTo: item.assignedTo,
              notes: item.notes,
            });
            restoredCount.equipment++;
          } catch (error) {
            console.error('Error restoring equipment:', error);
          }
        }
      }

      // Restore notifications
      if (backup.data.notifications && Array.isArray(backup.data.notifications)) {
        for (const notification of backup.data.notifications) {
          try {
            await db.insert(notifications).values({
              userId: notification.userId,
              title: notification.title,
              message: notification.message,
              type: notification.type ?? 'info',
              isRead: notification.isRead ?? false,
              relatedId: notification.relatedId,
              relatedType: notification.relatedType,
              metadata: notification.metadata,
            });
            restoredCount.notifications++;
          } catch (error) {
            console.error('Error restoring notification:', error);
          }
        }
      }

      // Restore Cloudflare config
      if (backup.data.cloudflareConfig && Array.isArray(backup.data.cloudflareConfig)) {
        for (const config of backup.data.cloudflareConfig) {
          try {
            const existing = await db.select().from(cloudflareConfig).where(eq(cloudflareConfig.zoneId, config.zoneId)).limit(1);
            if (existing.length === 0) {
              await db.insert(cloudflareConfig).values({
                apiToken: config.apiToken,
                zoneId: config.zoneId,
                zoneName: config.zoneName,
                isActive: config.isActive ?? true,
              });
              restoredCount.cloudflareConfig++;
            }
          } catch (error) {
            console.error('Error restoring cloudflare config:', error);
          }
        }
      }

      // Restore Cloudflare DNS records
      if (backup.data.cloudflareDnsRecords && Array.isArray(backup.data.cloudflareDnsRecords)) {
        for (const record of backup.data.cloudflareDnsRecords) {
          try {
            const existing = await db.select().from(cloudflareDnsRecords).where(eq(cloudflareDnsRecords.recordId, record.recordId)).limit(1);
            if (existing.length === 0) {
              await db.insert(cloudflareDnsRecords).values({
                recordId: record.recordId,
                zoneId: record.zoneId,
                type: record.type,
                name: record.name,
                content: record.content,
                ttl: record.ttl ?? 3600,
                proxied: record.proxied ?? false,
                priority: record.priority,
              });
              restoredCount.cloudflareDnsRecords++;
            }
          } catch (error) {
            console.error('Error restoring cloudflare DNS record:', error);
          }
        }
      }

      // Reset Postgres sequences for all tables with auto-increment IDs
      const sequenceResets = [
        { table: 'users', sequence: 'users_id_seq' },
        { table: 'services', sequence: 'services_id_seq' },
        { table: 'invoices', sequence: 'invoices_id_seq' },
        { table: 'locations', sequence: 'locations_id_seq' },
        { table: 'expenses', sequence: 'expenses_id_seq' },
        { table: 'debts', sequence: 'debts_id_seq' },
        { table: 'debt_payments', sequence: 'debt_payments_id_seq' },
        { table: 'equipment', sequence: 'equipment_id_seq' },
        { table: 'settings', sequence: 'settings_id_seq' },
        { table: 'notifications', sequence: 'notifications_id_seq' },
        { table: 'user_settings', sequence: 'user_settings_id_seq' },
        { table: 'invoice_settings', sequence: 'invoice_settings_id_seq' },
        { table: 'cloudflare_config', sequence: 'cloudflare_config_id_seq' },
        { table: 'cloudflare_dns_records', sequence: 'cloudflare_dns_records_id_seq' },
      ];

      for (const { table, sequence } of sequenceResets) {
        try {
          await db.execute(sql.raw(`SELECT setval('${sequence}', COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1, false)`));
        } catch (error) {
          console.error(`Error resetting sequence for ${table}:`, error);
          errors.push(`sequence reset for ${table}: ${(error as Error).message}`);
        }
      }

      // Invalidate all caches after restore
      invalidateAllDashboardCaches();

      res.json({
        message: 'Backup restored successfully',
        restored: restoredCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined,
        note: 'All data from the backup has been restored. Database sequences have been reset to prevent ID conflicts.'
      });
    } catch (error) {
      console.error('Backup restore error:', error);
      res.status(500).json({ error: 'Failed to restore backup' });
    }
  });

  app.delete("/api/backup/clear-data", requireAdmin, async (req, res) => {
    try {
      const { tables } = req.body;

      const ALLOWED_TABLES = ['services', 'invoices', 'expenses', 'debts', 'equipment', 'notifications', 'locations'];

      if (!Array.isArray(tables) || tables.length === 0) {
        return res.status(400).json({ error: 'Please specify tables to clear' });
      }

      const invalidTables = tables.filter((table: string) => !ALLOWED_TABLES.includes(table));
      if (invalidTables.length > 0) {
        return res.status(400).json({
          error: 'Invalid tables specified',
          invalidTables,
          allowedTables: ALLOWED_TABLES
        });
      }

      let deletedCount: any = {};

      for (const tableName of tables) {
        try {
          switch (tableName) {
            case 'services':
              await db.delete(services);
              deletedCount.services = 'cleared';
              break;
            case 'invoices':
              await db.delete(invoices);
              deletedCount.invoices = 'cleared';
              break;
            case 'expenses':
              await db.delete(expenses);
              deletedCount.expenses = 'cleared';
              break;
            case 'debts':
              await db.delete(debts);
              deletedCount.debts = 'cleared';
              break;
            case 'equipment':
              await db.delete(equipment);
              deletedCount.equipment = 'cleared';
              break;
            case 'notifications':
              await db.delete(notifications);
              deletedCount.notifications = 'cleared';
              break;
            case 'locations':
              await db.delete(locations);
              deletedCount.locations = 'cleared';
              break;
          }
        } catch (error) {
          console.error(`Error clearing ${tableName}:`, error);
          deletedCount[tableName] = 'error';
        }
      }

      invalidateAllDashboardCaches();

      res.json({
        message: 'Data cleared successfully',
        cleared: deletedCount
      });
    } catch (error) {
      console.error('Clear data error:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.get("/api/notifications/unread", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const notifications = await storage.getUnreadNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch unread notifications' });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.session.userId!;
      await storage.markNotificationAsRead(notificationId, userId);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.session.userId!;
      await storage.deleteNotification(notificationId, userId);
      res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notification' });
    }
  });

  let httpServer: Server;

  // If SSL paths are configured, attempt to create an HTTPS server so
  // WebSocket and HTTP traffic share the same TLS-enabled server.
  if (process.env.SSL_KEY_PATH && process.env.SSL_CERT_PATH) {
    const httpsServer = createHttpsServer(app);
    if (httpsServer) {
      // Cast https.Server to the http.Server type for WS compatibility
      httpServer = httpsServer as unknown as Server;
    } else {
      // Fallback to plain HTTP if HTTPS creation failed
      httpServer = createHttpServer(app);
    }
  } else {
    httpServer = createHttpServer(app);
  }

  // Setup enhanced WebSocket server for real-time location tracking
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    clientTracking: true,
    perMessageDeflate: false
  });

  let broadcastTimer: NodeJS.Timeout | null = null;

  // Helper function to broadcast data changes
  const broadcastDataChange = (dataType: string, data: any, action: 'create' | 'update' | 'delete') => {
    const broadcastMessage = JSON.stringify({
      type: 'data_change',
      dataType,
      action,
      data,
      timestamp: new Date().toISOString()
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(broadcastMessage);
        } catch (error) {
          console.error('Error sending data change to client:', error);
        }
      }
    });
    console.log(`Broadcasted ${action} for ${dataType}:`, data);
  };


  // Broadcast active locations to all clients every 5 seconds
  const broadcastActiveLocations = async () => {
    try {
      const activeLocations = await storage.getActiveLocations();
      const locationsWithUsers = await Promise.all(
        activeLocations.map(async (location) => {
          const user = await storage.getUser(location.userId);
          return {
            ...location,
            user: user ? {
              id: user.id,
              name: user.name,
              avatar: user.avatar || null
            } : null
          };
        })
      );

      const broadcastMessage = JSON.stringify({
        type: 'locations_update',
        data: locationsWithUsers,
        timestamp: new Date().toISOString()
      });

      // Send to all connected clients
      const connectedClients = Array.from(wss.clients).filter(
        client => client.readyState === WebSocket.OPEN
      );

      connectedClients.forEach(client => {
        try {
          client.send(broadcastMessage);
        } catch (error) {
          console.error('Error sending to client:', error);
        }
      });

      if (connectedClients.length > 0) {
        console.log(`Broadcast sent to ${connectedClients.length} clients: ${locationsWithUsers.length} locations`);
      }
    } catch (error) {
      console.error('Error broadcasting locations:', error);
    }
  };

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected, total clients:', wss.clients.size);

    // Send initial location data immediately when client connects
    broadcastActiveLocations();

    // Start periodic broadcast if not already running (optimized to 10s interval)
    if (!broadcastTimer && wss.clients.size > 0) {
      broadcastTimer = setInterval(broadcastActiveLocations, 10000);
      console.log('Started periodic location broadcast');
    }

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000);

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);

        if (data.type === 'location_update') {
          console.log(`Location update from user ${data.userId}:`, {
            lat: data.latitude,
            lng: data.longitude,
            isWorking: data.isWorking
          });

          // Update location in database
          await storage.updateUserLocation({
            userId: data.userId,
            latitude: data.latitude,
            longitude: data.longitude,
            isWorking: data.isWorking,
          });

          // Immediately broadcast updated locations to all clients
          await broadcastActiveLocations();
        } else if (data.type === 'ping') {
          // Respond to ping with pong
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected, remaining clients:', wss.clients.size - 1);
      clearInterval(heartbeatInterval);

      // Stop periodic broadcast if no clients connected
      if (wss.clients.size <= 1 && broadcastTimer) {
        clearInterval(broadcastTimer);
        broadcastTimer = null;
        console.log('Stopped periodic location broadcast');
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clearInterval(heartbeatInterval);
    });
  });


  // Invoice settings routes (for header/footer management)
  app.get("/api/invoice-settings", async (req, res) => {
    try {
      const settings = await storage.getInvoiceSettings();
      res.json(settings || {
        headerText: "",
        footerText: "",
        headerImage: null,
        footerImage: null,
        headerWidth: "100",
        headerHeight: "80",
        footerWidth: "100",
        footerHeight: "60"
      });
    } catch (error) {
      console.error("Error fetching invoice settings:", error);
      res.status(500).json({ message: "Failed to fetch invoice settings" });
    }
  });

  app.post("/api/invoice-settings", async (req, res) => {
    try {
      const settingsData = req.body;
      const settings = await storage.updateInvoiceSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating invoice settings:", error);
      res.status(500).json({ message: "Failed to save invoice settings" });
    }
  });

  // SMS Service Configuration
  const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  // Format Iraqi phone numbers properly
  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+')) return phone;
    return `+964${phone.replace(/^0/, '')}`;
  };

  // Twilio Verify Service for Phone Verification
  const sendVerificationCode = async (to: string) => {
    try {
      const formattedPhone = formatPhoneNumber(to);
      const verification = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID || "VA3722ab1d0d0bc1904c1339393417a135")
        .verifications
        .create({ to: formattedPhone, channel: 'sms' });

      console.log('Verification code sent:', verification.sid);
      return verification;
    } catch (error) {
      console.error('Verification sending error:', error);
      throw error;
    }
  };

  // Verify the phone number with code
  const verifyPhoneCode = async (to: string, code: string) => {
    try {
      const formattedPhone = formatPhoneNumber(to);
      const verification = await twilioClient.verify.v2
        .services(process.env.TWILIO_VERIFY_SERVICE_SID || "VA3722ab1d0d0bc1904c1339393417a135")
        .verificationChecks
        .create({ to: formattedPhone, code });

      console.log('Verification check result:', verification.status);
      return verification;
    } catch (error) {
      console.error('Verification check error:', error);
      throw error;
    }
  };

  // SMS Notification Service (for general messages)
  const sendSMS = async (to: string, message: string) => {
    try {
      const formattedPhone = formatPhoneNumber(to);
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER || '+12295455042',
        to: formattedPhone
      });
      console.log('SMS sent successfully:', result.sid);
      return result;
    } catch (error) {
      console.error('SMS sending error:', error);
      throw error;
    }
  };


  // Phone verification endpoints using Twilio Verify API
  app.post("/api/phone-verification/send", async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Check if Twilio is configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return res.status(500).json({
          error: "SMS service not configured",
          details: "Twilio credentials missing"
        });
      }

      const verification = await sendVerificationCode(phone);
      res.json({
        success: true,
        verificationSid: verification.sid,
        message: "Verification code sent successfully",
        to: phone,
        status: verification.status
      });
    } catch (error: any) {
      console.error('Verification API error:', error);

      let errorMessage = "Failed to send verification code";
      if (error.code === 21608) {
        errorMessage = "Phone number needs to be verified in Twilio console for trial accounts";
      } else if (error.code === 20003) {
        errorMessage = "Authentication failed - check your Twilio credentials";
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({
        error: errorMessage,
        code: error.code || 'UNKNOWN',
        details: error.message
      });
    }
  });

  app.post("/api/phone-verification/verify", async (req, res) => {
    try {
      const { phone, code } = req.body;

      if (!phone || !code) {
        return res.status(400).json({ error: "Phone number and verification code are required" });
      }

      const verification = await verifyPhoneCode(phone, code);

      if (verification.status === 'approved') {
        res.json({
          success: true,
          message: "Phone number verified successfully",
          status: verification.status
        });
      } else {
        res.status(400).json({
          error: "Invalid verification code",
          status: verification.status
        });
      }
    } catch (error: any) {
      console.error('Verification check API error:', error);
      res.status(400).json({
        error: "Invalid or expired verification code",
        details: error.message
      });
    }
  });

  // Send SMS notification endpoint (for general messages)
  app.post("/api/sms/send", requireAuth, async (req, res) => {
    try {
      const { phone, message } = req.body;

      if (!phone || !message) {
        return res.status(400).json({ error: "Phone number and message are required" });
      }

      // Check if Twilio is configured
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return res.status(500).json({
          error: "SMS service not configured",
          details: "Twilio credentials missing"
        });
      }

      const result = await sendSMS(phone, message);
      res.json({
        success: true,
        messageId: result.sid,
        message: "SMS sent successfully",
        to: phone
      });
    } catch (error: any) {
      console.error('SMS API error:', error);

      // Handle specific Twilio errors
      let errorMessage = "Failed to send SMS";
      if (error.code === 21608) {
        errorMessage = "Phone number needs to be verified in Twilio console for trial accounts";
      } else if (error.code === 20003) {
        errorMessage = "Authentication failed - check your Twilio credentials";
      } else if (error.message) {
        errorMessage = error.message;
      }

      res.status(500).json({
        error: errorMessage,
        code: error.code || 'UNKNOWN',
        details: error.message
      });
    }
  });

  // Invoice settings routes (for header/footer management)
  app.get("/api/invoice-settings", async (req, res) => {
    try {
      const settings = await storage.getInvoiceSettings();
      res.json(settings || {
        headerText: "",
        footerText: "",
        headerImage: null,
        footerImage: null,
        headerWidth: "100",
        headerHeight: "80",
        footerWidth: "100",
        footerHeight: "60"
      });
    } catch (error) {
      console.error("Error fetching invoice settings:", error);
      res.status(500).json({ message: "Failed to fetch invoice settings" });
    }
  });

  app.post("/api/invoice-settings", async (req, res) => {
    try {
      const settingsData = req.body;
      const settings = await storage.updateInvoiceSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating invoice settings:", error);
      res.status(500).json({ message: "Failed to save invoice settings" });
    }
  });

  // Security monitoring routes (Admin only)
  app.get("/api/security/report", requireAdmin, async (req, res) => {
    try {
      const report = securityMonitor.getSecurityReport();
      res.json(report);
    } catch (error) {
      console.error('Error generating security report:', error);
      res.status(500).json({ error: 'Failed to generate security report' });
    }
  });

  app.post("/api/security/unblock-ip", requireAdmin, async (req, res) => {
    try {
      const { ip } = req.body;
      if (!ip) {
        return res.status(400).json({ error: 'IP address is required' });
      }

      securityMonitor.unblockIP(ip);
      res.json({ message: `IP ${ip} has been unblocked` });
    } catch (error) {
      console.error('Error unblocking IP:', error);
      res.status(500).json({ error: 'Failed to unblock IP' });
    }
  });

  app.post("/api/security/clear-logs", requireAdmin, async (req, res) => {
    try {
      securityMonitor.clearSecurityLogs();
      res.json({ message: 'Security logs cleared successfully' });
    } catch (error) {
      console.error('Error clearing security logs:', error);
      res.status(500).json({ error: 'Failed to clear security logs' });
    }
  });

  // Debt management routes
  app.get("/api/debts", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;

      let debts: any[] = [];

      // Admin and supervisor can see all debts, other users only see their own
      if (userRole === "admin" || userRole === "supervisor") {
        debts = await storage.getAllDebts();
      } else {
        debts = await storage.getDebtsByUser(currentUserId);
      }

      // Ensure debts is always an array
      if (!Array.isArray(debts)) {
        debts = [];
      }

      res.json(debts);
    } catch (error: any) {
      console.error('Error fetching debts:', error);
      res.status(500).json({ error: "Failed to fetch debts", message: error?.message });
    }
  });

  app.post("/api/debts", requireAuth, async (req, res) => {
    try {
      const currentUserId = req.session.userId!;
      const debtData = {
        ...req.body,
        userId: currentUserId,
        amount: parseFloat(req.body.amount).toFixed(2),
        dueDate: new Date(req.body.dueDate),
        status: 'pending'
      };

      const debt = await storage.createDebt(debtData);

      // Invalidate dashboard caches (debts affect dashboard stats)
      invalidateAllDashboardCaches();

      res.status(201).json(debt);
    } catch (error: any) {
      console.error('Error creating debt:', error);
      res.status(500).json({ message: "Failed to create debt" });
    }
  });

  // Support both PUT and PATCH for updates
  const updateDebtHandler = async (req: Request, res: Response) => {
    try {
      const currentUserId = req.session.userId!;
      const userRole = req.session.user!.role;
      const debtId = parseInt(req.params.id);

      // Check if user owns the debt or is supervisor/admin
      const debt = await storage.getDebt(debtId);
      if (!debt) {
        return res.status(404).json({ message: "Debt not found" });
      }

      if (debt.userId !== currentUserId && userRole !== "admin" && userRole !== "supervisor") {
        return res.status(403).json({ message: "Access denied" });
      }

      const updatedData: any = { ...req.body };

      // Only process these fields if they're provided
      if (req.body.amount !== undefined) {
        updatedData.amount = parseFloat(req.body.amount).toFixed(2);
      }
      if (req.body.dueDate) {
        updatedData.dueDate = new Date(req.body.dueDate);
      }

      const updatedDebt = await storage.updateDebt(debtId, updatedData);

      // Broadcast the debt update to all connected clients
      broadcastDataChange('debts', updatedDebt, 'update');

      res.json(updatedDebt);
    } catch (error: any) {
      console.error('Error updating debt:', error);
      res.status(500).json({ message: "Failed to update debt" });
    }
  };

  app.put("/api/debts/:id", requireAuth, updateDebtHandler);
  app.patch("/api/debts/:id", requireAuth, updateDebtHandler);

  // Create debt payment record
  app.post("/api/debts/:id/payments", requireAuth, async (req, res) => {
    try {
      const debtId = parseInt(req.params.id);
      const userId = req.session.userId!;
      const userRole = req.session.user!.role;

      // First verify the debt belongs to the user or is accessible by admin/supervisor
      const debt = await storage.getDebt(debtId);
      if (!debt) {
        return res.status(404).json({ error: "Debt not found" });
      }

      if (debt.userId !== userId && userRole !== "admin" && userRole !== "supervisor") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Create the payment record
      const { amount, remainingBalance, notes } = req.body;

      if (!amount || !remainingBalance) {
        return res.status(400).json({ error: "Amount and remaining balance are required" });
      }

      const payment = await storage.createDebtPayment({
        debtId,
        amount,
        remainingBalance,
        notes: notes || undefined
      });

      // Broadcast the payment creation to all connected clients
      broadcastDataChange('debt_payments', payment, 'create');

      res.status(201).json(payment);
    } catch (error: any) {
      console.error('Error creating debt payment:', error);
      res.status(500).json({ message: "Failed to create payment record", error: error?.message });
    }
  });

  // Get debt payment history
  app.get("/api/debts/:id/payments", requireAuth, async (req, res) => {
    try {
      const debtId = parseInt(req.params.id);
      const userId = req.session.userId!; // Ensure userId is available

      // First verify the debt belongs to the user or is accessible by admin/supervisor
      const debt = await storage.getDebt(debtId);
      if (!debt) {
        return res.status(404).json({ error: "Debt not found" });
      }

      const userRole = req.session.user!.role;
      if (debt.userId !== userId && userRole !== "admin" && userRole !== "supervisor") {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get payment history
      const payments = await storage.getDebtPayments(debtId);
      res.json(payments);
    } catch (error: any) {
      console.error('Error fetching debt payments:', error);
      res.status(500).json({ message: "Failed to fetch payment history", error: error?.message });
    }
  });

  // Get all payment history records
  app.get("/api/payment-history", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const userRole = req.session.user!.role;

      // Admin and supervisor can see all payment history, others see only their own
      let payments;
      if (userRole === "admin" || userRole === "supervisor") {
        payments = await storage.getAllDebtPayments();
      } else {
        payments = await storage.getAllDebtPayments(userId);
      }

      res.json(payments);
    } catch (error: any) {
      console.error('Error fetching all payment history:', error);
      res.status(500).json({ message: "Failed to fetch payment history", error: error?.message });
    }
  });

  app.delete("/api/debts/:id", requireAuth, async (req, res) => {
    try {
      const debtId = parseInt(req.params.id);
      const userId = req.session.userId!;
      const userRole = req.session.user!.role;

      // Check if user owns the debt or is supervisor/admin
      const debt = await storage.getDebt(debtId);
      if (!debt) {
        return res.status(404).json({ message: "Debt not found" });
      }

      if (debt.userId !== userId && userRole !== "admin" && userRole !== "supervisor") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Then delete the debt
      await storage.deleteDebt(debtId);

      // Invalidate dashboard caches (debt deletion affects dashboard stats)
      invalidateAllDashboardCaches();

      // Broadcast the debt deletion to all connected clients
      broadcastDataChange('debts', { id: debtId }, 'delete');

      res.json({ message: "Debt deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting debt:', error);
      res.status(500).json({ message: "Failed to delete debt", error: error?.message });
    }
  });

  // Cloudflare DNS Management Routes
  app.get("/api/cloudflare/config", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getCloudflareConfig();
      if (!config) {
        return res.json(null);
      }
      const { apiToken, ...safeConfig } = config;
      res.json({ ...safeConfig, apiToken: apiToken ? '***' : null });
    } catch (error: any) {
      console.error('Error fetching Cloudflare config:', error);
      res.status(500).json({ message: "Failed to fetch configuration", error: error?.message });
    }
  });

  app.post("/api/cloudflare/config", requireAdmin, async (req, res) => {
    try {
      const { apiToken, zoneId, zoneName } = req.body;
      if (!apiToken || !zoneId || !zoneName) {
        return res.status(400).json({ message: "API Token, Zone ID, and Zone Name are required" });
      }

      const existingConfig = await storage.getCloudflareConfig();
      let config;

      if (existingConfig) {
        config = await storage.updateCloudflareConfig(existingConfig.id, { apiToken, zoneId, zoneName, isActive: true });
      } else {
        config = await storage.createCloudflareConfig({ apiToken, zoneId, zoneName, isActive: true });
      }

      const { apiToken: _, ...safeConfig } = config!;
      res.json({ ...safeConfig, apiToken: '***' });
    } catch (error: any) {
      console.error('Error saving Cloudflare config:', error);
      res.status(500).json({ message: "Failed to save configuration", error: error?.message });
    }
  });

  app.get("/api/cloudflare/dns/records", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getCloudflareConfig();
      if (!config) {
        return res.json([]);
      }

      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records`, {
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Cloudflare API error:', response.status, response.statusText);
        return res.status(response.status).json({
          message: "Failed to connect to Cloudflare API. Please check your API token and Zone ID.",
          status: response.status
        });
      }

      const data = await response.json();
      if (!data.success) {
        console.error('Cloudflare API returned errors:', data.errors);
        return res.status(400).json({
          message: "Failed to fetch DNS records from Cloudflare",
          errors: data.errors
        });
      }

      for (const record of data.result) {
        const existingRecord = await storage.getDnsRecord(record.id);
        if (!existingRecord) {
          await storage.createDnsRecord({
            recordId: record.id,
            zoneId: record.zone_id,
            type: record.type,
            name: record.name,
            content: record.content,
            ttl: record.ttl,
            proxied: record.proxied || false,
            priority: record.priority || null
          });
        } else {
          await storage.updateDnsRecord(record.id, {
            type: record.type,
            name: record.name,
            content: record.content,
            ttl: record.ttl,
            proxied: record.proxied || false,
            priority: record.priority || null
          });
        }
      }

      res.json(data.result);
    } catch (error: any) {
      console.error('Error fetching DNS records:', error);
      res.status(500).json({ message: "Failed to fetch DNS records", error: error?.message });
    }
  });

  app.post("/api/cloudflare/dns/records", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getCloudflareConfig();
      if (!config) {
        return res.status(404).json({ message: "Cloudflare configuration not found" });
      }

      const { type, name, content, ttl = 3600, proxied = false, priority } = req.body;
      if (!type || !name || !content) {
        return res.status(400).json({ message: "Type, name, and content are required" });
      }

      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, name, content, ttl, proxied, priority })
      });

      const data = await response.json();
      if (!data.success) {
        return res.status(400).json({ message: "Failed to create DNS record", errors: data.errors });
      }

      await storage.createDnsRecord({
        recordId: data.result.id,
        zoneId: data.result.zone_id,
        type: data.result.type,
        name: data.result.name,
        content: data.result.content,
        ttl: data.result.ttl,
        proxied: data.result.proxied || false,
        priority: data.result.priority || null
      });

      res.json(data.result);
    } catch (error: any) {
      console.error('Error creating DNS record:', error);
      res.status(500).json({ message: "Failed to create DNS record", error: error?.message });
    }
  });

  app.patch("/api/cloudflare/dns/records/:recordId", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getCloudflareConfig();
      if (!config) {
        return res.status(404).json({ message: "Cloudflare configuration not found" });
      }

      const { recordId } = req.params;
      const { type, name, content, ttl, proxied, priority } = req.body;

      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, name, content, ttl, proxied, priority })
      });

      const data = await response.json();
      if (!data.success) {
        return res.status(400).json({ message: "Failed to update DNS record", errors: data.errors });
      }

      await storage.updateDnsRecord(recordId, {
        type: data.result.type,
        name: data.result.name,
        content: data.result.content,
        ttl: data.result.ttl,
        proxied: data.result.proxied || false,
        priority: data.result.priority || null
      });

      res.json(data.result);
    } catch (error: any) {
      console.error('Error updating DNS record:', error);
      res.status(500).json({ message: "Failed to update DNS record", error: error?.message });
    }
  });

  app.delete("/api/cloudflare/dns/records/:recordId", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getCloudflareConfig();
      if (!config) {
        return res.status(404).json({ message: "Cloudflare configuration not found" });
      }

      const { recordId } = req.params;

      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data.success) {
        return res.status(400).json({ message: "Failed to delete DNS record", errors: data.errors });
      }

      await storage.deleteDnsRecord(recordId);
      res.json({ message: "DNS record deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting DNS record:', error);
      res.status(500).json({ message: "Failed to delete DNS record", error: error?.message });
    }
  });

  // Verify DNS record propagation
  app.get("/api/cloudflare/dns/verify/:recordId", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getCloudflareConfig();
      if (!config) {
        return res.status(404).json({ message: "Cloudflare configuration not found" });
      }

      const { recordId } = req.params;

      // Get the DNS record from Cloudflare
      const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${config.zoneId}/dns_records/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (!data.success) {
        return res.status(400).json({ message: "Failed to verify DNS record", errors: data.errors });
      }

      const record = data.result;

      // Check DNS propagation using a public DNS resolver
      try {
        const dnsCheckUrl = `https://dns.google/resolve?name=${record.name}&type=${record.type}`;
        const dnsResponse = await fetch(dnsCheckUrl);
        const dnsData = await dnsResponse.json();

        const isPropagated = dnsData.Answer && dnsData.Answer.some((answer: any) => {
          return answer.data === record.content || answer.data.endsWith(record.content);
        });

        res.json({
          record,
          propagation: {
            isPropagated,
            checkedAt: new Date().toISOString(),
            resolver: "Google DNS",
            details: dnsData
          }
        });
      } catch (dnsError) {
        console.error('DNS check error:', dnsError);
        res.json({
          record,
          propagation: {
            isPropagated: null,
            error: "Could not verify DNS propagation",
            checkedAt: new Date().toISOString()
          }
        });
      }
    } catch (error: any) {
      console.error('Error verifying DNS record:', error);
      res.status(500).json({ message: "Failed to verify DNS record", error: error?.message });
    }
  });

  return httpServer;
}