// ============================================
// api/base/ApiError.ts
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
        message: 'İşlem için gerekli koşullar sağlanmadı',
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