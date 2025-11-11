// src/screens/Match/MatchListScreen.tsx
// 🎯 MODERN MATCH LIST - League & Friendly Support
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,  // ✅ ScrollView yerine FlatList
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import {
  Search,
  Filter,
  X,
  Calendar,
  MapPin,
  Users,
  Trophy,
  ChevronRight,
  Clock,
  Target,
  Plus,
  Mail,
  Globe,
  Lock,
  Zap,
  CheckCircle,
  Key,
  Send,
} from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { eventManager, Events } from '../../utils';
import {
  IMatch,
  ILeague,
  SportType,
  MatchType,
  MatchStatus,
} from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { MatchInvitationService } from '../../services/serviceLayer/invitationService';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { InvitationType } from '../../types/entity/invitation';
import { useAutoHideTabBar } from '../../context/TabBarContext';
import { commonColors, sportThemes } from '../../utils/theme';
import { goBack, LeagueNavigationService, MatchNavigationService } from '../../navigation';
import { Fab } from '../../components/ui/Fab';
import { LoadingScreen } from '../Common';
import { isPlayerInMatch } from '../../helper/matchHelper';
import { MatchCard } from './components';

type FilterType = 'all' | 'upcoming' | 'past' | 'myMatches';
type MatchTypeFilter = 'all' | 'league' | 'friendly';
type PrivacyFilter = 'all' | 'public' | 'private'; // ✅ NEW

interface MatchListParams {
  fixtureId?: string;
  leagueId?: string;
}

const PAGE_SIZE = 20; // ✅ Her seferde kaç maç yüklenecek

