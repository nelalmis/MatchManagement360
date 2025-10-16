// ============================================
// api/base/ApiLogger.ts
// ============================================
export class ApiLogger {
  private static isDevelopment = process.env.NODE_ENV === 'development';

  static log(collection: string, method: string, data?: any) {
    if (!this.isDevelopment) return;
    
    console.log(`[API] ${collection}.${method}`, data);
  }

  static error(collection: string, method: string, error: any) {
    console.error(`[API ERROR] ${collection}.${method}`, error);
  }

  static success(collection: string, method: string, result?: any) {
    if (!this.isDevelopment) return;
    
    console.log(`[API SUCCESS] ${collection}.${method}`, result);
  }
}