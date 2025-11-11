// src/screens/Match/MyMatchesScreen.tsx
// 🎯 PERSONAL PERFORMANCE DASHBOARD - Enhanced Stats & Analytics with Pagination

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import {
  Search,
  Filter,
  X,
  Calendar,
  Trophy,
  Target,
  Users,
  Crown,
  CheckCircle2,
  XCircle,
  Minus,
  ChevronRight,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Award,
  Zap,
  BarChart3,
  Globe,
  Star,
  Flame,
  Activity,
  Plus,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { eventManager, Events } from '../../utils';
import {
  IMatch,
  ILeague,
  IFixture,
  SportType,
  MatchType,
  MatchStatus,
} from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { PlayerRatingProfileService } from '../../services/serviceLayer/playerRatingProfileService';
import { PlayerProfileService } from '../../services/serviceLayer/playerProfileService';
import { PlayerStatsService } from '../../services/serviceLayer/playerStatsService';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { MatchInvitationService } from '../../services/serviceLayer/invitationService';
import { useAutoHideTabBar } from '../../context/TabBarContext';
import { sportThemes } from '../../utils/theme';
import { goBack, MatchNavigationService } from '../../navigation';
import { LoadingScreen } from '../Common';
import { getMatchResultBadge, getMatchStatusColor, getMatchStatusText } from '../../helper/matchHelper';
import { MatchCard } from './components/MatchCardV4';

interface MatchWithLeague {
  match: IMatch;
  league: ILeague | null;
  fixture: IFixture | null;
}

type FilterType = 'all' | 'completed' | 'upcoming' | 'cancelled';
type MatchTypeFilter = 'all' | 'league' | 'friendly';
type ViewMode = 'list' | 'compact';

const PAGE_SIZE = 20;
const INITIAL_LOAD_SIZE = 10;

export const MyMatchesScreen: React.FC = () => {
  // ✅ Tab bar gizleme (isteğe bağlı)
  // useAutoHideTabBar(false);

  const route: any = useRoute();
  const { user } = useAuth();
  const playerId = route.params?.playerId || user?.id;

  // Pagination state
  const [allMatches, setAllMatches] = useState<MatchWithLeague[]>([]);
  const [displayedMatches, setDisplayedMatches] = useState<MatchWithLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastUpcomingDoc, setLastUpcomingDoc] = useState<any>(null);
  const [lastHistoryDoc, setLastHistoryDoc] = useState<any>(null);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // Performance data
  const [ratingProfile, setRatingProfile] = useState<any>(null);
  const [playerProfile, setPlayerProfile] = useState<any>(null);
  const [careerStats, setCareerStats] = useState<any>(null);
  const [performanceInsights, setPerformanceInsights] = useState<any>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>('all');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Cache refs
  const fixtureCache = useRef(new Map<string, IFixture>());
  const leagueCache = useRef(new Map<string, ILeague>());

  // Event listeners
  useEffect(() => {
    const unsubscribeUpdate = eventManager.on(Events.MATCH_UPDATED, () => resetAndLoad());
    const unsubscribeRegister = eventManager.on(Events.MATCH_REGISTERED, () => resetAndLoad());
    const unsubscribeUnregister = eventManager.on(Events.MATCH_UNREGISTERED, () => resetAndLoad());
    const unsubscribeScore = eventManager.on(Events.SCORE_UPDATED, () => resetAndLoad());

    return () => {
      unsubscribeUpdate();
      unsubscribeRegister();
      unsubscribeUnregister();
      unsubscribeScore();
    };
  }, []);

  useEffect(() => {
    if (playerId) {
      resetAndLoad();
      loadPendingInvitations();
      loadPerformanceData();
    }
  }, [playerId]);

  // Reset pagination when filters change
  useEffect(() => {
    const filtered = getFilteredMatches();
    setDisplayedMatches(filtered.slice(0, INITIAL_LOAD_SIZE));
    setHasMore(filtered.length > INITIAL_LOAD_SIZE);
  }, [searchQuery, filterType, matchTypeFilter, selectedSport, allMatches]);

  // Available sports
  const availableSports = useMemo(() => {
    const sports = new Set<SportType>();
    allMatches.forEach(({ match, league }) => {
      if (match.sportType) {
        sports.add(match.sportType);
      } else if (league) {
        sports.add(league.sportType);
      }
    });
    return Array.from(sports);
  }, [allMatches]);

  // Filter matches
  const getFilteredMatches = useCallback(() => {
    let filtered = allMatches;
    const now = new Date();

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(({ match }) =>
        match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.venue?.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Match type filter
    if (matchTypeFilter === 'league') {
      filtered = filtered.filter(({ match }) => match.type === MatchType.LEAGUE);
    } else if (matchTypeFilter === 'friendly') {
      filtered = filtered.filter(({ match }) => match.type === MatchType.FRIENDLY);
    }

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(({ match, league }) => {
        const sportType = match.sportType || league?.sportType;
        return sportType === selectedSport;
      });
    }

    // Status filter
    if (filterType === 'completed') {
      filtered = filtered.filter(({ match }) => match.status === MatchStatus.COMPLETED);
    } else if (filterType === 'upcoming') {
      filtered = filtered.filter(
        ({ match }) =>
          new Date(match.schedule.matchStart) > now &&
          match.status !== MatchStatus.CANCELLED &&
          match.status !== MatchStatus.COMPLETED
      );
    } else if (filterType === 'cancelled') {
      filtered = filtered.filter(({ match }) => match.status === MatchStatus.CANCELLED);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.match.schedule.matchStart).getTime();
      const dateB = new Date(b.match.schedule.matchStart).getTime();

      if (filterType === 'upcoming' || filterType === 'all') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });

    return sorted;
  }, [allMatches, searchQuery, filterType, matchTypeFilter, selectedSport]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const completed = allMatches.filter(({ match }) => match.status === MatchStatus.COMPLETED);
    const upcoming = allMatches.filter(({ match }) =>
      new Date(match.schedule.matchStart) > now &&
      match.status !== MatchStatus.CANCELLED &&
      match.status !== MatchStatus.COMPLETED
    );

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let goals = 0;
    let assists = 0;
    let mvps = 0;
    let totalRating = 0;
    let ratedMatches = 0;

    const lastFiveResults: Array<'W' | 'D' | 'L'> = [];

    completed.forEach(({ match }) => {
      if (!match.players.teams) return;

      const isInTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
      const isInTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);

      if (!isInTeam1 && !isInTeam2) return;

      if (match.score) {
        const team1Score = match.score.team1;
        const team2Score = match.score.team2;

        let result: 'W' | 'D' | 'L';
        if (isInTeam1) {
          if (team1Score > team2Score) { wins++; result = 'W'; }
          else if (team1Score < team2Score) { losses++; result = 'L'; }
          else { draws++; result = 'D'; }
        } else {
          if (team2Score > team1Score) { wins++; result = 'W'; }
          else if (team2Score < team1Score) { losses++; result = 'L'; }
          else { draws++; result = 'D'; }
        }

        if (lastFiveResults.length < 5) {
          lastFiveResults.push(result);
        }

        const playerScorer = match.score.scorers.find(s => s.playerId === playerId);
        if (playerScorer) {
          goals += playerScorer.goals || 0;
          assists += playerScorer.assists || 0;
        }
      }

      if (match.mvp?.playerId === playerId) {
        mvps++;
      }

      const playerRating = match.ratingSummary?.details?.topRated.find(
        r => r.playerId === playerId
      )?.averageRating;

      if (playerRating) {
        totalRating += playerRating;
        ratedMatches++;
      }
    });

    const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0;
    const avgRating = ratedMatches > 0 ? totalRating / ratedMatches : 0;
    const avgGoalsPerMatch = completed.length > 0 ? goals / completed.length : 0;

    let currentStreak = 0;
    let streakType: 'win' | 'loss' | null = null;

    for (const result of lastFiveResults) {
      if (result === 'W') {
        if (streakType === 'win' || streakType === null) {
          streakType = 'win';
          currentStreak++;
        } else {
          break;
        }
      } else if (result === 'L') {
        if (streakType === 'loss' || streakType === null) {
          streakType = 'loss';
          currentStreak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return {
      total: allMatches.length,
      completed: completed.length,
      upcoming: upcoming.length,
      leagueMatches: allMatches.filter(({ match }) => match.type === MatchType.LEAGUE).length,
      friendlyMatches: allMatches.filter(({ match }) => match.type === MatchType.FRIENDLY).length,
      wins,
      losses,
      draws,
      goals,
      assists,
      mvps,
      winRate,
      avgRating,
      avgGoalsPerMatch,
      lastFiveResults,
      currentStreak,
      streakType,
    };
  }, [allMatches, playerId]);

  const loadPendingInvitations = async () => {
    if (!playerId) return;
    try {
      const result = await MatchInvitationService.getPendingInvitations(playerId);
      if (result.success && result.data) {
        setPendingInvitationsCount(result.data.length);
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const loadPerformanceData = async () => {
    if (!playerId) return;

    try {
      const [ratingResult, profileResult, careerResult, insightsResult] = await Promise.all([
        PlayerRatingProfileService.getGlobalProfile(playerId),
        PlayerProfileService.getPlayerProfile(playerId),
        PlayerStatsService.getCareerStats(playerId),
        PlayerRatingProfileService.getRatingInsights(playerId),
      ]);

      if (ratingResult.success && ratingResult.data) {
        setRatingProfile(ratingResult.data);
      }
      if (profileResult.success && profileResult.data) {
        setPlayerProfile(profileResult.data);
      }
      if (careerResult.success && careerResult.data) {
        setCareerStats(careerResult.data);
      }
      if (insightsResult.success && insightsResult.data) {
        setPerformanceInsights(insightsResult.data);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const enrichMatchWithLeague = async (match: IMatch): Promise<MatchWithLeague> => {
    try {
      let fixture: IFixture | null = null;
      let league: ILeague | null = null;

      if (match.type === MatchType.LEAGUE && match.fixtureId) {
        if (fixtureCache.current.has(match.fixtureId)) {
          fixture = fixtureCache.current.get(match.fixtureId)!;
        } else {
          const fixtureResult = await FixtureService.getFixture(match.fixtureId);
          if (fixtureResult.success && fixtureResult.data) {
            fixture = fixtureResult.data;
            fixtureCache.current.set(match.fixtureId, fixture);
          }
        }

        if (fixture && match.leagueId) {
          if (leagueCache.current.has(match.leagueId)) {
            league = leagueCache.current.get(match.leagueId)!;
          } else {
            const leagueResult = await LeagueService.getLeague(match.leagueId);
            if (leagueResult.success && leagueResult.data) {
              league = leagueResult.data;
              leagueCache.current.set(match.leagueId, league);
            }
          }
        }
      } else if (match.type === MatchType.FRIENDLY && match.linkedLeagueId) {
        if (leagueCache.current.has(match.linkedLeagueId)) {
          league = leagueCache.current.get(match.linkedLeagueId)!;
        } else {
          const leagueResult = await LeagueService.getLeague(match.linkedLeagueId);
          if (leagueResult.success && leagueResult.data) {
            league = leagueResult.data;
            leagueCache.current.set(match.linkedLeagueId, league);
          }
        }
      }

      return { match, league, fixture };
    } catch (error) {
      console.error(`Error enriching match ${match.id}:`, error);
      return { match, league: null, fixture: null };
    }
  };

  const resetAndLoad = useCallback(async () => {
    setAllMatches([]);
    setDisplayedMatches([]);
    setLastUpcomingDoc(null);
    setLastHistoryDoc(null);
    setHasMore(true);
    fixtureCache.current.clear();
    leagueCache.current.clear();
    await loadData(true);
  }, [playerId]);

  const loadData = useCallback(async (reset: boolean = false) => {
    console.log("playerId:", playerId)
    if (!playerId) {
      Alert.alert('Hata', 'Oyuncu ID bulunamadı');
      goBack();
      return;
    }

    if (loadingMore && !reset) return;
    if (!hasMore && !reset) return;

    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // ✅ Upcoming ve History'yi paralel yükle
      const [upcomingResult, historyResult] = await Promise.all([
        MatchService.getPlayerUpcomingMatchesPaginated(
          playerId,
          PAGE_SIZE,
          reset ? undefined : lastUpcomingDoc
        ),
        MatchService.getPlayerMatchHistoryPaginated(
          playerId,
          PAGE_SIZE,
          reset ? undefined : lastHistoryDoc
        ),
      ]);

      const upcomingMatches = upcomingResult.success && upcomingResult.data
        ? upcomingResult.data.data
        : [];
      const historyMatches = historyResult.success && historyResult.data
        ? historyResult.data.data
        : [];

      const newUpcomingDoc = upcomingResult.success && upcomingResult.data
        ? upcomingResult.data.lastDoc
        : null;
      const newHistoryDoc = historyResult.success && historyResult.data
        ? historyResult.data.lastDoc
        : null;

      const upcomingHasMore = upcomingResult.success && upcomingResult.data
        ? upcomingResult.data.hasMore
        : false;
      const historyHasMore = historyResult.success && historyResult.data
        ? historyResult.data.hasMore
        : false;

      const allMatchesRaw = [...upcomingMatches, ...historyMatches];

      if (allMatchesRaw.length === 0 && reset) {
        setAllMatches([]);
        setDisplayedMatches([]);
        setHasMore(false);
        return;
      }

      // ✅ Enrich matches
      const enrichedMatches = await Promise.all(
        allMatchesRaw.map(enrichMatchWithLeague)
      );

      // ✅ Update state
      if (reset) {
        setAllMatches(enrichedMatches);
        setDisplayedMatches(enrichedMatches.slice(0, INITIAL_LOAD_SIZE));
        setHasMore(enrichedMatches.length > INITIAL_LOAD_SIZE || upcomingHasMore || historyHasMore);
      } else {
        const newAllMatches = [...allMatches, ...enrichedMatches];
        setAllMatches(newAllMatches);
        const filtered = getFilteredMatches();
        const currentLength = displayedMatches.length;
        const nextBatch = filtered.slice(currentLength, currentLength + PAGE_SIZE);
        setDisplayedMatches([...displayedMatches, ...nextBatch]);
        setHasMore(
          filtered.length > currentLength + PAGE_SIZE ||
          upcomingHasMore ||
          historyHasMore
        );
      }

      setLastUpcomingDoc(newUpcomingDoc);
      setLastHistoryDoc(newHistoryDoc);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Hata', 'Maçlar yüklenirken bir hata oluştu');
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [
    playerId,
    lastUpcomingDoc,
    lastHistoryDoc,
    hasMore,
    loadingMore,
    allMatches,
    displayedMatches,
    getFilteredMatches,
  ]);

  const loadMoreMatches = useCallback(() => {
    if (loadingMore || !hasMore) return;

    const filtered = getFilteredMatches();
    const currentLength = displayedMatches.length;

    // Check if we need to load from API
    if (currentLength >= allMatches.length && (lastUpcomingDoc || lastHistoryDoc)) {
      loadData(false);
    } else {
      // Load from already fetched data
      setLoadingMore(true);
      setTimeout(() => {
        const nextBatch = filtered.slice(currentLength, currentLength + PAGE_SIZE);
        if (nextBatch.length > 0) {
          setDisplayedMatches([...displayedMatches, ...nextBatch]);
          setHasMore(
            currentLength + nextBatch.length < filtered.length ||
            !!lastUpcomingDoc ||
            !!lastHistoryDoc
          );
        } else {
          setHasMore(false);
        }
        setLoadingMore(false);
      }, 300);
    }
  }, [
    loadingMore,
    hasMore,
    displayedMatches,
    allMatches,
    lastUpcomingDoc,
    lastHistoryDoc,
    getFilteredMatches,
    loadData,
  ]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      resetAndLoad(),
      loadPendingInvitations(),
      loadPerformanceData(),
    ]);
    setRefreshing(false);
  }, [resetAndLoad]);

  const handleViewInvitations = () => {
    Alert.alert('Davetler', 'Davetler ekranı yakında eklenecek');
  };

  const handleCreateFriendlyMatch = () => {
    MatchNavigationService.navigateToCreateFriendlyMatch();
  };

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const renderPerformanceDashboard = () => {
    if (!ratingProfile && !playerProfile) return null;

    return (
      <View style={styles.dashboardContainer}>
        {/* Rating Overview */}
        {ratingProfile && (
          <View style={styles.ratingOverview}>
            <View style={styles.ratingMainCard}>
              <View style={styles.ratingHeader}>
                <Star size={24} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
                <Text style={styles.ratingTitle}>Genel Rating</Text>
              </View>
              <Text style={styles.ratingValue}>
                {ratingProfile.overall.overallRating.toFixed(1)}
              </Text>
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>
                  {PlayerRatingProfileService.getRatingBadge(ratingProfile.overall.overallRating).icon}
                  {' '}
                  {PlayerRatingProfileService.getRatingBadge(ratingProfile.overall.overallRating).name}
                </Text>
              </View>

              {/* Trend Indicator */}
              <View style={[
                styles.trendIndicator,
                ratingProfile.ratingTrend === 'improving' && styles.trendImproving,
                ratingProfile.ratingTrend === 'declining' && styles.trendDeclining,
              ]}>
                {ratingProfile.ratingTrend === 'improving' && (
                  <TrendingUp size={16} color="#10B981" strokeWidth={2.5} />
                )}
                {ratingProfile.ratingTrend === 'declining' && (
                  <TrendingDown size={16} color="#EF4444" strokeWidth={2.5} />
                )}
                {ratingProfile.ratingTrend === 'stable' && (
                  <Activity size={16} color="#3B82F6" strokeWidth={2.5} />
                )}
                <Text style={[
                  styles.trendText,
                  ratingProfile.ratingTrend === 'improving' && { color: '#10B981' },
                  ratingProfile.ratingTrend === 'declining' && { color: '#EF4444' },
                  ratingProfile.ratingTrend === 'stable' && { color: '#3B82F6' },
                ]}>
                  {PlayerRatingProfileService.getTrendDescription(ratingProfile.ratingTrend).label}
                </Text>
              </View>
            </View>

            {/* Rating Breakdown */}
            {ratingProfile.categoryAverages && (
              <View style={styles.categoryBreakdown}>
                <Text style={styles.categoryTitle}>Kategori Puanları</Text>
                <View style={styles.categoryGrid}>
                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryLabel}>Beceri</Text>
                    <Text style={styles.categoryValue}>
                      {ratingProfile.categoryAverages.skill.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryLabel}>Takım Oyunu</Text>
                    <Text style={styles.categoryValue}>
                      {ratingProfile.categoryAverages.teamwork.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryLabel}>Sportmenlik</Text>
                    <Text style={styles.categoryValue}>
                      {ratingProfile.categoryAverages.sportsmanship.toFixed(1)}
                    </Text>
                  </View>
                  <View style={styles.categoryItem}>
                    <Text style={styles.categoryLabel}>Çaba</Text>
                    <Text style={styles.categoryValue}>
                      {ratingProfile.categoryAverages.effort.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Form Chart */}
        {stats.lastFiveResults.length > 0 && (
          <View style={styles.formChart}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Son Form</Text>
              {stats.currentStreak > 1 && (
                <View style={[
                  styles.streakBadge,
                  stats.streakType === 'win' ? styles.streakBadgeWin : styles.streakBadgeLoss,
                ]}>
                  <Flame size={14} color="white" strokeWidth={2} />
                  <Text style={styles.streakText}>
                    {stats.currentStreak} {stats.streakType === 'win' ? 'Galibiyet' : 'Mağlubiyet'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.formBadges}>
              {stats.lastFiveResults.map((result, index) => (
                <View
                  key={index}
                  style={[
                    styles.formBadge,
                    result === 'W' && styles.formBadgeWin,
                    result === 'D' && styles.formBadgeDraw,
                    result === 'L' && styles.formBadgeLoss,
                  ]}
                >
                  <Text style={styles.formBadgeText}>{result}</Text>
                </View>
              ))}
              {Array.from({ length: 5 - stats.lastFiveResults.length }).map((_, index) => (
                <View key={`empty-${index}`} style={styles.formBadgeEmpty}>
                  <Text style={styles.formBadgeTextEmpty}>-</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Performance Insights */}
        {performanceInsights && (
          <View style={styles.insightsContainer}>
            {performanceInsights.strengths.length > 0 && (
              <View style={styles.insightSection}>
                <View style={styles.insightHeader}>
                  <CheckCircle2 size={18} color="#10B981" strokeWidth={2} />
                  <Text style={styles.insightTitle}>Güçlü Yönler</Text>
                </View>
                {performanceInsights.strengths.slice(0, 2).map((strength: string, index: number) => (
                  <View key={index} style={styles.insightItem}>
                    <Text style={styles.insightBullet}>•</Text>
                    <Text style={styles.insightText}>{strength}</Text>
                  </View>
                ))}
              </View>
            )}

            {performanceInsights.improvements.length > 0 && (
              <View style={styles.insightSection}>
                <View style={styles.insightHeader}>
                  <TrendingUp size={18} color="#3B82F6" strokeWidth={2} />
                  <Text style={styles.insightTitle}>Gelişim Alanları</Text>
                </View>
                {performanceInsights.improvements.slice(0, 2).map((improvement: string, index: number) => (
                  <View key={index} style={styles.insightItem}>
                    <Text style={styles.insightBullet}>•</Text>
                    <Text style={styles.insightText}>{improvement}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Achievements */}
        {playerProfile?.achievements && playerProfile.achievements.length > 0 && (
          <View style={styles.achievementsShowcase}>
            <Text style={styles.achievementsTitle}>Başarılar</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {playerProfile.achievements.slice(0, 5).map((achievement: any) => (
                <View key={achievement.id} style={styles.achievementCard}>
                  <Text style={styles.achievementIcon}>🏆</Text>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  const renderMatchCard = ({ item }: { item: MatchWithLeague }) => {
    const { match, league, fixture } = item;

    return (<MatchCard
      match={match}
      league={league}
      fixture={fixture}
      sportColor={sportThemes[match.sportType || league?.sportType || 'football'].primary}
      onPress={() => MatchNavigationService.navigateToMatchRegistration(match.id!)}
      playerId={playerProfile?.id || null}
      viewMode={viewMode}
    />);
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#16a34a" />
        <Text style={styles.footerLoaderText}>Yükleniyor...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Calendar size={64} color="#D1D5DB" strokeWidth={1.5} />
        <Text style={styles.emptyTitle}>Maç bulunamadı</Text>
        <Text style={styles.emptyText}>
          {searchQuery ? 'Arama kriterlerinize uygun maç bulunamadı' : 'Henüz hiç maç oynamadınız'}
        </Text>
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={handleCreateFriendlyMatch}
          activeOpacity={0.8}
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
          <Text style={styles.emptyActionButtonText}>Dostluk Maçı Oluştur</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderListHeader = () => (
    <>
      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Maç ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
              <X size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.7}
        >
          <Filter size={20} color={showFilters ? '#16a34a' : '#6B7280'} strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewModeButton}
          onPress={() => setViewMode(viewMode === 'list' ? 'compact' : 'list')}
          activeOpacity={0.7}
        >
          <BarChart3 size={20} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[styles.matchTypeChip, matchTypeFilter === 'all' && styles.matchTypeChipActive]}
              onPress={() => setMatchTypeFilter('all')}
              activeOpacity={0.7}
            >
              <Globe size={16} color={matchTypeFilter === 'all' ? '#16a34a' : '#6B7280'} />
              <Text style={[styles.matchTypeText, matchTypeFilter === 'all' && styles.matchTypeTextActive]}>
                Tümü ({stats.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'league' && { backgroundColor: '#3B82F6' + '20', borderColor: '#3B82F6' }
              ]}
              onPress={() => setMatchTypeFilter('league')}
              activeOpacity={0.7}
            >
              <Trophy size={16} color={matchTypeFilter === 'league' ? '#3B82F6' : '#6B7280'} />
              <Text style={[
                styles.matchTypeText,
                matchTypeFilter === 'league' && { color: '#3B82F6', fontWeight: '700' }
              ]}>
                Lig ({stats.leagueMatches})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'friendly' && { backgroundColor: '#10B981' + '20', borderColor: '#10B981' }
              ]}
              onPress={() => setMatchTypeFilter('friendly')}
              activeOpacity={0.7}
            >
              <Users size={16} color={matchTypeFilter === 'friendly' ? '#10B981' : '#6B7280'} />
              <Text style={[
                styles.matchTypeText,
                matchTypeFilter === 'friendly' && { color: '#10B981', fontWeight: '700' }
              ]}>
                Dostluk ({stats.friendlyMatches})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
              onPress={() => setFilterType('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
                🌐 Tümü
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterType === 'completed' && styles.filterChipActive]}
              onPress={() => setFilterType('completed')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterType === 'completed' && styles.filterChipTextActive]}>
                🏁 Tamamlanan ({stats.completed})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterChip, filterType === 'upcoming' && styles.filterChipActive]}
              onPress={() => setFilterType('upcoming')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterType === 'upcoming' && styles.filterChipTextActive]}>
                📅 Yaklaşan ({stats.upcoming})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Invitations Banner */}
      {pendingInvitationsCount > 0 && (
        <TouchableOpacity style={styles.invitationBanner} onPress={handleViewInvitations} activeOpacity={0.7}>
          <View style={styles.invitationBannerLeft}>
            <Users size={20} color="#10B981" strokeWidth={2} />
            <View style={styles.invitationBannerText}>
              <Text style={styles.invitationBannerTitle}>{pendingInvitationsCount} Davet Bekliyor</Text>
              <Text style={styles.invitationBannerSubtitle}>Dostluk maçı davetlerini görüntüle</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#10B981" strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Performance Dashboard */}
      {renderPerformanceDashboard()}

      {/* Quick Stats */}
      <View style={styles.quickStatsContainer}>
        <View style={styles.quickStatCard}>
          <Trophy size={20} color="#16a34a" strokeWidth={2} />
          <Text style={styles.quickStatValue}>{stats.wins}</Text>
          <Text style={styles.quickStatLabel}>Galibiyet</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Target size={20} color="#EF4444" strokeWidth={2} />
          <Text style={styles.quickStatValue}>{stats.goals}</Text>
          <Text style={styles.quickStatLabel}>Gol</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Crown size={20} color="#F59E0B" strokeWidth={2} />
          <Text style={styles.quickStatValue}>{stats.mvps}</Text>
          <Text style={styles.quickStatLabel}>MVP</Text>
        </View>
        <View style={styles.quickStatCard}>
          <Zap size={20} color="#8B5CF6" strokeWidth={2} />
          <Text style={styles.quickStatValue}>{stats.winRate.toFixed(0)}%</Text>
          <Text style={styles.quickStatLabel}>Kazanma</Text>
        </View>
      </View>

      {/* Matches Header */}
      <View style={styles.matchesHeader}>
        <Text style={styles.matchesTitle}>Maçlarım</Text>
        <Text style={styles.matchesCount}>
          {displayedMatches.length} / {getFilteredMatches().length} maç
        </Text>
      </View>
    </>
  );

  const renderHeader = () => (
    <CustomHeader
      title="Performans Paneli"
      subtitle={`${stats.total} Maç • ${stats.avgRating.toFixed(1)} ⭐`}
      showMenu={true}
    />

  );

  if (loading) {
    return (
      <LoadingScreen
        header={renderHeader()}
        loadingText='Maçlar Yükleniyor'
        visibleHeader={true}
      />
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <FlatList
        data={displayedMatches}
        keyExtractor={(item) => item.match.id!}
        renderItem={renderMatchCard}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={loadMoreMatches}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  flatListContent: {
    paddingBottom: 32,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersSection: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  matchTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  matchTypeChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16a34a',
  },
  matchTypeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  matchTypeTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16a34a',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  invitationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  invitationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  invitationBannerText: {
    flex: 1,
  },
  invitationBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 2,
  },
  invitationBannerSubtitle: {
    fontSize: 12,
    color: '#15803d',
  },

  // Performance Dashboard
  dashboardContainer: {
    padding: 16,
    gap: 16,
  },
  ratingOverview: {
    gap: 12,
  },
  ratingMainCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  ratingValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#16a34a',
    marginBottom: 8,
  },
  ratingBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  trendImproving: {
    backgroundColor: '#DCFCE7',
  },
  trendDeclining: {
    backgroundColor: '#FEE2E2',
  },
  trendText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryBreakdown: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  formChart: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  streakBadgeWin: {
    backgroundColor: '#10B981',
  },
  streakBadgeLoss: {
    backgroundColor: '#EF4444',
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  formBadges: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  formBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  formBadgeWin: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  formBadgeDraw: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  formBadgeLoss: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  formBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  formBadgeEmpty: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  formBadgeTextEmpty: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D1D5DB',
  },
  insightsContainer: {
    gap: 12,
  },
  insightSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  insightItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  insightBullet: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '700',
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  achievementsShowcase: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  achievementsScroll: {
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  achievementIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  matchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  matchesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  matchesCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },



  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});