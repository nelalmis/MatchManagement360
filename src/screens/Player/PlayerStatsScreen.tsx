import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  BarChart3,
  Trophy,
  Target,
  Users,
  Award,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Crown,
  Star,
  PieChart,
  Activity,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  IPlayer,
  IPlayerStats,
  IPlayerRatingProfile,
  ILeague,
  getSportIcon,
  getSportColor,
  SportType,
  SPORT_CONFIGS,
} from '../../types/types';
import { playerService } from '../../services/playerService';
import { playerStatsService } from '../../services/playerStatsService';
import { playerRatingProfileService } from '../../services/playerRatingProfileService';
import { leagueService } from '../../services/leagueService';
import { NavigationService } from '../../navigation/NavigationService';

interface LeagueStatsDetail {
  leagueId: string;
  leagueName: string;
  sportType: SportType;
  stats: IPlayerStats;
  ratingProfile: IPlayerRatingProfile | null;
  winRate: number;
  goalsPerMatch: number;
  assistsPerMatch: number;
}

export const PlayerStatsScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const playerId = route.params?.playerId || user?.id;

  const [player, setPlayer] = useState<IPlayer | null>(null);
  const [allLeagueStats, setAllLeagueStats] = useState<LeagueStatsDetail[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedLeague, setSelectedLeague] = useState<LeagueStatsDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter leagues by selected sport
  const filteredLeagueStats = useMemo(() => {
    if (selectedSport === 'all') return allLeagueStats;
    return allLeagueStats.filter(l => l.sportType === selectedSport);
  }, [allLeagueStats, selectedSport]);

  // Get available sports from player's leagues
  const availableSports = useMemo(() => {
    const sports = new Set<SportType>();
    allLeagueStats.forEach(league => sports.add(league.sportType));
    return Array.from(sports);
  }, [allLeagueStats]);

  // Total stats for filtered leagues
  const totalStats = useMemo(() => {
    if (filteredLeagueStats.length === 0) return null;

    const total = filteredLeagueStats.reduce(
      (acc, league) => ({
        matches: acc.matches + league.stats.totalMatches,
        goals: acc.goals + league.stats.totalGoals,
        assists: acc.assists + league.stats.totalAssists,
        wins: acc.wins + league.stats.wins,
        draws: acc.draws + league.stats.draws,
        losses: acc.losses + league.stats.losses,
        mvps: acc.mvps + league.stats.mvpCount,
        points: acc.points + league.stats.points,
      }),
      { matches: 0, goals: 0, assists: 0, wins: 0, draws: 0, losses: 0, mvps: 0, points: 0 }
    );

    return {
      ...total,
      winRate: total.matches > 0 ? (total.wins / total.matches) * 100 : 0,
      goalsPerMatch: total.matches > 0 ? total.goals / total.matches : 0,
      assistsPerMatch: total.matches > 0 ? total.assists / total.matches : 0,
      mvpRate: total.matches > 0 ? (total.mvps / total.matches) * 100 : 0,
    };
  }, [filteredLeagueStats]);

  useEffect(() => {
    if (playerId) {
      loadData();
    }
  }, [playerId]);

  const loadData = useCallback(async () => {
    if (!playerId) {
      Alert.alert('Hata', 'Oyuncu ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      // Player data
      const playerData = await playerService.getById(playerId);
      if (!playerData) {
        Alert.alert('Hata', 'Oyuncu bulunamadı');
        NavigationService.goBack();
        return;
      }
      setPlayer(playerData);

      // Get all player stats
      const allStats = await playerStatsService.getStatsByPlayer(playerId);

      // Build detailed league stats
      const detailedStats: LeagueStatsDetail[] = [];

      for (const stat of allStats) {
        const league = await leagueService.getById(stat.leagueId);

        if (league) {
          // Get rating profile
          const ratingProfile = await playerRatingProfileService.getProfileByPlayerLeagueSeason(
            playerId,
            stat.leagueId,
            stat.seasonId
          );

          const winRate = stat.totalMatches > 0 ? (stat.wins / stat.totalMatches) * 100 : 0;
          const goalsPerMatch = stat.totalMatches > 0 ? stat.totalGoals / stat.totalMatches : 0;
          const assistsPerMatch = stat.totalMatches > 0 ? stat.totalAssists / stat.totalMatches : 0;

          detailedStats.push({
            leagueId: stat.leagueId,
            leagueName: league.title,
            sportType: league.sportType,
            stats: stat,
            ratingProfile,
            winRate,
            goalsPerMatch,
            assistsPerMatch,
          });
        }
      }

      // Sort by total matches (most active first)
      detailedStats.sort((a, b) => b.stats.totalMatches - a.stats.totalMatches);

      setAllLeagueStats(detailedStats);

      // Select first league by default
      if (detailedStats.length > 0) {
        setSelectedLeague(detailedStats[0]);
      }

    } catch (error) {
      console.error('Error loading player stats:', error);
      Alert.alert('Hata', 'İstatistikler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getPerformanceLevel = (winRate: number) => {
    if (winRate >= 60) return { label: 'Mükemmel', color: '#10B981' };
    if (winRate >= 50) return { label: 'İyi', color: '#F59E0B' };
    if (winRate >= 40) return { label: 'Orta', color: '#3B82F6' };
    return { label: 'Gelişiyor', color: '#6B7280' };
  };

  const renderTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp size={14} color="#10B981" strokeWidth={2.5} />;
      case 'declining':
        return <TrendingDown size={14} color="#EF4444" strokeWidth={2.5} />;
      default:
        return <Minus size={14} color="#6B7280" strokeWidth={2.5} />;
    }
  };

  if (loading || !player) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>İstatistikler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <CustomHeader title="İstatistiklerim" showDrawer={true} /> */}
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
        {/* Overall Stats Summary */}
        {totalStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.sectionTitle}>
                {selectedSport === 'all' ? 'Genel Performans' : `${SPORT_CONFIGS[selectedSport].name} Performansı`}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryMain}>
                <View style={styles.summaryMainStat}>
                  <Text style={styles.summaryMainValue}>{totalStats.matches}</Text>
                  <Text style={styles.summaryMainLabel}>Toplam Maç</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryMainStat}>
                  <Text style={[styles.summaryMainValue, { color: '#10B981' }]}>
                    {totalStats.winRate.toFixed(0)}%
                  </Text>
                  <Text style={styles.summaryMainLabel}>Galibiyet Oranı</Text>
                </View>
              </View>

              <View style={styles.summaryGrid}>
                <View style={styles.summaryGridItem}>
                  <Target size={16} color="#EF4444" strokeWidth={2} />
                  <Text style={styles.summaryGridValue}>{totalStats.goals}</Text>
                  <Text style={styles.summaryGridLabel}>Gol</Text>
                </View>

                <View style={styles.summaryGridItem}>
                  <Users size={16} color="#10B981" strokeWidth={2} />
                  <Text style={styles.summaryGridValue}>{totalStats.assists}</Text>
                  <Text style={styles.summaryGridLabel}>Asist</Text>
                </View>

                <View style={styles.summaryGridItem}>
                  <Trophy size={16} color="#F59E0B" strokeWidth={2} />
                  <Text style={styles.summaryGridValue}>{totalStats.wins}</Text>
                  <Text style={styles.summaryGridLabel}>Galibiyet</Text>
                </View>

                <View style={styles.summaryGridItem}>
                  <Crown size={16} color="#8B5CF6" strokeWidth={2} />
                  <Text style={styles.summaryGridValue}>{totalStats.mvps}</Text>
                  <Text style={styles.summaryGridLabel}>MVP</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Sport Filter */}
        {availableSports.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.filterTitle}>Spor Filtrele</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sportFilter}
              contentContainerStyle={styles.sportFilterContent}
            >
              <TouchableOpacity
                style={[
                  styles.sportChip,
                  selectedSport === 'all' && styles.sportChipActive,
                ]}
                onPress={() => setSelectedSport('all')}
                activeOpacity={0.7}
              >
                <BarChart3 size={16} color={selectedSport === 'all' ? 'white' : '#6B7280'} strokeWidth={2} />
                <Text style={[
                  styles.sportChipText,
                  selectedSport === 'all' && styles.sportChipTextActive
                ]}>
                  Tümü
                </Text>
              </TouchableOpacity>

              {availableSports.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportChip,
                    selectedSport === sport && {
                      ...styles.sportChipActive,
                      backgroundColor: getSportColor(sport),
                      borderColor: getSportColor(sport),
                    }
                  ]}
                  onPress={() => setSelectedSport(sport)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sportChipEmoji}>{getSportIcon(sport)}</Text>
                  <Text style={[
                    styles.sportChipText,
                    selectedSport === sport && styles.sportChipTextActive
                  ]}>
                    {SPORT_CONFIGS[sport].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Performance Metrics */}
        {totalStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Activity size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Performans Metrikleri</Text>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Maç Başı Gol</Text>
                <Text style={styles.metricValue}>
                  {totalStats.goalsPerMatch.toFixed(2)}
                </Text>
                <View style={styles.metricBar}>
                  <View
                    style={[
                      styles.metricBarFill,
                      {
                        width: `${Math.min(totalStats.goalsPerMatch * 50, 100)}%`,
                        backgroundColor: '#EF4444',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Maç Başı Asist</Text>
                <Text style={styles.metricValue}>
                  {totalStats.assistsPerMatch.toFixed(2)}
                </Text>
                <View style={styles.metricBar}>
                  <View
                    style={[
                      styles.metricBarFill,
                      {
                        width: `${Math.min(totalStats.assistsPerMatch * 50, 100)}%`,
                        backgroundColor: '#10B981',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>MVP Oranı</Text>
                <Text style={styles.metricValue}>
                  {totalStats.mvpRate.toFixed(0)}%
                </Text>
                <View style={styles.metricBar}>
                  <View
                    style={[
                      styles.metricBarFill,
                      {
                        width: `${Math.min(totalStats.mvpRate, 100)}%`,
                        backgroundColor: '#8B5CF6',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Win/Loss Chart */}
        {totalStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <PieChart size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Maç Sonuçları</Text>
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartBars}>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: totalStats.matches > 0 ? `${(totalStats.wins / totalStats.matches) * 100}%` : '0%',
                        backgroundColor: '#10B981',
                      },
                    ]}
                  />
                  <Text style={styles.chartBarLabel}>G</Text>
                  <Text style={styles.chartBarValue}>{totalStats.wins}</Text>
                </View>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: totalStats.matches > 0 ? `${(totalStats.draws / totalStats.matches) * 100}%` : '0%',
                        backgroundColor: '#F59E0B',
                      },
                    ]}
                  />
                  <Text style={styles.chartBarLabel}>B</Text>
                  <Text style={styles.chartBarValue}>{totalStats.draws}</Text>
                </View>
                <View style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: totalStats.matches > 0 ? `${(totalStats.losses / totalStats.matches) * 100}%` : '0%',
                        backgroundColor: '#EF4444',
                      },
                    ]}
                  />
                  <Text style={styles.chartBarLabel}>M</Text>
                  <Text style={styles.chartBarValue}>{totalStats.losses}</Text>
                </View>
              </View>

              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>
                    Galibiyet ({totalStats.winRate.toFixed(0)}%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={styles.legendText}>
                    Berabere ({((totalStats.draws / totalStats.matches) * 100).toFixed(0)}%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>
                    Mağlubiyet ({((totalStats.losses / totalStats.matches) * 100).toFixed(0)}%)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* League Selector */}
        {filteredLeagueStats.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.filterTitle}>Lig Seç</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.leagueSelector}
            >
              {filteredLeagueStats.map((league) => (
                <TouchableOpacity
                  key={league.leagueId}
                  style={[
                    styles.leagueChip,
                    selectedLeague?.leagueId === league.leagueId && {
                      ...styles.leagueChipActive,
                      backgroundColor: getSportColor(league.sportType),
                      borderColor: getSportColor(league.sportType),
                    }
                  ]}
                  onPress={() => setSelectedLeague(league)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.leagueChipEmoji}>{getSportIcon(league.sportType)}</Text>
                  <Text style={[
                    styles.leagueChipText,
                    selectedLeague?.leagueId === league.leagueId && styles.leagueChipTextActive
                  ]}>
                    {league.leagueName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Selected League Details */}
        {selectedLeague && (
          <>
            {/* League Header */}
            <View style={styles.section}>
              <View style={styles.leagueHeader}>
                <View style={styles.leagueHeaderLeft}>
                  <Text style={styles.leagueHeaderEmoji}>{getSportIcon(selectedLeague.sportType)}</Text>
                  <View>
                    <Text style={styles.leagueHeaderTitle}>{selectedLeague.leagueName}</Text>
                    <Text style={styles.leagueHeaderSubtitle}>
                      {selectedLeague.stats.totalMatches} maç oynandı
                    </Text>
                  </View>
                </View>
                {selectedLeague.ratingProfile && (
                  <View style={styles.ratingBadge}>
                    <Star size={14} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                    <Text style={styles.ratingBadgeText}>
                      {selectedLeague.ratingProfile.overallRating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* League Performance */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Award size={20} color="#16a34a" strokeWidth={2} />
                <Text style={styles.sectionTitle}>Lig Performansı</Text>
              </View>

              <View style={styles.performanceCard}>
                <View style={styles.performanceHeader}>
                  <View style={[
                    styles.performanceBadge,
                    { backgroundColor: getPerformanceLevel(selectedLeague.winRate).color + '20' }
                  ]}>
                    <Text style={[
                      styles.performanceBadgeText,
                      { color: getPerformanceLevel(selectedLeague.winRate).color }
                    ]}>
                      {getPerformanceLevel(selectedLeague.winRate).label}
                    </Text>
                  </View>
                  <Text style={styles.performanceWinRate}>
                    {selectedLeague.winRate.toFixed(1)}% Galibiyet
                  </Text>
                </View>

                <View style={styles.performanceStats}>
                  <View style={styles.performanceStatItem}>
                    <Text style={[styles.performanceStatValue, { color: '#EF4444' }]}>
                      {selectedLeague.stats.totalGoals}
                    </Text>
                    <Text style={styles.performanceStatLabel}>
                      Gol ({selectedLeague.goalsPerMatch.toFixed(2)}/maç)
                    </Text>
                  </View>

                  <View style={styles.performanceStatItem}>
                    <Text style={[styles.performanceStatValue, { color: '#10B981' }]}>
                      {selectedLeague.stats.totalAssists}
                    </Text>
                    <Text style={styles.performanceStatLabel}>
                      Asist ({selectedLeague.assistsPerMatch.toFixed(2)}/maç)
                    </Text>
                  </View>

                  <View style={styles.performanceStatItem}>
                    <Text style={[styles.performanceStatValue, { color: '#8B5CF6' }]}>
                      {selectedLeague.stats.mvpCount}
                    </Text>
                    <Text style={styles.performanceStatLabel}>
                      MVP ({((selectedLeague.stats.mvpCount / selectedLeague.stats.totalMatches) * 100).toFixed(0)}%)
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Rating & Trend */}
            {selectedLeague.ratingProfile && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Star size={20} color="#16a34a" strokeWidth={2} />
                  <Text style={styles.sectionTitle}>Rating & Trend</Text>
                </View>

                <View style={styles.ratingCard}>
                  <View style={styles.ratingMain}>
                    <View style={styles.ratingCircle}>
                      <Star size={28} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                      <Text style={styles.ratingValue}>
                        {selectedLeague.ratingProfile.overallRating.toFixed(1)}
                      </Text>
                    </View>
                    <View style={styles.ratingInfo}>
                      <Text style={styles.ratingLabel}>Ortalama Rating</Text>
                      <Text style={styles.ratingSubtext}>
                        {selectedLeague.ratingProfile.totalRatingsReceived} puanlama
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ratingDetails}>
                    <View style={styles.ratingDetailItem}>
                      <Text style={styles.ratingDetailLabel}>Trend</Text>
                      <View style={styles.trendBadge}>
                        {renderTrendIcon(selectedLeague.ratingProfile.ratingTrend)}
                        <Text style={styles.trendText}>
                          {selectedLeague.ratingProfile.ratingTrend === 'improving'
                            ? 'Yükseliyor'
                            : selectedLeague.ratingProfile.ratingTrend === 'declining'
                              ? 'Düşüyor'
                              : 'Stabil'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ratingDetailItem}>
                      <Text style={styles.ratingDetailLabel}>MVP Oranı</Text>
                      <Text style={styles.ratingDetailValue}>
                        {selectedLeague.ratingProfile.mvpRate.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* View Standings Button */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.standingsButton}
                onPress={() => NavigationService.navigateToStandings(selectedLeague.leagueId)}
                activeOpacity={0.7}
              >
                <Trophy size={20} color="white" strokeWidth={2} />
                <Text style={styles.standingsButtonText}>Puan Durumunu Gör</Text>
                <TrendingUp size={20} color="white" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* All Leagues Comparison */}
        {filteredLeagueStats.length > 1 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Tüm Ligler Karşılaştırma</Text>
            </View>

            {filteredLeagueStats.map((league) => (
              <TouchableOpacity
                key={league.leagueId}
                style={styles.comparisonCard}
                onPress={() => setSelectedLeague(league)}
                activeOpacity={0.7}
              >
                <View style={styles.comparisonHeader}>
                  <View style={styles.comparisonLeft}>
                    <Text style={styles.comparisonEmoji}>{getSportIcon(league.sportType)}</Text>
                    <Text style={styles.comparisonTitle}>{league.leagueName}</Text>
                  </View>
                  <View style={[
                    styles.comparisonBadge,
                    { backgroundColor: getSportColor(league.sportType) + '20' }
                  ]}>
                    <Text style={[
                      styles.comparisonBadgeText,
                      { color: getSportColor(league.sportType) }
                    ]}>
                      {league.stats.totalMatches} Maç
                    </Text>
                  </View>
                </View>

                <View style={styles.comparisonStats}>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonStatValue}>{league.stats.totalGoals}</Text>
                    <Text style={styles.comparisonStatLabel}>Gol</Text>
                  </View>
                  <View style={styles.comparisonStat}>
                    <Text style={styles.comparisonStatValue}>{league.stats.totalAssists}</Text>
                    <Text style={styles.comparisonStatLabel}>Asist</Text>
                  </View>
                  <View style={styles.comparisonStat}>
                    <Text style={[styles.comparisonStatValue, { color: '#10B981' }]}>
                      {league.winRate.toFixed(0)}%
                    </Text>
                    <Text style={styles.comparisonStatLabel}>Galibiyet</Text>
                  </View>
                  {league.ratingProfile && (
                    <View style={styles.comparisonStat}>
                      <View style={styles.comparisonStatRating}>
                        <Star size={12} color="#F59E0B" strokeWidth={2} fill="#F59E0B" />
                        <Text style={styles.comparisonStatValue}>
                          {league.ratingProfile.overallRating.toFixed(1)}
                        </Text>
                      </View>
                      <Text style={styles.comparisonStatLabel}>Rating</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Empty State */}
        {allLeagueStats.length === 0 && (
          <View style={styles.emptyState}>
            <BarChart3 size={64} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Henüz istatistik yok</Text>
            <Text style={styles.emptySubtext}>
              Bir lige katılıp maç oynadığında istatistiklerin burada görünecek
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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryMain: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  summaryMainStat: {
    flex: 1,
    alignItems: 'center',
  },
  summaryMainValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryMainLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  summaryGridItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryGridValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryGridLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  sportFilter: {
    marginTop: 4,
  },
  sportFilterContent: {
    gap: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sportChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  sportChipEmoji: {
    fontSize: 16,
  },
  sportChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  sportChipTextActive: {
    color: 'white',
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  metricBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    maxWidth: 60,
  },
  chartBarFill: {
    width: '100%',
    borderRadius: 8,
    minHeight: 20,
  },
  chartBarLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  chartBarValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  chartLegend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#6B7280',
  },
  leagueSelector: {
    marginTop: 4,
  },
  leagueChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  leagueChipActive: {
    borderColor: 'transparent',
  },
  leagueChipEmoji: {
    fontSize: 16,
  },
  leagueChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  leagueChipTextActive: {
    color: 'white',
  },
  leagueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leagueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  leagueHeaderEmoji: {
    fontSize: 32,
  },
  leagueHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  leagueHeaderSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  performanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  performanceBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  performanceWinRate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  performanceStats: {
    flexDirection: 'row',
    gap: 12,
  },
  performanceStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  performanceStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  performanceStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  ratingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  ratingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
  },
  ratingInfo: {
    flex: 1,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  ratingSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  ratingDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  ratingDetailItem: {
    flex: 1,
  },
  ratingDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  ratingDetailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  standingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  standingsButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  comparisonCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  comparisonEmoji: {
    fontSize: 20,
  },
  comparisonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  comparisonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  comparisonBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  comparisonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  comparisonStat: {
    alignItems: 'center',
  },
  comparisonStatRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comparisonStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  comparisonStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
});