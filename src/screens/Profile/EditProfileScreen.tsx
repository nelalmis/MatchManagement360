import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Calendar,
  Award,
  Save,
} from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import { playerService } from '../../services/playerService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigationContext();
  const { user, setUser } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    position: user?.position || '',
    jerseyNumber: user?.jerseyNumber || '',
    birthDate: user?.birthDate ? new Date(user.birthDate) : new Date(),
  });

  const positions = [
    { label: 'Pozisyon Seçiniz', value: '' },
    { label: 'Kaleci', value: 'Kaleci' },
    { label: 'Defans', value: 'Defans' },
    { label: 'Orta Saha', value: 'Orta Saha' },
    { label: 'Forvet', value: 'Forvet' },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleSave = async () => {
    // Validasyon
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin');
      return;
    }
    if (!formData.surname.trim()) {
      Alert.alert('Hata', 'Lütfen soyadınızı girin');
      return;
    }
    if (!formData.position) {
      Alert.alert('Hata', 'Lütfen pozisyon seçin');
      return;
    }

    setLoading(true);
    try {
      const updatedUser:any = {
        ...user,
        name: formData.name,
        surname: formData.surname,
        position: formData.position,
        jerseyNumber: formData.jerseyNumber,
        birthDate: formData.birthDate.toISOString(),
      };

      // Firestore'a kaydet
      await playerService.update(user?.id, updatedUser);

      // Local storage'ı güncelle
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));

      // Context'i güncelle
      setUser(updatedUser);

      Alert.alert(
        'Başarılı!',
        'Profil bilgileriniz güncellendi.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Hata', 'Güncelleme başarısız. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#16a34a" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          {/* <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <ArrowLeft color="white" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profili Düzenle</Text>
            <View style={styles.headerSpacer} />
          </View> */}

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {formData.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.changePhotoButton}
              activeOpacity={0.7}
            >
              <Text style={styles.changePhotoText}>Fotoğraf Değiştir</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Ad */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Ad *</Text>
              <View style={styles.inputWrapper}>
                <User color="#6B7280" size={18} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(val) =>
                    setFormData({ ...formData, name: val })
                  }
                  placeholder="Adınızı girin"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Soyad */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Soyad *</Text>
              <View style={styles.inputWrapper}>
                <User color="#6B7280" size={18} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  value={formData.surname}
                  onChangeText={(val) =>
                    setFormData({ ...formData, surname: val })
                  }
                  placeholder="Soyadınızı girin"
                  placeholderTextColor="#9CA3AF"
                  editable={!loading}
                />
              </View>
            </View>

            {/* Pozisyon */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pozisyon *</Text>
              <View style={styles.pickerWrapper}>
                <View style={styles.pickerIconContainer}>
                  <Award color="#16a34a" size={20} strokeWidth={2} />
                </View>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.position}
                    onValueChange={(val: any) =>
                      setFormData({ ...formData, position: val })
                    }
                    style={styles.picker}
                    enabled={!loading}
                  >
                    {positions.map((pos) => (
                      <Picker.Item
                        key={pos.value}
                        label={pos.label}
                        value={pos.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Forma Numarası */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Forma Numarası</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.hashSymbol}>#</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={formData.jerseyNumber}
                  onChangeText={(val) => {
                    if (/^\d{0,2}$/.test(val)) {
                      setFormData({ ...formData, jerseyNumber: val });
                    }
                  }}
                  placeholder="10"
                  placeholderTextColor="#9CA3AF"
                  maxLength={2}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Doğum Tarihi */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Doğum Tarihi</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => !loading && setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Calendar color="#6B7280" size={18} strokeWidth={2} />
                <Text style={styles.dateText}>
                  {formatDate(formData.birthDate)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.birthDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event: any, selectedDate: any) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData({ ...formData, birthDate: selectedDate });
                    }
                  }}
                />
              )}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <Text style={styles.infoText}>
                * ile işaretli alanlar zorunludur
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!formData.name.trim() ||
                    !formData.surname.trim() ||
                    !formData.position ||
                    loading) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={
                  !formData.name.trim() ||
                  !formData.surname.trim() ||
                  !formData.position ||
                  loading
                }
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Save color="white" size={20} strokeWidth={2.5} />
                    <Text style={styles.saveButtonText}>Kaydet</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16a34a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  avatarSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: 'white',
  },
  changePhotoButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    height: 56,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 0,
  },
  hashSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  pickerIconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  pickerContainer: {
    flex: 1,
  },
  picker: {
    height: 50,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#4338CA',
    flex: 1,
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelButton: {
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});