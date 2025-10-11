import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
} from 'firebase/firestore';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from './firestoreApiBase';
import { db } from './firebaseConfig';

const commentCollectionName = 'matchComments';

export const matchCommentApi = {
    add: async (data: any) => {
        return addBase(commentCollectionName, data);
    },

    update: async (id: string, data: any) => {
        return updateBase(commentCollectionName, id, data);
    },

    delete: async (id: string) => {
        return deleteByIdBase(commentCollectionName, id);
    },

    getById: async (id: string) => {
        return getByIdBase(commentCollectionName, id);
    },

    getAll: async () => {
        return getAllBase(commentCollectionName);
    },

    // Get all comments for a match
    getCommentsByMatch: async (matchId: string) => {
        try {
            const q = query(
                collection(db, commentCollectionName),
                where('matchId', '==', matchId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Maç yorumları getirilemedi:', error);
            return [];
        }
    },

    // Get approved comments for a match
    getApprovedCommentsByMatch: async (matchId: string) => {
        try {
            const q = query(
                collection(db, commentCollectionName),
                where('matchId', '==', matchId),
                where('isApproved', '==', true),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Onaylı yorumlar getirilemedi:', error);
            return [];
        }
    },

    // Get pending comments (for moderation)
    getPendingCommentsByMatch: async (matchId: string) => {
        try {
            const q = query(
                collection(db, commentCollectionName),
                where('matchId', '==', matchId),
                where('isApproved', '==', false),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Onay bekleyen yorumlar getirilemedi:', error);
            return [];
        }
    },

    // Get comments by a player
    getCommentsByPlayer: async (playerId: string) => {
        try {
            const q = query(
                collection(db, commentCollectionName),
                where('playerId', '==', playerId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Oyuncu yorumları getirilemedi:', error);
            return [];
        }
    },

    // Get comments by type
    getCommentsByType: async (matchId: string, type: 'general' | 'highlight' | 'improvement') => {
        try {
            const q = query(
                collection(db, commentCollectionName),
                where('matchId', '==', matchId),
                where('type', '==', type),
                where('isApproved', '==', true),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Tip yorumları getirilemedi:', error);
            return [];
        }
    }
};
