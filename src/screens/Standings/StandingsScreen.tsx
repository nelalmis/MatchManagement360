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
  Target,
  Users,
  Medal,
  Zap,
  Award,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  ILeague,
  IMatch,
  IPlayerStats,
  getSportIcon,
  getSportColor,
  SportType,
  SPORT_CONFIGS,
} from '../../types/types';
import { leagueService } from '../../services/leagueService';
import { matchService } from '../../services/matchService';
import { playerStatsService } from '../../services/playerStatsService';
import { playerService } from '../../services/playerService';
import { NavigationService } from '../../navigation/NavigationService';

interface StandingPlayer {
  playerId: string;
  playerName: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  pointsFor: number; // Genel - futbol için gol, basketbol için sayı
  pointsAgainst: number;
  pointsDifference: number;
  points: number;
  form: string[];
  rank: number;
  previousRank?: number;
  // Sport-specific
  sets?: number; // Tenis, Voleybol
  aces?: number; // Tenis
  assists?: number; // Basketbol
  rebounds?: number; // Basketbol
}

type TabType = 'standings' | 'topScorers' | 'topAssists' | 'mvp';

// Sport-specific configurations
const getSportStatsConfig = (sportType: SportType) => {
  switch (sportType) {
    case 'Futbol':
      return {
        pointsLabel: 'Gol',
        showDraws: true,
        showAssists: true,
        columns: ['O', 'G', 'B', 'M', 'A', '+/-', 'P'],
        tabs: ['standings', 'topScorers', 'topAssists'] as TabType[],
      };
    case 'Basketbol':
      return {
        pointsLabel: 'Sayı',
        showDraws: false,
        showAssists: true,
        columns: ['O', 'G', 'M', 'S', '+/-', 'P'],
        tabs: ['standings', 'topScorers', 'topAssists'] as TabType[],
      };
    case 'Voleybol':
      return {
        pointsLabel: 'Set',
        showDraws: false,
        showAssists: false,
        columns: ['O', 'G', 'M', 'S', '+/-', 'P'],
        tabs: ['standings', 'topScorers'] as TabType[],
      };
    case 'Tenis':
      return {
        pointsLabel: 'Set',
        showDraws: false,
        showAssists: false,
        columns: ['O', 'G', 'M', 'S', '+/-', 'P'],
        tabs: ['standings', 'topScorers'] as TabType[],
      };
    default:
      return {
        pointsLabel: 'Puan',
        showDraws: true,
        showAssists: false,
        columns: ['O', 'G', 'B', 'M', 'P', '+/-', 'P'],
        tabs: ['standings', 'topScorers'] as TabType[],
      };
  }
};

