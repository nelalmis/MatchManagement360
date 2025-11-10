// src/navigation/NavigationService.ts

import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { InvitationType } from '../types/entity/invitation';

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
  // TAB NAVIGATION (Ana 3 Tab)
  // ============================================

  navigateToHomeTab(): void {
    safeNavigate('mainTabs', { screen: 'homeTab' });
  },

  navigateToMatchesTab(): void {
    safeNavigate('mainTabs', { screen: 'matchesTab' });
  },

  navigateToProfileTab(): void {
    safeNavigate('mainTabs', { screen: 'profileTab' });
  },

  // ============================================
  // HOME NAVIGATION
  // ============================================

  navigateToHome(): void {
    safeNavigate('mainTabs', { 
      screen: 'homeTab',
      params: { screen: 'homeScreen' }
    });
  },

  navigateToJoinWithCodeHomeTab(type: InvitationType): void {
    safeNavigate('mainTabs', {
      screen: 'homeTab',
      params: { 
        screen: 'joinWithCode',
        params: { type }
      }
    });
  },

  // ============================================
  // LEAGUE NAVIGATION (LeagueFlow)
  // ============================================

  navigateToLeagueList(): void {
    safeNavigate('leagueFlow', { screen: 'leagueList' });
  },

  navigateToLeagueDetail(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'leagueDetail',
      params: { leagueId },
    });
  },

  navigateToCreateLeague(): void {
    safeNavigate('leagueFlow', { screen: 'createLeague' });
  },

  navigateToEditLeague(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'editLeague',
      params: { leagueId },
    });
  },

  navigateToLeagueSettings(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'leagueSettings',
      params: { leagueId },
    });
  },

  navigateToManageLeagueMembers(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'manageLeagueMembers',
      params: { leagueId },
    });
  },

  // ============================================
  // FIXTURE NAVIGATION (LeagueFlow içinde)
  // ============================================

  navigateToFixtureList(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'fixtureList',
      params: { leagueId },
    });
  },

  navigateToFixtureDetail(fixtureId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'fixtureDetail',
      params: { fixtureId },
    });
  },

  navigateToCreateFixture(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'createFixture',
      params: { leagueId },
    });
  },

  navigateToEditFixture(fixtureId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'editFixture',
      params: { fixtureId },
    });
  },

  // ============================================
  // STATS NAVIGATION (LeagueFlow içinde - Liga özel)
  // ============================================

  navigateToStandings(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'standings',
      params: { leagueId },
    });
  },

  navigateToTopScorers(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'topScorers',
      params: { leagueId },
    });
  },

  navigateToTopAssists(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'topAssists',
      params: { leagueId },
    });
  },

  navigateToMVP(leagueId: string): void {
    safeNavigate('leagueFlow', {
      screen: 'mvp',
      params: { leagueId },
    });
  },

  // ============================================
  // LEAGUE INVITATIONS (LeagueFlow modal)
  // ============================================

  navigateToManageLeagueInvitations(leagueId: string, leagueTitle: string): void {
    safeNavigate('leagueFlow', {
      screen: 'manageInvitations',
      params: { 
        type: InvitationType.LEAGUE,
        targetId: leagueId,
        targetTitle: leagueTitle 
      },
    });
  },

  navigateToCreateLeagueInvitation(leagueId: string, leagueTitle: string): void {
    safeNavigate('leagueFlow', {
      screen: 'createInvitation',
      params: { 
        type: InvitationType.LEAGUE,
        targetId: leagueId,
        targetTitle: leagueTitle 
      },
    });
  },

  // ============================================
  // MATCH NAVIGATION (MatchFlow & MyMatchesStack)
  // ============================================

  // MyMatchesStack (Tab içinde)
  navigateToMyMatches(playerId?: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: { 
        screen: 'myMatches',
        params: playerId ? { playerId } : {}
      }
    });
  },

  navigateToMatchDetailFromMyMatches(matchId: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: {
        screen: 'matchDetail',
        params: { matchId }
      }
    });
  },

  // MatchFlow (Full screen)
  navigateToMatchList(params?: { leagueId?: string; fixtureId?: string }): void {
    safeNavigate('matchFlow', {
      screen: 'matchList',
      params: params || {},
    });
  },

  navigateToMatchDetail(matchId: string): void {
    safeNavigate('matchFlow', {
      screen: 'matchDetail',
      params: { matchId },
    });
  },

  navigateToCreateFriendlyMatch(templateId?: string): void {
    safeNavigate('matchFlow', {
      screen: 'createFriendlyMatch',
      params: templateId ? { templateId } : {},
    });
  },

  navigateToEditMatch(matchId: string): void {
    safeNavigate('matchFlow', {
      screen: 'editMatch',
      params: { matchId },
    });
  },

  navigateToEditFriendlyMatchTemplate(templateId: string): void {
    safeNavigate('matchFlow', {
      screen: 'editFriendlyMatchTemplate',
      params: { templateId },
    });
  },

  // Match Actions (MyMatchesStack içinde)
  navigateToMatchRegistration(matchId: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: {
        screen: 'matchRegistration',
        params: { matchId }
      }
    });
  },

  navigateToTeamBuilding(matchId: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: {
        screen: 'teamBuilding',
        params: { matchId }
      }
    });
  },

  navigateToScoreEntry(matchId: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: {
        screen: 'scoreEntry',
        params: { matchId }
      }
    });
  },

  navigateToGoalAssistEntry(matchId: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: {
        screen: 'goalAssistEntry',
        params: { matchId }
      }
    });
  },

  navigateToPlayerRating(matchId: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: {
        screen: 'playerRating',
        params: { matchId }
      }
    });
  },

  navigateToPaymentTracking(matchId: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: {
        screen: 'paymentTracking',
        params: { matchId }
      }
    });
  },

  navigateToPlayerPayment(matchId: string): void {
    safeNavigate('mainTabs', {
      screen: 'matchesTab',
      params: {
        screen: 'playerPayment',
        params: { matchId }
      }
    });
  },

  // Match Invitations (MatchFlow modal)
  navigateToManageMatchInvitations(matchId: string, matchTitle: string, sportType?: string): void {
    safeNavigate('matchFlow', {
      screen: 'manageInvitations',
      params: { 
        type: InvitationType.MATCH,
        targetId: matchId,
        targetTitle: matchTitle,
        sportType 
      },
    });
  },

  navigateToCreateMatchInvitation(matchId: string, matchTitle: string, sportType?: string): void {
    safeNavigate('matchFlow', {
      screen: 'createInvitation',
      params: { 
        type: InvitationType.MATCH,
        targetId: matchId,
        targetTitle: matchTitle,
        sportType 
      },
    });
  },

  navigateToJoinWithCodeMatchTab(type: InvitationType): void {
    safeNavigate('matchFlow', {
      screen: 'joinWithCode',
      params: { type },
    });
  },

  // ============================================
  // UNIFIED INVITATION METHODS
  // ============================================

  /**
   * Navigate to Create Invitation Screen (Modal)
   * Works for both League and Match
   */
  navigateToCreateInvitation(
    type: InvitationType,
    targetId: string,
    targetTitle: string,
    sportType?: string
  ): void {
    const flowName = type === InvitationType.LEAGUE ? 'leagueFlow' : 'matchFlow';

    safeNavigate(flowName, {
      screen: 'createInvitation',
      params: { type, targetId, targetTitle, sportType },
    });
  },

  /**
   * Navigate to Manage Invitations Screen (Modal)
   * Works for both League and Match
   */
  navigateToManageInvitations(
    type: InvitationType,
    targetId: string,
    targetTitle: string,
    sportType?: string
  ): void {
    const flowName = type === InvitationType.LEAGUE ? 'leagueFlow' : 'matchFlow';

    safeNavigate(flowName, {
      screen: 'manageInvitations',
      params: { type, targetId, targetTitle, sportType },
    });
  },

  // ============================================
  // PROFILE NAVIGATION
  // ============================================

  navigateToPlayerProfile(playerId?: string): void {
    safeNavigate('mainTabs', {
      screen: 'profileTab',
      params: {
        screen: 'playerProfile',
        params: playerId ? { playerId } : {}
      }
    });
  },

  navigateToEditProfile(): void {
    safeNavigate('mainTabs', { 
      screen: 'profileTab',
      params: { screen: 'editProfile' }
    });
  },

  navigateToPlayerStats(playerId?: string, leagueId?: string): void {
    safeNavigate('mainTabs', {
      screen: 'profileTab',
      params: {
        screen: 'playerStats',
        params: { playerId, leagueId }
      }
    });
  },

  navigateToSettings(): void {
    safeNavigate('mainTabs', { 
      screen: 'profileTab',
      params: { screen: 'settings' }
    });
  },

  navigateToNotificationSettings(): void {
    safeNavigate('mainTabs', { 
      screen: 'profileTab',
      params: { screen: 'notificationSettings' }
    });
  },

  navigateToSelectPositions(): void {
    safeNavigate('mainTabs', { 
      screen: 'profileTab',
      params: { screen: 'selectPositions' }
    });
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

  navigateToLeaguesTab(): void {
    this.navigateToLeagueList();
  },

  navigateToStatsTab(): void {
    this.navigateToProfileTab();
  },

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

  navigateToFixturesTab(): void {
    this.navigateToMatchesTab();
  },

  navigateToStandingsTab(): void {
    this.navigateToProfileTab();
  },

  navigateToSettingsTab(): void {
    this.navigateToProfileTab();
  },

  // Deprecated methods
  navigateToJoinLeague(): void {
    console.warn('navigateToJoinLeague is deprecated, use navigateToJoinWithCodeHomeTab instead');
  },

  navigateToFriendlyMatchInvitations(): void {
    console.warn('navigateToFriendlyMatchInvitations is deprecated');
  },

  navigateToEditFriendlyMatch(matchId: string): void {
    console.warn('navigateToEditFriendlyMatch is deprecated, use navigateToEditMatch instead');
    this.navigateToEditMatch(matchId);
  },

  navigateToFriendlyMatchTemplates(): void {
    console.warn('navigateToFriendlyMatchTemplates is deprecated');
  },

  navigateToCreateFriendlyMatchTemplate(): void {
    console.warn('navigateToCreateFriendlyMatchTemplate is deprecated');
  },

  navigateToTemplates(): void {
    console.warn('navigateToTemplates is deprecated');
  },

  navigateToMatchListOnLeagueTab(params?: { leagueId?: string; fixtureId?: string }): void {
    console.warn('navigateToMatchListOnLeagueTab is deprecated, use navigateToMatchList instead');
    this.navigateToMatchList(params);
  },

  navigateToJoinMatchWithCode(): void {
    console.warn('navigateToJoinMatchWithCode is deprecated, use navigateToJoinWithCodeMatchTab instead');
  },

  navigateToStandingsList(): void {
    console.warn('navigateToStandingsList is deprecated');
  },
};

export default NavigationService;