// src/screens/Settings/Calendar/CalendarSyncScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Smartphone,
  Cloud,
  Download,
  Upload,
  Settings as SettingsIcon,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { SettingsItem } from '../components/SettingsItem';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import * as RNCalendar from 'expo-calendar';
import { goBack } from '../../../navigation';
import { LoadingScreen } from '../..';

type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'manual';
type ConflictResolution = 'app' | 'calendar' | 'ask';

interface CalendarPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

const SYNC_FREQUENCY_OPTIONS: {
  value: SyncFrequency;
  label: string;
  description: string;
}[] = [
    {
      value: 'realtime',
      label: 'Gerçek Zamanlı',
      description: 'Hemen senkronize et',
    },
    {
      value: 'hourly',
      label: 'Saatlik',
      description: 'Her saat başı',
    },
    {
      value: 'daily',
      label: 'Günlük',
      description: 'Günde bir kez',
    },
    {
      value: 'manual',
      label: 'Manuel',
      description: 'Sadece elle senkronize et',
    },
  ];

const CONFLICT_RESOLUTION_OPTIONS: {
  value: ConflictResolution;
  label: string;
  description: string;
}[] = [
    {
      value: 'app',
      label: 'Uygulama Öncelikli',
      description: 'Uygulama değişiklikleri öncelikli',
    },
    {
      value: 'calendar',
      label: 'Takvim Öncelikli',
      description: 'Cihaz takvimi öncelikli',
    },
    {
      value: 'ask',
      label: 'Her Seferinde Sor',
      description: 'Çakışmalarda kullanıcıya sor',
    },
  ];

