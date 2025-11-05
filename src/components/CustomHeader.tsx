// components/CustomHeader.tsx

import React, { useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Platform, 
  ActivityIndicator, 
  StatusBar,
  AppState,
  AppStateStatus
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Menu,
  ChevronLeft,
  X,
  Plus,
  Search,
  Bell,
  Edit2,
  Save,
  Filter,
  MoreVertical,
  Settings,
  Trophy,
  Share2,
  Bookmark,
} from 'lucide-react-native';
import { useSideMenu } from '../context/SideMenuContext';
import type { SportType } from '../types/entity/types';
import { getSportEmoji, getSportPrimaryColor } from '../utils/theme';

interface CustomHeaderProps {
  // Title
  title: string;
  subtitle?: string;

  // Sport icon - Branş ikonu göstermek için
  sportType?: SportType;
  showIcon?: boolean;
  customIcon?: React.ComponentType<any> | string;

  // LEFT BUTTON (Sadece biri seçilebilir)
  showMenu?: boolean;
  showBack?: boolean;
  showClose?: boolean;
  onLeftPress?: () => void;

  // RIGHT BUTTONS (Birden fazla olabilir)
  showNotifications?: boolean;
  showSearch?: boolean;
  showCreate?: boolean;
  showEdit?: boolean;
  showSave?: boolean;
  showFilter?: boolean;
  showMore?: boolean;
  showSettings?: boolean;
  showShare?: boolean;
  showBookmark?: boolean;

  // Callbacks
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onCreatePress?: () => void;
  onEditPress?: () => void;
  onSavePress?: () => void;
  onFilterPress?: () => void;
  onMorePress?: () => void;
  onSettingsPress?: () => void;
  onSharePress?: () => void;
  onBookmarkPress?: () => void;

