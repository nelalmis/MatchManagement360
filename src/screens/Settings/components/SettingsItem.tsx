// src/screens/Settings/components/SettingsItem.tsx

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

interface SettingsItemProps {
  icon?: React.ReactNode;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  rightComponent?: React.ReactNode;
  disabled?: boolean;
  badge?: number;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  iconColor = '#16a34a',
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
  rightComponent,
  disabled = false,
  badge,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.rightContent}>
        {value && <Text style={styles.value}>{value}</Text>}
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        {rightComponent}
        {showChevron && onPress && (
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  disabled: {
    opacity: 0.5,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
});