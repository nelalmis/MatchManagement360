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
  User,
  Trophy,
  Target,
  Users,
  Award,
  TrendingUp,
  Calendar,
  Edit,
  Star,
  Zap,
  BarChart3,
  Crown,
  Mail,
  Phone,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  IPlayer,
  IPlayerStats,
  getSportIcon,
  getSportColor,
  SportType,
} from '../../types/types';
import { playerService } from '../../services/playerService';
import { playerStatsService } from '../../services/playerStatsService';
import { matchService } from '../../services/matchService';
import { NavigationService } from '../../navigation/NavigationService';

interface CareerStats {
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  totalWins: number;
  totalMVPs: number;
  averageRating: number;
}

interface LeagueStats {
  leagueId: string;
  leagueName: string;
  sportType: SportType;
  stats: IPlayerStats;
}

export const PlayerProfileScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const playerId = route.params?.playerId || user?.id;

  const [player, setPlayer] = useState<IPlayer | null>(null);
  const [careerStats, setCareerStats] = useState<CareerStats | null>(null);
  const [leagueStats, setLeagueStats] = useState<LeagueStats[]>([]);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isOwnProfile = useMemo(() => playerId === user?.id, [playerId, user]);

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

      // Career stats
      const career = await playerStatsService.getPlayerCareerStats(playerId);
      setCareerStats(career);

      // League stats
      const allStats = await playerStatsService.getStatsByPlayer(playerId);
      // TODO: Add league names
      const leagueStatsData: LeagueStats[] = allStats.map(stat => ({
        leagueId: stat.leagueId,
        leagueName: 'Lig Adı', // TODO: Fetch from leagueService
        sportType: 'Futbol' as SportType, // TODO: Fetch from leagueService
        stats: stat,
      }));
      setLeagueStats(leagueStatsData);

      // Recent matches
      const matches = await matchService.getMatchesByPlayer(playerId);
      const completed = matches
        .filter(m => m.status === 'Tamamlandı')
        .sort((a, b) => new Date(b.matchStartTime).getTime() - new Date(a.matchStartTime).getTime())
        .slice(0, 5);
      setRecentMatches(completed);

    } catch (error) {
      console.error('Error loading player profile:', error);
      Alert.alert('Hata', 'Profil yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleEditProfile = useCallback(() => {
    NavigationService.navigateToEditProfile();
  }, []);

  const handleViewStats = useCallback(() => {
    NavigationService.navigateToPlayerStats(playerId);
  }, [playerId]);

  const handleViewMatches = useCallback(() => {
    NavigationService.navigateToMyMatches();
  }, [playerId]);

  const formatDate = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, []);

  const calculateAge = useCallback((birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  if (loading || !player) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Profil yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <User size={48} color="white" strokeWidth={2} />
            </View>
            {isOwnProfile && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
                activeOpacity={0.7}
              >
                <Edit size={16} color="white" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.playerName}>
              {player.name} {player.surname}
            </Text>
            {player.jerseyNumber && (
              <View style={styles.jerseyBadge}>
                <Text style={styles.jerseyNumber}>#{player.jerseyNumber}</Text>
              </View>
            )}
          </View>

          {player.birthDate && (
            <Text style={styles.playerAge}>
              {calculateAge(player.birthDate)} yaş
            </Text>
          )}

          {/* Contact Info */}
          <View style={styles.contactInfo}>
            {player.email && (
              <View style={styles.contactItem}>
                <Mail size={14} color="#6B7280" strokeWidth={2} />
                <Text style={styles.contactText}>{player.email}</Text>
              </View>
            )}
            {player.phone && (
              <View style={styles.contactItem}>
                <Phone size={14} color="#6B7280" strokeWidth={2} />
                <Text style={styles.contactText}>{player.phone}</Text>
              </View>
            )}
          </View>

          {/* Favorite Sports */}
          {player.favoriteSports && player.favoriteSports.length > 0 && (
            <View style={styles.sportsContainer}>
              {player.favoriteSports.map((sport, index) => (
                <View
                  key={index}
                  style={[styles.sportBadge, { backgroundColor: getSportColor(sport) + '20' }]}
                >
                  <Text style={styles.sportEmoji}>{getSportIcon(sport)}</Text>
                  <Text style={[styles.sportText, { color: getSportColor(sport) }]}>
                    {sport}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Career Stats */}
        {careerStats && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Trophy size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Kariyer İstatistikleri</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Calendar size={20} color="#3B82F6" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{careerStats.totalMatches}</Text>
                <Text style={styles.statLabel}>Maç</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Target size={20} color="#EF4444" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{careerStats.totalGoals}</Text>
                <Text style={styles.statLabel}>Gol</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Users size={20} color="#10B981" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{careerStats.totalAssists}</Text>
                <Text style={styles.statLabel}>Asist</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Trophy size={20} color="#F59E0B" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{careerStats.totalWins}</Text>
                <Text style={styles.statLabel}>Galibiyet</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Crown size={20} color="#8B5CF6" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>{careerStats.totalMVPs}</Text>
                <Text style={styles.statLabel}>MVP</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Star size={20} color="#F59E0B" strokeWidth={2} />
                </View>
                <Text style={styles.statValue}>
                  {careerStats.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>Ortalama</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        {/* <View style={styles.section}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleViewStats}
              activeOpacity={0.7}
            >
              <BarChart3 size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Detaylı İstatistikler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleViewMatches}
              activeOpacity={0.7}
            >
              <Calendar size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Geçmiş Maçlar</Text>
            </TouchableOpacity>
          </View>
        </View> */}

        {/* League Stats */}
        {leagueStats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Award size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Lig Performansı</Text>
            </View>

            {leagueStats.map((league, index) => (
              <View key={index} style={styles.leagueCard}>
                <View style={styles.leagueCardHeader}>
                  <View style={styles.leagueCardLeft}>
                    <Text style={styles.sportEmoji}>{getSportIcon(league.sportType)}</Text>
                    <Text style={styles.leagueCardTitle}>{league.leagueName}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => NavigationService.navigateToStandings(league.leagueId)}
                    activeOpacity={0.7}
                  >
                    <TrendingUp size={20} color="#16a34a" strokeWidth={2} />
                  </TouchableOpacity>
                </View>

                <View style={styles.leagueStatsRow}>
                  <View style={styles.leagueStat}>
                    <Text style={styles.leagueStatValue}>{league.stats.totalMatches}</Text>
                    <Text style={styles.leagueStatLabel}>Maç</Text>
                  </View>
                  <View style={styles.leagueStat}>
                    <Text style={styles.leagueStatValue}>{league.stats.totalGoals}</Text>
                    <Text style={styles.leagueStatLabel}>Gol</Text>
                  </View>
                  <View style={styles.leagueStat}>
                    <Text style={styles.leagueStatValue}>{league.stats.totalAssists}</Text>
                    <Text style={styles.leagueStatLabel}>Asist</Text>
                  </View>
                  <View style={styles.leagueStat}>
                    <Text style={[styles.leagueStatValue, { color: '#16a34a' }]}>
                      {league.stats.points}
                    </Text>
                    <Text style={styles.leagueStatLabel}>Puan</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Son Maçlar</Text>
            </View>

            {recentMatches.map((match) => {
              const isInTeam1 = match.team1PlayerIds?.includes(playerId);
              const playerGoals = match.goalScorers?.find((g: any) => g.playerId === playerId);

              return (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchCard}
                  onPress={() => NavigationService.navigateToMatch(match.id )}
                  activeOpacity={0.7}
                >
                  <View style={styles.matchCardHeader}>
                    <Text style={styles.matchTitle}>{match.title}</Text>
                    <Text style={styles.matchDate}>{formatDate(match.matchStartTime)}</Text>
                  </View>

                  <View style={styles.matchScore}>
                    <Text style={[styles.scoreText, isInTeam1 && styles.playerTeam]}>
                      Takım 1
                    </Text>
                    <Text style={styles.score}>{match.score || '0-0'}</Text>
                    <Text style={[styles.scoreText, !isInTeam1 && styles.playerTeam]}>
                      Takım 2
                    </Text>
                  </View>

                  {playerGoals && (playerGoals.goals > 0 || playerGoals.assists > 0) && (
                    <View style={styles.playerPerformance}>
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

                  {match.playerIdOfMatchMVP === playerId && (
                    <View style={styles.mvpBadge}>
                      <Crown size={14} color="#F59E0B" strokeWidth={2} />
                      <Text style={styles.mvpText}>MVP</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={handleViewMatches}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>Tüm Maçları Gör</Text>
              <TrendingUp size={16} color="#16a34a" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {!careerStats?.totalMatches && (
          <View style={styles.emptyState}>
            <Trophy size={64} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyText}>Henüz maç oynamamış</Text>
            <Text style={styles.emptySubtext}>
              İlk maçına katıldığında istatistiklerin burada görünecek
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
  header: {
    backgroundColor: 'white',
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  jerseyBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jerseyNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  playerAge: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  contactInfo: {
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  contactText: {
    fontSize: 13,
    color: '#6B7280',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  sportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sportEmoji: {
    fontSize: 16,
  },
  sportText: {
    fontSize: 13,
    fontWeight: '600',
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  leagueCard: {
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
  leagueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leagueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  leagueCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  leagueStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  leagueStat: {
    alignItems: 'center',
  },
  leagueStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  leagueStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  matchCard: {
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
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  matchDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  matchScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  playerTeam: {
    color: '#16a34a',
    fontWeight: '700',
  },
  score: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  playerPerformance: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
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
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  mvpText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginTop: 4,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    height: 20,
  },
});