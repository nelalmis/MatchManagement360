// src/screens/Settings/Privacy/PrivacySettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Eye,
  EyeOff,
  Users,
  Lock,
  Globe,
  UserX,
  MapPin,
  Search,
  Activity,
  ChevronRight,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsItem } from '../components/SettingsItem';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';
import { LoadingScreen } from '../..';

type ProfileVisibility = 'public' | 'friends' | 'private';
type WhoCanViewProfile = 'everyone' | 'friends' | 'nobody';

export const PrivacySettingsScreen: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      } else {
        Alert.alert('Hata', 'Ayarlar yüklenemedi');
      }
    } catch (error) {
      console.error('Settings load error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileVisibilityChange = () => {
    if (!settings) return;

    const options = [
      {
        text: 'Herkese Açık',
        onPress: () => updateProfileVisibility('public'),
      },
      {
        text: 'Sadece Arkadaşlar',
        onPress: () => updateProfileVisibility('friends'),
      },
      {
        text: 'Özel (Sadece Ben)',
        onPress: () => updateProfileVisibility('private'),
      },
      { text: 'İptal', style: 'cancel' as const },
    ];

    Alert.alert('Profil Görünürlüğü', 'Profilinizi kimler görebilsin?', options);
  };

  const updateProfileVisibility = async (visibility: ProfileVisibility) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePrivacy(user.id, {
        profileVisibility: visibility,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Profil görünürlüğü güncellendi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update visibility error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleWhoCanViewProfileChange = () => {
    if (!settings) return;

    const options = [
      {
        text: 'Herkes',
        onPress: () => updateWhoCanViewProfile('everyone'),
      },
      {
        text: 'Sadece Arkadaşlar',
        onPress: () => updateWhoCanViewProfile('friends'),
      },
      {
        text: 'Kimse',
        onPress: () => updateWhoCanViewProfile('nobody'),
      },
      { text: 'İptal', style: 'cancel' as const },
    ];

    Alert.alert('Profil Görüntüleme', 'Profilinizi kimler görüntüleyebilsin?', options);
  };

  const updateWhoCanViewProfile = async (visibility: WhoCanViewProfile) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePrivacy(user.id, {
        whoCanViewProfile: visibility,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Profil görüntüleme ayarı güncellendi');
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update who can view profile error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (
    key: keyof IUserSettings['privacy'],
    value: boolean
  ) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updatePrivacy(user.id, {
        [key]: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle setting error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleBlockedUsers = () => {
    // NavigationService.navigate('BlockedUsers' as never);
  };

  const handleDataSharing = () => {
    // NavigationService.navigate('DataSharing' as never);
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'Herkese Açık';
      case 'friends':
        return 'Sadece Arkadaşlar';
      case 'private':
        return 'Özel';
      case 'everyone':
        return 'Herkes';
      case 'nobody':
        return 'Kimse';
      default:
        return 'Herkese Açık';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
      case 'everyone':
        return <Globe size={20} color="#10B981" strokeWidth={2} />;
      case 'friends':
        return <Users size={20} color="#3B82F6" strokeWidth={2} />;
      case 'private':
      case 'nobody':
        return <Lock size={20} color="#EF4444" strokeWidth={2} />;
      default:
        return <Globe size={20} color="#10B981" strokeWidth={2} />;
    }
  };

  const renderHeader = () => (
    <CustomHeader
      title="Gizlilik"
      showBack={true}
      onLeftPress={() => goBack()}
    />
  );

  if (loading) {
    return <LoadingScreen header={renderHeader()} />;
  }

  if (!settings) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Overview Card */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Eye size={24} color="#8B5CF6" strokeWidth={2} />
            <Text style={styles.overviewTitle}>Gizlilik Özeti</Text>
          </View>
          <View style={styles.overviewContent}>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Profil Görünürlüğü</Text>
              <View style={styles.overviewBadge}>
                {getVisibilityIcon(settings.privacy.profileVisibility)}
                <Text style={styles.overviewBadgeText}>
                  {getVisibilityText(settings.privacy.profileVisibility)}
                </Text>
              </View>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Kimler Görebilir</Text>
              <View style={styles.overviewBadge}>
                {getVisibilityIcon(settings.privacy.whoCanViewProfile)}
                <Text style={styles.overviewBadgeText}>
                  {getVisibilityText(settings.privacy.whoCanViewProfile)}
                </Text>
              </View>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Engellenen</Text>
              <View style={styles.overviewBadge}>
                <Text style={styles.overviewBadgeText}>
                  {settings.privacy.blockList?.length || 0} kullanıcı
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profile Visibility */}
        <SettingsSection
          title="Profil Görünürlüğü"
          footer="Profilinizin genel görünürlüğünü ayarlayın"
        >
          <SettingsItem
            icon={getVisibilityIcon(settings.privacy.profileVisibility)}
            title="Profil Görünürlüğü"
            subtitle="Profilinizi kimler görebilir?"
            value={getVisibilityText(settings.privacy.profileVisibility)}
            onPress={handleProfileVisibilityChange}
            showChevron={true}
          />

          <SettingsItem
            icon={getVisibilityIcon(settings.privacy.whoCanViewProfile)}
            title="Profil Detaylarını Göster"
            subtitle="Profil detaylarınızı kimler görebilir?"
            value={getVisibilityText(settings.privacy.whoCanViewProfile)}
            onPress={handleWhoCanViewProfileChange}
            showChevron={true}
          />
        </SettingsSection>

        {/* Location Privacy */}
        {/* <SettingsSection
          title="Konum Gizliliği"
          footer="Konum bilgilerinizin paylaşımını kontrol edin"
        >
          <SettingsToggle
            title="Konum Paylaşımı"
            subtitle="Bulunduğunuz konumu paylaşın"
            value={settings.privacy.shareLocation}
            onValueChange={(value) => handleToggleSetting('shareLocation', value)}
            disabled={saving}
          />

          <SettingsToggle
            title="Yakındaki Oyuncular"
            subtitle="Size yakın oyuncular sizi görebilir"
            value={settings.privacy.showInNearbyPlayers}
            onValueChange={(value) =>
              handleToggleSetting('showInNearbyPlayers', value)
            }
            disabled={saving || !settings.privacy.shareLocation}
          />
        </SettingsSection> */}

        {/* Online Status */}
        {/* <SettingsSection
          title="Çevrimiçi Durum"
          footer="Çevrimiçi olduğunuzda başkalarına gösterilsin mi?"
        >
          <SettingsToggle
            title="Çevrimiçi Durumunu Göster"
            subtitle="Aktif olduğunuzda gösterilir"
            value={settings.privacy.showOnlineStatus}
            onValueChange={(value) =>
              handleToggleSetting('showOnlineStatus', value)
            }
            disabled={saving}
          />

          <SettingsToggle
            title="Son Görülme"
            subtitle="En son ne zaman aktif olduğunuz"
            value={settings.privacy.showLastSeen}
            onValueChange={(value) => handleToggleSetting('showLastSeen', value)}
            disabled={saving || !settings.privacy.showOnlineStatus}
          />
        </SettingsSection> */}

        {/* Search & Discovery */}
        {/* <SettingsSection
          title="Arama & Keşfet"
          footer="Profilinizin aranabilirliğini kontrol edin"
        >
          <SettingsToggle
            title="Arama Sonuçlarında Görün"
            subtitle="Kullanıcılar sizi arayabilir"
            value={settings.privacy.allowSearch}
            onValueChange={(value) => handleToggleSetting('allowSearch', value)}
            disabled={saving}
          />

          <SettingsToggle
            title="Keşfet Bölümünde Görün"
            subtitle="Önerilen oyuncular listesinde çıkın"
            value={settings.privacy.showInSuggestions}
            onValueChange={(value) =>
              handleToggleSetting('showInSuggestions', value)
            }
            disabled={saving}
          />
        </SettingsSection> */}

        {/* Activity Privacy */}
        {/* <SettingsSection
          title="Aktivite Gizliliği"
          footer="Aktivitelerinizin görünürlüğü"
        >
          <SettingsToggle
            title="Aktivitelerimi Göster"
            subtitle="Maç katılımları ve etkinlikler"
            value={settings.privacy.showActivity}
            onValueChange={(value) => handleToggleSetting('showActivity', value)}
            disabled={saving}
          />

          <SettingsToggle
            title="Arkadaş Listesini Göster"
            subtitle="Arkadaşlarınızı başkaları görebilir"
            value={settings.privacy.showFriendsList}
            onValueChange={(value) =>
              handleToggleSetting('showFriendsList', value)
            }
            disabled={saving}
          />
        </SettingsSection> */}

        {/* Contact Privacy */}
        {/* <SettingsSection
          title="İletişim Gizliliği"
          footer="Size kimler mesaj gönderebilir ve davet edebilir"
        >
          <SettingsToggle
            title="Sadece Arkadaşlar Mesaj Gönderebilir"
            subtitle="Yabancılar mesaj gönderemez"
            value={settings.privacy.onlyFriendsCanMessage}
            onValueChange={(value) =>
              handleToggleSetting('onlyFriendsCanMessage', value)
            }
            disabled={saving}
          />

          <SettingsToggle
            title="Sadece Arkadaşlar Davet Edebilir"
            subtitle="Yabancılar maça davet edemez"
            value={settings.privacy.onlyFriendsCanInvite}
            onValueChange={(value) =>
              handleToggleSetting('onlyFriendsCanInvite', value)
            }
            disabled={saving}
          />
        </SettingsSection> */}

        {/* Data & Analytics */}
        <SettingsSection
          title="Veri & Analitik"
          footer="Verilerinizin nasıl kullanıldığını kontrol edin"
        >
          {/* <SettingsToggle
            title="Kullanım Verilerini Paylaş"
            subtitle="Uygulamayı geliştirmemize yardımcı olun"
            value={settings.privacy.shareUsageData}
            onValueChange={(value) =>
              handleToggleSetting('shareUsageData', value)
            }
            disabled={saving}
          /> */}

          <SettingsItem
            icon={<Activity size={22} color="#6B7280" strokeWidth={2} />}
            title="Veri Paylaşım Ayarları"
            subtitle="Detaylı veri paylaşım tercihleri"
            onPress={handleDataSharing}
            showChevron={true}
          />
        </SettingsSection>

        {/* Blocked Users */}
        {/* <SettingsSection
          title="Engellenen Kullanıcılar"
          footer="Engellenmiş kullanıcıları yönetin"
        >
          <SettingsItem
            icon={<UserX size={22} color="#EF4444" strokeWidth={2} />}
            title="Engellenmiş Kullanıcılar"
            subtitle={`${settings.privacy.blockList?.length || 0} kullanıcı engellenmiş`}
            badge={settings.privacy.blockList?.length || 0}
            onPress={handleBlockedUsers}
            showChevron={true}
          />
        </SettingsSection> */}

        {/* Privacy Level Indicator */}
        <View style={styles.privacyLevelCard}>
          <Text style={styles.privacyLevelTitle}>Gizlilik Seviyesi</Text>
          <View style={styles.privacyLevelBar}>
            <View
              style={[
                styles.privacyLevelFill,
                {
                  width: `${calculatePrivacyLevel(settings.privacy)}%`,
                  backgroundColor: getPrivacyColor(
                    calculatePrivacyLevel(settings.privacy)
                  ),
                },
              ]}
            />
          </View>
          <View style={styles.privacyLevelInfo}>
            <Text style={styles.privacyLevelText}>
              {getPrivacyLevelText(calculatePrivacyLevel(settings.privacy))}
            </Text>
            <Text style={styles.privacyLevelPercentage}>
              {calculatePrivacyLevel(settings.privacy)}%
            </Text>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔒 Gizlilik İpuçları</Text>
          <Text style={styles.infoText}>
            • Profilinizi özel yaparak sadece onayladığınız kişilere gösterin
            {'\n'}• Konum paylaşımını kapatarak konumunuzu gizleyin{'\n'}•
            Sadece arkadaşlarınızın mesaj göndermesine izin verin{'\n'}•
            İstatistiklerinizi yalnızca arkadaşlarınıza gösterin
          </Text>
        </View>

        {/* Quick Privacy Presets */}
        <SettingsSection title="Hızlı Ayarlar">
          <View style={styles.presetsContainer}>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => applyPrivacyPreset('public')}
              activeOpacity={0.7}
            >
              <Globe size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.presetButtonText}>Herkese Açık</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => applyPrivacyPreset('friends')}
              activeOpacity={0.7}
            >
              <Users size={20} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.presetButtonText}>Arkadaşlar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => applyPrivacyPreset('private')}
              activeOpacity={0.7}
            >
              <Lock size={20} color="#EF4444" strokeWidth={2} />
              <Text style={styles.presetButtonText}>Özel</Text>
            </TouchableOpacity>
          </View>
        </SettingsSection>
      </ScrollView>
    </View>
  );

  // Helper function to apply privacy presets
  async function applyPrivacyPreset(preset: 'public' | 'friends' | 'private') {
    if (!user?.id) return;

    const confirmMessage =
      preset === 'public'
        ? 'Profiliniz herkese açık olacak. Devam etmek istiyor musunuz?'
        : preset === 'friends'
          ? 'Profiliniz sadece arkadaşlarınıza açık olacak. Devam etmek istiyor musunuz?'
          : 'Profiliniz tamamen özel olacak. Devam etmek istiyor musunuz?';

    Alert.alert('Gizlilik Önayarı', confirmMessage, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Uygula',
        onPress: async () => {
          setSaving(true);
          try {
            let privacySettings = {};

            if (preset === 'public') {
              privacySettings = {
                profileVisibility: 'public',
                whoCanViewProfile: 'everyone',
                shareLocation: true,
                showInNearbyPlayers: true,
                showOnlineStatus: true,
                showLastSeen: true,
                allowSearch: true,
                showInSuggestions: true,
                showActivity: true,
                showFriendsList: true,
                onlyFriendsCanMessage: false,
                onlyFriendsCanInvite: false,
              };
            } else if (preset === 'friends') {
              privacySettings = {
                profileVisibility: 'friends',
                whoCanViewProfile: 'friends',
                shareLocation: true,
                showInNearbyPlayers: false,
                showOnlineStatus: true,
                showLastSeen: true,
                allowSearch: true,
                showInSuggestions: false,
                showActivity: true,
                showFriendsList: false,
                onlyFriendsCanMessage: true,
                onlyFriendsCanInvite: true,
              };
            } else {
              // private
              privacySettings = {
                profileVisibility: 'private',
                whoCanViewProfile: 'nobody',
                shareLocation: false,
                showInNearbyPlayers: false,
                showOnlineStatus: false,
                showLastSeen: false,
                allowSearch: false,
                showInSuggestions: false,
                showActivity: false,
                showFriendsList: false,
                onlyFriendsCanMessage: true,
                onlyFriendsCanInvite: true,
              };
            }

            const result = await UserSettingsService.updatePrivacy(
              user.id,
              privacySettings
            );

            if (result.success && result.data) {
              setSettings(result.data);
              Alert.alert('Başarılı', 'Gizlilik ayarları güncellendi');
            } else {
              Alert.alert('Hata', 'Ayarlar güncellenemedi');
            }
          } catch (error) {
            console.error('Apply preset error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }

  // Helper function to calculate privacy level
  function calculatePrivacyLevel(privacy: IUserSettings['privacy']): number {
    let score = 0;
    const totalSettings = 13;

    // More private = higher score
    if (privacy.profileVisibility === 'private') score += 2;
    else if (privacy.profileVisibility === 'friends') score += 1;

    if (privacy.whoCanViewProfile === 'nobody') score += 1;
    else if (privacy.whoCanViewProfile === 'friends') score += 0.5;

    // if (!privacy.shareLocation) score += 1;
    // if (!privacy.showInNearbyPlayers) score += 1;
    // if (!privacy.showOnlineStatus) score += 1;
    // if (!privacy.showLastSeen) score += 1;
    // if (!privacy.allowSearch) score += 1;
    // if (!privacy.showInSuggestions) score += 1;
    // if (!privacy.showActivity) score += 1;
    // if (!privacy.showFriendsList) score += 1;
    // if (privacy.onlyFriendsCanMessage) score += 1;
    // if (privacy.onlyFriendsCanInvite) score += 1;

    return Math.round((score / totalSettings) * 100);
  }

  function getPrivacyLevelText(level: number): string {
    if (level >= 80) return 'Çok Yüksek';
    if (level >= 60) return 'Yüksek';
    if (level >= 40) return 'Orta';
    if (level >= 20) return 'Düşük';
    return 'Çok Düşük';
  }

  function getPrivacyColor(level: number): string {
    if (level >= 80) return '#10B981';
    if (level >= 60) return '#3B82F6';
    if (level >= 40) return '#F59E0B';
    if (level >= 20) return '#EF4444';
    return '#DC2626';
  }
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },

  // Overview Card
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  overviewContent: {
    gap: 12,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  overviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  overviewBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Privacy Level Card
  privacyLevelCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  privacyLevelTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  privacyLevelBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  privacyLevelFill: {
    height: '100%',
    borderRadius: 4,
  },
  privacyLevelInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyLevelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  privacyLevelPercentage: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },

  // Presets
  presetsContainer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
});
