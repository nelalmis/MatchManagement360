// screens/Match/MyMatchesScreen.tsx

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
  Award,
  Zap,
  BarChart3,
  Globe,
  Lock,
  Mail,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';
import {
  IMatch,
  ILeague,
  SportType,
  MatchType,
  getSportIcon,
  getSportColor,
  getMatchStatusColor,
  SPORT_CONFIGS,
} from '../../types/types';
import { matchService } from '../../services/matchService';
import { leagueService } from '../../services/leagueService';
import { matchFixtureService } from '../../services/matchFixtureService';
import { matchInvitationService } from '../../services/matchInvitationService';

interface MatchWithLeague {
  match: IMatch;
  league: ILeague | null;
}

type FilterType = 'all' | 'completed' | 'upcoming' | 'cancelled';
type MatchTypeFilter = 'all' | 'league' | 'friendly';
type ViewMode = 'list' | 'compact';

export const MyMatchesScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const playerId = route.params?.playerId || user?.id;

  const [matches, setMatches] = useState<MatchWithLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>('all');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // ✅ Event listeners
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
    }
  }, [playerId]);

  // Available sports
  const availableSports = useMemo(() => {
    const sports = new Set<SportType>();
    matches.forEach(({ match, league }) => {
      // Friendly maçlar kendi sportType'ına sahip
      if (match.type === MatchType.FRIENDLY && match.sportType) {
        sports.add(match.sportType);
      }
      // League maçlar ligden inherit eder
      else if (league) {
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
        match.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Match type filter (League/Friendly)
    if (matchTypeFilter === 'league') {
      filtered = filtered.filter(({ match }) => match.type === MatchType.LEAGUE);
    } else if (matchTypeFilter === 'friendly') {
      filtered = filtered.filter(({ match }) => match.type === MatchType.FRIENDLY);
    }

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter(({ match, league }) => {
        // Friendly maçlar kendi sportType'ına sahip
        if (match.type === MatchType.FRIENDLY && match.sportType) {
          return match.sportType === selectedSport;
        }
        // League maçlar ligden inherit eder
        return league?.sportType === selectedSport;
      });
    }

    // Status filter
    if (filterType === 'completed') {
      filtered = filtered.filter(({ match }) => match.status === 'Tamamlandı');
    } else if (filterType === 'upcoming') {
      filtered = filtered.filter(
        ({ match }) =>
          new Date(match.matchStartTime) > now &&
          match.status !== 'İptal Edildi' &&
          match.status !== 'Tamamlandı'
      );
    } else if (filterType === 'cancelled') {
      filtered = filtered.filter(({ match }) => match.status === 'İptal Edildi');
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.match.matchStartTime).getTime();
      const dateB = new Date(b.match.matchStartTime).getTime();
      
      if (filterType === 'upcoming' || filterType === 'all') {
        return dateA - dateB; // Upcoming: oldest first
      } else {
        return dateB - dateA; // Past: newest first
      }
    });

    return sorted;
  }, [matches, searchQuery, filterType, matchTypeFilter, selectedSport]);

  // Enhanced Statistics
  const stats = useMemo(() => {
    const now = new Date();
    const completed = matches.filter(({ match }) => match.status === 'Tamamlandı');
    const upcoming = matches.filter(({ match }) =>
      new Date(match.matchStartTime) > now &&
      match.status !== 'İptal Edildi' &&
      match.status !== 'Tamamlandı'
    );
    const leagueMatches = matches.filter(({ match }) => match.type === MatchType.LEAGUE);
    const friendlyMatches = matches.filter(({ match }) => match.type === MatchType.FRIENDLY);

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let goals = 0;
    let assists = 0;
    let mvps = 0;
    let totalRating = 0;
    let ratedMatches = 0;

    completed.forEach(({ match }) => {
      const isInTeam1 = match.team1PlayerIds?.includes(playerId);
      const isInTeam2 = match.team2PlayerIds?.includes(playerId);

      if (!isInTeam1 && !isInTeam2) return;

      const team1Score = match.team1Score || 0;
      const team2Score = match.team2Score || 0;

      // Win/Loss/Draw
      if (isInTeam1) {
        if (team1Score > team2Score) wins++;
        else if (team1Score < team2Score) losses++;
        else draws++;
      } else {
        if (team2Score > team1Score) wins++;
        else if (team2Score < team1Score) losses++;
        else draws++;
      }

      // Goals & Assists
      const playerGoals = match.goalScorers?.find(g => g.playerId === playerId);
      if (playerGoals) {
        goals += playerGoals.goals;
        assists += playerGoals.assists;
      }

      // MVPs
      if (match.playerIdOfMatchMVP === playerId) {
        mvps++;
      }

      // Rating
      const playerRating = match.ratingsSummary?.topRatedPlayers?.find(r => r.playerId === playerId);
      if (playerRating && playerRating.averageRating) {
        totalRating += playerRating.averageRating;
        ratedMatches++;
      }
    });

    const winRate = completed.length > 0 ? (wins / completed.length) * 100 : 0;
    const avgRating = ratedMatches > 0 ? totalRating / ratedMatches : 0;
    const avgGoalsPerMatch = completed.length > 0 ? goals / completed.length : 0;

    return {
      total: matches.length,
      completed: completed.length,
      upcoming: upcoming.length,
      leagueMatches: leagueMatches.length,
      friendlyMatches: friendlyMatches.length,
      wins,
      losses,
      draws,
      goals,
      assists,
      mvps,
      winRate,
      avgRating,
      avgGoalsPerMatch,
    };
  }, [matches, playerId]);

  const loadPendingInvitations = async () => {
    if (!playerId) return;
    try {
      const count = await matchInvitationService.getPendingInvitationCount(playerId);
      setPendingInvitationsCount(count);
    } catch (error) {
      console.error('Error loading invitations:', error);
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

      // Get all player matches
      const allMatches = await matchService.getMatchesByPlayer(playerId);

      if (!allMatches || allMatches.length === 0) {
        setMatches([]);
        return;
      }

      // Cache for fixtures and leagues
      const fixtureCache = new Map<string, any>();
      const leagueCache = new Map<string, any>();

      // Get league info for each match
      const matchesWithLeagues: MatchWithLeague[] = await Promise.all(
        allMatches.map(async (match) => {
          try {
            let fixture = fixtureCache.get(match.fixtureId);
            if (!fixture) {
              fixture = await matchFixtureService.getById(match.fixtureId);
              if (fixture) {
                fixtureCache.set(match.fixtureId, fixture);
              } else {
                return { match, league: null };
              }
            }

            let league = leagueCache.get(fixture.leagueId);
            if (!league) {
              league = await leagueService.getById(fixture.leagueId);
              if (league) {
                leagueCache.set(fixture.leagueId, league);
              } else {
                return { match, league: null };
              }
            }

            return { match, league };
          } catch (error) {
            console.error(`Error loading league for match ${match.id}:`, error);
            return { match, league: null };
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
    await loadMatches();
    await loadPendingInvitations();
    setRefreshing(false);
  }, [loadMatches]);

  const handleMatchPress = useCallback((matchId: string) => {
    NavigationService.navigateToMatch(matchId);
  }, []);

  const handleViewInvitations = () => {
    NavigationService.navigateToFriendlyMatchInvitations();
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
    const isInTeam1 = match.team1PlayerIds?.includes(playerId);
    const isInTeam2 = match.team2PlayerIds?.includes(playerId);

    if (!isInTeam1 && !isInTeam2) return null;

    const team1Score = match.team1Score || 0;
    const team2Score = match.team2Score || 0;

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

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const renderMatchCard = (item: MatchWithLeague) => {
    const { match, league } = item;
    const result = match.status === 'Tamamlandı' ? getResultBadge(match) : null;
    const playerGoals = match.goalScorers?.find(g => g.playerId === playerId);
    const isMVP = match.playerIdOfMatchMVP === playerId;
    const playerRating = match.ratingsSummary?.topRatedPlayers?.find(p => p.playerId === playerId);
    const isPast = new Date(match.matchStartTime) < new Date() || match.status === 'Tamamlandı';
    const isFriendly = match.type === MatchType.FRIENDLY;
    
    // SportType: Friendly ise kendi sportType'ı, değilse ligden al
    const matchSportType = match.type === MatchType.FRIENDLY && match.sportType 
      ? match.sportType 
      : league?.sportType;
    const matchSportColor = matchSportType ? getSportColor(matchSportType) : '#16a34a';

    // Compact View
    if (viewMode === 'compact') {
      return (
        <TouchableOpacity
          key={match.id}
          style={[
            styles.compactCard,
            isPast && styles.compactCardPast,
            isFriendly && styles.compactCardFriendly,
          ]}
          onPress={() => handleMatchPress(match.id)}
          activeOpacity={0.7}
        >
          <View style={styles.compactLeft}>
            {matchSportType && (
              <View style={[
                styles.compactSportIcon,
                { backgroundColor: matchSportColor + '15' }
              ]}>
                <Text style={styles.compactSportEmoji}>{getSportIcon(matchSportType)}</Text>
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
              <Text style={styles.compactDate}>{formatDate(match.matchStartTime)}</Text>
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

    // List View
    return (
      <TouchableOpacity
        key={match.id}
        style={[
          styles.matchCard,
          isPast && styles.matchCardPast,
          isFriendly && styles.matchCardFriendly,
        ]}
        onPress={() => handleMatchPress(match.id)}
        activeOpacity={0.7}
      >
        {/* Match Type Badge */}
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
          
          {/* Privacy Badge for Friendly */}
          {isFriendly && (
            <View style={[styles.privacyBadge, { 
              backgroundColor: match.isPublic ? '#10B981' + '15' : '#F59E0B' + '15' 
            }]}>
              {match.isPublic ? (
                <>
                  <Globe size={10} color="#10B981" strokeWidth={2} />
                  <Text style={[styles.privacyBadgeText, { color: '#10B981' }]}>Açık</Text>
                </>
              ) : (
                <>
                  <Lock size={10} color="#F59E0B" strokeWidth={2} />
                  <Text style={[styles.privacyBadgeText, { color: '#F59E0B' }]}>Özel</Text>
                </>
              )}
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

        {/* Header */}
        <View style={styles.matchHeader}>
          <View style={styles.matchHeaderLeft}>
            {matchSportType && (
              <View style={[
                styles.sportIconContainer,
                { backgroundColor: matchSportColor + '15' }
              ]}>
                <Text style={styles.matchSportEmoji}>{getSportIcon(matchSportType)}</Text>
              </View>
            )}
            <View style={styles.matchHeaderInfo}>
              <Text style={styles.matchTitle} numberOfLines={1}>
                {match.title}
              </Text>
              <Text style={styles.matchLeague} numberOfLines={1}>
                {league?.title || 'Lig bilgisi yok'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        </View>

        {/* Date & Location */}
        <View style={styles.matchInfo}>
          <View style={styles.matchInfoItem}>
            <View style={styles.infoIconContainer}>
              <Calendar size={14} color="#6B7280" strokeWidth={2} />
            </View>
            <Text style={styles.matchInfoText}>
              {formatDate(match.matchStartTime)}
            </Text>
            <View style={styles.infoSeparator} />
            <Clock size={14} color="#6B7280" strokeWidth={2} />
            <Text style={styles.matchInfoText}>
              {formatTime(match.matchStartTime)}
            </Text>
          </View>
          {match.location && (
            <View style={styles.matchInfoItem}>
              <View style={styles.infoIconContainer}>
                <MapPin size={14} color="#6B7280" strokeWidth={2} />
              </View>
              <Text style={styles.matchInfoText} numberOfLines={1}>
                {match.location}
              </Text>
            </View>
          )}
        </View>

        {/* Score */}
        {match.status === 'Tamamlandı' && match.score && (
          <View style={styles.matchScore}>
            <View style={styles.scoreTeam}>
              <Text style={styles.scoreLabel}>Takım 1</Text>
              <Text style={styles.scoreValue}>{match.team1Score || 0}</Text>
            </View>
            <View style={styles.scoreDivider}>
              <Text style={styles.scoreDividerText}>vs</Text>
            </View>
            <View style={styles.scoreTeam}>
              <Text style={styles.scoreLabel}>Takım 2</Text>
              <Text style={styles.scoreValue}>{match.team2Score || 0}</Text>
            </View>
          </View>
        )}

        {/* Player Performance */}
        {match.status === 'Tamamlandı' && (playerGoals || isMVP || playerRating) && (
          <View style={styles.playerPerformance}>
            <View style={styles.performanceStats}>
              {playerGoals && (playerGoals.goals > 0 || playerGoals.assists > 0) && (
                <>
                  {playerGoals.goals > 0 && (
                    <View style={styles.performanceBadge}>
                      <Target size={12} color="#EF4444" strokeWidth={2} />
                      <Text style={styles.performanceText}>{playerGoals.goals} Gol</Text>
                    </View>
                  )}
                  {playerGoals.assists > 0 && (
                    <View style={styles.performanceBadge}>
                      <Users size={12} color="#10B981" strokeWidth={2} />
                      <Text style={styles.performanceText}>{playerGoals.assists} Asist</Text>
                    </View>
                  )}
                </>
              )}
              {playerRating && playerRating.averageRating > 0 && (
                <View style={styles.performanceBadge}>
                  <Award size={12} color="#F59E0B" strokeWidth={2} />
                  <Text style={styles.performanceText}>{playerRating.averageRating.toFixed(1)} ⭐</Text>
                </View>
              )}
            </View>
            {isMVP && (
              <View style={styles.mvpBadge}>
                <Crown size={14} color="#F59E0B" strokeWidth={2.5} />
                <Text style={styles.mvpText}>MVP</Text>
              </View>
            )}
          </View>
        )}

        {/* Friendly Info */}
        {isFriendly && !match.affectsStandings && match.status === 'Tamamlandı' && (
          <View style={styles.friendlyInfoBanner}>
            <TrendingUp size={12} color="#6B7280" strokeWidth={2} />
            <Text style={styles.friendlyInfoText}>Puan durumunu etkilemez</Text>
          </View>
        )}

        {/* Status */}
        {match.status !== 'Tamamlandı' && (
          <View style={styles.matchStatus}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getMatchStatusColor(match.status) + '15' },
              ]}
            >
              <View style={[
                styles.statusDot,
                { backgroundColor: getMatchStatusColor(match.status) }
              ]} />
              <Text
                style={[styles.statusText, { color: getMatchStatusColor(match.status) }]}
              >
                {match.status}
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
        <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Maç veya lokasyon ara..."
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
          <Filter
            size={20}
            color={showFilters ? '#16a34a' : '#6B7280'}
            strokeWidth={2}
          />
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
          {/* Match Type Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'all' && styles.matchTypeChipActive,
              ]}
              onPress={() => setMatchTypeFilter('all')}
              activeOpacity={0.7}
            >
              <Globe size={16} color={matchTypeFilter === 'all' ? '#16a34a' : '#6B7280'} />
              <Text
                style={[
                  styles.matchTypeText,
                  matchTypeFilter === 'all' && styles.matchTypeTextActive,
                ]}
              >
                Tümü ({stats.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'league' && {
                  ...styles.matchTypeChipActive,
                  backgroundColor: '#3B82F6' + '20',
                  borderColor: '#3B82F6',
                },
              ]}
              onPress={() => setMatchTypeFilter('league')}
              activeOpacity={0.7}
            >
              <Trophy size={16} color={matchTypeFilter === 'league' ? '#3B82F6' : '#6B7280'} />
              <Text
                style={[
                  styles.matchTypeText,
                  matchTypeFilter === 'league' && { ...styles.matchTypeTextActive, color: '#3B82F6' },
                ]}
              >
                Lig ({stats.leagueMatches})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'friendly' && {
                  ...styles.matchTypeChipActive,
                  backgroundColor: '#10B981' + '20',
                  borderColor: '#10B981',
                },
              ]}
              onPress={() => setMatchTypeFilter('friendly')}
              activeOpacity={0.7}
            >
              <Users size={16} color={matchTypeFilter === 'friendly' ? '#10B981' : '#6B7280'} />
              <Text
                style={[
                  styles.matchTypeText,
                  matchTypeFilter === 'friendly' && { ...styles.matchTypeTextActive, color: '#10B981' },
                ]}
              >
                Dostluk ({stats.friendlyMatches})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Status Filter */}
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

            <TouchableOpacity
              style={[styles.filterChip, filterType === 'cancelled' && styles.filterChipActive]}
              onPress={() => setFilterType('cancelled')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterType === 'cancelled' && styles.filterChipTextActive]}>
                ❌ İptal
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Sport Filter */}
          {availableSports.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filtersContent}
            >
              <TouchableOpacity
                style={[styles.sportFilterChip, selectedSport === 'all' && styles.sportFilterChipActive]}
                onPress={() => setSelectedSport('all')}
                activeOpacity={0.7}
              >
                <Filter size={14} color={selectedSport === 'all' ? 'white' : '#6B7280'} strokeWidth={2} />
                <Text style={[styles.sportFilterText, selectedSport === 'all' && styles.sportFilterTextActive]}>
                  Tüm Sporlar
                </Text>
              </TouchableOpacity>

              {availableSports.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportFilterChip,
                    selectedSport === sport && {
                      ...styles.sportFilterChipActive,
                      backgroundColor: getSportColor(sport),
                      borderColor: getSportColor(sport),
                    },
                  ]}
                  onPress={() => setSelectedSport(sport)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sportFilterEmoji}>{getSportIcon(sport)}</Text>
                  <Text style={[styles.sportFilterText, selectedSport === sport && styles.sportFilterTextActive]}>
                    {SPORT_CONFIGS[sport].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Pending Invitations Banner */}
      {pendingInvitationsCount > 0 && (
        <TouchableOpacity
          style={styles.invitationBanner}
          onPress={handleViewInvitations}
          activeOpacity={0.7}
        >
          <View style={styles.invitationBannerLeft}>
            <Mail size={20} color="#10B981" strokeWidth={2} />
            <View style={styles.invitationBannerText}>
              <Text style={styles.invitationBannerTitle}>
                {pendingInvitationsCount} Davet Bekliyor
              </Text>
              <Text style={styles.invitationBannerSubtitle}>
                Dostluk maçı davetlerini görüntüle
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#10B981" strokeWidth={2} />
        </TouchableOpacity>
      )}

      {/* Enhanced Stats Summary */}
      <View style={styles.statsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Trophy size={20} color="#16a34a" strokeWidth={2} />
            <Text style={[styles.statValue, { color: '#16a34a' }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>

          <View style={styles.statCard}>
            <CheckCircle2 size={18} color="#10B981" strokeWidth={2} />
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.wins}</Text>
            <Text style={styles.statLabel}>Galibiyet</Text>
          </View>

          <View style={styles.statCard}>
            <Minus size={18} color="#F59E0B" strokeWidth={2} />
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.draws}</Text>
            <Text style={styles.statLabel}>Berabere</Text>
          </View>

          <View style={styles.statCard}>
            <XCircle size={18} color="#EF4444" strokeWidth={2} />
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.losses}</Text>
            <Text style={styles.statLabel}>Mağlubiyet</Text>
          </View>

          <View style={styles.statCard}>
            <Target size={18} color="#EF4444" strokeWidth={2} />
            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.goals}</Text>
            <Text style={styles.statLabel}>Gol</Text>
          </View>

          <View style={styles.statCard}>
            <Users size={18} color="#10B981" strokeWidth={2} />
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.assists}</Text>
            <Text style={styles.statLabel}>Asist</Text>
          </View>

          <View style={styles.statCard}>
            <Crown size={18} color="#F59E0B" strokeWidth={2} />
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.mvps}</Text>
            <Text style={styles.statLabel}>MVP</Text>
          </View>

          {stats.avgRating > 0 && (
            <View style={styles.statCard}>
              <Award size={18} color="#8B5CF6" strokeWidth={2} />
              <Text style={[styles.statValue, { color: '#8B5CF6' }]}>{stats.avgRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Ort. Rating</Text>
            </View>
          )}

          {stats.avgGoalsPerMatch > 0 && (
            <View style={styles.statCard}>
              <Zap size={18} color="#EC4899" strokeWidth={2} />
              <Text style={[styles.statValue, { color: '#EC4899' }]}>{stats.avgGoalsPerMatch.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Maç/Gol</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Matches List */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
      >
        <View style={styles.resultCountContainer}>
          <Text style={styles.resultCount}>
            {filteredMatches.length} maç bulundu
          </Text>
        </View>

        {filteredMatches.map(renderMatchCard)}

        {/* Empty State */}
        {filteredMatches.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Calendar size={64} color="#D1D5DB" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>Maç bulunamadı</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Arama kriterlerinize uygun maç bulunamadı'
                : filterType === 'completed'
                  ? 'Henüz tamamlanmış maç bulunmuyor'
                  : filterType === 'upcoming'
                    ? 'Yaklaşan maç bulunmuyor'
                    : 'Henüz hiç maç oynamadınız'}
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
  sportFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sportFilterChipActive: {
    borderWidth: 1.5,
  },
  sportFilterEmoji: {
    fontSize: 14,
  },
  sportFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  sportFilterTextActive: {
    color: 'white',
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
  statsSection: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    alignItems: 'center',
    minWidth: 90,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  statCardPrimary: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16a34a',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  resultCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // List View Cards
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchCardPast: {
    opacity: 0.75,
  },
  matchCardFriendly: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
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
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
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
  infoIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
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
  friendlyInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  friendlyInfoText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
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

  // Compact View Cards
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
  compactCardFriendly: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
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
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
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