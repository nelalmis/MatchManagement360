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
  TextInput,
} from 'react-native';
import {
  Users,
  Trophy,
  TrendingUp,
  Zap,
  Target,
  Sparkles,
  Search,
  BarChart3,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  ILeague,
  getSportIcon,
  getSportColor,
  SPORT_CONFIGS,
} from '../../types/types';
import { leagueService } from '../../services/leagueService';
import { playerStatsService } from '../../services/playerStatsService';
import { playerService } from '../../services/playerService';
import { NavigationService } from '../../navigation/NavigationService';

interface TopAssister {
  playerId: string;
  playerName: string;
  totalAssists: number;
  totalMatches: number;
  averageAssistsPerMatch: number;
  totalGoals: number;
  points: number;
  rank: number;
}

export const TopAssistsScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const leagueId = route.params?.leagueId;

  const [league, setLeague] = useState<ILeague | null>(null);
  const [assisters, setAssisters] = useState<TopAssister[]>([]);
  const [filteredAssisters, setFilteredAssisters] = useState<TopAssister[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sportColor = useMemo(() => 
    league ? getSportColor(league.sportType) : '#10B981',
    [league]
  );

  const sportConfig = useMemo(() => 
    league ? SPORT_CONFIGS[league.sportType] : SPORT_CONFIGS['Futbol'],
    [league]
  );

  useEffect(() => {
    if (leagueId) {
      loadData();
    }
  }, [leagueId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAssisters(assisters);
    } else {
      const filtered = assisters.filter(assister =>
        assister.playerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAssisters(filtered);
    }
  }, [searchQuery, assisters]);

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

      // Get player stats
      const allPlayerStats = await playerStatsService.getStatsByLeague(leagueId);

      // Build assisters array
      const assistersData: TopAssister[] = [];

      for (const stat of allPlayerStats) {
        if (stat.totalAssists > 0) {
          const player = await playerService.getById(stat.playerId);
          
          assistersData.push({
            playerId: stat.playerId,
            playerName: player ? `${player.name} ${player.surname}` : 'Bilinmeyen',
            totalAssists: stat.totalAssists,
            totalMatches: stat.totalMatches,
            averageAssistsPerMatch: stat.averageAssistsPerMatch || 0,
            totalGoals: stat.totalGoals || 0,
            points: stat.points || 0,
            rank: 0,
          });
        }
      }

      // Sort by total assists
      assistersData.sort((a, b) => {
        if (b.totalAssists !== a.totalAssists) return b.totalAssists - a.totalAssists;
        if (b.averageAssistsPerMatch !== a.averageAssistsPerMatch) return b.averageAssistsPerMatch - a.averageAssistsPerMatch;
        return b.totalGoals - a.totalGoals;
      });

      // Assign ranks
      assistersData.forEach((assister, index) => {
        assister.rank = index + 1;
      });

      setAssisters(assistersData);
      setFilteredAssisters(assistersData);

    } catch (error) {
      console.error('Error loading top assisters:', error);
      Alert.alert('Hata', 'Asist krallığı verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [leagueId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const handlePlayerPress = useCallback((playerId: string) => {
    NavigationService.navigateToPlayer(playerId );
  }, []);

  if (loading || !league) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Asist krallığı yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: sportColor }]}>
        <View style={styles.headerContent}>
          <Users size={32} color="white" strokeWidth={2.5} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Asist Krallığı</Text>
            <Text style={styles.headerSubtitle}>{league.title}</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Oyuncu ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
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
        {/* Top 3 Podium */}
        {filteredAssisters.length >= 3 && searchQuery === '' && (
          <View style={styles.podiumSection}>
            <View style={styles.podiumContainer}>
              {/* 2nd Place */}
              <TouchableOpacity
                style={styles.podiumItem}
                onPress={() => handlePlayerPress(filteredAssisters[1].playerId)}
                activeOpacity={0.7}
              >
                <View style={[styles.podiumRank, styles.podiumSecond]}>
                  <Text style={styles.podiumMedal}>🥈</Text>
                  <View style={styles.podiumAvatar}>
                    <Text style={styles.podiumAvatarText}>
                      {filteredAssisters[1].playerName[0]}
                    </Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {filteredAssisters[1].playerName}
                  </Text>
                  <View style={styles.podiumStats}>
                    <Users size={16} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.podiumValue}>{filteredAssisters[1].totalAssists}</Text>
                  </View>
                  <Text style={styles.podiumPercentage}>
                    {filteredAssisters[1].averageAssistsPerMatch.toFixed(1)}/maç
                  </Text>
                </View>
                <View style={[styles.podiumBase, styles.podiumBaseSecond]} />
              </TouchableOpacity>

              {/* 1st Place */}
              <TouchableOpacity
                style={styles.podiumItem}
                onPress={() => handlePlayerPress(filteredAssisters[0].playerId)}
                activeOpacity={0.7}
              >
                <View style={[styles.podiumRank, styles.podiumFirst]}>
                  <Text style={styles.podiumMedal}>🥇</Text>
                  <View style={[styles.podiumAvatar, styles.podiumAvatarFirst]}>
                    <Sparkles size={20} color="#10B981" strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>
                    {filteredAssisters[0].playerName}
                  </Text>
                  <View style={styles.podiumStats}>
                    <Users size={18} color="#10B981" strokeWidth={2.5} />
                    <Text style={[styles.podiumValue, styles.podiumValueFirst]}>
                      {filteredAssisters[0].totalAssists}
                    </Text>
                  </View>
                  <Text style={[styles.podiumPercentage, styles.podiumPercentageFirst]}>
                    {filteredAssisters[0].averageAssistsPerMatch.toFixed(1)}/maç
                  </Text>
                </View>
                <View style={[styles.podiumBase, styles.podiumBaseFirst]} />
              </TouchableOpacity>

              {/* 3rd Place */}
              <TouchableOpacity
                style={styles.podiumItem}
                onPress={() => handlePlayerPress(filteredAssisters[2].playerId)}
                activeOpacity={0.7}
              >
                <View style={[styles.podiumRank, styles.podiumThird]}>
                  <Text style={styles.podiumMedal}>🥉</Text>
                  <View style={styles.podiumAvatar}>
                    <Text style={styles.podiumAvatarText}>
                      {filteredAssisters[2].playerName[0]}
                    </Text>
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>
                    {filteredAssisters[2].playerName}
                  </Text>
                  <View style={styles.podiumStats}>
                    <Users size={16} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.podiumValue}>{filteredAssisters[2].totalAssists}</Text>
                  </View>
                  <Text style={styles.podiumPercentage}>
                    {filteredAssisters[2].averageAssistsPerMatch.toFixed(1)}/maç
                  </Text>
                </View>
                <View style={[styles.podiumBase, styles.podiumBaseThird]} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* All Assisters List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Arama Sonuçları' : 'Tüm Sıralama'}
            </Text>
            <View style={styles.sectionBadge}>
              <BarChart3 size={14} color={sportColor} strokeWidth={2} />
              <Text style={[styles.sectionBadgeText, { color: sportColor }]}>
                {filteredAssisters.length}
              </Text>
            </View>
          </View>

          {filteredAssisters.map((assister) => {
            const isCurrentUser = assister.playerId === user?.id;
            const medal = getMedalEmoji(assister.rank);

            return (
              <TouchableOpacity
                key={assister.playerId}
                style={[
                  styles.assisterCard,
                  isCurrentUser && styles.currentUserCard,
                  assister.rank <= 3 && styles.topThreeCard,
                ]}
                onPress={() => handlePlayerPress(assister.playerId)}
                activeOpacity={0.7}
              >
                <View style={styles.assisterCardLeft}>
                  <View style={[
                    styles.rankBadge,
                    assister.rank <= 3 && { backgroundColor: sportColor }
                  ]}>
                    {medal ? (
                      <Text style={styles.rankMedal}>{medal}</Text>
                    ) : (
                      <Text style={[
                        styles.rankText,
                        assister.rank <= 3 && { color: 'white' }
                      ]}>
                        {assister.rank}
                      </Text>
                    )}
                  </View>

                  <View style={styles.assisterCardInfo}>
                    <Text style={styles.assisterCardName}>{assister.playerName}</Text>
                    <View style={styles.assisterCardStats}>
                      <View style={styles.statBadge}>
                        <Trophy size={12} color="#F59E0B" strokeWidth={2} />
                        <Text style={styles.statBadgeText}>
                          {assister.totalMatches} maç
                        </Text>
                      </View>
                      {assister.totalGoals > 0 && (
                        <View style={styles.statBadge}>
                          <Target size={12} color="#EF4444" strokeWidth={2} />
                          <Text style={styles.statBadgeText}>
                            {assister.totalGoals} gol
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.assisterCardRight}>
                  <View style={[styles.assistsCircle, { borderColor: sportColor }]}>
                    <Users size={18} color={sportColor} strokeWidth={2} />
                    <Text style={[styles.assistsText, { color: sportColor }]}>
                      {assister.totalAssists}
                    </Text>
                  </View>
                  <Text style={styles.averageText}>
                    {assister.averageAssistsPerMatch.toFixed(1)}/maç
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}

          {filteredAssisters.length === 0 && (
            <View style={styles.emptyState}>
              <Users size={64} color="#D1D5DB" strokeWidth={1.5} />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Oyuncu bulunamadı' : 'Henüz asist yapılmadı'}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={styles.clearSearchText}>Aramayı Temizle</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Stats Info */}
        {filteredAssisters.length > 0 && (
          <View style={styles.statsInfo}>
            <View style={styles.statsInfoCard}>
              <Sparkles size={20} color="#10B981" strokeWidth={2} />
              <View style={styles.statsInfoContent}>
                <Text style={styles.statsInfoTitle}>En Çok Asist</Text>
                <Text style={styles.statsInfoValue}>
                  {filteredAssisters[0].playerName} - {filteredAssisters[0].totalAssists} Asist
                </Text>
              </View>
            </View>

            <View style={styles.statsInfoCard}>
              <TrendingUp size={20} color="#F59E0B" strokeWidth={2} />
              <View style={styles.statsInfoContent}>
                <Text style={styles.statsInfoTitle}>En İyi Ortalama</Text>
                <Text style={styles.statsInfoValue}>
                  {[...filteredAssisters]
                    .sort((a, b) => b.averageAssistsPerMatch - a.averageAssistsPerMatch)[0]
                    .playerName} - {[...filteredAssisters]
                    .sort((a, b) => b.averageAssistsPerMatch - a.averageAssistsPerMatch)[0]
                    .averageAssistsPerMatch.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.statsInfoCard}>
              <BarChart3 size={20} color={sportColor} strokeWidth={2} />
              <View style={styles.statsInfoContent}>
                <Text style={styles.statsInfoTitle}>Toplam Asist</Text>
                <Text style={styles.statsInfoValue}>
                  {filteredAssisters.reduce((sum, a) => sum + a.totalAssists, 0)}
                </Text>
              </View>
            </View>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  clearButton: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: '600',
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
    borderColor: '#10B981',
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
    backgroundColor: '#D1FAE5',
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
    color: '#10B981',
  },
  podiumPercentage: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  podiumPercentageFirst: {
    fontSize: 12,
    color: '#10B981',
  },
  podiumBase: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumBaseFirst: {
    height: 80,
    backgroundColor: '#D1FAE5',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  assisterCard: {
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
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  topThreeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  assisterCardLeft: {
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
  assisterCardInfo: {
    flex: 1,
  },
  assisterCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  assisterCardStats: {
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
  assisterCardRight: {
    alignItems: 'center',
  },
  assistsCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'white',
  },
  assistsText: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  averageText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  statsInfo: {
    marginTop: 24,
    marginHorizontal: 16,
    gap: 12,
  },
  statsInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsInfoContent: {
    flex: 1,
  },
  statsInfoTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  statsInfoValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
    textAlign: 'center',
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  bottomSpacing: {
    height: 20,
  },
});