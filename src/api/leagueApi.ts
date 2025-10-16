import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';
import { SportType } from '../types/types';

const collectionName = 'leagues';

export interface ILeagueSettings {
    allowFriendlyMatches?: boolean;
    friendlyMatchesAffectStats?: boolean;
    friendlyMatchesAffectStandings?: boolean;
    friendlyMatchesRequireApproval?: boolean;
}

export const leagueApi = {
    add: async (data: any) => {
        return addBase(collectionName, data);
    },

    update: async (id: string, data: any) => {
        return updateBase(collectionName, id, data);
    },

    delete: async (id: string) => {
        return deleteByIdBase(collectionName, id);
    },

    getById: async (id: string) => {
        return getByIdBase(collectionName, id);
    },

    getAll: async () => {
        return getAllBase(collectionName);
    },

    getLeaguesBySportType: async (sportType: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('sportType', '==', sportType),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Ligler spora göre getirilemedi:', error);
            return [];
        }
    },

    getLeaguesByCreator: async (creatorId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('createdBy', '==', creatorId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Kullanıcının ligleri getirilemedi:', error);
            return [];
        }
    },

    getActiveLeagues: async () => {
        try {
            const now = new Date().toISOString();
            const q = query(
                collection(db, collectionName),
                where('seasonEndDate', '>=', now),
                orderBy('seasonEndDate', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Aktif ligler getirilemedi:', error);
            return [];
        }
    },

    getLeaguesByPlayer: async (playerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('playerIds', 'array-contains', playerId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncunun ligleri getirilemedi:', error);
            return [];
        }
    },

    // ============================================
    // NEW: FRIENDLY MATCH SETTINGS
    // ============================================

    /**
     * Update league friendly match settings
     */
    updateFriendlySettings: async (leagueId: string, settings: ILeagueSettings) => {
        try {
            return await updateBase(collectionName, leagueId, {
                settings: settings
            });
        } catch (error) {
            console.error('Friendly ayarları güncellenemedi:', error);
            throw error;
        }
    },

    /**
     * Get league friendly match settings
     */
    getFriendlySettings: async (leagueId: string): Promise<ILeagueSettings | null> => {
        try {
            const league: any = await getByIdBase(collectionName, leagueId);
            return league?.settings || null;
        } catch (error) {
            console.error('Friendly ayarları getirilemedi:', error);
            return null;
        }
    },

    /**
     * Check if friendly matches are allowed in league
     */
    isFriendlyMatchesAllowed: async (leagueId: string): Promise<boolean> => {
        try {
            const settings = await leagueApi.getFriendlySettings(leagueId);
            return settings?.allowFriendlyMatches ?? false;
        } catch (error) {
            console.error('Friendly izin kontrolü başarısız:', error);
            return false;
        }
    },

    /**
     * Get leagues that allow friendly matches
     */
    getLeaguesAllowingFriendlyMatches: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('settings.allowFriendlyMatches', '==', true),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Friendly izinli ligler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get leagues that friendly matches affect stats
     */
    getLeaguesWithFriendlyStatsEnabled: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('settings.friendlyMatchesAffectStats', '==', true),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Friendly stats aktif ligler getirilemedi:', error);
            return [];
        }
    },

    /**
     * Check if player can create friendly match in league
     */
    canPlayerCreateFriendlyMatch: async (
        leagueId: string,
        playerId: string
    ): Promise<boolean> => {
        try {
            const league: any = await getByIdBase(collectionName, leagueId);
            
            if (!league) return false;
            
            // Check if friendly matches are allowed
            if (!league.settings?.allowFriendlyMatches) return false;
            
            // Check if player is in league
            const isPlayerInLeague = league.playerIds?.includes(playerId);
            
            return isPlayerInLeague;
        } catch (error) {
            console.error('Friendly oluşturma yetkisi kontrolü başarısız:', error);
            return false;
        }
    },

    /**
     * Get player's leagues with friendly match permission
     */
    getPlayerLeaguesWithFriendlyPermission: async (playerId: string) => {
        try {
            const playerLeagues = await leagueApi.getLeaguesByPlayer(playerId);
            
            return playerLeagues.filter((league: any) => 
                league.settings?.allowFriendlyMatches === true
            );
        } catch (error) {
            console.error('Friendly izinli lig listesi getirilemedi:', error);
            return [];
        }
    },

    /**
     * Enable friendly matches for league
     */
    enableFriendlyMatches: async (
        leagueId: string,
        affectStats: boolean = false,
        affectStandings: boolean = false,
        requireApproval: boolean = false
    ) => {
        try {
            const settings: ILeagueSettings = {
                allowFriendlyMatches: true,
                friendlyMatchesAffectStats: affectStats,
                friendlyMatchesAffectStandings: affectStandings,
                friendlyMatchesRequireApproval: requireApproval
            };
            
            return await leagueApi.updateFriendlySettings(leagueId, settings);
        } catch (error) {
            console.error('Friendly aktifleştirme başarısız:', error);
            throw error;
        }
    },

    /**
     * Disable friendly matches for league
     */
    disableFriendlyMatches: async (leagueId: string) => {
        try {
            const settings: ILeagueSettings = {
                allowFriendlyMatches: false,
                friendlyMatchesAffectStats: false,
                friendlyMatchesAffectStandings: false,
                friendlyMatchesRequireApproval: false
            };
            
            return await leagueApi.updateFriendlySettings(leagueId, settings);
        } catch (error) {
            console.error('Friendly deaktifleştirme başarısız:', error);
            throw error;
        }
    },

    /**
     * Get league settings summary
     */
    getLeagueSettingsSummary: async (leagueId: string) => {
        try {
            const league: any = await getByIdBase(collectionName, leagueId);
            
            if (!league) {
                throw new Error('Lig bulunamadı');
            }

            return {
                leagueId: league.id,
                title: league.title,
                sportType: league.sportType,
                friendlySettings: {
                    allowed: league.settings?.allowFriendlyMatches ?? false,
                    affectStats: league.settings?.friendlyMatchesAffectStats ?? false,
                    affectStandings: league.settings?.friendlyMatchesAffectStandings ?? false,
                    requireApproval: league.settings?.friendlyMatchesRequireApproval ?? false
                },
                playerCount: league.playerIds?.length || 0,
                premiumPlayerCount: league.premiumPlayerIds?.length || 0,
                seasonActive: new Date(league.seasonEndDate) > new Date()
            };
        } catch (error) {
            console.error('Lig özet bilgileri getirilemedi:', error);
            throw error;
        }
    },

    /**
     * Bulk update friendly settings for multiple leagues
     */
    bulkUpdateFriendlySettings: async (
        leagueIds: string[],
        settings: ILeagueSettings
    ) => {
        try {
            const promises = leagueIds.map(leagueId =>
                leagueApi.updateFriendlySettings(leagueId, settings)
            );
            
            return await Promise.all(promises);
        } catch (error) {
            console.error('Toplu ayar güncelleme başarısız:', error);
            throw error;
        }
    },

    /**
     * Get leagues grouped by friendly settings
     */
    getLeaguesGroupedByFriendlySettings: async () => {
        try {
            const allLeagues: any[] = await leagueApi.getAll();
            
            return {
                allowsFriendly: allLeagues.filter(l => l.settings?.allowFriendlyMatches === true),
                affectsStats: allLeagues.filter(l => l.settings?.friendlyMatchesAffectStats === true),
                affectsStandings: allLeagues.filter(l => l.settings?.friendlyMatchesAffectStandings === true),
                requiresApproval: allLeagues.filter(l => l.settings?.friendlyMatchesRequireApproval === true),
                noFriendly: allLeagues.filter(l => !l.settings?.allowFriendlyMatches)
            };
        } catch (error) {
            console.error('Gruplu lig listesi getirilemedi:', error);
            return {
                allowsFriendly: [],
                affectsStats: [],
                affectsStandings: [],
                requiresApproval: [],
                noFriendly: []
            };
        }
    }
};