// src/screens/Maintenance/MaintenanceScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAppConfig } from '../../hooks/useAppConfig';
import AppConfigService from '../../services/serviceLayer/appConfigService';

export const MaintenanceScreen = () => {
  const { config } = useAppConfig();

  const handleRefresh = async () => {
    console.log('🔄 Refreshing config...');
    await AppConfigService.refreshConfig();
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.icon}>🛠️</Text>
        <Text style={styles.title}>Bakım Çalışması</Text>
      </View>

      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>
          {config?.app?.maintenanceMessage || 
           'Sistemimiz daha iyi hizmet verebilmek için güncelleniyor. Lütfen kısa bir süre sonra tekrar deneyin.'}
        </Text>
      </View>

      {/* Info Cards */}
      <View style={styles.infoCards}>
        {config?.app?.version && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Versiyon</Text>
            <Text style={styles.infoCardValue}>{config.app.version}</Text>
          </View>
        )}

        {config?.app?.environment && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>Ortam</Text>
            <Text style={styles.infoCardValue}>
              {config.app.environment === 'production' ? 'Üretim' : 'Geliştirme'}
            </Text>
          </View>
        )}
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Sistem bakımda</Text>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={handleRefresh}
        activeOpacity={0.7}
      >
        <Text style={styles.refreshButtonText}>🔄 Durumu Kontrol Et</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Bakım tamamlandığında otomatik olarak açılacaksınız.
        </Text>
        {config?.contact?.supportEmail && (
          <Text style={styles.supportText}>
            Acil durumlar için: {config.contact.supportEmail}
          </Text>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FDE68A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    fontSize: 16,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: '#FBBF24',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoCardValue: {
    fontSize: 16,
    color: '#78350F',
    fontWeight: '700',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  refreshButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 32,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 2,
    borderTopColor: '#FDE68A',
  },
  footerText: {
    fontSize: 13,
    color: '#78350F',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  supportText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
});