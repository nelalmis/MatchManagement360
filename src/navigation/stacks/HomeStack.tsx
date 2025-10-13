// ============================================
// HOME STACK (UPDATED)
// ============================================
// Ana sayfa (Dashboard) - Header sabit

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types';
import { HomeScreen } from '../../screens';
import { StackHeader } from '../../components/StackHeader';

// Screens

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true, // ✅ eğer customheader kullansaydık burası false olacaktık
        animation: 'fade',
        contentStyle: {
          backgroundColor: '#F9FAFB',
        },
      }}
    >
      <Stack.Screen
        name="home"
        component={HomeScreen}
        options={{
          title: 'Ana Sayfa',
          header: (props) => (
            <StackHeader
              {...props}
              showMenuButton
              showNotificationButton
              onNotification={() => console.log('Notifications')}
            />
          ),
        }}
      />
    </Stack.Navigator>
  );
};