export const StandingsScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const leagueId = route.params?.leagueId;

  const [league, setLeague] = useState<ILeague | null>(null);
  const [standings, setStandings] = useState<StandingPlayer[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topAssists, setTopAssists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('standings');

  // Sport-specific config
  const sportConfig = useMemo(() => 
    league ? getSportStatsConfig(league.sportType) : getSportStatsConfig('Futbol'),
    [league]
  );

  const sportColor = useMemo(() => 
    league ? getSportColor(league.sportType) : '#16a34a',
    [league]
  );

  useEffect(() => {
    if (leagueId) {
      loadData();
    }
  }, [leagueId]);

  const loadData = useCallback(async () => {
    if (!leagueId) {
      Alert.alert('Hata', 'Lig ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      // League data
      const leagueData = await leagueService.getById(leagueId);
      if (!leagueData) {
        Alert.alert('Hata', 'Lig bulunamadı');
        NavigationService.goBack();
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
          pointsFor: 0,
          pointsAgainst: 0,
          pointsDifference: 0,
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
          playerStandings[playerId].pointsFor += team1Score;
          playerStandings[playerId].pointsAgainst += team2Score;

          if (team1Score > team2Score) {
            playerStandings[playerId].won++;
            playerStandings[playerId].points += 3;
            playerStandings[playerId].form.push('W');
          } else if (team1Score === team2Score && sportConfig.showDraws) {
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
          playerStandings[playerId].pointsFor += team2Score;
          playerStandings[playerId].pointsAgainst += team1Score;

          if (team2Score > team1Score) {
            playerStandings[playerId].won++;
            playerStandings[playerId].points += 3;
            playerStandings[playerId].form.push('W');
          } else if (team2Score === team1Score && sportConfig.showDraws) {
            playerStandings[playerId].draw++;
            playerStandings[playerId].points += 1;
            playerStandings[playerId].form.push('D');
          } else {
            playerStandings[playerId].lost++;
            playerStandings[playerId].form.push('L');
          }
        }
      }

      // Calculate difference and get player names
      const standingsArray: StandingPlayer[] = [];
      for (const [playerId, data] of Object.entries(playerStandings)) {
        const player = await playerService.getById(playerId);
        data.playerName = player ? `${player.name} ${player.surname}` : 'Bilinmeyen';
        data.pointsDifference = data.pointsFor - data.pointsAgainst;
        data.form = data.form.slice(-5);
        standingsArray.push(data);
      }

      // Sort
      standingsArray.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pointsDifference !== a.pointsDifference) return b.pointsDifference - a.pointsDifference;
        return b.pointsFor - a.pointsFor;
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

      for (const scorer of scorers) {
        const player = await playerService.getById(scorer.playerId);
        scorer.playerName = player ? `${player.name} ${player.surname}` : 'Bilinmeyen';
      }
      setTopScorers(scorers);

      // Top assists (if applicable)
      if (sportConfig.showAssists) {
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

        for (const assister of assisters) {
          const player = await playerService.getById(assister.playerId);
          assister.playerName = player ? `${player.name} ${player.surname}` : 'Bilinmeyen';
        }
        setTopAssists(assisters);
      }

    } catch (error) {
      console.error('Error loading standings:', error);
      Alert.alert('Hata', 'Puan durumu yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [leagueId, sportConfig]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getFormColor = useCallback((result: string) => {
    if (result === 'W') return '#10B981';
    if (result === 'D') return '#F59E0B';
    return '#DC2626';
  }, []);

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
      {/* Sport Header */}
      <View style={[styles.sportHeader, { backgroundColor: sportColor }]}>
        <Text style={styles.sportIcon}>{getSportIcon(league.sportType)}</Text>
        <View style={styles.sportHeaderInfo}>
          <Text style={styles.sportHeaderTitle}>{league.title}</Text>
          <Text style={styles.sportHeaderSubtitle}>
            {SPORT_CONFIGS[league.sportType]?.name} • {league.playerIds.length} Oyuncu
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {sportConfig.tabs.includes('standings') && (
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'standings' && { ...styles.tabActive, borderBottomColor: sportColor }
            ]}
            onPress={() => setSelectedTab('standings')}
            activeOpacity={0.7}
          >
            <Trophy 
              size={18} 
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
        )}

        {sportConfig.tabs.includes('topScorers') && (
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'topScorers' && { ...styles.tabActive, borderBottomColor: sportColor }
            ]}
            onPress={() => setSelectedTab('topScorers')}
            activeOpacity={0.7}
          >
            <Target 
              size={18} 
              color={selectedTab === 'topScorers' ? sportColor : '#6B7280'} 
              strokeWidth={2} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === 'topScorers' && { ...styles.tabTextActive, color: sportColor }
            ]}>
              {sportConfig.pointsLabel} Krallığı
            </Text>
          </TouchableOpacity>
        )}

        {sportConfig.tabs.includes('topAssists') && (
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'topAssists' && { ...styles.tabActive, borderBottomColor: sportColor }
            ]}
            onPress={() => setSelectedTab('topAssists')}
            activeOpacity={0.7}
          >
            <Users 
              size={18} 
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
        )}
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.headerCell, styles.rankCellWidth]}>#</Text>
                  <Text style={[styles.headerCell, styles.playerCellWidth]}>Oyuncu</Text>
                  {sportConfig.columns.map((col, idx) => (
                    <Text key={idx} style={[styles.headerCell, styles.statCellWidth]}>
                      {col}
                    </Text>
                  ))}
                </View>

                {/* Table Rows */}
                {standings.map((player, index) => {
                  const isCurrentUser = player.playerId === user?.id;

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
                      <View style={styles.rankCellWidth}>
                        <View style={styles.rankContent}>
                          <Text style={[
                            styles.rankText,
                            index < 3 && { color: sportColor, fontWeight: '700' }
                          ]}>
                            {player.rank}
                          </Text>
                          {index < 3 && (
                            <Medal size={10} color={sportColor} strokeWidth={2} />
                          )}
                        </View>
                      </View>

                      {/* Player Name */}
                      <View style={styles.playerCellWidth}>
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
                      <Text style={styles.statCellWidth}>{player.played}</Text>
                      <Text style={styles.statCellWidth}>{player.won}</Text>
                      {sportConfig.showDraws && (
                        <Text style={styles.statCellWidth}>{player.draw}</Text>
                      )}
                      <Text style={styles.statCellWidth}>{player.lost}</Text>
                      <Text style={styles.statCellWidth}>{player.pointsFor}</Text>
                      <Text style={[
                        styles.statCellWidth,
                        player.pointsDifference > 0 && { color: '#10B981' },
                        player.pointsDifference < 0 && { color: '#DC2626' },
                      ]}>
                        {player.pointsDifference > 0 ? '+' : ''}{player.pointsDifference}
                      </Text>
                      <Text style={[styles.pointsCellWidth, { color: sportColor }]}>
                        {player.points}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {standings.length === 0 && (
              <View style={styles.emptyState}>
                <Trophy size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyText}>Henüz puan durumu oluşmadı</Text>
              </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
              <Text style={styles.legendTitle}>Kısaltmalar:</Text>
              <Text style={styles.legendText}>
                O: Oynanan, G: Galibiyet
                {sportConfig.showDraws && ', B: Beraberlik'}
                , M: Mağlubiyet
              </Text>
              <Text style={styles.legendText}>
                {sportConfig.pointsLabel.charAt(0)}: {sportConfig.pointsLabel}, +/-: Averaj, P: Puan
              </Text>
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
                <Text style={styles.emptyText}>Henüz {sportConfig.pointsLabel.toLowerCase()} atılmadı</Text>
              </View>
            )}
          </View>
        )}

        {/* Top Assists Tab */}
        {selectedTab === 'topAssists' && sportConfig.showAssists && (
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
  sportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  sportIcon: {
    fontSize: 40,
  },
  sportHeaderInfo: {
    flex: 1,
  },
  sportHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  sportHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContent: {
    // Removed - not needed anymore
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
  rankCellWidth: {
    width: 50,
  },
  rankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  playerCellWidth: {
    width: 140,
    marginRight: 8,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  formContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  formBadge: {
    width: 14,
    height: 14,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'white',
  },
  statCellWidth: {
    width: 32,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  pointsCellWidth: {
    width: 36,
    fontSize: 14,
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