import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    onSnapshot,    
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export async function addBase(collectionName:string, matchData: any) {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...matchData,
      createdAt: new Date(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Maç eklenemedi:', error);
    return { success: false, error };
  }
}

// Tüm maçları getir
export async function getAllBase(collectionName: string) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const docs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        return docs;
    } catch (error) {
        console.error('Dökümanlar getirilemedi:', error);
        return [];
    }
}

// Belirli kullanıcının maçlarını getir
export async function getByIdBase(collectionName:string,id: string) {
    try {
        const q = query(
            collection(db, collectionName),
            where('id', '==', id)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Döküman id ile getirelemedi.', error);
        return [];
    }
}

// Maç güncelle
export async function updateBase(collectionName: string, id: string, updates: any) {
    try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error('Döküman güncellenemedi:', error);
        return { success: false, error };
    }
}

// Maç sil
export async function deleteByIdBase(collectionName: string, id: string) {
    try {
        await deleteDoc(doc(db, collectionName, id));
        return { success: true };
    } catch (error) {
        console.error('Döküman silinemedi:', error);
        return { success: false, error };
    }
}

// Gerçek zamanlı dinleme (Real-time)
export function listenBase(collectionName:string, callback: (docs: any[]) => void) {
    const unsubscribe = onSnapshot(
        collection(db, collectionName),
        (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(docs);
        },
        (error) => {
            console.error('Dinleme hatası:', error);
        }
    );

    // Cleanup için return et
    return unsubscribe;
}