import {
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'players';

export const playerApi = {
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

    getPlayerByPhone: async (phone: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('phone', '==', phone)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncu telefona göre getirilemedi:', error);
            return [];
        }
    },

    getPlayerByEmail: async (email: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('email', '==', email)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncu emaile göre getirilemedi:', error);
            return [];
        }
    },

    getPlayersByIds: async (playerIds: string[]) => {
        try {
            if (playerIds.length === 0) return [];
            
            const players = await Promise.all(
                playerIds.map(id => getByIdBase(collectionName, id))
            );
            return players.filter(p => p !== null);
        } catch (error) {
            console.error('Oyuncular ID listesine göre getirilemedi:', error);
            return [];
        }
    },

    getPlayersBySport: async (sportType: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('favoriteSports', 'array-contains', sportType)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncular spora göre getirilemedi:', error);
            return [];
        }
    }
}