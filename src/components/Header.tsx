import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { 
  Menu, 
  X, 
  ArrowLeft, 
  Plus,
  Search,
  Bell,
  MoreVertical,
  User
} from 'lucide-react-native';
import { useAppContext } from '../context/AppContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  
  // Sol taraf için seçenekler
  leftIcon?: 'profile' | 'back' | 'none';
  onLeftPress?: () => void;
  
  // Sağ taraf için seçenekler
  rightIcon?: 'menu' | 'plus' | 'search' | 'bell' | 'more' | 'none';
  menuOpen?: boolean;
  setMenuOpen?: (open: boolean) => void;
  onRightPress?: () => void;
  rightBadge?: number;
  
  // Custom icon (opsiyonel)
  customLeftIcon?: React.ReactNode;
  customRightIcon?: React.ReactNode;
  
  // Stil özelleştirme
  backgroundColor?: string;
  titleColor?: string;
  
  // Profile mode (Home screen için)
  showProfile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Maç Yönetimi",
  subtitle,
  leftIcon = 'profile',
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
  showProfile = false,
}) => {
  const { user } = useAppContext();

  // Sol icon render
  const renderLeftIcon = () => {
    if (customLeftIcon) return customLeftIcon;

    switch (leftIcon) {
      case 'profile':
        if (showProfile && user) {
          return (
            <TouchableOpacity
              onPress={onLeftPress}
              style={styles.profileButton}
              activeOpacity={0.8}
            >
              {user.profilePhoto ? (
                <Image 
                  source={{ uri: user.profilePhoto }} 
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <User size={20} color="#16a34a" strokeWidth={2.5} />
                </View>
              )}
              <View style={styles.profileTextContainer}>
                <Text style={styles.profileGreeting}>
                  {getGreeting()}
                </Text>
                <Text style={styles.profileName} numberOfLines={1}>
                  {user.name} 👋
                </Text>
              </View>
            </TouchableOpacity>
          );
        }
        return (
          <View style={styles.iconContainer}>
            <User size={24} color={titleColor} strokeWidth={2} />
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Günaydın,';
    if (hour < 18) return 'İyi günler,';
    return 'İyi akşamlar,';
  };

  return (
    <View style={[styles.header, { backgroundColor }]}>
      <View style={styles.inner}>
        {showProfile ? (
          <>
            {renderLeftIcon()}
            {renderRightIcon()}
          </>
        ) : (
          <>
            <View style={styles.left}>
              {renderLeftIcon()}
              {!showProfile && (
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
              )}
            </View>
            {renderRightIcon()}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
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
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  profileGreeting: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 2,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.3,
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