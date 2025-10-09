import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Alert } from 'react-native';
import { MenuItem } from './MenuItem';
import { Home, Calendar, Users, Plus, Bell, User, X, LogOut } from 'lucide-react-native'; // ✅ mobil uyumlu
import { useAppContext } from '../context/AppContext';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../api/firebaseConfig';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose }) => {
  const translateX = React.useRef(new Animated.Value(width)).current;
 const { phoneNumber, setPhoneNumber, setUser, setCurrentScreen, user, setIsVerified } = useAppContext();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.clear();
      setUser(null);
      setIsVerified(false);
      setPhoneNumber('');
      setCurrentScreen('login');
    } catch (error: any) {
      console.log('Logout error:', error);
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
    }
  };
  React.useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  return (
    <>
      {/* Menünün kendisi */}
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateX }] },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Menü</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#111" />
          </TouchableOpacity>
        </View>

        <MenuItem icon={Home} label="Ana Sayfa" page="home" />
        <MenuItem icon={Calendar} label="Maçlarım" page="matches" />
        <MenuItem icon={Plus} label="Yeni Maç Oluştur" page="createMatch" />
        <MenuItem icon={Bell} label="Davetler" page="invites" badge={3} />
        <MenuItem icon={Users} label="Oyuncular" page="players" />
        <MenuItem icon={User} label="Profilim" page="profile" />

        <TouchableOpacity style={styles.logoutButton} onPress={()=> handleLogout()}>
          <LogOut size={22} color="#dc2626" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Arka plan overlay */}
      {isOpen && (
        <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#fff',
    elevation: 8,
    padding: 20,
    zIndex: 50,
    marginTop:30
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 6,
    borderRadius: 10,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 14,
    borderRadius: 12,
    marginTop: 30,
  },
  logoutText: {
    marginLeft: 10,
    color: '#dc2626',
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 40,
  },
});
