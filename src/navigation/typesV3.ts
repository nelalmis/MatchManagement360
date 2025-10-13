// src/navigation/types.ts

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';

// ============================================
// ROOT STACK
// ============================================
export type RootStackParamList = {
  auth: NavigatorScreenParams<AuthStackParamList>;
  main: NavigatorScreenParams<MainTabParamList>;
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
  homeTab: undefined;
  leaguesTab: undefined;
  matchesTab: undefined;
  statsTab: undefined;
  profileTab: undefined;
};

// ============================================
// MAIN STACK (All screens in Main)
// ============================================
export type MainStackParamList = {
  mainTabs: NavigatorScreenParams<MainTabParamList>;

  // ======================================== LEAGUE ========================================
  leagueDetail: { leagueId: string };
  createLeague: undefined;
  editLeague: { leagueId: string };

  // ======================================== FIXTURE ========================================
  fixtureList: { leagueId: string };
  fixtureDetail: { fixtureId: string };
  createFixture: { leagueId: string };
  editFixture: { fixtureId: string };

  // ======================================== MATCH ========================================
  matchList: { leagueId?: string; fixtureId?: string };
  matchDetail: { matchId: string };
  matchRegistration: { matchId: string };
  teamBuilding: { matchId: string };
  scoreEntry: { matchId: string };
  goalAssistEntry: { matchId: string };
  playerRating: { matchId: string };
  paymentTracking: { matchId: string };

  // ======================================== STANDINGS ========================================
  standings: { leagueId: string };
  topScorers: { leagueId: string };
  topAssists: { leagueId: string };
  mvp: { leagueId: string };

  // ======================================== PLAYER ========================================
  editProfile: undefined;
  playerStats: { leagueId?: string };
  selectPositions: undefined;

  // ======================================== SETTINGS ========================================
  settings: undefined;
  notificationSettings: undefined;
};

// ============================================
// NAVIGATION PROPS
// ============================================

// Root Navigator Props
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Auth Stack Props
export type AuthNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<AuthStackParamList>,
  RootNavigationProp
>;

// Main Stack Props
export type MainStackNavigationProp = NativeStackNavigationProp<MainStackParamList>;

// Main Tab Props
export type MainTabNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  MainStackNavigationProp
>;

// ============================================
// ROUTE PROPS
// ============================================

// Auth Routes
export type PhoneVerificationRouteProp = RouteProp<AuthStackParamList, 'phoneVerification'>;

// League Routes
export type LeagueDetailRouteProp = RouteProp<MainStackParamList, 'leagueDetail'>;
export type EditLeagueRouteProp = RouteProp<MainStackParamList, 'editLeague'>;

// Fixture Routes
export type FixtureListRouteProp = RouteProp<MainStackParamList, 'fixtureList'>;
export type FixtureDetailRouteProp = RouteProp<MainStackParamList, 'fixtureDetail'>;
export type CreateFixtureRouteProp = RouteProp<MainStackParamList, 'createFixture'>;
export type EditFixtureRouteProp = RouteProp<MainStackParamList, 'editFixture'>;

// Match Routes
export type MatchListRouteProp = RouteProp<MainStackParamList, 'matchList'>;
export type MatchDetailRouteProp = RouteProp<MainStackParamList, 'matchDetail'>;
export type MatchRegistrationRouteProp = RouteProp<MainStackParamList, 'matchRegistration'>;
export type TeamBuildingRouteProp = RouteProp<MainStackParamList, 'teamBuilding'>;
export type ScoreEntryRouteProp = RouteProp<MainStackParamList, 'scoreEntry'>;
export type GoalAssistEntryRouteProp = RouteProp<MainStackParamList, 'goalAssistEntry'>;
export type PlayerRatingRouteProp = RouteProp<MainStackParamList, 'playerRating'>;
export type PaymentTrackingRouteProp = RouteProp<MainStackParamList, 'paymentTracking'>;

// Standings Routes
export type StandingsRouteProp = RouteProp<MainStackParamList, 'standings'>;
export type TopScorersRouteProp = RouteProp<MainStackParamList, 'topScorers'>;
export type TopAssistsRouteProp = RouteProp<MainStackParamList, 'topAssists'>;
export type MVPRouteProp = RouteProp<MainStackParamList, 'mvp'>;

// Player Routes
export type PlayerStatsRouteProp = RouteProp<MainStackParamList, 'playerStats'>;

// ============================================
// TYPED NAVIGATION HOOKS
// ============================================

export const useRootNavigation = () => useNavigation<RootNavigationProp>();
export const useAuthNavigation = () => useNavigation<AuthNavigationProp>();
export const useMainStackNavigation = () => useNavigation<MainStackNavigationProp>();
export const useMainTabNavigation = () => useNavigation<MainTabNavigationProp>();

// Typed Route Hook
export const useTypedRoute = <T extends keyof MainStackParamList>() => {
  return useRoute<RouteProp<MainStackParamList, T>>();
};