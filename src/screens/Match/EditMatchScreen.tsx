// screens/Match/EditMatchScreen.tsx

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
} from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { matchService } from '../../services/matchService';
import { IMatch } from '../../types/types';
import { RootStackParamList, NavigationService, EditMatchRouteProp } from '../../navigation';
import DateTimePicker from '@react-native-community/datetimepicker';


export const EditMatchScreen: React.FC = () => {
  const { user } = useAppContext();
  const route = useRoute<EditMatchRouteProp>();
  const { matchId } = route.params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Match data
  const [match, setMatch] = useState<IMatch | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [pricePerPlayer, setPricePerPlayer] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // DatePicker states
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      const matchData = await matchService.getById(matchId);

      if (!matchData) {
        Alert.alert('Hata', 'Maç bulunamadı');
        NavigationService.goBack();
        return;
      }

      // Check permissions
      if (matchData.createdAt !== user?.id) {
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
    setLocation(matchData.location || "");
    // setMaxPlayers(matchData.staffPlayerCount.toString());
    // setPricePerPlayer(matchData.pricePerPlayer.toString());
    // setDescription(matchData.description || '');
    // setIsActive(matchData.status === 'Aktif');

    const matchDate = new Date(matchData.matchStartTime);
    setDate(matchDate);
    setTime(matchDate);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Maç başlığı gerekli';
    }

    if (!location.trim()) {
      newErrors.location = 'Konum gerekli';
    }

    const maxPlayersNum = parseInt(maxPlayers);
    if (!maxPlayers || isNaN(maxPlayersNum) || maxPlayersNum < 2) {
      newErrors.maxPlayers = 'En az 2 oyuncu olmalı';
    }

    const priceNum = parseFloat(pricePerPlayer);
    if (!pricePerPlayer || isNaN(priceNum) || priceNum < 0) {
      newErrors.pricePerPlayer = 'Geçerli bir fiyat girin';
    }

    const combinedDateTime = new Date(date);
    combinedDateTime.setHours(time.getHours());
    combinedDateTime.setMinutes(time.getMinutes());

    if (combinedDateTime <= new Date()) {
      newErrors.date = 'Geçmiş bir tarih seçemezsiniz';
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

      const combinedDateTime = new Date(date);
      combinedDateTime.setHours(time.getHours());
      combinedDateTime.setMinutes(time.getMinutes());

      const updatedMatch: Partial<IMatch> = {
        title: title.trim(),
        location: location.trim(),
        matchStartTime: combinedDateTime,
        // staffPlayerCount: parseInt(maxPlayers),
        pricePerPlayer: parseFloat(pricePerPlayer),
        // description: description.trim(),
        // status: isActive ? '' : 'Pasif',
        updatedAt: new Date().toISOString(),
      };

      await matchService.update(matchId, updatedMatch);

      Alert.alert('Başarılı', 'Maç başarıyla güncellendi', [
        {
          text: 'Tamam',
          onPress: () => {
            NavigationService.goBack();
          },
        },
      ]);
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
      await matchService.delete(matchId);

      Alert.alert('Başarılı', 'Maç başarıyla silindi', [
        {
          text: 'Tamam',
          onPress: () => {
            NavigationService.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Error deleting match:', error);
      Alert.alert('Hata', 'Maç silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('tr-TR', {
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Tarih <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.dateButton, errors.date && styles.inputError]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Calendar size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.dateButtonText}>{formatDate(date)}</Text>
          </TouchableOpacity>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Time */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Saat <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.7}
          >
            <Clock size={20} color="#6B7280" strokeWidth={2} />
            <Text style={styles.dateButtonText}>{formatTime(time)}</Text>
          </TouchableOpacity>
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

        {/* Max Players */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Oyuncu Sayısı <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.inputWithIcon}>
            <Users size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={[styles.inputWithIconText, errors.maxPlayers && styles.inputError]}
              value={maxPlayers}
              onChangeText={setMaxPlayers}
              placeholder="Örn: 14"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
            />
          </View>
          {errors.maxPlayers && (
            <Text style={styles.errorText}>{errors.maxPlayers}</Text>
          )}
        </View>

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Kişi Başı Ücret <Text style={styles.required}>*</Text>
          </Text>
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

        {/* Status */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Maç Durumu</Text>
              <Text style={styles.switchDescription}>
                {isActive ? 'Maç aktif' : 'Maç pasif'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
              thumbColor={isActive ? '#16a34a' : '#F3F4F6'}
            />
          </View>
        </View>

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

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={onTimeChange}
          is24Hour={true}
        />
      )}
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
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
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
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