import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Users,
  Calendar,
  Trophy,
  Settings,
  Plus,
  ChevronRight,
  UserPlus,
  Clock,
  Target,
  TrendingUp,
} from 'lucide-react-native';
import { useNavigationContext } from '../../context/NavigationContext';
import { ILeague, IMatchFixture, getSportIcon, getSportColor } from '../../types/types';

interface LeagueDetailScreenProps {
  route?: {
    params?: {
      leagueId: string;
    };
  };
}

export const LeagueDetailScreen: React.FC<LeagueDetailScreenProps> = ({ route }) => {
  const navigation = useNavigationContext();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'players' | 'stats'>('fixtures');

  const [leagueData, setLeagueData] = useState<ILeague | null>(null);
  const [fixtures, setFixtures] = useState<IMatchFixture[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    loadLeagueData();
  }, []);

  const loadLeagueData = async () => {
    setLoading(true);
    try {
      // Mock data
      const mockLeague: any = {
        id: '1',
        title: 'Architect Halı Saha Ligi',
        sportType: 'Futbol',
        spreadSheetId: 'sheet123',
        matchFixtures: [],
        playerIds: ['1', '2', '3', '4', '5'],
      };

      const mockFixtures: IMatchFixture[] = [
        {
          id: '1',
          leagueId: '1',
          title: 'Salı Maçı',
          sportType: 'Futbol',
          registrationStartTime: new Date(),
          matchStartTime: new Date('2025-10-15T20:00:00'),
          matchTotalTimeInMinute: 60,
          staffPlayerCount: 10,
          reservePlayerCount: 2,
          isPeriodic: true,
          periodDayCount: 7,
          location: 'Arena Spor Tesisleri',
          peterIban: 'TR00 0000 0000 0000 0000 0000 00',
          peterFullName: 'Nevzat Elalmış',
          pricePerPlayer: 150,
          organizerPlayerIds:["2"],
          directPlayerIds:["4"],
          createdAt:'',
          status: 'Aktif',
          surveyFormId: '',
          commentFormId: '',
          calendarId: '',
          matchIds: ['m1', 'm2', 'm3'],
        },
        {
          id: '2',
          leagueId: '1',
          title: 'Perşembe Maçı',
          sportType: 'Futbol',
          registrationStartTime: new Date(),
          matchStartTime: new Date('2025-10-17T21:00:00'),
          matchTotalTimeInMinute: 60,
          staffPlayerCount: 10,
          reservePlayerCount: 2,
          isPeriodic: true,
          periodDayCount: 7,
          location: 'Arena Spor Tesisleri',
          peterIban: 'TR00 0000 0000 0000 0000 0000 00',
          peterFullName: 'Nevzat Elalmış',
          pricePerPlayer: 150,
         createdAt:'',
         organizerPlayerIds:["1"],
          status: 'Aktif',
          surveyFormId: '',
          commentFormId: '',
          calendarId: '',
          matchIds: ['m4', 'm5'],
        },
        {
          id: '3',
          leagueId: '1',
          title: 'Cumartesi Turnuvası',
          sportType: 'Futbol',
          registrationStartTime: new Date(),
          matchStartTime: new Date('2025-10-19T18:30:00'),
          matchTotalTimeInMinute: 90,
          staffPlayerCount: 12,
          reservePlayerCount: 3,
          isPeriodic: false,
          location: 'City Halısaha',
          peterIban: 'TR00 0000 0000 0000 0000 0000 00',
          peterFullName: 'Nevzat Elalmış',
          pricePerPlayer: 200,
         createdAt:'',
         organizerPlayerIds:["1"],
          status: 'Aktif',
          surveyFormId: '',
          commentFormId: '',
          calendarId: '',
          matchIds: ['m6'],
        },
      ];

      const mockPlayers = [
        { id: '1', name: 'Nevzat Elalmış', rating: 4.5, matches: 24, goals: 12 },
        { id: '2', name: 'Ali Yılmaz', rating: 4.2, matches: 20, goals: 8 },
        { id: '3', name: 'Mehmet Kaya', rating: 4.8, matches: 28, goals: 15 },
        { id: '4', name: 'Ahmet Demir', rating: 4.0, matches: 18, goals: 5 },
        { id: '5', name: 'Can Öztürk', rating: 4.6, matches: 22, goals: 10 },
      ];

      setTimeout(() => {
        setLeagueData(mockLeague);
        setFixtures(mockFixtures);
        setPlayers(mockPlayers);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Load league error:', error);
      setLoading(false);
    }
  };

  const handleCreateFixture = () => {
    navigation.navigate('createFixture', { leagueId: leagueData?.id });
  };

  const handleFixturePress = (fixture: IMatchFixture) => {
    navigation.navigate('fixtureDetail', { fixtureId: fixture.id });
  };

  const handleInvitePlayer = () => {
    Alert.alert('Oyuncu Davet Et', 'Oyuncu davet özelliği yakında eklenecek');
  };

  const handleSettings = () => {
    Alert.alert('Lig Ayarları', 'Ayarlar özelliği yakında eklenecek');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Lig yükleniyor...</Text>
      </View>
    );
  }

  if (!leagueData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lig bulunamadı</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View 
              style={[
                styles.headerIconContainer,
                { backgroundColor: `${getSportColor(leagueData.sportType)}15` }
              ]}
            >
              <Text style={styles.sportEmoji}>{getSportIcon(leagueData.sportType)}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleSettings}
              activeOpacity={0.7}
            >
              <Settings color="#6B7280" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.leagueTitle}>{leagueData.title}</Text>
          
          {/* Sport Badge */}
          <View style={[styles.sportBadge, { backgroundColor: `${getSportColor(leagueData.sportType)}15` }]}>
            <Text style={[styles.sportBadgeText, { color: getSportColor(leagueData.sportType) }]}>
              {leagueData.sportType}
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatItem}>
              <Calendar color="#16a34a" size={20} strokeWidth={2} />
              <Text style={styles.quickStatValue}>{fixtures.length}</Text>
              <Text style={styles.quickStatLabel}>Fikstür</Text>
            </View>

            <View style={styles.quickStatDivider} />

            <View style={styles.quickStatItem}>
              <Users color="#16a34a" size={20} strokeWidth={2} />
              <Text style={styles.quickStatValue}>{players.length}</Text>
              <Text style={styles.quickStatLabel}>Oyuncu</Text>
            </View>

            <View style={styles.quickStatDivider} />

            <View style={styles.quickStatItem}>
              <Trophy color="#16a34a" size={20} strokeWidth={2} />
              <Text style={styles.quickStatValue}>
                {fixtures.reduce((acc, f) => acc + f.matchIds.length, 0)}
              </Text>
              <Text style={styles.quickStatLabel}>Maç</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.primaryActionButton}
              onPress={handleCreateFixture}
              activeOpacity={0.8}
            >
              <Plus color="white" size={20} strokeWidth={2.5} />
              <Text style={styles.primaryActionText}>Fikstür Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={handleInvitePlayer}
              activeOpacity={0.8}
            >
              <UserPlus color="#16a34a" size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'fixtures' && styles.activeTab]}
            onPress={() => setActiveTab('fixtures')}
            activeOpacity={0.7}
          >
            <Calendar
              color={activeTab === 'fixtures' ? '#16a34a' : '#6B7280'}
              size={20}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'fixtures' && styles.activeTabText,
              ]}
            >
              Fikstürler
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'players' && styles.activeTab]}
            onPress={() => setActiveTab('players')}
            activeOpacity={0.7}
          >
            <Users
              color={activeTab === 'players' ? '#16a34a' : '#6B7280'}
              size={20}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'players' && styles.activeTabText,
              ]}
            >
              Oyuncular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
            onPress={() => setActiveTab('stats')}
            activeOpacity={0.7}
          >
            <TrendingUp
              color={activeTab === 'stats' ? '#16a34a' : '#6B7280'}
              size={20}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === 'stats' && styles.activeTabText,
              ]}
            >
              İstatistikler
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'fixtures' && (
            <View style={styles.fixturesTab}>
              {fixtures.length === 0 ? (
                <View style={styles.emptyState}>
                  <Calendar color="#9CA3AF" size={48} strokeWidth={1.5} />
                  <Text style={styles.emptyTitle}>Henüz Fikstür Yok</Text>
                  <Text style={styles.emptyText}>İlk fikstürünüzü oluşturun</Text>
                </View>
              ) : (
                fixtures.map((fixture) => (
                  <TouchableOpacity
                    key={fixture.id}
                    style={styles.fixtureCard}
                    onPress={() => handleFixturePress(fixture)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.fixtureHeader}>
                      <View style={styles.fixtureIconContainer}>
                        <Calendar color="#16a34a" size={24} strokeWidth={2} />
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
                      <Text style={styles.fixtureDetailText}>
                        👥 {fixture.staffPlayerCount} Kadro • 🔄 {fixture.reservePlayerCount} Yedek
                      </Text>
                      <Text style={styles.fixtureDetailText}>
                        📍 {fixture.location}
                      </Text>
                      <Text style={styles.fixtureDetailText}>
                        💰 ₺{fixture.pricePerPlayer} • ⏱️ {fixture.matchTotalTimeInMinute} dk
                      </Text>
                      <Text style={styles.fixtureDetailText}>
                        🏆 {fixture.matchIds.length} Maç
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}

          {activeTab === 'players' && (
            <View style={styles.playersTab}>
              {players.map((player, index) => (
                <View key={player.id} style={styles.playerCard}>
                  <View style={styles.playerLeft}>
                    <View style={styles.playerRank}>
                      <Text style={styles.playerRankText}>{index + 1}</Text>
                    </View>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {player.name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>{player.name}</Text>
                      <View style={styles.playerStats}>
                        <Text style={styles.playerStatText}>
                          ⚽ {player.goals} Gol
                        </Text>
                        <Text style={styles.playerStatText}>•</Text>
                        <Text style={styles.playerStatText}>
                          🏃 {player.matches} Maç
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.playerRating}>
                    <Text style={styles.playerRatingValue}>
                      {player.rating.toFixed(1)}
                    </Text>
                    <Text style={styles.playerRatingLabel}>⭐</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'stats' && (
            <View style={styles.statsTab}>
              <View style={styles.statCard}>
                <Text style={styles.statCardTitle}>Genel İstatistikler</Text>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Toplam Maç</Text>
                  <Text style={styles.statValue}>
                    {fixtures.reduce((acc, f) => acc + f.matchIds.length, 0)}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Aktif Fikstür</Text>
                  <Text style={styles.statValue}>
                    {fixtures.filter((f) => f.status === 'Aktif').length}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Toplam Oyuncu</Text>
                  <Text style={styles.statValue}>{players.length}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Ortalama Puan</Text>
                  <Text style={styles.statValue}>
                    {(
                      players.reduce((acc, p) => acc + p.rating, 0) / players.length
                    ).toFixed(1)}
                  </Text>
                </View>
              </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportEmoji: {
    fontSize: 32,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  leagueTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sportBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  sportBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
    gap: 6,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  secondaryActionButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#DCFCE7',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#16a34a',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  fixturesTab: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    gap: 6,
  },
  fixtureDetailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  playersTab: {
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  playerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  playerRating: {
    alignItems: 'center',
  },
  playerRatingValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  playerRatingLabel: {
    fontSize: 14,
  },
  statsTab: {
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statLabel: {
    fontSize: 15,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
});