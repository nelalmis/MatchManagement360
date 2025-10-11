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
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Medal,
  Target,
  Users,
  Calendar,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import {
  ILeague,
  IMatch,
  IPlayerStats,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { leagueService } from '../../services/leagueService';
import { matchService } from '../../services/matchService';
import { playerStatsService } from '../../services/playerStatsService';
import { playerService } from '../../services/playerService';

interface StandingPlayer {
  playerId: string;
  playerName: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[]; // Son 5 maç: 'W', 'D', 'L'
  rank: number;
  previousRank?: number;
}

type TabType = 'standings' | 'topScorers' | 'topAssists';

export const StandingsScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const navigation = useNavigationContext();
  const leagueId = route.params?.leagueId;

  const [league, setLeague] = useState<ILeague | null>(null);
  const [standings, setStandings] = useState<StandingPlayer[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topAssists, setTopAssists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('standings');

  useEffect(() => {
    if (leagueId) {
      loadData();
    }
  }, [leagueId]);

  const loadData = useCallback(async () => {
    if (!leagueId) {
      Alert.alert('Hata', 'Lig ID bulunamadı');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      // League data
      const leagueData = await leagueService.getById(leagueId);
      if (!leagueData) {
        Alert.alert('Hata', 'Lig bulunamadı');
        navigation.goBack();
        return;
      }
      setLeague(leagueData);

      // Get all matches
      const matches = await matchService.getMatchesByLeague(leagueId);
      const completedMatches = matches.filter(m => m.status === 'Tamamlandı');

      // Get player stats
      const allPlayerStats = await playerStatsService.getStatsByLeague(leagueId);

      // Calculate standings
      const playerStandings: Record<string, StandingPlayer> = {};

      // Initialize all players
      for (const playerId of leagueData.playerIds) {
        playerStandings[playerId] = {
          playerId,
          playerName: '',
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          form: [],
          rank: 0,
        };
      }

      // Calculate from matches
      for (const match of completedMatches) {
        if (!match.team1PlayerIds || !match.team2PlayerIds) continue;

        const team1Score = match.team1Score || 0;
        const team2Score = match.team2Score || 0;

        // Team 1 players
        for (const playerId of match.team1PlayerIds) {
          if (!playerStandings[playerId]) continue;
          
          playerStandings[playerId].played++;
          playerStandings[playerId].goalsFor += team1Score;
          playerStandings[playerId].goalsAgainst += team2Score;

          if (team1Score > team2Score) {
            playerStandings[playerId].won++;
            playerStandings[playerId].points += 3;
            playerStandings[playerId].form.push('W');
          } else if (team1Score === team2Score) {
            playerStandings[playerId].draw++;
            playerStandings[playerId].points += 1;
            playerStandings[playerId].form.push('D');
          } else {
            playerStandings[playerId].lost++;
            playerStandings[playerId].form.push('L');
          }
        }

        // Team 2 players
        for (const playerId of match.team2PlayerIds) {
          if (!playerStandings[playerId]) continue;
          
          playerStandings[playerId].played++;
          playerStandings[playerId].goalsFor += team2Score;
          playerStandings[playerId].goalsAgainst += team1Score;

          if (team2Score > team1Score) {
            playerStandings[playerId].won++;
            playerStandings[playerId].points += 3;
            playerStandings[playerId].form.push('W');
          } else if (team2Score === team1Score) {
            playerStandings[playerId].draw++;
            playerStandings[playerId].points += 1;
            playerStandings[playerId].form.push('D');
          } else {
            playerStandings[playerId].lost++;
            playerStandings[playerId].form.push('L');
          }
        }
      }

      // Calculate goal difference and get player names
      const standingsArray: StandingPlayer[] = [];
      for (const [playerId, data] of Object.entries(playerStandings)) {
        const player = await playerService.getById(playerId);
        data.playerName = player ? `${player.name} ${player.surname}` : 'Bilinmeyen';
        data.goalDifference = data.goalsFor - data.goalsAgainst;
        data.form = data.form.slice(-5); // Son 5 maç
        standingsArray.push(data);
      }

      // Sort by points, then goal difference, then goals for
      standingsArray.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      // Assign ranks
      standingsArray.forEach((player, index) => {
        player.rank = index + 1;
      });

      setStandings(standingsArray);

      // Top scorers
      const scorers = allPlayerStats
        .map(stat => ({
          playerId: stat.playerId,
          playerName: '',
          goals: stat.totalGoals || 0,
          matches: stat.totalMatches || 0,
        }))
        .filter(s => s.goals > 0)
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 10);

      // Get player names for scorers
      for (const scorer of scorers) {
        const player = await playerService.getById(scorer.playerId);
        scorer.playerName = player ? `${player.name} ${player.surname}` : 'Bilinmeyen';
      }
      setTopScorers(scorers);

      // Top assists
      const assisters = allPlayerStats
        .map(stat => ({
          playerId: stat.playerId,
          playerName: '',
          assists: stat.totalAssists || 0,
          matches: stat.totalMatches || 0,
        }))
        .filter(a => a.assists > 0)
        .sort((a, b) => b.assists - a.assists)
        .slice(0, 10);

      // Get player names for assisters
      for (const assister of assisters) {
        const player = await playerService.getById(assister.playerId);
        assister.playerName = player ? `${player.name} ${player.surname}` : 'Bilinmeyen';
      }
      setTopAssists(assisters);

    } catch (error) {
      console.error('Error loading standings:', error);
      Alert.alert('Hata', 'Puan durumu yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getRankChange = useCallback((player: StandingPlayer) => {
    if (!player.previousRank) return null;
    const change = player.previousRank - player.rank;
    if (change > 0) return { type: 'up', value: change };
    if (change < 0) return { type: 'down', value: Math.abs(change) };
    return { type: 'same', value: 0 };
  }, []);

  const getFormColor = useCallback((result: string) => {
    if (result === 'W') return '#10B981';
    if (result === 'D') return '#F59E0B';
    return '#DC2626';
  }, []);

  const sportColor = useMemo(() => 
    league ? getSportColor(league.sportType) : '#16a34a',
    [league]
  );

  if (loading || !league) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Puan durumu yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'standings' && { ...styles.tabActive, borderBottomColor: sportColor }
          ]}
          onPress={() => setSelectedTab('standings')}
          activeOpacity={0.7}
        >
          <Trophy 
            size={20} 
            color={selectedTab === 'standings' ? sportColor : '#6B7280'} 
            strokeWidth={2} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'standings' && { ...styles.tabTextActive, color: sportColor }
          ]}>
            Puan Durumu
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'topScorers' && { ...styles.tabActive, borderBottomColor: sportColor }
          ]}
          onPress={() => setSelectedTab('topScorers')}
          activeOpacity={0.7}
        >
          <Target 
            size={20} 
            color={selectedTab === 'topScorers' ? sportColor : '#6B7280'} 
            strokeWidth={2} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'topScorers' && { ...styles.tabTextActive, color: sportColor }
          ]}>
            Gol Krallığı
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'topAssists' && { ...styles.tabActive, borderBottomColor: sportColor }
          ]}
          onPress={() => setSelectedTab('topAssists')}
          activeOpacity={0.7}
        >
          <Users 
            size={20} 
            color={selectedTab === 'topAssists' ? sportColor : '#6B7280'} 
            strokeWidth={2} 
          />
          <Text style={[
            styles.tabText,
            selectedTab === 'topAssists' && { ...styles.tabTextActive, color: sportColor }
          ]}>
            Asist Krallığı
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={sportColor}
            colors={[sportColor]}
          />
        }
      >
        {/* Standings Tab */}
        {selectedTab === 'standings' && (
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.rankCell]}>#</Text>
              <Text style={[styles.headerCell, styles.playerCell]}>Oyuncu</Text>
              <Text style={[styles.headerCell, styles.statCell]}>O</Text>
              <Text style={[styles.headerCell, styles.statCell]}>G</Text>
              <Text style={[styles.headerCell, styles.statCell]}>B</Text>
              <Text style={[styles.headerCell, styles.statCell]}>M</Text>
              <Text style={[styles.headerCell, styles.statCell]}>A</Text>
              <Text style={[styles.headerCell, styles.statCell]}>+/-</Text>
              <Text style={[styles.headerCell, styles.pointsCell]}>P</Text>
            </View>

            {/* Table Rows */}
            {standings.map((player, index) => {
              const isCurrentUser = player.playerId === user?.id;
              const rankChange = getRankChange(player);

              return (
                <View 
                  key={player.playerId} 
                  style={[
                    styles.tableRow,
                    isCurrentUser && styles.currentUserRow,
                    index < 3 && styles.topThreeRow,
                  ]}
                >
                  {/* Rank */}
                  <View style={styles.rankCell}>
                    <Text style={[
                      styles.rankText,
                      index < 3 && { color: sportColor, fontWeight: '700' }
                    ]}>
                      {player.rank}
                    </Text>
                    {index < 3 && (
                      <Medal size={12} color={sportColor} strokeWidth={2} />
                    )}
                  </View>

                  {/* Player Name */}
                  <View style={styles.playerCell}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {player.playerName}
                    </Text>
                    {/* Form */}
                    <View style={styles.formContainer}>
                      {player.form.map((result, idx) => (
                        <View 
                          key={idx}
                          style={[
                            styles.formBadge,
                            { backgroundColor: getFormColor(result) }
                          ]}
                        >
                          <Text style={styles.formText}>{result}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Stats */}
                  <Text style={styles.statCell}>{player.played}</Text>
                  <Text style={styles.statCell}>{player.won}</Text>
                  <Text style={styles.statCell}>{player.draw}</Text>
                  <Text style={styles.statCell}>{player.lost}</Text>
                  <Text style={styles.statCell}>{player.goalsFor}</Text>
                  <Text style={[
                    styles.statCell,
                    player.goalDifference > 0 && { color: '#10B981' },
                    player.goalDifference < 0 && { color: '#DC2626' },
                  ]}>
                    {player.goalDifference > 0 ? '+' : ''}{player.goalDifference}
                  </Text>
                  <Text style={[styles.pointsCell, { color: sportColor }]}>
                    {player.points}
                  </Text>
                </View>
              );
            })}

            {standings.length === 0 && (
              <View style={styles.emptyState}>
                <Trophy size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyText}>Henüz puan durumu oluşmadı</Text>
              </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Kısaltmalar:</Text>
              <Text style={styles.legendText}>O: Oynanan, G: Galibiyet, B: Beraberlik, M: Mağlubiyet</Text>
              <Text style={styles.legendText}>A: Atılan Gol, +/-: Averaj, P: Puan</Text>
            </View>
          </View>
        )}

        {/* Top Scorers Tab */}
        {selectedTab === 'topScorers' && (
          <View style={styles.rankingContainer}>
            {topScorers.map((scorer, index) => (
              <View key={scorer.playerId} style={styles.rankingCard}>
                <View style={styles.rankingLeft}>
                  <View style={[
                    styles.rankBadge,
                    index < 3 && { backgroundColor: sportColor }
                  ]}>
                    <Text style={[
                      styles.rankBadgeText,
                      index < 3 && { color: 'white' }
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.rankingInfo}>
                    <Text style={styles.rankingName}>{scorer.playerName}</Text>
                    <Text style={styles.rankingMatches}>{scorer.matches} maç</Text>
                  </View>
                </View>
                <View style={styles.rankingRight}>
                  <Target size={18} color={sportColor} strokeWidth={2} />
                  <Text style={[styles.rankingValue, { color: sportColor }]}>
                    {scorer.goals}
                  </Text>
                </View>
              </View>
            ))}

            {topScorers.length === 0 && (
              <View style={styles.emptyState}>
                <Target size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyText}>Henüz gol atılmadı</Text>
              </View>
            )}
          </View>
        )}

        {/* Top Assists Tab */}
        {selectedTab === 'topAssists' && (
          <View style={styles.rankingContainer}>
            {topAssists.map((assister, index) => (
              <View key={assister.playerId} style={styles.rankingCard}>
                <View style={styles.rankingLeft}>
                  <View style={[
                    styles.rankBadge,
                    index < 3 && { backgroundColor: sportColor }
                  ]}>
                    <Text style={[
                      styles.rankBadgeText,
                      index < 3 && { color: 'white' }
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.rankingInfo}>
                    <Text style={styles.rankingName}>{assister.playerName}</Text>
                    <Text style={styles.rankingMatches}>{assister.matches} maç</Text>
                  </View>
                </View>
                <View style={styles.rankingRight}>
                  <Users size={18} color={sportColor} strokeWidth={2} />
                  <Text style={[styles.rankingValue, { color: sportColor }]}>
                    {assister.assists}
                  </Text>
                </View>
              </View>
            ))}

            {topAssists.length === 0 && (
              <View style={styles.emptyState}>
                <Users size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyText}>Henüz asist yapılmadı</Text>
              </View>
            )}
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  tableContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },
  headerCell: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  currentUserRow: {
    backgroundColor: '#DCFCE7',
  },
  topThreeRow: {
    backgroundColor: '#F0FDF4',
  },
  rankCell: {
    width: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  playerCell: {
    flex: 1,
    marginRight: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  formContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  formBadge: {
    width: 16,
    height: 16,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formText: {
    fontSize: 9,
    fontWeight: '700',
    color: 'white',
  },
  statCell: {
    width: 28,
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  pointsCell: {
    width: 32,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  legend: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 16,
  },
  rankingContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    gap: 8,
  },
  rankingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  rankingInfo: {
    flex: 1,
  },
  rankingName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  rankingMatches: {
    fontSize: 12,
    color: '#6B7280',
  },
  rankingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankingValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
  },
  bottomSpacing: {
    height: 20,
  },
});