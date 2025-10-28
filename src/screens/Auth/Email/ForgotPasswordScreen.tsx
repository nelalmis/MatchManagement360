// src/screens/auth/ForgotPasswordScreen.tsx
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
import { AuthStackParamList } from '../../../navigation/types';
import { useAuth } from '../../../hooks';

type Props = NativeStackScreenProps<AuthStackParamList, 'forgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const logoScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { sendPasswordResetEmail } = useAuth();

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
      // Cleanup
    };
  }, []);

  // Countdown effect for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

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

  const handleKeyboardShow = () => {
    setKeyboardVisible(true);
    Animated.spring(logoScale, {
      toValue: 0.7,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const handleKeyboardHide = () => {
    setKeyboardVisible(false);
    Animated.spring(logoScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  // ============================================
  // FORM HANDLING
  // ============================================

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      setEmailError('');
    }
  };

  const validateForm = (): boolean => {
    const error = getEmailError(email);
    if (error) {
      setEmailError(error);
      return false;
    }
    return true;
  };

  // ============================================
  // SUBMIT HANDLER
  // ============================================

  const handleSendResetLink = async () => {
    if (!validateForm()) {
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
       await sendPasswordResetEmail(email);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setEmailSent(true);
      setCountdown(60); // 60 seconds countdown

      Alert.alert(
        'Email Gönderildi! 📧',
        `Şifre sıfırlama bağlantısı ${email} adresine gönderildi. Lütfen e-postanızı kontrol edin.`,
        [{ text: 'Tamam' }]
      );
    } catch (error: any) {
      console.error('❌ Password reset error:', error);
      Alert.alert(
        'Hata',
        error.message || 'Şifre sıfırlama e-postası gönderilemedi. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    await handleSendResetLink();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F0FDF4" />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
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
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.logo}>🔒</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>Şifremi Unuttum</Text>
            <Text style={styles.subtitle}>
              {emailSent
                ? 'Şifre sıfırlama bağlantısı e-postanıza gönderildi'
                : 'E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz'}
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
            {!emailSent ? (
              <>
                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <AuthInput
                    placeholder="E-posta adresiniz"
                    value={email}
                    onChangeText={handleEmailChange}
                    error={emailError}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    icon="mail-outline"
                    editable={!loading}
                    label='E-posta adresiniz'
                  />
                </View>

                {/* Info Box */}
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color="#16a34a" />
                  <Text style={styles.infoText}>
                    E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz. 
                    Spam klasörünüzü de kontrol etmeyi unutmayın.
                  </Text>
                </View>

                {/* Submit Button */}
                <AuthButton
                  title="Şifre Sıfırlama Bağlantısı Gönder"
                  onPress={handleSendResetLink}
                  loading={loading}
                  disabled={loading || !email}
                  variant="gradient"
                  gradientColors={['#16a34a', '#15803d']}
                  icon="send"
                />
              </>
            ) : (
              <>
                {/* Success State */}
                <View style={styles.successContainer}>
                  <View style={styles.successIconContainer}>
                    <Ionicons name="checkmark-circle" size={64} color="#16a34a" />
                  </View>
                  <Text style={styles.successTitle}>Email Gönderildi!</Text>
                  <Text style={styles.successMessage}>
                    Şifre sıfırlama bağlantısı{'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                    {'\n'}adresine gönderildi.
                  </Text>

                  {/* Instructions */}
                  <View style={styles.instructionsContainer}>
                    <InstructionItem
                      number="1"
                      text="E-postanızı açın ve gelen kutunuzu kontrol edin"
                    />
                    <InstructionItem
                      number="2"
                      text="Şifre sıfırlama bağlantısına tıklayın"
                    />
                    <InstructionItem
                      number="3"
                      text="Yeni şifrenizi belirleyin"
                    />
                  </View>

                  {/* Resend Button */}
                  <TouchableOpacity
                    style={[
                      styles.resendButton,
                      countdown > 0 && styles.resendButtonDisabled,
                    ]}
                    onPress={handleResendEmail}
                    disabled={countdown > 0}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="reload"
                      size={18}
                      color={countdown > 0 ? '#9CA3AF' : '#16a34a'}
                    />
                    <Text
                      style={[
                        styles.resendText,
                        countdown > 0 && styles.resendTextDisabled,
                      ]}
                    >
                      {countdown > 0
                        ? `Tekrar gönder (${countdown}s)`
                        : 'Email Tekrar Gönder'}
                    </Text>
                  </TouchableOpacity>

                  {/* Back to Login */}
                  <AuthButton
                    title="Giriş Sayfasına Dön"
                    onPress={() => navigation.navigate('login')}
                    variant="outline"
                    icon="arrow-back"
                  />
                </View>
              </>
            )}
          </Animated.View>

          {/* Back to Login Link */}
          {!emailSent && !isKeyboardVisible && (
            <Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
              <Text style={styles.loginText}>Şifrenizi hatırladınız mı? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('login')}
                activeOpacity={0.7}
                disabled={loading}
              >
                <Text style={styles.loginLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Help Section */}
          {!isKeyboardVisible && (
            <View style={styles.helpSection}>
              <Text style={styles.helpTitle}>Yardıma mı ihtiyacınız var?</Text>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => Alert.alert('Destek', 'Destek ekibi ile iletişime geçin')}
                activeOpacity={0.7}
              >
                <Ionicons name="help-circle-outline" size={18} color="#16a34a" />
                <Text style={styles.helpButtonText}>Destek Ekibi</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ============================================
// INSTRUCTION ITEM COMPONENT
// ============================================

const InstructionItem: React.FC<{ number: string; text: string }> = ({
  number,
  text,
}) => (
  <View style={styles.instructionItem}>
    <View style={styles.instructionNumber}>
      <Text style={styles.instructionNumberText}>{number}</Text>
    </View>
    <Text style={styles.instructionText}>{text}</Text>
  </View>
);

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
    paddingBottom: spacing.xl,
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

  // Header
  header: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: spacing.lg,
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
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
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

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#15803d',
    lineHeight: 19,
    marginLeft: spacing.sm,
  },

  // Success State
  successContainer: {
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: spacing.sm,
  },
  successMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#16a34a',
  },

  // Instructions
  instructionsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },

  // Resend Button
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },

  // Login Link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  loginText: {
    fontSize: 15,
    color: '#6B7280',
  },
  loginLink: {
    fontSize: 15,
    color: '#16a34a',
    fontWeight: '700',
  },

  // Help Section
  helpSection: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  helpTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: spacing.sm,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;