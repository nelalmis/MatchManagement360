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
            console.error('Kullanıcı maçları getirilemedi:', error);
            return [];
        }
    },
}