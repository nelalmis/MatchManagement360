// src/navigation/RootNavigator.tsx - WITH MAINTENANCE MODE

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetAuthState } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { linking } from './linking';
import { SideMenu } from '../components/SideMenu';
import { MainNavigatorV2 } from './MainNavigatorV2';
import { useAppConfig } from '../hooks/useAppConfig';
import { MaintenanceScreen } from '../screens/Common/MaintenanceScreen';
import { navigationRef } from './navigationServices/NavigationBaseService';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);
  const { isMaintenanceMode, config, loading: configLoading } = useAppConfig();

  const [isValidating, setIsValidating] = useState(true);
  const [canAccessMain, setCanAccessMain] = useState(false);

  useEffect(() => {
    validateAuthState();
  }, []);

  // ✅ isAuthenticated veya user değiştiğinde kontrol et
  useEffect(() => {
    if (!isValidating) {
      checkMainAccess();
    }
  }, [isAuthenticated, user, isValidating]);

  const validateAuthState = async () => {
    try {
      const trustedDevice = await AsyncStorage.getItem('trustedDevice');
      const userData = await AsyncStorage.getItem('userData');

      if (isAuthenticated && trustedDevice !== 'true') {
        console.warn('⚠️ [RootNavigator] Invalid state - resetting');
        dispatch(resetAuthState());
        await AsyncStorage.multiRemove(['userData', 'trustedDevice', 'deviceId']);
        setCanAccessMain(false);
      } else {
        checkMainAccess();
      }

      setIsValidating(false);
    } catch (error) {
      console.error('❌ [RootNavigator] Validation error:', error);
      dispatch(resetAuthState());
      setCanAccessMain(false);
      setIsValidating(false);
    }
  };

  const checkMainAccess = () => {
    // 1️⃣ Authentication kontrolü
    if (!isAuthenticated || !user) {
      setCanAccessMain(false);
      return;
    }

    // 2️⃣ EMAIL VERIFICATION kontrolü
    if (!user.emailVerified) {
      console.warn('⚠️ [RootNavigator] Email not verified - blocking main access');
      setCanAccessMain(false);
      return;
    }

    // 3️⃣ Her şey tamam
    setCanAccessMain(true);
  };

  // ✅ MAINTENANCE MODE CHECK - EN ÖNCE
  if (isMaintenanceMode) {
    console.log('🛠️ [RootNavigator] Maintenance mode active');
    return <MaintenanceScreen />;
  }

  // ✅ Config loading
  if (configLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yapılandırma yükleniyor...</Text>
      </View>
    );
  }

  // ✅ Auth validation loading
  if (isValidating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef} linking={linking as any}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {!canAccessMain ? (
            <Stack.Screen name="auth" component={AuthNavigator} />
          ) : (
            <Stack.Screen name="main" component={MainNavigatorV2} />
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {canAccessMain && <SideMenu />}
    </>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  loadingText: {
    fontSize: 16,
    color: '#16a34a',
    marginTop: 16,
    fontWeight: '600',
  },
});