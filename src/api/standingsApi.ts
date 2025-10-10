import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'standings';

export const standingsApi = {
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

    getStandingsByLeague: async (leagueId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                orderBy('lastUpdated', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig puan durumu getirilemedi:', error);
            return [];
        }
    },

    getStandingsByLeagueAndSeason: async (leagueId: string, seasonId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                where('seasonId', '==', seasonId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))[0] || null;
        } catch (error) {
            console.error('Sezon puan durumu getirilemedi:', error);
            return null;
        }
    }
}