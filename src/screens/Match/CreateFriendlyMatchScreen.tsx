// src/screens/Match/CreateFriendlyMatchScreen.tsx
// 🎯 CREATE FRIENDLY MATCH - COMPLETE WITH ALL STATES

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  CreditCard,
  User,
  ChevronRight,
  Archive,
  Timer,
  Globe,
  Info,
  Lock,
  Zap,
  X,
} from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { MatchService } from '../../services/serviceLayer/matchService';
import { FriendlyMatchConfigService } from '../../services/serviceLayer/friendlyMatchConfigService';
import { SportType, IFriendlyMatchConfig } from '../../types/entity/types';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { CustomDateTimePicker } from '../../components';
import { getThemeForSport, sportThemes } from '../../utils/theme';
import { goBack, MatchNavigationService } from '../../navigation';

type FriendlyMatchTemplate = IFriendlyMatchConfig['templates'][0];

type CreateFriendlyMatchParams = {
  templateId?: string;
};

export const CreateFriendlyMatchScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: CreateFriendlyMatchParams }, 'params'>>();
  const { user } = useAuth();

  // ============================================
  // STATES
  // ============================================

  // Loading States
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Sport Selection
  const [selectedSport, setSelectedSport] = useState<SportType>('Futbol');

  // Template & Config
  const [templates, setTemplates] = useState<FriendlyMatchTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FriendlyMatchTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Match Details
  const [matchStartTime, setMatchStartTime] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerPlayer, setPricePerPlayer] = useState('');
  const [description, setDescription] = useState('');
  const [staffCount, setStaffCount] = useState('10');
  const [reserveCount, setReserveCount] = useState('2');
  const [matchDuration, setMatchDuration] = useState('90');

  // Settings
  const [affectsStandings, setAffectsStandings] = useState(false);
  const [affectsStats, setAffectsStats] = useState(true);
  const [isPublic, setIsPublic] = useState(false); // Varsayılan: Özel (kod ile)

  // Invitation Code Settings
  const [codeExpiry, setCodeExpiry] = useState('48'); // Saat
  const [codeMaxUses, setCodeMaxUses] = useState(''); // Boş = staffCount

  // Payment Info
  const [paymentIban, setPaymentIban] = useState('');
  const [paymentAccountName, setPaymentAccountName] = useState('');

  // Template Save
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const selectedDateRef = useRef<Date>(matchStartTime);
  const selectedTimeRef = useRef<Date>(matchStartTime);

  const templateId = route.params?.templateId;

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (templateId && templates.length > 0 && !loadingTemplates) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        loadTemplate(template);
      }
    }
  }, [templateId, templates, loadingTemplates]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const config = getThemeForSport(selectedSport);
    setStaffCount(config.sport.defaultPlayers.toString());

    // Auto-generate title
    const dateStr = matchStartTime.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    setTitle(`${config.sport.label} Dostluk Maçı - ${dateStr}`);
  }, [selectedSport, matchStartTime]);

  // ============================================
  // FUNCTIONS
  // ============================================

  const loadInitialData = async () => {
    try {
      setLoadingTemplates(true);

      // Load templates
      const templatesResult = await FriendlyMatchConfigService.getAllTemplates(user!.id!);
      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data);
      }

      // Load config
      const configResult = await FriendlyMatchConfigService.getOrCreateConfig(user!.id!);
      if (configResult.success && configResult.data) {
        const config = configResult.data;

        setLocation(config.defaultSettings.location || '');
        setPricePerPlayer(config.defaultSettings.pricePerPlayer?.toString() || '');
        setStaffCount(config.defaultSettings.staffCount?.toString() || '10');
        setReserveCount(config.defaultSettings.reserveCount?.toString() || '2');

        setPaymentIban(config.defaultSettings.paymentInfo?.iban || '');
        setPaymentAccountName(config.defaultSettings.paymentInfo?.accountName || '');
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSportChange = async (sport: SportType) => {
    setSelectedSport(sport);

    if (selectedTemplate && selectedTemplate.sportType !== sport) {
      setSelectedTemplate(null);
    }

    const templatesResult = await FriendlyMatchConfigService.getAllTemplates(user!.id!);
    if (templatesResult.success && templatesResult.data) {
      const sportTemplates = templatesResult.data.filter(
        (t) => !t.sportType || t.sportType === sport
      );
      setTemplates(sportTemplates);
    }
  };

  const handleTemplateOptions = (template: FriendlyMatchTemplate) => {
    Alert.alert(
      template.name,
      'Ne yapmak istersiniz?',
      [
        {
          text: 'Kullan',
          onPress: () => loadTemplate(template)
        },
        {
          text: 'Düzenle',
          onPress: () => {
            setShowTemplateModal(false);
            MatchNavigationService.navigateToEditFriendlyMatchTemplate(template.id);
          }
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => handleDeleteTemplate(template)
        },
        {
          text: 'Vazgeç',
          style: 'cancel'
        }
      ]
    );
  };


  const handleDeleteTemplate = async (template: FriendlyMatchTemplate) => {
    Alert.alert(
      'Şablonu Sil',
      `"${template.name}" şablonunu silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await FriendlyMatchConfigService.removeTemplate(
                user!.id!,
                template.id!
              );

              if (result.success) {
                // Remove from local state
                setTemplates(prev => prev.filter(t => t.id !== template.id));
                Alert.alert('Başarılı', 'Şablon silindi');
              } else {
                Alert.alert('Hata', result.error?.message || 'Şablon silinemedi');
              }
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Hata', 'Şablon silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };



  const loadTemplate = (template: FriendlyMatchTemplate) => {
    setSelectedTemplate(template);
    const settings = template.settings;

    if (template.sportType) {
      setSelectedSport(template.sportType as SportType);
    }

    // Match details
    setLocation(settings.location || '');
    setPricePerPlayer(settings.pricePerPlayer?.toString() || '');
    setStaffCount(settings.staffCount?.toString() || '10');
    setReserveCount(settings.reserveCount?.toString() || '2');
    setMatchDuration(settings.matchDuration?.toString() || '90');

    // Settings
    setAffectsStandings(settings.affectsStandings || false);
    setAffectsStats(settings.affectsStats !== false);
    setIsPublic(settings.isPublic !== false);

    // Payment info (using old field names for backward compatibility)
    setPaymentIban(settings.paymentInfo?.iban || '');
    setPaymentAccountName(settings.paymentInfo?.accountName || '');

    setShowTemplateModal(false);
    Alert.alert('Başarılı', `"${template.name}" şablonu yüklendi`);
  };
  // ============================================
  // DATE PICKER HANDLERS
  // ============================================

  const handleDateChange = (date?: Date) => {
    if (!date) return;
    console.log('Selected date:', date);
    setShowDatePicker(false);

    // Merge with existing time
    const newDate = new Date(date.getTime());
    newDate.setHours(matchStartTime.getHours());
    newDate.setMinutes(matchStartTime.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    setMatchStartTime(newDate);
  };

  const handleTimeChange = (time?: Date) => {
    setShowTimePicker(false);


    // Merge with existing date
    const newDate = new Date(matchStartTime.getTime());
    newDate.setHours(time!.getHours());
    newDate.setMinutes(time!.getMinutes());
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    setMatchStartTime(newDate);
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen maç başlığı girin');
      return false;
    }

    if (!location.trim()) {
      Alert.alert('Hata', 'Lütfen saha adı/lokasyon girin');
      return false;
    }

    const price = parseFloat(pricePerPlayer);
    if (pricePerPlayer && (isNaN(price) || price < 0)) {
      Alert.alert('Hata', 'Lütfen geçerli bir ücret girin');
      return false;
    }

    const staff = parseInt(staffCount);
    const reserve = parseInt(reserveCount);
    const duration = parseInt(matchDuration);

    if (isNaN(staff) || staff < 2) {
      Alert.alert('Hata', 'Kadro sayısı en az 2 olmalı');
      return false;
    }

    if (isNaN(reserve) || reserve < 0) {
      Alert.alert('Hata', 'Yedek sayısı 0 veya daha fazla olmalı');
      return false;
    }

    if (isNaN(duration) || duration < 30 || duration > 180) {
      Alert.alert('Hata', 'Maç süresi 30-180 dakika arası olmalı');
      return false;
    }

    // Kod ayarları validasyonu (özel maçlar için)
    if (!isPublic) {
      const expiry = parseInt(codeExpiry);
      if (isNaN(expiry) || expiry < 1 || expiry > 168) {
        Alert.alert('Hata', 'Kod süresi 1-168 saat arası olmalı');
        return false;
      }

      if (codeMaxUses) {
        const maxUses = parseInt(codeMaxUses);
        if (isNaN(maxUses) || maxUses < 1) {
          Alert.alert('Hata', 'Maksimum kullanım 1\'den büyük olmalı');
          return false;
        }
      }
    }

    // IBAN validation (basic)
    if (paymentIban.trim()) {
      const cleanIban = paymentIban.replace(/\s/g, '').toUpperCase();
      if (!cleanIban.startsWith('TR') || cleanIban.length !== 26) {
        Alert.alert('Hata', 'Geçersiz IBAN formatı (TR ile başlamalı ve 26 karakter olmalı)');
        return false;
      }
    }

    return true;
  };

  const createMatch = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Prepare payment info
      const paymentInfo = paymentIban.trim() ? {
        iban: paymentIban.trim(),
        accountName: paymentAccountName.trim() || undefined,
      } : undefined;

      // Create match with new API
      const result = await MatchService.createFriendlyMatch({
        organizerId: user!.id!,
        title: title.trim(),
        sportType: selectedSport,
        matchStartTime: matchStartTime,
        matchDuration: parseInt(matchDuration),
        location: location.trim(),
        staffPlayerCount: parseInt(staffCount),
        reservePlayerCount: parseInt(reserveCount),
        pricePerPlayer: pricePerPlayer ? parseFloat(pricePerPlayer) : undefined,
        paymentInfo,
        description: description.trim() || undefined,

        // Settings
        isPublic,
        affectsStats,
        affectsStandings,

        // Invitation code (sadece özel maçlar için)
        enableInvitationCode: !isPublic,
        invitationCodeExpiry: !isPublic ? parseInt(codeExpiry) : undefined,
        invitationCodeMaxUses: !isPublic && codeMaxUses
          ? parseInt(codeMaxUses)
          : parseInt(staffCount),
      });

      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Maç oluşturulamadı');
      }

      const match = result.data;
      const matchId = match.id!;

      // Record last used settings
      await FriendlyMatchConfigService.recordLastUsedSettings(user!.id!, {
        location: location.trim(),
        pricePerPlayer: pricePerPlayer ? parseFloat(pricePerPlayer) : undefined,
        staffCount: parseInt(staffCount),
      });

      // Success message
      const sportConfig = getThemeForSport(selectedSport);
      let successMessage = '';

      if (isPublic) {
        successMessage = 'Maç herkese açık olarak oluşturuldu. Herkes listeyi görebilir ve katılabilir.';
      } else {
        const code = match.invitationCode;
        successMessage = `Davet kodu: ${code}\n\nBu kodu paylaşarak oyuncuları maça davet edebilirsiniz.`;
      }

      Alert.alert(
        `${sportConfig.sport.emoji} Başarılı!`,
        successMessage,
        [
          {
            text: 'Tamam',
            onPress: () => {
              goBack();
              MatchNavigationService.navigateToMatchDetail(matchId);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating match:', error);
      Alert.alert('Hata', 'Maç oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      Alert.alert('Hata', 'Lütfen şablon adı girin');
      return;
    }

    try {
      setSavingTemplate(true);

      const template = {
        name: templateName.trim(),
        sportType: selectedSport,
        settings: {
          location: location.trim(),
          pricePerPlayer: pricePerPlayer ? parseFloat(pricePerPlayer) : 0,
          staffCount: parseInt(staffCount),
          reserveCount: parseInt(reserveCount),
          matchDuration: parseInt(matchDuration),
          affectsStandings,
          affectsStats,
          isPublic,

          // Payment info (using old field names for backward compatibility)
          peterIban: paymentIban.trim() || "",
          peterFullName: paymentAccountName.trim() || "",
        },
      };

      const result = await FriendlyMatchConfigService.addTemplate(
        user!.id!,
        template
      );

      if (!result.success) {
        throw new Error(result.error?.message || 'Şablon kaydedilemedi');
      }

      Alert.alert('Başarılı', 'Şablon kaydedildi');
      setShowSaveTemplateModal(false);
      setTemplateName('');

      // Reload templates
      const templatesResult = await FriendlyMatchConfigService.getAllTemplates(user!.id!);
      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data);
      }

    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Hata', 'Şablon kaydedilirken bir hata oluştu');
    } finally {
      setSavingTemplate(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  if (loadingTemplates) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <CustomHeader
        title="Dostluk Maçı Oluştur"
        showBack={true}
        onLeftPress={() => goBack()}
        showBookmark={true}
        onBookmarkPress={() => setShowSaveTemplateModal(true)}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sport Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spor Türü</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportScrollContent}
          >
            {(Object.keys(sportThemes) as SportType[]).map((sport: SportType) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportCard,
                  selectedSport === sport && styles.sportCardActive,
                  {
                    borderColor: selectedSport === sport
                      ? sportThemes[sport].primary
                      : '#E5E7EB'
                  }
                ]}
                onPress={() => handleSportChange(sport)}
              >
                <Text style={styles.sportEmoji}>
                  {sportThemes[sport].emoji}
                </Text>
                <Text style={[
                  styles.sportName,
                  selectedSport === sport && { color: sportThemes[sport].primary }
                ]}>
                  {sportThemes[sport].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Template Selection */}
        {templates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şablon Seç</Text>
            <TouchableOpacity
              style={styles.templateButton}
              onPress={() => setShowTemplateModal(true)}
            >
              <Archive size={20} color="#10B981" />
              <Text style={styles.templateButtonText}>
                {selectedTemplate ? selectedTemplate.name : 'Kayıtlı şablonlardan yükle'}
              </Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Match Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maç Bilgileri</Text>

          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Maç Başlığı</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Cumartesi Maçı"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Date & Time */}
          {/* <View style={styles.row}> */}
          {/* <TouchableOpacity
              style={[styles.input, styles.halfInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text style={styles.inputText}>
                {matchStartTime.toLocaleDateString('tr-TR')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, styles.halfInput]}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={20} color="#6B7280" />
              <Text style={styles.inputText}>
                {matchStartTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity> */}

          <CustomDateTimePicker
            value={matchStartTime}
            mode="date"
            onChange={handleDateChange}
            label="Maç Tarihi"
            placeholder="Tarih seçiniz"
            minimumDate={new Date()}
          />

          <CustomDateTimePicker
            value={matchStartTime}
            mode="time"
            onChange={handleTimeChange}
            label="Maç Saati"
            placeholder="Saat seçiniz"
          />

          {/* Date Picker Modal */}
          {/* <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              date={selectedDateRef.current}
              onConfirm={(date) => {
                // Update ref immediately
                if (date && date instanceof Date && !isNaN(date.getTime())) {
                  selectedDateRef.current = date;
                }
                handleDateConfirm(date);
              }}
              onCancel={handleDateCancel}
              minimumDate={new Date()}
              locale="tr_TR"
            /> */}

          {/* Time Picker Modal */}
          {/* <DateTimePickerModal
              isVisible={showTimePicker}
              mode="time"
              date={selectedTimeRef.current}
              onConfirm={(time) => {
                // Update ref immediately
                if (time && time instanceof Date && !isNaN(time.getTime())) {
                  selectedTimeRef.current = time;
                }
                handleTimeConfirm(time);
              }}
              onCancel={handleTimeCancel}
              locale="tr_TR"
              is24Hour={true}
            /> */}
          {/* </View> */}

          {/* Location */}
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder="Saha Adı / Lokasyon"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Price Per Player */}
          <View style={styles.inputContainer}>
            <DollarSign size={20} color="#6B7280" />
            <TextInput
              style={styles.textInput}
              placeholder="Kişi Başı Ücret (₺) - Opsiyonel"
              value={pricePerPlayer}
              onChangeText={setPricePerPlayer}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Staff, Reserve, Duration */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.thirdInput]}>
              <Users size={18} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="Kadro"
                value={staffCount}
                onChangeText={setStaffCount}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.thirdInput]}>
              <Users size={18} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="Yedek"
                value={reserveCount}
                onChangeText={setReserveCount}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.thirdInput]}>
              <Clock size={18} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="Süre (dk)"
                value={matchDuration}
                onChangeText={setMatchDuration}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.paymentSection}>
            <Text style={styles.subsectionTitle}>Ödeme Bilgileri (Opsiyonel)</Text>

            <View style={styles.inputContainer}>
              <CreditCard size={20} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="IBAN (TR ile başlamalı)"
                value={paymentIban}
                onChangeText={setPaymentIban}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" />
              <TextInput
                style={styles.textInput}
                placeholder="Hesap Sahibi Adı"
                value={paymentAccountName}
                onChangeText={setPaymentAccountName}
              />
            </View>
          </View>

          {/* Description */}
          <TextInput
            style={styles.textArea}
            placeholder="Açıklama / Not (opsiyonel)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Herkese Açık</Text>
              <Text style={styles.settingDescription}>
                {isPublic
                  ? 'Herkes görebilir ve katılabilir'
                  : 'Sadece davet kodu ile katılım'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            />
          </View>

          {/* Kod Ayarları (Sadece özel maçlar için) */}
          {!isPublic && (
            <>
              <View style={styles.codeSettingsHeader}>
                <Lock size={16} color="#10B981" />
                <Text style={styles.codeSettingsTitle}>Davet Kodu Ayarları</Text>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfInput]}>
                  <Timer size={18} color="#6B7280" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Geçerlilik (saat)"
                    value={codeExpiry}
                    onChangeText={setCodeExpiry}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.inputContainer, styles.halfInput]}>
                  <Users size={18} color="#6B7280" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Max kullanım"
                    value={codeMaxUses}
                    onChangeText={setCodeMaxUses}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.codeHelperText}>
                Kod {codeExpiry || '48'} saat süreyle geçerli olacak.
                {codeMaxUses
                  ? ` Maksimum ${codeMaxUses} kişi kullanabilir.`
                  : ' Kadro dolduğunda otomatik devre dışı kalacak.'}
              </Text>
            </>
          )}

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>İstatistikleri Etkile</Text>
              <Text style={styles.settingDescription}>
                Oyuncu istatistiklerine yansısın mı?
              </Text>
            </View>
            <Switch
              value={affectsStats}
              onValueChange={setAffectsStats}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Puan Durumunu Etkile</Text>
              <Text style={styles.settingDescription}>
                Lig puan durumuna yansısın mı?
              </Text>
            </View>
            <Switch
              value={affectsStandings}
              onValueChange={setAffectsStandings}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
            />
          </View>
        </View>

        {/* Info Boxes */}
        <View style={styles.infoContainer}>
          {!isPublic && (
            <View style={[styles.infoBox, { backgroundColor: '#DCFCE7' }]}>
              <Lock size={20} color="#15803d" />
              <Text style={[styles.infoText, { color: '#15803d' }]}>
                Maç oluşturduktan sonra davet kodunu paylaşabilirsiniz
              </Text>
            </View>
          )}

          {isPublic && (
            <View style={[styles.infoBox, { backgroundColor: '#DBEAFE' }]}>
              <Globe size={20} color="#1E40AF" />
              <Text style={[styles.infoText, { color: '#1E40AF' }]}>
                Maç herkese açık, herkes katılabilir
              </Text>
            </View>
          )}

          {!affectsStandings && (
            <View style={[styles.infoBox, { backgroundColor: '#FEF3C7' }]}>
              <Info size={20} color="#92400E" />
              <Text style={[styles.infoText, { color: '#92400E' }]}>
                Bu maç puan durumunu etkilemeyecek
              </Text>
            </View>
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            loading && styles.createButtonDisabled,
            { backgroundColor: sportThemes[selectedSport].primary }
          ]}
          onPress={createMatch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.sportEmoji}>{sportThemes[selectedSport].emoji}</Text>
              <Text style={styles.createButtonText}>Maç Oluştur</Text>
              <Zap size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Template Selection Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {sportThemes[selectedSport].emoji} Şablon Seç
              </Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {templates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => loadTemplate(template)}
                  onLongPress={() => handleTemplateOptions(template)}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDetails}>
                      {template.settings?.location} •
                      {template.settings?.pricePerPlayer ? ` ₺${template.settings.pricePerPlayer} • ` : ' '}
                      {template.settings?.staffCount} kişi •
                      {template.settings?.matchDuration || 90} dk
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}

              {templates.length === 0 && (
                <View style={styles.emptyTemplates}>
                  <Archive size={48} color="#D1D5DB" />
                  <Text style={styles.emptyTemplatesText}>Henüz şablon yok</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Save Template Modal */}
      <Modal
        visible={showSaveTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şablon Olarak Kaydet</Text>
              <TouchableOpacity onPress={() => setShowSaveTemplateModal(false)}>
                <X size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.saveTemplateForm}>
              <TextInput
                style={styles.templateNameInput}
                placeholder="Şablon Adı (örn: Perşembe Akşam Futbol)"
                value={templateName}
                onChangeText={setTemplateName}
              />

              <View style={styles.templatePreview}>
                <Text style={styles.templatePreviewTitle}>Kaydedilecek Bilgiler:</Text>
                <Text style={styles.templatePreviewText}>
                  • Spor: {sportThemes[selectedSport].emoji} {sportThemes[selectedSport].label}
                </Text>
                <Text style={styles.templatePreviewText}>• Lokasyon: {location || 'Yok'}</Text>
                <Text style={styles.templatePreviewText}>
                  • Ücret: {pricePerPlayer ? `₺${pricePerPlayer}` : 'Ücretsiz'}
                </Text>
                <Text style={styles.templatePreviewText}>
                  • Kadro: {staffCount} + {reserveCount} yedek
                </Text>
                <Text style={styles.templatePreviewText}>
                  • Süre: {matchDuration} dakika
                </Text>
                <Text style={styles.templatePreviewText}>
                  • Görünürlük: {isPublic ? 'Açık' : 'Özel (kod ile)'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, savingTemplate && styles.saveButtonDisabled]}
                onPress={handleSaveAsTemplate}
                disabled={savingTemplate}
              >
                {savingTemplate ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Bookmark size={20} color="#FFF" />
                    <Text style={styles.saveButtonText}>Şablonu Kaydet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  sportScrollContent: {
    paddingRight: 16,
  },
  sportCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 12,
    minWidth: 100,
  },
  sportCardActive: {
    backgroundColor: '#FFF',
  },
  sportEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  sportName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  templateButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  paymentSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  textArea: {
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
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
  },
  codeSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  codeSettingsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  codeHelperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: -4,
    marginBottom: 12,
    lineHeight: 16,
  },
  infoContainer: {
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  bottomSpacing: {
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyTemplates: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTemplatesText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9CA3AF',
  },
  saveTemplateForm: {
    padding: 16,
  },
  templateNameInput: {
    padding: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#1F2937',
    marginBottom: 16,
  },
  templatePreview: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  templatePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  templatePreviewText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});