// src/screens/Match/TeamBuildingScreen.tsx
// 🏗️ TEAM BUILDING - Updated for new structure

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
  TrendingUp,
  MapPin,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import {
  IMatch,
  MatchStatus,
  SportType,
} from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { PlayerService } from '../../services/serviceLayer/playerService';
import { goBack } from '../../navigation';
import { eventManager, Events } from '../../utils';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { sportThemes } from '../../utils/theme';
import { LoadingScreen } from '../Common';

type BuildAlgorithm = 'random' | 'rating' | 'position';

export const TeamBuildingScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAuth();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);

  const [team1, setTeam1] = useState<Array<{ playerId: string; position?: string }>>([]);
  const [team2, setTeam2] = useState<Array<{ playerId: string; position?: string }>>([]);
  const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAlgorithmModal, setShowAlgorithmModal] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<BuildAlgorithm>('random');

  useEffect(() => {
    loadData();
  }, [matchId]);

  const loadData = async () => {
    if (!matchId || !user?.id) {
      Alert.alert('Hata', 'Maç ID bulunamadı');
      goBack();
      return;
    }

    try {
      setLoading(true);

      const result = await MatchService.getMatch(matchId);

      if (!result.success || !result.data) {
        Alert.alert('Hata', 'Maç bulunamadı');
        goBack();
        return;
      }

      const matchData = result.data;

      // Check permissions - only organizers and teamBuilders can build teams
      const canBuild =
        matchData.permissions.organizers.includes(user.id) ||
        matchData.permissions.teamBuilders?.includes(user.id);

      if (!canBuild) {
        Alert.alert('Hata', 'Takım kurma yetkiniz yok');
        goBack();
        return;
      }

      // Check status - can only build teams when REGISTRATION_CLOSED
      if (matchData.status !== MatchStatus.REGISTRATION_CLOSED) {
        Alert.alert(
          'Uyarı',
          `Takım kurma sadece kayıtlar kapandıktan sonra yapılabilir.\nMevcut durum: ${matchData.status}`
        );
        goBack();
        return;
      }

      setMatch(matchData);

      // Get eligible players using service method
      const eligiblePlayers = MatchService.getEligiblePlayers(matchData);

      // Load player details
      const playerDetailsPromises = eligiblePlayers.all.map(async (playerId) => {
        const playerResult = await PlayerService.getPlayer(playerId);
        return playerResult.success && playerResult.data ? playerResult.data : null;
      });

      const playerDetails = (await Promise.all(playerDetailsPromises)).filter(p => p !== null);
      setAllPlayers(playerDetails);

      // If teams already exist, load them
      if (matchData.players.teams) {
        setTeam1(matchData.players.teams.team1);
        setTeam2(matchData.players.teams.team2);

        // Available players = players in squad but not in teams
        const inTeams = [
          ...matchData.players.teams.team1.map(p => p.playerId),
          ...matchData.players.teams.team2.map(p => p.playerId),
        ];
        const available = eligiblePlayers.squad.filter(id => !inTeams.includes(id));
        setAvailablePlayers(available);
      } else {
        // No teams yet - all squad players are available
        setAvailablePlayers(eligiblePlayers.squad);
      }

    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu');
      goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBalance = () => {
    setShowAlgorithmModal(true);
  };

  const handleBuildWithAlgorithm = async (algorithm: BuildAlgorithm) => {
    if (!match) return;

    setShowAlgorithmModal(false);

    const algorithmNames = {
      random: 'Rastgele',
      rating: 'Rating Dengeli',
      position: 'Pozisyon Dengeli',
    };

    Alert.alert(
      `${algorithmNames[algorithm]} Takım Kur`,
      'Oyuncular otomatik olarak takımlara dağıtılacak. Mevcut takımlar silinecek!',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Devam',
          onPress: async () => {
            try {
              setSaving(true);

              const result = await MatchService.buildTeams(matchId, algorithm);

              if (result.success && result.data) {
                // Reload match to get updated teams
                await loadData();

                Alert.alert('✅ Başarılı!', 'Takımlar otomatik olarak oluşturuldu');
              } else {
                Alert.alert('Hata', result.error?.message || 'Takımlar oluşturulamadı');
              }
            } catch (error) {
              console.error('Error building teams:', error);
              Alert.alert('Hata', 'Takımlar oluşturulurken bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleAddPlayerToTeam = (playerId: string, team: 1 | 2, position?: string) => {
    if (!match) return;

    const teamCount = team === 1 ? team1.length : team2.length;
    const maxPerTeam = Math.ceil(match.squad.totalPlayers / 2);

    if (teamCount >= maxPerTeam) {
      Alert.alert('Uyarı', `Takım ${team} kadrosu dolu (Max: ${maxPerTeam})`);
      return;
    }

    const playerEntry = { playerId, position };

    if (team === 1) {
      setTeam1([...team1, playerEntry]);
    } else {
      setTeam2([...team2, playerEntry]);
    }

    setAvailablePlayers(availablePlayers.filter(id => id !== playerId));
    setShowPlayerModal(false);
  };

  const handleRemovePlayerFromTeam = (playerId: string, team: 1 | 2) => {
    if (team === 1) {
      setTeam1(team1.filter(p => p.playerId !== playerId));
    } else {
      setTeam2(team2.filter(p => p.playerId !== playerId));
    }

    setAvailablePlayers([...availablePlayers, playerId]);
  };

  const handleSaveTeams = async () => {
    if (!match) return;

    // Validation
    if (team1.length === 0 || team2.length === 0) {
      Alert.alert('Uyarı', 'Her iki takımda da en az 1 oyuncu olmalı');
      return;
    }

    const totalPlayers = team1.length + team2.length;
    const minPlayers = match.squad.minPlayersToStart;

    if (totalPlayers < minPlayers) {
      Alert.alert('Uyarı', `Toplam oyuncu sayısı en az ${minPlayers} olmalı`);
      return;
    }

    if (totalPlayers > match.squad.totalPlayers) {
      Alert.alert('Uyarı', `Toplam oyuncu sayısı ${match.squad.totalPlayers}'i geçemez`);
      return;
    }

    Alert.alert(
      'Takımları Kaydet',
      `Takım 1: ${team1.length} oyuncu\nTakım 2: ${team2.length} oyuncu\n\nTakımlar kaydedilecek ve maç durumu "Takımlar Kuruldu" olarak güncellenecek. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: async () => {
            try {
              setSaving(true);

              const result = await MatchService.buildTeams(
                matchId,
                'manual',
                { team1, team2 }
              );

              if (result.success) {
                // Emit event
                eventManager.emit(Events.TEAM_UPDATED, {
                  matchId,
                  timestamp: Date.now()
                });

                Alert.alert(
                  '✅ Başarılı!',
                  'Takımlar başarıyla kaydedildi',
                  [
                    {
                      text: 'Tamam',
                      onPress: () => goBack()
                    }
                  ]
                );
              } else {
                Alert.alert('Hata', result.error?.message || 'Takımlar kaydedilemedi');
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

  const getPlayerPosition = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player || !match) return undefined;

    const positions = player.sportPositions?.[match.sportType];
    return positions?.[0];
  };

  const getFilteredAvailablePlayers = () => {
    if (!searchQuery.trim()) {
      return allPlayers.filter(p => availablePlayers.includes(p.id));
    }

    return allPlayers.filter(p =>
      availablePlayers.includes(p.id) &&
      `${p.name} ${p.surname}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (loading || !match) {
    return <LoadingScreen />;
  }

  const sportColor = sportThemes[match.sportType].primary;
  const maxPerTeam = Math.ceil(match.squad.totalPlayers / 2);

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Takım Kur"
        subtitle={`${sportThemes[match.sportType].emoji} ${match.title}`}
        showBack={true}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={18} color="#2563EB" strokeWidth={2} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerText}>
              Toplam {allPlayers.length} oyuncu • Max {maxPerTeam} oyuncu/takım
            </Text>
            <Text style={styles.infoBannerSubtext}>
              Min {match.squad.minPlayersToStart} oyuncu gerekli
            </Text>
          </View>
        </View>

        {/* Algorithm Selection */}
        {availablePlayers.length >= 2 && (
          <View style={styles.algorithmSection}>
            <TouchableOpacity
              style={[styles.algorithmButton, { borderColor: sportColor }]}
              onPress={handleAutoBalance}
              activeOpacity={0.7}
            >
              <Shuffle size={20} color={sportColor} strokeWidth={2} />
              <Text style={[styles.algorithmButtonText, { color: sportColor }]}>
                Otomatik Takım Kur
              </Text>
            </TouchableOpacity>

            <Text style={styles.algorithmHint}>
              Rastgele, rating dengeli veya pozisyon dengeli
            </Text>
          </View>
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
                team1.map((player, index) => (
                  <View key={player.playerId} style={styles.playerRow}>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {getPlayerDisplay(player.playerId)}
                      </Text>
                      {player.position && (
                        <View style={styles.positionBadge}>
                          <MapPin size={10} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.positionText}>{player.position}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemovePlayerFromTeam(player.playerId, 1)}
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
                team2.map((player, index) => (
                  <View key={player.playerId} style={styles.playerRow}>
                    <View style={styles.playerNumber}>
                      <Text style={styles.playerNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {getPlayerDisplay(player.playerId)}
                      </Text>
                      {player.position && (
                        <View style={styles.positionBadge}>
                          <MapPin size={10} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.positionText}>{player.position}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemovePlayerFromTeam(player.playerId, 2)}
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
              {availablePlayers.map((playerId) => (
                <View key={playerId} style={styles.availablePlayerItem}>
                  <Text style={styles.availablePlayerName}>
                    {getPlayerDisplay(playerId)}
                  </Text>
                  <AlertCircle size={16} color="#F59E0B" strokeWidth={2} />
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

      {/* Algorithm Selection Modal */}
      <Modal
        visible={showAlgorithmModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlgorithmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Takım Kurma Algoritması</Text>
              <TouchableOpacity
                onPress={() => setShowAlgorithmModal(false)}
                style={styles.modalClose}
                activeOpacity={0.7}
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.algorithmList}>
              <TouchableOpacity
                style={styles.algorithmItem}
                onPress={() => handleBuildWithAlgorithm('random')}
                activeOpacity={0.7}
              >
                <View style={styles.algorithmIcon}>
                  <Shuffle size={24} color="#16a34a" strokeWidth={2} />
                </View>
                <View style={styles.algorithmInfo}>
                  <Text style={styles.algorithmName}>Rastgele</Text>
                  <Text style={styles.algorithmDesc}>
                    Oyuncular rastgele dağıtılır
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.algorithmItem}
                onPress={() => handleBuildWithAlgorithm('rating')}
                activeOpacity={0.7}
              >
                <View style={styles.algorithmIcon}>
                  <TrendingUp size={24} color="#3B82F6" strokeWidth={2} />
                </View>
                <View style={styles.algorithmInfo}>
                  <Text style={styles.algorithmName}>Rating Dengeli</Text>
                  <Text style={styles.algorithmDesc}>
                    Serpentine draft - takımlar rating'e göre dengelenir
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.algorithmItem}
                onPress={() => handleBuildWithAlgorithm('position')}
                activeOpacity={0.7}
              >
                <View style={styles.algorithmIcon}>
                  <MapPin size={24} color="#8B5CF6" strokeWidth={2} />
                </View>
                <View style={styles.algorithmInfo}>
                  <Text style={styles.algorithmName}>Pozisyon Dengeli</Text>
                  <Text style={styles.algorithmDesc}>
                    Pozisyonlar eşit dağıtılır, sonra rating dengelenir
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
              {getFilteredAvailablePlayers().map((player) => {
                const position = getPlayerPosition(player.id);
                return (
                  <TouchableOpacity
                    key={player.id}
                    style={styles.modalPlayerItem}
                    onPress={() => handleAddPlayerToTeam(player.id!, selectedTeam, position)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalPlayerAvatar}>
                      <Text style={styles.modalPlayerInitial}>
                        {player.name?.[0]}{player.surname?.[0]}
                      </Text>
                    </View>
                    <View style={styles.modalPlayerInfo}>
                      <Text style={styles.modalPlayerName}>
                        {player.name} {player.surname}
                      </Text>
                      {position && (
                        <View style={styles.modalPlayerPosition}>
                          <MapPin size={12} color="#6B7280" strokeWidth={2} />
                          <Text style={styles.modalPlayerPositionText}>{position}</Text>
                        </View>
                      )}
                    </View>
                    <Check size={18} color={selectedTeam === 1 ? sportColor : '#DC2626'} strokeWidth={2} />
                  </TouchableOpacity>
                );
              })}

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
  content: {
    flex: 1,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  infoBannerSubtext: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 2,
  },
  algorithmSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  algorithmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'white',
  },
  algorithmButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  algorithmHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
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
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
  },
  positionText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
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
  algorithmList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  algorithmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  algorithmIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  algorithmInfo: {
    flex: 1,
  },
  algorithmName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  algorithmDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
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
  modalPlayerInfo: {
    flex: 1,
  },
  modalPlayerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  modalPlayerPosition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  modalPlayerPositionText: {
    fontSize: 12,
    color: '#6B7280',
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