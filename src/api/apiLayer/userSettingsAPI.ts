// ============================================
// api/UserSettingsAPI.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { ApiLogger } from '../base/ApiLogger';
import { 
  IUserSettings, 
  SportType,
  DEFAULT_USER_SETTINGS,
  createDefaultUserSettings,
  NotificationChannel,
  NotificationFrequency,
  DayOfWeek,
  TimeSlot,
} from '../../types/entity/types';

// ============================================
// API CLASS
// ============================================
export class UserSettingsAPI extends BaseAPI<IUserSettings> {
  constructor() {
    super('user_settings');
  }

  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Get user settings by user ID
   * Settings ID is same as user ID
   */
  async getByUserId(userId: string): Promise<ApiResponse<IUserSettings>> {
    return this.getById(userId);
  }

  /**
   * Initialize default settings for a new user
   */
  async initializeSettings(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      // Check if settings already exist
      const existingResult = await this.exists(userId);

      if (existingResult.success && existingResult.data) {
        return this.getByUserId(userId);
      }

      // Create default settings using helper function
      const defaultSettings = createDefaultUserSettings(userId);

      return this.createWithId(userId, defaultSettings);
    } catch (error: any) {
      ApiLogger.error('user_settings', 'initializeSettings', error);
      return {
        success: false,
        error: {
          code: 'INIT_SETTINGS_ERROR',
          message: error.message || 'Failed to initialize user settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(
    userId: string,
    updates: Partial<Omit<IUserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<ApiResponse<IUserSettings>> {
    return this.update(userId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }

  // ============================================
  // PROFILE METHODS
  // ============================================

  async updateProfile(
    userId: string,
    profile: Partial<IUserSettings['profile']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        profile: {
          ...settingsResult.data.profile,
          ...profile,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PROFILE_ERROR',
          message: error.message || 'Failed to update profile settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // NOTIFICATION METHODS
  // ============================================

  async updateNotifications(
    userId: string,
    notifications: Partial<IUserSettings['notifications']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentNotifications = settingsResult.data.notifications;

      return this.update(userId, {
        notifications: {
          enabled: notifications.enabled ?? currentNotifications.enabled,
          frequency: notifications.frequency ?? currentNotifications.frequency,
          quietHours: notifications.quietHours 
            ? { ...currentNotifications.quietHours, ...notifications.quietHours }
            : currentNotifications.quietHours,
          email: notifications.email
            ? { ...currentNotifications.email, ...notifications.email }
            : currentNotifications.email,
          push: notifications.push
            ? { ...currentNotifications.push, ...notifications.push }
            : currentNotifications.push,
          sms: notifications.sms
            ? { ...currentNotifications.sms, ...notifications.sms }
            : currentNotifications.sms,
          inApp: notifications.inApp
            ? { ...currentNotifications.inApp, ...notifications.inApp }
            : currentNotifications.inApp,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_NOTIFICATIONS_ERROR',
          message: error.message || 'Failed to update notification settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async updateEmailNotifications(
    userId: string,
    emailSettings: Partial<IUserSettings['notifications']['email']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        notifications: {
          ...settingsResult.data.notifications,
          email: {
            ...settingsResult.data.notifications.email,
            ...emailSettings,
          },
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_EMAIL_NOTIFICATIONS_ERROR',
          message: error.message || 'Failed to update email notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async updatePushNotifications(
    userId: string,
    pushSettings: Partial<IUserSettings['notifications']['push']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        notifications: {
          ...settingsResult.data.notifications,
          push: {
            ...settingsResult.data.notifications.push,
            ...pushSettings,
          },
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PUSH_NOTIFICATIONS_ERROR',
          message: error.message || 'Failed to update push notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async updateSmsNotifications(
    userId: string,
    smsSettings: Partial<IUserSettings['notifications']['sms']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        notifications: {
          ...settingsResult.data.notifications,
          sms: {
            ...settingsResult.data.notifications.sms,
            ...smsSettings,
          },
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SMS_NOTIFICATIONS_ERROR',
          message: error.message || 'Failed to update SMS notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async updateInAppNotifications(
    userId: string,
    inAppSettings: Partial<IUserSettings['notifications']['inApp']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        notifications: {
          ...settingsResult.data.notifications,
          inApp: {
            ...settingsResult.data.notifications.inApp,
            ...inAppSettings,
          },
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_INAPP_NOTIFICATIONS_ERROR',
          message: error.message || 'Failed to update in-app notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setQuietHours(
    userId: string,
    quietHours: Partial<IUserSettings['notifications']['quietHours']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        notifications: {
          ...settingsResult.data.notifications,
          quietHours: {
            ...settingsResult.data.notifications.quietHours,
            ...quietHours,
          },
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SET_QUIET_HOURS_ERROR',
          message: error.message || 'Failed to set quiet hours',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async disableAllNotifications(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        notifications: {
          ...settingsResult.data.notifications,
          enabled: false,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DISABLE_NOTIFICATIONS_ERROR',
          message: error.message || 'Failed to disable all notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // PRIVACY METHODS
  // ============================================

  async updatePrivacy(
    userId: string,
    privacy: Partial<IUserSettings['privacy']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentPrivacy = settingsResult.data.privacy;

      return this.update(userId, {
        privacy: {
          ...currentPrivacy,
          ...privacy,
          dataSharing: privacy.dataSharing
            ? { ...currentPrivacy.dataSharing, ...privacy.dataSharing }
            : currentPrivacy.dataSharing,
          blockList: privacy.blockList ?? currentPrivacy.blockList,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PRIVACY_ERROR',
          message: error.message || 'Failed to update privacy settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setProfileVisibility(
    userId: string,
    visibility: 'public' | 'friends' | 'private'
  ): Promise<ApiResponse<IUserSettings>> {
    return this.updatePrivacy(userId, { profileVisibility: visibility });
  }

  async blockUser(userId: string, blockedUserId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentBlockList = settingsResult.data.privacy.blockList || [];
      
      if (currentBlockList.includes(blockedUserId)) {
        return { success: true, data: settingsResult.data };
      }

      return this.updatePrivacy(userId, {
        blockList: [...currentBlockList, blockedUserId],
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BLOCK_USER_ERROR',
          message: error.message || 'Failed to block user',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentBlockList = settingsResult.data.privacy.blockList || [];
      const updatedBlockList = currentBlockList.filter(id => id !== blockedUserId);

      return this.updatePrivacy(userId, {
        blockList: updatedBlockList,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UNBLOCK_USER_ERROR',
          message: error.message || 'Failed to unblock user',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // PREFERENCES METHODS
  // ============================================

  async updatePreferences(
    userId: string,
    preferences: Partial<IUserSettings['preferences']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentPreferences = settingsResult.data.preferences;

      return this.update(userId, {
        preferences: {
          ...currentPreferences,
          ...preferences,
          favoritePositions: preferences.favoritePositions
            ? { ...currentPreferences.favoritePositions, ...preferences.favoritePositions }
            : currentPreferences.favoritePositions,
          skillLevel: preferences.skillLevel
            ? { ...currentPreferences.skillLevel, ...preferences.skillLevel }
            : currentPreferences.skillLevel,
          preferredTimes: preferences.preferredTimes
            ? { ...currentPreferences.preferredTimes, ...preferences.preferredTimes }
            : currentPreferences.preferredTimes,
          preferredTeamSize: preferences.preferredTeamSize
            ? { ...currentPreferences.preferredTeamSize, ...preferences.preferredTeamSize }
            : currentPreferences.preferredTeamSize,
          paymentReminder: preferences.paymentReminder
            ? { ...currentPreferences.paymentReminder, ...preferences.paymentReminder }
            : currentPreferences.paymentReminder,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PREFERENCES_ERROR',
          message: error.message || 'Failed to update preferences',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setFavoritePositions(
    userId: string,
    sport: SportType,
    positions: string[]
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        preferences: {
          ...settingsResult.data.preferences,
          favoritePositions: {
            ...settingsResult.data.preferences.favoritePositions,
            [sport]: positions,
          },
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SET_POSITIONS_ERROR',
          message: error.message || 'Failed to set favorite positions',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setSkillLevel(
    userId: string,
    sport: SportType,
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        preferences: {
          ...settingsResult.data.preferences,
          skillLevel: {
            ...settingsResult.data.preferences.skillLevel,
            [sport]: level,
          },
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SET_SKILL_LEVEL_ERROR',
          message: error.message || 'Failed to set skill level',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setAvailableDays(
    userId: string,
    days: DayOfWeek[]
  ): Promise<ApiResponse<IUserSettings>> {
    return this.updatePreferences(userId, { availableDays: days });
  }

  async setPreferredTimes(
    userId: string,
    times: Partial<IUserSettings['preferences']['preferredTimes']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedTimes = {
        ...settingsResult.data.preferences.preferredTimes,
        ...times,
      };

      return this.updatePreferences(userId, { preferredTimes: updatedTimes });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SET_PREFERRED_TIMES_ERROR',
          message: error.message || 'Failed to set preferred times',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async addPreferredLocation(
    userId: string,
    location: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentLocations = settingsResult.data.preferences.preferredLocations || [];
      
      if (currentLocations.includes(location)) {
        return { success: true, data: settingsResult.data };
      }

      return this.updatePreferences(userId, {
        preferredLocations: [...currentLocations, location],
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_LOCATION_ERROR',
          message: error.message || 'Failed to add preferred location',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async removePreferredLocation(
    userId: string,
    location: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentLocations = settingsResult.data.preferences.preferredLocations || [];
      const updatedLocations = currentLocations.filter(loc => loc !== location);

      return this.updatePreferences(userId, {
        preferredLocations: updatedLocations,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_LOCATION_ERROR',
          message: error.message || 'Failed to remove preferred location',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // APPEARANCE METHODS
  // ============================================

  async updateAppearance(
    userId: string,
    appearance: Partial<IUserSettings['appearance']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        appearance: {
          ...settingsResult.data.appearance,
          ...appearance,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_APPEARANCE_ERROR',
          message: error.message || 'Failed to update appearance settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setTheme(
    userId: string,
    theme: 'light' | 'dark' | 'system'
  ): Promise<ApiResponse<IUserSettings>> {
    return this.updateAppearance(userId, { theme });
  }

  async setLanguage(
    userId: string,
    language: 'tr' | 'en'
  ): Promise<ApiResponse<IUserSettings>> {
    return this.updateAppearance(userId, { language });
  }

  async setCurrency(
    userId: string,
    currency: 'TRY' | 'USD' | 'EUR'
  ): Promise<ApiResponse<IUserSettings>> {
    return this.updateAppearance(userId, { currency });
  }

  // ============================================
  // ACCESSIBILITY METHODS
  // ============================================

  async updateAccessibility(
    userId: string,
    accessibility: Partial<IUserSettings['accessibility']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        accessibility: {
          ...settingsResult.data.accessibility,
          ...accessibility,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ACCESSIBILITY_ERROR',
          message: error.message || 'Failed to update accessibility settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // CALENDAR METHODS
  // ============================================

  async updateCalendar(
    userId: string,
    calendar: Partial<IUserSettings['calendar']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentCalendar = settingsResult.data.calendar;

      return this.update(userId, {
        calendar: {
          ...currentCalendar,
          ...calendar,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_CALENDAR_ERROR',
          message: error.message || 'Failed to update calendar settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SOCIAL METHODS
  // ============================================

  async updateSocial(
    userId: string,
    social: Partial<IUserSettings['social']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        social: {
          ...settingsResult.data.social,
          ...social,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SOCIAL_ERROR',
          message: error.message || 'Failed to update social settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // ANALYTICS METHODS
  // ============================================

  async updateAnalytics(
    userId: string,
    analytics: Partial<IUserSettings['analytics']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        analytics: {
          ...settingsResult.data.analytics,
          ...analytics,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ANALYTICS_ERROR',
          message: error.message || 'Failed to update analytics settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STORAGE METHODS
  // ============================================

  async updateStorage(
    userId: string,
    storage: Partial<IUserSettings['storage']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        storage: {
          ...settingsResult.data.storage,
          ...storage,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_STORAGE_ERROR',
          message: error.message || 'Failed to update storage settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SECURITY METHODS
  // ============================================

  async updateSecurity(
    userId: string,
    security: Partial<IUserSettings['security']>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentSecurity = settingsResult.data.security;

      return this.update(userId, {
        security: {
          ...currentSecurity,
          ...security,
          trustedDevices: security.trustedDevices ?? currentSecurity.trustedDevices,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SECURITY_ERROR',
          message: error.message || 'Failed to update security settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async addTrustedDevice(
    userId: string,
    deviceId: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentDevices = settingsResult.data.security.trustedDevices || [];
      
      if (currentDevices.includes(deviceId)) {
        return { success: true, data: settingsResult.data };
      }

      return this.updateSecurity(userId, {
        trustedDevices: [...currentDevices, deviceId],
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_TRUSTED_DEVICE_ERROR',
          message: error.message || 'Failed to add trusted device',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async removeTrustedDevice(
    userId: string,
    deviceId: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentDevices = settingsResult.data.security.trustedDevices || [];
      const updatedDevices = currentDevices.filter(id => id !== deviceId);

      return this.updateSecurity(userId, {
        trustedDevices: updatedDevices,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_TRUSTED_DEVICE_ERROR',
          message: error.message || 'Failed to remove trusted device',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // QUICK ACTIONS METHODS (CACHE)
  // ============================================

  async updateQuickActions(
    userId: string,
    quickActions: Partial<NonNullable<IUserSettings['quickActions']>>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentQuickActions = settingsResult.data.quickActions || {
        favoriteLeagues: [],
        recentMatches: [],
        frequentPlayers: [],
        pinnedVenues: [],
        savedSearches: [],
        recentActions: [],
      };

      return this.update(userId, {
        quickActions: {
          ...currentQuickActions,
          ...quickActions,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_QUICK_ACTIONS_ERROR',
          message: error.message || 'Failed to update quick actions',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async addFavoriteLeague(
    userId: string,
    leagueId: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentFavorites = settingsResult.data.quickActions?.favoriteLeagues || [];

      if (currentFavorites.includes(leagueId)) {
        return { success: true, data: settingsResult.data };
      }

      return this.updateQuickActions(userId, {
        favoriteLeagues: [...currentFavorites, leagueId],
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_FAVORITE_LEAGUE_ERROR',
          message: error.message || 'Failed to add favorite league',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async removeFavoriteLeague(
    userId: string,
    leagueId: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentFavorites = settingsResult.data.quickActions?.favoriteLeagues || [];
      const updatedFavorites = currentFavorites.filter(id => id !== leagueId);

      return this.updateQuickActions(userId, {
        favoriteLeagues: updatedFavorites,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_FAVORITE_LEAGUE_ERROR',
          message: error.message || 'Failed to remove favorite league',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async addRecentMatch(
    userId: string,
    matchId: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentRecent = settingsResult.data.quickActions?.recentMatches || [];
      // Add to front, remove duplicates, keep only 10 most recent
      const updatedRecent = [
        matchId,
        ...currentRecent.filter(id => id !== matchId),
      ].slice(0, 10);

      return this.updateQuickActions(userId, {
        recentMatches: updatedRecent,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_RECENT_MATCH_ERROR',
          message: error.message || 'Failed to add recent match',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async addPinnedVenue(
    userId: string,
    venueId: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentPinned = settingsResult.data.quickActions?.pinnedVenues || [];

      if (currentPinned.includes(venueId)) {
        return { success: true, data: settingsResult.data };
      }

      return this.updateQuickActions(userId, {
        pinnedVenues: [...currentPinned, venueId],
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_PINNED_VENUE_ERROR',
          message: error.message || 'Failed to add pinned venue',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async removePinnedVenue(
    userId: string,
    venueId: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentPinned = settingsResult.data.quickActions?.pinnedVenues || [];
      const updatedPinned = currentPinned.filter(id => id !== venueId);

      return this.updateQuickActions(userId, {
        pinnedVenues: updatedPinned,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_PINNED_VENUE_ERROR',
          message: error.message || 'Failed to remove pinned venue',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async saveSearch(
    userId: string,
    query: string,
    filters: any
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentSearches = settingsResult.data.quickActions?.savedSearches || [];
      const newSearch = {
        query,
        filters,
        timestamp: new Date().toISOString(),
      };

      // Keep only 5 most recent searches
      const updatedSearches = [newSearch, ...currentSearches].slice(0, 5);

      return this.updateQuickActions(userId, {
        savedSearches: updatedSearches,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SAVE_SEARCH_ERROR',
          message: error.message || 'Failed to save search',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async updateFrequentPlayers(
    userId: string,
    playerIds: string[]
  ): Promise<ApiResponse<IUserSettings>> {
    return this.updateQuickActions(userId, { frequentPlayers: playerIds });
  }

  // ============================================
  // BETA FEATURES METHODS
  // ============================================

  async updateBeta(
    userId: string,
    beta: Partial<NonNullable<IUserSettings['beta']>>
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentBeta = settingsResult.data.beta || {
        enabledFeatures: [],
        optInToNewFeatures: false,
        feedbackConsent: true,
      };

      return this.update(userId, {
        beta: {
          ...currentBeta,
          ...beta,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_BETA_ERROR',
          message: error.message || 'Failed to update beta settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async enableBetaFeature(
    userId: string,
    featureName: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentFeatures = settingsResult.data.beta?.enabledFeatures || [];

      if (currentFeatures.includes(featureName)) {
        return { success: true, data: settingsResult.data };
      }

      return this.updateBeta(userId, {
        enabledFeatures: [...currentFeatures, featureName],
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ENABLE_BETA_FEATURE_ERROR',
          message: error.message || 'Failed to enable beta feature',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async disableBetaFeature(
    userId: string,
    featureName: string
  ): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const currentFeatures = settingsResult.data.beta?.enabledFeatures || [];
      const updatedFeatures = currentFeatures.filter(f => f !== featureName);

      return this.updateBeta(userId, {
        enabledFeatures: updatedFeatures,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DISABLE_BETA_FEATURE_ERROR',
          message: error.message || 'Failed to disable beta feature',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async canReceiveNotification(
    userId: string,
    channel: NotificationChannel,
    notificationName: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const notifications = settingsResult.data.notifications;

      // Check if notifications are globally enabled
      if (!notifications.enabled) {
        return { success: true, data: false };
      }

      // Check channel-specific settings
      const channelSettings = notifications[channel];
      if (!channelSettings || !(channelSettings as any).enabled) {
        return { success: true, data: false };
      }

      // Check specific notification setting
      const canReceive = (channelSettings as any)[notificationName] || false;

      return { success: true, data: canReceive };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_NOTIFICATION_ERROR',
          message: error.message || 'Failed to check notification permission',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async isUserBlocked(
    userId: string,
    targetUserId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      const blockList = settingsResult.data.privacy.blockList || [];
      const isBlocked = blockList.includes(targetUserId);

      return { success: true, data: isBlocked };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_BLOCKED_ERROR',
          message: error.message || 'Failed to check if user is blocked',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async resetToDefaults(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      // Delete existing settings
      await this.delete(userId);

      // Re-initialize with defaults
      return this.initializeSettings(userId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'RESET_SETTINGS_ERROR',
          message: error.message || 'Failed to reset settings to defaults',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async syncSettings(userId: string): Promise<ApiResponse<IUserSettings>> {
    try {
      const settingsResult = await this.getByUserId(userId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'User settings not found',
            statusCode: 404,
          },
        };
      }

      return this.update(userId, {
        lastSyncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SYNC_SETTINGS_ERROR',
          message: error.message || 'Failed to sync settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const userSettingsAPI = new UserSettingsAPI();


/* 
// 1. Yeni kullanıcı için default settings oluştur
const result = await userSettingsAPI.initializeSettings(userId);

// 2. Bildirim ayarlarını güncelle
await userSettingsAPI.updateEmailNotifications(userId, {
  matchInvitations: true,
  matchCancellations: true,
  matchStartingSoon: false,
});

// 3. Quiet hours ayarla
await userSettingsAPI.setQuietHours(userId, true, '22:00', '08:00');

// 4. Kullanıcı engelle
await userSettingsAPI.blockUser(userId, blockedUserId);

// 5. Skill level ayarla
await userSettingsAPI.setSkillLevel(userId, 'football', 'advanced');

// 6. Preferred location ekle
await userSettingsAPI.addPreferredLocation(userId, 'Merkez Saha');

// 7. Beta feature aktif et
await userSettingsAPI.enableBetaFeature(userId, 'ai-match-suggestions');

// 8. Güvenlik ayarları
await userSettingsAPI.updateSecurity(userId, {
  biometricLogin: true,
  twoFactorAuth: true,
  sessionTimeout: 30,
});

// 9. Bildirim kontrolü
const canReceive = await userSettingsAPI.canReceiveNotification(
  userId,
  'push',
  'matchReminders'
);

// 10. Bloke kontrolü
const isBlocked = await userSettingsAPI.isUserBlocked(userId, targetUserId);


*/