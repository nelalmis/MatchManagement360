// src/screens/auth/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { Screen, Container, Input, Button, Spacer, Divider } from '../../components';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { colors, typography, spacing } from '../../config/theme';
import type { AppDispatch } from '../../store';

export default function LoginScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const { loading, error } = useSelector((state: any) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      setLocalError('E-posta adresi gerekli');
      return;
    }

    if (!password) {
      setLocalError('Şifre gerekli');
      return;
    }

    if (!isValidEmail(email)) {
      setLocalError('Geçersiz e-posta formatı');
      return;
    }

    setLocalError('');

    try {
      // Dispatch login action
      const result = await dispatch(loginUser({ 
        email: email.trim().toLowerCase(), 
        password 
      }));

      if (loginUser.rejected.match(result)) {
        Alert.alert('Giriş Başarısız', result.payload as string || 'Lütfen tekrar deneyin');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert('Hata', 'Giriş yapılırken bir hata oluştu');
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  const handleSignUp = () => {
    navigation.navigate('Register' as never);
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const errorMessage = localError || error;

  return (
    <Screen scroll keyboardAvoiding backgroundColor={colors.background.default}>
      <Container padding="large" style={styles.container}>
        {/* Logo/Title */}
        <View style={styles.header}>
          <Text style={styles.logo}>⚽</Text>
          <Text style={styles.title}>Maç Yönetimi</Text>
          <Text style={styles.subtitle}>
            Liglerinizi ve maçlarınızı yönetin
          </Text>
        </View>

        <Spacer size="2xl" />

        {/* Login Form */}
        <View style={styles.form}>
          <Input
            label="E-posta"
            placeholder="E-posta adresinizi girin"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setLocalError('');
              dispatch(clearError());
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            leftIcon={<Text>📧</Text>}
            error={errorMessage && !email ? 'E-posta gerekli' : undefined}
          />

          <Input
            label="Şifre"
            placeholder="Şifrenizi girin"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setLocalError('');
              dispatch(clearError());
            }}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            leftIcon={<Text>🔒</Text>}
            error={errorMessage && !password ? 'Şifre gerekli' : undefined}
          />

          {errorMessage && email && password && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotButton}
          >
            <Text style={styles.forgotText}>Şifremi Unuttum?</Text>
          </TouchableOpacity>

          <Button
            title="Giriş Yap"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            fullWidth
            size="large"
          />
        </View>

        <Spacer size="xl" />

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text style={styles.dividerText}>VEYA</Text>
          <Divider style={styles.divider} />
        </View>

        <Spacer size="lg" />

        {/* Social Login (Coming Soon) */}
        <View style={styles.socialContainer}>
          <Button
            title="Google ile Devam Et"
            onPress={() => Alert.alert('Yakında', 'Google ile giriş özelliği yakında eklenecek')}
            variant="outline"
            fullWidth
            icon={<Text style={styles.socialIcon}>🔍</Text>}
            iconPosition="left"
            disabled={loading}
          />

          <Spacer size="md" />

          <Button
            title="Apple ile Devam Et"
            onPress={() => Alert.alert('Yakında', 'Apple ile giriş özelliği yakında eklenecek')}
            variant="outline"
            fullWidth
            icon={<Text style={styles.socialIcon}>🍎</Text>}
            iconPosition="left"
            disabled={loading}
          />
        </View>

        <Spacer size="2xl" />

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Hesabınız yok mu? </Text>
          <TouchableOpacity onPress={handleSignUp} disabled={loading}>
            <Text style={styles.signupLink}>Kayıt Ol</Text>
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
    fontSize: typography.fontSize['3xl'],
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    color: colors.primary.main,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  socialContainer: {
    width: '100%',
  },
  socialIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  signupLink: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
  },
});