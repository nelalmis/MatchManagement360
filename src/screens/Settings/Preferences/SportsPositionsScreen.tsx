// src/screens/Settings/Preferences/SportsPositionsScreen.tsx

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
  Gamepad,
  Circle,
  CheckCircle2,
  Star,
  TrendingUp,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings, SKILL_LEVELS, SkillLevel, SportType } from '../../../types/entity/types';
import { sportThemes } from '../../../utils/theme';
import { goBack } from '../../../navigation';


export const SportsPositionsScreen: React.FC = () => {
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

  const handleToggleSport = async (sportId: SportType) => {
    if (!user?.id || !settings) return;

    const currentSports = settings.preferences.favoriteSports || [];
    const isSelected = currentSports.includes(sportId);

    let updatedSports: SportType[];
    if (isSelected) {
      // Remove sport
      updatedSports = currentSports.filter((s) => s !== sportId);

      // Also remove positions and skill level for this sport
      const updatedPositions = { ...settings.preferences.favoritePositions };
      delete updatedPositions[sportId];

      const updatedSkillLevels = { ...settings.preferences.skillLevel };
      delete updatedSkillLevels[sportId];

      await updateMultipleSettings(updatedSports, updatedPositions, updatedSkillLevels);
    } else {
      // Add sport
      updatedSports = [...currentSports, sportId];
      await updateSports(updatedSports);
    }
  };

  const updateSports = async (sports: SportType[]) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        favoriteSports: sports,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update sports error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const updateMultipleSettings = async (
    sports: SportType[],
    positions: Partial<Record<SportType, string[]>>,
    skillLevels: Partial<Record<SportType, SkillLevel>>
  ) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        favoriteSports: sports,
        favoritePositions: positions,
        skillLevel: skillLevels,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update settings error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPosition = (sportId: SportType, position: string) => {
    if (!settings) return;

    const currentPositions = settings.preferences.favoritePositions || {};
    const sportPositions = currentPositions[sportId] || [];
    const isSelected = sportPositions.includes(position);

    let updatedPositions: string[];
    if (isSelected) {
      updatedPositions = sportPositions.filter((p) => p !== position);
    } else {
      updatedPositions = [...sportPositions, position];
    }

    updatePositions(sportId, updatedPositions);
  };

  const updatePositions = async (sportId: SportType, positions: string[]) => {
    if (!user?.id || !settings) return;

    const currentPositions = settings.preferences.favoritePositions || {};
    const updatedAllPositions = {
      ...currentPositions,
      [sportId]: positions,
    };

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        favoritePositions: updatedAllPositions,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update positions error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectSkillLevel = (sportId: SportType) => {
    const sport = sportThemes[sportId as SportType];

    const options: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [
        ...SKILL_LEVELS.map((level) => ({
          text: `${level.label} - ${level.description}`,
          onPress: () => {
            updateSkillLevel(sportId, level.value);
          },
        })),
        {
          text: 'İptal',
          style: 'cancel' as const,
        }
      ];

    Alert.alert(`${sport?.label} - Yetenek Seviyesi`, 'Seviyenizi seçin:', options);
  };

  const updateSkillLevel = async (sportId: SportType, level: SkillLevel) => {
    if (!user?.id || !settings) return;

    const currentLevels = settings.preferences.skillLevel || {};
    const updatedLevels = {
      ...currentLevels,
      [sportId]: level,
    };

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePreferences(user.id, {
        skillLevel: updatedLevels,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Yetenek seviyesi güncellendi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update skill level error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const isSportSelected = (sportId: SportType): boolean => {
    return settings?.preferences?.favoriteSports?.includes(sportId) || false;
  };

  const isPositionSelected = (sportId: SportType, position: string): boolean => {
    const positions = settings?.preferences.favoritePositions?.[sportId] || [];
    return positions.includes(position);
  };

  const getSkillLevelForSport = (sportId: SportType): SkillLevel | undefined => {
    return settings?.preferences.skillLevel?.[sportId];
  };

  const getSkillLevelInfo = (level: SkillLevel | undefined) => {
    if (!level) return { label: 'Belirtilmedi', color: '#9CA3AF' };
    const info = SKILL_LEVELS.find((l) => l.value === level);
    return info || { label: 'Belirtilmedi', color: '#9CA3AF' };
  };

  const getTotalPositionsCount = (): number => {
    if (!settings?.preferences.favoritePositions) return 0;
    return Object.values(settings.preferences.favoritePositions).flat().length;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Sporlar & Pozisyonlar"
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
          title="Sporlar & Pozisyonlar"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Sporlar & Pozisyonlar"
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
          <Gamepad size={24} color="#16a34a" strokeWidth={2} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Sporlarınızı Seçin</Text>
            <Text style={styles.infoText}>
              Oynadığınız sporları, tercih ettiğiniz pozisyonları ve yetenek
              seviyenizi belirleyin. Bu bilgiler size uygun maçları bulmanıza
              yardımcı olur.
            </Text>
          </View>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Özet</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Seçili Sporlar</Text>
            <Text style={styles.summaryValue}>
              {settings.preferences.favoriteSports?.length || 0} spor
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Toplam Pozisyon</Text>
            <Text style={styles.summaryValue}>
              {getTotalPositionsCount()} pozisyon
            </Text>
          </View>
        </View>

        {/* Sports List */}
        {Object.keys(sportThemes).map((sportId) => {
          const sport = sportThemes[sportId as SportType];
          const isSelected = isSportSelected(sportId as SportType);
          const skillLevel = getSkillLevelForSport(sportId as SportType);
          const skillInfo = getSkillLevelInfo(skillLevel);

          const selectedPositions = settings.preferences.favoritePositions &&
            sportId in settings.preferences?.favoritePositions ? settings.preferences.favoritePositions[sportId as SportType] || [] : [];
          return (
            <View key={sportId} style={styles.sportCard}>
              {/* Sport Header */}
              <TouchableOpacity
                style={[
                  styles.sportHeader,
                  isSelected && styles.sportHeaderActive,
                ]}
                onPress={() => handleToggleSport(sportId as SportType)}
                activeOpacity={0.7}
                disabled={saving}
              >
                <View style={styles.sportHeaderLeft}>
                  <View
                    style={[
                      styles.sportIconContainer,
                      { backgroundColor: `${sport.background}20` },
                    ]}
                  >
                    <Text style={styles.sportIcon}>{sport.emoji}</Text>
                  </View>
                  <View style={styles.sportHeaderText}>
                    <Text style={styles.sportName}>{sport.label}</Text>
                    {isSelected && (
                      <Text style={styles.sportSubtext}>
                        {selectedPositions.length} pozisyon seçili
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.sportHeaderRight}>
                  {isSelected ? (
                    <CheckCircle2
                      size={24}
                      color={sport.primary}
                      strokeWidth={2}
                      fill={sport.primary}
                    />
                  ) : (
                    <Circle size={24} color="#D1D5DB" strokeWidth={2} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Positions and Skill Level (only if sport is selected) */}
              {isSelected && (
                <View style={styles.sportDetails}>
                  {/* Skill Level */}
                  <View style={styles.skillLevelSection}>
                    <View style={styles.skillLevelHeader}>
                      <TrendingUp size={18} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.skillLevelTitle}>Yetenek Seviyesi</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.skillLevelButton,
                        { borderColor: skillInfo.color },
                      ]}
                      onPress={() => handleSelectSkillLevel(sportId as SportType)}
                      disabled={saving}
                    >
                      <Star
                        size={16}
                        color={skillInfo.color}
                        strokeWidth={2}
                        fill={skillLevel ? skillInfo.color : 'none'}
                      />
                      <Text
                        style={[
                          styles.skillLevelButtonText,
                          { color: skillInfo.color },
                        ]}
                      >
                        {skillInfo.label}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Positions */}
                  {sport.positions.length > 0 && (
                    <View style={styles.positionsSection}>
                      <View style={styles.positionsHeader}>
                        <Text style={styles.positionsTitle}>Pozisyonlar</Text>
                        <Text style={styles.positionsSubtitle}>
                          Tercih ettiğiniz pozisyonları seçin
                        </Text>
                      </View>

                      <View style={styles.positionsList}>
                        {sport.positions.map((position) => {
                          const isPositionActive = isPositionSelected(
                            sportId as SportType,
                            position
                          );

                          return (
                            <TouchableOpacity
                              key={position}
                              style={[
                                styles.positionChip,
                                isPositionActive && [
                                  styles.positionChipActive,
                                  { backgroundColor: `${sport.background}20` },
                                  { borderColor: sport.primary },
                                ],
                              ]}
                              onPress={() => handleSelectPosition(sportId as SportType, position)}
                              disabled={saving}
                              activeOpacity={0.7}
                            >
                              {isPositionActive ? (
                                <CheckCircle2
                                  size={16}
                                  color={sport.primary}
                                  strokeWidth={2}
                                />
                              ) : (
                                <Circle
                                  size={16}
                                  color="#9CA3AF"
                                  strokeWidth={2}
                                />
                              )}
                              <Text
                                style={[
                                  styles.positionChipText,
                                  isPositionActive && [
                                    styles.positionChipTextActive,
                                    { color: sport.primary },
                                  ],
                                ]}
                              >
                                {position}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 İpuçları</Text>
          <Text style={styles.tipsText}>
            • Birden fazla spor seçebilirsiniz{'\n'}
            • Her spor için birden fazla pozisyon seçebilirsiniz{'\n'}
            • Yetenek seviyeniz doğru maçları bulmanıza yardımcı olur{'\n'}
            • Seçimlerinizi dilediğiniz zaman güncelleyebilirsiniz
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

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#D1FAE5',
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
    color: '#065F46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#065F46',
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

  // Sport Card
  sportCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  sportHeaderActive: {
    borderBottomColor: '#F3F4F6',
  },
  sportHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportIcon: {
    fontSize: 24,
  },
  sportHeaderText: {
    flex: 1,
  },
  sportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sportSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  sportHeaderRight: {
    marginLeft: 12,
  },

  // Sport Details
  sportDetails: {
    padding: 16,
    gap: 20,
  },

  // Skill Level Section
  skillLevelSection: {
    gap: 8,
  },
  skillLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  skillLevelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  skillLevelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  skillLevelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Positions Section
  positionsSection: {
    gap: 12,
  },
  positionsHeader: {
    gap: 4,
  },
  positionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  positionsSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  positionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  positionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  positionChipActive: {
    borderWidth: 2,
  },
  positionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  positionChipTextActive: {
    fontWeight: '600',
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