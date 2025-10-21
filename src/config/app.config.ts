// ============================================
// src/config/app.config.ts - UPDATED for Expo with ENV
// ============================================
import Constants from 'expo-constants';
import { getEnvironment } from './environment';
import { Platform } from 'react-native';

const env = getEnvironment();
const extra = Constants.expoConfig?.extra || {};

/**
 * Get emulator host based on platform
 */
const getEmulatorHost = (): string => {
  if (Platform.OS === 'android') {
    return extra.androidEmulatorHost || '10.0.2.2';
  }
  return extra.iosEmulatorHost || 'localhost';
};

/**
 * Get API base URL based on environment
 */
const getApiBaseUrl = (): string => {
  // Extra'dan gelen değeri öncelikle kullan
  if (extra.apiBaseUrl) {
    return extra.apiBaseUrl;
  }

  // Environment'a göre default değerler
  switch (env.current) {
    case 'development':
      return Platform.OS === 'android' 
        ? 'http://10.0.2.2:3000' 
        : 'http://localhost:3000';
    
    case 'staging':
      return 'https://staging-api.maczamani.com';
    
    case 'production':
      return 'https://api.maczamani.com';
    
    case 'test':
      return 'http://localhost:3000';
    
    default:
      return 'http://10.0.2.2:3000';
  }
};

/**
 * Get API timeout based on environment
 */
const getApiTimeout = (): number => {
  if (extra.apiTimeout) {
    return parseInt(extra.apiTimeout, 10);
  }
  
  // Development'ta daha uzun timeout
  return env.isDevelopment ? 30000 : 10000;
};

/**
 * Application configuration for Expo
 */
export const appConfig = {
  // ============================================
  // ENVIRONMENT
  // ============================================
  environment: env.current,
  isDevelopment: env.isDevelopment,
  isProduction: env.isProduction,
  isStaging: env.isStaging,
  isTest: env.isTest,

  // ============================================
  // APP INFO
  // ============================================
  app: {
    name: extra.appName || 'Maç Zamanı',
    version: extra.appVersion || '1.0.0',
    bundleId: extra.bundleId || 'com.mac.zamani',
  },

  // ============================================
  // API
  // ============================================
  api: {
    baseUrl: getApiBaseUrl(),
    timeout: getApiTimeout(),
  },

  // ============================================
  // FIREBASE
  // ============================================
  firebase: {
    apiKey: extra.firebaseApiKey || '',
    authDomain: extra.firebaseAuthDomain || '',
    projectId: extra.firebaseProjectId || '',
    storageBucket: extra.firebaseStorageBucket || '',
    messagingSenderId: extra.firebaseMessagingSenderId || '',
    appId: extra.firebaseAppId || '',
    measurementId: extra.firebaseMeasurementId || '',
    region: extra.firebaseRegion || 'europe-west1',
    
    // Emulator settings - SADECE development'ta aktif
    useEmulator: extra.useFirebaseEmulator === true && env.isDevelopment,
    emulatorConfig: {
      host: getEmulatorHost(),
      firestorePort: parseInt(extra.firestoreEmulatorPort || '8080', 10),
      authPort: parseInt(extra.authEmulatorPort || '9099', 10),
      storagePort: parseInt(extra.storageEmulatorPort || '9199', 10),
      functionsPort: parseInt(extra.functionsEmulatorPort || '5001', 10),
    },
  },

  // ============================================
  // FEATURES
  // ============================================
  features: {
    enableDebugMode: env.isDevelopment || extra.enableDebug === true,
    enableAnalytics: env.isProduction || extra.enableAnalytics === true,
    enableErrorReporting: 
      env.isProduction || 
      env.isStaging || 
      extra.enableErrorReporting === true,
    enablePerformanceMonitoring: 
      env.isProduction || 
      extra.enablePerformanceMonitoring === true,
  },

  // ============================================
  // LOGGING
  // ============================================
  logging: {
    level: env.isDevelopment || env.isStaging ? 'debug' : 'error',
    enableConsole: 
      env.isDevelopment || 
      env.isStaging || 
      extra.enableConsoleLogs === true,
    enableApiLogs: 
      env.isDevelopment || 
      env.isStaging || 
      extra.enableApiLogs === true,
    enablePerformanceLogs: 
      env.isDevelopment || 
      extra.enablePerformanceLogs === true,
  },

  // ============================================
  // CACHE
  // ============================================
  cache: {
    ttl: env.isDevelopment ? 60000 : 300000, // 1 min dev, 5 min prod
    maxSize: 100,
  },
};

// Type export
export type AppConfig = typeof appConfig;

// ============================================
// VALIDATION
// ============================================
const validateConfig = () => {
  const required = [
    'firebaseApiKey',
    'firebaseProjectId',
    'firebaseAuthDomain',
  ];

  const missing = required.filter((key) => !extra[key]);

  if (missing.length > 0 && env.isProduction) {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate on module load (only in production)
if (!__DEV__) {
  validateConfig();
}

// ============================================
// DEVELOPMENT LOGGING
// ============================================
if (__DEV__) {
  console.log('⚙️ App Config Loaded:', {
    environment: env.current,
    apiBaseUrl: appConfig.api.baseUrl,
    apiTimeout: appConfig.api.timeout,
    useEmulator: appConfig.firebase.useEmulator,
    emulatorHost: appConfig.firebase.useEmulator 
      ? appConfig.firebase.emulatorConfig.host 
      : 'N/A',
    platform: Platform.OS,
    features: {
      debug: appConfig.features.enableDebugMode,
      analytics: appConfig.features.enableAnalytics,
      errorReporting: appConfig.features.enableErrorReporting,
    },
  });
}

export default appConfig;