// // ============================================
// // NAVIGATION SERVICE (UPDATED)
// // ============================================

// import { createNavigationContainerRef, StackActions } from '@react-navigation/native';
// import { RootStackParamList } from './types';
// import { useAppContext } from '../context/AppContext';
// import { SportType } from '../types/types';

// export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// export const NavigationService = {
//   /**
//    * Navigation hazır mı kontrol et
//    */
//   isReady(): boolean {
//     return navigationRef.isReady();
//   },

//   /**
//    * Bir ekrana git
//    */
//   navigate<T extends keyof RootStackParamList>(
//     name: T,
//     params?: RootStackParamList[T]
//   ): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Navigation type complexity workaround
//       navigationRef.navigate(name, params);
//     }
//   },

//   /**
//    * Geri git
//    */
//   goBack(): void {
//     if (navigationRef.isReady() && navigationRef.canGoBack()) {
//       navigationRef.goBack();
//     }
//   },

//   /**
//    * Stack'i sıfırla ve belirtilen ekrana git
//    */
//   reset(routeName: keyof RootStackParamList, params?: any): void {
//     if (navigationRef.isReady()) {
//       navigationRef.reset({
//         index: 0,
//         routes: [{ name: routeName as string, params }],
//       });
//     }
//   },

//   /**
//    * Yeni ekran ekle (Stack'e push)
//    */
//   push<T extends keyof RootStackParamList>(
//     name: T,
//     params?: RootStackParamList[T]
//   ): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Navigation type complexity workaround
//       navigationRef.dispatch(StackActions.push(name, params));
//     }
//   },

//   /**
//    * Belirli sayıda ekran geri git
//    */
//   pop(count: number = 1): void {
//     if (navigationRef.isReady()) {
//       navigationRef.dispatch(StackActions.pop(count));
//     }
//   },

//   /**
//    * Root'a (Ana ekrana) git
//    */
//   popToTop(): void {
//     if (navigationRef.isReady()) {
//       navigationRef.dispatch(StackActions.popToTop());
//     }
//   },

//   /**
//    * Mevcut route bilgisini al
//    */
//   getCurrentRoute() {
//     if (navigationRef.isReady()) {
//       return navigationRef.getCurrentRoute();
//     }
//     return null;
//   },

//   // ============================================
//   // MATCH SCREENS (Root Level - Modal)
//   // ============================================

//   /**
//    * Match detay ekranına git (Modal)
//    */
//   navigateToMatch(matchId: string): void {
//     this.navigate('matchDetail', { matchId });
//   },

//   /**
//    * Match registration ekranına git (Modal)
//    */
//   navigateToMatchRegistration(matchId: string): void {
//     this.navigate('matchRegistration', { matchId });
//   },

//   /**
//    * Team building ekranına git (Modal)
//    */
//   navigateToTeamBuilding(matchId: string): void {
//     this.navigate('teamBuilding', { matchId });
//   },

//   /**
//    * Score entry ekranına git (Modal)
//    */
//   navigateToScoreEntry(matchId: string): void {
//     this.navigate('scoreEntry', { matchId });
//   },

//   /**
//    * Goal/Assist entry ekranına git (Modal)
//    */
//   navigateToGoalAssistEntry(matchId: string): void {
//     this.navigate('goalAssistEntry', { matchId });
//   },

//   /**
//    * Player rating ekranına git (Modal)
//    */
//   navigateToPlayerRating(matchId: string): void {
//     this.navigate('playerRating', { matchId });
//   },

//   /**
//    * Payment tracking ekranına git (Modal)
//    */
//   navigateToPaymentTracking(matchId: string): void {
//     this.navigate('paymentTracking', { matchId });
//   },

//   /**
//    * Edit Match ekranına git (Modal)
//    */
//   navigateToEditMatch(matchId: string): void {
//     this.navigate('editMatch', { matchId });
//   },

//   // ============================================
//   // PLAYER SCREENS (Root Level - Modal)
//   // ============================================

