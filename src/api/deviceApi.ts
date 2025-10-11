import {
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'devices';

export const deviceApi = {
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

    getDevicesByPlayer: async (playerId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('playerId', '==', playerId)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting devices by player:', error);
            throw error;
        }
    },

    getActiveDevices: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('isActive', '==', true)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting active devices:', error);
            throw error;
        }
    },

    getDeviceByDeviceId: async (deviceId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('deviceId', '==', deviceId)
            );
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                return null;
            }
            
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        } catch (error) {
            console.error('Error getting device by deviceId:', error);
            throw error;
        }
    },

    // Real-time listener for player's devices
    listenToPlayerDevices: (playerId: string, callback: (devices: any[]) => void) => {
        const q = query(
            collection(db, collectionName),
            where('playerId', '==', playerId)
        );
        
        return onSnapshot(q, (querySnapshot) => {
            const devices = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(devices);
        });
    },
};