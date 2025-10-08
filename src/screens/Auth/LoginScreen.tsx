import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    signInWithPhoneNumber,
    PhoneAuthProvider,
    signInWithCredential,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import { useAppContext } from '../../context/AppContext';
import { IDevice, IPlayer } from '../../types/types';
import styles from '../../styles/style';
import { formatPhoneNumber } from '../../helper/helper';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../api/firebaseConfig';
import { getOrCreateDeviceId } from '../../helper/deviceHelper';
import { playerService } from '../../services/playerService';
import { deviceService } from '../../services/deviceService';

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const { phoneNumber, setPhoneNumber, setUser, user, setCurrentScreen, rememberDevice, setRememberDevice, setCountdown, setIsVerified } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [checkingDevice, setCheckingDevice] = useState(true);

    // Firebase auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('Firebase Auth User:', user.phoneNumber);
            }
        });
        return () => unsubscribe();
    }, []);

    // Uygulama açıldığında otomatik giriş kontrolü
    useEffect(() => {
        checkAutoLogin();
    }, []);


    // Otomatik giriş kontrolü - Önce AsyncStorage, sonra Firestore
    const checkAutoLogin = async () => {
        setCheckingDevice(true);
        try {
            const deviceId = await getOrCreateDeviceId();
            console.log('🔍 Checking device:', deviceId);

            // 1. ÖNCE AsyncStorage'dan kontrol et (HIZLI)
            const storedUserData = await AsyncStorage.getItem('userData');

            if (storedUserData) {
                const userData = JSON.parse(storedUserData) as IPlayer;
                console.log('💾 User found in AsyncStorage:', userData.name);

                // Firestore'dan cihazın hala aktif olup olmadığını kontrol et

                const deviceData = await deviceService.getById(deviceId) as IDevice;

                if (deviceData) {
                    if (deviceData.isActive && deviceData.playerId === userData.id) {
                        // Her şey OK, direkt giriş yap
                        console.log('✅ Device is active, logging in...');

                        // Son kullanım zamanını güncelle (arka planda)
                        deviceService.update(deviceId, {
                            lastUsed: new Date().toISOString()
                        });

                        playerService.update(userData.id, {
                            lastLogin: new Date().toISOString()
                        })
                        setIsVerified(true);
                        setUser(userData);

                        // Ana ekrana yönlendir
                        setTimeout(() => {
                            setCheckingDevice(false);
                            setCurrentScreen('home');
                            navigation.navigate('home', { animation: 'slide_from_bottom' });
                        }, 800);
                        return;
                    }
                }

                // Cihaz aktif değil veya kullanıcı değişmiş, local storage'ı temizle
                console.log('⚠️ Device not active or user mismatch, clearing storage');
                await AsyncStorage.removeItem('userData');
            }

            // 2. AsyncStorage'da veri yok, Firestore'dan kontrol et
            // console.log('🔍 Checking Firestore devices collection...');
            // const deviceData = await deviceService.getById(deviceId) as IDevice;

            // if (deviceData) {
            //     console.log('📱 Device found in Firestore:', deviceData);

            //     if (deviceData.isActive) {

            //         // Kullanıcı bilgilerini al
            //         const playerData = await playerService.getById(deviceData.playerId || "0");

            //         if (playerData) {

            //             // Son kullanım zamanını güncelle (arka planda)
            //             deviceService.update(deviceId, {
            //                 lastUsed: new Date().toISOString()
            //             });

            //             playerService.update(user?.id, {
            //                 lastLogin: new Date().toISOString()
            //             })
            //             // AsyncStorage'a kaydet
            //             await AsyncStorage.setItem('userData', JSON.stringify(playerData));
            //             setUser(playerData);

            //             console.log('✅ Auto login from Firestore successful');
            //             setIsVerified(true);
            //             // Ana ekrana yönlendir
            //             setTimeout(() => {
            //                 setCheckingDevice(false);
            //                 setCurrentScreen('home');
            //                 navigation.navigate('home');
            //             }, 800);
            //             return;
            //         }
            //     }
            // }

            // 3. Hiçbir yerde kayıt yok, login ekranına yönlendir
            console.log('ℹ️ Device not registered, showing login screen');
            setCheckingDevice(false);
            setCurrentScreen('login');

        } catch (error) {
            console.error('❌ Auto login error:', error);
            setCheckingDevice(false);
            setCurrentScreen('login');
        }
    };

    // Telefon numarası ile giriş yap
    const handleSendCode = async () => {
        if (phoneNumber.length === 10) {
            setLoading(true);
            try {
                const formattedPhone = `+90${phoneNumber}`;
                const deviceId = await getOrCreateDeviceId();

                console.log('📞 Checking phone:', formattedPhone);

                // Firestore'da bu telefon numarasına sahip kullanıcı var mı?
                const playerByPhone = await playerService.getPlayerByPhone(formattedPhone);
                if (playerByPhone) {
                    // Kullanıcı bulundu
                    const playerData = playerByPhone as IPlayer;
                    console.log('👤 User found:', playerData.name);
                    await AsyncStorage.setItem('userData', JSON.stringify(playerData));
                    setUser(playerData);

                    // Cihaz kayıtlı mı kontrol et
                    const deviceData = await deviceService.getById(deviceId);

                    if (deviceData && deviceData.playerId === playerData.id) {
                        // Cihaz zaten kayıtlı, direkt giriş yap
                        console.log('✅ Device already registered, logging in...');

                        // Son kullanım zamanını güncelle (arka planda)
                        const lastUsed = new Date().toISOString();
                        deviceService.update(deviceId, {
                            lastUsed: lastUsed
                        });

                        playerService.update(user?.id, {
                            lastLogin: lastUsed
                        })

                        setUser({ ...user, lastLogin: new Date(lastUsed) });
                        setIsVerified(true);
                        // Alert.alert(
                        //     'Hoş Geldiniz!',
                        //     `${playerData.name} ${playerData.surname}, giriş yapılıyor...`,
                        //     [{
                        //         text: 'Tamam',
                        //         onPress: () => {
                        //             setCurrentScreen('home');
                        //             navigation.navigate('home');
                        //         }
                        //     }]
                        // );

                        setCurrentScreen('home');
                        navigation.navigate('home');
                        setLoading(false);
                        return;
                    }

                    // Kullanıcı var ama cihaz kayıtlı değil, OTP gönder
                    console.log('📱 New device, sending OTP...');
                }

                // Yeni kullanıcı veya yeni cihaz - OTP gönder
                setCurrentScreen('verification');
                navigation.navigate('verification');
                setCountdown(60);
                setLoading(false);

                // Production'da Firebase Phone Auth:
                /*
                const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
                await AsyncStorage.setItem('verificationId', confirmation.verificationId);
                Alert.alert('Kod Gönderildi', `${formattedPhone} numarasına kod gönderildi.`);
                */

            } catch (error: any) {
                setLoading(false);
                console.error('❌ Send code error:', error);
                Alert.alert('Hata', error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    };
    const handlePhoneChange = (text: any) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            setPhoneNumber(cleaned);
        }
    };

    // Yükleme ekranı
    if (checkingDevice) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
                <Text style={styles.logoIcon}>📱</Text>
                <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
                {/* <Text style={{ marginTop: 10, color: '#6B7280', fontSize: 14 }}>
                    Cihaz kontrol ediliyor...
                </Text> */}
            </SafeAreaView>
        );
    }

    // Login ekranı
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoIcon}>📱</Text>
                    </View>
                    <Text style={styles.title}>Hoş Geldiniz</Text>
                    <Text style={styles.subtitle}>
                        Devam etmek için telefon numaranızı girin. Maç organize etmek veya mevcut maçlara katılmak için bir adım kaldı.
                    </Text>

                    <View style={styles.card}>
                        <View>
                            <Text style={styles.label}>Telefon Numarası</Text>
                            <View style={styles.phoneInputContainer}>
                                <Text style={styles.countryCode}>🇹🇷 +90</Text>
                                <TextInput
                                    style={styles.phoneInput}
                                    value={formatPhoneNumber(phoneNumber)}
                                    onChangeText={handlePhoneChange}
                                    placeholder="5XX XXX XX XX"
                                    keyboardType="phone-pad"
                                    maxLength={13}
                                    editable={!loading}
                                />
                            </View>

                            {/* Remember Device Checkbox */}
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setRememberDevice(!rememberDevice)}
                                disabled={loading}
                            >
                                <View style={[styles.checkbox, rememberDevice && styles.checkboxChecked]}>
                                    {rememberDevice && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <View style={styles.checkboxTextContainer}>
                                    <Text style={styles.checkboxTitle}>Bu cihazı güvenilir olarak işaretle</Text>
                                    <Text style={styles.checkboxSubtitle}>
                                        Bir sonraki girişinizde telefon numarası gerekmeyecek
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, (phoneNumber.length !== 10 || loading) && styles.buttonDisabled]}
                                onPress={handleSendCode}
                                disabled={phoneNumber.length !== 10 || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Devam Et</Text>
                                )}
                            </TouchableOpacity>

                            <Text style={styles.termsText}>
                                Devam ederek Kullanım Koşulları ve Gizlilik Politikası'nı kabul etmiş olursunuz.
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}