// src/screens/auth/LoginScreen.tsx - MODERN DESIGN WITH OLD LOGIC
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
  ActivityIndicator,
  Animated,
  Keyboard,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthInput } from '../components/AuthInput';
import { AuthButton } from '../components/AuthButton';
import { spacing } from '../../../utils/theme';
import { getEmailError } from '../../../utils/validation';
import { isProfileComplete } from '../../../helper/helper';
import { useAuth } from '../../../hooks';
import { AuthStackParamList } from '../../../navigation/types';
import { IPlayer } from '../../../types/entity/types';
import { AuthNavigationService } from '../../../navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { loading, error: authError, clearError, signIn, signOut } = useAuth();

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const logoScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [checkingDevice, setCheckingDevice] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // ============================================
  // LIFECYCLE & EFFECTS
  // ============================================

  useEffect(() => {
    setupKeyboardListeners();
    setupAppStateListener();

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
      Alert.alert('Giriş Hatası', authError, [
        { text: 'Tamam', onPress: () => clearError() }
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

  const setupAppStateListener = () => {
    const subscription = AppState.addEventListener('change', (nextAppState: string) => {
      if (nextAppState === 'active' && Platform.OS === 'android') {
        logoScale.setValue(1);
        setKeyboardVisible(false);
      }
    });

    return () => {
      subscription.remove();
    };
  };

  const handleKeyboardShow = () => {
    setKeyboardVisible(true);
    Animated.spring(logoScale, {
      toValue: 0.6,
      useNativeDriver: true,
      friction: 8,
    }).start();

    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 80, animated: true });
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


  // ============================================
  // FORM HANDLING
  // ============================================

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      password: '',
    };

    // Email validation
    const emailError = getEmailError(formData.email);
    if (emailError) {
      newErrors.email = emailError;
    }

    // Password validation
    if (!formData.password || formData.password.length === 0) {
      newErrors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return !newErrors.email && !newErrors.password;
  };

  // ============================================
  // LOGIN HANDLER (NEW SLICE LOGIC)
  // ============================================

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    Keyboard.dismiss();

    try {
      // Redux thunk dispatch
      const result = await signIn(formData.email, formData.password, rememberMe);

      console.log('📊 Login result:', result);

      // ✅ ARTIK result.success güvenle kontrol edilebilir
      if (!result.success) {
        // Hata durumu - authError zaten set edildi
        console.error('❌ Login failed:', result.error);
        // useEffect ile gösterilecek, burada ekstra bir şey yapmaya gerek yok
        return;
      }
      console.log('✅ Login successful:', result.data);

      const userData = result.data as IPlayer;
      // ✅ 1. EMAIL VERIFICATION CHECK (EN ÖNCELİKLİ)
      if (!userData.emailVerified) {
        console.warn('⚠️ [LoginScreen] Email not verified');

        Alert.alert(
          'E-posta Doğrulama Gerekli',
          'Hesabınıza giriş yapmadan önce e-posta adresinizi doğrulamanız gerekiyor.',
          [
            {
              text: 'İptal',
              style: 'cancel',
              onPress: () => {
                // Logout yap
                signOut();
              },
            },
            {
              text: 'Doğrula',
              onPress: () => {
                // Email verification ekranına yönlendir
                navigation.navigate('emailVerification', { email: formData.email });
              },
            },
          ],
          { cancelable: false }
        );
        return;
      }
      // Check profile completion
      if (!isProfileComplete(result.data as IPlayer)) {
        // Navigate to complete profile
        Alert.alert(
          'Profil Tamamla',
          'Devam etmek için profilinizi tamamlamanız gerekiyor',
          [
            {
              text: 'Tamam',
              onPress: () => AuthNavigationService.navigateToRegister(),
            },
          ]
        );
      } else {
        // ✅ Profil tamam - RootNavigator otomatik Main stack'e geçecek
        console.log('✅ Profile complete, waiting for RootNavigator redirect');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      // Error already handled by useEffect above
    }
  };

  // ============================================
  // SOCIAL LOGIN (PLACEHOLDER)
  // ============================================

  const handleGoogleLogin = async () => {
    Alert.alert('Bilgi', 'Google ile giriş yakında eklenecek');
  };

  const handleAppleLogin = async () => {
    Alert.alert('Bilgi', 'Apple ile giriş yakında eklenecek');
  };

  const handleBiometricLogin = async () => {
    Alert.alert('Bilgi', 'Biyometrik giriş yakında eklenecek');
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (checkingDevice) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
        <View style={styles.loadingContent}>
          <Animated.View style={[styles.loadingLogoContainer, { opacity: fadeAnim }]}>
            <Text style={styles.loadingLogoText}>⚽</Text>
          </Animated.View>
          <Text style={styles.loadingTitle}>Maç Yönetimi</Text>
          <Text style={styles.loadingSubtitle}>Giriş kontrol ediliyor...</Text>
          <ActivityIndicator size="large" color="#16a34a" style={styles.loadingSpinner} />
        </View>
      </SafeAreaView>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Animated Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                style={styles.logoGradient}
              >
                <Text style={styles.logo}>⚽</Text>
              </LinearGradient>
            </View>
            {!isKeyboardVisible && (
              <>
                <Text style={styles.appName}>Maç Yönetimi</Text>
                <Text style={styles.title}>Hoş Geldin!</Text>
                <Text style={styles.subtitle}>
                  Maçlara katılmak için giriş yap
                </Text>
              </>
            )}
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
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
              // placeholder="ornek@email.com"
              />
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
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
                autoComplete="password"
                textContentType="password"
                editable={!loading}
                placeholder="••••••••"
              />
            </View>

            {/* Remember Me & Forgot Password */}
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={styles.rememberMeContainer}
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
                disabled={loading}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </View>
                <Text style={styles.rememberMeText}>Beni Hatırla</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('forgotPassword', { email: formData.email })}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.forgotPassword}>Şifremi Unuttum</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <AuthButton
              title="Giriş Yap"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              variant="gradient"
              gradientColors={['#16a34a', '#15803d']}
              icon="arrow-forward"
            />

            {/* Biometric Login */}
            {Platform.OS === 'ios' && !isKeyboardVisible && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Ionicons name="finger-print" size={20} color="#16a34a" />
                <Text style={styles.biometricText}>Face ID ile Giriş Yap</Text>
              </TouchableOpacity>
            )}

            {/* Divider */}
            {/* {!isKeyboardVisible && (
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>veya</Text>
                <View style={styles.dividerLine} />
              </View>
            )} */}

            {/* Social Login */}
            {/* {!isKeyboardVisible && (
              <SocialLoginButtons
                onGooglePress={handleGoogleLogin}
                onApplePress={handleAppleLogin}
                loading={loading}
              />
            )} */}
          </Animated.View>

          {/* Register Link */}
          {!isKeyboardVisible && (
            <Animated.View style={[styles.registerContainer, { opacity: fadeAnim }]}>
              <Text style={styles.registerText}>Hesabın yok mu? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('register')}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.registerLink}>Kayıt Ol</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Terms - Compact when keyboard visible */}
          {!isKeyboardVisible && (
            <Text style={styles.termsText}>
              Devam ederek{' '}
              <Text style={styles.termsLink}>Kullanım Koşulları</Text>
              {' '}ve{' '}
              <Text style={styles.termsLink}>Gizlilik Politikası</Text>
              'nı kabul ediyorsunuz
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  // Loading Styles
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0FDF4',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingLogoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: spacing.xl,
  },
  loadingLogoText: {
    fontSize: 60,
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: spacing.xs,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: spacing.xl,
  },
  loadingSpinner: {
    marginTop: spacing.lg,
  },

  // Main Container
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
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logoGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Form Card
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },

  // Biometric Button
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  biometricText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Register Link
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  registerText: {
    fontSize: 15,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 15,
    color: '#16a34a',
    fontWeight: '700',
  },

  // Terms
  termsText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  termsLink: {
    color: '#16a34a',
    fontWeight: '600',
  },
});
