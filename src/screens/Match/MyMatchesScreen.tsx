// screens/Match/MyMatchesScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import {
  Calendar,
  Trophy,
  Target,
  Users,
  Crown,
  CheckCircle2,
  XCircle,
  Minus,
  Filter,
  ChevronRight,
  MapPin,
  Clock,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils'; // ✅ EKLE
import {
  IMatch,
  ILeague,
  SportType,
  getSportIcon,
  getSportColor,
  getMatchStatusColor,
  SPORT_CONFIGS,
} from '../../types/types';
import { matchService } from '../../services/matchService';
import { leagueService } from '../../services/leagueService';
import { matchFixtureService } from '../../services/matchFixtureService';

interface MatchWithLeague {
  match: IMatch;
  league: ILeague | null;
}

type FilterType = 'all' | 'completed' | 'upcoming' | 'cancelled';
type SortType = 'newest' | 'oldest';

export const MyMatchesScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const playerId = route.params?.playerId || user?.id;

  const [matches, setMatches] = useState<MatchWithLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');

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

  // Get available sports from matches
  const availableSports = useMemo(() => {
    const sports = new Set<SportType>();
    matches.forEach(({ league }) => {
      if (league) sports.add(league.sportType);
    });
    return Array.from(sports);
  }, [matches]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let filtered = matches;

    // Filter by status
    if (filterType === 'completed') {
      filtered = filtered.filter(({ match }) => match.status === 'Tamamlandı');
    } else if (filterType === 'upcoming') {
      filtered = filtered.filter(
        ({ match }) =>
          match.status === 'Kayıt Açık' ||
          match.status === 'Kayıt Kapandı' ||
          match.status === 'Takımlar Oluşturuldu' ||
          match.status === 'Oynanıyor'
      );
    } else if (filterType === 'cancelled') {
      filtered = filtered.filter(({ match }) => match.status === 'İptal Edildi');
    }

    // Filter by sport
    if (selectedSport !== 'all') {
      filtered = filtered.filter(({ league }) => league?.sportType === selectedSport);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.match.matchStartTime).getTime();
      const dateB = new Date(b.match.matchStartTime).getTime();
      return sortType === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [matches, filterType, selectedSport, sortType]);

  // Statistics
  const stats = useMemo(() => {
    const completed = matches.filter(({ match }) => match.status === 'Tamamlandı');

    let wins = 0;
    let losses = 0;
    let draws = 0;
    let goals = 0;
    let assists = 0;
    let mvps = 0;

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
    });

    return {
      total: matches.length,
      completed: completed.length,
      wins,
      losses,
      draws,
      goals,
      assists,
      mvps,
      winRate: completed.length > 0 ? (wins / completed.length) * 100 : 0,
    };
  }, [matches, playerId]);

  useEffect(() => {
    if (playerId) {
      loadMatches();
    }
  }, [playerId]);

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
            // Get or fetch fixture
            let fixture = fixtureCache.get(match.fixtureId);
            if (!fixture) {
              fixture = await matchFixtureService.getById(match.fixtureId);
              if (fixture) {
                fixtureCache.set(match.fixtureId, fixture);
              } else {
                console.warn(`Fixture not found for match ${match.id}`);
                return { match, league: null };
              }
            }

            // Get or fetch league
            let league = leagueCache.get(fixture.leagueId);
            if (!league) {
              league = await leagueService.getById(fixture.leagueId);
              if (league) {
                leagueCache.set(fixture.leagueId, league);
              } else {
                console.warn(`League not found for fixture ${fixture.id}`);
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

      console.log(`✅ Loaded ${matchesWithLeagues.length} matches with:`);
      console.log(`   📦 ${fixtureCache.size} unique fixtures`);
      console.log(`   🏆 ${leagueCache.size} unique leagues`);

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
    setRefreshing(false);
  }, [loadMatches]);

  const handleMatchPress = useCallback((matchId: string) => {
    NavigationService.navigateToMatch(matchId); // ✅ DEĞİŞTİ
  }, []);

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

  const renderMatchCard = (item: MatchWithLeague) => {
    const { match, league } = item;
    const result = match.status === 'Tamamlandı' ? getResultBadge(match) : null;
    const playerGoals = match.goalScorers?.find(g => g.playerId === playerId);
    const isMVP = match.playerIdOfMatchMVP === playerId;

    return (
      <TouchableOpacity
        key={match.id}
        style={styles.matchCard}
        onPress={() => handleMatchPress(match.id)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.matchHeader}>
          <View style={styles.matchHeaderLeft}>
            {league && (
              <View style={[
                styles.sportIconContainer,
                { backgroundColor: getSportColor(league.sportType) + '15' }
              ]}>
                <Text style={styles.matchSportEmoji}>{getSportIcon(league.sportType)}</Text>
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
        {match.status === 'Tamamlandı' && (playerGoals || isMVP) && (
          <View style={styles.playerPerformance}>
            {playerGoals && (playerGoals.goals > 0 || playerGoals.assists > 0) && (
              <View style={styles.performanceStats}>
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
              </View>
            )}
            {isMVP && (
              <View style={styles.mvpBadge}>
                <Crown size={14} color="#F59E0B" strokeWidth={2.5} />
                <Text style={styles.mvpText}>MVP</Text>
              </View>
            )}
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
      {/* Header with Win Rate */}
      <View style={styles.headerSection}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Maçlarım</Text>
            <Text style={styles.headerSubtitle}>{stats.total} maç oynadın</Text>
          </View>
          {stats.completed > 0 && (
            <View style={styles.winRateBadge}>
              <TrendingUp size={16} color="#10B981" strokeWidth={2} />
              <Text style={styles.winRateText}>{stats.winRate.toFixed(0)}%</Text>
              <Text style={styles.winRateLabel}>Kazanma</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stats Summary */}
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
        </ScrollView>
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
            onPress={() => setFilterType('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
              Tümü ({matches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'completed' && styles.filterChipActive]}
            onPress={() => setFilterType('completed')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterType === 'completed' && styles.filterChipTextActive]}>
              Tamamlanan ({stats.completed})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'upcoming' && styles.filterChipActive]}
            onPress={() => setFilterType('upcoming')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterType === 'upcoming' && styles.filterChipTextActive]}>
              Yaklaşan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterType === 'cancelled' && styles.filterChipActive]}
            onPress={() => setFilterType('cancelled')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, filterType === 'cancelled' && styles.filterChipTextActive]}>
              İptal
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sport Filter */}
        {availableSports.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
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
        {/* Sort Toggle */}
        <View style={styles.sortSection}>
          <Text style={styles.resultCount}>
            {filteredMatches.length} maç bulundu
          </Text>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setSortType(sortType === 'newest' ? 'oldest' : 'newest')}
            activeOpacity={0.7}
          >
            <Clock size={14} color="#6B7280" strokeWidth={2} />
            <Text style={styles.sortButtonText}>
              {sortType === 'newest' ? 'En Yeni' : 'En Eski'}
            </Text>
          </TouchableOpacity>
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
              {filterType === 'all'
                ? 'Henüz hiç maç oynamadınız'
                : `${filterType === 'completed' ? 'Tamamlanan' : filterType === 'upcoming' ? 'Yaklaşan' : 'İptal edilen'} maç bulunmuyor`}
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
  headerSection: {
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  winRateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  winRateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  winRateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
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
  filtersSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  sportFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  sportFilterChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
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
  content: {
    flex: 1,
  },
  sortSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
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