import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Platform,
    Alert,
    ScrollView,
    StyleSheet,
    Keyboard,
    Animated,
    AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import { IPlayer } from '../../types/types';
import { formatPhoneNumber, isProfileComplete } from '../../helper/helper';
import { playerService } from '../../services/playerService';
import { ArrowRight } from 'lucide-react-native';
import { NavigationService } from '../../navigation/NavigationService';
import { deviceService } from '../../services/deviceService';
import { getOrCreateDeviceId } from '../../helper/deviceHelper';

export const LoginScreen: React.FC = () => {
    const scrollViewRef = useRef<ScrollView>(null);
    const logoScale = useRef(new Animated.Value(1)).current;

    const {
        phoneNumber,
        setPhoneNumber,
        setUser,
        rememberDevice,
        setRememberDevice,
        setCountdown,
        setIsVerified
    } = useAppContext();

    const [loading, setLoading] = useState(false);
    const [checkingDevice, setCheckingDevice] = useState(true);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
        checkAutoLogin();

        // Klavye event listeners
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            handleKeyboardShow
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            handleKeyboardHide
        );

        // App state listener - app'e dönüldüğünde logo'yu resetle
        const subscription = AppState.addEventListener('change', (nextAppState: string) => {
            if (nextAppState === 'active' && Platform.OS === 'android') {
                logoScale.setValue(1);
                setKeyboardVisible(false);
            }
        });

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
            subscription.remove();
        };
    }, []);

    const handleKeyboardShow = () => {
        setKeyboardVisible(true);
        Animated.spring(logoScale, {
            toValue: 0.7,
            useNativeDriver: true,
            friction: 8,
        }).start();

        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: 50, animated: true });
        }, Platform.OS === 'android' ? 200 : 100);
    };

    const handleKeyboardHide = () => {
        setKeyboardVisible(false);
        Animated.spring(logoScale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
        }).start();

        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
    };

    const checkAutoLogin = async () => {
        setCheckingDevice(true);
        try {
            const storedUserData = await AsyncStorage.getItem('userData');
            const trustedDevice = await AsyncStorage.getItem('trustedDevice');

            if (storedUserData && trustedDevice === 'true') {
                const userData = JSON.parse(storedUserData) as IPlayer;

                if (userData.id) {
                    await playerService.updateLastLogin(userData.id);
                }

                setUser(userData);
                setIsVerified(true);

                if (!isProfileComplete(userData)) {
                    // Profil tamamlanmamış - Register'a yönlendir
                    setTimeout(() => {
                        setCheckingDevice(false);
                        NavigationService.navigateToRegister();
                    }, 800);
                } else {
                    // Profil tamam - Ana sayfaya git
                    setTimeout(() => {
                        setCheckingDevice(false);
                        NavigationService.navigateToHomeTab();
                    }, 800);
                }
                return;
            }

            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('trustedDevice');
            setCheckingDevice(false);
        } catch (error) {
            console.error('❌ Auto login error:', error);
            setCheckingDevice(false);
        }
    };

    const handleSendCode = async () => {
        if (phoneNumber.length === 10) {
            setLoading(true);
            Keyboard.dismiss();

            try {
                const formattedPhone = `+90${phoneNumber}`;
                const playerByPhone = await playerService.getPlayerByPhone(formattedPhone);
                const device = await deviceService.getDeviceByDeviceId(await getOrCreateDeviceId());
                if (playerByPhone) {
                    const playerData = playerByPhone as IPlayer;
                    await AsyncStorage.setItem('userData', JSON.stringify(playerData));
                    setUser(playerData);
                    //Cihaz kontrolü
                    if (!rememberDevice) {
                        await AsyncStorage.removeItem('trustedDevice');
                    }
                    if (!device) {
                        setIsVerified(false);
                        NavigationService.navigateToPhoneVerification(`+90${phoneNumber}`);
                        return;
                    }
                    // if (device && device.playerId && device.playerId !== playerData.id) {
                    //     // Cihaz başka bir kullanıcıya kayıtlı, hata ver
                    //     Alert.alert('Hata', 'Bu cihaz başka bir kullanıcıya kayıtlı. Lütfen farklı bir cihazla giriş yapmayı deneyin veya destek ile iletişime geçin.');
                    //     setLoading(false);
                    //     return;
                    // }
                    setIsVerified(true);
                    if (playerData.id) {
                        await playerService.updateLastLogin(playerData.id);
                    }

                    if (!isProfileComplete(playerData)) {
                        NavigationService.navigateToRegister();
                    } else {
                        NavigationService.navigateToMain();
                    }

                    setLoading(false);
                    return;
                }

                // Kullanıcı yok - Phone verification'a git
                setIsVerified(false);
                setCountdown(60);
                NavigationService.navigateToPhoneVerification(`+90${phoneNumber}`);
                setLoading(false);
            } catch (error: any) {
                setLoading(false);
                console.error('❌ Send code error:', error);
                Alert.alert('Hata', error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
            }
        }
    };

    const handlePhoneChange = (text: string) => {
        const cleaned = text.replace(/\D/g, '');
        if (cleaned.length <= 10) {
            setPhoneNumber(cleaned);
        }
    };

    if (checkingDevice) {
        return (
            <SafeAreaView style={styles.loadingContainer} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
                <View style={styles.loadingContent}>
                    <View style={styles.loadingLogoContainer}>
                        <Text style={styles.loadingLogoText}>⚽</Text>
                    </View>
                    <Text style={styles.loadingTitle}>Maç Yönetimi</Text>
                    <ActivityIndicator size="large" color="#16a34a" style={styles.loadingSpinner} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                {/* Logo Container - Animasyonlu, Sabit Container */}
                <View style={styles.headerContainer}>
                    <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                        <View style={styles.logoContainer}>
                            <Text style={styles.logoEmoji}>⚽</Text>
                        </View>
                    </Animated.View>
                    {!isKeyboardVisible && (
                        <Text style={styles.logoText}>Maç Yönetimi</Text>
                    )}
                </View>

                {/* Welcome Section - Klavye açıkken gizle */}
                {!isKeyboardVisible && (
                    <View style={styles.welcomeSection}>
                        <Text style={styles.title}>Hoş Geldiniz</Text>
                        <Text style={styles.subtitle}>
                            Telefon numaranızı girin ve maçlara katılmaya başlayın
                        </Text>
                    </View>
                )}

                {/* Main Card - Kompakt */}
                <View style={styles.card}>
                    {/* Phone Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Telefon Numarası</Text>
                        <View style={styles.phoneInputContainer}>
                            <View style={styles.countryCodeContainer}>
                                <Text style={styles.flagEmoji}>🇹🇷</Text>
                                <Text style={styles.countryCode}>+90</Text>
                            </View>
                            <TextInput
                                style={styles.phoneInput}
                                value={formatPhoneNumber(phoneNumber)}
                                onChangeText={handlePhoneChange}
                                placeholder="5XX XXX XX XX"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="phone-pad"
                                maxLength={13}
                                editable={!loading}
                                returnKeyType="done"
                                onSubmitEditing={handleSendCode}
                            />
                        </View>
                    </View>

                    {/* Checkbox - Kompakt */}
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setRememberDevice(!rememberDevice)}
                        activeOpacity={0.7}
                        disabled={loading}
                    >
                        <View style={[styles.checkbox, rememberDevice && styles.checkboxChecked]}>
                            {rememberDevice && (
                                <Text style={styles.checkmark}>✓</Text>
                            )}
                        </View>
                        <Text style={styles.checkboxText}>
                            Bu cihazı güvenilir olarak işaretle
                        </Text>
                    </TouchableOpacity>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[
                            styles.button,
                            (phoneNumber.length !== 10 || loading) && styles.buttonDisabled
                        ]}
                        onPress={handleSendCode}
                        disabled={phoneNumber.length !== 10 || loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.buttonText}>Devam Et</Text>
                                <ArrowRight color="white" size={20} strokeWidth={2.5} />
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Terms - Kompakt */}
                    {!isKeyboardVisible && (
                        <Text style={styles.termsText}>
                            Devam ederek{' '}
                            <Text style={styles.termsLink}>Kullanım Koşulları</Text>
                            {' '}ve{' '}
                            <Text style={styles.termsLink}>Gizlilik Politikası</Text>
                            'nı kabul ediyorsunuz
                        </Text>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingLogoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        marginBottom: 16,
    },
    loadingLogoText: {
        fontSize: 48,
    },
    loadingTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#16a34a',
        marginBottom: 8,
    },
    loadingSpinner: {
        marginTop: 20,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
        height: 110,
    },
    logoContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginBottom: 10,
    },
    logoEmoji: {
        fontSize: 40,
    },
    logoText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#16a34a',
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
        paddingHorizontal: 16,
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
    inputSection: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
        marginLeft: 2,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 14,
        backgroundColor: '#F9FAFB',
        height: 52,
    },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
        borderRightWidth: 1,
        borderRightColor: '#E5E7EB',
        marginRight: 12,
    },
    flagEmoji: {
        fontSize: 18,
        marginRight: 6,
    },
    countryCode: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    phoneInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
        fontWeight: '500',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#16a34a',
        borderRadius: 5,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    checkboxChecked: {
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
    },
    checkmark: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
    },
    checkboxText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#166534',
        flex: 1,
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#16a34a',
        paddingVertical: 14,
        borderRadius: 12,
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
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    termsText: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 16,
        paddingHorizontal: 4,
    },
    termsLink: {
        color: '#16a34a',
        fontWeight: '600',
    },
});