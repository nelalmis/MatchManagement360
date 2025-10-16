// ============================================
// AUTH STACK
// ============================================
// Giriş yapmamış kullanıcılar için ekranlar

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens (src/screens/)
import { LoginScreen, RegisterScreen, PhoneVerificationScreen } from '../screens';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="login"
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