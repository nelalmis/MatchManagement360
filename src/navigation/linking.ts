// src/navigation/linking.ts

import { LinkingOptions } from '@react-navigation/native';
import { NavigationService } from './NavigationService';
import { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    'matchmanagement://',
    'https://matchmanagement.app',
    'https://*.matchmanagement.app',
  ],
  
  config: {
    screens: {
      // ============================================
      // AUTH SCREENS
      // ============================================
      auth: {
        screens: {
          login: 'login',
          register: 'register',
          phoneVerification: 'verify/:phoneNumber',
        },
      },

      // ============================================
      // MAIN APP (5 TABS)
      // ============================================
      main: {
        screens: {
          // ============================================
          // 1. HOME TAB
          // ============================================
          homeTab: {
            screens: {
              homeScreen: '',
            },
          },

          // ============================================
          // 2. LEAGUES TAB
          // ============================================
          leaguesTab: {
            screens: {
              leagueList: 'leagues',
              leagueDetail: 'league/:leagueId',
              createLeague: 'league/create',
              editLeague: 'league/:leagueId/edit',
              fixtureList: 'league/:leagueId/fixtures',
              fixtureDetail: 'fixture/:fixtureId',
              createFixture: 'fixture/create',
              editFixture: 'fixture/:fixtureId/edit',
            },
          },

          // ============================================
          // 3. MATCHES TAB
          // ============================================
          matchesTab: {
            screens: {
              matchList: 'matches',
              myMatches: 'my-matches',
              matchDetail: 'match/:matchId',
              createFriendlyMatch: 'match/create',
              friendlyMatchInvitations: 'match/invitations',
              manageInvitations: 'match/:matchId/manage-invitations',
              editFriendlyMatch: 'match/:matchId/edit-friendly',
              editMatch: 'match/:matchId/edit',
              friendlyMatchTemplates: 'match/templates',
              createFriendlyMatchTemplate: 'match/template/create',
              editFriendlyMatchTemplate: 'match/template/:templateId/edit',
              matchRegistration: 'match/:matchId/register',
              teamBuilding: 'match/:matchId/team',
              scoreEntry: 'match/:matchId/score',
              goalAssistEntry: 'match/:matchId/goals',
              playerRating: 'match/:matchId/rating',
              paymentTracking: 'match/:matchId/payment',
            },
          },

          // ============================================
          // 4. STATS TAB
          // ============================================
          statsTab: {
            screens: {
              standingsList: 'stats',
              standings: 'stats/:leagueId/standings',
              topScorers: 'stats/:leagueId/top-scorers',
              topAssists: 'stats/:leagueId/top-assists',
              mvp: 'stats/:leagueId/mvp',
            },
          },

          // ============================================
          // 5. PROFILE TAB
          // ============================================
          profileTab: {
            screens: {
              playerStats: 'profile',
              playerProfile: 'profile/view',
              editProfile: 'profile/edit',
              selectPositions: 'profile/positions',
              settings: 'settings',
              notificationSettings: 'settings/notifications',
            },
          },
        },
      },
    },
  },
};

// ============================================
// DEEP LINK HELPERS
// ============================================

