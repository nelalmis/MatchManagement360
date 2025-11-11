// src/screens/Settings/Preferences/SkillLevelScreen.tsx

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
  Star,
  TrendingUp,
  Award,
  Target,
  Zap,
  CheckCircle2,
  Info,
  BarChart3,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { SportType } from '../../../types/entity/types';
import { goBack } from '../../../navigation';
import { LoadingScreen } from '../..';

type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface SkillLevelOption {
  value: SkillLevel;
  label: string;
  description: string;
  characteristics: string[];
  icon: React.ReactNode;
  color: string;
  gradient: string[];
}

interface SportConfig {
  id: SportType;
  name: string;
  icon: string;
  color: string;
}

const SKILL_LEVELS: SkillLevelOption[] = [
  {
    value: 'beginner',
    label: 'Başlangıç',
    description: 'Yeni başladım, temel kuralları öğreniyorum',
    characteristics: [
      'Spora yeni başladım',
      'Temel kuralları öğreniyorum',
      'Eğlenmek için oynuyorum',
      'Düzenli antrenman yapmıyorum',
    ],
    icon: <Target size={32} color="#9CA3AF" strokeWidth={2} />,
    color: '#9CA3AF',
    gradient: ['#F3F4F6', '#E5E7EB'],
  },
  {
    value: 'intermediate',
    label: 'Orta',
    description: 'Düzenli oynuyorum, temel tekniklere hakimim',
    characteristics: [
      'Düzenli olarak oynuyorum',
      'Temel tekniklere hakimim',
      'Stratejik düşünebiliyorum',
      'Haftada 2-3 kez antrenman yapıyorum',
    ],
    icon: <TrendingUp size={32} color="#3B82F6" strokeWidth={2} />,
    color: '#3B82F6',
    gradient: ['#DBEAFE', '#BFDBFE'],
  },
  {
    value: 'advanced',
    label: 'İleri',
    description: 'Deneyimliyim, rekabetçi maçlarda oynuyorum',
    characteristics: [
      'Yıllardır düzenli oynuyorum',
      'İleri seviye teknikleri kullanıyorum',
      'Rekabetçi maçlarda yer alıyorum',
      'Takım stratejilerine katkı sağlıyorum',
    ],
    icon: <Award size={32} color="#F59E0B" strokeWidth={2} />,
    color: '#F59E0B',
    gradient: ['#FEF3C7', '#FDE68A'],
  },
  {
    value: 'expert',
    label: 'Uzman',
    description: 'Profesyonel veya yarı-profesyonel seviyede',
    characteristics: [
      'Profesyonel veya yarı-profesyonel oyuncuyum',
      'Turnuvalarda yer alıyorum',
      'Günlük antrenman yapıyorum',
      'Koçluk veya eğitmenlik yapabilirim',
    ],
    icon: <Zap size={32} color="#10B981" strokeWidth={2} />,
    color: '#10B981',
    gradient: ['#D1FAE5', '#A7F3D0'],
  },
];

const SPORTS_CONFIG: SportConfig[] = [
  {
    id: 'Futbol',
    name: 'Futbol',
    icon: '⚽',
    color: '#16a34a',
  },
  {
    id: 'Basketbol',
    name: 'Basketbol',
    icon: '🏀',
    color: '#f59e0b',
  },
  {
    id: 'Voleybol',
    name: 'Voleybol',
    icon: '🏐',
    color: '#2563eb',
  },
  {
    id: 'Tenis',
    name: 'Tenis',
    icon: '🎾',
    color: '#10b981',
  },
  {
    id: 'Masa Tenisi',
    name: 'Masa Tenisi',
    icon: '🏓',
    color: '#8b5cf6',
  },
  {
    id: 'Badminton',
    name: 'Badminton',
    icon: '🏸',
    color: '#ec4899',
  },
];

