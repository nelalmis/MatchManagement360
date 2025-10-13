// ============================================
// LEAGUE STACK
// ============================================
// Lig ile ilgili tüm ekranlar

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LeagueStackParamList } from '../types';
import { TouchableOpacity, Text } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

// Screens
import {
  LeagueListScreen,
  LeagueDetailScreen,
  CreateLeagueScreen,
  EditLeagueScreen,
  StandingsScreen,
  TopScorersScreen,
  TopAssistsScreen,
  MVPScreen
} from '../../screens';
import { StackHeader } from '../../components/StackHeader';

const Stack = createNativeStackNavigator<LeagueStackParamList>();

export const LeagueStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        // headerStyle: {
        //   backgroundColor: '#16a34a',
        // },
        // headerTintColor: '#fff',
        // headerTitleStyle: {
        //   fontWeight: '700',
        //   fontSize: 18,
        // },
        // headerBackTitleVisible: false,
        // animation: 'slide_from_right',
        // gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="leagueList"
        component={LeagueListScreen}
        options={{
                  headerShown: true,
          title: 'Liglerim',
          header: (props) => <StackHeader {...props} showMenuButton />, // ✅
        }}
      />

      <Stack.Screen
        name="leagueDetail"
        component={LeagueDetailScreen}
        options={{
          title: 'Lig Detayı',
          headerShown:false,
          //header: (props) => <StackHeader {...props} showBackButton />, // ✅
        }}
      />

      <Stack.Screen
        name="createLeague"
        component={CreateLeagueScreen}
        options={{
          title: 'Yeni Lig Oluştur',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          header: (props) => <StackHeader {...props} showCloseButton />, // ✅
        }}
      />

      <Stack.Screen
        name="editLeague"
        component={EditLeagueScreen}
        options={{
          title: 'Lig Düzenle',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown:false,
         // header: (props) => <StackHeader {...props} showCloseButton />, // ✅
        }}
      />

      <Stack.Screen
        name="standings"
        component={StandingsScreen}
        options={{
          title: 'Puan Durumu',
          header: (props) => <StackHeader {...props} showCloseButton />, // ✅
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
          header: (props) => <StackHeader {...props} showBackButton />,
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
          header: (props) => <StackHeader {...props} showBackButton />,
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
          header: (props) => <StackHeader {...props} showBackButton />,

        }}
      />
      
    </Stack.Navigator>
  );
};