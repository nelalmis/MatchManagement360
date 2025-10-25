// src/navigation/RootNavigator.tsx - WITH DEBUG LOGS

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { resetAuthState } from '../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { navigationRef } from './NavigationService';
import { linking } from './linking';
import { SideMenu } from '../components/SideMenu';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);

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
      console.log('🔍 [RootNavigator] Starting validation...');
      
      const trustedDevice = await AsyncStorage.getItem('trustedDevice');
      const userData = await AsyncStorage.getItem('userData');
      
      console.log('📊 [RootNavigator] Initial state:', {
        isAuthenticated,
        trustedDevice,
        hasUserData: !!userData,
        userEmailVerified: user?.emailVerified,
      });

      if (isAuthenticated && trustedDevice !== 'true') {
        console.warn('⚠️ [RootNavigator] Invalid state - resetting');
        dispatch(resetAuthState());
        await AsyncStorage.multiRemove(['userData', 'trustedDevice', 'deviceId']);
        setCanAccessMain(false);
      } else {
        checkMainAccess();
      }
      
      setIsValidating(false);
      console.log('✅ [RootNavigator] Validation complete');
    } catch (error) {
      console.error('❌ [RootNavigator] Validation error:', error);
      dispatch(resetAuthState());
      setCanAccessMain(false);
      setIsValidating(false);
    }
  };
  // ✅ CRITICAL: Main'e erişim kontrolü
  const checkMainAccess = () => {
    console.log('🔐 [RootNavigator] Checking main access...');
    console.log('📊 [RootNavigator] User state:', {
      isAuthenticated,
      userEmail: user?.email,
      emailVerified: user?.emailVerified,
    });

    // 1️⃣ Authentication kontrolü
    if (!isAuthenticated || !user) {
      console.log('❌ [RootNavigator] Not authenticated');
      setCanAccessMain(false);
      return;
    }

    // 2️⃣ EMAIL VERIFICATION kontrolü - ÇOK ÖNEMLİ!
    if (!user.emailVerified) {
      console.warn('⚠️ [RootNavigator] Email not verified - blocking main access');
      setCanAccessMain(false);
      return;
    }

    // 3️⃣ Her şey tamam
    console.log('✅ [RootNavigator] All checks passed - allowing main access');
    setCanAccessMain(true);
  };
  if (isValidating) {
    console.log('⏳ [RootNavigator] Showing loading screen');
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer ref={navigationRef} linking={linking as any}>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
          {!canAccessMain ? (
            <>
              <Stack.Screen name="auth" component={AuthNavigator} />
              {/* {console.log('🔓 [RootNavigator] Rendering Auth Stack')} */}
            </>
          ) : (
            <>
              <Stack.Screen name="main" component={MainNavigator} />
              {/* {console.log('🏠 [RootNavigator] Rendering Main Stack')} */}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>

      {canAccessMain && <SideMenu />}
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
  },
  loadingText: {
    fontSize: 18,
    color: '#16a34a',
    marginBottom: 20,
    fontWeight: '600',
  },
});

/*
================================================================================
🔍 DEBUG NASIL ÇALIŞIR?
================================================================================

Console'da şunları göreceksiniz:

LOGIN ÖNCESİ:
-------------
🔍 [RootNavigator] Starting validation...
📊 [RootNavigator] Initial state: { isAuthenticated: false, ... }
✅ [RootNavigator] State is valid
✅ [RootNavigator] Validation complete, validatedAuth = false
📱 [RootNavigator] Rendering stack, validatedAuth = false
🔓 [RootNavigator] Rendering Auth Stack

LOGIN SIRASINDA:
----------------
🔄 [RootNavigator] State changed: { isAuthenticated: false, loading: true, ... }

LOGIN BAŞARILI:
--------------
🔄 [RootNavigator] State changed: { isAuthenticated: true, loading: false, ... }
🔄 [RootNavigator] isAuthenticated changed after validation: true
🔄 [RootNavigator] State changed: { validatedAuth: true, ... }
📱 [RootNavigator] Rendering stack, validatedAuth = true
🏠 [RootNavigator] Rendering Main Stack

Eğer "🏠 Rendering Main Stack" görmüyorsanız:
→ isAuthenticated true olmuyor demektir!

================================================================================
*/