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
  Modal,
  Linking,
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
  UserPlus,
  X,
  Info,
  AlertTriangle,
  Check,
} from 'lucide-react-native';
import {
  IMatch,
  ILeague,
  IPlayerStats,
  IAnnouncement,
  MatchStatus,
  SportType,
} from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { PlayerStatsService } from '../../services/serviceLayer/playerStatsService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { MatchRatingService } from '../../services/serviceLayer/matchRatingService';
import { AnnouncementService } from '../../services/serviceLayer/announcementService';
import { useAuth } from '../../hooks';
import {
  getSportEmoji,
  getSportPrimaryColor,
} from '../../utils/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomHeader } from '../../components/CustomHeader';
import { LeagueNavigationService, MatchNavigationService, SettingsNavigationService, StandingsNavigationService } from '../../navigation';

// ============================================
// CONSTANTS
// ============================================

const UPCOMING_STATUSES: MatchStatus[] = [
  MatchStatus.REGISTRATION_OPEN,
  MatchStatus.REGISTRATION_CLOSED,
  MatchStatus.TEAMS_SET,
  MatchStatus.IN_PROGRESS,
];
const MAX_ITEMS = 3;
const DISMISSED_ANNOUNCEMENTS_KEY = '@dismissed_announcements';

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

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });
};

