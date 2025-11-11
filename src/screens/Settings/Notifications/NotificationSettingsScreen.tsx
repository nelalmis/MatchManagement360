// src/screens/Settings/Notifications/NotificationSettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Moon,
  Volume2,
  ChevronRight,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsItem } from '../components/SettingsItem';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { DEFAULT_USER_SETTINGS, IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';
import { LoadingScreen } from '../..';

export const NotificationSettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
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

  const handleToggleNotifications = async (value: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateNotifications(user.id, {
        enabled: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);

        if (!value) {
          Alert.alert(
            'Bildirimler Kapatıldı',
            'Tüm bildirimler devre dışı bırakıldı. Önemli güncellemeleri kaçırabilirsiniz.'
          );
        }
      } else {
        Alert.alert('Hata', 'Bildirim ayarları güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle notifications error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSetFrequency = () => {
    if (!settings?.notifications.enabled) {
      Alert.alert('Uyarı', 'Önce bildirimleri aktif etmelisiniz');
      return;
    }

    Alert.alert(
      'Bildirim Sıklığı',
      'Bildirimler ne sıklıkla gönderilsin?',
      [
        {
          text: 'Hemen',
          onPress: () => updateFrequency('immediate'),
        },
        {
          text: 'Saatlik',
          onPress: () => updateFrequency('hourly'),
        },
        {
          text: 'Günlük',
          onPress: () => updateFrequency('daily'),
        },
        {
          text: 'Haftalık',
          onPress: () => updateFrequency('weekly'),
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const updateFrequency = async (
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never'
  ) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateNotifications(user.id, {
        frequency,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Bildirim sıklığı güncellendi');
      }
    } catch (error) {
      console.error('Update frequency error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAll = () => {
    Alert.alert(
      'Tüm Bildirimleri Kapat',
      'Email, Push, SMS ve Uygulama içi bildirimler kapatılacak. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            setSaving(true);
            try {
              const result = await UserSettingsService.disableAllNotifications(user.id);

              if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Tüm bildirimler kapatıldı');
              } else {
                Alert.alert('Hata', 'Bildirimler kapatılamadı');
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

  const handleEnableAll = async () => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      // Enable main toggle and all channels
      const result = await UserSettingsService.updateNotifications(user.id, {
        enabled: true,
        email: {
          ...settings.notifications.email,
          enabled: true,
        },
        push: {
          ...settings.notifications.push,
          enabled: true,
        },
        sms: {
          ...settings.notifications.sms,
          enabled: true,
        },
        inApp: {
          ...settings.notifications.inApp,
          enabled: true,
        },
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Tüm bildirimler açıldı');
      } else {
        Alert.alert('Hata', 'Bildirimler açılamadı');
      }
    } catch (error) {
      console.error('Enable all error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const getFrequencyText = (frequency: string) => {
    switch (frequency) {
      case 'immediate':
        return 'Hemen';
      case 'hourly':
        return 'Saatlik';
      case 'daily':
        return 'Günlük';
      case 'weekly':
        return 'Haftalık';
      case 'never':
        return 'Asla';
      default:
        return 'Hemen';
    }
  };

  const renderHeader = () => (
    <CustomHeader
      title="Bildirimler"
      showBack={true}
      onLeftPress={() => goBack()}
    />
  );

  if (loading) {
    return <LoadingScreen header={renderHeader()} />;
  }

  if (!settings) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  const notificationsEnabled = settings.notifications.enabled;

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Toggle */}
        <SettingsSection
          title="Genel"
          footer="Tüm bildirimleri tek seferde açıp kapatabilirsiniz"
        >
          <SettingsToggle
            title="Bildirimleri Aktif Et"
            subtitle={
              notificationsEnabled
                ? 'Bildirimler açık'
                : 'Bildirimler kapalı'
            }
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            disabled={saving}
          />
        </SettingsSection>

        {/* Notification Frequency */}
        {notificationsEnabled && (
          <SettingsSection
            title="Bildirim Sıklığı"
            footer="Bildirimlerin ne sıklıkla gönderileceğini belirleyin"
          >
            <SettingsItem
              icon={<Bell size={22} color="#3B82F6" strokeWidth={2} />}
              title="Bildirim Sıklığı"
              subtitle="Bildirimler ne sıklıkla gönderilsin?"
              value={getFrequencyText(settings.notifications.frequency)}
              onPress={handleSetFrequency}
              showChevron={true}
            />
          </SettingsSection>
        )}

        {/* Notification Channels */}
        <SettingsSection
          title="Bildirim Kanalları"
          footer="Hangi kanallardan bildirim almak istediğinizi seçin"
        >
          <SettingsItem
            icon={<Mail size={22} color="#EF4444" strokeWidth={2} />}
            title="Email Bildirimleri"
            subtitle={
              settings.notifications.email.enabled
                ? 'Açık'
                : 'Kapalı'
            }
            value={
              settings.notifications.email.enabled
                ? 'Açık'
                : 'Kapalı'
            }
            onPress={() =>
              // NavigationService.navigate('EmailNotifications' as never)
              console.log('Navigate to Email Notifications')
            }
            showChevron={true}
            disabled={!notificationsEnabled}
          />

          <SettingsItem
            icon={<Smartphone size={22} color="#10B981" strokeWidth={2} />}
            title="Push Bildirimleri"
            subtitle={
              settings.notifications.push.enabled
                ? 'Açık'
                : 'Kapalı'
            }
            value={
              settings.notifications.push.enabled
                ? 'Açık'
                : 'Kapalı'
            }
            onPress={() =>
              // NavigationService.navigate('PushNotifications' as never)
              console.log('Navigate to Push Notifications')
            }
            showChevron={true}
            disabled={!notificationsEnabled}
          />

          <SettingsItem
            icon={<MessageSquare size={22} color="#8B5CF6" strokeWidth={2} />}
            title="SMS Bildirimleri"
            subtitle={
              settings.notifications.sms.enabled
                ? 'Açık'
                : 'Kapalı'
            }
            value={
              settings.notifications.sms.enabled
                ? 'Açık'
                : 'Kapalı'
            }
            onPress={() =>
              // NavigationService.navigate('SmsNotifications' as never)
              console.log('Navigate to SMS Notifications')
            }
            showChevron={true}
            disabled={!notificationsEnabled}
          />

          <SettingsItem
            icon={<Bell size={22} color="#F59E0B" strokeWidth={2} />}
            title="Uygulama İçi Bildirimler"
            subtitle={
              settings.notifications.inApp.enabled
                ? 'Açık'
                : 'Kapalı'
            }
            value={
              settings.notifications.inApp.enabled
                ? 'Açık'
                : 'Kapalı'
            }
            onPress={() =>
              // NavigationService.navigate('InAppNotifications' as never)
              console.log('Navigate to In-App Notifications')
            }
            showChevron={true}
            disabled={!notificationsEnabled}
          />
        </SettingsSection>

        {/* Quiet Hours */}
        {notificationsEnabled && (
          <SettingsSection
            title="Sessiz Saatler"
            footer="Belirtilen saatlerde bildirim almayın"
          >
            <SettingsItem
              icon={<Moon size={22} color="#6B7280" strokeWidth={2} />}
              title="Sessiz Saatler"
              subtitle={
                settings.notifications.quietHours?.enabled
                  ? `${settings.notifications.quietHours.start} - ${settings.notifications.quietHours.end}`
                  : 'Kapalı'
              }
              value={
                settings.notifications.quietHours?.enabled
                  ? 'Aktif'
                  : 'Kapalı'
              }
              onPress={() =>
                // NavigationService.navigate('QuietHours' as never)
                console.log('Navigate to Quiet Hours Settings')
              }
              showChevron={true}
            />
          </SettingsSection>
        )}

        {/* Notification Summary */}
        {notificationsEnabled && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Bildirim Özeti</Text>
            <View style={styles.summaryContent}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Email</Text>
                <View
                  style={[
                    styles.summaryBadge,
                    settings.notifications.email?.enabled &&
                    styles.summaryBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryBadgeText,
                      settings.notifications.email?.enabled &&
                      styles.summaryBadgeTextActive,
                    ]}
                  >
                    {settings.notifications.email?.enabled
                      ? 'Açık'
                      : 'Kapalı'}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Push</Text>
                <View
                  style={[
                    styles.summaryBadge,
                    settings.notifications.push.enabled &&
                    styles.summaryBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryBadgeText,
                      settings.notifications.push.enabled &&
                      styles.summaryBadgeTextActive,
                    ]}
                  >
                    {settings.notifications.push.enabled
                      ? 'Açık'
                      : 'Kapalı'}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>SMS</Text>
                <View
                  style={[
                    styles.summaryBadge,
                    settings.notifications.sms.enabled &&
                    styles.summaryBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryBadgeText,
                      settings.notifications.sms.enabled &&
                      styles.summaryBadgeTextActive,
                    ]}
                  >
                    {settings.notifications.sms.enabled
                      ? 'Açık'
                      : 'Kapalı'}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Uygulama İçi</Text>
                <View
                  style={[
                    styles.summaryBadge,
                    settings.notifications.inApp.enabled &&
                    styles.summaryBadgeActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.summaryBadgeText,
                      settings.notifications.inApp.enabled &&
                      styles.summaryBadgeTextActive,
                    ]}
                  >
                    {settings.notifications.inApp.enabled
                      ? 'Açık'
                      : 'Kapalı'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <SettingsSection>
          {notificationsEnabled ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDisableAll}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Volume2 size={20} color="#EF4444" strokeWidth={2} />
              <Text style={styles.actionButtonText}>
                Tüm Bildirimleri Kapat
              </Text>
              {saving && (
                <ActivityIndicator size="small" color="#EF4444" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={handleEnableAll}
              activeOpacity={0.7}
              disabled={saving}
            >
              <Bell size={20} color="#16a34a" strokeWidth={2} />
              <Text
                style={[
                  styles.actionButtonText,
                  styles.actionButtonTextPrimary,
                ]}
              >
                Tüm Bildirimleri Aç
              </Text>
              {saving && (
                <ActivityIndicator size="small" color="#16a34a" />
              )}
            </TouchableOpacity>
          )}
        </SettingsSection>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 İpucu</Text>
          <Text style={styles.infoText}>
            Önemli bildirimleri kaçırmamak için en az bir bildirim kanalını
            aktif tutmanızı öneririz. Sessiz saatler özelliğini kullanarak
            belirli saatlerde bildirim almayı durdurabilirsiniz.
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },

  // Summary Card Styles
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 16,
  },
  summaryContent: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  summaryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  summaryBadgeActive: {
    backgroundColor: '#D1FAE5',
  },
  summaryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  summaryBadgeTextActive: {
    color: '#16a34a',
  },

  // Action Button Styles
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
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

  // Info Card Styles
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
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
});