// ============================================
// api/base/ApiError.ts - REACT NATIVE FIXED
// ============================================

export class ApiError extends Error {
  code: string;
  details?: any;
  statusCode?: number;

  constructor(code: string, message: string, details?: any, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;

    // CRITICAL FIX: Restore prototype chain for React Native/Babel
    // Without this, instanceof checks and Error methods don't work properly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  // Firebase errors
  if (error.code) {
    const firebaseErrorMessages: Record<string, { message: string; statusCode: number }> = {
      'permission-denied': {
        message: 'Bu işlem için yetkiniz yok',
        statusCode: 403,
      },
      'not-found': {
        message: 'Belge bulunamadı',
        statusCode: 404,
      },
      'already-exists': {
        message: 'Bu belge zaten mevcut',
        statusCode: 409,
      },
      'unauthenticated': {
        message: 'Lütfen giriş yapın',
        statusCode: 401,
      },
      'unavailable': {
        message: 'Servis şu anda kullanılamıyor',
        statusCode: 503,
      },
      'resource-exhausted': {
        message: 'İstek limiti aşıldı',
        statusCode: 429,
      },
      'invalid-argument': {
        message: 'Geçersiz parametre',
        statusCode: 400,
      },
      'failed-precondition': {
        message: 'İşlem için gerekli koşullar sağlanmadı. ' + error.message,
        statusCode: 400,
      },
      'aborted': {
        message: 'İşlem iptal edildi',
        statusCode: 409,
      },
      'out-of-range': {
        message: 'Geçersiz aralık',
        statusCode: 400,
      },
      'unimplemented': {
        message: 'Bu özellik henüz desteklenmiyor',
        statusCode: 501,
      },
      'internal': {
        message: 'Sunucu hatası',
        statusCode: 500,
      },
      'data-loss': {
        message: 'Veri kaybı oluştu',
        statusCode: 500,
      },
      'cancelled': {
        message: 'İşlem iptal edildi',
        statusCode: 499,
      },
      'deadline-exceeded': {
        message: 'İşlem zaman aşımına uğradı',
        statusCode: 504,
      },
    };

    const errorInfo = firebaseErrorMessages[error.code];

    return new ApiError(
      error.code,
      errorInfo?.message || error.message,
      error,
      errorInfo?.statusCode || 500
    );
  }

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return new ApiError('NETWORK_ERROR', 'İnternet bağlantısı bulunamadı', error, 0);
  }

  return new ApiError('UNKNOWN_ERROR', error.message || 'Bilinmeyen hata', error, 500);
};

// ============================================
// WHY THIS FIX IS NEEDED
// ============================================

/*
PROBLEM:
When you extend native Error class in TypeScript/ES6 and transpile with Babel,
the prototype chain gets broken in React Native.

WITHOUT Object.setPrototypeOf:
- instanceof ApiError returns false ❌
- Error.prototype methods don't work ❌
- Stack trace is broken ❌
- Custom properties might not be accessible ❌

WITH Object.setPrototypeOf:
- instanceof ApiError returns true ✅
- Error.prototype methods work ✅
- Stack trace is preserved ✅
- Custom properties are accessible ✅

TECHNICAL EXPLANATION:
Babel transpiles ES6 classes to ES5 constructor functions.
During this process, the prototype chain of native classes like Error
gets lost. Object.setPrototypeOf restores it.

This is a known issue in React Native + Babel + TypeScript + Error classes.
*/

// ============================================
// TESTING
// ============================================

/*
// Test 1: instanceof check
try {
  throw new ApiError('TEST_ERROR', 'Test message');
} catch (error) {
  console.log(error instanceof ApiError); // Should be true ✅
  console.log(error instanceof Error);    // Should be true ✅
}

// Test 2: Custom properties
try {
  throw new ApiError('NOT_FOUND', 'User not found', { userId: '123' }, 404);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.code);        // 'NOT_FOUND' ✅
    console.log(error.statusCode);  // 404 ✅
    console.log(error.details);     // { userId: '123' } ✅
  }
}

// Test 3: Error methods
const error = new ApiError('TEST', 'Test');
console.log(error.toString());     // "Error: Test" ✅
console.log(error.stack);          // Stack trace ✅
console.log(error.name);           // "ApiError" ✅

// Test 4: handleApiError
const firebaseError = {
  code: 'permission-denied',
  message: 'Missing permission',
};
const apiError = handleApiError(firebaseError);
console.log(apiError instanceof ApiError);     // true ✅
console.log(apiError.code);                    // 'permission-denied' ✅
console.log(apiError.message);                 // 'Bu işlem için yetkiniz yok' ✅
console.log(apiError.statusCode);              // 403 ✅
*/

// ============================================
// ALTERNATIVE FIX (If Object.setPrototypeOf doesn't work)
// ============================================

/*
If Object.setPrototypeOf still doesn't work on older React Native versions,
use this factory pattern instead:

export function createApiError(
  code: string,
  message: string,
  details?: any,
  statusCode?: number
): ApiError {
  const error = new Error(message) as any;
  error.name = 'ApiError';
  error.code = code;
  error.details = details;
  error.statusCode = statusCode;
  return error;
}

// Usage:
throw createApiError('NOT_FOUND', 'User not found', undefined, 404);
*/

export default { ApiError, handleApiError };