// src/screens/Settings/Notifications/QuietHoursScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Moon,
  Sun,
  Clock,
  Calendar,
  Bell,
  BellOff,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack, SettingsNavigationService } from '../../../navigation';
import { LoadingScreen } from '../..';

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface DayConfig {
  id: DayOfWeek;
  name: string;
  shortName: string;
}

const DAYS_OF_WEEK: DayConfig[] = [
  { id: 0, name: 'Pazar', shortName: 'Paz' },
  { id: 1, name: 'Pazartesi', shortName: 'Pzt' },
  { id: 2, name: 'Salı', shortName: 'Sal' },
  { id: 3, name: 'Çarşamba', shortName: 'Çar' },
  { id: 4, name: 'Perşembe', shortName: 'Per' },
  { id: 5, name: 'Cuma', shortName: 'Cum' },
  { id: 6, name: 'Cumartesi', shortName: 'Cmt' },
];

export const QuietHoursScreen: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Time picker states
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());

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

        // Initialize time pickers
        if (result.data.notifications.quietHours.start) {
          const [hours, minutes] = result.data.notifications.quietHours.start
            .split(':')
            .map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          setTempStartTime(startDate);
        }

        if (result.data.notifications.quietHours.end) {
          const [hours, minutes] = result.data.notifications.quietHours.end
            .split(':')
            .map(Number);
          const endDate = new Date();
          endDate.setHours(hours, minutes, 0, 0);
          setTempEndTime(endDate);
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

  const handleToggleQuietHours = async (value: boolean) => {
    if (!user?.id || !settings) return;

    // Check if notifications are enabled
    if (!settings.notifications.enabled && value) {
      Alert.alert(
        'Bildirimler Kapalı',
        'Sessiz saatler için önce bildirimleri açmalısınız.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Ayarlara Git',
            onPress: () => SettingsNavigationService.navigateToNotificationSettings(),
          },
        ]
      );
      return;
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.setQuietHours(user.id, {
        enabled: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);

        if (value) {
          Alert.alert(
            'Sessiz Saatler Aktif',
            `${result.data.notifications.quietHours.start} - ${result.data.notifications.quietHours.end} arasında bildirim almayacaksınız.`
          );
        } else {
          Alert.alert('Sessiz Saatler Kapatıldı', 'Tüm saatlerde bildirim alacaksınız.');
        }
      } else {
        Alert.alert('Hata', 'Sessiz saatler güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle quiet hours error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleDay = async (dayId: DayOfWeek) => {
    if (!user?.id || !settings) return;

    if (!settings.notifications.quietHours.enabled) {
      Alert.alert('Sessiz Saatler Kapalı', 'Önce sessiz saatleri aktif etmelisiniz.');
      return;
    }

    const currentDays = settings.notifications.quietHours.daysOfWeek || [];
    const isSelected = currentDays.includes(dayId);

    let updatedDays: DayOfWeek[];
    if (isSelected) {
      updatedDays = currentDays.filter((d) => d !== dayId);
    } else {
      updatedDays = [...currentDays, dayId].sort();
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.setQuietHours(user.id, {
        daysOfWeek: updatedDays,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Gün ayarı güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle day error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');

    if (selectedDate) {
      setTempStartTime(selectedDate);

      if (Platform.OS === 'android') {
        updateStartTime(selectedDate);
      }
    }
  };

  const handleEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');

    if (selectedDate) {
      setTempEndTime(selectedDate);

      if (Platform.OS === 'android') {
        updateEndTime(selectedDate);
      }
    }
  };

  const updateStartTime = async (date: Date) => {
    if (!user?.id) return;

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    setSaving(true);
    try {
      const result = await UserSettingsService.setQuietHours(user.id, {
        start: timeString,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Başlangıç saati güncellendi');
      } else {
        Alert.alert('Hata', 'Saat güncellenemedi');
      }
    } catch (error) {
      console.error('Update start time error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const updateEndTime = async (date: Date) => {
    if (!user?.id) return;

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    setSaving(true);
    try {
      const result = await UserSettingsService.setQuietHours(user.id, {
        end: timeString,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Bitiş saati güncellendi');
      } else {
        Alert.alert('Hata', 'Saat güncellenemedi');
      }
    } catch (error) {
      console.error('Update end time error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllDays = async () => {
    if (!user?.id || !settings) return;

    if (!settings.notifications.quietHours.enabled) {
      Alert.alert('Sessiz Saatler Kapalı', 'Önce sessiz saatleri aktif etmelisiniz.');
      return;
    }

    const allDays: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

    setSaving(true);
    try {
      const result = await UserSettingsService.setQuietHours(user.id, {
        daysOfWeek: allDays,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Tüm günler seçildi');
      } else {
        Alert.alert('Hata', 'Günler güncellenemedi');
      }
    } catch (error) {
      console.error('Select all days error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectWeekdays = async () => {
    if (!user?.id || !settings) return;

    if (!settings.notifications.quietHours.enabled) {
      Alert.alert('Sessiz Saatler Kapalı', 'Önce sessiz saatleri aktif etmelisiniz.');
      return;
    }

    const weekdays: DayOfWeek[] = [1, 2, 3, 4, 5];

    setSaving(true);
    try {
      const result = await UserSettingsService.setQuietHours(user.id, {
        daysOfWeek: weekdays,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Hafta içi günler seçildi');
      } else {
        Alert.alert('Hata', 'Günler güncellenemedi');
      }
    } catch (error) {
      console.error('Select weekdays error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectWeekends = async () => {
    if (!user?.id || !settings) return;

    if (!settings.notifications.quietHours.enabled) {
      Alert.alert('Sessiz Saatler Kapalı', 'Önce sessiz saatleri aktif etmelisiniz.');
      return;
    }

    const weekends: DayOfWeek[] = [0, 6];

    setSaving(true);
    try {
      const result = await UserSettingsService.setQuietHours(user.id, {
        daysOfWeek: weekends,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Hafta sonu günleri seçildi');
      } else {
        Alert.alert('Hata', 'Günler güncellenemedi');
      }
    } catch (error) {
      console.error('Select weekends error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const isDaySelected = (dayId: DayOfWeek): boolean => {
    return (
      settings?.notifications.quietHours.daysOfWeek?.includes(dayId) || false
    );
  };

  const getSelectedDaysCount = (): number => {
    return settings?.notifications.quietHours.daysOfWeek?.length || 0;
  };

  const calculateDuration = (): string => {
    if (!settings) return '';

    const start = settings.notifications.quietHours.start;
    const end = settings.notifications.quietHours.end;

    if (!start || !end) return '';

    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);

    let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);

    // Handle overnight duration
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (minutes === 0) {
      return `${hours} saat`;
    }
    return `${hours} saat ${minutes} dakika`;
  };

  const renderHeader = () => (
    <CustomHeader
      title="Sessiz Saatler"
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

  const quietHoursEnabled =
    settings.notifications.enabled && settings.notifications.quietHours.enabled;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Sessiz Saatler"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Moon size={24} color="#6B7280" strokeWidth={2} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Sessiz Saatler</Text>
            <Text style={styles.infoText}>
              Belirtilen saatlerde ve günlerde bildirim almayın. Acil durumlar
              için özel bildirimler yine de gösterilir.
            </Text>
          </View>
        </View>

        {/* Status Card */}
        {quietHoursEnabled && (
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <BellOff size={32} color="#6B7280" strokeWidth={2} />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Sessiz Saatler Aktif</Text>
              <Text style={styles.statusTime}>
                {settings.notifications.quietHours.start} -{' '}
                {settings.notifications.quietHours.end}
              </Text>
              <Text style={styles.statusDuration}>
                Süre: {calculateDuration()}
              </Text>
              <Text style={styles.statusDays}>
                {getSelectedDaysCount()} gün seçili
              </Text>
            </View>
          </View>
        )}

        {/* Master Toggle */}
        <SettingsSection
          title="Genel"
          footer="Sessiz saatleri aktif veya devre dışı bırakın"
        >
          <SettingsToggle
            title="Sessiz Saatleri Aktif Et"
            subtitle={
              quietHoursEnabled
                ? 'Sessiz saatler açık'
                : 'Sessiz saatler kapalı'
            }
            value={settings.notifications.quietHours.enabled}
            onValueChange={handleToggleQuietHours}
            disabled={saving || !settings.notifications.enabled}
          />
        </SettingsSection>

        {/* Time Settings */}
        <SettingsSection
          title="Zaman Aralığı"
          footer="Sessiz saatlerin başlangıç ve bitiş zamanını ayarlayın"
        >
          {/* Start Time */}
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setShowStartPicker(true)}
            disabled={!quietHoursEnabled || saving}
          >
            <View style={styles.timePickerLeft}>
              <Sun size={22} color="#F59E0B" strokeWidth={2} />
              <View>
                <Text style={styles.timePickerLabel}>Başlangıç Saati</Text>
                <Text style={styles.timePickerValue}>
                  {settings.notifications.quietHours.start}
                </Text>
              </View>
            </View>
            <Clock size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>

          {/* End Time */}
          <TouchableOpacity
            style={styles.timePickerButton}
            onPress={() => setShowEndPicker(true)}
            disabled={!quietHoursEnabled || saving}
          >
            <View style={styles.timePickerLeft}>
              <Moon size={22} color="#6B7280" strokeWidth={2} />
              <View>
                <Text style={styles.timePickerLabel}>Bitiş Saati</Text>
                <Text style={styles.timePickerValue}>
                  {settings.notifications.quietHours.end}
                </Text>
              </View>
            </View>
            <Clock size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>

          {/* Time Pickers */}
          {showStartPicker && (
            <DateTimePicker
              value={tempStartTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              value={tempEndTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndTimeChange}
            />
          )}

          {/* iOS Confirm Button */}
          {Platform.OS === 'ios' && (showStartPicker || showEndPicker) && (
            <View style={styles.iosConfirmButtons}>
              <TouchableOpacity
                style={styles.iosConfirmButton}
                onPress={() => {
                  if (showStartPicker) {
                    updateStartTime(tempStartTime);
                    setShowStartPicker(false);
                  }
                  if (showEndPicker) {
                    updateEndTime(tempEndTime);
                    setShowEndPicker(false);
                  }
                }}
              >
                <Text style={styles.iosConfirmButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View>
          )}
        </SettingsSection>

        {/* Days Selection */}
        <SettingsSection
          title="Günler"
          footer="Sessiz saatlerin hangi günlerde aktif olacağını seçin"
        >
          <View style={styles.daysGrid}>
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = isDaySelected(day.id);

              return (
                <TouchableOpacity
                  key={day.id}
                  style={[
                    styles.dayChip,
                    isSelected && styles.dayChipActive,
                  ]}
                  onPress={() => handleToggleDay(day.id)}
                  disabled={!quietHoursEnabled || saving}
                  activeOpacity={0.7}
                >
                  {isSelected ? (
                    <CheckCircle2 size={20} color="#6B7280" strokeWidth={2} />
                  ) : (
                    <Circle size={20} color="#9CA3AF" strokeWidth={2} />
                  )}
                  <View style={styles.dayChipText}>
                    <Text
                      style={[
                        styles.dayName,
                        isSelected && styles.dayNameActive,
                      ]}
                    >
                      {day.name}
                    </Text>
                    <Text
                      style={[
                        styles.dayShortName,
                        isSelected && styles.dayShortNameActive,
                      ]}
                    >
                      {day.shortName}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Quick Select Buttons */}
          <View style={styles.quickSelectContainer}>
            <Text style={styles.quickSelectTitle}>Hızlı Seçim:</Text>
            <View style={styles.quickSelectButtons}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={handleSelectAllDays}
                disabled={!quietHoursEnabled || saving}
              >
                <Text style={styles.quickSelectButtonText}>Tümü</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={handleSelectWeekdays}
                disabled={!quietHoursEnabled || saving}
              >
                <Text style={styles.quickSelectButtonText}>Hafta İçi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={handleSelectWeekends}
                disabled={!quietHoursEnabled || saving}
              >
                <Text style={styles.quickSelectButtonText}>Hafta Sonu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SettingsSection>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 İpuçları</Text>
          <Text style={styles.tipsText}>
            • Sessiz saatler sırasında acil bildirimler yine de gösterilir{'\n'}
            • Uyku saatlerinize uygun bir zaman aralığı seçin{'\n'}
            • Hafta içi ve hafta sonu için farklı günler seçebilirsiniz{'\n'}
            • Gece yarısını geçen saatler için bitiş saati başlangıçtan küçük
            olabilir
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

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Status Card
  statusCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusTime: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
  },
  statusDuration: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  statusDays: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // Time Picker Button
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timePickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timePickerLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  timePickerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  // iOS Confirm Buttons
  iosConfirmButtons: {
    padding: 16,
    alignItems: 'flex-end',
  },
  iosConfirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#16a34a',
  },
  iosConfirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },

  // Days Grid
  daysGrid: {
    padding: 16,
    gap: 12,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  dayChipActive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#6B7280',
  },
  dayChipText: {
    flex: 1,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  dayNameActive: {
    color: '#374151',
  },
  dayShortName: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  dayShortNameActive: {
    color: '#6B7280',
  },

  // Quick Select
  quickSelectContainer: {
    padding: 16,
    paddingTop: 0,
  },
  quickSelectTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  quickSelectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Tips Card
  tipsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
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
});