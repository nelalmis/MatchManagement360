// src/screens/Settings/components/SettingsToggle.tsx

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface SettingsToggleProps {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}) => {
  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
        thumbColor={value ? '#16a34a' : '#F3F4F6'}
        ios_backgroundColor="#D1D5DB"
      />
    </View>
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
  textContainer: {
    flex: 1,
    marginRight: 16,
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
});