import {
    collection,
    getDocs,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { addBase, deleteByIdBase, getAllBase, getByIdBase, updateBase } from '../firestoreServiceBase';
const collectionName = 'matches';
// Maç ekle
export async function add(matchData: any) {
    return addBase(collectionName, matchData);
}

// Tüm maçları getir
export async function getAllMatches() {
    return getAllBase(collectionName);
}

// Maç güncelle
export async function updateMatch(id: string, updates: any) {
    return updateBase(collectionName, id, updates);
}

// Maç sil
export async function deleteMatchById(id: string) {
    return deleteByIdBase(collectionName, id);
}

export async function getMatchById(id: string) {
    return getByIdBase(collectionName, id);
}

// Belirli kullanıcının maçlarını getir
export async function getUserMatches(userId: string) {
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
}

// Gerçek zamanlı dinleme (Real-time)
export function listenToMatches(callback: (matches: any[]) => void) {
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