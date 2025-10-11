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
    Timestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

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

export const addBase = async (collectionName: string, data: any) => {
    try {
        const cleanedData = cleanData(data); // 🧹 Temizle
        const docRef = await addDoc(collection(db, collectionName), cleanedData);
        return {
            success: true,
            id: docRef.id,
        };
    } catch (error) {
        console.error(`Error adding document to ${collectionName}:`, error);
        return {
            success: false,
            error: error,
        };
    }
};

export const updateBase = async (collectionName: string, id: string, data: any) => {
    try {
        const cleanedData = cleanData(data); // 🧹 Temizle
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, cleanedData);
        return {
            success: true,
            id: id,
        };
    } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        return {
            success: false,
            error: error,
        };
    }
};

export const deleteByIdBase = async (collectionName: string, id: string) => {
    try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        return {
            success: true,
            id: id,
        };
    } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        return {
            success: false,
            error: error,
        };
    }
};

export const getByIdBase = async (collectionName: string, id: string) => {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data(),
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Error getting document from ${collectionName}:`, error);
        throw error;
    }
};

export const getAllBase = async (collectionName: string) => {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        return querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error(`Error getting documents from ${collectionName}:`, error);
        throw error;
    }
};