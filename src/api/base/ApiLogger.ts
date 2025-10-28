// ============================================
// api/base/ApiLogger.ts - REACT NATIVE COMPATIBLE
// ============================================

/**
 * API Logger for React Native
 * CSS styling doesn't work in React Native console
 * Uses emojis and formatting instead
 */
export class ApiLogger {
  private static isDevelopment =  false;//__DEV__; // React Native's __DEV__ constant
  private static isDebugEnabled = false; // Toggle for granular control

  static log(collection: string, method: string, data?: any) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    console.log(
      `\n🔵 [API] ${collection}.${method}`,
      data ? '\n📦' : '',
      data || ''
    );
  }

  static error(collection: string, method: string, error: any) {
    // Always log errors, even in production
    console.error(
      `\n❌ [API ERROR] ${collection}.${method}`,
      '\n🔴',
      error?.message || error,
      error?.stack ? `\n📍 ${error.stack}` : ''
    );
  }

  static success(collection: string, method: string, result?: any) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    console.log(
      `\n✅ [API SUCCESS] ${collection}.${method}`,
      result ? '\n📦' : '',
      result || ''
    );
  }

  static warn(collection: string, method: string, message: string, data?: any) {
    if (!this.isDevelopment) return;
    
    console.warn(
      `\n⚠️  [API WARN] ${collection}.${method}`,
      `\n💬 ${message}`,
      data ? '\n📦' : '',
      data || ''
    );
  }

  static query(collection: string, method: string, queryOptions?: any) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    console.log(
      `\n🔍 [API QUERY] ${collection}.${method}`,
      queryOptions ? '\n📦' : '',
      queryOptions || ''
    );
  }

  static performance(collection: string, method: string, duration: number) {
    if (!this.isDevelopment) return;
    
    const emoji = duration > 1000 ? '🐌' : duration > 500 ? '🚀' : '⚡';
    const status = duration > 1000 ? 'SLOW' : duration > 500 ? 'NORMAL' : 'FAST';
    
    console.log(
      `\n${emoji} [API PERF ${status}] ${collection}.${method}`,
      `\n⏱️  ${duration}ms`
    );
  }

  static setDebugMode(enabled: boolean) {
    this.isDebugEnabled = enabled;
  }

  // ============================================
  // ADDITIONAL HELPERS
  // ============================================

  /**
   * Log grouped operations
   */
  static group(title: string, callback: () => void) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    console.group(`\n📂 ${title}`);
    callback();
    console.groupEnd();
  }

  /**
   * Log cache operations
   */
  static cache(collection: string, method: string, hit: boolean, key?: string) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    const emoji = hit ? '💾' : '🔍';
    const status = hit ? 'HIT' : 'MISS';
    
    console.log(
      `\n${emoji} [CACHE ${status}] ${collection}.${method}`,
      key ? `\n🔑 ${key}` : ''
    );
  }

  /**
   * Log network request details
   */
  static network(method: string, url: string, status?: number) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    const emoji = status && status >= 200 && status < 300 ? '✅' : status ? '❌' : '🌐';
    
    console.log(
      `\n${emoji} [NETWORK] ${method.toUpperCase()}`,
      `\n🔗 ${url}`,
      status ? `\n📊 Status: ${status}` : ''
    );
  }

  /**
   * Log validation errors
   */
  static validation(field: string, message: string, value?: any) {
    if (!this.isDevelopment) return;
    
    console.warn(
      `\n⚠️  [VALIDATION ERROR]`,
      `\n📝 Field: ${field}`,
      `\n💬 ${message}`,
      value !== undefined ? `\n📦 Value: ${value}` : ''
    );
  }

  /**
   * Log authentication events
   */
  static auth(event: string, userId?: string, details?: any) {
    if (!this.isDevelopment || !this.isDebugEnabled) return;
    
    console.log(
      `\n🔐 [AUTH] ${event}`,
      userId ? `\n👤 User: ${userId}` : '',
      details ? '\n📦' : '',
      details || ''
    );
  }
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Standard API calls
ApiLogger.log('leagueAPI', 'create', { title: 'My League' });
// Output: 🔵 [API] leagueAPI.create
//         📦 { title: 'My League' }

ApiLogger.success('leagueAPI', 'create', { id: 'league123' });
// Output: ✅ [API SUCCESS] leagueAPI.create
//         📦 { id: 'league123' }

ApiLogger.error('leagueAPI', 'create', new Error('Network failed'));
// Output: ❌ [API ERROR] leagueAPI.create
//         🔴 Network failed
//         📍 [stack trace]

// Performance tracking
ApiLogger.performance('leagueAPI', 'fetchAll', 1200);
// Output: 🐌 [API PERF SLOW] leagueAPI.fetchAll
//         ⏱️  1200ms

