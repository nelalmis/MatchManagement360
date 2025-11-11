// src/screens/auth/RegisterScreen.tsx - COMPACT NO-SCROLL DESIGN
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    StatusBar,
    Alert,
    Animated,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';
import { commonColors, typography, spacing } from '../../../utils/theme';
import { validateEmail, getEmailError } from '../../../utils/validation';
import { useAuth } from '../../../hooks';
import { AuthStackParamList } from '../../../navigation/types';
import { AuthNavigationService } from '../../../navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
    const { loading, error: authError, clearError, signUp } = useAuth();

    // Refs
    const scrollViewRef = useRef<ScrollView>(null);
    const logoScale = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // State
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isKeyboardVisible, setKeyboardVisible] = useState(false);

    // ============================================
    // LIFECYCLE & EFFECTS
    // ============================================

    useEffect(() => {
        setupKeyboardListeners();

        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        return () => {
            clearError();
        };
    }, []);

    // Show auth errors
    useEffect(() => {
        if (authError) {
            Alert.alert('Kayıt Hatası', authError, [
                { text: 'Tamam', onPress: () => clearError() },
            ]);
        }
    }, [authError]);

    // ============================================
    // KEYBOARD HANDLING
    // ============================================

    const setupKeyboardListeners = () => {
        const keyboardWillShow = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            handleKeyboardShow
        );
        const keyboardWillHide = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            handleKeyboardHide
        );

        return () => {
            keyboardWillShow.remove();
            keyboardWillHide.remove();
        };
    };

    const handleKeyboardShow = (event: any) => {
        setKeyboardVisible(true);
        Animated.spring(logoScale, {
            toValue: 0.5,
            useNativeDriver: true,
            friction: 8,
        }).start();

        // Scroll to bottom to show register button when keyboard is open
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'android' ? 300 : 150);
    };

    const handleKeyboardHide = () => {
        setKeyboardVisible(false);
        Animated.spring(logoScale, {
            toValue: 1,
            useNativeDriver: true,
            friction: 8,
        }).start();

        // Scroll back to top when keyboard closes
        setTimeout(() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        }, 100);
    };

    // ============================================
    // FORM HANDLING
    // ============================================

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors = {
            name: '',
            surname: '',
            email: '',
            password: '',
            confirmPassword: '',
        };

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Ad gereklidir';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Ad en az 2 karakter olmalıdır';
        }

        // Surname validation
        if (!formData.surname.trim()) {
            newErrors.surname = 'Soyad gereklidir';
        } else if (formData.surname.trim().length < 2) {
            newErrors.surname = 'Soyad en az 2 karakter olmalıdır';
        }

        // Email validation
        const emailError = getEmailError(formData.email);
        if (emailError) {
            newErrors.email = emailError;
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Şifre gereklidir';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Şifre en az 6 karakter olmalıdır';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Şifreler eşleşmiyor';
        }

        setErrors(newErrors);
        return Object.values(newErrors).every((error) => error === '');
    };

    // ============================================
    // REGISTER HANDLER
    // ============================================

    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        if (!acceptedTerms) {
            Alert.alert('Uyarı', 'Devam etmek için kullanım koşullarını kabul etmelisiniz');
            return;
        }

        Keyboard.dismiss();

        try {
            console.log('📝 [RegisterScreen] Register attempt');

            const result = await signUp(
                formData.email,
                formData.password,
                formData.name,
                formData.surname
            );

            if (!result.success) {
                console.error('❌ [RegisterScreen] Register failed:', result.error);
                return;
            }

            console.log('✅ [RegisterScreen] Register successful');

            // Navigate to email verification
            navigation.navigate('emailVerification', { email: formData.email });
        } catch (error: any) {
            console.error('❌ [RegisterScreen] Unexpected error:', error);
        }
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                        disabled={loading}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>

                    {/* Header - Compact */}
                    {!isKeyboardVisible && (
                        <Animated.View
                            style={[
                                styles.header,
                                { opacity: fadeAnim, transform: [{ scale: logoScale }] },
                            ]}
                        >
                            <View style={styles.logoContainer}>
                                <LinearGradient
                                    colors={['#16a34a', '#15803d']}
                                    style={styles.logoGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Text style={styles.logo}>⚽</Text>
                                </LinearGradient>
                            </View>
                            <Text style={styles.title}>Hesap Oluştur</Text>
                            <Text style={styles.subtitle}>Hemen başlamak için kayıt ol</Text>
                        </Animated.View>
                    )}

                    {/* Form Card - Compact */}
                    <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
                        {/* Name - Full width */}
                        <View style={styles.inputWrapper}>
                            <AuthInput
                                placeholder=""
                                value={formData.name}
                                onChangeText={(value) => handleChange('name', value)}
                                error={errors.name}
                                icon="person-outline"
                                editable={!loading}
                                label='Ad'
                            />
                        </View>

                        {/* Surname - Full width */}
                        <View style={styles.inputWrapper}>
                            <AuthInput
                                placeholder=""
                                value={formData.surname}
                                onChangeText={(value) => handleChange('surname', value)}
                                error={errors.surname}
                                icon="person-outline"
                                editable={!loading}
                                label='Soyad'
                            />
                        </View>

                        {/* Email */}
                        <View style={styles.inputWrapper}>
                            <AuthInput
                                placeholder=""
                                value={formData.email}
                                onChangeText={(value) => handleChange('email', value)}
                                error={errors.email}
                                icon="mail-outline"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading}
                                label='E-posta'
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }}
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.inputWrapper}>
                            <AuthInput
                                placeholder=""
                                value={formData.password}
                                onChangeText={(value) => handleChange('password', value)}
                                error={errors.password}
                                icon="lock-closed-outline"
                                secureTextEntry={!showPassword}
                                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                onRightIconPress={() => setShowPassword(!showPassword)}
                                editable={!loading}
                                label='Şifre'
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }}
                            />
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputWrapper}>
                            <AuthInput
                                placeholder=""
                                value={formData.confirmPassword}
                                onChangeText={(value) => handleChange('confirmPassword', value)}
                                error={errors.confirmPassword}
                                icon="lock-closed-outline"
                                secureTextEntry={!showConfirmPassword}
                                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                onRightIconPress={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                editable={!loading}
                                label='Şifre Tekrar'
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }, 100);
                                }}
                            />
                        </View>

                        {/* Terms & Conditions - Compact */}
                        <TouchableOpacity
                            style={styles.termsContainer}
                            onPress={() => setAcceptedTerms(!acceptedTerms)}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            <View
                                style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
                            >
                                {acceptedTerms && (
                                    <Ionicons name="checkmark" size={12} color="white" />
                                )}
                            </View>
                            <Text style={styles.termsText}>
                                <Text style={styles.termsLink}>Kullanım Koşulları</Text> ve{' '}
                                <Text style={styles.termsLink}>Gizlilik Politikası</Text>'nı
                                kabul ediyorum
                            </Text>
                        </TouchableOpacity>

                        {/* Register Button */}
                        <AuthButton
                            title="Kayıt Ol"
                            onPress={handleRegister}
                            loading={loading}
                            disabled={loading}
                            variant="gradient"
                            gradientColors={['#16a34a', '#15803d']}
                            icon="arrow-forward"
                            iconPosition="right"
                        />
                    </Animated.View>

                    {/* Login Link */}
                    <Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
                        <Text style={styles.loginText}>Zaten hesabın var mı? </Text>
                        <TouchableOpacity
                            onPress={() => AuthNavigationService.navigateToLogin()}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            <Text style={styles.loginLink}>Giriş Yap</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0FDF4',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xl * 2, // Extra padding to ensure button is visible above keyboard
    },

    // Back Button
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },

    // Header - Compact
    header: {
        alignItems: 'center',
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    logoContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    logoGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        fontSize: 38,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },

    // Form Card - Compact
    formCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
        marginBottom: spacing.md,
    },

    // Input Wrapper for compact spacing
    inputWrapper: {
        marginBottom: spacing.xs,
    },

    // Terms - Compact
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
        marginTop: spacing.xs,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        marginRight: spacing.xs,
        marginTop: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
    },
    termsText: {
        flex: 1,
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },
    termsLink: {
        color: '#16a34a',
        fontWeight: '600',
    },

    // Login Link
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    loginText: {
        fontSize: 14,
        color: '#6B7280',
    },
    loginLink: {
        fontSize: 14,
        color: '#16a34a',
        fontWeight: '700',
    },
});

export default RegisterScreen;