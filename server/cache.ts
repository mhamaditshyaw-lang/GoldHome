
interface CacheItem<T> {
  data: T;
  expiry: number;
}

class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiry });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// Run cleanup every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// Helper function to invalidate all dashboard caches
export function invalidateAllDashboardCaches() {
  // Invalidate dashboard stats and performance caches for all possible user roles
  const roles = ['admin', 'supervisor', 'cleaner'];
  const cacheKeys: string[] = [];
  
  // Generate all possible cache keys
  for (const role of roles) {
    // Pattern: dashboard-stats-{role}-{userId}
    // Pattern: daily-performance-{role}-{userId}
    // We'll delete all keys that match these patterns
  }
  
  // Delete all keys matching dashboard patterns
  const allKeys = Array.from((cache as any).cache.keys()) as string[];
  for (const key of allKeys) {
    if (key.startsWith('dashboard-stats-') || 
        key.startsWith('daily-performance-') ||
        key.startsWith('team-data-')) {
      cache.delete(key);
    }
  }
}

// Helper function to invalidate user settings cache
export function invalidateUserSettingsCache(userId?: number) {
  const allKeys = Array.from((cache as any).cache.keys()) as string[];
  for (const key of allKeys) {
    if (userId) {
      // Invalidate specific user's settings
      if (key === `user-settings-${userId}`) {
        cache.delete(key);
      }
    } else {
      // Invalidate all user settings
      if (key.startsWith('user-settings-')) {
        cache.delete(key);
      }
    }
  }
}
