// src/components/layout/Spacer.tsx
import React from 'react';
import { View, ViewStyle } from 'react-native';
import { spacing as themeSpacing } from '../../config/theme';

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  horizontal?: boolean;
  style?: ViewStyle;
}

export default function Spacer({
  size = 'md',
  horizontal = false,
  style,
}: SpacerProps) {
  const spacerSize = themeSpacing[size];

  const spacerStyle: ViewStyle = horizontal
    ? { width: spacerSize }
    : { height: spacerSize };

  return <View style={[spacerStyle, style]} />;
}