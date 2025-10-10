import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Calendar,
  Clock,
  Target,
  MapPin,
  Users,
  Trophy,
  ChevronRight,
} from 'lucide-react-native';
import { useNavigationContext } from '../../context/NavigationContext';
import { IMatchFixture, SportType, getSportIcon, getSportColor } from '../../types/types';

export const MyFixturesScreen: React.FC = () => {
  const navigation = useNavigationContext();
  const [loading, setLoading] = useState(true);
  const [fixtures, setFixtures] = useState<IMatchFixture[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'periodic' | 'once'>('all');
  const [filterSport, setFilterSport] = useState<SportType | 'all'>('all');

  const sports: Array<{ type: SportType | 'all'; emoji: string; label: string }> = [
    { type: 'all', emoji: '🏆', label: 'Tümü' },
    { type: 'Futbol', emoji: '⚽', label: 'Futbol' },
    { type: 'Basketbol', emoji: '🏀', label: 'Basketbol' },
    { type: 'Voleybol', emoji: '🏐', label: 'Voleybol' },
  ];

  useEffect(() => {
    loadFixtures();
  }, []);

  const loadFixtures = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockFixtures: IMatchFixture[] = [
        {
          id: 'f1',
          leagueId: 'l1',
          title: 'Salı Maçı',
          sportType: 'Futbol',
          registrationStartTime: new Date(),
          matchStartTime: new Date('2025-10-15T20:00:00'),
          matchTotalTimeInMinute: 60,
          isPeriodic: true,
          periodDayCount: 7,
          staffPlayerCount: 10,
          reservePlayerCount: 2,
          location: 'Arena Spor Tesisleri',
          pricePerPlayer: 150,
          peterIban: 'TR00 0000 0000 0000 0000 0000 00',
          peterFullName: 'Nevzat Elalmış',
          organizerPlayerIds: ['org1'],
          status: 'Aktif',
          matchIds: ['m1', 'm2', 'm3'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'f2',
          leagueId: 'l1',
          title: 'Perşembe Maçı',
          sportType: 'Futbol',
          registrationStartTime: new Date(),
          matchStartTime: new Date('2025-10-17T21:00:00'),
          matchTotalTimeInMinute: 60,
          isPeriodic: true,
          periodDayCount: 7,
          staffPlayerCount: 10,
          reservePlayerCount: 2,
          location: 'Arena Spor Tesisleri',
          pricePerPlayer: 150,
          peterIban: 'TR00 0000 0000 0000 0000 0000 00',
          peterFullName: 'Nevzat Elalmış',
          organizerPlayerIds: ['org1'],
          status: 'Aktif',
          matchIds: ['m4', 'm5'],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'f3',
          leagueId: 'l2',
          title: 'Cumartesi Turnuvası',
          sportType: 'Basketbol',
          registrationStartTime: new Date(),
          matchStartTime: new Date('2025-10-19T18:30:00'),
          matchTotalTimeInMinute: 90,
          isPeriodic: false,
          staffPlayerCount: 10,
          reservePlayerCount: 2,
          location: 'City Spor Salonu',
          pricePerPlayer: 200,
          peterIban: 'TR00 0000 0000 0000 0000 0000 00',
          peterFullName: 'Nevzat Elalmış',
          organizerPlayerIds: ['org2'],
          status: 'Aktif',
          matchIds: ['m6'],
          createdAt: new Date().toISOString(),
        },
      ];

      setTimeout(() => {
        setFixtures(mockFixtures);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Load fixtures error:', error);
      setLoading(false);
    }
  };

  // Filtreleme
  const filteredFixtures = fixtures.filter((fixture) => {
    const matchType =
      filterType === 'all'
        ? true
        : filterType === 'periodic'
        ? fixture.isPeriodic
        : !fixture.isPeriodic;

    const matchSport =
      filterSport === 'all' ? true : fixture.sportType === filterSport;

    return matchType && matchSport;
  });

  const handleFixturePress = (fixture: IMatchFixture) => {
    navigation.navigate('fixtureDetail', { fixtureId: fixture.id });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Fikstürler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Info */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <Calendar color="#16a34a" size={28} strokeWidth={2} />
          </View>
          <Text style={styles.headerTitle}>Fikstürlerim</Text>
          <Text style={styles.headerSubtitle}>
            Katıldığınız tüm rutin ve tek seferlik maç organizasyonları
          </Text>
        </View>

        {/* Type Filter */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'all' && styles.filterChipActive,
              ]}
              onPress={() => setFilterType('all')}
              activeOpacity={0.7}
            >
              <Trophy color={filterType === 'all' ? '#16a34a' : '#6B7280'} size={16} strokeWidth={2} />
              <Text
                style={[
                  styles.filterLabel,
                  filterType === 'all' && styles.filterLabelActive,
                ]}
              >
                Tümü
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'periodic' && styles.filterChipActive,
              ]}
              onPress={() => setFilterType('periodic')}
              activeOpacity={0.7}
            >
              <Clock color={filterType === 'periodic' ? '#16a34a' : '#6B7280'} size={16} strokeWidth={2} />
              <Text
                style={[
                  styles.filterLabel,
                  filterType === 'periodic' && styles.filterLabelActive,
                ]}
              >
                Rutin
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterChip,
                filterType === 'once' && styles.filterChipActive,
              ]}
              onPress={() => setFilterType('once')}
              activeOpacity={0.7}
            >
              <Target color={filterType === 'once' ? '#16a34a' : '#6B7280'} size={16} strokeWidth={2} />
              <Text
                style={[
                  styles.filterLabel,
                  filterType === 'once' && styles.filterLabelActive,
                ]}
              >
                Tek Seferlik
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Sport Filter */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport.type}
                style={[
                  styles.filterChip,
                  filterSport === sport.type && styles.filterChipActive,
                ]}
                onPress={() => setFilterSport(sport.type)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterEmoji}>{sport.emoji}</Text>
                <Text
                  style={[
                    styles.filterLabel,
                    filterSport === sport.type && styles.filterLabelActive,
                  ]}
                >
                  {sport.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fixtures.length}</Text>
            <Text style={styles.statLabel}>Toplam Fikstür</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {fixtures.filter((f) => f.isPeriodic).length}
            </Text>
            <Text style={styles.statLabel}>Rutin</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {fixtures.filter((f) => !f.isPeriodic).length}
            </Text>
            <Text style={styles.statLabel}>Tek Seferlik</Text>
          </View>
        </View>

        {/* Fixtures List */}
        <View style={styles.fixturesSection}>
          <Text style={styles.sectionTitle}>
            {filteredFixtures.length} Fikstür
          </Text>

          {filteredFixtures.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar color="#9CA3AF" size={48} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Fikstür Bulunamadı</Text>
              <Text style={styles.emptyText}>
                Seçili filtrelere uygun fikstür yok
              </Text>
            </View>
          ) : (
            <View style={styles.fixturesList}>
              {filteredFixtures.map((fixture) => (
                <TouchableOpacity
                  key={fixture.id}
                  style={styles.fixtureCard}
                  onPress={() => handleFixturePress(fixture)}
                  activeOpacity={0.7}
                >
                  <View style={styles.fixtureHeader}>
                    <View
                      style={[
                        styles.fixtureIconContainer,
                        { backgroundColor: `${getSportColor(fixture.sportType)}15` },
                      ]}
                    >
                      <Text style={styles.sportEmoji}>
                        {getSportIcon(fixture.sportType)}
                      </Text>
                    </View>
                    <View style={styles.fixtureInfo}>
                      <Text style={styles.fixtureTitle}>{fixture.title}</Text>
                      <View style={styles.fixtureMeta}>
                        {fixture.isPeriodic ? (
                          <View style={styles.periodicBadge}>
                            <Clock color="#2563EB" size={12} strokeWidth={2} />
                            <Text style={styles.periodicText}>Rutin</Text>
                          </View>
                        ) : (
                          <View style={styles.onceBadge}>
                            <Target color="#F59E0B" size={12} strokeWidth={2} />
                            <Text style={styles.onceText}>Tek Seferlik</Text>
                          </View>
                        )}
                        <View
                          style={[
                            styles.statusBadge,
                            fixture.status === 'Aktif'
                              ? styles.activeStatus
                              : styles.inactiveStatus,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              fixture.status === 'Aktif'
                                ? styles.activeStatusText
                                : styles.inactiveStatusText,
                            ]}
                          >
                            {fixture.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <ChevronRight color="#9CA3AF" size={20} strokeWidth={2} />
                  </View>

                  <View style={styles.fixtureDetails}>
                    <View style={styles.fixtureDetailRow}>
                      <MapPin color="#6B7280" size={14} strokeWidth={2} />
                      <Text style={styles.fixtureDetailText}>{fixture.location}</Text>
                    </View>
                    <View style={styles.fixtureDetailRow}>
                      <Users color="#6B7280" size={14} strokeWidth={2} />
                      <Text style={styles.fixtureDetailText}>
                        {fixture.staffPlayerCount} Kadro • {fixture.reservePlayerCount}{' '}
                        Yedek
                      </Text>
                    </View>
                    <View style={styles.fixtureDetailRow}>
                      <Trophy color="#6B7280" size={14} strokeWidth={2} />
                      <Text style={styles.fixtureDetailText}>
                        {fixture.matchIds.length} Maç • ₺{fixture.pricePerPlayer}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerCard: {
    backgroundColor: 'white',
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  filterSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterScroll: {
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16a34a',
  },
  filterEmoji: {
    fontSize: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterLabelActive: {
    color: '#16a34a',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  fixturesSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  fixturesList: {
    gap: 12,
  },
  fixtureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fixtureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fixtureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sportEmoji: {
    fontSize: 28,
  },
  fixtureInfo: {
    flex: 1,
  },
  fixtureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  fixtureMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  periodicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  periodicText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  onceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  onceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeStatus: {
    backgroundColor: '#DCFCE7',
  },
  inactiveStatus: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeStatusText: {
    color: '#16a34a',
  },
  inactiveStatusText: {
    color: '#DC2626',
  },
  fixtureDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    gap: 8,
  },
  fixtureDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fixtureDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
});