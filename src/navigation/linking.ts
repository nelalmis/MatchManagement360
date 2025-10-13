// ============================================
// DEEP LINKING CONFIGURATION (UPDATED FOR 6 TABS)
// ============================================

import { LinkingOptions } from '@react-navigation/native';
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
      Auth: {
        screens: {
          login: 'login',
          register: 'register',
          phoneVerification: 'verify/:phoneNumber',
        },
      },

      // ============================================
      // MAIN APP (6 TABS)
      // ============================================
      Main: {
        screens: {
          // ============================================
          // 1. HOME TAB
          // ============================================
          HomeTab: {
            screens: {
              home: '',
            },
          },

          // ============================================
          // 2. LEAGUES TAB
          // ============================================
          LeaguesTab: {
            screens: {
              leagueList: 'leagues',
              leagueDetail: 'league/:leagueId',
              createLeague: 'league/create',
              editLeague: 'league/:leagueId/edit',
              standings: 'league/:leagueId/standings',
              topScorers: 'league/:leagueId/top-scorers',
              topAssists: 'league/:leagueId/top-assists',
              mvp: 'league/:leagueId/mvp',
            },
          },

          // ============================================
          // 3. FIXTURES TAB
          // ============================================
          FixturesTab: {
            screens: {
              fixtureList: 'fixtures',
              fixtureDetail: 'fixture/:fixtureId',
              createFixture: 'fixture/create',
              editFixture: 'fixture/:fixtureId/edit',
              matchList: 'matches',
            },
          },

          // ============================================
          // 4. STANDINGS TAB
          // ============================================
          StandingsTab: {
            screens: {
              standingsList: 'stats',
              standings: 'stats/:leagueId/standings',
              topScorers: 'stats/:leagueId/top-scorers',
              topAssists: 'stats/:leagueId/top-assists',
              mvp: 'stats/:leagueId/mvp',
            },
          },

          // ============================================
          // 5. PROFILE TAB ⭐ YENİ
          // ============================================
          ProfileTab: {
            screens: {
              playerProfile: 'profile', // Kendi profilim
              playerStats: 'profile/stats',
              myMatches: 'profile/matches',
              editProfile: 'profile/edit',
            },
          },

          // ============================================
          // 6. SETTINGS TAB ⭐ YENİ
          // ============================================
          SettingsTab: {
            screens: {
              settings: 'settings',
              notificationSettings: 'settings/notifications',
            },
          },
        },
      },

      // ============================================
      // MODAL SCREENS (Root level)
      // ============================================
      
      // Match Screens
      matchDetail: 'match/:matchId',
      matchRegistration: 'match/:matchId/register',
      teamBuilding: 'match/:matchId/team',
      scoreEntry: 'match/:matchId/score',
      goalAssistEntry: 'match/:matchId/goals',
      playerRating: 'match/:matchId/rating',
      paymentTracking: 'match/:matchId/payment',
      editMatch: 'match/:matchId/edit',
      
      // Player Screens (Sadece başka oyuncular için)
      playerProfile: 'player/:playerId',
    },
  },
};

// ============================================
// DEEP LINK HELPERS (UPDATED)
// ============================================

