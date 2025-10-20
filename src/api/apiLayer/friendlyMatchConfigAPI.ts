// ============================================
// api/FriendlyMatchConfigsAPI.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { ApiLogger } from '../base/ApiLogger';
import { IFriendlyMatchConfig } from '../../types/entity/types';


// ============================================
// API CLASS
// ============================================
export class FriendlyMatchConfigsAPI extends BaseAPI<IFriendlyMatchConfig> {
    constructor() {
        super('friendly_match_configs');
    }

    // ============================================
    // CORE METHODS
    // ============================================

    /**
     * Get config by organizer ID
     * Config ID is same as organizer ID
     */
    async getByOrganizerId(organizerId: string): Promise<ApiResponse<IFriendlyMatchConfig>> {
        return this.getById(organizerId);
    }

    /**
     * Initialize default config for a new organizer
     */
    async initializeConfig(organizerId: string): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            // Check if config already exists
            const existingResult = await this.exists(organizerId);

            if (existingResult.success && existingResult.data) {
                return this.getByOrganizerId(organizerId);
            }

            // Create default config
            const defaultConfig: Omit<IFriendlyMatchConfig, 'id'> = {
                organizerId,
                defaultSettings: {
                    staffCount: 10,
                    reserveCount: 2,
                },
                favoritePlayerIds: [],
                templates: [],
                recentSettings: {},
                createdAt: new Date().toISOString(),
            };

