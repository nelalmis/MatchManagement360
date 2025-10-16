import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';
import { MatchType } from '../types/types';

const collectionName = 'matches';

export const matchApi = {
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

    getMatchesByFixture: async (fixtureId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('fixtureId', '==', fixtureId),
                orderBy('matchStartTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Fikstür maçları getirilemedi:', error);
            return [];
        }
    },

    getMatchesByStatus: async (status: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('status', '==', status),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Durum maçları getirilemedi:', error);
            return [];
        }
    },

    getUpcomingMatches: async (daysAhead: number = 7) => {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + daysAhead);

            const q = query(
                collection(db, collectionName),
                where('matchStartTime', '>=', now),
                where('matchStartTime', '<=', futureDate),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Yaklaşan maçlar getirilemedi:', error);
            return [];
        }
    },

    getMatchesByPlayer: async (playerId: string) => {
        try {
            // Registered players
            const q1 = query(
                collection(db, collectionName),
                where('registeredPlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const snapshot1 = await getDocs(q1);
            const matches1 = snapshot1.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Direct players
            const q2 = query(
                collection(db, collectionName),
                where('directPlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const snapshot2 = await getDocs(q2);
            const matches2 = snapshot2.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Premium players
            const q3 = query(
                collection(db, collectionName),
                where('premiumPlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const snapshot3 = await getDocs(q3);
            const matches3 = snapshot3.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Combine and remove duplicates
            const allMatches = [...matches1, ...matches2, ...matches3];
            const uniqueMatches = allMatches.filter((match, index, self) =>
                index === self.findIndex((m) => m.id === match.id)
            );

            return uniqueMatches;
        } catch (error) {
            console.error('Oyuncu maçları getirilemedi:', error);
            return [];
        }
    },

    getMatchesByOrganizer: async (organizerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('organizerPlayerIds', 'array-contains', organizerId),
                orderBy('matchStartTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Organizatör maçları getirilemedi:', error);
            return [];
        }
    },

    getActiveRegistrationMatches: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('status', '==', 'Kayıt Açık'),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Kayıt açık maçlar getirilemedi:', error);
            return [];
        }
    },

    // ============================================
    // Rating & Comments Related Queries
    // ============================================

    getMatchesPendingRatings: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('status', '==', 'Ödeme Bekliyor'),
                orderBy('matchStartTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Rating bekleyen maçlar getirilemedi:', error);
            return [];
        }
    },

    getCompletedMatchesWithMVP: async (limitCount: number = 20) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('status', '==', 'Tamamlandı'),
                orderBy('matchStartTime', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Tamamlanan maçlar getirilemedi:', error);
            return [];
        }
    },

    getMatchesByLeagueSeason: async (leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('matchStartTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig/sezon maçları getirilemedi:', error);
            return [];
        }
    },

    getMatchesByMVPPlayer: async (playerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('playerIdOfMatchMVP', '==', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('MVP maçları getirilemedi:', error);
            return [];
        }
    },

    getMatchesWithCommentsEnabled: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('commentsEnabled', '==', true),
                where('status', '==', 'Tamamlandı'),
                orderBy('matchStartTime', 'desc'),
                limit(50)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Yorum aktif maçlar getirilemedi:', error);
            return [];
        }
    },

    getRecentCompletedMatchesByFixture: async (fixtureId: string, limitCount: number = 5) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('fixtureId', '==', fixtureId),
                where('status', '==', 'Tamamlandı'),
                orderBy('matchStartTime', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Son tamamlanan maçlar getirilemedi:', error);
            return [];
        }
    },

    getMatchesByPlayerParticipation: async (playerId: string) => {
        try {
            // Team 1
            const q1 = query(
                collection(db, collectionName),
                where('team1PlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const snapshot1 = await getDocs(q1);
            const matches1 = snapshot1.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Team 2
            const q2 = query(
                collection(db, collectionName),
                where('team2PlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const snapshot2 = await getDocs(q2);
            const matches2 = snapshot2.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Combine and remove duplicates
            const allMatches = [...matches1, ...matches2];
            const uniqueMatches = allMatches.filter((match, index, self) =>
                index === self.findIndex((m) => m.id === match.id)
            );

            return uniqueMatches;
        } catch (error) {
            console.error('Oynadığı maçlar getirilemedi:', error);
            return [];
        }
    },

    // ============================================
    // NEW: Friendly Match & Type-based Queries
    // ============================================

    /**
     * Get matches by type (League or Friendly)
     * UPDATED: Uses 'type' field instead of 'matchType'
     */
    getMatchesByType: async (type: MatchType) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('type', '==', type),
                orderBy('matchStartTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error(`${type} maçları getirilemedi:`, error);
            return [];
        }
    },

    /**
     * Get public friendly matches with optional filters
     * UPDATED: Uses 'type' field
     */
    getPublicFriendlyMatches: async (filters?: {
        sportType?: string;
        location?: string;
        minDate?: Date;
        maxDate?: Date;
    }) => {
        try {
            let q = query(
                collection(db, collectionName),
                where('type', '==', MatchType.FRIENDLY),
                where('isPublic', '==', true),
                where('status', '==', 'Kayıt Açık')
            );

            // Add sport type filter if provided
            if (filters?.sportType) {
                q = query(q, where('sportType', '==', filters.sportType));
            }

            // Add location filter if provided
            if (filters?.location) {
                q = query(q, where('location', '==', filters.location));
            }

            // Add date range if provided
            if (filters?.minDate) {
                q = query(q, where('matchStartTime', '>=', filters.minDate));
            }

            q = query(q, orderBy('matchStartTime', 'asc'));

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Public friendly maçlar getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get player's matches grouped by type
     * UPDATED: Uses 'type' field
     */
    getPlayerMatchesGrouped: async (playerId: string) => {
        try {
            // Get all player matches
            const allMatches = await matchApi.getMatchesByPlayerParticipation(playerId);
            
            // Group by type
            const leagueMatches = allMatches.filter((m: any) => m.type === MatchType.LEAGUE);
            const friendlyMatches = allMatches.filter((m: any) => m.type === MatchType.FRIENDLY);

            return {
                all: allMatches,
                league: leagueMatches,
                friendly: friendlyMatches
            };
        } catch (error) {
            console.error('Gruplanmış maçlar getirilemedi:', error);
            return {
                all: [],
                league: [],
                friendly: []
            };
        }
    },

    /**
     * Get matches for statistics calculation
     * UPDATED: Uses 'type' field
     */
    getMatchesForStats: async (playerId: string, options?: {
        includeLeague?: boolean;
        includeFriendly?: boolean;
        onlyCompleted?: boolean;
    }) => {
        try {
            const { includeLeague = true, includeFriendly = true, onlyCompleted = true } = options || {};

            let matches = await matchApi.getMatchesByPlayerParticipation(playerId);

            // Filter by completion status
            if (onlyCompleted) {
                matches = matches.filter((m: any) => m.status === 'Tamamlandı');
            }

            // Filter by type - UPDATED to use 'type'
            if (!includeLeague) {
                matches = matches.filter((m: any) => m.type !== MatchType.LEAGUE);
            }
            if (!includeFriendly) {
                matches = matches.filter((m: any) => m.type !== MatchType.FRIENDLY);
            }

            return matches;
        } catch (error) {
            console.error('İstatistik maçları getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get organizer's match templates
     */
    getMatchTemplates: async (organizerId: string) => {
        try {
            const q = query(
                collection(db, 'matchTemplates'),
                where('organizerId', '==', organizerId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Maç şablonları getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get upcoming friendly matches for a player
     * UPDATED: Uses 'type' field
     */
    getUpcomingFriendlyMatches: async (playerId: string) => {
        try {
            const now = new Date();
            
            const q = query(
                collection(db, collectionName),
                where('type', '==', MatchType.FRIENDLY),
                where('matchStartTime', '>=', now),
                where('registeredPlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'asc')
            );
            
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Yaklaşan friendly maçlar getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get matches by sport type
     */
    getMatchesBySportType: async (sportType: string, limitCount: number = 50) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('sportType', '==', sportType),
                orderBy('matchStartTime', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Spor türü maçları getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get matches that affect standings
     */
    getStandingsAffectingMatches: async (fixtureId?: string) => {
        try {
            let q = query(
                collection(db, collectionName),
                where('affectsStandings', '==', true),
                where('status', '==', 'Tamamlandı')
            );

            if (fixtureId) {
                q = query(q, where('fixtureId', '==', fixtureId));
            }

            q = query(q, orderBy('matchStartTime', 'desc'));

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Puan tablosu maçları getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get matches that affect player stats
     */
    getStatsAffectingMatches: async (playerId: string) => {
        try {
            const matches = await matchApi.getMatchesByPlayerParticipation(playerId);

            return matches.filter((m: any) => 
                m.affectsStats === true && 
                m.status === 'Tamamlandı'
            );
        } catch (error) {
            console.error('İstatistik etkileyen maçlar getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get matches by organizerId (for Friendly matches)
     * UPDATED: Uses 'organizerId' field
     */
    getMatchesByOrganizerId: async (organizerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('organizerId', '==', organizerId),
                orderBy('matchStartTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Organizatör maçları (organizerId) getirilemedi:', error);
            return [];
        }
    }
};