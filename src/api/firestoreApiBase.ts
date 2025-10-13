// firestoreApiBase.ts

import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { auth,db } from './firebaseConfig';

// 🔧 Gelişmiş temizleme - boş string'leri de kaldır
const cleanData = (data: any, options = { removeEmpty: false }): any => {
    const cleaned: any = {};

    Object.keys(data).forEach(key => {
        const value = data[key];

        // Atlanacak değerler
        if (value === undefined || value === null) {
            return; // Skip
        }

        // Boş string'leri de atla (opsiyonel)
        if (options.removeEmpty && value === '') {
            return; // Skip
        }

        // Timestamp kontrolü ekle
        if (value instanceof Timestamp) {
            cleaned[key] = value;
            return;
        }

        // Nested object'leri temizle
        if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            const cleanedNested = cleanData(value, options);
            // Boş obje ise ekleme
            if (Object.keys(cleanedNested).length > 0) {
                cleaned[key] = cleanedNested;
            }
        } else {
            cleaned[key] = value;
        }
    });

    return cleaned;
};

// ✅ Retry mekanizması ekle
const retryOperation = async <T>(
    operation: () => Promise<T>,
    retries = 3,
    delay = 1000
): Promise<T> => {
    for (let i = 0; i < retries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            // Son denemeyse veya retry edilemez bir hata ise fırlat
            if (i === retries - 1 || error?.code === 'permission-denied') {
                throw error;
            }
            // Bekle ve tekrar dene
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
    }
    throw new Error('Retry failed');
};

export const addBase = async (collectionName: string, data: any) => {
    try {
        const cleanedData = cleanData(data);
        
        // Retry ile ekleme yap
        const docRef = await retryOperation(() => 
            addDoc(collection(db, collectionName), cleanedData)
        );
        
        return {
            success: true,
            id: docRef.id,
        };
    } catch (error: any) {
        console.error(`Error adding document to ${collectionName}:`, error);
        return {
            success: false,
            error: error?.message || 'Unknown error',
            code: error?.code,
        };
    }
};

export const updateBase = async (collectionName: string, id: string, data: any) => {
    try {
        // Boş veri kontrolü
        if (!data || Object.keys(data).length === 0) {
            return {
                success: false,
                error: 'No data to update',
            };
        }

        const cleanedData = cleanData(data);
        
        // Temizlenmiş veri boşsa güncelleme yapma
        if (Object.keys(cleanedData).length === 0) {
            return {
                success: false,
                error: 'No valid data after cleaning',
            };
        }

        const docRef = doc(db, collectionName, id);
        
        // Retry ile güncelleme yap
        await retryOperation(() => updateDoc(docRef, cleanedData));
        
        return {
            success: true,
            id: id,
        };
    } catch (error: any) {
        console.error(`Error updating document in ${collectionName}:`, error);
        return {
            success: false,
            error: error?.message || 'Unknown error',
            code: error?.code,
        };
    }
};

export const deleteByIdBase = async (collectionName: string, id: string) => {
    try {
        const docRef = doc(db, collectionName, id);
        
        // Retry ile silme yap
        await retryOperation(() => deleteDoc(docRef));
        
        return {
            success: true,
            id: id,
        };
    } catch (error: any) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        return {
            success: false,
            error: error?.message || 'Unknown error',
            code: error?.code,
        };
    }
};

export const getByIdBase = async (collectionName: string, id: string) => {
    try {
        const docRef = doc(db, collectionName, id);
        
        // Retry ile okuma yap
        const docSnap = await retryOperation(() => getDoc(docRef));

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
            };
        } else {
            return null;
        }
    } catch (error: any) {
        console.error(`Error getting document from ${collectionName}:`, error);
        throw error;
    }
};

export const getAllBase = async (collectionName: string) => {
    try {
        // Retry ile okuma yap
        const querySnapshot = await retryOperation(() => 
            getDocs(collection(db, collectionName))
        );
        
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error: any) {
        console.error(`Error getting documents from ${collectionName}:`, error);
        throw error;
    }
};

// 🆕 Toplu işlem için yeni fonksiyon
export const batchWrite = async (operations: Array<{
    type: 'add' | 'update' | 'delete';
    collectionName: string;
    id?: string;
    data?: any;
}>) => {
    try {
        const batch = writeBatch(db);

        operations.forEach(op => {
            if (op.type === 'add' && op.data) {
                const docRef = doc(collection(db, op.collectionName));
                batch.set(docRef, cleanData(op.data));
            } else if (op.type === 'update' && op.id && op.data) {
                const docRef = doc(db, op.collectionName, op.id);
                batch.update(docRef, cleanData(op.data));
            } else if (op.type === 'delete' && op.id) {
                const docRef = doc(db, op.collectionName, op.id);
                batch.delete(docRef);
            }
        });

        await batch.commit();
        return { success: true };
    } catch (error: any) {
        console.error('Batch write error:', error);
        return {
            success: false,
            error: error?.message || 'Unknown error',
        };
    }
};