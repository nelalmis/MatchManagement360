// src/screens/auth/EmailVerificationScreen.tsx
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
import { AuthButton } from '../components/AuthButton';
import { commonColors, typography, spacing } from '../../../utils/theme';
import { useAuth } from '../../../hooks';
import { AuthStackParamList } from '../../../navigation/types';
import { AuthNavigationService } from '../../../navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'emailVerification'>;

export const EmailVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { email } = route.params || {};
  const {
    user,
    sendVerificationEmail,
    checkVerification,
    reloadUser,
    loading
  } = useAuth();
  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const logoScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State
  const [countdown, setCountdown] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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

    // Auto-send email on mount
    handleSendVerification();

    return () => {
      // Cleanup
    };
  }, []);

  // Countdown effect
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
  // SEND VERIFICATION EMAIL
  // ============================================

  const handleSendVerification = async () => {
    // ✅ Countdown kontrolü
    if (countdown > 0) {
      Alert.alert(
        'Bekleyin',
        `Yeni email göndermek için ${countdown} saniye beklemeniz gerekiyor.`,
        [{ text: 'Tamam' }]
      );
      return;
    }
    try {
      setIsSending(true);
      console.log('📧 [EmailVerification] Sending verification email...');

      await sendVerificationEmail();

      setEmailSent(true);
      setCountdown(60); // 60 seconds countdown
      setIsSending(false);

      Alert.alert(
        'Email Gönderildi! 📧',
        `Doğrulama emaili ${email} adresine gönderildi.\n\nLütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.`,
        [{ text: 'Tamam' }]
      );

      console.log('✅ [EmailVerification] Email sent successfully');
    } catch (error: any) {
      console.error('❌ [EmailVerification] Send email error:', error);
      setIsSending(false);

      let errorMessage = 'Email gönderilemedi. Lütfen tekrar deneyin.';

      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.';
      }

      Alert.alert('Hata', errorMessage);
    }
  };

  // ============================================
  // CHECK IF EMAIL IS VERIFIED
  // ============================================

  const handleCheckVerification = async () => {
    try {
      setIsChecking(true);
      console.log('🔍 [EmailVerification] Checking verification status...');

      const result = await checkVerification();


      console.log('📊 [EmailVerification] Verification status:', {
        emailVerified: result?.verified
      });

      if (result?.verified) {
        // ✅ Email doğrulandı!
        console.log('✅ [EmailVerification] Email verified!');

        // Redux state'i güncelle
        await checkVerification();

        setIsChecking(false);

        Alert.alert(
          'Başarılı! 🎉',
          'E-posta adresiniz doğrulandı. Şimdi uygulamayı kullanabilirsiniz.',
          [
            {
              text: 'Devam Et',
              onPress: () => {
                // RootNavigator otomatik olarak Main'e yönlendirecek
                console.log('✅ [EmailVerification] Navigating to app...');
              },
            },
          ]
        );
      } else {
        // ❌ Email henüz doğrulanmadı
        console.log('❌ [EmailVerification] Email not verified yet');
        setIsChecking(false);

        Alert.alert(
          'Henüz Doğrulanmadı',
          'E-posta adresiniz henüz doğrulanmadı. Lütfen email kutunuzu kontrol edin ve doğrulama linkine tıklayın.',
          [
            { text: 'Tamam' },
            {
              text: 'Tekrar Gönder',
              onPress: () => {
                // Sadece countdown bittiyse gönder
                if (countdown === 0) {
                  handleSendVerification();
                } else {
                  Alert.alert(
                    'Bekleyin',
                    `Yeni email göndermek için ${countdown} saniye beklemeniz gerekiyor.`,
                    [{ text: 'Tamam' }]
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ [EmailVerification] Check error:', error);
      setIsChecking(false);
      Alert.alert('Hata', 'Doğrulama kontrolü yapılamadı. Lütfen tekrar deneyin.');
    }
  };

  // ============================================
  // RESEND EMAIL
  // ============================================

  const handleResendEmail = async () => {
    if (countdown > 0) return;
    await handleSendVerification();
  };

  // ============================================
  // GO BACK TO LOGIN
  // ============================================

  const handleBackToLogin = () => {
    Alert.alert(
      'Geri Dön',
      'E-posta doğrulaması yapmadan geri dönmek istediğinizden emin misiniz?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet',
          onPress: () => AuthNavigationService.navigateToLogin(),
        },
      ]
    );
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
            onPress={handleBackToLogin}
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
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#16a34a', '#15803d']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <Text style={styles.logo}>📧</Text>
              </LinearGradient>
            </View>
            <Text style={styles.title}>E-posta Doğrulama</Text>
            <Text style={styles.subtitle}>
              {emailSent
                ? 'Doğrulama emaili gönderildi'
                : 'E-posta adresinizi doğrulayın'}
            </Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View style={[styles.formCard, { opacity: fadeAnim }]}>
            {!emailSent ? (
              <>
                {/* Sending State */}
                <View style={styles.sendingContainer}>
                  <Text style={styles.sendingText}>
                    Doğrulama emaili gönderiliyor...
                  </Text>
                </View>
              </>
            ) : (
              <>
                {/* Success State */}
                <View style={styles.successContainer}>
                  <View style={styles.successIconContainer}>
                    <Ionicons name="mail" size={64} color="#16a34a" />
                  </View>
                  <Text style={styles.successTitle}>Email Gönderildi!</Text>
                  <Text style={styles.successMessage}>
                    Doğrulama emaili{'\n'}
                    <Text style={styles.emailHighlight}>{email}</Text>
                    {'\n'}adresine gönderildi.
                  </Text>

                  {/* Instructions */}
                  <View style={styles.instructionsContainer}>
                    <InstructionItem
                      number="1"
                      text="Gelen kutunuzu kontrol edin"
                    />
                    <InstructionItem
                      number="2"
                      text="Spam klasörünü kontrol edin"
                    />
                    <InstructionItem
                      number="3"
                      text="Doğrulama linkine tıklayın"
                    />
                    <InstructionItem
                      number="4"
                      text="Bu ekrana geri dönün ve doğrulayın"
                    />
                  </View>

                  {/* Check Verification Button */}
                  <AuthButton
                    title={isChecking ? 'Kontrol Ediliyor...' : 'Doğrulamayı Kontrol Et'}
                    onPress={handleCheckVerification}
                    loading={isChecking}
                    disabled={isChecking}
                    variant="gradient"
                    gradientColors={['#16a34a', '#15803d']}
                    icon="checkmark-circle"
                  />

                  {/* Resend Button */}
                  <TouchableOpacity
                    style={[
                      styles.resendButton,
                      (countdown > 0 || isSending) && styles.resendButtonDisabled,
                    ]}
                    onPress={handleResendEmail}
                    disabled={countdown > 0 || isSending}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="mail"
                      size={20}
                      color={countdown > 0 || isSending ? '#9CA3AF' : '#16a34a'}
                    />
                    <Text
                      style={[
                        styles.resendText,
                        (countdown > 0 || isSending) && styles.resendTextDisabled,
                      ]}
                    >
                      {countdown > 0
                        ? `Tekrar Gönder (${countdown}s)`
                        : isSending
                          ? 'Gönderiliyor...'
                          : 'Email\'i Tekrar Gönder'}
                    </Text>
                  </TouchableOpacity>

                  {/* Back to Login */}
                  <AuthButton
                    title="Giriş Ekranına Dön"
                    onPress={() => AuthNavigationService.navigateToLogin()}
                    variant="outline"
                    icon="arrow-back"
                    style={styles.backToLoginButton}
                  />
                </View>
              </>
            )}
          </Animated.View>

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

          {/* Info Box */}
          {emailSent && !isKeyboardVisible && (
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#16a34a" />
              <Text style={styles.infoText}>
                Email gelmedi mi? Spam klasörünü kontrol edin veya yukarıdaki butona
                tıklayarak tekrar gönderin.
              </Text>
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

  // Sending State
  sendingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  sendingText: {
    fontSize: 16,
    color: '#6B7280',
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
    marginTop: spacing.md,
    marginBottom: spacing.md,
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

  // Back to Login Button
  backToLoginButton: {
    marginTop: spacing.sm,
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

export default EmailVerificationScreen;