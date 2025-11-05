// src/screens/Match/MyMatchesScreen.tsx
// 🎯 PERSONAL PERFORMANCE DASHBOARD - Enhanced Stats & Analytics

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
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
  Lock,
  Mail,
  Plus,
  Star,
  Flame,
  Activity,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';
import {
  IMatch,
  ILeague,
  IFixture,
  SportType,
  MatchType,
  MatchStatus,
  SPORT_CONFIGS,
} from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { MatchInvitationService } from '../../services/serviceLayer/matchInvitationService';
import { PlayerRatingProfileService } from '../../services/serviceLayer/playerRatingProfileService';
import { PlayerProfileService } from '../../services/serviceLayer/playerProfileService';
import { PlayerStatsService } from '../../services/serviceLayer/playerStatsService';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';

interface MatchWithLeague {
  match: IMatch;
  league: ILeague | null;
  fixture: IFixture | null;
}

type FilterType = 'all' | 'completed' | 'upcoming' | 'cancelled';
type MatchTypeFilter = 'all' | 'league' | 'friendly';
type ViewMode = 'list' | 'compact';

export const MyMatchesScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAuth();
  const playerId = route.params?.playerId || user?.id;

  const [matches, setMatches] = useState<MatchWithLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Event listeners
  useEffect(() => {
    const unsubscribeUpdate = eventManager.on(Events.MATCH_UPDATED, loadMatches);
    const unsubscribeRegister = eventManager.on(Events.MATCH_REGISTERED, loadMatches);
    const unsubscribeUnregister = eventManager.on(Events.MATCH_UNREGISTERED, loadMatches);
    const unsubscribeScore = eventManager.on(Events.SCORE_UPDATED, loadMatches);

    return () => {
      unsubscribeUpdate();
      unsubscribeRegister();
      unsubscribeUnregister();
      unsubscribeScore();
    };
  }, []);

  useEffect(() => {
    if (playerId) {
      loadMatches();
      loadPendingInvitations();
      loadPerformanceData();
    }
  }, [playerId]);

  // Available sports
  const availableSports = useMemo(() => {
    const sports = new Set<SportType>();
    matches.forEach(({ match, league }) => {
      if (match.sportType) {
        sports.add(match.sportType);
      } else if (league) {
        sports.add(league.sportType);
      }
    });
    return Array.from(sports);
  }, [matches]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let filtered = matches;
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
  }, [matches, searchQuery, filterType, matchTypeFilter, selectedSport]);

  // Enhanced Statistics with Performance Data
  // Enhanced Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const completed = matches.filter(({ match }) => match.status === MatchStatus.COMPLETED);
    const upcoming = matches.filter(({ match }) =>
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

      // Win/Loss/Draw
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

        // ✅ Goals & Assists from score.scorers
        const playerScorer = match.score.scorers.find(s => s.playerId === playerId);
        if (playerScorer) {
          goals += playerScorer.goals || 0;
          assists += playerScorer.assists || 0;
        }
      }

      // ✅ MVPs
      if (match.mvp?.playerId === playerId) {
        mvps++;
      }

      // ✅ Rating from ratingSummary
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

    // Calculate streak
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
      total: matches.length,
      completed: completed.length,
      upcoming: upcoming.length,
      leagueMatches: matches.filter(({ match }) => match.type === MatchType.LEAGUE).length,
      friendlyMatches: matches.filter(({ match }) => match.type === MatchType.FRIENDLY).length,
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
  }, [matches, playerId]);

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
      // Load rating profile
      const ratingResult = await PlayerRatingProfileService.getGlobalProfile(playerId);
      if (ratingResult.success && ratingResult.data) {
        setRatingProfile(ratingResult.data);
      }

      // Load player profile
      const profileResult = await PlayerProfileService.getPlayerProfile(playerId);
      if (profileResult.success && profileResult.data) {
        setPlayerProfile(profileResult.data);
      }

      // Load career stats
      const careerResult = await PlayerStatsService.getCareerStats(playerId);
      if (careerResult.success && careerResult.data) {
        setCareerStats(careerResult.data);
      }

      // Load performance insights
      const insightsResult = await PlayerRatingProfileService.getRatingInsights(playerId);
      if (insightsResult.success && insightsResult.data) {
        setPerformanceInsights(insightsResult.data);
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    }
  };

  const loadMatches = useCallback(async () => {
    if (!playerId) {
      Alert.alert('Hata', 'Oyuncu ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      const upcomingResult = await MatchService.getPlayerUpcomingMatches(playerId, 50);
      const upcomingMatches = upcomingResult.success && upcomingResult.data ? upcomingResult.data : [];

      const historyResult = await MatchService.getPlayerMatchHistory(playerId, 50);
      const historyMatches = historyResult.success && historyResult.data ? historyResult.data : [];

      const allMatches = [...upcomingMatches, ...historyMatches];

      if (allMatches.length === 0) {
        setMatches([]);
        return;
      }

      const fixtureCache = new Map<string, IFixture>();
      const leagueCache = new Map<string, ILeague>();

      const matchesWithLeagues: MatchWithLeague[] = await Promise.all(
        allMatches.map(async (match) => {
          try {
            let fixture: IFixture | null = null;
            let league: ILeague | null = null;

            if (match.type === MatchType.LEAGUE && match.fixtureId) {
              if (fixtureCache.has(match.fixtureId)) {
                fixture = fixtureCache.get(match.fixtureId)!;
              } else {
                const fixtureResult = await FixtureService.getFixture(match.fixtureId);
                if (fixtureResult.success && fixtureResult.data) {
                  fixture = fixtureResult.data;
                  fixtureCache.set(match.fixtureId, fixture);
                }
              }

              if (fixture && match.leagueId) {
                if (leagueCache.has(match.leagueId)) {
                  league = leagueCache.get(match.leagueId)!;
                } else {
                  const leagueResult = await LeagueService.getLeague(match.leagueId);
                  if (leagueResult.success && leagueResult.data) {
                    league = leagueResult.data;
                    leagueCache.set(match.leagueId, league);
                  }
                }
              }
            } else if (match.type === MatchType.FRIENDLY && match.linkedLeagueId) {
              if (leagueCache.has(match.linkedLeagueId)) {
                league = leagueCache.get(match.linkedLeagueId)!;
              } else {
                const leagueResult = await LeagueService.getLeague(match.linkedLeagueId);
                if (leagueResult.success && leagueResult.data) {
                  league = leagueResult.data;
                  leagueCache.set(match.linkedLeagueId, league);
                }
              }
            }

            return { match, league, fixture };
          } catch (error) {
            console.error(`Error loading league for match ${match.id}:`, error);
            return { match, league: null, fixture: null };
          }
        })
      );

      setMatches(matchesWithLeagues);
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Hata', 'Maçlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadMatches(),
      loadPendingInvitations(),
      loadPerformanceData(),
    ]);
    setRefreshing(false);
  }, [loadMatches]);

  const handleMatchPress = useCallback((matchId: string) => {
    NavigationService.navigateToMatch(matchId);
  }, []);

  const handleViewInvitations = () => {
    NavigationService.navigateToFriendlyMatchInvitations();
  };

  const handleCreateFriendlyMatch = () => {
    NavigationService.navigateToCreateFriendlyMatch();
  };

  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const formatTime = useCallback((date: Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getResultBadge = (match: IMatch) => {
    if (!match.players.teams || !match.score) return null;

    const isInTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
    const isInTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);

    if (!isInTeam1 && !isInTeam2) return null;

    const team1Score = match.score.team1;
    const team2Score = match.score.team2;

    let result: 'win' | 'draw' | 'loss';
    if (isInTeam1) {
      if (team1Score > team2Score) result = 'win';
      else if (team1Score < team2Score) result = 'loss';
      else result = 'draw';
    } else {
      if (team2Score > team1Score) result = 'win';
      else if (team2Score < team1Score) result = 'loss';
      else result = 'draw';
    }

    return result;
  };

  const getMatchStatusColor = useCallback((status: MatchStatus): string => {
    switch (status) {
      case MatchStatus.CREATED: return '#9CA3AF';
      case MatchStatus.REGISTRATION_OPEN: return '#10B981';
      case MatchStatus.REGISTRATION_CLOSED: return '#F59E0B';
      case MatchStatus.TEAMS_SET: return '#2563EB';
      case MatchStatus.IN_PROGRESS: return '#8B5CF6';
      case MatchStatus.AWAITING_SCORE: return '#F59E0B';
      case MatchStatus.COMPLETED: return '#16a34a';
      case MatchStatus.CANCELLED: return '#DC2626';
      default: return '#6B7280';
    }
  }, []);

  const getMatchStatusText = useCallback((status: MatchStatus): string => {
    switch (status) {
      case MatchStatus.CREATED: return 'Oluşturuldu';
      case MatchStatus.REGISTRATION_OPEN: return 'Kayıt Açık';
      case MatchStatus.REGISTRATION_CLOSED: return 'Kayıt Kapandı';
      case MatchStatus.TEAMS_SET: return 'Takımlar Kuruldu';
      case MatchStatus.IN_PROGRESS: return 'Oynanıyor';
      case MatchStatus.AWAITING_SCORE: return 'Skor Bekleniyor';
      case MatchStatus.COMPLETED: return 'Tamamlandı';
      case MatchStatus.CANCELLED: return 'İptal';
      default: return status;
    }
  }, []);

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

        {/* Form Chart - Last 5 Matches */}
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
            {/* Strengths */}
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

            {/* Improvements */}
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

        {/* Achievements Showcase */}
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

  const renderMatchCard = (item: MatchWithLeague) => {
    const { match, league } = item;
    const result = match.status === MatchStatus.COMPLETED ? getResultBadge(match) : null;

    // ✅ Player stats from score.scorers
    const playerScorer = match.score?.scorers.find(s => s.playerId === playerId);
    const goals = playerScorer?.goals || 0;
    const assists = playerScorer?.assists || 0;

    // ✅ MVP check
    const isMVP = match.mvp?.playerId === playerId;

    // ✅ Player rating from ratingSummary
    const playerRating = match.ratingSummary?.details?.topRated.find(
      r => r.playerId === playerId
    )?.averageRating;

    const isPast = new Date(match.schedule.matchStart) < new Date() || match.status === MatchStatus.COMPLETED;
    const isFriendly = match.type === MatchType.FRIENDLY;

    const matchSportType = match.sportType || league?.sportType;
    const matchSportColor = matchSportType ? SPORT_CONFIGS[matchSportType].color : '#16a34a';

    // Compact View
    if (viewMode === 'compact') {
      return (
        <TouchableOpacity
          key={match.id}
          style={[
            styles.compactCard,
            isPast && styles.compactCardPast,
          ]}
          onPress={() => handleMatchPress(match.id!)}
          activeOpacity={0.7}
        >
          <View style={styles.compactLeft}>
            {matchSportType && (
              <View style={[
                styles.compactSportIcon,
                { backgroundColor: matchSportColor + '15' }
              ]}>
                <Text style={styles.compactSportEmoji}>{SPORT_CONFIGS[matchSportType].emoji}</Text>
              </View>
            )}
            <View style={styles.compactInfo}>
              <View style={styles.compactTitleRow}>
                <Text style={styles.compactTitle} numberOfLines={1}>{match.title}</Text>
                {isFriendly && (
                  <View style={styles.compactFriendlyBadge}>
                    <Users size={10} color="#10B981" strokeWidth={2} />
                  </View>
                )}
              </View>
              <Text style={styles.compactDate}>{formatDate(match.schedule.matchStart)}</Text>
            </View>
          </View>
          <View style={styles.compactRight}>
            {result && (
              <View
                style={[
                  styles.compactResultBadge,
                  result === 'win' && styles.resultBadgeWin,
                  result === 'draw' && styles.resultBadgeDraw,
                  result === 'loss' && styles.resultBadgeLoss,
                ]}
              >
                <Text style={styles.compactResultText}>
                  {result === 'win' ? 'G' : result === 'draw' ? 'B' : 'M'}
                </Text>
              </View>
            )}
            <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
          </View>
        </TouchableOpacity>
      );
    }

    // List View - same as before but simplified for space
    return (
      <TouchableOpacity
        key={match.id}
        style={[styles.matchCard, isPast && styles.matchCardPast]}
        onPress={() => handleMatchPress(match.id!)}
        activeOpacity={0.7}
      >
        <View style={styles.matchTypeHeaderBadge}>
          {isFriendly ? (
            <View style={[styles.matchTypeBadge, { backgroundColor: '#10B981' + '20' }]}>
              <Users size={12} color="#10B981" strokeWidth={2} />
              <Text style={[styles.matchTypeBadgeText, { color: '#10B981' }]}>Dostluk</Text>
            </View>
          ) : (
            <View style={[styles.matchTypeBadge, { backgroundColor: '#3B82F6' + '20' }]}>
              <Trophy size={12} color="#3B82F6" strokeWidth={2} />
              <Text style={[styles.matchTypeBadgeText, { color: '#3B82F6' }]}>Lig</Text>
            </View>
          )}

          {result && (
            <View
              style={[
                styles.resultBadge,
                result === 'win' && styles.resultBadgeWin,
                result === 'draw' && styles.resultBadgeDraw,
                result === 'loss' && styles.resultBadgeLoss,
              ]}
            >
              {result === 'win' && <CheckCircle2 size={14} color="white" strokeWidth={2.5} />}
              {result === 'draw' && <Minus size={14} color="white" strokeWidth={2.5} />}
              {result === 'loss' && <XCircle size={14} color="white" strokeWidth={2.5} />}
              <Text style={styles.resultBadgeText}>
                {result === 'win' ? 'G' : result === 'draw' ? 'B' : 'M'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.matchHeader}>
          <View style={styles.matchHeaderLeft}>
            {matchSportType && (
              <View style={[
                styles.sportIconContainer,
                { backgroundColor: matchSportColor + '15' }
              ]}>
                <Text style={styles.matchSportEmoji}>{SPORT_CONFIGS[matchSportType].emoji}</Text>
              </View>
            )}
            <View style={styles.matchHeaderInfo}>
              <Text style={styles.matchTitle} numberOfLines={1}>{match.title}</Text>
              <Text style={styles.matchLeague} numberOfLines={1}>
                {league?.title || (isFriendly ? 'Dostluk Maçı' : 'Lig bilgisi yok')}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        </View>

        <View style={styles.matchInfo}>
          <View style={styles.matchInfoItem}>
            <Calendar size={14} color="#6B7280" strokeWidth={2} />
            <Text style={styles.matchInfoText}>{formatDate(match.schedule.matchStart)}</Text>
            <View style={styles.infoSeparator} />
            <Clock size={14} color="#6B7280" strokeWidth={2} />
            <Text style={styles.matchInfoText}>{formatTime(match.schedule.matchStart)}</Text>
          </View>
          {match.venue?.location && (
            <View style={styles.matchInfoItem}>
              <MapPin size={14} color="#6B7280" strokeWidth={2} />
              <Text style={styles.matchInfoText} numberOfLines={1}>{match.venue.location}</Text>
            </View>
          )}
        </View>

        {match.status === MatchStatus.COMPLETED && match.score && (
          <View style={styles.matchScore}>
            <View style={styles.scoreTeam}>
              <Text style={styles.scoreLabel}>Takım 1</Text>
              <Text style={styles.scoreValue}>{match.score.team1}</Text>
            </View>
            <View style={styles.scoreDivider}>
              <Text style={styles.scoreDividerText}>vs</Text>
            </View>
            <View style={styles.scoreTeam}>
              <Text style={styles.scoreLabel}>Takım 2</Text>
              <Text style={styles.scoreValue}>{match.score.team2}</Text>
            </View>
          </View>
        )}

        {/* Player Performance */}
        {match.status === MatchStatus.COMPLETED && (goals > 0 || assists > 0 || playerRating || isMVP) && (
          <View style={styles.playerPerformance}>
            <View style={styles.performanceStats}>
              {/* Goals */}
              {goals > 0 && (
                <View style={styles.performanceBadge}>
                  <Target size={12} color="#EF4444" strokeWidth={2} />
                  <Text style={styles.performanceText}>{goals} Gol</Text>
                </View>
              )}

              {/* Assists */}
              {assists > 0 && (
                <View style={styles.performanceBadge}>
                  <Users size={12} color="#10B981" strokeWidth={2} />
                  <Text style={styles.performanceText}>{assists} Asist</Text>
                </View>
              )}

              {/* Rating */}
              {playerRating && (
                <View style={styles.performanceBadge}>
                  <Award size={12} color="#F59E0B" strokeWidth={2} />
                  <Text style={styles.performanceText}>
                    {playerRating.toFixed(1)} ⭐
                  </Text>
                </View>
              )}
            </View>

            {/* MVP Badge */}
            {isMVP && (
              <View style={styles.mvpBadge}>
                <Crown size={14} color="#F59E0B" strokeWidth={2.5} />
                <Text style={styles.mvpText}>MVP</Text>
              </View>
            )}
          </View>
        )}

        {match.status !== MatchStatus.COMPLETED && (
          <View style={styles.matchStatus}>
            <View style={[styles.statusBadge, { backgroundColor: getMatchStatusColor(match.status) + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: getMatchStatusColor(match.status) }]} />
              <Text style={[styles.statusText, { color: getMatchStatusColor(match.status) }]}>
                {getMatchStatusText(match.status)}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.matchFooter}>
          <Text style={styles.viewDetails}>Detayları Gör</Text>
          <ChevronRight size={16} color="#16a34a" strokeWidth={2} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Performans Paneli"
        subtitle={`${stats.total} Maç • ${stats.avgRating.toFixed(1)} ⭐`}
        showMenu={true}
      />

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

      {showFilters && (
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filtersContent}>
            <TouchableOpacity style={[styles.matchTypeChip, matchTypeFilter === 'all' && styles.matchTypeChipActive]} onPress={() => setMatchTypeFilter('all')} activeOpacity={0.7}>
              <Globe size={16} color={matchTypeFilter === 'all' ? '#16a34a' : '#6B7280'} />
              <Text style={[styles.matchTypeText, matchTypeFilter === 'all' && styles.matchTypeTextActive]}>Tümü ({stats.total})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.matchTypeChip, matchTypeFilter === 'league' && { ...styles.matchTypeChipActive, backgroundColor: '#3B82F6' + '20', borderColor: '#3B82F6' }]} onPress={() => setMatchTypeFilter('league')} activeOpacity={0.7}>
              <Trophy size={16} color={matchTypeFilter === 'league' ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.matchTypeText, matchTypeFilter === 'league' && { ...styles.matchTypeTextActive, color: '#3B82F6' }]}>Lig ({stats.leagueMatches})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.matchTypeChip, matchTypeFilter === 'friendly' && { ...styles.matchTypeChipActive, backgroundColor: '#10B981' + '20', borderColor: '#10B981' }]} onPress={() => setMatchTypeFilter('friendly')} activeOpacity={0.7}>
              <Users size={16} color={matchTypeFilter === 'friendly' ? '#10B981' : '#6B7280'} />
              <Text style={[styles.matchTypeText, matchTypeFilter === 'friendly' && { ...styles.matchTypeTextActive, color: '#10B981' }]}>Dostluk ({stats.friendlyMatches})</Text>
            </TouchableOpacity>
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filtersContent}>
            <TouchableOpacity style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]} onPress={() => setFilterType('all')} activeOpacity={0.7}>
              <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>🌐 Tümü</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, filterType === 'completed' && styles.filterChipActive]} onPress={() => setFilterType('completed')} activeOpacity={0.7}>
              <Text style={[styles.filterChipText, filterType === 'completed' && styles.filterChipTextActive]}>🏁 Tamamlanan ({stats.completed})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.filterChip, filterType === 'upcoming' && styles.filterChipActive]} onPress={() => setFilterType('upcoming')} activeOpacity={0.7}>
              <Text style={[styles.filterChipText, filterType === 'upcoming' && styles.filterChipTextActive]}>📅 Yaklaşan ({stats.upcoming})</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {pendingInvitationsCount > 0 && (
        <TouchableOpacity style={styles.invitationBanner} onPress={handleViewInvitations} activeOpacity={0.7}>
          <View style={styles.invitationBannerLeft}>
            <Mail size={20} color="#10B981" strokeWidth={2} />
            <View style={styles.invitationBannerText}>
              <Text style={styles.invitationBannerTitle}>{pendingInvitationsCount} Davet Bekliyor</Text>
              <Text style={styles.invitationBannerSubtitle}>Dostluk maçı davetlerini görüntüle</Text>
            </View>
          </View>
          <ChevronRight size={20} color="#10B981" strokeWidth={2} />
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" colors={['#16a34a']} />}
      >
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

        {/* Matches List */}
        <View style={styles.matchesHeader}>
          <Text style={styles.matchesTitle}>Maçlarım</Text>
          <Text style={styles.matchesCount}>{filteredMatches.length} maç</Text>
        </View>

        {filteredMatches.map(renderMatchCard)}

        {filteredMatches.length === 0 && (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Maç bulunamadı</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Arama kriterlerinize uygun maç bulunamadı' : 'Henüz hiç maç oynamadınız'}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
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
  content: {
    flex: 1,
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

  // Match Cards (simplified for space)
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchCardPast: {
    opacity: 0.75,
  },
  matchTypeHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  sportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchSportEmoji: {
    fontSize: 22,
  },
  matchHeaderInfo: {
    flex: 1,
    paddingTop: 2,
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  matchLeague: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  resultBadgeWin: {
    backgroundColor: '#10B981',
  },
  resultBadgeDraw: {
    backgroundColor: '#F59E0B',
  },
  resultBadgeLoss: {
    backgroundColor: '#EF4444',
  },
  resultBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  matchInfo: {
    gap: 8,
    marginBottom: 12,
  },
  matchInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoSeparator: {
    width: 1,
    height: 12,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  matchInfoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scoreTeam: {
    flex: 1,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  scoreDivider: {
    paddingHorizontal: 16,
  },
  scoreDividerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  playerPerformance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  performanceStats: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  performanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  mvpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  mvpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  matchStatus: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  matchFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16a34a',
  },

  // Compact View
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  compactCardPast: {
    opacity: 0.75,
  },
  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  compactSportIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactSportEmoji: {
    fontSize: 18,
  },
  compactInfo: {
    flex: 1,
  },
  compactTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  compactFriendlyBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactResultBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
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
  },
  bottomSpacing: {
    height: 32,
  },
});