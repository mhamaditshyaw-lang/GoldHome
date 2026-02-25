import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import "./types"; // Import type definitions

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function initializeDatabase() {
  const maxRetries = 5;
  let retryCount = 0;

  // Check if DATABASE_URL is properly configured
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy')) {
    log("⚠️  Database not configured. Skipping initialization.");
    log("Please set DATABASE_URL environment variable to enable database features.");
    return;
  }

  while (retryCount < maxRetries) {
    try {
      log(`Checking database connection and initializing... (attempt ${retryCount + 1}/${maxRetries})`);

      const existingUsers = await db.select().from(users).limit(1);

      if (existingUsers.length === 0) {
        log("No users found. Creating default admin user...");

        const hashedPassword = await bcrypt.hash("admin123", 10);

        await db.insert(users).values({
          username: "admin",
          password: hashedPassword,
          name: "Admin User",
          role: "admin",
          isActive: true,
        });

        log("✓ Default admin user created successfully (username: admin, password: admin123)");
      } else {
        log("✓ Database initialized. Users exist.");
      }
      return; // Success, exit function
    } catch (error: any) {
      retryCount++;
      if (error.message.includes("endpoint has been disabled") || error.message.includes("temporarily unavailable")) {
        if (retryCount < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          log(`Database is waking up... retrying in ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          log(`⚠ Database initialization failed after ${maxRetries} attempts. Will retry on first login.`);
        }
      } else {
        log(`Database initialization error: ${error.message}`);
        log("⚠️  Continuing without database. Some features may not work without proper DATABASE_URL.");
        return;
      }
    }
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    // if (path.startsWith("/api")) {
    let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
    if (capturedJsonResponse) {
      logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
    }

    if (logLine.length > 80) {
      logLine = logLine.slice(0, 79) + "…";
    }

    log(logLine);
    // }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize database with default admin user if needed
  await initializeDatabase();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Add user authentication middleware
  app.use(async (req, res, next) => {
    if (req.session?.userId) {
      try {
        const [user] = await db.select().from(users).where(eq(users.id, req.session.userId)).limit(1);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    }
    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use port from environment or default to 3000
  const port = process.env.PORT || 3000;
  // On Windows the `reusePort` option is not supported and will throw ENOTSUP.
  // Only enable it on non-Windows platforms (e.g., Linux) where it's supported.
  const listenOptions: any = {
    port,
    host: "0.0.0.0",
  };

  if (process.platform !== 'win32') {
    listenOptions.reusePort = true;
  }

  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
})();