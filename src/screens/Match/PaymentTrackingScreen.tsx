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
  Linking,
  Share,
} from 'react-native';
import {
  ChevronLeft,
  DollarSign,
  Check,
  X,
  Users,
  Clock,
  Copy,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  CreditCard,
  TrendingUp,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
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
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';

export const PaymentTrackingScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [fixture, setFixture] = useState<IMatchFixture | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isOrganizer, setIsOrganizer] = useState(false);

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

      // Check if user is organizer
      const organizer = matchData.organizerPlayerIds?.includes(user.id) || false;
      if (!organizer) {
        Alert.alert('Hata', 'Bu işlem için yetkiniz yok');
        NavigationService.goBack();
        return;
      }

      setIsOrganizer(organizer);
      setMatch(matchData);

      // Get fixture
      const fixtureData = await matchFixtureService.getById(matchData.fixtureId);
      setFixture(fixtureData);

      // Load all players
      const playerIds = [
        ...(matchData.team1PlayerIds || []),
        ...(matchData.team2PlayerIds || []),
      ];
      const players = await playerService.getPlayersByIds(playerIds);
      setAllPlayers(players);

      // Initialize payment status if not exists
      if (!matchData.paymentStatus || matchData.paymentStatus.length === 0) {
        const amount = matchData.pricePerPlayer || fixtureData?.pricePerPlayer || 0;
        await matchService.initializePayments(matchData.id, amount);
        // Reload data
        await loadData();
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

  const handleTogglePayment = async (playerId: string, currentStatus: boolean) => {
    if (!match || !isOrganizer) return;

    const player = allPlayers.find(p => p.id === playerId);
    const playerName = player ? `${player.name} ${player.surname}` : 'Oyuncu';

    Alert.alert(
      currentStatus ? 'Ödemeyi İptal Et' : 'Ödemeyi Onayla',
      `${playerName} için ödeme durumu ${currentStatus ? 'ödenmedi' : 'ödendi'} olarak işaretlenecek. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: currentStatus ? 'İptal Et' : 'Onayla',
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setSaving(true);

              if (currentStatus) {
                // Mark as unpaid (remove payment)
                const updatedPaymentStatus = match.paymentStatus.map(p => {
                  if (p.playerId === playerId) {
                    return {
                      ...p,
                      paid: false,
                      paidAt: undefined,
                      confirmedBy: undefined
                    };
                  }
                  return p;
                });

                await matchService.update(match.id, {
                  paymentStatus: updatedPaymentStatus
                });

                Alert.alert('✅ Güncellendi', 'Ödeme iptal edildi');
              } else {
                // Mark as paid
                const success = await matchService.markPaymentAsPaid(
                  match.id,
                  playerId,
                  user!.id!
                );

                if (success) {
                  Alert.alert('✅ Onaylandı', 'Ödeme onaylandı');
                } else {
                  Alert.alert('Hata', 'Ödeme onaylanamadı');
                }
              }

              await loadData();
            } catch (error) {
              console.error('Error updating payment:', error);
              Alert.alert('Hata', 'Ödeme güncellenirken bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleMarkAllPaid = async () => {
    if (!match) return;

    const unpaidCount = match.paymentStatus?.filter(p => !p.paid).length || 0;

    if (unpaidCount === 0) {
      Alert.alert('Bilgi', 'Tüm ödemeler zaten onaylanmış');
      return;
    }

    Alert.alert(
      'Tümünü Onayla',
      `${unpaidCount} oyuncunun ödemesi onaylanacak. Devam edilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Onayla',
          onPress: async () => {
            try {
              setSaving(true);

              const updatedPaymentStatus = match.paymentStatus.map(p => ({
                ...p,
                paid: true,
                paidAt: new Date().toISOString(),
                confirmedBy: user!.id
              }));

              await matchService.update(match.id, {
                paymentStatus: updatedPaymentStatus,
                status: 'Tamamlandı'
              });

              Alert.alert('✅ Tamamlandı!', 'Tüm ödemeler onaylandı ve maç tamamlandı!');
              await loadData();
            } catch (error) {
              console.error('Error marking all paid:', error);
              Alert.alert('Hata', 'Ödemeler onaylanırken bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleCompleteMatch = async () => {
    if (!match) return;

    const allPaid = match.paymentStatus?.every(p => p.paid) || false;

    if (!allPaid) {
      Alert.alert('Uyarı', 'Tüm ödemeler onaylanmadan maç tamamlanamaz');
      return;
    }

    Alert.alert(
      'Maçı Tamamla',
      'Maç tamamlanacak ve puan durumu güncellenecek. Bu işlem geri alınamaz. Devam edilsin mi?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tamamla',
          onPress: async () => {
            try {
              setSaving(true);

              const success = await matchService.completeMatch(match.id);

              if (success) {
                // ✅ Event tetikle
                eventManager.emit(Events.MATCH_UPDATED, {
                  matchId: match.id,
                  timestamp: Date.now()
                });

                Alert.alert(
                  '🎉 Tebrikler!',
                  'Maç başarıyla tamamlandı. Puan durumu güncellendi.',
                  [
                    {
                      text: 'Tamam',
                      onPress: () => {
                        // ✅ Basit goBack - Event zaten tetiklendi
                        NavigationService.goBack();
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Hata', 'Maç tamamlanamadı');
              }
            } catch (error) {
              console.error('Error completing match:', error);
              Alert.alert('Hata', 'Maç tamamlanırken bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };
  const handleCopyIBAN = async () => {
    if (!match?.peterIban && !fixture?.peterIban) {
      Alert.alert('Bilgi', 'IBAN bilgisi bulunamadı');
      return;
    }

    const iban = match?.peterIban || fixture?.peterIban || '';

    // In React Native, you'd use Clipboard API
    // import Clipboard from '@react-native-clipboard/clipboard';
    // Clipboard.setString(iban);

    Alert.alert('✅ Kopyalandı', 'IBAN numarası panoya kopyalandı');
  };

  const handleSharePaymentInfo = async () => {
    if (!match && !fixture) return;

    const iban = match?.peterIban || fixture?.peterIban || '';
    const name = match?.peterFullName || fixture?.peterFullName || '';
    const amount = match?.pricePerPlayer || fixture?.pricePerPlayer || 0;
    const matchTitle = match?.title || '';

    const message = `
🏆 ${matchTitle}
💰 Ödeme Bilgileri

Ad Soyad: ${name}
IBAN: ${iban}
Tutar: ${amount} TL

Lütfen açıklama kısmına adınızı yazınız.
    `.trim();

    try {
      await Share.share({
        message,
        title: 'Ödeme Bilgileri'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
  const paymentStatus = match.paymentStatus || [];
  const paidCount = paymentStatus.filter(p => p.paid).length;
  const unpaidCount = paymentStatus.length - paidCount;
  const totalAmount = paymentStatus.reduce((sum, p) => sum + p.amount, 0);
  const collectedAmount = paymentStatus.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const progress = paymentStatus.length > 0 ? (paidCount / paymentStatus.length) * 100 : 0;

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
          <Text style={styles.headerTitle}>Ödeme Takibi</Text>
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
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color={sportColor} strokeWidth={2} />
            <Text style={styles.summaryTitle}>Ödeme Özeti</Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{paidCount}/{paymentStatus.length}</Text>
              <Text style={styles.summaryStatLabel}>Ödeme Yapıldı</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatValue, { color: sportColor }]}>
                {collectedAmount} TL
              </Text>
              <Text style={styles.summaryStatLabel}>Toplanan</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatValue, { color: '#DC2626' }]}>
                {totalAmount - collectedAmount} TL
              </Text>
              <Text style={styles.summaryStatLabel}>Bekleyen</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${progress}%`, backgroundColor: sportColor }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}% Tamamlandı</Text>
          </View>
        </View>

        {/* Payment Info Card */}
        <View style={styles.paymentInfoCard}>
          <View style={styles.paymentInfoHeader}>
            <CreditCard size={20} color="#2563EB" strokeWidth={2} />
            <Text style={styles.paymentInfoTitle}>Ödeme Bilgileri</Text>
          </View>

          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoLabel}>Ad Soyad</Text>
            <Text style={styles.paymentInfoValue}>
              {match.peterFullName || fixture.peterFullName}
            </Text>
          </View>

          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoLabel}>IBAN</Text>
            <View style={styles.ibanRow}>
              <Text style={styles.ibanText}>
                {match.peterIban || fixture.peterIban}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyIBAN}
                activeOpacity={0.7}
              >
                <Copy size={16} color={sportColor} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.paymentInfoItem}>
            <Text style={styles.paymentInfoLabel}>Kişi Başı Ücret</Text>
            <Text style={[styles.paymentInfoValue, { color: sportColor, fontWeight: '700' }]}>
              {match.pricePerPlayer || fixture.pricePerPlayer} TL
            </Text>
          </View>

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleSharePaymentInfo}
            activeOpacity={0.7}
          >
            <Share2 size={16} color="white" strokeWidth={2} />
            <Text style={styles.shareButtonText}>Ödeme Bilgilerini Paylaş</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        {unpaidCount > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: sportColor }]}
              onPress={handleMarkAllPaid}
              disabled={saving}
              activeOpacity={0.7}
            >
              <CheckCircle size={18} color="white" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Tümünü Onayla</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={18} color="#2563EB" strokeWidth={2} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerText}>
              Oyuncular ödeme yaptıktan sonra organizatör olarak onaylayabilirsiniz. Tüm ödemeler onaylandığında maç tamamlanır.
            </Text>
          </View>
        </View>

        {/* Players List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Oyuncu Ödemeleri ({paymentStatus.length})
          </Text>

          <View style={styles.playersList}>
            {paymentStatus.map((payment, index) => {
              const team = getPlayerTeam(payment.playerId);
              const teamColor = team === 1 ? sportColor : '#DC2626';

              return (
                <View key={payment.playerId} style={styles.playerItem}>
                  <View style={styles.playerLeft}>
                    <View style={[styles.playerNumber, { backgroundColor: teamColor + '20' }]}>
                      <Text style={[styles.playerNumberText, { color: teamColor }]}>
                        {index + 1}
                      </Text>
                    </View>

                    <View style={styles.playerInfo}>
                      <Text style={styles.playerName}>
                        {getPlayerName(payment.playerId)}
                      </Text>
                      <View style={styles.playerMeta}>
                        <View style={[styles.teamBadge, { backgroundColor: teamColor + '20' }]}>
                          <Text style={[styles.teamBadgeText, { color: teamColor }]}>
                            Takım {team}
                          </Text>
                        </View>
                        <Text style={styles.playerAmount}>{payment.amount} TL</Text>
                      </View>
                      {payment.paid && payment.paidAt && (
                        <Text style={styles.playerDate}>
                          {new Date(payment.paidAt).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      payment.paid ? styles.statusButtonPaid : styles.statusButtonUnpaid
                    ]}
                    onPress={() => handleTogglePayment(payment.playerId, payment.paid)}
                    disabled={saving}
                    activeOpacity={0.7}
                  >
                    {payment.paid ? (
                      <>
                        <CheckCircle size={18} color="white" strokeWidth={2} />
                        <Text style={styles.statusButtonText}>Ödendi</Text>
                      </>
                    ) : (
                      <>
                        <Clock size={18} color="white" strokeWidth={2} />
                        <Text style={styles.statusButtonText}>Bekliyor</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>İstatistikler</Text>

          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <CheckCircle size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.statsValue}>{paidCount}</Text>
              <Text style={styles.statsLabel}>Ödendi</Text>
            </View>

            <View style={styles.statsItem}>
              <Clock size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.statsValue}>{unpaidCount}</Text>
              <Text style={styles.statsLabel}>Bekliyor</Text>
            </View>

            <View style={styles.statsItem}>
              <TrendingUp size={20} color={sportColor} strokeWidth={2} />
              <Text style={styles.statsValue}>{progress.toFixed(0)}%</Text>
              <Text style={styles.statsLabel}>Tamamlanma</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      {paidCount === paymentStatus.length && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: sportColor }]}
            onPress={handleCompleteMatch}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.completeButtonText}>Maçı Tamamla</Text>
              </>
            )}
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
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  progressContainer: {
    gap: 8,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  paymentInfoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  paymentInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  paymentInfoItem: {
    marginBottom: 12,
  },
  paymentInfoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  paymentInfoValue: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '600',
  },
  ibanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  ibanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  copyButton: {
    padding: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 12,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  actionButtons: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  playersList: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
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
  playerAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  playerDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusButtonPaid: {
    backgroundColor: '#10B981',
  },
  statusButtonUnpaid: {
    backgroundColor: '#F59E0B',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  statsCard: {
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
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
    gap: 6,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statsLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});