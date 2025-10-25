// src/navigation/AuthNavigator.tsx
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens_v2/auth/LoginScreen';
import { RegisterScreen } from '../screens_v2/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens_v2/auth/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens_v2/auth/EmailVerificationScreen';
import CompleteProfileScreen from '../screens_v2/auth/CompleteProfileScreen';
// import SocialAuthScreen from '../screens/auth/SocialAuthScreen'; // Phase 2
import { AuthStackParamList } from './types';
import { SplashScreen } from '../screens_v2/auth/SplashScreen';
import { WelcomeScreen } from '../screens_v2/auth/WelcomeScreen';
import { OnboardingStorage } from '../services/storage/onboardingStorage';
import { useAuth } from '../hooks';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {


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
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName={initialRoute}
    >
      {/* Main Auth Screens */}
      <Stack.Screen
        name="welcome"
        component={WelcomeScreen}
        options={{
          headerShown: false,
          gestureEnabled: false, // Geri gidemesin
        }}
      />
      <Stack.Screen
        name="login"
        component={LoginScreen}
        options={{
          title: 'Giriş Yap',
          gestureEnabled: false, // ← Login'den geri gidilemesin
        }}
      />

      <Stack.Screen
        name="register"
        component={RegisterScreen}
        options={{
          title: 'Kayıt Ol',
          gestureEnabled: true,
          animation: 'slide_from_bottom',
        }}
      />

      <Stack.Screen
        name="forgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: 'Şifremi Unuttum',
          headerShown: false,
          gestureEnabled: false, // Geri gidemesin
        }}
      />

      {/* Post-Registration Flow */}
      <Stack.Screen
        name="emailVerification"
        component={EmailVerificationScreen}
        options={{
          title: 'E-posta Doğrulama',
          headerShown: false,
          gestureEnabled: false, // Geri gidemesin
        }}
      />

      <Stack.Screen
        name="completeProfile"
        component={CompleteProfileScreen}
        options={{
          title: 'Profili Tamamla',
          headerShown: true,
          gestureEnabled: true, // Geri gidebilir
        }}
      />
      {/* Splash sadece referans için - asla navigate edilmeyecek */}
      {/* <Stack.Screen
        name="splash"
        component={SplashScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      /> */}

      {/* Phase 2: Social 3Auth */}
      {/* <Stack.Screen 
        name="2SocialAuth" 
        component={SocialAuthScreen}
        options={{ title: 'Sosyal Hesaplar' }}
      /> */}
    </Stack.Navigator>
  );
}

/*
================================================================================
NAVIGATION FLOW AÇIKLAMASI
================================================================================

NORMAL LOGIN FLOW:
------------------
1. Login Screen
   ↓ (Email + Password ile giriş)
2. → Main App

REGISTER FLOW:
------------------
1. Login Screen → "Kayıt Ol" tıkla
   ↓
2. Register Screen → Form doldur ve "Kayıt Ol"
   ↓
3. Email Verification Screen → Email doğrula
   ↓ (Email doğrulandı veya "Daha Sonra")
4. Complete Profile Screen → Profili tamamla
   ↓ (3 adımlı: Bilgiler, Sporlar, Pozisyonlar)
5. → Main App

FORGOT PASSWORD FLOW:
------------------
1. Login Screen → "Şifremi Unuttum"
   ↓
2. Forgot Password Screen → Email gir ve "Gönder"
   ↓ (Reset email gönderildi)
3. ← Login Screen (otomatik yönlendirme)

VERIFICATION STATES:
------------------
- Email doğrulanmamış → EmailVerificationScreen göster
- Profil tamamlanmamış → CompleteProfileScreen göster
- Her şey tamam → Main App

GUARDS:
------------------
- EmailVerificationScreen ve CompleteProfileScreen'de geri gidilemiyor (gestureEnabled: false)
- Bu sayede kullanıcı flow'u tamamlamak zorunda

PHASE 2 (Future):
------------------
- SocialAuthScreen eklenecek
- Google, Apple, Facebook entegrasyonu
- Mevcut hesaba bağlama özelliği
*/