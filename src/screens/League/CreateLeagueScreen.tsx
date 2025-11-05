// src/screens/League/CreateLeagueScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import {
  X,
  Trophy,
  Info,
  ChevronRight,
  Calendar,
  Settings,
  Check,
  Users,
  Copy,
  Share2,
} from 'lucide-react-native';
import { NavigationService } from '../../navigation/NavigationService';
import { useAuth } from '../../hooks';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { LeagueInvitationService } from '../../services/serviceLayer/LeagueInvitationService';
import { SPORT_CONFIGS, SportType } from '../../types/entity/types';
import { getSportEmoji, sportThemes } from '../../utils/theme';
import * as Clipboard from 'expo-clipboard';
import { CustomHeader } from '../../components/CustomHeader';

// ============================================
// MAIN COMPONENT
// ============================================

export const CreateLeagueScreen: React.FC = () => {
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [sportType, setSportType] = useState<SportType>('Futbol');
  const [description, setDescription] = useState('');

  // Season Settings
  const [autoCreateNewSeason, setAutoCreateNewSeason] = useState(true);
  const [seasonDuration, setSeasonDuration] = useState('365');
  const [autoArchiveOldSeasons, setAutoArchiveOldSeasons] = useState(true);
  const [archiveAfterMonths, setArchiveAfterMonths] = useState('12');

  // General Settings
  const [allowFriendlyMatches, setAllowFriendlyMatches] = useState(true);
  const [friendlyAffectsStats, setFriendlyAffectsStats] = useState(true);
  const [friendlyAffectsStandings, setFriendlyAffectsStandings] = useState(false);

  // UI State
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Settings

  // ============================================
  // VALIDATION
  // ============================================

  const validateBasicInfo = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lig adı boş olamaz');
      return false;
    }

    if (title.trim().length < 3) {
      Alert.alert('Hata', 'Lig adı en az 3 karakter olmalıdır');
      return false;
    }

    if (title.trim().length > 50) {
      Alert.alert('Hata', 'Lig adı en fazla 50 karakter olmalıdır');
      return false;
    }

    return true;
  };

  const validateSettings = (): boolean => {
    const durationNum = parseInt(seasonDuration);
    if (isNaN(durationNum) || durationNum < 30 || durationNum > 730) {
      Alert.alert('Hata', 'Sezon süresi 30-730 gün arasında olmalıdır');
      return false;
    }

    if (autoArchiveOldSeasons) {
      const archiveNum = parseInt(archiveAfterMonths);
      if (isNaN(archiveNum) || archiveNum < 1 || archiveNum > 60) {
        Alert.alert('Hata', 'Arşivleme süresi 1-60 ay arasında olmalıdır');
        return false;
      }
    }

    return true;
  };

  // ============================================
  // LEAGUE CREATION
  // ============================================

  const handleCreateLeague = async () => {
    if (!validateSettings()) return;
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      setSaving(true);

      // ✅ Step 1: Create League
      const leagueResult = await LeagueService.createLeague({
        creatorId: user.id,
        title: title.trim(),
        sportType,
        description: description.trim() || undefined,
        seasonSettings: {
          autoCreateNewSeason,
          seasonDuration: parseInt(seasonDuration),
          autoArchiveOldSeasons,
          archiveAfterMonths: parseInt(archiveAfterMonths),
        },
        settings: {
          allowFriendlyMatches,
          friendlyAffectsStats,
          friendlyAffectsStandings,
        },
        autoCreateFirstSeason: true,
      });

      if (!leagueResult.success || !leagueResult.data) {
        Alert.alert('Hata', leagueResult.error?.message || 'Lig oluşturulurken hata oluştu');
        return;
      }

      const league = leagueResult.data;

      // ✅ Step 2: Generate Default Invite Code
      const inviteResult = await LeagueInvitationService.generateInvite({
        leagueId: league.id!,
        creatorId: user.id,
        description: 'Varsayılan davet kodu',
        assignRole: 'member',
        // Süresiz ve sınırsız kullanım
      });

      if (!inviteResult.success || !inviteResult.data) {
        // Lig oluşturuldu ama davet kodu oluşturulamadı
        Alert.alert(
          'Uyarı',
          'Lig oluşturuldu ancak davet kodu oluşturulamadı. Lig ayarlarından yeni kod oluşturabilirsiniz.',
          [
            {
              text: 'Tamam',
              onPress: () => NavigationService.navigateToLeagueDetail(league.id!),
            },
          ]
        );
        return;
      }

      const invitation = inviteResult.data;

      // ✅ Step 3: Show Success with Invite Code
      showSuccessModal(league.id!, invitation.code, league.title);

    } catch (error) {
      console.error('Error creating league:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // SUCCESS MODAL
  // ============================================

  const showSuccessModal = (leagueId: string, inviteCode: string, leagueTitle: string) => {
    Alert.alert(
      '🎉 Lig Oluşturuldu!',
      `${leagueTitle} başarıyla oluşturuldu.\n\nDavet Kodu: ${inviteCode}\n\nBu kodu paylaşarak arkadaşlarınızı lige davet edebilirsiniz.`,
      [
        {
          text: 'Kodu Kopyala',
          onPress: async () => {
            await Clipboard.setStringAsync(inviteCode);
            Alert.alert('Başarılı', 'Davet kodu kopyalandı!', [
              {
                text: 'Paylaş',
                onPress: () => shareInviteCode(inviteCode, leagueTitle),
              },
              {
                text: 'Lige Git',
                onPress: () => NavigationService.navigateToLeagueDetail(leagueId),
              },
            ]);
          },
        },
        {
          text: 'Paylaş',
          onPress: () => shareInviteCode(inviteCode, leagueTitle),
        },
        {
          text: 'Lige Git',
          onPress: () => NavigationService.navigateToLeagueDetail(leagueId),
          style: 'default',
        },
      ],
      { cancelable: false }
    );
  };

  const shareInviteCode = async (code: string, leagueTitle: string) => {
    try {
      await Share.share({
        message: `🏆 ${leagueTitle} ligine katılın!\n\nDavet Kodu: ${code}\n\nUygulamayı indirin ve bu kodu kullanarak lige katılın!`,
        title: `${leagueTitle} - Davet`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const nextStep = () => {
    if (currentStep === 1) {
      if (!validateBasicInfo()) return;
      setCurrentStep(2);
    }
  };

  const prevStep = () => {
    setCurrentStep(1);
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderHeader = () => (
    <CustomHeader 
      title="Yeni Lig Oluştur"
      showBack={true}
      onLeftPress={() => NavigationService.goBack()}
      subtitle={`Adım ${currentStep}/2`}
      sportType={sportType}
      showIcon={true}
    />
  );

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleActive]}>
          {currentStep > 1 ? (
            <Check size={16} color="white" strokeWidth={3} />
          ) : (
            <Text style={[styles.stepNumber, currentStep === 1 && styles.stepNumberActive]}>1</Text>
          )}
        </View>
        <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>
          Temel Bilgiler
        </Text>
      </View>

      <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />

      <View style={styles.stepItem}>
        <View style={[styles.stepCircle, currentStep >= 2 && styles.stepCircleActive]}>
          <Text style={[styles.stepNumber, currentStep === 2 && styles.stepNumberActive]}>2</Text>
        </View>
        <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>
          Ayarlar
        </Text>
      </View>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      {/* League Title */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Trophy size={20} color="#16a34a" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Lig Bilgileri</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lig Adı *</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Pazar Ligi, Kızılay Halı Saha"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <Text style={styles.hint}>{title.length}/50 karakter</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Açıklama (İsteğe Bağlı)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Lig hakkında kısa bilgi..."
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>{description.length}/200 karakter</Text>
        </View>
      </View>

      {/* Sport Type Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Users size={20} color="#2563EB" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Spor Dalı</Text>
        </View>

        <View style={styles.sportGrid}>
          {Object.values(sportThemes).map(option => {
            const isSelected = sportType === option.type;
            return (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.sportCard,
                  isSelected && { backgroundColor: option.primaryLight, borderColor: option.primary },
                ]}
                onPress={() => setSportType(option.type)}
                activeOpacity={0.7}
              >
                <Text style={styles.sportEmoji}>{option.emoji}</Text>
                <Text style={[styles.sportLabel, isSelected && { color: option.primary }]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <View style={[styles.sportCheckmark, { backgroundColor: option.primary }]}>
                    <Check size={12} color="white" strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Info size={16} color="#2563EB" strokeWidth={2} />
        <Text style={styles.infoText}>
          Lig oluşturduktan sonra otomatik bir <Text style={styles.infoBold}>davet kodu</Text> oluşturulacak.
          Bu kodu paylaşarak oyuncuları lige davet edebilirsiniz.
        </Text>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.stepContent}>
      {/* Season Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar size={20} color="#F59E0B" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Sezon Ayarları</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>Otomatik Yeni Sezon</Text>
            <Text style={styles.settingDescription}>
              Sezon bittiğinde otomatik olarak yeni sezon oluşturulsun
            </Text>
          </View>
          <Switch
            value={autoCreateNewSeason}
            onValueChange={setAutoCreateNewSeason}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={autoCreateNewSeason ? '#16a34a' : '#F3F4F6'}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sezon Süresi (Gün)</Text>
          <TextInput
            style={styles.input}
            placeholder="365"
            value={seasonDuration}
            onChangeText={setSeasonDuration}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={styles.hint}>Bir sezonun kaç gün süreceğini belirler (30-730 gün)</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>Eski Sezonları Arşivle</Text>
            <Text style={styles.settingDescription}>
              Belirli bir süreden eski sezonlar otomatik arşivlensin
            </Text>
          </View>
          <Switch
            value={autoArchiveOldSeasons}
            onValueChange={setAutoArchiveOldSeasons}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={autoArchiveOldSeasons ? '#16a34a' : '#F3F4F6'}
          />
        </View>

        {autoArchiveOldSeasons && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Arşivleme Süresi (Ay)</Text>
            <TextInput
              style={styles.input}
              placeholder="12"
              value={archiveAfterMonths}
              onChangeText={setArchiveAfterMonths}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.hint}>Kaç ay sonra eski sezonlar arşivlensin (1-60 ay)</Text>
          </View>
        )}
      </View>

      {/* General Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Settings size={20} color="#8B5CF6" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Genel Ayarlar</Text>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Text style={styles.settingLabel}>Dostluk Maçları İzin Ver</Text>
            <Text style={styles.settingDescription}>
              Oyuncular lig dışında dostluk maçı organize edebilsin
            </Text>
          </View>
          <Switch
            value={allowFriendlyMatches}
            onValueChange={setAllowFriendlyMatches}
            trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
            thumbColor={allowFriendlyMatches ? '#16a34a' : '#F3F4F6'}
          />
        </View>

        {allowFriendlyMatches && (
          <>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>İstatistiklere Etki Etsin</Text>
                <Text style={styles.settingDescription}>
                  Dostluk maçları oyuncu istatistiklerini etkileyebilsin
                </Text>
              </View>
              <Switch
                value={friendlyAffectsStats}
                onValueChange={setFriendlyAffectsStats}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={friendlyAffectsStats ? '#16a34a' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Puan Durumuna Etki Etsin</Text>
                <Text style={styles.settingDescription}>
                  Dostluk maçları puan durumunu etkileyebilsin
                </Text>
              </View>
              <Switch
                value={friendlyAffectsStandings}
                onValueChange={setFriendlyAffectsStandings}
                trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                thumbColor={friendlyAffectsStandings ? '#16a34a' : '#F3F4F6'}
              />
            </View>
          </>
        )}
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Info size={16} color="#8B5CF6" strokeWidth={2} />
        <Text style={styles.infoText}>
          Bu ayarları daha sonra lig ayarlarından değiştirebilirsiniz.
          Premium ve direct oyuncu ayarlarını lig detayında yapabilirsiniz.
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      {currentStep > 1 && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={prevStep}
          activeOpacity={0.7}
          disabled={saving}
        >
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.nextButton, (currentStep === 1 || saving) && { flex: 1 }]}
        onPress={currentStep === 1 ? nextStep : handleCreateLeague}
        activeOpacity={0.7}
        disabled={saving}
      >
        {saving ? (
          <>
            <ActivityIndicator size="small" color="white" />
            <Text style={styles.nextButtonText}>Oluşturuluyor...</Text>
          </>
        ) : (
          <>
            <Text style={styles.nextButtonText}>
              {currentStep === 1 ? 'Devam Et' : 'Ligi Oluştur'}
            </Text>
            {currentStep === 1 && <ChevronRight size={20} color="white" strokeWidth={2.5} />}
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {renderHeader()}
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepIndicator()}
        {currentStep === 1 ? renderBasicInfo() : renderSettings()}
      </ScrollView>

      {renderFooter()}
    </KeyboardAvoidingView>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 40,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#16a34a',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  stepNumberActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  stepLabelActive: {
    color: '#1F2937',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
    marginBottom: 28,
  },
  stepLineActive: {
    backgroundColor: '#16a34a',
  },

  // Step Content
  stepContent: {
    paddingHorizontal: 16,
  },

  // Section
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Input Group
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },

  // Sport Selection
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  sportEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sportCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});