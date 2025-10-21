// app.config.js
import 'dotenv/config';

const getApiBaseUrl = () => {
  const env = process.env.ENV || 'development';
  
  if (env === 'development') {
    // Android emulator için 10.0.2.2
    // iOS simulator için localhost
    return process.env.API_BASE_URL || 'http://10.0.2.2:3000';
  }
  
  if (env === 'staging') {
    return process.env.API_BASE_URL || 'https://staging-api.yourapp.com';
  }
  
  return process.env.API_BASE_URL || 'https://api.yourapp.com';
};

export default {
  expo: {
    name: "Maç Zamanı",
    slug: "mac-zamani",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icons/logo-4.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/icons/splash.png",
      resizeMode: "contain",
      backgroundColor: "#F4F8FF"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icons/logo-4.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.mac.zamani"
    },
    web: {
      favicon: "./assets/icons/logo-4.png"
    },
    
    // ============================================
    // ENVIRONMENT VARIABLES
    // ============================================
    extra: {
      // Environment
      env: process.env.ENV || 'development',
      
      // App Info
      appName: process.env.APP_NAME || 'Maç Zamanı',
      appVersion: process.env.APP_VERSION || '1.0.0',
      bundleId: process.env.BUNDLE_ID || 'com.mac.zamani',
      
      // API
      apiBaseUrl: getApiBaseUrl(),
      apiTimeout: process.env.API_TIMEOUT || '30000',
      
      // Firebase
      firebaseApiKey: process.env.FIREBASE_API_KEY || '',
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      firebaseAppId: process.env.FIREBASE_APP_ID || '',
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
      firebaseRegion: process.env.FIREBASE_REGION || 'europe-west1',
      
      // Firebase Emulator
      useFirebaseEmulator: process.env.USE_FIREBASE_EMULATOR === 'true',
      firestoreEmulatorPort: process.env.FIRESTORE_EMULATOR_PORT || '8080',
      authEmulatorPort: process.env.AUTH_EMULATOR_PORT || '9099',
      storageEmulatorPort: process.env.STORAGE_EMULATOR_PORT || '9199',
      functionsEmulatorPort: process.env.FUNCTIONS_EMULATOR_PORT || '5001',
      
      // Android/iOS Emulator Hosts
      androidEmulatorHost: process.env.ANDROID_EMULATOR_HOST || '10.0.2.2',
      iosEmulatorHost: process.env.IOS_EMULATOR_HOST || 'localhost',
      
      // Features
      enableDebug: process.env.ENABLE_DEBUG === 'true',
      enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
      enableErrorReporting: process.env.ENABLE_ERROR_REPORTING === 'true',
      enablePerformanceMonitoring: process.env.ENABLE_PERFORMANCE_MONITORING === 'true',
      
      // Logging
      enableConsoleLogs: process.env.ENABLE_CONSOLE_LOGS === 'true',
      enableApiLogs: process.env.ENABLE_API_LOGS === 'true',
      enablePerformanceLogs: process.env.ENABLE_PERFORMANCE_LOGS === 'true',
    }
  }
};