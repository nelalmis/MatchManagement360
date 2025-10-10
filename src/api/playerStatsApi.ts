import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'playerStats';

export const playerStatsApi = {
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

    getStatsByPlayer: async (playerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('playerId', '==', playerId),
                orderBy('seasonId', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncu istatistikleri getirilemedi:', error);
            return [];
        }
    },

    getStatsByLeague: async (leagueId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                orderBy('points', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig istatistikleri getirilemedi:', error);
            return [];
        }
    },

    getStatsByLeagueAndSeason: async (leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('points', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Sezon istatistikleri getirilemedi:', error);
            return [];
        }
    },

    getStatsByPlayerLeagueSeason: async (playerId: string, leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('playerId', '==', playerId),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId)
            );
            const querySnapshot = await getDocs(q);
            const docs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return docs.length > 0 ? docs[0] : null;
        } catch (error) {
            console.error('Oyuncu-lig-sezon istatistiği getirilemedi:', error);
            return null;
        }
    },

    getTopScorers: async (leagueId: string, seasonId: string, limit: number = 10) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('totalGoals', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .slice(0, limit);
        } catch (error) {
            console.error('Top skorerler getirilemedi:', error);
            return [];
        }
    },

    getTopAssists: async (leagueId: string, seasonId: string, limit: number = 10) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId),
                orderBy('totalAssists', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .slice(0, limit);
        } catch (error) {
            console.error('Top asistler getirilemedi:', error);
            return [];
        }
    }
}