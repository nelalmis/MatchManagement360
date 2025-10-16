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
  Settings,
} from 'lucide-react-native';
import { useAppContext } from '../../context/AppContext';
import {
  IMatchFixture,
  IPlayer,
  SportType,
  getSportIcon,
} from '../../types/types';
import { matchFixtureService } from '../../services/matchFixtureService';
import { playerService } from '../../services/playerService';
import { RouteProp, useRoute } from '@react-navigation/native';
import { EditFixtureRouteProp, NavigationService } from '../../navigation';
import { eventManager, Events, FixtureEventData } from '../../utils';

type TabType = 'basic' | 'schedule' | 'players' | 'organizers';

export const EditFixtureScreen: React.FC = () => {
  const { user } = useAppContext();
  const route = useRoute<EditFixtureRouteProp>();
  const fixtureId = route.params?.fixtureId;

  // State
  const [fixture, setFixture] = useState<IMatchFixture | null>(null);
  const [allPlayers, setAllPlayers] = useState<IPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');

  // Player Search Modal
  const [showPlayerSearch, setShowPlayerSearch] = useState(false);
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [playerSearchType, setPlayerSearchType] = useState<'premium' | 'direct' | 'organizer' | 'teamBuilding'>('premium');

  useEffect(() => {
    loadData();
  }, [fixtureId]);

  const loadData = async () => {
    if (!fixtureId) {
      Alert.alert('Hata', 'Fikstür ID bulunamadı');
      NavigationService.goBack();
      return;
    }

    try {
      setLoading(true);
      const [fixtureData, playersData] = await Promise.all([
        matchFixtureService.getById(fixtureId),
        playerService.getAll(),
      ]);

      if (!fixtureData) {
        Alert.alert('Hata', 'Fikstür bulunamadı');
        NavigationService.goBack();
        return;
      }

      setFixture(fixtureData);
      setAllPlayers(playersData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFixture = async () => {
    if (!fixture) return;

    // Validations
    if (!fixture.title.trim()) {
      Alert.alert('Hata', 'Fikstür adı boş olamaz');
      return;
    }

    if (!fixture.location.trim()) {
      Alert.alert('Hata', 'Lokasyon boş olamaz');
      return;
    }

    if (new Date(fixture.registrationStartTime) >= new Date(fixture.matchStartTime)) {
      Alert.alert('Hata', 'Kayıt başlangıcı maç saatinden önce olmalı');
      return;
    }

    try {
      setSaving(true);
      await matchFixtureService.update(fixture.id, fixture);

      // ✅ Type-safe event tetikle
      eventManager.emit(Events.FIXTURE_UPDATED, {
        fixtureId,
        timestamp: Date.now()
      } as FixtureEventData);

      Alert.alert('Başarılı', 'Fikstür başarıyla güncellendi', [
        {
          text: 'Tamam',
          onPress: () => NavigationService.goBack()
        }
      ]);
    } catch (error) {
      console.error('Error saving fixture:', error);
      Alert.alert('Hata', 'Fikstür güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const openPlayerSearch = (type: 'premium' | 'direct' | 'organizer' | 'teamBuilding') => {
    setPlayerSearchType(type);
    setShowPlayerSearch(true);
  };

  const addPlayer = (playerId: string) => {
    if (!fixture) return;

    if (playerSearchType === 'premium') {
      if (!fixture.premiumPlayerIds?.includes(playerId)) {
        setFixture({
          ...fixture,
          premiumPlayerIds: [...(fixture.premiumPlayerIds || []), playerId]
        });
      }
    } else if (playerSearchType === 'direct') {
      if (!fixture.directPlayerIds?.includes(playerId)) {
        setFixture({
          ...fixture,
          directPlayerIds: [...(fixture.directPlayerIds || []), playerId]
        });
      }
    } else if (playerSearchType === 'organizer') {
      if (!fixture.organizerPlayerIds.includes(playerId)) {
        setFixture({
          ...fixture,
          organizerPlayerIds: [...fixture.organizerPlayerIds, playerId]
        });
      }
    } else if (playerSearchType === 'teamBuilding') {
      if (!fixture.teamBuildingAuthorityPlayerIds?.includes(playerId)) {
        setFixture({
          ...fixture,
          teamBuildingAuthorityPlayerIds: [...(fixture.teamBuildingAuthorityPlayerIds || []), playerId]
        });
      }
    }

    setShowPlayerSearch(false);
    setPlayerSearchQuery('');
  };

  const removePlayer = (playerId: string, type: 'premium' | 'direct' | 'organizer' | 'teamBuilding') => {
    if (!fixture) return;

    if (type === 'premium') {
      setFixture({
        ...fixture,
        premiumPlayerIds: (fixture.premiumPlayerIds || []).filter(id => id !== playerId)
      });
    } else if (type === 'direct') {
      setFixture({
        ...fixture,
        directPlayerIds: (fixture.directPlayerIds || []).filter(id => id !== playerId)
      });
    } else if (type === 'organizer') {
      setFixture({
        ...fixture,
        organizerPlayerIds: fixture.organizerPlayerIds.filter(id => id !== playerId)
      });
    } else if (type === 'teamBuilding') {
      setFixture({
        ...fixture,
        teamBuildingAuthorityPlayerIds: (fixture.teamBuildingAuthorityPlayerIds || []).filter(id => id !== playerId)
      });
    }
  };

  const toggleStatus = () => {
    if (!fixture) return;
    setFixture({
      ...fixture,
      status: fixture.status === 'Aktif' ? 'Pasif' : 'Aktif'
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !fixture) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loadingText}>Fikstür yükleniyor...</Text>
      </View>
    );
  }

  const availablePlayers = allPlayers.filter(p => {
    if (playerSearchType === 'premium') return !(fixture.premiumPlayerIds || []).includes(p.id!);
    if (playerSearchType === 'direct') return !(fixture.directPlayerIds || []).includes(p.id!);
    if (playerSearchType === 'organizer') return !fixture.organizerPlayerIds.includes(p.id!);
    if (playerSearchType === 'teamBuilding') return !(fixture.teamBuildingAuthorityPlayerIds || []).includes(p.id!);
    return true;
  });

  const filteredAvailablePlayers = availablePlayers.filter(p =>
    `${p.name} ${p.surname}`.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  const premiumPlayers = allPlayers.filter(p => (fixture.premiumPlayerIds || []).includes(p.id!));
  const directPlayers = allPlayers.filter(p => (fixture.directPlayerIds || []).includes(p.id!));
  const organizerPlayers = allPlayers.filter(p => fixture.organizerPlayerIds.includes(p.id!));
  const teamBuildingPlayers = allPlayers.filter(p => (fixture.teamBuildingAuthorityPlayerIds || []).includes(p.id!));

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
          <Text style={styles.headerTitle}>Fikstür Düzenle</Text>
          <Text style={styles.headerSubtitle}>
            {getSportIcon(fixture.sportType)} {fixture.title}
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleSaveFixture}
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
          onPress={() => setActiveTab('basic')}
          style={[styles.tab, activeTab === 'basic' && styles.tabActive]}
          activeOpacity={0.7}
        >
          <Settings size={18} color={activeTab === 'basic' ? '#16a34a' : '#6B7280'} strokeWidth={2} />
          <Text style={[styles.tabText, activeTab === 'basic' && styles.tabTextActive]}>
            Temel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('schedule')}
          style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
          activeOpacity={0.7}
        >
          <Clock size={18} color={activeTab === 'schedule' ? '#16a34a' : '#6B7280'} strokeWidth={2} />
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>
            Zamanlama
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('players')}
          style={[styles.tab, activeTab === 'players' && styles.tabActive]}
          activeOpacity={0.7}
        >
          <Users size={18} color={activeTab === 'players' ? '#16a34a' : '#6B7280'} strokeWidth={2} />
          <Text style={[styles.tabText, activeTab === 'players' && styles.tabTextActive]}>
            Oyuncular
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('organizers')}
          style={[styles.tab, activeTab === 'organizers' && styles.tabActive]}
          activeOpacity={0.7}
        >
          <Users size={18} color={activeTab === 'organizers' ? '#16a34a' : '#6B7280'} strokeWidth={2} />
          <Text style={[styles.tabText, activeTab === 'organizers' && styles.tabTextActive]}>
            Yönetim
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* BASIC TAB */}
        {activeTab === 'basic' && (
          <View style={styles.tabContent}>
            {/* Status */}
            <View style={styles.card}>
              <View style={styles.switchRow}>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchTitle}>Fikstür Durumu</Text>
                  <Text style={styles.switchDescription}>
                    {fixture.status === 'Aktif' ? 'Aktif - Maçlar oluşturulabilir' : 'Pasif - Maçlar durduruldu'}
                  </Text>
                </View>
                <Switch
                  value={fixture.status === 'Aktif'}
                  onValueChange={toggleStatus}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={fixture.status === 'Aktif' ? '#16a34a' : '#F3F4F6'}
                />
              </View>
            </View>

            {/* Title */}
            <View style={styles.card}>
              <Text style={styles.label}>Fikstür Adı *</Text>
              <TextInput
                style={styles.input}
                value={fixture.title}
                onChangeText={(text) => setFixture({ ...fixture, title: text })}
                placeholder="Örn: Salı Maçı"
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
                  value={fixture.location}
                  onChangeText={(text) => setFixture({ ...fixture, location: text })}
                  placeholder="Spor Kompleksi"
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
                  value={fixture.pricePerPlayer.toString()}
                  onChangeText={(text) => setFixture({ ...fixture, pricePerPlayer: Number(text) || 0 })}
                  placeholder="50"
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
                value={fixture.peterFullName}
                onChangeText={(text) => setFixture({ ...fixture, peterFullName: text })}
                placeholder="Ödeme alacak kişi adı"
                placeholderTextColor="#9CA3AF"
              />
              <View style={styles.spacer} />
              <TextInput
                style={styles.input}
                value={fixture.peterIban}
                onChangeText={(text) => setFixture({ ...fixture, peterIban: text })}
                placeholder="IBAN"
                placeholderTextColor="#9CA3AF"
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
                    value={fixture.staffPlayerCount.toString()}
                    onChangeText={(text) => setFixture({ ...fixture, staffPlayerCount: Number(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.smallLabel}>Yedek</Text>
                  <TextInput
                    style={styles.input}
                    value={fixture.reservePlayerCount.toString()}
                    onChangeText={(text) => setFixture({ ...fixture, reservePlayerCount: Number(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* SCHEDULE TAB */}
        {activeTab === 'schedule' && (
          <View style={styles.tabContent}>
            {/* Match Start Time */}
            <View style={styles.card}>
              <Text style={styles.label}>Maç Başlangıç Zamanı *</Text>
              <Text style={styles.dateDisplay}>{formatDate(fixture.matchStartTime)}</Text>
              <Text style={styles.hint}>Gerçek uygulamada DatePicker açılır</Text>
            </View>

            {/* Registration Start Time */}
            <View style={styles.card}>
              <Text style={styles.label}>Kayıt Başlangıç Zamanı *</Text>
              <Text style={styles.dateDisplay}>{formatDate(fixture.registrationStartTime)}</Text>
              <Text style={styles.hint}>Gerçek uygulamada DatePicker açılır</Text>
            </View>

            {/* Match Duration */}
            <View style={styles.card}>
              <Text style={styles.label}>Maç Süresi *</Text>
              <View style={styles.inputWithIcon}>
                <Clock size={20} color="#6B7280" strokeWidth={2} />
                <TextInput
                  style={styles.inputWithIconText}
                  value={fixture.matchTotalTimeInMinute.toString()}
                  onChangeText={(text) => setFixture({ ...fixture, matchTotalTimeInMinute: Number(text) || 0 })}
                  keyboardType="numeric"
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
                  value={fixture.isPeriodic}
                  onValueChange={(value) => setFixture({ ...fixture, isPeriodic: value })}
                  trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                  thumbColor={fixture.isPeriodic ? '#16a34a' : '#F3F4F6'}
                />
              </View>

              {fixture.isPeriodic && (
                <>
                  <View style={styles.spacer} />
                  <Text style={styles.label}>Tekrar Periyodu</Text>
                  <View style={styles.inputWithIcon}>
                    <Repeat size={20} color="#6B7280" strokeWidth={2} />
                    <TextInput
                      style={styles.inputWithIconText}
                      value={(fixture.periodDayCount || 7).toString()}
                      onChangeText={(text) => setFixture({ ...fixture, periodDayCount: Number(text) || 7 })}
                      keyboardType="numeric"
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

        {/* PLAYERS TAB */}
        {activeTab === 'players' && (
          <View style={styles.tabContent}>
            <View style={styles.infoBox}>
              <AlertCircle size={20} color="#2563EB" strokeWidth={2} />
              <View style={styles.infoBoxContent}>
                <Text style={styles.infoBoxText}>
                  Bu ayarlar fikstüre özeldir. Boş bırakırsanız lig ayarları kullanılır.
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
              <Text style={styles.hint}>Kayıt olursa kadroda öncelikli</Text>
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
              <Text style={styles.hint}>Otomatik kadroda, kayıt beklenmez</Text>
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

        {/* ORGANIZERS TAB */}
        {activeTab === 'organizers' && (
          <View style={styles.tabContent}>
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
                <Text style={styles.emptyText}>Organizatör yok</Text>
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
    backgroundColor: 'white',
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
    fontSize: 12,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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