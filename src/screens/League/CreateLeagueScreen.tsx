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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Trophy,
  FileSpreadsheet,
  Plus,
  X,
  Save,
  UserPlus,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import { ILeague, SportType, getSportIcon, getSportColor } from '../../types/types';

export const CreateLeagueScreen: React.FC = () => {
  const { user } = useAppContext();
  const navigation = useNavigationContext();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    sportType: '' as SportType | '',
    spreadSheetId: '',
    playerPhones: [''],
  });

  const availableSports: SportType[] = ['Futbol', 'Basketbol', 'Voleybol', 'Tenis', 'Masa Tenisi', 'Badminton'];

  const handleAddPhoneField = () => {
    setFormData({
      ...formData,
      playerPhones: [...formData.playerPhones, ''],
    });
  };

  const handleRemovePhoneField = (index: number) => {
    const newPhones = formData.playerPhones.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      playerPhones: newPhones.length > 0 ? newPhones : [''],
    });
  };

  const handlePhoneChange = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');
    const newPhones = [...formData.playerPhones];
    newPhones[index] = cleaned;
    setFormData({
      ...formData,
      playerPhones: newPhones,
    });
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8, 10)}`;
  };

  const handleCreateLeague = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Hata', 'Lütfen lig adı girin');
      return;
    }

    if (!formData.sportType) {
      Alert.alert('Hata', 'Lütfen spor türü seçin');
      return;
    }

    const validPhones = formData.playerPhones.filter((phone) => phone.length === 10);

    setLoading(true);
    try {
      const newLeague: any = {
        id: Date.now().toString(),
        title: formData.title,
        sportType: formData.sportType as SportType,
        spreadSheetId: formData.spreadSheetId || '',
        matchFixtures: [],
        playerIds: validPhones.map((phone) => `player_${phone}`),
      };

      console.log('Creating league:', newLeague);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert(
        'Başarılı!',
        'Lig oluşturuldu. Şimdi fikstür ekleyebilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => navigation.navigate('myLeagues'),
          },
        ]
      );
    } catch (error) {
      console.error('Create league error:', error);
      Alert.alert('Hata', 'Lig oluşturulamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'İptal Et',
      'Değişiklikler kaydedilmeyecek. Emin misiniz?',
      [
        { text: 'Devam Et', style: 'cancel' },
        { text: 'İptal Et', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <Trophy color="#16a34a" size={28} strokeWidth={2} />
          </View>
          <Text style={styles.headerTitle}>Yeni Lig Oluştur</Text>
          <Text style={styles.headerSubtitle}>
            Düzenli maçlarınız için bir lig oluşturun ve oyuncuları davet edin
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Spor Türü */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Spor Türü *</Text>
            <View style={styles.sportSelector}>
              {availableSports.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportOption,
                    formData.sportType === sport && styles.sportOptionActive,
                    formData.sportType === sport && {
                      borderColor: getSportColor(sport),
                      backgroundColor: `${getSportColor(sport)}15`,
                    },
                  ]}
                  onPress={() => setFormData({ ...formData, sportType: sport })}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sportEmoji}>{getSportIcon(sport)}</Text>
                  <Text
                    style={[
                      styles.sportLabel,
                      formData.sportType === sport && {
                        color: getSportColor(sport),
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.helperText}>Liginizin spor türünü seçin</Text>
          </View>

          {/* Lig Adı */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Lig Adı *</Text>
            <View style={styles.inputWrapper}>
              <Trophy color="#6B7280" size={18} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(val) => setFormData({ ...formData, title: val })}
                placeholder="Örn: Architect Halı Saha Ligi"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>
            <Text style={styles.helperText}>
              Liginizi tanımlayan benzersiz bir isim verin
            </Text>
          </View>

          {/* Google Sheets ID */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Google Sheets ID (Opsiyonel)</Text>
            <View style={styles.inputWrapper}>
              <FileSpreadsheet color="#6B7280" size={18} strokeWidth={2} />
              <TextInput
                style={styles.input}
                value={formData.spreadSheetId}
                onChangeText={(val) => setFormData({ ...formData, spreadSheetId: val })}
                placeholder="Spreadsheet ID'nizi girin"
                placeholderTextColor="#9CA3AF"
                editable={!loading}
              />
            </View>
            <Text style={styles.helperText}>
              Lig verilerini Google Sheets'e bağlamak için
            </Text>
          </View>

          {/* Oyuncu Davet */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Oyuncu Davet Et</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddPhoneField}
                disabled={loading}
                activeOpacity={0.7}
              >
                <UserPlus color="#16a34a" size={18} strokeWidth={2} />
                <Text style={styles.addButtonText}>Ekle</Text>
              </TouchableOpacity>
            </View>

            {formData.playerPhones.map((phone, index) => (
              <View key={index} style={styles.phoneInputRow}>
                <View style={[styles.inputWrapper, styles.phoneInputWrapper]}>
                  <Text style={styles.countryCode}>🇹🇷 +90</Text>
                  <TextInput
                    style={[styles.input, styles.phoneInput]}
                    value={formatPhoneNumber(phone)}
                    onChangeText={(text) => handlePhoneChange(text, index)}
                    placeholder="5XX XXX XX XX"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    maxLength={13}
                    editable={!loading}
                  />
                </View>
                {formData.playerPhones.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemovePhoneField(index)}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <X color="#DC2626" size={20} strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <Text style={styles.helperText}>
              Davet göndermek istediğiniz oyuncuların telefon numaralarını girin
            </Text>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoText}>
                Lig oluşturduktan sonra fikstür ekleyebilir ve detaylı ayarlar yapabilirsiniz.
              </Text>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.createButton,
                (!formData.title.trim() || !formData.sportType || loading) &&
                  styles.createButtonDisabled,
              ]}
              onPress={handleCreateLeague}
              disabled={!formData.title.trim() || !formData.sportType || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <Save color="white" size={20} strokeWidth={2.5} />
                  <Text style={styles.createButtonText}>Lig Oluştur</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: 'white',
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  formContainer: {
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  sportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    gap: 8,
    width: '47%',
  },
  sportOptionActive: {
    borderWidth: 2,
  },
  sportEmoji: {
    fontSize: 24,
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
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
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
    marginLeft: 4,
    lineHeight: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  phoneInput: {
    fontSize: 16,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
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
  infoTextContainer: {
    flex: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
  },
  createButton: {
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
  createButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
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