export const DeepLinkHelper = {
  // ============================================
  // MATCH LINKS
  // ============================================
  
  createMatchLink(matchId: string): string {
    return `matchmanagement://match/${matchId}`;
  },

  createMatchRegistrationLink(matchId: string): string {
    return `matchmanagement://match/${matchId}/register`;
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
  // LEAGUE LINKS
  // ============================================
  
  createLeagueLink(leagueId: string): string {
    return `matchmanagement://league/${leagueId}`;
  },

  // ============================================
  // FIXTURE LINKS
  // ============================================
  
  createFixtureLink(fixtureId: string): string {
    return `matchmanagement://fixture/${fixtureId}`;
  },

  // ============================================
  // PLAYER LINKS
  // ============================================
  
  /**
   * Başka bir oyuncunun profil linki
   */
  createPlayerLink(playerId: string): string {
    return `matchmanagement://player/${playerId}`;
  },

  /**
   * Kendi profilim linki (Tab içinde)
   */
  createMyProfileLink(): string {
    return `matchmanagement://profile`;
  },

  /**
   * Kendi istatistiklerim linki (Tab içinde)
   */
  createMyStatsLink(): string {
    return `matchmanagement://profile/stats`;
  },

  /**
   * Geçmiş maçlarım linki (Tab içinde)
   */
  createMyMatchesLink(): string {
    return `matchmanagement://profile/matches`;
  },

  /**
   * Profil düzenle linki (Tab içinde)
   */
  createEditProfileLink(): string {
    return `matchmanagement://profile/edit`;
  },

  // ============================================
  // SETTINGS LINKS
  // ============================================
  
  createSettingsLink(): string {
    return `matchmanagement://settings`;
  },

  createNotificationSettingsLink(): string {
    return `matchmanagement://settings/notifications`;
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
  parseDeepLink(url: string): { screen: string; tab?: string; params?: any } | null {
    try {
      const deepLink = this.convertWebToDeepLink(url);
      const path = deepLink.replace('matchmanagement://', '');
      const parts = path.split('/');

      // ============================================
      // MATCH SCREENS (Root Modal)
      // ============================================
      if (parts[0] === 'match' && parts[1]) {
        const matchId = parts[1];
        
        if (parts[2] === 'register') {
          return { screen: 'matchRegistration', params: { matchId } };
        } else if (parts[2] === 'team') {
          return { screen: 'teamBuilding', params: { matchId } };
        } else if (parts[2] === 'score') {
          return { screen: 'scoreEntry', params: { matchId } };
        } else if (parts[2] === 'goals') {
          return { screen: 'goalAssistEntry', params: { matchId } };
        } else if (parts[2] === 'rating') {
          return { screen: 'playerRating', params: { matchId } };
        } else if (parts[2] === 'payment') {
          return { screen: 'paymentTracking', params: { matchId } };
        } else if (parts[2] === 'edit') {
          return { screen: 'editMatch', params: { matchId } };
        } else {
          return { screen: 'matchDetail', params: { matchId } };
        }
      }

      // ============================================
      // PLAYER SCREENS
      // ============================================
      
      // Başka oyuncunun profili (Root Modal)
      if (parts[0] === 'player' && parts[1]) {
        const playerId = parts[1];
        return { screen: 'playerProfile', params: { playerId } };
      }

      // Kendi profilim (ProfileTab)
      if (parts[0] === 'profile') {
        if (parts[1] === 'stats') {
          return { tab: 'ProfileTab', screen: 'playerStats' };
        } else if (parts[1] === 'matches') {
          return { tab: 'ProfileTab', screen: 'myMatches' };
        } else if (parts[1] === 'edit') {
          return { tab: 'ProfileTab', screen: 'editProfile' };
        } else {
          return { tab: 'ProfileTab', screen: 'playerProfile' };
        }
      }

      // ============================================
      // SETTINGS SCREENS (SettingsTab)
      // ============================================
      if (parts[0] === 'settings') {
        if (parts[1] === 'notifications') {
          return { tab: 'SettingsTab', screen: 'notificationSettings' };
        } else {
          return { tab: 'SettingsTab', screen: 'settings' };
        }
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

    // Root level modal screen
    if (parsed.screen && !parsed.tab) {
      // @ts-ignore
      NavigationService.navigate(parsed.screen, parsed.params);
    }
    
    // Tab içindeki screen
    else if (parsed.tab && parsed.screen) {
      // @ts-ignore
      NavigationService.navigate('Main', {
        screen: parsed.tab,
        params: {
          screen: parsed.screen,
          params: parsed.params
        }
      });
    }
  },
};