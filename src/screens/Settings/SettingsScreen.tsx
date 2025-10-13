import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
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
  Lock,
  Trash2,
  Download,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { auth } from '../../api/firebaseConfig';
import { NavigationService } from '../../navigation/NavigationService';

interface SettingItem {
  id: string;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  destructive?: boolean;
}

export const SettingsScreen: React.FC = () => {
  const { user, setUser } = useAppContext();

  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleEditProfile = useCallback(() => {
    NavigationService.navigateToEditProfile();
  }, []);

  const handleNotifications = useCallback(() => {
    NavigationService.navigateToNotificationSettings();
  }, []);

  const handlePrivacy = useCallback(() => {
    Alert.alert('Gizlilik', 'Gizlilik ayarları yakında eklenecek');
  }, []);

  const handleHelp = useCallback(() => {
    Alert.alert('Yardım', 'Yardım merkezi yakında eklenecek');
  }, []);

  const handleAbout = useCallback(() => {
    Alert.alert(
      'Hakkında',
      'Match Management 360\nVersiyon: 1.0.0\n\n© 2025 Tüm hakları saklıdır.'
    );
  }, []);

  const handleContactUs = useCallback(() => {
    Alert.alert('İletişim', 'E-posta: support@matchmanagement360.com');
  }, []);

  const handleRateApp = useCallback(() => {
    Alert.alert('Değerlendir', 'Uygulamamızı değerlendirmenizi bekliyoruz!');
  }, []);

  const handleLanguage = useCallback(() => {
    Alert.alert('Dil', 'Dil seçenekleri yakında eklenecek');
  }, []);

  const handleDevices = useCallback(() => {
    Alert.alert('Cihazlar', 'Cihaz yönetimi yakında eklenecek');
  }, []);

  const handleDataExport = useCallback(() => {
    Alert.alert(
      'Veri İndir',
      'Tüm verilerinizi indirmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'İndir',
          onPress: () => Alert.alert('Başarılı', 'Verileriniz e-posta adresinize gönderilecek'),
        },
      ]
    );
  }, []);

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
            Alert.alert('Onay', 'Hesabınız silme işlemi için işaretlendi');
          },
        },
      ]
    );
  }, []);

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
              await auth.signOut();
              setUser(null);
              NavigationService.navigateToLogin();
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          },
        },
      ]
    );
  }, [setUser]);

  const accountSettings: SettingItem[] = [
    {
      id: 'profile',
      icon: <User size={22} color="#16a34a" strokeWidth={2} />,
      title: 'Profili Düzenle',
      subtitle: 'Ad, soyad, fotoğraf',
      onPress: handleEditProfile,
      showChevron: true,
    },
    {
      id: 'notifications',
      icon: <Bell size={22} color="#3B82F6" strokeWidth={2} />,
      title: 'Bildirimler',
      subtitle: 'Push bildirimleri yönet',
      onPress: handleNotifications,
      showChevron: true,
    },
    {
      id: 'privacy',
      icon: <Shield size={22} color="#8B5CF6" strokeWidth={2} />,
      title: 'Gizlilik',
      subtitle: 'Gizlilik ayarları',
      onPress: handlePrivacy,
      showChevron: true,
    },
    {
      id: 'devices',
      icon: <Smartphone size={22} color="#F59E0B" strokeWidth={2} />,
      title: 'Cihazlar',
      subtitle: 'Bağlı cihazları yönet',
      onPress: handleDevices,
      showChevron: true,
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'darkMode',
      icon: <Moon size={22} color="#6B7280" strokeWidth={2} />,
      title: 'Karanlık Mod',
      subtitle: 'Yakında',
      onPress: () => {},
      showSwitch: true,
      switchValue: darkMode,
      onSwitchChange: setDarkMode,
    },
    {
      id: 'language',
      icon: <Globe size={22} color="#10B981" strokeWidth={2} />,
      title: 'Dil',
      subtitle: 'Türkçe',
      onPress: handleLanguage,
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
      onPress: handleContactUs,
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
      onPress: handleAbout,
      showChevron: true,
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      id: 'export',
      icon: <Download size={22} color="#10B981" strokeWidth={2} />,
      title: 'Verilerimi İndir',
      subtitle: 'Tüm verilerinizi indirin',
      onPress: handleDataExport,
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

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
      activeOpacity={0.7}
      disabled={item.showSwitch}
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

      {item.showSwitch && (
        <Switch
          value={item.switchValue}
          onValueChange={item.onSwitchChange}
          trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
          thumbColor={item.switchValue ? '#16a34a' : '#F3F4F6'}
        />
      )}

      {item.showChevron && (
        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <User size={32} color="white" strokeWidth={2} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.name} {user?.surname}
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap</Text>
          <View style={styles.settingsGroup}>
            {accountSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uygulama</Text>
          <View style={styles.settingsGroup}>
            {appSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destek</Text>
          <View style={styles.settingsGroup}>
            {supportSettings.map(renderSettingItem)}
          </View>
        </View>

        {/* Data & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Veri & Gizlilik</Text>
          <View style={styles.settingsGroup}>
            {dataSettings.map(renderSettingItem)}
          </View>
        </View>

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
          <Text style={styles.versionNumber}>Versiyon 1.0.0</Text>
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
  },
  bottomSpacing: {
    height: 32,
  },
});