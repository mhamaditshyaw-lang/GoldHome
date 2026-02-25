
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SecurityEvent {
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access' | 'permission_violation';
  userId?: number;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

class SecurityMonitor {
  private failedLogins = new Map<string, RateLimitEntry>();
  private apiRequests = new Map<string, RateLimitEntry>();
  private securityEvents: SecurityEvent[] = [];
  private blockedIPs = new Set<string>();
  private suspiciousPatterns = [
    /(\bor\b|\bunion\b|\bselect\b|\bdrop\b|\bdelete\b|\binsert\b|\bupdate\b)/i, // SQL injection
    /(\<script\>|\<\/script\>|\balert\(|\bjavascript:)/i, // XSS
    /(\.\.|\/etc\/passwd|\/proc\/|\.php|\.asp)/i, // Path traversal
  ];

  // Rate limiting configuration (more generous for development)
  private readonly RATE_LIMITS = {
    login: { maxAttempts: 20, windowMs: 15 * 60 * 1000 }, // 20 attempts per 15 minutes
    api: { maxAttempts: 1000, windowMs: 60 * 1000 }, // 1000 requests per minute
    failedLogin: { maxAttempts: 50, windowMs: 60 * 60 * 1000 }, // 50 failed logins per hour
  };

  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>) {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.securityEvents.push(securityEvent);

    // Keep only last 1000 events to prevent memory issues
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }

    // Log critical events immediately
    if (event.severity === 'critical' || event.severity === 'high') {
      console.error(`🚨 SECURITY ALERT [${event.severity.toUpperCase()}]:`, event);
    }

    // Auto-block IPs with critical violations
    if (event.severity === 'critical') {
      this.blockedIPs.add(event.ip);
      console.error(`🔒 IP ${event.ip} has been automatically blocked due to critical security violation`);
    }
  }

  checkRateLimit(key: string, type: keyof typeof this.RATE_LIMITS): boolean {
    const config = this.RATE_LIMITS[type];
    const now = Date.now();
    const entry = this.getOrCreateRateLimitEntry(key, now, config.windowMs);

    if (entry.blocked) {
      return false;
    }

    entry.count++;

    if (entry.count > config.maxAttempts) {
      entry.blocked = true;
      return false;
    }

    return true;
  }

  private getOrCreateRateLimitEntry(key: string, now: number, windowMs: number): RateLimitEntry {
    const map = key.includes('login') ? this.failedLogins : this.apiRequests;
    let entry = map.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
        blocked: false,
      };
      map.set(key, entry);
    }

    return entry;
  }

  checkForSuspiciousContent(content: string): boolean {
    return this.suspiciousPatterns.some(pattern => pattern.test(content));
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  getSecurityReport() {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = this.securityEvents.filter(event => event.timestamp > last24Hours);

    return {
      totalEvents: recentEvents.length,
      criticalEvents: recentEvents.filter(e => e.severity === 'critical').length,
      highSeverityEvents: recentEvents.filter(e => e.severity === 'high').length,
      blockedIPs: Array.from(this.blockedIPs),
      failedLoginAttempts: recentEvents.filter(e => e.type === 'failed_login').length,
      events: recentEvents.slice(-50), // Last 50 events
    };
  }

  unblockIP(ip: string) {
    this.blockedIPs.delete(ip);
    this.failedLogins.delete(ip);
    this.apiRequests.delete(ip);
    console.log(`✅ IP ${ip} has been unblocked`);
  }

  clearSecurityLogs() {
    this.securityEvents = [];
    console.log('🧹 Security logs cleared');
  }
}

export const securityMonitor = new SecurityMonitor();

// Enhanced IP blocking middleware
export const ipBlockingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  if (securityMonitor.isIPBlocked(clientIP)) {
    securityMonitor.logSecurityEvent({
      type: 'suspicious_activity',
      ip: clientIP,
      userAgent: req.get('User-Agent') || 'unknown',
      details: { reason: 'Blocked IP attempted access', path: req.path },
      severity: 'high',
    });

    return res.status(403).json({ 
      message: 'Access denied for security reasons',
      code: 'IP_BLOCKED' 
    });
  }

  next();
};

