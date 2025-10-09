// ============================================
// MatchesScreen.tsx
// ============================================

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Home, Calendar, MapPin, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { IMatch } from '../../types/types';
import { PageHeader } from '../../components/PageHeader';
import { matchService } from '../../services/matchService';
import { getAllMatchGroups } from '../../services/matchGroupServices';
import { useNavigationContext } from '../../context/NavigationContext';

export const MatchesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { setCurrentScreen, user } = useAppContext();
  const {headerTitle} = useNavigationContext();
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matches, setMatches] = useState<IMatch[]>([
    {
      id: 1,
      title: 'Çarşamba Maçı',
      matchStartTime: new Date(),
      matchEndTime: new Date(),
      location: 'Merkez Spor Kompleksi',
      peterIban: 'TR00 0000 0000 0000 0000 0000 00',
      matchOrganizationSetupId: 1,
      registrationTime: new Date(),
      registrationEndTime: new Date(),
      status: 'Planlandı'
    }
  ]);

  // Kullanım örneği.
  useEffect(() => {
    matchService.getPlayerMatches(user?.id).then(setMatches);
    console.log(JSON.stringify(getAllMatchGroups()));
  }, []);

  const openMatchDetail = (match: any) => {
    // Maç bilgilerini parametre olarak gönderiyoruz 👇
    navigation.navigate('matchDetail', { match });
  }
  const addMatch = (match: IMatch) => {
    setMatches([...matches, match]);
  };

  const updateMatch = (id: number, updatedMatch: Partial<IMatch>) => {
    setMatches(matches.map(m => m.id === id ? { ...m, ...updatedMatch } : m));
  };
  return (

    <View style={styles.container}>
      {/* Header */}
      <PageHeader title='Maç Organizasyonları' onPressMenuButton={(screenName) => setCurrentScreen(screenName)} />

      {/* Matches List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {matches.map((match) => (
          <TouchableOpacity
            key={match.id}
            onPress={() => {
              setSelectedMatch(match);
              openMatchDetail(match);
              setCurrentScreen('matchDetail');
            }}
            style={styles.matchCard}
          >
            <View style={styles.matchHeader}>
              <Text style={styles.matchName}>{match.title}</Text>
              <View style={[
                styles.statusBadge,
                match.status === 'Planlandı' ? styles.statusConfirmed : styles.statusPending
              ]}>
                <Text style={[
                  styles.statusText,
                  match.status === 'Tamamlandı' ? styles.statusTextConfirmed : styles.statusTextPending
                ]}>
                  {match.status === 'Ödeme Kontrolü' ? 'Onaylandı' : 'Organize Ediliyor'}
                </Text>
              </View>
            </View>

            <View style={styles.matchDetails}>
              <View style={styles.detailRow}>
                <Calendar color="#6b7280" size={16} />
                <Text style={styles.detailText}>
                  {match.matchStartTime.toLocaleDateString()}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <MapPin color="#6b7280" size={16} />
                <Text style={styles.detailText}>
                  {match.location} ({match.location})
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Users color="#6b7280" size={16} />
                <Text style={styles.detailText}>
                  {10}/10 Oyuncu
                </Text>
              </View>
            </View>

            {1 === 1 && (
              <View style={styles.periodicSection}>
                <Text style={styles.periodicText}>
                  🔄 {7}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
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
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
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
  matchDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  periodicSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  periodicText: {
    fontSize: 12,
    color: '#9333ea',
    fontWeight: '600',
  },
});