const formatTime = (date: Date | string): string => {
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatRelativeTime = (date: Date | string): string => {
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

const getMatchStatusColor = (status: MatchStatus): string => {
  const colorMap: Record<MatchStatus, string> = {
    [MatchStatus.CREATED]: '#9CA3AF',
    [MatchStatus.REGISTRATION_OPEN]: '#16a34a',
    [MatchStatus.REGISTRATION_CLOSED]: '#F59E0B',
    [MatchStatus.TEAMS_SET]: '#2563EB',
    [MatchStatus.IN_PROGRESS]: '#EF4444',
    [MatchStatus.AWAITING_SCORE]: '#8B5CF6',
    [MatchStatus.COMPLETED]: '#10B981',
    [MatchStatus.CANCELLED]: '#6B7280',
  };
  return colorMap[status] || '#9CA3AF';
};

const getMatchStatusText = (status: MatchStatus): string => {
  const textMap: Record<MatchStatus, string> = {
    [MatchStatus.CREATED]: 'Oluşturuldu',
    [MatchStatus.REGISTRATION_OPEN]: 'Kayıt Açık',
    [MatchStatus.REGISTRATION_CLOSED]: 'Kayıt Kapandı',
    [MatchStatus.TEAMS_SET]: 'Takımlar Oluşturuldu',
    [MatchStatus.IN_PROGRESS]: 'Oynanıyor',
    [MatchStatus.AWAITING_SCORE]: 'Skor Onay Bekliyor',
    [MatchStatus.COMPLETED]: 'Tamamlandı',
    [MatchStatus.CANCELLED]: 'İptal Edildi',
  };
  return textMap[status] || 'Bilinmiyor';
};

// ============================================
// ANNOUNCEMENT CARD COMPONENT
// ============================================

interface AnnouncementCardProps {
  announcement: IAnnouncement;
  onDismiss: () => void;
  onAction?: () => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onDismiss,
  onAction,
}) => {
  const getTypeColor = (type: IAnnouncement['type']) => {
    const colors = {
      info: '#2563EB',
      warning: '#F59E0B',
      success: '#16a34a',
      error: '#EF4444',
    };
    return colors[type];
  };

  const getTypeIcon = (type: IAnnouncement['type']) => {
    const color = getTypeColor(type);
    switch (type) {
      case 'info':
        return <Info size={20} color={color} strokeWidth={2} />;
      case 'warning':
        return <AlertCircle size={20} color={color} strokeWidth={2} />;
      case 'success':
        return <Check size={20} color={color} strokeWidth={2} />;
      case 'error':
        return <AlertTriangle size={20} color={color} strokeWidth={2} />;
    }
  };

  const color = getTypeColor(announcement.type);

  return (
    <View style={[styles.announcementCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <View style={styles.announcementHeader}>
        <View style={[styles.announcementIconContainer, { backgroundColor: `${color}20` }]}>
          {getTypeIcon(announcement.type)}
        </View>

        {announcement.display.dismissable && (
          <TouchableOpacity
            onPress={onDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.announcementTitle}>{announcement.title}</Text>
      <Text style={styles.announcementMessage}>{announcement.message}</Text>

      {announcement.action && (
        <TouchableOpacity
          style={[styles.announcementAction, { backgroundColor: color }]}
          onPress={onAction}
          activeOpacity={0.7}
        >
          <Text style={styles.announcementActionText}>{announcement.action.label}</Text>
          <ChevronRight size={16} color="white" strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================
// ANNOUNCEMENT POPUP MODAL
// ============================================

interface AnnouncementPopupProps {
  announcement: IAnnouncement;
  onDismiss: () => void;
  onAction?: () => void;
}

const AnnouncementPopup: React.FC<AnnouncementPopupProps> = ({
  announcement,
  onDismiss,
  onAction,
}) => {
  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <AnnouncementCard
            announcement={announcement}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  // State
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [upcomingMatches, setUpcomingMatches] = useState<IMatch[]>([]);
  const [myLeagues, setMyLeagues] = useState<ILeague[]>([]);
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [popupAnnouncement, setPopupAnnouncement] = useState<IAnnouncement | null>(null);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<string[]>([]);
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
  // ANNOUNCEMENT STORAGE
  // ============================================

  const loadDismissedAnnouncements = async () => {
    try {
      const stored = await AsyncStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
      if (stored) {
        setDismissedAnnouncements(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading dismissed announcements:', error);
    }
  };

  const saveDismissedAnnouncement = async (announcementId: string) => {
    try {
      const updated = [...dismissedAnnouncements, announcementId];
      await AsyncStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify(updated));
      setDismissedAnnouncements(updated);
    } catch (error) {
      console.error('Error saving dismissed announcement:', error);
    }
  };

  // ============================================
  // DATA LOADING
  // ============================================

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Parallel fetch for performance
      const [matchesResult, leaguesResult, statsResult, announcementsResult] = await Promise.all([
        MatchService.getPlayerMatchHistory(user.id),
        LeagueService.getPlayerLeagues(user.id),
        PlayerStatsService.getAllPlayerStats(user.id),
        AnnouncementService.getHomeAnnouncements(true),
      ]);

      const matches = matchesResult.success && matchesResult.data ? matchesResult.data : [];
      const leagues = leaguesResult.success && leaguesResult.data ? leaguesResult.data : [];
      const playerStats = statsResult.success && statsResult.data ? statsResult.data : [];
      const allAnnouncements = announcementsResult.success && announcementsResult.data ? announcementsResult.data : [];

      // Filter announcements
      const activeAnnouncements = allAnnouncements.filter(a =>
        AnnouncementService.isAnnouncementActive(a) &&
        !dismissedAnnouncements.includes(a.id!)
      );

      setAnnouncements(activeAnnouncements);

      // Check for popup announcement
      const popupAnnouncements = await AnnouncementService.getPopupAnnouncements(true);
      if (popupAnnouncements.success && popupAnnouncements.data) {
        const popup = popupAnnouncements.data.find(a =>
          AnnouncementService.isAnnouncementActive(a) &&
          !dismissedAnnouncements.includes(a.id!)
        );
        if (popup) {
          setPopupAnnouncement(popup);
          // Track view
          await AnnouncementService.incrementViews(popup.id!);
        }
      }

      // Process upcoming matches
      const now = new Date();
      const upcoming = matches
        .filter(m =>
          new Date(m.schedule.matchStart) > now &&
          UPCOMING_STATUSES.includes(m.status)
        )
        .sort((a, b) =>
          new Date(a.schedule.matchStart).getTime() - new Date(b.schedule.matchStart).getTime()
        )
        .slice(0, MAX_ITEMS);

      setUpcomingMatches(upcoming);
      setMyLeagues(leagues.slice(0, MAX_ITEMS));

      // Calculate average rating
      let totalRating = 0;
      let ratingCount = 0;
      playerStats.forEach(stat => {
        if (stat.rating && typeof stat.rating === 'number') {
          totalRating += stat.rating;
          ratingCount++;
        }
      });
      const averageRating = ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(1)) : 0;

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
  }, [user?.id, dismissedAnnouncements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // ============================================
  // ANNOUNCEMENT HANDLERS
  // ============================================

  const handleDismissAnnouncement = async (announcementId: string) => {
    await saveDismissedAnnouncement(announcementId);
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));

    // Track dismiss
    await AnnouncementService.incrementDismissed(announcementId);
  };

  const handleAnnouncementAction = async (announcement: IAnnouncement) => {
    if (!announcement.action) return;

    // Track click
    await AnnouncementService.incrementClicks(announcement.id!);

    const { url } = announcement.action;

    // Handle deep links
    if (url.startsWith('app://')) {
      const path = url.replace('app://', '');

      // Parse and navigate
      if (path.startsWith('league/')) {
        const leagueId = path.split('/')[1];
        LeagueNavigationService.navigateToLeagueDetail(leagueId);
      } else if (path.startsWith('match/')) {
        const matchId = path.split('/')[1];
        MatchNavigationService.navigateToMatchDetail(matchId);
      } else if (path === 'join-league') {
        LeagueNavigationService.navigateToJoinWithCode();
      } else if (path === 'payments') {
        MatchNavigationService.navigateToPaymentTracking('');
      }
    } else if (url.startsWith('http://') || url.startsWith('https://')) {
      // External URL
      Linking.openURL(url);
    }
  };

  const handleDismissPopup = async () => {
    if (popupAnnouncement) {
      await saveDismissedAnnouncement(popupAnnouncement.id!);
      await AnnouncementService.incrementDismissed(popupAnnouncement.id!);
    }
    setPopupAnnouncement(null);
  };

  const handlePopupAction = async () => {
    if (popupAnnouncement) {
      await handleAnnouncementAction(popupAnnouncement);
      handleDismissPopup();
    }
  };

  // ============================================
  // DATA PROCESSING FUNCTIONS
  // ============================================

  const processPendingActions = async (matches: IMatch[], userId: string): Promise<PendingAction[]> => {
    const actions: PendingAction[] = [];

    for (const match of matches) {
      // Bekleyen ödeme
      const myPayment = match.payments?.find(p => p.playerId === userId);
      if (myPayment && !myPayment.paid && match.status !== MatchStatus.CANCELLED) {
        actions.push({
          id: `payment-${match.id}`,
          type: 'payment',
          title: 'Ödeme Bekliyor',
          subtitle: `${match.title} - ${myPayment.amount}₺`,
          matchId: match.id!,
          priority: 'high',
        });
      }

      // Puanlama bekleniyor
      if (match.status === MatchStatus.COMPLETED) {
        const ratingsResult = await MatchRatingService.getRaterRatings(match.id!, userId);
        const hasRated = ratingsResult.success && ratingsResult.data && ratingsResult.data.length > 0;

        const allPlayerIds = match.players.teams
          ? [
            ...match.players.teams.team1.map(p => p.playerId),
            ...match.players.teams.team2.map(p => p.playerId),
          ]
          : [];

        if (!hasRated && allPlayerIds.includes(userId)) {
          actions.push({
            id: `rating-${match.id}`,
            type: 'rating',
            title: 'Oyuncu Puanlaması',
            subtitle: `${match.title} - Oyuncuları puanla`,
            matchId: match.id!,
            priority: 'medium',
          });
        }
      }

      // Gol/Asist girişi bekleniyor
      if (match.status === MatchStatus.AWAITING_SCORE && match.score) {
        const myGoalEntry = match.score.scorers.find(s => s.playerId === userId);

        const allPlayerIds = match.players.teams
          ? [
            ...match.players.teams.team1.map(p => p.playerId),
            ...match.players.teams.team2.map(p => p.playerId),
          ]
          : [];

        if (!myGoalEntry && allPlayerIds.includes(userId)) {
          actions.push({
            id: `goal-${match.id}`,
            type: 'goalAssist',
            title: 'Gol & Asist Gir',
            subtitle: `${match.title} - Performansını kaydet`,
            matchId: match.id!,
            priority: 'medium',
          });
        }
      }

      // Kayıt açık maçlar
      if (match.status === MatchStatus.REGISTRATION_OPEN) {
        const isAlreadyRegistered = match.players.registered.some(r => r.playerId === userId);
        const isDirectPlayer = match.players.direct.mode === 'custom' && match.players.direct.overrides
          ? match.players.direct.overrides.includes(userId)
          : match.players.direct.inherited.includes(userId);

        if (!isAlreadyRegistered && !isDirectPlayer) {
          const hoursUntil = (new Date(match.schedule.matchStart).getTime() - Date.now()) / 3600000;
          if (hoursUntil < 48) {
            actions.push({
              id: `register-${match.id}`,
              type: 'registration',
              title: 'Maça Kayıt Ol',
              subtitle: `${match.title} - ${Math.floor(hoursUntil)} saat kaldı`,
              matchId: match.id!,
              priority: hoursUntil < 24 ? 'high' : 'low',
            });
          }
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
      const myPayment = match.payments?.find(p => p.playerId === userId);
      if (myPayment && match.status !== MatchStatus.CANCELLED) {
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
    playerStats: IPlayerStats[],
    userId: string
  ): Promise<NewsItem[]> => {
    const feed: NewsItem[] = [];

    // Son tamamlanan maç
    const completedMatches = matches
      .filter(m => m.status === MatchStatus.COMPLETED)
      .sort((a, b) => new Date(b.schedule.matchStart).getTime() - new Date(a.schedule.matchStart).getTime());

    if (completedMatches[0]) {
      const match = completedMatches[0];
      const scoreText = match.score
        ? `${match.score.team1} - ${match.score.team2}`
        : 'Skor girilmedi';

      feed.push({
        id: `match-${match.id}`,
        type: 'match_result',
        title: 'Maç Tamamlandı',
        description: `${match.title} - Skor: ${scoreText}`,
        icon: getSportEmoji(match.sportType as SportType),
        time: formatRelativeTime(match.schedule.matchStart),
        color: '#16a34a',
      });
    }

    // MVP Ödülü
    const recentMVP = matches.find(m =>
      m.mvp?.playerId === userId &&
      m.status === MatchStatus.COMPLETED
    );
    if (recentMVP) {
      feed.push({
        id: `mvp-${recentMVP.id}`,
        type: 'achievement',
        title: '🏆 MVP Ödülü Kazandın!',
        description: `${recentMVP.title} maçında en iyi oyuncu seçildin`,
        icon: '🏆',
        time: formatRelativeTime(recentMVP.schedule.matchStart),
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
          description: `${newestLeague.title} - ${newestLeague.totalMembers} oyuncu`,
          icon: getSportEmoji(newestLeague.sportType as SportType),
          time: formatRelativeTime(new Date(newestLeague.createdAt)),
          color: '#2563EB',
        });
      }
    }

    return feed;
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    loadDismissedAnnouncements();
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // MEMOIZED DATA
  // ============================================

  const formattedMatches = useMemo<FormattedMatch[]>(() =>
    upcomingMatches.map(match => ({
      ...match,
      formattedDate: formatDate(match.schedule.matchStart),
      formattedTime: formatTime(match.schedule.matchStart),
    })),
    [upcomingMatches]
  );

  // ============================================
  // HANDLERS
  // ============================================

  const handleMatchPress = useCallback((match: IMatch) => {
    if (match.status === MatchStatus.REGISTRATION_OPEN) {
      MatchNavigationService.navigateToMatchRegistration(match.id!);
    } else {
      MatchNavigationService.navigateToMatchDetail(match.id!);
    }
  }, []);

  const handleLeaguePress = useCallback((leagueId: string) => {
    LeagueNavigationService.navigateToLeagueDetail(leagueId);
  }, []);

  const handlePendingAction = useCallback((action: PendingAction) => {
    switch (action.type) {
      case 'payment':
        MatchNavigationService.navigateToPlayerPayment(action.matchId);
        break;
      case 'rating':
        MatchNavigationService.navigateToPlayerRating(action.matchId);
        break;
      case 'goalAssist':
        MatchNavigationService.navigateToGoalAssistEntry(action.matchId);
        break;
      case 'registration':
        MatchNavigationService.navigateToMatchRegistration(action.matchId);
        break;
    }
  }, []);

  const handleNewsPress = useCallback((newsItem: NewsItem) => {
    if (newsItem.type === 'match_result') {
      const matchId = newsItem.id.split('-')[1];
      MatchNavigationService.navigateToMatchDetail(matchId);
    } else if (newsItem.type === 'league_update') {
      const leagueId = newsItem.id.split('-')[1];
      LeagueNavigationService.navigateToLeagueDetail(leagueId);
    }
  }, []);

  const handleQuickAction = useCallback((action: 'standings' | 'profile' | 'payments' | 'joinLeague') => {
    if (action === 'standings') {
      if (myLeagues.length === 0) {
        Alert.alert('Lig Bulunamadı', 'Önce bir lige katılmanız gerekiyor.');
        return;
      }
      StandingsNavigationService.navigateToStandings(myLeagues[0].id!);
    } else if (action === 'profile') {
      SettingsNavigationService.navigateToPlayerProfile();
    } else if (action === 'payments') {
      Alert.alert('Ödemelerim', `Toplam: ${paymentSummary.total}₺\nBekleyen: ${paymentSummary.pending}₺`);
    } else if (action === 'joinLeague') {
      LeagueNavigationService.navigateToJoinWithCode();
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

  const renderAnnouncements = useCallback(() => {
    if (announcements.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell size={20} color="#F59E0B" strokeWidth={2} />
          <Text style={styles.sectionTitle}>Duyurular</Text>
        </View>

        {announcements.map(announcement => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            onDismiss={() => handleDismissAnnouncement(announcement.id!)}
            onAction={() => handleAnnouncementAction(announcement)}
          />
        ))}
      </View>
    );
  }, [announcements]);

  const renderPendingActions = useCallback(() => {
    if (pendingActions.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bekleyen İşlemler</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingActions.length}</Text>
          </View>
        </View>

        {pendingActions.map(action => {
          const iconColor = action.priority === 'high' ? '#EF4444' : '#F59E0B';
          return (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={() => handlePendingAction(action)}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${iconColor}20` }]}>
                {action.type === 'payment' && <DollarSign size={20} color={iconColor} />}
                {action.type === 'rating' && <Star size={20} color={iconColor} />}
                {action.type === 'goalAssist' && <Target size={20} color={iconColor} />}
                {action.type === 'registration' && <Calendar size={20} color={iconColor} />}
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }, [pendingActions, handlePendingAction]);

  const renderNews = useCallback(() => {
    if (news.length === 0) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Haberler</Text>
        </View>

        {news.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.newsCard}
            onPress={() => handleNewsPress(item)}
            activeOpacity={0.7}
          >
            <View style={[styles.newsIcon, { backgroundColor: `${item.color}20` }]}>
              <Text style={styles.newsEmoji}>{item.icon}</Text>
            </View>
            <View style={styles.newsContent}>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsDescription}>{item.description}</Text>
              <Text style={styles.newsTime}>{item.time}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [news, handleNewsPress]);

  // ============================================
  // MAIN RENDER
  // ============================================

  const renderHeader = () => (
    <CustomHeader
      title="Ana Sayfa"
      showMenu
    />
  );

  if (loading) {
    return (
      <ScrollView style={styles.container}>
        {renderHeader()}
        <View style={styles.header}>
          <Text style={styles.greeting}>Yükleniyor...</Text>
        </View>
        <View style={styles.statsContainer}>
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </View>
        <View style={styles.section}>
          {[1, 2, 3].map(i => <MatchCardSkeleton key={i} />)}
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
        }
        showsVerticalScrollIndicator={false}
      >
       {renderHeader()}

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba 👋</Text>
            <Text style={styles.userName}>{user?.displayName || user?.name}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#1F2937" strokeWidth={2} />
            {(pendingActions.length > 0 || announcements.length > 0) && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {pendingActions.length + announcements.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          {renderStatCard(
            <Trophy size={24} color="#16a34a" strokeWidth={2} />,
            stats.totalLeagues,
            'Lig',
            '#DCFCE7'
          )}
          {renderStatCard(
            <Calendar size={24} color="#2563eb" strokeWidth={2} />,
            stats.totalMatches,
            'Maç',
            '#DBEAFE'
          )}
          {renderStatCard(
            <Star size={24} color="#F59E0B" strokeWidth={2} />,
            stats.averageRating.toFixed(1),
            'Puan',
            '#FEF3C7'
          )}
          {renderStatCard(
            <DollarSign size={24} color="#EF4444" strokeWidth={2} />,
            `${paymentSummary.pending}₺`,
            'Borç',
            '#FEE2E2'
          )}
        </View>

        {/* Next Match Highlight */}
        {stats.nextMatch && (
          <TouchableOpacity
            style={styles.nextMatchCard}
            onPress={() => handleMatchPress(stats.nextMatch!)}
            activeOpacity={0.9}
          >
            <View style={styles.nextMatchHeader}>
              <View style={styles.nextMatchBadge}>
                <Zap size={14} color="white" strokeWidth={2.5} />
                <Text style={styles.nextMatchBadgeText}>Yaklaşan Maç</Text>
              </View>
              <Text style={styles.nextMatchEmoji}>
                {getSportEmoji(stats.nextMatch.sportType as SportType)}
              </Text>
            </View>

            <Text style={styles.nextMatchTitle}>{stats.nextMatch.title}</Text>

            <View style={styles.nextMatchDetails}>
              <View style={styles.nextMatchDetailItem}>
                <Calendar size={16} color="#6B7280" strokeWidth={2} />
                <Text style={styles.nextMatchDetailText}>
                  {formatDate(stats.nextMatch.schedule.matchStart)}
                </Text>
              </View>

              <View style={styles.nextMatchDetailItem}>
                <Clock size={16} color="#6B7280" strokeWidth={2} />
                <Text style={styles.nextMatchDetailText}>
                  {formatTime(stats.nextMatch.schedule.matchStart)}
                </Text>
              </View>

              <View style={styles.nextMatchDetailItem}>
                <MapPin size={16} color="#6B7280" strokeWidth={2} />
                <Text style={styles.nextMatchDetailText}>
                  {stats.nextMatch.venue?.location || 'Lokasyon belirtilmemiş'}
                </Text>
              </View>
            </View>

            <View style={styles.nextMatchFooter}>
              <View style={styles.nextMatchPlayers}>
                <Users size={16} color="#16a34a" strokeWidth={2} />
                <Text style={styles.nextMatchPlayersText}>
                  {stats.nextMatch.players.registered.length}/{stats.nextMatch.squad.totalPlayers} Oyuncu
                </Text>
              </View>

              <View style={[
                styles.matchStatusBadge,
                { backgroundColor: `${getMatchStatusColor(stats.nextMatch.status)}20` }
              ]}>
                <Text style={[
                  styles.matchStatusText,
                  { color: getMatchStatusColor(stats.nextMatch.status) }
                ]}>
                  {getMatchStatusText(stats.nextMatch.status)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('joinLeague')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
              <UserPlus size={20} color="#16a34a" strokeWidth={2.5} />
            </View>
            <Text style={styles.quickActionText}>Lige{'\n'}Katıl</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('standings')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <TrendingUp size={20} color="#F59E0B" strokeWidth={2.5} />
            </View>
            <Text style={styles.quickActionText}>Puan{'\n'}Durumu</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('payments')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
              <DollarSign size={20} color="#EF4444" strokeWidth={2.5} />
            </View>
            <Text style={styles.quickActionText}>Ödeme{'\n'}Takip</Text>
          </TouchableOpacity>
        </View>
        {/* Announcements */}
        {renderAnnouncements()}

        {/* Pending Actions */}
        {renderPendingActions()}

        {/* Upcoming Matches */}
        {formattedMatches.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Yaklaşan Maçlar</Text>
              <TouchableOpacity onPress={() => MatchNavigationService.navigateToMatchList()}>
                <Text style={styles.seeAllText}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>

            {formattedMatches.map(match => (
              <TouchableOpacity
                key={match.id}
                style={styles.matchCard}
                onPress={() => handleMatchPress(match)}
                activeOpacity={0.7}
              >
                <View style={styles.matchCardLeft}>
                  <Text style={styles.matchEmoji}>
                    {getSportEmoji(match.sportType as SportType)}
                  </Text>
                  <View style={styles.matchCardInfo}>
                    <Text style={styles.matchCardTitle}>{match.title}</Text>
                    <View style={styles.matchCardMeta}>
                      <Clock size={12} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.matchCardMetaText}>
                        {match.formattedDate} • {match.formattedTime}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.matchCardRight}>
                  <View style={[
                    styles.matchStatusBadge,
                    { backgroundColor: `${getMatchStatusColor(match.status)}15` }
                  ]}>
                    <Text style={[
                      styles.matchStatusText,
                      { color: getMatchStatusColor(match.status) }
                    ]}>
                      {getMatchStatusText(match.status)}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* My Leagues */}
        {myLeagues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Liglerim</Text>
              <TouchableOpacity onPress={() => LeagueNavigationService.navigateToLeagueList()}>
                <Text style={styles.seeAllText}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>

            {myLeagues.map(league => (
              <TouchableOpacity
                key={league.id}
                style={styles.leagueCard}
                onPress={() => handleLeaguePress(league.id!)}
                activeOpacity={0.7}
              >
                <View style={styles.leagueCardLeft}>
                  <Text style={styles.leagueEmoji}>
                    {getSportEmoji(league.sportType as SportType)}
                  </Text>
                  <View style={styles.leagueCardInfo}>
                    <Text style={styles.leagueCardTitle}>{league.title}</Text>
                    <View style={styles.leagueCardMeta}>
                      <Users size={12} color="#6B7280" strokeWidth={2} />
                      <Text style={styles.leagueCardMetaText}>
                        {league.totalMembers} Üye
                      </Text>
                    </View>
                  </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* News Feed */}
        {renderNews()}

        {/* Empty State */}
        {myLeagues.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Trophy size={40} color="#D1D5DB" strokeWidth={2} />
            </View>
            <Text style={styles.emptyStateText}>
              Henüz bir lige katılmadınız
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => handleQuickAction('joinLeague')}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyStateButtonText}>Lige Katıl</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Popup Announcement Modal */}
      {popupAnnouncement && (
        <AnnouncementPopup
          announcement={popupAnnouncement}
          onDismiss={handleDismissPopup}
          onAction={handlePopupAction}
        />
      )}
    </>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
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
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },

  // Next Match Card
  nextMatchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
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
  // Quick Actions - Modern Design
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    minHeight: 80,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 14,
    letterSpacing: -0.2,
  },

  // Announcement Card
  announcementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButton: {
    padding: 4,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  announcementMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  announcementActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
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

  // Action Card
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
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

  // News Card
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
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  newsDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  newsTime: {
    fontSize: 11,
    color: '#9CA3AF',
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