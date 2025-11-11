// src/screens/Settings/Preferences/AvailabilityScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Calendar,
  Clock,
  Sun,
  Sunset,
  Moon,
  CheckCircle2,
  Circle,
  Info,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';
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

interface TimeSlot {
  id: keyof IUserSettings['preferences']['preferredTimes'];
  name: string;
  icon: React.ReactNode;
  timeRange: string;
  color: string;
}

const TIME_SLOTS: TimeSlot[] = [
  {
    id: 'morning',
    name: 'Sabah',
    icon: <Sun size={20} color="#F59E0B" strokeWidth={2} />,
    timeRange: '06:00 - 12:00',
    color: '#F59E0B',
  },
  {
    id: 'afternoon',
    name: 'Öğleden Sonra',
    icon: <Sun size={20} color="#EF4444" strokeWidth={2} />,
    timeRange: '12:00 - 18:00',
    color: '#EF4444',
  },
  {
    id: 'evening',
    name: 'Akşam',
    icon: <Sunset size={20} color="#8B5CF6" strokeWidth={2} />,
    timeRange: '18:00 - 00:00',
    color: '#8B5CF6',
  },
  {
    id: 'night',
    name: 'Gece',
    icon: <Moon size={20} color="#3B82F6" strokeWidth={2} />,
    timeRange: '00:00 - 06:00',
    color: '#3B82F6',
  },
];

