// ============================================
// api/base/ApiError.ts
// ============================================
export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  // Firebase errors
  if (error.code) {
    const firebaseErrorMessages: Record<string, string> = {
      'permission-denied': 'Bu işlem için yetkiniz yok',
      'not-found': 'Belge bulunamadı',
      'already-exists': 'Bu belge zaten mevcut',
      'unauthenticated': 'Lütfen giriş yapın',
      'unavailable': 'Servis şu anda kullanılamıyor',
      'resource-exhausted': 'İstek limiti aşıldı',
      'invalid-argument': 'Geçersiz parametre',
    };

    return new ApiError(
      error.code,
      firebaseErrorMessages[error.code] || error.message,
      error
    );
  }

  return new ApiError('UNKNOWN_ERROR', error.message || 'Bilinmeyen hata', error);
};