//   /**
//    * Player profil ekranına git (Modal)
//    */
//   navigateToPlayer(playerId: string): void {
//     this.navigate('playerProfile', { playerId });
//   },

//   // ============================================
//   // LEAGUE SCREENS (Tab içinde - Nested Navigation)
//   // ============================================

//   /**
//    * League detay ekranına git
//    */
//   navigateToLeague(leagueId: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'LeaguesTab',
//         params: {
//           screen: 'leagueDetail',
//           params: { leagueId },
//         },
//       });
//     }
//   },

//   /**
//    * Create League ekranına git
//    */
//   navigateToCreateLeague(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'LeaguesTab',
//         params: {
//           screen: 'createLeague',
//         },
//       });
//     }
//   },

//   /**
//    * Edit League ekranına git
//    */
//   navigateToEditLeague(leagueId: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'LeaguesTab',
//         params: {
//           screen: 'editLeague',
//           params: { leagueId },
//         },
//       });
//     }
//   },

//   // ============================================
//   // FIXTURE SCREENS (Tab içinde - Nested Navigation)
//   // ============================================

//   /**
//    * Fixture detay ekranına git
//    */
//   navigateToFixture(fixtureId: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'FixturesTab',
//         params: {
//           screen: 'fixtureDetail',
//           params: { fixtureId },
//         },
//       });
//     }
//   },

//   /**
//    * Create Fixture ekranına git
//    */
//   navigateToCreateFixture(leagueId: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'FixturesTab',
//         params: {
//           screen: 'createFixture',
//           params: { leagueId },
//         },
//       });
//     }
//   },

//   /**
//    * Match List ekranına git
//    */
//   navigateToMatchList(leagueId?: string, fixtureId?: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'FixturesTab',
//         params: {
//           screen: 'matchList',
//           params: { leagueId, fixtureId },
//         },
//       });
//     }
//   },

//   /**
//    * Fixture List ekranına git
//    */
//   navigateToFixtureList(leagueId?: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'FixturesTab',
//         params: {
//           screen: 'fixtureList',
//           params: { leagueId },
//         },
//       });
//     }
//   },

//   // ============================================
//   // STANDINGS SCREENS (Tab içinde - Nested Navigation)
//   // ============================================

//   /**
//    * Standings (Puan Durumu) ekranına git
//    */
//   navigateToStandings(leagueId: string, seasonId?: string): void {
//     if (navigationRef.isReady()) {
//       const finalSeasonId = seasonId || `season_${new Date().getFullYear()}`;
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'StandingsTab',
//         params: {
//           screen: 'standings',
//           params: { leagueId, seasonId: finalSeasonId },
//         },
//       });
//     }
//   },

//   /**
//    * Top Scorers (Gol Krallığı) ekranına git
//    */
//   navigateToTopScorers(leagueId: string, seasonId: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'StandingsTab',
//         params: {
//           screen: 'topScorers',
//           params: { leagueId, seasonId },
//         },
//       });
//     }
//   },

//   /**
//    * Top Assists (Asist Krallığı) ekranına git
//    */
//   navigateToTopAssists(leagueId: string, seasonId: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'StandingsTab',
//         params: {
//           screen: 'topAssists',
//           params: { leagueId, seasonId },
//         },
//       });
//     }
//   },

//   /**
//    * MVP ekranına git
//    */
//   navigateToMVP(leagueId: string, seasonId: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation type complexity
//       navigationRef.navigate('Main', {
//         screen: 'StandingsTab',
//         params: {
//           screen: 'mvp',
//           params: { leagueId, seasonId },
//         },
//       });
//     }
//   },

//   // ============================================
//   // AUTH SCREENS
//   // ============================================

//   /**
//    * Login ekranına git (Logout için)
//    */
//   navigateToLogin(): void {
//     this.reset('Auth', { screen: 'login' });
//   },

//   /**
//    * Register ekranına git
//    */
//   navigateToRegister(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation
//       navigationRef.navigate('Auth', { screen: 'register' });
//     }
//   },