export const DeepLinkHelper = {
  // ============================================
  // HOME LINKS
  // ============================================
  
  createHomeLink(): string {
    return 'matchmanagement://';
  },

  // ============================================
  // LEAGUE LINKS
  // ============================================
  
  createLeagueListLink(): string {
    return 'matchmanagement://leagues';
  },

  createLeagueLink(leagueId: string): string {
    return `matchmanagement://league/${leagueId}`;
  },

  createCreateLeagueLink(): string {
    return 'matchmanagement://league/create';
  },

  createEditLeagueLink(leagueId: string): string {
    return `matchmanagement://league/${leagueId}/edit`;
  },

  // ============================================
  // FIXTURE LINKS
  // ============================================
  
  createFixtureListLink(leagueId: string): string {
    return `matchmanagement://league/${leagueId}/fixtures`;
  },

  createFixtureLink(fixtureId: string): string {
    return `matchmanagement://fixture/${fixtureId}`;
  },

  createCreateFixtureLink(): string {
    return 'matchmanagement://fixture/create';
  },

  createEditFixtureLink(fixtureId: string): string {
    return `matchmanagement://fixture/${fixtureId}/edit`;
  },

  // ============================================
  // MATCH LINKS
  // ============================================
  
  createMatchListLink(): string {
    return 'matchmanagement://matches';
  },

  createMyMatchesLink(): string {
    return 'matchmanagement://my-matches';
  },

  createMatchLink(matchId: string): string {
    return `matchmanagement://match/${matchId}`;
  },

  createCreateFriendlyMatchLink(): string {
    return 'matchmanagement://match/create';
  },

  createFriendlyMatchInvitationsLink(): string {
    return 'matchmanagement://match/invitations';
  },

  createManageInvitationsLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/manage-invitations`;
  },

  createEditFriendlyMatchLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/edit-friendly`;
  },

  createEditMatchLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/edit`;
  },

  createFriendlyMatchTemplatesLink(): string {
    return 'matchmanagement://match/templates';
  },

  createCreateTemplateLink(): string {
    return 'matchmanagement://match/template/create';
  },

  createEditTemplateLink(templateId: string): string {
    return `matchmanagement://match/template/${templateId}/edit`;
  },

  createMatchRegistrationLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/register`;
  },

  createTeamBuildingLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/team`;
  },

  createScoreEntryLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/score`;
  },

  createGoalAssistLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/goals`;
  },

  createPlayerRatingLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/rating`;
  },

  createPaymentTrackingLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/payment`;
  },

  // ============================================
  // STATS LINKS
  // ============================================
  
  createStatsListLink(): string {
    return 'matchmanagement://stats';
  },

  createStandingsLink(leagueId: string): string {
    return `matchmanagement://stats/${leagueId}/standings`;
  },

  createTopScorersLink(leagueId: string): string {
    return `matchmanagement://stats/${leagueId}/top-scorers`;
  },

  createTopAssistsLink(leagueId: string): string {
    return `matchmanagement://stats/${leagueId}/top-assists`;
  },

  createMVPLink(leagueId: string): string {
    return `matchmanagement://stats/${leagueId}/mvp`;
  },

  // ============================================
  // PROFILE LINKS
  // ============================================
  
  createMyProfileLink(): string {
    return 'matchmanagement://profile';
  },

  createMyStatsLink(): string {
    return 'matchmanagement://profile';
  },

  createPlayerProfileLink(): string {
    return 'matchmanagement://profile/view';
  },

  createEditProfileLink(): string {
    return 'matchmanagement://profile/edit';
  },

  createSelectPositionsLink(): string {
    return 'matchmanagement://profile/positions';
  },

  // ============================================
  // SETTINGS LINKS
  // ============================================
  
  createSettingsLink(): string {
    return 'matchmanagement://settings';
  },

  createNotificationSettingsLink(): string {
    return 'matchmanagement://settings/notifications';
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  convertWebToDeepLink(url: string): string {
    return url
      .replace('https://matchmanagement.app', 'matchmanagement://')
      .replace('https://*.matchmanagement.app', 'matchmanagement://')
      .replace('https://', 'matchmanagement://');
  },

  /**
   * Deep link'ten ekran ve params çıkar
   */
  parseDeepLink(url: string): { 
    tab?: string; 
    screen?: string; 
    params?: any;
  } | null {
    try {
      const deepLink = this.convertWebToDeepLink(url);
      const path = deepLink.replace('matchmanagement://', '');
      
      if (!path) {
        return { tab: 'homeTab', screen: 'homeScreen' };
      }

      const parts = path.split('/');

      // ============================================
      // HOME
      // ============================================
      if (parts[0] === '' || parts[0] === 'home') {
        return { tab: 'homeTab', screen: 'homeScreen' };
      }

      // ============================================
      // LEAGUES
      // ============================================
      if (parts[0] === 'leagues') {
        return { tab: 'leaguesTab', screen: 'leagueList' };
      }

      if (parts[0] === 'league') {
        if (parts[1] === 'create') {
          return { tab: 'leaguesTab', screen: 'createLeague' };
        }
        if (parts[1] && parts[2] === 'edit') {
          return { tab: 'leaguesTab', screen: 'editLeague', params: { leagueId: parts[1] } };
        }
        if (parts[1] && parts[2] === 'fixtures') {
          return { tab: 'leaguesTab', screen: 'fixtureList', params: { leagueId: parts[1] } };
        }
        if (parts[1]) {
          return { tab: 'leaguesTab', screen: 'leagueDetail', params: { leagueId: parts[1] } };
        }
      }

      // ============================================
      // FIXTURES
      // ============================================
      if (parts[0] === 'fixture') {
        if (parts[1] === 'create') {
          return { tab: 'leaguesTab', screen: 'createFixture' };
        }
        if (parts[1] && parts[2] === 'edit') {
          return { tab: 'leaguesTab', screen: 'editFixture', params: { fixtureId: parts[1] } };
        }
        if (parts[1]) {
          return { tab: 'leaguesTab', screen: 'fixtureDetail', params: { fixtureId: parts[1] } };
        }
      }

      // ============================================
      // MATCHES
      // ============================================
      if (parts[0] === 'matches') {
        return { tab: 'matchesTab', screen: 'matchList' };
      }

      if (parts[0] === 'my-matches') {
        return { tab: 'matchesTab', screen: 'myMatches' };
      }

      if (parts[0] === 'match') {
        // Templates
        if (parts[1] === 'templates') {
          return { tab: 'matchesTab', screen: 'friendlyMatchTemplates' };
        }
        if (parts[1] === 'template') {
          if (parts[2] === 'create') {
            return { tab: 'matchesTab', screen: 'createFriendlyMatchTemplate' };
          }
          if (parts[2] && parts[3] === 'edit') {
            return { 
              tab: 'matchesTab', 
              screen: 'editFriendlyMatchTemplate', 
              params: { templateId: parts[2] } 
            };
          }
        }

        // Match operations
        if (parts[1] === 'create') {
          return { tab: 'matchesTab', screen: 'createFriendlyMatch' };
        }
        if (parts[1] === 'invitations') {
          return { tab: 'matchesTab', screen: 'friendlyMatchInvitations' };
        }

        // Match specific operations
        if (parts[1]) {
          const matchId = parts[1];
          
          if (parts[2] === 'register') {
            return { tab: 'matchesTab', screen: 'matchRegistration', params: { matchId } };
          }
          if (parts[2] === 'team') {
            return { tab: 'matchesTab', screen: 'teamBuilding', params: { matchId } };
          }
          if (parts[2] === 'score') {
            return { tab: 'matchesTab', screen: 'scoreEntry', params: { matchId } };
          }
          if (parts[2] === 'goals') {
            return { tab: 'matchesTab', screen: 'goalAssistEntry', params: { matchId } };
          }
          if (parts[2] === 'rating') {
            return { tab: 'matchesTab', screen: 'playerRating', params: { matchId } };
          }
          if (parts[2] === 'payment') {
            return { tab: 'matchesTab', screen: 'paymentTracking', params: { matchId } };
          }
          if (parts[2] === 'manage-invitations') {
            return { tab: 'matchesTab', screen: 'manageInvitations', params: { matchId } };
          }
          if (parts[2] === 'edit-friendly') {
            return { tab: 'matchesTab', screen: 'editFriendlyMatch', params: { matchId } };
          }
          if (parts[2] === 'edit') {
            return { tab: 'matchesTab', screen: 'editMatch', params: { matchId } };
          }
          
          // Default: match detail
          return { tab: 'matchesTab', screen: 'matchDetail', params: { matchId } };
        }
      }

      // ============================================
      // STATS
      // ============================================
      if (parts[0] === 'stats') {
        if (!parts[1]) {
          return { tab: 'statsTab', screen: 'standingsList' };
        }
        
        const leagueId = parts[1];
        
        if (parts[2] === 'standings') {
          return { tab: 'statsTab', screen: 'standings', params: { leagueId } };
        }
        if (parts[2] === 'top-scorers') {
          return { tab: 'statsTab', screen: 'topScorers', params: { leagueId } };
        }
        if (parts[2] === 'top-assists') {
          return { tab: 'statsTab', screen: 'topAssists', params: { leagueId } };
        }
        if (parts[2] === 'mvp') {
          return { tab: 'statsTab', screen: 'mvp', params: { leagueId } };
        }
      }

      // ============================================
      // PROFILE
      // ============================================
      if (parts[0] === 'profile') {
        if (!parts[1]) {
          return { tab: 'profileTab', screen: 'playerStats' };
        }
        if (parts[1] === 'view') {
          return { tab: 'profileTab', screen: 'playerProfile' };
        }
        if (parts[1] === 'edit') {
          return { tab: 'profileTab', screen: 'editProfile' };
        }
        if (parts[1] === 'positions') {
          return { tab: 'profileTab', screen: 'selectPositions' };
        }
      }

      // ============================================
      // SETTINGS
      // ============================================
      if (parts[0] === 'settings') {
        if (parts[1] === 'notifications') {
          return { tab: 'profileTab', screen: 'notificationSettings' };
        }
        return { tab: 'profileTab', screen: 'settings' };
      }

      return null;
    } catch (error) {
      console.error('Error parsing deep link:', error);
      return null;
    }
  },

  /**
   * Deep link'i navigate et
   */
  navigateFromDeepLink(url: string): void {
    const parsed = this.parseDeepLink(url);
    
    if (!parsed) {
      console.warn('Could not parse deep link:', url);
      return;
    }

    if (parsed.tab && parsed.screen) {
      // @ts-ignore
      NavigationService.navigate(parsed.tab, {
        screen: parsed.screen,
        params: parsed.params,
      });
    } else if (parsed.tab) {
      // @ts-ignore
      NavigationService.navigate(parsed.tab);
    }
  },

  /**
   * Share link oluştur (Web + Deep link)
   */
  createShareableLink(deepLink: string): {
    deepLink: string;
    webLink: string;
  } {
    const webLink = deepLink.replace('matchmanagement://', 'https://matchmanagement.app/');
    return { deepLink, webLink };
  },
};