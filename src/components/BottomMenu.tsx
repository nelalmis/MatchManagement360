import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Home, Users, Mail, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

export const BottomMenu = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const currentRoute = route.name;

  const menuItems = [
    { name: 'home', label: 'Ana Sayfa', icon: Home },
    { name: 'matches', label: 'Maçlar', icon: Users },
    { name: 'invitations', label: 'Davetler', icon: Mail },
    { name: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <View style={styles.bottomMenu}>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.name;

        return (
          <TouchableOpacity
            key={item.name}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.name)}
          >
            <Icon size={24} color={isActive ? '#2563eb' : '#666'} />
            <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomMenu: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  menuText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
