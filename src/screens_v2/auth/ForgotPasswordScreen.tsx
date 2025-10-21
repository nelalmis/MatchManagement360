// src/screens/auth/ForgotPasswordScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Screen, Container, Input, Button, Spacer, Header } from '../../components';
import { useAuth } from '../../hooks';
import { colors, typography, spacing } from '../../config/theme';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { resetPassword, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Invalid email format');
      return;
    }

    setError('');

    // Send reset email
    const result = await resetPassword(email.trim().toLowerCase());

    if (result.success) {
      setEmailSent(true);
    } else {
      Alert.alert('Error', result.error || 'Failed to send reset email');
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Success state
  if (emailSent) {
    return (
      <Screen backgroundColor={colors.background.default}>
        <Header
          title="Password Reset"
          showBackButton
          onBackPress={handleBackToLogin}
        />
        <Container padding="large" center flex>
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>Email Sent!</Text>
            <Text style={styles.successMessage}>
              We've sent a password reset link to:
            </Text>
            <Text style={styles.email}>{email}</Text>
            <Text style={styles.successInstructions}>
              Please check your email and click the link to reset your password.
            </Text>

            <Spacer size="xl" />

            <Button
              title="Back to Login"
              onPress={handleBackToLogin}
              fullWidth
            />

            <Spacer size="md" />

            <Button
              title="Resend Email"
              onPress={() => {
                setEmailSent(false);
                handleResetPassword();
              }}
              variant="ghost"
              fullWidth
            />
          </View>
        </Container>
      </Screen>
    );
  }

  // Input state
  return (
    <Screen scroll keyboardAvoiding backgroundColor={colors.background.default}>
      <Header
        title="Forgot Password"
        showBackButton
        onBackPress={handleBackToLogin}
      />
      <Container padding="large" style={styles.container}>
        {/* Icon & Title */}
        <View style={styles.header}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Reset Your Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your password
          </Text>
        </View>

        <Spacer size="2xl" />

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoFocus
            leftIcon={<Text>📧</Text>}
            error={error}
          />

          <Spacer size="lg" />

          <Button
            title="Send Reset Link"
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading}
            fullWidth
            size="large"
          />

          <Spacer size="md" />

          <Button
            title="Back to Login"
            onPress={handleBackToLogin}
            variant="ghost"
            fullWidth
          />
        </View>

        <Spacer size="2xl" />

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>💡 Didn't receive the email?</Text>
          <Text style={styles.helpText}>
            • Check your spam/junk folder{'\n'}
            • Make sure the email is correct{'\n'}
            • Wait a few minutes and try again
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
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  helpContainer: {
    backgroundColor: colors.background.paper,
    padding: spacing.lg,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  helpTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  successIcon: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  successTitle: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successMessage: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  email: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.main,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  successInstructions: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});