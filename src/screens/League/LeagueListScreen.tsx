import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Animated,
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
  Key,
} from 'lucide-react-native';
import {
  ILeague,
  SportType,
} from '../../types/entity/types';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { commonColors, getSportEmoji, getThemeForSport } from '../../utils/theme';
import { goBack, LeagueNavigationService } from '../../navigation';
import { Fab } from '../../components/ui/Fab';
import { LoadingScreen } from '../Common';
import { LeagueCard } from './components';

export const LeagueListScreen: React.FC = () => {
  const { user } = useAuth();
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
    totalLeagues: 0,
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
      const myLeaguesResponse = await LeagueService.getPlayerLeagues(user.id);
      const myLeagues = myLeaguesResponse.success && myLeaguesResponse.data
        ? myLeaguesResponse.data
        : [];

      setLeagues(myLeagues);

      // İstatistikleri hesapla
      const totalPlayers = myLeagues.reduce(
        (sum, league) => sum + league.members.all.length,
        0
      );

      setStats({
        myLeagues: myLeagues.length,
        totalLeagues: myLeagues.length,
        totalPlayers,
      });

    } catch (error) {
      console.error('Error loading leagues:', error);
      Alert.alert('Hata', 'Ligler yüklenirken bir hata oluştu');
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

    // Sort by date
    filtered.sort((a, b) => {
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

  const handleCreateLeague = () => {
    LeagueNavigationService.navigateToCreateLeague();
  };

  const handleLeaguePress = (league: ILeague) => {
    LeagueNavigationService.navigateToLeagueDetail(league.id!);
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

  const renderHeader = () => (
    <CustomHeader
      title="Ligler"
      showBack={true}
      onLeftPress={() => goBack()}
    />
  );

  const scrollY = useRef(new Animated.Value(0)).current;

  const menuItems = [
    {
      id: 'join-code',
      label: 'Kodla Katıl',
      icon: <Key size={20} color="white" strokeWidth={2.5} />,
      color: '#F59E0B',
      onPress: () => {
        LeagueNavigationService.navigateToJoinWithCode();
      },
    },
    {
      id: 'create-league',
      label: 'Lig Oluştur',
      icon: <Plus size={20} color="white" strokeWidth={2.5} />,
      color: '#10B981',
      onPress: () => {
        handleCreateLeague();
      },
    },
  ];

  if (loading) {
    return (
      <LoadingScreen
        header={renderHeader()}
        loadingText='Ligler Yükleniyor'
        visibleHeader={true}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#16a34a']}
            tintColor="#16a34a"
          />
        }
      >
        {renderHeader()}

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
            nestedScrollEnabled={true} // ✅ Bu önemli!
          >
            {sportTypes.map((sport) => {
              const isSelected = selectedSport === sport;
              const sportConfig = sport !== 'all' ? getThemeForSport(sport) : null;

              return (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipActive,
                    isSelected && sportConfig && {
                      backgroundColor: sportConfig.sport.background + '20',
                      borderColor: sportConfig.sport.primary,
                    },
                  ]}
                  onPress={() => setSelectedSport(sport)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && styles.filterChipTextActive,
                      isSelected && sportConfig && { color: sportConfig.sport.primary },
                    ]}
                  >
                    {sport === 'all' ? '🌐 Tümü' : `${getSportEmoji(sport)} ${sport}`}
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
            <Text style={styles.statValue}>{stats.totalLeagues}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>

          <View style={styles.statCard}>
            <Users size={20} color="#2563EB" strokeWidth={2} />
            <Text style={styles.statValue}>{stats.totalPlayers}</Text>
            <Text style={styles.statLabel}>Oyuncu</Text>
          </View>
        </View>

        {/* League List - İÇ SCROLLVIEW KALDIRILDI */}
        {filteredLeagues.length > 0 ? (
          <>
            {/* My Leagues Section */}
            {filteredLeagues.some((l) => l.members.all.includes(user?.id || '')) && (
              <>
                <Text style={styles.sectionTitle}>Liglerim</Text>
                {filteredLeagues
                  .filter((l) => l.members.all.includes(user?.id || ''))
                  .map((league) => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      isMember={true}
                      isAdmin={league.members.admins.includes(user?.id || '')}
                      onPress={() => handleLeaguePress(league)}
                    />
                  ))}
              </>
            )}

            {/* Other Leagues Section */}
            {filteredLeagues.some((l) => !l.members.all.includes(user?.id || '')) && (
              <>
                <Text style={styles.sectionTitle}>Diğer Ligler</Text>
                {filteredLeagues
                  .filter((l) => !l.members.all.includes(user?.id || ''))
                  .map((league) => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      isMember={false}
                      isAdmin={false}
                      onPress={() => handleLeaguePress(league)}
                    />
                  ))}
              </>
            )}

            <View style={styles.bottomSpacing} />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🏆</Text>
            <Text style={styles.emptyStateTitle}>
              {searchQuery.trim() ? 'Lig Bulunamadı' : 'Henüz Lig Yok'}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim()
                ? 'Aradığınız kriterlere uygun lig bulunamadı'
                : 'Yeni bir lig oluşturarak başlayın'}
            </Text>
          </View>
        )}
      </Animated.ScrollView>

      <Fab
        mainColor={commonColors.primary}
        menuItems={menuItems}
        visible={true}
        onScrollY={scrollY}
        autoHideOnScroll={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
    height: 32,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    lineHeight: 18,
  },
  filterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16a34a',
  },
  filterChipTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
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

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
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
});
