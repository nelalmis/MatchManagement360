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
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import { formatPhoneNumber, isProfileComplete } from '../../helper/helper';
import * as Application from 'expo-application';
import { deviceService } from '../../services/deviceService';
import { getOrCreateDeviceId } from '../../helper/deviceHelper';
import { playerService } from '../../services/playerService';
import { IPlayer, IResponseBase } from '../../types/types';
import { useNavigationContext } from '../../context/NavigationContext';
import { ArrowLeft } from 'lucide-react-native';

export const VerificationScreen: React.FC = () => {
    const navigation = useNavigationContext();
    const { phoneNumber, setUser, user, setCurrentScreen, countdown, setCountdown, rememberDevice, setIsVerified } = useAppContext();
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);

    const codeInputRefs: any = useRef([]);

    // Geri sayım timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleVerify = async () => {
        const code = verificationCode.join('');
        if (code.length === 6) {
            setLoading(true);
            try {
                let userData = user;
                const formattedPhone = `+90${phoneNumber}`;

                if (!userData || !userData.id) {
                    let newUser: IPlayer = {
                        phone: formattedPhone,
                    }
                    let responseUser: IResponseBase = await playerService.add(newUser);
                    if (!responseUser.success) {
                        Alert.alert("Hata", "Kayıt işlemi başarısız. Lütfen tekrar deneyin.");
                        return;
                    }
                    newUser.id = responseUser.id;
                    userData = newUser;
                }

                await registerDevice(userData.id, rememberDevice);
                await saveUserSession(userData, rememberDevice);

                setCurrentScreen('verificationSuccess');
                navigation.navigate("verificationSuccess");
                setTimeout(() => {
                    if (!isProfileComplete(userData)) {
                        navigation.navigate("register");
                    } else {
                        navigation.navigate("home", { animation: 'slide_from_left' });
                    }
                    setLoading(false);
                }, 2000);

                return;

            } catch (error: any) {
                setLoading(false);
                console.error('Doğrulama hatası:', error);
                Alert.alert('Hata', 'Geçersiz kod. Lütfen tekrar deneyin.');
            }
        }
    };

    const saveUserSession = async (userData: any, remember: any) => {
        try {
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            if (remember) {
                const token = generateSecureToken();
                await AsyncStorage.setItem('deviceToken', token);
                await AsyncStorage.setItem('trustedDevice', 'true');
            }

            setUser(userData);
        } catch (error) {
            console.log('Save session error:', error);
        }
    };

    const handleCodeChange = (index: any, value: any) => {
        // Backspace kontrolü - eğer boş input'a backspace basılırsa
        if (value === '' && verificationCode[index] === '') {
            // Bir önceki input'a geç ve onu temizle
            if (index > 0) {
                const newCode = [...verificationCode];
                newCode[index - 1] = '';
                setVerificationCode(newCode);
                codeInputRefs.current[index - 1]?.focus();
            }
            return;
        }

        // Sadece rakam kabul et
        if (/^\d*$/.test(value) && value.length <= 1) {
            const newCode = [...verificationCode];
            newCode[index] = value;
            setVerificationCode(newCode);

            // İleri git
            if (value && index < 5) {
                codeInputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyPress = (index: any, event: any) => {
        const key = event.nativeEvent.key;

        // Backspace tuşuna basıldıysa ve mevcut input boşsa
        if (key === 'Backspace' && !verificationCode[index]) {
            if (index > 0) {
                // Bir önceki input'a geç
                codeInputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleResend = async () => {
        setVerificationCode(['', '', '', '', '', '']);
        setCountdown(60);
        Alert.alert('Kod Tekrar Gönderildi', 'Yeni doğrulama kodu gönderildi.');
    };

    const generateSecureToken = () => {
        return 'token_' + Math.random().toString(36).substr(2, 16);
    };

    const registerDevice = async (userId: string, rememberDevice: boolean) => {
        if (!rememberDevice) {
            console.log('ℹ️ User chose not to remember device');
            return;
        }

        try {
            let deviceId = await AsyncStorage.getItem('deviceId');
            if (!deviceId) {
                deviceId = await getOrCreateDeviceId();
                await AsyncStorage.setItem('deviceId', deviceId);
            }

            const deviceName = Platform.OS === 'ios' ? 'iPhone' : 'Android';
            const deviceModel = Platform.OS === 'ios'
                ? await Application.applicationName
                : 'Android Device';

            deviceService.add({
                id: deviceId,
                playerId: userId,
                deviceId: deviceId,
                deviceName: `${deviceName} - ${deviceModel}`,
                platform: Platform.OS,
                addedAt: new Date().toISOString(),
                lastUsed: new Date().toISOString(),
                isActive: true
            });

            console.log('✅ Device registered successfully');

        } catch (error) {
            console.error('❌ Device registration error:', error);
        }
    };

    const handleBack = () => {
        setCurrentScreen('login');
        navigation.navigate('login');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButtonTop}
                    onPress={handleBack}
                    activeOpacity={0.7}
                    disabled={loading}
                >
                    <ArrowLeft color="#374151" size={24} strokeWidth={2} />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerContainer}>
                        <View style={styles.iconContainer}>
                            <Image
                                source={require("../../../assets/icons/splash.png")}
                                style={styles.headerIcon}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    <View style={styles.welcomeSection}>
                        <Text style={styles.title}>Hoş Geldiniz</Text>
                        <Text style={styles.subtitle}>
                            SMS ile gönderilen kodu girin.
                        </Text>
                    </View>

                    {/* Main Card */}
                    <View style={styles.card}>
                        {/* SMS Header */}
                        <View style={styles.verificationHeader}>
                            <View style={styles.smsIconContainer}>
                                <Text style={styles.verificationIcon}>💬</Text>
                            </View>
                            <Text style={styles.verificationTitle}>Kodu Girin</Text>
                            <Text style={styles.verificationSubtitle}>
                                +90 {formatPhoneNumber(phoneNumber)} numarasına gönderilen kodu girin
                            </Text>
                        </View>

                        {/* Code Inputs */}
                        <View style={styles.codeContainer}>
                            {verificationCode.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={(ref: any) => (codeInputRefs.current[index] = ref)}
                                    style={[
                                        styles.codeInput,
                                        digit && styles.codeInputFilled
                                    ]}
                                    value={digit}
                                    onChangeText={(text) => handleCodeChange(index, text)}
                                    onKeyPress={(event) => handleKeyPress(index, event)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                    editable={!loading}
                                />
                            ))}
                        </View>

                        {/* Remember Device Notice */}
                        {rememberDevice && (
                            <View style={styles.trustedDeviceNotice}>
                                <View style={styles.shieldIconContainer}>
                                    <Text style={styles.trustedDeviceIcon}>🛡️</Text>
                                </View>
                                <Text style={styles.trustedDeviceText}>
                                    Bu cihaz güvenilir olarak kaydedilecek
                                </Text>
                            </View>
                        )}

                        {/* Verify Button */}
                        <TouchableOpacity
                            style={[
                                styles.button,
                                (verificationCode.join('').length !== 6 || loading) && styles.buttonDisabled
                            ]}
                            onPress={handleVerify}
                            disabled={verificationCode.join('').length !== 6 || loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <Text style={styles.buttonText}>Doğrula</Text>
                            )}
                        </TouchableOpacity>

                        {/* Resend Code */}
                        <View style={styles.resendContainer}>
                            {countdown > 0 ? (
                                <Text style={styles.countdownText}>
                                    Yeni kod gönderilebilir:{' '}
                                    <Text style={styles.countdownBold}>{countdown}s</Text>
                                </Text>
                            ) : (
                                <TouchableOpacity
                                    onPress={handleResend}
                                    disabled={loading}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.resendText}>
                                        Kodu Tekrar Gönder
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Change Number */}
                        <TouchableOpacity
                            onPress={handleBack}
                            style={styles.changeNumberButton}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.changeNumberText}>
                                ← Numarayı Değiştir
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    keyboardView: {
        flex: 1,
    },
    backButtonTop: {
        marginLeft: 20,
        marginTop: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    headerIcon: {
        width: 50,
        height: 50,
    },
    welcomeSection: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    verificationHeader: {
        alignItems: 'center',
        marginBottom: 28,
    },
    smsIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    verificationIcon: {
        fontSize: 32,
    },
    verificationTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 10,
        letterSpacing: -0.3,
    },
    verificationSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 8,
    },
    codeInput: {
        flex: 1,
        height: 56,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        color: '#111827',
        backgroundColor: '#F9FAFB',
    },
    codeInputFilled: {
        borderColor: '#16a34a',
        backgroundColor: '#DCFCE7',
    },
    trustedDeviceNotice: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DCFCE7',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginBottom: 24,
    },
    shieldIconContainer: {
        marginRight: 10,
    },
    trustedDeviceIcon: {
        fontSize: 20,
    },
    trustedDeviceText: {
        flex: 1,
        fontSize: 13,
        color: '#166534',
        fontWeight: '500',
        lineHeight: 18,
    },
    button: {
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    countdownText: {
        fontSize: 14,
        color: '#6B7280',
    },
    countdownBold: {
        fontWeight: '700',
        color: '#111827',
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#16a34a',
    },
    changeNumberButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    changeNumberText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
});