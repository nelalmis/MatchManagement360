// src/screens/Common/LoadingScreen.tsx
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SportType } from '../../types/entity/types';
import { commonColors, sportThemes } from '../../utils/theme';

export function LoadingScreen({ header, visibleHeader = true, loadingText, sportType, color = commonColors.primary }:
  {
    header?: React.ReactNode;
    visibleHeader?: boolean;
    loadingText?: string;
    sportType?: SportType;
    color?: string;
  }) {

  return (
    <View style={styles.container}>
      {visibleHeader !== false && header}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={color || (sportType ? sportThemes[sportType].primary : "#16a34a")} />
        <Text style={styles.loadingText}>{loadingText || "Yükleniyor..."}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});