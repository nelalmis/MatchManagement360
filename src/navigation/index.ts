// ============================================
// NAVIGATION INDEX
// ============================================
// Tüm navigation export'ları

// Main Navigator
export { RootNavigator } from './RootNavigator';

// Types
export * from './types';
// Service
export { navigationRef } from './navigationServices/NavigationBaseService';
export { default as AuthNavigationService } from './navigationServices/AuthNavigationService';
export { default as HomeNavigationService } from './navigationServices/HomeNavigationService';
export { default as LeagueNavigationService } from './navigationServices/LeagueNavigationService';
export { default as MatchNavigationService } from './navigationServices/MatchNavigationService';
export { default as FixtureNavigationService } from './navigationServices/FixtureNavigationService';
export { default as StandingsNavigationService } from './navigationServices/StandingsNavigationService';
export { default as TabNavigationService } from './navigationServices/TabNavigationService';
export { default as ProfileNavigationService } from './navigationServices/ProfileNavigationService';
export { default as SettingsNavigationService } from './navigationServices/SettingsNavigationService';
export { default as MyMatchesNavigationService } from './navigationServices/MyMatchesNavigationService';

// Common Navigation Functions
export { goBack } from './navigationServices/CommonNavigationService';

// Linking
export { linking, DeepLinkHelper } from './linking';

// Guards
export {
  OrganizerGuard,
  AuthGuard,
  TeamBuildingGuard,
  LeagueOwnerGuard,
  MatchOrganizerGuard,
} from './guards/NavigationGuards';

// Stacks (Eğer dışarıdan kullanılacaksa)
// export { AuthStack } from './AuthStack';
export { MainNavigator } from './MainNavigator';

// Tab Navigator
