// src/navigation/MainStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabs from '../MainTabs';

import {
  // League
  LeagueDetailScreen,
  CreateLeagueScreen,
  EditLeagueScreen,
  
  // Fixture
  FixtureListScreen,
  FixtureDetailScreen,
  CreateFixtureScreen,
  EditFixtureScreen,
  
  // Match
  MatchListScreen,
  MatchDetailScreen,
  MatchRegistrationScreen,
  TeamBuildingScreen,
  ScoreEntryScreen,
  GoalAssistEntryScreen,
  PlayerRatingScreen,
  PaymentTrackingScreen,
  
  // Standings
  StandingsScreen,
  TopScorersScreen,
  TopAssistsScreen,
  MVPScreen,
  
  // Player
  EditProfileScreen,
  PlayerStatsScreen,
  SelectPositionsScreen,
  
  // Settings
  SettingsScreen,
  NotificationSettingsScreen,
} from '../../screens';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Main Tabs */}
      <Stack.Screen name="mainTabs" component={MainTabs} />

      {/* LEAGUE */}
      <Stack.Screen 
        name="leagueDetail" 
        component={LeagueDetailScreen}
        options={{ headerShown: false, title: 'Lig Detayı' }}
      />
      <Stack.Screen 
        name="createLeague" 
        component={CreateLeagueScreen}
        options={{ headerShown: true, title: 'Lig Oluştur' }}
      />
      <Stack.Screen 
        name="editLeague" 
        component={EditLeagueScreen}
        options={{ headerShown: true, title: 'Lig Düzenle' }}
      />

      {/* FIXTURE */}
      <Stack.Screen 
        name="fixtureList" 
        component={FixtureListScreen}
        options={{ headerShown: false, title: 'Fikstürler' }}
      />
      <Stack.Screen 
        name="fixtureDetail" 
        component={FixtureDetailScreen}
        options={{ headerShown: true, title: 'Fikstür Detayı' }}
      />
      <Stack.Screen 
        name="createFixture" 
        component={CreateFixtureScreen}
        options={{ headerShown: true, title: 'Fikstür Oluştur' }}
      />
      <Stack.Screen 
        name="editFixture" 
        component={EditFixtureScreen}
        options={{ headerShown: true, title: 'Fikstür Düzenle' }}
      />

      {/* MATCH */}
      <Stack.Screen 
        name="matchList" 
        component={MatchListScreen}
        options={{ headerShown: true, title: 'Maçlar' }}
      />
      <Stack.Screen 
        name="matchDetail" 
        component={MatchDetailScreen}
        options={{ headerShown: true, title: 'Maç Detayı' }}
      />
      <Stack.Screen 
        name="matchRegistration" 
        component={MatchRegistrationScreen}
        options={{ 
          headerShown: true, 
          title: 'Maça Kayıt Ol',
          presentation: 'modal'
        }}
      />
      <Stack.Screen 
        name="teamBuilding" 
        component={TeamBuildingScreen}
        options={{ headerShown: true, title: 'Takım Kur' }}
      />
      <Stack.Screen 
        name="scoreEntry" 
        component={ScoreEntryScreen}
        options={{ headerShown: true, title: 'Skor Gir' }}
      />
      <Stack.Screen 
        name="goalAssistEntry" 
        component={GoalAssistEntryScreen}
        options={{ headerShown: true, title: 'Gol & Asist' }}
      />
      <Stack.Screen 
        name="playerRating" 
        component={PlayerRatingScreen}
        options={{ headerShown: true, title: 'Oyuncu Puanlama' }}
      />
      <Stack.Screen 
        name="paymentTracking" 
        component={PaymentTrackingScreen}
        options={{ headerShown: true, title: 'Ödeme Takibi' }}
      />

      {/* STANDINGS */}
      <Stack.Screen 
        name="standings" 
        component={StandingsScreen}
        options={{ headerShown: true, title: 'Puan Durumu' }}
      />
      <Stack.Screen 
        name="topScorers" 
        component={TopScorersScreen}
        options={{ headerShown: true, title: 'Gol Krallığı' }}
      />
      <Stack.Screen 
        name="topAssists" 
        component={TopAssistsScreen}
        options={{ headerShown: true, title: 'Asist Liderleri' }}
      />
      <Stack.Screen 
        name="mvp" 
        component={MVPScreen}
        options={{ headerShown: true, title: 'MVP Listesi' }}
      />

      {/* PLAYER */}
      <Stack.Screen 
        name="editProfile" 
        component={EditProfileScreen}
        options={{ headerShown: false, title: 'Profil Düzenle' }}
      />
      <Stack.Screen 
        name="playerStats" 
        component={PlayerStatsScreen}
        options={{ headerShown: true, title: 'İstatistiklerim' }}
      />
      <Stack.Screen 
        name="selectPositions" 
        component={SelectPositionsScreen}
        options={{ headerShown: true, title: 'Pozisyon Seç' }}
      />

      {/* SETTINGS */}
      <Stack.Screen 
        name="settings" 
        component={SettingsScreen}
        options={{ headerShown: true, title: 'Ayarlar' }}
      />
      <Stack.Screen 
        name="notificationSettings" 
        component={NotificationSettingsScreen}
        options={{ headerShown: true, title: 'Bildirim Ayarları' }}
      />
    </Stack.Navigator>
  );
}