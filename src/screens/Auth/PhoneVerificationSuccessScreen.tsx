import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Image,
    Animated,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';

export const PhoneVerificationSuccessScreen: React.FC = () => {
    const { rememberDevice } = useAppContext();
    const [progressAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0));
    const { setIsVerified } = useAppContext();

    useEffect(() => {
        setIsVerified(true);
        
        // Check icon animation
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();

        // Progress bar animation
        Animated.timing(progressAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
        }).start();
    }, []);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '70%'],
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
            
            <View style={styles.content}>
                {/* Logo */}
                <View style={styles.headerContainer}>
                    <Image 
                        source={require("../../../assets/icons/splash.png")} 
                        style={styles.logo} 
                        resizeMode="contain" 
                    />
                </View>

                <View style={styles.welcomeSection}>
                    <Text style={styles.title}>Hoş Geldiniz</Text>
                    <Text style={styles.subtitle}>
                        SMS ile gönderilen kodu girin.
                    </Text>
                </View>

                {/* Success Card */}
                <View style={styles.card}>
                    <View style={styles.successContainer}>
                        {/* Success Icon with Animation */}
                        <Animated.View 
                            style={[
                                styles.iconContainer,
                                {
                                    transform: [{ scale: scaleAnim }]
                                }
                            ]}
                        >
                            <View style={styles.checkmarkCircle}>
                                <Text style={styles.successIcon}>✓</Text>
                            </View>
                        </Animated.View>

                        <Text style={styles.successTitle}>Başarılı!</Text>
                        
                        <Text style={styles.successSubtitle}>
                            {rememberDevice 
                                ? 'Cihazınız kaydedildi. Bir sonraki girişinizde OTP gerekmeyecek.'
                                : 'Hesabınız doğrulandı. Uygulamaya yönlendiriliyorsunuz...'}
                        </Text>

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBar}>
                                <Animated.View 
                                    style={[
                                        styles.progressFill,
                                        { width: progressWidth }
                                    ]} 
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logo: {
        width: 80,
        height: 80,
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
        padding: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    successContainer: {
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    checkmarkCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#16a34a',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    successIcon: {
        fontSize: 52,
        color: 'white',
        fontWeight: '700',
    },
    successTitle: {
        fontSize: 26,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
        letterSpacing: -0.3,
    },
    successSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    progressBarContainer: {
        width: '100%',
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#16a34a',
        borderRadius: 4,
    },
});