// Enhanced rate limiting middleware
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const isLoginAttempt = req.path.includes('/auth/login') || req.path.includes('/customer-auth/login');
  const isSessionCheck = req.path.includes('/auth/session') || req.path.includes('/customer-auth/session');
  
  // Exempt session checks from rate limiting to prevent app initialization issues
  if (isSessionCheck) {
    return next();
  }

  const limitType = isLoginAttempt ? 'login' : 'api';
  const rateLimitKey = `${limitType}:${clientIP}`;

  if (!securityMonitor.checkRateLimit(rateLimitKey, limitType)) {
    securityMonitor.logSecurityEvent({
      type: 'suspicious_activity',
      ip: clientIP,
      userAgent: req.get('User-Agent') || 'unknown',
      details: { 
        reason: 'Rate limit exceeded', 
        path: req.path,
        type: limitType 
      },
      severity: isLoginAttempt ? 'high' : 'medium',
    });

    return res.status(429).json({ 
      message: 'Rate limit exceeded. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED' 
    });
  }

  next();
};

// Input validation middleware
export const inputValidationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Check all input fields for suspicious content
  const checkObject = (obj: any, path = ''): boolean => {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Skip base64 image data validation
        const isBase64Image = value.startsWith('data:image/');
        
        if (!isBase64Image && securityMonitor.checkForSuspiciousContent(value)) {
          securityMonitor.logSecurityEvent({
            type: 'suspicious_activity',
            ip: clientIP,
            userAgent: req.get('User-Agent') || 'unknown',
            details: { 
              reason: 'Suspicious input detected',
              field: `${path}${key}`,
              value: value.substring(0, 100) // Log first 100 chars only
            },
            severity: 'high',
          });
          return true;
        }
      } else if (typeof value === 'object' && value !== null) {
        if (checkObject(value, `${path}${key}.`)) {
          return true;
        }
      }
    }
    return false;
  };

  // Check body, query, and params
  if (req.body && checkObject(req.body, 'body.')) {
    return res.status(400).json({ 
      message: 'Invalid input detected',
      code: 'SUSPICIOUS_INPUT' 
    });
  }

  if (req.query && checkObject(req.query, 'query.')) {
    return res.status(400).json({ 
      message: 'Invalid query parameters',
      code: 'SUSPICIOUS_INPUT' 
    });
  }

  next();
};

// Security headers middleware
export const securityHeadersMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
  
  // CSP for XSS protection
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' wss: ws:; " +
    "frame-src 'none';"
  );
  
  next();
};

// Session security middleware
export const sessionSecurityMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Check for session hijacking attempts
  if (req.session && req.session.userId) {
    const sessionIP = req.session.clientIP;
    
    if (sessionIP && sessionIP !== clientIP) {
      securityMonitor.logSecurityEvent({
        type: 'suspicious_activity',
        userId: req.session.userId,
        ip: clientIP,
        userAgent: req.get('User-Agent') || 'unknown',
        details: { 
          reason: 'Potential session hijacking - IP changed',
          originalIP: sessionIP,
          newIP: clientIP 
        },
        severity: isDevelopment ? 'medium' : 'critical',
      });

      // In development mode, be more lenient - just update the IP instead of blocking
      if (isDevelopment) {
        console.log(`⚠️ Development Mode: IP changed for user ${req.session.userId} from ${sessionIP} to ${clientIP}. Updating session IP.`);
        req.session.clientIP = clientIP;
      } else {
        // Destroy the session in production
        req.session.destroy((err) => {
          if (err) console.error('Error destroying session:', err);
        });

        return res.status(401).json({ 
          message: 'Security violation detected. Please log in again.',
          code: 'SESSION_SECURITY_VIOLATION' 
        });
      }
    }

    // Store IP in session for future checks
    if (!sessionIP) {
      req.session.clientIP = clientIP;
    }
  }

  next();
};
