// components/SideMenu/SideMenu.tsx

import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Animated,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSideMenu } from '../context/SideMenuContext';
import { SideMenuContent } from '../navigation/SideMenuContent';

const { width } = Dimensions.get('window');
const MENU_WIDTH = width * 0.8; // ✅ 80% ekran genişliği

export const SideMenu: React.FC = () => {
  const { isOpen, closeMenu } = useSideMenu();
  const [slideAnim] = React.useState(new Animated.Value(-MENU_WIDTH));
  const [opacityAnim] = React.useState(new Animated.Value(0));

  useEffect(() => {
    if (isOpen) {
      // Menu açılırken
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Menu kapanırken
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -MENU_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={closeMenu}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            { opacity: opacityAnim }
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeMenu}
          />
        </Animated.View>

        {/* Side Menu */}
        <Animated.View
          style={[
            styles.menuContainer,
            {
              width: MENU_WIDTH,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          <SideMenuContent onClose={closeMenu} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});