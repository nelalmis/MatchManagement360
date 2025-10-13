// ============================================
// DRAWER NAVIGATOR (SIDE MENU) - UPDATED
// ============================================

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, StyleSheet } from 'react-native';
import { 
  User, 
  LogOut, 
  Bell, 
  HelpCircle, 
  Info,
  Shield,
  Trophy,
  Calendar,
  Home,
  Settings as SettingsIcon,
  ChevronRight,
  BarChart3,
  X
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationService } from './NavigationService'; // ✅ Direkt import

export const DrawerContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user, setUser, setIsVerified } = useAppContext();

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            // Clear user data
            await AsyncStorage.removeItem('userData');
            await AsyncStorage.removeItem('deviceToken');
            await AsyncStorage.removeItem('trustedDevice');
            setUser(null);
            setIsVerified(false);
            onClose();
            NavigationService.navigateToLogin();
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      section: 'Ana Menü',
      items: [
        { 
          icon: Home, 
          label: 'Ana Sayfa', 
          action: () => {
            onClose();
            NavigationService.navigateToHomeTab();
          }
        },
        { 
          icon: Trophy, 
          label: 'Liglerim', 
          action: () => {
            onClose();
            NavigationService.navigateToLeaguesTab();
          }
        },
        { 
          icon: Calendar, 
          label: 'Maçlar', 
          action: () => {
            onClose();
            NavigationService.navigateToFixturesTab();
          }
        },
        { 
          icon: BarChart3, 
          label: 'İstatistikler', 
          action: () => {
            onClose();
            NavigationService.navigateToStandingsTab();
          }
        },
      ],
    },
    {
      section: 'Hesap',
      items: [
        { 
          icon: User, 
          label: 'Profilim', 
          action: () => {
            onClose();
            if (user?.id) {
              NavigationService.navigateToPlayer(user.id); // ✅ Düzeltildi
            }
          }
        },
        { 
          icon: Bell, 
          label: 'Bildirimler', 
          action: () => {
            onClose();
            NavigationService.navigateToNotificationSettings(); // ✅ Düzeltildi
          }
        },
        { 
          icon: SettingsIcon, 
          label: 'Ayarlar', 
          action: () => {
            onClose();
            NavigationService.navigateToSettings(); // ✅ Düzeltildi
          }
        },
      ],
    },
    {
      section: 'Destek',
      items: [
        { 
          icon: HelpCircle, 
          label: 'Yardım', 
          action: () => {
            Alert.alert('Yardım', 'Yardım sayfası yakında eklenecek');
          }
        },
        { 
          icon: Info, 
          label: 'Hakkında', 
          action: () => {
            Alert.alert('Hakkında', 'Maç Yönetimi v1.0.0\n\nTüm hakları saklıdır.');
          }
        },
        { 
          icon: Shield, 
          label: 'Gizlilik', 
          action: () => {
            Alert.alert('Gizlilik', 'Gizlilik politikası yakında eklenecek');
          }
        },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header with Profile Summary */}
      <View style={styles.header}>
        {/* Header Top - Avatar & Close */}
        <View style={styles.headerTop}>
          <View style={styles.avatarContainer}>
            {user?.profilePhoto ? (
              <Image 
                source={{ uri: user.profilePhoto }} 
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  {user?.surname?.charAt(0)?.toUpperCase() || ''}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
          >
            <X size={20} color="#FFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {user?.name} {user?.surname}
          </Text>
          <Text style={styles.userPhone}>{user?.phone || user?.email}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={{ flex: 1 }}>
        {menuItems.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.menuSection}>
            {/* Section Title */}
            <Text style={styles.sectionTitle}>{section.section}</Text>

            {/* Section Items */}
            {section.items.map((item, itemIndex) => (
              <TouchableOpacity
                key={itemIndex}
                onPress={item.action}
                style={styles.menuItem}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <item.icon size={20} color="#16a34a" strokeWidth={2} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <View style={styles.menuItemLeft}>
            <View style={[styles.menuIconContainer, styles.logoutIconContainer]}>
              <LogOut size={20} color="#DC2626" strokeWidth={2} />
            </View>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Versiyon 1.0.0</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#16a34a',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
    letterSpacing: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginBottom: 0,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  logoutSection: {
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  logoutIconContainer: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#DC2626',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});