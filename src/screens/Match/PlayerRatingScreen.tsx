// src/screens/Match/PlayerRatingScreen.tsx
// ⭐ PLAYER RATING - Yeni IMatch type + Service Layer

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ChevronLeft,
  Star,
  Award,
  Users,
  Trophy,
  Check,
  Info,
  TrendingUp,
  Crown,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { IMatch, SportType, MatchStatus } from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { PlayerService } from '../../services/serviceLayer/playerService';
import { MatchRatingService } from '../../services/serviceLayer/matchRatingService';
import { eventManager, Events } from '../../utils';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { getSportBackgroundColor, getSportEmoji } from '../../utils/theme';
import { goBack } from '../../navigation';

// Rating interface
interface PlayerRating {
  playerId: string;
  rating: number; // 1-5
}

export const PlayerRatingScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAuth();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [hasRated, setHasRated] = useState(false);

  // MVP calculation
  const [mvpPlayer, setMvpPlayer] = useState<string | null>(null);
  const [averageRatings, setAverageRatings] = useState<Record<string, { avg: number; count: number }>>({});

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

      // Check if match is completed
      if (matchData.status !== MatchStatus.COMPLETED) {
        Alert.alert('Uyarı', 'Maç henüz tamamlanmadı');
        goBack();
        return;
      }

      setMatch(matchData);

      // Check if user played in match
      const playerInMatch = isPlayerInMatch(matchData, user.id);
      if (!playerInMatch) {
        Alert.alert('Uyarı', 'Sadece maçta oynayan oyuncular puanlama yapabilir');
        goBack();
        return;
      }

      // ✅ Check rating completion status
      const completionResult = await MatchRatingService.checkRatingCompletion(matchId, user.id);
      if (completionResult.success && completionResult.data?.completed) {
        setHasRated(true);
        Alert.alert(
          'Zaten Puanladınız',
          'Bu maçı daha önce puanladınız.',
          [{ text: 'Tamam', onPress: () => goBack() }]
        );
        return;
      }

      // Get all players in match (except current user)
      const team1Players = matchData.players.teams?.team1.map(p => p.playerId) || [];
      const team2Players = matchData.players.teams?.team2.map(p => p.playerId) || [];
      const playerIds = [...team1Players, ...team2Players].filter(id => id !== user.id);

      // Load player details
      const playerDetailsPromises = playerIds.map(async (playerId) => {
        const playerResult = await PlayerService.getPlayer(playerId);
        return playerResult.success && playerResult.data ? playerResult.data : null;
      });

      const players = (await Promise.all(playerDetailsPromises)).filter(p => p !== null);
      setAllPlayers(players);

      // Initialize ratings
      const initialRatings: PlayerRating[] = players.map(p => ({
        playerId: p.id,
        rating: 0,
      }));
      setRatings(initialRatings);

      // Calculate current MVP
      await calculateMVP(matchData, players);

    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu');
      goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isPlayerInMatch = (match: IMatch, playerId: string): boolean => {
    if (!match.players.teams) return false;
    const inTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
    const inTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);
    return inTeam1 || inTeam2;
  };

  const calculateMVP = async (matchData: IMatch, players: any[]) => {
    try {
      // ✅ Use existing service method - getMatchRatingSummary
      const summaryResult = await MatchRatingService.getMatchRatingSummary(matchId);

      if (!summaryResult.success || !summaryResult.data) {
        setMvpPlayer(null);
        setAverageRatings({});
        return;
      }

      const summary = summaryResult.data;

      // Convert topRatedPlayers to averages format
      const playerAverages: Record<string, { avg: number; count: number }> = {};

      summary.topRatedPlayers.forEach(player => {
        playerAverages[player.playerId] = {
          avg: player.averageRating,
          count: player.totalRatings
        };
      });

      setAverageRatings(playerAverages);

      // MVP is the first in topRatedPlayers
      if (summary.topRatedPlayers.length > 0) {
        setMvpPlayer(summary.topRatedPlayers[0].playerId);
      } else {
        setMvpPlayer(null);
      }
    } catch (error) {
      console.error('Error calculating MVP:', error);
      setMvpPlayer(null);
      setAverageRatings({});
    }
  };

  const handleRatingChange = (playerId: string, rating: number) => {
    setRatings(prev =>
      prev.map(r => r.playerId === playerId ? { ...r, rating } : r)
    );
  };

  const handleSubmitRatings = async () => {
    if (!match || !user?.id) return;

    // Validation
    const unrated = ratings.filter(r => r.rating === 0);
    if (unrated.length > 0) {
      Alert.alert(
        'Eksik Puanlama',
        `${unrated.length} oyuncuyu henüz puanlamadınız. Tüm oyuncuları puanlamalısınız.`
      );
      return;
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / ratings.length).toFixed(1);

    Alert.alert(
      'Puanlamayı Gönder',
      `${ratings.length} oyuncu puanlandı\nOrtalama: ${avgRating}⭐\n\nDevam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: async () => {
            try {
              setSaving(true);

              // ✅ Use existing service - submitBulkRatings
              const result = await MatchRatingService.submitBulkRatings({
                matchId,
                raterId: user.id,
                ratings: ratings.map(r => ({
                  ratedPlayerId: r.playerId,
                  rating: r.rating
                })),
                isAnonymous: true
              });

              if (result.success) {
                // Emit event
                eventManager.emit(Events.MATCH_UPDATED, {
                  matchId,
                  timestamp: Date.now()
                });

                Alert.alert(
                  '✅ Başarılı!',
                  'Puanlamalarınız kaydedildi. Teşekkür ederiz!',
                  [{ text: 'Tamam', onPress: () => goBack() }]
                );
              } else {
                Alert.alert('Hata', result.error?.message || 'Puanlamalar kaydedilemedi');
              }
            } catch (error) {
              console.error('Error saving ratings:', error);
              Alert.alert('Hata', 'Puanlamalar kaydedilirken bir hata oluştu');
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
    return player ? `${player.name} ${player.surname}` : 'Oyuncu';
  };

  const getPlayerTeam = (playerId: string): 1 | 2 | 0 => {
    if (!match?.players.teams) return 0;
    if (match.players.teams.team1.some(p => p.playerId === playerId)) return 1;
    if (match.players.teams.team2.some(p => p.playerId === playerId)) return 2;
    return 0;
  };

  const getRatingForPlayer = (playerId: string): number => {
    const rating = ratings.find(r => r.playerId === playerId);
    return rating?.rating || 0;
  };

  const getRatedCount = (): number => {
    return ratings.filter(r => r.rating > 0).length;
  };

  if (loading || !match) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const sportColor = getSportBackgroundColor(match.sportType);
  const sportEmoji = getSportEmoji(match.sportType);
  const ratedCount = getRatedCount();
  const progress = allPlayers.length > 0 ? (ratedCount / allPlayers.length) * 100 : 0;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Oyuncu Puanlama"
        subtitle={`${sportEmoji} ${match.title}`}
        showBack={true}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressInfo}>
              <TrendingUp size={20} color={sportColor} strokeWidth={2} />
              <Text style={styles.progressTitle}>İlerleme</Text>
            </View>
            <Text style={styles.progressCount}>{ratedCount}/{allPlayers.length}</Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: sportColor }]} />
          </View>

          <Text style={styles.progressText}>
            {ratedCount === allPlayers.length
              ? '✅ Tüm oyuncuları puanladınız!'
              : `${allPlayers.length - ratedCount} oyuncu daha`}
          </Text>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={18} color="#2563EB" strokeWidth={2} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Puanlama Sistemi</Text>
            <Text style={styles.infoBannerText}>
              • Takım arkadaşlarınızı 1-5 yıldız ile puanlayın{'\n'}
              • En yüksek ortalama alan oyuncu MVP olacak{'\n'}
              • Puanlamalarınız anonim kalacak{'\n'}
              • Tüm oyuncuları puanlamalısınız
            </Text>
          </View>
        </View>

        {/* MVP Preview */}
        {mvpPlayer && averageRatings[mvpPlayer] && (
          <View style={styles.mvpCard}>
            <View style={styles.mvpHeader}>
              <Crown size={24} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.mvpTitle}>Şu Anki MVP</Text>
            </View>

            <View style={styles.mvpContent}>
              <Text style={styles.mvpPlayerName}>{getPlayerName(mvpPlayer)}</Text>
              <View style={styles.mvpRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color="#F59E0B"
                    fill={star <= Math.floor(averageRatings[mvpPlayer]?.avg || 0) ? '#F59E0B' : 'transparent'}
                    strokeWidth={2}
                  />
                ))}
                <Text style={styles.mvpRatingText}>
                  {averageRatings[mvpPlayer]?.avg.toFixed(1)} ({averageRatings[mvpPlayer]?.count} oy)
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Players List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Oyuncuları Puanlayın ({allPlayers.length})</Text>

          <View style={styles.playersList}>
            {allPlayers.map((player, index) => {
              const team = getPlayerTeam(player.id);
              const teamColor = team === 1 ? sportColor : '#DC2626';
              const currentRating = getRatingForPlayer(player.id);
              const avgRating = averageRatings[player.id];

              return (
                <View key={player.id} style={styles.playerItem}>
                  <View style={styles.playerHeader}>
                    <View style={styles.playerLeft}>
                      <View style={[styles.playerNumber, { backgroundColor: teamColor + '20' }]}>
                        <Text style={[styles.playerNumberText, { color: teamColor }]}>{index + 1}</Text>
                      </View>

                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{player.name} {player.surname}</Text>
                        <View style={styles.playerMeta}>
                          <View style={[styles.teamBadge, { backgroundColor: teamColor + '20' }]}>
                            <Text style={[styles.teamBadgeText, { color: teamColor }]}>Takım {team}</Text>
                          </View>
                          {avgRating && (
                            <View style={styles.avgBadge}>
                              <Star size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
                              <Text style={styles.avgText}>{avgRating.avg.toFixed(1)}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {player.id === mvpPlayer && (
                      <View style={styles.mvpBadge}>
                        <Crown size={14} color="#F59E0B" strokeWidth={2} />
                      </View>
                    )}
                  </View>

                  {/* Star Rating */}
                  <View style={styles.ratingContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleRatingChange(player.id, star)}
                        activeOpacity={0.7}
                        style={styles.starButton}
                      >
                        <Star
                          size={32}
                          color={star <= currentRating ? '#F59E0B' : '#D1D5DB'}
                          fill={star <= currentRating ? '#F59E0B' : 'transparent'}
                          strokeWidth={2}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  {currentRating > 0 && (
                    <View style={styles.ratingFeedback}>
                      <Check size={14} color="#10B981" strokeWidth={2.5} />
                      <Text style={styles.ratingFeedbackText}>
                        {currentRating === 5 ? '⭐ Mükemmel!' :
                          currentRating === 4 ? '✨ Harika!' :
                            currentRating === 3 ? '👍 İyi!' :
                              currentRating === 2 ? '👌 Fena değil' : '✓ Puanlandı'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        {ratedCount > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Puanlama Özeti</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Puanlanan</Text>
              <Text style={styles.summaryValue}>{ratedCount}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ortalama</Text>
              <Text style={styles.summaryValue}>
                {(ratings.reduce((sum, r) => sum + r.rating, 0) / ratedCount).toFixed(1)}⭐
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>5 Yıldız</Text>
              <Text style={styles.summaryValue}>{ratings.filter(r => r.rating === 5).length}</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: sportColor },
            ratedCount !== allPlayers.length && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitRatings}
          disabled={saving || ratedCount !== allPlayers.length}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Check size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.submitButtonText}>
                {ratedCount === allPlayers.length
                  ? 'Puanlamayı Gönder'
                  : `${allPlayers.length - ratedCount} Oyuncu Daha`}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280', fontWeight: '600' },
  content: { flex: 1 },
  progressCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  progressInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  progressCount: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  progressBarContainer: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressBar: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
  infoBanner: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16, padding: 16, backgroundColor: '#EFF6FF', borderRadius: 12 },
  infoBannerContent: { flex: 1 },
  infoBannerTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF', marginBottom: 6 },
  infoBannerText: { fontSize: 12, color: '#1E40AF', lineHeight: 18 },
  mvpCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 2, borderColor: '#F59E0B', shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  mvpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  mvpTitle: { fontSize: 14, fontWeight: '700', color: '#78350F' },
  mvpContent: { alignItems: 'center' },
  mvpPlayerName: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
  mvpRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mvpRatingText: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 8 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  playersList: { gap: 12 },
  playerItem: { backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  playerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  playerNumber: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  playerNumberText: { fontSize: 14, fontWeight: '700' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  playerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  teamBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  teamBadgeText: { fontSize: 11, fontWeight: '700' },
  avgBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  avgText: { fontSize: 11, fontWeight: '700', color: '#78350F' },
  mvpBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center' },
  ratingContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
  starButton: { padding: 4 },
  ratingFeedback: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, paddingVertical: 6, backgroundColor: '#DCFCE7', borderRadius: 8 },
  ratingFeedbackText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  summaryCard: { marginHorizontal: 16, marginTop: 20, backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  summaryLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  summaryValue: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  bottomSpacing: { height: 20 },
  bottomAction: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: 'white' },
});