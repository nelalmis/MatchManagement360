// src/screens/Match/PlayerPaymentScreen.tsx
// 💰 PLAYER PAYMENT - Oyuncu kendi ödeme durumunu yönetir

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
  Clipboard,
  Share,
} from 'react-native';
import {
  ChevronLeft,
  DollarSign,
  CheckCircle,
  Clock,
  Copy,
  Share2,
  AlertCircle,
  Info,
  CreditCard,
  XCircle,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { IMatch, SportType, MatchStatus } from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { NavigationService } from '../../navigation';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { getSportBackgroundColor, getSportEmoji } from '../../utils/theme';

export const PlayerPaymentScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAuth();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

      // Check if user is in match
      const isInMatch = matchData.payments?.some(p => p.playerId === user.id);
      if (!isInMatch) {
        Alert.alert('Hata', 'Bu maçta kayıtlı değilsiniz');
        NavigationService.goBack();
        return;
      }

      setMatch(matchData);

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

  const handleMarkAsPaid = async () => {
    if (!match || !user?.id) return;

    Alert.alert(
      '✅ Ödeme Yaptım',
      `${match.venue?.pricePerPlayer} TL ödemeyi yaptınız mı?\n\nÖdeme onayı organizatör tarafından kontrol edilecektir.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Ödeme Yaptım',
          onPress: async () => {
            try {
              setSubmitting(true);

              // ✅ Player marks payment as submitted (waiting for organizer confirmation)
              const result = await MatchService.submitPlayerPayment(matchId, user.id);

              if (result.success) {
                await loadData();
                Alert.alert(
                  '✅ Kaydedildi!',
                  'Ödeme bildirimi organizatöre gönderildi. Onay bekleniyor.'
                );
              } else {
                Alert.alert('Hata', result.error?.message || 'Ödeme bildirimi gönderilemedi');
              }
            } catch (error) {
              console.error('Error submitting payment:', error);
              Alert.alert('Hata', 'Ödeme bildirimi gönderilirken bir hata oluştu');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelPayment = async () => {
    if (!match || !user?.id) return;

    Alert.alert(
      '❌ Yanlış İşaretledim',
      'Ödeme bildirimi iptal edilecek. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);

              const result = await MatchService.cancelPlayerPayment(matchId, user.id);

              if (result.success) {
                await loadData();
                Alert.alert('✅ İptal Edildi', 'Ödeme bildirimi iptal edildi');
              } else {
                Alert.alert('Hata', result.error?.message || 'İptal edilemedi');
              }
            } catch (error) {
              console.error('Error canceling payment:', error);
              Alert.alert('Hata', 'İptal edilirken bir hata oluştu');
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  const handleCopyIBAN = () => {
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

  const userPayment = match.payments?.find(p => p.playerId === user?.id);

  if (!userPayment) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Ödeme Durumu"
          subtitle={`${sportEmoji} ${match.title}`}
          showBack={true}
          onLeftPress={() => NavigationService.goBack()}
        />
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color="#DC2626" strokeWidth={1.5} />
          <Text style={styles.errorText}>Ödeme bilgisi bulunamadı</Text>
        </View>
      </View>
    );
  }

  const isPaid = userPayment.paid;
  const isSubmitted = userPayment.paidAt && !userPayment.confirmedBy; // Player submitted but not confirmed by organizer

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Ödeme Durumu"
        subtitle={`${sportEmoji} ${match.title}`}
        showBack={true}
         onLeftPress={() => NavigationService.goBack()}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Status Card */}
        <View style={styles.statusCard}>
          {isPaid ? (
            // Confirmed by organizer
            <View style={styles.statusContent}>
              <View style={[styles.statusIcon, { backgroundColor: '#10B981' + '20' }]}>
                <CheckCircle size={48} color="#10B981" strokeWidth={2} />
              </View>
              <Text style={[styles.statusTitle, { color: '#10B981' }]}>
                Ödeme Onaylandı ✅
              </Text>
              <Text style={styles.statusSubtitle}>
                Ödemeniz organizatör tarafından onaylandı
              </Text>
              {userPayment.paidAt && (
                <Text style={styles.statusDate}>
                  Onay tarihi: {new Date(userPayment.paidAt).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          ) : isSubmitted ? (
            // Submitted but waiting for organizer confirmation
            <View style={styles.statusContent}>
              <View style={[styles.statusIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                <Clock size={48} color="#F59E0B" strokeWidth={2} />
              </View>
              <Text style={[styles.statusTitle, { color: '#F59E0B' }]}>
                Onay Bekleniyor ⏳
              </Text>
              <Text style={styles.statusSubtitle}>
                Ödeme bildirimi organizatöre gönderildi
              </Text>
              <Text style={styles.statusDate}>
                Bildirim tarihi: {new Date(userPayment?.paidAt || "").toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ) : (
            // Not paid yet
            <View style={styles.statusContent}>
              <View style={[styles.statusIcon, { backgroundColor: '#DC2626' + '20' }]}>
                <XCircle size={48} color="#DC2626" strokeWidth={2} />
              </View>
              <Text style={[styles.statusTitle, { color: '#DC2626' }]}>
                Ödeme Bekleniyor ⚠️
              </Text>
              <Text style={styles.statusSubtitle}>
                Henüz ödeme yapmadınız
              </Text>
            </View>
          )}
        </View>

        {/* Payment Info */}
        {match.venue?.payment && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>

            <View style={styles.paymentInfoCard}>
              <View style={styles.paymentInfoHeader}>
                <CreditCard size={20} color="#2563EB" strokeWidth={2} />
                <Text style={styles.paymentInfoTitle}>Banka Bilgileri</Text>
              </View>

              <View style={styles.paymentInfoItem}>
                <Text style={styles.paymentInfoLabel}>Ad Soyad</Text>
                <Text style={styles.paymentInfoValue}>{match.venue.payment.accountName}</Text>
              </View>

              <View style={styles.paymentInfoItem}>
                <Text style={styles.paymentInfoLabel}>IBAN</Text>
                <View style={styles.ibanRow}>
                  <Text style={styles.ibanText}>{match.venue.payment.iban}</Text>
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
                <Text style={styles.paymentInfoLabel}>Tutar</Text>
                <Text style={[styles.paymentInfoValue, styles.amountText, { color: sportColor }]}>
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
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Info size={20} color="#2563EB" strokeWidth={2} />
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>Nasıl Ödeme Yapılır?</Text>
            <Text style={styles.instructionsText}>
              1️⃣ Yukarıdaki IBAN'ı kopyalayın{'\n'}
              2️⃣ Banka uygulamanızdan havale/EFT yapın{'\n'}
              3️⃣ Açıklama kısmına adınızı yazın{'\n'}
              4️⃣ Ödemeyi yaptıktan sonra "Ödeme Yaptım" butonuna tıklayın{'\n'}
              5️⃣ Organizatör ödemenizi onaylayacak
            </Text>
          </View>
        </View>

        {/* Warning if submitted */}
        {isSubmitted && !isPaid && (
          <View style={styles.warningCard}>
            <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Yanlış İşaretlediyseniz</Text>
              <Text style={styles.warningText}>
                Eğer henüz ödeme yapmadıysanız, aşağıdaki butona tıklayarak bildirimi iptal edebilirsiniz.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        {isPaid ? (
          // Already confirmed - no action needed
          <View style={[styles.confirmedBadge, { backgroundColor: '#10B981' }]}>
            <CheckCircle size={20} color="white" strokeWidth={2.5} />
            <Text style={styles.confirmedText}>Ödemeniz Onaylandı</Text>
          </View>
        ) : isSubmitted ? (
          // Submitted but not confirmed - allow cancel
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: '#DC2626' }]}
            onPress={handleCancelPayment}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <XCircle size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.cancelButtonText}>Yanlış İşaretledim</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          // Not submitted - allow mark as paid
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: sportColor }]}
            onPress={handleMarkAsPaid}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <CheckCircle size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.submitButtonText}>Ödeme Yaptım ✅</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280', fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorText: { marginTop: 16, fontSize: 16, color: '#DC2626', fontWeight: '600', textAlign: 'center' },
  content: { flex: 1 },
  statusCard: { marginHorizontal: 16, marginTop: 16, backgroundColor: 'white', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  statusContent: { alignItems: 'center' },
  statusIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  statusTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  statusSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 8 },
  statusDate: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  paymentInfoCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  paymentInfoHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  paymentInfoTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  paymentInfoItem: { marginBottom: 12 },
  paymentInfoLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500', marginBottom: 4 },
  paymentInfoValue: { fontSize: 15, color: '#1F2937', fontWeight: '600' },
  amountText: { fontSize: 24, fontWeight: '700' },
  ibanRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8 },
  ibanText: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
  copyButton: { padding: 8 },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, paddingVertical: 12, borderRadius: 8 },
  shareButtonText: { fontSize: 14, fontWeight: '700', color: 'white' },
  instructionsCard: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 20, padding: 16, backgroundColor: '#EFF6FF', borderRadius: 12 },
  instructionsContent: { flex: 1 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', color: '#1E40AF', marginBottom: 8 },
  instructionsText: { fontSize: 13, color: '#1E40AF', lineHeight: 20 },
  warningCard: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginTop: 16, padding: 16, backgroundColor: '#FEF3C7', borderRadius: 12 },
  warningContent: { flex: 1 },
  warningTitle: { fontSize: 14, fontWeight: '700', color: '#78350F', marginBottom: 6 },
  warningText: { fontSize: 13, color: '#78350F', lineHeight: 18 },
  bottomSpacing: { height: 20 },
  bottomAction: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  confirmedBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  confirmedText: { fontSize: 16, fontWeight: '700', color: 'white' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitButtonText: { fontSize: 16, fontWeight: '700', color: 'white' },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 12 },
  cancelButtonText: { fontSize: 16, fontWeight: '700', color: 'white' },
});