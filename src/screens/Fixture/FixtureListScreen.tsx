// src/screens/Fixture/FixtureListScreen.tsx

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import {
  Plus,
  ListOrdered,
  Calendar,
  MapPin,
  DollarSign,
  Repeat,
  ChevronRight,
  Clock,
  Search,
  X,
  Filter,
  Users,
  TrendingUp,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { FixtureListRouteProp, FixtureNavigationService, goBack } from '../../navigation';
import { useAuth } from '../../hooks';
import { IFixture, ILeague } from '../../types/entity/types';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { getSportPrimaryColor } from '../../utils/theme';
import { CustomHeader } from '../../components/CustomHeader';
import { LoadingScreen } from '../Common';
import { FixtureCard } from './components';
import { isOrganizer } from '../../helper/fixtureHelper';

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
    FixtureNavigationService.navigateToCreateFixture(leagueId);
  };

  const handleFixturePress = (fixtureId: string) => {
    FixtureNavigationService.navigateToFixtureDetail(fixtureId);
  };

  if (loading || !league) {
    return <LoadingScreen />;
  }

  const sportColor = getSportPrimaryColor(league.sportType);
  const activeFixtures = fixtures.filter(f => f.status === 'active');
  const inactiveFixtures = fixtures.filter(f => f.status === 'inactive');

  // Stats
  const myFixtures = fixtures.filter(f => isOrganizer(f, user?.id || ''));
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
        onLeftPress={() => goBack()}
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
              isOrganizer={isOrganizer(fixture, user?.id || '')}
              onPress={() => handleFixturePress(fixture.id)}
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
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    // paddingTop: 40,
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