ApiLogger.performance('leagueAPI', 'getById', 80);
// Output: ⚡ [API PERF FAST] leagueAPI.getById
//         ⏱️  80ms

// Query logging
ApiLogger.query('leagueAPI', 'getAll', { 
  where: { active: true },
  orderBy: 'createdAt',
  limit: 10 
});
// Output: 🔍 [API QUERY] leagueAPI.getAll
//         📦 { where: { active: true }, ... }

// Cache operations
ApiLogger.cache('leagueAPI', 'getById', true, 'league_123');
// Output: 💾 [CACHE HIT] leagueAPI.getById
//         🔑 league_123

ApiLogger.cache('leagueAPI', 'getById', false, 'league_456');
// Output: 🔍 [CACHE MISS] leagueAPI.getById
//         🔑 league_456

// Network requests
ApiLogger.network('GET', '/api/leagues/123', 200);
// Output: ✅ [NETWORK] GET
//         🔗 /api/leagues/123
//         📊 Status: 200

ApiLogger.network('POST', '/api/leagues', 500);
// Output: ❌ [NETWORK] POST
//         🔗 /api/leagues
//         📊 Status: 500

// Validation errors
ApiLogger.validation('email', 'Invalid email format', 'test@');
// Output: ⚠️  [VALIDATION ERROR]
//         📝 Field: email
//         💬 Invalid email format
//         📦 Value: test@

// Authentication
ApiLogger.auth('LOGIN_SUCCESS', 'user123', { method: 'password' });
// Output: 🔐 [AUTH] LOGIN_SUCCESS
//         👤 User: user123
//         📦 { method: 'password' }

// Grouped operations
ApiLogger.group('League Creation Flow', () => {
  ApiLogger.log('validation', 'validate', { title: 'My League' });
  ApiLogger.log('leagueAPI', 'create', { title: 'My League' });
  ApiLogger.cache('leagueAPI', 'invalidate', false, 'all_leagues');
  ApiLogger.success('leagueAPI', 'create', { id: 'league123' });
});
// Output: 📂 League Creation Flow
//           🔵 [API] validation.validate
//           🔵 [API] leagueAPI.create
//           🔍 [CACHE MISS] leagueAPI.invalidate
//           ✅ [API SUCCESS] leagueAPI.create

// Disable debug mode for specific scenarios
ApiLogger.setDebugMode(false);
ApiLogger.log('test', 'test'); // Won't log
ApiLogger.setDebugMode(true);
*/

// ============================================
// EMOJI LEGEND
// ============================================

/*
🔵 = API Request
✅ = Success
❌ = Error
⚠️  = Warning
🔍 = Query / Cache Miss
💾 = Cache Hit
⚡ = Fast (<500ms)
🚀 = Normal (500-1000ms)
🐌 = Slow (>1000ms)
📂 = Group
📦 = Data Payload
🔴 = Error Details
📍 = Stack Trace
💬 = Message
🔑 = Cache Key
⏱️  = Duration
🌐 = Network Request
🔗 = URL
📊 = Status Code
📝 = Field Name
🔐 = Authentication
👤 = User ID
*/

// ============================================
// INTEGRATION WITH EXISTING CODE
// ============================================

/*
// Your existing code will work without any changes:

export class LeagueAPI extends BaseAPI<ILeague> {
  async create(data: CreateLeagueData): Promise<ApiResponse<ILeague>> {
    try {
      ApiLogger.log('leagueAPI', 'create', data);
      
      const result = await this.collection.add({
        ...data,
        createdAt: Timestamp.now(),
      });
      
      ApiLogger.success('leagueAPI', 'create', { id: result.id });
      return { success: true, data: { id: result.id, ...data } };
      
    } catch (error) {
      ApiLogger.error('leagueAPI', 'create', error);
      return { success: false, error: this.handleError(error) };
    }
  }
}

// Performance tracking wrapper
async performOperation<T>(
  collection: string, 
  method: string, 
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    ApiLogger.performance(collection, method, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    ApiLogger.performance(collection, method, duration);
    throw error;
  }
}

// Usage:
const result = await performOperation(
  'leagueAPI', 
  'create', 
  () => leagueAPI.create(data)
);
*/

// ============================================
// WHY CSS STYLING DOESN'T WORK IN REACT NATIVE
// ============================================

/*
React Native uses JavaScriptCore or Hermes engine, not a web browser.
The console in React Native doesn't support:
- %c formatting
- CSS color codes
- font-weight/font-style properties

Only browsers (Chrome DevTools, Firefox DevTools) support these features.

In React Native Metro bundler logs, you'll see the raw text:
❌ console.log('%c[API]', 'color: red');
   Output: %c[API] color: red

✅ console.log('🔴 [API]');
   Output: 🔴 [API]

Emojis work everywhere: Metro, iOS, Android, Expo Go, Flipper debugger.
*/

export default ApiLogger;