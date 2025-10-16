// screens/Match/ManageInvitationsScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  Search,
  X,
  UserPlus,
  Mail,
  Check,
  Clock,
  XCircle,
  Send,
  Users,
  Filter,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';
import {
  IMatch,
  IMatchInvitation,
  IPlayer,
  getSportColor,
} from '../../types/types';
import { matchService } from '../../services/matchService';
import { matchInvitationService } from '../../services/matchInvitationService';
import { playerService } from '../../services/playerService';
import { leagueService } from '../../services/leagueService';

type InvitationWithPlayer = {
  invitation: IMatchInvitation;
  player: IPlayer;
};

type FilterType = 'all' | 'pending' | 'accepted' | 'declined';

export const ManageInvitationsScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [invitations, setInvitations] = useState<InvitationWithPlayer[]>([]);
  const [leaguePlayers, setLeaguePlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showAddInvitation, setShowAddInvitation] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (matchId) {
      loadData();
    }
  }, [matchId]);

  useEffect(() => {
    const unsubscribe = eventManager.on(Events.INVITATION_UPDATED, loadData);
    return () => unsubscribe();
  }, []);

  const loadData = useCallback(async () => {
    if (!matchId) {
      Alert.alert('Hata', 'Maç ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      // Get match
      const matchData = await matchService.getById(matchId);
      if (!matchData) {
        Alert.alert('Maç Bulunamadı', 'Bu maç silinmiş olabilir.');
        NavigationService.goBack();
        return;
      }

      setMatch(matchData);

      // Check if user is organizer
      if (matchData.organizerId !== user?.id) {
        Alert.alert('Yetkisiz Erişim', 'Bu sayfaya erişim yetkiniz yok.');
        NavigationService.goBack();
        return;
      }

      // Get all invitations for this match
      const invitationsData = await matchInvitationService.getMatchInvitations(matchId);

      // Load invited players
      if (invitationsData.length > 0) {
        const playerIds = invitationsData.map(inv => inv.inviteeId);
        const players = await playerService.getPlayersByIds(playerIds);

        const invitationsWithPlayers: InvitationWithPlayer[] = invitationsData.map(inv => ({
          invitation: inv,
          player: players.find(p => p.id === inv.inviteeId)!,
        })).filter(item => item.player); // Filter out any missing players

        setInvitations(invitationsWithPlayers);
      } else {
        setInvitations([]);
      }

      // Load league players for sending new invitations
      if (matchData.linkedLeagueId) {
        const league = await leagueService.getById(matchData.linkedLeagueId);
        if (league && league.playerIds) {
          const players = await playerService.getPlayersByIds(league.playerIds);
          
          // Filter out already invited and registered players
          const alreadyInvitedIds = invitationsData.map(inv => inv.inviteeId);
          const registeredIds = matchData.registeredPlayerIds || [];
          
          const availablePlayers = players.filter(
            p => !alreadyInvitedIds.includes(p.id!) && 
                 !registeredIds.includes(p.id!) &&
                 p.id !== user?.id // Exclude organizer
          );
          
          setLeaguePlayers(availablePlayers);
        }
      }

    } catch (error) {
      console.error('Error loading invitations:', error);
      Alert.alert('Hata', 'Davetiyeler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [matchId, user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSendInvitations = async () => {
    if (selectedPlayers.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir oyuncu seçin');
      return;
    }

    try {
      setSending(true);

      // Bulk invitation gönder
      const result = await matchInvitationService.sendBulkInvitations({
        matchId,
        matchType: match!.type,
        inviterId: user!.id!,
        inviteeIds: selectedPlayers,
        message: inviteMessage || undefined,
        expiresInHours: 72, // 3 gün
      });

      if (result.failed.length > 0) {
        Alert.alert(
          'Kısmi Başarı',
          `${result.success.length} davet başarılı, ${result.failed.length} başarısız oldu`
        );
      } else {
        Alert.alert('Başarılı', `${result.success.length} oyuncuya davetiye gönderildi`);
      }
      
      setShowAddInvitation(false);
      setSelectedPlayers([]);
      setInviteMessage('');
      
      await loadData();
      eventManager.emit(Events.INVITATION_SENT);

    } catch (error) {
      console.error('Error sending invitations:', error);
      Alert.alert('Hata', 'Davetiyeler gönderilirken bir hata oluştu');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    Alert.alert(
      'Daveti İptal Et',
      'Bu davetiyeyi iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              await matchInvitationService.cancelInvitation(invitationId, user!.id!);
              Alert.alert('Başarılı', 'Davetiye iptal edildi');
              await loadData();
              eventManager.emit(Events.INVITATION_UPDATED);
            } catch (error: any) {
              console.error('Error canceling invitation:', error);
              Alert.alert('Hata', error.message || 'Davetiye iptal edilirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await matchInvitationService.resendInvitation(invitationId, 72); // 3 gün
      Alert.alert('Başarılı', 'Davetiye tekrar gönderildi');
      await loadData();
      eventManager.emit(Events.INVITATION_UPDATED);
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      Alert.alert('Hata', error.message || 'Davetiye gönderilirken bir hata oluştu');
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Filter invitations
  const filteredInvitations = invitations.filter(({ invitation, player }) => {
    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      const fullName = `${player.name} ${player.surname}`.toLowerCase();
      if (!fullName.includes(searchLower)) return false;
    }

    // Status filter
    if (filterType === 'pending' && invitation.status !== 'pending') return false;
    if (filterType === 'accepted' && invitation.status !== 'accepted') return false;
    if (filterType === 'declined' && invitation.status !== 'declined') return false;

    return true;
  });

  // Filter available players for invitation
  const filteredLeaguePlayers = leaguePlayers.filter(player => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${player.name} ${player.surname}`.toLowerCase();
    return fullName.includes(searchLower);
  });

  // Stats
  const stats = {
    total: invitations.length,
    pending: invitations.filter(inv => inv.invitation.status === 'pending').length,
    accepted: invitations.filter(inv => inv.invitation.status === 'accepted').length,
    declined: invitations.filter(inv => inv.invitation.status === 'declined').length,
  };

  const sportColor = match ? getSportColor(match.sportType || 'Futbol') : '#16a34a';

  if (loading || !match) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Davetiyeler yükleniyor...</Text>
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
          <Text style={styles.headerTitle}>Davetiye Yönetimi</Text>
          <Text style={styles.headerSubtitle}>{match.title}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowAddInvitation(!showAddInvitation)}
          activeOpacity={0.7}
        >
          {showAddInvitation ? (
            <X size={24} color="white" strokeWidth={2} />
          ) : (
            <UserPlus size={24} color="white" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {/* Add Invitation Panel */}
      {showAddInvitation ? (
        <View style={styles.addInvitationPanel}>
          <Text style={styles.panelTitle}>Yeni Davetiye Gönder</Text>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Search size={18} color="#9CA3AF" strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Oyuncu ara..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
                <X size={18} color="#9CA3AF" strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>

          {/* Message Input */}
          <TextInput
            style={styles.messageInput}
            placeholder="Davet mesajı (opsiyonel)..."
            placeholderTextColor="#9CA3AF"
            value={inviteMessage}
            onChangeText={setInviteMessage}
            multiline
            numberOfLines={2}
          />

          {/* Available Players */}
          <ScrollView style={styles.playersList} showsVerticalScrollIndicator={false}>
            {filteredLeaguePlayers.length > 0 ? (
              filteredLeaguePlayers.map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerItem,
                    selectedPlayers.includes(player.id!) && styles.playerItemSelected,
                  ]}
                  onPress={() => togglePlayerSelection(player.id!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerAvatarText}>
                      {player.name?.[0]}{player.surname?.[0]}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>
                      {player.name} {player.surname}
                    </Text>
                    {player.favoriteSports && player.favoriteSports.length > 0 && (
                      <Text style={styles.playerSports}>
                        {player.favoriteSports.join(', ')}
                      </Text>
                    )}
                  </View>
                  {selectedPlayers.includes(player.id!) && (
                    <View style={styles.selectedBadge}>
                      <Check size={16} color="white" strokeWidth={2.5} />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Users size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyStateText}>
                  {searchQuery ? 'Oyuncu bulunamadı' : 'Davet edilebilecek oyuncu yok'}
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Send Button */}
          {selectedPlayers.length > 0 && (
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: sportColor }]}
              onPress={handleSendInvitations}
              disabled={sending}
              activeOpacity={0.7}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Send size={20} color="white" strokeWidth={2} />
                  <Text style={styles.sendButtonText}>
                    {selectedPlayers.length} Oyuncuya Davet Gönder
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Mail size={18} color={sportColor} strokeWidth={2} />
              <Text style={[styles.statValue, { color: sportColor }]}>{stats.total}</Text>
              <Text style={styles.statLabel}>Toplam</Text>
            </View>

            <View style={styles.statCard}>
              <Clock size={18} color="#F59E0B" strokeWidth={2} />
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Bekleyen</Text>
            </View>

            <View style={styles.statCard}>
              <Check size={18} color="#10B981" strokeWidth={2} />
              <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.accepted}</Text>
              <Text style={styles.statLabel}>Kabul</Text>
            </View>

            <View style={styles.statCard}>
              <XCircle size={18} color="#EF4444" strokeWidth={2} />
              <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.declined}</Text>
              <Text style={styles.statLabel}>Red</Text>
            </View>
          </View>

          {/* Filters */}
          <View style={styles.filtersSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersContent}
            >
              <TouchableOpacity
                style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
                onPress={() => setFilterType('all')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
                  Tümü ({stats.total})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, filterType === 'pending' && styles.filterChipActive]}
                onPress={() => setFilterType('pending')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, filterType === 'pending' && styles.filterChipTextActive]}>
                  Bekleyen ({stats.pending})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, filterType === 'accepted' && styles.filterChipActive]}
                onPress={() => setFilterType('accepted')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, filterType === 'accepted' && styles.filterChipTextActive]}>
                  Kabul ({stats.accepted})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, filterType === 'declined' && styles.filterChipActive]}
                onPress={() => setFilterType('declined')}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, filterType === 'declined' && styles.filterChipTextActive]}>
                  Red ({stats.declined})
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Invitations List */}
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
            {filteredInvitations.length > 0 ? (
              filteredInvitations.map(({ invitation, player }) => (
                <View key={invitation.id} style={styles.invitationCard}>
                  <View style={styles.invitationHeader}>
                    <View style={styles.invitationPlayerInfo}>
                      <View style={styles.playerAvatar}>
                        <Text style={styles.playerAvatarText}>
                          {player.name?.[0]}{player.surname?.[0]}
                        </Text>
                      </View>
                      <View style={styles.playerDetails}>
                        <Text style={styles.invitationPlayerName}>
                          {player.name} {player.surname}
                        </Text>
                        <Text style={styles.invitationDate}>
                          {new Date(invitation.sentAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        invitation.status === 'pending' && styles.statusPending,
                        invitation.status === 'accepted' && styles.statusAccepted,
                        invitation.status === 'declined' && styles.statusDeclined,
                      ]}
                    >
                      {invitation.status === 'pending' && <Clock size={12} color="#F59E0B" strokeWidth={2} />}
                      {invitation.status === 'accepted' && <Check size={12} color="#10B981" strokeWidth={2} />}
                      {invitation.status === 'declined' && <XCircle size={12} color="#EF4444" strokeWidth={2} />}
                      <Text
                        style={[
                          styles.statusText,
                          invitation.status === 'pending' && styles.statusTextPending,
                          invitation.status === 'accepted' && styles.statusTextAccepted,
                          invitation.status === 'declined' && styles.statusTextDeclined,
                        ]}
                      >
                        {invitation.status === 'pending' && 'Bekliyor'}
                        {invitation.status === 'accepted' && 'Kabul'}
                        {invitation.status === 'declined' && 'Red'}
                      </Text>
                    </View>
                  </View>

                  {invitation.message && (
                    <View style={styles.messageContainer}>
                      <Text style={styles.messageText}>"{invitation.message}"</Text>
                    </View>
                  )}

                  {invitation.status === 'pending' && (
                    <View style={styles.invitationActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleResendInvitation(invitation.id)}
                        activeOpacity={0.7}
                      >
                        <Send size={16} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.actionButtonText}>Tekrar Gönder</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.actionButtonDanger]}
                        onPress={() => handleCancelInvitation(invitation.id)}
                        activeOpacity={0.7}
                      >
                        <X size={16} color="#EF4444" strokeWidth={2} />
                        <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                          İptal Et
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {invitation.respondedAt && (
                    <Text style={styles.respondedText}>
                      Yanıt: {new Date(invitation.respondedAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Mail size={64} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyStateTitle}>Davetiye bulunamadı</Text>
                <Text style={styles.emptyStateText}>
                  {filterType === 'all'
                    ? 'Henüz davetiye gönderilmemiş'
                    : `${filterType === 'pending' ? 'Bekleyen' : filterType === 'accepted' ? 'Kabul edilen' : 'Reddedilen'} davetiye yok`}
                </Text>
              </View>
            )}

            <View style={styles.bottomSpacing} />
          </ScrollView>
        </>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  addInvitationPanel: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  messageInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 60,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  playersList: {
    flex: 1,
    marginBottom: 16,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  playerItemSelected: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16a34a',
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
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  playerSports: {
    fontSize: 12,
    color: '#6B7280',
  },
  selectedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  sendButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  filtersSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16a34a',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#16a34a',
  },
  content: {
    flex: 1,
  },
  invitationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  invitationPlayerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playerDetails: {
    flex: 1,
  },
  invitationPlayerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  invitationDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusAccepted: {
    backgroundColor: '#D1FAE5',
  },
  statusDeclined: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#F59E0B',
  },
  statusTextAccepted: {
    color: '#10B981',
  },
  statusTextDeclined: {
    color: '#EF4444',
  },
  messageContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonDanger: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionButtonTextDanger: {
    color: '#EF4444',
  },
  respondedText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});