  // Styling
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  notificationCount?: number;
  loading?: boolean;
  disableSave?: boolean;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  subtitle,
  sportType,
  showIcon: showIcon = false,
  showMenu = false,
  showBack = false,
  showClose = false,
  onLeftPress,
  showNotifications = false,
  showSearch = false,
  showCreate = false,
  showEdit = false,
  showSave = false,
  showFilter = false,
  showMore = false,
  showSettings = false,
  showShare = false,
  showBookmark = false,
  onNotificationPress,
  onSearchPress,
  onCreatePress,
  onEditPress,
  onSavePress,
  onFilterPress,
  onMorePress,
  onSettingsPress,
  onSharePress,
  onBookmarkPress,
  backgroundColor = '#16a34a',
  textColor = 'white',
  iconColor = 'white',
  notificationCount,
  loading = false,
  disableSave = false,
  customIcon
}) => {
  const { openMenu } = useSideMenu();

  // Sport config'den icon ve renk al - useMemo ile optimize et
  const SportIcon = useMemo(() => 
    customIcon ? customIcon : (sportType ? getSportEmoji(sportType) || null : null),
    [customIcon, sportType]
  );
  // Final background color'u useMemo ile hesapla
  const finalBackgroundColor = useMemo(() => {
    if (sportType && backgroundColor === '#16a34a') {
      const sportColor = getSportPrimaryColor(sportType);
      console.log("FinalColor=", sportColor || backgroundColor)
      return sportColor || backgroundColor;
    }
    console.log("FinalColor=", backgroundColor);
    return backgroundColor;
  }, [sportType, backgroundColor]);

  // StatusBar'ı güncelle - finalBackgroundColor değiştiğinde
  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(false);
      StatusBar.setBackgroundColor(finalBackgroundColor);
      StatusBar.setBarStyle(textColor === 'white' ? 'light-content' : 'dark-content');
    }
  }, [finalBackgroundColor, textColor]);

  // AppState listener - Sadece background'dan dönüş için
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor(finalBackgroundColor);
        StatusBar.setBarStyle(textColor === 'white' ? 'light-content' : 'dark-content');
      }
    });

    return () => {
      subscription.remove();
    };
  }, [finalBackgroundColor, textColor]);

  // LEFT BUTTON HANDLER
  const handleLeftPress = () => {
    if (onLeftPress) {
      onLeftPress();
    } else if (showMenu) {
      openMenu();
    }
  };

  // RENDER LEFT BUTTON
  const renderLeftButton = () => {
    if (showMenu) {
      return (
        <TouchableOpacity
          style={styles.button}
          onPress={handleLeftPress}
          activeOpacity={0.7}
        >
          <Menu size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showBack) {
      return (
        <TouchableOpacity
          style={styles.button}
          onPress={handleLeftPress}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showClose) {
      return (
        <TouchableOpacity
          style={styles.button}
          onPress={handleLeftPress}
          activeOpacity={0.7}
        >
          <X size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    return <View style={styles.button} />;
  };

  // RENDER RIGHT BUTTONS
  const renderRightButtons = () => {
    const buttons = [];

    if (showSettings && onSettingsPress) {
      buttons.push(
        <TouchableOpacity
          key="settings"
          style={styles.iconButton}
          onPress={onSettingsPress}
          activeOpacity={0.7}
        >
          <Settings size={22} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showMore && onMorePress) {
      buttons.push(
        <TouchableOpacity
          key="more"
          style={styles.iconButton}
          onPress={onMorePress}
          activeOpacity={0.7}
        >
          <MoreVertical size={22} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showFilter && onFilterPress) {
      buttons.push(
        <TouchableOpacity
          key="filter"
          style={styles.iconButton}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Filter size={20} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showSearch && onSearchPress) {
      buttons.push(
        <TouchableOpacity
          key="search"
          style={styles.iconButton}
          onPress={onSearchPress}
          activeOpacity={0.7}
        >
          <Search size={22} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showCreate && onCreatePress) {
      buttons.push(
        <TouchableOpacity
          key="create"
          style={styles.iconButton}
          onPress={onCreatePress}
          activeOpacity={0.7}
        >
          <Plus size={24} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showEdit && onEditPress) {
      buttons.push(
        <TouchableOpacity
          key="edit"
          style={styles.iconButton}
          onPress={onEditPress}
          activeOpacity={0.7}
        >
          <Edit2 size={20} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showSave && onSavePress) {
      buttons.push(
        <TouchableOpacity
          key="save"
          style={styles.iconButton}
          onPress={onSavePress}
          activeOpacity={0.7}
          disabled={disableSave || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            <Save size={20} color={iconColor} strokeWidth={2} />
          )}
        </TouchableOpacity>
      );
    }

    if (showBookmark && onBookmarkPress) {
      buttons.push(
        <TouchableOpacity
          key="bookmark"
          style={styles.iconButton}
          onPress={onBookmarkPress}
          activeOpacity={0.7}
        >
          <Bookmark size={22} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (showNotifications && onNotificationPress) {
      buttons.push(
        <TouchableOpacity
          key="notification"
          style={styles.iconButton}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <View>
            <Bell size={22} color={iconColor} strokeWidth={2} />
            {notificationCount && notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    }

    if (showShare && onSharePress) {
      buttons.push(
        <TouchableOpacity
          key="share"
          style={styles.iconButton}
          onPress={onSharePress}
          activeOpacity={0.7}
        >
          <Share2 size={22} color={iconColor} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (buttons.length === 0) {
      return <View style={styles.button} />;
    }

    return <View style={styles.rightButtons}>{buttons}</View>;
  };

  return (
    <>
      <StatusBar
        barStyle={textColor === 'white' ? 'light-content' : 'dark-content'}
        backgroundColor={finalBackgroundColor}
        translucent={false}
      />
      
      <SafeAreaView 
        style={[styles.safeArea, { backgroundColor: finalBackgroundColor }]}
        edges={['top']}
      >
        <View style={styles.header}>
          {/* Left Button */}
          {renderLeftButton()}

          {/* Center Title with Sport Icon */}
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              {showIcon && SportIcon && (
                <View style={styles.sportIconContainer}>
                  {typeof SportIcon === 'string' ? (
                    <Text style={styles.sportEmoji}>{SportIcon}</Text>
                  ) : (
                    <SportIcon size={20} color={textColor} strokeWidth={2} />
                  )}
                </View>
              )}
              <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: textColor === 'white' ? 'rgba(255, 255, 255, 0.9)' : textColor }
                ]}
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Right Buttons */}
          {renderRightButtons()}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportIconContainer: {
    marginRight: 8,
  },
  sportEmoji: {
    fontSize: 20,
    lineHeight: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  headerEmoji: {
    fontSize: 20,
  },
});