// src/utils/resetReduxState.ts

/**
 * Redux state'i sıfırlamak için utility
 * Uygulama ilk açılışta veya sorun yaşandığında kullanılır
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Redux persist storage'ı temizle
 */
export const clearReduxPersist = async (): Promise<void> => {
  try {
    // Redux persist key'i - projenize göre değişebilir
    const keys = await AsyncStorage.getAllKeys();
    const reduxKeys = keys.filter(key => 
      key.startsWith('persist:') || 
      key === 'redux' || 
      key === 'auth'
    );
    
    if (reduxKeys.length > 0) {
      await AsyncStorage.multiRemove(reduxKeys);
      console.log('✅ Redux persist cleared:', reduxKeys);
    }
  } catch (error) {
    console.error('❌ Error clearing Redux persist:', error);
  }
};

/**
 * Sadece auth state'ini temizle
 */
export const clearAuthState = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('persist:auth');
    console.log('✅ Auth state cleared');
  } catch (error) {
    console.error('❌ Error clearing auth state:', error);
  }
};

/**
 * Tüm AsyncStorage'ı temizle (dikkatli kullan!)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log('✅ All storage cleared');
  } catch (error) {
    console.error('❌ Error clearing storage:', error);
  }
};

/**
 * Storage debug - ne var ne yok göster
 */
export const debugStorage = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('📦 AsyncStorage keys:', keys);
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      console.log(`  ${key}:`, value);
    }
  } catch (error) {
    console.error('❌ Error debugging storage:', error);
  }
};