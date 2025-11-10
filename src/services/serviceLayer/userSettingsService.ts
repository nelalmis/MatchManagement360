// ============================================
// services/UserSettingsService.ts - UPDATED VERSION
// ============================================
import { userSettingsAPI } from '../../api/apiLayer/userSettingsAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { 
  IUserSettings, 
  SportType,
  NotificationChannel,
  NotificationFrequency,
  DayOfWeek,
  TimeSlot,
} from '../../types/entity/types';
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
        ApiLogger.success('UserSettingsService', 'initializeSettings', { userId });
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
        ApiLogger.success('UserSettingsService', 'resetToDefaults', { userId });
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

  /**
   * Sync settings
   */
  static async syncSettings(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'syncSettings', { userId });

      const result = await userSettingsAPI.syncSettings(userId);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'syncSettings', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'syncSettings', error);
      return {
        success: false,
        error: {
          code: 'SYNC_SETTINGS_ERROR',
          message: error.message || 'Ayarlar senkronize edilemedi',
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

  /**
   * Set bio
   */
  static async setBio(
    userId: string,
    bio: string
  ): Promise<ApiResponse<IUserSettings>> {
    if (bio.length > 200) {
      return {
        success: false,
        error: {
          code: 'BIO_TOO_LONG',
          message: 'Biyografi 200 karakterden uzun olamaz',
          statusCode: 400,
        },
      };
    }
    return this.updateProfile(userId, { bio: bio.trim() });
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
        ApiLogger.success('UserSettingsService', 'updateNotifications', { userId });
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
   * Update SMS notifications
   */
  static async updateSmsNotifications(
    userId: string,
    smsSettings: Partial<IUserSettings['notifications']['sms']>
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.updateSmsNotifications(userId, smsSettings);
  }

  /**
   * Update in-app notifications
   */
  static async updateInAppNotifications(
    userId: string,
    inAppSettings: Partial<IUserSettings['notifications']['inApp']>
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.updateInAppNotifications(userId, inAppSettings);
  }

  /**
   * Set quiet hours
   */
  static async setQuietHours(
    userId: string,
    quietHours: Partial<IUserSettings['notifications']['quietHours']>
    
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.setQuietHours(userId, quietHours);
  }

  /**
   * Disable all notifications
   */
  static async disableAllNotifications(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'disableAllNotifications', { userId });

      const result = await userSettingsAPI.disableAllNotifications(userId);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'disableAllNotifications', { userId });
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
    channel: NotificationChannel,
    notificationName: string
  ): Promise<ApiResponse<boolean>> {
    return userSettingsAPI.canReceiveNotification(userId, channel, notificationName);
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
   * Block user
   */
  static async blockUser(
    userId: string,
    blockedUserId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.blockUser(userId, blockedUserId);
  }

  /**
   * Unblock user
   */
  static async unblockUser(
    userId: string,
    blockedUserId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.unblockUser(userId, blockedUserId);
  }

  /**
   * Check if user is blocked
   */
  static async isUserBlocked(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    return userSettingsAPI.isUserBlocked(userId, targetUserId);
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

  /**
   * Check if user allows friend requests
   */
  static async allowsFriendRequests(userId: string): Promise<ApiResponse<boolean>> {
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
        data: settingsResult.data.privacy.allowFriendRequests,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_FRIEND_REQUESTS_ERROR',
          message: error.message || 'Arkadaşlık isteği kontrolü yapılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if user allows messages
   */
  static async allowsMessages(
    userId: string,
    fromUserId: string
  ): Promise<ApiResponse<boolean>> {
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

      const allowMessages = settingsResult.data.privacy.allowMessages;

      // Check if user is blocked
      const isBlocked = await this.isUserBlocked(userId, fromUserId);
      if (isBlocked.success && isBlocked.data) {
        return { success: true, data: false };
      }

      // Check message settings
      if (allowMessages === 'nobody') {
        return { success: true, data: false };
      }

      if (allowMessages === 'everyone') {
        return { success: true, data: true };
      }

      // TODO: Check if users are friends for 'friends' setting
      // This would require a FriendshipService check
      return { success: true, data: false };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_MESSAGES_ERROR',
          message: error.message || 'Mesaj izni kontrolü yapılamadı',
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
        ApiLogger.success('UserSettingsService', 'updatePreferences', { userId });
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
   * Set favorite sports
   */
  static async setFavoriteSports(
    userId: string,
    sports: SportType[]
  ): Promise<ApiResponse<IUserSettings>> {
    return this.updatePreferences(userId, { favoriteSports: sports });
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
   * Set skill level for a sport
   */
  static async setSkillLevel(
    userId: string,
    sport: SportType,
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.setSkillLevel(userId, sport, level);
  }

  /**
   * Set available days
   */
  static async setAvailableDays(
    userId: string,
    days: DayOfWeek[]
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
   * Add preferred location
   */
  static async addPreferredLocation(
    userId: string,
    location: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.addPreferredLocation(userId, location);
  }

  /**
   * Remove preferred location
   */
  static async removePreferredLocation(
    userId: string,
    location: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.removePreferredLocation(userId, location);
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
    days: DayOfWeek[];
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
        ApiLogger.success('UserSettingsService', 'updateAppearance', { userId });
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
    theme: 'light' | 'dark' | 'system'
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
   * Set currency
   */
  static async setCurrency(
    userId: string,
    currency: 'TRY' | 'USD' | 'EUR'
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.setCurrency(userId, currency);
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
  // 7. ACCESSIBILITY SETTINGS
  // ============================================

  /**
   * Update accessibility settings
   */
  static async updateAccessibility(
    userId: string,
    accessibility: Partial<IUserSettings['accessibility']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateAccessibility', { userId });

      const result = await userSettingsAPI.updateAccessibility(userId, accessibility);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateAccessibility', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateAccessibility', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_ACCESSIBILITY_ERROR',
          message: error.message || 'Erişilebilirlik ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 8. CALENDAR SETTINGS
  // ============================================

  /**
   * Update calendar settings
   */
  static async updateCalendar(
    userId: string,
    calendar: Partial<IUserSettings['calendar']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateCalendar', { userId });

      const result = await userSettingsAPI.updateCalendar(userId, calendar);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateCalendar', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateCalendar', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_CALENDAR_ERROR',
          message: error.message || 'Takvim ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 9. SOCIAL SETTINGS
  // ============================================

  /**
   * Update social settings
   */
  static async updateSocial(
    userId: string,
    social: Partial<IUserSettings['social']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateSocial', { userId });

      const result = await userSettingsAPI.updateSocial(userId, social);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateSocial', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateSocial', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SOCIAL_ERROR',
          message: error.message || 'Sosyal ayarlar güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 10. ANALYTICS SETTINGS
  // ============================================

  /**
   * Update analytics settings
   */
  static async updateAnalytics(
    userId: string,
    analytics: Partial<IUserSettings['analytics']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateAnalytics', { userId });

      const result = await userSettingsAPI.updateAnalytics(userId, analytics);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateAnalytics', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateAnalytics', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_ANALYTICS_ERROR',
          message: error.message || 'Analitik ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 11. STORAGE SETTINGS
  // ============================================

  /**
   * Update storage settings
   */
  static async updateStorage(
    userId: string,
    storage: Partial<IUserSettings['storage']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateStorage', { userId });

      const result = await userSettingsAPI.updateStorage(userId, storage);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateStorage', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateStorage', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_STORAGE_ERROR',
          message: error.message || 'Depolama ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 12. SECURITY SETTINGS
  // ============================================

  /**
   * Update security settings
   */
  static async updateSecurity(
    userId: string,
    security: Partial<IUserSettings['security']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateSecurity', { userId });

      const result = await userSettingsAPI.updateSecurity(userId, security);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateSecurity', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateSecurity', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SECURITY_ERROR',
          message: error.message || 'Güvenlik ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add trusted device
   */
  static async addTrustedDevice(
    userId: string,
    deviceId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.addTrustedDevice(userId, deviceId);
  }

  /**
   * Remove trusted device
   */
  static async removeTrustedDevice(
    userId: string,
    deviceId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.removeTrustedDevice(userId, deviceId);
  }

  // ============================================
  // 13. QUICK ACTIONS (CACHE)
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
   * Add pinned venue
   */
  static async addPinnedVenue(
    userId: string,
    venueId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.addPinnedVenue(userId, venueId);
  }

  /**
   * Remove pinned venue
   */
  static async removePinnedVenue(
    userId: string,
    venueId: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.removePinnedVenue(userId, venueId);
  }

  /**
   * Save search
   */
  static async saveSearch(
    userId: string,
    query: string,
    filters: any
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.saveSearch(userId, query, filters);
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
  // 14. BETA FEATURES
  // ============================================

  /**
   * Update beta settings
   */
  static async updateBeta(
    userId: string,
    beta: Partial<NonNullable<IUserSettings['beta']>>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      ApiLogger.log('UserSettingsService', 'updateBeta', { userId });

      const result = await userSettingsAPI.updateBeta(userId, beta);

      if (result.success) {
        ApiLogger.success('UserSettingsService', 'updateBeta', { userId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('UserSettingsService', 'updateBeta', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_BETA_ERROR',
          message: error.message || 'Beta ayarları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Enable beta feature
   */
  static async enableBetaFeature(
    userId: string,
    featureName: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.enableBetaFeature(userId, featureName);
  }

  /**
   * Disable beta feature
   */
  static async disableBetaFeature(
    userId: string,
    featureName: string
  ): Promise<ApiResponse<IUserSettings>> {
    return userSettingsAPI.disableBetaFeature(userId, featureName);
  }

  // ============================================
  // 15. SETTINGS SUMMARY
  // ============================================

  /**
   * Get settings summary for display
   */
  static async getSettingsSummary(userId: string): Promise<ApiResponse<{
    theme: string;
    language: string;
    currency: string;
    profileVisibility: string;
    notificationsEnabled: boolean;
    favoriteLeaguesCount: number;
    availableDaysCount: number;
    biometricEnabled: boolean;
    twoFactorEnabled: boolean;
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

      return {
        success: true,
        data: {
          theme: settings.appearance.theme,
          language: settings.appearance.language,
          currency: settings.appearance.currency,
          profileVisibility: settings.privacy.profileVisibility,
          notificationsEnabled: settings.notifications.enabled,
          favoriteLeaguesCount: settings.quickActions?.favoriteLeagues?.length || 0,
          availableDaysCount: settings.preferences.availableDays.length,
          biometricEnabled: settings.security.biometricLogin,
          twoFactorEnabled: settings.security.twoFactorAuth,
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
  // 16. HELPER METHODS
  // ============================================

  /**
   * Get day names in Turkish
   */
  static getDayNames(days: DayOfWeek[]): string[] {
    const dayMap: Record<DayOfWeek, string> = {
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
    if (times.night) slots.push('Gece (00:00-06:00)');

    return slots.length > 0 ? slots : ['Müsait değil'];
  }

  /**
   * Format availability for display
   */
  static formatAvailability(
    days: DayOfWeek[],
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
      const { morning, afternoon, evening, night } = settings.preferences.preferredTimes;
      if (!morning && !afternoon && !evening && !night) {
        warnings.push('Hiç tercih edilen zaman dilimi seçilmemiş');
      }

      // Validate max distance
      if (settings.preferences.maxDistanceKm && settings.preferences.maxDistanceKm > 100) {
        warnings.push('Maksimum mesafe çok yüksek (>100km)');
      }

      // Check notification settings
      if (!settings.notifications.enabled) {
        warnings.push('Bildirimler kapalı');
      }

      // Check security
      if (!settings.security.biometricLogin && !settings.security.twoFactorAuth) {
        warnings.push('Ekstra güvenlik önlemi yok');
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

// ✅ Initialize settings for new user
await UserSettingsService.initializeSettings(userId);

// ✅ Update profile bio
await UserSettingsService.setBio(userId, 'Futbol tutkunu, her akşam oynuyorum!');

// ✅ Set quiet hours
await UserSettingsService.setQuietHours(userId, true, '22:00', '08:00');

// ✅ Block/unblock user
await UserSettingsService.blockUser(userId, blockedUserId);
await UserSettingsService.unblockUser(userId, blockedUserId);

// ✅ Check if user is blocked
const isBlocked = await UserSettingsService.isUserBlocked(userId, targetUserId);

// ✅ Set skill level
await UserSettingsService.setSkillLevel(userId, 'football', 'advanced');

// ✅ Add/remove preferred location
await UserSettingsService.addPreferredLocation(userId, 'Merkez Saha');
await UserSettingsService.removePreferredLocation(userId, 'Eski Saha');

// ✅ Update security settings
await UserSettingsService.updateSecurity(userId, {
  biometricLogin: true,
  twoFactorAuth: true,
  sessionTimeout: 30,
});

// ✅ Pin venue
await UserSettingsService.addPinnedVenue(userId, venueId);

// ✅ Save search
await UserSettingsService.saveSearch(userId, 'futbol ligi', { city: 'Mersin' });

// ✅ Enable beta feature
await UserSettingsService.enableBetaFeature(userId, 'ai-match-suggestions');

// ✅ Check message permissions
const canMessage = await UserSettingsService.allowsMessages(userId, fromUserId);

// ✅ Sync settings
await UserSettingsService.syncSettings(userId);

// ✅ Get settings summary
const summary = await UserSettingsService.getSettingsSummary(userId);
*/