            return this.createWithId(organizerId, defaultConfig);
        } catch (error: any) {
            ApiLogger.error('friendly_match_configs', 'initializeConfig', error);
            return {
                success: false,
                error: {
                    code: 'INIT_CONFIG_ERROR',
                    message: error.message || 'Failed to initialize config',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update config
     */
    async updateConfig(
        organizerId: string,
        updates: Partial<Omit<IFriendlyMatchConfig, 'id' | 'organizerId' | 'createdAt' | 'updatedAt'>>
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        return this.update(organizerId, updates);
    }

    // ============================================
    // DEFAULT SETTINGS METHODS
    // ============================================

    /**
     * Update default settings
     */
    async updateDefaultSettings(
        organizerId: string,
        settings: Partial<IFriendlyMatchConfig['defaultSettings']>
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(organizerId, {
                defaultSettings: {
                    ...configResult.data.defaultSettings,
                    ...settings,
                    paymentInfo: settings.paymentInfo
                        ? {
                            ...configResult.data.defaultSettings.paymentInfo,
                            ...settings.paymentInfo,
                        }
                        : configResult.data.defaultSettings.paymentInfo,
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_DEFAULT_SETTINGS_ERROR',
                    message: error.message || 'Failed to update default settings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update payment info
     */
    async updatePaymentInfo(
        organizerId: string,
        paymentInfo: NonNullable<IFriendlyMatchConfig['defaultSettings']['paymentInfo']>
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        return this.updateDefaultSettings(organizerId, { paymentInfo });
    }

    /**
     * Remove payment info
     */
    async removePaymentInfo(organizerId: string): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(organizerId, {
                defaultSettings: {
                    ...configResult.data.defaultSettings,
                    paymentInfo: undefined,
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_PAYMENT_INFO_ERROR',
                    message: error.message || 'Failed to remove payment info',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // FAVORITE PLAYERS METHODS
    // ============================================

    /**
     * Add favorite player
     */
    async addFavoritePlayer(
        organizerId: string,
        playerId: string
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            const currentFavorites = configResult.data.favoritePlayerIds || [];

            if (currentFavorites.includes(playerId)) {
                return {
                    success: true,
                    data: configResult.data,
                };
            }

            return this.update(organizerId, {
                favoritePlayerIds: [...currentFavorites, playerId],
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'ADD_FAVORITE_PLAYER_ERROR',
                    message: error.message || 'Failed to add favorite player',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove favorite player
     */
    async removeFavoritePlayer(
        organizerId: string,
        playerId: string
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            const currentFavorites = configResult.data.favoritePlayerIds || [];
            const updatedFavorites = currentFavorites.filter((id) => id !== playerId);

            return this.update(organizerId, {
                favoritePlayerIds: updatedFavorites,
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_FAVORITE_PLAYER_ERROR',
                    message: error.message || 'Failed to remove favorite player',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Set favorite players
     */
    async setFavoritePlayers(
        organizerId: string,
        playerIds: string[]
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        return this.update(organizerId, {
            favoritePlayerIds: playerIds,
        });
    }

    /**
     * Clear favorite players
     */
    async clearFavoritePlayers(organizerId: string): Promise<ApiResponse<IFriendlyMatchConfig>> {
        return this.update(organizerId, {
            favoritePlayerIds: [],
        });
    }

    // ============================================
    // TEMPLATE METHODS
    // ============================================

    /**
     * Add template
     */
    async addTemplate(
        organizerId: string,
        template: Omit<IFriendlyMatchConfig['templates'][0], 'id'>
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            const newTemplate: IFriendlyMatchConfig['templates'][0] = {
                ...template,
                id: Date.now().toString(),
            };

            const currentTemplates = configResult.data.templates || [];

            return this.update(organizerId, {
                templates: [...currentTemplates, newTemplate],
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'ADD_TEMPLATE_ERROR',
                    message: error.message || 'Failed to add template',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update template
     */
    async updateTemplate(
        organizerId: string,
        templateId: string,
        updates: Partial<Omit<IFriendlyMatchConfig['templates'][0], 'id'>>
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            const currentTemplates = configResult.data.templates || [];
            const templateIndex = currentTemplates.findIndex((t) => t.id === templateId);

            if (templateIndex === -1) {
                return {
                    success: false,
                    error: {
                        code: 'TEMPLATE_NOT_FOUND',
                        message: 'Template not found',
                        statusCode: 404,
                    },
                };
            }

            const updatedTemplates = [...currentTemplates];
            updatedTemplates[templateIndex] = {
                ...updatedTemplates[templateIndex],
                ...updates,
                settings: updates.settings
                    ? {
                        ...updatedTemplates[templateIndex].settings,
                        ...updates.settings,
                    }
                    : updatedTemplates[templateIndex].settings,
            };

            return this.update(organizerId, {
                templates: updatedTemplates,
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_TEMPLATE_ERROR',
                    message: error.message || 'Failed to update template',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove template
     */
    async removeTemplate(
        organizerId: string,
        templateId: string
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            const currentTemplates = configResult.data.templates || [];
            const updatedTemplates = currentTemplates.filter((t) => t.id !== templateId);

            return this.update(organizerId, {
                templates: updatedTemplates,
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_TEMPLATE_ERROR',
                    message: error.message || 'Failed to remove template',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Get template by ID
     */
    async getTemplateById(
        organizerId: string,
        templateId: string
    ): Promise<ApiResponse<IFriendlyMatchConfig['templates'][0] | null>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            const template = configResult.data.templates?.find((t) => t.id === templateId);

            return {
                success: true,
                data: template || null,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_TEMPLATE_ERROR',
                    message: error.message || 'Failed to get template',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Clear all templates
     */
    async clearTemplates(organizerId: string): Promise<ApiResponse<IFriendlyMatchConfig>> {
        return this.update(organizerId, {
            templates: [],
        });
    }

    // ============================================
    // RECENT SETTINGS METHODS (CACHE)
    // ============================================

    /**
     * Update recent settings
     */
    async updateRecentSettings(
        organizerId: string,
        settings: IFriendlyMatchConfig['recentSettings']
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(organizerId, {
                recentSettings: {
                    ...configResult.data.recentSettings,
                    ...settings,
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_RECENT_SETTINGS_ERROR',
                    message: error.message || 'Failed to update recent settings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Record last used settings (cache update)
     */
    async recordLastUsedSettings(
        organizerId: string,
        settings: {
            location?: string;
            pricePerPlayer?: number;
            staffCount?: number;
        }
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        return this.updateRecentSettings(organizerId, {
            lastLocation: settings.location,
            lastPrice: settings.pricePerPlayer,
            lastStaffCount: settings.staffCount,
        });
    }

    /**
     * Clear recent settings
     */
    async clearRecentSettings(organizerId: string): Promise<ApiResponse<IFriendlyMatchConfig>> {
        return this.update(organizerId, {
            recentSettings: {},
        });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Get quick match settings (combines default + recent)
     */
    async getQuickMatchSettings(organizerId: string): Promise<ApiResponse<{
            location?: string;
            staffCount?: number;
            reserveCount?: number;
            pricePerPlayer?: number;
            paymentInfo?: IFriendlyMatchConfig['defaultSettings']['paymentInfo'];
        }>> {
        try {
            const configResult = await this.getByOrganizerId(organizerId);

            if (!configResult.success || !configResult.data) {
                return {
                    success: false,
                    error: configResult.error || {
                        code: 'CONFIG_NOT_FOUND',
                        message: 'Config not found',
                        statusCode: 404,
                    },
                };
            }

            const config = configResult.data;
            const quickSettings = {
                location: config.recentSettings?.lastLocation || config.defaultSettings.location,
                staffCount: config.recentSettings?.lastStaffCount || config.defaultSettings.staffCount,
                reserveCount: config.defaultSettings.reserveCount,
                pricePerPlayer: config.recentSettings?.lastPrice || config.defaultSettings.pricePerPlayer,
                paymentInfo: config.defaultSettings.paymentInfo,
            };

            return {
                success: true,
                data: quickSettings,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_QUICK_SETTINGS_ERROR',
                    message: error.message || 'Failed to get quick match settings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Clone template to create a new one
     */
    async cloneTemplate(
        organizerId: string,
        templateId: string,
        newName: string
    ): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            const templateResult = await this.getTemplateById(organizerId, templateId);

            if (!templateResult.success || !templateResult.data) {
                return {
                    success: false,
                    error: templateResult.error || {
                        code: 'TEMPLATE_NOT_FOUND',
                        message: 'Template not found',
                        statusCode: 404,
                    },
                };
            }

            const clonedTemplate: Omit<IFriendlyMatchConfig['templates'][0], 'id'> = {
                ...templateResult.data,
                name: newName,
            };

            return this.addTemplate(organizerId, clonedTemplate);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'CLONE_TEMPLATE_ERROR',
                    message: error.message || 'Failed to clone template',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Reset config to defaults
     */
    async resetConfig(organizerId: string): Promise<ApiResponse<IFriendlyMatchConfig>> {
        try {
            await this.delete(organizerId);
            return this.initializeConfig(organizerId);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'RESET_CONFIG_ERROR',
                    message: error.message || 'Failed to reset config',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
}

// Export singleton instance
export const friendlyMatchConfigsAPI = new FriendlyMatchConfigsAPI();