// ============================================
// CUSTOM HEADER COMPONENT
// ============================================
// Drawer button'lu özel header

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { Menu, X } from 'lucide-react-native';
import { DrawerContent } from '../navigation/DrawerNavigation';

interface CustomHeaderProps {
  title?: string;
  backgroundColor?: string;
  showDrawer?: boolean;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({ 
  title, 
  backgroundColor = '#16a34a',
  showDrawer = true,
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  return (
    <>
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.content}>
          {/* Left: Menu Button */}
          {showDrawer && (
            <TouchableOpacity
              onPress={() => setDrawerVisible(true)}
              style={styles.menuButton}
            >
              <Menu size={24} color="#fff" />
            </TouchableOpacity>
          )}

          {/* Center: Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Right: Placeholder (for balance) */}
          <View style={{ width: 40 }} />
        </View>
      </View>

      {/* Drawer Modal */}
      <Modal
        visible={drawerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDrawerVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Overlay */}
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setDrawerVisible(false)}
          />

          {/* Drawer Content */}
          <View style={styles.drawerContainer}>
            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setDrawerVisible(false)}
              style={styles.closeButton}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>

            <DrawerContent onClose={() => setDrawerVisible(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});