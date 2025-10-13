// src/screens/Home/HomeScreen.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Trophy,
  Calendar,
  TrendingUp,
  Users,
  ChevronRight,
  Clock,
  MapPin,
  Target,
  Zap,
  DollarSign,
  Bell,
  AlertCircle,
  Star,
  Award,
  Activity,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation';
import { IMatch, ILeague, getSportIcon, getMatchStatusColor } from '../../types/types';
import { matchService } from '../../services/matchService';
import { playerStatsService } from '../../services/playerStatsService';
import { leagueService } from '../../services/leagueService';

// ============================================
// CONSTANTS
// ============================================

const UPCOMING_STATUSES = ['Kayıt Açık', 'Kayıt Kapandı', 'Takımlar Oluşturuldu', 'Oynanıyor'] as const;
const MAX_ITEMS = 3;

// ============================================
// TYPES
// ============================================

interface Stats {
  totalMatches: number;
  totalLeagues: number;
  averageRating: number;
  nextMatch: IMatch | null;
}

interface FormattedMatch extends IMatch {
  formattedDate: string;
  formattedTime: string;
}

interface PendingAction {
  id: string;
  type: 'payment' | 'rating' | 'goalAssist' | 'registration';
  title: string;
  subtitle: string;
  matchId: string;
  priority: 'high' | 'medium' | 'low';
}

interface NewsItem {
  id: string;
  type: 'achievement' | 'announcement' | 'match_result' | 'league_update';
  title: string;
  description: string;
  icon: string;
  time: string;
  color: string;
}

// ============================================
// SKELETON COMPONENTS
// ============================================

const Skeleton: React.FC<{ width: number | string; height: number; style?: any }> = React.memo(
  ({ width, height, style }) => (
    <View style={[styles.skeleton, { width, height }, style]} />
  )
);

const StatCardSkeleton = React.memo(() => (
  <View style={[styles.statCard, styles.skeletonContainer]}>
    <Skeleton width={48} height={48} style={styles.skeletonIcon} />
    <Skeleton width={40} height={28} style={{ marginBottom: 4 }} />
    <Skeleton width={60} height={16} />
  </View>
));

