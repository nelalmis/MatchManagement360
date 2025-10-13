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

//indexes
/*
Collection: playerRatingProfiles
Fields:
- leagueId (Ascending)
- seasonId (Ascending)
- totalRatingsReceived (Descending)
- overallRating (Descending)


Collection: playerRatingProfiles
Fields:
- leagueId (Ascending)
- seasonId (Ascending)
- ratingTrend (Ascending)
- totalRatingsReceived (Descending)
- overallRating (Descending)


Collection: playerRatingProfiles
Fields:
- leagueId (Ascending)
- seasonId (Ascending)
- mvpCount (Descending)
- mvpRate (Descending)

Collection: playerRatingProfiles
Fields:
- playerId (Ascending)
- lastUpdated (Descending)

Collection: playerRatingProfiles
Fields:
- leagueId (Ascending)
- seasonId (Ascending)
- overallRating (Descending)


try {
  // Complex query with composite index
  const results = await complexQuery();
  return results;
} catch (error) {
  // Fallback to simple query + client-side sorting
  const fallbackResults = await simpleQuery();
  return fallbackResults.sort(...).slice(0, limit);
}

*/
const profileCollectionName = 'playerRatingProfiles';

export const playerRatingProfileApi = {
    add: async (data: any) => {
        return addBase(profileCollectionName, data);
    },

    update: async (id: string, data: any) => {
        return updateBase(profileCollectionName, id, data);
    },

    delete: async (id: string) => {
        return deleteByIdBase(profileCollectionName, id);
    },

    getById: async (id: string) => {
        return getByIdBase(profileCollectionName, id);
    },

    getAll: async () => {
        return getAllBase(profileCollectionName);
    },

    // Get profile by player, league and season
    getProfileByPlayerLeagueSeason: async (playerId: string, leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('playerId', '==', playerId),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) return null;
            
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Profil getirilemedi:', error);
            return null;
        }
    },

    // Get all profiles for a player (across leagues/seasons)
    getProfilesByPlayer: async (playerId: string) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('playerId', '==', playerId),
                orderBy('lastUpdated', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncu profilleri getirilemedi:', error);
            return [];
        }
    },

    // Get all profiles for a league/season
    getProfilesByLeagueSeason: async (leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('overallRating', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig/sezon profilleri getirilemedi:', error);
            return [];
        }
    },

    // Get top rated players in a league/season
    getTopRatedPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                where('totalRatingsReceived', '>=', 3), // Minimum 3 ratings
                orderBy('totalRatingsReceived', 'desc'),
                orderBy('overallRating', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('En iyi oyuncular getirilemedi:', error);
            return [];
        }
    },

    // Get most improved players (trending up)
    getMostImprovedPlayers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                where('ratingTrend', '==', 'improving'),
                where('totalRatingsReceived', '>=', 3),
                orderBy('totalRatingsReceived', 'desc'),
                orderBy('overallRating', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('En gelişen oyuncular getirilemedi:', error);
            return [];
        }
    },

    // Get MVP leaders (most MVP awards)
    getMVPLeaders: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('mvpCount', 'desc'),
                orderBy('mvpRate', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('MVP liderleri getirilemedi:', error);
            return [];
        }
    },
     // ============================================
    // ✅ YENİ METODLAR (OPSIYONEL)
    // ============================================

    /**
     * Get profiles by rating range
     */
    getProfilesByRatingRange: async (
        leagueId: string,
        seasonId: string,
        minRating: number,
        maxRating: number
    ) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                where('overallRating', '>=', minRating),
                where('overallRating', '<=', maxRating),
                orderBy('overallRating', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Rating aralığı sorgulanamadı:', error);
            return [];
        }
    },

    /**
     * Get consistent performers (stable trend)
     */
    getConsistentPerformers: async (leagueId: string, seasonId: string, limitCount: number = 10) => {
        try {
            const q = query(
                collection(db, profileCollectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                where('ratingTrend', '==', 'stable'),
                where('overallRating', '>=', 4.0),
                orderBy('overallRating', 'desc'),
                limit(limitCount)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Tutarlı oyuncular getirilemedi:', error);
            return [];
        }
    },

    /**
     * Delete all profiles for a season (cleanup)
     */
    deleteProfilesBySeason: async (leagueId: string, seasonId: string) => {
        try {
            const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(leagueId, seasonId);
            
            const deletePromises = profiles.map((profile: any) => 
                deleteByIdBase(profileCollectionName, profile.id)
            );

            await Promise.all(deletePromises);
            return { success: true, deletedCount: profiles.length };
        } catch (error) {
            console.error('Sezon profilleri silinemedi:', error);
            return { success: false, deletedCount: 0 };
        }
    }
};

