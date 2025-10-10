import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Users,
  Calendar,
  X,
  Trophy,
  ChevronRight,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import {
  ILeague,
  SportType,
  SPORT_CONFIGS,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { leagueService } from '../../services/leagueService';

export const LeagueListScreen: React.FC = () => {
  const { user } = useAppContext();
  const navigation = useNavigationContext();

  const [leagues, setLeagues] = useState<ILeague[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<ILeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    myLeagues: 0,
    activeLeagues: 0,
    totalPlayers: 0,
  });

  useEffect(() => {
    loadLeagues();
  }, [user?.id]);

  useEffect(() => {
    filterLeagues();
  }, [searchQuery, selectedSport, leagues]);

  const loadLeagues = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Kullanıcının liglerini getir
      const myLeagues = await leagueService.getLeaguesByPlayer(user.id);
      
      // Aktif ligleri getir
      const activeLeagues = await leagueService.getActiveLeagues();
      
      // Tüm ligleri birleştir ve tekrarları kaldır
      const allLeagues = [...myLeagues, ...activeLeagues];
      const uniqueLeagues = allLeagues.filter(
        (league, index, self) => index === self.findIndex((l) => l.id === league.id)
      );

      setLeagues(uniqueLeagues);

      // İstatistikleri hesapla
      const totalPlayers = uniqueLeagues.reduce(
        (sum, league) => sum + league.playerIds.length,
        0
      );

      setStats({
        myLeagues: myLeagues.length,
        activeLeagues: activeLeagues.length,
        totalPlayers,
      });

    } catch (error) {
      console.error('Error loading leagues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterLeagues = () => {
    let filtered = [...leagues];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((league) =>
        league.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter((league) => league.sportType === selectedSport);
    }

    // Sort by active status and date
    filtered.sort((a, b) => {
      const aActive = new Date(a.seasonEndDate) > new Date();
      const bActive = new Date(b.seasonEndDate) > new Date();
      
      if (aActive !== bActive) return aActive ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    setFilteredLeagues(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeagues();
    setRefreshing(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const isLeagueActive = (league: ILeague) => {
    return new Date(league.seasonEndDate) > new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const sportTypes: Array<SportType | 'all'> = [
    'all',
    'Futbol',
    'Basketbol',
    'Voleybol',
    'Tenis',
    'Masa Tenisi',
    'Badminton',
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Ligler yükleniyor...</Text>
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
            placeholder="Lig ara..."
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
      </View>

      {/* Sport Filters */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {sportTypes.map((sport) => {
            const isSelected = selectedSport === sport;
            const sportConfig = sport !== 'all' ? SPORT_CONFIGS[sport] : null;

            return (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                  isSelected && sportConfig && {
                    backgroundColor: sportConfig.color + '20',
                    borderColor: sportConfig.color,
                  },
                ]}
                onPress={() => setSelectedSport(sport)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                    isSelected && sportConfig && { color: sportConfig.color },
                  ]}
                >
                  {sport === 'all' ? '🌐 Tümü' : `${getSportIcon(sport)} ${sport}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Trophy size={20} color="#16a34a" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.myLeagues}</Text>
          <Text style={styles.statLabel}>Ligim</Text>
        </View>

        <View style={styles.statCard}>
          <Calendar size={20} color="#F59E0B" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.activeLeagues}</Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>

        <View style={styles.statCard}>
          <Users size={20} color="#2563EB" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.totalPlayers}</Text>
          <Text style={styles.statLabel}>Oyuncu</Text>
        </View>
      </View>

      {/* League List */}
      <ScrollView
        style={styles.leagueList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredLeagues.length > 0 ? (
          <>
            {/* My Leagues Section */}
            {filteredLeagues.some((l) => l.playerIds.includes(user?.id || '')) && (
              <>
                <Text style={styles.sectionTitle}>Ligilerim</Text>
                {filteredLeagues
                  .filter((l) => l.playerIds.includes(user?.id || ''))
                  .map((league) => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      isActive={isLeagueActive(league)}
                      isMember={true}
                      onPress={() =>
                        navigation.navigate('leagueDetail', { leagueId: league.id })
                      }
                      formatDate={formatDate}
                    />
                  ))}
              </>
            )}

            {/* Other Leagues Section */}
            {filteredLeagues.some((l) => !l.playerIds.includes(user?.id || '')) && (
              <>
                <Text style={styles.sectionTitle}>Diğer Ligler</Text>
                {filteredLeagues
                  .filter((l) => !l.playerIds.includes(user?.id || ''))
                  .map((league) => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      isActive={isLeagueActive(league)}
                      isMember={false}
                      onPress={() =>
                        navigation.navigate('leagueDetail', { leagueId: league.id })
                      }
                      formatDate={formatDate}
                    />
                  ))}
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Trophy size={64} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Lig bulunamadı</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Arama kriterlerinize uygun lig bulunamadı'
                : 'Henüz bir lig bulunmuyor'}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('createLeague')}
        activeOpacity={0.8}
      >
        <Plus size={28} color="white" strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
};

// League Card Component
interface LeagueCardProps {
  league: ILeague;
  isActive: boolean;
  isMember: boolean;
  onPress: () => void;
  formatDate: (date: string) => string;
}

const LeagueCard: React.FC<LeagueCardProps> = ({
  league,
  isActive,
  isMember,
  onPress,
  formatDate,
}) => {
  const sportColor = getSportColor(league.sportType);

  return (
    <TouchableOpacity
      style={[
        styles.leagueCard,
        !isActive && styles.leagueCardInactive,
        isMember && styles.leagueCardMember,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leagueCardHeader}>
        <View style={styles.leagueCardLeft}>
          <View
            style={[
              styles.sportIcon,
              { backgroundColor: sportColor + '20' },
            ]}
          >
            <Text style={styles.sportEmoji}>{getSportIcon(league.sportType)}</Text>
          </View>

          <View style={styles.leagueCardInfo}>
            <View style={styles.leagueCardTitleRow}>
              <Text style={styles.leagueCardTitle} numberOfLines={1}>
                {league.title}
              </Text>
              {isMember && (
                <View style={styles.memberBadge}>
                  <Text style={styles.memberBadgeText}>Üye</Text>
                </View>
              )}
            </View>

            <View style={styles.leagueCardMeta}>
              <View style={styles.metaItem}>
                <Users size={14} color="#6B7280" strokeWidth={2} />
                <Text style={styles.metaText}>{league.playerIds.length} oyuncu</Text>
              </View>

              {!isActive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Pasif</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      </View>

      <View style={styles.leagueCardFooter}>
        <Text style={styles.leagueCardDate}>
          {formatDate(league.seasonStartDate)} - {formatDate(league.seasonEndDate)}
        </Text>
        {isActive && (
          <View
            style={[
              styles.activeDot,
              { backgroundColor: sportColor },
            ]}
          />
        )}
      </View>

      {league.spreadSheetId && (
        <View style={styles.sheetBadge}>
          <Text style={styles.sheetBadgeText}>📊 Sheet Bağlı</Text>
        </View>
      )}
    </TouchableOpacity>
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
  filtersContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  leagueList: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  leagueCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  leagueCardInactive: {
    opacity: 0.7,
  },
  leagueCardMember: {
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  leagueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  sportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sportEmoji: {
    fontSize: 24,
  },
  leagueCardInfo: {
    flex: 1,
  },
  leagueCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  leagueCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  memberBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  leagueCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  leagueCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  leagueCardDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sheetBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sheetBadgeText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});