const MatchCardSkeleton = React.memo(() => (
  <View style={styles.matchCard}>
    <View style={styles.matchCardLeft}>
      <Skeleton width={40} height={40} style={{ borderRadius: 20, marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width="80%" height={18} style={{ marginBottom: 6 }} />
        <Skeleton width="60%" height={14} />
      </View>
    </View>
  </View>
));

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  return formatDate(date);
};

// ============================================
// MAIN COMPONENT
// ============================================

export const HomeScreen: React.FC = () => {
  const { user } = useAppContext();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<IMatch[]>([]);
  const [myLeagues, setMyLeagues] = useState<ILeague[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [paymentSummary, setPaymentSummary] = useState({
    pending: 0,
    total: 0,
  });
  
  const [stats, setStats] = useState<Stats>({
    totalMatches: 0,
    totalLeagues: 0,
    averageRating: 0,
    nextMatch: null,
  });

  // ============================================
  // DATA LOADING
  // ============================================

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Parallel fetch for performance
      const [matches, leagues, playerStats] = await Promise.all([
        matchService.getMatchesByPlayer(user.id),
        leagueService.getLeaguesByPlayer(user.id),
        playerStatsService.getStatsByPlayer(user.id),
      ]);

      // Process upcoming matches
      const now = new Date();
      const upcoming = matches
        .filter(m => 
          new Date(m.matchStartTime) > now && 
          UPCOMING_STATUSES.includes(m.status as any)
        )
        .sort((a, b) => 
          new Date(a.matchStartTime).getTime() - new Date(b.matchStartTime).getTime()
        )
        .slice(0, MAX_ITEMS);

      setUpcomingMatches(upcoming);
      setMyLeagues(leagues.slice(0, MAX_ITEMS));

      // Calculate average rating
      const totalRatings = playerStats.reduce((sum, s) => sum + (s.rating || 0), 0);
      const averageRating = playerStats.length > 0 
        ? parseFloat((totalRatings / playerStats.length).toFixed(1)) 
        : 0;

      setStats({
        totalMatches: matches.length,
        totalLeagues: leagues.length,
        averageRating,
        nextMatch: upcoming[0] || null,
      });

      // Process pending actions
      const actions = await processPendingActions(matches, user.id);
      setPendingActions(actions.slice(0, 3));

      // Process payment summary
      const payments = await processPaymentSummary(matches, user.id);
      setPaymentSummary(payments);

      // Generate news feed
      const newsFeed = await generateNewsFeed(matches, leagues, playerStats, user.id);
      setNews(newsFeed.slice(0, 5));

    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Hata', 'Veriler yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ============================================
  // DATA PROCESSING FUNCTIONS
  // ============================================

  const processPendingActions = async (matches: IMatch[], userId: string): Promise<PendingAction[]> => {
    const actions: PendingAction[] = [];

    for (const match of matches) {
      // Bekleyen ödeme
      const myPayment = match.paymentStatus?.find(p => p.playerId === userId);
      if (myPayment && !myPayment.paid && match.status !== 'İptal Edildi') {
        actions.push({
          id: `payment-${match.id}`,
          type: 'payment',
          title: 'Ödeme Bekliyor',
          subtitle: `${match.title} - ${myPayment.amount}₺`,
          matchId: match.id,
          priority: 'high',
        });
      }

      // Puanlama bekleniyor
      if (match.status === 'Ödeme Bekliyor' || match.status === 'Tamamlandı') {
        const hasRated = false; // matchRatingService'den kontrol edilmeli
        if (!hasRated && match.registeredPlayerIds?.includes(userId)) {
          actions.push({
            id: `rating-${match.id}`,
            type: 'rating',
            title: 'Oyuncu Puanlaması',
            subtitle: `${match.title} - Oyuncuları puanla`,
            matchId: match.id,
            priority: 'medium',
          });
        }
      }

      // Gol/Asist girişi bekleniyor
      if (match.status === 'Skor Onay Bekliyor') {
        const myGoalEntry = match.goalScorers?.find(g => g.playerId === userId);
        if (!myGoalEntry && match.registeredPlayerIds?.includes(userId)) {
          actions.push({
            id: `goal-${match.id}`,
            type: 'goalAssist',
            title: 'Gol & Asist Gir',
            subtitle: `${match.title} - Performansını kaydet`,
            matchId: match.id,
            priority: 'medium',
          });
        }
      }

      // Kayıt açık maçlar
      if (match.status === 'Kayıt Açık' && !match.registeredPlayerIds?.includes(userId)) {
        const hoursUntil = (new Date(match.matchStartTime).getTime() - Date.now()) / 3600000;
        if (hoursUntil < 48) {
          actions.push({
            id: `register-${match.id}`,
            type: 'registration',
            title: 'Maça Kayıt Ol',
            subtitle: `${match.title} - ${Math.floor(hoursUntil)} saat kaldı`,
            matchId: match.id,
            priority: hoursUntil < 24 ? 'high' : 'low',
          });
        }
      }
    }

    // Priority sıralaması
    return actions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const processPaymentSummary = async (matches: IMatch[], userId: string) => {
    let pending = 0;
    let total = 0;

    matches.forEach(match => {
      const myPayment = match.paymentStatus?.find(p => p.playerId === userId);
      if (myPayment && match.status !== 'İptal Edildi') {
        total += myPayment.amount;
        if (!myPayment.paid) {
          pending += myPayment.amount;
        }
      }
    });

    return { pending, total };
  };

  const generateNewsFeed = async (
    matches: IMatch[],
    leagues: ILeague[],
    playerStats: any[],
    userId: string
  ): Promise<NewsItem[]> => {
    const feed: NewsItem[] = [];

    // Son tamamlanan maç
    const completedMatches = matches
      .filter(m => m.status === 'Tamamlandı')
      .sort((a, b) => new Date(b.matchStartTime).getTime() - new Date(a.matchStartTime).getTime());

    if (completedMatches[0]) {
      const match = completedMatches[0];
      feed.push({
        id: `match-${match.id}`,
        type: 'match_result',
        title: 'Maç Tamamlandı',
        description: `${match.title} - Skor: ${match.score}`,
        icon: '⚽',
        time: formatRelativeTime(match.matchStartTime),
        color: '#16a34a',
      });
    }

    // MVP Ödülü
    const recentMVP = matches.find(m => 
      m.playerIdOfMatchMVP === userId && 
      m.status === 'Tamamlandı'
    );
    if (recentMVP) {
      feed.push({
        id: `mvp-${recentMVP.id}`,
        type: 'achievement',
        title: '🏆 MVP Ödülü Kazandın!',
        description: `${recentMVP.title} maçında en iyi oyuncu seçildin`,
        icon: '🏆',
        time: formatRelativeTime(recentMVP.matchStartTime),
        color: '#F59E0B',
      });
    }

    // Yeni lig bildirimi
    if (leagues.length > 0) {
      const newestLeague = leagues.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      const isRecent = (Date.now() - new Date(newestLeague.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
      if (isRecent) {
        feed.push({
          id: `league-${newestLeague.id}`,
          type: 'league_update',
          title: 'Yeni Lige Katıldın',
          description: `${newestLeague.title} - ${newestLeague.playerIds?.length} oyuncu`,
          icon: getSportIcon(newestLeague.sportType),
          time: formatRelativeTime(new Date(newestLeague.createdAt)),
          color: '#2563EB',
        });
      }
    }

    // Genel duyuru (örnek)
    feed.push({
      id: 'announcement-1',
      type: 'announcement',
      title: '📢 Yeni Özellik',
      description: 'Artık maçtan sonra oyuncuları puanlayabilirsiniz!',
      icon: '📢',
      time: '2 gün önce',
      color: '#8B5CF6',
    });

    return feed;
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // MEMOIZED DATA
  // ============================================

  const formattedMatches = useMemo<FormattedMatch[]>(() =>
    upcomingMatches.map(match => ({
      ...match,
      formattedDate: formatDate(match.matchStartTime),
      formattedTime: formatTime(match.matchStartTime),
    })),
    [upcomingMatches]
  );

  // ============================================
  // HANDLERS
  // ============================================

  const handleMatchPress = useCallback((match: IMatch) => {
    if (match.status === 'Kayıt Açık') {
      NavigationService.navigateToMatchRegistration(match.id);
    } else {
      NavigationService.navigateToMatch(match.id);
    }
  }, []);

  const handleLeaguePress = useCallback((leagueId: string) => {
    NavigationService.navigateToLeague(leagueId);
  }, []);

  const handlePendingAction = useCallback((action: PendingAction) => {
    switch (action.type) {
      case 'payment':
        NavigationService.navigateToPaymentTracking(action.matchId);
        break;
      case 'rating':
        NavigationService.navigateToPlayerRating(action.matchId);
        break;
      case 'goalAssist':
        NavigationService.navigateToGoalAssistEntry(action.matchId);
        break;
      case 'registration':
        NavigationService.navigateToMatchRegistration(action.matchId);
        break;
    }
  }, []);

  const handleNewsPress = useCallback((newsItem: NewsItem) => {
    if (newsItem.type === 'match_result') {
      const matchId = newsItem.id.split('-')[1];
      NavigationService.navigateToMatch(matchId);
    } else if (newsItem.type === 'league_update') {
      const leagueId = newsItem.id.split('-')[1];
      NavigationService.navigateToLeague(leagueId);
    }
  }, []);

  const handleQuickAction = useCallback((action: 'standings' | 'profile' | 'payments') => {
    if (action === 'standings') {
      if (myLeagues.length === 0) {
        Alert.alert('Lig Bulunamadı', 'Önce bir lige katılmanız gerekiyor.');
        return;
      }
      NavigationService.navigateToStandingsTab();
    } else if (action === 'profile') {
      NavigationService.navigateToProfileTab();
    } else if (action === 'payments') {
      // Ödeme geçmişi ekranına git (yakında eklenecek)
      Alert.alert('Ödemelerim', `Toplam: ${paymentSummary.total}₺\nBekleyen: ${paymentSummary.pending}₺`);
    }
  }, [myLeagues.length, paymentSummary]);

  // ============================================
  // RENDER COMPONENTS
  // ============================================

  const renderStatCard = useCallback((icon: React.ReactNode, value: number | string, label: string, iconBg: string) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  ), []);

  const renderPendingActions = useCallback(() => {
    if (pendingActions.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <AlertCircle size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Bekleyen İşlemler</Text>
            {pendingActions.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingActions.length}</Text>
              </View>
            )}
          </View>
        </View>

        {pendingActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.actionCard,
              action.priority === 'high' && styles.actionCardHigh,
            ]}
            activeOpacity={0.7}
            onPress={() => handlePendingAction(action)}
          >
            <View style={styles.actionCardLeft}>
              <View style={[
                styles.actionIcon,
                { backgroundColor: action.priority === 'high' ? '#FEE2E2' : '#FEF3C7' }
              ]}>
                {action.type === 'payment' && <DollarSign size={20} color="#EF4444" strokeWidth={2} />}
                {action.type === 'rating' && <Star size={20} color="#F59E0B" strokeWidth={2} />}
                {action.type === 'goalAssist' && <Target size={20} color="#F59E0B" strokeWidth={2} />}
                {action.type === 'registration' && <Calendar size={20} color="#F59E0B" strokeWidth={2} />}
              </View>
              <View style={styles.actionCardInfo}>
                <Text style={styles.actionCardTitle}>{action.title}</Text>
                <Text style={styles.actionCardSubtitle}>{action.subtitle}</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [pendingActions, handlePendingAction]);

  const renderPaymentSummary = useCallback(() => {
    if (paymentSummary.total === 0) return null;

    return (
      <TouchableOpacity
        style={styles.paymentCard}
        activeOpacity={0.7}
        onPress={() => handleQuickAction('payments')}
      >
        <View style={styles.paymentCardHeader}>
          <View style={styles.paymentIconContainer}>
            <DollarSign size={24} color="#16a34a" strokeWidth={2} />
          </View>
          <View style={styles.paymentCardInfo}>
            <Text style={styles.paymentCardTitle}>Ödemelerim</Text>
            <Text style={styles.paymentCardSubtitle}>
              {paymentSummary.pending > 0 ? `${paymentSummary.pending}₺ bekliyor` : 'Tüm ödemeler tamam'}
            </Text>
          </View>
        </View>
        <View style={styles.paymentCardFooter}>
          <View style={styles.paymentStat}>
            <Text style={styles.paymentStatLabel}>Toplam</Text>
            <Text style={styles.paymentStatValue}>{paymentSummary.total}₺</Text>
          </View>
          <View style={styles.paymentDivider} />
          <View style={styles.paymentStat}>
            <Text style={styles.paymentStatLabel}>Bekleyen</Text>
            <Text style={[
              styles.paymentStatValue,
              { color: paymentSummary.pending > 0 ? '#EF4444' : '#16a34a' }
            ]}>
              {paymentSummary.pending}₺
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [paymentSummary, handleQuickAction]);

  const renderNews = useCallback(() => {
    if (news.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Bell size={20} color="#2563EB" strokeWidth={2} />
            <Text style={styles.sectionTitle}>Haberler</Text>
          </View>
        </View>

        {news.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.newsCard}
            activeOpacity={0.7}
            onPress={() => handleNewsPress(item)}
          >
            <View style={styles.newsCardLeft}>
              <View style={[styles.newsIcon, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.newsEmoji}>{item.icon}</Text>
              </View>
              <View style={styles.newsCardInfo}>
                <Text style={styles.newsCardTitle}>{item.title}</Text>
                <Text style={styles.newsCardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.newsCardTime}>{item.time}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [news, handleNewsPress]);

  const renderNextMatch = useCallback(() => {
    if (!stats.nextMatch) return null;

    const match = stats.nextMatch;
    const league = myLeagues.find(l => l.id === match.fixtureId);

    return (
      <TouchableOpacity
        style={styles.nextMatchCard}
        activeOpacity={0.7}
        onPress={() => handleMatchPress(match)}
      >
        <View style={styles.nextMatchHeader}>
          <View style={styles.nextMatchBadge}>
            <Zap size={14} color="white" strokeWidth={2.5} />
            <Text style={styles.nextMatchBadgeText}>Sonraki Maç</Text>
          </View>
          <Text style={styles.nextMatchEmoji}>
            {getSportIcon(league?.sportType || 'Futbol')}
          </Text>
        </View>

        <Text style={styles.nextMatchTitle}>{match.title}</Text>

        <View style={styles.nextMatchDetails}>
          <View style={styles.nextMatchDetailItem}>
            <Clock size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.nextMatchDetailText}>
              {formatDate(match.matchStartTime)} • {formatTime(match.matchStartTime)}
            </Text>
          </View>

          {match.location && (
            <View style={styles.nextMatchDetailItem}>
              <MapPin size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.nextMatchDetailText}>{match.location}</Text>
            </View>
          )}
        </View>

        <View style={styles.nextMatchFooter}>
          <View style={styles.nextMatchPlayers}>
            <Users size={16} color="#16a34a" strokeWidth={2} />
            <Text style={styles.nextMatchPlayersText}>
              {match.registeredPlayerIds?.length || 0} oyuncu kayıtlı
            </Text>
          </View>
          <ChevronRight size={20} color="#16a34a" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
    );
  }, [stats.nextMatch, myLeagues, handleMatchPress]);

  const renderMatchCard = useCallback((match: FormattedMatch) => {
    const league = myLeagues.find(l => l.id === match.fixtureId);

    return (
      <TouchableOpacity
        key={match.id}
        style={styles.matchCard}
        activeOpacity={0.7}
        onPress={() => handleMatchPress(match)}
      >
        <View style={styles.matchCardLeft}>
          <Text style={styles.matchEmoji}>
            {getSportIcon(league?.sportType || 'Futbol')}
          </Text>
          <View style={styles.matchCardInfo}>
            <Text style={styles.matchCardTitle} numberOfLines={1}>
              {match.title}
            </Text>
            <View style={styles.matchCardMeta}>
              <Clock size={12} color="#6B7280" strokeWidth={2} />
              <Text style={styles.matchCardMetaText}>
                {match.formattedDate} • {match.formattedTime}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.matchCardRight}>
          <View
            style={[
              styles.matchStatusBadge,
              { backgroundColor: getMatchStatusColor(match.status) + '20' },
            ]}
          >
            <Text
              style={[
                styles.matchStatusText,
                { color: getMatchStatusColor(match.status) },
              ]}
            >
              {match.status}
            </Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
        </View>
      </TouchableOpacity>
    );
  }, [myLeagues, handleMatchPress]);

  const renderLeagueCard = useCallback((league: ILeague) => (
    <TouchableOpacity
      key={league.id}
      style={styles.leagueCard}
      activeOpacity={0.7}
      onPress={() => handleLeaguePress(league.id!)}
    >
      <View style={styles.leagueCardLeft}>
        <Text style={styles.leagueEmoji}>{getSportIcon(league.sportType)}</Text>
        <View style={styles.leagueCardInfo}>
          <Text style={styles.leagueCardTitle} numberOfLines={1}>
            {league.title}
          </Text>
          <View style={styles.leagueCardMeta}>
            <Users size={12} color="#6B7280" strokeWidth={2} />
            <Text style={styles.leagueCardMetaText}>
              {league.playerIds?.length || 0} oyuncu
            </Text>
          </View>
        </View>
      </View>
      <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
    </TouchableOpacity>
  ), [handleLeaguePress]);

  const renderEmptyState = useCallback((
    icon: React.ReactNode,
    text: string,
    buttonText: string,
    onPress: () => void
  ) => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>{icon}</View>
      <Text style={styles.emptyStateText}>{text}</Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.emptyStateButtonText}>{buttonText}</Text>
      </TouchableOpacity>
    </View>
  ), []);

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.statsContainer}>
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Skeleton width={150} height={24} />
          </View>
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </View>
      </ScrollView>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <ScrollView
      style={styles.container}
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
      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        {renderStatCard(
          <Calendar size={24} color="#16a34a" strokeWidth={2} />,
          stats.totalMatches,
          'Toplam Maç',
          '#F0FDF4'
        )}
        {renderStatCard(
          <Trophy size={24} color="#F59E0B" strokeWidth={2} />,
          stats.totalLeagues,
          'Lig',
          '#FFFBEB'
        )}
        {renderStatCard(
          <TrendingUp size={24} color="#2563EB" strokeWidth={2} />,
          stats.averageRating > 0 ? stats.averageRating : '-',
          'Ortalama',
          '#EFF6FF'
        )}
      </View>

      {/* Pending Actions */}
      {renderPendingActions()}

      {/* Payment Summary */}
      {renderPaymentSummary()}

      {/* Next Match Highlight */}
      {renderNextMatch()}

      {/* News Feed */}
      {renderNews()}

      {/* Upcoming Matches */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Yaklaşan Maçlar</Text>
          <TouchableOpacity
            onPress={() => NavigationService.navigateToFixturesTab()}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {formattedMatches.length > 0 ? (
          formattedMatches.map(renderMatchCard)
        ) : (
          renderEmptyState(
            <Calendar size={48} color="#D1D5DB" strokeWidth={1.5} />,
            'Yaklaşan maç bulunmuyor',
            'Maçları Keşfet',
            () => NavigationService.navigateToFixturesTab()
          )
        )}
      </View>

      {/* My Leagues */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Liglerim</Text>
          <TouchableOpacity
            onPress={() => NavigationService.navigateToLeaguesTab()}
            activeOpacity={0.7}
          >
            <Text style={styles.seeAllText}>Tümünü Gör</Text>
          </TouchableOpacity>
        </View>

        {myLeagues.length > 0 ? (
          myLeagues.map(renderLeagueCard)
        ) : (
          renderEmptyState(
            <Trophy size={48} color="#D1D5DB" strokeWidth={1.5} />,
            'Henüz bir lige katılmadınız',
            'Ligleri Keşfet',
            () => NavigationService.navigateToLeaguesTab()
          )
        )}
      </View>

      {/* Quick Actions */}
      {/* <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('standings')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#F0FDF4' }]}>
            <TrendingUp size={20} color="#16a34a" strokeWidth={2} />
          </View>
          <Text style={styles.quickActionText}>Puan Durumu</Text>
          <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => handleQuickAction('profile')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: '#FFFBEB' }]}>
            <Target size={20} color="#F59E0B" strokeWidth={2} />
          </View>
          <Text style={styles.quickActionText}>İstatistiklerim</Text>
          <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
        </TouchableOpacity>
      </View> */}

      <View style={styles.bottomSpacing} />
    </ScrollView>
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

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
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
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Pending Actions
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionCardHigh: {
    borderLeftColor: '#EF4444',
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionCardInfo: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },

  // Payment Card
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentCardInfo: {
    flex: 1,
  },
  paymentCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  paymentCardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  paymentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentStat: {
    flex: 1,
    alignItems: 'center',
  },
  paymentStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  paymentStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },

  // News
  newsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  newsCardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  newsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  newsEmoji: {
    fontSize: 24,
  },
  newsCardInfo: {
    flex: 1,
  },
  newsCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  newsCardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 18,
  },
  newsCardTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },

  // Next Match
  nextMatchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  nextMatchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nextMatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  nextMatchBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextMatchEmoji: {
    fontSize: 32,
  },
  nextMatchTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  nextMatchDetails: {
    gap: 8,
    marginBottom: 16,
  },
  nextMatchDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextMatchDetailText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  nextMatchFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  nextMatchPlayers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextMatchPlayersText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    color: '#1F2937',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
  },

  // Match Card
  matchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  matchCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  matchEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  matchCardInfo: {
    flex: 1,
  },
  matchCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  matchCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchCardMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  matchCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  matchStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // League Card
  leagueCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leagueCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  leagueEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  leagueCardInfo: {
    flex: 1,
  },
  leagueCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  leagueCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  leagueCardMetaText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    fontWeight: '500',
  },
  emptyStateButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },

  // Skeleton
  skeletonContainer: {
    overflow: 'hidden',
  },
  skeleton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
  },
  skeletonIcon: {
    borderRadius: 24,
  },

  // Spacing
  bottomSpacing: {
    height: 20,
  },
});

