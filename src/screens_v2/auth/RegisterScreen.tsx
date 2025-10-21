// src/screens/auth/RegisterScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Screen, Container, Input, Button, Spacer } from '../../components';
import { signUpUser, clearError } from '../../store/slices/authSlice';
import { colors, typography, spacing } from '../../config/theme';
import type { AppDispatch } from '../../store';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();

  const { loading, error } = useSelector((state: any) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleRegister = async () => {
    // Validation
    if (!formData.name.trim()) {
      setLocalError('İsim gerekli');
      return;
    }

    if (!formData.surname.trim()) {
      setLocalError('Soyisim gerekli');
      return;
    }

    if (!formData.email.trim()) {
      setLocalError('E-posta adresi gerekli');
      return;
    }

    if (!isValidEmail(formData.email)) {
      setLocalError('Geçersiz e-posta formatı');
      return;
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      setLocalError('Geçersiz telefon formatı');
      return;
    }

    if (!formData.password) {
      setLocalError('Şifre gerekli');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Şifreler eşleşmiyor');
      return;
    }

    setLocalError('');

    // Dispatch signup action
    const result = await dispatch(
      signUpUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        phone: formData.phone.trim() || undefined,
      })
    );

    if (signUpUser.fulfilled.match(result)) {
      // Kayıt başarılı - Email verification ekranına yönlendir
      navigation.navigate('EmailVerification' as never);
    } else if (signUpUser.rejected.match(result)) {
      // Hata durumunda - state temizle
      setFormData({
        name: '',
        surname: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
      });
      Alert.alert('Kayıt Başarısız', result.payload as string || 'Lütfen tekrar deneyin');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setLocalError('');
    dispatch(clearError());
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    // Türkiye formatı: +90 veya 0 ile başlayan 10 haneli numara
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const errorMessage = localError || error;

  return (
    <Screen scroll keyboardAvoiding backgroundColor={colors.background.default}>
      <Container padding="large" style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚽</Text>
          <Text style={styles.title}>Hesap Oluştur</Text>
          <Text style={styles.subtitle}>
            Maç yönetimine başlamak için kayıt olun
          </Text>
        </View>

        <Spacer size="xl" />

        {/* Registration Form */}
        <View style={styles.form}>
          <Input
            label="İsim *"
            placeholder="İsminizi girin"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            autoCapitalize="words"
            autoComplete="name"
            leftIcon={<Text>👤</Text>}
          />

          <Input
            label="Soyisim *"
            placeholder="Soyisminizi girin"
            value={formData.surname}
            onChangeText={(text) => handleInputChange('surname', text)}
            autoCapitalize="words"
            autoComplete="family-name"
            leftIcon={<Text>👤</Text>}
          />

          <Input
            label="E-posta *"
            placeholder="ornek@email.com"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Text>📧</Text>}
          />

          <Input
            label="Telefon (Opsiyonel)"
            placeholder="+90 5XX XXX XX XX"
            value={formData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            keyboardType="phone-pad"
            autoComplete="tel"
            leftIcon={<Text>📱</Text>}
          />

          <Input
            label="Şifre *"
            placeholder="Şifrenizi oluşturun (min. 6 karakter)"
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            leftIcon={<Text>🔒</Text>}
          />

          <Input
            label="Şifre Tekrar *"
            placeholder="Şifrenizi tekrar girin"
            value={formData.confirmPassword}
            onChangeText={(text) => handleInputChange('confirmPassword', text)}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            leftIcon={<Text>🔒</Text>}
          />

          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <Button
            title="Kayıt Ol"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            fullWidth
            size="large"
          />
        </View>

        <Spacer size="lg" />

        {/* Terms */}
        <Text style={styles.termsText}>
          Kayıt olarak{' '}
          <Text style={styles.termsLink}>Kullanım Şartları</Text>
          {' '}ve{' '}
          <Text style={styles.termsLink}>Gizlilik Politikası</Text>
          'nı kabul etmiş olursunuz
        </Text>

        <Spacer size="xl" />

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
            <Text style={styles.loginLink}>Giriş Yap</Text>
          </TouchableOpacity>
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
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    textAlign: 'center',
  },
  termsText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  loginLink: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
  },
});