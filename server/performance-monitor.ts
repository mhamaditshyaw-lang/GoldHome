
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  requestCount: number;
  averageResponseTime: number;
  slowRequests: number;
  cacheHitRate: number;
}

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private requestCount = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  recordRequest(endpoint: string, duration: number) {
    this.requestCount++;
    
    if (!this.metrics.has(endpoint)) {
      this.metrics.set(endpoint, []);
    }
    
    const times = this.metrics.get(endpoint)!;
    times.push(duration);
    
    // Keep only last 100 requests per endpoint
    if (times.length > 100) {
      times.shift();
    }
  }

  recordCacheHit() {
    this.cacheHits++;
  }

  recordCacheMiss() {
    this.cacheMisses++;
  }

  getMetrics(): PerformanceMetrics {
    let totalTime = 0;
    let slowCount = 0;
    let requestCount = 0;

    this.metrics.forEach((times) => {
      times.forEach((time) => {
        totalTime += time;
        requestCount++;
        if (time > 1000) slowCount++;
      });
    });

    const avgResponseTime = requestCount > 0 ? totalTime / requestCount : 0;
    const totalCacheOps = this.cacheHits + this.cacheMisses;
    const cacheHitRate = totalCacheOps > 0 ? (this.cacheHits / totalCacheOps) * 100 : 0;

    return {
      requestCount: this.requestCount,
      averageResponseTime: Math.round(avgResponseTime),
      slowRequests: slowCount,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100
    };
  }

  reset() {
    this.metrics.clear();
    this.requestCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

export const performanceMonitor = new PerformanceMonitor();
