// src/navigation/NavigationService.ts

import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

/**
 * Helper function to safely navigate
 */
const safeNavigate = (name: string, params?: any) => {
  if (navigationRef.isReady()) {
    // @ts-ignore - Type-safe navigation için MainNavigator kullanın
    navigationRef.navigate(name, params);
  }
};

export const NavigationService = {
  // ============================================
  // CORE METHODS
  // ============================================

  isReady(): boolean {
    return navigationRef.isReady();
  },

  goBack(): void {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },

  getCurrentRoute() {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  },

  // ============================================
  // ROOT NAVIGATION
  // ============================================

  resetToAuth(): void {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'auth' }],
        })
      );
    }
  },

  resetToMain(): void {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'main' }],
        })
      );
    }
  },

  // ============================================
  // TAB NAVIGATION
  // ============================================

  navigateToHomeTab(): void {
    safeNavigate('homeTab');
  },

  navigateToLeaguesTab(): void {
    safeNavigate('leaguesTab');
  },

  navigateToMatchesTab(): void {
    safeNavigate('matchesTab');
  },

  navigateToStatsTab(): void {
    safeNavigate('statsTab');
  },

  navigateToProfileTab(): void {
    safeNavigate('profileTab');
  },

  // ============================================
  // HOME NAVIGATION
  // ============================================

  navigateToHome(): void {
    safeNavigate('homeTab', { screen: 'homeScreen' });
  },

  // ============================================
  // LEAGUE NAVIGATION
  // ============================================

  navigateToLeagueList(): void {
    safeNavigate('leaguesTab', { screen: 'leagueList' });
  },

  navigateToLeagueDetail(leagueId: string): void {
    safeNavigate('leaguesTab', {
      screen: 'leagueDetail',
      params: { leagueId },
    });
  },

  navigateToCreateLeague(): void {
    safeNavigate('leaguesTab', { screen: 'createLeague' });
  },

  navigateToEditLeague(leagueId: string): void {
    safeNavigate('leaguesTab', {
      screen: 'editLeague',
      params: { leagueId },
    });
  },

  // ============================================
  // FIXTURE NAVIGATION
  // ============================================

  navigateToFixtureList(leagueId: string): void {
    safeNavigate('leaguesTab', {
      screen: 'fixtureList',
      params: { leagueId },
    });
  },

  navigateToFixtureDetail(fixtureId: string): void {
    safeNavigate('leaguesTab', {
      screen: 'fixtureDetail',
      params: { fixtureId },
    });
  },

  navigateToCreateFixture(leagueId: string): void {
    safeNavigate('leaguesTab', {
      screen: 'createFixture',
      params: { leagueId },
    });
  },

  navigateToEditFixture(fixtureId: string): void {
    safeNavigate('leaguesTab', {
      screen: 'editFixture',
      params: { fixtureId },
    });
  },

  // ============================================
  // MATCH NAVIGATION
  // ============================================

  navigateToMatchList(params?: { leagueId?: string; fixtureId?: string }): void {
    safeNavigate('matchesTab', {
      screen: 'matchList',
      params: params || {},
    });
  },

  navigateToMyMatches(playerId?: string): void {
    safeNavigate('matchesTab', {
      screen: 'myMatches',
      params: playerId ? { playerId } : {},
    });
  },

  navigateToMatchDetail(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'matchDetail',
      params: { matchId },
    });
  },

  navigateToCreateFriendlyMatch(templateId?: string): void {
    safeNavigate('matchesTab', {
      screen: 'createFriendlyMatch',
      params: templateId ? { templateId } : {},
    });
  },

  navigateToFriendlyMatchInvitations(): void {
    safeNavigate('matchesTab', { screen: 'friendlyMatchInvitations' });
  },

  navigateToManageInvitations(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'manageInvitations',
      params: { matchId },
    });
  },

  navigateToEditFriendlyMatch(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'editFriendlyMatch',
      params: { matchId },
    });
  },

  navigateToEditMatch(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'editMatch',
      params: { matchId },
    });
  },

  navigateToFriendlyMatchTemplates(): void {
    safeNavigate('matchesTab', { screen: 'friendlyMatchTemplates' });
  },

  navigateToCreateFriendlyMatchTemplate(): void {
    safeNavigate('matchesTab', { screen: 'createFriendlyMatchTemplate' });
  },

  navigateToEditFriendlyMatchTemplate(templateId: string): void {
    safeNavigate('matchesTab', {
      screen: 'editFriendlyMatchTemplate',
      params: { templateId },
    });
  },

  navigateToMatchRegistration(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'matchRegistration',
      params: { matchId },
    });
  },

  navigateToTeamBuilding(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'teamBuilding',
      params: { matchId },
    });
  },

  navigateToScoreEntry(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'scoreEntry',
      params: { matchId },
    });
  },

  navigateToGoalAssistEntry(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'goalAssistEntry',
      params: { matchId },
    });
  },

  navigateToPlayerRating(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'playerRating',
      params: { matchId },
    });
  },

  navigateToPaymentTracking(matchId: string): void {
    safeNavigate('matchesTab', {
      screen: 'paymentTracking',
      params: { matchId },
    });
  },

  // ============================================
  // STANDINGS NAVIGATION
  // ============================================

  navigateToStandingsList(): void {
    safeNavigate('statsTab', { screen: 'standingsList' });
  },

  navigateToStandings(leagueId: string): void {
    safeNavigate('statsTab', {
      screen: 'standings',
      params: { leagueId },
    });
  },

  navigateToTopScorers(leagueId: string): void {
    safeNavigate('statsTab', {
      screen: 'topScorers',
      params: { leagueId },
    });
  },

  navigateToTopAssists(leagueId: string): void {
    safeNavigate('statsTab', {
      screen: 'topAssists',
      params: { leagueId },
    });
  },

  navigateToMVP(leagueId: string): void {
    safeNavigate('statsTab', {
      screen: 'mvp',
      params: { leagueId },
    });
  },

  // ============================================
  // PROFILE NAVIGATION
  // ============================================

  navigateToPlayerStats(playerId?: string, leagueId?: string): void {
    safeNavigate('profileTab', {
      screen: 'playerStats',
      params: { playerId, leagueId },
    });
  },

  navigateToPlayerProfile(playerId?: string): void {
    safeNavigate('profileTab', {
      screen: 'playerProfile',
      params: playerId ? { playerId } : {},
    });
  },

  navigateToEditProfile(): void {
    safeNavigate('profileTab', { screen: 'editProfile' });
  },

  navigateToSelectPositions(): void {
    safeNavigate('profileTab', { screen: 'selectPositions' });
  },

  navigateToSettings(): void {
    safeNavigate('profileTab', { screen: 'settings' });
  },

  navigateToNotificationSettings(): void {
    safeNavigate('profileTab', { screen: 'notificationSettings' });
  },

  // ============================================
  // AUTH NAVIGATION
  // ============================================

  navigateToLogin(): void {
    this.resetToAuth();
  },

  navigateToRegister(): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('auth', { screen: 'register' });
    }
  },

  navigateToPhoneVerification(phoneNumber: string): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('auth', {
        screen: 'phoneVerification',
        params: { phoneNumber }
      });
    }
  },

  // ============================================
  // LEGACY ALIASES (BACKWARD COMPATIBILITY)
  // ============================================

  navigateToLeague(leagueId: string): void {
    this.navigateToLeagueDetail(leagueId);
  },

  navigateToFixture(fixtureId: string): void {
    this.navigateToFixtureDetail(fixtureId);
  },

  navigateToMatch(matchId: string): void {
    this.navigateToMatchDetail(matchId);
  },

  navigateToPlayer(playerId: string): void {
    this.navigateToPlayerProfile(playerId);
  },

  navigateToMyProfile(): void {
    this.navigateToProfileTab();
  },

  navigateToMyStats(): void {
    this.navigateToPlayerStats();
  },

  navigateToMain(): void {
    this.resetToMain();
  },

  // ============================================
  // ALIASES (BACKWARD COMPATIBILITY)
  // ============================================
  
  navigateToFixturesTab(): void {
    this.navigateToMatchesTab();
  },

  navigateToStandingsTab(): void {
    this.navigateToStatsTab();
  },

  navigateToSettingsTab(): void {
    this.navigateToProfileTab();
  },

  navigateToTemplates(): void {
    this.navigateToFriendlyMatchTemplates();
  },
};

export default NavigationService;