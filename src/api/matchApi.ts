import {
    collection,
    getDocs,
    query,
    where,
    orderBy
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const collectionName = 'matches';

export const matchApi = {
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

    getMatchesByFixture: async (fixtureId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('fixtureId', '==', fixtureId),
                orderBy('matchStartTime', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Fikstür maçları getirilemedi:', error);
            return [];
        }
    },

    getMatchesByStatus: async (status: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('status', '==', status),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Durum maçları getirilemedi:', error);
            return [];
        }
    },

    getUpcomingMatches: async (daysAhead: number = 7) => {
        try {
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + daysAhead);

            const q = query(
                collection(db, collectionName),
                where('matchStartTime', '>=', now),
                where('matchStartTime', '<=', futureDate),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Yaklaşan maçlar getirilemedi:', error);
            return [];
        }
    },

    getMatchesByPlayer: async (playerId: string) => {
        try {
            // Registered players
            const q1 = query(
                collection(db, collectionName),
                where('registeredPlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const snapshot1 = await getDocs(q1);
            const matches1 = snapshot1.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Direct players
            const q2 = query(
                collection(db, collectionName),
                where('directPlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const snapshot2 = await getDocs(q2);
            const matches2 = snapshot2.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Premium players
            const q3 = query(
                collection(db, collectionName),
                where('premiumPlayerIds', 'array-contains', playerId),
                orderBy('matchStartTime', 'desc')
            );
            const snapshot3 = await getDocs(q3);
            const matches3 = snapshot3.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Combine and remove duplicates
            const allMatches = [...matches1, ...matches2, ...matches3];
            const uniqueMatches = allMatches.filter((match, index, self) =>
                index === self.findIndex((m) => m.id === match.id)
            );

            return uniqueMatches;
        } catch (error) {
            console.error('Oyuncu maçları getirilemedi:', error);
            return [];
        }
    },

    getMatchesByOrganizer: async (organizerId: string) => {
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
            console.error('Organizatör maçları getirilemedi:', error);
            return [];
        }
    },

    getActiveRegistrationMatches: async () => {
        try {
            const q = query(
                collection(db, collectionName),
                where('status', '==', 'Kayıt Açık'),
                orderBy('matchStartTime', 'asc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Kayıt açık maçlar getirilemedi:', error);
            return [];
        }
    }
}