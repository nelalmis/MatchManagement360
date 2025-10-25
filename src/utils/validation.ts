// src/utils/validation.ts

// ============================================
// EMAIL VALIDATION
// ============================================

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
};

export const getEmailError = (email: string): string | null => {
  if (!email || email.trim().length === 0) {
    return 'E-posta adresi gereklidir';
  }
  if (!validateEmail(email)) {
    return 'Geçerli bir e-posta adresi giriniz';
  }
  return null;
};

// ============================================
// PASSWORD VALIDATION
// ============================================

export const validatePassword = (password: string): boolean => {
  // En az 8 karakter, en az 1 büyük harf, 1 küçük harf, 1 rakam
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

export const getPasswordError = (password: string): string | null => {
  if (!password || password.length === 0) {
    return 'Şifre gereklidir';
  }
  if (password.length < 8) {
    return 'Şifre en az 8 karakter olmalıdır';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Şifre en az 1 büyük harf içermelidir';
  }
  if (!/[a-z]/.test(password)) {
    return 'Şifre en az 1 küçük harf içermelidir';
  }
  if (!/[0-9]/.test(password)) {
    return 'Şifre en az 1 rakam içermelidir';
  }
  return null;
};

export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
  feedback: string;
} => {
  let score = 0;
  
  // Uzunluk kontrolü
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Karakter çeşitliliği
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 2;
  
  if (score <= 3) {
    return { strength: 'weak', score, feedback: 'Çok zayıf şifre' };
  } else if (score <= 5) {
    return { strength: 'medium', score, feedback: 'Orta güçlükte şifre' };
  } else if (score <= 7) {
    return { strength: 'strong', score, feedback: 'Güçlü şifre' };
  } else {
    return { strength: 'very-strong', score, feedback: 'Çok güçlü şifre' };
  }
};

// ============================================
// PHONE VALIDATION
// ============================================

export const validatePhone = (phone: string): boolean => {
  // Türkiye telefon formatı: +90 5XX XXX XX XX veya 05XX XXX XX XX
  const phoneRegex = /^(\+90|0)?5\d{9}$/;
  const cleanPhone = phone.replace(/\s+/g, '');
  return phoneRegex.test(cleanPhone);
};

export const formatPhone = (phone: string): string => {
  // 5xxxxxxxxx -> 0 5XX XXX XX XX
  const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+90/, '');
  
  if (cleanPhone.length === 10) {
    return `${cleanPhone.slice(0, 4)} ${cleanPhone.slice(4, 7)} ${cleanPhone.slice(7, 9)} ${cleanPhone.slice(9)}`;
  }
  
  return phone;
};

export const getPhoneError = (phone: string): string | null => {
  if (!phone || phone.trim().length === 0) {
    return 'Telefon numarası gereklidir';
  }
  if (!validatePhone(phone)) {
    return 'Geçerli bir telefon numarası giriniz (05XX XXX XX XX)';
  }
  return null;
};

// ============================================
// NAME VALIDATION
// ============================================

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2 && /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(name);
};

export const getNameError = (name: string, fieldName: string = 'Ad'): string | null => {
  if (!name || name.trim().length === 0) {
    return `${fieldName} gereklidir`;
  }
  if (name.trim().length < 2) {
    return `${fieldName} en az 2 karakter olmalıdır`;
  }
  if (!/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/.test(name)) {
    return `${fieldName} sadece harf içermelidir`;
  }
  return null;
};

// ============================================
// JERSEY NUMBER VALIDATION
// ============================================

export const validateJerseyNumber = (number: string): boolean => {
  const num = parseInt(number, 10);
  return !isNaN(num) && num >= 0 && num <= 99;
};

export const getJerseyNumberError = (number: string): string | null => {
  if (!number || number.trim().length === 0) {
    return null; // Forma numarası opsiyonel
  }
  if (!validateJerseyNumber(number)) {
    return 'Forma numarası 0-99 arasında olmalıdır';
  }
  return null;
};

// ============================================
// DATE VALIDATION
// ============================================

export const validateBirthDate = (date: string): boolean => {
  const birthDate = new Date(date);
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  // En az 5 yaşında olmalı, en fazla 120 yaşında olmalı
  return age >= 5 && age <= 120;
};

