import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Menu, X, ArrowLeft, LucideIcon } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  // Sol taraf için seçenekler
  leftIcon?: 'users' | 'back' | 'none';
  onLeftPress?: () => void;
  // Sağ taraf için seçenekler
  rightIcon?: 'menu' | 'none';
  menuOpen?: boolean;
  setMenuOpen?: (open: boolean) => void;
  // Custom icon (opsiyonel)
  customLeftIcon?: React.ReactNode;
  customRightIcon?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Maç Yönetimi",
  leftIcon = 'users',
  onLeftPress,
  rightIcon = 'menu',
  menuOpen = false,
  setMenuOpen,
  customLeftIcon,
  customRightIcon,
}) => {
  // Sol icon render
  const renderLeftIcon = () => {
    if (customLeftIcon) return customLeftIcon;

    switch (leftIcon) {
      case 'users':
        return (
          <View style={styles.iconContainer}>
            <Users size={24} color="white" strokeWidth={2} />
          </View>
        );
      case 'back':
        return (
          <TouchableOpacity
            onPress={onLeftPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="white" strokeWidth={2} />
          </TouchableOpacity>
        );
      case 'none':
        return <View style={styles.headerSpacer} />;
      default:
        return null;
    }
  };

  // Sağ icon render
  const renderRightIcon = () => {
    if (customRightIcon) return customRightIcon;

    switch (rightIcon) {
      case 'menu':
        return (
          <TouchableOpacity
            onPress={() => setMenuOpen?.(!menuOpen)}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            {menuOpen ? (
              <X size={24} color="white" strokeWidth={2} />
            ) : (
              <Menu size={24} color="white" strokeWidth={2} />
            )}
          </TouchableOpacity>
        );
      case 'none':
        return <View style={styles.headerSpacer} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {renderLeftIcon()}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {renderRightIcon()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop:30,
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
});