  
// // ============================================
// // HOME SCREEN - CLEAN VERSION
// // ============================================

// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   RefreshControl,
//   Alert,
//   SafeAreaView,
// } from 'react-native';
// import {
//   Trophy,
//   Calendar,
//   TrendingUp,
//   Users,
//   ChevronRight,
//   Clock,
//   MapPin,
//   Target,
//   Zap,
// } from 'lucide-react-native';
// import { useAppContext } from '../../context/AppContext';
// import { NavigationService } from '../../navigation/NavigationService';
// import { IMatch, ILeague, getSportIcon, getMatchStatusColor } from '../../types/types';
// import { matchService } from '../../services/matchService';
// import { leagueService } from '../../services/leagueService';
// import { playerStatsService } from '../../services/playerStatsService';
// import { CustomHeader } from '../../components/CustomHeader';
// // ============================================
// // SKELETON COMPONENTS
// // ============================================

//   import { canRegisterToMatch } from '../../helper/matchRegisterHelper';
// const StatCardSkeleton: React.FC = () => (
//   <View style={[styles.statCard, styles.skeletonContainer]}>
//     <View style={[styles.skeleton, styles.skeletonIcon]} />
//     <View style={[styles.skeleton, styles.skeletonValue]} />
//     <View style={[styles.skeleton, styles.skeletonLabel]} />
//   </View>
// );

// const MatchCardSkeleton: React.FC = () => (
//   <View style={styles.matchCard}>
//     <View style={styles.matchCardLeft}>
//       <View style={[styles.skeleton, styles.skeletonEmoji]} />
//       <View style={{ flex: 1 }}>
//         <View style={[styles.skeleton, styles.skeletonTitle]} />
//         <View style={[styles.skeleton, styles.skeletonMeta]} />
//       </View>
//     </View>
//   </View>
// );

// // ============================================
// // MAIN COMPONENT
// // ============================================

// export const HomeScreen: React.FC = () => {
//   const { user } = useAppContext();

//   useEffect(() => {
//     console.log('HomeScreen MOUNT');
//     return () => {
//       console.log('HomeScreen UNMOUNT');
//     };
//   }, []);
//   const [refreshing, setRefreshing] = useState(false);
//   const [upcomingMatches, setUpcomingMatches] = useState<IMatch[]>([]);
//   const [myLeagues, setMyLeagues] = useState<ILeague[]>([]);
//   const [loading, setLoading] = useState(true);

//   const [stats, setStats] = useState({
//     totalMatches: 0,
//     totalLeagues: 0,
//     averageRating: 0,
//     nextMatch: null as IMatch | null,
//   });

//   const UPCOMING_STATUSES = [
//     'Kayıt Açık',
//     'Kayıt Kapandı',
//     'Takımlar Oluşturuldu',
//     'Oynanıyor'
//   ];

//   // ============================================
//   // EFFECTS
//   // ============================================

//   useEffect(() => {
//     loadData();
//   }, [user?.id]);

//   // ============================================
//   // DATA LOADING
//   // ============================================

//   const loadData = useCallback(async () => {
//     if (!user?.id) return;

//     try {
//       setLoading(true);

//       const [matches, leagues, playerStats] = await Promise.all([
//         matchService.getMatchesByPlayer(user.id),
//         leagueService.getLeaguesByPlayer(user.id),
//         playerStatsService.getStatsByPlayer(user.id),
//       ]);

//       const upcoming = matches
//         .filter(m =>
//           new Date(m.matchStartTime) > new Date() &&
//           UPCOMING_STATUSES.includes(m.status)
//         )
//         .sort((a, b) => new Date(a.matchStartTime).getTime() - new Date(b.matchStartTime).getTime())
//         .slice(0, 3);

//       setUpcomingMatches(upcoming);
//       setMyLeagues(leagues.slice(0, 3));

//       const totalRatings = playerStats.reduce((sum, s) => sum + (s.rating || 0), 0);
//       const averageRating = playerStats.length > 0 ? totalRatings / playerStats.length : 0;

//       setStats({
//         totalMatches: matches.length,
//         totalLeagues: leagues.length,
//         averageRating: parseFloat(averageRating.toFixed(1)),
//         nextMatch: upcoming[0] || null,
//       });

