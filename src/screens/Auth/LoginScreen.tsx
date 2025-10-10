import React, { useState, useEffect } from 'react';
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
    StyleSheet,
    Image,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../../context/AppContext';
import { IDevice, IPlayer } from '../../types/types';
import { formatPhoneNumber, isProfileComplete } from '../../helper/helper';
import { auth } from '../../api/firebaseConfig';
import { getOrCreateDeviceId } from '../../helper/deviceHelper';
import { playerService } from '../../services/playerService';
import { deviceService } from '../../services/deviceService';
import { ArrowRight } from 'lucide-react-native';
import { useNavigationContext } from '../../context/NavigationContext';

const { width } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
    const navigation = useNavigationContext();
    const {
        phoneNumber,
        setPhoneNumber,
        setUser,
        user,
        setCurrentScreen,
        rememberDevice,
        setRememberDevice,
        setCountdown,
        setIsVerified
    } = useAppContext();

    const [loading, setLoading] = useState(false);
    const [checkingDevice, setCheckingDevice] = useState(true);

    useEffect(() => {
        checkAutoLogin();
    }, []);

    const checkAutoLogin = async () => {
        setCheckingDevice(true);
        try {
            const deviceId = await getOrCreateDeviceId();
            const storedUserData = await AsyncStorage.getItem('userData');

            if (storedUserData) {
                const userData = JSON.parse(storedUserData) as IPlayer;
                const deviceData = await deviceService.getById(deviceId) as IDevice;

                if (deviceData && deviceData.isActive && deviceData.playerId === userData.id) {
                    deviceService.update(deviceId, {
                        lastUsed: new Date().toISOString()
                    });

                    playerService.update(userData.id, {
                        lastLogin: new Date().toISOString()
                    });

                    setUser(userData);
                    setIsVerified(true);

                    // ✅ BURASI ÖNEMLİ - Kullanıcı bilgilerini kontrol et
                    if (!isProfileComplete(userData)) {
                        // Profil eksik - register sayfasına yönlendir
                        navigation.navigate("register");
                    } else {
                        // Profil tam - success ekranı göster
                        await AsyncStorage.setItem('userData', JSON.stringify(userData));
                        setTimeout(() => {
                            setCheckingDevice(false);
                            setCurrentScreen('home');
                            navigation.navigate('home');
                        }, 800);
                    }
                    setLoading(false);
                    return;
                }
                await AsyncStorage.removeItem('userData');
            }
            setCheckingDevice(false);
            setCurrentScreen('login');
        } catch (error) {
            console.error('❌ Auto login error:', error);
            setCheckingDevice(false);
            setCurrentScreen('login');
        }
    };

    const handleSendCode = async () => {
        if (phoneNumber.length === 10) {
            setLoading(true);
            try {
                const formattedPhone = `+90${phoneNumber}`;
                const deviceId = await getOrCreateDeviceId();

                const playerByPhone = await playerService.getPlayerByPhone(formattedPhone);
                if (playerByPhone) {
                    const playerData = playerByPhone as IPlayer;
                    await AsyncStorage.setItem('userData', JSON.stringify(playerData));
                    setUser(playerData);

                    const deviceData = await deviceService.getById(deviceId);

                    if (deviceData && deviceData.playerId === playerData.id) {
                        const lastUsed = new Date().toISOString();
                        deviceService.update(deviceId, { lastUsed });
                        playerService.update(playerData.id, { lastLogin: lastUsed });

                        setUser({ ...playerData, lastLogin: new Date(lastUsed) });
                        setIsVerified(true);
                        setCurrentScreen('home');
                        navigation.navigate('home');
                        setLoading(false);
                        return;
                    }
                }

                setIsVerified(false);
                setCurrentScreen('verification');
                navigation.navigate('verification');
                setCountdown(60);
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
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
                <View style={styles.loadingContent}>
                    <Image
                        source={require("../../../assets/icons/splash.png")}
                        style={styles.loadingLogo}
                        resizeMode="contain"
                    />
                    <ActivityIndicator size="large" color="#16a34a" style={styles.loadingSpinner} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo Container */}
                    <View style={styles.headerContainer}>
                        <Image
                            source={require("../../../assets/icons/splash.png")}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Welcome Section */}
                    <View style={styles.welcomeSection}>
                        <Text style={styles.title}>Hoş Geldiniz</Text>
                        <Text style={styles.subtitle}>
                            Devam etmek için telefon numaranızı girin. Maç organize etmek veya mevcut maçlara katılmak için bir adım kaldı.
                        </Text>
                    </View>

                    {/* Main Card */}
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
                                />
                            </View>
                        </View>

                        {/* Checkbox */}
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setRememberDevice(!rememberDevice)}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            <View style={[styles.checkbox, rememberDevice && styles.checkboxChecked]}>
                                {rememberDevice && (
                                    <View style={styles.checkmarkContainer}>
                                        <Text style={styles.checkmark}>✓</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.checkboxTextContainer}>
                                <Text style={styles.checkboxTitle}>
                                    Bu cihazı güvenilir olarak işaretle
                                </Text>
                                <Text style={styles.checkboxSubtitle}>
                                    Bir sonraki girişinizde telefon numarası gerekmeyecek
                                </Text>
                            </View>
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

                        {/* Terms */}
                        <Text style={styles.termsText}>
                            Devam ederek{' '}
                            <Text style={styles.termsLink}>Kullanım Koşulları</Text>
                            {' '}ve{' '}
                            <Text style={styles.termsLink}>Gizlilik Politikası</Text>
                            'nı kabul etmiş olursunuz.
                        </Text>
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
    loadingContainer: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    loadingContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingLogo: {
        width: 140,
        height: 140,
        marginBottom: 20,
    },
    loadingSpinner: {
        marginTop: 20,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    headerContainer: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 32,
    },
    logo: {
        width: 100,
        height: 100,
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
        paddingHorizontal: 8,
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
    inputSection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 10,
        marginLeft: 4,
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        height: 56,
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
        fontSize: 20,
        marginRight: 6,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    phoneInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
    },
    checkboxContainer: {
        flexDirection: 'row',
        backgroundColor: '#DCFCE7',
        padding: 16,
        borderRadius: 14,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: '#16a34a',
        borderRadius: 6,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    checkboxChecked: {
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
    },
    checkmarkContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    checkboxTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    checkboxTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
        marginBottom: 2,
    },
    checkboxSubtitle: {
        fontSize: 12,
        color: '#15803d',
        lineHeight: 16,
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 14,
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
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 8,
    },
    termsLink: {
        color: '#16a34a',
        fontWeight: '600',
    },
});