import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Trophy,
  ChevronRight,
  Clock,
  Target,
  AlertCircle,
  Plus,
  Mail,
  Globe,
  Lock,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';
import {
  IMatch,
  ILeague,
  SportType,
  MatchType,
  getSportIcon,
  getSportColor,
  SPORT_CONFIGS,
} from '../../types/types';
import { matchService } from '../../services/matchService';
import { leagueService } from '../../services/leagueService';
import { matchFixtureService } from '../../services/matchFixtureService';
import { matchInvitationService } from '../../services/matchInvitationService';

type FilterType = 'all' | 'upcoming' | 'past' | 'myMatches';
type MatchTypeFilter = 'all' | 'league' | 'friendly';

interface MatchListParams {
  fixtureId?: string;
  leagueId?: string;
}

export const MatchListScreen: React.FC = () => {
  const { user } = useAppContext();
  const route = useRoute<RouteProp<{ params: MatchListParams }, 'params'>>();

  const { fixtureId, leagueId } = route.params || {};

  const [league, setLeague] = useState<ILeague | null>(null);
  const [matches, setMatches] = useState<IMatch[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<IMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [title, setTitle] = useState('Maçlarım');
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [matchTypeFilter, setMatchTypeFilter] = useState<MatchTypeFilter>('all');
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
    loadPendingInvitations();
  }, [fixtureId, leagueId]);

  useEffect(() => {
    filterMatches();
  }, [searchQuery, selectedFilter, matchTypeFilter, selectedSport, matches]);

  // Available sports
  const availableSports = useMemo(() => {
    const sports = new Set<SportType>();
    matches.forEach((match: any) => {
      if (match.sportType) {
        sports.add(match.sportType);
      } else if (league) {
        sports.add(league.sportType);
      }
    });
    return Array.from(sports);
  }, [matches, league]);

  const loadPendingInvitations = async () => {
    if (!user?.id) return;
    try {
      const count = await matchInvitationService.getPendingInvitationCount(user.id);
      setPendingInvitationsCount(count);
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  };

  const loadData = useCallback(async () => {
    console.log('Loading match list data...');
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      let matchesData: IMatch[] = [];
      let leagueData: ILeague | null = null;

      if (fixtureId) {
        // Fixture'a ait maçları getir
        matchesData = await matchService.getMatchesByFixture(fixtureId);
        const fixture = await matchFixtureService.getById(fixtureId);
        if (fixture) {
          leagueData = await leagueService.getById(fixture.leagueId);
          setTitle(`${fixture.title} - Maçlar`);
        }
      } else if (leagueId) {
        // Lig'e ait tüm maçları getir (League + Friendly)
        leagueData = await leagueService.getById(leagueId);
        if (leagueData) {
          const fixtures = await matchFixtureService.getFixturesByLeague(leagueId);
          const allMatchPromises = fixtures.map((f: any) => matchService.getMatchesByFixture(f.id));
          const allMatchesArrays = await Promise.all(allMatchPromises);
          matchesData = allMatchesArrays.flat();
          setTitle(`${leagueData.title} - Tüm Maçlar`);
        }
      } else {
        console.log('Loading all player matches');
        // Kullanıcının tüm maçları (League + Friendly)
        const grouped = await matchService.getPlayerMatchesGrouped(user.id);
        matchesData = grouped.all;

        const myLeagues = await leagueService.getLeaguesByPlayer(user.id);
        if (myLeagues.length > 0) {
          leagueData = myLeagues[0];
        }
        setTitle('Maçlarım');
      }

      if (fixtureId && !leagueData) {
        Alert.alert('Hata', 'Fikstür bulunamadı');
        NavigationService.goBack();
        return;
      }

      if (leagueId && !leagueData) {
        Alert.alert('Hata', 'Lig bulunamadı');
        NavigationService.goBack();
        return;
      }

      setLeague(leagueData);
      setMatches(matchesData);

      // Calculate stats
      const now = new Date();
      const upcoming = matchesData.filter((m: any) =>
        new Date(m.matchStartTime) > now &&
        m.status !== 'İptal Edildi' &&
        m.status !== 'Tamamlandı'
      );
      const completed = matchesData.filter((m: any) => m.status === 'Tamamlandı');
      const myMatches = matchesData.filter((m: any) =>
        m.registeredPlayerIds?.includes(user.id) ||
        m.team1PlayerIds?.includes(user.id) ||
        m.team2PlayerIds?.includes(user.id)
      );
      const leagueMatches = matchesData.filter((m: any) => m.type === MatchType.LEAGUE);
      const friendlyMatches = matchesData.filter((m: any) => m.type === MatchType.FRIENDLY);

      setStats({
        totalMatches: matchesData.length,
        upcomingMatches: upcoming.length,
        myMatches: myMatches.length,
        completedMatches: completed.length,
        leagueMatches: leagueMatches.length,
        friendlyMatches: friendlyMatches.length,
      });
    } catch (error) {
      console.error('Error loading matches:', error);
      Alert.alert('Hata', 'Maçlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [fixtureId, leagueId, user?.id]);

  const filterMatches = useCallback(() => {
    let filtered = [...matches];
    const now = new Date();

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((match: any) =>
        match.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Match type filter (League/Friendly)
    if (matchTypeFilter === 'league') {
      filtered = filtered.filter((m: any) => m.type === MatchType.LEAGUE);
    } else if (matchTypeFilter === 'friendly') {
      filtered = filtered.filter((m: any) => m.type === MatchType.FRIENDLY);
    }

    // Sport filter
    if (selectedSport !== 'all') {
      filtered = filtered.filter((m: any) => m.sportType === selectedSport);
    }

    // Status filter
    if (selectedFilter === 'upcoming') {
      filtered = filtered.filter((m: any) =>
        new Date(m.matchStartTime) > now &&
        m.status !== 'İptal Edildi' &&
        m.status !== 'Tamamlandı'
      );
    } else if (selectedFilter === 'past') {
      filtered = filtered.filter((m: any) =>
        new Date(m.matchStartTime) <= now || m.status === 'Tamamlandı'
      );
    } else if (selectedFilter === 'myMatches') {
      filtered = filtered.filter((m: any) =>
        m.registeredPlayerIds?.includes(user?.id || '') ||
        m.team1PlayerIds?.includes(user?.id || '') ||
        m.team2PlayerIds?.includes(user?.id || '')
      );
    }

    // Sort by match start time
    filtered.sort((a: any, b: any) => {
      if (selectedFilter === 'upcoming' || selectedFilter === 'all') {
        return new Date(a.matchStartTime).getTime() - new Date(b.matchStartTime).getTime();
      } else {
        return new Date(b.matchStartTime).getTime() - new Date(a.matchStartTime).getTime();
      }
    });

    setFilteredMatches(filtered);
  }, [matches, searchQuery, selectedFilter, matchTypeFilter, selectedSport, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    await loadPendingInvitations();
    setRefreshing(false);
  }, [loadData]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const getMatchStatusColor = useCallback((status: IMatch['status']): string => {
    switch (status) {
      case 'Oluşturuldu': return '#9CA3AF';
      case 'Kayıt Açık': return '#10B981';
      case 'Kayıt Kapandı': return '#F59E0B';
      case 'Takımlar Oluşturuldu': return '#2563EB';
      case 'Oynanıyor': return '#8B5CF6';
      case 'Skor Bekleniyor': return '#F59E0B';
      case 'Skor Onay Bekliyor': return '#F59E0B';
      case 'Ödeme Bekliyor': return '#F59E0B';
      case 'Tamamlandı': return '#16a34a';
      case 'İptal Edildi': return '#DC2626';
      default: return '#6B7280';
    }
  }, []);

  const formatDateTime = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const isPlayerInMatch = useCallback((match: IMatch): boolean => {
    if (!user?.id) return false;
    return (
      match.registeredPlayerIds?.includes(user.id) ||
      match.team1PlayerIds?.includes(user.id) ||
      match.team2PlayerIds?.includes(user.id) || false
    );
  }, [user?.id]);

  const handleCreateFriendlyMatch = () => {
    NavigationService.navigateToCreateFriendlyMatch();
  };

  const handleViewInvitations = () => {
    NavigationService.navigateToFriendlyMatchInvitations();
  };

  const sportColor = useMemo(() =>
    league ? getSportColor(league.sportType) : '#16a34a',
    [league]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Maçlar yükleniyor...</Text>
      </View>
    );
  }

  // Empty state - kullanıcı hiç lige katılmamış
  if (!league && matches.length === 0) {
    return (
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
          onPress={() => NavigationService.navigateToLeaguesTab()}
          activeOpacity={0.8}
        >
          <Text style={styles.emptyActionButtonText}>Ligleri Keşfet</Text>
        </TouchableOpacity>
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
          {/* Match Type Filter (League/Friendly/All) */}
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
                  ...styles.matchTypeChipActive,
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
                  matchTypeFilter === 'all' && { ...styles.matchTypeTextActive, color: sportColor },
                ]}
              >
                Tümü ({stats.totalMatches})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'league' && {
                  ...styles.matchTypeChipActive,
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
                  matchTypeFilter === 'league' && { ...styles.matchTypeTextActive, color: '#3B82F6' },
                ]}
              >
                Lig ({stats.leagueMatches})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.matchTypeChip,
                matchTypeFilter === 'friendly' && {
                  ...styles.matchTypeChipActive,
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
                  matchTypeFilter === 'friendly' && { ...styles.matchTypeTextActive, color: '#10B981' },
                ]}
              >
                Dostluk ({stats.friendlyMatches})
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
              { key: 'all', label: '🌐 Tümü', icon: null },
              { key: 'upcoming', label: '📅 Yaklaşan', icon: Calendar },
              { key: 'past', label: '🏁 Geçmiş', icon: Clock },
              { key: 'myMatches', label: '⚽ Katıldıklarım', icon: Target },
            ] as const).map((filter: any) => {
              const isSelected = selectedFilter === filter.key;
              return (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterChip,
                    isSelected && {
                      ...styles.filterChipActive,
                      borderColor: sportColor,
                      backgroundColor: sportColor + '20'
                    },
                  ]}
                  onPress={() => setSelectedFilter(filter.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isSelected && { ...styles.filterChipTextActive, color: sportColor },
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
                  selectedSport === 'all' && styles.sportFilterChipActive,
                ]}
                onPress={() => setSelectedSport('all')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.sportFilterText,
                  selectedSport === 'all' && styles.sportFilterTextActive
                ]}>
                  Tüm Sporlar
                </Text>
              </TouchableOpacity>

              {availableSports.map((sport: SportType) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportFilterChip,
                    selectedSport === sport && {
                      ...styles.sportFilterChipActive,
                      backgroundColor: getSportColor(sport),
                      borderColor: getSportColor(sport),
                    },
                  ]}
                  onPress={() => setSelectedSport(sport)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.sportFilterEmoji}>{getSportIcon(sport)}</Text>
                  <Text style={[
                    styles.sportFilterText,
                    selectedSport === sport && styles.sportFilterTextActive
                  ]}>
                    {SPORT_CONFIGS[sport].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        {/* Pending Invitations */}
        {pendingInvitationsCount > 0 && (
          <TouchableOpacity
            style={styles.invitationBanner}
            onPress={handleViewInvitations}
            activeOpacity={0.7}
          >
            <View style={styles.invitationBannerLeft}>
              <Mail size={20} color="#10B981" strokeWidth={2} />
              <View style={styles.invitationBannerText}>
                <Text style={styles.invitationBannerTitle}>
                  {pendingInvitationsCount} Davet Bekliyor
                </Text>
                <Text style={styles.invitationBannerSubtitle}>
                  Dostluk maçı davetlerini görüntüle
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#10B981" strokeWidth={2} />
          </TouchableOpacity>
        )}

        {/* Create Friendly Match Button */}
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
          <Text style={styles.statValue}>{stats.totalMatches}</Text>
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
          <Clock size={20} color="#6B7280" strokeWidth={2} />
          <Text style={styles.statValue}>{stats.completedMatches}</Text>
          <Text style={styles.statLabel}>Tamamlandı</Text>
        </View>
      </View>

      {/* Matches List */}
      <ScrollView
        style={styles.matchList}
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
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match: any) => (
            <MatchCard
              key={match.id}
              match={match}
              isPlayerInMatch={isPlayerInMatch(match)}
              sportColor={sportColor}
              onPress={() => NavigationService.navigateToMatch(match.id)}
              getMatchStatusColor={getMatchStatusColor}
              formatDateTime={formatDateTime}
            />
          ))
        ) : (
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
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

// Match Card Component
interface MatchCardProps {
  match: IMatch;
  isPlayerInMatch: boolean;
  sportColor: string;
  onPress: () => void;
  getMatchStatusColor: (status: IMatch['status']) => string;
  formatDateTime: (date: Date) => string;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  isPlayerInMatch,
  sportColor,
  onPress,
  getMatchStatusColor,
  formatDateTime,
}) => {
  const statusColor = getMatchStatusColor(match.status);
  const isPast = new Date(match.matchStartTime) < new Date() || match.status === 'Tamamlandı';
  const isFriendly = match.type === MatchType.FRIENDLY;
  const matchSportColor = match.sportType ? getSportColor(match.sportType) : sportColor;

  return (
    <TouchableOpacity
      style={[
        styles.matchCard,
        isPast && styles.matchCardPast,
        isPlayerInMatch && styles.matchCardPlayer,
        isFriendly && styles.matchCardFriendly,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Match Type Badge */}
      <View style={styles.matchTypeHeaderBadge}>
        {isFriendly ? (
          <View style={[styles.matchTypeBadge, { backgroundColor: '#10B981' + '20' }]}>
            <Users size={12} color="#10B981" strokeWidth={2} />
            <Text style={[styles.matchTypeBadgeText, { color: '#10B981' }]}>Dostluk</Text>
          </View>
        ) : (
          <View style={[styles.matchTypeBadge, { backgroundColor: '#3B82F6' + '20' }]}>
            <Trophy size={12} color="#3B82F6" strokeWidth={2} />
            <Text style={[styles.matchTypeBadgeText, { color: '#3B82F6' }]}>Lig</Text>
          </View>
        )}

        {/* Privacy Badge for Friendly */}
        {isFriendly && (
          <View style={[styles.privacyBadge, {
            backgroundColor: match.isPublic ? '#10B981' + '15' : '#F59E0B' + '15'
          }]}>
            {match.isPublic ? (
              <>
                <Globe size={10} color="#10B981" strokeWidth={2} />
                <Text style={[styles.privacyBadgeText, { color: '#10B981' }]}>Açık</Text>
              </>
            ) : (
              <>
                <Lock size={10} color="#F59E0B" strokeWidth={2} />
                <Text style={[styles.privacyBadgeText, { color: '#F59E0B' }]}>Özel</Text>
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.matchCardHeader}>
        <View style={styles.matchCardLeft}>
          <View style={[styles.matchIcon, { backgroundColor: matchSportColor + '20' }]}>
            {match.sportType ? (
              <Text style={styles.sportEmoji}>{getSportIcon(match.sportType)}</Text>
            ) : (
              <Trophy size={20} color={matchSportColor} strokeWidth={2} />
            )}
          </View>

          <View style={styles.matchCardInfo}>
            <View style={styles.matchCardTitleRow}>
              <Text style={styles.matchCardTitle} numberOfLines={1}>
                {match.title}
              </Text>
              {isPlayerInMatch && (
                <View style={[styles.playerBadge, { backgroundColor: matchSportColor }]}>
                  <Text style={styles.playerBadgeText}>✓</Text>
                </View>
              )}
            </View>

            <View style={styles.matchCardMeta}>
              <View style={styles.metaItem}>
                <Calendar size={14} color="#6B7280" strokeWidth={2} />
                <Text style={styles.metaText}>{formatDateTime(match.matchStartTime)}</Text>
              </View>
            </View>
          </View>
        </View>

        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      </View>

      <View style={styles.matchCardBody}>
        {match.location && (
          <View style={styles.matchDetailRow}>
            <MapPin size={14} color="#6B7280" strokeWidth={2} />
            <Text style={styles.matchDetailText} numberOfLines={1}>
              {match.location}
            </Text>
          </View>
        )}

        <View style={styles.matchDetailRow}>
          <Users size={14} color="#6B7280" strokeWidth={2} />
          <Text style={styles.matchDetailText}>
            {(match.registeredPlayerIds?.length || 0)} kayıtlı
            {match.team1PlayerIds && match.team2PlayerIds &&
              ` • Takımlar: ${match.team1PlayerIds.length} vs ${match.team2PlayerIds.length}`
            }
          </Text>
        </View>

        {match.pricePerPlayer && (
          <View style={styles.matchDetailRow}>
            <Text style={styles.priceText}>💰 {match.pricePerPlayer} TL / Kişi</Text>
          </View>
        )}

        {/* Friendly Stats Impact */}
        {isFriendly && !match.affectsStandings && (
          <View style={styles.friendlyInfoBanner}>
            <TrendingUp size={12} color="#6B7280" strokeWidth={2} />
            <Text style={styles.friendlyInfoText}>Puan durumunu etkilemez</Text>
          </View>
        )}
      </View>

      <View style={styles.matchCardFooter}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {match.status}
          </Text>
        </View>

        {match.score && (
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{match.score}</Text>
          </View>
        )}
      </View>

      {/* Registration Banner */}
      {match.status === 'Kayıt Açık' && !isPlayerInMatch && (
        <TouchableOpacity
          style={styles.registrationBanner}
          onPress={(e: any) => {
            e.stopPropagation();
            NavigationService.navigateToMatchRegistration(match.id);
          }}
          activeOpacity={0.7}
        >
          <AlertCircle size={16} color="#10B981" strokeWidth={2} />
          <Text style={styles.registrationText}>Kayıt açık - Hemen katıl!</Text>
          <ChevronRight size={16} color="#10B981" strokeWidth={2} />
        </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
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
  matchTypeChipActive: {
    borderWidth: 1.5,
  },
  matchTypeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  matchTypeTextActive: {
    fontWeight: '700',
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
    borderWidth: 1.5,
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    fontWeight: '700',
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
  sportFilterChipActive: {
    borderWidth: 1.5,
  },
  sportFilterEmoji: {
    fontSize: 14,
  },
  sportFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  sportFilterTextActive: {
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
  matchList: {
    flex: 1,
  },
  matchCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchCardPast: {
    opacity: 0.7,
  },
  matchCardPlayer: {
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  matchCardFriendly: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  matchTypeHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  privacyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  matchIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sportEmoji: {
    fontSize: 22,
  },
  matchCardInfo: {
    flex: 1,
  },
  matchCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  matchCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  playerBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  matchCardMeta: {
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
  matchCardBody: {
    gap: 8,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  matchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchDetailText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  priceText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '700',
  },
  friendlyInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  friendlyInfoText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  matchCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scoreBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  registrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
  },
  registrationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
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
    height: 20,
  },
});