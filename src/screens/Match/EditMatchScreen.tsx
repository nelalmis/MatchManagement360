// src/screens/Match/EditMatchScreen.tsx
// 🔧 EDIT MATCH - Updated for new IMatch structure

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  DollarSign,
  Save,
  Trash2,
  UserPlus,
  Info,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { MatchService } from '../../services/serviceLayer/matchService';
import { IMatch, MatchStatus, MatchType } from '../../types/entity/types';
import { NavigationService } from '../../navigation';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';

type EditMatchRouteProp = {
  matchId: string;
};

export const EditMatchScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<any>();
  const { matchId } = route.params as EditMatchRouteProp;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Match data
  const [match, setMatch] = useState<IMatch | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Schedule
  const [registrationStartDate, setRegistrationStartDate] = useState(new Date());
  const [registrationEndDate, setRegistrationEndDate] = useState(new Date());
  const [matchStartDate, setMatchStartDate] = useState(new Date());
  const [matchEndDate, setMatchEndDate] = useState(new Date());
  
  // Venue
  const [location, setLocation] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [pricePerPlayer, setPricePerPlayer] = useState('');
  const [bankAccountIBAN, setBankAccountIBAN] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  
  // Squad
  const [totalPlayers, setTotalPlayers] = useState('');
  const [reservePlayers, setReservePlayers] = useState('');
  const [minPlayersToStart, setMinPlayersToStart] = useState('');

  // Friendly settings (if applicable)
  const [isPublic, setIsPublic] = useState(true);
  const [affectsStats, setAffectsStats] = useState(true);
  const [affectsStandings, setAffectsStandings] = useState(false);

  // DatePicker states - SIMPLIFIED
  const [showDatePicker, setShowDatePicker] = useState<'regStart' | 'regEnd' | 'matchStart' | 'matchEnd' | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMatch();
  }, [matchId]);

  const loadMatch = async () => {
    if (!matchId) {
      Alert.alert('Hata', 'Maç bilgisi bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);
      const result = await MatchService.getMatch(matchId);

      if (!result.success || !result.data) {
        Alert.alert('Hata', 'Maç bulunamadı');
        NavigationService.goBack();
        return;
      }

      const matchData = result.data;

      // Check permissions - only organizers can edit
      const isOrganizer = matchData.permissions.organizers.includes(user?.id || '');
      
      if (!isOrganizer) {
        Alert.alert('Hata', 'Bu maçı düzenleme yetkiniz yok');
        NavigationService.goBack();
        return;
      }

      setMatch(matchData);
      populateForm(matchData);
    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert('Hata', 'Maç bilgileri yüklenirken bir hata oluştu');
      NavigationService.goBack();
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (matchData: IMatch) => {
    setTitle(matchData.title);
    setDescription(matchData.description || '');

    // Schedule
    setRegistrationStartDate(new Date(matchData.schedule.registrationStart));
    setRegistrationEndDate(new Date(matchData.schedule.registrationEnd));
    setMatchStartDate(new Date(matchData.schedule.matchStart));
    setMatchEndDate(new Date(matchData.schedule.matchEnd));

    // Venue
    if (matchData.venue) {
      setLocation(matchData.venue.location || '');
      setGoogleMapsUrl(matchData.venue.googleMapsUrl || '');
      setPricePerPlayer(matchData.venue.pricePerPlayer?.toString() || '0');
      
      // Parse payment info
      if (matchData.venue.payment) {
        setBankAccountIBAN(matchData.venue.payment.iban || '');
        setBankAccountName(matchData.venue.payment.accountName || '');
      }
    }

    // Squad
    setTotalPlayers(matchData.squad.totalPlayers.toString());
    setReservePlayers(matchData.squad.reservePlayers.toString());
    setMinPlayersToStart(matchData.squad.minPlayersToStart.toString());

    // Friendly settings
    if (matchData.type === MatchType.FRIENDLY && matchData.friendlySettings) {
      setIsPublic(matchData.friendlySettings.isPublic);
      setAffectsStats(matchData.friendlySettings.affectsStats);
      setAffectsStandings(matchData.friendlySettings.affectsStandings);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Maç başlığı gerekli';
    }

    if (!location.trim()) {
      newErrors.location = 'Konum gerekli';
    }

    const totalPlayersNum = parseInt(totalPlayers);
    if (!totalPlayers || isNaN(totalPlayersNum) || totalPlayersNum < 2) {
      newErrors.totalPlayers = 'En az 2 oyuncu olmalı';
    }

    const reservePlayersNum = parseInt(reservePlayers);
    if (!reservePlayers || isNaN(reservePlayersNum) || reservePlayersNum < 0) {
      newErrors.reservePlayers = 'Geçerli bir sayı girin';
    }

    const minPlayersNum = parseInt(minPlayersToStart);
    if (!minPlayersToStart || isNaN(minPlayersNum) || minPlayersNum < 2) {
      newErrors.minPlayersToStart = 'En az 2 oyuncu olmalı';
    }

    if (minPlayersNum > totalPlayersNum) {
      newErrors.minPlayersToStart = 'Minimum oyuncu sayısı toplam oyuncudan fazla olamaz';
    }

    const priceNum = parseFloat(pricePerPlayer);
    if (pricePerPlayer && (isNaN(priceNum) || priceNum < 0)) {
      newErrors.pricePerPlayer = 'Geçerli bir fiyat girin';
    }

    // Date validations
    const now = new Date();
    if (registrationStartDate <= now) {
      newErrors.registrationStart = 'Kayıt başlangıcı gelecekte olmalı';
    }

    if (registrationEndDate <= registrationStartDate) {
      newErrors.registrationEnd = 'Kayıt bitişi, başlangıçtan sonra olmalı';
    }

    if (matchStartDate <= registrationEndDate) {
      newErrors.matchStart = 'Maç başlangıcı, kayıt bitişinden sonra olmalı';
    }

    if (matchEndDate <= matchStartDate) {
      newErrors.matchEnd = 'Maç bitişi, başlangıçtan sonra olmalı';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm zorunlu alanları doldurun');
      return;
    }

    if (!match || !user?.id) return;

    try {
      setSaving(true);

      const updatedMatch: Partial<IMatch> = {
        title: title.trim(),
        description: description.trim() || undefined,
        
        schedule: {
          registrationStart: registrationStartDate,
          registrationEnd: registrationEndDate,
          matchStart: matchStartDate,
          matchEnd: matchEndDate,
        },

        venue: {
          location: location.trim(),
          googleMapsUrl: googleMapsUrl.trim() || undefined,
          pricePerPlayer: parseFloat(pricePerPlayer) || 0,
          payment: (bankAccountIBAN.trim() || bankAccountName.trim()) ? {
            iban: bankAccountIBAN.trim() || undefined,
            accountName: bankAccountName.trim() || undefined,
          } : undefined,
        },

        squad: {
          totalPlayers: parseInt(totalPlayers),
          reservePlayers: parseInt(reservePlayers),
          minPlayersToStart: parseInt(minPlayersToStart),
        },
      };

      // Update friendly settings if it's a friendly match
      if (match.type === MatchType.FRIENDLY) {
        updatedMatch.friendlySettings = {
          isPublic,
          affectsStats,
          affectsStandings,
          invitedPlayerIds: match.friendlySettings?.invitedPlayerIds,
        };
      }

      const result = await MatchService.updateMatch(matchId, updatedMatch);

      if (result.success) {
        Alert.alert('Başarılı', 'Maç başarıyla güncellendi', [
          {
            text: 'Tamam',
            onPress: () => NavigationService.goBack(),
          },
        ]);
      } else {
        Alert.alert('Hata', result.error?.message || 'Maç güncellenirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error updating match:', error);
      Alert.alert('Hata', 'Maç güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Maçı Sil',
      'Bu maçı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!matchId) return;

    try {
      setDeleting(true);
      const result = await MatchService.deleteMatch(matchId, user?.id || '');

      if (result.success) {
        Alert.alert('Başarılı', 'Maç başarıyla silindi', [
          {
            text: 'Tamam',
            onPress: () => NavigationService.goBack(),
          },
        ]);
      } else {
        Alert.alert('Hata', result.error?.message || 'Maç silinirken bir hata oluştu');
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      Alert.alert('Hata', 'Maç silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const handleDateConfirm = (selectedDate: Date) => {
    const currentType = showDatePicker;
    setShowDatePicker(null);

    if (!currentType) return;

    switch (currentType) {
      case 'regStart':
        setRegistrationStartDate(selectedDate);
        break;
      case 'regEnd':
        setRegistrationEndDate(selectedDate);
        break;
      case 'matchStart':
        setMatchStartDate(selectedDate);
        break;
      case 'matchEnd':
        setMatchEndDate(selectedDate);
        break;
    }
  };

  const handleDateCancel = () => {
    setShowDatePicker(null);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Maç bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Maç bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Maç Düzenle"
        subtitle={match.type === MatchType.LEAGUE ? 'Lig Maçı' : 'Dostluk Maçı'}
        showBack={true}
        onLeftPress={() => NavigationService.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Basic Info Section */}
        <View style={styles.sectionHeader}>
          <Info size={20} color="#16a34a" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Maç Başlığı <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={setTitle}
            placeholder="Örn: Cumartesi Maçı"
            placeholderTextColor="#9CA3AF"
          />
          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Maç hakkında ek bilgiler..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Schedule Section */}
        <View style={styles.sectionHeader}>
          <Calendar size={20} color="#16a34a" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Zamanlama</Text>
        </View>

        {/* Registration Start */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Kayıt Başlangıcı <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.registrationStart && styles.inputError]}
            onPress={() => setShowDatePicker('regStart')}
            activeOpacity={0.7}
          >
            <Calendar size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.dateButtonText}>{formatDateTime(registrationStartDate)}</Text>
          </TouchableOpacity>
          {errors.registrationStart && (
            <Text style={styles.errorText}>{errors.registrationStart}</Text>
          )}
        </View>

        {/* Registration End */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Kayıt Bitişi <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.registrationEnd && styles.inputError]}
            onPress={() => setShowDatePicker('regEnd')}
            activeOpacity={0.7}
          >
            <Calendar size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.dateButtonText}>{formatDateTime(registrationEndDate)}</Text>
          </TouchableOpacity>
          {errors.registrationEnd && (
            <Text style={styles.errorText}>{errors.registrationEnd}</Text>
          )}
        </View>

        {/* Match Start */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Maç Başlangıcı <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.matchStart && styles.inputError]}
            onPress={() => setShowDatePicker('matchStart')}
            activeOpacity={0.7}
          >
            <Clock size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.dateButtonText}>{formatDateTime(matchStartDate)}</Text>
          </TouchableOpacity>
          {errors.matchStart && (
            <Text style={styles.errorText}>{errors.matchStart}</Text>
          )}
        </View>

        {/* Match End */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Maç Bitişi <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.matchEnd && styles.inputError]}
            onPress={() => setShowDatePicker('matchEnd')}
            activeOpacity={0.7}
          >
            <Clock size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.dateButtonText}>{formatDateTime(matchEndDate)}</Text>
          </TouchableOpacity>
          {errors.matchEnd && (
            <Text style={styles.errorText}>{errors.matchEnd}</Text>
          )}
        </View>

        {/* Venue Section */}
        <View style={styles.sectionHeader}>
          <MapPin size={20} color="#16a34a" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Lokasyon & Ödeme</Text>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Konum <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <MapPin size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={[styles.inputWithIconText, errors.location && styles.inputError]}
              value={location}
              onChangeText={setLocation}
              placeholder="Örn: Spor Kompleksi"
              placeholderTextColor="#9CA3AF"
            />
          </View>
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        {/* Google Maps URL */}
        <View style={styles.section}>
          <Text style={styles.label}>Google Maps Linki</Text>
          <TextInput
            style={styles.input}
            value={googleMapsUrl}
            onChangeText={setGoogleMapsUrl}
            placeholder="https://maps.google.com/..."
            placeholderTextColor="#9CA3AF"
            keyboardType="url"
            autoCapitalize="none"
          />
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>Kişi Başı Ücret</Text>
          <View style={styles.inputWithIcon}>
            <DollarSign size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={[
                styles.inputWithIconText,
                errors.pricePerPlayer && styles.inputError,
              ]}
              value={pricePerPlayer}
              onChangeText={setPricePerPlayer}
              placeholder="Örn: 50"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />
            <Text style={styles.currency}>₺</Text>
          </View>
          {errors.pricePerPlayer && (
            <Text style={styles.errorText}>{errors.pricePerPlayer}</Text>
          )}
        </View>

        {/* Bank Account - IBAN */}
        <View style={styles.section}>
          <Text style={styles.label}>IBAN</Text>
          <TextInput
            style={styles.input}
            value={bankAccountIBAN}
            onChangeText={setBankAccountIBAN}
            placeholder="TR00 0000 0000 0000 0000 0000 00"
            placeholderTextColor="#9CA3AF"
            keyboardType="default"
            autoCapitalize="characters"
          />
        </View>

        {/* Bank Account - Account Holder Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Hesap Sahibi</Text>
          <TextInput
            style={styles.input}
            value={bankAccountName}
            onChangeText={setBankAccountName}
            placeholder="Ad Soyad"
            placeholderTextColor="#9CA3AF"
            keyboardType="default"
          />
        </View>

        {/* Squad Section */}
        <View style={styles.sectionHeader}>
          <Users size={20} color="#16a34a" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Kadro Ayarları</Text>
        </View>

        {/* Total Players */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Toplam Oyuncu Sayısı <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <Users size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={[styles.inputWithIconText, errors.totalPlayers && styles.inputError]}
              value={totalPlayers}
              onChangeText={setTotalPlayers}
              placeholder="Örn: 14"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
          </View>
          {errors.totalPlayers && (
            <Text style={styles.errorText}>{errors.totalPlayers}</Text>
          )}
        </View>

        {/* Reserve Players */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Yedek Oyuncu Sayısı <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <UserPlus size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={[styles.inputWithIconText, errors.reservePlayers && styles.inputError]}
              value={reservePlayers}
              onChangeText={setReservePlayers}
              placeholder="Örn: 2"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
          </View>
          {errors.reservePlayers && (
            <Text style={styles.errorText}>{errors.reservePlayers}</Text>
          )}
        </View>

        {/* Min Players to Start */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Başlamak İçin Minimum Oyuncu <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <Users size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={[
                styles.inputWithIconText,
                errors.minPlayersToStart && styles.inputError,
              ]}
              value={minPlayersToStart}
              onChangeText={setMinPlayersToStart}
              placeholder="Örn: 10"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
          </View>
          {errors.minPlayersToStart && (
            <Text style={styles.errorText}>{errors.minPlayersToStart}</Text>
          )}
        </View>

        {/* Friendly Settings (only for friendly matches) */}
        {match.type === MatchType.FRIENDLY && (
          <>
            <View style={styles.sectionHeader}>
              <Info size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Dostluk Maçı Ayarları</Text>
            </View>

            {/* Is Public */}
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>Herkese Açık</Text>
                  <Text style={styles.switchDescription}>
                    {isPublic ? 'Herkes görebilir ve katılabilir' : 'Sadece davet edilenler'}
                  </Text>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={isPublic ? '#16a34a' : '#F3F4F6'}
                />
              </View>
            </View>

            {/* Affects Stats */}
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>İstatistikleri Etkiler</Text>
                  <Text style={styles.switchDescription}>
                    {affectsStats
                      ? 'Oyuncu istatistiklerine sayılır'
                      : 'İstatistiklere sayılmaz'}
                  </Text>
                </View>
                <Switch
                  value={affectsStats}
                  onValueChange={setAffectsStats}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={affectsStats ? '#16a34a' : '#F3F4F6'}
                />
              </View>
            </View>

            {/* Affects Standings */}
            <View style={styles.section}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLabel}>
                  <Text style={styles.label}>Puan Durumunu Etkiler</Text>
                  <Text style={styles.switchDescription}>
                    {affectsStandings ? 'Lig puanlarına sayılır' : 'Puana sayılmaz'}
                  </Text>
                </View>
                <Switch
                  value={affectsStandings}
                  onValueChange={setAffectsStandings}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={affectsStandings ? '#16a34a' : '#F3F4F6'}
                />
              </View>
            </View>
          </>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.7}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#DC2626" />
          ) : (
            <>
              <Trash2 size={20} color="#DC2626" strokeWidth={2} />
              <Text style={styles.deleteButtonText}>Maçı Sil</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Save Button - Fixed Bottom */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={20} color="white" strokeWidth={2} />
              <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal - Stable & Bug-Free */}
      <DateTimePickerModal
        isVisible={showDatePicker !== null}
        mode="datetime"
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        date={
          showDatePicker === 'regStart'
            ? registrationStartDate
            : showDatePicker === 'regEnd'
            ? registrationEndDate
            : showDatePicker === 'matchStart'
            ? matchStartDate
            : matchEndDate
        }
        minimumDate={new Date()}
        locale="tr_TR"
        confirmTextIOS="Tamam"
        cancelTextIOS="İptal"
      />
    </View>
  );
};

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
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#DC2626',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  currency: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  switchLabel: {
    flex: 1,
  },
  switchDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 12,
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },
  bottomSpacing: {
    height: 100,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});