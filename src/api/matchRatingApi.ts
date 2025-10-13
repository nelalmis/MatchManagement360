// ============================================
// matchRatingApi.ts
// ===================================

// Collection: indexes
// 1. matchId (Ascending) + createdAt (Descending)
// 2. raterPlayerId (Ascending) + createdAt (Descending)
// 3. ratedPlayerId (Ascending) + createdAt (Descending)
// 4. leagueId (Ascending) + createdAt (Descending)
// 5. leagueId (Ascending) + seasonId (Ascending) + createdAt (Descending)
// 6. ratedPlayerId (Ascending) + leagueId (Ascending) + seasonId (Ascending) + createdAt (Descending)
// api/matchRatingApi.ts

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

const collectionName = 'matchRatings';

export const matchRatingApi = {
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

    // Get all ratings for a specific match
    getRatingsByMatch: async (matchId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('matchId', '==', matchId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Maç ratingleri getirilemedi:', error);
            return [];
        }
    },

    // Get ratings given by a specific player
    getRatingsByRater: async (raterId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('raterId', '==', raterId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Puanlayan ratingler getirilemedi:', error);
            return [];
        }
    },

    // Get ratings received by a specific player
    getRatingsByRatedPlayer: async (ratedPlayerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('ratedPlayerId', '==', ratedPlayerId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Puanlanan oyuncu ratingleri getirilemedi:', error);
            return [];
        }
    },

    // Check if rater already rated a player in a match
    getRatingByMatchRaterAndPlayer: async (matchId: string, raterId: string, ratedPlayerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('matchId', '==', matchId),
                where('raterId', '==', raterId),
                where('ratedPlayerId', '==', ratedPlayerId),
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
            console.error('Rating kontrolü yapılamadı:', error);
            return null;
        }
    },

    // Get all ratings for a player in a specific league/season
    getRatingsByPlayerLeagueSeason: async (playerId: string, leagueId: string, seasonId: string) => {
        try {
            // Note: This requires a composite index in Firestore
            const q = query(
                collection(db, collectionName),
                where('ratedPlayerId', '==', playerId),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig/sezon ratingleri getirilemedi:', error);
            return [];
        }
    },

    // ============================================
    // ✅ YENİ METODLAR
    // ============================================

    /**
     * Get all ratings for a specific league
     */
    getRatingsByLeague: async (leagueId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig ratingleri getirilemedi:', error);
            return [];
        }
    },

    /**
     * Get all ratings for a specific season in a league
     */
    getRatingsBySeason: async (leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Sezon ratingleri getirilemedi:', error);
            return [];
        }
    },

    /**
     * ✅ Get all ratings by a rater for a specific match
     * (Bir oyuncunun bir maçta verdiği tüm puanlamalar)
     */
    getRatingsByRaterAndMatch: async (raterId: string, matchId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('raterId', '==', raterId),
                where('matchId', '==', matchId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Rater match ratingleri getirilemedi:', error);
            return [];
        }
    },

    /**
     * ✅ Count unique raters for a match
     * (Bir maça kaç farklı oyuncunun puanlama yaptığını say)
     */
    countUniqueRatersByMatch: async (matchId: string) => {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            const uniqueRaters = new Set(ratings.map((r: any) => r.raterId));
            return uniqueRaters.size;
        } catch (error) {
            console.error('Unique rater sayısı hesaplanamadı:', error);
            return 0;
        }
    },

    /**
     * ✅ Get average rating for a player in a match
     * (Bir oyuncunun bir maçtaki ortalama puanı)
     */
    getPlayerAverageInMatch: async (playerId: string, matchId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('matchId', '==', matchId),
                where('ratedPlayerId', '==', playerId)
            );
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) return 0;

            const ratings = querySnapshot.docs.map(doc => doc.data());
            const total = ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
            return parseFloat((total / ratings.length).toFixed(2));
        } catch (error) {
            console.error('Oyuncu ortalaması hesaplanamadı:', error);
            return 0;
        }
    },

    /**
     * ✅ Get all player averages for a match
     * (Bir maçtaki tüm oyuncuların ortalama puanları)
     */
    getAllPlayerAveragesInMatch: async (matchId: string) => {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            
            // Group by player
            const playerTotals: Record<string, { total: number; count: number }> = {};
            
            ratings.forEach((rating: any) => {
                const playerId = rating.ratedPlayerId;
                if (!playerTotals[playerId]) {
                    playerTotals[playerId] = { total: 0, count: 0 };
                }
                playerTotals[playerId].total += rating.rating || 0;
                playerTotals[playerId].count++;
            });

            // Calculate averages
            const averages: Record<string, number> = {};
            Object.entries(playerTotals).forEach(([playerId, data]) => {
                averages[playerId] = parseFloat((data.total / data.count).toFixed(2));
            });

            return averages;
        } catch (error) {
            console.error('Tüm oyuncu ortalamaları hesaplanamadı:', error);
            return {};
        }
    },

    /**
     * ✅ Calculate MVP for a match
     * (Bir maçın MVP'sini hesapla)
     */
    calculateMatchMVP: async (matchId: string) => {
        try {
            const averages = await matchRatingApi.getAllPlayerAveragesInMatch(matchId);
            
            if (Object.keys(averages).length === 0) return null;

            // Find player with highest average
            let mvpId = '';
            let highestAvg = 0;

            Object.entries(averages).forEach(([playerId, avg]) => {
                if (avg > highestAvg) {
                    highestAvg = avg;
                    mvpId = playerId;
                }
            });

            return mvpId || null;
        } catch (error) {
            console.error('MVP hesaplanamadı:', error);
            return null;
        }
    },

    /**
     * ✅ Get match rating summary
     * (Bir maçın rating özeti)
     */
    getMatchRatingSummary: async (matchId: string) => {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            
            if (ratings.length === 0) {
                return {
                    totalRatings: 0,
                    averageRating: 0,
                    uniqueRaters: 0,
                    topRatedPlayers: []
                };
            }

            // Calculate summary
            const totalRating = ratings.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
            const averageRating = parseFloat((totalRating / ratings.length).toFixed(2));
            const uniqueRaters = new Set(ratings.map((r: any) => r.raterId)).size;

            // Get player averages
            const playerAverages = await matchRatingApi.getAllPlayerAveragesInMatch(matchId);
            const topRatedPlayers = Object.entries(playerAverages)
                .map(([playerId, avg]) => ({ playerId, averageRating: avg as number }))
                .sort((a, b) => b.averageRating - a.averageRating)
                .slice(0, 5);

            return {
                totalRatings: ratings.length,
                averageRating,
                uniqueRaters,
                topRatedPlayers
            };
        } catch (error) {
            console.error('Rating özeti hesaplanamadı:', error);
            return {
                totalRatings: 0,
                averageRating: 0,
                uniqueRaters: 0,
                topRatedPlayers: []
            };
        }
    },

    /**
     * ✅ Delete all ratings for a match
     * (Bir maçın tüm puanlamalarını sil)
     */
    deleteRatingsByMatch: async (matchId: string) => {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            
            const deletePromises = ratings.map((rating: any) => 
                deleteByIdBase(collectionName, rating.id)
            );

            await Promise.all(deletePromises);
            return { success: true };
        } catch (error) {
            console.error('Maç ratingleri silinemedi:', error);
            return { success: false };
        }
    }
};