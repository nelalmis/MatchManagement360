// src/screens/Match/MatchDetailScreen.tsx
// 🎯 UPDATED: Invitation Code Display & Share

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Share as ShareAPI,
  Clipboard,
} from 'react-native';
import {
  Edit,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Trophy,
  UserCheck,
  Target,
  Award,
  Share2,
  AlertCircle,
  Timer,
  ChevronRight,
  Star,
  Globe,
  Lock,
  TrendingUp,
  Mail,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Copy,
  Key,
  Send,
} from 'lucide-react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import {
  IMatch,
  IFixture,
  IPlayer,
  ILeague,
  MatchType,
  MatchStatus,
  SPORT_CONFIGS,
} from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { MatchInvitationService } from '../../services/serviceLayer/matchInvitationService';
import { NavigationService } from '../../navigation/NavigationService';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { eventManager, Events } from '../../utils';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { InvitationType } from '../../types/entity/invitation';

export const MatchDetailScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAuth();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [fixture, setFixture] = useState<IFixture | null>(null);
  const [league, setLeague] = useState<ILeague | null>(null);
  const [organizer, setOrganizer] = useState<IPlayer | null>(null);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [codeCountdown, setCodeCountdown] = useState('');

  const [isRegistered, setIsRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [canBuildTeam, setCanBuildTeam] = useState(false);
  const [isInvited, setIsInvited] = useState(false);
  const [eligiblePlayers, setEligiblePlayers] = useState<{ all: string[]; squad: string[]; reserve: string[] }>({ 
    all: [], 
    squad: [], 
    reserve: [] 
  });

  useFocusEffect(
    React.useCallback(() => {
      if (matchId) {
        loadData();
      }
    }, [matchId, route.params?.updated])
  );

  // Match countdown timer
  useEffect(() => {
    if (!match) return;

    const timer = setInterval(() => {
      if(!match.schedule?.matchStart) return;
      const now = new Date().getTime();
      const matchTime = new Date(match.schedule?.matchStart).getTime();
      const diff = matchTime - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setCountdown(`${days} gün ${hours} saat`);
        } else if (hours > 0) {
          setCountdown(`${hours} saat ${minutes} dakika`);
        } else {
          setCountdown(`${minutes} dakika`);
        }
      } else if (match.status === MatchStatus.IN_PROGRESS) {
        setCountdown('Maç başladı!');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [match]);

  // ✅ NEW: Invitation code expiry countdown
  useEffect(() => {
    if (!match?.invitationCode?.expiresAt) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiryTime = new Date(match.invitationCode!.expiresAt!).getTime();
      const diff = expiryTime - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
          setCodeCountdown(`${hours} saat ${minutes} dakika`);
        } else {
          setCodeCountdown(`${minutes} dakika`);
        }
      } else {
        setCodeCountdown('Süresi doldu');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [match?.invitationCode]);

  const loadData = useCallback(async () => {
    if (!matchId) {
      Alert.alert('Hata', 'Maç ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      // Get match
      const matchResult = await MatchService.getMatch(matchId);
      if (!matchResult.success || !matchResult.data) {
        Alert.alert('Maç Bulunamadı', 'Bu maç silinmiş olabilir.');
        NavigationService.goBack();
        return;
      }

      const matchData = matchResult.data;
      setMatch(matchData);

      const isFriendly = matchData.type === MatchType.FRIENDLY;

      // Get fixture & league for League matches
      if (!isFriendly && matchData.fixtureId) {
        const fixtureResult = await FixtureService.getFixture(matchData.fixtureId);
        if (fixtureResult.success && fixtureResult.data) {
          setFixture(fixtureResult.data);

          if (matchData.leagueId) {
            const leagueResult = await LeagueService.getLeague(matchData.leagueId);
            if (leagueResult.success && leagueResult.data) {
              setLeague(leagueResult.data);
            }
          }
        }
      } else if (isFriendly && matchData.linkedLeagueId) {
        const leagueResult = await LeagueService.getLeague(matchData.linkedLeagueId);
        if (leagueResult.success && leagueResult.data) {
          setLeague(leagueResult.data);
        }
      }

      // Check user permissions
      if (user?.id) {
        const eligiblePlayers = await MatchService.getEligiblePlayers(matchData);
        setEligiblePlayers(eligiblePlayers);

        const registered = isPlayerInMatch(eligiblePlayers, matchData, user.id);
        setIsRegistered(registered);

        const organizerCheck = matchData.permissions.organizers.includes(user.id);
        setIsOrganizer(organizerCheck);

        const teamBuilderCheck = matchData.permissions.teamBuilders?.includes(user.id) || organizerCheck;
        setCanBuildTeam(teamBuilderCheck);

        // ✅ UPDATED: Check invitation (now uses invitation code or personal invites)
        if (isFriendly && !matchData.friendlySettings?.isPublic) {
          // Check personal invitations (old system)
          const personalInviteCheck = matchData.friendlySettings?.invitedPlayerIds?.includes(user.id) || false;
          setIsInvited(personalInviteCheck);
          
          // Note: Kod ile katılım için ayrı kontrol yok, kod herkes için geçerli
        }
      }

      // Load pending invitations count (for organizer)
      if (isFriendly && isOrganizer) {
        const invitationsResult = await MatchInvitationService.getPendingMatchInvitations(matchId);
        if (invitationsResult.success && invitationsResult.data) {
          setPendingInvitationsCount(invitationsResult.data.length);
        }
      }

    } catch (error: any) {
      console.error('Error loading match:', error);
      Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu.');
      NavigationService.goBack();
    } finally {
      setLoading(false);
    }
  }, [matchId, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const isPlayerInMatch = (
    eligiblePlayers: { all: string[]; squad: string[]; reserve: string[] }, 
    match: IMatch, 
    playerId: string
  ): boolean => {
    if (eligiblePlayers.all.some(id => id === playerId)) return true;
    if (match.players.registered?.some(r => r.playerId === playerId)) return true;
    if (match.players.guests?.includes(playerId)) return true;

    if (match.players.teams) {
      const inTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
      const inTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);
      return inTeam1 || inTeam2;
    }

    return false;
  };

  // ✅ NEW: Copy invitation code
  const handleCopyCode = useCallback(async () => {
    if (!match?.invitationCode?.code) return;

    try {
      await Clipboard.setString(match.invitationCode.code);
      Alert.alert('✅ Kopyalandı', 'Davet kodu panoya kopyalandı');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Hata', 'Kod kopyalanamadı');
    }
  }, [match?.invitationCode?.code]);

  // ✅ NEW: Share invitation code
  const handleShareCode = useCallback(async () => {
    if (!match?.invitationCode?.code) return;

    try {
      const code = match.invitationCode.code;
      const sportConfig = SPORT_CONFIGS[match.sportType || 'Futbol'];
      
      const message = `${sportConfig.emoji} ${match.title}\n\n` +
        `📅 ${formatDateTime(match.schedule?.matchStart)}\n` +
        `📍 ${match.venue?.location || 'Lokasyon belirtilmedi'}\n\n` +
        `🔑 Davet Kodu: ${code}\n\n` +
        `Maça katılmak için uygulamada "Kodla Katıl" seçeneğini kullanın!`;

      await ShareAPI.share({
        message,
        title: `${match.title} - Davet Kodu`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [match]);

  const handleShare = useCallback(async () => {
    if (!match) return;

    try {
      const isFriendly = match.type === MatchType.FRIENDLY;
      const matchTypeLabel = isFriendly ? '🤝 Dostluk Maçı' : '🏆 Lig Maçı';

      let message = `${matchTypeLabel}: ${match.title}\n\n` +
        `📅 ${formatDateTime(match.schedule?.matchStart)}`;
      
      if (match.venue?.location) {
        message += `\n📍 ${match.venue.location}`;
      }

      // ✅ NEW: Add invitation code if available
      if (match.invitationCode?.code && match.invitationCode.enabled) {
        message += `\n\n🔑 Davet Kodu: ${match.invitationCode.code}`;
      }

      message += '\n\n⚽ Maça katılmak için uygulamayı kullanın!';

      await ShareAPI.share({
        message,
        title: match.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [match]);

  const handleRegister = () => {
    if (!match) return;
    NavigationService.navigateToMatchRegistration(match.id!);
  };

  const handleBuildTeam = () => {
    if (!match) return;
    NavigationService.navigateToTeamBuilding(match.id!);
  };

  const handleScoreEntry = () => {
    if (!match) return;
    NavigationService.navigateToScoreEntry(match.id!);
  };

  const handleCancelRegistration = () => {
    if (!match) return;

    Alert.alert(
      '❌ Kaydı İptal Et',
      'Maç kaydınızı iptal etmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kaydı İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              const result = await MatchService.unregisterPlayer(match.id!, user!.id!);

              if (result.success) {
                eventManager.emit(Events.MATCH_UPDATED, {
                  matchId: match.id,
                  timestamp: Date.now()
                });

                Alert.alert(
                  '✅ İptal Edildi',
                  'Maç kaydınız başarıyla iptal edildi',
                  [{ text: 'Tamam', onPress: () => loadData() }]
                );
              } else {
                Alert.alert('Hata', result.error?.message || 'Kayıt iptal edilemedi');
              }
            } catch (error) {
              console.error('Error canceling registration:', error);
              Alert.alert('Hata', 'Kayıt iptal edilirken bir hata oluştu');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleGoalAssistEntry = () => {
    if (!match) return;
    NavigationService.navigateToGoalAssistEntry(match.id!);
  };

  const handlePlayerRating = () => {
    if (!match) return;
    NavigationService.navigateToPlayerRating(match.id!);
  };

  const handlePaymentTracking = () => {
    if (!match) return;
    NavigationService.navigateToPaymentTracking(match.id!);
  };

  const handleManageInvitations = () => {
    if (!match) return;
    NavigationService.navigateToManageInvitations(InvitationType.MATCH, match.id!, match.title!, sportType);
  };

  const formatDateTime = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getMatchStatusColor = useCallback((status: MatchStatus): string => {
    switch (status) {
      case MatchStatus.CREATED: return '#9CA3AF';
      case MatchStatus.REGISTRATION_OPEN: return '#10B981';
      case MatchStatus.REGISTRATION_CLOSED: return '#F59E0B';
      case MatchStatus.TEAMS_SET: return '#2563EB';
      case MatchStatus.IN_PROGRESS: return '#8B5CF6';
      case MatchStatus.AWAITING_SCORE: return '#F59E0B';
      case MatchStatus.COMPLETED: return '#16a34a';
      case MatchStatus.CANCELLED: return '#DC2626';
      default: return '#6B7280';
    }
  }, []);

  const getMatchStatusText = useCallback((status: MatchStatus): string => {
    switch (status) {
      case MatchStatus.CREATED: return 'Oluşturuldu';
      case MatchStatus.REGISTRATION_OPEN: return 'Kayıt Açık';
      case MatchStatus.REGISTRATION_CLOSED: return 'Kayıt Kapandı';
      case MatchStatus.TEAMS_SET: return 'Takımlar Kuruldu';
      case MatchStatus.IN_PROGRESS: return 'Oynanıyor';
      case MatchStatus.AWAITING_SCORE: return 'Skor Bekleniyor';
      case MatchStatus.COMPLETED: return 'Tamamlandı';
      case MatchStatus.CANCELLED: return 'İptal';
      default: return status;
    }
  }, []);

  // Memoized values
  const isFriendly = useMemo(() =>
    match?.type === MatchType.FRIENDLY,
    [match]
  );

  const sportType = useMemo(() => {
    if (match?.sportType) return match.sportType;
    if (league) return league.sportType;
    return undefined;
  }, [match, league]);

  const sportColor = useMemo(() =>
    sportType ? SPORT_CONFIGS[sportType].color : '#16a34a',
    [sportType]
  );

  const statusColor = useMemo(() =>
    match ? getMatchStatusColor(match.status) : '#6B7280',
    [match, getMatchStatusColor]
  );

  const canRegister = useMemo(() => {
    if (!match || !user?.id) return false;
    if (isRegistered) return false;
    if (match.status !== MatchStatus.REGISTRATION_OPEN) return false;

    // ✅ UPDATED: Friendly match için özel kontrol
    if (isFriendly && !match.friendlySettings?.isPublic) {
      // Kod aktif değilse ve personal invite de yoksa kayıt olamaz
      const hasValidCode = match.invitationCode?.enabled && 
        (!match.invitationCode.expiresAt || new Date(match.invitationCode.expiresAt) > new Date());
      
      if (!hasValidCode && !isInvited) return false;
    }

    // Squad full check
    const totalRegistered = (match.players.registered?.length || 0) + (match.players.guests?.length || 0);
    if (totalRegistered >= (match.squad?.totalPlayers || 0)) return false;

    return true;
  }, [match, user?.id, isRegistered, isFriendly, isInvited]);

  const showTeams = useMemo(() =>
    match?.players.teams &&
    match.players.teams.team1.length > 0 &&
    match.players.teams.team2.length > 0,
    [match?.players.teams]
  );

  const registeredCount = useMemo(() => {
    if (!match) return 0;
    return eligiblePlayers.all.length;
  }, [eligiblePlayers, match]);

  const paidPlayersCount = useMemo(() =>
    match?.payments?.filter(p => p.paid).length || 0,
    [match?.payments]
  );

  // ✅ NEW: Check if code is expired
  const isCodeExpired = useMemo(() => {
    if (!match?.invitationCode?.expiresAt) return false;
    return new Date(match.invitationCode.expiresAt) < new Date();
  }, [match?.invitationCode]);

  // ✅ NEW: Check if code reached max uses
  const isCodeMaxedOut = useMemo(() => {
    if (!match?.invitationCode?.maxUses) return false;
    return match.invitationCode.currentUses >= match.invitationCode.maxUses;
  }, [match?.invitationCode]);

  if (loading || !match) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Maç yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
    <View style={styles.container}>
      {/* Custom Header */}
      <CustomHeader
        title={match.title}
        subtitle={isFriendly ? 'Dostluk Maçı' : (fixture?.title || league?.title || 'Lig Maçı')}
        sportType={sportType}
        showIcon={!!sportType}
        showBack={true}
        onLeftPress={() => NavigationService.goBack()}
        showShare={!isOrganizer}
        showEdit={isOrganizer}
        onSharePress={handleShare}
        onEditPress={() => NavigationService.navigateToEditMatch(match.id!)}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={sportColor}
            colors={[sportColor]}
          />
        }
      >
        {/* Match Type & Privacy Badges */}
        <View style={styles.badgesContainer}>
          {isFriendly ? (
            <View style={[styles.typeBadge, { backgroundColor: '#10B981' + '20' }]}>
              <Users size={14} color="#10B981" strokeWidth={2} />
              <Text style={[styles.typeBadgeText, { color: '#10B981' }]}>
                Dostluk Maçı
              </Text>
            </View>
          ) : (
            <View style={[styles.typeBadge, { backgroundColor: '#3B82F6' + '20' }]}>
              <Trophy size={14} color="#3B82F6" strokeWidth={2} />
              <Text style={[styles.typeBadgeText, { color: '#3B82F6' }]}>
                Lig Maçı
              </Text>
            </View>
          )}

          {/* Privacy Badge (Friendly) */}
          {isFriendly && match.friendlySettings && (
            <View style={[styles.privacyBadge, {
              backgroundColor: match.friendlySettings.isPublic ? '#10B981' + '15' : '#F59E0B' + '15'
            }]}>
              {match.friendlySettings.isPublic ? (
                <>
                  <Globe size={12} color="#10B981" strokeWidth={2} />
                  <Text style={[styles.privacyBadgeText, { color: '#10B981' }]}>Açık</Text>
                </>
              ) : (
                <>
                  <Lock size={12} color="#F59E0B" strokeWidth={2} />
                  <Text style={[styles.privacyBadgeText, { color: '#F59E0B' }]}>Özel</Text>
                </>
              )}
            </View>
          )}

          {/* Stats Impact Badge (Friendly) */}
          {isFriendly && match.friendlySettings && !match.friendlySettings.affectsStandings && (
            <View style={[styles.impactBadge, { backgroundColor: '#6B7280' + '15' }]}>
              <TrendingUp size={12} color="#6B7280" strokeWidth={2} />
              <Text style={[styles.impactBadgeText, { color: '#6B7280' }]}>
                Puan durumunu etkilemez
              </Text>
            </View>
          )}
        </View>

        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getMatchStatusText(match.status)}
          </Text>
        </View>

        {/* ✅ NEW: Invitation Code Card (for organizers) */}
        {isOrganizer && match.invitationCode && (
          <View style={styles.invitationCodeCard}>
            <View style={styles.invitationCodeHeader}>
              <Key size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.invitationCodeTitle}>Davet Kodu</Text>
            </View>

            {/* Code Display */}
            <View style={styles.codeDisplay}>
              <Text style={styles.codeText}>{match.invitationCode.code}</Text>
            </View>

            {/* Code Stats */}
            <View style={styles.codeStats}>
              <View style={styles.codeStat}>
                <Users size={16} color="#6B7280" strokeWidth={2} />
                <Text style={styles.codeStatText}>
                  {match.invitationCode.currentUses > 0 ? match.invitationCode.currentUses : "0"}
                  {match.invitationCode.maxUses && ` / ${match.invitationCode.maxUses}`} kullanım
                </Text>
              </View>

              {match.invitationCode.expiresAt && (
                <View style={styles.codeStat}>
                  <Clock size={16} color="#6B7280" strokeWidth={2} />
                  <Text style={[
                    styles.codeStatText,
                    isCodeExpired && { color: '#DC2626' }
                  ]}>
                    {codeCountdown || 'Hesaplanıyor...'}
                  </Text>
                </View>
              )}
            </View>

            {/* Status Badges */}
            <View style={styles.codeStatusContainer}>
              {!match.invitationCode.enabled && (
                <View style={[styles.codeStatusBadge, { backgroundColor: '#DC2626' + '15' }]}>
                  <Text style={[styles.codeStatusText, { color: '#DC2626' }]}>
                    Devre Dışı
                  </Text>
                </View>
              )}
              {isCodeExpired && (
                <View style={[styles.codeStatusBadge, { backgroundColor: '#DC2626' + '15' }]}>
                  <Text style={[styles.codeStatusText, { color: '#DC2626' }]}>
                    Süresi Doldu
                  </Text>
                </View>
              )}
              {isCodeMaxedOut && (
                <View style={[styles.codeStatusBadge, { backgroundColor: '#F59E0B' + '15' }]}>
                  <Text style={[styles.codeStatusText, { color: '#F59E0B' }]}>
                    Kullanım Limiti Doldu
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={styles.codeActionButton}
                onPress={handleCopyCode}
                activeOpacity={0.7}
              >
                <Copy size={18} color="#10B981" strokeWidth={2} />
                <Text style={styles.codeActionText}>Kopyala</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.codeActionButton, styles.codeActionButtonPrimary]}
                onPress={handleShareCode}
                activeOpacity={0.7}
              >
                <Send size={18} color="white" strokeWidth={2} />
                <Text style={styles.codeActionTextPrimary}>Paylaş</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Countdown */}
        {countdown && match.status === MatchStatus.IN_PROGRESS && (
          <View style={styles.countdownCard}>
            <Timer size={20} color={sportColor} strokeWidth={2} />
            <Text style={styles.countdownText}>{countdown}</Text>
          </View>
        )}

        {/* Registration Alert */}
        {canRegister && (
          <TouchableOpacity
            style={styles.registrationAlert}
            onPress={handleRegister}
            activeOpacity={0.7}
          >
            <AlertCircle size={20} color="#10B981" strokeWidth={2} />
            <Text style={styles.registrationAlertText}>
              {isFriendly && !match.friendlySettings?.isPublic 
                ? 'Davet edildiniz - Katılın!' 
                : 'Kayıt açık - Hemen katıl!'}
            </Text>
            <UserCheck size={20} color="#10B981" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Invitations Banner (Friendly - Organizer) */}
        {isFriendly && isOrganizer && pendingInvitationsCount > 0 && (
          <TouchableOpacity
            style={styles.invitationBanner}
            onPress={handleManageInvitations}
            activeOpacity={0.7}
          >
            <View style={styles.invitationBannerLeft}>
              <Mail size={20} color="#10B981" strokeWidth={2} />
              <View style={styles.invitationBannerText}>
                <Text style={styles.invitationBannerTitle}>
                  {pendingInvitationsCount} Bekleyen Davet
                </Text>
                <Text style={styles.invitationBannerSubtitle}>
                  Davetiye durumlarını görüntüle
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#10B981" strokeWidth={2} />
          </TouchableOpacity>
        )}

        {/* Match Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maç Bilgileri</Text>

          <View style={styles.infoCard}>
            <Calendar size={20} color={sportColor} strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Maç Zamanı</Text>
              <Text style={styles.infoValue}>{formatDateTime(match.schedule?.matchStart)}</Text>
            </View>
          </View>

          {match.venue?.location && (
            <View style={styles.infoCard}>
              <MapPin size={20} color="#3B82F6" strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Lokasyon</Text>
                <Text style={styles.infoValue}>{match.venue.location}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <Users size={20} color="#F59E0B" strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Oyuncular</Text>
              <Text style={styles.infoValue}>
                {registeredCount} / {(match.squad?.totalPlayers || 0) + (match.squad?.reservePlayers || 0)} kayıtlı
              </Text>
            </View>
          </View>

          {match.venue?.pricePerPlayer != null && match.venue.pricePerPlayer > 0 &&  (
            <View style={styles.infoCard}>
              <DollarSign size={20} color="#10B981" strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ücret</Text>
                <Text style={styles.infoValue}>{match.venue.pricePerPlayer} TL / Kişi</Text>
                {match.payments && registeredCount > 0 && (
                  <Text style={styles.paymentStatus}>
                    {paidPlayersCount} / {registeredCount} ödeme yapıldı
                  </Text>
                )}
              </View>
            </View>
          )}

          {match.schedule.registrationEnd && (
            <View style={styles.infoCard}>
              <Clock size={20} color="#F59E0B" strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Kayıt Bitiş</Text>
                <Text style={styles.infoValue}>{formatDateTime(match.schedule.registrationEnd)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Score (if completed) */}
        {match.score && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maç Sonucu</Text>
            <View style={styles.scoreCard}>
              <View style={styles.scoreTeam}>
                <Text style={styles.teamName}>Takım 1</Text>
                <Text style={styles.teamScore}>{match.score.team1}</Text>
              </View>
              <View style={styles.scoreDivider}>
                <Text style={styles.scoreDividerText}>-</Text>
              </View>
              <View style={styles.scoreTeam}>
                <Text style={styles.teamName}>Takım 2</Text>
                <Text style={styles.teamScore}>{match.score.team2}</Text>
              </View>
            </View>

            {match.mvp && (
              <View style={styles.mvpCard}>
                <Award size={20} color="#F59E0B" strokeWidth={2} />
                <Text style={styles.mvpText}>MVP oyuncusu seçildi</Text>
              </View>
            )}
          </View>
        )}

        {/* Teams */}
        {showTeams && match.players.teams && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Takımlar</Text>

            <View style={styles.teamsContainer}>
              {/* Team 1 */}
              <View style={styles.teamCard}>
                <View style={styles.teamHeader}>
                  <Trophy size={18} color={sportColor} strokeWidth={2} />
                  <Text style={[styles.teamTitle, { color: sportColor }]}>Takım 1</Text>
                  {match.score && (
                    <View style={[styles.teamScoreBadge, { backgroundColor: sportColor + '20' }]}>
                      <Text style={[styles.teamScoreBadgeText, { color: sportColor }]}>
                        {match.score.team1}
                      </Text>
                    </View>
                  )}
                </View>

                {match.players.teams.team1.map((player, index) => (
                  <View key={player.playerId} style={styles.playerRow}>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.playerRowName}>Oyuncu {index + 1}</Text>
                    {player.position && (
                      <View style={styles.positionBadge}>
                        <Text style={styles.positionText}>{player.position}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>

              {/* Team 2 */}
              <View style={styles.teamCard}>
                <View style={styles.teamHeader}>
                  <Trophy size={18} color="#DC2626" strokeWidth={2} />
                  <Text style={[styles.teamTitle, { color: '#DC2626' }]}>Takım 2</Text>
                  {match.score && (
                    <View style={[styles.teamScoreBadge, { backgroundColor: '#DC262620' }]}>
                      <Text style={[styles.teamScoreBadgeText, { color: '#DC2626' }]}>
                        {match.score.team2}
                      </Text>
                    </View>
                  )}
                </View>

                {match.players.teams.team2.map((player, index) => (
                  <View key={player.playerId} style={styles.playerRow}>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.playerRowName}>Oyuncu {index + 1}</Text>
                    {player.position && (
                      <View style={styles.positionBadge}>
                        <Text style={styles.positionText}>{player.position}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Player Actions (for registered players) */}
        {isRegistered && !isOrganizer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Oyuncu İşlemleri</Text>

            <View style={styles.playerActions}>
              {match.venue?.pricePerPlayer != null && match.venue.pricePerPlayer > 0 && match.payments && (
                <TouchableOpacity
                  style={styles.playerActionButton}
                  onPress={() => NavigationService.navigateToPlayerPayment(match.id!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerActionLeft}>
                    <View style={[styles.playerActionIcon, { backgroundColor: '#10B981' + '20' }]}>
                      <DollarSign size={20} color="#10B981" strokeWidth={2} />
                    </View>
                    <View style={styles.playerActionContent}>
                      <Text style={styles.playerActionTitle}>Ödeme Durumu</Text>
                      {(() => {
                        const userPayment = match.payments.find(p => p.playerId === user?.id);
                        return (
                          <Text style={styles.playerActionSubtitle}>
                            {userPayment?.paid
                              ? '✅ Ödeme onaylandı'
                              : userPayment
                                ? '⏳ Ödeme bekleniyor'
                                : 'Ödeme bilgisi yok'}
                          </Text>
                        );
                      })()}
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>
              )}

              {match.score && (match.status === MatchStatus.AWAITING_SCORE || match.status === MatchStatus.COMPLETED) && (
                <TouchableOpacity
                  style={styles.playerActionButton}
                  onPress={handleGoalAssistEntry}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerActionLeft}>
                    <View style={[styles.playerActionIcon, { backgroundColor: sportColor + '20' }]}>
                      <Target size={20} color={sportColor} strokeWidth={2} />
                    </View>
                    <View style={styles.playerActionContent}>
                      <Text style={styles.playerActionTitle}>Gol/Asist Gir</Text>
                      <Text style={styles.playerActionSubtitle}>
                        Gollerinizi ve asistlerinizi kaydedin
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>
              )}

              {match.status === MatchStatus.COMPLETED && (
                <TouchableOpacity
                  style={styles.playerActionButton}
                  onPress={handlePlayerRating}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerActionLeft}>
                    <View style={[styles.playerActionIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                      <Star size={20} color="#F59E0B" strokeWidth={2} />
                    </View>
                    <View style={styles.playerActionContent}>
                      <Text style={styles.playerActionTitle}>Takım Arkadaşlarını Puanla</Text>
                      <Text style={styles.playerActionSubtitle}>
                        Maç performanslarını değerlendirin
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Registered Players (if no teams) */}
        {!showTeams && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Kayıtlı Oyuncular ({registeredCount})
            </Text>

            {registeredCount > 0 ? (
              <View style={styles.card}>
                {eligiblePlayers.all.map((playerId, index) => (
                  <View
                    key={index + 1}
                    style={[
                      styles.registeredPlayerRow,
                      index === registeredCount - 1 && styles.lastPlayerRow
                    ]}
                  >
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>{index + 1}</Text>
                    </View>
                    <View style={styles.registeredPlayerInfo}>
                      <Text style={styles.registeredPlayerName}>Oyuncu {index + 1}</Text>
                      <Text style={styles.registeredPlayerOrder}>
                        #{index + 1} kayıt sırası
                      </Text>
                    </View>
                    {playerId === user?.id && (
                      <View style={styles.youBadge}>
                        <Text style={styles.youBadgeText}>Siz</Text>
                      </View>
                    )}
                    {match.payments?.find(p => p.playerId === playerId)?.paid && (
                      <View style={styles.paidBadge}>
                        <CheckCircle size={16} color="white" strokeWidth={2.5} />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIconContainer}>
                  <Users size={48} color="#D1D5DB" strokeWidth={1.5} />
                </View>
                <Text style={styles.emptyStateText}>Henüz kimse kayıt olmadı</Text>
                <Text style={styles.emptyStateSubtext}>İlk kayıt olan sen ol!</Text>
              </View>
            )}
          </View>
        )}

        {/* Organizer Actions */}
        {isOrganizer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organizatör İşlemleri</Text>

            <View style={styles.organizerActions}>
              {isFriendly && match.friendlySettings && !match.friendlySettings.isPublic && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handleManageInvitations}
                  activeOpacity={0.7}
                >
                  <UserPlus size={20} color="#10B981" strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Davetiye Yönetimi</Text>
                  {pendingInvitationsCount > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>{pendingInvitationsCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}

              {!showTeams && match.status === MatchStatus.REGISTRATION_CLOSED && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handleBuildTeam}
                  activeOpacity={0.7}
                >
                  <Users size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Takım Kur</Text>
                </TouchableOpacity>
              )}

              {showTeams && match.status === MatchStatus.IN_PROGRESS && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handleScoreEntry}
                  activeOpacity={0.7}
                >
                  <Target size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Skor Gir</Text>
                </TouchableOpacity>
              )}

              {match.status === MatchStatus.AWAITING_SCORE && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handleGoalAssistEntry}
                  activeOpacity={0.7}
                >
                  <Trophy size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Gol/Asist Onayları</Text>
                </TouchableOpacity>
              )}

              {match.venue?.pricePerPlayer != null && match.venue.pricePerPlayer > 0 && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handlePaymentTracking}
                  activeOpacity={0.7}
                >
                  <DollarSign size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Ödeme Takibi</Text>
                </TouchableOpacity>
              )}

              {match.status === MatchStatus.COMPLETED && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handlePlayerRating}
                  activeOpacity={0.7}
                >
                  <Star size={20} color="#F59E0B" strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Puanlama Durumu</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      {(canRegister || isRegistered) && (
        <View style={styles.bottomAction}>
          {canRegister ? (
            <TouchableOpacity
              style={[styles.registerButton, { backgroundColor: sportColor }]}
              onPress={handleRegister}
              activeOpacity={0.7}
            >
              <UserCheck size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.registerButtonText}>
                {/* {isFriendly && match.friendlySettings && !match.friendlySettings.isPublic */}
                  {/* ? 'Daveti Kabul Et' */}
                  {/* :  */}
                  'Maça Kayıt Ol'
                  {/* } */}
              </Text>
            </TouchableOpacity>
          ) : isRegistered && !showTeams ? (
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: sportColor }]}
              onPress={handleCancelRegistration}
              activeOpacity={0.7}
            >
              <XCircle size={20} color={sportColor} strokeWidth={2.5} />
              <Text style={[styles.cancelButtonText, { color: sportColor }]}>
                Kaydı İptal Et
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
    </ErrorBoundary>
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
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  impactBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginTop: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  // ✅ NEW: Invitation Code Card Styles
  invitationCodeCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  invitationCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  invitationCodeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  codeDisplay: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#15803d',
    letterSpacing: 4,
  },
  codeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  codeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeStatText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  codeStatusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  codeStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  codeStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  codeActionButtonPrimary: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  codeActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  codeActionTextPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  
  countdownCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  countdownText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  registrationAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  registrationAlertText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803d',
    flex: 1,
    textAlign: 'center',
  },
  invitationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    padding: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  invitationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  invitationBannerText: {
    flex: 1,
  },
  invitationBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 2,
  },
  invitationBannerSubtitle: {
    fontSize: 12,
    color: '#15803d',
  },
  bottomSpacing: {
    height: 20,
  },
  bottomAction: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Additional Styles
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  paymentStatus: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreTeam: {
    alignItems: 'center',
  },
  teamName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 8,
  },
  teamScore: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
  },
  scoreDivider: {
    paddingHorizontal: 16,
  },
  scoreDividerText: {
    fontSize: 32,
    color: '#D1D5DB',
    fontWeight: '700',
  },
  mvpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  mvpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
  teamsContainer: {
    gap: 12,
  },
  teamCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#F3F4F6',
  },
  teamTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  teamScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  teamScoreBadgeText: {
    fontSize: 18,
    fontWeight: '700',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  playerNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  playerRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  positionBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  positionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
  playerActions: {
    gap: 12,
  },
  playerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  playerActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playerActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerActionContent: {
    flex: 1,
  },
  playerActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  playerActionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  registeredPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastPlayerRow: {
    borderBottomWidth: 0,
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
  registeredPlayerInfo: {
    flex: 1,
  },
  registeredPlayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  registeredPlayerOrder: {
    fontSize: 12,
    color: '#6B7280',
  },
  paidBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youBadge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
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
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  organizerActions: {
    gap: 12,
  },
  organizerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  organizerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  notificationBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
});