// src/screens/Settings/Appearance/ThemeSelectionScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import {
  Sun,
  Moon,
  Smartphone,
  CheckCircle2,
  Palette,
  Eye,
  Zap,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';

type Theme = 'light' | 'dark' | 'system';

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string[];
  features: string[];
}

interface ColorScheme {
  primary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    label: 'Açık Tema',
    description: 'Gündüz kullanımı için optimize edilmiş',
    icon: <Sun size={32} color="#F59E0B" strokeWidth={2} />,
    color: '#F59E0B',
    gradient: ['#FEF3C7', '#FDE68A'],
    features: [
      'Gün ışığında daha rahat okuma',
      'Daha az göz yorgunluğu',
      'Geleneksel görünüm',
    ],
  },
  {
    value: 'dark',
    label: 'Koyu Tema',
    description: 'Gece kullanımı ve pil tasarrufu',
    icon: <Moon size={32} color="#3B82F6" strokeWidth={2} />,
    color: '#3B82F6',
    gradient: ['#1E293B', '#0F172A'],
    features: [
      'OLED ekranlarda pil tasarrufu',
      'Karanlıkta göz rahatlığı',
      'Modern ve şık görünüm',
    ],
  },
  {
    value: 'system',
    label: 'Otomatik (Sistem)',
    description: 'Cihaz ayarını takip eder',
    icon: <Smartphone size={32} color="#8B5CF6" strokeWidth={2} />,
    color: '#8B5CF6',
    gradient: ['#F3E8FF', '#E9D5FF'],
    features: [
      'Gün içinde otomatik değişim',
      'Cihaz ayarlarıyla uyumlu',
      'Esnek kullanım',
    ],
  },
];

