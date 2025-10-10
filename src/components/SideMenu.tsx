import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import {
  Home,
  Trophy,
  Calendar,
  Bell,
  User,
  Settings,
  TrendingUp,
  LogOut,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';
import { useNavigationContext } from '../context/NavigationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const { user, setUser, setIsVerified, setCurrentScreen } = useAppContext();
  const navigation = useNavigationContext();

  const handleNavigation = (screen: string) => {
    onClose();
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userData');
              await AsyncStorage.removeItem('deviceToken');
              await AsyncStorage.removeItem('trustedDevice');
              
              setUser(null);
              setIsVerified(false);
              setCurrentScreen('login');
              onClose();
              navigation.navigate('login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  // Mock stats - gerçek uygulamada API'den gelecek
  const quickStats = {
    totalMatches: 24,
    rating: 4.5,
    totalGoals: 12,
  };

  // Menu sections
  const menuSections = [
    {
      title: 'Ana Menü',
      items: [
        {
          icon: Home,
          label: 'Ana Sayfa',
          screen: 'home',
          badge: null,
        },
        {
          icon: Trophy,
          label: 'Liglerim',
          screen: 'myLeagues',
          badge: null,
        },
        {
          icon: Calendar,
          label: 'Fikstürlerim',
          screen: 'myFixtures',
          badge: null,
        },
        {
          icon: Bell,
          label: 'Davetler',
          screen: 'invites',
          badge: 3,
        },
      ],
    },
    {
      title: 'İstatistikler',
      items: [
        {
          icon: Trophy,
          label: 'Puan Durumum',
          screen: 'myStandings',
          badge: null,
        },
        {
          icon: TrendingUp,
          label: 'Performansım',
          screen: 'performance',
          badge: null,
        },
      ],
    },
    {
      title: 'Hesap',
      items: [
        {
          icon: User,
          label: 'Profilim',
          screen: 'profile',
          badge: null,
        },
        {
          icon: Settings,
          label: 'Ayarlar',
          screen: 'settings',
          badge: null,
        },
      ],
    },
  ];

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Menu Content */}
        <View style={styles.menuContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X color="#6B7280" size={24} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.name} {user?.surname}
              </Text>
              <Text style={styles.userPhone}>{user?.phone}</Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{quickStats.totalMatches}</Text>
                <Text style={styles.quickStatLabel}>Maç</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{quickStats.rating}</Text>
                <Text style={styles.quickStatLabel}>Puan</Text>
              </View>
              <View style={styles.quickStatDivider} />
              <View style={styles.quickStatItem}>
                <Text style={styles.quickStatValue}>{quickStats.totalGoals}</Text>
                <Text style={styles.quickStatLabel}>Gol</Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}
          >
            {menuSections.map((section, sectionIndex) => (
              <View key={sectionIndex} style={styles.menuSection}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                
                {section.items.map((item, itemIndex) => {
                  const Icon = item.icon;
                  return (
                    <TouchableOpacity
                      key={itemIndex}
                      style={styles.menuItem}
                      onPress={() => handleNavigation(item.screen)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.menuItemLeft}>
                        <View style={styles.menuIconContainer}>
                          <Icon color="#16a34a" size={20} strokeWidth={2} />
                        </View>
                        <Text style={styles.menuItemLabel}>{item.label}</Text>
                      </View>
                      
                      <View style={styles.menuItemRight}>
                        {item.badge !== null && item.badge > 0 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{item.badge}</Text>
                          </View>
                        )}
                        <ChevronRight color="#9CA3AF" size={20} strokeWidth={2} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Logout Button */}
            <View style={styles.logoutSection}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, styles.logoutIconContainer]}>
                    <LogOut color="#DC2626" size={20} strokeWidth={2} />
                  </View>
                  <Text style={styles.logoutText}>Çıkış Yap</Text>
                </View>
                <ChevronRight color="#9CA3AF" size={20} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Version */}
            <View style={styles.versionContainer}>
              <Text style={styles.versionText}>Versiyon 1.0.0</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    backgroundColor: '#16a34a',
    paddingTop: 40,
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
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#16a34a',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    marginBottom: 16,
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
  quickStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  menuScroll: {
    flex: 1,
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
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
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