// src/screens/League/EditLeagueScreen.tsx

import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import {
  X,
  Trophy,
  Info,
  ChevronRight,
  Calendar,
  Settings,
  Check,
  AlertCircle,
  Save,
} from 'lucide-react-native';
import { useAuth } from '../../hooks';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { SportType, ILeague } from '../../types/entity/types';
import { getSportEmoji, getSportPrimaryColor } from '../../utils/theme';
import { EditLeagueRouteProp, goBack, LeagueNavigationService, useRoute } from '../../navigation';
import { CustomHeader } from '../../components/CustomHeader';

// ============================================
// MAIN COMPONENT
// ============================================

export const EditLeagueScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<EditLeagueRouteProp>();
  const { leagueId } = route.params;

  // Loading State
  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState<ILeague | null>(null);

  // Form State
  const [title, setTitle] = useState('');
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
  const [hasChanges, setHasChanges] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Season Settings, 3: General Settings

  // ============================================
  // LOAD LEAGUE DATA
  // ============================================

  useEffect(() => {
    loadLeagueData();
  }, []);

  const loadLeagueData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const result = await LeagueService.getLeague(leagueId);

      if (result.success && result.data) {
        const leagueData = result.data;
        setLeague(leagueData);

        // Set form values
        setTitle(leagueData.title);
        setDescription(leagueData.description || '');

        // Season settings
        setAutoCreateNewSeason(leagueData.seasonSettings.autoCreateNewSeason);
        setSeasonDuration(leagueData.seasonSettings.seasonDuration.toString());
        setAutoArchiveOldSeasons(leagueData.seasonSettings.autoArchiveOldSeasons);
        setArchiveAfterMonths(leagueData.seasonSettings.archiveAfterMonths.toString());

        // General settings
        setAllowFriendlyMatches(leagueData.settings.allowFriendlyMatches);
        setFriendlyAffectsStats(leagueData.settings.friendlyAffectsStats);
        setFriendlyAffectsStandings(leagueData.settings.friendlyAffectsStandings);
      } else {
        Alert.alert('Hata', result.error?.message || 'Lig bilgileri yüklenemedi');
        goBack();
      }
    } catch (error) {
      console.error('Error loading league:', error);
      Alert.alert('Hata', 'Lig bilgileri yüklenirken bir hata oluştu');
      goBack();
    } finally {
      setLoading(false);
    }
  };

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

  const validateSeasonSettings = (): boolean => {
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
  // SAVE HANDLERS
  // ============================================

  const handleSaveBasicInfo = async () => {
    if (!user?.id || !league) return;
    if(!hasChanges){
      setCurrentStep(2);
      return;
    }
    if (!validateBasicInfo()) return;

    try {
      setSaving(true);

      const result = await LeagueService.updateBasicInfo(leagueId, user.id, {
        title: title.trim(),
        description: description.trim(),
      });

      if (result.success) {
        Alert.alert('✅ Başarılı', 'Temel bilgiler güncellendi');
        setCurrentStep(2);
        setHasChanges(false);
      } else {
        Alert.alert('Hata', result.error?.message || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Error updating basic info:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeasonSettings = async () => {
    if (!user?.id || !league) return;
    if(!hasChanges){
      setCurrentStep(3);
      return;
    }
    if (!validateSeasonSettings()) return;

    try {
      setSaving(true);

      const result = await LeagueService.updateSeasonSettings(leagueId, user.id, {
        autoCreateNewSeason,
        seasonDuration: parseInt(seasonDuration),
        autoArchiveOldSeasons,
        archiveAfterMonths: parseInt(archiveAfterMonths),
      });

      if (result.success) {
        Alert.alert('✅ Başarılı', 'Sezon ayarları güncellendi');
        setCurrentStep(3);
        setHasChanges(false);
      } else {
        Alert.alert('Hata', result.error?.message || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Error updating season settings:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralSettings = async () => {
    if (!user?.id || !league) return;
    if (!hasChanges) {
      goBack();
      return;
    }

    try {
      setSaving(true);

      const result = await LeagueService.updateGeneralSettings(leagueId, user.id, {
        allowFriendlyMatches,
        friendlyAffectsStats,
        friendlyAffectsStandings,
      });

      if (result.success) {
        Alert.alert(
          '✅ Tamamlandı',
          'Tüm ayarlar başarıyla güncellendi',
          [
            {
              text: 'Lig Sayfasına Dön',
              onPress: () => goBack(),
            },
          ]
        );
        setHasChanges(false);
      } else {
        Alert.alert('Hata', result.error?.message || 'Güncelleme başarısız');
      }
    } catch (error) {
      console.error('Error updating general settings:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user?.id || !league) return;

    // Validate all
    if (!validateBasicInfo()) return;
    if (!validateSeasonSettings()) return;

    try {
      setSaving(true);

      // Update basic info
      const basicInfoResult = await LeagueService.updateBasicInfo(leagueId, user.id, {
        title: title.trim(),
        description: description.trim(),
      });

      if (!basicInfoResult.success) {
        throw new Error(basicInfoResult.error?.message || 'Temel bilgiler güncellenemedi');
      }

      // Update season settings
      const seasonResult = await LeagueService.updateSeasonSettings(leagueId, user.id, {
        autoCreateNewSeason,
        seasonDuration: parseInt(seasonDuration),
        autoArchiveOldSeasons,
        archiveAfterMonths: parseInt(archiveAfterMonths),
      });

      if (!seasonResult.success) {
        throw new Error(seasonResult.error?.message || 'Sezon ayarları güncellenemedi');
      }

      // Update general settings
      const generalResult = await LeagueService.updateGeneralSettings(leagueId, user.id, {
        allowFriendlyMatches,
        friendlyAffectsStats,
        friendlyAffectsStandings,
      });

      if (!generalResult.success) {
        throw new Error(generalResult.error?.message || 'Genel ayarlar güncellenemedi');
      }

      Alert.alert(
        '✅ Başarılı',
        'Tüm ayarlar güncellendi',
        [
          {
            text: 'Lig Sayfasına Dön',
            onPress: () => goBack(),
          },
        ]
      );
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving all:', error);
      Alert.alert('Hata', error.message || 'Güncellemede hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // CHANGE HANDLERS
  // ============================================

  const handleTitleChange = (text: string) => {
    setTitle(text);
    setHasChanges(true);
  };

  const handleDescriptionChange = (text: string) => {
    setDescription(text);
    setHasChanges(true);
  };

  const handleSeasonDurationChange = (text: string) => {
    setSeasonDuration(text);
    setHasChanges(true);
  };

  const handleArchiveMonthsChange = (text: string) => {
    setArchiveAfterMonths(text);
    setHasChanges(true);
  };

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, value: boolean) => {
    setter(value);
    setHasChanges(true);
  };

  // ============================================
  // BACK HANDLER
  // ============================================

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Kaydedilmemiş Değişiklikler',
        'Değişiklikleriniz kaydedilmedi. Çıkmak istediğinize emin misiniz?',
        [
          { text: 'Kalmaya Devam Et', style: 'cancel' },
          { text: 'Çık', onPress: () => goBack(), style: 'destructive' },
        ]
      );
    } else {
      goBack();
    }
  };

  // ============================================
  // RENDER LOADING
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Lig bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (!league) {
    return null;
  }

  const sportColor = getSportPrimaryColor(league.sportType);
  const sportEmoji = getSportEmoji(league.sportType);

  // ============================================
  // RENDER HEADER
  // ============================================

  const renderHeader = () => (
    <CustomHeader 
      showClose={true}
      onLeftPress={handleBack}
      title="Lig Düzenle"
      subtitle={league.title}
      sportType={league.sportType}
      showIcon={true}
      showSave={true}
      onSavePress={handleSaveAll}
      // saveDisabled={!hasChanges || saving}
      loading={saving}
      disableSave={!hasChanges || saving}
    />
    // <View style={[styles.header, { borderBottomColor: sportColor }]}>
    //   <TouchableOpacity onPress={handleBack} style={styles.backButton}>
    //     <X size={24} color="#1F2937" strokeWidth={2} />
    //   </TouchableOpacity>

    //   <View style={styles.headerTitleContainer}>
    //     <Text style={styles.headerEmoji}>{sportEmoji}</Text>
    //     <View>
    //       <Text style={styles.headerTitle}>Lig Düzenle</Text>
    //       <Text style={styles.headerSubtitle}>{league.title}</Text>
    //     </View>
    //   </View>

    //   <TouchableOpacity
    //     onPress={handleSaveAll}
    //     disabled={!hasChanges || saving}
    //     style={[
    //       styles.saveButton,
    //       { backgroundColor: hasChanges ? sportColor : '#E5E7EB' },
    //     ]}
    //   >
    //     {saving ? (
    //       <ActivityIndicator size="small" color="white" />
    //     ) : (
    //       <Save size={20} color="white" strokeWidth={2.5} />
    //     )}
    //   </TouchableOpacity>
    // </View>
  );

  // ============================================
  // RENDER STEP INDICATOR
  // ============================================

  const renderStepIndicator = () => {
    const steps = [
      { number: 1, label: 'Temel Bilgiler', icon: Trophy },
      { number: 2, label: 'Sezon Ayarları', icon: Calendar },
      { number: 3, label: 'Genel Ayarlar', icon: Settings },
    ];

    return (
      <View style={styles.stepIndicatorContainer}>
        {steps.map((step, index) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.number}>
              <TouchableOpacity
                style={[
                  styles.stepItem,
                  isActive && styles.stepItemActive,
                  isCompleted && styles.stepItemCompleted,
                ]}
                onPress={() => setCurrentStep(step.number)}
                disabled={saving}
              >
                <View
                  style={[
                    styles.stepCircle,
                    isActive && [styles.stepCircleActive, { backgroundColor: sportColor }],
                    isCompleted && styles.stepCircleCompleted,
                  ]}
                >
                  {isCompleted ? (
                    <Check size={16} color="white" strokeWidth={3} />
                  ) : (
                    <Icon
                      size={16}
                      color={isActive ? 'white' : '#9CA3AF'}
                      strokeWidth={2}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && { color: sportColor, fontWeight: '700' },
                    isCompleted && styles.stepLabelCompleted,
                  ]}
                >
                  {step.label}
                </Text>
              </TouchableOpacity>

              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.stepConnector,
                    isCompleted && { backgroundColor: '#10B981' },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  // ============================================
  // RENDER STEP 1: BASIC INFO
  // ============================================

  const renderBasicInfo = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Lig Bilgileri</Text>

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Lig Adı <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={handleTitleChange}
          placeholder="Örn: Çarşamba Halısaha Ligi"
          placeholderTextColor="#9CA3AF"
          maxLength={50}
        />
        <Text style={styles.inputHint}>{title.length}/50 karakter</Text>
      </View>

      {/* Sport Type (Read-only) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Spor Dalı</Text>
        <View style={[styles.input, styles.readOnlyInput]}>
          <Text style={styles.readOnlyText}>
            {sportEmoji} {league.sportType}
          </Text>
        </View>
        <View style={styles.infoBox}>
          <Info size={16} color="#3B82F6" strokeWidth={2} />
          <Text style={styles.infoText}>
            Spor dalı oluşturulduktan sonra değiştirilemez
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Açıklama</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={handleDescriptionChange}
          placeholder="Lig hakkında açıklama (opsiyonel)"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={styles.inputHint}>{description.length}/500 karakter</Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: sportColor }]}
        onPress={handleSaveBasicInfo}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>
              {hasChanges ? 'Kaydet ve Devam Et' : 'Devam Et'}
            </Text>
            <ChevronRight size={20} color="white" strokeWidth={2.5} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // RENDER STEP 2: SEASON SETTINGS
  // ============================================

  const renderSeasonSettings = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Sezon Yönetimi</Text>

      {/* Auto Create New Season */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Otomatik Sezon Oluştur</Text>
          <Text style={styles.settingDescription}>
            Aktif sezon bittiğinde otomatik olarak yeni sezon başlat
          </Text>
        </View>
        <Switch
          value={autoCreateNewSeason}
          onValueChange={(value) => handleToggle(setAutoCreateNewSeason, value)}
          trackColor={{ false: '#D1D5DB', true: `${sportColor}80` }}
          thumbColor={autoCreateNewSeason ? sportColor : '#F3F4F6'}
        />
      </View>

      {/* Season Duration */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Sezon Süresi (Gün) <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={seasonDuration}
          onChangeText={handleSeasonDurationChange}
          placeholder="365"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={3}
        />
        <Text style={styles.inputHint}>30-730 gün arasında</Text>
      </View>

      {/* Auto Archive Old Seasons */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Eski Sezonları Arşivle</Text>
          <Text style={styles.settingDescription}>
            Belirli bir süreden eski sezonları otomatik arşivle
          </Text>
        </View>
        <Switch
          value={autoArchiveOldSeasons}
          onValueChange={(value) => handleToggle(setAutoArchiveOldSeasons, value)}
          trackColor={{ false: '#D1D5DB', true: `${sportColor}80` }}
          thumbColor={autoArchiveOldSeasons ? sportColor : '#F3F4F6'}
        />
      </View>

      {/* Archive After Months */}
      {autoArchiveOldSeasons && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Arşivleme Süresi (Ay) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={archiveAfterMonths}
            onChangeText={handleArchiveMonthsChange}
            placeholder="12"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.inputHint}>1-60 ay arasında</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep(1)}
          disabled={saving}
        >
          <Text style={styles.secondaryButtonText}>Geri</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: sportColor, flex: 1 }]}
          onPress={handleSaveSeasonSettings}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                {hasChanges ? 'Kaydet ve Devam Et' : 'Devam Et'}
              </Text>
              <ChevronRight size={20} color="white" strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ============================================
  // RENDER STEP 3: GENERAL SETTINGS
  // ============================================

  const renderGeneralSettings = () => (
    <View style={styles.stepContent}>
      <Text style={styles.sectionTitle}>Genel Ayarlar</Text>

      {/* Allow Friendly Matches */}
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Dostluk Maçlarına İzin Ver</Text>
          <Text style={styles.settingDescription}>
            Kullanıcılar dostluk maçları oluşturabilir
          </Text>
        </View>
        <Switch
          value={allowFriendlyMatches}
          onValueChange={(value) => handleToggle(setAllowFriendlyMatches, value)}
          trackColor={{ false: '#D1D5DB', true: `${sportColor}80` }}
          thumbColor={allowFriendlyMatches ? sportColor : '#F3F4F6'}
        />
      </View>

      {allowFriendlyMatches && (
        <>
          {/* Friendly Affects Stats */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>İstatistiklere Yansı</Text>
              <Text style={styles.settingDescription}>
                Dostluk maçları oyuncu istatistiklerini etkilesin
              </Text>
            </View>
            <Switch
              value={friendlyAffectsStats}
              onValueChange={(value) => handleToggle(setFriendlyAffectsStats, value)}
              trackColor={{ false: '#D1D5DB', true: `${sportColor}80` }}
              thumbColor={friendlyAffectsStats ? sportColor : '#F3F4F6'}
            />
          </View>

          {/* Friendly Affects Standings */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Puan Durumuna Yansı</Text>
              <Text style={styles.settingDescription}>
                Dostluk maçları puan durumunu etkilesin
              </Text>
            </View>
            <Switch
              value={friendlyAffectsStandings}
              onValueChange={(value) => handleToggle(setFriendlyAffectsStandings, value)}
              trackColor={{ false: '#D1D5DB', true: `${sportColor}80` }}
              thumbColor={friendlyAffectsStandings ? sportColor : '#F3F4F6'}
            />
          </View>

          <View style={styles.warningBox}>
            <AlertCircle size={16} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.warningText}>
              Puan durumuna yansıma aktif olursa, dostluk maçları lig sıralamalarını etkileyecektir
            </Text>
          </View>
        </>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setCurrentStep(2)}
          disabled={saving}
        >
          <Text style={styles.secondaryButtonText}>Geri</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: sportColor, flex: 1 }]}
          onPress={handleSaveGeneralSettings}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>
                {hasChanges ? 'Kaydet ve Tamamla' : 'Tamamla'}
              </Text>
              <Check size={20} color="white" strokeWidth={2.5} />
            </>
          )}
        </TouchableOpacity>
      </View>
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
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderStepIndicator()}

        {currentStep === 1 && renderBasicInfo()}
        {currentStep === 2 && renderSeasonSettings()}
        {currentStep === 3 && renderGeneralSettings()}
      </ScrollView>

      {/* Floating Save Button */}
      {hasChanges && (
        <TouchableOpacity
          style={[styles.floatingSaveButton, { backgroundColor: sportColor }]}
          onPress={handleSaveAll}
          disabled={saving}
          activeOpacity={0.9}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.floatingSaveButtonText}>Tümünü Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 2,
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // Step Indicator
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  stepItemActive: {},
  stepItemCompleted: {},
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: '#10B981',
  },
  stepConnector: {
    width: 24,
    height: 2,
    backgroundColor: '#E5E7EB',
    marginHorizontal: -8,
  },

  // Step Content
  stepContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },

  // Input Groups
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  readOnlyInput: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  readOnlyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  inputHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },

  // Info/Warning Boxes
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
    gap: 4,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 18,
  },

  // Buttons
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'white',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  // Floating Save Button
  floatingSaveButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 28,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingSaveButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'white',
  },
});

export default EditLeagueScreen;