const LIGHT_COLORS: ColorScheme = {
  primary: '#16a34a',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  text: '#1F2937',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

const DARK_COLORS: ColorScheme = {
  primary: '#22c55e',
  background: '#0F172A',
  surface: '#1E293B',
  text: '#F9FAFB',
  textSecondary: '#94A3B8',
  border: '#334155',
};

export const ThemeSelectionScreen: React.FC = () => {
  const { user } = useAuth();
  const systemColorScheme = useColorScheme();
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

  const handleSelectTheme = async (theme: Theme) => {
    if (!user?.id || !settings) return;

    setSaving(true);
    try {
      const result = await UserSettingsService.updateAppearance(user.id, {
        theme,
      });

      if (result.success && result.data) {
        setSettings(result.data);
        
        const themeOption = THEME_OPTIONS.find((t) => t.value === theme);
        Alert.alert(
          'Tema Değiştirildi',
          `${themeOption?.label} aktif edildi.${
            theme === 'system'
              ? '\n\nŞu anda: ' +
                (systemColorScheme === 'dark' ? 'Koyu Tema' : 'Açık Tema')
              : ''
          }`
        );
      } else {
        Alert.alert('Hata', 'Tema değiştirilemedi');
      }
    } catch (error) {
      console.error('Update theme error:', error);
      Alert.alert('Hata', 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const getActiveTheme = (): Theme => {
    if (!settings) return 'system';
    return settings.appearance.theme;
  };

  const getCurrentThemeColors = (): ColorScheme => {
    if (!settings) return LIGHT_COLORS;
    
    if (settings.appearance.theme === 'system') {
      return systemColorScheme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
    }
    
    return settings.appearance.theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Tema Seçimi"
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
          title="Tema Seçimi"
          showBack={true}
          onLeftPress={() => goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
        </View>
      </View>
    );
  }

  const activeTheme = getActiveTheme();
  const currentColors = getCurrentThemeColors();

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Tema Seçimi"
        showBack={true}
        onLeftPress={() => goBack()}
      />
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Active Theme */}
        <View style={styles.activeThemeCard}>
          <Palette size={24} color="#8B5CF6" strokeWidth={2} />
          <View style={styles.activeThemeContent}>
            <Text style={styles.activeThemeTitle}>Aktif Tema</Text>
            <Text style={styles.activeThemeValue}>
              {THEME_OPTIONS.find((t) => t.value === activeTheme)?.label}
            </Text>
            {activeTheme === 'system' && (
              <Text style={styles.activeThemeSubtext}>
                Şu anda: {systemColorScheme === 'dark' ? 'Koyu Tema' : 'Açık Tema'}
              </Text>
            )}
          </View>
        </View>

        {/* Theme Options */}
        <SettingsSection
          title="Tema Seçenekleri"
          footer="Size en uygun tema seçeneğini seçin"
        >
          <View style={styles.themeOptions}>
            {THEME_OPTIONS.map((theme) => {
              const isSelected = activeTheme === theme.value;

              return (
                <TouchableOpacity
                  key={theme.value}
                  style={[
                    styles.themeCard,
                    isSelected && [
                      styles.themeCardActive,
                      { borderColor: theme.color },
                    ],
                  ]}
                  onPress={() => handleSelectTheme(theme.value)}
                  disabled={saving}
                  activeOpacity={0.7}
                >
                  {/* Theme Header */}
                  <View style={styles.themeHeader}>
                    <View
                      style={[
                        styles.themeIconContainer,
                        { backgroundColor: `${theme.color}20` },
                      ]}
                    >
                      {theme.icon}
                    </View>

                    {isSelected && (
                      <View style={styles.themeCheckmark}>
                        <CheckCircle2
                          size={24}
                          color={theme.color}
                          strokeWidth={2}
                          fill={theme.color}
                        />
                      </View>
                    )}
                  </View>

                  {/* Theme Info */}
                  <View style={styles.themeInfo}>
                    <Text
                      style={[
                        styles.themeLabel,
                        isSelected && { color: theme.color },
                      ]}
                    >
                      {theme.label}
                    </Text>
                    <Text style={styles.themeDescription}>
                      {theme.description}
                    </Text>
                  </View>

                  {/* Theme Preview */}
                  <View style={styles.themePreview}>
                    <View
                      style={[
                        styles.previewBox,
                        {
                          backgroundColor:
                            theme.value === 'dark'
                              ? DARK_COLORS.background
                              : theme.value === 'light'
                              ? LIGHT_COLORS.background
                              : systemColorScheme === 'dark'
                              ? DARK_COLORS.background
                              : LIGHT_COLORS.background,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.previewElement,
                          {
                            backgroundColor:
                              theme.value === 'dark'
                                ? DARK_COLORS.surface
                                : theme.value === 'light'
                                ? LIGHT_COLORS.surface
                                : systemColorScheme === 'dark'
                                ? DARK_COLORS.surface
                                : LIGHT_COLORS.surface,
                          },
                        ]}
                      />
                      <View
                        style={[
                          styles.previewElement,
                          styles.previewElementSmall,
                          {
                            backgroundColor:
                              theme.value === 'dark'
                                ? DARK_COLORS.primary
                                : theme.value === 'light'
                                ? LIGHT_COLORS.primary
                                : systemColorScheme === 'dark'
                                ? DARK_COLORS.primary
                                : LIGHT_COLORS.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Theme Features */}
                  <View style={styles.themeFeatures}>
                    {theme.features.map((feature, index) => (
                      <View key={index} style={styles.featureRow}>
                        <View
                          style={[
                            styles.featureDot,
                            { backgroundColor: theme.color },
                          ]}
                        />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </SettingsSection>

        {/* Color Palette Preview */}
        <SettingsSection title="Aktif Renk Paleti">
          <View style={styles.colorPaletteCard}>
            <View style={styles.colorPaletteGrid}>
              <View style={styles.colorItem}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: currentColors.primary },
                  ]}
                />
                <Text style={styles.colorLabel}>Ana Renk</Text>
              </View>

              <View style={styles.colorItem}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: currentColors.background },
                    styles.colorSwatchBordered,
                  ]}
                />
                <Text style={styles.colorLabel}>Arkaplan</Text>
              </View>

              <View style={styles.colorItem}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: currentColors.surface },
                  ]}
                />
                <Text style={styles.colorLabel}>Yüzey</Text>
              </View>

              <View style={styles.colorItem}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: currentColors.text },
                  ]}
                />
                <Text style={styles.colorLabel}>Metin</Text>
              </View>
            </View>
          </View>
        </SettingsSection>

        {/* Benefits Section */}
        <View style={styles.benefitsCard}>
          <View style={styles.benefitsHeader}>
            <Zap size={20} color="#F59E0B" strokeWidth={2} />
            <Text style={styles.benefitsTitle}>Tema Avantajları</Text>
          </View>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Eye size={18} color="#10B981" strokeWidth={2} />
              <Text style={styles.benefitText}>
                Koyu tema OLED ekranlarda %30 pil tasarrufu sağlar
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Moon size={18} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.benefitText}>
                Gece kullanımında göz yorgunluğunu azaltır
              </Text>
            </View>

            <View style={styles.benefitItem}>
              <Smartphone size={18} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.benefitText}>
                Otomatik tema gün içinde akıllı şekilde değişir
              </Text>
            </View>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 İpucu</Text>
          <Text style={styles.infoText}>
            Otomatik tema seçeneği, cihazınızın saat ve konum bilgilerine göre
            gün içinde akıllıca tema değiştirir. Gündüz açık, gece koyu tema
            kullanarak hem göz sağlığınızı korur hem de pil tasarrufu yaparsınız.
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

  // Active Theme Card
  activeThemeCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeThemeContent: {
    flex: 1,
  },
  activeThemeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  activeThemeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  activeThemeSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Theme Options
  themeOptions: {
    padding: 16,
    gap: 16,
  },
  themeCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  themeCardActive: {
    borderWidth: 3,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Theme Header
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  themeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeCheckmark: {
    position: 'absolute',
    top: 0,
    right: 0,
  },

  // Theme Info
  themeInfo: {
    marginBottom: 16,
  },
  themeLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  // Theme Preview
  themePreview: {
    marginBottom: 16,
  },
  previewBox: {
    height: 80,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  previewElement: {
    height: 24,
    borderRadius: 4,
  },
  previewElementSmall: {
    height: 16,
    width: '60%',
  },

  // Theme Features
  themeFeatures: {
    gap: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },

  // Color Palette
  colorPaletteCard: {
    padding: 16,
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  colorItem: {
    width: '22%',
    alignItems: 'center',
    gap: 8,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  colorSwatchBordered: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  colorLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Benefits Card
  benefitsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
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
    lineHeight: 22,
  },
});