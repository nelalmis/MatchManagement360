import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Menu, X } from 'lucide-react-native'; // ✅ doğru paket (mobil)

interface HeaderProps {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ menuOpen, setMenuOpen, title }) => (
  <View style={styles.header}>
    <View style={styles.inner}>
      <View style={styles.left}>
        <View style={styles.iconContainer}>
          <Users size={24} color="white" />
        </View>
        <Text style={styles.title}>{title || "Maç Yönetimi"}</Text>
      </View>
      <TouchableOpacity
        onPress={() => setMenuOpen(!menuOpen)}
        style={styles.menuButton}
        activeOpacity={0.7}
      >
        {menuOpen ? <X size={24} color="white" /> : <Menu size={24} color="white" />}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  header: {
    marginTop: 30,
    backgroundColor: '#16a34a', // yeşil ton
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4, // Android gölgesi
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
    borderRadius: 12,
  },
});
