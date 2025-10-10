import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'matchFixtures';

export const matchFixtureApi = {
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

    getFixturesByLeague: async (leagueId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('leagueId', '==', leagueId),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Lig fikstürleri getirilemedi:', error);
            return [];
        }
    },

    getActiveFixtures: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('status', '==', 'Aktif'),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Aktif fikstürler getirilemedi:', error);
            return [];
        }
    },

    getPeriodicFixtures: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('isPeriodic', '==', true),
                where('status', '==', 'Aktif'),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Periyodik fikstürler getirilemedi:', error);
            return [];
        }
    },

    getFixturesByOrganizer: async (organizerId: string) => {
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
            console.error('Organizatör fikstürleri getirilemedi:', error);
            return [];
        }
    },

    getUpcomingFixtures: async (daysAhead: number = 7) => {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + daysAhead);

            const q = query(
                collection(db, collectionName),
                where('matchStartTime', '>=', now),
                where('matchStartTime', '<=', futureDate),
                where('status', '==', 'Aktif'),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Yaklaşan fikstürler getirilemedi:', error);
            return [];
        }
    }
}