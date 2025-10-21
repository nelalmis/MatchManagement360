// src/components/layout/FAB.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, borderRadius, shadows } from '../../config/theme';

interface FABProps {
  icon: string;
  onPress: () => void;
  style?: ViewStyle;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  size?: 'small' | 'medium' | 'large';
  backgroundColor?: string;
}

export default function FAB({
  icon,
  onPress,
  style,
  position = 'bottom-right',
  size = 'medium',
  backgroundColor = colors.primary.main,
}: FABProps) {
  return (
    <TouchableOpacity
      style={[
        styles.fab,
        styles[position],
        styles[size],
        { backgroundColor },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.icon, styles[`${size}Icon`]]}>{icon}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    ...shadows.lg,
  },

  // Positions
  'bottom-right': {
    bottom: spacing['2xl'],
    right: spacing.lg,
  },
  'bottom-left': {
    bottom: spacing['2xl'],
    left: spacing.lg,
  },
  'bottom-center': {
    bottom: spacing['2xl'],
    alignSelf: 'center',
  },

  // Sizes
  small: {
    width: 48,
    height: 48,
  },
  medium: {
    width: 56,
    height: 56,
  },
  large: {
    width: 64,
    height: 64,
  },

  // Icon
  icon: {
    color: colors.primary.contrast,
  },
  smallIcon: {
    fontSize: 20,
  },
  mediumIcon: {
    fontSize: 24,
  },
  largeIcon: {
    fontSize: 28,
  },
});



/* 

import { Screen, Header, ListItem, FAB } from '../components';

export default function ListScreen() {
  return (
    <Screen>
      <Header title="List" />
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <ListItem
            title={item.title}
            subtitle={item.subtitle}
            onPress={() => {}}
            leftIcon={<Text>🏆</Text>}
            rightIcon={<Text>→</Text>}
          />
        )}
      />
      <FAB icon="+" onPress={handleCreate} />
    </Screen>
  );
}
*/