import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'leagues';

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
    }
}