//     } catch (error) {
//       console.error('Error loading home data:', error);
//       Alert.alert('Hata', 'Veriler yüklenemedi. Lütfen tekrar deneyin.');
//     } finally {
//       setLoading(false);
//     }
//   }, [user?.id]);

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     await loadData();
//     setRefreshing(false);
//   }, [loadData]);

//   // ============================================
//   // FORMATTERS
//   // ============================================

//   const formatDate = useCallback((date: Date) => {
//     return new Date(date).toLocaleDateString('tr-TR', {
//       day: 'numeric',
//       month: 'long',
//       weekday: 'short',
//     });
//   }, []);

//   const formatTime = useCallback((date: Date) => {
//     return new Date(date).toLocaleTimeString('tr-TR', {
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   }, []);

//   const formattedMatches = useMemo(() =>
//     upcomingMatches.map(match => ({
//       ...match,
//       formattedDate: formatDate(match.matchStartTime),
//       formattedTime: formatTime(match.matchStartTime),
//       canRegister: canRegisterToMatch(match, user?.id, null),
//     })),
//     [upcomingMatches, formatDate, formatTime, user?.id]
//   );

//   // ============================================
//   // HANDLERS
//   // ============================================

//   const handleMatchPress = useCallback((match: IMatch) => {
//     if (match.status === 'Kayıt Açık') {
//       NavigationService.navigateToMatchRegistration( match.id );
//     } else {
//       NavigationService.navigateToMatch( match.id );
//     }
//   }, []);

//   const handleLeaguePress = useCallback((leagueId: string) => {
//     NavigationService.navigateToLeague(leagueId);
//   }, []);

//   // ============================================
//   // LOADING STATE
//   // ============================================

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.safeArea}>
//         <View style={styles.wrapper}>
//           {/* <CustomHeader title="Ana Sayfa" showDrawer={true} /> */}
//           <ScrollView style={styles.container}>
//             <View style={styles.statsContainer}>
//               <StatCardSkeleton />
//               <StatCardSkeleton />
//               <StatCardSkeleton />
//             </View>
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <View style={[styles.skeleton, { width: 150, height: 24 }]} />
//               </View>
//               <MatchCardSkeleton />
//               <MatchCardSkeleton />
//             </View>
//           </ScrollView>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ============================================
//   // MAIN RENDER
//   // ============================================

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.wrapper}>
//         <ScrollView
//           style={styles.container}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl
//               refreshing={refreshing}
//               onRefresh={onRefresh}
//               tintColor="#16a34a"
//               colors={['#16a34a']}
//             />
//           }
//         >
//           {/* Quick Stats */}
//           <View style={styles.statsContainer}>
//             <View style={styles.statCard}>
//               <View style={styles.statIconContainer}>
//                 <Calendar size={24} color="#16a34a" strokeWidth={2} />
//               </View>
//               <Text style={styles.statValue}>{stats.totalMatches}</Text>
//               <Text style={styles.statLabel}>Toplam Maç</Text>
//             </View>

//             <View style={styles.statCard}>
//               <View style={styles.statIconContainer}>
//                 <Trophy size={24} color="#F59E0B" strokeWidth={2} />
//               </View>
//               <Text style={styles.statValue}>{stats.totalLeagues}</Text>
//               <Text style={styles.statLabel}>Lig</Text>
//             </View>

//             <View style={styles.statCard}>
//               <View style={styles.statIconContainer}>
//                 <TrendingUp size={24} color="#2563EB" strokeWidth={2} />
//               </View>
//               <Text style={styles.statValue}>
//                 {stats.averageRating > 0 ? stats.averageRating : '-'}
//               </Text>
//               <Text style={styles.statLabel}>Ortalama</Text>
//             </View>
//           </View>

