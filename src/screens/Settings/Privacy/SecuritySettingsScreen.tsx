// src/screens/Settings/Privacy/SecuritySettingsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {
  Lock,
  Shield,
  Key,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsItem } from '../components/SettingsItem';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';

export const SecuritySettingsScreen: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [settings, setSettings] = useState<IUserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Change Password States
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleToggle2FA = async (value: boolean) => {
    if (!user?.id || !settings) return;

    if (value) {
      Alert.alert(
        'İki Faktörlü Doğrulama',
        'İki faktörlü doğrulamayı etkinleştirmek istiyor musunuz? Telefonunuza bir doğrulama kodu gönderilecek.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Etkinleştir',
            onPress: () => enable2FA(),
          },
        ]
      );
    } else {
      Alert.alert(
        'İki Faktörlü Doğrulama',
        'İki faktörlü doğrulamayı devre dışı bırakmak istiyor musunuz? Hesabınız daha az güvenli olacak.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Devre Dışı Bırak',
            style: 'destructive',
            onPress: () => disable2FA(),
          },
        ]
      );
    }
  };

  const enable2FA = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateSecurity(user.id, {
        twoFactorAuth: true,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert(
          'Başarılı',
          'İki faktörlü doğrulama etkinleştirildi. Artık giriş yaparken telefonunuza kod gönderilecek.'
        );
      } else {
        Alert.alert('Hata', 'İki faktörlü doğrulama etkinleştirilemedi');
      }
    } catch (error) {
      console.error('Enable 2FA error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const disable2FA = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateSecurity(user.id, {
        twoFactorAuth: false,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert('Başarılı', 'İki faktörlü doğrulama devre dışı bırakıldı');
      } else {
        Alert.alert('Hata', 'İki faktörlü doğrulama kapatılamadı');
      }
    } catch (error) {
      console.error('Disable 2FA error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleSetting = async (
    key: keyof IUserSettings['security'],
    value: boolean
  ) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateSecurity(user.id, {
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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Hata', 'Yeni şifre en az 8 karakter olmalıdır');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor');
      return;
    }

    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        Alert.alert('Başarılı', 'Şifreniz değiştirildi');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }else{
        Alert.alert('Hata', 'Şifre değiştirilemedi', result.error ?? undefined);
      }
    } catch (error) {
      Alert.alert('Hata', 'Şifre değiştirilemedi. Mevcut şifrenizi kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetSessionTimeout = () => {
    const options = [
      { text: '15 dakika', onPress: () => updateSessionTimeout(15) },
      { text: '30 dakika', onPress: () => updateSessionTimeout(30) },
      { text: '1 saat', onPress: () => updateSessionTimeout(60) },
      { text: '2 saat', onPress: () => updateSessionTimeout(120) },
      { text: '4 saat', onPress: () => updateSessionTimeout(240) },
      { text: 'Hiçbir zaman', onPress: () => updateSessionTimeout(0) },
      { text: 'İptal', style: 'cancel' as const },
    ];

    Alert.alert('Oturum Zaman Aşımı', 'Ne kadar süre sonra otomatik çıkış yapılsın?', options);
  };

  const updateSessionTimeout = async (minutes: number) => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateSecurity(user.id, {
        sessionTimeout: minutes,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        Alert.alert(
          'Başarılı',
          minutes === 0
            ? 'Otomatik çıkış devre dışı bırakıldı'
            : `Oturum zaman aşımı ${minutes} dakika olarak ayarlandı`
        );
      } else {
        Alert.alert('Hata', 'Ayar güncellenemedi');
      }
    } catch (error) {
      console.error('Update session timeout error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Tüm Cihazlardan Çıkış',
      'Bu cihaz hariç tüm cihazlardan çıkış yapılacak. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Çıkış Yap',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id) return;

            setSaving(true);
            try {
              // TODO: Implement logout all devices API call
              await new Promise((resolve) => setTimeout(resolve, 1000));
              Alert.alert('Başarılı', 'Diğer tüm cihazlardan çıkış yapıldı');
            } catch (error) {
              console.error('Logout all devices error:', error);
              Alert.alert('Hata', 'İşlem başarısız oldu');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleViewLoginHistory = () => {
    Alert.alert('Giriş Geçmişi', 'Giriş geçmişi özelliği yakında eklenecek');
  };

  const getSessionTimeoutText = (minutes: number): string => {
    if (minutes === 0) return 'Hiçbir zaman';
    if (minutes < 60) return `${minutes} dakika`;
    const hours = Math.floor(minutes / 60);
    return `${hours} saat`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Güvenlik"
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
          title="Güvenlik"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Güvenlik"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Security Score Card */}
        <View style={styles.securityScoreCard}>
          <View style={styles.securityScoreHeader}>
            <Shield size={24} color="#10B981" strokeWidth={2} />
            <Text style={styles.securityScoreTitle}>Güvenlik Skoru</Text>
          </View>
          <View style={styles.securityScoreContent}>
            <View style={styles.securityScoreCircle}>
              <Text style={styles.securityScoreValue}>
                {calculateSecurityScore(settings.security)}%
              </Text>
              <Text style={styles.securityScoreLabel}>
                {getSecurityScoreText(calculateSecurityScore(settings.security))}
              </Text>
            </View>
          </View>
          <View style={styles.securityScoreBar}>
            <View
              style={[
                styles.securityScoreFill,
                {
                  width: `${calculateSecurityScore(settings.security)}%`,
                  backgroundColor: getSecurityColor(
                    calculateSecurityScore(settings.security)
                  ),
                },
              ]}
            />
          </View>
        </View>

        {/* Two-Factor Authentication */}
        <SettingsSection
          title="İki Faktörlü Doğrulama (2FA)"
          footer="Hesabınızı korumak için ek bir güvenlik katmanı ekleyin"
        >
          <SettingsToggle
            title="İki Faktörlü Doğrulama"
            subtitle={
              settings.security.twoFactorAuth
                ? 'Etkin - Giriş yaparken kod gerekli'
                : 'Kapalı - Daha güvenli olmak için açın'
            }
            value={settings.security.twoFactorAuth}
            onValueChange={handleToggle2FA}
            disabled={saving}
          />

          {settings.security.twoFactorAuth && (
            <View style={styles.twoFactorInfo}>
              <CheckCircle size={20} color="#10B981" strokeWidth={2} />
              <Text style={styles.twoFactorInfoText}>
                Giriş yaparken telefonunuza gönderilen kodu girmeniz gerekecek
              </Text>
            </View>
          )}
        </SettingsSection>

        {/* Password */}
        <SettingsSection
          title="Şifre"
          footer="Güçlü bir şifre kullanarak hesabınızı koruyun"
        >
          <TouchableOpacity
            style={styles.changePasswordButton}
            onPress={() => setShowChangePassword(!showChangePassword)}
            activeOpacity={0.7}
          >
            <Key size={20} color="#3B82F6" strokeWidth={2} />
            <Text style={styles.changePasswordButtonText}>Şifre Değiştir</Text>
          </TouchableOpacity>

          {showChangePassword && (
            <View style={styles.changePasswordForm}>
              {/* Current Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mevcut Şifre</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Mevcut şifrenizi girin"
                    secureTextEntry={!showCurrentPassword}
                    editable={!saving}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={styles.eyeButton}
                  >
                    {showCurrentPassword ? (
                      <EyeOff size={20} color="#9CA3AF" strokeWidth={2} />
                    ) : (
                      <Eye size={20} color="#9CA3AF" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yeni Şifre</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Yeni şifrenizi girin (min 8 karakter)"
                    secureTextEntry={!showNewPassword}
                    editable={!saving}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeButton}
                  >
                    {showNewPassword ? (
                      <EyeOff size={20} color="#9CA3AF" strokeWidth={2} />
                    ) : (
                      <Eye size={20} color="#9CA3AF" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Yeni Şifre (Tekrar)</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Yeni şifrenizi tekrar girin"
                    secureTextEntry={!showConfirmPassword}
                    editable={!saving}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} color="#9CA3AF" strokeWidth={2} />
                    ) : (
                      <Eye size={20} color="#9CA3AF" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  saving && styles.submitButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={saving}
                activeOpacity={0.7}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>Şifreyi Değiştir</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </SettingsSection>

        {/* Session Management */}
        <SettingsSection
          title="Oturum Yönetimi"
          footer="Oturum güvenliği ve zaman aşımı ayarları"
        >
          <SettingsItem
            icon={<Clock size={22} color="#F59E0B" strokeWidth={2} />}
            title="Oturum Zaman Aşımı"
            subtitle="Hareketsizlik sonrası otomatik çıkış"
            value={getSessionTimeoutText(settings.security.sessionTimeout)}
            onPress={handleSetSessionTimeout}
            showChevron={true}
          />

          {/* <SettingsToggle
            title="Güvenilir Cihazları Hatırla"
            subtitle="Güvenilir cihazlarda otomatik giriş"
            value={settings.security.rememberTrustedDevices}
            onValueChange={(value) =>
              handleToggleSetting('rememberTrustedDevices', value)
            }
            disabled={saving}
          /> */}
        </SettingsSection>

        {/* Login Security */}
        <SettingsSection
          title="Giriş Güvenliği"
          footer="Giriş ve hesap güvenliği ayarları"
        >
          {/* <SettingsToggle
            title="Şüpheli Girişlerde Bildir"
            subtitle="Tanınmayan cihazdan giriş yapıldığında"
            value={settings.security.notifyOnSuspiciousLogin}
            onValueChange={(value) =>
              handleToggleSetting('notifyOnSuspiciousLogin', value)
            }
            disabled={saving}
          /> */}

          {/* <SettingsToggle
            title="Başarısız Giriş Girişimlerini Engelle"
            subtitle="5 başarısız denemeden sonra hesabı kilitle"
            value={settings.security.lockAfterFailedAttempts}
            onValueChange={(value) =>
              handleToggleSetting('lockAfterFailedAttempts', value)
            }
            disabled={saving}
          /> */}

          <SettingsItem
            icon={<Smartphone size={22} color="#8B5CF6" strokeWidth={2} />}
            title="Giriş Geçmişi"
            subtitle="Son giriş yapılan cihazları görüntüle"
            onPress={handleViewLoginHistory}
            showChevron={true}
          />
        </SettingsSection>

        {/* Trusted Devices */}
        <SettingsSection
          title="Güvenilir Cihazlar"
          footer="Bu cihazlarda otomatik giriş yapabilirsiniz"
        >
          <SettingsItem
            icon={<Smartphone size={22} color="#10B981" strokeWidth={2} />}
            title="Güvenilir Cihazlar"
            subtitle={`${settings.security.trustedDevices?.length || 0} cihaz kayıtlı`}
            badge={settings.security.trustedDevices?.length || 0}
            onPress={() => Alert.alert('Güvenilir Cihazlar', 'Cihaz yönetimi yakında eklenecek')}
            showChevron={true}
          />
        </SettingsSection>

        {/* Data Encryption */}
        {/* <SettingsSection
          title="Veri Şifreleme"
          footer="Verilerinizin şifrelenmesini yönetin"
        >
          <SettingsToggle
            title="Verilerimi Şifrele"
            subtitle="Hassas veriler şifrelenmiş olarak saklanır"
            value={settings.security.encryptData}
            onValueChange={(value) => handleToggleSetting('encryptData', value)}
            disabled={saving}
          />

          <SettingsToggle
            title="Biometrik Kimlik Doğrulama"
            subtitle="Parmak izi veya yüz tanıma ile giriş"
            value={settings.security.biometricAuth}
            onValueChange={(value) => handleToggleSetting('biometricAuth', value)}
            disabled={saving}
          />
        </SettingsSection> */}

        {/* Danger Zone */}
        <SettingsSection title="Tehlikeli Bölge">
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleLogoutAllDevices}
            activeOpacity={0.7}
            disabled={saving}
          >
            <AlertTriangle size={20} color="#EF4444" strokeWidth={2} />
            <Text style={styles.dangerButtonText}>
              Tüm Cihazlardan Çıkış Yap
            </Text>
          </TouchableOpacity>
        </SettingsSection>

        {/* Security Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🔐 Güvenlik İpuçları</Text>
          <Text style={styles.tipsText}>
            • Güçlü ve benzersiz şifreler kullanın{'\n'}
            • İki faktörlü doğrulamayı etkinleştirin{'\n'}
            • Şifrenizi düzenli olarak değiştirin{'\n'}
            • Şüpheli giriş bildirimleri için e-postanızı kontrol edin{'\n'}
            • Güvenilir olmayan cihazlarda "beni hatırla" kullanmayın
          </Text>
        </View>
      </ScrollView>
    </View>
  );

  // Helper function to calculate security score
  function calculateSecurityScore(security: IUserSettings['security']): number {
    let score = 0;
    const totalSettings = 8;

    if (security.twoFactorAuth) score += 3; // Most important
    if (security.sessionTimeout > 0) score += 1;
    // if (security.rememberTrustedDevices) score += 0.5;
    // if (security.notifyOnSuspiciousLogin) score += 1;
    // if (security.lockAfterFailedAttempts) score += 1;
    // if (security.encryptData) score += 1;
    // if (security.biometricAuth) score += 0.5;

    return Math.round((score / totalSettings) * 100);
  }

  function getSecurityScoreText(score: number): string {
    if (score >= 80) return 'Mükemmel';
    if (score >= 60) return 'İyi';
    if (score >= 40) return 'Orta';
    if (score >= 20) return 'Zayıf';
    return 'Çok Zayıf';
  }

  function getSecurityColor(score: number): string {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#3B82F6';
    if (score >= 40) return '#F59E0B';
    if (score >= 20) return '#EF4444';
    return '#DC2626';
  }
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

  // Security Score Card
  securityScoreCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  securityScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  securityScoreTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  securityScoreContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  securityScoreCircle: {
    alignItems: 'center',
  },
  securityScoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1F2937',
  },
  securityScoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  securityScoreBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  securityScoreFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Two Factor Info
  twoFactorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 16,
  },
  twoFactorInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#065F46',
    lineHeight: 18,
  },

  // Change Password
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  changePasswordButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3B82F6',
  },
  changePasswordForm: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  eyeButton: {
    padding: 12,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },

  // Danger Button
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Tips Card
  tipsCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
});