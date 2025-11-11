// screens/Match/EditFriendlyMatchTemplateScreen.tsx
// ✅ UPDATED: Removed invitedPlayerIds (deprecated)

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
} from 'react-native';
import {
  ArrowLeft,
  Save,
  MapPin,
  DollarSign,
  Users,
  CreditCard,
  User,
  Info,
  Trash2,
  Clock,
} from 'lucide-react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { eventManager, Events } from '../../utils';
import { FriendlyMatchConfigService } from '../../services/serviceLayer/friendlyMatchConfigService';
import { SportType, IFriendlyMatchConfig } from '../../types/entity/types';
import { useAuth } from '../../hooks';
import { sportThemes } from '../../utils/theme';
import { goBack } from '../../navigation';
import { LoadingScreen } from '../Common';
import { CustomHeader } from '../../components/CustomHeader';

type EditTemplateRouteProp = RouteProp<{
  params: {
    templateId: string;
  };
}, 'params'>;

export const EditFriendlyMatchTemplateScreen: React.FC = () => {
  const route = useRoute<EditTemplateRouteProp>();
  const { user } = useAuth();
  const templateId = route.params?.templateId;

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Template Data
  const [templateName, setTemplateName] = useState('');
  const [selectedSport, setSelectedSport] = useState<SportType>('Futbol');

  // Match Settings
  const [location, setLocation] = useState('');
  const [pricePerPlayer, setPricePerPlayer] = useState('');
  const [staffCount, setStaffCount] = useState('10');
  const [reserveCount, setReserveCount] = useState('2');
  const [matchDuration, setMatchDuration] = useState('90');
  const [affectsStandings, setAffectsStandings] = useState(false);
  const [affectsStats, setAffectsStats] = useState(true);
  const [isPublic, setIsPublic] = useState(false); // Varsayılan: Özel

  // Payment Info
  const [paymentIban, setPaymentIban] = useState('');
  const [paymentAccountName, setPaymentAccountName] = useState('');

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    } else {
      Alert.alert('Hata', 'Template ID bulunamadı');
      goBack();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);

      // Load template
      const result = await FriendlyMatchConfigService.getTemplate(user!.id!, templateId);

      if (!result.success || !result.data) {
        Alert.alert('Hata', 'Şablon bulunamadı');
        goBack();
        return;
      }

      const template = result.data;

      // Set template data
      setTemplateName(template.name);
      const settings = template.settings;

      if (template.sportType) {
        setSelectedSport(template.sportType as SportType);
      }

      setLocation(settings.location || '');
      setPricePerPlayer(settings.pricePerPlayer?.toString() || '');
      setStaffCount(settings.staffCount?.toString() || '10');
      setReserveCount(settings.reserveCount?.toString() || '2');
      setMatchDuration(settings.matchDuration?.toString() || '90');
      // setAffectsStandings(settings.affectsStandings || false);
      // setAffectsStats(settings.affectsStats !== false);
      // setIsPublic(settings.isPublic !== false);

      // Payment info (old field names for backward compatibility)
      setPaymentIban(settings.paymentInfo?.iban || '');
      setPaymentAccountName(settings.paymentInfo?.accountName || '');

    } catch (error) {
      console.error('Error loading template:', error);
      Alert.alert('Hata', 'Şablon yüklenirken bir hata oluştu');
      goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!templateName.trim()) {
      Alert.alert('Hata', 'Lütfen şablon adı girin');
      return false;
    }

    if (!location.trim()) {
      Alert.alert('Hata', 'Lütfen lokasyon girin');
      return false;
    }

    const staff = parseInt(staffCount);
    const reserve = parseInt(reserveCount);
    const duration = parseInt(matchDuration);

    if (isNaN(staff) || staff < 2) {
      Alert.alert('Hata', 'Kadro sayısı en az 2 olmalı');
      return false;
    }

    if (isNaN(reserve) || reserve < 0) {
      Alert.alert('Hata', 'Yedek sayısı 0 veya daha fazla olmalı');
      return false;
    }

    if (isNaN(duration) || duration < 30 || duration > 180) {
      Alert.alert('Hata', 'Maç süresi 30-180 dakika arası olmalı');
      return false;
    }

    if (pricePerPlayer) {
      const price = parseFloat(pricePerPlayer);
      if (isNaN(price) || price < 0) {
        Alert.alert('Hata', 'Geçerli bir ücret girin');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const template = {
        name: templateName.trim(),
        sportType: selectedSport,
        settings: {
          location: location.trim(),
          pricePerPlayer: pricePerPlayer ? parseFloat(pricePerPlayer) : 0,
          staffCount: parseInt(staffCount),
          reserveCount: parseInt(reserveCount),
          matchDuration: parseInt(matchDuration),
          affectsStandings,
          affectsStats,
          isPublic,

          // Payment info (keeping old field names for now)
          peterIban: paymentIban.trim() || "",
          peterFullName: paymentAccountName.trim() || "",
        },
      };

      const result = await FriendlyMatchConfigService.updateTemplate(
        user!.id!,
        templateId,
        template
      );

      if (!result.success) {
        throw new Error(result.error?.message || 'Şablon güncellenemedi');
      }

      Alert.alert('Başarılı', 'Şablon güncellendi', [
        {
          text: 'Tamam',
          onPress: () => {
            eventManager.emit(Events.TEMPLATE_UPDATED);
            goBack();
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
              const result = await FriendlyMatchConfigService.removeTemplate(
                user!.id!,
                templateId
              );

              if (!result.success) {
                throw new Error(result.error?.message || 'Şablon silinemedi');
              }

              Alert.alert('Başarılı', 'Şablon silindi');
              eventManager.emit(Events.TEMPLATE_UPDATED);
              goBack();
            } catch (error: any) {
              console.error('Error deleting template:', error);
              Alert.alert('Hata', error.message || 'Şablon silinirken bir hata oluştu');
            }
          },
        },
      ]
    );
  };

  const sportColor = sportThemes[selectedSport].primary;
  const renderHeader = () => (
    <CustomHeader
      title="Şablonu Düzenle"
      showBack={true}
      onLeftPress={() => goBack()}
      showSave={true}
      sportType={selectedSport}
      showIcon={true}
      onSavePress={handleSave}
      disableSave={saving}
      loading={saving}
    />
  );

  if (loading) {
    return <LoadingScreen header={renderHeader()} loadingText="Şablon yükleniyor..." color={sportColor} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      {renderHeader()}

      {/* Content */}
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
            {(Object.keys(sportThemes) as SportType[]).map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportCard,
                  selectedSport === sport && styles.sportCardActive,
                  {
                    borderColor:
                      selectedSport === sport
                        ? sportThemes[sport].primary
                        : '#E5E7EB',
                  },
                ]}
                onPress={() => setSelectedSport(sport)}
              >
                <Text style={styles.sportEmoji}>{sportThemes[sport].emoji}</Text>
                <Text
                  style={[
                    styles.sportName,
                    selectedSport === sport && {
                      color: sportThemes[sport].primary,
                    },
                  ]}
                >
                  {sportThemes[sport].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Match Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maç Ayarları</Text>

          {/* Location */}
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={styles.inputText}
              placeholder="Lokasyon / Saha Adı"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Price */}
          <View style={styles.inputContainer}>
            <DollarSign size={20} color="#6B7280" strokeWidth={2} />
            <TextInput
              style={styles.inputText}
              placeholder="Kişi Başı Ücret (₺) - Opsiyonel"
              value={pricePerPlayer}
              onChangeText={setPricePerPlayer}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Staff, Reserve, Duration */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.thirdInput]}>
              <Users size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.inputText}
                placeholder="Kadro"
                value={staffCount}
                onChangeText={setStaffCount}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.thirdInput]}>
              <Users size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.inputText}
                placeholder="Yedek"
                value={reserveCount}
                onChangeText={setReserveCount}
                keyboardType="number-pad"
              />
            </View>

            <View style={[styles.inputContainer, styles.thirdInput]}>
              <Clock size={18} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.inputText}
                placeholder="Süre (dk)"
                value={matchDuration}
                onChangeText={setMatchDuration}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Payment Info */}
          <View style={styles.paymentSection}>
            <Text style={styles.subsectionTitle}>Ödeme Bilgileri (Opsiyonel)</Text>

            <View style={styles.inputContainer}>
              <CreditCard size={20} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.inputText}
                placeholder="IBAN"
                value={paymentIban}
                onChangeText={setPaymentIban}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <User size={20} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.inputText}
                placeholder="Hesap Sahibi Adı"
                value={paymentAccountName}
                onChangeText={setPaymentAccountName}
              />
            </View>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Varsayılan Ayarlar</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Herkese Açık</Text>
              <Text style={styles.settingDescription}>
                {isPublic
                  ? 'Herkes görebilir ve katılabilir'
                  : 'Sadece davet kodu ile katılım'}
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

        {/* Info Box */}
        <View style={styles.section}>
          <View style={styles.infoBox}>
            <Info size={20} color="#3B82F6" strokeWidth={2} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Şablon Kullanımı</Text>
              <Text style={styles.infoText}>
                Bu şablon maç oluştururken tüm ayarları otomatik dolduracak.
                {!isPublic && ' Özel maçlar için otomatik davet kodu oluşturulur.'}
              </Text>
            </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  textInput: {
    padding: 14,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F9FAFB',
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
  thirdInput: {
    flex: 1,
  },
  paymentSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
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
});