//           {/* Next Match Highlight */}
//           {stats.nextMatch && (
//             <TouchableOpacity
//               style={styles.nextMatchCard}
//               activeOpacity={0.7}
//               onPress={() => handleMatchPress(stats.nextMatch!)}
//             >
//               <View style={styles.nextMatchHeader}>
//                 <View style={styles.nextMatchBadge}>
//                   <Zap size={14} color="white" strokeWidth={2.5} />
//                   <Text style={styles.nextMatchBadgeText}>Sonraki Maç</Text>
//                 </View>
//                 <Text style={styles.nextMatchEmoji}>
//                   {getSportIcon(myLeagues.find(l => l.id === stats.nextMatch?.fixtureId)?.sportType || 'Futbol')}
//                 </Text>
//               </View>

//               <Text style={styles.nextMatchTitle}>{stats.nextMatch.title}</Text>

//               <View style={styles.nextMatchDetails}>
//                 <View style={styles.nextMatchDetailItem}>
//                   <Clock size={16} color="#6B7280" strokeWidth={2} />
//                   <Text style={styles.nextMatchDetailText}>
//                     {formatDate(stats.nextMatch.matchStartTime)} • {formatTime(stats.nextMatch.matchStartTime)}
//                   </Text>
//                 </View>

//                 {stats.nextMatch.location && (
//                   <View style={styles.nextMatchDetailItem}>
//                     <MapPin size={16} color="#6B7280" strokeWidth={2} />
//                     <Text style={styles.nextMatchDetailText}>
//                       {stats.nextMatch.location}
//                     </Text>
//                   </View>
//                 )}
//               </View>

//               <View style={styles.nextMatchFooter}>
//                 <View style={styles.nextMatchPlayers}>
//                   <Users size={16} color="#16a34a" strokeWidth={2} />
//                   <Text style={styles.nextMatchPlayersText}>
//                     {stats.nextMatch.registeredPlayerIds?.length || 0} oyuncu kayıtlı
//                   </Text>
//                 </View>
//                 <ChevronRight size={20} color="#16a34a" strokeWidth={2.5} />
//               </View>
//             </TouchableOpacity>
//           )}

//           {/* Upcoming Matches */}
//           <View style={styles.section}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Yaklaşan Maçlar</Text>
//               <TouchableOpacity
//                 onPress={() => NavigationService.navigateToMyMatches()}
//                 activeOpacity={0.7}
//               >
//                 <Text style={styles.seeAllText}>Tümünü Gör</Text>
//               </TouchableOpacity>
//             </View>

//             {formattedMatches.length > 0 ? (
//               formattedMatches.map((match) => (
//                 <TouchableOpacity
//                   key={match.id}
//                   style={styles.matchCard}
//                   activeOpacity={0.7}
//                   onPress={() => handleMatchPress(match)}
//                 >
//                   <View style={styles.matchCardLeft}>
//                     <Text style={styles.matchEmoji}>
//                       {getSportIcon(myLeagues.find(l => l.id === match.fixtureId)?.sportType || 'Futbol')}
//                     </Text>
//                     <View style={styles.matchCardInfo}>
//                       <Text style={styles.matchCardTitle} numberOfLines={1}>
//                         {match.title}
//                       </Text>
//                       <View style={styles.matchCardMeta}>
//                         <Clock size={12} color="#6B7280" strokeWidth={2} />
//                         <Text style={styles.matchCardMetaText}>
//                           {match.formattedDate} • {match.formattedTime}
//                         </Text>
//                       </View>
//                     </View>
//                   </View>

//                   <View style={styles.matchCardRight}>
//                     <View
//                       style={[
//                         styles.matchStatusBadge,
//                         { backgroundColor: getMatchStatusColor(match.status) + '20' },
//                       ]}
//                     >
//                       <Text
//                         style={[
//                           styles.matchStatusText,
//                           { color: getMatchStatusColor(match.status) },
//                         ]}
//                       >
//                         {match.status}
//                       </Text>
//                     </View>
//                     <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
//                   </View>
//                 </TouchableOpacity>
//               ))
//             ) : (
//               <View style={styles.emptyState}>
//                 <View style={styles.emptyIconContainer}>
//                   <Calendar size={48} color="#D1D5DB" strokeWidth={1.5} />
//                 </View>
//                 <Text style={styles.emptyStateText}>Yaklaşan maç bulunmuyor</Text>
//                 <TouchableOpacity
//                   style={styles.emptyStateButton}
//                   onPress={() => NavigationService.navigateToFixturesTab()}
//                   activeOpacity={0.8}
//                 >
//                   <Text style={styles.emptyStateButtonText}>Maçları Keşfet</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>

