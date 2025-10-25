// src/screens/auth/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { ArrowLeft } from 'lucide-react-native';
import { AuthInput } from './components/AuthInput';
import { AuthButton } from './components/AuthButton';
import { SocialLoginButtons } from './components/SocialLoginButtons';
import { commonColors, typography, spacing, borderRadius } from '../../utils/theme';
import { validateRegisterForm } from '../../utils/validation';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../hooks';
import { AuthStackParamList } from '../../navigation';
import Ionicons from '@expo/vector-icons/build/Ionicons';

type Props = NativeStackScreenProps<AuthStackParamList, 'register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
    const { loading, error: authError, message, clearError, clearMessage, signUp } = useAuth();
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

    // Clear Redux errors/messages when component unmounts
    useEffect(() => {
        return () => {
            clearError();
            clearMessage();
        };
    }, []);

    // Show Redux auth error/message as alert
    useEffect(() => {
        if (authError) {
            Alert.alert('Hata', authError);
            clearError();
        }
    }, [authError]);

    useEffect(() => {
        if (message) {
            Alert.alert('Başarılı', message, [
                {
                    text: 'Tamam',
                    onPress: () => {
                        clearMessage();
                        navigation.replace('login');
                    },
                },
            ]);
        }
    }, [message, navigation]);

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field as keyof typeof errors]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const handleRegister = async () => {
        // Validate form
        const { isValid, errors: validationErrors } = validateRegisterForm(
            formData.name,
            formData.surname,
            formData.email,
            formData.password,
            formData.confirmPassword
        );

        if (!isValid) {
            setErrors(validationErrors);
            return;
        }

        // Check terms acceptance
        if (!acceptedTerms) {
            Alert.alert('Uyarı', 'Devam etmek için kullanım koşullarını kabul etmelisiniz');
            return;
        }

        try {
            // Redux thunk dispatch
            const result = await signUp(
                formData.email,
                formData.password,
                formData.name,
                formData.surname,
            );
            if (!result || !result.success) {
                throw new Error(result?.error || 'Kayıt yapılamadı');
            }

            navigation.navigate('emailVerification', { email: formData.email });
            // Success message is handled by useEffect above
            console.log('Registration successful');
        } catch (error: any) {
            // Error is already handled by Redux and useEffect above
            console.error('Registration error:', error);
        }
    };

    const handleGoogleRegister = async () => {
        try {
            // TODO: Implement Google Sign-Up
            console.log('Google register');
            Alert.alert('Bilgi', 'Google ile kayıt yakında eklenecek');
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Google ile kayıt oluşturulamadı');
        }
    };

    const handleAppleRegister = async () => {
        try {
            // TODO: Implement Apple Sign-Up
            console.log('Apple register');
            Alert.alert('Bilgi', 'Apple ile kayıt yakında eklenecek');
        } catch (error: any) {
            Alert.alert('Hata', error.message || 'Apple ile kayıt oluşturulamadı');
        }
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return null;

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 2) return {
            color: commonColors.error,
            text: 'Zayıf',
            widthPercentage: 33
        };
        if (strength <= 4) return {
            color: commonColors.warning,
            text: 'Orta',
            widthPercentage: 66
        };
        return {
            color: commonColors.success,
            text: 'Güçlü',
            widthPercentage: 100
        };
    };

    const passwordStrength = getPasswordStrength();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor={commonColors.white} />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>


                    {/* Header */}
                    <View style={styles.header}>
                        {/* <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            <ArrowLeft size={24} color={commonColors.text.primary} />
                        </TouchableOpacity> */}

                        <Text style={styles.title}>Hesap Oluştur</Text>
                        <Text style={styles.subtitle}>
                            Spor arkadaşlarını bulmaya başla
                        </Text>
                    </View>

                    {/* Progress Indicator */}
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                            <LinearGradient
                                colors={['#16a34a', '#15803d']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={[styles.progressFill, { width: '100%' }]}
                            />
                        </View>
                        <Text style={styles.progressText}>Adım 1/2</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Name Row */}
                        <View style={styles.nameRow}>
                            <View style={styles.halfInput}>
                                <AuthInput
                                    label="Ad"
                                    icon="person-outline"
                                    value={formData.name}
                                    onChangeText={(value) => handleChange('name', value)}
                                    error={errors.name}
                                    autoCapitalize="words"
                                    textContentType="givenName"
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.halfInput}>
                                <AuthInput
                                    label="Soyad"
                                    icon="person-outline"
                                    value={formData.surname}
                                    onChangeText={(value) => handleChange('surname', value)}
                                    error={errors.surname}
                                    autoCapitalize="words"
                                    textContentType="familyName"
                                    editable={!loading}
                                />
                            </View>
                        </View>

                        <AuthInput
                            label="E-posta"
                            icon="mail-outline"
                            value={formData.email}
                            onChangeText={(value) => handleChange('email', value)}
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            textContentType="emailAddress"
                            editable={!loading}
                        />

                        <AuthInput
                            label="Şifre"
                            icon="lock-closed-outline"
                            value={formData.password}
                            onChangeText={(value) => handleChange('password', value)}
                            error={errors.password}
                            secureTextEntry={!showPassword}
                            rightIcon={showPassword ? 'eye-outline' : 'eye-off-outline'}
                            onRightIconPress={() => setShowPassword(!showPassword)}
                            autoCapitalize="none"
                            textContentType="newPassword"
                            editable={!loading}
                        />

                        {/* Password Strength Indicator */}
                        {passwordStrength && formData.password.length > 0 && (
                            <View style={styles.passwordStrengthContainer}>
                                <View style={styles.passwordStrengthBar}>
                                    <View
                                        style={[
                                            styles.passwordStrengthFill,
                                            {
                                                width: `${passwordStrength.widthPercentage}%`,
                                                backgroundColor: passwordStrength.color,
                                            },
                                        ]}
                                    />
                                </View>
                                <Text
                                    style={[
                                        styles.passwordStrengthText,
                                        { color: passwordStrength.color },
                                    ]}
                                >
                                    {passwordStrength.text}
                                </Text>
                            </View>
                        )}

                        <AuthInput
                            label="Şifre Tekrar"
                            icon="lock-closed-outline"
                            value={formData.confirmPassword}
                            onChangeText={(value) => handleChange('confirmPassword', value)}
                            error={errors.confirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            rightIcon={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                            onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            autoCapitalize="none"
                            textContentType="newPassword"
                            editable={!loading}
                        />

                        {/* Terms & Conditions */}
                        <TouchableOpacity
                            style={styles.termsContainer}
                            onPress={() => setAcceptedTerms(!acceptedTerms)}
                            activeOpacity={0.7}
                            disabled={loading}
                        >
                            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                                {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.termsText}>
                                <Text style={styles.termsLink}>Kullanım Koşulları</Text> ve{' '}
                                <Text style={styles.termsLink}>Gizlilik Politikası</Text>'nı okudum ve kabul ediyorum
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

                        {/* Social Register */}
                        {/* <SocialLoginButtons
                            onGooglePress={handleGoogleRegister}
                            onApplePress={handleAppleRegister}
                            loading={loading}
                        /> */}

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Zaten hesabın var mı? </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('login')}
                                activeOpacity={0.7}
                                disabled={loading}
                            >
                                <Text style={styles.loginLink}>Giriş Yap</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: commonColors.white,
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
    },
    header: {
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
    },
    // Back Button
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },

    title: {
        fontSize: typography.h2.fontSize,
        fontWeight: '700',
        color: commonColors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.body1.fontSize,
        color: commonColors.text.secondary,
    },
    progressContainer: {
        marginBottom: spacing.lg,
    },
    progressBar: {
        height: 4,
        backgroundColor: commonColors.background.tertiary,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFill: {
        height: '100%',
    },
    progressText: {
        fontSize: typography.caption.fontSize,
        color: commonColors.text.tertiary,
        textAlign: 'right',
    },
    form: {
        flex: 1,
        paddingTop: spacing.md,
    },
    nameRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    halfInput: {
        flex: 1,
    },
    passwordStrengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: -spacing.sm,
        marginBottom: spacing.md,
        paddingHorizontal: spacing.xs,
    },
    passwordStrengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: commonColors.background.tertiary,
        borderRadius: 2,
        marginRight: spacing.sm,
        overflow: 'hidden',
    },
    passwordStrengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    passwordStrengthText: {
        fontSize: typography.caption.fontSize,
        fontWeight: '600',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.lg,
        paddingHorizontal: spacing.xs,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: commonColors.border.medium,
        marginRight: spacing.sm,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
    },
    checkboxChecked: {
        backgroundColor: commonColors.success,
        borderColor: commonColors.success,
    },
    checkmark: {
        color: commonColors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    termsText: {
        flex: 1,
        fontSize: typography.body2.fontSize,
        color: commonColors.text.secondary,
        lineHeight: 20,
    },
    termsLink: {
        color: commonColors.info,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    loginText: {
        fontSize: typography.body1.fontSize,
        color: commonColors.text.secondary,
    },
    loginLink: {
        fontSize: typography.body1.fontSize,
        color: commonColors.info,
        fontWeight: '600',
    },
});