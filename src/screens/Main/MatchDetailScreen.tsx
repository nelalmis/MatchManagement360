// ============================================
// Match Detail Screen
// ============================================

import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Home, Calendar, MapPin, Users, CreditCard } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { IMatch } from '../../types/types';
import { useAppContext } from '../../context/AppContext';
import { PageHeader } from '../../components/PageHeader';

// Parametre tipi
interface MatchDetailRouteParams {
  match: IMatch
}

export const MatchDetailScreen: React.FC = () => {
  const { setCurrentScreen } = useAppContext();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  const match = (route.params as MatchDetailRouteParams)?.match;
  const selectedMatch = match;
  if (!selectedMatch) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <PageHeader title='Maç Detayı' onPressMenuButton={(screenName) =>     navigation.navigate('matches')} />

      {/* Match Detail Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.detailCard}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.matchTitle}>{selectedMatch.title}</Text>
            <View style={[
              styles.statusBadge,
              selectedMatch.status === 'Tamamlandı' ? styles.statusConfirmed : styles.statusPending
            ]}>
              <Text style={[
                styles.statusText,
                selectedMatch.status === 'Planlandı' ? styles.statusTextConfirmed : styles.statusTextPending
              ]}>
                {selectedMatch.status === 'Tamamlandı' ? 'Onaylandı' : 'Organize Ediliyor'}
              </Text>
            </View>
          </View>

          {/* Match Details */}
          <View style={styles.detailsContainer}>
            {/* Date & Time */}
            <View style={styles.detailRow}>
              <Calendar color="#16a34a" size={20} style={styles.icon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Tarih ve Saat</Text>
                <Text style={styles.detailValue}>
                  {selectedMatch.matchStartTime.toDateString()}
                </Text>
              </View>
            </View>

            {/* Location */}
            <View style={styles.detailRow}>
              <MapPin color="#16a34a" size={20} style={styles.icon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Lokasyon</Text>
                <Text style={styles.detailValue}>{selectedMatch.location}</Text>
                <Text style={styles.detailSubtext}>{selectedMatch.location}</Text>
              </View>
            </View>

            {/* Participants */}
            <View style={styles.detailRow}>
              <Users color="#16a34a" size={20} style={styles.icon} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Katılımcılar</Text>
                <Text style={styles.detailValue}>
                  {10}/{10} Oyuncu
                </Text>
              </View>
            </View>

            {/* Price (if exists) */}
            {selectedMatch.pricePerPlayer && (
              <View style={styles.detailRow}>
                <CreditCard color="#16a34a" size={20} style={styles.icon} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Kişi Başı Ücret</Text>
                  <Text style={styles.detailValue}>{selectedMatch.pricePerPlayer} ₺</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#16a34a',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  matchTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusConfirmed: {
    backgroundColor: '#dcfce7',
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextConfirmed: {
    color: '#15803d',
  },
  statusTextPending: {
    color: '#a16207',
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  detailSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});