//           {/* My Leagues */}
//           <View style={styles.section}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>Liglerim</Text>
//               <TouchableOpacity
//                 onPress={() => NavigationService.navigateToLeaguesTab()}
//                 activeOpacity={0.7}
//               >
//                 <Text style={styles.seeAllText}>Tümünü Gör</Text>
//               </TouchableOpacity>
//             </View>

//             {myLeagues.length > 0 ? (
//               myLeagues.map((league) => (
//                 <TouchableOpacity
//                   key={league.id}
//                   style={styles.leagueCard}
//                   activeOpacity={0.7}
//                   onPress={() => handleLeaguePress(league.id!)}
//                 >
//                   <View style={styles.leagueCardLeft}>
//                     <Text style={styles.leagueEmoji}>{getSportIcon(league.sportType)}</Text>
//                     <View style={styles.leagueCardInfo}>
//                       <Text style={styles.leagueCardTitle} numberOfLines={1}>
//                         {league.title}
//                       </Text>
//                       <View style={styles.leagueCardMeta}>
//                         <Users size={12} color="#6B7280" strokeWidth={2} />
//                         <Text style={styles.leagueCardMetaText}>
//                           {league.playerIds?.length || 0} oyuncu
//                         </Text>
//                       </View>
//                     </View>
//                   </View>
//                   <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
//                 </TouchableOpacity>
//               ))
//             ) : (
//               <View style={styles.emptyState}>
//                 <View style={styles.emptyIconContainer}>
//                   <Trophy size={48} color="#D1D5DB" strokeWidth={1.5} />
//                 </View>
//                 <Text style={styles.emptyStateText}>Henüz bir lige katılmadınız</Text>
//                 <TouchableOpacity
//                   style={styles.emptyStateButton}
//                   onPress={() => NavigationService.navigateToLeaguesTab()}
//                   activeOpacity={0.8}
//                 >
//                   <Text style={styles.emptyStateButtonText}>Ligleri Keşfet</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>

//           {/* Quick Actions */}
//           <View style={styles.quickActions}>
//             <TouchableOpacity
//               style={styles.quickActionButton}
//               onPress={() => {
//                 if (myLeagues.length === 0) {
//                   Alert.alert('Lig Bulunamadı', 'Önce bir lige katılmanız gerekiyor.');
//                   return;
//                 }
//                 NavigationService.navigateToStandingsTab();
//               }}
//               activeOpacity={0.7}
//             >
//               <View style={styles.quickActionIcon}>
//                 <TrendingUp size={20} color="#16a34a" strokeWidth={2} />
//               </View>
//               <Text style={styles.quickActionText}>Puan Durumu</Text>
//               <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={styles.quickActionButton}
//               onPress={() => {
//                 if (user?.id) {
//                   NavigationService.navigateToProfileTab();
//                 }
//               }}
//               activeOpacity={0.7}
//             >
//               <View style={styles.quickActionIcon}>
//                 <Target size={20} color="#F59E0B" strokeWidth={2} />
//               </View>
//               <Text style={styles.quickActionText}>İstatistiklerim</Text>
//               <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.bottomSpacing} />
//         </ScrollView>
//       </View>
//     </SafeAreaView>
//   );
// };

// // ============================================
// // STYLES - ALL IN ONE PLACE
// // ============================================

// const styles = StyleSheet.create({
//   // Container Styles
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#16a34a',
//   },
//   wrapper: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
//   container: {
//     flex: 1,
//     backgroundColor: '#F9FAFB',
//   },
  
//   // Stats Container
//   statsContainer: {
//     flexDirection: 'row',
//     gap: 12,
//     paddingHorizontal: 16,
//     paddingTop: 20,
//     marginBottom: 20,
//   },
//   statCard: {
//     flex: 1,
//     backgroundColor: 'white',
//     borderRadius: 16,
//     padding: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 3,
//     elevation: 2,
//   },
//   statIconContainer: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#F0FDF4',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   statValue: {
//     fontSize: 24,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 2,
//   },
//   statLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
  
