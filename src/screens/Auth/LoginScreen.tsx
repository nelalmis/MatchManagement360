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
    StyleSheet
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
import { formatPhoneNumber } from '../../helper/helper';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../api/firebaseConfig';
import { getOrCreateDeviceId } from '../../helper/deviceHelper';
import { playerService } from '../../services/playerService';
import { deviceService } from '../../services/deviceService';
import { ArrowRight } from 'lucide-react-native'; // ✅ mobil için doğru paket

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
                                    <View style={styles.buttonContent}>
                                        <View style={styles.buttonContent}>
                                            <Text style={styles.buttonText}>Devam Et</Text>
                                            <ArrowRight color={"white"} size={16}/>
                                        </View>
                                    </View>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EFF6FF',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
    },
    homeScrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logoIcon: {
        fontSize: 60,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6B7280',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 30,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginRight: 8,
    },
    phoneInput: {
        flex: 1,
        fontSize: 18,
        paddingVertical: 16,
        color: '#1F2937',
    },
    checkboxContainer: {
        flexDirection: 'row',
        backgroundColor: '#EEF2FF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#4F46E5',
        borderRadius: 6,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    checkboxChecked: {
        backgroundColor: '#4F46E5',
    },
    checkmark: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    checkboxTextContainer: {
        flex: 1,
    },
    checkboxTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    checkboxSubtitle: {
        fontSize: 12,
        color: '#6B7280',
    },
    // button: {
    //     backgroundColor: '#4F46E5',
    //     paddingVertical: 16,
    //     borderRadius: 12,
    //     alignItems: 'center',
    //     marginBottom: 16,
    // },
    button: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#16a34a",
        paddingVertical: 14,
        borderRadius: 12,
        gap: 6,
        marginTop: 8,
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    termsText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
    verificationHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    verificationIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    verificationTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    verificationSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    codeInput: {
        width: 48,
        height: 56,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1F2937',
    },
    trustedDeviceNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        marginBottom: 20,
    },
    trustedDeviceIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    trustedDeviceText: {
        flex: 1,
        fontSize: 13,
        color: '#065F46',
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 12,
    },
    countdownText: {
        fontSize: 14,
        color: '#6B7280',
    },
    countdownBold: {
        fontWeight: 'bold',
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4F46E5',
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    successIcon: {
        fontSize: 80,
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    successSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        width: '70%',
        height: '100%',
        backgroundColor: '#4F46E5',
    },
    homeContainer: {
        flex: 1,
        paddingTop: 20,
    },
    homeCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    homeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    homeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    homePhone: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    homeAvatar: {
        width: 64,
        height: 64,
        backgroundColor: '#EEF2FF',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeAvatarIcon: {
        fontSize: 32,
    },
    deviceStatusContainer: {
        flexDirection: 'row',
    },
    deviceIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    trustedIcon: {
        backgroundColor: '#ECFDF5',
    },
    standardIcon: {
        backgroundColor: '#FEF3C7',
    },
    deviceIconText: {
        fontSize: 24,
    },
    deviceTextContainer: {
        flex: 1,
    },
    deviceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    deviceDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: '#EEF2FF',
        borderWidth: 2,
        borderColor: '#C7D2FE',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#312E81',
        marginBottom: 12,
    },
    infoList: {
        gap: 4,
    },
    infoItem: {
        fontSize: 13,
        color: '#4338CA',
        marginBottom: 4,
    },
    logoutButton: {
        backgroundColor: 'white',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    lastLoginText: {
        textAlign: 'center',
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 16,
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    screenContainer: { padding: 20 },
    screenTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
    text: { fontSize: 16, color: '#555' },
    input: {
        borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
        padding: 10, marginBottom: 12, fontSize: 16
    },
});