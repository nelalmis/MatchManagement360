// src/components/ui/Avatar.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, borderRadius } from '../../config/theme';

interface AvatarProps {
  imageUrl?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  backgroundColor?: string;
}

export default function Avatar({
  imageUrl,
  name,
  size = 'medium',
  style,
  backgroundColor,
}: AvatarProps) {
  const getInitials = (name?: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const containerStyle = [
    styles.container,
    styles[size],
    backgroundColor && { backgroundColor },
    style,
  ];

  if (imageUrl) {
    return (
      <View style={containerStyle}>
        <Image source={{ uri: imageUrl }} style={styles.image} />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text style={[styles.initials, styles[`${size}Text`]]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary.light,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  // Sizes
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 48,
    height: 48,
  },
  large: {
    width: 64,
    height: 64,
  },
  xlarge: {
    width: 96,
    height: 96,
  },

  // Text
  initials: {
    fontFamily: typography.fontFamily.bold,
    color: colors.primary.dark,
  },
  smallText: {
    fontSize: typography.fontSize.xs,
  },
  mediumText: {
    fontSize: typography.fontSize.base,
  },
  largeText: {
    fontSize: typography.fontSize.xl,
  },
  xlargeText: {
    fontSize: typography.fontSize['2xl'],
  },
});