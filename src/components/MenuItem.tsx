import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useNavigationContext } from '../context/NavigationContext';

interface MenuItemProps {
  icon: React.ComponentType<{ size: number; color?: string }>;
  label: string;
  page: string;
  badge?: number;
}

export const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, label, page, badge }) => {
  const navigation = useNavigationContext();
  const isActive = navigation.currentPage === page;

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate(page)}
      activeOpacity={0.7}
      style={[
        styles.container,
        isActive ? styles.activeContainer : styles.inactiveContainer,
      ]}
    >
      <View style={styles.left}>
        <Icon size={22} color={isActive ? '#fff' : '#374151'} />
        <Text style={[styles.label, isActive ? styles.activeText : styles.inactiveText]}>
          {label}
        </Text>
      </View>

      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  activeContainer: {
    backgroundColor: '#16a34a', // yeşil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveContainer: {
    backgroundColor: '#fff',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  activeText: {
    color: '#fff',
  },
  inactiveText: {
    color: '#374151',
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
