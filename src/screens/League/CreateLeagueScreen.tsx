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
} from 'react-native';
import {
  X,
  Check,
  Calendar,
  Users,
  Trophy,
  AlertCircle,
  Search,
  Plus,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
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
import { NavigationService } from '../../navigation/NavigationService';

const SPORT_TYPES: SportType[] = [
  'Futbol',
  'Basketbol',
  'Voleybol',
  'Tenis',
  'Masa Tenisi',
  'Badminton',
];

export const CreateLeagueScreen: React.FC = () => {
  const { user } = useAppContext();

  // Form State
  const [title, setTitle] = useState('');
  const [sportType, setSportType] = useState<SportType>('Futbol');
  const [seasonStartDate, setSeasonStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [seasonEndDate, setSeasonEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [autoResetStandings, setAutoResetStandings] = useState(true);
  const [canChangeSeason, setCanChangeSeason] = useState(false);

  // Players
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [premiumPlayerIds, setPremiumPlayerIds] = useState<string[]>([]);
  const [directPlayerIds, setDirectPlayerIds] = useState<string[]>([]);
  const [teamBuildingAuthorityPlayerIds, setTeamBuildingAuthorityPlayerIds] = useState<string[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic Info, 2: Players, 3: Permissions
  const [selectMode, setSelectMode] = useState(false);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([])

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      setLoading(true);
      const playersData = await playerService.getAll();
      setAllPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
      Alert.alert('Hata', 'Oyuncular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lig adı boş olamaz');
      return false;
    }

    if (title.trim().length < 3) {
      Alert.alert('Hata', 'Lig adı en az 3 karakter olmalıdır');
      return false;
    }

    if (new Date(seasonStartDate) >= new Date(seasonEndDate)) {
      Alert.alert('Hata', 'Sezon bitiş tarihi başlangıç tarihinden sonra olmalı');
      return false;
    }

    if (selectedPlayerIds.length === 0) {
      Alert.alert('Uyarı', 'En az bir oyuncu eklemelisiniz', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Devam Et', onPress: () => handleCreateLeague() }
      ]);
      return false;
    }

    return true;
  };

  const handleCreateLeague = async () => {
    if (!validateForm()) return;
    if (!user?.id) return;

    try {
      setSaving(true);

      const newLeague: ILeague = {
        id: null,
        title: title.trim(),
        sportType,
        seasonStartDate,
        seasonEndDate,
        autoResetStandings,
        canChangeSeason,
        playerIds: [...selectedPlayerIds, user.id], //Yoksa kurucu ekleniyor
        premiumPlayerIds,
        directPlayerIds,
        teamBuildingAuthorityPlayerIds,
        matchFixtures: [],
        createdAt: new Date().toISOString(),
        createdBy: user.id,
      };

      const response = await leagueService.add(newLeague);

      if (response.success) {
        Alert.alert(
          'Başarılı! 🎉',
          'Lig başarıyla oluşturuldu',
          [
            {
              text: 'Tamam',
              onPress: () => NavigationService.navigateToLeague(response.id)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating league:', error);
      Alert.alert('Hata', 'Lig oluşturulurken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const addPlayer = (playerId: string) => {
    if (!selectedPlayerIds.includes(playerId)) {
      setSelectedPlayerIds([...selectedPlayerIds, playerId]);
    }
    if (!selectMode) {
      setShowPlayerSearch(false);
      setPlayerSearchQuery('');
    }
  };

  const togglePlayerInModal = (playerId: string) => {
    if (tempSelectedIds.includes(playerId)) {
      setTempSelectedIds(tempSelectedIds.filter(id => id !== playerId));
    } else {
      setTempSelectedIds([...tempSelectedIds, playerId]);
    }
  };

  const confirmMultipleSelection = () => {
    const newPlayerIds = [...selectedPlayerIds];
    tempSelectedIds.forEach(id => {
      if (!newPlayerIds.includes(id)) {
        newPlayerIds.push(id);
      }
    });
    setSelectedPlayerIds(newPlayerIds);
    setShowPlayerSearch(false);
    setSelectMode(false);
    setTempSelectedIds([]);
    setPlayerSearchQuery('');
  };

  const cancelMultipleSelection = () => {
    setSelectMode(false);
    setTempSelectedIds([]);
  };

  const selectAllPlayers = () => {
    setTempSelectedIds(filteredAvailablePlayers.map(p => p.id!));
  };

  const deselectAllPlayers = () => {
    setTempSelectedIds([]);
  };

  const removePlayer = (playerId: string) => {
    setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
    setPremiumPlayerIds(premiumPlayerIds.filter(id => id !== playerId));
    setDirectPlayerIds(directPlayerIds.filter(id => id !== playerId));
    setTeamBuildingAuthorityPlayerIds(teamBuildingAuthorityPlayerIds.filter(id => id !== playerId));
  };

  const togglePremiumPlayer = (playerId: string) => {
    setPremiumPlayerIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const toggleDirectPlayer = (playerId: string) => {
    setDirectPlayerIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const toggleTeamBuildingAuthority = (playerId: string) => {
    setTeamBuildingAuthorityPlayerIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!title.trim()) {
        Alert.alert('Hata', 'Lig adı boş olamaz');
        return;
      }
      if (new Date(seasonStartDate) >= new Date(seasonEndDate)) {
        Alert.alert('Hata', 'Sezon bitiş tarihi başlangıç tarihinden sonra olmalı');
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const selectedPlayers = allPlayers.filter(p => selectedPlayerIds.includes(p.id!));
  const availablePlayers = allPlayers.filter(p => !selectedPlayerIds.includes(p.id!));
  const filteredAvailablePlayers = availablePlayers.filter(p =>
    `${p.name} ${p.surname}`.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => NavigationService.goBack()}
          style={styles.headerButton}
          activeOpacity={0.7}
        >
          <X size={24} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Yeni Lig Oluştur</Text>
          <Text style={styles.headerSubtitle}>Adım {currentStep}/3</Text>
        </View>

        <View style={styles.headerButton} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressSegment, currentStep >= 1 && styles.progressSegmentActive]} />
        <View style={[styles.progressSegment, currentStep >= 2 && styles.progressSegmentActive]} />
        <View style={[styles.progressSegment, currentStep >= 3 && styles.progressSegmentActive]} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Basic Info */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Trophy size={32} color="#16a34a" strokeWidth={2} />
              <Text style={styles.stepTitle}>Temel Bilgiler</Text>
              <Text style={styles.stepDescription}>
                Liginizin adını ve spor türünü belirleyin
              </Text>
            </View>

            {/* League Name */}
            <View style={styles.card}>
              <Text style={styles.label}>Lig Adı *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Örn: Architect Halı Saha Ligi"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Sport Type */}
            <View style={styles.card}>
              <Text style={styles.label}>Spor Türü *</Text>
              <View style={styles.sportGrid}>
                {SPORT_TYPES.map((sport) => {
                  const isSelected = sportType === sport;
                  const sportColor = getSportColor(sport);

                  return (
                    <TouchableOpacity
                      key={sport}
                      onPress={() => setSportType(sport)}
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
                  <Text style={styles.dateLabel}>Başlangıç *</Text>
                  <Text style={styles.dateValue}>{formatDate(seasonStartDate)}</Text>
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Bitiş *</Text>
                  <Text style={styles.dateValue}>{formatDate(seasonEndDate)}</Text>
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>Otomatik Sezon Sıfırlama</Text>
                  <Text style={styles.switchDescription}>Sezon bitince puan durumu sıfırlansın</Text>
                </View>
                <Switch
                  value={autoResetStandings}
                  onValueChange={setAutoResetStandings}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={autoResetStandings ? '#16a34a' : '#F3F4F6'}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>Sezon Değiştirme</Text>
                  <Text style={styles.switchDescription}>Lig devam ederken sezon değiştirilebilir</Text>
                </View>
                <Switch
                  value={canChangeSeason}
                  onValueChange={setCanChangeSeason}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={canChangeSeason ? '#16a34a' : '#F3F4F6'}
                />
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Players */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Users size={32} color="#16a34a" strokeWidth={2} />
              <Text style={styles.stepTitle}>Oyuncu Seçimi</Text>
              <Text style={styles.stepDescription}>
                Lige katılacak oyuncuları seçin
              </Text>
            </View>

            {/* Add Player Button */}
            <TouchableOpacity
              style={styles.addPlayerButton}
              onPress={() => setShowPlayerSearch(true)}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#16a34a" strokeWidth={2} />
              <Text style={styles.addPlayerButtonText}>Oyuncu Ekle</Text>
            </TouchableOpacity>

            {/* Selected Players */}
            {selectedPlayers.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Seçili Oyuncular ({selectedPlayers.length})</Text>

                {selectedPlayers.map((player) => (
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
                ))}
              </View>
            )}

            {selectedPlayers.length === 0 && (
              <View style={styles.emptyState}>
                <Users size={48} color="#D1D5DB" strokeWidth={1.5} />
                <Text style={styles.emptyStateTitle}>Henüz oyuncu eklenmedi</Text>
                <Text style={styles.emptyStateText}>
                  "Oyuncu Ekle" butonuna tıklayarak oyuncu ekleyin
                </Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 3: Permissions */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Trophy size={32} color="#16a34a" strokeWidth={2} />
              <Text style={styles.stepTitle}>Oyuncu Yetkileri</Text>
              <Text style={styles.stepDescription}>
                İsteğe bağlı - Oyunculara özel yetkiler verin
              </Text>
            </View>

            <View style={styles.infoBox}>
              <AlertCircle size={20} color="#2563EB" strokeWidth={2} />
              <View style={styles.infoBoxContent}>
                <Text style={styles.infoBoxTitle}>Yetki Tipleri</Text>
                <Text style={styles.infoBoxText}>
                  <Text style={styles.infoBoxBold}>Premium:</Text> Kayıt olursa kadroda öncelikli{'\n'}
                  <Text style={styles.infoBoxBold}>Direkt:</Text> Otomatik kadroda, kayıt beklenmez{'\n'}
                  <Text style={styles.infoBoxBold}>Takım Kurma:</Text> Maçlarda takım kurabilir
                </Text>
              </View>
            </View>

            {selectedPlayers.length > 0 ? (
              selectedPlayers.map((player) => (
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
                        premiumPlayerIds.includes(player.id!) && styles.checkboxActive
                      ]}>
                        {premiumPlayerIds.includes(player.id!) && (
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
                        directPlayerIds.includes(player.id!) && styles.checkboxActive
                      ]}>
                        {directPlayerIds.includes(player.id!) && (
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
                        teamBuildingAuthorityPlayerIds.includes(player.id!) && styles.checkboxActive
                      ]}>
                        {teamBuildingAuthorityPlayerIds.includes(player.id!) && (
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
                <Text style={styles.emptyText}>Önce oyuncu eklemelisiniz</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {currentStep > 1 && (
          <TouchableOpacity
            onPress={prevStep}
            style={styles.navButtonSecondary}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonSecondaryText}>Geri</Text>
          </TouchableOpacity>
        )}

        {currentStep < 3 ? (
          <TouchableOpacity
            onPress={nextStep}
            style={[styles.navButtonPrimary, currentStep === 1 && styles.navButtonFull]}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonPrimaryText}>İleri</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleCreateLeague}
            disabled={saving}
            style={[styles.navButtonPrimary, saving && styles.navButtonDisabled]}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.navButtonPrimaryText}>Lig Oluştur</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Player Search Modal */}
      <Modal
        visible={showPlayerSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPlayerSearch(false);
          setSelectMode(false);
          setTempSelectedIds([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Oyuncu Seç</Text>
              <View style={styles.modalHeaderRight}>
                {!selectMode ? (
                  <TouchableOpacity
                    onPress={() => setSelectMode(true)}
                    style={styles.selectModeButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.selectModeButtonText}>Toplu Seç</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={cancelMultipleSelection}
                    style={styles.cancelSelectButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelSelectButtonText}>İptal</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setShowPlayerSearch(false);
                    setSelectMode(false);
                    setTempSelectedIds([]);
                  }}
                  style={styles.modalClose}
                  activeOpacity={0.7}
                >
                  <X size={24} color="#6B7280" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Select Mode Actions */}
            {selectMode && (
              <View style={styles.selectModeActions}>
                <TouchableOpacity
                  onPress={selectAllPlayers}
                  style={styles.selectActionButton}
                  activeOpacity={0.7}
                >
                  <Check size={16} color="#16a34a" strokeWidth={2.5} />
                  <Text style={styles.selectActionText}>Tümünü Seç</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={deselectAllPlayers}
                  style={styles.selectActionButton}
                  activeOpacity={0.7}
                >
                  <X size={16} color="#DC2626" strokeWidth={2.5} />
                  <Text style={styles.selectActionText}>Tümünü Kaldır</Text>
                </TouchableOpacity>

                <View style={styles.selectedCountBadge}>
                  <Text style={styles.selectedCountText}>
                    {tempSelectedIds.length} seçili
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalSearch}>
              <Search size={20} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Oyuncu ara..."
                placeholderTextColor="#9CA3AF"
                value={playerSearchQuery}
                onChangeText={setPlayerSearchQuery}
                autoFocus={!selectMode}
              />
            </View>

            <FlatList
              data={filteredAvailablePlayers}
              keyExtractor={(item) => item.id!}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalPlayerItem,
                    selectMode && tempSelectedIds.includes(item.id!) && styles.modalPlayerItemSelected
                  ]}
                  onPress={() => selectMode ? togglePlayerInModal(item.id!) : addPlayer(item.id!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.playerInfo}>
                    {selectMode && (
                      <View style={[
                        styles.checkboxModal,
                        tempSelectedIds.includes(item.id!) && styles.checkboxModalActive
                      ]}>
                        {tempSelectedIds.includes(item.id!) && (
                          <Check size={14} color="white" strokeWidth={3} />
                        )}
                      </View>
                    )}
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
                  {!selectMode && (
                    <View style={styles.addBadge}>
                      <Plus size={16} color="white" strokeWidth={2.5} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={styles.emptyText}>Oyuncu bulunamadı</Text>
                </View>
              }
            />

            {/* Confirm Button for Select Mode */}
            {selectMode && tempSelectedIds.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  onPress={confirmMultipleSelection}
                  style={styles.confirmMultipleButton}
                  activeOpacity={0.7}
                >
                  <Check size={20} color="white" strokeWidth={2.5} />
                  <Text style={styles.confirmMultipleButtonText}>
                    {tempSelectedIds.length} Oyuncu Ekle
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  progressSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: '#16a34a',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 16,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
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
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 14,
    paddingVertical: 20,
  },
  bottomSpacing: {
    height: 20,
  },
  bottomNav: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  navButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  navButtonSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4B5563',
  },
  navButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonFull: {
    flex: 1,
  },
  navButtonPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
  navButtonDisabled: {
    opacity: 0.6,
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
  modalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectModeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
  },
  selectModeButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
  cancelSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  cancelSelectButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalClose: {
    padding: 4,
  },
  selectModeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  selectedCountBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  selectedCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
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
  modalPlayerItemSelected: {
    backgroundColor: '#F0FDF4',
  },
  checkboxModal: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxModalActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  addBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalEmpty: {
    paddingVertical: 40,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  confirmMultipleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  confirmMultipleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'white',
  },
});