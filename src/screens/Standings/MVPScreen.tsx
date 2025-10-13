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
  Image,
} from 'react-native';
import {
  Award,
  Trophy,
  TrendingUp,
  Star,
  Zap,
  Target,
  Users,
  Crown,
  Flame,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  ILeague,
  IMatch,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { leagueService } from '../../services/leagueService';
import { matchService } from '../../services/matchService';
import { playerService } from '../../services/playerService';
import { playerStatsService } from '../../services/playerStatsService';
import { NavigationService } from '../../navigation/NavigationService';

interface MVPPlayer {
  playerId: string;
  playerName: string;
  mvpCount: number;
  totalMatches: number;
  averageRating: number;
  totalGoals: number;
  totalAssists: number;
  mvpPercentage: number;
  form: string[];
}

export const MVPScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const leagueId = route.params?.leagueId;

  const [league, setLeague] = useState<ILeague | null>(null);
  const [mvpPlayers, setMvpPlayers] = useState<MVPPlayer[]>([]);
  const [recentMVPs, setRecentMVPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

      // Get all completed matches
      const matches = await matchService.getMatchesByLeague(leagueId);
      const completedMatches = matches.filter(m => 
        m.status === 'Tamamlandı' && m.playerIdOfMatchMVP
      );

      // Get player stats
      const allPlayerStats = await playerStatsService.getStatsByLeague(leagueId);

      // Calculate MVP stats
      const mvpStats: Record<string, MVPPlayer> = {};

      for (const match of completedMatches) {
        const mvpId = match.playerIdOfMatchMVP!;
        
        if (!mvpStats[mvpId]) {
          const player = await playerService.getById(mvpId);
          const playerStat = allPlayerStats.find(s => s.playerId === mvpId);
          
          mvpStats[mvpId] = {
            playerId: mvpId,
            playerName: player ? `${player.name} ${player.surname}` : 'Bilinmeyen',
            mvpCount: 0,
            totalMatches: playerStat?.totalMatches || 0,
            averageRating: playerStat?.rating || 0,
            totalGoals: playerStat?.totalGoals || 0,
            totalAssists: playerStat?.totalAssists || 0,
            mvpPercentage: 0,
            form: [],
          };
        }
        
        mvpStats[mvpId].mvpCount++;
      }

      // Calculate MVP percentage
      const mvpArray: MVPPlayer[] = Object.values(mvpStats).map(player => ({
        ...player,
        mvpPercentage: player.totalMatches > 0 
          ? parseFloat(((player.mvpCount / player.totalMatches) * 100).toFixed(1))
          : 0,
      }));

      // Sort by MVP count, then by percentage
      mvpArray.sort((a, b) => {
        if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
        return b.mvpPercentage - a.mvpPercentage;
      });

      setMvpPlayers(mvpArray);

      // Recent MVPs (last 10 matches)
      const recentMatches = completedMatches
        .sort((a, b) => new Date(b.matchStartTime).getTime() - new Date(a.matchStartTime).getTime())
        .slice(0, 10);

      const recentMVPsData = await Promise.all(
        recentMatches.map(async (match) => {
          const player = await playerService.getById(match.playerIdOfMatchMVP!);
          return {
            matchId: match.id,
            matchTitle: match.title,
            matchDate: match.matchStartTime,
            playerId: match.playerIdOfMatchMVP,
            playerName: player ? `${player.name} ${player.surname}` : 'Bilinmeyen',
            score: match.score,
          };
        })
      );

      setRecentMVPs(recentMVPsData);

    } catch (error) {
      console.error('Error loading MVP data:', error);
      Alert.alert('Hata', 'MVP verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
    });
  }, []);

  const getMedalEmoji = (rank: number) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return null;
  };

  if (loading || !league) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>MVP verileri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: sportColor }]}>
        <View style={styles.headerContent}>
          <Crown size={32} color="white" strokeWidth={2.5} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>En Değerli Oyuncular</Text>
            <Text style={styles.headerSubtitle}>{league.title}</Text>
          </View>
        </View>
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
        {/* Top 3 MVPs - Podium Style */}
        {mvpPlayers.length > 0 && (
          <View style={styles.podiumSection}>
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              {mvpPlayers[1] && (
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumRank, styles.podiumSecond]}>
                    <Text style={styles.podiumMedal}>🥈</Text>
                    <View style={styles.podiumAvatar}>
                      <Text style={styles.podiumAvatarText}>
                        {mvpPlayers[1].playerName[0]}
                      </Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {mvpPlayers[1].playerName}
                    </Text>
                    <View style={styles.podiumStats}>
                      <Crown size={16} color="#9CA3AF" strokeWidth={2} />
                      <Text style={styles.podiumValue}>{mvpPlayers[1].mvpCount}</Text>
                    </View>
                    <Text style={styles.podiumPercentage}>
                      {mvpPlayers[1].mvpPercentage}%
                    </Text>
                  </View>
                  <View style={[styles.podiumBase, styles.podiumBaseSecond]} />
                </View>
              )}

              {/* 1st Place */}
              <View style={styles.podiumItem}>
                <View style={[styles.podiumRank, styles.podiumFirst]}>
                  <Text style={styles.podiumMedal}>🥇</Text>
                  <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
                    <Crown size={20} color="#F59E0B" strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                    {mvpPlayers[0].playerName}
                  </Text>
                  <View style={styles.podiumStats}>
                    <Crown size={18} color="#F59E0B" strokeWidth={2.5} />
                    <Text style={[styles.podiumValue, styles.podiumValueFirst]}>
                      {mvpPlayers[0].mvpCount}
                    </Text>
                  </View>
                  <Text style={[styles.podiumPercentage, styles.podiumPercentageFirst]}>
                    {mvpPlayers[0].mvpPercentage}%
                  </Text>
                </View>
                <View style={[styles.podiumBase, styles.podiumBaseFirst]} />
              </View>

              {/* 3rd Place */}
              {mvpPlayers[2] && (
                <View style={styles.podiumItem}>
                  <View style={[styles.podiumRank, styles.podiumThird]}>
                    <Text style={styles.podiumMedal}>🥉</Text>
                    <View style={styles.podiumAvatar}>
                      <Text style={styles.podiumAvatarText}>
                        {mvpPlayers[2].playerName[0]}
                      </Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {mvpPlayers[2].playerName}
                    </Text>
                    <View style={styles.podiumStats}>
                      <Crown size={16} color="#9CA3AF" strokeWidth={2} />
                      <Text style={styles.podiumValue}>{mvpPlayers[2].mvpCount}</Text>
                    </View>
                    <Text style={styles.podiumPercentage}>
                      {mvpPlayers[2].mvpPercentage}%
                    </Text>
                  </View>
                  <View style={[styles.podiumBase, styles.podiumBaseThird]} />
                </View>
              )}
            </View>
          </View>
        )}

        {/* All MVP Rankings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tüm Sıralama</Text>
          
          {mvpPlayers.map((player, index) => {
            const isCurrentUser = player.playerId === user?.id;
            const medal = getMedalEmoji(index);

            return (
              <View 
                key={player.playerId}
                style={[
                  styles.mvpCard,
                  isCurrentUser && styles.currentUserCard,
                  index < 3 && styles.topThreeCard,
                ]}
              >
                <View style={styles.mvpCardLeft}>
                  <View style={[
                    styles.rankBadge,
                    index < 3 && { backgroundColor: sportColor }
                  ]}>
                    {medal ? (
                      <Text style={styles.rankMedal}>{medal}</Text>
                    ) : (
                      <Text style={[
                        styles.rankText,
                        index < 3 && { color: 'white' }
                      ]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>

                  <View style={styles.mvpCardInfo}>
                    <Text style={styles.mvpCardName}>{player.playerName}</Text>
                    <View style={styles.mvpCardStats}>
                      <View style={styles.statBadge}>
                        <Trophy size={12} color={sportColor} strokeWidth={2} />
                        <Text style={styles.statBadgeText}>
                          {player.mvpCount} MVP
                        </Text>
                      </View>
                      <View style={styles.statBadge}>
                        <Star size={12} color="#F59E0B" strokeWidth={2} />
                        <Text style={styles.statBadgeText}>
                          {player.averageRating.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.mvpCardRight}>
                  <View style={styles.percentageCircle}>
                    <Text style={[styles.percentageText, { color: sportColor }]}>
                      {player.mvpPercentage}%
                    </Text>
                  </View>
                  <Text style={styles.matchesText}>
                    {player.totalMatches} maç
                  </Text>
                </View>
              </View>
            );
          })}

          {mvpPlayers.length === 0 && (
            <View style={styles.emptyState}>
              <Award size={64} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyText}>Henüz MVP seçilmedi</Text>
            </View>
          )}
        </View>

        {/* Recent MVPs */}
        {recentMVPs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Son MVP'ler</Text>
            
            {recentMVPs.map((mvp, index) => (
              <TouchableOpacity
                key={mvp.matchId}
                style={styles.recentMVPCard}
                onPress={() => NavigationService.navigateToMatch(mvp.matchId )}
                activeOpacity={0.7}
              >
                <View style={styles.recentMVPLeft}>
                  <View style={styles.recentMVPRank}>
                    <Award size={20} color={sportColor} strokeWidth={2} />
                  </View>
                  <View style={styles.recentMVPInfo}>
                    <Text style={styles.recentMVPName}>{mvp.playerName}</Text>
                    <Text style={styles.recentMVPMatch}>{mvp.matchTitle}</Text>
                    <Text style={styles.recentMVPDate}>
                      {formatDate(mvp.matchDate)} • {mvp.score}
                    </Text>
                  </View>
                </View>
                <Flame size={20} color="#F59E0B" strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats Info */}
        <View style={styles.infoCard}>
          <Zap size={20} color={sportColor} strokeWidth={2} />
          <Text style={styles.infoText}>
            MVP yüzdesi, oyuncunun katıldığı maçların kaçında MVP seçildiğini gösterir.
          </Text>
        </View>

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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  podiumSection: {
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
  },
  podiumRank: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
  },
  podiumFirst: {
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  podiumSecond: {
    opacity: 0.9,
  },
  podiumThird: {
    opacity: 0.85,
  },
  podiumMedal: {
    fontSize: 32,
    marginBottom: 8,
  },
  podiumAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  podiumAvatarFirst: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEF3C7',
  },
  podiumAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  podiumNameFirst: {
    fontSize: 15,
    fontWeight: '700',
  },
  podiumStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  podiumValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  podiumValueFirst: {
    fontSize: 20,
    color: '#F59E0B',
  },
  podiumPercentage: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  podiumPercentageFirst: {
    fontSize: 12,
    color: '#F59E0B',
  },
  podiumBase: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumBaseFirst: {
    height: 80,
    backgroundColor: '#FEF3C7',
  },
  podiumBaseSecond: {
    height: 60,
  },
  podiumBaseThird: {
    height: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  mvpCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: '#16a34a',
    backgroundColor: '#F0FDF4',
  },
  topThreeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  mvpCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankMedal: {
    fontSize: 20,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  mvpCardInfo: {
    flex: 1,
  },
  mvpCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  mvpCardStats: {
    flexDirection: 'row',
    gap: 8,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  mvpCardRight: {
    alignItems: 'center',
  },
  percentageCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  matchesText: {
    fontSize: 11,
    color: '#6B7280',
  },
  recentMVPCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recentMVPLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentMVPRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentMVPInfo: {
    flex: 1,
  },
  recentMVPName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 3,
  },
  recentMVPMatch: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  recentMVPDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
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