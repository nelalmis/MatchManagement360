import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {
  TrendingUp,
  Calendar,
  Users,
  Bell,
  Plus,
  ChevronRight,
  Trophy,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import { IMatch, getSportIcon, getSportColor, getMatchStatusColor } from '../../types/types';

export const HomeScreen: React.FC = () => {
  const { user } = useAppContext();
  const navigation = useNavigationContext();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - gerçek uygulamada API'den gelecek
  const stats = {
    totalMatches: 24,
    wins: 16,
    goals: 12,
    rating: 4.5,
  };

  const todayMatches: IMatch[] = [
    {
      id: 'm1',
      fixtureId: 'f1',
      title: 'Salı Maçı',
      registrationTime: new Date(),
      registrationEndTime: new Date(),
      matchStartTime: new Date('2025-10-15T20:00:00'),
      matchEndTime: new Date('2025-10-15T21:00:00'),
      premiumPlayerIds: [],
      directPlayerIds: [],
      guestPlayerIds: [],
      registeredPlayerIds: ['1', '2', '3', '4', '5', '6', '7', '8'],
      reservePlayerIds: [],
      goalScorers: [],
      paymentStatus: [],
      organizerPlayerIds: ['org1'],
      teamBuildingAuthorityPlayerIds: [],
      status: 'Kayıt Açık',
      createdAt: new Date().toISOString(),
    },
  ];

  const upcomingMatches = [
    {
      id: 'm2',
      leagueName: 'Architect Halı Saha Ligi',
      fixtureName: 'Perşembe Maçı',
      sportType: 'Futbol' as const,
      date: '17 Ekim 2025',
      time: '21:00',
      location: 'Arena Spor Tesisleri',
      players: '10/10',
      status: 'Kayıt Kapandı' as const,
    },
    {
      id: 'm3',
      leagueName: 'Hafta Sonu Basketbol',
      fixtureName: 'Cumartesi Turnuvası',
      sportType: 'Basketbol' as const,
      date: '19 Ekim 2025',
      time: '18:30',
      location: 'City Spor Salonu',
      players: '6/10',
      status: 'Kayıt Açık' as const,
    },
  ];

  const notifications = [
    {
      id: 'n1',
      type: 'invite',
      title: 'Yeni Lig Daveti',
      message: 'Architect Halı Saha Ligi\'ne davet edildiniz',
      time: '5 dk önce',
      icon: Trophy,
    },
    {
      id: 'n2',
      type: 'payment',
      title: 'Ödeme Hatırlatması',
      message: 'Salı Maçı için ödeme bekleniyor (₺150)',
      time: '1 saat önce',
      icon: Bell,
    },
    {
      id: 'n3',
      type: 'team',
      title: 'Takımlar Oluşturuldu',
      message: 'Perşembe Maçı için takımlar belirlendi',
      time: '2 saat önce',
      icon: Users,
    },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // API call to refresh data
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcome}>Hoş geldin,</Text>
            <Text style={styles.userName}>
              {user?.name || ''} {user?.surname || ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.iconBox}
            onPress={() => navigation.navigate('performance')}
            activeOpacity={0.7}
          >
            <TrendingUp size={28} color="white" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.totalMatches}</Text>
            <Text style={styles.statLabel}>Toplam Maç</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.wins}</Text>
            <Text style={styles.statLabel}>Galibiyet</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.goals}</Text>
            <Text style={styles.statLabel}>Gol</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Puan</Text>
          </View>
        </View>
      </View>

      {/* Today's Matches */}
      {todayMatches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Clock color="#16a34a" size={20} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Bugünkü Maçlarım</Text>
            </View>
          </View>

          {todayMatches.map((match) => (
            <TouchableOpacity
              key={match.id}
              style={styles.todayMatchCard}
              onPress={() => navigation.navigate('matchDetail', { matchId: match.id })}
              activeOpacity={0.7}
            >
              <View style={styles.matchCardHeader}>
                <View style={styles.matchGroupBadge}>
                  <Users color="#16a34a" size={14} strokeWidth={2} />
                  <Text style={styles.matchGroupText}>Architect Halı Saha Ligi</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getMatchStatusColor(match.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{match.status}</Text>
                </View>
              </View>

              <Text style={styles.matchTitle}>{match.title}</Text>

              <View style={styles.matchDetails}>
                <View style={styles.matchDetailRow}>
                  <Clock color="#6B7280" size={16} strokeWidth={2} />
                  <Text style={styles.matchDetailText}>
                    Bugün, {match.matchStartTime.toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <View style={styles.matchDetailRow}>
                  <Users color="#6B7280" size={16} strokeWidth={2} />
                  <Text style={styles.matchDetailText}>
                    {match.registeredPlayerIds.length}/10 Oyuncu
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Upcoming Matches */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Calendar color="#16a34a" size={20} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Yaklaşan Maçlar</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('myFixtures')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Tümü</Text>
          </TouchableOpacity>
        </View>

        {upcomingMatches.map((match) => (
          <TouchableOpacity
            key={match.id}
            style={styles.matchCard}
            onPress={() => navigation.navigate('matchDetail', { matchId: match.id })}
            activeOpacity={0.7}
          >
            <View style={styles.matchCardLeft}>
              <View
                style={[
                  styles.matchIconContainer,
                  { backgroundColor: `${getSportColor(match.sportType)}15` },
                ]}
              >
                <Text style={styles.sportEmoji}>{getSportIcon(match.sportType)}</Text>
              </View>
              <View style={styles.matchInfo}>
                <Text style={styles.matchCardTitle}>{match.fixtureName}</Text>
                <Text style={styles.matchLeagueName}>{match.leagueName}</Text>
                <View style={styles.matchMeta}>
                  <Text style={styles.matchMetaText}>
                    {match.date} • {match.time}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.matchStatusContainer}>
              <View
                style={[
                  styles.matchStatusDot,
                  { backgroundColor: getMatchStatusColor(match.status) },
                ]}
              />
              <ChevronRight color="#9CA3AF" size={20} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Bell color="#16a34a" size={20} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Bildirimler</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('notifications')}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Tümü</Text>
          </TouchableOpacity>
        </View>

        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <TouchableOpacity
              key={notification.id}
              style={styles.notificationCard}
              activeOpacity={0.7}
            >
              <View style={styles.notificationIconContainer}>
                <Icon color="#2563EB" size={20} strokeWidth={2} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationMessage}>
                  {notification.message}
                </Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('createLeague')}
          activeOpacity={0.8}
        >
          <Plus color="white" size={24} strokeWidth={2.5} />
          <Text style={styles.quickActionText}>Yeni Lig Oluştur</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerCard: {
    backgroundColor: '#16a34a',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeSection: {
    flex: 1,
  },
  welcome: {
    color: '#bbf7d0',
    fontSize: 14,
    marginBottom: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  iconBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    color: '#bbf7d0',
    fontSize: 11,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  todayMatchCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchGroupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  matchGroupText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  matchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  matchDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  matchDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchDetailText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  matchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  matchIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sportEmoji: {
    fontSize: 24,
  },
  matchInfo: {
    flex: 1,
  },
  matchCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  matchLeagueName: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  matchMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  matchStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  quickActions: {
    marginBottom: 20,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  bottomSpacing: {
    height: 20,
  },
});