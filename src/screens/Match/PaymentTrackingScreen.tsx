// src/screens/Match/PaymentTrackingScreen.tsx
// 💰 PAYMENT TRACKING - EKTEKİ IMatch type + MatchService

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
  Share,
  Clipboard,
} from 'react-native';
import {
  ChevronLeft,
  DollarSign,
  Check,
  Clock,
  Copy,
  Share2,
  CheckCircle,
  Info,
  CreditCard,
  TrendingUp,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { IMatch, SportType, MatchStatus } from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { PlayerService } from '../../services/serviceLayer/playerService';
import { NavigationService } from '../../navigation';
import { eventManager, Events } from '../../utils';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { getSportBackgroundColor, getSportEmoji } from '../../utils/theme';

// Sport helpers

export const PaymentTrackingScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAuth();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

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

      const result = await MatchService.getMatch(matchId);
      
      if (!result.success || !result.data) {
        Alert.alert('Hata', 'Maç bulunamadı');
        NavigationService.goBack();
        return;
      }

      const matchData = result.data;

      // Check organizer permission
      if (!matchData.permissions.organizers.includes(user.id)) {
        Alert.alert('Hata', 'Sadece organizatörler ödeme takibi yapabilir');
        NavigationService.goBack();
        return;
      }

      setMatch(matchData);

      // Load player details
      if (matchData.payments && matchData.payments.length > 0) {
        const playerIds = matchData.payments.map(p => p.playerId);
        
        const playerDetailsPromises = playerIds.map(async (playerId) => {
          const playerResult = await PlayerService.getPlayer(playerId);
          return playerResult.success && playerResult.data ? playerResult.data : null;
        });

        const players = (await Promise.all(playerDetailsPromises)).filter(p => p !== null);
        setAllPlayers(players);
      }

    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu');
      NavigationService.goBack();
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
    if (!match) return;

    const player = allPlayers.find(p => p.id === playerId);
    const playerName = player ? `${player.name} ${player.surname}` : 'Oyuncu';

    Alert.alert(
      currentStatus ? '❌ Ödemeyi İptal Et' : '✅ Ödeme Aldım',
      currentStatus 
        ? `${playerName} için ödeme "ödenmedi" olarak işaretlenecek.` 
        : `${playerName}'dan ödeme aldınız mı?\n\nÖdeme "ödendi" olarak kaydedilecek.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: currentStatus ? 'İptal Et' : 'Ödeme Aldım',
          style: currentStatus ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setSaving(true);

              const result = await MatchService.updatePaymentStatus(
                matchId,
                playerId,
                !currentStatus,
                user.id
              );

              if (result.success) {
                await loadData();
                Alert.alert(
                  '✅ Güncellendi', 
                  currentStatus ? 'Ödeme iptal edildi' : `${playerName} için ödeme kaydedildi`
                );
              } else {
                Alert.alert('Hata', result.error?.message || 'Ödeme güncellenemedi');
              }
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

    const unpaidPlayers = match.payments?.filter(p => !p.paid) || [];

    if (unpaidPlayers.length === 0) {
      Alert.alert('Bilgi', 'Tüm ödemeler zaten alınmış');
      return;
    }

    const totalAmount = unpaidPlayers.reduce((sum, p) => sum + p.amount, 0);

    Alert.alert(
      '✅ Tüm Ödemeleri Onayla',
      `${unpaidPlayers.length} oyuncunun ödemesini aldınız mı?\n\nToplam: ${totalAmount} ₺`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tümünü Onayla',
          onPress: async () => {
            try {
              setSaving(true);

              for (const payment of unpaidPlayers) {
                await MatchService.updatePaymentStatus(
                  matchId,
                  payment.playerId,
                  true,
                  user!.id
                );
              }

              Alert.alert('✅ Tamamlandı!', 'Tüm ödemeler kaydedildi');
              await loadData();
            } catch (error) {
              console.error('Error marking all paid:', error);
              Alert.alert('Hata', 'Ödemeler kaydedilirken bir hata oluştu');
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

    const allPaid = match.payments?.every(p => p.paid) || false;

    if (!allPaid) {
      const unpaidCount = match.payments?.filter(p => !p.paid).length || 0;
      Alert.alert(
        '⚠️ Uyarı', 
        `${unpaidCount} oyuncunun ödemesi henüz alınmadı.\n\nTüm ödemeler alınmadan maç tamamlanamaz.`
      );
      return;
    }

    if (!match.score) {
      Alert.alert('⚠️ Uyarı', 'Önce skor girilmeli');
      return;
    }

    const totalCollected = match.payments?.reduce((sum, p) => p.paid ? sum + p.amount : sum, 0) || 0;

    Alert.alert(
      '🎉 Maçı Tamamla',
      `Toplam ${totalCollected} ₺ tahsil edildi\n\n✅ İstatistikler kaydedilecek\n🏆 Puan durumu güncellenecek\n⭐ MVP belirlenecek\n\nBu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tamamla',
          onPress: async () => {
            try {
              setSaving(true);

              const result = await MatchService.completeMatch(matchId);

              if (result.success) {
                eventManager.emit(Events.MATCH_COMPLETED, {
                  matchId,
                  timestamp: Date.now()
                });

                Alert.alert(
                  '🎉 Tebrikler!',
                  'Maç başarıyla tamamlandı!',
                  [{ text: 'Tamam', onPress: () => NavigationService.goBack() }]
                );
              } else {
                Alert.alert('Hata', result.error?.message || 'Maç tamamlanamadı');
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
    if (!match?.venue?.payment?.iban) {
      Alert.alert('Bilgi', 'IBAN bilgisi yok');
      return;
    }

    Clipboard.setString(match.venue.payment.iban);
    Alert.alert('✅ Kopyalandı', 'IBAN panoya kopyalandı');
  };

  const handleSharePaymentInfo = async () => {
    if (!match || !match.venue) return;

    const { iban = '', accountName = '' } = match.venue.payment || {};
    const amount = match.venue.pricePerPlayer || 0;

    const message = `
🏆 ${match.title}
💰 Ödeme Bilgileri

Ad Soyad: ${accountName}
IBAN: ${iban}
Tutar: ${amount} ₺

⚠️ Açıklama kısmına adınızı yazın
    `.trim();

    try {
      await Share.share({ message, title: 'Ödeme Bilgileri' });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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
  
  const payments = match.payments || [];
  const paidCount = payments.filter(p => p.paid).length;
  const unpaidCount = payments.length - paidCount;
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const collectedAmount = payments.filter(p => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const progress = payments.length > 0 ? (paidCount / payments.length) * 100 : 0;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Ödeme Takibi"
        subtitle={`${sportEmoji} ${match.title}`}
        showBack={true}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <DollarSign size={24} color={sportColor} strokeWidth={2} />
            <Text style={styles.summaryTitle}>Ödeme Özeti</Text>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.summaryStatItem}>
              <Text style={styles.summaryStatValue}>{paidCount}/{payments.length}</Text>
              <Text style={styles.summaryStatLabel}>Alındı</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatValue, { color: sportColor }]}>
                {collectedAmount} ₺
              </Text>
              <Text style={styles.summaryStatLabel}>Toplanan</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryStatItem}>
              <Text style={[styles.summaryStatValue, { color: '#DC2626' }]}>
                {totalAmount - collectedAmount} ₺
              </Text>
              <Text style={styles.summaryStatLabel}>Bekleyen</Text>
            </View>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: sportColor }]} />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}% Tahsil Edildi</Text>
          </View>
        </View>

        {/* Payment Info */}
        {match.venue?.payment && (
          <View style={styles.paymentInfoCard}>
            <View style={styles.paymentInfoHeader}>
              <CreditCard size={20} color="#2563EB" strokeWidth={2} />
              <Text style={styles.paymentInfoTitle}>Ödeme Bilgileri</Text>
            </View>

            <View style={styles.paymentInfoItem}>
              <Text style={styles.paymentInfoLabel}>Ad Soyad</Text>
              <Text style={styles.paymentInfoValue}>{match.venue.payment.accountName}</Text>
            </View>

            <View style={styles.paymentInfoItem}>
              <Text style={styles.paymentInfoLabel}>IBAN</Text>
              <View style={styles.ibanRow}>
                <Text style={styles.ibanText}>{match.venue.payment.iban}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={handleCopyIBAN} activeOpacity={0.7}>
                  <Copy size={16} color={sportColor} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.paymentInfoItem}>
              <Text style={styles.paymentInfoLabel}>Kişi Başı</Text>
              <Text style={[styles.paymentInfoValue, { color: sportColor, fontWeight: '700' }]}>
                {match.venue.pricePerPlayer} ₺
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: sportColor }]}
              onPress={handleSharePaymentInfo}
              activeOpacity={0.7}
            >
              <Share2 size={16} color="white" strokeWidth={2} />
              <Text style={styles.shareButtonText}>Bilgileri Paylaş</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        {unpaidCount > 0 && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: sportColor }]}
              onPress={handleMarkAllPaid}
              disabled={saving}
              activeOpacity={0.7}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <CheckCircle size={18} color="white" strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Tümünü Al ({unpaidCount})</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoBanner}>
          <Info size={18} color="#2563EB" strokeWidth={2} />
          <View style={styles.infoBannerContent}>
            <Text style={styles.infoBannerText}>
              💰 Oyunculardan ödeme aldığınızda "Ödeme Al" butonuna tıklayın. Tüm ödemeler alındıktan sonra maçı tamamlayabilirsiniz.
            </Text>
          </View>
        </View>

        {/* Players List */}
        {payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Oyuncular ({payments.length})</Text>

            <View style={styles.playersList}>
              {payments.map((payment, index) => {
                const team = getPlayerTeam(payment.playerId);
                const teamColor = team === 1 ? sportColor : team === 2 ? '#DC2626' : '#6B7280';

                return (
                  <View key={payment.playerId} style={styles.playerItem}>
                    <View style={styles.playerLeft}>
                      <View style={[styles.playerNumber, { backgroundColor: teamColor + '20' }]}>
                        <Text style={[styles.playerNumberText, { color: teamColor }]}>{index + 1}</Text>
                      </View>

                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{getPlayerName(payment.playerId)}</Text>
                        <View style={styles.playerMeta}>
                          {team > 0 && (
                            <View style={[styles.teamBadge, { backgroundColor: teamColor + '20' }]}>
                              <Text style={[styles.teamBadgeText, { color: teamColor }]}>Takım {team}</Text>
                            </View>
                          )}
                          <Text style={styles.playerAmount}>{payment.amount} ₺</Text>
                        </View>
                        {payment.paid && payment.paidAt && (
                          <Text style={styles.playerDate}>
                            ✅ {new Date(payment.paidAt).toLocaleDateString('tr-TR', {
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
                      style={[styles.statusButton, payment.paid ? styles.statusButtonPaid : styles.statusButtonUnpaid]}
                      onPress={() => handleTogglePayment(payment.playerId, payment.paid)}
                      disabled={saving}
                      activeOpacity={0.7}
                    >
                      {payment.paid ? (
                        <>
                          <CheckCircle size={18} color="white" strokeWidth={2} />
                          <Text style={styles.statusButtonText}>Alındı</Text>
                        </>
                      ) : (
                        <>
                          <Clock size={18} color="white" strokeWidth={2} />
                          <Text style={styles.statusButtonText}>Ödeme Al</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>İstatistikler</Text>
          <View style={styles.statsRow}>
            <View style={styles.statsItem}>
              <CheckCircle size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.statsValue}>{paidCount}</Text>
              <Text style={styles.statsLabel}>Alındı</Text>
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

      {/* Complete Button */}
      {paidCount === payments.length && payments.length > 0 && (
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
                <Text style={styles.completeButtonText}>Maçı Tamamla 🎉</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280', fontWeight: '600' },
  content: { flex: 1 },
  summaryCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  summaryTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  summaryStatItem: { alignItems: 'center' },
  summaryStatValue: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  summaryStatLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  summaryDivider: { width: 1, height: '100%', backgroundColor: '#E5E7EB' },
  progressContainer: { gap: 8 },
  progressBarBg: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 5 },
  progressText: { fontSize: 13, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
  paymentInfoCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  paymentInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  paymentInfoTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  paymentInfoItem: { marginBottom: 12 },
  paymentInfoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  paymentInfoValue: { fontSize: 15, color: '#1F2937', fontWeight: '600' },
  ibanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  ibanText: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
  copyButton: { padding: 8 },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingVertical: 12, borderRadius: 8 },
  shareButtonText: { fontSize: 14, fontWeight: '700', color: 'white' },
  actionButtons: { paddingHorizontal: 16, marginTop: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  actionButtonText: { fontSize: 15, fontWeight: '700', color: 'white' },
  infoBanner: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16, padding: 14, backgroundColor: '#EFF6FF', borderRadius: 12 },
  infoBannerContent: { flex: 1 },
  infoBannerText: { fontSize: 13, color: '#1E40AF', lineHeight: 18 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  playersList: { backgroundColor: 'white', borderRadius: 12, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  playerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  playerNumber: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  playerNumberText: { fontSize: 14, fontWeight: '700' },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  playerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  teamBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  teamBadgeText: { fontSize: 11, fontWeight: '700' },
  playerAmount: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  playerDate: { fontSize: 11, color: '#10B981', fontWeight: '500' },
  statusButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  statusButtonPaid: { backgroundColor: '#10B981' },
  statusButtonUnpaid: { backgroundColor: '#F59E0B' },
  statusButtonText: { fontSize: 12, fontWeight: '700', color: 'white' },
  statsCard: { marginHorizontal: 16, marginTop: 20, backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  statsTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statsItem: { alignItems: 'center', gap: 6 },
  statsValue: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  statsLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  bottomSpacing: { height: 20 },
  bottomAction: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  completeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  completeButtonText: { fontSize: 16, fontWeight: '700', color: 'white' },
});