//   /**
//  * Navigate to select positions screen
//  */
//   navigateToSelectPositions(sport: SportType,
//     selectedPositions: string[],
//     onSave: (positions: string[]) => void): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('playerProfile', { screen: 'selectedPositions', params: { sport: sport, selectedPositions: selectedPositions, onSave: onSave } });
//     }
//   },

//   /**
//    * Phone Verification ekranına git
//    */
//   navigateToPhoneVerification(phoneNumber: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation
//       navigationRef.navigate('Auth', {
//         screen: 'phoneVerification',
//         params: { phoneNumber }
//       });
//     }
//   },

//   /**
//    * Ana ekrana git (Login sonrası)
//    */
//   navigateToMain(): void {
//     this.reset('Main');
//   },

//   // ============================================
//   // TAB NAVIGATION HELPERS
//   // ============================================

//   navigateToHomeTab(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation
//       navigationRef.navigate('Main', { screen: 'HomeTab' });
//     }
//   },

//   navigateToLeaguesTab(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation
//       navigationRef.navigate('Main', { screen: 'LeaguesTab' });
//     }
//   },

//   navigateToFixturesTab(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation
//       navigationRef.navigate('Main', { screen: 'FixturesTab' });
//     }
//   },

//   navigateToStandingsTab(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore - Nested navigation
//       navigationRef.navigate('Main', { screen: 'StandingsTab' });
//     }
//   },

//   /**
//  * Profile Tab'ına git
//  */
//   navigateToProfileTab(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('Main', { screen: 'ProfileTab' });
//     }
//   },

//   /**
//    * Kendi profilime git (Tab içinde)
//    */
//   navigateToMyProfile(): void {
//     if (navigationRef.isReady()) {
//       const { user } = useAppContext(); // ⚠️ Bu hook kullanılamaz burada
//       // @ts-ignore
//       navigationRef.navigate('Main', {
//         screen: 'ProfileTab',
//         params: {
//           screen: 'playerProfile',
//           params: { playerId: user?.id }
//         }
//       });
//     }
//   },

//   /**
//    * Edit profile ekranına git (Tab içinde)
//    */
//   navigateToEditProfile(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('Main', {
//         screen: 'ProfileTab',
//         params: { screen: 'editProfile' }
//       });
//     }
//   },

//   /**
//    * My stats ekranına git (Tab içinde)
//    */
//   navigateToMyStats(playerId: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('Main', {
//         screen: 'ProfileTab',
//         params: {
//           screen: 'playerStats',
//           params: { playerId }
//         }
//       });
//     }
//   },

//   /**
//  * Navigate to player stats in StandingsTab
//  */
//   navigateToPlayerStats(playerId?: string): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('Main', {
//         screen: 'StandingsTab',
//         params: {
//           screen: 'playerStats',
//           params: {playerId}
//         }
//       });
//     }
//   },

//   /**
//    * My matches ekranına git (Tab içinde)
//    */
//   navigateToMyMatches(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('Main', {
//         screen: 'FixturesTab',
//         params: {
//           screen: 'myMatches',
//         }
//       });
//     }
//   },

//   // ============================================
//   // SETTINGS TAB NAVIGATION
//   // ============================================

//   /**
//    * Settings Tab'ına git
//    */
//   navigateToSettingsTab(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('Main', { screen: 'SettingsTab' });
//     }
//   },

//   /**
//  * Navigate to settings in ProfileTab
//  */
//   navigateToSettings(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('Main', {
//         screen: 'ProfileTab',
//         params: {
//           screen: 'settings'
//         }
//       });
//     }
//   },

//   /**
//    * Notification settings ekranına git (Tab içinde)
//    */
//   navigateToNotificationSettings(): void {
//     if (navigationRef.isReady()) {
//       // @ts-ignore
//       navigationRef.navigate('Main', {
//         screen: 'ProfileTab',
//         params: { screen: 'notificationSettings' }
//       });
//     }
//   },

// };

// export default NavigationService;