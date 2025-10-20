// ============================================
// src/types/react-native-config.d.ts
// ============================================
declare module 'react-native-config' {
  export interface NativeConfig {
    ENV?: string;
    APP_NAME?: string;
    APP_VERSION?: string;
    BUNDLE_ID?: string;
    
    API_BASE_URL?: string;
    
    FIREBASE_API_KEY?: string;
    FIREBASE_AUTH_DOMAIN?: string;
    FIREBASE_PROJECT_ID?: string;
    FIREBASE_STORAGE_BUCKET?: string;
    FIREBASE_MESSAGING_SENDER_ID?: string;
    FIREBASE_APP_ID?: string;
    FIREBASE_MEASUREMENT_ID?: string;
    FIREBASE_REGION?: string;
    
    USE_FIREBASE_EMULATOR?: string;
    ANDROID_EMULATOR_HOST?: string;
    IOS_EMULATOR_HOST?: string;
    FIRESTORE_EMULATOR_PORT?: string;
    AUTH_EMULATOR_PORT?: string;
    STORAGE_EMULATOR_PORT?: string;
    FUNCTIONS_EMULATOR_PORT?: string;
    
    ENABLE_DEBUG?: string;
    ENABLE_CONSOLE_LOGS?: string;
    ENABLE_API_LOGS?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}