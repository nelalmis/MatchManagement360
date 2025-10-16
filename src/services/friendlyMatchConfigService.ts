import { friendlyMatchConfigApi, IFriendlyMatchConfig } from '../api/friendlyMatchConfigApi';
import { v4 as uuidv4 } from 'uuid';

export class FriendlyMatchConfigService {
    /**
     * Get or create config for organizer
     */
    async getOrCreateConfig(organizerId: string): Promise<IFriendlyMatchConfig > {
        let config :any = await friendlyMatchConfigApi.getByOrganizerId(organizerId);
        
        if (!config) {
            // Create default config
            const newConfig = {
                organizerId,
                favoritePlayerIds: [],
                templates: [],
                createdAt: new Date().toISOString()
            };
            
            const result:any = await friendlyMatchConfigApi.add(newConfig);
            config = await friendlyMatchConfigApi.getById(result.id);
        }
        
        return config!;
    }

    /**
     * Get config for organizer
     */
    async getConfig(organizerId: string): Promise<IFriendlyMatchConfig | null> {
        return await friendlyMatchConfigApi.getByOrganizerId(organizerId);
    }

    /**
     * Update default settings
     */
    async updateDefaultSettings(
        organizerId: string,
        settings: {
            location?: string;
            staffCount?: number;
            reserveCount?: number;
            price?: number;
            peterIban?: string;
            peterFullName?: string;
        }
    ): Promise<any> {
        const defaults = {
            defaultLocation: settings.location,
            defaultStaffCount: settings.staffCount,
            defaultReserveCount: settings.reserveCount,
            defaultPrice: settings.price,
            defaultPeterIban: settings.peterIban,
            defaultPeterFullName: settings.peterFullName
        };

        // Remove undefined values
        Object.keys(defaults).forEach(key => 
            defaults[key as keyof typeof defaults] === undefined && delete defaults[key as keyof typeof defaults]
        );

        return await friendlyMatchConfigApi.updateDefaults(organizerId, defaults);
    }

    /**
     * Get default settings
     */
    async getDefaultSettings(organizerId: string) {
        const config = await this.getConfig(organizerId);
        
        if (!config) {
            return null;
        }

        return {
            location: config.defaultLocation,
            staffCount: config.defaultStaffCount,
            reserveCount: config.defaultReserveCount,
            price: config.defaultPrice,
            peterIban: config.defaultPeterIban,
            peterFullName: config.defaultPeterFullName
        };
    }

    // ============================================
    // TEMPLATE MANAGEMENT
    // ============================================

    /**
     * Save match as template
     */
    async saveTemplate(
        organizerId: string,
        templateName: string,
        matchSettings: any
    ): Promise<string> {
        const templateId = uuidv4();
        
        const template = {
            id: templateId,
            name: templateName,
            settings: matchSettings
        };

        await friendlyMatchConfigApi.addTemplate(organizerId, template);
        
        return templateId;
    }

    /**
     * Get all templates for organizer
     */
    async getTemplates(organizerId: string): Promise<Array<{ id: string; name: string; settings: any }>> {
        const config = await this.getConfig(organizerId);
        return config?.templates || [];
    }

    /**
     * Get template by ID
     */
    async getTemplate(organizerId: string, templateId: string) {
        return await friendlyMatchConfigApi.getTemplate(organizerId, templateId);
    }

    /**
     * Update template
     */
    async updateTemplate(
        organizerId: string,
        templateId: string,
        updates: {
            name?: string;
            settings?: any;
        }
    ): Promise<any> {
        return await friendlyMatchConfigApi.updateTemplate(organizerId, templateId, updates);
    }

    /**
     * Delete template
     */
    async deleteTemplate(organizerId: string, templateId: string): Promise<any> {
        return await friendlyMatchConfigApi.deleteTemplate(organizerId, templateId);
    }

    /**
     * Duplicate template
     */
    async duplicateTemplate(
        organizerId: string,
        templateId: string,
        newName?: string
    ): Promise<string> {
        const template = await this.getTemplate(organizerId, templateId);
        
        if (!template) {
            throw new Error('Şablon bulunamadı');
        }

        const name = newName || `${template.name} (Kopya)`;
        
        return await this.saveTemplate(organizerId, name, template.settings);
    }

    // ============================================
    // FAVORITE PLAYERS MANAGEMENT
    // ============================================

    /**
     * Add favorite player
     */
    async addFavoritePlayer(organizerId: string, playerId: string): Promise<any> {
        return await friendlyMatchConfigApi.addFavoritePlayer(organizerId, playerId);
    }

