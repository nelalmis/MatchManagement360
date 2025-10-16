// components/CustomHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
} from 'lucide-react-native';
import { useSideMenu } from '../context/SideMenuContext';

interface CustomHeaderProps {
  // Title
  title: string;
  subtitle?: string;

  // LEFT BUTTON (Sadece biri seçilebilir)
  showMenu?: boolean;        // Ana tab ekranları için
  showBack?: boolean;        // Detail ekranlar için
  showClose?: boolean;       // Modal tarzı ekranlar için
  onLeftPress?: () => void;  // Custom left action

  // RIGHT BUTTONS (Birden fazla olabilir)
  showNotifications?: boolean;
  showSearch?: boolean;
  showCreate?: boolean;
  showEdit?: boolean;
  showSave?: boolean;
  showFilter?: boolean;
  showMore?: boolean;
  showSettings?: boolean;

  // Callbacks
  onNotificationPress?: () => void;
  onSearchPress?: () => void;
  onCreatePress?: () => void;
  onEditPress?: () => void;
  onSavePress?: () => void;
  onFilterPress?: () => void;
  onMorePress?: () => void;
  onSettingsPress?: () => void;

  // Styling
  backgroundColor?: string;
  notificationCount?: number; // Badge için
  loading?: boolean; // Save butonu için loading state
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  subtitle,
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
  onNotificationPress,
  onSearchPress,
  onCreatePress,
  onEditPress,
  onSavePress,
  onFilterPress,
  onMorePress,
  onSettingsPress,
  backgroundColor = '#16a34a',
  notificationCount,
  loading = false,
}) => {
  const { openMenu } = useSideMenu();

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
          <Menu size={24} color="white" strokeWidth={2} />
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
          <ChevronLeft size={24} color="white" strokeWidth={2} />
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
          <X size={24} color="white" strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    return <View style={styles.button} />;
  };

  // RENDER RIGHT BUTTONS
  const renderRightButtons = () => {
    const buttons = [];

    // Settings Button
    if (showSettings && onSettingsPress) {
      buttons.push(
        <TouchableOpacity 
          key="settings" 
          style={styles.iconButton} 
          onPress={onSettingsPress} 
          activeOpacity={0.7}
        >
          <Settings size={22} color="white" strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    // More Button
    if (showMore && onMorePress) {
      buttons.push(
        <TouchableOpacity 
          key="more" 
          style={styles.iconButton} 
          onPress={onMorePress} 
          activeOpacity={0.7}
        >
          <MoreVertical size={22} color="white" strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    // Filter Button
    if (showFilter && onFilterPress) {
      buttons.push(
        <TouchableOpacity 
          key="filter" 
          style={styles.iconButton} 
          onPress={onFilterPress} 
          activeOpacity={0.7}
        >
          <Filter size={20} color="white" strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    // Search Button
    if (showSearch && onSearchPress) {
      buttons.push(
        <TouchableOpacity 
          key="search" 
          style={styles.iconButton} 
          onPress={onSearchPress} 
          activeOpacity={0.7}
        >
          <Search size={22} color="white" strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    // Create Button
    if (showCreate && onCreatePress) {
      buttons.push(
        <TouchableOpacity 
          key="create" 
          style={styles.iconButton} 
          onPress={onCreatePress} 
          activeOpacity={0.7}
        >
          <Plus size={24} color="white" strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    // Edit Button
    if (showEdit && onEditPress) {
      buttons.push(
        <TouchableOpacity 
          key="edit" 
          style={styles.iconButton} 
          onPress={onEditPress} 
          activeOpacity={0.7}
        >
          <Edit2 size={20} color="white" strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    // Save Button (with loading state)
    if (showSave && onSavePress) {
      buttons.push(
        <TouchableOpacity 
          key="save" 
          style={styles.iconButton} 
          onPress={onSavePress} 
          activeOpacity={0.7}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingDot} />
          ) : (
            <Save size={20} color="white" strokeWidth={2} />
          )}
        </TouchableOpacity>
      );
    }

    // Notification Button (with badge)
    if (showNotifications && onNotificationPress) {
      buttons.push(
        <TouchableOpacity 
          key="notification" 
          style={styles.iconButton} 
          onPress={onNotificationPress} 
          activeOpacity={0.7}
        >
          <View>
            <Bell size={22} color="white" strokeWidth={2} />
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

    if (buttons.length === 0) {
      return <View style={styles.button} />;
    }

    return <View style={styles.rightButtons}>{buttons}</View>;
  };

  return (
    <View style={[styles.header, { backgroundColor }]}>
      {/* Left Button */}
      {renderLeftButton()}

      {/* Center Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Buttons */}
      {renderRightButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
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
  loadingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
});