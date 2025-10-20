// ============================================
// services/AppConfigService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { appConfigAPI } from '../../api/apiLayer/appConfigAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IAppConfig } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class AppConfigService {
  // ============================================
  // 1. CONFIG RETRIEVAL
  // ============================================

  /**
   * Get app configuration (cached)
   */
  static async getConfig(forceRefresh: boolean = false): Promise<ApiResponse<IAppConfig>> {
    return appConfigAPI.getConfig(forceRefresh);
  }

  /**
   * Initialize app configuration with defaults
   */
  static async initializeConfig(adminUserId: string): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'initializeConfig', { adminUserId });

      const result = await appConfigAPI.initializeConfig(adminUserId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'initializeConfig', {
          configId: result.data?.id,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'initializeConfig', error);
      return {
        success: false,
        error: {
          code: 'INIT_CONFIG_ERROR',
          message: error.message || 'Konfigürasyon başlatılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Clear configuration cache
   */
  static clearCache(): void {
    appConfigAPI.clearCache();
    ApiLogger.log('AppConfigService', 'clearCache', 'Cache cleared');
  }

  /**
   * Refresh configuration
   */
  static async refreshConfig(): Promise<ApiResponse<IAppConfig>> {
    this.clearCache();
    return this.getConfig(true);
  }

  // ============================================
  // 2. APP INFO MANAGEMENT
  // ============================================

  /**
   * Update app information
   */
  static async updateAppInfo(
    updates: Partial<IAppConfig['app']>,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'updateAppInfo', { userId });

      const result = await appConfigAPI.updateAppInfo(updates, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'updateAppInfo', {});
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'updateAppInfo', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_APP_INFO_ERROR',
          message: error.message || 'Uygulama bilgileri güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Set maintenance mode
   */
  static async setMaintenanceMode(
    enabled: boolean,
    message: string | undefined,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'setMaintenanceMode', {
        enabled,
        userId,
      });

      const result = await appConfigAPI.setMaintenanceMode(enabled, message, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'setMaintenanceMode', { enabled });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'setMaintenanceMode', error);
      return {
        success: false,
        error: {
          code: 'SET_MAINTENANCE_ERROR',
          message: error.message || 'Bakım modu ayarlanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if maintenance mode is active
   */
  static async isMaintenanceModeActive(): Promise<ApiResponse<boolean>> {
    return appConfigAPI.isMaintenanceModeActive();
  }

  /**
   * Update app version
   */
  static async updateAppVersion(
    version: string,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    return this.updateAppInfo({ version }, userId);
  }

  // ============================================
  // 3. FEATURE FLAGS
  // ============================================

  /**
   * Update feature flags
   */
  static async updateFeatures(
    features: Partial<IAppConfig['features']>,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'updateFeatures', { userId });

      const result = await appConfigAPI.updateFeatures(features, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'updateFeatures', {});
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'updateFeatures', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FEATURES_ERROR',
          message: error.message || 'Özellikler güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if a feature is enabled
   */
  static async isFeatureEnabled(
    featureName: keyof IAppConfig['features']
  ): Promise<ApiResponse<boolean>> {
    return appConfigAPI.isFeatureEnabled(featureName);
  }

  /**
   * Enable feature
   */
  static async enableFeature(
    featureName: keyof IAppConfig['features'],
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    return this.updateFeatures({ [featureName]: true } as any, userId);
  }

  /**
   * Disable feature
   */
  static async disableFeature(
    featureName: keyof IAppConfig['features'],
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    return this.updateFeatures({ [featureName]: false } as any, userId);
  }

  /**
   * Get all enabled features
   */
  static async getEnabledFeatures(): Promise<ApiResponse<string[]>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      const enabledFeatures = Object.entries(configResult.data.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature);

      return {
        success: true,
        data: enabledFeatures,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_FEATURES_ERROR',
          message: error.message || 'Özellikler alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. DEFAULTS MANAGEMENT
  // ============================================

  /**
   * Update default values
   */
  static async updateDefaults(
    defaults: Partial<IAppConfig['defaults']>,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'updateDefaults', { userId });

      // Validate defaults
      if (defaults.pointsForWin !== undefined && defaults.pointsForWin < 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_DEFAULTS',
            message: 'Galibiyet puanı negatif olamaz',
            statusCode: 400,
          },
        };
      }

      if (defaults.minPlayersToStart !== undefined && defaults.minPlayersToStart < 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_DEFAULTS',
            message: 'Minimum oyuncu sayısı en az 2 olmalı',
            statusCode: 400,
          },
        };
      }

      const result = await appConfigAPI.updateDefaults(defaults, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'updateDefaults', {});
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'updateDefaults', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_DEFAULTS_ERROR',
          message: error.message || 'Varsayılanlar güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get default value
   */
  static async getDefaultValue<K extends keyof IAppConfig['defaults']>(
    key: K
  ): Promise<ApiResponse<IAppConfig['defaults'][K]>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.defaults[key],
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_DEFAULT_ERROR',
          message: error.message || 'Varsayılan değer alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. LIMITS MANAGEMENT
  // ============================================

  /**
   * Update limits
   */
  static async updateLimits(
    limits: Partial<IAppConfig['limits']>,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'updateLimits', { userId });

      // Validate limits
      const invalidLimits = Object.entries(limits).filter(([_, value]) => value < 1);
      
      if (invalidLimits.length > 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_LIMITS',
            message: 'Limitler pozitif olmalı',
            statusCode: 400,
          },
        };
      }

      const result = await appConfigAPI.updateLimits(limits, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'updateLimits', {});
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'updateLimits', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_LIMITS_ERROR',
          message: error.message || 'Limitler güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if limit is exceeded
   */
  static async isLimitExceeded(
    limitKey: keyof IAppConfig['limits'],
    currentValue: number
  ): Promise<ApiResponse<{
    exceeded: boolean;
    limit: number;
    current: number;
    remaining: number;
  }>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      const limit = configResult.data.limits[limitKey];
      const exceeded = currentValue >= limit;
      const remaining = Math.max(0, limit - currentValue);

      return {
        success: true,
        data: {
          exceeded,
          limit,
          current: currentValue,
          remaining,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_LIMIT_ERROR',
          message: error.message || 'Limit kontrolü yapılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. NOTIFICATIONS MANAGEMENT
  // ============================================

  /**
   * Update notification settings
   */
  static async updateNotifications(
    notifications: Partial<IAppConfig['notifications']>,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'updateNotifications', { userId });

      const result = await appConfigAPI.updateNotifications(notifications, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'updateNotifications', {});
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'updateNotifications', error);
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
   * Check if notifications are enabled
   */
  static async areNotificationsEnabled(): Promise<ApiResponse<boolean>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.notifications.enabled,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_NOTIFICATIONS_ERROR',
          message: error.message || 'Bildirim durumu kontrol edilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get notification timing
   */
  static async getNotificationTiming(
    timingKey: keyof IAppConfig['notifications']['timings']
  ): Promise<ApiResponse<number>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.notifications.timings[timingKey],
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_TIMING_ERROR',
          message: error.message || 'Zamanlama alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 7. EMAIL TEMPLATES MANAGEMENT
  // ============================================

  /**
   * Update email templates
   */
  static async updateEmailTemplates(
    templates: Partial<IAppConfig['emailTemplates']>,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'updateEmailTemplates', { userId });

      const result = await appConfigAPI.updateEmailTemplates(templates, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'updateEmailTemplates', {});
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'updateEmailTemplates', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_TEMPLATES_ERROR',
          message: error.message || 'E-posta şablonları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if email template is enabled
   */
  static async isEmailTemplateEnabled(
    templateKey: keyof IAppConfig['emailTemplates']
  ): Promise<ApiResponse<boolean>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.emailTemplates[templateKey].enabled,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_TEMPLATE_ERROR',
          message: error.message || 'Şablon durumu kontrol edilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 8. CONTACT & SOCIAL MEDIA
  // ============================================

  /**
   * Update contact information
   */
  static async updateContact(
    contact: Partial<IAppConfig['contact']>,
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'updateContact', { userId });

      const result = await appConfigAPI.updateContact(contact, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'updateContact', {});
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'updateContact', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_CONTACT_ERROR',
          message: error.message || 'İletişim bilgileri güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update social media links
   */
  static async updateSocialMedia(
    socialMedia: IAppConfig['socialMedia'],
    userId: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      ApiLogger.log('AppConfigService', 'updateSocialMedia', { userId });

      const result = await appConfigAPI.updateSocialMedia(socialMedia, userId);

      if (result.success) {
        ApiLogger.success('AppConfigService', 'updateSocialMedia', {});
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AppConfigService', 'updateSocialMedia', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SOCIAL_ERROR',
          message: error.message || 'Sosyal medya bağlantıları güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get support email
   */
  static async getSupportEmail(): Promise<ApiResponse<string>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.contact.supportEmail,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUPPORT_EMAIL_ERROR',
          message: error.message || 'Destek e-postası alınamadı',
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
   * Get configuration summary for display
   */
  static async getConfigSummary(): Promise<ApiResponse<{
    appName: string;
    version: string;
    environment: string;
    maintenanceMode: boolean;
    enabledFeatures: string[];
    notificationsEnabled: boolean;
    totalLimits: number;
  }>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      const config = configResult.data;

      const enabledFeatures = Object.entries(config.features)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature);

      const totalLimits = Object.values(config.limits).reduce((sum, limit) => sum + limit, 0);

      return {
        success: true,
        data: {
          appName: config.app.name,
          version: config.app.version,
          environment: config.app.environment,
          maintenanceMode: config.app.maintenanceMode,
          enabledFeatures,
          notificationsEnabled: config.notifications.enabled,
          totalLimits,
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

  /**
   * Validate configuration health
   */
  static async validateConfig(): Promise<ApiResponse<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_ERROR',
            message: 'Konfigürasyon alınamadı',
            statusCode: 500,
          },
        };
      }

      const config = configResult.data;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Validate defaults
      if (config.defaults.pointsForWin < 0) {
        errors.push('Galibiyet puanı negatif olamaz');
      }

      if (config.defaults.minPlayersToStart < 2) {
        errors.push('Minimum oyuncu sayısı en az 2 olmalı');
      }

      // Validate limits
      if (config.limits.maxLeaguesPerUser < 1) {
        errors.push('Maksimum lig sayısı en az 1 olmalı');
      }

      // Validate notification timings
      if (config.notifications.timings.matchReminder < 1) {
        warnings.push('Maç hatırlatma süresi çok kısa');
      }

      // Validate contact
      if (!config.contact.email || !config.contact.supportEmail) {
        errors.push('İletişim e-postaları eksik');
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

export default AppConfigService;


/*

// ✅ Initialize on app startup
await AppConfigService.initializeConfig(adminUserId);

// ✅ Check maintenance mode (in middleware)
const isMaintenance = await AppConfigService.isMaintenanceModeActive();
if (isMaintenance.data) {
  return res.status(503).json({ message: 'Under maintenance' });
}

// ✅ Check feature flag
const ratingEnabled = await AppConfigService.isFeatureEnabled('ratingSystem');
if (!ratingEnabled.data) {
  return res.status(403).json({ message: 'Feature disabled' });
}

// ✅ Check limit
const limitCheck = await AppConfigService.isLimitExceeded(
  'maxLeaguesPerUser',
  userLeagueCount
);
if (limitCheck.data?.exceeded) {
  return res.status(400).json({ 
    message: `Limit exceeded. Max: ${limitCheck.data.limit}` 
  });
}

// ✅ Get default value
const seasonDuration = await AppConfigService.getDefaultValue('seasonDuration');
// Use in league/season creation

// ✅ Admin dashboard - Config summary
const summary = await AppConfigService.getConfigSummary();
console.log(summary.data.enabledFeatures);
console.log(summary.data.maintenanceMode);

// ✅ Config health check
const validation = await AppConfigService.validateConfig();
if (!validation.data?.valid) {
  console.error('Config errors:', validation.data?.errors);
}

// ✅ Enable feature
await AppConfigService.enableFeature('commentSystem', adminId);

// ✅ Set maintenance mode
await AppConfigService.setMaintenanceMode(
  true,
  'System upgrade in progress. Back soon!',
  adminId
);

// ✅ Update limits
await AppConfigService.updateLimits({
  maxLeaguesPerUser: 10,
  maxMatchesPerDay: 20,
}, adminId);
*/