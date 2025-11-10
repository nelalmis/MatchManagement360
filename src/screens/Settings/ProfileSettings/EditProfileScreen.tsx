// src/screens/Settings/ProfileSettings/ProfileSettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { User, Mail, Phone, MapPin, Calendar, Edit2 } from 'lucide-react-native';
// import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsItem } from '../components/SettingsItem';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { CustomHeader } from '../../../components/CustomHeader';
import { goBack } from '../../../navigation';

export const ProfileSettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await UserSettingsService.getUserSettings(user.id);

      if (result.success && result.data) {
        setSettings(result.data);
        setDisplayName(result.data.profile.displayName || '');
        setBio(result.data.profile.bio || '');
      }
    } catch (error) {
      console.error('Settings load error:', error);
      Alert.alert('Hata', 'Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDisplayName = async () => {
    if (!user?.id || !displayName.trim()) {
      Alert.alert('Hata', 'Lütfen bir isim girin');
      return;
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.setDisplayName(
        user.id,
        displayName.trim()
      );

      if (result.success && result.data) {
        setSettings(result.data);
        setIsEditingDisplayName(false);
        Alert.alert('Başarılı', 'İsim güncellendi');
      } else {
        Alert.alert('Hata', result.error?.message || 'İsim güncellenemedi');
      }
    } catch (error) {
      console.error('Save display name error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBio = async () => {
    if (!user?.id) return;

    if (bio.length > 200) {
      Alert.alert('Hata', 'Biyografi 200 karakterden uzun olamaz');
      return;
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.setBio(user.id, bio.trim());

      if (result.success && result.data) {
        setSettings(result.data);
        setIsEditingBio(false);
        Alert.alert('Başarılı', 'Biyografi güncellendi');
      } else {
        Alert.alert('Hata', result.error?.message || 'Biyografi güncellenemedi');
      }
    } catch (error) {
      console.error('Save bio error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShowEmail = async (value: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateProfile(user.id, {
        showEmail: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Toggle email error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShowPhone = async (value: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateProfile(user.id, {
        showPhone: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Toggle phone error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShowBirthDate = async (value: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateProfile(user.id, {
        showBirthDate: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Toggle birth date error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShowLocation = async (value: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateProfile(user.id, {
        showLocation: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Toggle location error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleShowSocialMedia = async (value: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateProfile(user.id, {
        showSocialMedia: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Toggle social media error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAllowProfileSearch = async (value: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateProfile(user.id, {
        allowProfileSearch: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      }
    } catch (error) {
      console.error('Toggle profile search error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Profil Ayarları"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Profil Ayarları"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Profil Ayarları"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Info Section */}
        <SettingsSection
          title="Temel Bilgiler"
          footer="Bu bilgiler profilinizde görünür"
        >
          {/* Display Name */}
          <View style={styles.editableItem}>
            <View style={styles.editableHeader}>
              <View style={styles.editableLeft}>
                <User size={20} color="#16a34a" strokeWidth={2} />
                <Text style={styles.editableLabel}>Görünür İsim</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditingDisplayName(!isEditingDisplayName)}
                disabled={saving}
              >
                <Edit2 size={18} color="#16a34a" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {isEditingDisplayName ? (
              <View style={styles.editableContent}>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="İsminizi girin"
                  maxLength={50}
                  editable={!saving}
                />
                <View style={styles.editableActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setDisplayName(settings.profile.displayName || '');
                      setIsEditingDisplayName(false);
                    }}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      saving && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSaveDisplayName}
                    disabled={saving || !displayName.trim()}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.saveButtonText}>Kaydet</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.editableContent}>
                <Text style={styles.editableValue}>
                  {settings.profile.displayName || 'Belirlenmedi'}
                </Text>
              </View>
            )}
          </View>

          {/* Bio */}
          <View style={[styles.editableItem, styles.noBorder]}>
            <View style={styles.editableHeader}>
              <View style={styles.editableLeft}>
                <Text style={styles.editableLabel}>Biyografi</Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsEditingBio(!isEditingBio)}
                disabled={saving}
              >
                <Edit2 size={18} color="#16a34a" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {isEditingBio ? (
              <View style={styles.editableContent}>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Kendiniz hakkında kısa bir açıklama (max 200 karakter)"
                  maxLength={200}
                  multiline
                  numberOfLines={4}
                  editable={!saving}
                />
                <Text style={styles.characterCount}>
                  {bio.length}/200 karakter
                </Text>
                <View style={styles.editableActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setBio(settings.profile.bio || '');
                      setIsEditingBio(false);
                    }}
                    disabled={saving}
                  >
                    <Text style={styles.cancelButtonText}>İptal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      saving && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSaveBio}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.saveButtonText}>Kaydet</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.editableContent}>
                <Text style={styles.editableValue}>
                  {settings.profile.bio || 'Henüz eklenmedi'}
                </Text>
              </View>
            )}
          </View>
        </SettingsSection>

        {/* Account Info Section */}
        <SettingsSection
          title="Hesap Bilgileri"
          footer="Bu bilgiler değiştirilemez"
        >
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Mail size={20} color="#3B82F6" strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>{user?.email || 'Belirlenmedi'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Phone size={20} color="#10B981" strokeWidth={2} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Telefon</Text>
              <Text style={styles.infoValue}>{user?.phone || 'Belirlenmedi'}</Text>
            </View>
          </View>

          {user?.city && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MapPin size={20} color="#EF4444" strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Şehir</Text>
                <Text style={styles.infoValue}>{user.city}</Text>
              </View>
            </View>
          )}

          {user?.birthDate && (
            <View style={[styles.infoItem, styles.noBorder]}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color="#F59E0B" strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Doğum Tarihi</Text>
                <Text style={styles.infoValue}>
                  {new Date(user.birthDate).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
          )}
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection
          title="Profil Gizliliği"
          footer="Profilinizde hangi bilgilerin görüneceğini seçin"
        >
          <SettingsToggle
            title="E-posta Adresini Göster"
            subtitle="Diğer kullanıcılar e-postanızı görebilir"
            value={settings.profile.showEmail}
            onValueChange={handleToggleShowEmail}
            disabled={saving}
          />

          <SettingsToggle
            title="Telefon Numarasını Göster"
            subtitle="Diğer kullanıcılar telefonunuzu görebilir"
            value={settings.profile.showPhone}
            onValueChange={handleToggleShowPhone}
            disabled={saving}
          />

          <SettingsToggle
            title="Doğum Tarihini Göster"
            subtitle="Doğum tarihiniz profilinizde görünür"
            value={settings.profile.showBirthDate}
            onValueChange={handleToggleShowBirthDate}
            disabled={saving}
          />

          <SettingsToggle
            title="Konumu Göster"
            subtitle="Şehir/bölge bilginiz görünür"
            value={settings.profile.showLocation}
            onValueChange={handleToggleShowLocation}
            disabled={saving}
          />

          <SettingsToggle
            title="Sosyal Medya Linklerini Göster"
            subtitle="Sosyal medya hesaplarınız görünür"
            value={settings.profile.showSocialMedia}
            onValueChange={handleToggleShowSocialMedia}
            disabled={saving}
          />

          <SettingsToggle
            title="Arama Sonuçlarında Görün"
            subtitle="Profiliniz arama sonuçlarında çıksın"
            value={settings.profile.allowProfileSearch}
            onValueChange={handleToggleAllowProfileSearch}
            disabled={saving}
          />
        </SettingsSection>

        {/* Verified Badge */}
        {settings.profile.verifiedBadge && (
          <SettingsSection title="Doğrulama">
            <View style={styles.verifiedContainer}>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedBadgeText}>✓</Text>
              </View>
              <View style={styles.verifiedContent}>
                <Text style={styles.verifiedTitle}>Doğrulanmış Hesap</Text>
                <Text style={styles.verifiedSubtitle}>
                  Profiliniz doğrulanmış olarak işaretlenmiştir
                </Text>
              </View>
            </View>
          </SettingsSection>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },

  // Editable Item Styles
  editableItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  editableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editableLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editableLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  editableContent: {
    marginTop: 8,
  },
  editableValue: {
    fontSize: 15,
    color: '#6B7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    backgroundColor: 'white',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  editableActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },

  // Info Item Styles
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },

  // Verified Badge Styles
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  verifiedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  verifiedBadgeText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '700',
  },
  verifiedContent: {
    flex: 1,
  },
  verifiedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  verifiedSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  noBorder: {
    borderBottomWidth: 0,
  },
});