export const MatchListScreen: React.FC = () => {
  useAutoHideTabBar(false); // ✅ Tab bar'ı göster
  const { user } = useAuth();
  const route = useRoute<RouteProp<{ params: MatchListParams }, 'params'>>();

  const { fixtureId, leagueId } = route.params || {};

  const [league, setLeague] = useState<ILeague | null>(null);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false); // ✅ Load more indicator
  const [hasMore, setHasMore] = useState(true); // ✅ Daha fazla veri var mı?
  const [lastDoc, setLastDoc] = useState<any>(null); // ✅ Son döküman (pagination için)
  const [title, setTitle] = useState('Maçlar');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>('all');
  const [privacyFilter, setPrivacyFilter] = useState<PrivacyFilter>('all'); // ✅ NEW
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');

  // Stats
  const [stats, setStats] = useState({
    totalMatches: 0,
    upcomingMatches: 0,
    myMatches: 0,
    completedMatches: 0,
    leagueMatches: 0,
    friendlyMatches: 0,
  });

  // const [showJoinModal, setShowJoinModal] = useState(false); // ✅ NEW

  // Event listeners
  useEffect(() => {
    const unsubscribeUpdate = eventManager.on(Events.MATCH_UPDATED, loadData);
    const unsubscribeRegister = eventManager.on(Events.MATCH_REGISTERED, loadData);
    const unsubscribeUnregister = eventManager.on(Events.MATCH_UNREGISTERED, loadData);

    return () => {
      unsubscribeUpdate();
      unsubscribeRegister();
      unsubscribeUnregister();
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [fixtureId, leagueId]);

  // ✅ Filter değişince listeyi sıfırla ve tekrar yükle
  useEffect(() => {
    resetAndLoad();
  }, [selectedFilter, matchTypeFilter, selectedSport]);

  // Available sports
  const availableSports = useMemo(() => {
    const sports = new Set<SportType>();
    matches.forEach((match) => {
      if (match.sportType) {
        sports.add(match.sportType);
      } else if (league) {
        sports.add(league.sportType);
      }
    });
    return Array.from(sports);
  }, [matches, league]);

  // ✅ Reset and reload (filter değişince)
  const resetAndLoad = useCallback(async () => {
    setMatches([]);
    setLastDoc(null);
    setHasMore(true);
    await loadData(true); // true = reset
  }, [fixtureId, leagueId, selectedFilter, matchTypeFilter, selectedSport, user?.id]);

  // ✅ Load data with pagination
  const loadData = useCallback(async (reset: boolean = false) => {
    console.log('Loading match list data...', { reset, hasMore, loadingMore });

    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      goBack();
      return;
    }

    // Prevent multiple simultaneous loads
    if (loadingMore && !reset) return;

    // No more data to load
    if (!hasMore && !reset) return;

    try {
      if (reset) {
        setLoading(true);
        setLastDoc(null);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      let matchesData: IMatch[] = [];
      let leagueData: ILeague | null = null;
      let newLastDoc: any = null;
      let moreAvailable = true;

      if (fixtureId) {
        // ✅ Fixture'a ait maçları pagination ile getir
        const matchResult = await MatchService.getFixtureMatchesPaginated(
          fixtureId,
          PAGE_SIZE,
          reset ? undefined : lastDoc
        );

        if (matchResult.success && matchResult.data) {
          matchesData = matchResult.data.data;
          newLastDoc = matchResult.data.lastDoc;
          moreAvailable = matchResult.data.hasMore;
        }

        const fixtureResult = await FixtureService.getFixture(fixtureId);
        if (fixtureResult.success && fixtureResult.data) {
          const fixture = fixtureResult.data;
          const leagueResult = await LeagueService.getLeague(fixture.leagueId);
          if (leagueResult.success && leagueResult.data) {
            leagueData = leagueResult.data;
            setTitle(`${fixture.title} - Maçlar`);
          }
        }
      } else if (leagueId) {
        // ✅ Lig'e ait tüm maçları pagination ile getir
        const leagueResult = await LeagueService.getLeague(leagueId);
        if (leagueResult.success && leagueResult.data) {
          leagueData = leagueResult.data;

          const matchResult = await MatchService.getLeagueMatchesPaginated(
            leagueId,
            PAGE_SIZE,
            reset ? undefined : lastDoc
          );

          if (matchResult.success && matchResult.data) {
            matchesData = matchResult.data.data;
            newLastDoc = matchResult.data.lastDoc;
            moreAvailable = matchResult.data.hasMore;
          }

          setTitle(`${leagueData.title} - Tüm Maçlar`);
        }
      } else {
        // ✅ Kullanıcının tüm maçları - pagination ile
        const now = new Date().toISOString();

        if (selectedFilter === 'upcoming') {
          const result = await MatchService.getPlayerUpcomingMatchesPaginated(
            user.id,
            PAGE_SIZE,
            reset ? undefined : lastDoc
          );

          if (result.success && result.data) {
            matchesData = result.data.data;
            newLastDoc = result.data.lastDoc;
            moreAvailable = result.data.hasMore;
          }
        } else if (selectedFilter === 'past') {
          const result = await MatchService.getPlayerMatchHistoryPaginated(
            user.id,
            PAGE_SIZE,
            reset ? undefined : lastDoc
          );

          if (result.success && result.data) {
            matchesData = result.data.data;
            newLastDoc = result.data.lastDoc;
            moreAvailable = result.data.hasMore;
          }
        } else {
          // All matches
          const result = await MatchService.getPlayerAllMatchesPaginated(
            user.id,
            PAGE_SIZE,
            reset ? undefined : lastDoc
          );

          if (result.success && result.data) {
            matchesData = result.data.data;
            newLastDoc = result.data.lastDoc;
            moreAvailable = result.data.hasMore;
          }
        }

        // İlk ligi al (varsa)
        // if (reset) {
        //   const leaguesResult = await LeagueService.getPlayerLeagues(user.id);
        //   if (leaguesResult.success && leaguesResult.data && leaguesResult.data.length > 0) {
        //     leagueData = leaguesResult.data[0];
        //   }
        // }

        setTitle('Maçlar');
      }

      if (fixtureId && !leagueData && reset) {
        Alert.alert('Hata', 'Fikstür bulunamadı');
        goBack();
        return;
      }

      if (leagueId && !leagueData && reset) {
        Alert.alert('Hata', 'Lig bulunamadı');
        goBack();
        return;
      }

      // ✅ Apply client-side filters
      let filteredData = matchesData;

      // Match type filter
      if (matchTypeFilter === 'league') {
        filteredData = filteredData.filter(m => m.type === MatchType.LEAGUE);
      } else if (matchTypeFilter === 'friendly') {
        filteredData = filteredData.filter(m => m.type === MatchType.FRIENDLY);
      }

      // ✅ Privacy filter (NEW)
      if (privacyFilter === 'public') {
        filteredData = filteredData.filter(m =>
          m.type === MatchType.FRIENDLY && m.friendlySettings?.isPublic === true
        );
      } else if (privacyFilter === 'private') {
        filteredData = filteredData.filter(m =>
          m.type === MatchType.FRIENDLY && m.friendlySettings?.isPublic === false
        );
      }


      // Sport filter
      if (selectedSport !== 'all') {
        filteredData = filteredData.filter(m => m.sportType === selectedSport);
      }

      // My matches filter
      if (selectedFilter === 'myMatches') {
        filteredData = filteredData.filter(m => isPlayerInMatch(user?.id, m));
      }

      // ✅ Update state
      setLeague(reset ? leagueData : league);
      setMatches(reset ? filteredData : [...matches, ...filteredData]);
      setLastDoc(newLastDoc);
      setHasMore(moreAvailable);

      // ✅ Calculate stats (only on reset)
      if (reset) {
        const now = new Date();
        const allMatches = filteredData; // İlk yükleme için

        const upcoming = allMatches.filter((m) =>
          new Date(m.schedule.matchStart) > now &&
          m.status !== MatchStatus.CANCELLED &&
          m.status !== MatchStatus.COMPLETED
        );
        const completed = allMatches.filter((m) => m.status === MatchStatus.COMPLETED);
        const myMatches = allMatches.filter((m) => isPlayerInMatch(user?.id, m));
        const leagueMatches = allMatches.filter((m) => m.type === MatchType.LEAGUE);
        const friendlyMatches = allMatches.filter((m) => m.type === MatchType.FRIENDLY);

        setStats({
          totalMatches: allMatches.length,
          upcomingMatches: upcoming.length,
          myMatches: myMatches.length,
          completedMatches: completed.length,
          leagueMatches: leagueMatches.length,
          friendlyMatches: friendlyMatches.length,
        });
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Hata', 'Maçlar yüklenirken bir hata oluştu');
    } finally {
      if (reset) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [
    fixtureId,
    leagueId,
    user?.id,
    lastDoc,
    hasMore,
    loadingMore,
    selectedFilter,
    matchTypeFilter,
    selectedSport,
    matches,
    league,
  ]);

  // ✅ Load more when reaching end
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      loadData(false);
    }
  }, [loadingMore, hasMore, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await resetAndLoad();
    setRefreshing(false);
  }, [resetAndLoad]);

  // ✅ Search filter (client-side for loaded matches)
  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return matches;

    const query = searchQuery.toLowerCase();
    return matches.filter((match) =>
      match.title.toLowerCase().includes(query) ||
      match.venue?.location?.toLowerCase().includes(query)
    );
  }, [matches, searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleCreateFriendlyMatch = () => {
    MatchNavigationService.navigateToCreateFriendlyMatch();
  };

  const handleViewInvitations = () => {
    MatchNavigationService.navigateToFriendlyMatchInvitations();
  };

  const sportColor = useMemo(() =>
    league ? sportThemes[league.sportType].primary : '#16a34a',
    [league]
  );

  // ✅ Render footer (loading indicator)
  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={sportColor} />
        <Text style={styles.footerLoaderText}>Yükleniyor...</Text>
      </View>
    );
  };

  // ✅ Render header (search, filters, stats, etc.)
  const renderListHeader = () => (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Maç veya lokasyon ara..."
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
        <View style={styles.filtersSection}>
          {/* Match Type Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filtersContent}
          >
            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'all' && {
                  backgroundColor: sportColor + '20',
                  borderColor: sportColor,
                },
              ]}
              onPress={() => setMatchTypeFilter('all')}
              activeOpacity={0.7}
            >
              <Globe size={16} color={matchTypeFilter === 'all' ? sportColor : '#6B7280'} />
              <Text
                style={[
                  styles.matchTypeText,
                  matchTypeFilter === 'all' && { color: sportColor, fontWeight: '700' },
                ]}
              >
                Tümü ({stats?.totalMatches || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'league' && {
                  backgroundColor: '#3B82F6' + '20',
                  borderColor: '#3B82F6',
                },
              ]}
              onPress={() => setMatchTypeFilter('league')}
              activeOpacity={0.7}
            >
              <Trophy size={16} color={matchTypeFilter === 'league' ? '#3B82F6' : '#6B7280'} />
              <Text
                style={[
                  styles.matchTypeText,
                  matchTypeFilter === 'league' && { color: '#3B82F6', fontWeight: '700' },
                ]}
              >
                Lig ({stats?.leagueMatches || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'friendly' && {
                  backgroundColor: '#10B981' + '20',
                  borderColor: '#10B981',
                },
              ]}
              onPress={() => setMatchTypeFilter('friendly')}
              activeOpacity={0.7}
            >
              <Users size={16} color={matchTypeFilter === 'friendly' ? '#10B981' : '#6B7280'} />
              <Text
                style={[
                  styles.matchTypeText,
                  matchTypeFilter === 'friendly' && { color: '#10B981', fontWeight: '700' },
                ]}
              >
                Dostluk ({stats?.friendlyMatches || 0})
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Status Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filtersContent}
          >
            {([
              { key: 'all', label: 'Tümü', icon: Globe },
              { key: 'upcoming', label: 'Yaklaşan', icon: Calendar },
              { key: 'past', label: 'Geçmiş', icon: Clock },
              { key: 'myMatches', label: 'Katıldıklarım', icon: Target },
            ] as const).map((filter) => {
              const isSelected = selectedFilter === filter.key;
              const Icon = filter.icon;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    isSelected && {
                      borderColor: sportColor,
                      backgroundColor: sportColor + '20'
                    },
                  ]}
                  onPress={() => setSelectedFilter(filter.key)}
                  activeOpacity={0.7}
                >
                  <Icon size={14} color={isSelected ? sportColor : '#6B7280'} strokeWidth={2} />
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && { color: sportColor, fontWeight: '700' },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Sport Filter */}
          {availableSports.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filtersContent}
            >
              <TouchableOpacity
                style={[
                  styles.sportFilterChip,
                  selectedSport === 'all' && {
                    backgroundColor: sportColor + '20',
                    borderColor: sportColor,
                  },
                ]}
                onPress={() => setSelectedSport('all')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.sportFilterText,
                  selectedSport === 'all' && { color: sportColor, fontWeight: '700' }
                ]}>
                  Tüm Sporlar
                </Text>
              </TouchableOpacity>

              {availableSports.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportFilterChip,
                    selectedSport === sport && {
                      backgroundColor: sportThemes[sport].primary + '20',
                      borderColor: sportThemes[sport].primary,
                    },
                  ]}
                  onPress={() => setSelectedSport(sport)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sportFilterEmoji}>{sportThemes[sport].emoji}</Text>
                  <Text style={[
                    styles.sportFilterText,
                    selectedSport === sport && {
                      color: sportThemes[sport].primary,
                      fontWeight: '700'
                    }
                  ]}>
                    {sportThemes[sport].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}


      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.createFriendlyButton}
          onPress={handleCreateFriendlyMatch}
          activeOpacity={0.7}
        >
          <Plus size={20} color="white" strokeWidth={2.5} />
          <Text style={styles.createFriendlyButtonText}>Dostluk Maçı Oluştur</Text>
          <Zap size={16} color="white" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Trophy size={20} color={sportColor} strokeWidth={2} />
          <Text style={styles.statValue}>{stats.totalMatches}+</Text>
          <Text style={styles.statLabel}>Toplam</Text>
        </View>

        <View style={styles.statCard}>
          <Calendar size={20} color="#3B82F6" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.upcomingMatches}</Text>
          <Text style={styles.statLabel}>Yaklaşan</Text>
        </View>

        <View style={styles.statCard}>
          <Target size={20} color="#10B981" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.myMatches}</Text>
          <Text style={styles.statLabel}>Katıldıklarım</Text>
        </View>

        <View style={styles.statCard}>
          <CheckCircle size={20} color="#6B7280" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.completedMatches}</Text>
          <Text style={styles.statLabel}>Tamamlandı</Text>
        </View>
      </View>

      {matchTypeFilter === 'friendly' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[
              styles.privacyChip,
              privacyFilter === 'all' && {
                backgroundColor: sportColor + '20',
                borderColor: sportColor,
              },
            ]}
            onPress={() => setPrivacyFilter('all')}
            activeOpacity={0.7}
          >
            <Globe size={14} color={privacyFilter === 'all' ? sportColor : '#6B7280'} />
            <Text
              style={[
                styles.privacyChipText,
                privacyFilter === 'all' && { color: sportColor, fontWeight: '700' },
              ]}
            >
              Tümü
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.privacyChip,
              privacyFilter === 'public' && {
                backgroundColor: '#10B981' + '20',
                borderColor: '#10B981',
              },
            ]}
            onPress={() => setPrivacyFilter('public')}
            activeOpacity={0.7}
          >
            <Globe size={14} color={privacyFilter === 'public' ? '#10B981' : '#6B7280'} />
            <Text
              style={[
                styles.privacyChipText,
                privacyFilter === 'public' && { color: '#10B981', fontWeight: '700' },
              ]}
            >
              Herkese Açık
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.privacyChip,
              privacyFilter === 'private' && {
                backgroundColor: '#F59E0B' + '20',
                borderColor: '#F59E0B',
              },
            ]}
            onPress={() => setPrivacyFilter('private')}
            activeOpacity={0.7}
          >
            <Lock size={14} color={privacyFilter === 'private' ? '#F59E0B' : '#6B7280'} />
            <Text
              style={[
                styles.privacyChipText,
                privacyFilter === 'private' && { color: '#F59E0B', fontWeight: '700' },
              ]}
            >
              Özel (Kodlu)
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </>
  );

  const renderHeader = () => (
    <CustomHeader
      title={title}
      subtitle={league && leagueId ? `${stats.totalMatches}+ Maç` : undefined}
      sportType={leagueId && league ? league?.sportType : undefined}
      showIcon={!!league || !!leagueId}
      showBack={true}
      //showMenu={!(fixtureId || leagueId)}
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
        MatchNavigationService.navigateToJoinWithCode();
      },
    },
    {
      id: 'create-league',
      label: 'Dostluk Maçı Oluştur',
      icon: <Plus size={20} color="white" strokeWidth={2.5} />,
      color: '#10B981',
      onPress: () => {
        handleCreateFriendlyMatch();
      },
    },
  ];

  if (loading) {
    return (
      <LoadingScreen
        header={renderHeader()}
        sportType={league && leagueId ? league?.sportType : undefined}
        loadingText='Maçlar Yükleniyor'
        visibleHeader={true}
      />
    );
  }

  // Empty state
  if (!league && matches.length === 0 && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Trophy size={64} color="#D1D5DB" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyStateTitle}>Henüz bir lige katılmadınız</Text>
          <Text style={styles.emptyStateText}>
            Maçları görebilmek için önce bir lige katılmanız gerekiyor
          </Text>
          <TouchableOpacity
            style={styles.emptyActionButton}
            onPress={() => LeagueNavigationService.navigateToLeagueList()}
            activeOpacity={0.8}
          >
            <Text style={styles.emptyActionButtonText}>Ligleri Keşfet</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {/* ✅ FlatList with pagination */}
      <Animated.FlatList
        data={filteredMatches}
        renderItem={({ item }) => (
          <MatchCard
            match={item}
            sportColor={sportColor}
            onPress={() => MatchNavigationService.navigateToMatchDetail(item.id!)}
            playerId={user?.id || null}
            league={league}
          />
        )}
        keyExtractor={(item) => item.id!}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Trophy size={64} color="#D1D5DB" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyStateTitle}>Maç bulunamadı</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? 'Arama kriterlerinize uygun maç bulunamadı'
                : selectedFilter === 'myMatches'
                  ? 'Henüz hiç maça katılmadınız'
                  : selectedFilter === 'upcoming'
                    ? 'Yaklaşan maç bulunmuyor'
                    : 'Henüz bir maç oluşturulmamış'}
            </Text>
            {matchTypeFilter === 'friendly' && (
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={handleCreateFriendlyMatch}
                activeOpacity={0.8}
              >
                <Plus size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.emptyActionButtonText}>Dostluk Maçı Oluştur</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={sportColor}
            colors={[sportColor]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.flatListContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
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


// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
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
  filtersSection: {
    backgroundColor: 'white',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterRow: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  matchTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  matchTypeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  sportFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  sportFilterEmoji: {
    fontSize: 14,
  },
  sportFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  privacyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  privacyChipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Code Badge in Match Card
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  codeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  codeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  codeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 2,
  },
  codeInfoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#DCFCE7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  codeInfoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#15803d',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalJoinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  modalJoinButtonDisabled: {
    opacity: 0.5,
  },
  modalJoinButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  quickActionsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  invitationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  invitationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  invitationBannerText: {
    flex: 1,
  },
  invitationBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 2,
  },
  invitationBannerSubtitle: {
    fontSize: 12,
    color: '#15803d',
  },
  createFriendlyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createFriendlyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomSpacing: {
    height: 20,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
});