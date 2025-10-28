// src/components/auth/AuthInput.tsx
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  Animated,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LucideIcon } from 'lucide-react-native';
import { commonColors, typography, spacing, borderRadius, shadows } from '../../../utils/theme';

// Icon mapping for common use cases
const iconMap: Record<string, LucideIcon> = {
  'mail-outline': Mail,
  'lock-closed-outline': Lock,
  'eye-outline': Eye,
  'eye-off-outline': EyeOff,
  'alert-circle': AlertCircle,
};

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  helperText?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  helperText,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const animatedIsFocused = React.useRef(new Animated.Value(value ? 1 : 0)).current;

  // Get icon components
  const LeftIconComponent = icon ? iconMap[icon] : null;
  const RightIconComponent = rightIcon ? iconMap[rightIcon] : null;

  React.useEffect(() => {
    Animated.timing(animatedIsFocused, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  const labelStyle = {
    position: 'absolute' as const,
    left: icon ? 48 : spacing.md,
    top: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -8],
    }),
    fontSize: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: animatedIsFocused.interpolate({
      inputRange: [0, 1],
      outputRange: [
        error ? commonColors.error : commonColors.text.placeholder,
        error ? commonColors.error : isFocused ? commonColors.info : commonColors.text.secondary,
      ],
    }),
    backgroundColor: commonColors.white,
    paddingHorizontal: 4,
    zIndex: 1,
  };

  const iconColor = error
    ? commonColors.error
    : isFocused
    ? commonColors.info
    : commonColors.text.tertiary;

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        
        {LeftIconComponent && (
          <View style={styles.leftIconContainer}>
            <LeftIconComponent size={20} color={iconColor} />
          </View>
        )}

        <TextInput
          {...props}
          value={value}
          style={[
            styles.input,
            icon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            error && styles.inputError,
            isFocused && styles.inputFocused,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={commonColors.text.placeholder}
        />

        {RightIconComponent && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={onRightIconPress}
            activeOpacity={0.7}
          >
            <RightIconComponent size={20} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color={commonColors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!error && helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: commonColors.border.medium,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.body1.fontSize,
    color: commonColors.text.primary,
    backgroundColor: commonColors.white,
    ...shadows.sm,
  },
  inputWithLeftIcon: {
    paddingLeft: 48,
  },
  inputWithRightIcon: {
    paddingRight: 48,
  },
  inputFocused: {
    borderColor: commonColors.info,
    borderWidth: 2,
    ...shadows.md,
  },
  inputError: {
    borderColor: commonColors.error,
    borderWidth: 2,
  },
  leftIconContainer: {
    position: 'absolute',
    left: spacing.md,
    top: 18,
    zIndex: 2,
  },
  rightIconContainer: {
    position: 'absolute',
    right: spacing.md,
    top: 18,
    zIndex: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    fontSize: typography.caption.fontSize,
    color: commonColors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  helperText: {
    fontSize: typography.caption.fontSize,
    color: commonColors.text.tertiary,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
});