export const AvailabilityScreen: React.FC = () => {
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

  const handleToggleDay = async (dayId: DayOfWeek) => {
    if (!user?.id || !settings) return;

    const currentDays = settings.preferences.availableDays || [];
    const isSelected = currentDays.includes(dayId);

    let updatedDays: DayOfWeek[];
    if (isSelected) {
      updatedDays = currentDays.filter((d) => d !== dayId);
    } else {
      updatedDays = [...currentDays, dayId].sort();
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        availableDays: updatedDays,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle day error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTimeSlot = async (
    slotId: keyof IUserSettings['preferences']['preferredTimes']
  ) => {
    if (!user?.id || !settings) return;

    const currentTimes = settings.preferences.preferredTimes;
    const updatedTimes = {
      ...currentTimes,
      [slotId]: !currentTimes[slotId],
    };

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        preferredTimes: updatedTimes,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle time slot error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAllDays = async () => {
    if (!user?.id) return;

    const allDays: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        availableDays: allDays,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Tüm günler seçildi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Select all days error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectWeekdays = async () => {
    if (!user?.id) return;

    const weekdays: DayOfWeek[] = [1, 2, 3, 4, 5]; // Mon-Fri

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        availableDays: weekdays,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Hafta içi günler seçildi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Select weekdays error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectWeekends = async () => {
    if (!user?.id) return;

    const weekends: DayOfWeek[] = [0, 6]; // Sun, Sat

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        availableDays: weekends,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Hafta sonu günleri seçildi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Select weekends error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Tüm Seçimleri Temizle',
      'Tüm gün ve saat seçimleriniz temizlenecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            setSaving(true);
            try {
              const result = await UserSettingsService.updatePreferences(user.id, {
                availableDays: [],
                preferredTimes: {
                  morning: false,
                  afternoon: false,
                  evening: false,
                  night: false,
                },
              });

              if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Tüm seçimler temizlendi');
              } else {
                Alert.alert('Hata', 'Ayarlar güncellenemedi');
              }
            } catch (error) {
              console.error('Clear all error:', error);
              Alert.alert('Hata', 'Bir hata oluştu');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleSelectAllTimes = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        preferredTimes: {
          morning: true,
          afternoon: true,
          evening: true,
          night: true,
        },
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Tüm zaman dilimleri seçildi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Select all times error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const isDaySelected = (dayId: DayOfWeek): boolean => {
    return settings?.preferences.availableDays?.includes(dayId) || false;
  };

  const isTimeSlotSelected = (
    slotId: keyof IUserSettings['preferences']['preferredTimes']
  ): boolean => {
    return settings?.preferences.preferredTimes[slotId] || false;
  };

  const getSelectedDaysCount = (): number => {
    return settings?.preferences.availableDays?.length || 0;
  };

  const getSelectedTimeSlotsCount = (): number => {
    if (!settings?.preferences.preferredTimes) return 0;
    return Object.values(settings.preferences.preferredTimes).filter((v) => v === true)
      .length;
  };

  const renderHeader = () => (
    <CustomHeader
      title="Müsaitlik"
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

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Calendar size={24} color="#3B82F6" strokeWidth={2} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Müsaitlik Takvimi</Text>
            <Text style={styles.infoText}>
              Hangi günlerde ve saatlerde oynamak istediğinizi seçin. Bu bilgiler
              size uygun maç davetleri almanıza yardımcı olur.
            </Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Özet</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seçili Günler</Text>
            <Text style={styles.summaryValue}>
              {getSelectedDaysCount()} / 7 gün
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seçili Zaman Dilimleri</Text>
            <Text style={styles.summaryValue}>
              {getSelectedTimeSlotsCount()} / 4 dilim
            </Text>
          </View>
        </View>

        {/* Days Section */}
        <SettingsSection
          title="Müsait Olduğum Günler"
          footer="Maç oynayabileceğiniz günleri seçin"
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
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  {isSelected ? (
                    <CheckCircle2
                      size={20}
                      color="#16a34a"
                      strokeWidth={2}
                    />
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
                disabled={saving}
              >
                <Text style={styles.quickSelectButtonText}>Tümü</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={handleSelectWeekdays}
                disabled={saving}
              >
                <Text style={styles.quickSelectButtonText}>Hafta İçi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={handleSelectWeekends}
                disabled={saving}
              >
                <Text style={styles.quickSelectButtonText}>Hafta Sonu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SettingsSection>

        {/* Time Slots Section */}
        <SettingsSection
          title="Tercih Ettiğim Saatler"
          footer="Maç oynamayı tercih ettiğiniz zaman dilimlerini seçin"
        >
          <View style={styles.timeSlotsList}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = isTimeSlotSelected(slot.id);

              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlotCard,
                    isSelected && [
                      styles.timeSlotCardActive,
                      { borderColor: slot.color },
                    ],
                  ]}
                  onPress={() => handleToggleTimeSlot(slot.id)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <View style={styles.timeSlotLeft}>
                    <View
                      style={[
                        styles.timeSlotIconContainer,
                        { backgroundColor: `${slot.color}20` },
                      ]}
                    >
                      {slot.icon}
                    </View>
                    <View style={styles.timeSlotText}>
                      <Text
                        style={[
                          styles.timeSlotName,
                          isSelected && { color: slot.color },
                        ]}
                      >
                        {slot.name}
                      </Text>
                      <Text style={styles.timeSlotRange}>{slot.timeRange}</Text>
                    </View>
                  </View>

                  {isSelected ? (
                    <CheckCircle2
                      size={24}
                      color={slot.color}
                      strokeWidth={2}
                      fill={slot.color}
                    />
                  ) : (
                    <Circle size={24} color="#D1D5DB" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Select All Times Button */}
          <View style={styles.selectAllTimesContainer}>
            <TouchableOpacity
              style={styles.selectAllTimesButton}
              onPress={handleSelectAllTimes}
              disabled={saving}
            >
              <Clock size={18} color="#16a34a" strokeWidth={2} />
              <Text style={styles.selectAllTimesButtonText}>
                Tüm Zaman Dilimlerini Seç
              </Text>
            </TouchableOpacity>
          </View>
        </SettingsSection>

        {/* Clear All Button */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAll}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.clearAllButtonText}>
              Tüm Seçimleri Temizle
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Info size={20} color="#3B82F6" strokeWidth={2} />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>💡 İpuçları</Text>
            <Text style={styles.tipsText}>
              • Daha fazla gün ve saat seçtiğinizde daha çok maç davetı alırsınız
              {'\n'}• Müsaitliğiniz her zaman değişebilir, ayarlarınızı
              güncelleyebilirsiniz{'\n'}• Maç davetlerini her zaman manuel olarak
              kabul veya reddedebilirsiniz
            </Text>
          </View>
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
    backgroundColor: '#EFF6FF',
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
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: '#D1FAE5',
    borderColor: '#16a34a',
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
    color: '#16a34a',
  },
  dayShortName: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  dayShortNameActive: {
    color: '#16a34a',
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  quickSelectButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3B82F6',
  },

  // Time Slots
  timeSlotsList: {
    padding: 16,
    gap: 12,
  },
  timeSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  timeSlotCardActive: {
    borderWidth: 2,
  },
  timeSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  timeSlotIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSlotText: {
    flex: 1,
  },
  timeSlotName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timeSlotRange: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // Select All Times
  selectAllTimesContainer: {
    padding: 16,
    paddingTop: 0,
  },
  selectAllTimesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  selectAllTimesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },

  // Danger Zone
  dangerZone: {
    marginTop: 8,
    marginBottom: 16,
  },
  clearAllButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#FCA5A5',
    alignItems: 'center',
  },
  clearAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Tips Card
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipsContent: {
    flex: 1,
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