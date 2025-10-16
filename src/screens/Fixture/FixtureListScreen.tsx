import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  ChevronRight,
  Plus,
  Clock,
  Repeat,
  AlertCircle,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import {
  IMatchFixture,
  ILeague,
  SportType,
  SPORT_CONFIGS,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { matchFixtureService } from '../../services/matchFixtureService';
import { leagueService } from '../../services/leagueService';
import { FixtureListRouteProp, NavigationService } from '../../navigation';
import { useRoute } from '@react-navigation/native';

export const FixtureListScreen: React.FC = () => {
  const { user } = useAppContext();

  const route = useRoute<FixtureListRouteProp>();
  const { leagueId } = route.params || {};

  const [league, setLeague] = useState<ILeague | null>(null);
  const [fixtures, setFixtures] = useState<IMatchFixture[]>([]);
  const [filteredFixtures, setFilteredFixtures] = useState<IMatchFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Aktif' | 'Pasif'>('all');

  // Stats
  const [stats, setStats] = useState({
    totalFixtures: 0,
    activeFixtures: 0,
    myFixtures: 0,
  });

  useEffect(() => {
    loadData();
  }, [leagueId]);

  useEffect(() => {
    filterFixtures();
  }, [searchQuery, selectedStatus, fixtures]);

  const loadData = async () => {
    if (!leagueId) {
      Alert.alert('Hata', 'Lig ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      const [leagueData, fixturesData] = await Promise.all([
        leagueService.getById(leagueId),
        matchFixtureService.getFixturesByLeague(leagueId),
      ]);

      if (!leagueData) {
        Alert.alert('Hata', 'Lig bulunamadı');
        NavigationService.goBack();
        return;
      }

      setLeague(leagueData);
      setFixtures(fixturesData);

      // Calculate stats
      const activeCount = fixturesData.filter(f => f.status === 'Aktif').length;
      const myCount = fixturesData.filter(f =>
        f.organizerPlayerIds.includes(user?.id || '')
      ).length;

      setStats({
        totalFixtures: fixturesData.length,
        activeFixtures: activeCount,
        myFixtures: myCount,
      });
    } catch (error) {
      console.error('Error loading fixtures:', error);
      Alert.alert('Hata', 'Fikstürler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filterFixtures = () => {
    let filtered = [...fixtures];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((fixture) =>
        fixture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fixture.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((fixture) => fixture.status === selectedStatus);
    }

    // Sort: Active first, then by match start time
    filtered.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'Aktif' ? -1 : 1;
      }
      return new Date(b.matchStartTime).getTime() - new Date(a.matchStartTime).getTime();
    });

    setFilteredFixtures(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const isOrganizer = (fixture: IMatchFixture) => {
    return fixture.organizerPlayerIds.includes(user?.id || '');
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDay = (date: Date) => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[new Date(date).getDay()];
  };

  if (loading || !league) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Fikstürler yükleniyor...</Text>
      </View>
    );
  }

  const sportColor = getSportColor(league.sportType);

  return (
    <View style={styles.container}>
      {/* <CustomHeader showDrawer={true} /> */}
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Fikstür ara..."
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
            color={showFilters ? sportColor : '#6B7280'}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {(['all', 'Aktif', 'Pasif'] as const).map((status) => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  isSelected && { ...styles.filterChipActive, borderColor: sportColor, backgroundColor: sportColor + '20' },
                ]}
                onPress={() => setSelectedStatus(status)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && { ...styles.filterChipTextActive, color: sportColor },
                  ]}
                >
                  {status === 'all' ? '🌐 Tümü' : status === 'Aktif' ? '✅ Aktif' : '⏸️ Pasif'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Calendar size={20} color={sportColor} strokeWidth={2} />
          <Text style={styles.statValue}>{stats.totalFixtures}</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>

        <View style={styles.statCard}>
          <Clock size={20} color="#10B981" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.activeFixtures}</Text>
          <Text style={styles.statLabel}>Aktif</Text>
        </View>

        <View style={styles.statCard}>
          <Users size={20} color="#3B82F6" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.myFixtures}</Text>
          <Text style={styles.statLabel}>Yönettiğim</Text>
        </View>
      </View>

      {/* Fixtures List */}
      <ScrollView
        style={styles.fixtureList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredFixtures.length > 0 ? (
          <>
            {/* My Fixtures */}
            {filteredFixtures.some(f => isOrganizer(f)) && (
              <>
                <Text style={styles.sectionTitle}>Yönettiğim Fikstürler</Text>
                {filteredFixtures
                  .filter(f => isOrganizer(f))
                  .map((fixture) => (
                    <FixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      isOrganizer={true}
                      sportColor={sportColor}
                      onPress={() =>
                        NavigationService.navigateToFixture(fixture.id)
                      }
                      formatTime={formatTime}
                      formatDay={formatDay}
                    />
                  ))}
              </>
            )}

            {/* Other Fixtures */}
            {filteredFixtures.some(f => !isOrganizer(f)) && (
              <>
                <Text style={styles.sectionTitle}>Diğer Fikstürler</Text>
                {filteredFixtures
                  .filter(f => !isOrganizer(f))
                  .map((fixture) => (
                    <FixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      isOrganizer={false}
                      sportColor={sportColor}
                      onPress={() =>
                        NavigationService.navigateToFixture(fixture.id)
                      }
                      formatTime={formatTime}
                      formatDay={formatDay}
                    />
                  ))}
              </>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Calendar size={64} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Fikstür bulunamadı</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Arama kriterlerinize uygun fikstür bulunamadı'
                : 'Henüz bir fikstür oluşturulmamış'}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Add Button */}
      {league.createdBy === user?.id && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: sportColor }]}
          onPress={() => NavigationService.navigateToCreateFixture(league.id)}
          activeOpacity={0.8}
        >
          <Plus size={28} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Fixture Card Component
