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
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Users,
  CreditCard,
  User,
  ChevronRight,
  Search,
  Star,
  Check,
  Plus,
  X,
  Archive,
  UserPlus,
  Timer,
  Globe,
  Info
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { matchService } from '../../services/matchService';
import { friendlyMatchConfigService } from '../../services/friendlyMatchConfigService';
import { playerService } from '../../services/playerService';
import { IPlayer, SportType, SPORT_CONFIGS } from '../..//types/types';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation';

interface PlayerSelection extends IPlayer {
  selected: boolean;
  isFavorite: boolean;
}

interface FriendlyMatchTemplate {
  id: string;
  name: string;
  settings: any;
}
// Type definition ekle
type CreateFriendlyMatchParams = {
  templateId?: string;
};

export const CreateFriendlyMatchScreen: React.FC = () => {
  const route = useRoute<RouteProp<{ params: CreateFriendlyMatchParams }, 'params'>>();
  const { navigate, goBack } = useNavigation();
  const { user } = useAppContext();

  // Loading States
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Sport Selection
  const [selectedSport, setSelectedSport] = useState<SportType>('Futbol');

  // Template & Config
  const [templates, setTemplates] = useState<FriendlyMatchTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FriendlyMatchTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Match Details
  const [matchDate, setMatchDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [costPerPlayer, setCostPerPlayer] = useState('');
  const [description, setDescription] = useState('');
  const [staffCount, setStaffCount] = useState('10');
  const [reserveCount, setReserveCount] = useState('2');

  // Settings
  const [affectsStandings, setAffectsStandings] = useState(false);
  const [affectsStats, setAffectsStats] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  // Player Selection
  const [allPlayers, setAllPlayers] = useState<PlayerSelection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Template Save
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Payment Info
  const [peterIban, setPeterIban] = useState('');
  const [peterFullName, setPeterFullName] = useState('');
  // Template ID'yi route'dan al
  const templateId = route.params?.templateId;

  // Ayrı bir useEffect ekle
  useEffect(() => {
    if (templateId && templates.length > 0 && !loadingTemplates) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        loadTemplate(template);
      }
    }
  }, [templateId, templates, loadingTemplates]);
  
  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Update defaults when sport changes
  useEffect(() => {
    const config = SPORT_CONFIGS[selectedSport];
    setStaffCount(config.defaultPlayers.toString());

    // Auto-generate title based on sport and date
    const dateStr = matchDate.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long'
    });
    setTitle(`${config.name} Dostluk Maçı - ${dateStr}`);
  }, [selectedSport, matchDate]);

  const loadInitialData = async () => {
    try {
      setLoadingTemplates(true);

      // Load templates
      const userTemplates = await friendlyMatchConfigService.getTemplates(user!.id!);
      setTemplates(userTemplates as FriendlyMatchTemplate[]);

      // Load default config
      const config = await friendlyMatchConfigService.getConfig(user!.id!);
      if (config) {
        setVenue(config.defaultLocation || '');
        setCostPerPlayer(config.defaultPrice?.toString() || '');
        setStaffCount(config.defaultStaffCount?.toString() || '10');
        setReserveCount(config.defaultReserveCount?.toString() || '2');
        setPeterIban(config.defaultPeterIban || '');
        setPeterFullName(config.defaultPeterFullName || '');

        // Load favorite players
        if (config.favoritePlayerIds && config.favoritePlayerIds.length > 0) {
          setSelectedPlayers(config.favoritePlayerIds);
        }
      }

      // Load all players
      const players = await playerService.getAll();
      const playerSelections: PlayerSelection[] = players
        .filter((p: any) => p.id !== user!.id)
        .map((player: any) => ({
          ...player,
          selected: config?.favoritePlayerIds?.includes(player.id!) || false,
          isFavorite: config?.favoritePlayerIds?.includes(player.id!) || false,
        }));
      setAllPlayers(playerSelections);

    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSportChange = async (sport: SportType) => {
    setSelectedSport(sport);

    // Clear template if different sport
    if (selectedTemplate && selectedTemplate.settings?.sportType !== sport) {
      setSelectedTemplate(null);
    }

    // Filter templates by sport
    const allTemplates = await friendlyMatchConfigService.getTemplates(user!.id!);
    const sportTemplates = (allTemplates as FriendlyMatchTemplate[]).filter(
      (t: any) => !t.settings?.sportType || t.settings.sportType === sport
    );
    setTemplates(sportTemplates);
  };

  const loadTemplate = (template: FriendlyMatchTemplate) => {
    setSelectedTemplate(template);
    const settings = template.settings;

    if (settings.sportType) {
      setSelectedSport(settings.sportType);
    }
    setVenue(settings.location || venue);
    setCostPerPlayer(settings.pricePerPlayer?.toString() || costPerPlayer);
    setStaffCount(settings.staffPlayerCount?.toString() || staffCount);
    setReserveCount(settings.reservePlayerCount?.toString() || reserveCount);
    setAffectsStandings(settings.affectsStandings || false);
    setAffectsStats(settings.affectsStats !== false);
    setIsPublic(settings.isPublic !== false);

    if (settings.invitedPlayerIds && settings.invitedPlayerIds.length > 0) {
      setSelectedPlayers(settings.invitedPlayerIds);
      setAllPlayers((prev: any) => prev.map((p: any) => ({
        ...p,
        selected: settings.invitedPlayerIds?.includes(p.id!) || false
      })));
    }

    setShowTemplateModal(false);
    Alert.alert('Başarılı', `"${template.name}" şablonu yüklendi`);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setMatchDate(date);
    }
  };

  const handleTimeChange = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      setMatchDate(date);
    }
  };

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers((prev: any) => {
      if (prev.includes(playerId)) {
        return prev.filter((id: any) => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });

    setAllPlayers((prev: any) => prev.map((p: any) =>
      p.id === playerId ? { ...p, selected: !p.selected } : p
    ));
  };

  const selectAllPlayers = () => {
    const filteredPlayerIds = filteredPlayers.map((p: any) => p.id!);
    setSelectedPlayers((prev: any) => {
      const allSelected = filteredPlayerIds.every((id: any) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id: any) => !filteredPlayerIds.includes(id));
      } else {
        return [...new Set([...prev, ...filteredPlayerIds])];
      }
    });

    setAllPlayers((prev: any) => prev.map((p: any) => ({
      ...p,
      selected: filteredPlayers.some((fp: any) => fp.id === p.id) ?
        !filteredPlayers.every((fp: any) => selectedPlayers.includes(fp.id!)) : p.selected
    })));
  };

  const selectFavoritesOnly = () => {
    const favoriteIds = allPlayers.filter((p: any) => p.isFavorite).map((p: any) => p.id!);
    setSelectedPlayers(favoriteIds);
    setAllPlayers((prev: any) => prev.map((p: any) => ({
      ...p,
      selected: p.isFavorite
    })));
  };

  const filteredPlayers = allPlayers.filter((player: any) =>
    player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.phone?.includes(searchQuery)
  );

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen maç başlığı girin');
      return false;
    }

    if (!venue.trim()) {
      Alert.alert('Hata', 'Lütfen saha adı girin');
      return false;
    }

    if (!costPerPlayer || parseFloat(costPerPlayer) < 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir maliyet girin');
      return false;
    }

    const staff = parseInt(staffCount);
    const reserve = parseInt(reserveCount);

    if (isNaN(staff) || staff < 2) {
      Alert.alert('Hata', 'Kadro sayısı en az 2 olmalı');
      return false;
    }

    if (isNaN(reserve) || reserve < 0) {
      Alert.alert('Hata', 'Yedek sayısı geçerli olmalı');
      return false;
    }

    if (!isPublic && selectedPlayers.length === 0) {
      Alert.alert('Uyarı', 'Özel maç için en az bir oyuncu davet etmelisiniz');
      return false;
    }

    return true;
  };

  const createMatch = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const result = await matchService.createFriendlyMatch({
        organizerId: user!.id!,
        sportType: selectedSport,
        title: title.trim(),
        matchStartTime: matchDate,
        location: venue,
        staffPlayerCount: parseInt(staffCount),
        reservePlayerCount: parseInt(reserveCount),
        isPublic,
        affectsStats,
        affectsStandings,
        invitedPlayerIds: !isPublic ? selectedPlayers : [],
        pricePerPlayer: parseFloat(costPerPlayer),
        peterIban: peterIban.trim() || undefined,
        peterFullName: peterFullName.trim() || undefined,
        useDefaults: true
      });

      if (!result.success) {
        throw new Error('Maç oluşturulamadı');
      }

      // Send invitations
      if (!isPublic && selectedPlayers.length > 0) {
        await matchService.invitePlayersToMatch(
          result.id!,
          user!.id!,
          selectedPlayers,
          description || undefined,
          48
        );
      }

      const invitationText = isPublic
        ? 'Herkese açık olarak oluşturuldu'
        : `${selectedPlayers.length} oyuncuya davet gönderildi`;

      Alert.alert(
        'Başarılı! 🎉',
        `${SPORT_CONFIGS[selectedSport].emoji} ${SPORT_CONFIGS[selectedSport].name} dostluk maçı ${invitationText}.`,
        [
          {
            text: 'Tamam',
            onPress: () => {
              NavigationService.goBack();
              NavigationService.navigateToMatch(result.id);
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating match:', error);
      Alert.alert('Hata', 'Maç oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      Alert.alert('Hata', 'Lütfen şablon adı girin');
      return;
    }

    try {
      setSavingTemplate(true);

      const settings = {
        sportType: selectedSport,
        location: venue,
        pricePerPlayer: parseFloat(costPerPlayer),
        staffPlayerCount: parseInt(staffCount),
        reservePlayerCount: parseInt(reserveCount),
        affectsStandings,
        affectsStats,
        isPublic,
        invitedPlayerIds: selectedPlayers,
        peterIban,
        peterFullName,
      };

      await friendlyMatchConfigService.saveTemplate(
        user!.id!,
        templateName,
        settings
      );

      Alert.alert('Başarılı', 'Şablon kaydedildi');
      setShowSaveTemplateModal(false);
      setTemplateName('');

      // Reload templates
      const userTemplates = await friendlyMatchConfigService.getTemplates(user!.id!);
      setTemplates(userTemplates as FriendlyMatchTemplate[]);

    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Hata', 'Şablon kaydedilirken bir hata oluştu');
    } finally {
      setSavingTemplate(false);
    }
  };

  if (loadingTemplates) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dostluk Maçı Oluştur</Text>
        <TouchableOpacity
          onPress={() => setShowSaveTemplateModal(true)}
          style={styles.saveTemplateButton}
        >
          <Bookmark size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Sport Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spor Türü</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sportScrollContent}
          >
            {(Object.keys(SPORT_CONFIGS) as SportType[]).map((sport: SportType) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportCard,
                  selectedSport === sport && styles.sportCardActive,
                  {
                    borderColor: selectedSport === sport
                      ? SPORT_CONFIGS[sport].color
                      : '#E0E0E0'
                  }
                ]}
                onPress={() => handleSportChange(sport)}
              >
                <Text style={styles.sportEmoji}>
                  {SPORT_CONFIGS[sport].emoji}
                </Text>
                <Text style={[
                  styles.sportName,
                  selectedSport === sport && { color: SPORT_CONFIGS[sport].color }
                ]}>
                  {SPORT_CONFIGS[sport].name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Template Selection */}
        {templates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Şablon Seç</Text>
            <TouchableOpacity
              style={styles.templateButton}
              onPress={() => setShowTemplateModal(true)}
            >
              <Archive size={20} color="#007AFF" />
              <Text style={styles.templateButtonText}>
                {selectedTemplate ? selectedTemplate.name : 'Kayıtlı şablonlardan yükle'}
              </Text>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* Match Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maç Bilgileri</Text>

          {/* Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Maç Başlığı</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Cumartesi Maçı"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.input, styles.halfInput]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#666" />
              <Text style={styles.inputText}>
                {matchDate.toLocaleDateString('tr-TR')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.input, styles.halfInput]}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={20} color="#666" />
              <Text style={styles.inputText}>
                {matchDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Venue */}
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#666" />
            <TextInput
              style={styles.textInput}
              placeholder="Saha Adı"
              value={venue}
              onChangeText={setVenue}
            />
          </View>

          {/* Cost */}
          <View style={styles.inputContainer}>
            <DollarSign size={20} color="#666" />
            <TextInput
              style={styles.textInput}
              placeholder="Kişi Başı Maliyet (₺)"
              value={costPerPlayer}
              onChangeText={setCostPerPlayer}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Staff & Reserve Count */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfInput]}>
              <Users size={18} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder="Kadro"
                value={staffCount}
                onChangeText={setStaffCount}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
              <Users size={18} color="#666" />
              <TextInput
                style={styles.textInput}
                placeholder="Yedek"
                value={reserveCount}
                onChangeText={setReserveCount}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.inputContainer}>
            <CreditCard size={20} color="#666" />
            <TextInput
              style={styles.textInput}
              placeholder="IBAN (opsiyonel)"
              value={peterIban}
              onChangeText={setPeterIban}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color="#666" />
            <TextInput
              style={styles.textInput}
              placeholder="Hesap Sahibi Adı (opsiyonel)"
              value={peterFullName}
              onChangeText={setPeterFullName}
            />
          </View>

          {/* Description */}
          <TextInput
            style={styles.textArea}
            placeholder="Açıklama (opsiyonel)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>

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
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
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
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
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
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
            />
          </View>
        </View>

        {/* Player Selection (Only for Private Matches) */}
        {!isPublic && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Oyuncu Davet Et ({selectedPlayers.length})
              </Text>
              <TouchableOpacity onPress={selectFavoritesOnly}>
                <Text style={styles.linkText}>Favorileri Seç</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.playerSelectionButton}
              onPress={() => setShowPlayerModal(true)}
            >
              <UserPlus size={20} color="#007AFF" />
              <Text style={styles.playerSelectionText}>
                {selectedPlayers.length > 0
                  ? `${selectedPlayers.length} oyuncu seçildi`
                  : 'Oyuncu seç'}
              </Text>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>

            {/* Selected Players Preview */}
            {selectedPlayers.length > 0 && (
              <View style={styles.selectedPlayersPreview}>
                {allPlayers
                  .filter((p: any) => selectedPlayers.includes(p.id!))
                  .slice(0, 5)
                  .map((player: any) => (
                    <View key={player.id} style={styles.playerChip}>
                      <Text style={styles.playerChipText}>{player.name}</Text>
                      {player.isFavorite && (
                        <Star size={12} color="#FFD700" fill="#FFD700" />
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
          </View>
        )}

        {/* Info Boxes */}
        <View style={styles.infoContainer}>
          {!affectsStandings && (
            <View style={[styles.infoBox, { backgroundColor: '#FFF3CD' }]}>
              <Info size={20} color="#856404" />
              <Text style={[styles.infoText, { color: '#856404' }]}>
                Bu maç puan durumunu etkilemeyecek
              </Text>
            </View>
          )}

          {isPublic && (
            <View style={[styles.infoBox, { backgroundColor: '#D1ECF1' }]}>
              <Globe size={20} color="#0C5460" />
              <Text style={[styles.infoText, { color: '#0C5460' }]}>
                Maç herkese açık, herkes katılabilir
              </Text>
            </View>
          )}
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.createButton,
            loading && styles.createButtonDisabled,
            { backgroundColor: SPORT_CONFIGS[selectedSport].color }
          ]}
          onPress={createMatch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.sportEmoji}>{SPORT_CONFIGS[selectedSport].emoji}</Text>
              <Text style={styles.createButtonText}>Maç Oluştur</Text>
              <ChevronRight size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={matchDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={matchDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}

      {/* Template Selection Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {SPORT_CONFIGS[selectedSport].emoji} Şablon Seç
              </Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {templates.map((template: any) => (
                <TouchableOpacity
                  key={template.id}
                  style={styles.templateItem}
                  onPress={() => loadTemplate(template)}
                >
                  <View style={styles.templateInfo}>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateDetails}>
                      {template.settings?.location} • ₺{template.settings?.pricePerPlayer} • {template.settings?.staffPlayerCount} kişi
                    </Text>
                  </View>
                  <ChevronRight size={20} color="#999" />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={styles.emptyTemplateButton}
                onPress={() => setShowTemplateModal(false)}
              >
                <Plus size={20} color="#007AFF" />
                <Text style={styles.emptyTemplateText}>Boş Başlat</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

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
                <Check size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Search size={20} color="#999" />
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
                <Text style={styles.actionButtonText}>
                  {filteredPlayers.every((p: any) => selectedPlayers.includes(p.id!))
                    ? 'Tümünü Kaldır'
                    : 'Tümünü Seç'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={selectFavoritesOnly}
              >
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={styles.actionButtonText}>Favoriler</Text>
              </TouchableOpacity>
            </View>

            {/* Player List */}
            <ScrollView>
              {filteredPlayers.map((player: any) => (
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
                      <Star size={16} color="#FFD700" fill="#FFD700" style={styles.favoriteIcon} />
                    )}
                    <View style={[
                      styles.checkbox,
                      selectedPlayers.includes(player.id!) && styles.checkboxChecked
                    ]}>
                      {selectedPlayers.includes(player.id!) && (
                        <Check size={16} color="#FFF" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}

              {filteredPlayers.length === 0 && (
                <View style={styles.emptyState}>
                  <Search size={48} color="#CCC" />
                  <Text style={styles.emptyStateText}>Oyuncu bulunamadı</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Save Template Modal */}
      <Modal
        visible={showSaveTemplateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSaveTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şablon Olarak Kaydet</Text>
              <TouchableOpacity onPress={() => setShowSaveTemplateModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.saveTemplateForm}>
              <TextInput
                style={styles.templateNameInput}
                placeholder="Şablon Adı (örn: Perşembe Akşam Futbol)"
                value={templateName}
                onChangeText={setTemplateName}
              />

              <View style={styles.templatePreview}>
                <Text style={styles.templatePreviewTitle}>Kaydedilecek Bilgiler:</Text>
                <Text style={styles.templatePreviewText}>
                  • Spor: {SPORT_CONFIGS[selectedSport].emoji} {SPORT_CONFIGS[selectedSport].name}
                </Text>
                <Text style={styles.templatePreviewText}>• Saha: {venue}</Text>
                <Text style={styles.templatePreviewText}>• Maliyet: ₺{costPerPlayer}</Text>
                <Text style={styles.templatePreviewText}>
                  • Kadro: {staffCount}, Yedek: {reserveCount}
                </Text>
                <Text style={styles.templatePreviewText}>
                  • Seçili Oyuncular: {selectedPlayers.length}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, savingTemplate && styles.saveButtonDisabled]}
                onPress={handleSaveAsTemplate}
                disabled={savingTemplate}
              >
                {savingTemplate ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Şablonu Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  saveTemplateButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
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
    color: '#007AFF',
    fontWeight: '500',
  },
  sportScrollContent: {
    paddingRight: 16,
  },
  sportCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    minWidth: 100,
  },
  sportCardActive: {
    backgroundColor: '#FFF',
  },
  sportEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  sportName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  templateButtonText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  halfInput: {
    flex: 1,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  textArea: {
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 15,
    color: '#000',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
  },
  playerSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  playerSelectionText: {
    flex: 1,
    fontSize: 15,
    color: '#000',
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
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
  },
  playerChipText: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  infoContainer: {
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
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
    backgroundColor: '#FFF',
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
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 14,
    color: '#666',
  },
  emptyTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  emptyTemplateText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
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
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  playerItemInfo: {
    flex: 1,
  },
  playerItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  playerItemPhone: {
    fontSize: 13,
    color: '#666',
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
    borderColor: '#CCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 15,
    color: '#999',
  },
  saveTemplateForm: {
    padding: 16,
  },
  templateNameInput: {
    padding: 14,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 15,
    color: '#000',
    marginBottom: 16,
  },
  templatePreview: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  templatePreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  templatePreviewText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

