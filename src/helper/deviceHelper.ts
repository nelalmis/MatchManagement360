// helper/deviceHelper.ts - Yeni dosya oluşturun
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFirestore, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import * as Application from 'expo-application';

// Cihaza özgü benzersiz ID al (UYGULAMA SİLİNSE BİLE AYNI KALIR)
export const getOrCreateDeviceId = async (): Promise<string> => {
    try {
        let deviceId = await AsyncStorage.getItem('deviceId');
        if (deviceId) return deviceId;

        if (Platform.OS === 'android') {
            deviceId = Application.getAndroidId() || `android_${Date.now()}`;
        } else {
            deviceId = await Application.getIosIdForVendorAsync() || `ios_${Date.now()}`;
        }

        if (!deviceId) {
            const timestamp = Date.now();
            const random = Math.random().toString(36).substr(2, 9);
            deviceId = `device_${timestamp}_${random}`;
        }

        await AsyncStorage.setItem('deviceId', deviceId);
        console.log('✅ Device ID:', deviceId);
        return deviceId;
    } catch (error) {
        console.error('❌ Device ID Error:', error);
        const fallbackId = `fallback_${Date.now()}`;
        await AsyncStorage.setItem('deviceId', fallbackId);
        return fallbackId;
    }
};

export const addTrustedDevice = async (userId: string, rememberDevice: boolean = true) => {
    if (!rememberDevice) return;

    try {
        const db = getFirestore();
        const deviceId = await getOrCreateDeviceId();
        const deviceName = `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Cihaz`;

        const playerRef = doc(db, 'players', userId);
        await updateDoc(playerRef, {
            trustedDevices: arrayUnion({
                deviceId: deviceId,
                deviceName: deviceName,
                addedAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
            })
        });

        console.log('✅ Cihaz güvenilir cihazlar listesine eklendi');
        return true;
    } catch (error) {
        console.error('❌ Cihaz ekleme hatası:', error);
        return false;
    }
};