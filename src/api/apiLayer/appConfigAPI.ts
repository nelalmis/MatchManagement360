// ============================================
// api/AppConfigAPI.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { ApiLogger } from '../base/ApiLogger';
import { IAppConfig } from '../../types/entity/types';

// ============================================
// API CLASS
// ============================================
export class AppConfigAPI extends BaseAPI<IAppConfig> {
  private static readonly CONFIG_ID = 'main';
  private cachedConfig: IAppConfig | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

  constructor() {
    super('app_config');
  }

  // ============================================
  // SINGLETON CONFIG METHODS
  // ============================================

  /**
   * Get the main app configuration (singleton)
   * Uses caching to reduce Firestore reads
   */
  async getConfig(forceRefresh: boolean = false): Promise<ApiResponse<IAppConfig>> {
    try {
      // Check cache
      if (
        !forceRefresh &&
        this.cachedConfig &&
        Date.now() - this.cacheTimestamp < this.CACHE_DURATION
      ) {
        ApiLogger.log('app_config', 'getConfig', 'Returning cached config');
        return {
          success: true,
          data: this.cachedConfig,
        };
      }

      // Fetch from Firestore
      const result = await this.getById(AppConfigAPI.CONFIG_ID);

      if (result.success && result.data) {
        this.cachedConfig = result.data;
        this.cacheTimestamp = Date.now();
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('app_config', 'getConfig', error);
      return {
        success: false,
        error: {
          code: 'GET_CONFIG_ERROR',
          message: error.message || 'Failed to get app configuration',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Initialize app config with default values if not exists
   */
  async initializeConfig(adminUserId: string): Promise<ApiResponse<IAppConfig>> {
    try {
      // Check if config already exists
      const existingResult = await this.exists(AppConfigAPI.CONFIG_ID);

      if (existingResult.success && existingResult.data) {
        return this.getConfig(true);
      }

      // Create default config
      const defaultConfig: Omit<IAppConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        app: {
          name: 'Sports League Manager',
          version: '1.0.0',
          environment: 'production',
          maintenanceMode: false,
        },
        features: {
          friendlyMatches: true,
          ratingSystem: true,
          commentSystem: true,
          paymentTracking: true,
          mvpSystem: true,
          notifications: true,
          invitations: true,
          multiLeague: true,
        },
        defaults: {
          seasonDuration: 180,
          pointsForWin: 3,
          pointsForDraw: 1,
          pointsForLoss: 0,
          minPlayersToStart: 8,
          registrationDeadlineHours: 2,
          autoArchiveMonths: 12,
        },
        limits: {
          maxLeaguesPerUser: 5,
          maxPlayersPerLeague: 100,
          maxMatchesPerDay: 10,
          maxCommentsPerMatch: 50,
          maxInvitationsPerMatch: 20,
        },
        notifications: {
          enabled: true,
          channels: {
            email: true,
            push: true,
            sms: false,
          },
          timings: {
            matchReminder: 24,
            paymentReminder: 48,
            ratingRequest: 2,
          },
        },
        emailTemplates: {
          matchInvitation: {
            subject: 'Maça Davet Edildiniz',
            enabled: true,
          },
          matchReminder: {
            subject: 'Maç Hatırlatması',
            enabled: true,
          },
          paymentReminder: {
            subject: 'Ödeme Hatırlatması',
            enabled: true,
          },
          seasonReport: {
            subject: 'Sezon Raporu',
            enabled: true,
          },
        },
        contact: {
          email: 'info@sportsleague.com',
          supportEmail: 'support@sportsleague.com',
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: adminUserId,
      };

      const result = await this.createWithId(AppConfigAPI.CONFIG_ID, defaultConfig);

      if (result.success && result.data) {
        this.cachedConfig = result.data;
        this.cacheTimestamp = Date.now();
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('app_config', 'initializeConfig', error);
      return {
        success: false,
        error: {
          code: 'INIT_CONFIG_ERROR',
          message: error.message || 'Failed to initialize app configuration',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update the main app configuration
   */
  async updateConfig(
    updates: Partial<Omit<IAppConfig, 'id' | 'createdAt' | 'updatedAt'>>,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      const updateData = {
        ...updates,
        lastUpdated: new Date().toISOString(),
        updatedBy,
      };

      const result = await this.update(AppConfigAPI.CONFIG_ID, updateData);

      if (result.success && result.data) {
        this.cachedConfig = result.data;
        this.cacheTimestamp = Date.now();
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('app_config', 'updateConfig', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_CONFIG_ERROR',
          message: error.message || 'Failed to update app configuration',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Clear the cached configuration
   */
  clearCache(): void {
    this.cachedConfig = null;
    this.cacheTimestamp = 0;
    ApiLogger.log('app_config', 'clearCache', 'Cache cleared');
  }

  // ============================================
  // APP INFO METHODS
  // ============================================

  async updateAppInfo(
    appInfo: Partial<IAppConfig['app']>,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return this.updateConfig(
        {
          app: {
            ...configResult.data.app,
            ...appInfo,
          },
        },
        updatedBy
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_APP_INFO_ERROR',
          message: error.message || 'Failed to update app info',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setMaintenanceMode(
    enabled: boolean,
    message: string | undefined,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    return this.updateAppInfo(
      {
        maintenanceMode: enabled,
        maintenanceMessage: message,
      },
      updatedBy
    );
  }

  async isMaintenanceModeActive(): Promise<ApiResponse<boolean>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.app.maintenanceMode,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_MAINTENANCE_ERROR',
          message: error.message || 'Failed to check maintenance mode',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // FEATURE FLAGS METHODS
  // ============================================

  async updateFeatures(
    features: Partial<IAppConfig['features']>,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return this.updateConfig(
        {
          features: {
            ...configResult.data.features,
            ...features,
          },
        },
        updatedBy
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_FEATURES_ERROR',
          message: error.message || 'Failed to update features',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async isFeatureEnabled(featureName: keyof IAppConfig['features']): Promise<ApiResponse<boolean>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.features[featureName],
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_FEATURE_ERROR',
          message: error.message || 'Failed to check feature flag',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // DEFAULTS METHODS
  // ============================================

  async updateDefaults(
    defaults: Partial<IAppConfig['defaults']>,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return this.updateConfig(
        {
          defaults: {
            ...configResult.data.defaults,
            ...defaults,
          },
        },
        updatedBy
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_DEFAULTS_ERROR',
          message: error.message || 'Failed to update defaults',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // LIMITS METHODS
  // ============================================

  async updateLimits(
    limits: Partial<IAppConfig['limits']>,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return this.updateConfig(
        {
          limits: {
            ...configResult.data.limits,
            ...limits,
          },
        },
        updatedBy
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_LIMITS_ERROR',
          message: error.message || 'Failed to update limits',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // NOTIFICATIONS METHODS
  // ============================================

  async updateNotifications(
    notifications: Partial<IAppConfig['notifications']>,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return this.updateConfig(
        {
          notifications: {
            ...configResult.data.notifications,
            ...notifications,
            channels: {
              ...configResult.data.notifications.channels,
              ...(notifications.channels || {}),
            },
            timings: {
              ...configResult.data.notifications.timings,
              ...(notifications.timings || {}),
            },
          },
        },
        updatedBy
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_NOTIFICATIONS_ERROR',
          message: error.message || 'Failed to update notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // EMAIL TEMPLATES METHODS
  // ============================================

  async updateEmailTemplates(
    templates: Partial<IAppConfig['emailTemplates']>,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return this.updateConfig(
        {
          emailTemplates: {
            ...configResult.data.emailTemplates,
            ...templates,
          },
        },
        updatedBy
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_EMAIL_TEMPLATES_ERROR',
          message: error.message || 'Failed to update email templates',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // CONTACT & SOCIAL METHODS
  // ============================================

  async updateContact(
    contact: Partial<IAppConfig['contact']>,
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    try {
      const configResult = await this.getConfig();

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'App configuration not found',
            statusCode: 404,
          },
        };
      }

      return this.updateConfig(
        {
          contact: {
            ...configResult.data.contact,
            ...contact,
          },
        },
        updatedBy
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_CONTACT_ERROR',
          message: error.message || 'Failed to update contact',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async updateSocialMedia(
    socialMedia: IAppConfig['socialMedia'],
    updatedBy: string
  ): Promise<ApiResponse<IAppConfig>> {
    return this.updateConfig({ socialMedia }, updatedBy);
  }
  // ============================================
  // REAL-TIME LISTENER METHOD
  // ============================================
  /**
   * Subscribe to real-time configuration changes
   * @param onUpdate - Callback function called when config changes
   * @param onError - Optional error callback
   * @returns Unsubscribe function
   */
  subscribeToConfigChanges(
    onUpdate: (config: IAppConfig) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      ApiLogger.log('app_config', 'subscribeToConfigChanges', 'Starting real-time listener');

      const subscription = this.onSnapshot(
        AppConfigAPI.CONFIG_ID,
        (data) => {
          // ✅ BaseAPI returns T | null
          if (!data) {
            ApiLogger.warn('app_config', 'subscribeToConfigChanges', 'Config document not found or deleted');

            if (onError) {
              onError(new Error('Config document not found'));
            }
            return;
          }

          try {
            const config = data as IAppConfig;

            // Validate essential fields
            if (!config.app || !config.features) {
              throw new Error('Invalid config structure');
            }

            // Update internal cache
            this.cachedConfig = config;
            this.cacheTimestamp = Date.now();

            ApiLogger.log('app_config', 'subscribeToConfigChanges', {
              version: config.app.version,
              maintenance: config.app.maintenanceMode,
              timestamp: new Date().toISOString(),
            });

            onUpdate(config);
          } catch (parseError: any) {
            ApiLogger.error('app_config', 'subscribeToConfigChanges:parse', parseError);
            if (onError) {
              onError(new Error(`Failed to parse config: ${parseError.message}`));
            }
          }
        },
        (error) => {
          ApiLogger.error('app_config', 'subscribeToConfigChanges:snapshot', error);
          if (onError) {
            onError(error);
          }
        }
      );

      return () => {
        ApiLogger.log('app_config', 'subscribeToConfigChanges', 'Unsubscribing from real-time listener');
        subscription.unsubscribe();
      };
    } catch (error: any) {
      ApiLogger.error('app_config', 'subscribeToConfigChanges:init', error);

      if (onError) {
        onError(new Error(`Failed to initialize listener: ${error.message}`));
      }

      // Return no-op unsubscribe function
      return () => {
        ApiLogger.log('app_config', 'subscribeToConfigChanges', 'No-op unsubscribe (listener failed to start)');
      };
    }
  }

  /**
   * Subscribe with automatic error handling and retry
   * @param onUpdate - Callback function called when config changes
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Unsubscribe function
   */
  subscribeToConfigChangesWithRetry(
    onUpdate: (config: IAppConfig) => void,
    maxRetries: number = 3
  ): () => void {
    let retryCount = 0;
    let currentUnsubscribe: (() => void) | null = null;
    let retryTimeout: NodeJS.Timeout | null = null;
    let isDestroyed = false;

    const setupListener = () => {
      // Prevent setup if already destroyed
      if (isDestroyed) {
        ApiLogger.log('app_config', 'subscribeWithRetry', 'Listener destroyed, skipping setup');
        return;
      }

      // Clean up previous listener if exists
      if (currentUnsubscribe) {
        currentUnsubscribe();
        currentUnsubscribe = null;
      }

      currentUnsubscribe = this.subscribeToConfigChanges(
        (config) => {
          // ✅ Reset retry count on successful update
          if (retryCount > 0) {
            ApiLogger.log('app_config', 'subscribeWithRetry', 'Connection restored');
            retryCount = 0;
          }
          onUpdate(config);
        },
        (error) => {
          ApiLogger.error('app_config', 'subscribeWithRetry', {
            error: error.message,
            retryCount,
            maxRetries,
          });

          if (isDestroyed) {
            ApiLogger.log('app_config', 'subscribeWithRetry', 'Listener destroyed, skipping retry');
            return;
          }

          if (retryCount < maxRetries) {
            retryCount++;
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

            ApiLogger.log('app_config', 'subscribeWithRetry',
              `Retrying in ${delay}ms... (attempt ${retryCount}/${maxRetries})`
            );

            // Clear existing timeout
            if (retryTimeout) {
              clearTimeout(retryTimeout);
            }

            retryTimeout = setTimeout(() => {
              retryTimeout = null;
              setupListener();
            }, delay);
          } else {
            ApiLogger.error('app_config', 'subscribeWithRetry', 'Max retries reached, giving up');
            isDestroyed = true; // Stop further retries
          }
        }
      );
    };

    // Initial setup
    setupListener();

    // Return combined unsubscribe function
    return () => {
      ApiLogger.log('app_config', 'subscribeWithRetry', 'Cleanup: Unsubscribing and clearing retry');

      isDestroyed = true;

      if (retryTimeout) {
        clearTimeout(retryTimeout);
        retryTimeout = null;
      }

      if (currentUnsubscribe) {
        currentUnsubscribe();
        currentUnsubscribe = null;
      }
    };
  }
}

// Export singleton instance
export const appConfigAPI = new AppConfigAPI();