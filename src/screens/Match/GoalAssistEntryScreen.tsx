import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  Target,
  TrendingUp,
  Check,
  X,
  Edit,
  Plus,
  Minus,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
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
} from '../../types/types';
import { matchService } from '../../services/matchService';
import { matchFixtureService } from '../../services/matchFixtureService';
import { playerService } from '../../services/playerService';

export const GoalAssistEntryScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const navigation = useNavigationContext();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [fixture, setFixture] = useState<IMatchFixture | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isOrganizer, setIsOrganizer] = useState(false);
  const [isPlayerInMatch, setIsPlayerInMatch] = useState(false);

  // Entry Modal
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [myGoals, setMyGoals] = useState<string>('0');
  const [myAssists, setMyAssists] = useState<string>('0');
  const [hasMyEntry, setHasMyEntry] = useState(false);

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

      // Check if score is entered
      if (matchData.status !== 'Skor Onay Bekliyor' && matchData.status !== 'Ödeme Bekliyor' && matchData.status !== 'Tamamlandı') {
        Alert.alert('Uyarı', 'Önce maç skoru girilmeli');
        navigation.goBack();
        return;
      }

      setMatch(matchData);

      // Check permissions
      const organizer = matchData.organizerPlayerIds?.includes(user.id) || false;
      setIsOrganizer(organizer);

      // Check if user played in match
      const playerInMatch = 
        matchData.team1PlayerIds?.includes(user.id) ||
        matchData.team2PlayerIds?.includes(user.id) || false;
      setIsPlayerInMatch(playerInMatch);

      // Get fixture
      const fixtureData = await matchFixtureService.getById(matchData.fixtureId);
      setFixture(fixtureData);

      // Load all players in match
      const playerIds = [
        ...(matchData.team1PlayerIds || []),
        ...(matchData.team2PlayerIds || []),
      ];
      const players = await playerService.getPlayersByIds(playerIds);
      setAllPlayers(players);

      // Check if current user has entry
      const myEntry = matchData.goalScorers?.find(g => g.playerId === user.id);
      if (myEntry) {
        setHasMyEntry(true);
        setMyGoals(myEntry.goals.toString());
        setMyAssists(myEntry.assists.toString());
      }

    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenEntryModal = () => {
    setShowEntryModal(true);
  };

  const handleCloseEntryModal = () => {
    setShowEntryModal(false);
  };

  const handleIncrement = (type: 'goal' | 'assist') => {
    if (type === 'goal') {
      const current = parseInt(myGoals) || 0;
      setMyGoals((current + 1).toString());
    } else {
      const current = parseInt(myAssists) || 0;
      setMyAssists((current + 1).toString());
    }
  };

  const handleDecrement = (type: 'goal' | 'assist') => {
    if (type === 'goal') {
      const current = parseInt(myGoals) || 0;
      if (current > 0) setMyGoals((current - 1).toString());
    } else {
      const current = parseInt(myAssists) || 0;
      if (current > 0) setMyAssists((current - 1).toString());
    }
  };

  const handleSaveMyEntry = async () => {
    if (!match || !user?.id) return;

    const goals = parseInt(myGoals) || 0;
    const assists = parseInt(myAssists) || 0;

    if (goals < 0 || assists < 0) {
      Alert.alert('Hata', 'Değerler negatif olamaz');
      return;
    }

    if (goals === 0 && assists === 0) {
      Alert.alert('Bilgi', 'En az bir gol veya asist girmelisiniz');
      return;
    }

    // Validate against team score
    const isTeam1 = match.team1PlayerIds?.includes(user.id);
    const teamScore = isTeam1 ? match.team1Score : match.team2Score;
    
    if (goals > (teamScore || 0)) {
      Alert.alert('Hata', `Girdiğiniz gol sayısı takım skorundan fazla olamaz (Max: ${teamScore})`);
      return;
    }

    Alert.alert(
      'Gol/Asist Kaydet',
      `${goals} gol, ${assists} asist\n\nOrganizatör onayına sunulacak. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: async () => {
            try {
              setSaving(true);

              const success = await matchService.addGoalScorer(
                match.id,
                user.id,
                goals,
                assists
              );

              if (success) {
                Alert.alert('✅ Başarılı!', 'Gol/Asist girişiniz kaydedildi. Organizatör onayı bekleniyor.');
                setShowEntryModal(false);
                await loadData();
              } else {
                Alert.alert('Hata', 'Kayıt başarısız oldu');
              }
            } catch (error) {
              console.error('Error saving entry:', error);
              Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleApproveEntry = async (playerId: string) => {
    if (!match || !isOrganizer) return;

    Alert.alert(
      'Onayla',
      'Bu gol/asist kaydını onaylamak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              setSaving(true);

              // Update the specific goal scorer confirmation
              const updatedGoalScorers = match.goalScorers.map(g => {
                if (g.playerId === playerId) {
                  return { ...g, confirmed: true };
                }
                return g;
              });

              await matchService.update(match.id, {
                goalScorers: updatedGoalScorers
              });

              Alert.alert('✅ Onaylandı', 'Gol/Asist kaydı onaylandı');
              await loadData();
            } catch (error) {
              console.error('Error approving entry:', error);
              Alert.alert('Hata', 'Onaylama sırasında bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleRejectEntry = async (playerId: string) => {
    if (!match || !isOrganizer) return;

    Alert.alert(
      'Reddet',
      'Bu gol/asist kaydını reddetmek istediğinize emin misiniz? Kayıt silinecek.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Reddet',
          style: 'destructive',
          onPress: async () => {
            try {
              setSaving(true);

              // Remove the goal scorer
              const updatedGoalScorers = match.goalScorers.filter(
                g => g.playerId !== playerId
              );

              await matchService.update(match.id, {
                goalScorers: updatedGoalScorers
              });

              Alert.alert('✅ Reddedildi', 'Gol/Asist kaydı silindi');
              await loadData();
            } catch (error) {
              console.error('Error rejecting entry:', error);
              Alert.alert('Hata', 'Reddetme sırasında bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleConfirmAll = async () => {
    if (!match || !isOrganizer) return;

    const pendingCount = match.goalScorers?.filter(g => !g.confirmed).length || 0;
    
    if (pendingCount === 0) {
      Alert.alert('Bilgi', 'Onay bekleyen kayıt yok');
      return;
    }

    Alert.alert(
      'Tümünü Onayla',
      `${pendingCount} adet onay bekleyen kayıt var. Tümünü onaylamak istiyor musunuz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              setSaving(true);

              const success = await matchService.confirmGoalScorers(match.id);

              if (success) {
                Alert.alert('✅ Tamamlandı!', 'Tüm kayıtlar onaylandı. Artık oyuncular birbirlerini puanlayabilir.');
                await loadData();
              } else {
                Alert.alert('Hata', 'Onaylama başarısız oldu');
              }
            } catch (error) {
              console.error('Error confirming all:', error);
              Alert.alert('Hata', 'Onaylama sırasında bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const getPlayerName = (playerId: string) => {
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return 'Oyuncu';
    return `${player.name} ${player.surname}`;
  };

  const getPlayerTeam = (playerId: string): 1 | 2 | 0 => {
    if (match?.team1PlayerIds?.includes(playerId)) return 1;
    if (match?.team2PlayerIds?.includes(playerId)) return 2;
    return 0;
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
  const goalScorers = match.goalScorers || [];
  const pendingCount = goalScorers.filter(g => !g.confirmed).length;
  const confirmedCount = goalScorers.filter(g => g.confirmed).length;
  const totalGoals = goalScorers.reduce((sum, g) => sum + g.goals, 0);
  const totalAssists = goalScorers.reduce((sum, g) => sum + g.assists, 0);

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
          <Text style={styles.headerTitle}>Gol & Asist</Text>
          <Text style={styles.headerSubtitle}>
            {getSportIcon(fixture.sportType)} {match.title}
          </Text>
        </View>

        <View style={styles.headerButton} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Score Display */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreTeamName}>Takım 1</Text>
            <Text style={styles.scoreValue}>{match.team1Score}</Text>
          </View>
          <View style={styles.scoreDivider}>
            <Text style={styles.scoreDividerText}>-</Text>
          </View>
          <View style={styles.scoreTeam}>
            <Text style={styles.scoreValue}>{match.team2Score}</Text>
            <Text style={styles.scoreTeamName}>Takım 2</Text>
          </View>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Target size={20} color={sportColor} strokeWidth={2} />
            <Text style={styles.statValue}>{totalGoals}</Text>
            <Text style={styles.statLabel}>Toplam Gol</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={20} color="#3B82F6" strokeWidth={2} />
            <Text style={styles.statValue}>{totalAssists}</Text>
            <Text style={styles.statLabel}>Toplam Asist</Text>
          </View>

          <View style={styles.statCard}>
            <Users size={20} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.statValue}>{goalScorers.length}</Text>
            <Text style={styles.statLabel}>Kayıt</Text>
          </View>

          {isOrganizer && (
            <View style={styles.statCard}>
              <Clock size={20} color="#DC2626" strokeWidth={2} />
              <Text style={styles.statValue}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Bekleyen</Text>
            </View>
          )}
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={18} color="#2563EB" strokeWidth={2} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerText}>
              {isPlayerInMatch && !hasMyEntry
                ? 'Gol ve asist bilgilerinizi girin. Organizatör onayladıktan sonra puan durumuna yansıyacak.'
                : hasMyEntry
                  ? 'Girişiniz kaydedildi. Organizatör onayı bekleniyor.'
                  : 'Sadece maçta oynayan oyuncular gol/asist girebilir.'}
            </Text>
          </View>
        </View>

        {/* Player Entry Button */}
        {isPlayerInMatch && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.entryButton,
                { borderColor: sportColor },
                hasMyEntry && styles.entryButtonDisabled
              ]}
              onPress={handleOpenEntryModal}
              disabled={hasMyEntry}
              activeOpacity={0.7}
            >
              {hasMyEntry ? (
                <>
                  <CheckCircle size={20} color="#10B981" strokeWidth={2} />
                  <Text style={styles.entryButtonTextSuccess}>
                    Girişiniz Kaydedildi
                  </Text>
                </>
              ) : (
                <>
                  <Plus size={20} color={sportColor} strokeWidth={2.5} />
                  <Text style={[styles.entryButtonText, { color: sportColor }]}>
                    Gol/Asist Gir
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Goal Scorers List */}
        {goalScorers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Gol & Asist Kayıtları ({goalScorers.length})
              </Text>
              {isOrganizer && pendingCount > 0 && (
                <TouchableOpacity
                  style={styles.approveAllButton}
                  onPress={handleConfirmAll}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  <Check size={16} color="#10B981" strokeWidth={2.5} />
                  <Text style={styles.approveAllText}>Tümünü Onayla</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.goalScorersList}>
              {goalScorers.map((scorer, index) => {
                const team = getPlayerTeam(scorer.playerId);
                const teamColor = team === 1 ? sportColor : '#DC2626';
                const isCurrentUser = scorer.playerId === user?.id;

                return (
                  <View
                    key={`${scorer.playerId}-${index}`}
                    style={[
                      styles.goalScorerItem,
                      isCurrentUser && styles.goalScorerItemHighlight,
                    ]}
                  >
                    <View style={styles.goalScorerLeft}>
                      <View
                        style={[
                          styles.goalScorerTeamBadge,
                          { backgroundColor: teamColor + '20' },
                        ]}
                      >
                        <Text style={[styles.goalScorerTeamText, { color: teamColor }]}>
                          T{team}
                        </Text>
                      </View>

                      <View style={styles.goalScorerInfo}>
                        <View style={styles.goalScorerNameRow}>
                          <Text style={styles.goalScorerName}>
                            {getPlayerName(scorer.playerId)}
                          </Text>
                          {isCurrentUser && (
                            <View style={styles.youBadge}>
                              <Text style={styles.youBadgeText}>Siz</Text>
                            </View>
                          )}
                        </View>

                        <View style={styles.goalScorerStats}>
                          <View style={styles.statItem}>
                            <Target size={14} color={sportColor} strokeWidth={2} />
                            <Text style={styles.statItemText}>{scorer.goals} Gol</Text>
                          </View>
                          <View style={styles.statItem}>
                            <TrendingUp size={14} color="#3B82F6" strokeWidth={2} />
                            <Text style={styles.statItemText}>{scorer.assists} Asist</Text>
                          </View>
                        </View>

                        <Text style={styles.goalScorerDate}>
                          {new Date(scorer.submittedAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.goalScorerRight}>
                      {scorer.confirmed ? (
                        <View style={styles.confirmedBadge}>
                          <CheckCircle size={18} color="#10B981" strokeWidth={2} />
                          <Text style={styles.confirmedText}>Onaylı</Text>
                        </View>
                      ) : (
                        <>
                          {isOrganizer ? (
                            <View style={styles.organizerActions}>
                              <TouchableOpacity
                                style={styles.approveButton}
                                onPress={() => handleApproveEntry(scorer.playerId)}
                                disabled={saving}
                                activeOpacity={0.7}
                              >
                                <Check size={18} color="white" strokeWidth={2.5} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rejectButton}
                                onPress={() => handleRejectEntry(scorer.playerId)}
                                disabled={saving}
                                activeOpacity={0.7}
                              >
                                <X size={18} color="white" strokeWidth={2.5} />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <View style={styles.pendingBadge}>
                              <Clock size={16} color="#F59E0B" strokeWidth={2} />
                              <Text style={styles.pendingText}>Bekliyor</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {goalScorers.length === 0 && (
          <View style={styles.emptyState}>
            <Trophy size={64} color="#D1D5DB" strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Henüz kayıt yok</Text>
            <Text style={styles.emptyStateText}>
              Oyuncular gol ve asist bilgilerini girebilir
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Entry Modal */}
      <Modal
        visible={showEntryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseEntryModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gol & Asist Gir</Text>
              <TouchableOpacity
                onPress={handleCloseEntryModal}
                style={styles.modalClose}
                activeOpacity={0.7}
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Goals Input */}
              <View style={styles.inputSection}>
                <View style={styles.inputHeader}>
                  <Target size={20} color={sportColor} strokeWidth={2} />
                  <Text style={styles.inputLabel}>Gol Sayısı</Text>
                </View>

                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => handleDecrement('goal')}
                    activeOpacity={0.7}
                  >
                    <Minus size={24} color={sportColor} strokeWidth={2.5} />
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.counterInput, { borderColor: sportColor }]}
                    value={myGoals}
                    onChangeText={(value) => setMyGoals(value.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => handleIncrement('goal')}
                    activeOpacity={0.7}
                  >
                    <Plus size={24} color={sportColor} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Assists Input */}
              <View style={styles.inputSection}>
                <View style={styles.inputHeader}>
                  <TrendingUp size={20} color="#3B82F6" strokeWidth={2} />
                  <Text style={styles.inputLabel}>Asist Sayısı</Text>
                </View>

                <View style={styles.counterContainer}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => handleDecrement('assist')}
                    activeOpacity={0.7}
                  >
                    <Minus size={24} color="#3B82F6" strokeWidth={2.5} />
                  </TouchableOpacity>

                  <TextInput
                    style={[styles.counterInput, { borderColor: '#3B82F6' }]}
                    value={myAssists}
                    onChangeText={(value) => setMyAssists(value.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />

                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => handleIncrement('assist')}
                    activeOpacity={0.7}
                  >
                    <Plus size={24} color="#3B82F6" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Info */}
              <View style={styles.modalInfo}>
                <AlertCircle size={16} color="#F59E0B" strokeWidth={2} />
                <Text style={styles.modalInfoText}>
                  Girdiğiniz bilgiler organizatör onayına sunulacak
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCloseEntryModal}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveButton, { backgroundColor: sportColor }]}
                onPress={handleSaveMyEntry}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Check size={18} color="white" strokeWidth={2.5} />
                    <Text style={styles.modalSaveText}>Kaydet</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreTeam: {
    alignItems: 'center',
  },
  scoreTeamName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 6,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
  },
  scoreDivider: {
    paddingHorizontal: 12,
  },
  scoreDividerText: {
    fontSize: 24,
    color: '#D1D5DB',
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
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
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
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
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  approveAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
  },
  approveAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  entryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  entryButtonDisabled: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  entryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  entryButtonTextSuccess: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10B981',
  },
  goalScorersList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  goalScorerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  goalScorerItemHighlight: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  goalScorerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  goalScorerTeamBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalScorerTeamText: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalScorerInfo: {
    flex: 1,
  },
  goalScorerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  goalScorerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  youBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E40AF',
  },
  goalScorerStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statItemText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  goalScorerDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  goalScorerRight: {
    marginLeft: 12,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
  },
  organizerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  approveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
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
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  counterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterInput: {
    width: 100,
    height: 60,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  modalInfo: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalSaveText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});