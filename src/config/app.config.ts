// ============================================
// src/config/app.config.ts - UPDATED
// ============================================
import {Config} from 'react-native-config';
import { getEnvironment } from './environment';
import { Platform } from 'react-native';

const env = getEnvironment();

/**
 * Get emulator host based on platform
 */
const getEmulatorHost = (): string => {
  if (Platform.OS === 'android') {
    return Config.ANDROID_EMULATOR_HOST || '10.0.2.2';
  }
  return Config.IOS_EMULATOR_HOST || 'localhost';
};

/**
 * Application configuration for React Native
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
    name: Config.APP_NAME || 'Sports League Manager',
    version: Config.APP_VERSION || '1.0.0',
    bundleId: Config.BUNDLE_ID || 'com.sportsleague.app',
  },

  // ============================================
  // API
  // ============================================
  api: {
    baseUrl: Config.API_BASE_URL || 'http://localhost:3000',
    timeout: env.isDevelopment ? 30000 : 10000,
  },

  // ============================================
  // FIREBASE
  // ============================================
  firebase: {
    apiKey: Config.FIREBASE_API_KEY || '',
    authDomain: Config.FIREBASE_AUTH_DOMAIN || '',
    projectId: Config.FIREBASE_PROJECT_ID || '',
    storageBucket: Config.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: Config.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: Config.FIREBASE_APP_ID || '',
    measurementId: Config.FIREBASE_MEASUREMENT_ID || '',
    region: Config.FIREBASE_REGION || 'europe-west1',
    
    // Emulator settings
    useEmulator: Config.USE_FIREBASE_EMULATOR === 'true' && env.isDevelopment,
    emulatorConfig: {
      host: getEmulatorHost(),
      firestorePort: parseInt(Config.FIRESTORE_EMULATOR_PORT || '8080', 10),
      authPort: parseInt(Config.AUTH_EMULATOR_PORT || '9099', 10),
      storagePort: parseInt(Config.STORAGE_EMULATOR_PORT || '9199', 10),
      functionsPort: parseInt(Config.FUNCTIONS_EMULATOR_PORT || '5001', 10),
    },
  },

  // ============================================
  // FEATURES
  // ============================================
  features: {
    enableDebugMode: env.isDevelopment || Config.ENABLE_DEBUG === 'true',
    enableAnalytics: env.isProduction,
    enableErrorReporting: env.isProduction || env.isStaging,
    enablePerformanceMonitoring: env.isProduction,
  },

  // ============================================
  // LOGGING
  // ============================================
  logging: {
    level: env.isDevelopment ? 'debug' : 'error',
    enableConsole: env.isDevelopment || Config.ENABLE_CONSOLE_LOGS === 'true',
    enableApiLogs: env.isDevelopment || Config.ENABLE_API_LOGS === 'true',
    enablePerformanceLogs: env.isDevelopment,
  },

  // ============================================
  // CACHE
  // ============================================
  cache: {
    ttl: env.isDevelopment ? 60000 : 300000,
    maxSize: 100,
  },
};

// Type export
export type AppConfig = typeof appConfig;

// Validate required config
const validateConfig = () => {
  const required = [
    'FIREBASE_API_KEY',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_AUTH_DOMAIN',
  ];

  const missing = required.filter((key) => !Config[key as keyof typeof Config]);

  if (missing.length > 0 && env.isProduction) {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Validate on module load (only in production)
if (!__DEV__) {
  validateConfig();
}

export default appConfig;