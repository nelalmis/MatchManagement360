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
import { IPlayer } from '../../types/types';
import styles from '../../styles/style';
import { formatPhoneNumber } from '../../helper/helper';
import { useNavigation } from '@react-navigation/native';
import { auth } from '../../api/firebaseConfig';

export const LoginScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const { phoneNumber, setPhoneNumber, setUser, setCurrentScreen } = useAppContext();

    const [countdown, setCountdown] = useState(0);
    const [rememberDevice, setRememberDevice] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Firebase auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userData = {
                    phone: user.phoneNumber,
                    uid: user.uid,
                    lastLogin: new Date().toISOString(),
                };
                setUserData(userData);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        AsyncStorage.getItem('userData').then(u => {
            if (u) {
                setUserData(JSON.parse(u));
                setCurrentScreen('home');
            } else {
                setCurrentScreen('login');
            }
        });
    }, []);

    // Uygulama açıldığında otomatik giriş kontrolü
    useEffect(() => {
        checkAutoLogin();
    }, []);

    // Geri sayım timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const checkAutoLogin = async () => {
        let user: IPlayer = {
            id: "2",
            birthDate: '2025-09-15',
            jerseyNumber: '10',
            lastLogin: new Date(),
            name: 'Nevzat',
            phone: '543 823 60 23',
            position: 'Forvet',
            surname: 'Elalmış',
        }
        // setUser(user);
        // AsyncStorage.setItem('userData', JSON.stringify(user));
        // setCurrentScreen("home");
        // return;
        try {
            const token = await AsyncStorage.getItem('deviceToken');
            const user = await AsyncStorage.getItem('userData');

            if (token && user && auth.currentUser) {
                setTimeout(() => {
                    //setUserData(JSON.parse(user));
                    setCurrentScreen('home');
                    navigation.navigate("home")
                }, 1500);
            } else {
                setCurrentScreen('login');
            }
        } catch (error) {
            console.log('Auto login error:', error);
            setCurrentScreen('login');
        }
    };

    const handlePhoneChange = (text: any) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            setPhoneNumber(cleaned);
        }
    };

    const handleSendCode = async () => {
        if (phoneNumber.length === 10) {
            setLoading(true);
            try {
                const formattedPhone = `+90${phoneNumber}`;

                // NOT: Expo'da reCAPTCHA gerektirir, bu yüzden Development Build gerekli
                // Alternatif olarak backend'den SMS gönderin

                // Geçici: Backend API kullanımı önerilir
                Alert.alert(
                    'Bilgi',
                    'Firebase Phone Auth için Development Build gereklidir.\n\nŞimdilik test modu aktif - herhangi bir 6 haneli kod girebilirsiniz.'
                );

                setCurrentScreen('verification');
                navigation.navigate("verification");
                setCountdown(60);
                setLoading(false);

                // Production'da şu şekilde kullanılacak:
                /*
                const confirmation = await signInWithPhoneNumber(auth, formattedPhone);
                setVerificationId(confirmation.verificationId);
                setStep('verification');
                setCountdown(60);
                Alert.alert('Kod Gönderildi', `${formattedPhone} numarasına kod gönderildi.`);
                */

            } catch (error: any) {
                setLoading(false);
                console.error('SMS gönderme hatası:', error);
                Alert.alert('Hata', error.message || 'SMS gönderilemedi. Lütfen tekrar deneyin.');
            }
        }
    };

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
                                    <Text style={styles.checkboxSubtitle}>Bir sonraki girişinizde OTP gerekmeyecek</Text>
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
                                    <Text style={styles.buttonText}>Doğrulama Kodu Gönder</Text>
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