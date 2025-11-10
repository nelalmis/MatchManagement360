// src/screens/Settings/SettingsScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Moon,
  Globe,
  Smartphone,
  Info,
  Mail,
  MessageCircle,
  Star,
  Trash2,
  Download,
  Lock,
  GamepadIcon,
  Calendar,
  MapPin,
  Eye,
  Settings as SettingsIcon,
  BarChart3,
  Database,
  Palette,
  Accessibility,
  Users,
  CreditCard,
  FlaskRound,
} from 'lucide-react-native';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import UserSettingsService from '../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../types/entity/types';
import { AuthNavigationService, goBack, SettingsNavigationService } from '../../navigation';

interface SettingItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  badge?: number;
}

export const SettingsScreen: React.FC = () => {
  const { user, signOut } = useAuth();

  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

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
      setRefreshing(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleEditProfile = useCallback(() => {
    SettingsNavigationService.navigateToEditProfile();
  }, []);

  const handleNotifications = useCallback(() => {
    SettingsNavigationService.navigateToNotificationSettings();
  }, []);

  const handlePrivacy = useCallback(() => {
     SettingsNavigationService.navigateToPrivacySettings();
  }, []);

  const handleSecurity = useCallback(() => {
     SettingsNavigationService.navigateToSecuritySettings();
  }, []);

  const handleBlockedUsers = useCallback(() => {
     SettingsNavigationService.navigateToBlockedUsers();
  }, []);

  const handleGamePreferences = useCallback(() => {
     SettingsNavigationService.navigateToGamePreferences();
  }, []);

  const handleSportsPositions = useCallback(() => {
     SettingsNavigationService.navigateToSportsPositions();
  }, []);

  const handleAvailability = useCallback(() => {
     SettingsNavigationService.navigateToAvailability();
  }, []);

  const handleLocationPreferences = useCallback(() => {
    // SettingsNavigationService.navigateToLocationPreferences();
  }, []);

  const handlePaymentPreferences = useCallback(() => {
    //  SettingsNavigationService.navigateToPaymentPreferences();
  }, []);

  const handleAppearance = useCallback(() => {
     SettingsNavigationService.navigateToAppearance();
  }, []);

  const handleAccessibility = useCallback(() => {
     SettingsNavigationService.navigateToAccessibility();
  }, []);

  const handleCalendarSync = useCallback(() => {
    SettingsNavigationService.navigateToCalendarSync();
  }, []);

  const handleSocialSettings = useCallback(() => {
    //  SettingsNavigationService.navigateToSocialSettings();
  }, []);

  const handleAnalytics = useCallback(() => {
    //  SettingsNavigationService.navigateToAnalyticsSettings();
  }, []);

  const handleStorage = useCallback(() => {
    //  SettingsNavigationService.navigateToStorageSettings();
  }, []);

  const handleBetaFeatures = useCallback(() => {
    //  SettingsNavigationService.navigateToBetaFeatures();
  }, []);

  const handleDevices = useCallback(() => {
    Alert.alert('Cihazlar', 'Cihaz yönetimi yakında eklenecek');
  }, []);

  const handleHelp = useCallback(() => {
    SettingsNavigationService.navigateToHelp();
  }, []);

  const handleAbout = useCallback(() => {
    SettingsNavigationService.navigateToAbout();
  }, []);

  const handleContactUs = useCallback(() => {
    Alert.alert('İletişim', 'E-posta: support@matchmanagement360.com');
  }, []);

  const handleRateApp = useCallback(() => {
    Alert.alert('Değerlendir', 'Uygulamamızı değerlendirmenizi bekliyoruz!');
  }, []);

  const handleFeedback = useCallback(() => {
    Alert.alert('Geri Bildirim', 'Geri bildirim formu yakında eklenecek');
  }, []);

  const handleTerms = useCallback(() => {
     SettingsNavigationService.navigateToTerms();
  }, []);

  const handleDataExport = useCallback(() => {
    Alert.alert(
      'Veri İndir',
      'Tüm verilerinizi indirmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'İndir',
          onPress: async () => {
            if (!user?.id) return;
            // TODO: Implement data export
            Alert.alert('Başarılı', 'Verileriniz e-posta adresinize gönderilecek');
          },
        },
      ]
    );
  }, [user?.id]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Onay', 'Hesabınız silme işlemi için işaretlendi');
          },
        },
      ]
    );
  }, []);

  const handleResetSettings = useCallback(() => {
    Alert.alert(
      'Ayarları Sıfırla',
      'Tüm ayarlar varsayılan değerlere döndürülecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            const result = await UserSettingsService.resetToDefaults(user.id);

            if (result.success) {
              Alert.alert('Başarılı', 'Ayarlar sıfırlandı');
              loadSettings(true);
            } else {
              Alert.alert('Hata', 'Ayarlar sıfırlanamadı');
            }
          },
        },
      ]
    );
  }, [user?.id]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              AuthNavigationService.resetToAuth();
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [signOut]);

  // ============================================
  // SETTING ITEMS
  // ============================================

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      icon: <User size={22} color="#16a34a" strokeWidth={2} />,
      title: 'Profili Düzenle',
      subtitle: settings?.profile?.displayName
        ? `${settings.profile.displayName}`
        : 'İsim, biyografi, görünürlük',
      onPress: handleEditProfile,
      showChevron: true,
    },
    {
      id: 'notifications',
      icon: <Bell size={22} color="#3B82F6" strokeWidth={2} />,
      title: 'Bildirimler',
      subtitle: settings?.notifications?.enabled ? 'Açık' : 'Kapalı',
      value: settings?.notifications?.enabled ? 'Açık' : 'Kapalı',
      onPress: handleNotifications,
      showChevron: true,
    },
  ];

  const privacySecuritySettings: SettingItem[] = [
    {
      id: 'privacy',
      icon: <Eye size={22} color="#8B5CF6" strokeWidth={2} />,
      title: 'Gizlilik',
      subtitle: settings?.privacy?.profileVisibility
        ? settings.privacy.profileVisibility === 'public'
          ? 'Herkese Açık'
          : settings.privacy.profileVisibility === 'friends'
            ? 'Arkadaşlar'
            : 'Özel'
        : 'Herkese Açık',
      onPress: handlePrivacy,
      showChevron: true,
    },
    {
      id: 'security',
      icon: <Lock size={22} color="#EF4444" strokeWidth={2} />,
      title: 'Güvenlik',
      subtitle: settings?.security?.twoFactorAuth
        ? '2FA Aktif'
        : 'İki faktörlü doğrulama kapalı',
      onPress: handleSecurity,
      showChevron: true,
    },
    {
      id: 'blockedUsers',
      icon: <Shield size={22} color="#F59E0B" strokeWidth={2} />,
      title: 'Engellenmiş Kullanıcılar',
      subtitle: `${settings?.privacy?.blockList?.length || 0} kullanıcı`,
      badge: settings?.privacy?.blockList?.length || 0,
      onPress: handleBlockedUsers,
      showChevron: true,
    },
    {
      id: 'devices',
      icon: <Smartphone size={22} color="#10B981" strokeWidth={2} />,
      title: 'Güvenilir Cihazlar',
      subtitle: `${settings?.security?.trustedDevices?.length || 0} cihaz`,
      onPress: handleDevices,
      showChevron: true,
    },
  ];

  const gamePreferencesSettings: SettingItem[] = [
    {
      id: 'gamePreferences',
      icon: <SettingsIcon size={22} color="#16a34a" strokeWidth={2} />,
      title: 'Oyun Tercihleri',
      subtitle: 'Genel tercihler',
      onPress: handleGamePreferences,
      showChevron: true,
    },
    {
      id: 'sportsPositions',
      icon: <GamepadIcon size={22} color="#3B82F6" strokeWidth={2} />,
      title: 'Sporlar & Pozisyonlar',
      subtitle: `${settings?.preferences?.favoriteSports?.length || 0} spor seçili`,
      onPress: handleSportsPositions,
      showChevron: true,
    },
    {
      id: 'availability',
      icon: <Calendar size={22} color="#8B5CF6" strokeWidth={2} />,
      title: 'Müsaitlik',
      subtitle: `${settings?.preferences?.availableDays?.length || 0} gün`,
      onPress: handleAvailability,
      showChevron: true,
    },
    {
      id: 'location',
      icon: <MapPin size={22} color="#EF4444" strokeWidth={2} />,
      title: 'Konum Tercihleri',
      subtitle: settings?.preferences?.maxDistanceKm
        ? `Max ${settings.preferences.maxDistanceKm} km`
        : 'Belirlenmedi',
      onPress: handleLocationPreferences,
      showChevron: true,
    },
    {
      id: 'payment',
      icon: <CreditCard size={22} color="#10B981" strokeWidth={2} />,
      title: 'Ödeme Tercihleri',
      subtitle: settings?.preferences?.paymentMethod
        ? settings.preferences.paymentMethod === 'cash'
          ? 'Nakit'
          : settings.preferences.paymentMethod === 'card'
            ? 'Kart'
            : 'Karma'
        : 'Belirlenmedi',
      onPress: handlePaymentPreferences,
      showChevron: true,
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'appearance',
      icon: <Palette size={22} color="#F59E0B" strokeWidth={2} />,
      title: 'Görünüm',
      subtitle: `${settings?.appearance?.theme === 'light'
          ? 'Açık'
          : settings?.appearance?.theme === 'dark'
            ? 'Koyu'
            : 'Otomatik'
        } tema`,
      value: settings?.appearance?.language === 'tr' ? 'Türkçe' : 'English',
      onPress: handleAppearance,
      showChevron: true,
    },
    {
      id: 'accessibility',
      icon: <Accessibility size={22} color="#8B5CF6" strokeWidth={2} />,
      title: 'Erişilebilirlik',
      subtitle: `Font: ${settings?.accessibility?.textSize || 'medium'}`,
      onPress: handleAccessibility,
      showChevron: true,
    },
    {
      id: 'calendar',
      icon: <Calendar size={22} color="#3B82F6" strokeWidth={2} />,
      title: 'Takvim Senkronizasyonu',
      subtitle: settings?.calendar?.syncWithDevice ? 'Aktif' : 'Devre dışı',
      onPress: handleCalendarSync,
      showChevron: true,
    },
    {
      id: 'social',
      icon: <Users size={22} color="#10B981" strokeWidth={2} />,
      title: 'Sosyal Ayarlar',
      subtitle: settings?.social?.showOnlineStatus ? 'Çevrimiçi göster' : undefined,
      onPress: handleSocialSettings,
      showChevron: true,
    },
  ];

  const dataAnalyticsSettings: SettingItem[] = [
    {
      id: 'analytics',
      icon: <BarChart3 size={22} color="#8B5CF6" strokeWidth={2} />,
      title: 'Analitik & Performans',
      subtitle: settings?.analytics?.trackPerformance ? 'Aktif' : 'Devre dışı',
      onPress: handleAnalytics,
      showChevron: true,
    },
    {
      id: 'storage',
      icon: <Database size={22} color="#6B7280" strokeWidth={2} />,
      title: 'Depolama & Veri',
      subtitle: `Önbellek: ${settings?.storage?.cacheEnabled ? 'Açık' : 'Kapalı'}`,
      onPress: handleStorage,
      showChevron: true,
    },
  ];

  const betaSettings: SettingItem[] = [
    {
      id: 'beta',
      icon: <FlaskRound size={22} color="#F59E0B" strokeWidth={2} />,
      title: 'Beta Özellikler',
      subtitle: `${settings?.beta?.enabledFeatures?.length || 0} özellik aktif`,
      badge: settings?.beta?.enabledFeatures?.length || 0,
      onPress: handleBetaFeatures,
      showChevron: true,
    },
  ];

  const supportSettings: SettingItem[] = [
    {
      id: 'help',
      icon: <HelpCircle size={22} color="#3B82F6" strokeWidth={2} />,
      title: 'Yardım Merkezi',
      onPress: handleHelp,
      showChevron: true,
    },
    {
      id: 'contact',
      icon: <Mail size={22} color="#EF4444" strokeWidth={2} />,
      title: 'İletişim',
      onPress: handleContactUs,
      showChevron: true,
    },
    {
      id: 'feedback',
      icon: <MessageCircle size={22} color="#F59E0B" strokeWidth={2} />,
      title: 'Geri Bildirim Gönder',
      onPress: handleFeedback,
      showChevron: true,
    },
    {
      id: 'rate',
      icon: <Star size={22} color="#F59E0B" strokeWidth={2} />,
      title: 'Uygulamayı Değerlendir',
      onPress: handleRateApp,
      showChevron: true,
    },
    {
      id: 'about',
      icon: <Info size={22} color="#6B7280" strokeWidth={2} />,
      title: 'Hakkında',
      subtitle: `Versiyon ${settings?.version || '1.0.0'}`,
      onPress: handleAbout,
      showChevron: true,
    },
    {
      id: 'terms',
      icon: <Info size={22} color="#6B7280" strokeWidth={2} />,
      title: 'Şartlar & Gizlilik',
      onPress: handleTerms,
      showChevron: true,
    },
  ];

  const dangerZoneSettings: SettingItem[] = [
    {
      id: 'export',
      icon: <Download size={22} color="#10B981" strokeWidth={2} />,
      title: 'Verilerimi İndir',
      subtitle: 'Tüm verilerinizi indirin',
      onPress: handleDataExport,
      showChevron: true,
    },
    {
      id: 'reset',
      icon: <SettingsIcon size={22} color="#F59E0B" strokeWidth={2} />,
      title: 'Ayarları Sıfırla',
      subtitle: 'Tüm ayarları varsayılana döndür',
      onPress: handleResetSettings,
      showChevron: true,
    },
    {
      id: 'delete',
      icon: <Trash2 size={22} color="#EF4444" strokeWidth={2} />,
      title: 'Hesabı Sil',
      subtitle: 'Kalıcı olarak sil',
      onPress: handleDeleteAccount,
      showChevron: true,
      destructive: true,
    },
  ];

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingItemLeft}>
        <View style={styles.settingIcon}>{item.icon}</View>
        <View style={styles.settingTextContainer}>
          <Text
            style={[
              styles.settingTitle,
              item.destructive && styles.destructiveText,
            ]}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>

      <View style={styles.settingItemRight}>
        {item.value && (
          <Text style={styles.settingValue}>{item.value}</Text>
        )}
        {item.badge !== undefined && item.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
        {item.showChevron && (
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.settingsGroup}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Ayarlar"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Ayarlar"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSettings(true)}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <User size={32} color="white" strokeWidth={2} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.name || 'Kullanıcı'} {user?.surname || ''}
            </Text>
            {user?.email && (
              <Text style={styles.userEmail}>{user.email}</Text>
            )}
            {user?.phone && (
              <Text style={styles.userPhone}>{user.phone}</Text>
            )}
          </View>
        </View>

        {/* Account Settings */}
        {renderSection('Hesap', accountSettings)}

        {/* Privacy & Security */}
        {renderSection('Gizlilik & Güvenlik', privacySecuritySettings)}

        {/* Game Preferences */}
        {renderSection('Oyun Tercihleri', gamePreferencesSettings)}

        {/* App Settings */}
        {renderSection('Uygulama', appSettings)}

        {/* Data & Analytics */}
        {renderSection('Veri & Analitik', dataAnalyticsSettings)}

        {/* Beta Features */}
        {settings?.beta?.optInToNewFeatures && renderSection('Beta', betaSettings)}

        {/* Support */}
        {renderSection('Destek', supportSettings)}

        {/* Danger Zone */}
        {renderSection('Veri & Gizlilik', dangerZoneSettings)}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <LogOut size={20} color="#EF4444" strokeWidth={2} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        {/* Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Match Management 360</Text>
          <Text style={styles.versionNumber}>
            Versiyon {settings?.version || '1.0.0'}
          </Text>
          {settings?.lastSyncedAt && (
            <Text style={styles.syncText}>
              Son senkronizasyon:{' '}
              {new Date(settings.lastSyncedAt).toLocaleString('tr-TR')}
            </Text>
          )}
        </View>

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
  content: {
    flex: 1,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginHorizontal: 16,
    letterSpacing: 0.5,
  },
  settingsGroup: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  destructiveText: {
    color: '#EF4444',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 4,
  },
  versionNumber: {
    fontSize: 12,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  syncText: {
    fontSize: 10,
    color: '#D1D5DB',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 32,
  },
});