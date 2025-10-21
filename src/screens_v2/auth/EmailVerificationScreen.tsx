// src/screens/auth/EmailVerificationScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Container, Button, Spacer } from '../../components';
import { useAuth } from '../../hooks';
import { colors, typography, spacing } from '../../config/theme';

export default function EmailVerificationScreen() {
  const navigation = useNavigation();
  const { 
    user, 
    sendVerificationEmail, 
    checkVerification, 
    reloadUser,
    loading 
  } = useAuth();

  const [cooldown, setCooldown] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Cooldown timer
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    // Eğer email doğrulanmışsa profil tamamlama ekranına yönlendir
    if (user?.emailVerified) {
      navigation.navigate('CompleteProfile' as never);
    }
  }, [user?.emailVerified, navigation]);

  const handleSendVerification = async () => {
    if (cooldown > 0) return;

    const result = await sendVerificationEmail();

    if (result.success) {
      Alert.alert(
        'E-posta Gönderildi! 📧',
        `${user?.email} adresine doğrulama e-postası gönderildi. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.`,
        [{ text: 'Tamam' }]
      );
      setCooldown(60); // 60 saniye bekle
    } else {
      Alert.alert('Hata', result.error || 'E-posta gönderilemedi');
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);

    const result = await checkVerification();

    setChecking(false);

    if (result.success && result.verified) {
      Alert.alert(
        'Tebrikler! 🎉',
        'E-posta adresiniz başarıyla doğrulandı!',
        [
          {
            text: 'Devam Et',
            onPress: () => navigation.navigate('CompleteProfile' as never),
          },
        ]
      );
    } else if (result.success && !result.verified) {
      Alert.alert(
        'Henüz Doğrulanmadı',
        'E-postanız henüz doğrulanmadı. Lütfen gelen kutunuzu kontrol edin ve doğrulama linkine tıklayın.',
        [{ text: 'Tamam' }]
      );
    } else {
      Alert.alert('Hata', result.error || 'Kontrol edilemedi');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'E-posta Doğrulaması',
      'E-posta doğrulaması önerilir. Yine de atlamak istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Atla',
          style: 'destructive',
          onPress: () => navigation.navigate('CompleteProfile' as never),
        },
      ]
    );
  };

  const handleResend = async () => {
    if (cooldown > 0) {
      Alert.alert(
        'Lütfen Bekleyin',
        `Yeni e-posta göndermek için ${cooldown} saniye beklemelisiniz.`
      );
      return;
    }

    await handleSendVerification();
  };

  return (
    <Screen scroll keyboardAvoiding backgroundColor={colors.background.default}>
      <Container padding="large" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>📧</Text>
          <Text style={styles.title}>E-posta Doğrulama</Text>
          <Text style={styles.subtitle}>
            E-posta adresinizi doğrulayarak hesabınızı güvence altına alın
          </Text>
        </View>

        <Spacer size="2xl" />

        {/* Email Display */}
        <View style={styles.emailContainer}>
          <Text style={styles.emailLabel}>Gönderilen Adres:</Text>
          <Text style={styles.emailText}>{user?.email}</Text>
        </View>

        <Spacer size="xl" />

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Nasıl Yapılır?</Text>
          
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>
              Gelen kutunuzu kontrol edin
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>
              Doğrulama linkine tıklayın
            </Text>
          </View>

          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              "Doğrulamayı Kontrol Et" butonuna basın
            </Text>
          </View>

          <Spacer size="md" />

          <View style={styles.tipContainer}>
            <Text style={styles.tipIcon}>💡</Text>
            <Text style={styles.tipText}>
              E-postayı bulamıyorsanız spam klasörünü kontrol edin
            </Text>
          </View>
        </View>

        <Spacer size="xl" />

        {/* Actions */}
        <Button
          title="Doğrulamayı Kontrol Et"
          onPress={handleCheckVerification}
          loading={checking}
          disabled={checking || loading}
          fullWidth
          size="large"
        />

        <Spacer size="md" />

        <Button
          title={
            cooldown > 0
              ? `E-posta Tekrar Gönder (${cooldown}s)`
              : 'E-posta Tekrar Gönder'
          }
          onPress={handleResend}
          variant="outline"
          disabled={cooldown > 0 || loading}
          fullWidth
          size="large"
        />

        <Spacer size="xl" />

        {/* Skip Link */}
        <View style={styles.skipContainer}>
          <Text style={styles.skipText}>E-postayı alamadınız mı? </Text>
          <TouchableOpacity onPress={handleSkip} disabled={loading}>
            <Text style={styles.skipLink}>Daha Sonra Doğrula</Text>
          </TouchableOpacity>
        </View>

        <Spacer size="md" />

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            E-posta doğrulaması hesabınızın güvenliğini artırır ve tüm özelliklere erişim sağlar.
          </Text>
        </View>
      </Container>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  emailContainer: {
    backgroundColor: colors.background.paper,
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emailLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  emailText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  instructionsContainer: {
    backgroundColor: '#F0F9FF',
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  instructionsTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.main,
    color: '#fff',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    lineHeight: 28,
    marginRight: spacing.md,
  },
  stepText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: spacing.md,
    borderRadius: 8,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: '#92400E',
  },
  skipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  skipLink: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});