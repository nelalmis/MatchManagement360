// src/components/auth/SocialLoginButtons.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Chrome, Apple as AppleIcon, Facebook } from 'lucide-react-native';
import { commonColors, typography, spacing, borderRadius, shadows } from '../../../utils/theme';

interface SocialLoginButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  onFacebookPress?: () => void;
  loading?: boolean;
}

export const SocialLoginButtons: React.FC<SocialLoginButtonsProps> = ({
  onGooglePress,
  onApplePress,
  onFacebookPress,
  loading = false,
}) => {
  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>veya</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Social Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Google */}
        <TouchableOpacity
          style={styles.socialButton}
          onPress={onGooglePress}
          disabled={loading}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Chrome size={24} color="#DB4437" />
          </View>
          <Text style={styles.buttonText}>Google</Text>
        </TouchableOpacity>

        {/* Apple - Only on iOS */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={onApplePress}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <AppleIcon size={24} color="#000000" />
            </View>
            <Text style={styles.buttonText}>Apple</Text>
          </TouchableOpacity>
        )}

        {/* Facebook - Optional */}
        {onFacebookPress && (
          <TouchableOpacity
            style={styles.socialButton}
            onPress={onFacebookPress}
            disabled={loading}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Facebook size={24} color="#1877F2" />
            </View>
            <Text style={styles.buttonText}>Facebook</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Privacy Text */}
      <Text style={styles.privacyText}>
        Sosyal medya ile giriş yaparak{' '}
        <Text style={styles.privacyLink}>Kullanım Koşulları</Text> ve{' '}
        <Text style={styles.privacyLink}>Gizlilik Politikası</Text>'nı kabul etmiş olursunuz.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: commonColors.border.medium,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.body2.fontSize,
    color: commonColors.text.tertiary,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  socialButton: {
    flex: 1,
    height: 56,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: commonColors.border.medium,
    backgroundColor: commonColors.white,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  iconContainer: {
    marginBottom: spacing.xs,
  },
  buttonText: {
    fontSize: typography.caption.fontSize,
    color: commonColors.text.secondary,
    fontWeight: '500',
  },
  privacyText: {
    fontSize: typography.caption.fontSize,
    color: commonColors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
    paddingHorizontal: spacing.md,
  },
  privacyLink: {
    color: commonColors.info,
    fontWeight: '600',
  },
});