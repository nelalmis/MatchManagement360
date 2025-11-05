// src/screens/Fixture/FixtureListScreen.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  ListOrdered,
  Calendar,
  MapPin,
  DollarSign,
  Repeat,
  ChevronRight,
  Trophy,
  Clock,
  Search,
  X,
  Filter,
  Users,
  TrendingUp,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { FixtureListRouteProp, NavigationService } from '../../navigation';
import { useAuth } from '../../hooks';
import { IFixture, ILeague } from '../../types/entity/types';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { getSportPrimaryColor } from '../../utils/theme';
import { CustomHeader } from '../../components/CustomHeader';

type TabType = 'active' | 'inactive';
type SortType = 'nextMatch' | 'name' | 'totalMatches';

export const FixtureListScreen: React.FC = () => {
  const route = useRoute<FixtureListRouteProp>();
  const { user } = useAuth();
  const leagueId = route.params.leagueId;

  // State
  const [league, setLeague] = useState<ILeague | null>(null);
  const [fixtures, setFixtures] = useState<IFixture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('active');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('nextMatch');

  // Permissions
  const isAdmin = league?.members?.admins.includes(user?.id || '') || false;

  useEffect(() => {
    loadData();
  }, [leagueId]);

  // Filtered and sorted fixtures
  const filteredFixtures = useMemo(() => {
    let filtered = fixtures.filter(f => f.status === activeTab);

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        f =>
          f.title.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query) ||
          f.venue.location.toLowerCase().includes(query)
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nextMatch':
          // Sort by next match date (earliest first)
          if (!a.nextMatchDate && !b.nextMatchDate) return 0;
          if (!a.nextMatchDate) return 1;
          if (!b.nextMatchDate) return -1;
          return new Date(a.nextMatchDate).getTime() - new Date(b.nextMatchDate).getTime();

        case 'name':
          return a.title.localeCompare(b.title);

        case 'totalMatches':
          return b.totalMatches - a.totalMatches;

        default:
          return 0;
      }
    });

    return filtered;
  }, [fixtures, activeTab, searchQuery, sortBy]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [leagueResponse, fixturesResponse] = await Promise.all([
        LeagueService.getLeague(leagueId),
        FixtureService.getLeagueFixtures(leagueId),
      ]);

      if (leagueResponse.success && leagueResponse.data) {
        setLeague(leagueResponse.data);
      }

      if (fixturesResponse.success && fixturesResponse.data) {
        setFixtures(fixturesResponse.data);
      }
    } catch (error) {
      console.error('Error loading fixtures:', error);
      Alert.alert('Hata', 'Fikstürler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateFixture = () => {
    NavigationService.navigateToCreateFixture(leagueId);
  };

  const handleFixturePress = (fixtureId: string) => {
    NavigationService.navigateToFixtureDetail(fixtureId);
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Bugün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yarın ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays > 0 && diffInDays < 7) {
      const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
      return `${dayNames[date.getDay()]} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getTimeUntilMatch = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} gün`;
    } else if (diffInHours > 0) {
      return `${diffInHours} saat`;
    } else {
      return 'Yakında';
    }
  };

  const getPatternText = (pattern?: IFixture['schedule']['pattern']) => {
    if (!pattern) return '';
    switch (pattern.type) {
      case 'weekly':
        return 'Haftalık';
      case 'biweekly':
        return 'İki haftada bir';
      case 'monthly':
        return 'Aylık';
      case 'custom':
        return `${pattern.interval} günde bir`;
      default:
        return '';
    }
  };

  const isOrganizer = (fixture: IFixture): boolean => {
    return fixture.permissions.organizers.includes(user?.id || '');
  };

  if (loading || !league) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const sportColor = getSportPrimaryColor(league.sportType);
  const activeFixtures = fixtures.filter(f => f.status === 'active');
  const inactiveFixtures = fixtures.filter(f => f.status === 'inactive');

  // Stats
  const myFixtures = fixtures.filter(f => isOrganizer(f));
  const upcomingFixtures = activeFixtures.filter(f => f.nextMatchDate);

  return (
    <View style={styles.container}>
      {/* Header */}
      <CustomHeader
        title="Fikstürler"
        subtitle={league.title}
        sportType={league.sportType}
        showIcon={true}
        showBack={true}
        showCreate={isAdmin}
        onLeftPress={() => NavigationService.goBack()}
        onCreatePress={handleCreateFixture}
      />
      {/* 
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => NavigationService.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Fikstürler</Text>
          <View style={styles.headerSubtitleRow}>
            <Trophy size={14} color={sportColor} strokeWidth={2} />
            <Text style={styles.headerSubtitle}>{league.title}</Text>
          </View>
        </View>

        {isAdmin && (
          <TouchableOpacity
            onPress={handleCreateFixture}
            style={styles.createButton}
            activeOpacity={0.7}
          >
            <Plus size={24} color={sportColor} strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {!isAdmin && <View style={styles.headerRight} />}
      </View> */}

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <View style={[styles.quickStatCard, { borderLeftColor: sportColor }]}>
          <View style={[styles.quickStatIconContainer, { backgroundColor: sportColor + '20' }]}>
            <ListOrdered size={20} color={sportColor} strokeWidth={2.5} />
          </View>
          <View style={styles.quickStatContent}>
            <Text style={styles.quickStatValue}>{activeFixtures.length}</Text>
            <Text style={styles.quickStatLabel}>Aktif Fikstür</Text>
          </View>
        </View>

        <View style={[styles.quickStatCard, { borderLeftColor: '#F59E0B' }]}>
          <View style={[styles.quickStatIconContainer, { backgroundColor: '#F59E0B20' }]}>
            <Clock size={20} color="#F59E0B" strokeWidth={2.5} />
          </View>
          <View style={styles.quickStatContent}>
            <Text style={styles.quickStatValue}>{upcomingFixtures.length}</Text>
            <Text style={styles.quickStatLabel}>Yaklaşan Maç</Text>
          </View>
        </View>

        <View style={[styles.quickStatCard, { borderLeftColor: '#3B82F6' }]}>
          <View style={[styles.quickStatIconContainer, { backgroundColor: '#3B82F620' }]}>
            <Users size={20} color="#3B82F6" strokeWidth={2.5} />
          </View>
          <View style={styles.quickStatContent}>
            <Text style={styles.quickStatValue}>{myFixtures.length}</Text>
            <Text style={styles.quickStatLabel}>Yönettiğim</Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#9CA3AF" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Fikstür ara..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <X size={16} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showFilters && { backgroundColor: sportColor + '20' },
          ]}
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
        <View style={styles.filtersPanel}>
          <Text style={styles.filterTitle}>Sıralama</Text>
          <View style={styles.filterOptions}>
            {[
              { value: 'nextMatch' as SortType, label: 'Sonraki Maç', icon: Calendar },
              { value: 'name' as SortType, label: 'İsim', icon: ListOrdered },
              { value: 'totalMatches' as SortType, label: 'Maç Sayısı', icon: TrendingUp },
            ].map(option => {
              const Icon = option.icon;
              const isSelected = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    isSelected && {
                      backgroundColor: sportColor + '20',
                      borderColor: sportColor,
                    },
                  ]}
                  onPress={() => setSortBy(option.value)}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={18}
                    color={isSelected ? sportColor : '#6B7280'}
                    strokeWidth={2}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      isSelected && { color: sportColor, fontWeight: '700' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'active' && [
              styles.tabActive,
              { borderBottomColor: sportColor },
            ],
          ]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && [
                styles.tabTextActive,
                { color: sportColor },
              ],
            ]}
          >
            Aktif
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'active' && { backgroundColor: sportColor },
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'active' && styles.tabBadgeTextActive,
              ]}
            >
              {activeFixtures.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'inactive' && [
              styles.tabActive,
              { borderBottomColor: '#6B7280' },
            ],
          ]}
          onPress={() => setActiveTab('inactive')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'inactive' && styles.tabTextActive,
            ]}
          >
            Pasif
          </Text>
          <View
            style={[
              styles.tabBadge,
              activeTab === 'inactive' && { backgroundColor: '#6B7280' },
            ]}
          >
            <Text
              style={[
                styles.tabBadgeText,
                activeTab === 'inactive' && styles.tabBadgeTextActive,
              ]}
            >
              {inactiveFixtures.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[sportColor]}
            tintColor={sportColor}
          />
        }
      >
        {filteredFixtures.length > 0 ? (
          filteredFixtures.map(fixture => (
            <FixtureCard
              key={fixture.id}
              fixture={fixture}
              sportColor={sportColor}
              isOrganizer={isOrganizer(fixture)}
              onPress={() => handleFixturePress(fixture.id)}
              formatDate={formatDate}
              getTimeUntilMatch={getTimeUntilMatch}
              getPatternText={getPatternText}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <ListOrdered size={64} color="#D1D5DB" strokeWidth={2} />
            <Text style={styles.emptyTitle}>
              {searchQuery
                ? 'Arama sonucu bulunamadı'
                : activeTab === 'active'
                  ? 'Aktif fikstür yok'
                  : 'Pasif fikstür yok'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Farklı anahtar kelimeler deneyin'
                : activeTab === 'active'
                  ? isAdmin
                    ? 'Yeni bir fikstür oluşturarak başlayın'
                    : 'Henüz aktif fikstür bulunmuyor'
                  : 'Devre dışı bırakılmış fikstür yok'}
            </Text>
            {isAdmin && activeTab === 'active' && !searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: sportColor }]}
                onPress={handleCreateFixture}
                activeOpacity={0.7}
              >
                <Plus size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.emptyButtonText}>Fikstür Oluştur</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

// ============================================
// FIXTURE CARD COMPONENT
// ============================================

interface FixtureCardProps {
  fixture: IFixture;
  sportColor: string;
  isOrganizer: boolean;
  onPress: () => void;
  formatDate: (date: string) => string;
  getTimeUntilMatch: (date: string) => string;
  getPatternText: (pattern?: IFixture['schedule']['pattern']) => string;
}

const FixtureCard: React.FC<FixtureCardProps> = ({
  fixture,
  sportColor,
  isOrganizer,
  onPress,
  formatDate,
  getTimeUntilMatch,
  getPatternText,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.fixtureCard,
        isOrganizer && { borderColor: sportColor, borderWidth: 2 },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.fixtureHeader}>
        <View style={styles.fixtureTitleRow}>
          <View
            style={[styles.fixtureIcon, { backgroundColor: sportColor + '20' }]}
          >
            <ListOrdered size={18} color={sportColor} strokeWidth={2} />
          </View>
          <View style={styles.fixtureTitleContainer}>
            <Text style={styles.fixtureTitle} numberOfLines={1}>
              {fixture.title}
            </Text>
            {isOrganizer && (
              <View
                style={[styles.organizerBadge, { backgroundColor: sportColor }]}
              >
                <Text style={styles.organizerBadgeText}>Organizatör</Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
      </View>

      {/* Description */}
      {fixture.description && (
        <Text style={styles.fixtureDescription} numberOfLines={2}>
          {fixture.description}
        </Text>
      )}

      {/* Next Match - Prominent Display */}
      {fixture.nextMatchDate ? (
        <View style={styles.nextMatchContainer}>
          <View style={styles.nextMatchHeader}>
            <Clock size={14} color={sportColor} strokeWidth={2} />
            <Text style={[styles.nextMatchLabel, { color: sportColor }]}>
              Sonraki Maç
            </Text>
          </View>
          <View style={styles.nextMatchBody}>
            <Text style={styles.nextMatchDate}>
              {formatDate(fixture.nextMatchDate)}
            </Text>
            <View
              style={[
                styles.nextMatchBadge,
                { backgroundColor: sportColor + '20' },
              ]}
            >
              <Text style={[styles.nextMatchBadgeText, { color: sportColor }]}>
                {getTimeUntilMatch(fixture.nextMatchDate)} kaldı
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noMatchContainer}>
          <Calendar size={14} color="#9CA3AF" strokeWidth={2} />
          <Text style={styles.noMatchText}>Maç planlanmadı</Text>
        </View>
      )}

      {/* Location */}
      {fixture.venue.location && (
        <View style={styles.fixtureInfoRow}>
          <MapPin size={14} color="#6B7280" strokeWidth={2} />
          <Text style={styles.fixtureInfoText} numberOfLines={1}>
            {fixture.venue.location}
          </Text>
        </View>
      )}

      {/* Stats Footer */}
      <View style={styles.fixtureFooter}>
        <View style={styles.fixtureStatItem}>
          <Calendar size={12} color="#9CA3AF" strokeWidth={2} />
          <Text style={styles.fixtureStatText}>{fixture.totalMatches} maç</Text>
        </View>

        {fixture.schedule.isRecurring && (
          <View style={styles.fixtureStatItem}>
            <Repeat size={12} color="#8B5CF6" strokeWidth={2} />
            <Text style={[styles.fixtureStatText, { color: '#8B5CF6' }]}>
              {getPatternText(fixture.schedule.pattern)}
            </Text>
          </View>
        )}

        <View style={styles.fixtureStatItem}>
          <DollarSign size={12} color="#9CA3AF" strokeWidth={2} />
          <Text style={styles.fixtureStatText}>
            {fixture.venue.pricePerPlayer} TL
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    // paddingTop: 40,
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  createButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  quickStatCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderLeftWidth: 3,
  },
  quickStatIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatContent: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    lineHeight: 24,
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Filters Panel
  filtersPanel: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  tabBadge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabBadgeTextActive: {
    color: 'white',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // Fixture Card
  fixtureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fixtureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fixtureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  fixtureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixtureTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixtureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  organizerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  organizerBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  fixtureDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 12,
  },

  // Next Match Container - Prominent
  nextMatchContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nextMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  nextMatchLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextMatchBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextMatchDate: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  nextMatchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nextMatchBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // No Match
  noMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  noMatchText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Info Row
  fixtureInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  fixtureInfoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },

  // Footer
  fixtureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fixtureStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fixtureStatText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },

  bottomSpacing: {
    height: 20,
  },
});