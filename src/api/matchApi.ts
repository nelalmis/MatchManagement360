// // src/api/matchApi.ts
// import baseApi from "./baseApi";

// export const matchApi = {
//   getMatches: async () => {
//     const response = await baseApi.get("/matches");
//     return response.data;
//   },

//   getMatchById: async (id: string) => {
//     const response = await baseApi.get(`/matches/${id}`);
//     return response.data;
//   },

//   createMatch: async (payload: {
//     name: string;
//     date: string;
//     location: string;
//   }) => {
//     const response = await baseApi.post("/matches", payload);
//     return response.data;
//   },
// };

import {
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';
const collectionName = 'matches';

export const matchApi = {

    // Maç ekle
    add: async (matchData: any) => {
        return addBase(collectionName, matchData);
    },

    // Tüm maçları getir
    getAllMatches: async () => {
        return getAllBase(collectionName);
    },

    // Maç güncelle
    updateMatch: async (id: string, updates: any) => {
        return updateBase(collectionName, id, updates);
    },

    // Maç sil
    deleteMatchById: async (id: string) => {
        return deleteByIdBase(collectionName, id);
    },

    getMatchById: async (id: string) => {
        return getByIdBase(collectionName, id);
    },

    // Belirli kullanıcının maçlarını getir
    getUserMatches: async (userId: string) => {
        try {
            const q = query(
                collection(db, collectionName),
                where('userId', '==', userId)
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

    // Gerçek zamanlı dinleme (Real-time)
    listenToMatches: async (callback: (matches: any[]) => void) => {
        const unsubscribe = onSnapshot(
            collection(db, collectionName),
            (snapshot) => {
                const matches = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(matches);
            },
            (error) => {
                console.error('Dinleme hatası:', error);
            }
        );

        // Cleanup için return et
        return unsubscribe;
    }
}

