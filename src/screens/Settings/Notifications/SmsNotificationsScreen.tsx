// src/screens/Settings/Notifications/SmsNotificationsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MessageSquare, AlertTriangle, DollarSign } from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';

export const SmsNotificationsScreen: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const result = await UserSettingsService.getUserSettings(user.id);

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayarlar yüklenemedi');
      }
    } catch (error) {
      console.error('Settings load error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSmsEnabled = async (value: boolean) => {
    if (!user?.id || !settings) return;

    // Check if main notifications are enabled
    if (!settings.notifications.enabled && value) {
      Alert.alert(
        'Bildirimler Kapalı',
        'SMS bildirimleri için önce ana bildirim ayarını açmalısınız.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Ayarlara Git',
            onPress: () => goBack(),
          },
        ]
      );
      return;
    }

    // Show cost warning
    if (value) {
      Alert.alert(
        'SMS Ücreti Uyarısı',
        'SMS bildirimleri operatör tarafından ücretlendirilebilir. Devam etmek istiyor musunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Devam Et',
            onPress: () => updateSmsEnabled(value),
          },
        ]
      );
      return;
    }

    updateSmsEnabled(value);
  };

  const updateSmsEnabled = async (value: boolean) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateSmsNotifications(user.id, {
        enabled: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        
        if (!value) {
          Alert.alert(
            'SMS Bildirimleri Kapatıldı',
            'Artık SMS bildirimi almayacaksınız.'
          );
        } else {
          Alert.alert(
            'SMS Bildirimleri Açıldı',
            'SMS bildirimleri artık aktif. Operatörünüz tarafından ücretlendirilebilir.'
          );
        }
      } else {
        Alert.alert('Hata', 'SMS bildirimleri güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle SMS error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (
    key: keyof IUserSettings['notifications']['sms'],
    value: boolean
  ) => {
    if (!user?.id || !settings) return;

    // Check if SMS notifications are enabled
    if (!settings.notifications.sms.enabled && value) {
      Alert.alert(
        'SMS Bildirimleri Kapalı',
        'Bu bildirimi açmak için önce SMS bildirimlerini aktif etmelisiniz.'
      );
      return;
    }

    // Show cost warning for additional features
    if (value && key === 'matchReminders') {
      Alert.alert(
        'SMS Ücreti Uyarısı',
        'Bu özellik her maç için SMS gönderir. Operatörünüz tarafından ücretlendirilebilir.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Devam Et',
            onPress: () => updateSetting(key, value),
          },
        ]
      );
      return;
    }

    updateSetting(key, value);
  };

  const updateSetting = async (
    key: keyof IUserSettings['notifications']['sms'],
    value: boolean
  ) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateSmsNotifications(user.id, {
        [key]: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle setting error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableAll = () => {
    Alert.alert(
      'Tüm SMS Bildirimlerini Aç',
      'Tüm SMS bildirimleri açılacak. Bu özellik operatörünüz tarafından ücretlendirilebilir. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Aç',
          onPress: async () => {
            if (!user?.id || !settings) return;

            setSaving(true);
            try {
              const result = await UserSettingsService.updateSmsNotifications(
                user.id,
                {
                  enabled: true,
                  matchReminders: true,
                  matchCancellations: true,
                  urgentUpdates: true,
                  paymentReminders: true,
                  emergencyOnly: false,
                }
              );

              if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Tüm SMS bildirimleri açıldı');
              } else {
                Alert.alert('Hata', 'Ayarlar güncellenemedi');
              }
            } catch (error) {
              console.error('Enable all error:', error);
              Alert.alert('Hata', 'Bir hata oluştu');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleDisableAll = () => {
    Alert.alert(
      'Tüm SMS Bildirimlerini Kapat',
      'Tüm SMS bildirimleri kapatılacak. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id || !settings) return;

            setSaving(true);
            try {
              const result = await UserSettingsService.updateSmsNotifications(
                user.id,
                {
                  enabled: false,
                }
              );

              if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Tüm SMS bildirimleri kapatıldı');
              } else {
                Alert.alert('Hata', 'Ayarlar güncellenemedi');
              }
            } catch (error) {
              console.error('Disable all error:', error);
              Alert.alert('Hata', 'Bir hata oluştu');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="SMS Bildirimleri"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="SMS Bildirimleri"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  const smsEnabled = settings.notifications.enabled && settings.notifications.sms.enabled;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="SMS Bildirimleri"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cost Warning Card */}
        <View style={styles.costWarningCard}>
          <View style={styles.costWarningIconContainer}>
            <DollarSign size={24} color="#F59E0B" strokeWidth={2} />
          </View>
          <View style={styles.costWarningContent}>
            <Text style={styles.costWarningTitle}>Ücretlendirme Uyarısı</Text>
            <Text style={styles.costWarningText}>
              SMS bildirimleri operatörünüz tarafından ücretlendirilebilir.
              Sınırsız SMS paketiniz yoksa ek ücretler uygulanabilir.
            </Text>
          </View>
        </View>

        {/* Phone Info Card */}
        <View style={styles.phoneInfoCard}>
          <View style={styles.phoneIconContainer}>
            <MessageSquare size={24} color="#8B5CF6" strokeWidth={2} />
          </View>
          <View style={styles.phoneInfoContent}>
            <Text style={styles.phoneInfoTitle}>Telefon Numarası</Text>
            <Text style={styles.phoneInfoText}>
              {user?.phone || 'Belirlenmedi'}
            </Text>
            <Text style={styles.phoneInfoSubtext}>
              SMS'ler bu numaraya gönderilecek
            </Text>
          </View>
        </View>

        {/* Master Toggle */}
        <SettingsSection
          title="Genel"
          footer="SMS bildirimlerini tamamen açıp kapatabilirsiniz"
        >
          <SettingsToggle
            title="SMS Bildirimlerini Aktif Et"
            subtitle={
              smsEnabled
                ? 'SMS bildirimleri açık'
                : 'SMS bildirimleri kapalı'
            }
            value={settings.notifications.sms.enabled}
            onValueChange={handleToggleSmsEnabled}
            disabled={saving || !settings.notifications.enabled}
          />
        </SettingsSection>

        {/* SMS Notifications */}
        <SettingsSection
          title="SMS Bildirimleri"
          footer="Sadece önemli bildirimleri SMS ile almak için seçin"
        >
          <SettingsToggle
            title="Maç Hatırlatıcıları"
            subtitle="Maç günü hatırlatma SMS'i"
            value={settings.notifications.sms.matchReminders}
            onValueChange={(value) =>
              handleToggleSetting('matchReminders', value)
            }
            disabled={saving || !smsEnabled}
          />

          <SettingsToggle
            title="Maç İptalleri"
            subtitle="Acil maç iptali bildirimleri"
            value={settings.notifications.sms.matchCancellations}
            onValueChange={(value) =>
              handleToggleSetting('matchCancellations', value)
            }
            disabled={saving || !smsEnabled}
          />

          <SettingsToggle
            title="Acil Güncellemeler"
            subtitle="Önemli sistem güncellemeleri"
            value={settings.notifications.sms.urgentUpdates}
            onValueChange={(value) =>
              handleToggleSetting('urgentUpdates', value)
            }
            disabled={saving || !smsEnabled}
          />

          <SettingsToggle
            title="Ödeme Hatırlatıcıları"
            subtitle="Ödeme yapmanız gerektiğinde"
            value={settings.notifications.sms.paymentReminders}
            onValueChange={(value) =>
              handleToggleSetting('paymentReminders', value)
            }
            disabled={saving || !smsEnabled}
          />
        </SettingsSection>

        {/* Emergency Only Mode */}
        <SettingsSection
          title="Acil Durum Modu"
          footer="Açıldığında sadece kritik bildirimler SMS ile gönderilir"
        >
          <SettingsToggle
            title="Sadece Acil Durumlar"
            subtitle={
              settings.notifications.sms.emergencyOnly
                ? 'Sadece acil bildirimler gönderilir'
                : 'Tüm seçili bildirimler gönderilir'
            }
            value={settings.notifications.sms.emergencyOnly}
            onValueChange={(value) =>
              handleToggleSetting('emergencyOnly', value)
            }
            disabled={saving || !smsEnabled}
          />
        </SettingsSection>

        {/* Quick Actions */}
        <SettingsSection>
          {smsEnabled ? (
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Hızlı İşlemler</Text>
              <View style={styles.actionsButtons}>
                <View style={styles.actionButton}>
                  <Text
                    style={styles.actionButtonText}
                    onPress={handleDisableAll}
                  >
                    Tümünü Kapat
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>Hızlı İşlemler</Text>
              <View style={styles.actionsButtons}>
                <View style={[styles.actionButton, styles.actionButtonPrimary]}>
                  <Text
                    style={[
                      styles.actionButtonText,
                      styles.actionButtonTextPrimary,
                    ]}
                    onPress={handleEnableAll}
                  >
                    Tümünü Aç
                  </Text>
                </View>
              </View>
            </View>
          )}
        </SettingsSection>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Özet</Text>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Toplam bildirim türü</Text>
              <Text style={styles.summaryValue}>5</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Aktif bildirimler</Text>
              <Text style={styles.summaryValue}>
                {Object.values(settings.notifications.sms).filter(
                  (v) => v === true
                ).length}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Acil durum modu</Text>
              <Text style={styles.summaryValue}>
                {settings.notifications.sms.emergencyOnly ? 'Açık' : 'Kapalı'}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Öneri</Text>
          <Text style={styles.infoText}>
            SMS bildirimleri ücretli olduğu için sadece kritik bildirimler için
            kullanmanızı öneririz. Push bildirimleri ücretsiz ve daha hızlı bir
            alternatiftir.
          </Text>
        </View>

        {/* Cost Estimation Card */}
        <View style={styles.estimationCard}>
          <View style={styles.estimationHeader}>
            <DollarSign size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.estimationTitle}>Tahmini Aylık Maliyet</Text>
          </View>
          <View style={styles.estimationContent}>
            <Text style={styles.estimationText}>
              Ortalama bir kullanıcı ayda{' '}
              <Text style={styles.estimationBold}>4-8 SMS</Text> bildirimi
              alır. Operatörünüzün SMS ücretine göre aylık{' '}
              <Text style={styles.estimationBold}>2-5 TL</Text> arası ek
              ücret oluşabilir.
            </Text>
          </View>
          <View style={styles.estimationFooter}>
            <Text style={styles.estimationFooterText}>
              Sınırsız SMS paketiniz varsa ek ücret ödemezsiniz.
            </Text>
          </View>
        </View>

        {/* Warning Card */}
        <View style={styles.warningCard}>
          <View style={styles.warningIconContainer}>
            <AlertTriangle size={20} color="#F59E0B" strokeWidth={2} />
          </View>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Önemli Not</Text>
            <Text style={styles.warningText}>
              • SMS bildirimleri yurt dışındayken daha pahalı olabilir{'\n'}
              • Roaming açıksa ek ücretler uygulanabilir{'\n'}
              • Telefon numaranızı güncel tutun{'\n'}
              • Spam filtresi SMS'leri engelleyebilir
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },

  // Cost Warning Card
  costWarningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  costWarningIconContainer: {
    marginRight: 12,
  },
  costWarningContent: {
    flex: 1,
  },
  costWarningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  costWarningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },

  // Phone Info Card
  phoneInfoCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  phoneIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  phoneInfoContent: {
    flex: 1,
  },
  phoneInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  phoneInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  phoneInfoSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  // Actions
  actionsContainer: {
    padding: 16,
  },
  actionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
  },
  actionButtonPrimary: {
    backgroundColor: '#D1FAE5',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  actionButtonTextPrimary: {
    color: '#16a34a',
  },

  // Summary Card
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryContent: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Estimation Card
  estimationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  estimationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  estimationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  estimationContent: {
    marginBottom: 12,
  },
  estimationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  estimationBold: {
    fontWeight: '700',
    color: '#EF4444',
  },
  estimationFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  estimationFooterText: {
    fontSize: 13,
    color: '#10B981',
    fontWeight: '600',
  },

  // Warning Card
  warningCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  warningIconContainer: {
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
});