export const getBirthDateError = (date: string): string | null => {
  if (!date || date.trim().length === 0) {
    return null; // Doğum tarihi opsiyonel
  }
  
  const birthDate = new Date(date);
  if (isNaN(birthDate.getTime())) {
    return 'Geçerli bir tarih giriniz';
  }
  
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  
  if (age < 5) {
    return 'En az 5 yaşında olmalısınız';
  }
  if (age > 120) {
    return 'Geçerli bir doğum tarihi giriniz';
  }
  
  return null;
};

// ============================================
// CONFIRM PASSWORD VALIDATION
// ============================================

export const validateConfirmPassword = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

export const getConfirmPasswordError = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return 'Şifre tekrarı gereklidir';
  }
  if (password !== confirmPassword) {
    return 'Şifreler eşleşmiyor';
  }
  return null;
};

// ============================================
// OTP VALIDATION
// ============================================

export const validateOTP = (otp: string, length: number = 6): boolean => {
  return otp.length === length && /^\d+$/.test(otp);
};

export const getOTPError = (otp: string, length: number = 6): string | null => {
  if (!otp || otp.length === 0) {
    return 'Doğrulama kodu gereklidir';
  }
  if (otp.length !== length) {
    return `Doğrulama kodu ${length} haneli olmalıdır`;
  }
  if (!/^\d+$/.test(otp)) {
    return 'Doğrulama kodu sadece rakam içermelidir';
  }
  return null;
};

// ============================================
// GENERIC VALIDATION
// ============================================

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim().length === 0) {
    return `${fieldName} gereklidir`;
  }
  return null;
};

export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | null => {
  if (value.trim().length < minLength) {
    return `${fieldName} en az ${minLength} karakter olmalıdır`;
  }
  return null;
};

export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string | null => {
  if (value.trim().length > maxLength) {
    return `${fieldName} en fazla ${maxLength} karakter olabilir`;
  }
  return null;
};

// ============================================
// FORM VALIDATION HELPERS
// ============================================

export interface ValidationResult<T = Record<string, string>> {
  isValid: boolean;
  errors: T;
}

export interface LoginFormErrors {
  email: string;
  password: string;
}

export interface RegisterFormErrors {
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileFormErrors {
  name: string;
  surname: string;
  jerseyNumber?: string;
  birthDate?: string;
}

export const validateLoginForm = (email: string, password: string): ValidationResult<LoginFormErrors> => {
  const errors: LoginFormErrors = {
    email: '',
    password: '',
  };
  
  const emailError = getEmailError(email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validateRequired(password, 'Şifre');
  if (passwordError) errors.password = passwordError;
  
  return {
    isValid: !errors.email && !errors.password,
    errors,
  };
};

export const validateRegisterForm = (
  name: string,
  surname: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult<RegisterFormErrors> => {
  const errors: RegisterFormErrors = {
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
  
  const nameError = getNameError(name, 'Ad');
  if (nameError) errors.name = nameError;
  
  const surnameError = getNameError(surname, 'Soyad');
  if (surnameError) errors.surname = surnameError;
  
  const emailError = getEmailError(email);
  if (emailError) errors.email = emailError;
  
  const passwordError = getPasswordError(password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = getConfirmPasswordError(password, confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  
  return {
    isValid: !errors.name && !errors.surname && !errors.email && !errors.password && !errors.confirmPassword,
    errors,
  };
};

export const validateProfileForm = (
  name: string,
  surname: string,
  jerseyNumber?: string,
  birthDate?: string
): ValidationResult<ProfileFormErrors> => {
  const errors: ProfileFormErrors = {
    name: '',
    surname: '',
    jerseyNumber: '',
    birthDate: '',
  };
  
  const nameError = getNameError(name, 'Ad');
  if (nameError) errors.name = nameError;
  
  const surnameError = getNameError(surname, 'Soyad');
  if (surnameError) errors.surname = surnameError;
  
  if (jerseyNumber) {
    const jerseyError = getJerseyNumberError(jerseyNumber);
    if (jerseyError) errors.jerseyNumber = jerseyError;
  }
  
  if (birthDate) {
    const birthDateError = getBirthDateError(birthDate);
    if (birthDateError) errors.birthDate = birthDateError;
  }
  
  return {
    isValid: !errors.name && !errors.surname && !errors.jerseyNumber && !errors.birthDate,
    errors,
  };
};