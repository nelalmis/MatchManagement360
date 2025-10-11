// ============================================
// matchRatingApi.ts
// ============================================
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
    }
};
