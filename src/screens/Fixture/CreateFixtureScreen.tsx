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
  MapPin,
  DollarSign,
  Clock,
  Repeat,
  AlertCircle,
  Search,
  Plus,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import {
  IMatchFixture,
  IPlayer,
  ILeague,
  SportType,
  getSportIcon,
  getSportColor,
  SPORT_CONFIGS,
} from '../../types/types';
import { matchFixtureService } from '../../services/matchFixtureService';
import { playerService } from '../../services/playerService';
import { leagueService } from '../../services/leagueService';
import { CreateFixtureRouteProp, NavigationService } from '../../navigation';
import { RouteProp, useRoute } from '@react-navigation/native';

type TabType = 'basic' | 'schedule' | 'players' | 'organizers';


export const CreateFixtureScreen: React.FC = () => {
  const { user } = useAppContext();
    const route = useRoute<CreateFixtureRouteProp>();

  const leagueId = route.params?.leagueId;

  // League Info
  const [league, setLeague] = useState<ILeague | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);

  // Form State - Basic Info
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerPlayer, setPricePerPlayer] = useState('');
  const [peterFullName, setPeterFullName] = useState('');
  const [peterIban, setPeterIban] = useState('');

  // Form State - Schedule
  const [matchStartTime, setMatchStartTime] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );
  const [registrationStartTime, setRegistrationStartTime] = useState(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  );
  const [matchTotalTimeInMinute, setMatchTotalTimeInMinute] = useState('60');
  const [isPeriodic, setIsPeriodic] = useState(false);
  const [periodDayCount, setPeriodDayCount] = useState('7');

  // Form State - Squad Settings
  const [staffPlayerCount, setStaffPlayerCount] = useState('10');
  const [reservePlayerCount, setReservePlayerCount] = useState('2');

  // Form State - Players
  const [premiumPlayerIds, setPremiumPlayerIds] = useState<string[]>([]);
  const [directPlayerIds, setDirectPlayerIds] = useState<string[]>([]);

  // Form State - Organizers
  const [organizerPlayerIds, setOrganizerPlayerIds] = useState<string[]>([]);
  const [teamBuildingAuthorityPlayerIds, setTeamBuildingAuthorityPlayerIds] = useState<string[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Basic, 2: Schedule, 3: Players, 4: Organizers
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerSearchType, setPlayerSearchType] = useState<'premium' | 'direct' | 'organizer' | 'teamBuilding'>('premium');

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

      // Set defaults from league
      const sportConfig = SPORT_CONFIGS[leagueData.sportType];
      setStaffPlayerCount(sportConfig.defaultPlayers.toString());
      setMatchTotalTimeInMinute(sportConfig.defaultDuration.toString());

      // Inherit league players as defaults
      setPremiumPlayerIds(leagueData.premiumPlayerIds || []);
      setDirectPlayerIds(leagueData.directPlayerIds || []);
      setTeamBuildingAuthorityPlayerIds(leagueData.teamBuildingAuthorityPlayerIds || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (currentStep === 1) {
      if (!title.trim()) {
        Alert.alert('Hata', 'Fikstür adı boş olamaz');
        return false;
      }
      if (!location.trim()) {
        Alert.alert('Hata', 'Lokasyon boş olamaz');
        return false;
      }
      if (!pricePerPlayer || isNaN(Number(pricePerPlayer))) {
        Alert.alert('Hata', 'Geçerli bir fiyat girin');
        return false;
      }
    }

    if (currentStep === 2) {
      if (new Date(registrationStartTime) >= new Date(matchStartTime)) {
        Alert.alert('Hata', 'Kayıt başlangıcı maç saatinden önce olmalı');
        return false;
      }
      if (!matchTotalTimeInMinute || isNaN(Number(matchTotalTimeInMinute))) {
        Alert.alert('Hata', 'Geçerli bir süre girin');
        return false;
      }
      if (isPeriodic && (!periodDayCount || isNaN(Number(periodDayCount)))) {
        Alert.alert('Hata', 'Geçerli bir periyot girin');
        return false;
      }
    }

    return true;
  };

  const handleCreateFixture = async () => {
    if (!league || !user?.id) return;

    try {
      setSaving(true);

      const newFixture: IMatchFixture = {
        id: null,
        leagueId: league.id,
        title: title.trim(),
        sportType: league.sportType,
        registrationStartTime: new Date(registrationStartTime),
        matchStartTime: new Date(matchStartTime),
        matchTotalTimeInMinute: Number(matchTotalTimeInMinute),
        isPeriodic,
        periodDayCount: isPeriodic ? Number(periodDayCount) : undefined,
        staffPlayerCount: Number(staffPlayerCount),
        reservePlayerCount: Number(reservePlayerCount),
        premiumPlayerIds,
        directPlayerIds,
        organizerPlayerIds: organizerPlayerIds.length > 0 ? organizerPlayerIds : [user.id],
        teamBuildingAuthorityPlayerIds,
        location: location.trim(),
        pricePerPlayer: Number(pricePerPlayer),
        peterIban: peterIban.trim(),
        peterFullName: peterFullName.trim(),
        status: 'Aktif',
        matchIds: [],
        createdAt: new Date().toISOString(),
      };

      const response = await matchFixtureService.add(newFixture);

      if (response.success) {
        Alert.alert(
          'Başarılı! 🎉',
          'Fikstür başarıyla oluşturuldu',
          [
            {
              text: 'Tamam',
              onPress: () => NavigationService.navigateToFixture(response.id)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating fixture:', error);
      Alert.alert('Hata', 'Fikstür oluşturulurken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (!validateForm()) return;
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const openPlayerSearch = (type: 'premium' | 'direct' | 'organizer' | 'teamBuilding') => {
    setPlayerSearchType(type);
    setShowPlayerSearch(true);
  };

  const addPlayer = (playerId: string) => {
    if (playerSearchType === 'premium') {
      if (!premiumPlayerIds.includes(playerId)) {
        setPremiumPlayerIds([...premiumPlayerIds, playerId]);
      }
    } else if (playerSearchType === 'direct') {
      if (!directPlayerIds.includes(playerId)) {
        setDirectPlayerIds([...directPlayerIds, playerId]);
      }
    } else if (playerSearchType === 'organizer') {
      if (!organizerPlayerIds.includes(playerId)) {
        setOrganizerPlayerIds([...organizerPlayerIds, playerId]);
      }
    } else if (playerSearchType === 'teamBuilding') {
      if (!teamBuildingAuthorityPlayerIds.includes(playerId)) {
        setTeamBuildingAuthorityPlayerIds([...teamBuildingAuthorityPlayerIds, playerId]);
      }
    }
    setShowPlayerSearch(false);
    setPlayerSearchQuery('');
  };

  const removePlayer = (playerId: string, type: 'premium' | 'direct' | 'organizer' | 'teamBuilding') => {
    if (type === 'premium') {
      setPremiumPlayerIds(premiumPlayerIds.filter(id => id !== playerId));
    } else if (type === 'direct') {
      setDirectPlayerIds(directPlayerIds.filter(id => id !== playerId));
    } else if (type === 'organizer') {
      setOrganizerPlayerIds(organizerPlayerIds.filter(id => id !== playerId));
    } else if (type === 'teamBuilding') {
      setTeamBuildingAuthorityPlayerIds(teamBuildingAuthorityPlayerIds.filter(id => id !== playerId));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !league) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  const availablePlayers = allPlayers.filter(p => {
    if (playerSearchType === 'premium') return !premiumPlayerIds.includes(p.id!);
    if (playerSearchType === 'direct') return !directPlayerIds.includes(p.id!);
    if (playerSearchType === 'organizer') return !organizerPlayerIds.includes(p.id!);
    if (playerSearchType === 'teamBuilding') return !teamBuildingAuthorityPlayerIds.includes(p.id!);
    return true;
  });

  const filteredAvailablePlayers = availablePlayers.filter(p =>
    `${p.name} ${p.surname}`.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  const premiumPlayers = allPlayers.filter(p => premiumPlayerIds.includes(p.id!));
  const directPlayers = allPlayers.filter(p => directPlayerIds.includes(p.id!));
  const organizerPlayers = allPlayers.filter(p => organizerPlayerIds.includes(p.id!));
  const teamBuildingPlayers = allPlayers.filter(p => teamBuildingAuthorityPlayerIds.includes(p.id!));

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
          <Text style={styles.headerTitle}>Yeni Fikstür</Text>
          <Text style={styles.headerSubtitle}>
            {getSportIcon(league.sportType)} {league.title}
          </Text>
        </View>

        <View style={styles.headerButton} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, currentStep >= 1 && styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, currentStep >= 2 && styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, currentStep >= 3 && styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, currentStep >= 4 && styles.progressSegmentActive]} />
        </View>
        <Text style={styles.progressText}>Adım {currentStep}/4</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* STEP 1: Basic Info */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Calendar size={32} color="#16a34a" strokeWidth={2} />
              <Text style={styles.stepTitle}>Temel Bilgiler</Text>
              <Text style={styles.stepDescription}>
                Fikstürün temel bilgilerini girin
              </Text>
            </View>

            {/* Fixture Title */}
            <View style={styles.card}>
              <Text style={styles.label}>Fikstür Adı *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Örn: Salı Maçı, Perşembe Halı Saha"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Location */}
            <View style={styles.card}>
              <Text style={styles.label}>Lokasyon *</Text>
              <View style={styles.inputWithIcon}>
                <MapPin size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.inputWithIconText}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Örn: Spor Kompleksi, Saha 2"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Price */}
            <View style={styles.card}>
              <Text style={styles.label}>Kişi Başı Ücret *</Text>
              <View style={styles.inputWithIcon}>
                <DollarSign size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.inputWithIconText}
                  value={pricePerPlayer}
                  onChangeText={setPricePerPlayer}
                  placeholder="Örn: 50"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
                <Text style={styles.inputSuffix}>TL</Text>
              </View>
            </View>

            {/* Payment Info */}
            <View style={styles.card}>
              <Text style={styles.label}>Ödeme Bilgileri</Text>
              <TextInput
                style={styles.input}
                value={peterFullName}
                onChangeText={setPeterFullName}
                placeholder="Ödeme alacak kişi adı"
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.spacer} />
              <TextInput
                style={styles.input}
                value={peterIban}
                onChangeText={setPeterIban}
                placeholder="IBAN"
                placeholderTextColor="#9CA3AF"
                keyboardType="default"
              />
            </View>

            {/* Squad Settings */}
            <View style={styles.card}>
              <Text style={styles.label}>Kadro Ayarları</Text>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.smallLabel}>Kadro</Text>
                  <TextInput
                    style={styles.input}
                    value={staffPlayerCount}
                    onChangeText={setStaffPlayerCount}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.smallLabel}>Yedek</Text>
                  <TextInput
                    style={styles.input}
                    value={reservePlayerCount}
                    onChangeText={setReservePlayerCount}
                    keyboardType="numeric"
                    placeholder="2"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* STEP 2: Schedule */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Clock size={32} color="#16a34a" strokeWidth={2} />
              <Text style={styles.stepTitle}>Zamanlama</Text>
              <Text style={styles.stepDescription}>
                Maç ve kayıt zamanlarını ayarlayın
              </Text>
            </View>

            {/* Match Start Time */}
            <View style={styles.card}>
              <Text style={styles.label}>Maç Başlangıç Zamanı *</Text>
              <Text style={styles.dateDisplay}>{formatDate(matchStartTime)}</Text>
              <Text style={styles.hint}>Gerçek uygulamada DatePicker açılır</Text>
            </View>

            {/* Registration Start Time */}
            <View style={styles.card}>
              <Text style={styles.label}>Kayıt Başlangıç Zamanı *</Text>
              <Text style={styles.dateDisplay}>{formatDate(registrationStartTime)}</Text>
              <Text style={styles.hint}>Gerçek uygulamada DatePicker açılır</Text>
            </View>

            {/* Match Duration */}
            <View style={styles.card}>
              <Text style={styles.label}>Maç Süresi *</Text>
              <View style={styles.inputWithIcon}>
                <Clock size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.inputWithIconText}
                  value={matchTotalTimeInMinute}
                  onChangeText={setMatchTotalTimeInMinute}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor="#9CA3AF"
                />
                <Text style={styles.inputSuffix}>dakika</Text>
              </View>
            </View>

            {/* Periodic Settings */}
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Repeat size={20} color="#6B7280" strokeWidth={2} />
                  <View style={styles.switchTextContainer}>
                    <Text style={styles.switchTitle}>Periyodik Fikstür</Text>
                    <Text style={styles.switchDescription}>
                      Düzenli aralıklarla tekrar eden maçlar
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isPeriodic}
                  onValueChange={setIsPeriodic}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={isPeriodic ? '#16a34a' : '#F3F4F6'}
                />
              </View>

              {isPeriodic && (
                <>
                  <View style={styles.spacer} />
                  <Text style={styles.label}>Tekrar Periyodu</Text>
                  <View style={styles.inputWithIcon}>
                    <Repeat size={20} color="#6B7280" strokeWidth={2} />
                    <TextInput
                      style={styles.inputWithIconText}
                      value={periodDayCount}
                      onChangeText={setPeriodDayCount}
                      keyboardType="numeric"
                      placeholder="7"
                      placeholderTextColor="#9CA3AF"
                    />
                    <Text style={styles.inputSuffix}>gün</Text>
                  </View>
                  <Text style={styles.hint}>
                    Örn: 7 = Her hafta, 14 = İki haftada bir
                  </Text>
                </>
              )}
            </View>
          </View>
        )}

        {/* STEP 3: Players */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Users size={32} color="#16a34a" strokeWidth={2} />
              <Text style={styles.stepTitle}>Özel Oyuncu Listesi</Text>
              <Text style={styles.stepDescription}>
                İsteğe bağlı - Ligden farklı ayarlamak için
              </Text>
            </View>

            <View style={styles.infoBox}>
              <AlertCircle size={20} color="#2563EB" strokeWidth={2} />
              <View style={styles.infoBoxContent}>
                <Text style={styles.infoBoxText}>
                  Boş bırakırsanız lig ayarları kullanılır
                </Text>
              </View>
            </View>

            {/* Premium Players */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Premium Oyuncular ({premiumPlayers.length})</Text>
                <TouchableOpacity
                  onPress={() => openPlayerSearch('premium')}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#16a34a" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              {premiumPlayers.map(player => (
                <PlayerItem
                  key={player.id}
                  player={player}
                  onRemove={() => removePlayer(player.id!, 'premium')}
                />
              ))}
              {premiumPlayers.length === 0 && (
                <Text style={styles.emptyText}>Premium oyuncu yok</Text>
              )}
            </View>

            {/* Direct Players */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Direkt Oyuncular ({directPlayers.length})</Text>
                <TouchableOpacity
                  onPress={() => openPlayerSearch('direct')}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#16a34a" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              {directPlayers.map(player => (
                <PlayerItem
                  key={player.id}
                  player={player}
                  onRemove={() => removePlayer(player.id!, 'direct')}
                />
              ))}
              {directPlayers.length === 0 && (
                <Text style={styles.emptyText}>Direkt oyuncu yok</Text>
              )}
            </View>
          </View>
        )}

        {/* STEP 4: Organizers */}
        {currentStep === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Users size={32} color="#16a34a" strokeWidth={2} />
              <Text style={styles.stepTitle}>Organizatörler</Text>
              <Text style={styles.stepDescription}>
                Fikstürü yönetecek kişiler
              </Text>
            </View>

            {/* Organizers */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Organizatörler ({organizerPlayers.length})</Text>
                <TouchableOpacity
                  onPress={() => openPlayerSearch('organizer')}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#16a34a" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Maçları oluşturabilir ve yönetebilir</Text>
              {organizerPlayers.map(player => (
                <PlayerItem
                  key={player.id}
                  player={player}
                  onRemove={() => removePlayer(player.id!, 'organizer')}
                />
              ))}
              {organizerPlayers.length === 0 && (
                <Text style={styles.emptyText}>Siz otomatik organizatör olacaksınız</Text>
              )}
            </View>

            {/* Team Building Authority */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Takım Kurma Yetkisi ({teamBuildingPlayers.length})</Text>
                <TouchableOpacity
                  onPress={() => openPlayerSearch('teamBuilding')}
                  activeOpacity={0.7}
                >
                  <Plus size={20} color="#16a34a" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <Text style={styles.hint}>Maçlarda takım oluşturabilir</Text>
              {teamBuildingPlayers.map(player => (
                <PlayerItem
                  key={player.id}
                  player={player}
                  onRemove={() => removePlayer(player.id!, 'teamBuilding')}
                />
              ))}
              {teamBuildingPlayers.length === 0 && (
                <Text style={styles.emptyText}>Takım kurma yetkisi yok</Text>
              )}
            </View>
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

        {currentStep < 4 ? (
          <TouchableOpacity
            onPress={nextStep}
            style={[styles.navButtonPrimary, currentStep === 1 && styles.navButtonFull]}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonPrimaryText}>İleri</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleCreateFixture}
            disabled={saving}
            style={[styles.navButtonPrimary, saving && styles.navButtonDisabled]}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" strokeWidth={2.5} />
                <Text style={styles.navButtonPrimaryText}>Fikstür Oluştur</Text>
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
        onRequestClose={() => setShowPlayerSearch(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Oyuncu Seç</Text>
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
                  <View style={styles.addBadge}>
                    <Plus size={16} color="white" strokeWidth={2.5} />
                  </View>
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

// Player Item Component
interface PlayerItemProps {
  player: IPlayer;
  onRemove: () => void;
}

const PlayerItem: React.FC<PlayerItemProps> = ({ player, onRemove }) => {
  return (
    <View style={styles.playerItem}>
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
        onPress={onRemove}
        style={styles.removeButton}
        activeOpacity={0.7}
      >
        <X size={20} color="#DC2626" strokeWidth={2} />
      </TouchableOpacity>
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
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
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
  progressText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  smallLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWithIconText: {
    flex: 1,
    fontSize: 15,
    color: '#1F2937',
  },
  inputSuffix: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  dateDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  switchDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  spacer: {
    height: 12,
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
  infoBoxText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
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
    paddingVertical: 12,
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
});