// src/screens/Fixture/components/FixtureForm.tsx
// 🎯 Shared component for Create and Edit

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Check,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Clock,
  Repeat,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Shield,
  Crown,
  Save,
} from 'lucide-react-native';
import { IFixture, ILeague, IPlayer, PlayerListConfig } from '../../../types/entity/types';
import { getSportPrimaryColor } from '../../../utils/theme';
import { PlayerSelectorModal } from '../../League/components/PlayerSelectorModal';
import { DayOfWeek, getDayNameTR, RecurringPattern, RecurringPatternType } from '../../../types/entity/recurringPattern';
import { getRegistrationTimingDescription, RegistrationSchedule, RegistrationTimingType } from '../../../types/entity/registrationScheduleType';

type StepType = 1 | 2 | 3 | 4;

interface FixtureFormProps {
  mode: 'create' | 'edit';
  league: ILeague;
  leagueMembers: Record<string, IPlayer>;
  initialData?: Partial<IFixture>;
  onSubmit: (data: FixtureFormData) => Promise<void>;
  onCancel: () => void;
}

export interface FixtureFormData {
  // Basic
  title: string;
  description?: string;
  
  // Schedule
  matchStartTime: string;
  matchDuration: number;
  registrationSchedule: RegistrationSchedule;
  isRecurring: boolean;
  pattern?: RecurringPattern;
  
  // Squad
  squad: {
    totalPlayers: number;
    reservePlayers: number;
    minPlayersToStart: number;
  };
  
  // Venue
  venue: {
    location: string;
    pricePerPlayer: number;
    payment: {
      iban?: string;
      accountName?: string;
    };
  };
  
  // Players
  playerLists: {
    premium: PlayerListConfig;
    direct: PlayerListConfig;
  };
  
  // Permissions
  permissions: {
    organizers: string[];
    teamBuilders: string[];
  };
}

