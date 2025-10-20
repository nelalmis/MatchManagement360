// ============================================
// services/FriendlyMatchConfigService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { friendlyMatchConfigsAPI } from '../../api/apiLayer/friendlyMatchConfigAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IFriendlyMatchConfig } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class FriendlyMatchConfigService {
  // ============================================
  // 1. CORE OPERATIONS
  // ============================================

  /**
   * Get config by organizer ID
   */
  static async getConfig(organizerId: string): Promise<ApiResponse<IFriendlyMatchConfig>> {
    return friendlyMatchConfigsAPI.getByOrganizerId(organizerId);
  }

  /**
   * Initialize config for new organizer
   */
  static async initializeConfig(
    organizerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      ApiLogger.log('FriendlyMatchConfigService', 'initializeConfig', {
        organizerId,
      });

      const result = await friendlyMatchConfigsAPI.initializeConfig(organizerId);

      if (result.success) {
        ApiLogger.success('FriendlyMatchConfigService', 'initializeConfig', {
          organizerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FriendlyMatchConfigService', 'initializeConfig', error);
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
   * Get or create config
   */
  static async getOrCreateConfig(
    organizerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      const configResult = await this.getConfig(organizerId);

      if (configResult.success && configResult.data) {
        return configResult;
      }

      return this.initializeConfig(organizerId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_OR_CREATE_ERROR',
          message: error.message || 'Konfigürasyon alınamadı veya oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reset config to defaults
   */
  static async resetConfig(
    organizerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      ApiLogger.log('FriendlyMatchConfigService', 'resetConfig', { organizerId });

      const result = await friendlyMatchConfigsAPI.resetConfig(organizerId);

      if (result.success) {
        ApiLogger.success('FriendlyMatchConfigService', 'resetConfig', {
          organizerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FriendlyMatchConfigService', 'resetConfig', error);
      return {
        success: false,
        error: {
          code: 'RESET_CONFIG_ERROR',
          message: error.message || 'Konfigürasyon sıfırlanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 2. DEFAULT SETTINGS MANAGEMENT
  // ============================================

  /**
   * Update default settings
   */
  static async updateDefaultSettings(
    organizerId: string,
    settings: Partial<IFriendlyMatchConfig['defaultSettings']>
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      // Validate settings
      if (settings.staffCount !== undefined && settings.staffCount < 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_STAFF_COUNT',
            message: 'Kadro sayısı en az 2 olmalı',
            statusCode: 400,
          },
        };
      }

      if (settings.reserveCount !== undefined && settings.reserveCount < 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESERVE_COUNT',
            message: 'Yedek sayısı negatif olamaz',
            statusCode: 400,
          },
        };
      }

      if (settings.pricePerPlayer !== undefined && settings.pricePerPlayer < 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_PRICE',
            message: 'Ücret negatif olamaz',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FriendlyMatchConfigService', 'updateDefaultSettings', {
        organizerId,
      });

      const result = await friendlyMatchConfigsAPI.updateDefaultSettings(
        organizerId,
        settings
      );

      if (result.success) {
        ApiLogger.success('FriendlyMatchConfigService', 'updateDefaultSettings', {
          organizerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FriendlyMatchConfigService', 'updateDefaultSettings', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_DEFAULT_SETTINGS_ERROR',
          message: error.message || 'Varsayılan ayarlar güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update payment info
   */
  static async updatePaymentInfo(
    organizerId: string,
    paymentInfo: NonNullable<IFriendlyMatchConfig['defaultSettings']['paymentInfo']>
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      // Validate IBAN format (basic check)
      if (paymentInfo.iban && !this.isValidIBAN(paymentInfo.iban)) {
        return {
          success: false,
          error: {
            code: 'INVALID_IBAN',
            message: 'Geçersiz IBAN formatı',
            statusCode: 400,
          },
        };
      }

      return friendlyMatchConfigsAPI.updatePaymentInfo(organizerId, paymentInfo);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PAYMENT_INFO_ERROR',
          message: error.message || 'Ödeme bilgileri güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove payment info
   */
  static async removePaymentInfo(
    organizerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    return friendlyMatchConfigsAPI.removePaymentInfo(organizerId);
  }

  // ============================================
  // 3. FAVORITE PLAYERS MANAGEMENT
  // ============================================

  /**
   * Add favorite player
   */
  static async addFavoritePlayer(
    organizerId: string,
    playerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      ApiLogger.log('FriendlyMatchConfigService', 'addFavoritePlayer', {
        organizerId,
        playerId,
      });

      const result = await friendlyMatchConfigsAPI.addFavoritePlayer(
        organizerId,
        playerId
      );

      if (result.success) {
        ApiLogger.success('FriendlyMatchConfigService', 'addFavoritePlayer', {
          organizerId,
          playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FriendlyMatchConfigService', 'addFavoritePlayer', error);
      return {
        success: false,
        error: {
          code: 'ADD_FAVORITE_ERROR',
          message: error.message || 'Favori oyuncu eklenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove favorite player
   */
  static async removeFavoritePlayer(
    organizerId: string,
    playerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    return friendlyMatchConfigsAPI.removeFavoritePlayer(organizerId, playerId);
  }

  /**
   * Set favorite players (replace all)
   */
  static async setFavoritePlayers(
    organizerId: string,
    playerIds: string[]
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    return friendlyMatchConfigsAPI.setFavoritePlayers(organizerId, playerIds);
  }

  /**
   * Clear all favorite players
   */
  static async clearFavoritePlayers(
    organizerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    return friendlyMatchConfigsAPI.clearFavoritePlayers(organizerId);
  }

  /**
   * Get favorite players
   */
  static async getFavoritePlayers(
    organizerId: string
  ): Promise<ApiResponse<string[]>> {
    try {
      const configResult = await this.getConfig(organizerId);

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'Konfigürasyon bulunamadı',
            statusCode: 404,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.favoritePlayerIds || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_FAVORITES_ERROR',
          message: error.message || 'Favori oyuncular alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if player is favorite
   */
  static async isFavoritePlayer(
    organizerId: string,
    playerId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const favoritesResult = await this.getFavoritePlayers(organizerId);

      if (!favoritesResult.success) {
        return {
          success: false,
          error: favoritesResult.error,
        };
      }

      return {
        success: true,
        data: favoritesResult.data?.includes(playerId) || false,
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
  // 4. TEMPLATE MANAGEMENT
  // ============================================

  /**
   * Add template
   */
  static async addTemplate(
    organizerId: string,
    template: Omit<IFriendlyMatchConfig['templates'][0], 'id'>
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      // Validate template
      if (!template.name || template.name.trim().length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_TEMPLATE_NAME',
            message: 'Şablon adı boş olamaz',
            statusCode: 400,
          },
        };
      }

      if (template.settings.staffCount < 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_STAFF_COUNT',
            message: 'Kadro sayısı en az 2 olmalı',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FriendlyMatchConfigService', 'addTemplate', {
        organizerId,
        templateName: template.name,
      });

      const result = await friendlyMatchConfigsAPI.addTemplate(organizerId, template);

      if (result.success) {
        ApiLogger.success('FriendlyMatchConfigService', 'addTemplate', {
          organizerId,
          templateName: template.name,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FriendlyMatchConfigService', 'addTemplate', error);
      return {
        success: false,
        error: {
          code: 'ADD_TEMPLATE_ERROR',
          message: error.message || 'Şablon eklenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(
    organizerId: string,
    templateId: string,
    updates: Partial<Omit<IFriendlyMatchConfig['templates'][0], 'id'>>
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      // Validate updates
      if (updates.settings?.staffCount !== undefined && updates.settings.staffCount < 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_STAFF_COUNT',
            message: 'Kadro sayısı en az 2 olmalı',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FriendlyMatchConfigService', 'updateTemplate', {
        organizerId,
        templateId,
      });

      const result = await friendlyMatchConfigsAPI.updateTemplate(
        organizerId,
        templateId,
        updates
      );

      if (result.success) {
        ApiLogger.success('FriendlyMatchConfigService', 'updateTemplate', {
          organizerId,
          templateId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FriendlyMatchConfigService', 'updateTemplate', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_TEMPLATE_ERROR',
          message: error.message || 'Şablon güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove template
   */
  static async removeTemplate(
    organizerId: string,
    templateId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    return friendlyMatchConfigsAPI.removeTemplate(organizerId, templateId);
  }

  /**
   * Get template by ID
   */
  static async getTemplate(
    organizerId: string,
    templateId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig['templates'][0] | null>> {
    return friendlyMatchConfigsAPI.getTemplateById(organizerId, templateId);
  }

  /**
   * Get all templates
   */
  static async getAllTemplates(
    organizerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig['templates']>> {
    try {
      const configResult = await this.getConfig(organizerId);

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'Konfigürasyon bulunamadı',
            statusCode: 404,
          },
        };
      }

      return {
        success: true,
        data: configResult.data.templates || [],
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_TEMPLATES_ERROR',
          message: error.message || 'Şablonlar alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Clone template
   */
  static async cloneTemplate(
    organizerId: string,
    templateId: string,
    newName: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      if (!newName || newName.trim().length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_TEMPLATE_NAME',
            message: 'Yeni şablon adı boş olamaz',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FriendlyMatchConfigService', 'cloneTemplate', {
        organizerId,
        templateId,
        newName,
      });

      const result = await friendlyMatchConfigsAPI.cloneTemplate(
        organizerId,
        templateId,
        newName
      );

      if (result.success) {
        ApiLogger.success('FriendlyMatchConfigService', 'cloneTemplate', {
          organizerId,
          newName,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FriendlyMatchConfigService', 'cloneTemplate', error);
      return {
        success: false,
        error: {
          code: 'CLONE_TEMPLATE_ERROR',
          message: error.message || 'Şablon klonlanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Clear all templates
   */
  static async clearTemplates(
    organizerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    return friendlyMatchConfigsAPI.clearTemplates(organizerId);
  }

  // ============================================
  // 5. RECENT SETTINGS (CACHE)
  // ============================================

  /**
   * Record last used settings
   */
  static async recordLastUsedSettings(
    organizerId: string,
    settings: {
      location?: string;
      pricePerPlayer?: number;
      staffCount?: number;
    }
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    try {
      ApiLogger.log('FriendlyMatchConfigService', 'recordLastUsedSettings', {
        organizerId,
      });

      const result = await friendlyMatchConfigsAPI.recordLastUsedSettings(
        organizerId,
        settings
      );

      if (result.success) {
        ApiLogger.success('FriendlyMatchConfigService', 'recordLastUsedSettings', {
          organizerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FriendlyMatchConfigService', 'recordLastUsedSettings', error);
      return {
        success: false,
        error: {
          code: 'RECORD_SETTINGS_ERROR',
          message: error.message || 'Son ayarlar kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Clear recent settings
   */
  static async clearRecentSettings(
    organizerId: string
  ): Promise<ApiResponse<IFriendlyMatchConfig>> {
    return friendlyMatchConfigsAPI.clearRecentSettings(organizerId);
  }

  // ============================================
  // 6. QUICK MATCH SETTINGS
  // ============================================

  /**
   * Get quick match settings (combines default + recent)
   */
  static async getQuickMatchSettings(organizerId: string): Promise<ApiResponse<{
    location?: string;
    staffCount?: number;
    reserveCount?: number;
    pricePerPlayer?: number;
    paymentInfo?: IFriendlyMatchConfig['defaultSettings']['paymentInfo'];
  }>> {
    return friendlyMatchConfigsAPI.getQuickMatchSettings(organizerId);
  }

  /**
   * Apply template to quick settings
   */
  static async applyTemplate(
    organizerId: string,
    templateId: string
  ): Promise<ApiResponse<{
    location: string;
    staffCount: number;
    reserveCount: number;
    pricePerPlayer: number;
    matchDuration: number;
    sportType: string;
  }>> {
    try {
      const templateResult = await this.getTemplate(organizerId, templateId);

      if (!templateResult.success || !templateResult.data) {
        return {
          success: false,
          error: templateResult.error || {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Şablon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const template = templateResult.data;

      return {
        success: true,
        data: {
          location: template.settings.location,
          staffCount: template.settings.staffCount,
          reserveCount: template.settings.reserveCount,
          pricePerPlayer: template.settings.pricePerPlayer,
          matchDuration: template.settings.matchDuration,
          sportType: template.sportType,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'APPLY_TEMPLATE_ERROR',
          message: error.message || 'Şablon uygulanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 7. CONFIG SUMMARY
  // ============================================

  /**
   * Get config summary for display
   */
  static async getConfigSummary(organizerId: string): Promise<ApiResponse<{
    hasDefaultSettings: boolean;
    hasPaymentInfo: boolean;
    favoritePlayersCount: number;
    templatesCount: number;
    hasRecentSettings: boolean;
  }>> {
    try {
      const configResult = await this.getConfig(organizerId);

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: configResult.error || {
            code: 'CONFIG_NOT_FOUND',
            message: 'Konfigürasyon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const config = configResult.data;

      const hasDefaultSettings =
        !!config.defaultSettings.location ||
        !!config.defaultSettings.pricePerPlayer ||
        !!config.defaultSettings.staffCount;

      const hasPaymentInfo = !!config.defaultSettings.paymentInfo?.iban;

      const hasRecentSettings =
        !!config.recentSettings?.lastLocation ||
        !!config.recentSettings?.lastPrice ||
        !!config.recentSettings?.lastStaffCount;

      return {
        success: true,
        data: {
          hasDefaultSettings,
          hasPaymentInfo,
          favoritePlayersCount: config.favoritePlayerIds?.length || 0,
          templatesCount: config.templates?.length || 0,
          hasRecentSettings,
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
  // 8. HELPER METHODS
  // ============================================

  /**
   * Validate IBAN format (basic Turkish IBAN check)
   */
  private static isValidIBAN(iban: string): boolean {
    // Remove spaces and convert to uppercase
    const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

    // Turkish IBAN: TR + 2 check digits + 24 digits = 26 characters
    if (!cleanIBAN.startsWith('TR') || cleanIBAN.length !== 26) {
      return false;
    }

    // Check if remaining characters are digits
    const digits = cleanIBAN.slice(2);
    return /^\d{24}$/.test(digits);
  }

  /**
   * Format settings for display
   */
  static formatSettings(settings: IFriendlyMatchConfig['defaultSettings']): {
    location: string;
    staffCount: string;
    price: string;
    hasPayment: boolean;
  } {
    return {
      location: settings.location || 'Belirtilmemiş',
      staffCount: settings.staffCount
        ? `${settings.staffCount} + ${settings.reserveCount || 0} yedek`
        : 'Belirtilmemiş',
      price: settings.pricePerPlayer
        ? `${settings.pricePerPlayer} TL`
        : 'Ücretsiz',
      hasPayment: !!settings.paymentInfo?.iban,
    };
  }

  /**
   * Get template suggestions based on usage
   */
  static async getTemplateSuggestions(
    organizerId: string
  ): Promise<ApiResponse<{
    mostUsed?: IFriendlyMatchConfig['templates'][0];
    newest?: IFriendlyMatchConfig['templates'][0];
    recommended: string[];
  }>> {
    try {
      const templatesResult = await this.getAllTemplates(organizerId);

      if (!templatesResult.success || !templatesResult.data) {
        return {
          success: false,
          error: templatesResult.error || {
            code: 'GET_TEMPLATES_ERROR',
            message: 'Şablonlar alınamadı',
            statusCode: 404,
          },
        };
      }

      const templates = templatesResult.data;

      if (templates.length === 0) {
        return {
          success: true,
          data: {
            recommended: [
              'İlk şablonunu oluştur',
              'Sık kullandığın ayarları kaydet',
              'Hızlı maç oluşturma için şablon kullan',
            ],
          },
        };
      }

      // Newest is the last one (highest ID)
      const newest = templates[templates.length - 1];

      // Most used would require usage tracking - for now just use first
      const mostUsed = templates[0];

      const recommended = [
        `${templates.length} şablonun var`,
        'Yeni şablon oluşturabilirsin',
        'Şablonları düzenle veya klonla',
      ];

      return {
        success: true,
        data: {
          mostUsed,
          newest,
          recommended,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUGGESTIONS_ERROR',
          message: error.message || 'Öneriler alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

export default FriendlyMatchConfigService;



/*

// ✅ Get or create config (auto-initialize)
const config = await FriendlyMatchConfigService.getOrCreateConfig(organizerId);

// ✅ Update default settings
await FriendlyMatchConfigService.updateDefaultSettings(organizerId, {
  location: 'Ankara Spor Salonu',
  staffCount: 10,
  reserveCount: 2,
  pricePerPlayer: 50,
});

// ✅ Set payment info (with IBAN validation)
await FriendlyMatchConfigService.updatePaymentInfo(organizerId, {
  iban: 'TR33 0006 1005 1978 6457 8413 26',
  accountName: 'John Doe',
});

// ✅ Add favorite player
await FriendlyMatchConfigService.addFavoritePlayer(organizerId, playerId);

// ✅ Check if favorite (for UI badges)
const isFav = await FriendlyMatchConfigService.isFavoritePlayer(
  organizerId,
  playerId
);
if (isFav.data) {
  // Show ⭐ badge
}

// ✅ Create a template
await FriendlyMatchConfigService.addTemplate(organizerId, {
  name: 'Cumartesi Maçı',
  sportType: 'FOOTBALL',
  settings: {
    location: 'Ankara Spor Salonu',
    staffCount: 10,
    reserveCount: 2,
    pricePerPlayer: 50,
    matchDuration: 90,
  },
});

// ✅ Apply template to match creation
const templateSettings = await FriendlyMatchConfigService.applyTemplate(
  organizerId,
  templateId
);
// Use templateSettings.data to pre-fill match form

// ✅ Clone template
await FriendlyMatchConfigService.cloneTemplate(
  organizerId,
  templateId,
  'Pazar Maçı (Cumartesi Kopyası)'
);

// ✅ Record last used settings (auto-cache)
await FriendlyMatchConfigService.recordLastUsedSettings(organizerId, {
  location: 'İstanbul Halısaha',
  pricePerPlayer: 60,
  staffCount: 12,
});

// ✅ Get quick match settings (default + recent)
const quickSettings = await FriendlyMatchConfigService.getQuickMatchSettings(
  organizerId
);
// Use quickSettings.data to pre-fill "Quick Match" form

// ✅ Get config summary for dashboard
const summary = await FriendlyMatchConfigService.getConfigSummary(organizerId);
console.log(`Favoriler: ${summary.data?.favoritePlayersCount}`);
console.log(`Şablonlar: ${summary.data?.templatesCount}`);
console.log(`Ödeme bilgisi: ${summary.data?.hasPaymentInfo ? 'Var' : 'Yok'}`);

// ✅ Format settings for display
const formatted = FriendlyMatchConfigService.formatSettings(
  config.data!.defaultSettings
);
console.log('Konum:', formatted.location);
console.log('Kadro:', formatted.staffCount);
console.log('Ücret:', formatted.price);

// ✅ Get template suggestions
const suggestions = await FriendlyMatchConfigService.getTemplateSuggestions(
  organizerId
);
console.log('En son:', suggestions.data?.newest?.name);
console.log('Öneriler:', suggestions.data?.recommended);

// ✅ Reset config to defaults
await FriendlyMatchConfigService.resetConfig(organizerId);

*/