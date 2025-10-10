import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  Users, 
  Menu, 
  X, 
  ArrowLeft, 
  Plus,
  Search,
  Bell,
  MoreVertical
} from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string; // Alt başlık ekledik (opsiyonel)
  
  // Sol taraf için seçenekler
  leftIcon?: 'users' | 'back' | 'none';
  onLeftPress?: () => void;
  
  // Sağ taraf için seçenekler
  rightIcon?: 'menu' | 'plus' | 'search' | 'bell' | 'more' | 'none';
  menuOpen?: boolean;
  setMenuOpen?: (open: boolean) => void;
  onRightPress?: () => void; // Sağ icon için custom action
  rightBadge?: number; // Badge sayısı (örn: bildirim sayısı)
  
  // Custom icon (opsiyonel)
  customLeftIcon?: React.ReactNode;
  customRightIcon?: React.ReactNode;
  
  // Stil özelleştirme
  backgroundColor?: string;
  titleColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Maç Yönetimi",
  subtitle,
  leftIcon = 'users',
  onLeftPress,
  rightIcon = 'menu',
  menuOpen = false,
  setMenuOpen,
  onRightPress,
  rightBadge,
  customLeftIcon,
  customRightIcon,
  backgroundColor = '#16a34a',
  titleColor = 'white',
}) => {
  // Sol icon render
  const renderLeftIcon = () => {
    if (customLeftIcon) return customLeftIcon;

    switch (leftIcon) {
      case 'users':
        return (
          <View style={styles.iconContainer}>
            <Users size={24} color={titleColor} strokeWidth={2} />
          </View>
        );
      case 'back':
        return (
          <TouchableOpacity
            onPress={onLeftPress}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={titleColor} strokeWidth={2} />
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

    const iconSize = 24;
    const iconColor = titleColor;

    switch (rightIcon) {
      case 'menu':
        return (
          <TouchableOpacity
            onPress={() => setMenuOpen?.(!menuOpen)}
            style={styles.rightButton}
            activeOpacity={0.7}
          >
            {menuOpen ? (
              <X size={iconSize} color={iconColor} strokeWidth={2} />
            ) : (
              <Menu size={iconSize} color={iconColor} strokeWidth={2} />
            )}
          </TouchableOpacity>
        );
      
      case 'plus':
        return (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.rightButton}
            activeOpacity={0.7}
          >
            <Plus size={iconSize} color={iconColor} strokeWidth={2} />
          </TouchableOpacity>
        );
      
      case 'search':
        return (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.rightButton}
            activeOpacity={0.7}
          >
            <Search size={iconSize} color={iconColor} strokeWidth={2} />
          </TouchableOpacity>
        );
      
      case 'bell':
        return (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.rightButton}
            activeOpacity={0.7}
          >
            <View>
              <Bell size={iconSize} color={iconColor} strokeWidth={2} />
              {rightBadge && rightBadge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {rightBadge > 9 ? '9+' : rightBadge}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      
      case 'more':
        return (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.rightButton}
            activeOpacity={0.7}
          >
            <MoreVertical size={iconSize} color={iconColor} strokeWidth={2} />
          </TouchableOpacity>
        );
      
      case 'none':
        return <View style={styles.headerSpacer} />;
      
      default:
        return null;
    }
  };

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          {renderLeftIcon()}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: titleColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        {renderRightIcon()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginTop: 30,
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    marginTop: 2,
  },
  rightButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
});