    /**
     * Remove favorite player
     */
    async removeFavoritePlayer(organizerId: string, playerId: string): Promise<any> {
        return await friendlyMatchConfigApi.removeFavoritePlayer(organizerId, playerId);
    }

    /**
     * Get favorite players
     */
    async getFavoritePlayers(organizerId: string): Promise<string[]> {
        const config = await this.getConfig(organizerId);
        return config?.favoritePlayerIds || [];
    }

    /**
     * Check if player is favorite
     */
    async isFavoritePlayer(organizerId: string, playerId: string): Promise<boolean> {
        const favorites = await this.getFavoritePlayers(organizerId);
        return favorites.includes(playerId);
    }

    /**
     * Toggle favorite player
     */
    async toggleFavoritePlayer(organizerId: string, playerId: string): Promise<boolean> {
        const isFavorite = await this.isFavoritePlayer(organizerId, playerId);
        
        if (isFavorite) {
            await this.removeFavoritePlayer(organizerId, playerId);
            return false;
        } else {
            await this.addFavoritePlayer(organizerId, playerId);
            return true;
        }
    }

    /**
     * Bulk add favorite players
     */
    async addMultipleFavoritePlayers(organizerId: string, playerIds: string[]): Promise<any> {
        const config = await this.getOrCreateConfig(organizerId);
        const currentFavorites = config.favoritePlayerIds || [];
        
        // Merge and remove duplicates
        const newFavorites = [...new Set([...currentFavorites, ...playerIds])];
        
        return await friendlyMatchConfigApi.upsertByOrganizerId(organizerId, {
            favoritePlayerIds: newFavorites
        });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    /**
     * Apply template settings to match data
     */
    async applyTemplateToMatch(
        organizerId: string,
        templateId: string,
        baseMatchData?: any
    ): Promise<any> {
        const template = await this.getTemplate(organizerId, templateId);
        
        if (!template) {
            throw new Error('Şablon bulunamadı');
        }

        // Merge template settings with base data (base data takes priority)
        return {
            ...template.settings,
            ...baseMatchData
        };
    }

    /**
     * Get quick start data (defaults + favorites)
     */
    async getQuickStartData(organizerId: string) {
        const config = await this.getOrCreateConfig(organizerId);
        
        return {
            defaults: {
                location: config.defaultLocation,
                staffCount: config.defaultStaffCount,
                reserveCount: config.defaultReserveCount,
                price: config.defaultPrice,
                peterIban: config.defaultPeterIban,
                peterFullName: config.defaultPeterFullName
            },
            favoritePlayers: config.favoritePlayerIds || [],
            templates: config.templates || []
        };
    }

    /**
     * Export config as JSON
     */
    async exportConfig(organizerId: string): Promise<string> {
        const config = await this.getConfig(organizerId);
        
        if (!config) {
            throw new Error('Config bulunamadı');
        }

        return JSON.stringify(config, null, 2);
    }

    /**
     * Import config from JSON
     */
    async importConfig(organizerId: string, jsonData: string): Promise<any> {
        try {
            const importedConfig = JSON.parse(jsonData);
            
            // Validate basic structure
            if (!importedConfig.organizerId) {
                throw new Error('Geçersiz config formatı');
            }

            // Update with imported data (keep organizerId from parameter)
            const dataToImport = {
                ...importedConfig,
                organizerId, // Override with current organizer
                updatedAt: new Date().toISOString()
            };

            delete dataToImport.id; // Remove old ID
            delete dataToImport.createdAt; // Keep original creation time

            return await friendlyMatchConfigApi.upsertByOrganizerId(organizerId, dataToImport);
        } catch (error) {
            console.error('Config import hatası:', error);
            throw new Error('Config import edilemedi');
        }
    }

    /**
     * Reset config to defaults
     */
    async resetConfig(organizerId: string): Promise<any> {
        const config = await this.getConfig(organizerId);
        
        if (!config) {
            return null;
        }

        return await friendlyMatchConfigApi.update(config.id, {
            defaultLocation: undefined,
            defaultStaffCount: undefined,
            defaultReserveCount: undefined,
            defaultPrice: undefined,
            defaultPeterIban: undefined,
            defaultPeterFullName: undefined,
            favoritePlayerIds: [],
            templates: [],
            updatedAt: new Date().toISOString()
        });
    }
    
}

export const friendlyMatchConfigService = new FriendlyMatchConfigService();