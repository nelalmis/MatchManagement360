import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Hash,
  Save,
  X,
  ChevronRight,
  Camera,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import {
  IPlayer,
  SportType,
  SPORT_CONFIGS,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { playerService } from '../../services/playerService';
import { NavigationService } from '../../navigation/NavigationService';

export const EditProfileScreen: React.FC = () => {
  const { user, setUser } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [jerseyNumber, setJerseyNumber] = useState(user?.jerseyNumber || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [favoriteSports, setFavoriteSports] = useState<SportType[]>(
    user?.favoriteSports || []
  );
  const [sportPositions, setSportPositions] = useState<Partial<Record<SportType, string[]>>>(
    user?.sportPositions || {}
  );

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Ad zorunludur';
    }

    if (!surname.trim()) {
      newErrors.surname = 'Soyad zorunludur';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (phone && !/^[0-9]{10,11}$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Geçerli bir telefon numarası girin';
    }

    if (jerseyNumber && !/^[0-9]{1,3}$/.test(jerseyNumber)) {
      newErrors.jerseyNumber = 'Geçerli bir forma numarası girin (1-999)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, surname, email, phone, jerseyNumber]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doğru şekilde doldurun');
      return;
    }

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      return;
    }

    try {
      setSaving(true);

      const updates: Partial<IPlayer> = {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim() || undefined,
        phone: phone.replace(/\s/g, '') || undefined,
        jerseyNumber: jerseyNumber || undefined,
        birthDate: birthDate || undefined,
        favoriteSports,
        sportPositions,
      };

      const result = await playerService.update(user.id, updates);

      if (result.success) {
        // Update context
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);

        Alert.alert('Başarılı', 'Profil güncellendi', [
          {
            text: 'Tamam',
            onPress: () => NavigationService.goBack(),
          },
        ]);
      } else {
        throw new Error('Profil güncellenemedi');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Hata', 'Profil güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  }, [
    user,
    name,
    surname,
    email,
    phone,
    jerseyNumber,
    birthDate,
    favoriteSports,
    sportPositions,
    validateForm,
    setUser,
  ]);

  const handleCancel = useCallback(() => {
    NavigationService.goBack();
  }, []);

  const toggleFavoriteSport = useCallback((sport: SportType) => {
    setFavoriteSports((prev) => {
      if (prev.includes(sport)) {
        // Remove sport and its positions
        setSportPositions((prevPositions) => {
          const newPositions = { ...prevPositions };
          delete newPositions[sport];
          return newPositions;
        });
        return prev.filter((s) => s !== sport);
      } else {
        return [...prev, sport];
      }
    });
  }, []);

  const handleSelectPositions = useCallback((sport: SportType) => {
    // NavigationService.navigateToSelectPositions(
    //   sport,
    //   sportPositions[sport] || [],
    //   (positions: string[]) => {
    //     setSportPositions((prev) => ({
    //       ...prev,
    //       [sport]: positions,
    //     }));
    //   });
  }, [sportPositions]);

  const handleSelectBirthDate = useCallback(() => {
    // TODO: Implement date picker
    Alert.alert('Yakında', 'Tarih seçici eklenecek');
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <X size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profili Düzenle</Text>
        <TouchableOpacity
          style={[styles.headerButton, saving && styles.headerButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : (
            <Save size={24} color="#16a34a" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.avatar}>
            <User size={48} color="white" strokeWidth={2} />
          </View>
          <TouchableOpacity style={styles.photoButton} activeOpacity={0.7}>
            <Camera size={16} color="white" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.photoText}>Fotoğraf Değiştir</Text>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <User size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.labelText}>Ad *</Text>
            </View>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="Adınız"
              placeholderTextColor="#9CA3AF"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <User size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.labelText}>Soyad *</Text>
            </View>
            <TextInput
              style={[styles.input, errors.surname && styles.inputError]}
              value={surname}
              onChangeText={setSurname}
              placeholder="Soyadınız"
              placeholderTextColor="#9CA3AF"
            />
            {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <Mail size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.labelText}>E-posta</Text>
            </View>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <Phone size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.labelText}>Telefon</Text>
            </View>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="5XX XXX XX XX"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <Hash size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.labelText}>Forma Numarası</Text>
            </View>
            <TextInput
              style={[styles.input, errors.jerseyNumber && styles.inputError]}
              value={jerseyNumber}
              onChangeText={setJerseyNumber}
              placeholder="10"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={3}
            />
            {errors.jerseyNumber && (
              <Text style={styles.errorText}>{errors.jerseyNumber}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={handleSelectBirthDate}
            activeOpacity={0.7}
          >
            <View style={styles.inputLabel}>
              <Calendar size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.labelText}>Doğum Tarihi</Text>
            </View>
            <View style={styles.dateButtonRight}>
              <Text style={styles.dateButtonText}>
                {birthDate
                  ? new Date(birthDate).toLocaleDateString('tr-TR')
                  : 'Seçiniz'}
              </Text>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Favorite Sports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favori Sporlar</Text>
          <Text style={styles.sectionDescription}>
            İlgilendiğiniz sporları seçin
          </Text>

          <View style={styles.sportsGrid}>
            {(Object.keys(SPORT_CONFIGS) as SportType[]).map((sport) => {
              const isSelected = favoriteSports.includes(sport);
              const config = SPORT_CONFIGS[sport];

              return (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportCard,
                    isSelected && {
                      backgroundColor: config.color + '20',
                      borderColor: config.color,
                    },
                  ]}
                  onPress={() => toggleFavoriteSport(sport)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sportCardEmoji}>{config.emoji}</Text>
                  <Text
                    style={[
                      styles.sportCardName,
                      isSelected && { color: config.color },
                    ]}
                  >
                    {config.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sport Positions */}
        {favoriteSports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pozisyonlar</Text>
            <Text style={styles.sectionDescription}>
              Her spor için oynadığınız pozisyonları seçin
            </Text>

            {favoriteSports.map((sport) => {
              const config = SPORT_CONFIGS[sport];
              const positions = sportPositions[sport] || [];
              const hasPositions = config.positions.length > 0;

              return (
                <TouchableOpacity
                  key={sport}
                  style={styles.positionCard}
                  onPress={() => hasPositions && handleSelectPositions(sport)}
                  disabled={!hasPositions}
                  activeOpacity={0.7}
                >
                  <View style={styles.positionCardLeft}>
                    <Text style={styles.sportCardEmoji}>{config.emoji}</Text>
                    <View style={styles.positionCardInfo}>
                      <Text style={styles.positionCardTitle}>{config.name}</Text>
                      {hasPositions ? (
                        <Text style={styles.positionCardSubtitle}>
                          {positions.length > 0
                            ? positions.join(', ')
                            : 'Pozisyon seçiniz'}
                        </Text>
                      ) : (
                        <Text style={styles.positionCardSubtitle}>
                          Bu sporda pozisyon yok
                        </Text>
                      )}
                    </View>
                  </View>
                  {hasPositions && (
                    <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    fontWeight: '500',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
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
  headerButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  photoButton: {
    position: 'absolute',
    top: 32,
    right: '50%',
    marginRight: -60,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  photoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 8,
  },
  section: {
    marginTop: 16,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateButtonText: {
    fontSize: 15,
    color: '#6B7280',
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  sportCardEmoji: {
    fontSize: 32,
  },
  sportCardName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  positionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  positionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  positionCardInfo: {
    flex: 1,
  },
  positionCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  positionCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 32,
  },
});