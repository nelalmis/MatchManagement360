import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    doc,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'friendlyMatchConfigs';

export interface IFriendlyMatchConfig {
    id: string;
    organizerId: string;

    // Varsayılan ayarlar
    defaultLocation?: string;
    defaultStaffCount?: number;
    defaultReserveCount?: number;
    defaultPrice?: number;
    defaultPeterIban?: string;
    defaultPeterFullName?: string;

    // Favori oyuncular
    favoritePlayerIds?: string[];

    // Şablon maçlar
    templates?: Array<{
        id: string;
        name: string;
        settings: any; // Partial<IMatch>
    }>;

    createdAt: string;
    updatedAt?: string;
}

export const friendlyMatchConfigApi = {
    /**
     * Add new friendly match config
     */
    add: async (data: Omit<IFriendlyMatchConfig, 'id'>) => {
        return addBase(collectionName, data);
    },

    /**
     * Update friendly match config
     */
    update: async (id: string, data: Partial<IFriendlyMatchConfig>) => {
        return updateBase(collectionName, id, data);
    },

    /**
     * Delete friendly match config
     */
    delete: async (id: string) => {
        return deleteByIdBase(collectionName, id);
    },

    /**
     * Get config by ID
     */
    getById: async (id: string) => {
        return getByIdBase(collectionName, id);
    },

    /**
     * Get all configs
     */
    getAll: async () => {
        return getAllBase(collectionName);
    },

    /**
     * Get config by organizer ID
     */
    getByOrganizerId: async (organizerId: string): Promise<IFriendlyMatchConfig | null> => {
        try {
            const q = query(
                collection(db, collectionName),
                where('organizerId', '==', organizerId)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                return null;
            }

            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            } as IFriendlyMatchConfig;
        } catch (error) {
            console.error('Organizatör config getirilemedi:', error);
            return null;
        }
    },

    /**
     * Create or update config for organizer
     */
    upsertByOrganizerId: async (
        organizerId: string,
        data: Partial<Omit<IFriendlyMatchConfig, 'id' | 'organizerId'>>
    ) => {
        try {
            const existingConfig = await friendlyMatchConfigApi.getByOrganizerId(organizerId);

            if (existingConfig) {
                // Update existing
                return await updateBase(collectionName, existingConfig.id, {
                    ...data,
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Create new
                return await addBase(collectionName, {
                    organizerId,
                    ...data,
                    createdAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Config upsert başarısız:', error);
            throw error;
        }
    },

    /**
     * Add template to config
     */
    addTemplate: async (
        organizerId: string,
        template: { id: string; name: string; settings: any }
    ) => {
        try {
            const config = await friendlyMatchConfigApi.getByOrganizerId(organizerId);

            if (!config) {
                // Create new config with template
                return await friendlyMatchConfigApi.upsertByOrganizerId(organizerId, {
                    templates: [template]
                });
            }

            const templates = config.templates || [];
            templates.push(template);

            return await updateBase(collectionName, config.id, {
                templates,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Şablon eklenemedi:', error);
            throw error;
        }
    },

    /**
     * Update template in config
     */
    updateTemplate: async (
        organizerId: string,
        templateId: string,
        updatedTemplate: Partial<{ name: string; settings: any }>
    ) => {
        try {
            const config = await friendlyMatchConfigApi.getByOrganizerId(organizerId);

            if (!config || !config.templates) {
                throw new Error('Config veya şablonlar bulunamadı');
            }

            const templates = config.templates.map(t =>
                t.id === templateId
                    ? { ...t, ...updatedTemplate }
                    : t
            );

            return await updateBase(collectionName, config.id, {
                templates,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Şablon güncellenemedi:', error);
            throw error;
        }
    },

    /**
     * Delete template from config
     */
    deleteTemplate: async (organizerId: string, templateId: string) => {
        try {
            const config = await friendlyMatchConfigApi.getByOrganizerId(organizerId);

            if (!config || !config.templates) {
                throw new Error('Config veya şablonlar bulunamadı');
            }

            const templates = config.templates.filter(t => t.id !== templateId);

            return await updateBase(collectionName, config.id, {
                templates,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Şablon silinemedi:', error);
            throw error;
        }
    },

    /**
     * Get template by ID
     */
    getTemplate: async (organizerId: string, templateId: string) => {
        try {
            const config = await friendlyMatchConfigApi.getByOrganizerId(organizerId);

            if (!config || !config.templates) {
                return null;
            }

            return config.templates.find(t => t.id === templateId) || null;
        } catch (error) {
            console.error('Şablon getirilemedi:', error);
            return null;
        }
    },

    /**
     * Add favorite player
     */
    addFavoritePlayer: async (organizerId: string, playerId: string) => {
        try {
            const config = await friendlyMatchConfigApi.getByOrganizerId(organizerId);

            if (!config) {
                return await friendlyMatchConfigApi.upsertByOrganizerId(organizerId, {
                    favoritePlayerIds: [playerId]
                });
            }

            const favoritePlayerIds = config.favoritePlayerIds || [];

            // Check if already exists
            if (favoritePlayerIds.includes(playerId)) {
                return config;
            }

            favoritePlayerIds.push(playerId);

            return await updateBase(collectionName, config.id, {
                favoritePlayerIds,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Favori oyuncu eklenemedi:', error);
            throw error;
        }
    },

    /**
     * Remove favorite player
     */
    removeFavoritePlayer: async (organizerId: string, playerId: string) => {
        try {
            const config = await friendlyMatchConfigApi.getByOrganizerId(organizerId);

            if (!config || !config.favoritePlayerIds) {
                return null;
            }

            const favoritePlayerIds = config.favoritePlayerIds.filter(id => id !== playerId);

            return await updateBase(collectionName, config.id, {
                favoritePlayerIds,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Favori oyuncu silinemedi:', error);
            throw error;
        }
    },

    /**
     * Update default settings
     */
    updateDefaults: async (
        organizerId: string,
        defaults: {
            defaultLocation?: string;
            defaultStaffCount?: number;
            defaultReserveCount?: number;
            defaultPrice?: number;
            defaultPeterIban?: string;
            defaultPeterFullName?: string;
        }
    ) => {
        try {
            return await friendlyMatchConfigApi.upsertByOrganizerId(organizerId, defaults);
        } catch (error) {
            console.error('Varsayılan ayarlar güncellenemedi:', error);
            throw error;
        }
    }
};


/*
// 1. Config oluştur/getir
const config = await friendlyMatchConfigService.getOrCreateConfig(organizerId);

// 2. Varsayılan ayarları güncelle
await friendlyMatchConfigService.updateDefaultSettings(organizerId, {
  location: 'Beşiktaş Halı Saha',
  staffCount: 10,
  price: 100
});

// 3. Şablon kaydet
const templateId = await friendlyMatchConfigService.saveTemplate(
  organizerId,
  'Cumartesi Maçı',
  matchSettings
);

// 4. Favori oyuncu ekle
await friendlyMatchConfigService.addFavoritePlayer(organizerId, playerId);

// 5. Hızlı başlangıç datası
const quickStart = await friendlyMatchConfigService.getQuickStartData(organizerId);


*/