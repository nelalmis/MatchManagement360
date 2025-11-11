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
  Modal,
  Pressable,
  Animated,
  Image,
} from 'react-native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  Check,
  Image as ImageIcon,
} from 'lucide-react-native';

import { PlayerService } from '../../../services/serviceLayer/playerService';
import { useAuth } from '../../../hooks';
import { CustomHeader } from '../../../components/CustomHeader';
import { IPlayer, SportType } from '../../../types/entity/types';
import { sportThemes } from '../../../utils/theme';
import { goBack } from '../../../navigation';
import { LoadingScreen } from '../../Common';

// ============================================
// HELPER FUNCTIONS
// ============================================
const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Turkish phone format: +90 (5XX) XXX XX XX
  if (digits.startsWith('90')) {
    const phone = digits.substring(2);
    if (phone.length <= 3) return `+90 (${phone}`;
    if (phone.length <= 6) return `+90 (${phone.slice(0, 3)}) ${phone.slice(3)}`;
    if (phone.length <= 8) return `+90 (${phone.slice(0, 3)}) ${phone.slice(3, 6)} ${phone.slice(6)}`;
    return `+90 (${phone.slice(0, 3)}) ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8, 10)}`;
  } else if (digits.startsWith('0')) {
    const phone = digits.substring(1);
    if (phone.length <= 3) return `+90 (${phone}`;
    if (phone.length <= 6) return `+90 (${phone.slice(0, 3)}) ${phone.slice(3)}`;
    if (phone.length <= 8) return `+90 (${phone.slice(0, 3)}) ${phone.slice(3, 6)} ${phone.slice(6)}`;
    return `+90 (${phone.slice(0, 3)}) ${phone.slice(3, 6)} ${phone.slice(6, 8)} ${phone.slice(8, 10)}`;
  } else {
    if (digits.length <= 3) return `+90 (${digits}`;
    if (digits.length <= 6) return `+90 (${digits.slice(0, 3)}) ${digits.slice(3)}`;
    if (digits.length <= 8) return `+90 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6)}`;
    return `+90 (${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  }
};

const getPhoneDigits = (formattedPhone: string) => {
  // Extract only digits and remove country code
  const digits = formattedPhone.replace(/\D/g, '');
  // Remove +90 or 90 prefix
  if (digits.startsWith('90')) {
    return digits.substring(2);
  }
  return digits;
};

const isValidPhone = (formattedPhone: string) => {
  const digits = getPhoneDigits(formattedPhone);
  // Turkish mobile numbers: 10 digits starting with 5
  return /^5\d{9}$/.test(digits);
};

export const EditProfileScreen: React.FC = () => {
  // Alert.alert('Düzenleme Ekranı', 'Bu ekran düzenleme için kullanılır.');
  const { user, updateProfile } = useAuth();
  console.log('EditProfileScreen - Current user:', user.favoriteSports);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [surname, setSurname] = useState(user?.surname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(
    user?.phone ? formatPhoneNumber(user.phone) : ''
  );
  const [profilePhoto, setProfilePhoto] = useState(user?.profilePhoto || '');
  const [jerseyNumber, setJerseyNumber] = useState(user?.jerseyNumber || '');
  const [birthDate, setBirthDate] = useState(
    user?.birthDate ? new Date(user.birthDate) : new Date(2000, 0, 1)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [favoriteSports, setFavoriteSports] = useState<SportType[]>(
    user?.favoriteSports || []
  );
  const [sportPositions, setSportPositions] = useState<Partial<Record<SportType, string[]>>>(
    user?.sportPositions || {}
  );

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSport, setSelectedSport] = useState<SportType | null>(null);
  const [slideAnim] = useState(new Animated.Value(0));

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhone(formatted);
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

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

    if (phone && !isValidPhone(phone)) {
      newErrors.phone = 'Geçerli bir telefon numarası girin (5XX XXX XX XX)';
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
        phone: phone ? getPhoneDigits(phone) : undefined,
        profilePhoto: profilePhoto || undefined,
        jerseyNumber: jerseyNumber || undefined,
        birthDate: birthDate.toISOString(),
        favoriteSports,
        sportPositions,
      };

      const result = await updateProfile(updates);

      if (result.success) {
        Alert.alert('Başarılı', 'Profil güncellendi', [
          {
            text: 'Tamam',
            onPress: () => goBack(),
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
  ]);

  const handleCancel = useCallback(() => {
    goBack();
  }, []);

  const pickImageFromGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        includeBase64: false,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
        return;
      }

      if (result.assets && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri || '');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        includeBase64: false,
        cameraType: 'front',
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        if (result.errorCode === 'camera_unavailable') {
          Alert.alert('Hata', 'Kamera kullanılamıyor');
        } else if (result.errorCode === 'permission') {
          Alert.alert('İzin Gerekli', 'Kamera erişim izni gerekiyor');
        } else {
          Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu');
        }
        return;
      }

      if (result.assets && result.assets[0]) {
        setProfilePhoto(result.assets[0].uri || '');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Profil Fotoğrafı',
      'Fotoğraf seçmek için bir yöntem seçin',
      [
        {
          text: 'Kameradan Çek',
          onPress: takePhoto,
        },
        {
          text: 'Galeriden Seç',
          onPress: pickImageFromGallery,
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

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

  const openPositionModal = useCallback((sport: SportType) => {
    setSelectedSport(sport);
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, []);

  const closePositionModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedSport(null);
    });
  }, []);

  const togglePosition = useCallback((position: string) => {
    if (!selectedSport) return;

    setSportPositions((prev) => {
      const currentPositions = prev[selectedSport] || [];

      if (currentPositions.includes(position)) {
        // Remove position
        return {
          ...prev,
          [selectedSport]: currentPositions.filter(p => p !== position),
        };
      } else {
        // Add position
        return {
          ...prev,
          [selectedSport]: [...currentPositions, position],
        };
      }
    });
  }, [selectedSport]);

  const handleSelectBirthDate = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  // Get locale from user preference or default to Turkish
  const getLocale = () => {
    const languageMap: Record<string, string> = {
      'tr': 'tr-TR',
      'en': 'en-US',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'es': 'es-ES',
    };
    return languageMap[user?.language || 'tr'] || 'tr-TR';
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <CustomHeader
        title="Profili Düzenle"
        showMenu={false}
        showClose={true}
        onLeftPress={handleCancel}
        showSave={true}
        onSavePress={handleSave}
        disableSave={saving}
        loading={saving}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Photo */}
        {/* <View style={styles.photoSection}>
          <TouchableOpacity onPress={showImageOptions} activeOpacity={0.9}>
            <View style={styles.avatar}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
              ) : (
                <User size={48} color="white" strokeWidth={2} />
              )}
            </View>
            <View style={styles.photoButton}>
              <Camera size={16} color="white" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>
          <Text style={styles.photoText}>Fotoğraf Değiştir</Text>
        </View> */}

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
              editable={false} // Email is not editable
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
              onChangeText={handlePhoneChange}
              placeholder="+90 (5XX) XXX XX XX"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={20}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ek Bilgiler</Text>

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
            {errors.jerseyNumber && <Text style={styles.errorText}>{errors.jerseyNumber}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <Calendar size={18} color="#6B7280" strokeWidth={2} />
              <Text style={styles.labelText}>Doğum Tarihi</Text>
            </View>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={handleSelectBirthDate}
              activeOpacity={0.7}
            >
              <Text style={styles.dateButtonText}>
                {formatDate(birthDate)}
              </Text>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={birthDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1950, 0, 1)}
                locale={getLocale()}
              />
            )}
          </View>
        </View>

        {/* Sports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spor Dalları</Text>
          <Text style={styles.sectionDescription}>
            İlgilendiğiniz sporları seçin
          </Text>

          <View style={styles.sportsGrid}>
            {(Object.keys(sportThemes) as SportType[]).map((sport) => {
              const config = sportThemes[sport];
              const isSelected = favoriteSports.includes(sport);

              return (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportCard,
                    isSelected && {
                      borderColor: config.primary,
                      backgroundColor: `${config.primary}10`,
                    },
                  ]}
                  onPress={() => toggleFavoriteSport(sport)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sportCardEmoji}>{config.emoji}</Text>
                  <Text
                    style={[
                      styles.sportCardName,
                      isSelected && { color: config.primary },
                    ]}
                  >
                    {config.label}
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
              const config = sportThemes[sport];
              const positions = sportPositions[sport] || [];
              const hasPositions = config.positions.length > 0;

              return (
                <TouchableOpacity
                  key={sport}
                  style={styles.positionCard}
                  onPress={() => hasPositions && openPositionModal(sport)}
                  disabled={!hasPositions}
                  activeOpacity={0.7}
                >
                  <View style={styles.positionCardLeft}>
                    <Text style={styles.sportCardEmoji}>{config.emoji}</Text>
                    <View style={styles.positionCardInfo}>
                      <Text style={styles.positionCardTitle}>{config.label}</Text>
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

      {/* Position Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={closePositionModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closePositionModal}>
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY }] }
            ]}
          >
            <Pressable>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalHandle} />
                <View style={styles.modalTitleContainer}>
                  {selectedSport && (
                    <>
                      <Text style={styles.modalEmoji}>
                        {sportThemes[selectedSport].emoji}
                      </Text>
                      <Text style={styles.modalTitle}>
                        {sportThemes[selectedSport].label} Pozisyonları
                      </Text>
                    </>
                  )}
                </View>
                <Text style={styles.modalSubtitle}>
                  Birden fazla pozisyon seçebilirsin
                </Text>
              </View>

              {/* Positions List */}
              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.positionsGrid}>
                  {selectedSport && sportThemes[selectedSport].positions.map((position) => {
                    const isSelected = sportPositions[selectedSport]?.includes(position) || false;

                    return (
                      <TouchableOpacity
                        key={position}
                        style={[
                          styles.positionOption,
                          isSelected && styles.positionOptionSelected
                        ]}
                        onPress={() => togglePosition(position)}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.positionOptionText,
                          isSelected && styles.positionOptionTextSelected
                        ]}>
                          {position}
                        </Text>
                        {isSelected && (
                          <Check size={20} color="#16a34a" strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={closePositionModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonText}>Tamam</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
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
  dateButtonText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingTop: 8,
  },
  modalHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modalEmoji: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalScroll: {
    maxHeight: 400,
  },
  positionsGrid: {
    padding: 24,
    gap: 12,
  },
  positionOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  positionOptionSelected: {
    borderColor: '#16a34a',
    backgroundColor: '#F0FDF4',
  },
  positionOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  positionOptionTextSelected: {
    color: '#16a34a',
  },
  modalFooter: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalButton: {
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default EditProfileScreen;