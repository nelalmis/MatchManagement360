// src/components/layout/Divider.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing } from '../../config/theme';

interface DividerProps {
  style?: ViewStyle;
  color?: string;
  thickness?: number;
  spacing?: 'none' | 'small' | 'medium' | 'large';
  orientation?: 'horizontal' | 'vertical';
}

export default function Divider({
  style,
  color = colors.border.light,
  thickness = 1,
  spacing: spacingProp = 'medium',
  orientation = 'horizontal',
}: DividerProps) {
  const dividerStyle = [
    orientation === 'horizontal' ? styles.horizontal : styles.vertical,
    orientation === 'horizontal'
      ? { height: thickness, backgroundColor: color }
      : { width: thickness, backgroundColor: color },
    styles[`spacing_${spacingProp}`],
    style,
  ];

  return <View style={dividerStyle} />;
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
  },
  spacing_none: {
    marginVertical: 0,
  },
  spacing_small: {
    marginVertical: spacing.xs,
  },
  spacing_medium: {
    marginVertical: spacing.sm,
  },
  spacing_large: {
    marginVertical: spacing.md,
  },
});