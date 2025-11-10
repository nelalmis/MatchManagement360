// src/screens/Settings/components/SettingsSection.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
  footer?: string;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  children,
  footer,
}) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
      {footer && <Text style={styles.footer}>{footer}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  footer: {
    fontSize: 13,
    color: '#6B7280',
    paddingHorizontal: 16,
    marginTop: 8,
    lineHeight: 18,
  },
});