export const SkillLevelScreen: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);

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

        // Set initial selected sport (first favorite sport with no skill level)
        const favoriteSports = result.data.preferences.favoriteSports || [];
        const sportWithoutLevel = favoriteSports.find(
          (sport) => !result.data?.preferences.skillLevel?.[sport]
        );
        setSelectedSport(sportWithoutLevel || favoriteSports[0] || null);
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

  const handleSelectSport = (sportId: SportType) => {
    setSelectedSport(sportId);
  };

  const handleSelectSkillLevel = async (level: SkillLevel) => {
    if (!user?.id || !settings || !selectedSport) return;

    setSaving(true);
    try {
      const updatedSkillLevels = {
        ...settings.preferences.skillLevel,
        [selectedSport]: level,
      };

      const result = await UserSettingsService.updatePreferences(user.id, {
        skillLevel: updatedSkillLevels,
      });

      if (result.success && result.data) {
        setSettings(result.data);

        const levelOption = SKILL_LEVELS.find((l) => l.value === level);
        Alert.alert(
          'Başarılı',
          `${selectedSport} için yetenek seviyeniz "${levelOption?.label}" olarak güncellendi.`
        );
      } else {
        Alert.alert('Hata', 'Yetenek seviyesi güncellenemedi');
      }
    } catch (error) {
      console.error('Update skill level error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const getSkillLevelForSport = (sportId: SportType): SkillLevel | undefined => {
    return settings?.preferences.skillLevel?.[sportId];
  };

  const getUserSports = (): SportType[] => {
    return settings?.preferences.favoriteSports || [];
  };

  const getCompletedSportsCount = (): number => {
    if (!settings) return 0;
    const favoriteSports = settings.preferences.favoriteSports || [];
    return favoriteSports.filter(
      (sport) => settings.preferences.skillLevel?.[sport]
    ).length;
  };
  const renderHeader = () => (
    <CustomHeader
      title="Yetenek Seviyesi"
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

  const userSports = getUserSports();
  const completedCount = getCompletedSportsCount();

  if (userSports.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyContainer}>
          <Star size={64} color="#9CA3AF" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>Henüz Spor Seçmediniz</Text>
          <Text style={styles.emptyText}>
            Yetenek seviyenizi belirlemek için önce favori sporlarınızı seçin.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() =>
              //NavigationService.navigate('SportsPositions' as never); //TOD
              console.log('Navigate to Sports Positions Screen')
            }
          >
            <Text style={styles.emptyButtonText}>Spor Seç</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Yetenek Seviyesi"
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
          <BarChart3 size={24} color="#3B82F6" strokeWidth={2} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Yetenek Seviyeniz</Text>
            <Text style={styles.infoText}>
              Her spor için yetenek seviyenizi belirleyin. Bu bilgi size uygun
              seviyede maç ve rakip bulmanıza yardımcı olur.
            </Text>
          </View>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>İlerleme</Text>
            <Text style={styles.progressValue}>
              {completedCount} / {userSports.length}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${userSports.length > 0
                      ? (completedCount / userSports.length) * 100
                      : 0
                    }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completedCount === userSports.length
              ? 'Tüm sporlar tamamlandı! 🎉'
              : `${userSports.length - completedCount} spor daha kaldı`}
          </Text>
        </View>

        {/* Sport Selection */}
        <SettingsSection title="Spor Seçin">
          <View style={styles.sportsList}>
            {userSports.map((sportId) => {
              const sport = SPORTS_CONFIG.find((s) => s.id === sportId);
              const skillLevel = getSkillLevelForSport(sportId);
              const isSelected = selectedSport === sportId;

              if (!sport) return null;

              return (
                <TouchableOpacity
                  key={sportId}
                  style={[
                    styles.sportChip,
                    isSelected && [
                      styles.sportChipActive,
                      { borderColor: sport.color },
                    ],
                  ]}
                  onPress={() => handleSelectSport(sportId)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <View style={styles.sportChipContent}>
                    <Text style={styles.sportIcon}>{sport.icon}</Text>
                    <View style={styles.sportChipText}>
                      <Text
                        style={[
                          styles.sportName,
                          isSelected && { color: sport.color },
                        ]}
                      >
                        {sport.name}
                      </Text>
                      {skillLevel && (
                        <Text style={styles.sportLevel}>
                          {SKILL_LEVELS.find((l) => l.value === skillLevel)?.label}
                        </Text>
                      )}
                    </View>
                  </View>
                  {skillLevel ? (
                    <CheckCircle2
                      size={20}
                      color={sport.color}
                      strokeWidth={2}
                    />
                  ) : (
                    <View style={styles.incompleteBadge}>
                      <Text style={styles.incompleteBadgeText}>!</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </SettingsSection>

        {/* Skill Level Selection */}
        {selectedSport && (
          <SettingsSection
            title={`${SPORTS_CONFIG.find((s) => s.id === selectedSport)?.name
              } - Seviye Seçin`}
          >
            <View style={styles.skillLevelsList}>
              {SKILL_LEVELS.map((level) => {
                const currentLevel = getSkillLevelForSport(selectedSport);
                const isSelected = currentLevel === level.value;

                return (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.skillLevelCard,
                      isSelected && [
                        styles.skillLevelCardActive,
                        { borderColor: level.color },
                      ],
                    ]}
                    onPress={() => handleSelectSkillLevel(level.value)}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    {/* Icon and Header */}
                    <View style={styles.skillLevelHeader}>
                      <View
                        style={[
                          styles.skillLevelIconContainer,
                          { backgroundColor: `${level.color}20` },
                        ]}
                      >
                        {level.icon}
                      </View>
                      {isSelected && (
                        <View style={styles.skillLevelCheckmark}>
                          <CheckCircle2
                            size={24}
                            color={level.color}
                            strokeWidth={2}
                            fill={level.color}
                          />
                        </View>
                      )}
                    </View>

                    {/* Label and Description */}
                    <View style={styles.skillLevelInfo}>
                      <Text
                        style={[
                          styles.skillLevelLabel,
                          isSelected && { color: level.color },
                        ]}
                      >
                        {level.label}
                      </Text>
                      <Text style={styles.skillLevelDescription}>
                        {level.description}
                      </Text>
                    </View>

                    {/* Characteristics */}
                    <View style={styles.characteristicsList}>
                      {level.characteristics.map((char, index) => (
                        <View key={index} style={styles.characteristicItem}>
                          <View
                            style={[
                              styles.characteristicDot,
                              { backgroundColor: level.color },
                            ]}
                          />
                          <Text style={styles.characteristicText}>{char}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SettingsSection>
        )}

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <Info size={20} color="#3B82F6" strokeWidth={2} />
            <Text style={styles.benefitsTitle}>Neden Önemli?</Text>
          </View>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>
                Size uygun seviyede maçlar bulursunuz
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>
                Denk rakiplerle eşleşirsiniz
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>
                Daha keyifli oyun deneyimi yaşarsınız
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitDot} />
              <Text style={styles.benefitText}>
                Gelişiminizi takip edebilirsiniz
              </Text>
            </View>
          </View>
        </View>

        {/* Tips Card */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 İpuçları</Text>
          <Text style={styles.tipsText}>
            • Dürüst olun! Yanlış seviye seçimi keyif alamazsınız{'\n'}
            • Seviyenizi zaman içinde güncelleyebilirsiniz{'\n'}
            • Farklı sporlarda farklı seviyelerde olabilirsiniz{'\n'}
            • Emin değilseniz daha düşük seviye seçin, sonra artırırsınız
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

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#16a34a',
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
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

  // Progress Card
  progressCard: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Sports List
  sportsList: {
    padding: 16,
    gap: 12,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sportChipActive: {
    backgroundColor: 'white',
    borderWidth: 2,
  },
  sportChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sportIcon: {
    fontSize: 28,
  },
  sportChipText: {
    flex: 1,
  },
  sportName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  sportLevel: {
    fontSize: 12,
    color: '#6B7280',
  },
  incompleteBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incompleteBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Skill Levels List
  skillLevelsList: {
    padding: 16,
    gap: 16,
  },
  skillLevelCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  skillLevelCardActive: {
    borderWidth: 3,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  skillLevelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  skillLevelIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillLevelCheckmark: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  skillLevelInfo: {
    marginBottom: 16,
  },
  skillLevelLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  skillLevelDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  characteristicsList: {
    gap: 8,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  characteristicDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  characteristicText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Benefits Card
  benefitsCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534',
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginTop: 6,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
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