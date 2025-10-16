import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import {
  X,
  Check,
  Calendar,
  Users,
  Trophy,
  Settings,
  AlertCircle,
  Search,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation/NavigationService';
import { useRoute, RouteProp } from '@react-navigation/native';
import {
  ILeague,
  IPlayer,
  SportType,
  SPORT_CONFIGS,
  getSportIcon,
  getSportColor,
} from '../../types/types';
import { leagueService } from '../../services/leagueService';
import { playerService } from '../../services/playerService';
import { EditLeagueRouteProp } from '../../navigation';

type TabType = 'general' | 'players' | 'permissions';


const SPORT_TYPES: SportType[] = [
  'Futbol',
  'Basketbol',
  'Voleybol',
  'Tenis',
  'Masa Tenisi',
  'Badminton',
];

export const EditLeagueScreen: React.FC = () => {
  const { user } = useAppContext();
  const route = useRoute<EditLeagueRouteProp>();
  const { leagueId } = route.params;

  const [league, setLeague] = useState<ILeague | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Player Search Modal
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  // Date Picker Modal
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    loadData();
  }, [leagueId]);

  const loadData = async () => {
    if (!leagueId) {
      Alert.alert('Hata', 'Lig ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);
      const [leagueData, playersData] = await Promise.all([
        leagueService.getById(leagueId),
        playerService.getAll(),
      ]);

      if (!leagueData) {
        Alert.alert('Hata', 'Lig bulunamadı');
        NavigationService.goBack();
        return;
      }

      setLeague(leagueData);
      setAllPlayers(playersData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLeague = async () => {
    if (!league) return;

    // Validations
    if (!league.title.trim()) {
      Alert.alert('Hata', 'Lig adı boş olamaz');
      return;
    }

    if (new Date(league.seasonStartDate) >= new Date(league.seasonEndDate)) {
      Alert.alert('Hata', 'Sezon bitiş tarihi başlangıç tarihinden sonra olmalı');
      return;
    }

    try {
      setSaving(true);
      await leagueService.update(league.id, league);
      
      Alert.alert('Başarılı', 'Lig başarıyla güncellendi', [
        { 
          text: 'Tamam', 
          onPress: () => {
            NavigationService.goBack();
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving league:', error);
      Alert.alert('Hata', 'Lig güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const addPlayer = (playerId: string) => {
    if (!league || league.playerIds.includes(playerId)) return;

    setLeague({
      ...league,
      playerIds: [...league.playerIds, playerId],
    });
    setShowPlayerSearch(false);
    setPlayerSearchQuery('');
  };

  const removePlayer = (playerId: string) => {
    if (!league) return;

    Alert.alert(
      'Oyuncu Çıkar',
      'Bu oyuncuyu ligden çıkarmak istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkar',
          style: 'destructive',
          onPress: () => {
            setLeague({
              ...league,
              playerIds: league.playerIds.filter(id => id !== playerId),
              premiumPlayerIds: league.premiumPlayerIds.filter(id => id !== playerId),
              directPlayerIds: league.directPlayerIds.filter(id => id !== playerId),
              teamBuildingAuthorityPlayerIds: league.teamBuildingAuthorityPlayerIds.filter(id => id !== playerId),
            });
          },
        },
      ]
    );
  };

  const togglePremiumPlayer = (playerId: string) => {
    if (!league) return;
    const isPremium = league.premiumPlayerIds.includes(playerId);
    
    setLeague({
      ...league,
      premiumPlayerIds: isPremium
        ? league.premiumPlayerIds.filter(id => id !== playerId)
        : [...league.premiumPlayerIds, playerId],
    });
  };

  const toggleDirectPlayer = (playerId: string) => {
    if (!league) return;
    const isDirect = league.directPlayerIds.includes(playerId);
    
    setLeague({
      ...league,
      directPlayerIds: isDirect
        ? league.directPlayerIds.filter(id => id !== playerId)
        : [...league.directPlayerIds, playerId],
    });
  };

  const toggleTeamBuildingAuthority = (playerId: string) => {
    if (!league) return;
    const hasAuthority = league.teamBuildingAuthorityPlayerIds.includes(playerId);
    
    setLeague({
      ...league,
      teamBuildingAuthorityPlayerIds: hasAuthority
        ? league.teamBuildingAuthorityPlayerIds.filter(id => id !== playerId)
        : [...league.teamBuildingAuthorityPlayerIds, playerId],
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading || !league) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Lig yükleniyor...</Text>
      </View>
    );
  }

  const availablePlayers = allPlayers.filter(p => !league.playerIds.includes(p.id!));
  const leaguePlayers = allPlayers.filter(p => league.playerIds.includes(p.id!));
  const filteredAvailablePlayers = availablePlayers.filter(p =>
    `${p.name} ${p.surname}`.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => NavigationService.goBack()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <X size={24} color="#1F2937" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Lig Düzenle</Text>
            <Text style={styles.headerSubtitle}>{league.title}</Text>
          </View>

          <TouchableOpacity
            onPress={handleSaveLeague}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab('general')}
            style={[styles.tab, activeTab === 'general' && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Settings size={18} color={activeTab === 'general' ? '#16a34a' : '#6B7280'} strokeWidth={2} />
            <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>
              Genel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('players')}
            style={[styles.tab, activeTab === 'players' && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Users size={18} color={activeTab === 'players' ? '#16a34a' : '#6B7280'} strokeWidth={2} />
            <Text style={[styles.tabText, activeTab === 'players' && styles.tabTextActive]}>
              Oyuncular ({league.playerIds.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('permissions')}
            style={[styles.tab, activeTab === 'permissions' && styles.tabActive]}
            activeOpacity={0.7}
          >
            <Trophy size={18} color={activeTab === 'permissions' ? '#16a34a' : '#6B7280'} strokeWidth={2} />
            <Text style={[styles.tabText, activeTab === 'permissions' && styles.tabTextActive]}>
              Yetkiler
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <View style={styles.tabContent}>
            {/* League Name */}
            <View style={styles.card}>
              <Text style={styles.label}>Lig Adı</Text>
              <TextInput
                style={styles.input}
                value={league.title}
                onChangeText={(text) => setLeague({ ...league, title: text })}
                placeholder="Lig adını girin"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Sport Type */}
            <View style={styles.card}>
              <Text style={styles.label}>Spor Türü</Text>
              <View style={styles.sportGrid}>
                {SPORT_TYPES.map((sport) => {
                  const isSelected = league.sportType === sport;
                  const sportColor = getSportColor(sport);
                  
                  return (
                    <TouchableOpacity
                      key={sport}
                      onPress={() => setLeague({ ...league, sportType: sport })}
                      style={[
                        styles.sportCard,
                        isSelected && { ...styles.sportCardActive, borderColor: sportColor },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.sportEmoji}>{getSportIcon(sport)}</Text>
                      <Text style={[styles.sportLabel, isSelected && { color: sportColor }]}>
                        {sport}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Season Settings */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Calendar size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.cardTitle}>Sezon Ayarları</Text>
              </View>

              <View style={styles.dateRow}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Başlangıç</Text>
                  <Text style={styles.dateValue}>{formatDate(league.seasonStartDate)}</Text>
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Bitiş</Text>
                  <Text style={styles.dateValue}>{formatDate(league.seasonEndDate)}</Text>
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>Otomatik Sezon Sıfırlama</Text>
                  <Text style={styles.switchDescription}>Sezon bitince puan durumu sıfırlansın</Text>
                </View>
                <Switch
                  value={league.autoResetStandings}
                  onValueChange={(value) => setLeague({ ...league, autoResetStandings: value })}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={league.autoResetStandings ? '#16a34a' : '#F3F4F6'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>Sezon Değiştirme</Text>
                  <Text style={styles.switchDescription}>Lig devam ederken sezon değiştirilebilir</Text>
                </View>
                <Switch
                  value={league.canChangeSeason}
                  onValueChange={(value) => setLeague({ ...league, canChangeSeason: value })}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={league.canChangeSeason ? '#16a34a' : '#F3F4F6'}
                />
              </View>
            </View>
          </View>
        )}

        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <View style={styles.tabContent}>
            {/* Add Player Button */}
            <TouchableOpacity
              style={styles.addPlayerButton}
              onPress={() => setShowPlayerSearch(true)}
              activeOpacity={0.7}
            >
              <Users size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.addPlayerButtonText}>Yeni Oyuncu Ekle</Text>
            </TouchableOpacity>

            {/* Players List */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Lig Oyuncuları ({leaguePlayers.length})</Text>
              
              {leaguePlayers.length > 0 ? (
                leaguePlayers.map((player) => (
                  <View key={player.id} style={styles.playerItem}>
                    <View style={styles.playerInfo}>
                      <View style={styles.playerAvatar}>
                        <Text style={styles.playerInitial}>
                          {player.name?.[0]}{player.surname?.[0]}
                        </Text>
                      </View>
                      <View style={styles.playerDetails}>
                        <Text style={styles.playerName}>
                          {player.name} {player.surname}
                        </Text>
                        <Text style={styles.playerPhone}>{player.phone}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removePlayer(player.id!)}
                      style={styles.removeButton}
                      activeOpacity={0.7}
                    >
                      <X size={20} color="#DC2626" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Henüz oyuncu eklenmemiş</Text>
              )}
            </View>
          </View>
        )}

        {/* PERMISSIONS TAB */}
        {activeTab === 'permissions' && (
          <View style={styles.tabContent}>
            <View style={styles.infoBox}>
              <AlertCircle size={20} color="#2563EB" strokeWidth={2} />
              <View style={styles.infoBoxContent}>
                <Text style={styles.infoBoxTitle}>Oyuncu Yetkileri</Text>
                <Text style={styles.infoBoxText}>
                  <Text style={styles.infoBoxBold}>Premium:</Text> Kayıt olursa kadroda öncelikli{'\n'}
                  <Text style={styles.infoBoxBold}>Direkt:</Text> Otomatik kadroda, kayıt beklenmez{'\n'}
                  <Text style={styles.infoBoxBold}>Takım Kurma:</Text> Maçlarda takım kurabilir
                </Text>
              </View>
            </View>

            {leaguePlayers.length > 0 ? (
              leaguePlayers.map((player) => (
                <View key={player.id} style={styles.permissionCard}>
                  <Text style={styles.permissionPlayerName}>
                    {player.name} {player.surname}
                  </Text>

                  <TouchableOpacity
                    style={styles.permissionRow}
                    onPress={() => togglePremiumPlayer(player.id!)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.permissionInfo}>
                      <View style={[
                        styles.checkbox,
                        league.premiumPlayerIds.includes(player.id!) && styles.checkboxActive
                      ]}>
                        {league.premiumPlayerIds.includes(player.id!) && (
                          <Check size={14} color="white" strokeWidth={3} />
                        )}
                      </View>
                      <View>
                        <Text style={styles.permissionTitle}>Premium Oyuncu</Text>
                        <Text style={styles.permissionDesc}>Kayıt olursa öncelikli</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.permissionRow}
                    onPress={() => toggleDirectPlayer(player.id!)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.permissionInfo}>
                      <View style={[
                        styles.checkbox,
                        league.directPlayerIds.includes(player.id!) && styles.checkboxActive
                      ]}>
                        {league.directPlayerIds.includes(player.id!) && (
                          <Check size={14} color="white" strokeWidth={3} />
                        )}
                      </View>
                      <View>
                        <Text style={styles.permissionTitle}>Direkt Oyuncu</Text>
                        <Text style={styles.permissionDesc}>Otomatik kadroda</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.permissionRow}
                    onPress={() => toggleTeamBuildingAuthority(player.id!)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.permissionInfo}>
                      <View style={[
                        styles.checkbox,
                        league.teamBuildingAuthorityPlayerIds.includes(player.id!) && styles.checkboxActive
                      ]}>
                        {league.teamBuildingAuthorityPlayerIds.includes(player.id!) && (
                          <Check size={14} color="white" strokeWidth={3} />
                        )}
                      </View>
                      <View>
                        <Text style={styles.permissionTitle}>Takım Kurma Yetkisi</Text>
                        <Text style={styles.permissionDesc}>Maçlarda takım kurabilir</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyText}>Yetki atamak için önce oyuncu ekleyin</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Player Search Modal */}
      <Modal
        visible={showPlayerSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlayerSearch(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Oyuncu Ekle</Text>
              <TouchableOpacity
                onPress={() => setShowPlayerSearch(false)}
                style={styles.modalClose}
                activeOpacity={0.7}
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearch}>
              <Search size={20} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Oyuncu ara..."
                placeholderTextColor="#9CA3AF"
                value={playerSearchQuery}
                onChangeText={setPlayerSearchQuery}
                autoFocus
              />
            </View>

            <FlatList
              data={filteredAvailablePlayers}
              keyExtractor={(item) => item.id!}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalPlayerItem}
                  onPress={() => addPlayer(item.id!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerInfo}>
                    <View style={styles.playerAvatar}>
                      <Text style={styles.playerInitial}>
                        {item.name?.[0]}{item.surname?.[0]}
                      </Text>
                    </View>
                    <View style={styles.playerDetails}>
                      <Text style={styles.playerName}>
                        {item.name} {item.surname}
                      </Text>
                      <Text style={styles.playerPhone}>{item.phone}</Text>
                    </View>
                  </View>
                  <Text style={styles.addText}>+ Ekle</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={styles.emptyText}>Oyuncu bulunamadı</Text>
                </View>
              }
            />
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
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  tabActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#16a34a',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  sportCard: {
    width: '30%',
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  sportCardActive: {
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  sportEmoji: {
    fontSize: 32,
  },
  sportLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  addPlayerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
  },
  addPlayerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  playerDetails: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  playerPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  infoBoxContent: {
    flex: 1,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 18,
  },
  infoBoxBold: {
    fontWeight: '700',
  },
  permissionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionPlayerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  permissionRow: {
    marginBottom: 8,
  },
  permissionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  permissionDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalClose: {
    padding: 4,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  modalPlayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  addText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  modalEmpty: {
    paddingVertical: 40,
  },
});