export const FixtureForm: React.FC<FixtureFormProps> = ({
  mode,
  league,
  leagueMembers,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>(1);

  // Form Data - Basic Info
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // Form Data - Schedule
  const [registrationType, setRegistrationType] = useState<RegistrationTimingType>(
    initialData?.schedule?.registrationSchedule.opening.type || 'hours_before'
  );
  const [registrationValue, setRegistrationValue] = useState(
    initialData?.schedule?.registrationSchedule.opening.value?.toString() || '2'
  );
  const [registrationTimeOfDay, setRegistrationTimeOfDay] = useState(
    initialData?.schedule?.registrationSchedule.opening.timeOfDay || '18:00'
  );
  const [registrationFixedDate, setRegistrationFixedDate] = useState(
    initialData?.schedule?.registrationSchedule.opening.fixedDateTime || ''
  );
  const [registrationClosingType, setRegistrationClosingType] = useState<'at_match_start' | 'hours_before' | 'minutes_before'>(
    initialData?.schedule?.registrationSchedule.closing?.type || 'at_match_start'
  );
  const [registrationClosingValue, setRegistrationClosingValue] = useState(
    initialData?.schedule?.registrationSchedule.closing?.value?.toString() || '0'
  );

  const [matchStartTime, setMatchStartTime] = useState(initialData?.schedule?.matchStartTime || '19:00');
  const [matchDuration, setMatchDuration] = useState(initialData?.schedule?.matchDuration?.toString() || '60');
  const [isRecurring, setIsRecurring] = useState(initialData?.schedule?.isRecurring || false);
  const [patternType, setPatternType] = useState<RecurringPatternType>(
    initialData?.schedule?.pattern?.type || 'weekly'
  );

  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(
    initialData?.schedule?.pattern?.daysOfWeek || [2]
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(
    initialData?.schedule?.pattern?.dayOfMonth || 15
  );
  const [customInterval, setCustomInterval] = useState(
    initialData?.schedule?.pattern?.interval?.toString() || '7'
  );
  const [hasEndCondition, setHasEndCondition] = useState(
    !!initialData?.schedule?.pattern?.endCondition
  );
  const [endConditionType, setEndConditionType] = useState<'date' | 'count' | 'never'>(
    initialData?.schedule?.pattern?.endCondition?.type || 'never'
  );
  const [endDate, setEndDate] = useState(
    initialData?.schedule?.pattern?.endCondition?.type === 'date'
      ? initialData?.schedule?.pattern?.endCondition?.endDate || ''
      : ''
  );
  const [occurrenceCount, setOccurrenceCount] = useState(
    initialData?.schedule?.pattern?.endCondition?.type === 'count'
      ? initialData?.schedule.pattern?.endCondition?.occurrenceCount?.toString() || '10'
      : '10'
  );

  // Form Data - Squad
  const [totalPlayers, setTotalPlayers] = useState(
    initialData?.squad?.totalPlayers?.toString() || '10'
  );
  const [reservePlayers, setReservePlayers] = useState(
    initialData?.squad?.reservePlayers?.toString() || '2'
  );
  const [minPlayersToStart, setMinPlayersToStart] = useState(
    initialData?.squad?.minPlayersToStart?.toString() || '8'
  );

  // Form Data - Venue
  const [location, setLocation] = useState(initialData?.venue?.location || '');
  const [pricePerPlayer, setPricePerPlayer] = useState(
    initialData?.venue?.pricePerPlayer?.toString() || ''
  );
  const [iban, setIban] = useState(initialData?.venue?.payment?.iban || '');
  const [accountName, setAccountName] = useState(initialData?.venue?.payment?.accountName || '');

  // Form Data - Players
  const [inheritPlayers, setInheritPlayers] = useState(
    mode === 'create' || (initialData?.players?.premium?.mode === 'auto' && initialData?.players?.direct?.mode === 'auto')
  );
  const [customPremiumPlayers, setCustomPremiumPlayers] = useState<string[]>(
    initialData?.players?.premium?.mode === 'custom' ? initialData?.players?.premium?.overrides || [] : []
  );
  const [customDirectPlayers, setCustomDirectPlayers] = useState<string[]>(
    initialData?.players?.direct?.mode === 'custom' ? initialData?.players?.direct?.overrides || [] : []
  );

  // Form Data - Permissions
  const [organizerIds, setOrganizerIds] = useState<string[]>(
    initialData?.permissions?.organizers || []
  );
  const [teamBuilderIds, setTeamBuilderIds] = useState<string[]>(
    initialData?.permissions?.teamBuilders || []
  );

  // Modal State
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerModalType, setPlayerModalType] = useState<'premium' | 'direct' | 'organizer' | 'teamBuilder'>('premium');

  // ============================================
  // HELPERS
  // ============================================

  const toggleDayOfWeek = (day: DayOfWeek) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter(d => d !== day));
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort());
    }
  };

  const buildRecurringPattern = (): RecurringPattern | undefined => {
    if (!isRecurring) return undefined;

    const pattern: RecurringPattern = {
      type: patternType,
      interval: patternType === 'custom'
        ? parseInt(customInterval)
        : patternType === 'weekly' ? 7 : patternType === 'biweekly' ? 14 : 30,
    };

    if (patternType === 'weekly' || patternType === 'biweekly') {
      pattern.daysOfWeek = daysOfWeek.length > 0 ? daysOfWeek : [2];
    }

    if (patternType === 'monthly') {
      pattern.dayOfMonth = dayOfMonth;
    }

    if (hasEndCondition) {
      if (endConditionType === 'date' && endDate) {
        pattern.endCondition = { type: 'date', endDate };
      } else if (endConditionType === 'count' && occurrenceCount) {
        pattern.endCondition = { type: 'count', occurrenceCount: parseInt(occurrenceCount) };
      } else {
        pattern.endCondition = { type: 'never' };
      }
    }

    return pattern;
  };

  const buildRegistrationSchedule = (): RegistrationSchedule => {
    const schedule: RegistrationSchedule = {
      opening: { type: registrationType },
      closing: { type: registrationClosingType },
    };

    if (registrationType === 'hours_before' || registrationType === 'days_before' || registrationType === 'weeks_before') {
      schedule.opening.value = parseInt(registrationValue);
    }

    if ((registrationType === 'days_before' || registrationType === 'weeks_before') && registrationTimeOfDay) {
      schedule.opening.timeOfDay = registrationTimeOfDay;
    }

    if (registrationType === 'fixed_date' && registrationFixedDate) {
      schedule.opening.fixedDateTime = registrationFixedDate;
    }

    if (registrationClosingType !== 'at_match_start' && registrationClosingValue) {
      schedule.closing!.value = parseInt(registrationClosingValue);
    }

    return schedule;
  };

  const validateStep = (step: StepType): boolean => {
    // ... Same validation as CreateFixtureScreen ...
    return true;
  };

  const getStepTitle = (step: StepType): string => {
    switch (step) {
      case 1: return 'Temel Bilgiler';
      case 2: return 'Zamanlama';
      case 3: return 'Kadro & Saha';
      case 4: return 'Oyuncular & Yetkiler';
      default: return '';
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((prev) => Math.min(4, prev + 1) as StepType);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as StepType);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setSaving(true);

      const premiumConfig: PlayerListConfig = inheritPlayers
        ? { mode: 'auto', inherited: league.defaultPlayers.premium || [] }
        : { mode: 'custom', inherited: [], overrides: customPremiumPlayers };

      const directConfig: PlayerListConfig = inheritPlayers
        ? { mode: 'auto', inherited: league.defaultPlayers.direct || [] }
        : { mode: 'custom', inherited: [], overrides: customDirectPlayers };

      const formData: FixtureFormData = {
        title: title.trim(),
        description: description.trim() || undefined,
        matchStartTime,
        matchDuration: parseInt(matchDuration),
        registrationSchedule: buildRegistrationSchedule(),
        isRecurring,
        pattern: buildRecurringPattern(),
        squad: {
          totalPlayers: parseInt(totalPlayers),
          reservePlayers: parseInt(reservePlayers),
          minPlayersToStart: parseInt(minPlayersToStart),
        },
        venue: {
          location: location.trim(),
          pricePerPlayer: parseFloat(pricePerPlayer),
          payment: {
            iban: iban.trim() || undefined,
            accountName: accountName.trim() || undefined,
          },
        },
        playerLists: {
          premium: premiumConfig,
          direct: directConfig,
        },
        permissions: {
          organizers: organizerIds,
          teamBuilders: teamBuilderIds,
        },
      };

      await onSubmit(formData);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPlayerModal = (type: typeof playerModalType) => {
    setPlayerModalType(type);
    setShowPlayerModal(true);
  };

  const handleSelectPlayers = (playerIds: string[]) => {
    switch (playerModalType) {
      case 'premium': setCustomPremiumPlayers(playerIds); break;
      case 'direct': setCustomDirectPlayers(playerIds); break;
      case 'organizer': setOrganizerIds(playerIds); break;
      case 'teamBuilder': setTeamBuilderIds(playerIds); break;
    }
    setShowPlayerModal(false);
  };

  // ============================================
  // RENDER
  // ============================================

  const sportColor = getSportPrimaryColor(league.sportType);
  const progress = (currentStep / 4) * 100;

  const weekDays: { value: DayOfWeek; label: string }[] = [
    { value: 1, label: 'Pzt' },
    { value: 2, label: 'Sal' },
    { value: 3, label: 'Çar' },
    { value: 4, label: 'Per' },
    { value: 5, label: 'Cum' },
    { value: 6, label: 'Cmt' },
    { value: 0, label: 'Paz' },
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton} activeOpacity={0.7}>
          <X size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {mode === 'create' ? 'Yeni Fikstür' : 'Fikstür Düzenle'}
          </Text>
          <View style={styles.headerSubtitleRow}>
            <Trophy size={14} color={sportColor} strokeWidth={2} />
            <Text style={styles.headerSubtitle}>{league.title}</Text>
          </View>
        </View>

        <View style={styles.headerButton} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: sportColor }]} />
        </View>
        <Text style={styles.progressText}>
          Adım {currentStep}/4: {getStepTitle(currentStep)}
        </Text>
      </View>

      {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* STEP 1: Basic Info */}
            {currentStep === 1 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconContainer,
                      { backgroundColor: sportColor + '20' },
                    ]}
                  >
                    <Calendar size={32} color={sportColor} strokeWidth={2} />
                  </View>
                  <Text style={styles.stepTitle}>Temel Bilgiler</Text>
                  <Text style={styles.stepDescription}>
                    Fikstürün adını ve açıklamasını belirleyin
                  </Text>
                </View>
    
                <View style={styles.formCard}>
                  <Text style={styles.label}>Fikstür Adı *</Text>
                  <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Örn: Salı Maçı, Perşembe Halı Saha"
                    placeholderTextColor="#9CA3AF"
                    maxLength={50}
                  />
                  <Text style={styles.hint}>{title.length}/50 karakter</Text>
                </View>
    
                <View style={styles.formCard}>
                  <Text style={styles.label}>Açıklama</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Fikstür hakkında notlar (opsiyonel)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                  />
                  <Text style={styles.hint}>{description.length}/200 karakter</Text>
                </View>
              </View>
            )}
    
            {/* STEP 2: Schedule */}
            {currentStep === 2 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconContainer,
                      { backgroundColor: sportColor + '20' },
                    ]}
                  >
                    <Clock size={32} color={sportColor} strokeWidth={2} />
                  </View>
                  <Text style={styles.stepTitle}>Zamanlama</Text>
                  <Text style={styles.stepDescription}>
                    Maç ve kayıt saatlerini ayarlayın
                  </Text>
                </View>
    
                {/* Registration Timing */}
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>Kayıt Zamanlaması</Text>
    
                  {/* Quick Presets */}
                  <Text style={styles.label}>Hızlı Seçim</Text>
                  <View style={styles.presetRow}>
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        registrationType === 'hours_before' &&
                        registrationValue === '2' &&
                        { backgroundColor: sportColor + '20', borderColor: sportColor }
                      ]}
                      onPress={() => {
                        setRegistrationType('hours_before');
                        setRegistrationValue('2');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetButtonText}>2 Saat Önce</Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        registrationType === 'days_before' &&
                        registrationValue === '1' &&
                        { backgroundColor: sportColor + '20', borderColor: sportColor }
                      ]}
                      onPress={() => {
                        setRegistrationType('days_before');
                        setRegistrationValue('1');
                        setRegistrationTimeOfDay('18:00');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetButtonText}>1 Gün Önce</Text>
                    </TouchableOpacity>
    
                    <TouchableOpacity
                      style={[
                        styles.presetButton,
                        registrationType === 'days_before' &&
                        registrationValue === '3' &&
                        { backgroundColor: sportColor + '20', borderColor: sportColor }
                      ]}
                      onPress={() => {
                        setRegistrationType('days_before');
                        setRegistrationValue('3');
                        setRegistrationTimeOfDay('18:00');
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.presetButtonText}>3 Gün Önce</Text>
                    </TouchableOpacity>
                  </View>
    
                  <View style={styles.divider} />
    
                  {/* Custom Timing */}
                  <Text style={styles.label}>Özel Zamanlama</Text>
                  <View style={styles.patternOptions}>
                    {[
                      { value: 'hours_before', label: 'Saat Önce' },
                      { value: 'days_before', label: 'Gün Önce' },
                      { value: 'weeks_before', label: 'Hafta Önce' },
                      { value: 'fixed_date', label: 'Sabit Tarih' },
                      { value: 'always_open', label: 'Her Zaman Açık' },
                    ].map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.patternOption,
                          registrationType === option.value && {
                            backgroundColor: sportColor + '20',
                            borderColor: sportColor,
                          },
                        ]}
                        onPress={() => setRegistrationType(option.value as RegistrationTimingType)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.patternOptionText,
                            registrationType === option.value && {
                              color: sportColor,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
    
                  {/* Value Input */}
                  {(registrationType === 'hours_before' ||
                    registrationType === 'days_before' ||
                    registrationType === 'weeks_before') && (
                      <View style={styles.customIntervalContainer}>
                        <Text style={styles.smallLabel}>
                          {registrationType === 'hours_before' ? 'Maçtan' :
                            registrationType === 'days_before' ? 'Maçtan' : 'Maçtan'}
                        </Text>
                        <TextInput
                          style={styles.smallInput}
                          value={registrationValue}
                          onChangeText={setRegistrationValue}
                          keyboardType="numeric"
                          placeholder="2"
                        />
                        <Text style={styles.smallLabel}>
                          {registrationType === 'hours_before' ? 'saat önce' :
                            registrationType === 'days_before' ? 'gün önce' : 'hafta önce'}
                        </Text>
                      </View>
                    )}
    
                  {/* Time of Day for days/weeks */}
                  {(registrationType === 'days_before' || registrationType === 'weeks_before') && (
                    <View style={styles.timeOfDayContainer}>
                      <Text style={styles.smallLabel}>Saat:</Text>
                      <TextInput
                        style={styles.smallInput}
                        value={registrationTimeOfDay}
                        onChangeText={setRegistrationTimeOfDay}
                        placeholder="18:00"
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  )}
    
                  {/* Fixed Date */}
                  {registrationType === 'fixed_date' && (
                    <TextInput
                      style={styles.input}
                      value={registrationFixedDate}
                      onChangeText={setRegistrationFixedDate}
                      placeholder="YYYY-MM-DDTHH:MM:SS"
                      placeholderTextColor="#9CA3AF"
                    />
                  )}
    
                  {/* Preview */}
                  <View style={styles.infoBox}>
                    <AlertCircle size={16} color="#2563EB" strokeWidth={2} />
                    <Text style={styles.infoBoxText}>
                      {getRegistrationTimingDescription(buildRegistrationSchedule())}
                    </Text>
                  </View>
                </View>
    
                <View style={styles.formCard}>
                  <Text style={styles.label}>Maç Başlangıç Saati *</Text>
                  <TextInput
                    style={styles.input}
                    value={matchStartTime}
                    onChangeText={setMatchStartTime}
                    placeholder="HH:MM"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numbers-and-punctuation"
                  />
                  <Text style={styles.hint}>Maç saati (Örn: 19:00)</Text>
                </View>
    
                <View style={styles.formCard}>
                  <Text style={styles.label}>Maç Süresi (dakika) *</Text>
                  <TextInput
                    style={styles.input}
                    value={matchDuration}
                    onChangeText={setMatchDuration}
                    placeholder="60"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
    
                {/* 🚀 ADVANCED RECURRING PATTERN */}
                <View style={styles.formCard}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLeft}>
                      <Repeat size={20} color={sportColor} strokeWidth={2} />
                      <View style={styles.switchTextContainer}>
                        <Text style={styles.switchTitle}>Tekrarlayan Fikstür</Text>
                        <Text style={styles.switchDescription}>
                          Düzenli aralıklarla otomatik maç oluştur
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={isRecurring}
                      onValueChange={setIsRecurring}
                      trackColor={{ false: '#D1D5DB', true: sportColor + '40' }}
                      thumbColor={isRecurring ? sportColor : '#F3F4F6'}
                    />
                  </View>
    
                  {isRecurring && (
                    <>
                      <View style={styles.divider} />
    
                      {/* Pattern Type Selection */}
                      <Text style={styles.label}>Tekrar Deseni</Text>
                      <View style={styles.patternOptions}>
                        {[
                          { value: 'weekly', label: 'Haftalık' },
                          { value: 'biweekly', label: 'İki haftada bir' },
                          { value: 'monthly', label: 'Aylık' },
                          { value: 'custom', label: 'Özel' },
                        ].map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.patternOption,
                              patternType === option.value && {
                                backgroundColor: sportColor + '20',
                                borderColor: sportColor,
                              },
                            ]}
                            onPress={() => setPatternType(option.value as RecurringPatternType)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.patternOptionText,
                                patternType === option.value && {
                                  color: sportColor,
                                  fontWeight: '700',
                                },
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
    
                      {/* Days of Week for Weekly/Biweekly */}
                      {(patternType === 'weekly' || patternType === 'biweekly') && (
                        <View style={styles.daysSelector}>
                          <Text style={styles.label}>Hangi Günler?</Text>
                          <View style={styles.daysRow}>
                            {weekDays.map((day) => (
                              <TouchableOpacity
                                key={day.value}
                                style={[
                                  styles.dayButton,
                                  daysOfWeek.includes(day.value) && {
                                    backgroundColor: sportColor,
                                    borderColor: sportColor,
                                  },
                                ]}
                                onPress={() => toggleDayOfWeek(day.value)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.dayButtonText,
                                    daysOfWeek.includes(day.value) && styles.dayButtonTextActive,
                                  ]}
                                >
                                  {day.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          {daysOfWeek.length > 0 && (
                            <Text style={styles.hint}>
                              Seçilen: {daysOfWeek.map(d => getDayNameTR(d)).join(', ')}
                            </Text>
                          )}
                        </View>
                      )}
    
                      {/* Day of Month for Monthly */}
                      {patternType === 'monthly' && (
                        <View style={styles.customIntervalContainer}>
                          <Text style={styles.smallLabel}>Her ayın</Text>
                          <TextInput
                            style={styles.smallInput}
                            value={dayOfMonth.toString()}
                            onChangeText={(text) => {
                              const num = parseInt(text) || 1;
                              setDayOfMonth(Math.min(31, Math.max(1, num)));
                            }}
                            keyboardType="numeric"
                            placeholder="15"
                          />
                          <Text style={styles.smallLabel}>. günü</Text>
                        </View>
                      )}
    
                      {/* Custom Interval */}
                      {patternType === 'custom' && (
                        <View style={styles.customIntervalContainer}>
                          <Text style={styles.smallLabel}>Her</Text>
                          <TextInput
                            style={styles.smallInput}
                            value={customInterval}
                            onChangeText={setCustomInterval}
                            keyboardType="numeric"
                            placeholder="7"
                          />
                          <Text style={styles.smallLabel}>günde bir</Text>
                        </View>
                      )}
    
                      {/* End Condition */}
                      <View style={styles.divider} />
                      <View style={styles.switchRow}>
                        <View style={styles.switchLeft}>
                          <View style={styles.switchTextContainer}>
                            <Text style={styles.switchTitle}>Bitiş Tarihi Belirle</Text>
                            <Text style={styles.switchDescription}>
                              Ne zaman sona erecek?
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={hasEndCondition}
                          onValueChange={setHasEndCondition}
                          trackColor={{ false: '#D1D5DB', true: sportColor + '40' }}
                          thumbColor={hasEndCondition ? sportColor : '#F3F4F6'}
                        />
                      </View>
    
                      {hasEndCondition && (
                        <>
                          <View style={styles.patternOptions}>
                            {[
                              { value: 'date', label: 'Tarihe Kadar' },
                              { value: 'count', label: 'Sayı Kadar' },
                              { value: 'never', label: 'Süresiz' },
                            ].map((option) => (
                              <TouchableOpacity
                                key={option.value}
                                style={[
                                  styles.patternOption,
                                  endConditionType === option.value && {
                                    backgroundColor: sportColor + '20',
                                    borderColor: sportColor,
                                  },
                                ]}
                                onPress={() => setEndConditionType(option.value as typeof endConditionType)}
                                activeOpacity={0.7}
                              >
                                <Text
                                  style={[
                                    styles.patternOptionText,
                                    endConditionType === option.value && {
                                      color: sportColor,
                                      fontWeight: '700',
                                    },
                                  ]}
                                >
                                  {option.label}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
    
                          {endConditionType === 'date' && (
                            <TextInput
                              style={styles.input}
                              value={endDate}
                              onChangeText={setEndDate}
                              placeholder="YYYY-MM-DD"
                              placeholderTextColor="#9CA3AF"
                            />
                          )}
    
                          {endConditionType === 'count' && (
                            <View style={styles.customIntervalContainer}>
                              <TextInput
                                style={styles.smallInput}
                                value={occurrenceCount}
                                onChangeText={setOccurrenceCount}
                                keyboardType="numeric"
                                placeholder="10"
                              />
                              <Text style={styles.smallLabel}>maç oluştur</Text>
                            </View>
                          )}
                        </>
                      )}
                    </>
                  )}
                </View>
              </View>
            )}
    
           {/* STEP 3: Squad & Venue */}
            {currentStep === 3 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconContainer,
                      { backgroundColor: sportColor + '20' },
                    ]}
                  >
                    <Users size={32} color={sportColor} strokeWidth={2} />
                  </View>
                  <Text style={styles.stepTitle}>Kadro & Saha</Text>
                  <Text style={styles.stepDescription}>
                    Oyuncu sayıları ve saha bilgileri
                  </Text>
                </View>
    
                {/* Squad */}
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>Kadro Ayarları</Text>
                  <View style={styles.row}>
                    <View style={styles.flex1}>
                      <Text style={styles.label}>Toplam Oyuncu *</Text>
                      <TextInput
                        style={styles.input}
                        value={totalPlayers}
                        onChangeText={setTotalPlayers}
                        keyboardType="numeric"
                        placeholder="10"
                      />
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.label}>Yedek *</Text>
                      <TextInput
                        style={styles.input}
                        value={reservePlayers}
                        onChangeText={setReservePlayers}
                        keyboardType="numeric"
                        placeholder="2"
                      />
                    </View>
                  </View>
                  <Text style={styles.label}>Min. Başlangıç *</Text>
                  <TextInput
                    style={styles.input}
                    value={minPlayersToStart}
                    onChangeText={setMinPlayersToStart}
                    keyboardType="numeric"
                    placeholder="8"
                  />
                  <Text style={styles.hint}>Maç başlamak için gereken minimum oyuncu</Text>
                </View>
    
                {/* Venue */}
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>Saha Bilgileri</Text>
                  <Text style={styles.label}>Lokasyon *</Text>
                  <View style={styles.inputWithIcon}>
                    <MapPin size={18} color="#6B7280" strokeWidth={2} />
                    <TextInput
                      style={styles.inputWithIconText}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Saha adresi"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
    
                  <Text style={styles.label}>Kişi Başı Ücret *</Text>
                  <View style={styles.inputWithIcon}>
                    <DollarSign size={18} color="#6B7280" strokeWidth={2} />
                    <TextInput
                      style={styles.inputWithIconText}
                      value={pricePerPlayer}
                      onChangeText={setPricePerPlayer}
                      placeholder="50"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputSuffix}>TL</Text>
                  </View>
                </View>
    
                {/* Payment */}
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
                  <Text style={styles.label}>Hesap Sahibi</Text>
                  <TextInput
                    style={styles.input}
                    value={accountName}
                    onChangeText={setAccountName}
                    placeholder="Ad Soyad"
                    placeholderTextColor="#9CA3AF"
                  />
    
                  <Text style={styles.label}>IBAN</Text>
                  <TextInput
                    style={styles.input}
                    value={iban}
                    onChangeText={setIban}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="default"
                  />
                </View>
              </View>
            )}
    
            {/* STEP 4: Players & Permissions */}
            {currentStep === 4 && (
              <View style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View
                    style={[
                      styles.stepIconContainer,
                      { backgroundColor: sportColor + '20' },
                    ]}
                  >
                    <Shield size={32} color={sportColor} strokeWidth={2} />
                  </View>
                  <Text style={styles.stepTitle}>Oyuncular & Yetkiler</Text>
                  <Text style={styles.stepDescription}>
                    Tümü opsiyonel - Ligden farklı yapmak için
                  </Text>
                </View>
    
                {/* Inherit Players */}
                <View style={styles.formCard}>
                  <View style={styles.switchRow}>
                    <View style={styles.switchLeft}>
                      <Crown size={20} color={sportColor} strokeWidth={2} />
                      <View style={styles.switchTextContainer}>
                        <Text style={styles.switchTitle}>Ligden Devral</Text>
                        <Text style={styles.switchDescription}>
                          Lig oyuncu listelerini kullan
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={inheritPlayers}
                      onValueChange={setInheritPlayers}
                      trackColor={{ false: '#D1D5DB', true: sportColor + '40' }}
                      thumbColor={inheritPlayers ? sportColor : '#F3F4F6'}
                    />
                  </View>
    
                  {!inheritPlayers && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.infoBox}>
                        <AlertCircle size={16} color="#2563EB" strokeWidth={2} />
                        <Text style={styles.infoBoxText}>
                          Özel oyuncu listeleri oluşturabilirsiniz
                        </Text>
                      </View>
    
                      {/* Premium Players */}
                      <TouchableOpacity
                        style={styles.playerListButton}
                        onPress={() => handleOpenPlayerModal('premium')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.playerListLeft}>
                          <Crown size={18} color="#8B5CF6" strokeWidth={2} />
                          <View>
                            <Text style={styles.playerListTitle}>Premium Oyuncular</Text>
                            <Text style={styles.playerListCount}>
                              {customPremiumPlayers.length} oyuncu
                            </Text>
                          </View>
                        </View>
                        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                      </TouchableOpacity>
    
                      {/* Direct Players */}
                      <TouchableOpacity
                        style={styles.playerListButton}
                        onPress={() => handleOpenPlayerModal('direct')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.playerListLeft}>
                          <Shield size={18} color="#16a34a" strokeWidth={2} />
                          <View>
                            <Text style={styles.playerListTitle}>Direkt Oyuncular</Text>
                            <Text style={styles.playerListCount}>
                              {customDirectPlayers.length} oyuncu
                            </Text>
                          </View>
                        </View>
                        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
    
                {/* Organizers */}
                <View style={styles.formCard}>
                  <Text style={styles.sectionTitle}>Yetkililer</Text>
                  <TouchableOpacity
                    style={styles.playerListButton}
                    onPress={() => handleOpenPlayerModal('organizer')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playerListLeft}>
                      <Users size={18} color="#3B82F6" strokeWidth={2} />
                      <View>
                        <Text style={styles.playerListTitle}>Organizatörler</Text>
                        <Text style={styles.playerListCount}>
                          {organizerIds.length} kişi
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                  </TouchableOpacity>
    
                  <TouchableOpacity
                    style={styles.playerListButton}
                    onPress={() => handleOpenPlayerModal('teamBuilder')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playerListLeft}>
                      <Users size={18} color="#F59E0B" strokeWidth={2} />
                      <View>
                        <Text style={styles.playerListTitle}>Takım Kurucuları</Text>
                        <Text style={styles.playerListCount}>
                          {teamBuilderIds.length} kişi
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
    
            <View style={styles.bottomSpacing} />
          </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.navButtonSecondary} onPress={handleBack} activeOpacity={0.7}>
            <ChevronLeft size={20} color="#6B7280" strokeWidth={2.5} />
            <Text style={styles.navButtonSecondaryText}>Geri</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity
            style={[styles.navButtonPrimary, { backgroundColor: sportColor }, currentStep === 1 && styles.navButtonFull]}
            onPress={handleNext}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonPrimaryText}>İleri</Text>
            <ChevronRight size={20} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navButtonPrimary, { backgroundColor: sportColor }, saving && styles.navButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                {mode === 'create' ? <Check size={20} color="white" strokeWidth={2.5} /> : <Save size={20} color="white" strokeWidth={2.5} />}
                <Text style={styles.navButtonPrimaryText}>
                  {mode === 'create' ? 'Fikstür Oluştur' : 'Değişiklikleri Kaydet'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Player Selector Modal */}
      {showPlayerModal && (
        <PlayerSelectorModal
          visible={showPlayerModal}
          onClose={() => setShowPlayerModal(false)}
          onSelect={handleSelectPlayers}
          players={league.members.all.map(playerId => ({
            id: playerId,
            name: leagueMembers[playerId]?.name || 'Bilinmeyen Oyuncu',
            avatarUrl: leagueMembers[playerId]?.profilePhoto,
            isPremium: league.defaultPlayers.premium.includes(playerId),
            isDirect: league.defaultPlayers.direct.includes(playerId),
            isAdmin: league.members.admins.includes(playerId),
          }))}
          title={
            playerModalType === 'premium' ? 'Premium Oyuncular' :
            playerModalType === 'direct' ? 'Direkt Oyuncular' :
            playerModalType === 'organizer' ? 'Organizatörler' : 'Takım Kurucuları'
          }
          multiSelect={true}
          showBadges={true}
          selectedIds={
            playerModalType === 'premium' ? customPremiumPlayers :
            playerModalType === 'direct' ? customDirectPlayers :
            playerModalType === 'organizer' ? organizerIds : teamBuilderIds
          }
        />
      )}
    </KeyboardAvoidingView>
  );
};

export const styles = StyleSheet.create({
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
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Progress
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  stepContainer: {
    gap: 16,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form Card
  formCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  smallLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: 'white',
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    padding: 0,
  },
  inputSuffix: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  // Pattern Options
  patternOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  patternOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  patternOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  customIntervalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1F2937',
    textAlign: 'center',
    width: 60,
  },

  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  timeOfDayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },

  // 🆕 NEW STYLES FOR ADVANCED PATTERN
  daysSelector: {
    marginTop: 16,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  dayButtonTextActive: {
    color: 'white',
    fontWeight: '700',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#1E40AF',
    flex: 1,
  },

  // Player List Button
  playerListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  playerListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playerListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  playerListCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Helpers
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  bottomSpacing: {
    height: 20,
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  navButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  navButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
  },
  navButtonFull: {
    flex: 1,
  },
  navButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  navButtonDisabled: {
    opacity: 0.6,
  },
});