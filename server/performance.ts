
export function measureExecutionTime<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const start = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - start;
      
      if (duration > 2000) { // Log slow operations (>2 seconds) - adjusted for better performance
        console.warn(`Slow operation detected: ${operationName} took ${duration}ms`);
      }
      
      resolve(result);
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`Operation failed: ${operationName} failed after ${duration}ms`, error);
      reject(error);
    }
  });
}

export function logDatabaseQuery(query: string, duration: number) {
  if (duration > 500) { // Log slow queries (>500ms)
    console.warn(`Slow database query (${duration}ms):`, query.substring(0, 100));
  }
}
