// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens_v2/auth/LoginScreen';
import RegisterScreen from '../screens_v2/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens_v2/auth/ForgotPasswordScreen';
import EmailVerificationScreen from '../screens_v2/auth/EmailVerificationScreen';
import CompleteProfileScreen from '../screens_v2/auth/CompleteProfileScreen';
// import SocialAuthScreen from '../screens/auth/SocialAuthScreen'; // Phase 2

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  EmailVerification: undefined;
  CompleteProfile: undefined;
  // SocialAuth: undefined; // Phase 2
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
      initialRouteName="Login"
    >
      {/* Main Auth Screens */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ title: 'Giriş Yap' }}
      />
      
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ title: 'Kayıt Ol' }}
      />
      
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen}
        options={{ 
          title: 'Şifremi Unuttum',
          headerShown: true,
        }}
      />
      
      {/* Post-Registration Flow */}
      <Stack.Screen 
        name="EmailVerification" 
        component={EmailVerificationScreen}
        options={{ 
          title: 'E-posta Doğrulama',
          headerShown: true,
          gestureEnabled: false, // Geri gidemesin
        }}
      />
      
      <Stack.Screen 
        name="CompleteProfile" 
        component={CompleteProfileScreen}
        options={{ 
          title: 'Profili Tamamla',
          headerShown: true,
          gestureEnabled: false, // Geri gidemesin
        }}
      />

      {/* Phase 2: Social Auth */}
      {/* <Stack.Screen 
        name="SocialAuth" 
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