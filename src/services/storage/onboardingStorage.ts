// src/services/storage/onboardingStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../utils';

export const OnboardingStorage = {
  // İlk açılış kontrolü
  async isFirstLaunch(): Promise<boolean> {
    try {
      const hasSeenWelcome = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_WELCOME);
      return hasSeenWelcome === null;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return true; // Hata durumunda welcome göster
    }
  },

  // Welcome ekranı görüldü olarak işaretle
  async markWelcomeAsSeen(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_WELCOME, 'true');
    } catch (error) {
      console.error('Error marking welcome as seen:', error);
    }
  },

  // Onboarding'i sıfırla (test için)
  async resetOnboarding(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.HAS_SEEN_WELCOME);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  },
};