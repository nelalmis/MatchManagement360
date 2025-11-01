// src/screens/League/LeagueDetailScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  Share,
  Platform,
  SectionList,
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
  ChevronLeft,
  Copy,
  Share2,
  Link,
  Bell,
  Star,
  Target,
  Award,
  X,
  Edit,
  Trash2,
  Check,
  Info,
  BarChart3,
  Edit3,
  Archive,
  AlertCircle,
  LogOut,
  CalendarClock,
  CalendarDays,
  ListOrdered,
  Repeat,
  DollarSign,
} from 'lucide-react-native';
import { RouteProp, useFocusEffect, useRoute } from '@react-navigation/native';
import { useAuth } from '../../hooks';
import { NavigationService } from '../../navigation/NavigationService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { StandingsService } from '../../services/serviceLayer/standingsService';
import { LeagueInvitationService } from '../../services/serviceLayer/LeagueInvitationService';
import { PlayerSelectorModal } from './components/PlayerSelectorModal';
import {
  ILeague,
  IFixture,
  IStandings,
  ILeagueInvitation,
  SportType,
  IPlayer,
} from '../../types/entity/types';
import {
  getSportEmoji,
  getSportPrimaryColor,
} from '../../utils/theme';
import * as Clipboard from 'expo-clipboard';
import PlayerService from '../../services/serviceLayer/playerService';

// ============================================
// TYPES
// ============================================

type LeagueDetailRouteProp = RouteProp<
  { params: { leagueId: string; updated?: boolean } },
  'params'
>;

interface LeagueStats {
  totalMembers: number;
  totalFixtures: number;
  totalMatches: number;
  premiumPlayers: number;
  directPlayers: number;
  totalSeasons: number;
}

interface LeaguePermissions {
  isAdmin: boolean;
  isMember: boolean;
  isPremiumPlayer: boolean;
  isDirectPlayer: boolean;
}

type TabType = 'overview' | 'fixtures' | 'standings' | 'players' | 'settings';

// ============================================
// MAIN COMPONENT
// ============================================

