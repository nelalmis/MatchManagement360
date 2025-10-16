// src/navigation/types.ts

import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, RouteProp } from '@react-navigation/native';

// ============================================
// ROOT STACK
// ============================================
export type RootStackParamList = {
  auth: NavigatorScreenParams<AuthStackParamList>;
  main: undefined;
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
// MAIN TAB (5 TABS - ALWAYS VISIBLE)
// ============================================
export type MainTabParamList = {
  homeTab: NavigatorScreenParams<HomeStackParamList>;
  leaguesTab: NavigatorScreenParams<LeaguesStackParamList>;
  matchesTab: NavigatorScreenParams<MatchesStackParamList>;
  statsTab: NavigatorScreenParams<StatsStackParamList>;
  profileTab: NavigatorScreenParams<ProfileStackParamList>;
};

// ============================================
// HOME STACK
// ============================================
export type HomeStackParamList = {
  homeScreen: undefined;
};

// ============================================
// LEAGUES STACK
// ============================================
export type LeaguesStackParamList = {
  leagueList: undefined;
  leagueDetail: { leagueId: string,updated?:boolean };
  createLeague: undefined;
  editLeague: { leagueId: string };
  fixtureList: { leagueId: string };
  fixtureDetail: { fixtureId: string };
  createFixture: { leagueId: string };
  editFixture: { fixtureId: string };
};

// ============================================
// MATCHES STACK
// ============================================
export type MatchesStackParamList = {
  matchList: { leagueId?: string; fixtureId?: string };
  myMatches: { playerId?: string };
  matchDetail: { matchId: string };
  createFriendlyMatch: { templateId?: string };
  friendlyMatchInvitations: undefined;
  manageInvitations: { matchId: string };
  editFriendlyMatch: { matchId: string };
  editMatch: { matchId: string };
  friendlyMatchTemplates: undefined;
  createFriendlyMatchTemplate: undefined;
  editFriendlyMatchTemplate: { templateId: string };
  matchRegistration: { matchId: string };
  teamBuilding: { matchId: string };
  scoreEntry: { matchId: string };
  goalAssistEntry: { matchId: string };
  playerRating: { matchId: string };
  paymentTracking: { matchId: string };
};

// ============================================
// STATS STACK
// ============================================
export type StatsStackParamList = {
  standingsList: undefined;
  standings: { leagueId: string };
  topScorers: { leagueId: string };
  topAssists: { leagueId: string };
  mvp: { leagueId: string };
};

// ============================================
// PROFILE STACK
// ============================================
export type ProfileStackParamList = {
  playerStats: { playerId?: string; leagueId?: string };
  playerProfile: { playerId?: string };
  editProfile: undefined;
  selectPositions: undefined;
  settings: undefined;
  notificationSettings: undefined;
};

// ============================================
// NAVIGATION PROPS
// ============================================

// Root Navigator
export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Auth Stack
export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

// Main Tab
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Individual Stack Props
export type HomeStackNavigationProp = NativeStackNavigationProp<HomeStackParamList>;
export type LeaguesStackNavigationProp = NativeStackNavigationProp<LeaguesStackParamList>;
export type MatchesStackNavigationProp = NativeStackNavigationProp<MatchesStackParamList>;
export type StatsStackNavigationProp = NativeStackNavigationProp<StatsStackParamList>;
export type ProfileStackNavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

// ============================================
// COMPOSITE NAVIGATION PROPS (TAB + STACK)
// ============================================

export type HomeScreenNavigationProp = CompositeNavigationProp<
  HomeStackNavigationProp,
  MainTabNavigationProp
>;

export type LeaguesScreenNavigationProp = CompositeNavigationProp<
  LeaguesStackNavigationProp,
  MainTabNavigationProp
>;

export type MatchesScreenNavigationProp = CompositeNavigationProp<
  MatchesStackNavigationProp,
  MainTabNavigationProp
>;

export type StatsScreenNavigationProp = CompositeNavigationProp<
  StatsStackNavigationProp,
  MainTabNavigationProp
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  ProfileStackNavigationProp,
  MainTabNavigationProp
>;

// ============================================
// ROUTE PROPS
// ============================================

// Auth Routes
export type PhoneVerificationRouteProp = RouteProp<AuthStackParamList, 'phoneVerification'>;

// League Routes
export type LeagueDetailRouteProp = RouteProp<LeaguesStackParamList, 'leagueDetail'>;
export type EditLeagueRouteProp = RouteProp<LeaguesStackParamList, 'editLeague'>;
export type FixtureListRouteProp = RouteProp<LeaguesStackParamList, 'fixtureList'>;
export type FixtureDetailRouteProp = RouteProp<LeaguesStackParamList, 'fixtureDetail'>;
export type CreateFixtureRouteProp = RouteProp<LeaguesStackParamList, 'createFixture'>;
export type EditFixtureRouteProp = RouteProp<LeaguesStackParamList, 'editFixture'>;

// Match Routes
export type MatchListRouteProp = RouteProp<MatchesStackParamList, 'matchList'>;
export type MyMatchesRouteProp = RouteProp<MatchesStackParamList, 'myMatches'>;
export type MatchDetailRouteProp = RouteProp<MatchesStackParamList, 'matchDetail'>;
export type CreateFriendlyMatchRouteProp = RouteProp<MatchesStackParamList, 'createFriendlyMatch'>;
export type ManageInvitationsRouteProp = RouteProp<MatchesStackParamList, 'manageInvitations'>;
export type EditFriendlyMatchRouteProp = RouteProp<MatchesStackParamList, 'editFriendlyMatch'>;
export type EditMatchRouteProp = RouteProp<MatchesStackParamList, 'editMatch'>;
export type EditFriendlyMatchTemplateRouteProp = RouteProp<MatchesStackParamList, 'editFriendlyMatchTemplate'>;
export type MatchRegistrationRouteProp = RouteProp<MatchesStackParamList, 'matchRegistration'>;
export type TeamBuildingRouteProp = RouteProp<MatchesStackParamList, 'teamBuilding'>;
export type ScoreEntryRouteProp = RouteProp<MatchesStackParamList, 'scoreEntry'>;
export type GoalAssistEntryRouteProp = RouteProp<MatchesStackParamList, 'goalAssistEntry'>;
export type PlayerRatingRouteProp = RouteProp<MatchesStackParamList, 'playerRating'>;
export type PaymentTrackingRouteProp = RouteProp<MatchesStackParamList, 'paymentTracking'>;

// Stats Routes
export type StandingsRouteProp = RouteProp<StatsStackParamList, 'standings'>;
export type TopScorersRouteProp = RouteProp<StatsStackParamList, 'topScorers'>;
export type TopAssistsRouteProp = RouteProp<StatsStackParamList, 'topAssists'>;
export type MVPRouteProp = RouteProp<StatsStackParamList, 'mvp'>;

// Profile Routes
export type PlayerStatsRouteProp = RouteProp<ProfileStackParamList, 'playerStats'>;
export type PlayerProfileRouteProp = RouteProp<ProfileStackParamList, 'playerProfile'>;

// ============================================
// TYPED HOOKS
// ============================================

export { useNavigation, useRoute } from '@react-navigation/native';