//   // Next Match Card
//   nextMatchCard: {
//     backgroundColor: 'white',
//     borderRadius: 20,
//     padding: 20,
//     marginHorizontal: 16,
//     marginBottom: 24,
//     borderWidth: 2,
//     borderColor: '#16a34a',
//     shadowColor: '#16a34a',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.15,
//     shadowRadius: 12,
//     elevation: 5,
//   },
//   nextMatchHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   nextMatchBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#16a34a',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   nextMatchBadgeText: {
//     color: 'white',
//     fontSize: 12,
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     letterSpacing: 0.5,
//   },
//   nextMatchEmoji: {
//     fontSize: 32,
//   },
//   nextMatchTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//     marginBottom: 12,
//   },
//   nextMatchDetails: {
//     gap: 8,
//     marginBottom: 16,
//   },
//   nextMatchDetailItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   nextMatchDetailText: {
//     fontSize: 14,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   nextMatchFooter: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#E5E7EB',
//   },
//   nextMatchPlayers: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//   },
//   nextMatchPlayersText: {
//     fontSize: 14,
//     color: '#16a34a',
//     fontWeight: '600',
//   },
  
//   // Section Styles
//   section: {
//     marginBottom: 24,
//   },
//   sectionHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     marginBottom: 12,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#1F2937',
//   },
//   seeAllText: {
//     fontSize: 14,
//     color: '#16a34a',
//     fontWeight: '600',
//   },
  
//   // Match Card
//   matchCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginHorizontal: 16,
//     marginBottom: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   matchCardLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     marginRight: 12,
//   },
//   matchEmoji: {
//     fontSize: 32,
//     marginRight: 12,
//   },
//   matchCardInfo: {
//     flex: 1,
//   },
//   matchCardTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 4,
//   },
//   matchCardMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   matchCardMetaText: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
//   matchCardRight: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   matchStatusBadge: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   matchStatusText: {
//     fontSize: 11,
//     fontWeight: '700',
//   },
  
//   // League Card
//   leagueCard: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginHorizontal: 16,
//     marginBottom: 12,
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   leagueCardLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     marginRight: 12,
//   },
//   leagueEmoji: {
//     fontSize: 32,
//     marginRight: 12,
//   },
//   leagueCardInfo: {
//     flex: 1,
//   },
//   leagueCardTitle: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginBottom: 4,
//   },
//   leagueCardMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   leagueCardMetaText: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
  
//   // Empty State
//   emptyState: {
//     alignItems: 'center',
//     paddingVertical: 40,
//     paddingHorizontal: 16,
//   },
//   emptyIconContainer: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#F3F4F6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 16,
//   },
//   emptyStateText: {
//     fontSize: 15,
//     color: '#6B7280',
//     marginBottom: 20,
//     fontWeight: '500',
//   },
//   emptyStateButton: {
//     backgroundColor: '#16a34a',
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 10,
//     shadowColor: '#16a34a',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   emptyStateButtonText: {
//     color: 'white',
//     fontSize: 14,
//     fontWeight: '700',
//   },
  
//   // Quick Actions
//   quickActions: {
//     flexDirection: 'row',
//     gap: 12,
//     paddingHorizontal: 16,
//     marginBottom: 24,
//   },
//   quickActionButton: {
//     flex: 1,
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   quickActionIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F0FDF4',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   quickActionText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#1F2937',
//     flex: 1,
//   },
  
//   // Skeleton Styles
//   skeletonContainer: {
//     overflow: 'hidden',
//   },
//   skeleton: {
//     backgroundColor: '#E5E7EB',
//     borderRadius: 8,
//   },
//   skeletonIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     marginBottom: 8,
//   },
//   skeletonValue: {
//     width: 40,
//     height: 28,
//     marginBottom: 4,
//   },
//   skeletonLabel: {
//     width: 60,
//     height: 16,
//   },
//   skeletonEmoji: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     marginRight: 12,
//   },
//   skeletonTitle: {
//     width: '80%',
//     height: 18,
//     marginBottom: 6,
//   },
//   skeletonMeta: {
//     width: '60%',
//     height: 14,
//   },
  
//   // Spacing
//   bottomSpacing: {
//     height: 20,
//   },
// });