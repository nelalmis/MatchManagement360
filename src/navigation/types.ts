// ============================================
// NAVIGATION TYPES
// ============================================

import { NavigatorScreenParams } from '@react-navigation/native';

// ============================================
// ROOT STACK
// ============================================
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;

  // Match Screens (Modal)
  matchDetail: { matchId: string; updated?: boolean };
  matchRegistration: { matchId: string };
  editMatch : { matchId: string };
  teamBuilding: { matchId: string };
  scoreEntry: { matchId: string };
  goalAssistEntry: { matchId: string };
  playerRating: { matchId: string };
  paymentTracking: { matchId: string };

  // Player Screens (Modal)
  playerProfile: { playerId: string }; // Başka oyuncular için
  
  // Select Positions Modal
  selectPositions: {
    sport: SportType;
    selectedPositions: string[];
    onSave: (positions: string[]) => void;
  };
};

// ============================================
// AUTH STACK
// ============================================
export type AuthStackParamList = {
  login: undefined;
  register: undefined;
  phoneVerification: { phoneNumber: string };
};

// ============================================
// MAIN TAB (5 TABS)
// ============================================
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  LeaguesTab: NavigatorScreenParams<LeagueStackParamList>;
  FixturesTab: NavigatorScreenParams<FixtureStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  StandingsTab: NavigatorScreenParams<StandingsStackParamList>; // ✅ StandingsTab (Stats değil)
};

// ============================================
// HOME STACK
// ============================================
export type HomeStackParamList = {
  home: undefined;
};

// ============================================
// LEAGUE STACK
// ============================================
export type LeagueStackParamList = {
  leagueList: undefined;
  leagueDetail: { leagueId: string; updated?: boolean };
  createLeague: undefined;
  editLeague: { leagueId: string };
  standings: { leagueId: string; seasonId: string };
  topScorers: { leagueId: string; seasonId: string };
  topAssists: { leagueId: string; seasonId: string };
  mvp: { leagueId: string; seasonId: string };
};

// ============================================
// FIXTURE STACK
// ============================================
export type FixtureStackParamList = {
  fixtureList: { leagueId?: string }; // İlk ekran
  fixtureDetail: { fixtureId: string; updated?: boolean };
  createFixture: { leagueId: string };
  editFixture: { fixtureId: string };
  matchList: { leagueId?: string; fixtureId?: string };
  myMatches: undefined; // MyMatchesScreen - ikinci ekran
};

// ============================================
// PROFILE STACK
// ============================================
export type ProfileStackParamList = {
  playerProfile: { playerId?: string }; // İlk ekran - Current user
  editProfile: undefined;
  settings: undefined;
  notificationSettings: undefined;
};

// ============================================
// STANDINGS STACK (İstatistikler Tab'ı)
// ============================================
export type StandingsStackParamList = {
  playerStats: { playerId?: string }; // ✅ İLK EKRAN - Current user stats
  standingsList: undefined; // Standings listesi
  standings: { leagueId: string; seasonId: string };
  topScorers: { leagueId: string; seasonId: string };
  topAssists: { leagueId: string; seasonId: string };
  mvp: { leagueId: string; seasonId: string };
};


// Navigation Props Helper Types
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// Root Navigator Props
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Auth Stack Props
export type AuthNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList>,
  RootNavigationProp
>;

// Main Tab Props
export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  RootNavigationProp
>;

// Home Tab Props
export type HomeNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  RootNavigationProp
>;

// League Stack Props
export type LeagueNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<LeagueStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    RootNavigationProp
  >
>;

// Fixture Stack Props
export type FixtureNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<FixtureStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    RootNavigationProp
  >
>;

// Profile Stack Props
export type ProfileNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ProfileStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    RootNavigationProp
  >
>;

// Settings Stack Props
export type StandingsNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<StandingsStackParamList>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList>,
    RootNavigationProp
  >
>;

// Route Props Helper
export type LeagueDetailRouteProp = RouteProp<LeagueStackParamList, 'leagueDetail'>;
export type MatchDetailRouteProp = RouteProp<RootStackParamList, 'matchDetail'>;
export type PlayerProfileRouteProp = RouteProp<ProfileStackParamList, 'playerProfile'>;
export type HomeRouteProp = RouteProp<HomeStackParamList, 'home'>;
export type LeagueListRouteProp = RouteProp<LeagueStackParamList, 'leagueList'>;
export type FixtureListRouteProp = RouteProp<FixtureStackParamList, 'fixtureList'>;
export type FixtureDetailRouteProp = RouteProp<FixtureStackParamList, 'fixtureDetail'>;
export type MyMatchesRouteProp = RouteProp<FixtureStackParamList, 'myMatches'>;
export type PlayerStatsRouteProp = RouteProp<StandingsStackParamList, 'playerStats'>;
export type StandingsRouteProp = RouteProp<StandingsStackParamList, 'standings'>;

// Typed Navigation Hooks
import { useNavigation, useRoute } from '@react-navigation/native';
import { SportType } from '../types/types';

export const useRootNavigation = () => useNavigation<RootNavigationProp>();
export const useAuthNavigation = () => useNavigation<AuthNavigationProp>();
export const useMainTabNavigation = () => useNavigation<MainTabNavigationProp>();
export const useHomeNavigation = () => useNavigation<HomeNavigationProp>();
export const useLeagueNavigation = () => useNavigation<LeagueNavigationProp>();
export const useFixtureNavigation = () => useNavigation<FixtureNavigationProp>();
export const useProfileNavigation = () => useNavigation<ProfileNavigationProp>();
export const useStandingsNavigation = () => useNavigation<StandingsNavigationProp>();

// Typed Route Hook
export const useTypedRoute = <T extends keyof RootStackParamList>() => {
  return useRoute<RouteProp<RootStackParamList, T>>();
};