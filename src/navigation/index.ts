// ============================================
// NAVIGATION INDEX
// ============================================
// Tüm navigation export'ları

// Main Navigator
export { RootNavigatorV3 } from './RootNavigatorV3';

// Types
export * from './types';

// Service
export { NavigationService, navigationRef } from './NavigationService';

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
export { AuthStack } from './stacks/AuthStack';
export { LeagueStack } from './stacks/LeagueStack';
export { FixtureStack } from './stacks/FixtureStack';
// export { MatchStack } from './stacks/MatchStack';
export { StandingsStack } from './stacks/StandingsStack';
export { HomeStack } from './stacks/HomeStack';
export { ProfileStack } from './stacks/ProfileStack';

// Tab Navigator
export { MainTabNavigator } from './tabs/MainTabNavigator';
