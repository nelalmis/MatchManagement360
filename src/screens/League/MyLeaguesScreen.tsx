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
  Users,
  Calendar,
  Plus,
  ChevronRight,
  Trophy,
} from 'lucide-react-native';
import { useNavigationContext } from '../../context/NavigationContext';
import { ILeague, SportType, getSportIcon, getSportColor } from '../../types/types';

export const MyLeaguesScreen: React.FC = () => {
  const navigation = useNavigationContext();
  const [loading, setLoading] = useState(true);
  const [leagues, setLeagues] = useState<ILeague[]>([]);
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');

  const sports: Array<{ type: SportType | 'all'; emoji: string; label: string }> = [
    { type: 'all', emoji: '🏆', label: 'Tümü' },
    { type: 'Futbol', emoji: '⚽', label: 'Futbol' },
    { type: 'Basketbol', emoji: '🏀', label: 'Basketbol' },
    { type: 'Voleybol', emoji: '🏐', label: 'Voleybol' },
    { type: 'Tenis', emoji: '🎾', label: 'Tenis' },
  ];

  useEffect(() => {
    loadLeagues();
  }, []);

  const loadLeagues = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockLeagues: ILeague[] = [
        // {
        //   id: '1',
        //   title: 'Architect Halı Saha Ligi',
        //   sportType: 'Futbol',
        //   spreadSheetId: 'sheet123',
        //   matchFixtures: [],
        //   playerIds: ['user1', 'user2', 'user3', 'user4', 'user5'],

        // },
        // {
        //   id: '2',
        //   title: 'Hafta Sonu Basketbol Ligi',
        //   sportType: 'Basketbol',
        //   spreadSheetId: 'sheet456',
        //   matchFixtures: [],
        //   playerIds: ['user1', 'user3', 'user6'],
        // },
        // {
        //   id: '3',
        //   title: 'Plaj Voleybol Turnuvası',
        //   sportType: 'Voleybol',
        //   spreadSheetId: 'sheet789',
        //   matchFixtures: [],
        //   playerIds: ['user1', 'user7', 'user8'],
        // },
      ];
      
      setTimeout(() => {
        setLeagues(mockLeagues);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Load leagues error:', error);
      setLoading(false);
    }
  };

  const filteredLeagues = selectedSport === 'all' 
    ? leagues 
    : leagues.filter(league => league.sportType === selectedSport);

  const handleCreateLeague = () => {
    navigation.navigate('createLeague');
  };

  const handleLeaguePress = (league: ILeague) => {
    navigation.navigate('leagueDetail', { leagueId: league.id });
  };

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Info */}
        <View style={styles.headerCard}>
          <View style={styles.headerIconContainer}>
            <Trophy color="#16a34a" size={28} strokeWidth={2} />
          </View>
          <Text style={styles.headerTitle}>Liglerim</Text>
          <Text style={styles.headerSubtitle}>
            Tüm sporlardan liglerini yönet ve fikstür oluştur
          </Text>
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
                  selectedSport === sport.type && styles.filterChipActive,
                ]}
                onPress={() => setSelectedSport(sport.type)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterEmoji}>{sport.emoji}</Text>
                <Text
                  style={[
                    styles.filterLabel,
                    selectedSport === sport.type && styles.filterLabelActive,
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
            <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Trophy color="#2563EB" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>{leagues.length}</Text>
            <Text style={styles.statLabel}>Lig</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Calendar color="#16a34a" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>
              {leagues.reduce((acc, l) => acc + l.matchFixtures.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Fikstür</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Users color="#F59E0B" size={20} strokeWidth={2} />
            </View>
            <Text style={styles.statValue}>
              {leagues.reduce((acc, l) => acc + l.playerIds.length, 0)}
            </Text>
            <Text style={styles.statLabel}>Oyuncu</Text>
          </View>
        </View>

        {/* Leagues List */}
        <View style={styles.leaguesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedSport === 'all' ? 'Tüm Ligler' : `${selectedSport} Ligleri`}
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateLeague}
              activeOpacity={0.7}
            >
              <Plus color="white" size={20} strokeWidth={2.5} />
              <Text style={styles.createButtonText}>Yeni Lig</Text>
            </TouchableOpacity>
          </View>

          {filteredLeagues.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Trophy color="#9CA3AF" size={48} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {selectedSport === 'all' ? 'Henüz Lig Yok' : `Henüz ${selectedSport} Ligi Yok`}
              </Text>
              <Text style={styles.emptyText}>
                İlk ligini oluştur ve oyuncuları davet et
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleCreateLeague}
                activeOpacity={0.8}
              >
                <Plus color="white" size={20} strokeWidth={2.5} />
                <Text style={styles.emptyButtonText}>Lig Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.leaguesList}>
              {filteredLeagues.map((league) => (
                <TouchableOpacity
                  key={league.id}
                  style={styles.leagueCard}
                  onPress={() => handleLeaguePress(league)}
                  activeOpacity={0.7}
                >
                  <View style={styles.leagueHeader}>
                    <View 
                      style={[
                        styles.leagueIconContainer,
                        { backgroundColor: `${getSportColor(league.sportType)}15` }
                      ]}
                    >
                      <Text style={styles.sportEmoji}>
                        {getSportIcon(league.sportType)}
                      </Text>
                    </View>
                    <View style={styles.leagueTitleContainer}>
                      <Text style={styles.leagueTitle}>{league.title}</Text>
                      <View style={styles.leagueMetaRow}>
                        <View style={styles.leagueMeta}>
                          <Users color="#6B7280" size={14} strokeWidth={2} />
                          <Text style={styles.leagueMetaText}>
                            {league.playerIds.length} Oyuncu
                          </Text>
                        </View>
                        <View style={styles.leagueMeta}>
                          <Calendar color="#6B7280" size={14} strokeWidth={2} />
                          <Text style={styles.leagueMetaText}>
                            {league.matchFixtures.length} Fikstür
                          </Text>
                        </View>
                      </View>
                    </View>
                    <ChevronRight color="#9CA3AF" size={20} strokeWidth={2} />
                  </View>

                  <View style={styles.leagueStats}>
                    <View style={styles.sportTypeBadge}>
                      <Text style={[styles.sportTypeText, { color: getSportColor(league.sportType) }]}>
                        {league.sportType}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {filteredLeagues.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateLeague}
          activeOpacity={0.8}
        >
          <Plus color="white" size={28} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
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
    paddingBottom: 100,
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
    marginBottom: 20,
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
    fontSize: 18,
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
    marginBottom: 24,
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
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  leaguesSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  leaguesList: {
    gap: 12,
  },
  leagueCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  leagueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  leagueIconContainer: {
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
  leagueTitleContainer: {
    flex: 1,
  },
  leagueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  leagueMetaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  leagueMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leagueMetaText: {
    fontSize: 13,
    color: '#6B7280',
  },
  leagueStats: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  sportTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  sportTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});