export const CalendarSyncScreen: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<CalendarPermissionStatus>({
    granted: false,
    canAskAgain: true,
  });
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    loadSettings();
    checkCalendarPermission();
  }, []);

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await UserSettingsService.getUserSettings(user.id);

      if (result.success && result.data) {
        setSettings(result.data);

        if (result.data.calendar.lastSyncedAt) {
          setLastSyncTime(new Date(result.data.calendar.lastSyncedAt));
        }
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

  const checkCalendarPermission = async () => {
    try {
      const { status, canAskAgain } = await RNCalendar.getCalendarPermissionsAsync();
      setPermissionStatus({
        granted: status === 'granted',
        canAskAgain,
      });
    } catch (error) {
      console.error('Check calendar permission error:', error);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const { status, canAskAgain } = await RNCalendar.requestCalendarPermissionsAsync();

      setPermissionStatus({
        granted: status === 'granted',
        canAskAgain,
      });

      if (status === 'granted') {
        Alert.alert('Başarılı', 'Takvim erişim izni verildi');
      } else {
        Alert.alert(
          'İzin Reddedildi',
          'Takvim senkronizasyonu için sistem ayarlarından izin vermeniz gerekiyor.',
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

  const handleToggleSyncEnabled = async (value: boolean) => {
    if (!user?.id || !settings) return;

    // Check permission first
    if (value && !permissionStatus.granted) {
      Alert.alert(
        'Takvim İzni Gerekli',
        'Takvim senkronizasyonu için önce izin vermelisiniz.',
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
      const result = await UserSettingsService.updateCalendar(user.id, {
        syncWithDevice: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);

        if (value) {
          Alert.alert(
            'Takvim Senkronizasyonu Açıldı',
            'Maçlarınız cihaz takvimine eklenecek.'
          );
        } else {
          Alert.alert(
            'Takvim Senkronizasyonu Kapatıldı',
            'Maçlar artık takvime eklenmeyecek.'
          );
        }
      } else {
        Alert.alert('Hata', 'Takvim ayarları güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle sync error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (
    key: keyof IUserSettings['calendar'],
    value: boolean
  ) => {
    if (!user?.id || !settings) return;

    // Check if sync is enabled
    if (!settings.calendar.syncWithDevice && value) {
      Alert.alert(
        'Senkronizasyon Kapalı',
        'Bu özelliği kullanmak için önce takvim senkronizasyonunu açmalısınız.'
      );
      return;
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.updateCalendar(user.id, {
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

  const handleSelectSyncFrequency = () => {
    if (!settings?.calendar.syncWithDevice) {
      Alert.alert(
        'Senkronizasyon Kapalı',
        'Önce takvim senkronizasyonunu açmalısınız.'
      );
      return;
    }

    const options: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = SYNC_FREQUENCY_OPTIONS.map((freq) => ({
      text: `${freq.label} - ${freq.description}`,
      onPress: () => updateSyncFrequency(freq.value),
    }));
    options.push({ text: 'İptal', style: 'cancel' as const });

    Alert.alert('Senkronizasyon Sıklığı', 'Ne sıklıkla senkronize edilsin?', options);
  };

  const updateSyncFrequency = async (frequency: SyncFrequency) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateCalendar(user.id, {
        syncFrequency: frequency,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Senkronizasyon sıklığı güncellendi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update frequency error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectConflictResolution = () => {
    if (!settings?.calendar.syncWithDevice) {
      Alert.alert(
        'Senkronizasyon Kapalı',
        'Önce takvim senkronizasyonunu açmalısınız.'
      );
      return;
    }

    const options: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = CONFLICT_RESOLUTION_OPTIONS.map((resolution) => ({
      text: `${resolution.label} - ${resolution.description}`,
      onPress: () => updateConflictResolution(resolution.value),
    }));
    options.push({ text: 'İptal', style: 'cancel' as const });

    Alert.alert('Çakışma Çözümü', 'Çakışmalar nasıl çözülsün?', options);
  };

  const updateConflictResolution = async (resolution: ConflictResolution) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateCalendar(user.id, {
        conflictResolution: resolution,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Çakışma çözümü güncellendi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update conflict resolution error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSync = async () => {
    if (!settings?.calendar.syncWithDevice) {
      Alert.alert(
        'Senkronizasyon Kapalı',
        'Önce takvim senkronizasyonunu açmalısınız.'
      );
      return;
    }

    if (!permissionStatus.granted) {
      Alert.alert('İzin Gerekli', 'Takvim erişim izni verilmemiş.');
      return;
    }

    setSyncing(true);
    try {
      // TODO: Implement actual calendar sync
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setLastSyncTime(new Date());
      Alert.alert('Başarılı', 'Takvim senkronize edildi');
    } catch (error) {
      console.error('Manual sync error:', error);
      Alert.alert('Hata', 'Senkronizasyon başarısız oldu');
    } finally {
      setSyncing(false);
    }
  };

  const getSyncFrequencyLabel = (): string => {
    if (!settings) return '';
    const freq = SYNC_FREQUENCY_OPTIONS.find(
      (f) => f.value === settings.calendar.syncFrequency
    );
    return freq?.label || 'Gerçek Zamanlı';
  };

  const getConflictResolutionLabel = (): string => {
    if (!settings) return '';
    const resolution = CONFLICT_RESOLUTION_OPTIONS.find(
      (r) => r.value === settings.calendar.conflictResolution
    );
    return resolution?.label || 'Uygulama Öncelikli';
  };

  const getLastSyncText = (): string => {
    if (!lastSyncTime) return 'Henüz senkronize edilmedi';

    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  const renderHeader = () => (
    <CustomHeader
      title="Takvim Senkronizasyonu"
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

  const syncEnabled = settings.calendar.syncWithDevice && permissionStatus.granted;

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status Card */}
        <View
          style={[
            styles.permissionCard,
            permissionStatus.granted
              ? styles.permissionCardGranted
              : styles.permissionCardDenied,
          ]}
        >
          <View style={styles.permissionIcon}>
            {permissionStatus.granted ? (
              <CheckCircle2 size={32} color="#10B981" strokeWidth={2} />
            ) : (
              <XCircle size={32} color="#EF4444" strokeWidth={2} />
            )}
          </View>
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>
              {permissionStatus.granted ? 'İzin Verildi' : 'İzin Gerekli'}
            </Text>
            <Text style={styles.permissionText}>
              {permissionStatus.granted
                ? 'Takvim erişim izni aktif'
                : 'Takvim senkronizasyonu için izin gerekli'}
            </Text>
            {!permissionStatus.granted && (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={handleRequestPermission}
              >
                <Text style={styles.permissionButtonText}>İzin Ver</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sync Status Card */}
        {syncEnabled && (
          <View style={styles.syncStatusCard}>
            <View style={styles.syncStatusHeader}>
              <Cloud size={24} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.syncStatusTitle}>Senkronizasyon Durumu</Text>
            </View>
            <View style={styles.syncStatusContent}>
              <View style={styles.syncStatusRow}>
                <Text style={styles.syncStatusLabel}>Son Senkronizasyon</Text>
                <Text style={styles.syncStatusValue}>{getLastSyncText()}</Text>
              </View>
              <View style={styles.syncStatusRow}>
                <Text style={styles.syncStatusLabel}>Durum</Text>
                <View style={styles.syncStatusBadge}>
                  <CheckCircle2 size={14} color="#10B981" strokeWidth={2} />
                  <Text style={styles.syncStatusBadgeText}>Aktif</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Master Toggle */}
        <SettingsSection
          title="Genel"
          footer="Maçlarınızı cihaz takvimine otomatik ekleyin"
        >
          <SettingsToggle
            title="Takvim Senkronizasyonu"
            subtitle={
              syncEnabled
                ? 'Maçlar takvime ekleniyor'
                : 'Maçlar takvime eklenmiyor'
            }
            value={settings.calendar.syncWithDevice}
            onValueChange={handleToggleSyncEnabled}
            disabled={saving || !permissionStatus.granted}
          />
        </SettingsSection>

        {/* Sync Settings */}
        <SettingsSection
          title="Senkronizasyon Ayarları"
          footer="Maçların takvime nasıl ekleneceğini ayarlayın"
        >
          <SettingsItem
            icon={<RefreshCw size={22} color="#3B82F6" strokeWidth={2} />}
            title="Senkronizasyon Sıklığı"
            subtitle="Ne sıklıkla senkronize edilsin"
            value={getSyncFrequencyLabel()}
            onPress={handleSelectSyncFrequency}
            showChevron={true}
            disabled={!syncEnabled}
          />

          <SettingsItem
            icon={<AlertCircle size={22} color="#F59E0B" strokeWidth={2} />}
            title="Çakışma Çözümü"
            subtitle="Çakışmalar nasıl yönetilsin"
            value={getConflictResolutionLabel()}
            onPress={handleSelectConflictResolution}
            showChevron={true}
            disabled={!syncEnabled}
          />
        </SettingsSection>

        {/* What to Sync */}
        <SettingsSection
          title="Senkronize Edilecekler"
          footer="Hangi etkinlikler takvime eklensin"
        >
          <SettingsToggle
            title="Onaylanmış Maçlar"
            subtitle="Katılacağınız maçlar"
            value={settings.calendar.syncConfirmedMatches}
            onValueChange={(value) =>
              handleToggleSetting('syncConfirmedMatches', value)
            }
            disabled={saving || !syncEnabled}
          />

          <SettingsToggle
            title="Bekleyen Maç Davetleri"
            subtitle="Henüz cevaplamadığınız davetler"
            value={settings.calendar.syncPendingInvites}
            onValueChange={(value) =>
              handleToggleSetting('syncPendingInvites', value)
            }
            disabled={saving || !syncEnabled}
          />

          <SettingsToggle
            title="Lig Maçları"
            subtitle="Lig programındaki maçlar"
            value={settings.calendar.syncLeagueMatches}
            onValueChange={(value) =>
              handleToggleSetting('syncLeagueMatches', value)
            }
            disabled={saving || !syncEnabled}
          />
        </SettingsSection>

        {/* Reminder Settings */}
        <SettingsSection
          title="Hatırlatıcılar"
          footer="Maç öncesi takvim hatırlatıcıları"
        >
          <SettingsToggle
            title="Maç Öncesi Hatırlatıcı"
            subtitle="Maçtan önce hatırlatma ekle"
            value={settings.calendar.addReminder}
            onValueChange={(value) => handleToggleSetting('addReminder', value)}
            disabled={saving || !syncEnabled}
          />

          {settings.calendar.addReminder && (
            <View style={styles.reminderTimeInfo}>
              <Clock size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.reminderTimeText}>
                Maçtan {settings.calendar.reminderMinutes} dakika önce hatırlatılacaksınız
              </Text>
            </View>
          )}
        </SettingsSection>

        {/* Manual Sync Button */}
        <SettingsSection>
          <TouchableOpacity
            style={[
              styles.manualSyncButton,
              (!syncEnabled || syncing) && styles.manualSyncButtonDisabled,
            ]}
            onPress={handleManualSync}
            disabled={!syncEnabled || syncing}
            activeOpacity={0.7}
          >
            {syncing ? (
              <ActivityIndicator size="small" color="#16a34a" />
            ) : (
              <RefreshCw size={20} color="#16a34a" strokeWidth={2} />
            )}
            <Text style={styles.manualSyncButtonText}>
              {syncing ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}
            </Text>
          </TouchableOpacity>
        </SettingsSection>

        {/* Calendar Info */}
        <View style={styles.calendarInfoCard}>
          <Smartphone size={20} color="#3B82F6" strokeWidth={2} />
          <View style={styles.calendarInfoContent}>
            <Text style={styles.calendarInfoTitle}>Cihaz Takvimi</Text>
            <Text style={styles.calendarInfoText}>
              Maçlar "{Platform.OS === 'ios' ? 'Takvim' : 'Google Takvim'}"{' '}
              uygulamasında "Match Management" adlı takvimde görünecektir.
            </Text>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 İpuçları</Text>
          <Text style={styles.tipsText}>
            • Gerçek zamanlı senkronizasyon pil tüketimini artırabilir{'\n'}
            • Bekleyen davetleri senkronize ederek takviminizde görebilirsiniz{'\n'}
            • Maçları takvimden silmek uygulama verilerini etkilemez{'\n'}
            • Hatırlatıcıları maçtan 1-2 saat önce almak idealdir
          </Text>
        </View>

        {/* System Settings Link */}
        <View style={styles.systemCard}>
          <SettingsIcon size={20} color="#6B7280" strokeWidth={2} />
          <Text style={styles.systemText}>
            Takvim izinlerini değiştirmek için sistem ayarlarına gidin
          </Text>
          <Text
            style={styles.systemLink}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          >
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },

  // Permission Card
  permissionCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionCardGranted: {
    backgroundColor: '#D1FAE5',
  },
  permissionCardDenied: {
    backgroundColor: '#FEE2E2',
  },
  permissionIcon: {
    alignSelf: 'flex-start',
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  permissionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  permissionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EF4444',
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // Sync Status Card
  syncStatusCard: {
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
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  syncStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  syncStatusContent: {
    gap: 8,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncStatusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  syncStatusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  syncStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
  },
  syncStatusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },

  // Reminder Time Info
  reminderTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
  },
  reminderTimeText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
  },

  // Manual Sync Button
  manualSyncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  manualSyncButtonDisabled: {
    opacity: 0.5,
  },
  manualSyncButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16a34a',
  },

  // Calendar Info Card
  calendarInfoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarInfoContent: {
    flex: 1,
  },
  calendarInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  calendarInfoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Tips Card
  tipsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
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