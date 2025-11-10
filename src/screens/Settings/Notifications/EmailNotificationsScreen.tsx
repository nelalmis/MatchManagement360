// src/screens/Settings/Notifications/EmailNotificationsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Mail } from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';

export const EmailNotificationsScreen: React.FC = () => {
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

  const handleToggleEmailEnabled = async (value: boolean) => {
    if (!user?.id || !settings) return;

    // Check if main notifications are enabled
    if (!settings.notifications.enabled && value) {
      Alert.alert(
        'Bildirimler Kapalı',
        'Email bildirimleri için önce ana bildirim ayarını açmalısınız.',
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

    setSaving(true);
    try {
      const result = await UserSettingsService.updateEmailNotifications(user.id, {
        enabled: value,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        
        if (!value) {
          Alert.alert(
            'Email Bildirimleri Kapatıldı',
            'Artık email bildirimi almayacaksınız.'
          );
        }
      } else {
        Alert.alert('Hata', 'Email bildirimleri güncellenemedi');
      }
    } catch (error) {
      console.error('Toggle email error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (
    key: keyof IUserSettings['notifications']['email'],
    value: boolean
  ) => {
    if (!user?.id || !settings) return;

    // Check if email notifications are enabled
    if (!settings.notifications.email.enabled && value) {
      Alert.alert(
        'Email Bildirimleri Kapalı',
        'Bu bildirimi açmak için önce email bildirimlerini aktif etmelisiniz.'
      );
      return;
    }

    setSaving(true);
    try {
      const result = await UserSettingsService.updateEmailNotifications(user.id, {
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

  const handleEnableAll = async () => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateEmailNotifications(user.id, {
        enabled: true,
        matchInvitations: true,
        matchReminders: true,
        matchCancellations: true,
        teamAssignments: true,
        paymentReminders: true,
        paymentReceived: true,
        ratingRequests: true,
        ratingReceived: true,
        mvpAnnouncements: true,
        seasonUpdates: true,
        weeklyDigest: true,
        monthlyReport: true,
        leagueInvitations: true,
        friendRequests: true,
        comments: true,
        mentions: true,
        systemUpdates: true,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'Tüm email bildirimleri açıldı');
      } else {
        Alert.alert('Hata', 'Ayarlar güncellenemedi');
      }
    } catch (error) {
      console.error('Enable all error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDisableAll = () => {
    Alert.alert(
      'Tüm Email Bildirimlerini Kapat',
      'Tüm email bildirimleri kapatılacak. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kapat',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id || !settings) return;

            setSaving(true);
            try {
              const result = await UserSettingsService.updateEmailNotifications(
                user.id,
                {
                  enabled: false,
                }
              );

              if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Tüm email bildirimleri kapatıldı');
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
          title="Email Bildirimleri"
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
          title="Email Bildirimleri"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  const emailEnabled = settings.notifications.enabled && settings.notifications.email.enabled;

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Email Bildirimleri"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Email Info Card */}
        <View style={styles.emailInfoCard}>
          <View style={styles.emailIconContainer}>
            <Mail size={24} color="#EF4444" strokeWidth={2} />
          </View>
          <View style={styles.emailInfoContent}>
            <Text style={styles.emailInfoTitle}>Email Adresi</Text>
            <Text style={styles.emailInfoText}>{user?.email || 'Belirlenmedi'}</Text>
            <Text style={styles.emailInfoSubtext}>
              Bildirimler bu adrese gönderilecek
            </Text>
          </View>
        </View>

        {/* Master Toggle */}
        <SettingsSection
          title="Genel"
          footer="Email bildirimlerini tamamen açıp kapatabilirsiniz"
        >
          <SettingsToggle
            title="Email Bildirimlerini Aktif Et"
            subtitle={
              emailEnabled
                ? 'Email bildirimleri açık'
                : 'Email bildirimleri kapalı'
            }
            value={settings.notifications.email.enabled}
            onValueChange={handleToggleEmailEnabled}
            disabled={saving || !settings.notifications.enabled}
          />
        </SettingsSection>

        {/* Match Related */}
        <SettingsSection
          title="Maç Bildirimleri"
          footer="Maçlarla ilgili email bildirimleri"
        >
          <SettingsToggle
            title="Maç Davetleri"
            subtitle="Yeni maç davetleri için email"
            value={settings.notifications.email.matchInvitations}
            onValueChange={(value) =>
              handleToggleSetting('matchInvitations', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Maç Hatırlatıcıları"
            subtitle="Yaklaşan maçlar için hatırlatma"
            value={settings.notifications.email.matchReminders}
            onValueChange={(value) =>
              handleToggleSetting('matchReminders', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Maç İptalleri"
            subtitle="İptal edilen maçlar için bildirim"
            value={settings.notifications.email.matchCancellations}
            onValueChange={(value) =>
              handleToggleSetting('matchCancellations', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Takım Atamaları"
            subtitle="Takıma atandığınızda bildirim"
            value={settings.notifications.email.teamAssignments}
            onValueChange={(value) =>
              handleToggleSetting('teamAssignments', value)
            }
            disabled={saving || !emailEnabled}
          />
        </SettingsSection>

        {/* Payment Related */}
        <SettingsSection
          title="Ödeme Bildirimleri"
          footer="Ödemelerle ilgili email bildirimleri"
        >
          <SettingsToggle
            title="Ödeme Hatırlatıcıları"
            subtitle="Ödeme yapmanız gerektiğinde"
            value={settings.notifications.email.paymentReminders}
            onValueChange={(value) =>
              handleToggleSetting('paymentReminders', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Ödeme Alındı"
            subtitle="Ödemeniz onaylandığında"
            value={settings.notifications.email.paymentReceived}
            onValueChange={(value) =>
              handleToggleSetting('paymentReceived', value)
            }
            disabled={saving || !emailEnabled}
          />
        </SettingsSection>

        {/* Rating & Performance */}
        <SettingsSection
          title="Değerlendirme & Performans"
          footer="Rating ve performansla ilgili bildirimler"
        >
          <SettingsToggle
            title="Değerlendirme İstekleri"
            subtitle="Oyuncuları değerlendirme istekleri"
            value={settings.notifications.email.ratingRequests}
            onValueChange={(value) =>
              handleToggleSetting('ratingRequests', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Değerlendirme Alındı"
            subtitle="Size verilen yeni değerlendirmeler"
            value={settings.notifications.email.ratingReceived}
            onValueChange={(value) =>
              handleToggleSetting('ratingReceived', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="MVP Duyuruları"
            subtitle="MVP seçildiğinizde bildirim"
            value={settings.notifications.email.mvpAnnouncements}
            onValueChange={(value) =>
              handleToggleSetting('mvpAnnouncements', value)
            }
            disabled={saving || !emailEnabled}
          />
        </SettingsSection>

        {/* League & Season */}
        <SettingsSection
          title="Lig & Sezon"
          footer="Lig ve sezonla ilgili bildirimler"
        >
          <SettingsToggle
            title="Lig Davetleri"
            subtitle="Yeni lig davetleri"
            value={settings.notifications.email.leagueInvitations}
            onValueChange={(value) =>
              handleToggleSetting('leagueInvitations', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Sezon Güncellemeleri"
            subtitle="Sezon başlangıç ve bitiş bildirimleri"
            value={settings.notifications.email.seasonUpdates}
            onValueChange={(value) =>
              handleToggleSetting('seasonUpdates', value)
            }
            disabled={saving || !emailEnabled}
          />
        </SettingsSection>

        {/* Social */}
        <SettingsSection
          title="Sosyal"
          footer="Sosyal etkileşimlerle ilgili bildirimler"
        >
          <SettingsToggle
            title="Arkadaşlık İstekleri"
            subtitle="Yeni arkadaşlık istekleri"
            value={settings.notifications.email.friendRequests}
            onValueChange={(value) =>
              handleToggleSetting('friendRequests', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Yorumlar"
            subtitle="Yorumlarınıza yanıt verildiğinde"
            value={settings.notifications.email.comments}
            onValueChange={(value) =>
              handleToggleSetting('comments', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Etiketlenmeler"
            subtitle="Bir yorumda @etiketlendiğinizde"
            value={settings.notifications.email.mentions}
            onValueChange={(value) =>
              handleToggleSetting('mentions', value)
            }
            disabled={saving || !emailEnabled}
          />
        </SettingsSection>

        {/* Reports & Digests */}
        <SettingsSection
          title="Raporlar & Özetler"
          footer="Periyodik raporlar ve özetler"
        >
          <SettingsToggle
            title="Haftalık Özet"
            subtitle="Her hafta aktivite özeti"
            value={settings.notifications.email.weeklyDigest}
            onValueChange={(value) =>
              handleToggleSetting('weeklyDigest', value)
            }
            disabled={saving || !emailEnabled}
          />

          <SettingsToggle
            title="Aylık Rapor"
            subtitle="Aylık performans raporu"
            value={settings.notifications.email.monthlyReport}
            onValueChange={(value) =>
              handleToggleSetting('monthlyReport', value)
            }
            disabled={saving || !emailEnabled}
          />
        </SettingsSection>

        {/* System */}
        <SettingsSection
          title="Sistem"
          footer="Sistem güncellemeleri ve duyurular"
        >
          <SettingsToggle
            title="Sistem Güncellemeleri"
            subtitle="Önemli sistem güncellemeleri"
            value={settings.notifications.email.systemUpdates}
            onValueChange={(value) =>
              handleToggleSetting('systemUpdates', value)
            }
            disabled={saving || !emailEnabled}
          />
        </SettingsSection>

        {/* Quick Actions */}
        <SettingsSection>
          {emailEnabled ? (
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
              <Text style={styles.summaryValue}>18</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Aktif bildirimler</Text>
              <Text style={styles.summaryValue}>
                {Object.values(settings.notifications.email).filter(
                  (v) => v === true
                ).length}
              </Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 Bilgi</Text>
          <Text style={styles.infoText}>
            Email bildirimleri, seçtiğiniz olaylar gerçekleştiğinde{' '}
            <Text style={styles.infoTextBold}>{user?.email}</Text> adresine
            gönderilecektir. Email adresinizi değiştirmek için profil
            ayarlarına gidin.
          </Text>
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

  // Email Info Card
  emailInfoCard: {
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
  emailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emailInfoContent: {
    flex: 1,
  },
  emailInfoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  emailInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  emailInfoSubtext: {
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
  infoTextBold: {
    fontWeight: '600',
    color: '#1F2937',
  },
});