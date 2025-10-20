// ============================================
// api/base/ApiLogger.ts
// ============================================

export class ApiLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static isDebugEnabled = true; // Toggle for granular control

  static log(collection: string, method: string, data?: any) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    console.log(
      `%c[API] ${collection}.${method}`,
      'color: #3b82f6; font-weight: bold',
      data
    );
  }

  static error(collection: string, method: string, error: any) {
    console.error(
      `%c[API ERROR] ${collection}.${method}`,
      'color: #ef4444; font-weight: bold',
      error
    );
  }

  static success(collection: string, method: string, result?: any) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    console.log(
      `%c[API SUCCESS] ${collection}.${method}`,
      'color: #10b981; font-weight: bold',
      result
    );
  }

  static warn(collection: string, method: string, message: string, data?: any) {
    if (!this.isDevelopment) return;
    
    console.warn(
      `%c[API WARN] ${collection}.${method}`,
      'color: #f59e0b; font-weight: bold',
      message,
      data
    );
  }

  static query(collection: string, method: string, queryOptions?: any) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    console.log(
      `%c[API QUERY] ${collection}.${method}`,
      'color: #8b5cf6; font-weight: bold',
      queryOptions
    );
  }

  static performance(collection: string, method: string, duration: number) {
    if (!this.isDevelopment) return;
    
    const color = duration > 1000 ? '#ef4444' : duration > 500 ? '#f59e0b' : '#10b981';
    console.log(
      `%c[API PERF] ${collection}.${method} - ${duration}ms`,
      `color: ${color}; font-weight: bold`
    );
  }

  static setDebugMode(enabled: boolean) {
    this.isDebugEnabled = enabled;
  }
}