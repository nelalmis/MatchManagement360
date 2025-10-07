import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
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
import styles from '../../styles/style';
import { formatPhoneNumber } from '../../helper/helper';
import { useNavigation } from '@react-navigation/native';

export const VerificationScreen: React.FC = () => {
    const navigation = useNavigation<any>();

    const { phoneNumber, setPhoneNumber, setUser, setCurrentScreen } = useAppContext();
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(0);
    const [rememberDevice, setRememberDevice] = useState(true);
    const [loading, setLoading] = useState(false);

    const codeInputRefs: any = useRef([]);

    const handleVerify = async () => {
        const code = verificationCode.join('');
        if (code.length === 6) {
            setLoading(true);
            try {
                // TEST MODU - Production'da kaldırılacak
                setCurrentScreen('verificationSuccess');
                await saveUserSession(`+90${phoneNumber}`, rememberDevice);
                setTimeout(() => {
                    navigation.navigate("home");
                    setLoading(false); 5
                }, 2000);

                // Production'da şu şekilde kullanılacak:
                /*
                const credential = PhoneAuthProvider.credential(verificationId, code);
                await signInWithCredential(auth, credential);
                fdbcvb
                setStep('success');
                await saveUserSession(`+90${phoneNumber}`, rememberDevice);
                
                setTimeout(() => {
                    setStep('home');
                    setLoading(false);
                }, 2000);
                */

            } catch (error: any) {
                setLoading(false);
                console.error('Doğrulama hatası:', error);
                Alert.alert('Hata', 'Geçersiz kod. Lütfen tekrar deneyin.');
            }
        }
    };
    const saveUserSession = async (phone: any, remember: any) => {
        const user: any = {
            phone: phone,
            birthDate: '',
            jerseyNumber: "10",
            name: 'Nevzat',
            position: 'Forvet',
            surname: 'elal',
            lastLogin: ''
            //uid: auth.currentUser?.uid,
        };

        try {
            await AsyncStorage.setItem('userData', JSON.stringify(user));

            if (remember) {
                const token = generateSecureToken();
                await AsyncStorage.setItem('deviceToken', token);
                await AsyncStorage.setItem('trustedDevice', 'true');
            }

            setUser(user);
        } catch (error) {
            console.log('Save session error:', error);
        }
    };

    const handleCodeChange = (index: any, value: any) => {
        if (/^\d*$/.test(value) && value.length <= 1) {
            const newCode = [...verificationCode];
            newCode[index] = value;
            setVerificationCode(newCode);

            if (value && index < 5) {
                let currentRef: any = codeInputRefs.current[index + 1];
                currentRef?.focus();
            }
        }
    };

    const handleKeyPress = (index: any, key: any) => {
        if (key === 'Backspace' && !verificationCode[index] && index > 0) {
            let currentRef: any = codeInputRefs.current[index - 1];
            currentRef?.focus();
        }
    };

    const handleResend = async () => {
        setVerificationCode(['', '', '', '', '', '']);
        setCountdown(60);

        // Production'da handleSendCode() çağrılacak
        Alert.alert('Kod Tekrar Gönderildi', 'Yeni doğrulama kodu gönderildi.');
    };

    const generateSecureToken = () => {
        return 'token_' + Math.random().toString(36).substr(2, 16);
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
                        SMS ile gönderilen kodu girin.
                    </Text>

                    <View style={styles.card}>
                        <View>
                            <View style={styles.verificationHeader}>
                                <Text style={styles.verificationIcon}>💬</Text>
                                <Text style={styles.verificationTitle}>Kodu Girin</Text>
                                <Text style={styles.verificationSubtitle}>
                                    +90 {formatPhoneNumber(phoneNumber)} numarasına gönderilen kodu girin
                                </Text>
                            </View>

                            <View style={styles.codeContainer}>
                                {verificationCode.map((digit, index) => (
                                    <TextInput
                                        key={index}
                                        ref={(ref: any) => (codeInputRefs.current[index] = ref)}
                                        style={styles.codeInput}
                                        value={digit}
                                        onChangeText={(text) => handleCodeChange(index, text)}
                                        onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        selectTextOnFocus
                                        editable={!loading}
                                    />
                                ))}
                            </View>

                            {rememberDevice && (
                                <View style={styles.trustedDeviceNotice}>
                                    <Text style={styles.trustedDeviceIcon}>🛡️</Text>
                                    <Text style={styles.trustedDeviceText}>Bu cihaz güvenilir olarak kaydedilecek</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.button, (verificationCode.join('').length !== 6 || loading) && styles.buttonDisabled]}
                                onPress={handleVerify}
                                disabled={verificationCode.join('').length !== 6 || loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text style={styles.buttonText}>Doğrula</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.resendContainer}>
                                {countdown > 0 ? (
                                    <Text style={styles.countdownText}>
                                        Yeni kod gönderilebilir: <Text style={styles.countdownBold}>{countdown}s</Text>
                                    </Text>
                                ) : (
                                    <TouchableOpacity onPress={handleResend} disabled={loading}>
                                        <Text style={styles.resendText}>Kodu Tekrar Gönder</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity onPress={() => setCurrentScreen('phone')} style={styles.backButton} disabled={loading}>
                                <Text style={styles.backButtonText}>← Numarayı Değiştir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}