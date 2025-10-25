// ============================================
// AUTH STACK
// ============================================
// Giriş yapmamış kullanıcılar için ekranlar

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens (src/screens/)
import { RegisterScreen, PhoneVerificationScreen } from '../screens';
import { AuthStackParamList } from './types';
import LoginScreen from '../screens_v2/auth/LoginScreen';
import { useAuth } from '../hooks';
import { OnboardingStorage } from '../services/storage/onboardingStorage';
import { SplashScreen } from '../screens_v2/auth/SplashScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {

  const { checkAutoLogin } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof AuthStackParamList>('splash');
  
  useEffect(() => {
    initializeAuthFlow();
  }, []);

  const initializeAuthFlow = async () => {
    try {
      console.log('🔍 AuthNavigator - Initializing...');

      // 1. Auto-login check
      const autoLoginUser = await checkAutoLogin();

      if (autoLoginUser) {
        // Auto-login başarılı - RootNavigator Main stack'e geçecek
        console.log('✅ Auto-login successful, RootNavigator will handle navigation');
        setIsInitializing(false);
        return;
      }

      // 2. Onboarding check
      const isFirstLaunch = await OnboardingStorage.isFirstLaunch();

      if (isFirstLaunch) {
        // İlk açılış - Welcome'a git
        console.log('➡️ First launch - Starting with Welcome');
        setInitialRoute('welcome');
      } else {
        // İlk açılış değil - Login'e git
        console.log('➡️ Not first launch - Starting with Login');
        setInitialRoute('login');
      }

      // Minimum loading time (smooth transition için)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsInitializing(false);
    } catch (error) {
      console.error('❌ AuthNavigator initialization error:', error);
      setInitialRoute('login');
      setIsInitializing(false);
    }
  };

  // ✅ İlk yükleme sırasında splash göster
  if (isInitializing) {
    return <SplashScreen navigation={undefined as any} route={undefined as any} />;
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',

      }}
    >
      <Stack.Screen
        name="login"
        component={LoginScreen}
        options={{
          title: 'Giriş Yap',
        }}
      />

      <Stack.Screen
        name="register"
        component={RegisterScreen}
        options={{
          title: 'Kayıt Ol',
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="phoneVerification"
        component={PhoneVerificationScreen}
        options={{
          title: 'Telefon Doğrulama',
          gestureEnabled: false, // Geri gitmesini engelle
        }}
      />
    </Stack.Navigator>
  );
};