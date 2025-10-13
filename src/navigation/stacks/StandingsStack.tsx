// ============================================
// STANDINGS/STATISTICS STACK
// ============================================
// Puan durumu, istatistikler, sıralamalar
// Not: Bu ekranlar LeagueStack içinden de erişilebilir
// Ancak bağımsız bir tab olarak da kullanılabilir

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StandingsStackParamList } from '../types';

// Screens
import {
  StandingsScreen,
  TopScorersScreen,
  TopAssistsScreen,
  MVPScreen,
  PlayerStatsScreen
} from '../../screens';
import { StackHeader } from '../../components/StackHeader';

const Stack = createNativeStackNavigator<StandingsStackParamList>();

export const StandingsStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#16a34a',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      {/* ============================================ */}
      {/* PLAYER STATS (İlk Ekran) */}
      {/* ============================================ */}
      <Stack.Screen
        name="playerStats"
        component={PlayerStatsScreen}
        options={{
          title: 'İstatistiklerim',
          header: (props) => <StackHeader {...props} showMenuButton showCloseButton />,
        }}
        initialParams={{ playerId: undefined }} // ✅ Current user
      />

      <Stack.Screen
        name="standings"
        component={StandingsScreen}
        options={{
          title: 'Puan Durumu',
          header: (props) => <StackHeader {...props} showBackButton />,
        }}
      />

      <Stack.Screen
        name="topScorers"
        component={TopScorersScreen}
        options={{
          title: 'Gol Krallığı',
          headerStyle: {
            backgroundColor: '#F59E0B',
          },
        }}
      />

      <Stack.Screen
        name="topAssists"
        component={TopAssistsScreen}
        options={{
          title: 'Asist Krallığı',
          headerStyle: {
            backgroundColor: '#3B82F6',
          },
        }}
      />

      <Stack.Screen
        name="mvp"
        component={MVPScreen}
        options={{
          title: 'MVP Sıralaması',
          headerStyle: {
            backgroundColor: '#8B5CF6',
          },
        }}
      />
    </Stack.Navigator>
  );
};