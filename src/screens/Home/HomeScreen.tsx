import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  Trophy,
  Calendar,
  TrendingUp,
  Users,
  ChevronRight,
  Clock,
  MapPin,
  DollarSign,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import { IMatch, ILeague, getSportIcon, getMatchStatusColor, SportType } from '../../types/types';
import { matchService } from '../../services/matchService';
import { leagueService } from '../../services/leagueService';

export const HomeScreen: React.FC = () => {
  const { user } = useAppContext();
  const navigation = useNavigationContext();
  
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<IMatch[]>([]);
  const [myLeagues, setMyLeagues] = useState<ILeague[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick stats
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalLeagues: 0,
    nextMatch: null as IMatch | null,
  });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Yaklaşan maçları getir
      const matches = await matchService.getMatchesByPlayer(user.id);
      const upcoming = matches
        .filter(m => new Date(m.matchStartTime) > new Date())
        .sort((a, b) => new Date(a.matchStartTime).getTime() - new Date(b.matchStartTime).getTime())
        .slice(0, 3);
      
      setUpcomingMatches(upcoming);

      // Liglerimi getir
      const leagues = await leagueService.getLeaguesByPlayer(user.id);
      setMyLeagues(leagues.slice(0, 3));

      // İstatistikleri hesapla
      setStats({
        totalMatches: matches.length,
        totalLeagues: leagues.length,
        nextMatch: upcoming[0] || null,
      });

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      weekday: 'short',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeBanner}>
        <View>
          <Text style={styles.welcomeText}>Merhaba,</Text>
          <Text style={styles.welcomeName}>{user?.name} 👋</Text>
        </View>
        {user?.favoriteSports && user.favoriteSports.length > 0 && (
          <View style={styles.favoriteSports}>
            {user.favoriteSports.slice(0, 2).map((sport:SportType, index:number) => (
              <Text key={index} style={styles.sportEmoji}>
                {getSportIcon(sport)}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Calendar size={24} color="#16a34a" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.totalMatches}</Text>
          <Text style={styles.statLabel}>Toplam Maç</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Trophy size={24} color="#F59E0B" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>{stats.totalLeagues}</Text>
          <Text style={styles.statLabel}>Lig</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <TrendingUp size={24} color="#2563EB" strokeWidth={2} />
          </View>
          <Text style={styles.statValue}>4.5</Text>
          <Text style={styles.statLabel}>Ortalama</Text>
        </View>
      </View>

      {/* Next Match Highlight */}
      {stats.nextMatch && (
        <TouchableOpacity
          style={styles.nextMatchCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('matchDetail', { matchId: stats.nextMatch!.id })}
        >
          <View style={styles.nextMatchHeader}>
            <View style={styles.nextMatchBadge}>
              <Text style={styles.nextMatchBadgeText}>Sonraki Maç</Text>
            </View>
            <Text style={styles.nextMatchEmoji}>
              {getSportIcon(myLeagues.find(l => l.id === stats.nextMatch?.fixtureId)?.sportType || 'Futbol')}
            </Text>
          </View>
          
          <Text style={styles.nextMatchTitle}>{stats.nextMatch.title}</Text>
          
          <View style={styles.nextMatchDetails}>
            <View style={styles.nextMatchDetailItem}>
              <Clock size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.nextMatchDetailText}>
                {formatDate(stats.nextMatch.matchStartTime)} • {formatTime(stats.nextMatch.matchStartTime)}
              </Text>
            </View>
            
            {stats.nextMatch.location && (
              <View style={styles.nextMatchDetailItem}>
                <MapPin size={16} color="#6B7280" strokeWidth={2} />
                <Text style={styles.nextMatchDetailText}>
                  {stats.nextMatch.location}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.nextMatchFooter}>
            <View style={styles.nextMatchPlayers}>
              <Users size={16} color="#16a34a" strokeWidth={2} />
              <Text style={styles.nextMatchPlayersText}>
                {stats.nextMatch.registeredPlayerIds.length} oyuncu kayıtlı
              </Text>
            </View>
            <ChevronRight size={20} color="#16a34a" strokeWidth={2} />
          </View>
        </TouchableOpacity>
      )}

      {/* Upcoming Matches */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yaklaşan Maçlar</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('myMatches')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {upcomingMatches.length > 0 ? (
          upcomingMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.matchCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('matchDetail', { matchId: match.id })}
            >
              <View style={styles.matchCardLeft}>
                <Text style={styles.matchEmoji}>
                  {getSportIcon(myLeagues.find(l => l.id === match.fixtureId)?.sportType || 'Futbol')}
                </Text>
                <View style={styles.matchCardInfo}>
                  <Text style={styles.matchCardTitle} numberOfLines={1}>
                    {match.title}
                  </Text>
                  <View style={styles.matchCardMeta}>
                    <Clock size={12} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.matchCardMetaText}>
                      {formatDate(match.matchStartTime)} • {formatTime(match.matchStartTime)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.matchCardRight}>
                <View
                  style={[
                    styles.matchStatusBadge,
                    { backgroundColor: getMatchStatusColor(match.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.matchStatusText,
                      { color: getMatchStatusColor(match.status) },
                    ]}
                  >
                    {match.status}
                  </Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyStateText}>Yaklaşan maç bulunmuyor</Text>
          </View>
        )}
      </View>

      {/* My Leagues */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Liglerim</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('leagueList')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {myLeagues.length > 0 ? (
          myLeagues.map((league) => (
            <TouchableOpacity
              key={league.id}
              style={styles.leagueCard}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('leagueDetail', { leagueId: league.id })}
            >
              <View style={styles.leagueCardLeft}>
                <Text style={styles.leagueEmoji}>{getSportIcon(league.sportType)}</Text>
                <View style={styles.leagueCardInfo}>
                  <Text style={styles.leagueCardTitle} numberOfLines={1}>
                    {league.title}
                  </Text>
                  <View style={styles.leagueCardMeta}>
                    <Users size={12} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.leagueCardMetaText}>
                      {league.playerIds.length} oyuncu
                    </Text>
                  </View>
                </View>
              </View>

              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyStateText}>Henüz bir lige katılmadınız</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('leagueList')}
            >
              <Text style={styles.emptyStateButtonText}>Ligleri Keşfet</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('standings')}
          activeOpacity={0.7}
        >
          <View style={styles.quickActionIcon}>
            <TrendingUp size={20} color="#16a34a" strokeWidth={2} />
          </View>
          <Text style={styles.quickActionText}>Puan Durumu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('playerStats')}
          activeOpacity={0.7}
        >
          <View style={styles.quickActionIcon}>
            <Trophy size={20} color="#F59E0B" strokeWidth={2} />
          </View>
          <Text style={styles.quickActionText}>İstatistiklerim</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  welcomeBanner: {
    backgroundColor: '#16a34a',
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  welcomeName: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
  },
  favoriteSports: {
    flexDirection: 'row',
    gap: 8,
  },
  sportEmoji: {
    fontSize: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextMatchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  nextMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextMatchBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  nextMatchBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextMatchEmoji: {
    fontSize: 32,
  },
  nextMatchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  nextMatchDetails: {
    gap: 8,
    marginBottom: 16,
  },
  nextMatchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextMatchDetailText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextMatchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextMatchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextMatchPlayersText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  matchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  matchEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  matchCardInfo: {
    flex: 1,
  },
  matchCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  matchCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchCardMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  matchCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  leagueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leagueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  leagueEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  leagueCardInfo: {
    flex: 1,
  },
  leagueCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  leagueCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leagueCardMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  bottomSpacing: {
    height: 20,
  },
});