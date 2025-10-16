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
  Share,
} from 'react-native';
import {
  ChevronLeft,
  Edit,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
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
} from 'lucide-react-native';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  IMatch,
  IMatchFixture,
  IPlayer,
  ILeague,
  MatchType,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { canRegisterToMatch } from '../../helper/matchRegisterHelper';
import { matchService } from '../../services/matchService';
import { matchFixtureService } from '../../services/matchFixtureService';
import { leagueService } from '../../services/leagueService';
import { playerService } from '../../services/playerService';
import { matchInvitationService } from '../../services/matchInvitationService';
import { NavigationService } from '../../navigation/NavigationService';

export const MatchDetailScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [fixture, setFixture] = useState<IMatchFixture | null>(null);
  const [league, setLeague] = useState<ILeague | null>(null);
  const [registeredPlayers, setRegisteredPlayers] = useState<IPlayer[]>([]);
  const [team1Players, setTeam1Players] = useState<IPlayer[]>([]);
  const [team2Players, setTeam2Players] = useState<IPlayer[]>([]);
  const [mvpPlayer, setMvpPlayer] = useState<IPlayer | null>(null);
  const [organizer, setOrganizer] = useState<IPlayer | null>(null);
  const [invitedPlayers, setInvitedPlayers] = useState<IPlayer[]>([]);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState('');

  const [isRegistered, setIsRegistered] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [canBuildTeam, setCanBuildTeam] = useState(false);
  const [isInvited, setIsInvited] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (matchId) {
        loadData();
      }
    }, [matchId, route.params?.updated])
  );

  // Countdown timer
  useEffect(() => {
    if (!match) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const matchTime = new Date(match.matchStartTime).getTime();
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
      } else {
        setCountdown('Maç başladı!');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [match]);

  const loadData = useCallback(async () => {
    if (!matchId) {
      Alert.alert('Hata', 'Maç ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      const matchData = await matchService.getById(matchId);
      if (!matchData) {
        Alert.alert('Maç Bulunamadı', 'Bu maç silinmiş olabilir.');
        NavigationService.goBack();
        return;
      }

      setMatch(matchData);

      const isFriendly = matchData.type === MatchType.FRIENDLY;

      // Get fixture & league for League matches
      if (!isFriendly && matchData.fixtureId) {
        const fixtureData = await matchFixtureService.getById(matchData.fixtureId);
        setFixture(fixtureData);

        if (fixtureData && matchData.leagueId) {
          const leagueData = await leagueService.getById(matchData.leagueId);
          setLeague(leagueData);
        }
      } else if (isFriendly && matchData.linkedLeagueId) {
        // Friendly match bağlı liga
        const leagueData = await leagueService.getById(matchData.linkedLeagueId);
        setLeague(leagueData);
      }

      // Check user permissions
      if (user?.id) {
        const registered =
          matchData.registeredPlayerIds?.includes(user.id) ||
          matchData.team1PlayerIds?.includes(user.id) ||
          matchData.team2PlayerIds?.includes(user.id) || false;

        setIsRegistered(registered);
        
        // Friendly match için organizatör kontrolü
        const organizerCheck = isFriendly 
          ? matchData.organizerId === user.id
          : matchData.organizerPlayerIds?.includes(user.id) || false;
        
        setIsOrganizer(organizerCheck);
        setCanBuildTeam(matchData.teamBuildingAuthorityPlayerIds?.includes(user.id) || organizerCheck);

        // Davet kontrolü (friendly için)
        if (isFriendly && !matchData.isPublic) {
          setIsInvited(matchData.invitedPlayerIds?.includes(user.id) || false);
        }
      }

      // Load players in parallel
      const playerPromises = [];

      if (matchData.registeredPlayerIds && matchData.registeredPlayerIds.length > 0) {
        playerPromises.push(
          playerService.getPlayersByIds(matchData.registeredPlayerIds)
            .then(players => setRegisteredPlayers(players))
        );
      }

      if (matchData.team1PlayerIds && matchData.team1PlayerIds.length > 0) {
        playerPromises.push(
          playerService.getPlayersByIds(matchData.team1PlayerIds)
            .then(players => setTeam1Players(players))
        );
      }

      if (matchData.team2PlayerIds && matchData.team2PlayerIds.length > 0) {
        playerPromises.push(
          playerService.getPlayersByIds(matchData.team2PlayerIds)
            .then(players => setTeam2Players(players))
        );
      }

      // Load MVP player if exists
      if (matchData.playerIdOfMatchMVP) {
        playerPromises.push(
          playerService.getById(matchData.playerIdOfMatchMVP)
            .then(player => setMvpPlayer(player))
        );
      }

      // Load organizer (friendly için)
      if (isFriendly && matchData.organizerId) {
        playerPromises.push(
          playerService.getById(matchData.organizerId)
            .then(player => setOrganizer(player))
        );
      }

      // Load invited players (friendly için)
      if (isFriendly && !matchData.isPublic && matchData.invitedPlayerIds && matchData.invitedPlayerIds.length > 0) {
        playerPromises.push(
          playerService.getPlayersByIds(matchData.invitedPlayerIds)
            .then(players => setInvitedPlayers(players))
        );

        // Pending invitations count
        if (isOrganizer) {
          playerPromises.push(
            matchInvitationService.getActiveMatchInvitations(matchId)
              .then((count:any) => setPendingInvitationsCount(count))
          );
        }
      }

      await Promise.all(playerPromises);

    } catch (error: any) {
      console.error('Error loading match:', error);

      if (error.code === 'permission-denied') {
        Alert.alert('Yetkisiz Erişim', 'Bu maçı görme yetkiniz yok.');
      } else if (error.code === 'not-found') {
        Alert.alert('Maç Bulunamadı', 'Bu maç silinmiş olabilir.');
      } else {
        Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }

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

  const handleShare = useCallback(async () => {
    if (!match) return;

    try {
      const isFriendly = match.type === MatchType.FRIENDLY;
      const matchTypeLabel = isFriendly ? '🤝 Dostluk Maçı' : '🏆 Lig Maçı';
      
      const message = `${matchTypeLabel}: ${match.title}\n\n📅 ${formatDateTime(match.matchStartTime)}${match.location ? `\n📍 ${match.location}` : ''}\n\n⚽ Maça katılmak için uygulamayı kullanın!`;

      await Share.share({
        message,
        title: match.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  }, [match]);

  const handleRegister = () => {
    if (!match) return;
    NavigationService.navigateToMatchRegistration(match.id);
  };

  const handleBuildTeam = () => {
    if (!match) return;
    NavigationService.navigateToTeamBuilding(match.id);
  };

  const handleScoreEntry = () => {
    if (!match) return;
    NavigationService.navigateToScoreEntry(match.id);
  };

  const handleGoalAssistEntry = () => {
    if (!match) return;
    NavigationService.navigateToGoalAssistEntry(match.id);
  };

  const handlePlayerRating = () => {
    if (!match) return;
    NavigationService.navigateToPlayerRating(match.id);
  };

  const handlePaymentTracking = () => {
    if (!match) return;
    NavigationService.navigateToPaymentTracking(match.id);
  };

  const handleManageInvitations = () => {
    if (!match) return;
    NavigationService.navigateToManageInvitations(match.id);
  };

  const formatDateTime = useCallback((date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const getMatchStatusColor = useCallback((status: IMatch['status']): string => {
    switch (status) {
      case 'Oluşturuldu': return '#9CA3AF';
      case 'Kayıt Açık': return '#10B981';
      case 'Kayıt Kapandı': return '#F59E0B';
      case 'Takımlar Oluşturuldu': return '#2563EB';
      case 'Oynanıyor': return '#8B5CF6';
      case 'Skor Bekleniyor': return '#F59E0B';
      case 'Tamamlandı': return '#16a34a';
      case 'İptal Edildi': return '#DC2626';
      default: return '#6B7280';
    }
  }, []);

  // Memoized values
  const isFriendly = useMemo(() => 
    match?.type === MatchType.FRIENDLY,
    [match]
  );

  const sportType = useMemo(() => {
    if (isFriendly && match?.sportType) return match.sportType;
    if (fixture) return fixture.sportType;
    if (league) return league.sportType;
    return undefined;
  }, [isFriendly, match, fixture, league]);

  const sportColor = useMemo(() =>
    sportType ? getSportColor(sportType) : '#16a34a',
    [sportType]
  );

  const statusColor = useMemo(() =>
    match ? getMatchStatusColor(match.status) : '#6B7280',
    [match, getMatchStatusColor]
  );

  const canRegister = useMemo(() => {
    if (!match || !user?.id) return false;
    
    // Friendly match için özel kontrol
    if (isFriendly) {
      // Public değilse ve davet listesinde değilse kayıt olamaz
      if (!match.isPublic && !isInvited) return false;
    }
    
    return canRegisterToMatch(match, user.id, fixture);
  }, [match, user?.id, fixture, isFriendly, isInvited]);

  const showTeams = useMemo(() =>
    (match?.team1PlayerIds?.length || 0) > 0 && (match?.team2PlayerIds?.length || 0) > 0,
    [match?.team1PlayerIds, match?.team2PlayerIds]
  );

  const paidPlayersCount = useMemo(() =>
    match?.paymentStatus?.filter(p => p.paid).length || 0,
    [match?.paymentStatus]
  );

  if (loading || !match) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Maç yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: sportColor }]}>
        <TouchableOpacity
          onPress={() => NavigationService.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="white" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            {isFriendly ? (
              <Users size={16} color="white" strokeWidth={2.5} />
            ) : (
              <Trophy size={16} color="white" strokeWidth={2.5} />
            )}
            <Text style={styles.headerTitle}>{match.title}</Text>
          </View>
          {isFriendly ? (
            <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerSubtitle}>Dostluk Maçı</Text>
              {match.isPublic ? (
                <>
                  <Globe size={12} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                  <Text style={styles.headerSubtitle}>Açık</Text>
                </>
              ) : (
                <>
                  <Lock size={12} color="rgba(255,255,255,0.9)" strokeWidth={2} />
                  <Text style={styles.headerSubtitle}>Özel</Text>
                </>
              )}
            </View>
          ) : (
            <Text style={styles.headerSubtitle}>
              {sportType && getSportIcon(sportType)} {fixture?.title || league?.title || 'Lig Maçı'}
            </Text>
          )}
        </View>

        {isOrganizer ? (
          <TouchableOpacity
            onPress={() => NavigationService.navigateToEditMatch(match.id)}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Edit size={22} color="white" strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Share2 size={22} color="white" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
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
        {/* Match Type Badge */}
        <View style={styles.matchTypeBadgeContainer}>
          {isFriendly ? (
            <View style={[styles.matchTypeBadge, { backgroundColor: '#10B981' + '20' }]}>
              <Users size={14} color="#10B981" strokeWidth={2} />
              <Text style={[styles.matchTypeBadgeText, { color: '#10B981' }]}>
                Dostluk Maçı
              </Text>
            </View>
          ) : (
            <View style={[styles.matchTypeBadge, { backgroundColor: '#3B82F6' + '20' }]}>
              <Trophy size={14} color="#3B82F6" strokeWidth={2} />
              <Text style={[styles.matchTypeBadgeText, { color: '#3B82F6' }]}>
                Lig Maçı
              </Text>
            </View>
          )}

          {/* Stats Impact Badge (Friendly için) */}
          {isFriendly && !match.affectsStandings && (
            <View style={[styles.impactBadge, { backgroundColor: '#F59E0B' + '15' }]}>
              <TrendingUp size={12} color="#F59E0B" strokeWidth={2} />
              <Text style={[styles.impactBadgeText, { color: '#F59E0B' }]}>
                Puan durumunu etkilemez
              </Text>
            </View>
          )}
        </View>

        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusColor + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {match.status}
          </Text>
        </View>

        {/* Countdown */}
        {countdown && match.status !== 'Tamamlandı' && match.status !== 'İptal Edildi' && (
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
              {isFriendly && !match.isPublic ? 'Davet edildiniz - Katılın!' : 'Kayıt açık - Hemen katıl!'}
            </Text>
            <UserCheck size={20} color="#10B981" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Organizer Info (Friendly için) */}
        {isFriendly && organizer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organizatör</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerAvatarText}>
                  {organizer.name?.[0]}{organizer.surname?.[0]}
                </Text>
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>
                  {organizer.name} {organizer.surname}
                </Text>
                <Text style={styles.organizerLabel}>Maç Organizatörü</Text>
              </View>
            </View>
          </View>
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
          <View style={styles.infoCard}>
            <Calendar size={20} color={sportColor} strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Maç Zamanı</Text>
              <Text style={styles.infoValue}>{formatDateTime(match.matchStartTime)}</Text>
            </View>
          </View>

          {match.location && (
            <View style={styles.infoCard}>
              <MapPin size={20} color="#3B82F6" strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Lokasyon</Text>
                <Text style={styles.infoValue}>{match.location}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoCard}>
            <Users size={20} color="#F59E0B" strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {isFriendly && !match.isPublic ? 'Davetli & Kayıtlı' : 'Kayıtlı Oyuncu'}
              </Text>
              <Text style={styles.infoValue}>
                {registeredPlayers.length} oyuncu
                {isFriendly && !match.isPublic && invitedPlayers.length > 0 && (
                  <Text style={styles.infoValueSecondary}>
                    {' '}/ {invitedPlayers.length} davetli
                  </Text>
                )}
              </Text>
            </View>
          </View>

          {match.pricePerPlayer && (
            <View style={styles.infoCard}>
              <DollarSign size={20} color="#10B981" strokeWidth={2} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ücret & Ödeme</Text>
                <Text style={styles.infoValue}>{match.pricePerPlayer} TL / Kişi</Text>
                {registeredPlayers.length > 0 && match.paymentStatus && (
                  <Text style={styles.paymentStatus}>
                    {match.paymentStatus.filter(p => p.paid).length} / {registeredPlayers.length} ödeme yapıldı
                  </Text>
                )}
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
                <Text style={styles.teamScore}>{match.team1Score || 0}</Text>
              </View>
              <View style={styles.scoreDivider}>
                <Text style={styles.scoreDividerText}>-</Text>
              </View>
              <View style={styles.scoreTeam}>
                <Text style={styles.teamName}>Takım 2</Text>
                <Text style={styles.teamScore}>{match.team2Score || 0}</Text>
              </View>
            </View>

            {/* Gol/Asist Girişi */}
            {match.status === 'Skor Onay Bekliyor' && isRegistered && (
              <TouchableOpacity
                style={[styles.playerActionCard, { borderColor: sportColor }]}
                onPress={handleGoalAssistEntry}
                activeOpacity={0.7}
              >
                <View style={[styles.playerActionIcon, { backgroundColor: sportColor + '20' }]}>
                  <Target size={28} color={sportColor} strokeWidth={2} />
                </View>
                <View style={styles.playerActionContent}>
                  <Text style={styles.playerActionTitle}>Gol & Asist Girişi</Text>
                  <Text style={styles.playerActionText}>
                    Attığınız gol ve yaptığınız asistleri girin
                  </Text>
                </View>
                <ChevronRight size={24} color={sportColor} strokeWidth={2} />
              </TouchableOpacity>
            )}

            {/* Oyuncu Puanlama */}
            {match.status === 'Ödeme Bekliyor' && isRegistered && (
              <TouchableOpacity
                style={[styles.playerActionCard, { borderColor: '#F59E0B' }]}
                onPress={handlePlayerRating}
                activeOpacity={0.7}
              >
                <View style={[styles.playerActionIcon, { backgroundColor: '#FEF3C720' }]}>
                  <Star size={28} color="#F59E0B" strokeWidth={2} />
                </View>
                <View style={styles.playerActionContent}>
                  <Text style={styles.playerActionTitle}>Oyuncu Puanlama</Text>
                  <Text style={styles.playerActionText}>
                    Takım arkadaşlarınızı puanlayın
                  </Text>
                </View>
                <ChevronRight size={24} color="#F59E0B" strokeWidth={2} />
              </TouchableOpacity>
            )}

            {/* MVP */}
            {mvpPlayer && (
              <View style={styles.mvpCard}>
                <Award size={20} color="#F59E0B" strokeWidth={2} />
                <Text style={styles.mvpText}>
                  MVP: {mvpPlayer.name} {mvpPlayer.surname}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Teams (if built) */}
        {showTeams && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Takımlar</Text>

            <View style={styles.teamsContainer}>
              {/* Team 1 */}
              <View style={styles.teamCard}>
                <View style={styles.teamHeader}>
                  <Trophy size={18} color={sportColor} strokeWidth={2} />
                  <Text style={[styles.teamTitle, { color: sportColor }]}>
                    Takım 1
                  </Text>
                  {match.team1Score !== undefined && (
                    <View style={[styles.teamScoreBadge, { backgroundColor: sportColor + '20' }]}>
                      <Text style={[styles.teamScoreBadgeText, { color: sportColor }]}>
                        {match.team1Score}
                      </Text>
                    </View>
                  )}
                </View>

                {team1Players.length > 0 ? (
                  team1Players.map((player, index) => (
                    <View key={player.id} style={styles.playerRow}>
                      <View style={styles.playerNumber}>
                        <Text style={styles.playerNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.playerRowName}>
                        {player.name} {player.surname}
                      </Text>
                      {match.playerPositions?.[player.id!] && (
                        <View style={styles.positionBadge}>
                          <Text style={styles.positionText}>
                            {match.playerPositions[player.id!]}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyTeam}>
                    <Users size={32} color="#D1D5DB" strokeWidth={1.5} />
                    <Text style={styles.emptyTeamText}>Takım henüz oluşturulmadı</Text>
                  </View>
                )}
              </View>

              {/* Team 2 */}
              <View style={styles.teamCard}>
                <View style={styles.teamHeader}>
                  <Trophy size={18} color="#DC2626" strokeWidth={2} />
                  <Text style={[styles.teamTitle, { color: '#DC2626' }]}>
                    Takım 2
                  </Text>
                  {match.team2Score !== undefined && (
                    <View style={[styles.teamScoreBadge, { backgroundColor: '#DC262620' }]}>
                      <Text style={[styles.teamScoreBadgeText, { color: '#DC2626' }]}>
                        {match.team2Score}
                      </Text>
                    </View>
                  )}
                </View>

                {team2Players.length > 0 ? (
                  team2Players.map((player, index) => (
                    <View key={player.id} style={styles.playerRow}>
                      <View style={styles.playerNumber}>
                        <Text style={styles.playerNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.playerRowName}>
                        {player.name} {player.surname}
                      </Text>
                      {match.playerPositions?.[player.id!] && (
                        <View style={styles.positionBadge}>
                          <Text style={styles.positionText}>
                            {match.playerPositions[player.id!]}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyTeam}>
                    <Users size={32} color="#D1D5DB" strokeWidth={1.5} />
                    <Text style={styles.emptyTeamText}>Takım henüz oluşturulmadı</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Registered Players (if no teams) */}
        {!showTeams && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Kayıtlı Oyuncular ({registeredPlayers.length})
            </Text>

            {registeredPlayers.length > 0 ? (
              <View style={styles.card}>
                {registeredPlayers.map((player, index) => (
                  <View
                    key={player.id}
                    style={[
                      styles.registeredPlayerRow,
                      index === registeredPlayers.length - 1 && styles.lastPlayerRow
                    ]}
                  >
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerAvatarText}>
                        {player.name?.[0]}{player.surname?.[0]}
                      </Text>
                    </View>
                    <View style={styles.registeredPlayerInfo}>
                      <Text style={styles.registeredPlayerName}>
                        {player.name} {player.surname}
                      </Text>
                      <Text style={styles.registeredPlayerOrder}>
                        #{index + 1} kayıt sırası
                      </Text>
                    </View>
                    {match.paymentStatus?.find((p: any) => p.playerId === player.id)?.paid && (
                      <View style={styles.paidBadge}>
                        <Text style={styles.paidBadgeText}>✓</Text>
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
              {/* Davetiye Yönetimi (Friendly için) */}
              {isFriendly && !match.isPublic && (
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

              {!showTeams && match.status === 'Kayıt Kapandı' && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handleBuildTeam}
                  activeOpacity={0.7}
                >
                  <Users size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Takım Kur</Text>
                </TouchableOpacity>
              )}

              {showTeams && match.status === 'Oynanıyor' && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handleScoreEntry}
                  activeOpacity={0.7}
                >
                  <Target size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Skor Gir</Text>
                </TouchableOpacity>
              )}

              {(match.status === 'Skor Onay Bekliyor' || match.status === 'Ödeme Bekliyor') && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handleGoalAssistEntry}
                  activeOpacity={0.7}
                >
                  <Trophy size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Gol/Asist Onayları</Text>
                </TouchableOpacity>
              )}

              {match.status === 'Ödeme Bekliyor' && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handlePlayerRating}
                  activeOpacity={0.7}
                >
                  <Award size={20} color="#F59E0B" strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Puanlama Durumu</Text>
                </TouchableOpacity>
              )}

              {match.pricePerPlayer && (
                <TouchableOpacity
                  style={styles.organizerButton}
                  onPress={handlePaymentTracking}
                  activeOpacity={0.7}
                >
                  <DollarSign size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.organizerButtonText}>Ödeme Takibi</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      {canRegister && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.registerButton, { backgroundColor: sportColor }]}
            onPress={handleRegister}
            activeOpacity={0.7}
          >
            <UserCheck size={20} color="white" strokeWidth={2.5} />
            <Text style={styles.registerButtonText}>
              {isFriendly && !match.isPublic ? 'Daveti Kabul Et' : 'Maça Kayıt Ol'}
            </Text>
          </TouchableOpacity>
        </View>
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
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  content: {
    flex: 1,
  },
  matchTypeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexWrap: 'wrap',
  },
  matchTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  matchTypeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
    paddingHorizontal: 16,
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
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  organizerAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#16a34a',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  organizerLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  infoValueSecondary: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
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
  playerActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginTop: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playerActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playerActionContent: {
    flex: 1,
  },
  playerActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  playerActionText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
  emptyTeam: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyTeamText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
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
  paidBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
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
});