// src/screens/Settings/Notifications/PushNotificationsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Smartphone, Settings as SettingsIcon, AlertCircle } from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import * as Notifications from 'expo-notifications';
import { goBack } from '../../../navigation';

export const PushNotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [systemPermission, setSystemPermission] = useState<boolean | null>(null);

  useEffect(() => {
    loadSettings();
    checkSystemPermission();
  }, []);

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await UserSettingsService.getUserSettings(user.id);

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayarlar yüklenemedi');
      }
    } catch (error) {
      console.error('Settings load error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const checkSystemPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setSystemPermission(status === 'granted');
    } catch (error) {
      console.error('Check permission error:', error);
      setSystemPermission(null);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        setSystemPermission(true);
        Alert.alert('Başarılı', 'Push bildirim izni verildi');
      } else {
        setSystemPermission(false);
        Alert.alert(
          'İzin Reddedildi',
          'Push bildirimleri için sistem ayarlarından izin vermeniz gerekiyor.',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Ayarları Aç',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Request permission error:', error);
      Alert.alert('Hata', 'İzin isteği başarısız oldu');
    }
  };

  const handleTogglePushEnabled = async (value: boolean) => {
    if (!user?.id || !settings) return;

    // Check if main notifications are enabled
    if (!settings.notifications.enabled && value) {
      Alert.alert(
        'Bildirimler Kapalı',
        'Push bildirimleri için önce ana bildirim ayarını açmalısınız.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Ayarlara Git',
            onPress: () => goBack(),
          },
        ]
      );
      return;
    }

    // Check system permission
    if (value && systemPermission === false) {
      Alert.alert(
        'Sistem İzni Gerekli',
        'Push bildirimleri için sistem ayarlarından izin vermeniz gerekiyor.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'İzin Ver',
            onPress: handleRequestPermission,
          },
        ]
      );
      return;
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePushNotifications(user.id, {
        enabled: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        
        if (!value) {
          Alert.alert(
            'Push Bildirimleri Kapatıldı',
            'Artık push bildirimi almayacaksınız.'
          );
        }
      } else {
        Alert.alert('Hata', 'Push bildirimleri güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle push error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (
    key: keyof IUserSettings['notifications']['push'],
    value: boolean
  ) => {
    if (!user?.id || !settings) return;

    // Check if push notifications are enabled
    if (!settings.notifications.push.enabled && value) {
      Alert.alert(
        'Push Bildirimleri Kapalı',
        'Bu bildirimi açmak için önce push bildirimlerini aktif etmelisiniz.'
      );
      return;
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePushNotifications(user.id, {
        [key]: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle setting error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAll = async () => {
    if (!user?.id || !settings) return;

    // Check system permission first
    if (systemPermission === false) {
      Alert.alert(
        'Sistem İzni Gerekli',
        'Önce sistem ayarlarından push bildirimi izni vermelisiniz.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'İzin Ver',
            onPress: handleRequestPermission,
          },
        ]
      );
      return;
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePushNotifications(user.id, {
        enabled: true,
        matchInvitations: true,
        matchReminders: true,
        matchCancellations: true,
        matchStartingSoon: true,
        teamAssignments: true,
        paymentReminders: true,
        paymentReceived: true,
        ratingRequests: true,
        ratingReceived: true,
        mvpAnnouncements: true,
        friendRequests: true,
        comments: true,
        mentions: true,
        chatMessages: true,
        achievementUnlocked: true,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Tüm push bildirimleri açıldı');
      } else {
        Alert.alert('Hata', 'Ayarlar güncellenemedi');
      }
    } catch (error) {
      console.error('Enable all error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAll = () => {
    Alert.alert(
      'Tüm Push Bildirimlerini Kapat',
      'Tüm push bildirimleri kapatılacak. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id || !settings) return;

            setSaving(true);
            try {
              const result = await UserSettingsService.updatePushNotifications(
                user.id,
                {
                  enabled: false,
                }
              );

              if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Tüm push bildirimleri kapatıldı');
              } else {
                Alert.alert('Hata', 'Ayarlar güncellenemedi');
              }
            } catch (error) {
              console.error('Disable all error:', error);
              Alert.alert('Hata', 'Bir hata oluştu');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenSystemSettings = () => {
    Alert.alert(
      'Sistem Ayarları',
      'Push bildirim izinlerini değiştirmek için sistem ayarlarını açın.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ayarları Aç',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Linking.openURL('app-settings:');
            } else {
              Linking.openSettings();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Push Bildirimleri"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Push Bildirimleri"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  const pushEnabled = settings.notifications.enabled && settings.notifications.push.enabled;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Push Bildirimleri"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System Permission Warning */}
        {systemPermission === false && (
          <View style={styles.warningCard}>
            <View style={styles.warningIconContainer}>
              <AlertCircle size={24} color="#EF4444" strokeWidth={2} />
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Sistem İzni Gerekli</Text>
              <Text style={styles.warningText}>
                Push bildirimleri çalışmıyor. Sistem ayarlarından uygulama için
                bildirim izni vermelisiniz.
              </Text>
              <Text
                style={styles.warningLink}
                onPress={handleOpenSystemSettings}
              >
                Ayarları Aç →
              </Text>
            </View>
          </View>
        )}

        {/* System Permission Info */}
        <View style={styles.permissionCard}>
          <View style={styles.permissionHeader}>
            <Smartphone size={20} color="#10B981" strokeWidth={2} />
            <Text style={styles.permissionTitle}>Sistem İzin Durumu</Text>
          </View>
          <View style={styles.permissionContent}>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>Platform</Text>
              <Text style={styles.permissionValue}>
                {Platform.OS === 'ios' ? 'iOS' : 'Android'}
              </Text>
            </View>
            <View style={styles.permissionRow}>
              <Text style={styles.permissionLabel}>İzin Durumu</Text>
              <View
                style={[
                  styles.permissionBadge,
                  systemPermission && styles.permissionBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.permissionBadgeText,
                    systemPermission && styles.permissionBadgeTextActive,
                  ]}
                >
                  {systemPermission === null
                    ? 'Kontrol Ediliyor...'
                    : systemPermission
                    ? 'Verildi'
                    : 'Verilmedi'}
                </Text>
              </View>
            </View>
          </View>
          {systemPermission === false && (
            <Text
              style={styles.permissionAction}
              onPress={handleRequestPermission}
            >
              İzin İste
            </Text>
          )}
        </View>

        {/* Master Toggle */}
        <SettingsSection
          title="Genel"
          footer="Push bildirimlerini tamamen açıp kapatabilirsiniz"
        >
          <SettingsToggle
            title="Push Bildirimlerini Aktif Et"
            subtitle={
              pushEnabled
                ? 'Push bildirimleri açık'
                : 'Push bildirimleri kapalı'
            }
            value={settings.notifications.push.enabled}
            onValueChange={handleTogglePushEnabled}
            disabled={saving || !settings.notifications.enabled || systemPermission === false}
          />
        </SettingsSection>

        {/* Match Related */}
        <SettingsSection
          title="Maç Bildirimleri"
          footer="Maçlarla ilgili push bildirimleri"
        >
          <SettingsToggle
            title="Maç Davetleri"
            subtitle="Yeni maç davetleri için bildirim"
            value={settings.notifications.push.matchInvitations}
            onValueChange={(value) =>
              handleToggleSetting('matchInvitations', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Maç Hatırlatıcıları"
            subtitle="Yaklaşan maçlar için hatırlatma"
            value={settings.notifications.push.matchReminders}
            onValueChange={(value) =>
              handleToggleSetting('matchReminders', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Maç İptalleri"
            subtitle="İptal edilen maçlar için bildirim"
            value={settings.notifications.push.matchCancellations}
            onValueChange={(value) =>
              handleToggleSetting('matchCancellations', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Maç Yakında Başlıyor"
            subtitle="Maç 30 dakika önce hatırlatma"
            value={settings.notifications.push.matchStartingSoon}
            onValueChange={(value) =>
              handleToggleSetting('matchStartingSoon', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Takım Atamaları"
            subtitle="Takıma atandığınızda bildirim"
            value={settings.notifications.push.teamAssignments}
            onValueChange={(value) =>
              handleToggleSetting('teamAssignments', value)
            }
            disabled={saving || !pushEnabled}
          />
        </SettingsSection>

        {/* Payment Related */}
        <SettingsSection
          title="Ödeme Bildirimleri"
          footer="Ödemelerle ilgili push bildirimleri"
        >
          <SettingsToggle
            title="Ödeme Hatırlatıcıları"
            subtitle="Ödeme yapmanız gerektiğinde"
            value={settings.notifications.push.paymentReminders}
            onValueChange={(value) =>
              handleToggleSetting('paymentReminders', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Ödeme Alındı"
            subtitle="Ödemeniz onaylandığında"
            value={settings.notifications.push.paymentReceived}
            onValueChange={(value) =>
              handleToggleSetting('paymentReceived', value)
            }
            disabled={saving || !pushEnabled}
          />
        </SettingsSection>

        {/* Rating & Performance */}
        <SettingsSection
          title="Değerlendirme & Performans"
          footer="Rating ve performansla ilgili bildirimler"
        >
          <SettingsToggle
            title="Değerlendirme İstekleri"
            subtitle="Oyuncuları değerlendirme istekleri"
            value={settings.notifications.push.ratingRequests}
            onValueChange={(value) =>
              handleToggleSetting('ratingRequests', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Değerlendirme Alındı"
            subtitle="Size verilen yeni değerlendirmeler"
            value={settings.notifications.push.ratingReceived}
            onValueChange={(value) =>
              handleToggleSetting('ratingReceived', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="MVP Duyuruları"
            subtitle="MVP seçildiğinizde bildirim"
            value={settings.notifications.push.mvpAnnouncements}
            onValueChange={(value) =>
              handleToggleSetting('mvpAnnouncements', value)
            }
            disabled={saving || !pushEnabled}
          />
        </SettingsSection>

        {/* Social */}
        <SettingsSection
          title="Sosyal"
          footer="Sosyal etkileşimlerle ilgili bildirimler"
        >
          <SettingsToggle
            title="Arkadaşlık İstekleri"
            subtitle="Yeni arkadaşlık istekleri"
            value={settings.notifications.push.friendRequests}
            onValueChange={(value) =>
              handleToggleSetting('friendRequests', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Yorumlar"
            subtitle="Yorumlarınıza yanıt verildiğinde"
            value={settings.notifications.push.comments}
            onValueChange={(value) =>
              handleToggleSetting('comments', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Etiketlenmeler"
            subtitle="Bir yorumda @etiketlendiğinizde"
            value={settings.notifications.push.mentions}
            onValueChange={(value) =>
              handleToggleSetting('mentions', value)
            }
            disabled={saving || !pushEnabled}
          />

          <SettingsToggle
            title="Sohbet Mesajları"
            subtitle="Yeni sohbet mesajları"
            value={settings.notifications.push.chatMessages}
            onValueChange={(value) =>
              handleToggleSetting('chatMessages', value)
            }
            disabled={saving || !pushEnabled}
          />
        </SettingsSection>

        {/* Achievements */}
        <SettingsSection
          title="Başarılar"
          footer="Başarı ve rozet bildirimleri"
        >
          <SettingsToggle
            title="Başarı Kazanıldı"
            subtitle="Yeni bir başarı kazandığınızda"
            value={settings.notifications.push.achievementUnlocked}
            onValueChange={(value) =>
              handleToggleSetting('achievementUnlocked', value)
            }
            disabled={saving || !pushEnabled}
          />
        </SettingsSection>

        {/* Quick Actions */}
        <SettingsSection>
          {pushEnabled ? (
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Hızlı İşlemler</Text>
              <View style={styles.actionsButtons}>
                <View style={styles.actionButton}>
                  <Text
                    style={styles.actionButtonText}
                    onPress={handleDisableAll}
                  >
                    Tümünü Kapat
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Hızlı İşlemler</Text>
              <View style={styles.actionsButtons}>
                <View style={[styles.actionButton, styles.actionButtonPrimary]}>
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.actionButtonTextPrimary,
                    ]}
                    onPress={handleEnableAll}
                  >
                    Tümünü Aç
                  </Text>
                </View>
              </View>
            </View>
          )}
        </SettingsSection>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Özet</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Toplam bildirim türü</Text>
              <Text style={styles.summaryValue}>15</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Aktif bildirimler</Text>
              <Text style={styles.summaryValue}>
                {Object.values(settings.notifications.push).filter(
                  (v) => v === true
                ).length}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Bilgi</Text>
          <Text style={styles.infoText}>
            Push bildirimleri, telefon ekranınızda anlık olarak görünür.
            Sessiz saatler özelliğini kullanarak belirli saatlerde bildirim
            almayı durdurabilirsiniz.
          </Text>
        </View>

        {/* System Settings Link */}
        <View style={styles.systemCard}>
          <SettingsIcon size={20} color="#6B7280" strokeWidth={2} />
          <Text style={styles.systemText}>
            Push bildirim ayarlarını değiştirmek için sistem ayarlarına gidin
          </Text>
          <Text style={styles.systemLink} onPress={handleOpenSystemSettings}>
            Sistem Ayarları →
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  warningIconContainer: {
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#991B1B',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#991B1B',
    lineHeight: 20,
    marginBottom: 8,
  },
  warningLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Permission Card
  permissionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  permissionContent: {
    gap: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permissionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  permissionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  permissionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
  },
  permissionBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  permissionBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  permissionBadgeTextActive: {
    color: '#16a34a',
  },
  permissionAction: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    textAlign: 'center',
  },

  // Actions
  actionsContainer: {
    padding: 16,
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#D1FAE5',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  actionButtonTextPrimary: {
    color: '#16a34a',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // System Card
  systemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  systemText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  systemLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
});