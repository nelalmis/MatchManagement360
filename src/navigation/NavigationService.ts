// src/navigation/NavigationService.ts

import { createNavigationContainerRef, StackActions, CommonActions } from '@react-navigation/native';
import { MainStackParamList, RootStackParamList } from './typesV3';

export const navigationRef = createNavigationContainerRef<any>(); // 👈 any kullan (Root seviyesinde)

export const NavigationService = {
  // ============================================
  // CORE NAVIGATION METHODS
  // ============================================

  isReady(): boolean {
    return navigationRef.isReady();
  },

  navigate<T extends keyof MainStackParamList>(
    name: T,
    params?: MainStackParamList[T]
  ): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate(name, params);
    }
  },

  goBack(): void {
    if (navigationRef.isReady() && navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  },

  /**
   * Stack'i sıfırla ve belirtilen ekrana git
   */
  reset(routeName: 'auth' | 'main' | 'mainTabs', params?: any): void {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        })
      );
    }
  },

  /**
   * Auth ekranına git (Logout için)
   */
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

  /**
   * Main ekranına git (Login sonrası)
   */
  resetToMain(): void {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'main',
              state: {
                routes: [{ name: 'mainTabs' }],
              },
            },
          ],
        })
      );
    }
  },

  push<T extends keyof MainStackParamList>(
    name: T,
    params?: MainStackParamList[T]
  ): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.dispatch(StackActions.push(name, params));
    }
  },

  pop(count: number = 1): void {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.pop(count));
    }
  },

  popToTop(): void {
    if (navigationRef.isReady()) {
      navigationRef.dispatch(StackActions.popToTop());
    }
  },

  getCurrentRoute() {
    if (navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  },

  // ============================================
  // MATCH SCREENS
  // ============================================

  navigateToMatch(matchId: string): void {
    this.navigate('matchDetail', { matchId });
  },

  navigateToMatchRegistration(matchId: string): void {
    this.navigate('matchRegistration', { matchId });
  },

  navigateToTeamBuilding(matchId: string): void {
    this.navigate('teamBuilding', { matchId });
  },

  navigateToScoreEntry(matchId: string): void {
    this.navigate('scoreEntry', { matchId });
  },

  navigateToGoalAssistEntry(matchId: string): void {
    this.navigate('goalAssistEntry', { matchId });
  },

  navigateToPlayerRating(matchId: string): void {
    this.navigate('playerRating', { matchId });
  },

  navigateToPaymentTracking(matchId: string): void {
    this.navigate('paymentTracking', { matchId });
  },

  navigateToEditMatch(matchId: string): void {
    this.navigate('matchDetail', { matchId });
  },

  // ============================================
  // PLAYER SCREENS
  // ============================================

  navigateToPlayer(playerId: string): void {
    this.navigateToProfileTab();
  },

  // ============================================
  // LEAGUE SCREENS
  // ============================================

  navigateToLeague(leagueId: string): void {
    this.navigate('leagueDetail', { leagueId });
  },

  navigateToCreateLeague(): void {
    this.navigate('createLeague');
  },

  navigateToEditLeague(leagueId: string): void {
    this.navigate('editLeague', { leagueId });
  },

  // ============================================
  // FIXTURE SCREENS
  // ============================================

  navigateToFixture(fixtureId: string): void {
    this.navigate('fixtureDetail', { fixtureId });
  },

  navigateToCreateFixture(leagueId: string): void {
    this.navigate('createFixture', { leagueId });
  },

  navigateToMatchList(leagueId?: string, fixtureId?: string): void {
    // if (fixtureId) {
      this.navigate('matchList', {});
    // }
  },

  navigateToFixtureList(leagueId?: string): void {
    if (leagueId) {
      this.navigate('fixtureList', { leagueId });
    }
  },

  // ============================================
  // STANDINGS SCREENS
  // ============================================

  navigateToStandings(leagueId: string, seasonId?: string): void {
    this.navigate('standings', { leagueId });
  },

  navigateToTopScorers(leagueId: string, seasonId?: string): void {
    this.navigate('topScorers', { leagueId });
  },

  navigateToTopAssists(leagueId: string, seasonId?: string): void {
    this.navigate('topAssists', { leagueId });
  },

  navigateToMVP(leagueId: string, seasonId?: string): void {
    this.navigate('mvp', { leagueId });
  },

  // ============================================
  // AUTH SCREENS
  // ============================================

  /**
   * Login ekranına git (Logout için)
   */
  navigateToLogin(): void {
    this.resetToAuth();
  },


  /**
   * Register ekranına git (Auth stack içinde)
   */
  navigateToRegister(): void {
    if (navigationRef.isReady()) {
      // @ts-ignore - Nested navigation
      navigationRef.navigate('auth', { screen: 'register' });
    }
  },

  /**
   * Phone Verification ekranına git (Auth stack içinde)
   */
  navigateToPhoneVerification(phoneNumber: string): void {
    if (navigationRef.isReady()) {
      // @ts-ignore - Nested navigation
      navigationRef.navigate('auth', {
        screen: 'phoneVerification',
        params: { phoneNumber }
      });
    }
  },

  navigateToSelectPositions(
    sport?: any,
    selectedPositions?: string[],
    onSave?: (positions: string[]) => void
  ): void {
    this.navigate('selectPositions');
  },

  /**
   * Ana ekrana git (Login sonrası)
   */
  navigateToMain(): void {
    this.resetToMain();
  },

  // ============================================
  // TAB NAVIGATION HELPERS
  // ============================================

  navigateToHomeTab(): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('mainTabs', { screen: 'homeTab' });
    }
  },

  navigateToLeaguesTab(): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('mainTabs', { screen: 'leaguesTab' });
    }
  },

  navigateToFixturesTab(): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('mainTabs', { screen: 'matchesTab' });
    }
  },

  navigateToStandingsTab(): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('mainTabs', { screen: 'statsTab' });
    }
  },

  navigateToProfileTab(): void {
    if (navigationRef.isReady()) {
      // @ts-ignore
      navigationRef.navigate('mainTabs', { screen: 'profileTab' });
    }
  },

  navigateToMyProfile(): void {
    this.navigateToProfileTab();
  },

  navigateToEditProfile(): void {
    this.navigate('editProfile');
  },

  navigateToMyStats(playerId?: string): void {
    this.navigate('playerStats', { leagueId: undefined });
  },

  navigateToPlayerStats(playerId?: string): void {
    this.navigate('playerStats', { leagueId: undefined });
  },

  navigateToMyMatches(): void {
    this.navigateToFixturesTab();
  },

  // ============================================
  // SETTINGS NAVIGATION
  // ============================================

  navigateToSettingsTab(): void {
    this.navigateToProfileTab();
  },

  navigateToSettings(): void {
    this.navigate('settings');
  },

  navigateToNotificationSettings(): void {
    this.navigate('notificationSettings');
  },
};

export default NavigationService;