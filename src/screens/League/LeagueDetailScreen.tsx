import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Users,
  Calendar,
  TrendingUp,
  Settings,
  Plus,
  ChevronRight,
  Crown,
  Shield,
  UserPlus,
  Clock,
  MapPin,
  Trophy,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import {
  ILeague,
  IMatchFixture,
  IStandings,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { leagueService } from '../../services/leagueService';
import { matchFixtureService } from '../../services/matchFixtureService';
import { standingsService } from '../../services/standingsService';
import { useFocusEffect, useRoute } from '@react-navigation/native';

export const LeagueDetailScreen: React.FC = () => {
  const { user } = useAppContext();
  const navigation = useNavigationContext();
  const route: any = useRoute();
  const { params } = route;
  const [leagueId] = useState(params?.leagueId);
  const [league, setLeague] = useState<ILeague | null>(null);
  const [fixtures, setFixtures] = useState<IMatchFixture[]>([]);
  const [standings, setStandings] = useState<IStandings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'fixtures' | 'standings' | 'players'>('fixtures');

  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalFixtures: 0,
    upcomingMatches: 0,
    premiumPlayers: 0,
  });

  const [permissions, setPermissions] = useState({
    isOwner: false,
    isMember: false,
    canBuildTeam: false,
  });

  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused with params:', route.params);
      if (leagueId) {
        loadLeagueData();
      }
    }, [leagueId, route.params?.updated])
  );

  const loadLeagueData = async () => {
    if (!leagueId || !user?.id) return;

    try {
      setLoading(true);

      const leagueData = await leagueService.getById(leagueId);
      if (!leagueData) {
        Alert.alert('Hata', 'Lig bulunamadı');
        navigation.goBack();
        return;
      }
      setLeague(leagueData);

      const fixturesData = await matchFixtureService.getFixturesByLeague(leagueId);
      setFixtures(fixturesData);

      const currentSeasonId = `season_${new Date().getFullYear()}`;
      const standingsData = await standingsService.getStandingsByLeagueAndSeason(
        leagueId,
        currentSeasonId
      );
      setStandings(standingsData);

      const upcomingFixtures = fixturesData.filter(
        (f) => new Date(f.matchStartTime) > new Date()
      );

      setStats({
        totalPlayers: leagueData.playerIds.length,
        totalFixtures: fixturesData.length,
        upcomingMatches: upcomingFixtures.length,
        premiumPlayers: leagueData.premiumPlayerIds?.length || 0,
      });

      setPermissions({
        isOwner: leagueData.createdBy === user.id,
        isMember: leagueData.playerIds.includes(user.id),
        canBuildTeam: leagueData.teamBuildingAuthorityPlayerIds?.includes(user.id) || false,
      });

    } catch (error) {
      console.error('Error loading league data:', error);
      Alert.alert('Hata', 'Lig bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeagueData();
    setRefreshing(false);
  };

  const handleCreateFixture = () => {
    navigation.navigate('createFixture', { leagueId });
  };

  const handleEditLeague = () => {
    navigation.navigate('editLeague', { leagueId });
  };

  const handleFixturePress = (fixtureId: string) => {
    navigation.navigate('fixtureDetail', { fixtureId });
  };

  const handleViewFullStandings = () => {
    navigation.navigate('standings', { leagueId });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Lig bilgileri yükleniyor...</Text>
      </View>
    );
  }

  if (!league) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Lig bulunamadı</Text>
      </View>
    );
  }

  const sportColor = getSportColor(league.sportType);
  const isActive = new Date(league.seasonEndDate) > new Date();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.header, { backgroundColor: sportColor }]}>
          <View style={styles.headerContent}>
            <Text style={styles.sportEmoji}>{getSportIcon(league.sportType)}</Text>
            <View style={styles.headerTextContainer}>
              <Text style={styles.leagueName}>{league.title}</Text>
              <Text style={styles.leagueSeason}>
                {formatDate(league.seasonStartDate)} - {formatDate(league.seasonEndDate)}
              </Text>
              {!isActive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Pasif</Text>
                </View>
              )}
            </View>
          </View>

          {permissions.isOwner && (
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditLeague}
              activeOpacity={0.7}
            >
              <Settings size={20} color="white" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users size={24} color="#16a34a" strokeWidth={2} />
            <Text style={styles.statValue}>{stats.totalPlayers}</Text>
            <Text style={styles.statLabel}>Oyuncu</Text>
          </View>

          <View style={styles.statCard}>
            <Calendar size={24} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.statValue}>{stats.totalFixtures}</Text>
            <Text style={styles.statLabel}>Fikstür</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color="#2563EB" strokeWidth={2} />
            <Text style={styles.statValue}>{stats.upcomingMatches}</Text>
            <Text style={styles.statLabel}>Yaklaşan</Text>
          </View>

          <View style={styles.statCard}>
            <Crown size={24} color="#8B5CF6" strokeWidth={2} />
            <Text style={styles.statValue}>{stats.premiumPlayers}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
        </View>

        {/* Quick Actions - BURAYA EKLE */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity
            style={[styles.quickActionButton, { borderColor: sportColor }]}
            onPress={() => navigation.navigate('matchList', { leagueId })}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: sportColor + '20' }]}>
              <Trophy size={20} color={sportColor} strokeWidth={2} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Tüm Maçlar</Text>
              <Text style={styles.quickActionSubtitle}>Ligin tüm maçlarını gör</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionButton, { borderColor: sportColor }]}
            onPress={() => navigation.navigate('fixtureList', { leagueId })}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: sportColor + '20' }]}>
              <Calendar size={20} color={sportColor} strokeWidth={2} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Tüm Fikstürler</Text>
              <Text style={styles.quickActionSubtitle}>{stats.totalFixtures} fikstür</Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabsContainer}>
          {(['fixtures', 'standings', 'players'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.tabActive,
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === 'fixtures' && '📅 Fikstürler'}
                {tab === 'standings' && '🏆 Puan Durumu'}
                {tab === 'players' && '👥 Oyuncular'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'fixtures' && (
            <View>
              {fixtures.length > 0 ? (
                fixtures.map((fixture) => (
                  <TouchableOpacity
                    key={fixture.id}
                    style={styles.fixtureCard}
                    onPress={() => handleFixturePress(fixture.id!)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.fixtureHeader}>
                      <Text style={styles.fixtureTitle}>{fixture.title}</Text>
                      {fixture.isPeriodic && (
                        <View style={styles.periodicBadge}>
                          <Text style={styles.periodicBadgeText}>Periyodik</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.fixtureMeta}>
                      <View style={styles.fixtureMetaItem}>
                        <Clock size={14} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.fixtureMetaText}>
                          {new Date(fixture.matchStartTime).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>

                      <View style={styles.fixtureMetaItem}>
                        <MapPin size={14} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.fixtureMetaText}>{fixture.location}</Text>
                      </View>

                      <View style={styles.fixtureMetaItem}>
                        <Users size={14} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.fixtureMetaText}>
                          {fixture.staffPlayerCount} kişi
                        </Text>
                      </View>
                    </View>

                    <View style={styles.fixtureFooter}>
                      <Text style={styles.fixturePrice}>
                        ₺{fixture.pricePerPlayer} / kişi
                      </Text>
                      <View
                        style={[
                          styles.fixtureStatusBadge,
                          fixture.status === 'Aktif'
                            ? styles.fixtureStatusActive
                            : styles.fixtureStatusInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.fixtureStatusText,
                            fixture.status === 'Aktif'
                              ? styles.fixtureStatusTextActive
                              : styles.fixtureStatusTextInactive,
                          ]}
                        >
                          {fixture.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Calendar size={48} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.emptyStateText}>Henüz fikstür eklenmemiş</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'standings' && (
            <View>
              {standings && standings.playerStandings.length > 0 ? (
                <>
                  {standings.playerStandings.slice(0, 5).map((player, index) => (
                    <View key={player.playerId} style={styles.standingsRow}>
                      <View style={styles.standingsLeft}>
                        <View
                          style={[
                            styles.standingsRank,
                            index < 3 && styles.standingsRankTop,
                          ]}
                        >
                          <Text
                            style={[
                              styles.standingsRankText,
                              index < 3 && styles.standingsRankTextTop,
                            ]}
                          >
                            {index + 1}
                          </Text>
                        </View>
                        <Text style={styles.standingsName}>{player.playerName}</Text>
                      </View>

                      <View style={styles.standingsRight}>
                        <Text style={styles.standingsPoints}>{player.points}</Text>
                        <Text style={styles.standingsLabel}>Puan</Text>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.viewAllButton}
                    onPress={handleViewFullStandings}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.viewAllButtonText}>Tümünü Gör</Text>
                    <ChevronRight size={16} color="#16a34a" strokeWidth={2} />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyState}>
                  <TrendingUp size={48} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.emptyStateText}>Henüz puan durumu yok</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'players' && (
            <View>
              {league.playerIds.length > 0 ? (
                league.playerIds.map((playerId, index) => (
                  <View key={playerId} style={styles.playerRow}>
                    <View style={styles.playerLeft}>
                      <View style={styles.playerAvatar}>
                        <Text style={styles.playerAvatarText}>{index + 1}</Text>
                      </View>
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>Oyuncu {index + 1}</Text>
                        {league.premiumPlayerIds?.includes(playerId) && (
                          <View style={styles.premiumBadge}>
                            <Crown size={10} color="#F59E0B" strokeWidth={2} />
                            <Text style={styles.premiumBadgeText}>Premium</Text>
                          </View>
                        )}
                        {league.directPlayerIds?.includes(playerId) && (
                          <View style={styles.directBadge}>
                            <Shield size={10} color="#2563EB" strokeWidth={2} />
                            <Text style={styles.directBadgeText}>Direkt</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {league.teamBuildingAuthorityPlayerIds?.includes(playerId) && (
                      <View style={styles.authorityBadge}>
                        <Text style={styles.authorityBadgeText}>Yetkili</Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Users size={48} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.emptyStateText}>Henüz oyuncu yok</Text>
                </View>
              )}

              {permissions.isOwner && (
                <TouchableOpacity
                  style={styles.addPlayerButton}
                  activeOpacity={0.7}
                >
                  <UserPlus size={20} color="#16a34a" strokeWidth={2} />
                  <Text style={styles.addPlayerButtonText}>Oyuncu Ekle</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {permissions.isOwner && activeTab === 'fixtures' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreateFixture}
          activeOpacity={0.8}
        >
          <Plus size={28} color="white" strokeWidth={2.5} />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sportEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  leagueSeason: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  inactiveBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  inactiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  tabContent: {
    padding: 16,
  },
  fixtureCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  fixtureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fixtureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  periodicBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  periodicBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  fixtureMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  fixtureMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fixtureMetaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  fixtureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  fixturePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  fixtureStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fixtureStatusActive: {
    backgroundColor: '#DCFCE7',
  },
  fixtureStatusInactive: {
    backgroundColor: '#FEE2E2',
  },
  fixtureStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fixtureStatusTextActive: {
    color: '#166534',
  },
  fixtureStatusTextInactive: {
    color: '#991B1B',
  },
  standingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  standingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  standingsRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  standingsRankTop: {
    backgroundColor: '#FEF3C7',
  },
  standingsRankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  standingsRankTextTop: {
    color: '#F59E0B',
  },
  standingsName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  standingsRight: {
    alignItems: 'flex-end',
  },
  standingsPoints: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
  },
  standingsLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  playerInfo: {
    flex: 1,
    gap: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  directBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  directBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  authorityBadge: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  authorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7C3AED',
  },
  addPlayerButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  addPlayerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 12,
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
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});