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
} from 'react-native';
import {
  ChevronLeft,
  Save,
  Trophy,
  Target,
  Users,
  Info,
  Minus,
  Plus,
  AlertCircle,
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

export const ScoreEntryScreen: React.FC = () => {
  const route: any = useRoute();
  const { user } = useAppContext();
  const navigation = useNavigationContext();
  const matchId = route.params?.matchId;

  const [match, setMatch] = useState<IMatch | null>(null);
  const [fixture, setFixture] = useState<IMatchFixture | null>(null);
  const [team1Players, setTeam1Players] = useState<IPlayer[]>([]);
  const [team2Players, setTeam2Players] = useState<IPlayer[]>([]);
  
  const [team1Score, setTeam1Score] = useState<string>('0');
  const [team2Score, setTeam2Score] = useState<string>('0');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      // Check if user is organizer
      const isOrganizer = matchData.organizerPlayerIds?.includes(user.id);
      if (!isOrganizer) {
        Alert.alert('Hata', 'Bu işlem için yetkiniz yok');
        navigation.goBack();
        return;
      }

      // Check if teams are built
      if (!matchData.team1PlayerIds || !matchData.team2PlayerIds) {
        Alert.alert('Uyarı', 'Önce takımlar oluşturulmalı');
        navigation.goBack();
        return;
      }

      setMatch(matchData);

      // If score already exists, load it
      if (matchData.team1Score !== undefined && matchData.team2Score !== undefined) {
        setTeam1Score(matchData.team1Score.toString());
        setTeam2Score(matchData.team2Score.toString());
      }

      // Get fixture
      const fixtureData = await matchFixtureService.getById(matchData.fixtureId);
      setFixture(fixtureData);

      // Load team players
      if (matchData.team1PlayerIds.length > 0) {
        const players = await playerService.getPlayersByIds(matchData.team1PlayerIds);
        setTeam1Players(players);
      }

      if (matchData.team2PlayerIds.length > 0) {
        const players = await playerService.getPlayersByIds(matchData.team2PlayerIds);
        setTeam2Players(players);
      }

    } catch (error) {
      console.error('Error loading match:', error);
      Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = (team: 1 | 2) => {
    if (team === 1) {
      const current = parseInt(team1Score) || 0;
      setTeam1Score((current + 1).toString());
    } else {
      const current = parseInt(team2Score) || 0;
      setTeam2Score((current + 1).toString());
    }
  };

  const handleDecrement = (team: 1 | 2) => {
    if (team === 1) {
      const current = parseInt(team1Score) || 0;
      if (current > 0) {
        setTeam1Score((current - 1).toString());
      }
    } else {
      const current = parseInt(team2Score) || 0;
      if (current > 0) {
        setTeam2Score((current - 1).toString());
      }
    }
  };

  const handleScoreChange = (team: 1 | 2, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (team === 1) {
      setTeam1Score(numericValue);
    } else {
      setTeam2Score(numericValue);
    }
  };

  const handleSaveScore = async () => {
    if (!match) return;

    // Validation
    const score1 = parseInt(team1Score);
    const score2 = parseInt(team2Score);

    if (isNaN(score1) || isNaN(score2)) {
      Alert.alert('Hata', 'Lütfen geçerli bir skor girin');
      return;
    }

    if (score1 < 0 || score2 < 0) {
      Alert.alert('Hata', 'Skor negatif olamaz');
      return;
    }

    if (score1 > 99 || score2 > 99) {
      Alert.alert('Hata', 'Skor çok yüksek');
      return;
    }

    const resultText = score1 > score2 
      ? 'Takım 1 Kazandı' 
      : score1 < score2 
        ? 'Takım 2 Kazandı' 
        : 'Berabere';

    Alert.alert(
      'Skoru Kaydet',
      `Final Skoru: ${score1} - ${score2}\n${resultText}\n\nKaydedilsin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaydet',
          onPress: async () => {
            try {
              setSaving(true);

              const success = await matchService.updateScore(
                match.id,
                score1,
                score2
              );

              if (success) {
                Alert.alert(
                  '✅ Başarılı!',
                  'Maç skoru kaydedildi. Şimdi oyuncular gol/asist girişi yapabilir.',
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
                Alert.alert('Hata', 'Skor kaydedilemedi');
              }
            } catch (error) {
              console.error('Error saving score:', error);
              Alert.alert('Hata', 'Skor kaydedilirken bir hata oluştu');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
  };

  const getWinnerTeam = () => {
    const score1 = parseInt(team1Score) || 0;
    const score2 = parseInt(team2Score) || 0;

    if (score1 > score2) return 1;
    if (score2 > score1) return 2;
    return 0; // Draw
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
  const winnerTeam = getWinnerTeam();

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
          <Text style={styles.headerTitle}>Skor Girişi</Text>
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
            <Text style={styles.infoBannerTitle}>Skor Girişi</Text>
            <Text style={styles.infoBannerText}>
              Final skorunu girin. Kaydedildikten sonra oyuncular gol/asist girişi yapabilir.
            </Text>
          </View>
        </View>

        {/* Score Entry */}
        <View style={styles.scoreSection}>
          {/* Team 1 */}
          <View style={styles.teamScoreCard}>
            <View style={styles.teamHeader}>
              <Trophy size={20} color={sportColor} strokeWidth={2} />
              <Text style={[styles.teamTitle, { color: sportColor }]}>
                Takım 1
              </Text>
              {winnerTeam === 1 && (
                <View style={[styles.winnerBadge, { backgroundColor: sportColor }]}>
                  <Text style={styles.winnerText}>Kazanan</Text>
                </View>
              )}
            </View>

            <View style={styles.teamInfo}>
              <Users size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.teamPlayerCount}>
                {team1Players.length} oyuncu
              </Text>
            </View>

            <View style={styles.scoreInputContainer}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => handleDecrement(1)}
                activeOpacity={0.7}
              >
                <Minus size={24} color={sportColor} strokeWidth={2.5} />
              </TouchableOpacity>

              <TextInput
                style={[styles.scoreInput, { borderColor: sportColor }]}
                value={team1Score}
                onChangeText={(value) => handleScoreChange(1, value)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />

              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => handleIncrement(1)}
                activeOpacity={0.7}
              >
                <Plus size={24} color={sportColor} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* VS Divider */}
          <View style={styles.vsDivider}>
            <View style={styles.vsCircle}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          </View>

          {/* Team 2 */}
          <View style={styles.teamScoreCard}>
            <View style={styles.teamHeader}>
              <Trophy size={20} color="#DC2626" strokeWidth={2} />
              <Text style={[styles.teamTitle, { color: '#DC2626' }]}>
                Takım 2
              </Text>
              {winnerTeam === 2 && (
                <View style={[styles.winnerBadge, { backgroundColor: '#DC2626' }]}>
                  <Text style={styles.winnerText}>Kazanan</Text>
                </View>
              )}
            </View>

            <View style={styles.teamInfo}>
              <Users size={16} color="#6B7280" strokeWidth={2} />
              <Text style={styles.teamPlayerCount}>
                {team2Players.length} oyuncu
              </Text>
            </View>

            <View style={styles.scoreInputContainer}>
              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => handleDecrement(2)}
                activeOpacity={0.7}
              >
                <Minus size={24} color="#DC2626" strokeWidth={2.5} />
              </TouchableOpacity>

              <TextInput
                style={[styles.scoreInput, { borderColor: '#DC2626' }]}
                value={team2Score}
                onChangeText={(value) => handleScoreChange(2, value)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
              />

              <TouchableOpacity
                style={styles.scoreButton}
                onPress={() => handleIncrement(2)}
                activeOpacity={0.7}
              >
                <Plus size={24} color="#DC2626" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Result Preview */}
        <View style={styles.resultPreview}>
          <Target size={20} color="#6B7280" strokeWidth={2} />
          <Text style={styles.resultPreviewLabel}>Sonuç:</Text>
          <Text style={styles.resultPreviewText}>
            {winnerTeam === 0 
              ? 'Berabere' 
              : `Takım ${winnerTeam} Kazandı`
            }
          </Text>
        </View>

        {/* Score Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Maç Özeti</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Final Skoru</Text>
            <Text style={styles.summaryValue}>
              {team1Score} - {team2Score}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Takım 1</Text>
            <Text style={styles.summaryValue}>{team1Players.length} oyuncu</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Takım 2</Text>
            <Text style={styles.summaryValue}>{team2Players.length} oyuncu</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Toplam Gol</Text>
            <Text style={styles.summaryValue}>
              {(parseInt(team1Score) || 0) + (parseInt(team2Score) || 0)}
            </Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.nextStepsCard}>
          <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />
          <View style={styles.nextStepsContent}>
            <Text style={styles.nextStepsTitle}>Sonraki Adımlar</Text>
            <Text style={styles.nextStepsText}>
              • Skor kaydedildikten sonra oyuncular gol/asist girebilir{'\n'}
              • Oyuncular birbirlerini puanlayabilir{'\n'}
              • En yüksek puanlı oyuncu MVP olacak{'\n'}
              • Organizatör tüm verileri onaylayacak
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: sportColor }]}
          onPress={handleSaveScore}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Save size={20} color="white" strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>Skoru Kaydet</Text>
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
    marginBottom: 4,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  scoreSection: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 20,
  },
  teamScoreCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  winnerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winnerText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  teamPlayerCount: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  scoreButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreInput: {
    width: 100,
    height: 80,
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1F2937',
    borderWidth: 3,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
  },
  vsDivider: {
    alignItems: 'center',
    marginVertical: 8,
  },
  vsCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  vsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
  },
  resultPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  resultPreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  resultPreviewText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
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
  nextStepsCard: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
  },
  nextStepsContent: {
    flex: 1,
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#78350F',
    marginBottom: 6,
  },
  nextStepsText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
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
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});