export const LeagueDetailScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<LeagueDetailRouteProp>();
  const { leagueId, updated } = route.params;

  // State
  const [league, setLeague] = useState<ILeague | null>(null);
  const [fixtures, setFixtures] = useState<IFixture[]>([]);
  const [standings, setStandings] = useState<IStandings | null>(null);
  const [invitations, setInvitations] = useState<ILeagueInvitation[]>([]);
  const [stats, setStats] = useState<LeagueStats>({
    totalMembers: 0,
    totalFixtures: 0,
    totalMatches: 0,
    premiumPlayers: 0,
    directPlayers: 0,
    totalSeasons: 0,
  });
  const [permissions, setPermissions] = useState<LeaguePermissions>({
    isAdmin: false,
    isMember: false,
    isPremiumPlayer: false,
    isDirectPlayer: false,
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [playerModalType, setPlayerModalType] = useState<'premium' | 'direct'>('premium');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [leagueMembers, setLeagueMembers] = useState<Record<string, IPlayer>>({});

  // ============================================
  // DATA LOADING
  // ============================================

  useFocusEffect(
    useCallback(() => {
      loadLeagueData();
    }, [leagueId, updated])
  );

  const loadLeagueData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Load league
      const leagueResult = await LeagueService.getLeague(leagueId);
      if (!leagueResult.success || !leagueResult.data) {
        Alert.alert('Hata', 'Lig bilgileri yüklenemedi');
        return;
      }
      if (leagueResult.success && leagueResult.data) {
        setLeague(leagueResult.data);
      }

      // Load fixtures
      const fixturesResult = await FixtureService.getLeagueFixtures(leagueId);
      if (fixturesResult.success && fixturesResult.data) {
        setFixtures(fixturesResult.data);
      }

      // Load standings
      if (leagueResult.data?.currentSeasonId) {
        const standingsResult = await StandingsService.getSeasonStandings(
          leagueResult.data.currentSeasonId
        );
        if (standingsResult.success && standingsResult.data) {
          setStandings(standingsResult.data);
        }
      }

      // Load invitations
      const invitationsResult = await LeagueInvitationService.getLeagueInvitations(
        leagueId,
        user.id
      );
      if (invitationsResult.success && invitationsResult.data) {
        setInvitations(invitationsResult.data);
      }

      // Map player IDs to their names
      const playersResult = await PlayerService.getPlayersByIds(leagueResult.data.members.all);
      if (!playersResult.success || !playersResult.data) {
        Alert.alert('Hata', 'Oyuncu bilgileri yüklenemedi');
        return;
      }

      const playersMap: Record<string, IPlayer> = {};
      playersResult.data.forEach(player => {
        playersMap[player.id] = player;
      });
      setLeagueMembers(playersMap);

      // Calculate permissions and stats
      calculatePermissions(leagueResult.data);
      calculateStats(leagueResult.data, fixturesResult.data || []);
    } catch (error) {
      console.error('Error loading league data:', error);
      Alert.alert('Hata', 'Lig bilgileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeagueData();
    setRefreshing(false);
  };

  const calculatePermissions = (leagueData: ILeague) => {
    if (!user?.id) return;

    setPermissions({
      isAdmin: leagueData.members.admins.includes(user.id),
      isMember: leagueData.members.all.includes(user.id),
      isPremiumPlayer: leagueData.defaultPlayers.premium.includes(user.id),
      isDirectPlayer: leagueData.defaultPlayers.direct.includes(user.id),
    });
  };

  const calculateStats = (leagueData: ILeague, fixtures: IFixture[]) => {
    const activeFixtures = fixtures.filter(f => f.status === 'active').length;

    setStats({
      totalMembers: leagueData.members.all.length,
      totalFixtures: activeFixtures,           // ✅ Aktif fixture sayısı
      totalMatches: leagueData.totalMatches || 0,  // ✅ League'den gelen total matches
      premiumPlayers: leagueData.defaultPlayers.premium.length,
      directPlayers: leagueData.defaultPlayers.direct.length,
      totalSeasons: leagueData.totalSeasons || 1,
    });
  };

  // ============================================
  // ADMIN ACTIONS
  // ============================================

  const handleCreateFixture = () => {
    if (!permissions.isAdmin) {
      Alert.alert('Yetkisiz', 'Bu işlem için admin olmalısınız');
      return;
    }
    NavigationService.navigateToCreateFixture(leagueId);
  };

  const handleCreateInvite = async () => {
    if (!permissions.isAdmin || !user?.id) {
      Alert.alert('Yetkisiz', 'Davet kodu oluşturmak için admin olmalısınız');
      return;
    }

    try {
      setCreatingInvite(true);

      const result = await LeagueInvitationService.generateInvite({
        leagueId,
        creatorId: user.id,
        assignRole: 'member',
        maxUses: 10,
        description: 'Hızlı davet kodu',
      });

      if (result.success && result.data) {
        Alert.alert(
          '✅ Oluşturuldu',
          `Davet kodu: ${result.data.code}`,
          [
            {
              text: 'Kopyala',
              onPress: async () => {
                await Clipboard.setStringAsync(result.data!.code);
              },
            },
            { text: 'Tamam' },
          ]
        );

        // Refresh invitations
        const invitationsResult = await LeagueInvitationService.getLeagueInvitations(
          leagueId,
          user.id
        );
        if (invitationsResult.success && invitationsResult.data) {
          setInvitations(invitationsResult.data);
        }
      } else {
        Alert.alert('Hata', result.error?.message || 'Davet kodu oluşturulamadı');
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleCopyInviteCode = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('✅ Kopyalandı', 'Davet kodu panoya kopyalandı');
  };

  const handleShareInviteCode = async (invitation: ILeagueInvitation) => {
    try {
      await Share.share({
        message: `${league?.title} ligine katıl!\n\nDavet Kodu: ${invitation.code}\nLink: ${invitation.inviteLink}`,
        title: 'Lig Daveti',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDeactivateInvite = async (invitationId: string) => {
    if (!permissions.isAdmin || !user?.id) {
      Alert.alert('Yetkisiz', 'Davet kodunu silmek için admin olmalısınız');
      return;
    }

    Alert.alert(
      'Davet Kodunu Sil',
      'Bu davet kodunu silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await LeagueInvitationService.deleteInvite(
                invitationId,
                user.id
              );

              if (result.success) {
                Alert.alert('✅ Silindi', 'Davet kodu silindi');
                // Refresh invitations
                const invitationsResult = await LeagueInvitationService.getLeagueInvitations(
                  leagueId,
                  user.id
                );
                if (invitationsResult.success && invitationsResult.data) {
                  setInvitations(invitationsResult.data);
                }
              } else {
                Alert.alert('Hata', result.error?.message || 'Davet kodu silinemedi');
              }
            } catch (error) {
              console.error('Error deactivating invite:', error);
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleAddPremiumPlayer = () => {
    if (!permissions.isAdmin) {
      Alert.alert('Yetkisiz', 'Premium oyuncu eklemek için admin olmalısınız');
      return;
    }
    setPlayerModalType('premium');
    setShowPlayerModal(true);
  };

  const handleAddDirectPlayer = () => {
    if (!permissions.isAdmin) {
      Alert.alert('Yetkisiz', 'Direkt oyuncu eklemek için admin olmalısınız');
      return;
    }
    setPlayerModalType('direct');
    setShowPlayerModal(true);
  };

  const handlePlayerSelected = async (playerIds: string[]) => {
    if (!permissions.isAdmin || !user?.id || playerIds.length === 0) return;

    try {

      const result =
        playerModalType === 'premium'
          ? await LeagueService.addMultiplePremiumPlayers(leagueId, user.id, playerIds)
          : await LeagueService.addMultipleDirectPlayers(leagueId, user.id, playerIds);

      if (result.success) {
        Alert.alert('✅ Eklendi', 'Oyuncular başarıyla eklendi');
        setShowPlayerModal(false);
        await loadLeagueData();
      } else {
        Alert.alert('Hata', result.error?.message || 'Oyuncular eklenemedi');
      }
    } catch (error) {
      console.error('Error adding player:', error);
      Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
    }
  };

  const handleRemovePremiumPlayer = async (playerId: string) => {
    if (!permissions.isAdmin || !user?.id) {
      Alert.alert('Yetkisiz', 'Premium oyuncu çıkarmak için admin olmalısınız');
      return;
    }

    Alert.alert(
      'Oyuncu Çıkar',
      'Bu oyuncuyu premium listesinden çıkarmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await LeagueService.removePremiumPlayer(
                leagueId,
                user.id,
                playerId
              );

              if (result.success) {
                Alert.alert('✅ Çıkarıldı', 'Oyuncu listeden çıkarıldı');
                await loadLeagueData();
              } else {
                Alert.alert('Hata', result.error?.message || 'Oyuncu çıkarılamadı');
              }
            } catch (error) {
              console.error('Error removing premium player:', error);
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleRemoveDirectPlayer = async (playerId: string) => {
    if (!permissions.isAdmin || !user?.id) {
      Alert.alert('Yetkisiz', 'Direkt oyuncu çıkarmak için admin olmalısınız');
      return;
    }

    Alert.alert(
      'Oyuncu Çıkar',
      'Bu oyuncuyu direkt listesinden çıkarmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await LeagueService.removeDirectPlayer(
                leagueId,
                user.id,
                playerId
              );

              if (result.success) {
                Alert.alert('✅ Çıkarıldı', 'Oyuncu listeden çıkarıldı');
                await loadLeagueData();
              } else {
                Alert.alert('Hata', result.error?.message || 'Oyuncu çıkarılamadı');
              }
            } catch (error) {
              console.error('Error removing direct player:', error);
              Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const formatDate = (date: any): string => {
    if (!date) return '-';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ============================================
  // RENDER HEADER
  // ============================================

  const renderHeader = () => {
    if (!league) return null;

    const sportColor = getSportPrimaryColor(league.sportType);
    const sportEmoji = getSportEmoji(league.sportType);

    return (
      <View style={[styles.header, { borderBottomColor: sportColor }]}>
        <TouchableOpacity onPress={() => NavigationService.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>{sportEmoji}</Text>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {league.title}
            </Text>
            <Text style={styles.headerSubtitle}>{league.sportType}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => Alert.alert('Bildirimler', 'Yakında eklenecek')}
          style={styles.headerButton}
        >
          <Bell size={22} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    );
  };

  // ============================================
  // RENDER STATS CARDS
  // ============================================

  const renderStatsCards = () => {
    if (!league) return null;

    const sportColor = getSportPrimaryColor(league.sportType);

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
      >
        {/* Members */}
        <View style={[styles.statCard, { borderLeftColor: sportColor }]}>
          <View style={[styles.statIconContainer, { backgroundColor: `${sportColor}20` }]}>
            <Users size={20} color={sportColor} strokeWidth={2.5} />
          </View>
          <Text style={styles.statValue}>{stats.totalMembers}</Text>
          <Text style={styles.statLabel}>Üye</Text>
        </View>

        {/* Fixtures */}
        <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#2563EB20' }]}>
            <ListOrdered size={20} color="#2563EB" strokeWidth={2.5} />
          </View>
          <Text style={styles.statValue}>{stats.totalFixtures}</Text>
          <Text style={styles.statLabel}>Fikstür</Text>
        </View>

        {/* Upcoming Matches */}
        <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F59E0B20' }]}>
            <Calendar size={20} color="#F59E0B" strokeWidth={2.5} />
          </View>
          <Text style={styles.statValue}>{stats.totalMatches}</Text>
          <Text style={styles.statLabel}>Toplam Maç</Text>
        </View>

        {/* Premium Players */}
        {permissions.isAdmin && (
          <View style={[styles.statCard, { borderLeftColor: '#8B5CF6' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#8B5CF620' }]}>
              <Crown size={20} color="#8B5CF6" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stats.premiumPlayers}</Text>
            <Text style={styles.statLabel}>Premium</Text>
          </View>
        )}

        {/* Direct Players */}
        {permissions.isAdmin && (
          <View style={[styles.statCard, { borderLeftColor: '#16a34a' }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#16a34a20' }]}>
              <Shield size={20} color="#16a34a" strokeWidth={2.5} />
            </View>
            <Text style={styles.statValue}>{stats.directPlayers}</Text>
            <Text style={styles.statLabel}>Direkt</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  // ============================================
  // RENDER QUICK ACTIONS (ADMIN ONLY)
  // ============================================

  const renderQuickActions = () => {
    if (!league || !permissions.isAdmin) return null;

    const sportColor = getSportPrimaryColor(league.sportType);

    return (
      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>

        {/* Create Fixture */}
        <TouchableOpacity
          style={[styles.quickActionButton, { borderColor: sportColor }]}
          onPress={handleCreateFixture}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${sportColor}20` }]}>
            <Plus size={20} color={sportColor} strokeWidth={2.5} />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Fikstür Oluştur</Text>
            <Text style={styles.quickActionSubtitle}>Yeni maç planla</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>

        {/* Create Friendly Match */}
        {league.settings.allowFriendlyMatches && (
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { borderColor: sportColor, borderStyle: 'dashed' },
            ]}
            onPress={() => {
              NavigationService.navigateToCreateFriendlyMatch(leagueId);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: `${sportColor}20` }]}>
              <Users size={20} color={sportColor} strokeWidth={2.5} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Dostluk Maçı Oluştur</Text>
              <Text style={styles.quickActionSubtitle}>
                {league.settings.friendlyAffectsStandings
                  ? 'Puan durumuna etki eder'
                  : league.settings.friendlyAffectsStats
                    ? 'İstatistiklere etki eder'
                    : 'Puan ve istatistiğe etki etmez'}
              </Text>
            </View>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>
        )}
        {/* Manage Invitations */}
        <TouchableOpacity
          style={[styles.quickActionButton, { borderColor: sportColor }]}
          onPress={() =>
            NavigationService.navigateToManageLeagueInvitations(leagueId, league.title)
          }
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${sportColor}20` }]}>
            <Link size={20} color={sportColor} strokeWidth={2.5} />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Davet Kodlarını Yönet</Text>
            <Text style={styles.quickActionSubtitle}>{invitations.length} aktif kod</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>

        {/* Quick Invite */}
        <TouchableOpacity
          style={[styles.quickActionButton, { borderColor: sportColor }]}
          onPress={() => setShowInviteModal(true)}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: `${sportColor}20` }]}>
            <UserPlus size={20} color={sportColor} strokeWidth={2.5} />
          </View>
          <View style={styles.quickActionContent}>
            <Text style={styles.quickActionTitle}>Hızlı Davet</Text>
            <Text style={styles.quickActionSubtitle}>Kod oluştur ve paylaş</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>


      </View>
    );
  };

  // ============================================
  // RENDER TAB BAR
  // ============================================

  const renderTabBar = () => {
    if (!league) return null;

    const sportColor = getSportPrimaryColor(league.sportType);

    const tabs = [
      { key: 'overview', emoji: '📊', label: 'Genel' },
      { key: 'fixtures', emoji: '📅', label: 'Fikstür' },
      { key: 'standings', emoji: '🏆', label: 'Puan' },
      { key: 'players', emoji: '👥', label: 'Oyuncu' },
      { key: 'settings', emoji: '⚙️', label: 'Ayar' },
    ];

    return (
      <View style={styles.tabContainer}>
        <View style={styles.tabRow}>
          {tabs.map(tab => {
            const isActive = activeTab === tab.key;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && [styles.tabActive, { backgroundColor: `${sportColor}15` }],
                ]}
                onPress={() => setActiveTab(tab.key as TabType)}
                activeOpacity={0.7}
              >
                <Text style={styles.tabEmoji}>{tab.emoji}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    isActive && { color: sportColor, fontWeight: '700' },
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER OVERVIEW TAB
  // ============================================

  const renderOverviewTab = () => {
    if (!league) return null;

    return (
      <View style={styles.tabContent}>
        {renderStatsCards()}
        {renderQuickActions()}
        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
          <View style={styles.emptyState}>
            <TrendingUp size={48} color="#D1D5DB" strokeWidth={2} />
            <Text style={styles.emptyText}>Henüz aktivite yok</Text>
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER FIXTURES TAB
  // ============================================

  const renderFixturesTab = () => {
    if (!league) return null;

    const sportColor = getSportPrimaryColor(league.sportType);

    // Get only active fixtures
    const activeFixtures = fixtures.filter(f => f.status === 'active');
    const displayFixtures = activeFixtures.slice(0, 5); // Show max 5
    const hasMore = activeFixtures.length > 5;

    return (
      <View style={styles.tabContent}>
        {permissions.isAdmin && (
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: sportColor }]}
            onPress={handleCreateFixture}
            activeOpacity={0.7}
          >
            <Plus size={20} color="white" strokeWidth={2.5} />
            <Text style={styles.createButtonText}>Yeni Fikstür Oluştur</Text>
          </TouchableOpacity>
        )}

        {/* Active Fixtures Section */}
        {displayFixtures.length > 0 ? (
          <>
            <View style={styles.fixtureSectionHeader}>
              <Text style={styles.fixtureSectionTitle}>Aktif Fikstürler</Text>
              <Text style={styles.fixtureSectionCount}>
                {activeFixtures.length} fikstür
              </Text>
            </View>

            {displayFixtures.map(fixture => (
              <TouchableOpacity
                key={fixture.id}
                style={styles.fixtureCard}
                onPress={() =>
                  NavigationService.navigateToFixtureDetail(fixture.id!)
                }
                activeOpacity={0.7}
              >
                <View style={styles.fixtureHeader}>
                  <View style={styles.fixtureTitleRow}>
                    <ListOrdered size={18} color={sportColor} strokeWidth={2} />
                    <Text style={styles.fixtureTitle}>{fixture.title}</Text>
                  </View>
                  <View
                    style={[
                      styles.fixtureStatusBadge,
                      styles.fixtureStatusActive,
                    ]}
                  >
                    <Text style={styles.fixtureStatusText}>Aktif</Text>
                  </View>
                </View>

                {/* Next Match Date */}
                {fixture.nextMatchDate ? (
                  <View style={styles.fixtureInfo}>
                    <Calendar size={16} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.fixtureInfoText}>
                      Sonraki Maç: {formatDate(fixture.nextMatchDate)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.fixtureInfo}>
                    <Calendar size={16} color="#9CA3AF" strokeWidth={2} />
                    <Text style={[styles.fixtureInfoText, { color: '#9CA3AF' }]}>
                      Maç planlanmadı
                    </Text>
                  </View>
                )}

                {/* Location */}
                {fixture.venue.location && (
                  <View style={styles.fixtureInfo}>
                    <MapPin size={16} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.fixtureInfoText}>
                      {fixture.venue.location}
                    </Text>
                  </View>
                )}

                {/* Stats Row */}
                <View style={styles.fixtureStatsRow}>
                  <View style={styles.fixtureStatItem}>
                    <Calendar size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.fixtureStatText}>
                      {fixture.totalMatches} maç
                    </Text>
                  </View>
                  {fixture.schedule.isRecurring && (
                    <View style={styles.fixtureStatItem}>
                      <Repeat size={14} color="#9CA3AF" strokeWidth={2} />
                      <Text style={styles.fixtureStatText}>
                        {fixture.schedule.pattern?.type === 'weekly' && 'Haftalık'}
                        {fixture.schedule.pattern?.type === 'biweekly' && 'İki haftada bir'}
                        {fixture.schedule.pattern?.type === 'monthly' && 'Aylık'}
                        {fixture.schedule.pattern?.type === 'custom' && 'Özel'}
                      </Text>
                    </View>
                  )}
                  <View style={styles.fixtureStatItem}>
                    <DollarSign size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.fixtureStatText}>
                      {fixture.venue.pricePerPlayer} TL
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {/* View All Fixtures Button */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() =>
                NavigationService.navigateToFixtureList(league.id)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllButtonText}>
                Tüm Fikstürleri Gör
                {hasMore && ` (${activeFixtures.length})`}
              </Text>
              <ChevronRight size={20} color={sportColor} strokeWidth={2.5} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <ListOrdered size={48} color="#D1D5DB" strokeWidth={2} />
            <Text style={styles.emptyText}>Henüz fikstür oluşturulmamış</Text>
            {permissions.isAdmin && (
              <Text style={styles.emptyHint}>
                Düzenli maçlar için fikstür oluşturun
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  // ============================================
  // RENDER STANDINGS TAB
  // ============================================

  const renderStandingsTab = () => {
    if (!league) return null;

    return (
      <View style={styles.tabContent}>
        {standings ? (
          <View style={styles.standingsContainer}>
            <Text style={styles.sectionTitle}>Puan Durumu</Text>
            <View style={styles.emptyState}>
              <Trophy size={48} color="#D1D5DB" strokeWidth={2} />
              <Text style={styles.emptyText}>Puan durumu yakında gösterilecek</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Trophy size={48} color="#D1D5DB" strokeWidth={2} />
            <Text style={styles.emptyText}>Henüz puan durumu yok</Text>
            <Text style={styles.emptyHint}>
              Maçlar tamamlandıkça puan durumu oluşacak
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ============================================
  // RENDER PLAYERS TAB
  // ============================================

  const renderPlayersTab = () => {
    if (!league || !permissions) return null;

    return (
      <ScrollView
        style={styles.tabContentScrollView}
        contentContainerStyle={styles.playersContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Premium Players (Admin Only) */}
        {permissions.isAdmin && (
          <View style={styles.playerSection}>
            <View style={styles.playerSectionHeader}>
              <Crown size={20} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.playerSectionTitle}>Premium Oyuncular</Text>
              <TouchableOpacity style={styles.addPlayerButton} onPress={handleAddPremiumPlayer}>
                <Plus size={16} color="#8B5CF6" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {league.defaultPlayers.premium.length > 0 ? (
              league.defaultPlayers.premium.map(playerId => (
                <View key={playerId} style={styles.playerRow}>
                  <View style={styles.playerInfo}>
                    <View style={[styles.playerIcon, { backgroundColor: '#8B5CF620' }]}>
                      <Crown size={16} color="#8B5CF6" strokeWidth={2} />
                    </View>
                    <Text style={styles.playerName}>{playerId}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removePlayerButton}
                    onPress={() => handleRemovePremiumPlayer(playerId)}
                  >
                    <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyPlayerText}>Premium oyuncu yok</Text>
            )}
          </View>
        )}

        {/* Direct Players (Admin Only) */}
        {permissions.isAdmin && (
          <View style={styles.playerSection}>
            <View style={styles.playerSectionHeader}>
              <Shield size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.playerSectionTitle}>Direkt Oyuncular</Text>
              <TouchableOpacity style={styles.addPlayerButton} onPress={handleAddDirectPlayer}>
                <Plus size={16} color="#16a34a" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {league.defaultPlayers.direct.length > 0 ? (
              league.defaultPlayers.direct.map(playerId => (
                <View key={playerId} style={styles.playerRow}>
                  <View style={styles.playerInfo}>
                    <View style={[styles.playerIcon, { backgroundColor: '#16a34a20' }]}>
                      <Shield size={16} color="#16a34a" strokeWidth={2} />
                    </View>
                    <Text style={styles.playerName}>{playerId}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removePlayerButton}
                    onPress={() => handleRemoveDirectPlayer(playerId)}
                  >
                    <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyPlayerText}>Direkt oyuncu yok</Text>
            )}
          </View>
        )}

        {/* All Members */}
        <View style={styles.playerSection}>
          <View style={styles.playerSectionHeader}>
            <Users size={20} color="#2563EB" strokeWidth={2} />
            <Text style={styles.playerSectionTitle}>Tüm Üyeler</Text>
          </View>

          {league.members.all.map(playerId => (
            <View key={playerId} style={styles.playerRow}>
              <View style={styles.playerInfo}>
                <View style={[styles.playerIcon, { backgroundColor: '#2563EB20' }]}>
                  <Users size={16} color="#2563EB" strokeWidth={2} />
                </View>
                <Text style={styles.playerName}>{leagueMembers[playerId]?.displayName || playerId}</Text>
              </View>
              {league.members.admins.includes(playerId) && (
                <View style={styles.adminBadge}>
                  <Crown size={12} color="#F59E0B" strokeWidth={2.5} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ============================================
  // RENDER SETTINGS TAB
  // ============================================

  const renderSettingsTab = () => {
    if (!league || !permissions) return null;

    const sportColor = getSportPrimaryColor(league.sportType);

    return (
      <ScrollView
        style={styles.tabContentScrollView}
        contentContainerStyle={styles.settingsContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================ */}
        {/* ADMIN SECTION */}
        {/* ============================================ */}
        {permissions.isAdmin && (
          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <Shield size={18} color={sportColor} strokeWidth={2.5} />
              <Text style={[styles.settingsSectionTitle, { color: sportColor }]}>YÖNETİM</Text>
            </View>

            {/* Edit League Info */}
            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => NavigationService.navigateToEditLeague(leagueId)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#EFF6FF' }]}>
                <Edit3 size={22} color="#2563EB" strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Lig Bilgilerini Düzenle</Text>
                <Text style={styles.settingSubtitle}>
                  Ad, açıklama ve temel ayarları güncelle
                </Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>

            {/* Advanced Settings */}
            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => NavigationService.navigateToLeagueSettings(leagueId)}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#F0FDF4' }]}>
                <Settings size={22} color="#16a34a" strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Gelişmiş Ayarlar</Text>
                <Text style={styles.settingSubtitle}>
                  Kurallar, ödeme, puanlama ve entegrasyonlar
                </Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>

            {/* Manage Invitations */}
            <TouchableOpacity
              style={styles.settingCard}
              onPress={() =>
                NavigationService.navigateToManageLeagueInvitations(leagueId, league.title)
              }
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#FEF3C7' }]}>
                <Link size={22} color="#D97706" strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Davet Kodlarını Yönet</Text>
                <Text style={styles.settingSubtitle}>
                  {invitations.length} aktif davet kodu
                </Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>

            {/* Manage Members */}
            <TouchableOpacity
              style={styles.settingCard}
              onPress={() => {
                NavigationService.navigateToManageLeagueMembers(leagueId);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#F3E8FF' }]}>
                <Users size={22} color="#9333EA" strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Üyeleri Yönet</Text>
                <Text style={styles.settingSubtitle}>
                  {league.members.all.length} üye, {league.members.admins.length} admin
                </Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================ */}
        {/* LEAGUE INFO SECTION */}
        {/* ============================================ */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsSectionHeader}>
            <Trophy size={18} color="#6B7280" strokeWidth={2.5} />
            <Text style={styles.settingsSectionTitle}>LİG BİLGİLERİ</Text>
          </View>

          <View style={styles.infoCard}>
            {/* League ID */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Lig ID</Text>
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(leagueId);
                  Alert.alert('✅ Kopyalandı', 'Lig ID panoya kopyalandı');
                }}
                style={styles.copyButton}
              >
                <Text style={styles.infoValue} numberOfLines={1}>
                  {leagueId.substring(0, 8)}...
                </Text>
                <Copy size={16} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Created Date */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Oluşturulma</Text>
              <Text style={styles.infoValue}>{formatDate(league.createdAt)}</Text>
            </View>

            {/* Sport Type */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Spor Dalı</Text>
              <Text style={styles.infoValue}>
                {getSportEmoji(league.sportType)} {league.sportType}
              </Text>
            </View>

            {/* Active Season */}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Aktif Sezon</Text>
              <Text style={styles.infoValue}>
                {league.currentSeasonId ? `Sezon ${league.totalSeasons}` : 'Yok'}
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================ */}
        {/* MEMBER STATUS SECTION */}
        {/* ============================================ */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsSectionHeader}>
            <Users size={18} color="#6B7280" strokeWidth={2.5} />
            <Text style={styles.settingsSectionTitle}>ÜYELİK DURUMUN</Text>
          </View>

          <View style={styles.statusCard}>
            {permissions.isAdmin && (
              <View style={styles.badge}>
                <Crown size={16} color="#F59E0B" strokeWidth={2.5} />
                <Text style={styles.badgeText}>Admin</Text>
              </View>
            )}

            {permissions.isPremiumPlayer && (
              <View style={[styles.badge, styles.badgePremium]}>
                <Trophy size={16} color="#8B5CF6" strokeWidth={2.5} />
                <Text style={[styles.badgeText, { color: '#8B5CF6' }]}>Premium Oyuncu</Text>
              </View>
            )}

            {permissions.isDirectPlayer && (
              <View style={[styles.badge, styles.badgeDirect]}>
                <UserPlus size={16} color="#10B981" strokeWidth={2.5} />
                <Text style={[styles.badgeText, { color: '#10B981' }]}>Direkt Oyuncu</Text>
              </View>
            )}

            {!permissions.isAdmin &&
              !permissions.isPremiumPlayer &&
              !permissions.isDirectPlayer && (
                <View style={[styles.badge, styles.badgeRegular]}>
                  <Users size={16} color="#6B7280" strokeWidth={2.5} />
                  <Text style={[styles.badgeText, { color: '#6B7280' }]}>Üye</Text>
                </View>
              )}
          </View>
        </View>

        {/* ============================================ */}
        {/* DANGER ZONE (Admin Only) */}
        {/* ============================================ */}
        {permissions.isAdmin && (
          <View style={styles.settingsSection}>
            <View style={styles.settingsSectionHeader}>
              <AlertCircle size={18} color="#EF4444" strokeWidth={2.5} />
              <Text style={[styles.settingsSectionTitle, { color: '#EF4444' }]}>
                TEHLİKELİ İŞLEMLER
              </Text>
            </View>

            {/* Archive League */}
            <TouchableOpacity
              style={[styles.settingCard, styles.dangerCard]}
              onPress={() => {
                Alert.alert(
                  'Ligi Arşivle',
                  'Ligi arşivlemek istediğinize emin misiniz? Arşivlenen ligler görünmez olur ancak veriler korunur.',
                  [
                    { text: 'İptal', style: 'cancel' },
                    {
                      text: 'Arşivle',
                      style: 'destructive',
                      onPress: () =>
                        Alert.alert('Arşivleme', 'Arşivleme özelliği yakında eklenecek'),
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Archive size={22} color="#DC2626" strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: '#DC2626' }]}>Ligi Arşivle</Text>
                <Text style={styles.settingSubtitle}>Lig görünmez olur, veriler korunur</Text>
              </View>
              <ChevronRight size={20} color="#DC2626" strokeWidth={2} />
            </TouchableOpacity>

            {/* Delete League */}
            <TouchableOpacity
              style={[styles.settingCard, styles.dangerCard]}
              onPress={() => {
                Alert.alert(
                  '⚠️ Dikkat',
                  'Ligi silmek istediğinize emin misiniz? Bu işlem GERİ ALINAMAZ ve tüm veriler kalıcı olarak silinecektir.',
                  [
                    { text: 'İptal', style: 'cancel' },
                    {
                      text: 'Sil',
                      style: 'destructive',
                      onPress: async () => {
                        Alert.alert(
                          '🚨 Son Uyarı',
                          `"${league.title}" ligini ve tüm verilerini kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz!`,
                          [
                            { text: 'İptal', style: 'cancel' },
                            {
                              text: 'Evet, Sil',
                              style: 'destructive',
                              onPress: async () => {
                                if (!user?.id) return;

                                try {
                                  const result = await LeagueService.deleteLeague(
                                    leagueId,
                                    user.id
                                  );

                                  if (result.success) {
                                    Alert.alert('✅ Silindi', 'Lig başarıyla silindi', [
                                      {
                                        text: 'Tamam',
                                        onPress: () => NavigationService.navigateToLeaguesTab(),
                                      },
                                    ]);
                                  } else {
                                    Alert.alert(
                                      'Hata',
                                      result.error?.message || 'Lig silinemedi'
                                    );
                                  }
                                } catch (error) {
                                  console.error('Error deleting league:', error);
                                  Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
                                }
                              },
                            },
                          ]
                        );
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#FEF2F2' }]}>
                <Trash2 size={22} color="#EF4444" strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Ligi Sil</Text>
                <Text style={styles.settingSubtitle}>Kalıcı olarak sil, tüm veriler silinir</Text>
              </View>
              <ChevronRight size={20} color="#EF4444" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================ */}
        {/* LEAVE LEAGUE (Non-Admin) */}
        {/* ============================================ */}
        {!permissions.isAdmin && (
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={[styles.settingCard, styles.dangerCard]}
              onPress={() => {
                Alert.alert(
                  'Ligden Ayrıl',
                  'Ligden ayrılmak istediğinize emin misiniz? İstatistikleriniz korunacak ancak maçlara katılamazsınız.',
                  [
                    { text: 'İptal', style: 'cancel' },
                    {
                      text: 'Ayrıl',
                      style: 'destructive',
                      onPress: async () => {
                        if (!user?.id) return;

                        try {
                          const result = await LeagueService.leaveLeague(
                            leagueId,
                            user.id
                          );

                          if (result.success) {
                            Alert.alert('✅ Ayrıldınız', 'Ligden başarıyla ayrıldınız', [
                              {
                                text: 'Tamam',
                                onPress: () => {
                                  loadLeagueData();
                                  NavigationService.navigateToLeaguesTab();
                                },
                              },
                            ]);
                          } else {
                            Alert.alert(
                              'Hata',
                              result.error?.message || 'Ligden ayrılamadınız'
                            );
                          }
                        } catch (error) {
                          console.error('Error leaving league:', error);
                          Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
                        }
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: '#FEF2F2' }]}>
                <LogOut size={22} color="#EF4444" strokeWidth={2} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: '#EF4444' }]}>Ligden Ayrıl</Text>
                <Text style={styles.settingSubtitle}>İstatistikleriniz korunur</Text>
              </View>
              <ChevronRight size={20} color="#EF4444" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ============================================
  // RENDER INVITE MODAL
  // ============================================

  const renderInviteModal = () => (
    <Modal
      visible={showInviteModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowInviteModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Davet Kodları</Text>
            <TouchableOpacity
              onPress={() => setShowInviteModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#1F2937" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {permissions.isAdmin && (
            <TouchableOpacity
              style={styles.manageInvitesButton}
              onPress={() => {
                setShowInviteModal(false);
                NavigationService.navigateToManageLeagueInvitations(leagueId, league!.title);
              }}
              activeOpacity={0.7}
            >
              <Settings size={20} color="#2563EB" strokeWidth={2} />
              <Text style={styles.manageInvitesButtonText}>Tüm Davet Kodlarını Yönet</Text>
              <ChevronRight size={20} color="#2563EB" strokeWidth={2} />
            </TouchableOpacity>
          )}

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {invitations.length > 0 ? (
              invitations.map(invitation => (
                <View key={invitation.id} style={styles.inviteCard}>
                  <View style={styles.inviteHeader}>
                    <Text style={styles.inviteCode}>{invitation.code}</Text>
                    <View style={styles.inviteActions}>
                      <TouchableOpacity
                        style={styles.inviteActionButton}
                        onPress={() => handleCopyInviteCode(invitation.code)}
                      >
                        <Copy size={16} color="#2563EB" strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inviteActionButton}
                        onPress={() => handleShareInviteCode(invitation)}
                      >
                        <Share2 size={16} color="#16a34a" strokeWidth={2} />
                      </TouchableOpacity>
                      {permissions.isAdmin && (
                        <TouchableOpacity
                          style={styles.inviteActionButton}
                          onPress={() => handleDeactivateInvite(invitation.id!)}
                        >
                          <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.inviteStats}>
                    <View style={styles.inviteStatItem}>
                      <Text style={styles.inviteStatLabel}>Kullanım</Text>
                      <Text style={styles.inviteStatValue}>
                        {invitation.usedCount}
                        {invitation.maxUses ? ` / ${invitation.maxUses}` : ' / ∞'}
                      </Text>
                    </View>

                    <View style={styles.inviteStatItem}>
                      <Text style={styles.inviteStatLabel}>Görüntülenme</Text>
                      <Text style={styles.inviteStatValue}>{invitation.stats.totalViews}</Text>
                    </View>

                    {invitation.expiresAt && (
                      <View style={styles.inviteStatItem}>
                        <Text style={styles.inviteStatLabel}>Süre</Text>
                        <Text style={styles.inviteStatValue}>
                          {formatDate(invitation.expiresAt)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {invitation.metadata.description && (
                    <Text style={styles.inviteDescription}>
                      {invitation.metadata.description}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyInvites}>
                <Link size={48} color="#D1D5DB" strokeWidth={2} />
                <Text style={styles.emptyInvitesText}>Henüz davet kodu oluşturulmamış</Text>
                {permissions.isAdmin && (
                  <Text style={styles.emptyInvitesHint}>
                    Aşağıdaki butondan yeni davet kodu oluşturabilirsiniz
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {permissions.isAdmin && (
            <TouchableOpacity
              style={styles.createInviteButton}
              onPress={handleCreateInvite}
              disabled={creatingInvite}
              activeOpacity={0.7}
            >
              {creatingInvite ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Plus size={20} color="white" strokeWidth={2.5} />
                  <Text style={styles.createInviteButtonText}>Yeni Davet Kodu Oluştur</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Lig yükleniyor...</Text>
      </View>
    );
  }

  if (!league) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color="#EF4444" strokeWidth={2} />
        <Text style={styles.errorText}>Lig bulunamadı</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => NavigationService.goBack()}>
          <Text style={styles.errorButtonText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderPlayerSelectorModal = async () => {
    if (!league) return null;
    if (!showPlayerModal) return null;

    const availablePlayers = league.members.all.map(playerId => ({
      id: playerId,
      name: leagueMembers[playerId]?.name || 'Bilinmeyen Oyuncu',
      avatarUrl: leagueMembers[playerId]?.profilePhoto,
      isPremium: league.defaultPlayers.premium.includes(playerId),
      isDirect: league.defaultPlayers.direct.includes(playerId),
      isAdmin: league.members.admins.includes(playerId),
    }));

    // Exclude already added players
    const excludeIds = playerModalType === 'premium'
      ? league.defaultPlayers.premium
      : league.defaultPlayers.direct;

    return (
      <PlayerSelectorModal
        visible={showPlayerModal}
        onClose={() => setShowPlayerModal(false)}
        onSelect={handlePlayerSelected}
        players={availablePlayers}
        title={playerModalType === 'premium' ? 'Premium Oyuncu Seç' : 'Direkt Oyuncu Seç'}
        multiSelect={true}
        excludePlayerIds={excludeIds}
        showBadges={true}
        emptyMessage={
          playerModalType === 'premium'
            ? 'Tüm oyuncular zaten premium listesinde'
            : 'Tüm oyuncular zaten direkt listesinde'
        }
      />
    );
  };

  // 🎯 SECTIONLIST YAPISI
  const sections = [
    {
      title: 'content',
      data: [activeTab], // Tek item - aktif tab
    },
  ];

  return (
    <View style={styles.container}>
      {renderHeader()}

      {/* <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderTabBar()}

        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'fixtures' && renderFixturesTab()}
        {activeTab === 'standings' && renderStandingsTab()}
        {activeTab === 'players' && renderPlayersTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </ScrollView> */}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          // Tab'a göre içerik render et
          switch (item) {
            case 'overview':
              return renderOverviewTab();
            case 'fixtures':
              return renderFixturesTab();
            case 'standings':
              return renderStandingsTab();
            case 'players':
              return renderPlayersTab();
            case 'settings':
              return renderSettingsTab();
            default:
              return null;
          }
        }}
        renderSectionHeader={() => renderTabBar()} // 👈 STICKY TAB BAR
        stickySectionHeadersEnabled={true} // 👈 MAGIC!
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.sectionListContent}
      />

      {renderInviteModal()}
      {renderPlayerSelectorModal()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  errorButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderBottomWidth: 2,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 12,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  // Content
  content: {
    flex: 1,
  },

  // Stats Cards
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    minWidth: 120,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Quick Actions
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  // sectionTitle: {
  //   fontSize: 16,
  //   fontWeight: '800',
  //   color: '#1F2937',
  //   marginBottom: 12,
  // },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
    gap: 2,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  quickActionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },

  // 🎯 STICKY TAB BAR STYLES
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 2,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  tabActive: {
    backgroundColor: '#F0F9FF',
  },
  tabEmoji: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },

  // SectionList Content
  sectionListContent: {
    flexGrow: 1,
  },
  tabContentWrapper: {
    padding: 16,
    minHeight: 600, // Scroll çalışması için minimum height
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 16,
  },

  // Tab Content
  tabContent: {
    padding: 16,
  },
  tabContentScrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },

  // Buttons
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'white',
  },

  // Fixtures Section
  fixtureSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  fixtureSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  fixtureSectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },

  // Fixture Card Updates
  fixtureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  fixtureStatusActive: {
    backgroundColor: '#DCFCE7',
  },
  fixtureInfoText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
  },

  // Fixture Stats Row
  fixtureStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  fixtureStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fixtureStatText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // View All Button
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },

  // Fixture Card Styles
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  fixtureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  fixtureStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  fixtureStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  fixtureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },

  // Standings
  standingsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Players
  playersContent: {
    padding: 16,
  },
  playerSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  playerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  playerSectionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  addPlayerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  playerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  removePlayerButton: {
    padding: 8,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  emptyPlayerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 16,
  },

  // Settings
  settingsContent: {
    padding: 16,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingCard: {
    flexDirection: 'row',
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
  settingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  settingSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 18,
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },

  // Info Card
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },

  // Status Card
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgePremium: {
    backgroundColor: '#F3E8FF',
  },
  badgeDirect: {
    backgroundColor: '#D1FAE5',
  },
  badgeRegular: {
    backgroundColor: '#F3F4F6',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // Invite Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  manageInvitesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 8,
  },
  manageInvitesButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    flex: 1,
  },
  modalBody: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  inviteCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 1,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  inviteActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inviteStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  inviteStatItem: {
    flex: 1,
  },
  inviteStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  inviteStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  inviteDescription: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },
  emptyInvites: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyInvitesText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptyInvitesHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  createInviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createInviteButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: 'white',
  },
});

export default LeagueDetailScreen;