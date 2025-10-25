// ============================================
// src/config/firebase.config.ts - SIMPLIFIED
// ============================================
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { appConfig } from './app.config';
import { Platform } from 'react-native';

// ============================================
// FIREBASE CONFIG
// ============================================
const firebaseConfig = {
  apiKey: appConfig.firebase.apiKey,
  authDomain: appConfig.firebase.authDomain,
  projectId: appConfig.firebase.projectId,
  storageBucket: appConfig.firebase.storageBucket,
  messagingSenderId: appConfig.firebase.messagingSenderId,
  appId: appConfig.firebase.appId,
  measurementId: appConfig.firebase.measurementId,
};

// Validate Firebase config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is missing!');
  console.error('Please check your .env file and app.config.js');
}

// ============================================
// INITIALIZE FIREBASE APP
// ============================================
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  console.log('🔥 Firebase App Initialized');
} else {
  app = getApp();
  console.log('🔥 Firebase App Already Initialized');
}
console.log("🔥 Firebase Config:", JSON.stringify(firebaseConfig));
// ============================================
// INITIALIZE SERVICES
// ============================================

// Firestore
// export const db = getFirestore(app);

  // 🔥 YENİ YÖNTEM: Firestore'u cache ayarlarıyla başlat
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
    })
});

// Auth - Basit yaklaşım, persistence yok
export const auth = getAuth(app);
console.log('✅ Firebase Auth initialized');

// Storage
export const storage = getStorage(app);

// Functions (with region)
export const functions = getFunctions(app, appConfig.firebase.region || 'europe-west1');

// ============================================
// EMULATOR CONNECTION (Development only)
// ============================================
const getEmulatorHost = (): string => {
  if (Platform.OS === 'android') {
    return appConfig.firebase.emulatorConfig.host || '10.0.2.2';
  }
  return 'localhost';
};

// Emulator bağlantısı için flag
let emulatorsConnected = false;

if (appConfig.isDevelopment && appConfig.firebase.useEmulator && !emulatorsConnected) {
  try {
    const host = getEmulatorHost();
    const config = appConfig.firebase.emulatorConfig;
    
    // Firestore Emulator
    connectFirestoreEmulator(db, host, config.firestorePort);
    console.log(`✅ Firestore Emulator: ${host}:${config.firestorePort}`);
    
    // Auth Emulator
    const authUrl = `http://${host}:${config.authPort}`;
    connectAuthEmulator(auth, authUrl, { 
      disableWarnings: true 
    });
    console.log(`✅ Auth Emulator: ${authUrl}`);
    
    // Storage Emulator
    connectStorageEmulator(storage, host, config.storagePort);
    console.log(`✅ Storage Emulator: ${host}:${config.storagePort}`);
    
    // Functions Emulator
    connectFunctionsEmulator(functions, host, config.functionsPort);
    console.log(`✅ Functions Emulator: ${host}:${config.functionsPort}`);
    
    emulatorsConnected = true;
    console.log('🔥 All Firebase Emulators Connected Successfully');
  } catch (error: any) {
    console.warn('⚠️ Firebase Emulator connection failed:', error.message);
  }
}

// ============================================
// LOG INITIALIZATION
// ============================================
if (appConfig.isDevelopment) {
  console.log('🔥 Firebase Configuration:', {
    environment: appConfig.environment,
    projectId: firebaseConfig.projectId,
    platform: Platform.OS,
    useEmulator: appConfig.firebase.useEmulator,
    emulatorHost: appConfig.firebase.useEmulator ? getEmulatorHost() : 'N/A',
  });
}

export default app;