interface FixtureCardProps {
  fixture: IMatchFixture;
  isOrganizer: boolean;
  sportColor: string;
  onPress: () => void;
  formatTime: (date: Date) => string;
  formatDay: (date: Date) => string;
}

const FixtureCard: React.FC<FixtureCardProps> = ({
  fixture,
  isOrganizer,
  sportColor,
  onPress,
  formatTime,
  formatDay,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fixtureCard,
        fixture.status === 'Pasif' && styles.fixtureCardInactive,
        isOrganizer && styles.fixtureCardOrganizer,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.fixtureCardHeader}>
        <View style={styles.fixtureCardLeft}>
          <View
            style={[
              styles.fixtureIcon,
              { backgroundColor: sportColor + '20' },
            ]}
          >
            <Calendar size={20} color={sportColor} strokeWidth={2} />
          </View>

          <View style={styles.fixtureCardInfo}>
            <View style={styles.fixtureCardTitleRow}>
              <Text style={styles.fixtureCardTitle} numberOfLines={1}>
                {fixture.title}
              </Text>
              {isOrganizer && (
                <View style={[styles.organizerBadge, { backgroundColor: sportColor }]}>
                  <Text style={styles.organizerBadgeText}>Organizatör</Text>
                </View>
              )}
            </View>

            <View style={styles.fixtureCardMeta}>
              <View style={styles.metaItem}>
                <Clock size={14} color="#6B7280" strokeWidth={2} />
                <Text style={styles.metaText}>
                  {formatDay(fixture.matchStartTime)} {formatTime(fixture.matchStartTime)}
                </Text>
              </View>

              {fixture.status === 'Pasif' && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Pasif</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      </View>

      <View style={styles.fixtureCardBody}>
        <View style={styles.fixtureDetailRow}>
          <MapPin size={14} color="#6B7280" strokeWidth={2} />
          <Text style={styles.fixtureDetailText} numberOfLines={1}>
            {fixture.location}
          </Text>
        </View>

        <View style={styles.fixtureDetailRow}>
          <Users size={14} color="#6B7280" strokeWidth={2} />
          <Text style={styles.fixtureDetailText}>
            {fixture.staffPlayerCount} + {fixture.reservePlayerCount} yedek
          </Text>
        </View>

        <View style={styles.fixtureDetailRow}>
          <DollarSign size={14} color="#6B7280" strokeWidth={2} />
          <Text style={styles.fixtureDetailText}>
            {fixture.pricePerPlayer} TL
          </Text>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.fixtureCardFooter}>
        {fixture.isPeriodic && (
          <View style={styles.periodicBadge}>
            <Repeat size={12} color="#8B5CF6" strokeWidth={2} />
            <Text style={styles.periodicBadgeText}>
              Her {fixture.periodDayCount} gün
            </Text>
          </View>
        )}

        <View
          style={[
            styles.statusDot,
            { backgroundColor: fixture.status === 'Aktif' ? sportColor : '#DC2626' },
          ]}
        />
      </View>
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
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
  fixtureList: {
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
  fixtureCard: {
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
  fixtureCardInactive: {
    opacity: 0.6,
  },
  fixtureCardOrganizer: {
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  fixtureCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fixtureCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  fixtureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fixtureCardInfo: {
    flex: 1,
  },
  fixtureCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  fixtureCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  organizerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  organizerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  fixtureCardMeta: {
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
  fixtureCardBody: {
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fixtureDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixtureDetailText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  fixtureCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodicBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});