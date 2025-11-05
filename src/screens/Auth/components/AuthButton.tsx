// src/components/auth/AuthButton.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, LucideIcon } from 'lucide-react-native';
import { commonColors, typography, spacing, borderRadius, shadows } from '../../../utils/theme';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  'arrow-forward': ArrowRight,
};

interface AuthButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'gradient';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  gradientColors?: readonly [string, string];
  fullWidth?: boolean;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  gradientColors,
  fullWidth = true,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return 40;
      case 'medium':
        return 48;
      case 'large':
        return 56;
      default:
        return 56;
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return typography.buttonSmall.fontSize;
      case 'medium':
        return typography.button.fontSize;
      case 'large':
        return typography.button.fontSize;
      default:
        return typography.button.fontSize;
    }
  };

  const renderContent = () => {
    const IconComponent = icon ? iconMap[icon] : null;
    const iconColor = variant === 'outline' ? commonColors.text.primary : commonColors.white;

    return (
      <View style={styles.contentContainer}>
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' ? commonColors.text.primary : commonColors.white}
            size="small"
          />
        ) : (
          <>
            {IconComponent && iconPosition === 'left' && (
              <View style={styles.iconLeft}>
                <IconComponent size={20} color={iconColor} />
              </View>
            )}
            <Text
              style={[
                styles.buttonText,
                { fontSize: getFontSize() },
                variant === 'outline' && styles.outlineText,
                variant === 'text' && styles.textButtonText,
                variant === 'secondary' && styles.secondaryText,
                isDisabled && styles.disabledText,
              ]}
            >
              {title}
            </Text>
            {IconComponent && iconPosition === 'right' && (
              <View style={styles.iconRight}>
                <IconComponent size={20} color={iconColor} />
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  if (variant === 'gradient' || (variant === 'primary' && gradientColors)) {
    const colors = gradientColors || ['#16a34a', '#15803d'];
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.container,
          { height: getButtonHeight() },
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
        ]}
        {...props}
      >
        <LinearGradient
          colors={colors} // ✅ Artık type casting'e gerek yok
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            { borderRadius: borderRadius.md },
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        { height: getButtonHeight() },
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'outline' && styles.outline,
        variant === 'text' && styles.textButton,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    backgroundColor: commonColors.info,
    ...shadows.md,
  },
  secondary: {
    backgroundColor: commonColors.background.secondary,
    borderWidth: 1,
    borderColor: commonColors.border.medium,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: commonColors.info,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonText: {
    fontWeight: typography.button.fontWeight,
    color: commonColors.white,
    textAlign: 'center',
  },
  outlineText: {
    color: commonColors.info,
  },
  secondaryText: {
    color: commonColors.text.primary,
  },
  textButtonText: {
    color: commonColors.info,
  },
  disabledText: {
    color: commonColors.text.disabled,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});