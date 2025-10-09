import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigationContext } from '../context/NavigationContext';
import { Home, Calendar, Plus, Bell, User } from 'lucide-react-native'; // ✅ mobil için doğru paket

interface NavButtonProps {
  page: string;
  icon: React.ComponentType<{ size: number; color?: string }>;
  label: string;
  isCenter?: boolean;
}

export const BottomNav: React.FC = () => {
  const navigation = useNavigationContext();

  const NavButton: React.FC<NavButtonProps> = ({
    page,
    icon: Icon,
    label,
    isCenter = false,
  }) => {
    const isActive = navigation.currentPage === page;
    const color = isActive ? '#16a34a' : '#9ca3af'; // yeşil ve gri tonları

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate(page)}
        style={[styles.button, isCenter && styles.centerButton]}
      >
        {isCenter ? (
          <View style={styles.centerIconContainer}>
            <Icon size={28} color="white" />
          </View>
        ) : (
          <Icon size={24} color={color} />
        )}
        <Text style={[styles.label, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.navbar}>
      <NavButton page="home" icon={Home} label="Ana Sayfa" />
      <NavButton page="matches" icon={Calendar} label="Maçlarım" />
      <NavButton page="createMatch" icon={Plus} label="Oluştur" isCenter />
      <View style={{ position: 'relative' }}>
        <NavButton page="invites" icon={Bell} label="Davetler" />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </View>
      <NavButton page="profile" icon={User} label="Profil" />
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    // flexDirection: 'row',
    // justifyContent: 'space-around',
    // paddingVertical: 10,
    // backgroundColor: '#fff',
    // borderTopWidth: 1,
    // borderTopColor: '#e5e7eb',
    position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  flexDirection: 'row',
  justifyContent: 'space-around',
  paddingVertical: 10,
  backgroundColor: '#fff',
  borderTopWidth: 1,
  borderTopColor: '#e5e7eb',
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowOffset: { width: 0, height: -1 },
  shadowRadius: 4,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    marginTop: -20,
  },
  centerIconContainer: {
    backgroundColor: '#16a34a',
    padding: 12,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
