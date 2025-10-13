import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Platform,
    Alert,
    ScrollView,
    Keyboard,
    Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import { formatPhoneNumber, isProfileComplete } from '../../helper/helper';
import { playerService } from '../../services/playerService';
import { deviceService } from '../../services/deviceService';
import { ExpoNotificationService } from '../../hooks/useNotificationHandler';
import { IPlayer, IResponseBase } from '../../types/types';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import { getOrCreateDeviceId } from '../../helper/deviceHelper';
import { NavigationService } from '../../navigation/NavigationService';

export const PhoneVerificationScreen: React.FC = () => {
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const iconScale = useRef(new Animated.Value(1)).current;
    
    const { 
        phoneNumber, 
        setUser, 
        user, 
        setCurrentScreen, 
        countdown, 
        setCountdown, 
        rememberDevice, 
        setIsVerified 
    } = useAppContext();
    
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    const codeInputRefs: any = useRef([]);

    useEffect(() => {
        // Fade in animasyonu
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        // Klavye listeners
        const keyboardShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
                // Icon'u küçült
                Animated.spring(iconScale, {
                    toValue: 0.7,
                    useNativeDriver: true,
                    friction: 8,
                }).start();
                
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 50, animated: true });
                }, Platform.OS === 'android' ? 200 : 100);
            }
        );
        
        const keyboardHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardVisible(false);
                // Icon'u normale döndür
                Animated.spring(iconScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    friction: 8,
                }).start();
            }
        );

        return () => {
            keyboardShow.remove();
            keyboardHide.remove();
        };
    }, []);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 🔔 Device token kaydetme fonksiyonu
    const saveDeviceToken = async (playerId: string) => {
        try {
            console.log('📱 Device token kaydediliyor...');
            
            const pushToken = await ExpoNotificationService.getExpoPushToken();
            if (!pushToken) {
                console.warn('⚠️ Push token alınamadı');
                return;
            }

            const deviceName = Device.deviceName || 'Unknown Device';
            const platform = Platform.OS;

            const existingDevice = await deviceService.getDeviceByDeviceId(pushToken);

            if (existingDevice) {
                await deviceService.update(existingDevice.id.toString(), {
                    playerId,
                    lastUsed: new Date().toISOString(),
                    isActive: true,
                });
                console.log('✅ Device token güncellendi');
            } else {
                await deviceService.add({
                    id: getOrCreateDeviceId(),
                    playerId,
                    deviceId: pushToken,
                    deviceName,
                    platform,
                    isActive: true,
                });
                console.log('✅ Yeni device token eklendi');
            }
        } catch (error) {
            console.error('❌ Device token kaydetme hatası:', error);
        }
    };

    const handleVerify = async () => {
        const code = verificationCode.join('');
        if (code.length === 6) {
            setLoading(true);
            Keyboard.dismiss();
            
            try {
                let userData = user;
                const formattedPhone = `+90${phoneNumber}`;

                // Create new player if doesn't exist
                if (!userData || !userData.id) {
                    const newUser: IPlayer = {
                        phone: formattedPhone,
                        lastLogin: new Date(),
                    };
                    
                    const responseUser: IResponseBase = await playerService.add(newUser);
                    
                    if (!responseUser.success) {
                        Alert.alert("Hata", "Kayıt işlemi başarısız. Lütfen tekrar deneyin.");
                        setLoading(false);
                        return;
                    }
                    
                    newUser.id = responseUser.id;
                    userData = newUser;
                }

                // Save user session
                await saveUserSession(userData, rememberDevice);

                // 🔔 Device token'ı kaydet (verification başarılı olduktan sonra)
                if (userData.id) {
                    await saveDeviceToken(userData.id.toString());
                }

                setIsVerified(true);

                // Check if profile is complete
                if (!isProfileComplete(userData)) {
                    setCurrentScreen('register');
                    NavigationService.navigateToRegister();
                } else {
                    setCurrentScreen('home');
                    NavigationService.navigateToMain();
                }

                setLoading(false);

            } catch (error: any) {
                setLoading(false);
                console.error('Doğrulama hatası:', error);
                Alert.alert('Hata', 'Doğrulama işlemi başarısız. Lütfen tekrar deneyin.');
            }
        }
    };

    const saveUserSession = async (userData: IPlayer, remember: boolean) => {
        try {
            await AsyncStorage.setItem('userData', JSON.stringify(userData));

            if (remember) {
                await AsyncStorage.setItem('trustedDevice', 'true');
            }

            setUser(userData);
        } catch (error) {
            console.log('Save session error:', error);
        }
    };

    const handleCodeChange = (index: number, value: string) => {
        if (value === '' && verificationCode[index] === '') {
            if (index > 0) {
                const newCode = [...verificationCode];
                newCode[index - 1] = '';
                setVerificationCode(newCode);
                codeInputRefs.current[index - 1]?.focus();
            }
            return;
        }

        if (/^\d*$/.test(value) && value.length <= 1) {
            const newCode = [...verificationCode];
            newCode[index] = value;
            setVerificationCode(newCode);

            if (value && index < 5) {
                codeInputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyPress = (index: number, event: any) => {
        const key = event.nativeEvent.key;

        if (key === 'Backspace' && !verificationCode[index]) {
            if (index > 0) {
                codeInputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleResend = async () => {
        setVerificationCode(['', '', '', '', '', '']);
        setCountdown(60);
        codeInputRefs.current[0]?.focus();
        Alert.alert('Kod Tekrar Gönderildi', 'Yeni doğrulama kodu gönderildi.');
    };

    const handleBack = () => {
        setCurrentScreen('login');
        NavigationService.navigateToLogin();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

            <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
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
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                >
                    {/* Header - Animasyonlu Icon */}
                    <View style={styles.headerContainer}>
                        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                            <View style={styles.iconContainer}>
                                <Text style={styles.headerIcon}>📱</Text>
                            </View>
                        </Animated.View>
                    </View>

                    {/* Title Section - Klavye açıkken kompakt */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.title}>
                            {isKeyboardVisible ? 'Doğrulama' : 'Telefon Doğrulama'}
                        </Text>
                        {!isKeyboardVisible && (
                            <Text style={styles.subtitle}>
                                SMS ile gönderilen 6 haneli kodu girin
                            </Text>
                        )}
                    </View>

                    {/* Main Card */}
                    <View style={styles.card}>
                        {/* SMS Header - Kompakt */}
                        <View style={styles.verificationHeader}>
                            <Text style={styles.verificationTitle}>Kodu Girin</Text>
                            <Text style={styles.verificationSubtitle}>
                                +90 {formatPhoneNumber(phoneNumber)}
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

                        {/* Remember Device Notice - Kompakt */}
                        {rememberDevice && (
                            <View style={styles.trustedDeviceNotice}>
                                <Text style={styles.trustedDeviceIcon}>🛡️</Text>
                                <Text style={styles.trustedDeviceText}>
                                    Güvenilir cihaz olarak kaydedilecek
                                </Text>
                            </View>
                        )}

                        {/* Development Notice - Kompakt */}
                        {!isKeyboardVisible && (
                            <View style={styles.devNotice}>
                                <Text style={styles.devNoticeText}>
                                    🔧 <Text style={styles.devNoticeBold}>Dev Mode:</Text> Herhangi bir 6 haneli kod
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
                                    Yeni kod: <Text style={styles.countdownBold}>{countdown}s</Text>
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

                        {/* Change Number - Sadece klavye kapalıyken */}
                        {!isKeyboardVisible && (
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
                        )}
                    </View>
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    backButtonTop: {
        marginLeft: 20,
        marginTop: 12,
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
        paddingTop: 10,
        paddingBottom: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        height: 90, // Sabit yükseklik - jumping önler
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    headerIcon: {
        fontSize: 36,
    },
    welcomeSection: {
        marginBottom: 24,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    verificationHeader: {
        alignItems: 'center',
        marginBottom: 20,
    },
    verificationTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
        letterSpacing: -0.3,
    },
    verificationSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 6,
    },
    codeInput: {
        flex: 1,
        height: 54,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        fontSize: 22,
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
        backgroundColor: '#F0FDF4',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        marginBottom: 12,
    },
    trustedDeviceIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    trustedDeviceText: {
        flex: 1,
        fontSize: 12,
        color: '#166534',
        fontWeight: '500',
    },
    devNotice: {
        backgroundColor: '#FEF3C7',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginBottom: 16,
    },
    devNoticeText: {
        fontSize: 11,
        color: '#92400E',
        lineHeight: 16,
    },
    devNoticeBold: {
        fontWeight: '700',
    },
    button: {
        backgroundColor: '#16a34a',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 3,
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
        marginBottom: 12,
    },
    countdownText: {
        fontSize: 13,
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
        paddingVertical: 10,
    },
    changeNumberText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
});