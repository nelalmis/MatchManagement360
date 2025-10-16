// screens/Match/EditFriendlyMatchTemplateScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ChevronLeft,
  Save,
  Search,
  Star,
  Check,
  X,
  MapPin,
  DollarSign,
  Users,
  CreditCard,
  User,
  Info,
  Trash2,
} from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';
import { friendlyMatchConfigService } from '../../services/friendlyMatchConfigService';
import { playerService } from '../../services/playerService';
import { IPlayer, SportType, SPORT_CONFIGS, getSportIcon, getSportColor } from '../../types/types';

interface PlayerSelection extends IPlayer {
  selected: boolean;
  isFavorite: boolean;
}

type EditTemplateRouteProp = RouteProp<{
  params: {
    templateId: string;
  };
}, 'params'>;

export const EditFriendlyMatchTemplateScreen: React.FC = () => {
  const route = useRoute<EditTemplateRouteProp>();
  const { goBack } = useNavigation();
  const { user } = useAppContext();
  const templateId = route.params?.templateId;

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Template Data
  const [templateName, setTemplateName] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType>('Futbol');

  // Match Settings
  const [venue, setVenue] = useState('');
  const [costPerPlayer, setCostPerPlayer] = useState('');
  const [staffCount, setStaffCount] = useState('10');
  const [reserveCount, setReserveCount] = useState('2');
  const [affectsStandings, setAffectsStandings] = useState(false);
  const [affectsStats, setAffectsStats] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  // Payment Info
  const [peterIban, setPeterIban] = useState('');
  const [peterFullName, setPeterFullName] = useState('');

  // Player Selection
  const [allPlayers, setAllPlayers] = useState<PlayerSelection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      Alert.alert('Hata', 'Template ID bulunamadı');
      NavigationService.goBack();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);

      // Load template
      const template = await friendlyMatchConfigService.getTemplate(user!.id!, templateId);
      
      if (!template) {
        Alert.alert('Hata', 'Şablon bulunamadı');
        NavigationService.goBack();
        return;
      }

      // Set template data
      setTemplateName(template.name);
      const settings = template.settings;

      setSelectedSport(settings?.sportType || 'Futbol');
      setVenue(settings?.location || '');
      setCostPerPlayer(settings?.pricePerPlayer?.toString() || '');
      setStaffCount(settings?.staffPlayerCount?.toString() || '10');
      setReserveCount(settings?.reservePlayerCount?.toString() || '2');
      setAffectsStandings(settings?.affectsStandings || false);
      setAffectsStats(settings?.affectsStats !== false);
      setIsPublic(settings?.isPublic !== false);
      setPeterIban(settings?.peterIban || '');
      setPeterFullName(settings?.peterFullName || '');

      // Load selected players
      if (settings?.invitedPlayerIds && settings.invitedPlayerIds.length > 0) {
        setSelectedPlayers(settings.invitedPlayerIds);
      }

      // Load all players
      const players = await playerService.getAll();
      const config = await friendlyMatchConfigService.getConfig(user!.id!);
      
      const playerSelections: PlayerSelection[] = players
        .filter((p: any) => p.id !== user!.id)
        .map((player: any) => ({
          ...player,
          selected: settings?.invitedPlayerIds?.includes(player.id!) || false,
          isFavorite: config?.favoritePlayerIds?.includes(player.id!) || false,
        }));
      setAllPlayers(playerSelections);

    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Hata', 'Şablon yüklenirken bir hata oluştu');
      NavigationService.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      Alert.alert('Hata', 'Lütfen şablon adı girin');
      return;
    }

    if (!venue.trim()) {
      Alert.alert('Hata', 'Lütfen saha adı girin');
      return;
    }

    try {
      setSaving(true);

      const settings = {
        sportType: selectedSport,
        location: venue,
        pricePerPlayer: parseFloat(costPerPlayer) || 0,
        staffPlayerCount: parseInt(staffCount) || 10,
        reservePlayerCount: parseInt(reserveCount) || 2,
        affectsStandings,
        affectsStats,
        isPublic,
        invitedPlayerIds: selectedPlayers,
        peterIban: peterIban.trim() || undefined,
        peterFullName: peterFullName.trim() || undefined,
      };

      await friendlyMatchConfigService.updateTemplate(
        user!.id!,
        templateId,
        {
          name: templateName,
          settings,
        }
      );

      Alert.alert('Başarılı', 'Şablon güncellendi', [
        {
          text: 'Tamam',
          onPress: () => {
            eventManager.emit(Events.TEMPLATE_UPDATED);
            NavigationService.goBack();
          },
        },
      ]);

    } catch (error: any) {
      console.error('Error updating template:', error);
      Alert.alert('Hata', error.message || 'Şablon güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Şablonu Sil',
      `"${templateName}" şablonunu silmek istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendlyMatchConfigService.deleteTemplate(user!.id!, templateId);
              Alert.alert('Başarılı', 'Şablon silindi');
              eventManager.emit(Events.TEMPLATE_UPDATED);
              NavigationService.goBack();
            } catch (error: any) {
              console.error('Error deleting template:', error);
              Alert.alert('Hata', error.message || 'Şablon silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });

    setAllPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, selected: !p.selected } : p))
    );
  };

  const selectAllPlayers = () => {
    const filteredPlayerIds = filteredPlayers.map((p) => p.id!);
    setSelectedPlayers((prev) => {
      const allSelected = filteredPlayerIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !filteredPlayerIds.includes(id));
      } else {
        return [...new Set([...prev, ...filteredPlayerIds])];
      }
    });

    setAllPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        selected: filteredPlayers.some((fp) => fp.id === p.id)
          ? !filteredPlayers.every((fp) => selectedPlayers.includes(fp.id!))
          : p.selected,
      }))
    );
  };

  const selectFavoritesOnly = () => {
    const favoriteIds = allPlayers.filter((p) => p.isFavorite).map((p) => p.id!);
    setSelectedPlayers(favoriteIds);
    setAllPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        selected: p.isFavorite,
      }))
    );
  };

  const filteredPlayers = allPlayers.filter(
    (player) =>
      player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.phone?.includes(searchQuery)
  );

  const sportColor = getSportColor(selectedSport);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Şablon yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: sportColor }]}>
        <TouchableOpacity onPress={() => goBack()} style={styles.headerButton}>
          <ChevronLeft size={24} color="white" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Şablonu Düzenle</Text>
          <Text style={styles.headerSubtitle}>
            {getSportIcon(selectedSport)} {SPORT_CONFIGS[selectedSport].name}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Save size={24} color="white" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Template Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Şablon Adı</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Örn: Cumartesi Maçı"
            value={templateName}
            onChangeText={setTemplateName}
          />
        </View>

        {/* Sport Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spor Türü</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportScrollContent}
          >
            {(Object.keys(SPORT_CONFIGS) as SportType[]).map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportCard,
                  selectedSport === sport && styles.sportCardActive,
                  {
                    borderColor:
                      selectedSport === sport
                        ? SPORT_CONFIGS[sport].color
                        : '#E5E7EB',
                  },
                ]}
                onPress={() => setSelectedSport(sport)}
              >
                <Text style={styles.sportEmoji}>{SPORT_CONFIGS[sport].emoji}</Text>
                <Text
                  style={[
                    styles.sportName,
                    selectedSport === sport && {
                      color: SPORT_CONFIGS[sport].color,
                    },
                  ]}
                >
                  {SPORT_CONFIGS[sport].name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Match Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maç Ayarları</Text>

          {/* Venue */}
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={styles.inputText}
              placeholder="Saha Adı"
              value={venue}
              onChangeText={setVenue}
            />
          </View>

          {/* Cost */}
          <View style={styles.inputContainer}>
            <DollarSign size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={styles.inputText}
              placeholder="Kişi Başı Maliyet (₺)"
              value={costPerPlayer}
              onChangeText={setCostPerPlayer}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Staff & Reserve Count */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Users size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.inputText}
                placeholder="Kadro"
                value={staffCount}
                onChangeText={setStaffCount}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
              <Users size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.inputText}
                placeholder="Yedek"
                value={reserveCount}
                onChangeText={setReserveCount}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.inputContainer}>
            <CreditCard size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={styles.inputText}
              placeholder="IBAN (opsiyonel)"
              value={peterIban}
              onChangeText={setPeterIban}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={styles.inputText}
              placeholder="Hesap Sahibi Adı (opsiyonel)"
              value={peterFullName}
              onChangeText={setPeterFullName}
            />
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Varsayılan Ayarlar</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Herkese Açık</Text>
              <Text style={styles.settingDescription}>
                Herkes görebilir ve katılabilir
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#E5E7EB', true: sportColor }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>İstatistikleri Etkile</Text>
              <Text style={styles.settingDescription}>
                Oyuncu istatistiklerine yansısın mı?
              </Text>
            </View>
            <Switch
              value={affectsStats}
              onValueChange={setAffectsStats}
              trackColor={{ false: '#E5E7EB', true: sportColor }}
              thumbColor="white"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Puan Durumunu Etkile</Text>
              <Text style={styles.settingDescription}>
                Lig puan durumuna yansısın mı?
              </Text>
            </View>
            <Switch
              value={affectsStandings}
              onValueChange={setAffectsStandings}
              trackColor={{ false: '#E5E7EB', true: sportColor }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Player Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Varsayılan Oyuncular ({selectedPlayers.length})
            </Text>
            <TouchableOpacity onPress={selectFavoritesOnly}>
              <Text style={[styles.linkText, { color: sportColor }]}>
                Favorileri Seç
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.playerSelectionButton}
            onPress={() => setShowPlayerModal(true)}
          >
            <Users size={20} color={sportColor} strokeWidth={2} />
            <Text style={styles.playerSelectionText}>
              {selectedPlayers.length > 0
                ? `${selectedPlayers.length} oyuncu seçildi`
                : 'Oyuncu seç'}
            </Text>
            <Check size={20} color="#9CA3AF" strokeWidth={2} />
          </TouchableOpacity>

          {/* Selected Players Preview */}
          {selectedPlayers.length > 0 && (
            <View style={styles.selectedPlayersPreview}>
              {allPlayers
                .filter((p) => selectedPlayers.includes(p.id!))
                .slice(0, 5)
                .map((player) => (
                  <View key={player.id} style={styles.playerChip}>
                    <Text style={styles.playerChipText}>{player.name}</Text>
                    {player.isFavorite && (
                      <Star size={12} color="#F59E0B" fill="#F59E0B" />
                    )}
                  </View>
                ))}
              {selectedPlayers.length > 5 && (
                <View style={styles.playerChip}>
                  <Text style={styles.playerChipText}>
                    +{selectedPlayers.length - 5} daha
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.infoBox}>
            <Info size={16} color="#6B7280" strokeWidth={2} />
            <Text style={styles.infoText}>
              Bu şablondan maç oluştururken bu oyuncular otomatik seçilecek
            </Text>
          </View>
        </View>

        {/* Delete Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.deleteButtonText}>Şablonu Sil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Player Selection Modal */}
      <Modal
        visible={showPlayerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlayerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Oyuncu Seç ({selectedPlayers.length})
              </Text>
              <TouchableOpacity onPress={() => setShowPlayerModal(false)}>
                <Check size={24} color={sportColor} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Oyuncu ara..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={selectAllPlayers}
              >
                <Text style={[styles.actionButtonText, { color: sportColor }]}>
                  {filteredPlayers.every((p) => selectedPlayers.includes(p.id!))
                    ? 'Tümünü Kaldır'
                    : 'Tümünü Seç'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={selectFavoritesOnly}
              >
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={[styles.actionButtonText, { color: sportColor }]}>
                  Favoriler
                </Text>
              </TouchableOpacity>
            </View>

            {/* Player List */}
            <ScrollView>
              {filteredPlayers.map((player) => (
                <TouchableOpacity
                  key={player.id}
                  style={styles.playerItem}
                  onPress={() => togglePlayerSelection(player.id!)}
                >
                  <View style={styles.playerItemInfo}>
                    <Text style={styles.playerItemName}>{player.name}</Text>
                    <Text style={styles.playerItemPhone}>{player.phone}</Text>
                  </View>
                  <View style={styles.playerItemRight}>
                    {player.isFavorite && (
                      <Star
                        size={16}
                        color="#F59E0B"
                        fill="#F59E0B"
                        style={styles.favoriteIcon}
                      />
                    )}
                    <View
                      style={[
                        styles.checkbox,
                        selectedPlayers.includes(player.id!) && {
                          ...styles.checkboxChecked,
                          backgroundColor: sportColor,
                          borderColor: sportColor,
                        },
                      ]}
                    >
                      {selectedPlayers.includes(player.id!) && (
                        <Check size={16} color="white" strokeWidth={2.5} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {filteredPlayers.length === 0 && (
                <View style={styles.emptyState}>
                  <Search size={48} color="#D1D5DB" strokeWidth={1.5} />
                  <Text style={styles.emptyStateText}>Oyuncu bulunamadı</Text>
                </View>
              )}
            </ScrollView>
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
    paddingTop: 50,
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    fontSize: 15,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sportScrollContent: {
    paddingRight: 16,
  },
  sportCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    minWidth: 100,
  },
  sportCardActive: {
    backgroundColor: 'white',
  },
  sportEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  sportName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  playerSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playerSelectionText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  selectedPlayersPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
  },
  playerChipText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  bottomSpacing: {
    height: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
    paddingVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  playerItemInfo: {
    flex: 1,
  },
  playerItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  playerItemPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  playerItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  favoriteIcon: {
    marginRight: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#16a34a',
    backgroundColor: '#16a34a',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9CA3AF',
  },
});