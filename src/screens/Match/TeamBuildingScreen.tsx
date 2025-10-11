import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  Users,
  Shuffle,
  Save,
  X,
  UserPlus,
  UserMinus,
  Trophy,
  Search,
  Check,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import {
  IMatch,
  IMatchFixture,
  IPlayer,
  getSportIcon,
  getSportColor,
  buildSquad,
} from '../../types/types';
import { matchService } from '../../services/matchService';
import { matchFixtureService } from '../../services/matchFixtureService';
import { playerService } from '../../services/playerService';

export const TeamBuildingScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const navigation = useNavigationContext();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [fixture, setFixture] = useState<IMatchFixture | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  
  const [team1, setTeam1] = useState<string[]>([]);
  const [team2, setTeam2] = useState<string[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<IPlayer[]>([]);
  const [reservePlayers, setReservePlayers] = useState<IPlayer[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [matchId]);

  const loadData = async () => {
    if (!matchId || !user?.id) {
      Alert.alert('Hata', 'Maç ID bulunamadı');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);

      const matchData = await matchService.getById(matchId);
      if (!matchData) {
        Alert.alert('Hata', 'Maç bulunamadı');
        navigation.goBack();
        return;
      }

      // Check permissions
      const canBuild = 
        matchData.organizerPlayerIds?.includes(user.id) ||
        matchData.teamBuildingAuthorityPlayerIds?.includes(user.id);

      if (!canBuild) {
        Alert.alert('Hata', 'Takım kurma yetkiniz yok');
        navigation.goBack();
        return;
      }

      setMatch(matchData);

      // Get fixture
      const fixtureData = await matchFixtureService.getById(matchData.fixtureId);
      if (!fixtureData) {
        Alert.alert('Hata', 'Fikstür bulunamadı');
        navigation.goBack();
        return;
      }
      setFixture(fixtureData);

      // Get all registered players
      const allPlayerIds = [
        ...(matchData.directPlayerIds || []),
        ...(matchData.registeredPlayerIds || []),
        ...(matchData.guestPlayerIds || []),
      ];

      const uniquePlayerIds = [...new Set(allPlayerIds)];
      const players = await playerService.getPlayersByIds(uniquePlayerIds);
      setAllPlayers(players);

      // If teams already exist, load them
      if (matchData.team1PlayerIds && matchData.team2PlayerIds) {
        setTeam1(matchData.team1PlayerIds);
        setTeam2(matchData.team2PlayerIds);
        
        // Available players = players not in teams
        const inTeams = [...matchData.team1PlayerIds, ...matchData.team2PlayerIds];
        const available = players.filter(p => !inTeams.includes(p.id!));
        setAvailablePlayers(available);
      } else {
        // Build initial squad using algorithm
        const { squad, reserves } = buildSquad(
          matchData,
          fixtureData.staffPlayerCount,
          fixtureData.reservePlayerCount
        );

        const squadPlayers = players.filter(p => squad.includes(p.id!));
        const reservePlayersData = players.filter(p => reserves.includes(p.id!));
        
        setAvailablePlayers(squadPlayers);
        setReservePlayers(reservePlayersData);
      }

    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBalance = () => {
    if (availablePlayers.length < 2) {
      Alert.alert('Uyarı', 'Yeterli oyuncu yok');
      return;
    }

    Alert.alert(
      'Otomatik Takım Kur',
      'Oyuncular otomatik olarak dengeli takımlara dağıtılacak. Mevcut takımlar silinecek!',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Devam',
          onPress: () => {
            // Shuffle players
            const shuffled = [...availablePlayers].sort(() => Math.random() - 0.5);
            const half = Math.ceil(shuffled.length / 2);
            
            const newTeam1 = shuffled.slice(0, half).map(p => p.id!);
            const newTeam2 = shuffled.slice(half).map(p => p.id!);
            
            setTeam1(newTeam1);
            setTeam2(newTeam2);
            setAvailablePlayers([]);
            
            Alert.alert('✅ Başarılı!', 'Takımlar otomatik olarak oluşturuldu');
          }
        }
      ]
    );
  };

  const handleAddPlayerToTeam = (playerId: string, team: 1 | 2) => {
    const player = availablePlayers.find(p => p.id === playerId);
    if (!player) return;

    const teamCount = team === 1 ? team1.length : team2.length;
    const maxPerTeam = Math.ceil((fixture?.staffPlayerCount || 10) / 2);

    if (teamCount >= maxPerTeam) {
      Alert.alert('Uyarı', `Takım ${team} kadrosu dolu (Max: ${maxPerTeam})`);
      return;
    }

    if (team === 1) {
      setTeam1([...team1, playerId]);
    } else {
      setTeam2([...team2, playerId]);
    }

    setAvailablePlayers(availablePlayers.filter(p => p.id !== playerId));
    setShowPlayerModal(false);
  };

  const handleRemovePlayerFromTeam = (playerId: string, team: 1 | 2) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;

    if (team === 1) {
      setTeam1(team1.filter(id => id !== playerId));
    } else {
      setTeam2(team2.filter(id => id !== playerId));
    }

    setAvailablePlayers([...availablePlayers, player]);
  };

  const handleSaveTeams = async () => {
    if (!match || !fixture) return;

    // Validation
    if (team1.length === 0 || team2.length === 0) {
      Alert.alert('Uyarı', 'Her iki takımda da en az 1 oyuncu olmalı');
      return;
    }

    const totalPlayers = team1.length + team2.length;
    if (totalPlayers > fixture.staffPlayerCount) {
      Alert.alert('Uyarı', `Toplam oyuncu sayısı ${fixture.staffPlayerCount}'i geçemez`);
      return;
    }

    Alert.alert(
      'Takımları Kaydet',
      `Takım 1: ${team1.length} oyuncu\nTakım 2: ${team2.length} oyuncu\n\nTakımlar kaydedilecek ve maç durumu güncellenecek. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: async () => {
            try {
              setSaving(true);

              const success = await matchService.assignTeams(
                match.id,
                team1,
                team2
              );

              if (success) {
                Alert.alert(
                  '✅ Başarılı!',
                  'Takımlar başarıyla kaydedildi',
                  [
                    {
                      text: 'Tamam',
                      onPress: () => navigation.goBack({
                        matchId: match.id,
                        updated: true,
                        _refresh: Date.now()
                      })
                    }
                  ]
                );
              } else {
                Alert.alert('Hata', 'Takımlar kaydedilemedi');
              }
            } catch (error) {
              console.error('Error saving teams:', error);
              Alert.alert('Hata', 'Takımlar kaydedilirken bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const openPlayerModal = (team: 1 | 2) => {
    setSelectedTeam(team);
    setSearchQuery('');
    setShowPlayerModal(true);
  };

  const getPlayerDisplay = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return 'Oyuncu';
    return `${player.name} ${player.surname}`;
  };

  const getFilteredAvailablePlayers = () => {
    if (!searchQuery.trim()) return availablePlayers;
    
    return availablePlayers.filter(p =>
      `${p.name} ${p.surname}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (loading || !match || !fixture) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const sportColor = getSportColor(fixture.sportType);
  const maxPerTeam = Math.ceil(fixture.staffPlayerCount / 2);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: sportColor }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <ChevronLeft size={24} color="white" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Takım Kur</Text>
          <Text style={styles.headerSubtitle}>
            {getSportIcon(fixture.sportType)} {match.title}
          </Text>
        </View>

        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={18} color="#2563EB" strokeWidth={2} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerText}>
              Toplam {allPlayers.length} oyuncu • Max {maxPerTeam} oyuncu/takım
            </Text>
          </View>
        </View>

        {/* Auto Balance Button */}
        {availablePlayers.length >= 2 && (
          <TouchableOpacity
            style={[styles.autoButton, { borderColor: sportColor }]}
            onPress={handleAutoBalance}
            activeOpacity={0.7}
          >
            <Shuffle size={20} color={sportColor} strokeWidth={2} />
            <Text style={[styles.autoButtonText, { color: sportColor }]}>
              Otomatik Dengele
            </Text>
          </TouchableOpacity>
        )}

        {/* Teams */}
        <View style={styles.teamsContainer}>
          {/* Team 1 */}
          <View style={styles.teamSection}>
            <View style={styles.teamHeader}>
              <View style={styles.teamTitleRow}>
                <Trophy size={20} color={sportColor} strokeWidth={2} />
                <Text style={[styles.teamTitle, { color: sportColor }]}>
                  Takım 1
                </Text>
              </View>
              <View style={styles.teamCountBadge}>
                <Text style={styles.teamCountText}>
                  {team1.length}/{maxPerTeam}
                </Text>
              </View>
            </View>

            <View style={styles.teamCard}>
              {team1.length === 0 ? (
                <View style={styles.emptyTeam}>
                  <Users size={32} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.emptyTeamText}>Henüz oyuncu eklenmedi</Text>
                </View>
              ) : (
                team1.map((playerId, index) => (
                  <View key={playerId} style={styles.playerRow}>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {getPlayerDisplay(playerId)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemovePlayerFromTeam(playerId, 1)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <UserMinus size={16} color="#DC2626" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {team1.length < maxPerTeam && availablePlayers.length > 0 && (
                <TouchableOpacity
                  style={styles.addPlayerButton}
                  onPress={() => openPlayerModal(1)}
                  activeOpacity={0.7}
                >
                  <UserPlus size={18} color={sportColor} strokeWidth={2} />
                  <Text style={[styles.addPlayerText, { color: sportColor }]}>
                    Oyuncu Ekle
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Team 2 */}
          <View style={styles.teamSection}>
            <View style={styles.teamHeader}>
              <View style={styles.teamTitleRow}>
                <Trophy size={20} color="#DC2626" strokeWidth={2} />
                <Text style={[styles.teamTitle, { color: '#DC2626' }]}>
                  Takım 2
                </Text>
              </View>
              <View style={styles.teamCountBadge}>
                <Text style={styles.teamCountText}>
                  {team2.length}/{maxPerTeam}
                </Text>
              </View>
            </View>

            <View style={styles.teamCard}>
              {team2.length === 0 ? (
                <View style={styles.emptyTeam}>
                  <Users size={32} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.emptyTeamText}>Henüz oyuncu eklenmedi</Text>
                </View>
              ) : (
                team2.map((playerId, index) => (
                  <View key={playerId} style={styles.playerRow}>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {getPlayerDisplay(playerId)}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleRemovePlayerFromTeam(playerId, 2)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <UserMinus size={16} color="#DC2626" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              {team2.length < maxPerTeam && availablePlayers.length > 0 && (
                <TouchableOpacity
                  style={styles.addPlayerButton}
                  onPress={() => openPlayerModal(2)}
                  activeOpacity={0.7}
                >
                  <UserPlus size={18} color="#DC2626" strokeWidth={2} />
                  <Text style={[styles.addPlayerText, { color: '#DC2626' }]}>
                    Oyuncu Ekle
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Available Players */}
        {availablePlayers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Bekleyen Oyuncular ({availablePlayers.length})
            </Text>
            <View style={styles.availableList}>
              {availablePlayers.map((player) => (
                <View key={player.id} style={styles.availablePlayerItem}>
                  <Text style={styles.availablePlayerName}>
                    {player.name} {player.surname}
                  </Text>
                  <AlertCircle size={16} color="#F59E0B" strokeWidth={2} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reserve Players */}
        {reservePlayers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Yedek Oyuncular ({reservePlayers.length})
            </Text>
            <View style={styles.reserveList}>
              {reservePlayers.map((player) => (
                <View key={player.id} style={styles.reservePlayerItem}>
                  <Text style={styles.reservePlayerName}>
                    {player.name} {player.surname}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: sportColor },
            (team1.length === 0 || team2.length === 0) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveTeams}
          disabled={saving || team1.length === 0 || team2.length === 0}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>Takımları Kaydet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Player Selection Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Takım {selectedTeam}'e Oyuncu Ekle
              </Text>
              <TouchableOpacity
                onPress={() => setShowPlayerModal(false)}
                style={styles.modalClose}
                activeOpacity={0.7}
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearch}>
              <Search size={18} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Oyuncu ara..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.modalList}>
              {getFilteredAvailablePlayers().map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.modalPlayerItem}
                  onPress={() => handleAddPlayerToTeam(player.id!, selectedTeam)}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalPlayerAvatar}>
                    <Text style={styles.modalPlayerInitial}>
                      {player.name?.[0]}{player.surname?.[0]}
                    </Text>
                  </View>
                  <Text style={styles.modalPlayerName}>
                    {player.name} {player.surname}
                  </Text>
                  <Check size={18} color={selectedTeam === 1 ? sportColor : '#DC2626'} strokeWidth={2} />
                </TouchableOpacity>
              ))}

              {getFilteredAvailablePlayers().length === 0 && (
                <View style={styles.modalEmpty}>
                  <AlertCircle size={48} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.modalEmptyText}>Oyuncu bulunamadı</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: 12,
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
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerText: {
    fontSize: 13,
    color: '#1E40AF',
    fontWeight: '600',
  },
  autoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  autoButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  teamsContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 16,
  },
  teamSection: {
    marginBottom: 4,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teamTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  teamCountBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  teamCountText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  teamCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyTeam: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTeamText: {
    marginTop: 8,
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  playerName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  removeButton: {
    padding: 6,
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E5E7EB',
  },
  addPlayerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  availableList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  availablePlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  availablePlayerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reserveList: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
  },
  reservePlayerItem: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  reservePlayerName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    padding: 4,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 0,
  },
  modalList: {
    maxHeight: 400,
  },
  modalPlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalPlayerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlayerInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  modalPlayerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  modalEmptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});