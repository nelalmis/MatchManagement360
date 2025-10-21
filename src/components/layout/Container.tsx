// src/components/layout/Container.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../../config/theme';

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  center?: boolean;
  flex?: boolean;
}

export default function Container({
  children,
  style,
  padding = 'medium',
  center = false,
  flex = false,
}: ContainerProps) {
  const containerStyle = [
    flex && styles.flex,
    styles[`padding_${padding}`],
    center && styles.center,
    style,
  ];

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  padding_none: {
    padding: 0,
  },
  padding_small: {
    padding: spacing.sm,
  },
  padding_medium: {
    padding: spacing.md,
  },
  padding_large: {
    padding: spacing.lg,
  },
});