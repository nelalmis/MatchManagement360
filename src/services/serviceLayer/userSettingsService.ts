// ============================================
// services/UserSettingsService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { userSettingsAPI } from '../../api/apiLayer/userSettingsAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IUserSettings, SportType } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class UserSettingsService {
  // ============================================
  // 1. CORE OPERATIONS
  // ============================================

  /**
   * Get user settings
   */
  static async getUserSettings(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      const result = await userSettingsAPI.getByUserId(userId);

      // If settings don't exist, initialize them
      if (!result.success || !result.data) {
        return this.initializeSettings(userId);
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SETTINGS_ERROR',
          message: error.message || 'Ayarlar alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Initialize default settings for new user
   */
  static async initializeSettings(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'initializeSettings', { userId });

      const result = await userSettingsAPI.initializeSettings(userId);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'initializeSettings', {
          userId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'initializeSettings', error);
      return {
        success: false,
        error: {
          code: 'INIT_SETTINGS_ERROR',
          message: error.message || 'Ayarlar başlatılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reset settings to defaults
   */
  static async resetToDefaults(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'resetToDefaults', { userId });

      const result = await userSettingsAPI.resetToDefaults(userId);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'resetToDefaults', {
          userId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'resetToDefaults', error);
      return {
        success: false,
        error: {
          code: 'RESET_SETTINGS_ERROR',
          message: error.message || 'Ayarlar sıfırlanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 2. PROFILE SETTINGS
  // ============================================

  /**
   * Update profile settings
   */
  static async updateProfile(
    userId: string,
    profile: Partial<IUserSettings['profile']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateProfile', { userId });

      const result = await userSettingsAPI.updateProfile(userId, profile);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateProfile', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateProfile', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PROFILE_ERROR',
          message: error.message || 'Profil ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Set display name
   */
  static async setDisplayName(
    userId: string,
    displayName: string
  ): Promise<ApiResponse<IUserSettings>> {
    return this.updateProfile(userId, { displayName: displayName.trim() });
  }

  // ============================================
  // 3. NOTIFICATION SETTINGS
  // ============================================

  /**
   * Update all notification settings
   */
  static async updateNotifications(
    userId: string,
    notifications: Partial<IUserSettings['notifications']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateNotifications', { userId });

      const result = await userSettingsAPI.updateNotifications(userId, notifications);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateNotifications', {
          userId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateNotifications', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_NOTIFICATIONS_ERROR',
          message: error.message || 'Bildirim ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update email notifications
   */
  static async updateEmailNotifications(
    userId: string,
    emailSettings: Partial<IUserSettings['notifications']['email']>
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.updateEmailNotifications(userId, emailSettings);
  }

  /**
   * Update push notifications
   */
  static async updatePushNotifications(
    userId: string,
    pushSettings: Partial<IUserSettings['notifications']['push']>
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.updatePushNotifications(userId, pushSettings);
  }

  /**
   * Disable all notifications
   */
  static async disableAllNotifications(
    userId: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'disableAllNotifications', { userId });

      const result = await userSettingsAPI.disableAllNotifications(userId);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'disableAllNotifications', {
          userId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'disableAllNotifications', error);
      return {
        success: false,
        error: {
          code: 'DISABLE_NOTIFICATIONS_ERROR',
          message: error.message || 'Bildirimler kapatılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if user can receive specific notification
   */
  static async canReceiveNotification(
    userId: string,
    type: 'email' | 'push' | 'sms',
    notificationName: string
  ): Promise<ApiResponse<boolean>> {
    return userSettingsAPI.canReceiveNotification(userId, type, notificationName);
  }

  // ============================================
  // 4. PRIVACY SETTINGS
  // ============================================

  /**
   * Update privacy settings
   */
  static async updatePrivacy(
    userId: string,
    privacy: Partial<IUserSettings['privacy']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updatePrivacy', { userId });

      const result = await userSettingsAPI.updatePrivacy(userId, privacy);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updatePrivacy', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updatePrivacy', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PRIVACY_ERROR',
          message: error.message || 'Gizlilik ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Set profile visibility
   */
  static async setProfileVisibility(
    userId: string,
    visibility: 'public' | 'friends' | 'private'
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.setProfileVisibility(userId, visibility);
  }

  /**
   * Check if user profile is public
   */
  static async isProfilePublic(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const settingsResult = await this.getUserSettings(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'GET_SETTINGS_ERROR',
            message: 'Ayarlar alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: settingsResult.data.privacy.profileVisibility === 'public',
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_VISIBILITY_ERROR',
          message: error.message || 'Görünürlük kontrolü yapılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if user allows invitations
   */
  static async allowsInvitations(userId: string): Promise<ApiResponse<boolean>> {
    try {
      const settingsResult = await this.getUserSettings(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'GET_SETTINGS_ERROR',
            message: 'Ayarlar alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: settingsResult.data.privacy.allowInvitations,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_INVITATIONS_ERROR',
          message: error.message || 'Davet izni kontrolü yapılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. PREFERENCES SETTINGS
  // ============================================

  /**
   * Update preferences
   */
  static async updatePreferences(
    userId: string,
    preferences: Partial<IUserSettings['preferences']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updatePreferences', { userId });

      const result = await userSettingsAPI.updatePreferences(userId, preferences);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updatePreferences', {
          userId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updatePreferences', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PREFERENCES_ERROR',
          message: error.message || 'Tercihler güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Set favorite positions for a sport
   */
  static async setFavoritePositions(
    userId: string,
    sport: SportType,
    positions: string[]
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.setFavoritePositions(userId, sport, positions);
  }

  /**
   * Set available days
   */
  static async setAvailableDays(
    userId: string,
    days: number[]
  ): Promise<ApiResponse<IUserSettings>> {
    // Validate days (0-6)
    const validDays = days.filter(day => day >= 0 && day <= 6);

    if (validDays.length !== days.length) {
      return {
        success: false,
        error: {
          code: 'INVALID_DAYS',
          message: 'Geçersiz gün değerleri (0-6 arası olmalı)',
          statusCode: 400,
        },
      };
    }

    return userSettingsAPI.setAvailableDays(userId, validDays);
  }

  /**
   * Set preferred times
   */
  static async setPreferredTimes(
    userId: string,
    times: Partial<IUserSettings['preferences']['preferredTimes']>
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.setPreferredTimes(userId, times);
  }

  /**
   * Set max distance
   */
  static async setMaxDistance(
    userId: string,
    maxDistanceKm: number
  ): Promise<ApiResponse<IUserSettings>> {
    if (maxDistanceKm < 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_DISTANCE',
          message: 'Mesafe negatif olamaz',
          statusCode: 400,
        },
      };
    }

    return this.updatePreferences(userId, { maxDistanceKm });
  }

  /**
   * Get user availability (days + times)
   */
  static async getUserAvailability(userId: string): Promise<ApiResponse<{
    days: number[];
    times: IUserSettings['preferences']['preferredTimes'];
    maxDistanceKm?: number;
  }>> {
    try {
      const settingsResult = await this.getUserSettings(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'GET_SETTINGS_ERROR',
            message: 'Ayarlar alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: {
          days: settingsResult.data.preferences.availableDays,
          times: settingsResult.data.preferences.preferredTimes,
          maxDistanceKm: settingsResult.data.preferences.maxDistanceKm,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_AVAILABILITY_ERROR',
          message: error.message || 'Müsaitlik alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. APPEARANCE SETTINGS
  // ============================================

  /**
   * Update appearance settings
   */
  static async updateAppearance(
    userId: string,
    appearance: Partial<IUserSettings['appearance']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateAppearance', { userId });

      const result = await userSettingsAPI.updateAppearance(userId, appearance);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateAppearance', {
          userId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateAppearance', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_APPEARANCE_ERROR',
          message: error.message || 'Görünüm ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Set theme
   */
  static async setTheme(
    userId: string,
    theme: 'light' | 'dark' | 'auto'
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.setTheme(userId, theme);
  }

  /**
   * Set language
   */
  static async setLanguage(
    userId: string,
    language: 'tr' | 'en'
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.setLanguage(userId, language);
  }

  /**
   * Get user's preferred language
   */
  static async getPreferredLanguage(userId: string): Promise<ApiResponse<'tr' | 'en'>> {
    try {
      const settingsResult = await this.getUserSettings(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'GET_SETTINGS_ERROR',
            message: 'Ayarlar alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: settingsResult.data.appearance.language,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_LANGUAGE_ERROR',
          message: error.message || 'Dil ayarı alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 7. QUICK ACTIONS (CACHE)
  // ============================================

  /**
   * Add favorite league
   */
  static async addFavoriteLeague(
    userId: string,
    leagueId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.addFavoriteLeague(userId, leagueId);
  }

  /**
   * Remove favorite league
   */
  static async removeFavoriteLeague(
    userId: string,
    leagueId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.removeFavoriteLeague(userId, leagueId);
  }

  /**
   * Add recent match
   */
  static async addRecentMatch(
    userId: string,
    matchId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.addRecentMatch(userId, matchId);
  }

  /**
   * Update frequent players
   */
  static async updateFrequentPlayers(
    userId: string,
    playerIds: string[]
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.updateFrequentPlayers(userId, playerIds);
  }

  /**
   * Get favorite leagues
   */
  static async getFavoriteLeagues(userId: string): Promise<ApiResponse<string[]>> {
    try {
      const settingsResult = await this.getUserSettings(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'GET_SETTINGS_ERROR',
            message: 'Ayarlar alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: settingsResult.data.quickActions?.favoriteLeagues || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_FAVORITES_ERROR',
          message: error.message || 'Favoriler alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if league is favorite
   */
  static async isFavoriteLeague(
    userId: string,
    leagueId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const favoritesResult = await this.getFavoriteLeagues(userId);

      if (!favoritesResult.success) {
        return {
          success: false,
          error: favoritesResult.error,
        };
      }

      return {
        success: true,
        data: favoritesResult.data?.includes(leagueId) || false,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_FAVORITE_ERROR',
          message: error.message || 'Favori kontrolü yapılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 8. SETTINGS SUMMARY
  // ============================================

  /**
   * Get settings summary for display
   */
  static async getSettingsSummary(userId: string): Promise<ApiResponse<{
    theme: string;
    language: string;
    profileVisibility: string;
    notificationsEnabled: boolean;
    favoriteLeaguesCount: number;
    availableDaysCount: number;
  }>> {
    try {
      const settingsResult = await this.getUserSettings(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'GET_SETTINGS_ERROR',
            message: 'Ayarlar alınamadı',
            statusCode: 500,
          },
        };
      }

      const settings = settingsResult.data;

      // Check if any notification is enabled
      const emailNotifs = Object.values(settings.notifications.email);
      const pushNotifs = Object.values(settings.notifications.push);
      const smsNotifs = Object.values(settings.notifications.sms);
      const notificationsEnabled = [
        ...emailNotifs,
        ...pushNotifs,
        ...smsNotifs,
      ].some(enabled => enabled);

      return {
        success: true,
        data: {
          theme: settings.appearance.theme,
          language: settings.appearance.language,
          profileVisibility: settings.privacy.profileVisibility,
          notificationsEnabled,
          favoriteLeaguesCount: settings.quickActions?.favoriteLeagues?.length || 0,
          availableDaysCount: settings.preferences.availableDays.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Özet alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 9. HELPER METHODS
  // ============================================

  /**
   * Get day names in Turkish
   */
  static getDayNames(days: number[]): string[] {
    const dayMap: Record<number, string> = {
      0: 'Pazar',
      1: 'Pazartesi',
      2: 'Salı',
      3: 'Çarşamba',
      4: 'Perşembe',
      5: 'Cuma',
      6: 'Cumartesi',
    };

    return days.map(day => dayMap[day] || 'Bilinmeyen');
  }

  /**
   * Get time slot display
   */
  static getTimeSlotDisplay(times: IUserSettings['preferences']['preferredTimes']): string[] {
    const slots: string[] = [];

    if (times.morning) slots.push('Sabah (06:00-12:00)');
    if (times.afternoon) slots.push('Öğleden Sonra (12:00-18:00)');
    if (times.evening) slots.push('Akşam (18:00-00:00)');

    return slots.length > 0 ? slots : ['Müsait değil'];
  }

  /**
   * Format availability for display
   */
  static formatAvailability(
    days: number[],
    times: IUserSettings['preferences']['preferredTimes']
  ): string {
    const dayNames = this.getDayNames(days);
    const timeSlots = this.getTimeSlotDisplay(times);

    return `${dayNames.join(', ')} - ${timeSlots.join(', ')}`;
  }

  /**
   * Validate settings
   */
  static async validateSettings(userId: string): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    try {
      const settingsResult = await this.getUserSettings(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'GET_SETTINGS_ERROR',
            message: 'Ayarlar alınamadı',
            statusCode: 500,
          },
        };
      }

      const settings = settingsResult.data;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate available days
      if (settings.preferences.availableDays.length === 0) {
        warnings.push('Hiç müsait gün seçilmemiş');
      }

      // Validate preferred times
      const { morning, afternoon, evening } = settings.preferences.preferredTimes;
      if (!morning && !afternoon && !evening) {
        warnings.push('Hiç tercih edilen zaman dilimi seçilmemiş');
      }

      // Validate max distance
      if (settings.preferences.maxDistanceKm && settings.preferences.maxDistanceKm > 100) {
        warnings.push('Maksimum mesafe çok yüksek (>100km)');
      }

      // Check notification settings
      const emailNotifs = Object.values(settings.notifications.email);
      const pushNotifs = Object.values(settings.notifications.push);
      const smsNotifs = Object.values(settings.notifications.sms);
      const anyEnabled = [
        ...emailNotifs,
        ...pushNotifs,
        ...smsNotifs,
      ].some(enabled => enabled);

      if (!anyEnabled) {
        warnings.push('Tüm bildirimler kapalı');
      }

      const valid = errors.length === 0;

      return {
        success: true,
        data: {
          valid,
          errors,
          warnings,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VALIDATE_ERROR',
          message: error.message || 'Doğrulama yapılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

export default UserSettingsService;

/*
// ✅ Get settings (auto-initialize if not exists)
const settings = await UserSettingsService.getUserSettings(userId);

// ✅ Check if user can receive notification
const canReceive = await UserSettingsService.canReceiveNotification(
  userId,
  'email',
  'matchInvitations'
);
if (canReceive.data) {
  await sendEmail(...);
}

// ✅ Check privacy before showing profile
const isPublic = await UserSettingsService.isProfilePublic(userId);
if (!isPublic.data && currentUserId !== userId) {
  return res.status(403).json({ message: 'Profile is private' });
}

// ✅ Check if user allows invitations
const allowsInvites = await UserSettingsService.allowsInvitations(userId);
if (!allowsInvites.data) {
  return res.status(403).json({ message: 'User does not accept invitations' });
}

// ✅ Set theme
await UserSettingsService.setTheme(userId, 'dark');

// ✅ Set favorite positions
await UserSettingsService.setFavoritePositions(
  userId,
  'FOOTBALL',
  ['Kaleci', 'Orta Saha']
);

// ✅ Set available days
await UserSettingsService.setAvailableDays(userId, [1, 2, 3, 4, 5]); // Mon-Fri

// ✅ Add to favorites
await UserSettingsService.addFavoriteLeague(userId, leagueId);

// ✅ Track recent match (cache)
await UserSettingsService.addRecentMatch(userId, matchId);

// ✅ Get user availability
const availability = await UserSettingsService.getUserAvailability(userId);
console.log(availability.data.days); // [1, 2, 3, 4, 5]
console.log(availability.data.times); // { morning: true, afternoon: true, evening: false }

// ✅ Format availability for display
const formatted = UserSettingsService.formatAvailability(
  [1, 2, 3],
  { morning: true, afternoon: false, evening: true }
);
// "Pazartesi, Salı, Çarşamba - Sabah (06:00-12:00), Akşam (18:00-00:00)"

// ✅ Settings validation
const validation = await UserSettingsService.validateSettings(userId);
if (!validation.data?.valid) {
  console.error('Errors:', validation.data?.errors);
}
console.log('Warnings:', validation.data?.warnings);

// ✅ Disable all notifications
await UserSettingsService.disableAllNotifications(userId);

// ✅ Reset to defaults
await UserSettingsService.resetToDefaults(userId);
*/