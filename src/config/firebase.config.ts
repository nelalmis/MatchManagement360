// ============================================
// src/config/firebase.config.ts - Firebase Web SDK
// ============================================
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { 
  getAuth, 
  initializeAuth,
  connectAuthEmulator
} from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appConfig } from './app.config';
import { Platform } from 'react-native';

// ============================================
// CUSTOM PERSISTENCE FOR REACT NATIVE
// ============================================
const reactNativeLocalPersistence = {
  type: 'LOCAL' as const,
  
  async _isAvailable(): Promise<boolean> {
    try {
      const testKey = '__firebase_test__';
      await AsyncStorage.setItem(testKey, 'test');
      await AsyncStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  },
  
  async _set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },
  
  async _get<T>(key: string): Promise<T | null> {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  },
  
  async _remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
  
  _addListener(_key: string, _listener: () => void): void {
    // Not implemented
  },
  
  _removeListener(_key: string, _listener: () => void): void {
    // Not implemented
  },
};

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

// ============================================
// INITIALIZE FIREBASE
// ============================================
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ============================================
// INITIALIZE SERVICES
// ============================================

// Firestore
export const db = getFirestore(app);

// Auth with custom persistence
export const auth = initializeAuth(app, {
  persistence: [reactNativeLocalPersistence as any],
});

// Storage
export const storage = getStorage(app);

// Functions (with region)
export const functions = getFunctions(app, appConfig.firebase.region || 'europe-west1');

// ============================================
// EMULATOR CONNECTION (Development only)
// ============================================
const getEmulatorHost = (): string => {
  if (Platform.OS === 'android') {
    // Android emulator için 10.0.2.2 kullan
    return appConfig.firebase.emulatorConfig.host || '10.0.2.2';
  }
  // iOS için localhost
  return 'localhost';
};

if (appConfig.isDevelopment && appConfig.firebase.useEmulator) {
  try {
    const host = getEmulatorHost();
    const config = appConfig.firebase.emulatorConfig;
    
    // Firestore Emulator
    connectFirestoreEmulator(db, host, config.firestorePort);
    console.log(`✅ Firestore Emulator: ${host}:${config.firestorePort}`);
    
    // Auth Emulator
    connectAuthEmulator(auth, `http://${host}:${config.authPort}`, { 
      disableWarnings: true 
    });
    console.log(`✅ Auth Emulator: http://${host}:${config.authPort}`);
    
    // Storage Emulator
    connectStorageEmulator(storage, host, config.storagePort);
    console.log(`✅ Storage Emulator: ${host}:${config.storagePort}`);
    
    // Functions Emulator
    connectFunctionsEmulator(functions, host, config.functionsPort);
    console.log(`✅ Functions Emulator: ${host}:${config.functionsPort}`);
    
    console.log('🔥 Firebase Emulators connected');
  } catch (error) {
    console.warn('⚠️ Firebase Emulator connection failed:', error);
  }
}

// ============================================
// LOG INITIALIZATION
// ============================================
if (appConfig.isDevelopment) {
  console.log('🔥 Firebase initialized:', {
    environment: appConfig.environment,
    projectId: firebaseConfig.projectId,
    platform: Platform.OS,
    useEmulator: appConfig.firebase.useEmulator,
  });
}

export default app;