// screens/Match/PlayerRatingScreen.tsx

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
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';
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
import { matchRatingService } from '../../services/matchRatingService'; // ✅ EKLE
import { playerRatingProfileService } from '../../services/playerRatingProfileService'; // ✅ EKLE

// Rating interface for temporary storage
interface PlayerRating {
  playerId: string;
  rating: number; // 1-5
  categories?: {
    skill?: number;
    teamwork?: number;
    sportsmanship?: number;
    effort?: number;
  };
}

export const PlayerRatingScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [fixture, setFixture] = useState<IMatchFixture | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isPlayerInMatch, setIsPlayerInMatch] = useState(false);
  const [ratings, setRatings] = useState<PlayerRating[]>([]);
  const [hasRated, setHasRated] = useState(false);

  // MVP calculation
  const [mvpPlayer, setMvpPlayer] = useState<string | null>(null);
  const [averageRatings, setAverageRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // ✅ Event listener
  useEffect(() => {
    const unsubscribe = eventManager.on(Events.MATCH_UPDATED, (data) => {
      if (data.matchId === matchId) {
        loadData();
      }
    });

    return unsubscribe;
  }, [matchId]);

  useEffect(() => {
    loadData();
  }, [matchId]);

  const loadData = async () => {
    if (!matchId || !user?.id) {
      Alert.alert('Hata', 'Maç ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);

      const matchData = await matchService.getById(matchId);
      if (!matchData) {
        Alert.alert('Hata', 'Maç bulunamadı');
        NavigationService.goBack();
        return;
      }

      // Check if goals are confirmed
      if (matchData.status !== 'Ödeme Bekliyor' &&
        //TODO: burası kontrol edilecek matchData.status !== 'Oyuncu Puanlama' &&
        matchData.status !== 'Tamamlandı') {
        Alert.alert('Uyarı', 'Önce gol/asist girişleri onaylanmalı');
        NavigationService.goBack();
        return;
      }

      setMatch(matchData);

      // Check if user played in match
      const playerInMatch =
        matchData.team1PlayerIds?.includes(user.id) ||
        matchData.team2PlayerIds?.includes(user.id) || false;
      setIsPlayerInMatch(playerInMatch);

      if (!playerInMatch) {
        Alert.alert('Uyarı', 'Sadece maçta oynayan oyuncular puanlama yapabilir');
        NavigationService.goBack();
        return;
      }

      // ✅ Check if user already rated this match
      const existingRating = await matchRatingService.getByRaterMatch(user.id, matchId);
      if (existingRating && existingRating.length > 0) {
        setHasRated(true);
        Alert.alert(
          'Zaten Puanladınız',
          'Bu maçı daha önce puanladınız. Puanlamaları görüntüleyebilirsiniz.',
          [
            {
              text: 'Tamam',
              onPress: () => NavigationService.goBack()
            }
          ]
        );
        return;
      }

      // Get fixture
      const fixtureData = await matchFixtureService.getById(matchData.fixtureId);
      setFixture(fixtureData);

      // Load all players in match (except current user)
      const playerIds = [
        ...(matchData.team1PlayerIds || []),
        ...(matchData.team2PlayerIds || []),
      ].filter(id => id !== user.id);

      const players = await playerService.getPlayersByIds(playerIds);
      setAllPlayers(players);

      // Initialize empty ratings
      const initialRatings: PlayerRating[] = players.map(p => ({
        playerId: p.id!,
        rating: 0,
        categories: {
          skill: 0,
          teamwork: 0,
          sportsmanship: 0,
          effort: 0
        }
      }));
      setRatings(initialRatings);

      // ✅ Calculate current MVP and averages from database
      await calculateMVP(matchData);

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

  const calculateMVP = async (matchData: IMatch) => {
    try {
      // ✅ Get all ratings for this match from database
      const matchRatings = await matchRatingService.getRatingsByMatch(matchId);

      if (matchRatings.length === 0) {
        // No ratings yet, no MVP
        setMvpPlayer(null);
        setAverageRatings({});
        return;
      }

      // ✅ Calculate average rating for each player
      const playerAverages: Record<string, { avg: number; count: number }> = {};

      allPlayers.forEach(player => {
        const playerRatings = matchRatings.filter(
          (r: any) => r.ratedPlayerId === player.id
        );

        if (playerRatings.length > 0) {
          const totalRating = playerRatings.reduce(
            (sum: number, r: any) => sum + (r.rating || 0),
            0
          );
          const avgRating = totalRating / playerRatings.length;

          playerAverages[player.id!] = {
            avg: parseFloat(avgRating.toFixed(2)),
            count: playerRatings.length
          };
        }
      });

      setAverageRatings(playerAverages);

      // ✅ Find MVP (highest average rating)
      let maxAvg = 0;
      let mvp: string | null = null;

      Object.keys(playerAverages).forEach(playerId => {
        if (playerAverages[playerId].avg > maxAvg) {
          maxAvg = playerAverages[playerId].avg;
          mvp = playerId;
        }
      });

      setMvpPlayer(mvp);
    } catch (error) {
      console.error('Error calculating MVP:', error);
    }
  };

  const handleRatingChange = (playerId: string, rating: number) => {
    setRatings(prev =>
      prev.map(r =>
        r.playerId === playerId ? { ...r, rating } : r
      )
    );
  };

  const handleSubmitRatings = async () => {
    if (!match || !fixture) return;

    // Validation: Check if all players are rated
    const unrated = ratings.filter(r => r.rating === 0);
    if (unrated.length > 0) {
      Alert.alert(
        'Eksik Puanlama',
        `${unrated.length} oyuncuyu henüz puanlamadınız. Tüm oyuncuları puanlamalısınız.`,
        [
          { text: 'Tamam', style: 'cancel' }
        ]
      );
      return;
    }

    // Calculate average rating given
    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = (totalRating / ratings.length).toFixed(1);

    Alert.alert(
      'Puanlamayı Gönder',
      `${ratings.length} oyuncu puanlandı\nOrtalama verdiğiniz puan: ${avgRating}⭐\n\nPuanlamalar kaydedilecek. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Gönder',
          onPress: async () => {
            try {
              setSaving(true);

              // ✅ Save each rating to database
              const savePromises = ratings.map(async (rating) => {
                // Determine if rater and rated player are teammates or opponents
                const raterInTeam1 = match.team1PlayerIds?.includes(user?.id);
                const ratedInTeam1 = match.team1PlayerIds?.includes(rating.playerId);
                const isTeammate = raterInTeam1 === ratedInTeam1;

                const ratingData = {
                  id: null,
                  matchId: match.id,
                  raterId: user?.id,                    // ✅ Puanlayan
                  ratedPlayerId: rating.playerId,      // ✅ Puanlanan
                  rating: rating.rating,
                  categories: rating.categories,
                  isTeammateRating: isTeammate,
                  isAnonymous: true,                   // ✅ Eklendi
                  leagueId: fixture.leagueId,
                  //seasonId: fixture.seasonId, //TODO seasonId eklenmeli
                  createdAt: new Date().toISOString()
                };

                return await matchRatingService.add(ratingData);
              });

              const results = await Promise.all(savePromises);
              const allSuccess = results.every(r => r && r.success);

              if (!allSuccess) {
                Alert.alert('Hata', 'Bazı puanlamalar kaydedilemedi');
                return;
              }

              // ✅ Update player rating profiles for all RATED players
              const profileUpdatePromises = ratings.map(rating =>
                playerRatingProfileService.updateProfileFromMatch(
                  rating.playerId,           // ✅ Bu doğru - ratedPlayerId bu context'te playerId
                  fixture.leagueId,
                  new Date().toISOString(),   //fixture.seasonId, TODO: season Id eklenmeli
                  match.id
                )
              );

              await Promise.all(profileUpdatePromises);

              // ✅ Recalculate and update MVP
              await matchRatingService.recalculateMatchMVP(match.id);

              // ✅ Update match status if all players have rated
              const allPlayersCount = (match.team1PlayerIds?.length || 0) +
                (match.team2PlayerIds?.length || 0);
              const allRatingsCount = await matchRatingService.countRatersByMatch(match.id);

              if (allRatingsCount >= allPlayersCount - 1) {
                // All players have submitted ratings (excluding current rater who just submitted)
                await matchService.update(match.id, {
                  status: 'Tamamlandı'
                });
              }

              // ✅ Event tetikle
              eventManager.emit(Events.MATCH_UPDATED, {
                matchId: match.id,
                timestamp: Date.now()
              });

              Alert.alert(
                '✅ Başarılı!',
                'Puanlamalarınız kaydedildi. Teşekkür ederiz!',
                [
                  {
                    text: 'Tamam',
                    onPress: () => NavigationService.goBack()
                  }
                ]
              );
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
    if (!player) return 'Oyuncu';
    return `${player.name} ${player.surname}`;
  };

  const getPlayerTeam = (playerId: string): 1 | 2 | 0 => {
    if (match?.team1PlayerIds?.includes(playerId)) return 1;
    if (match?.team2PlayerIds?.includes(playerId)) return 2;
    return 0;
  };

  const getRatingForPlayer = (playerId: string): number => {
    const rating = ratings.find(r => r.playerId === playerId);
    return rating?.rating || 0;
  };

  const getRatedCount = (): number => {
    return ratings.filter(r => r.rating > 0).length;
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
  const ratedCount = getRatedCount();
  const progress = allPlayers.length > 0 ? (ratedCount / allPlayers.length) * 100 : 0;

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
          <Text style={styles.headerTitle}>Oyuncu Puanlama</Text>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#16a34a"
            colors={['#16a34a']}
          />
        }
      >
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressInfo}>
              <TrendingUp size={20} color={sportColor} strokeWidth={2} />
              <Text style={styles.progressTitle}>İlerleme</Text>
            </View>
            <Text style={styles.progressCount}>
              {ratedCount}/{allPlayers.length}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${progress}%`, backgroundColor: sportColor }
              ]}
            />
          </View>

          <Text style={styles.progressText}>
            {ratedCount === allPlayers.length
              ? '✅ Tüm oyuncuları puanladınız!'
              : `${allPlayers.length - ratedCount} oyuncu daha puanlanmalı`
            }
          </Text>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={18} color="#2563EB" strokeWidth={2} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerTitle}>Puanlama Sistemi</Text>
            <Text style={styles.infoBannerText}>
              • Takım arkadaşlarınızı 1-5 yıldız ile puanlayın{'\n'}
              • En yüksek ortalama puan alan oyuncu MVP olacak{'\n'}
              • Puanlamalarınız anonim kalacak{'\n'}
              • Tüm oyuncuları puanlamalısınız
            </Text>
          </View>
        </View>

        {/* MVP Preview (if calculated) */}
        {mvpPlayer && averageRatings[mvpPlayer] && (
          <View style={styles.mvpCard}>
            <View style={styles.mvpHeader}>
              <Crown size={24} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.mvpTitle}>Şu Anki MVP</Text>
            </View>

            <View style={styles.mvpContent}>
              <Text style={styles.mvpPlayerName}>
                {getPlayerName(mvpPlayer)}
              </Text>
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
          <Text style={styles.sectionTitle}>
            Oyuncuları Puanlayın ({allPlayers.length})
          </Text>

          <View style={styles.playersList}>
            {allPlayers.map((player, index) => {
              const team = getPlayerTeam(player.id!);
              const teamColor = team === 1 ? sportColor : '#DC2626';
              const currentRating = getRatingForPlayer(player.id!);
              const avgRating = averageRatings[player.id!];

              return (
                <View key={player.id} style={styles.playerItem}>
                  <View style={styles.playerHeader}>
                    <View style={styles.playerLeft}>
                      <View style={[styles.playerNumber, { backgroundColor: teamColor + '20' }]}>
                        <Text style={[styles.playerNumberText, { color: teamColor }]}>
                          {index + 1}
                        </Text>
                      </View>

                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>
                          {player.name} {player.surname}
                        </Text>
                        <View style={styles.playerMeta}>
                          <View style={[styles.teamBadge, { backgroundColor: teamColor + '20' }]}>
                            <Text style={[styles.teamBadgeText, { color: teamColor }]}>
                              Takım {team}
                            </Text>
                          </View>
                          {avgRating && (
                            <View style={styles.avgBadge}>
                              <Star size={12} color="#F59E0B" fill="#F59E0B" strokeWidth={2} />
                              <Text style={styles.avgText}>
                                {avgRating.avg.toFixed(1)}
                              </Text>
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
                        onPress={() => handleRatingChange(player.id!, star)}
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
                              currentRating === 2 ? '👌 Fena değil' :
                                '✓ Puanlandı'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats Summary */}
        {ratedCount > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Puanlama Özeti</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Puanlanan Oyuncu</Text>
              <Text style={styles.summaryValue}>{ratedCount}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ortalama Puan</Text>
              <Text style={styles.summaryValue}>
                {(ratings.reduce((sum, r) => sum + r.rating, 0) / ratedCount).toFixed(1)}⭐
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>5 Yıldız Verilen</Text>
              <Text style={styles.summaryValue}>
                {ratings.filter(r => r.rating === 5).length}
              </Text>
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
                  : `${allPlayers.length - ratedCount} Oyuncu Daha`
                }
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  progressCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  infoBannerContent: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 6,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  mvpCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mvpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  mvpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
  },
  mvpContent: {
    alignItems: 'center',
  },
  mvpPlayerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  mvpRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mvpRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  playersList: {
    gap: 12,
  },
  playerItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  playerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  playerNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teamBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  avgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  avgText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350F',
  },
  mvpBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
  },
  ratingFeedbackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});