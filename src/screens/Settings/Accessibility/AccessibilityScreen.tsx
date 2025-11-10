// src/screens/Settings/Accessibility/AccessibilityScreen.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
} from 'react-native';
import {
    Eye,
    EyeOff,
    Type,
    Volume2,
    Vibrate,
    ZoomIn,
    ZoomOut,
    Smartphone,
    Circle,
    CheckCircle2,
    Sun,
    Pause,
    Play,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { SettingsItem } from '../components/SettingsItem';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';

type TextSize = 'small' | 'medium' | 'large' | 'extraLarge' | 'huge';
type ColorScheme = 'normal' | 'highContrast' | 'grayscale' | 'colorBlind';
type MotionPreference = 'normal' | 'reduced' | 'none';

interface TextSizeOption {
    value: TextSize;
    label: string;
    multiplier: number;
    preview: number;
}

const TEXT_SIZE_OPTIONS: TextSizeOption[] = [
    {
        value: 'small',
        label: 'Küçük',
        multiplier: 0.85,
        preview: 13,
    },
    {
        value: 'medium',
        label: 'Orta (Varsayılan)',
        multiplier: 1.0,
        preview: 15,
    },
    {
        value: 'large',
        label: 'Büyük',
        multiplier: 1.15,
        preview: 17,
    },
    {
        value: 'extraLarge',
        label: 'Çok Büyük',
        multiplier: 1.3,
        preview: 19,
    },
    {
        value: 'huge',
        label: 'Devasa',
        multiplier: 1.5,
        preview: 22,
    },
];

const COLOR_SCHEME_OPTIONS: {
    value: ColorScheme;
    label: string;
    description: string;
}[] = [
        {
            value: 'normal',
            label: 'Normal',
            description: 'Standart renkler',
        },
        {
            value: 'highContrast',
            label: 'Yüksek Kontrast',
            description: 'Daha belirgin renkler',
        },
        {
            value: 'grayscale',
            label: 'Gri Tonlama',
            description: 'Siyah-beyaz görünüm',
        },
        {
            value: 'colorBlind',
            label: 'Renk Körlüğü Modu',
            description: 'Renk körü dostu renkler',
        },
    ];

const MOTION_PREFERENCE_OPTIONS: {
    value: MotionPreference;
    label: string;
    description: string;
}[] = [
        {
            value: 'normal',
            label: 'Normal',
            description: 'Tüm animasyonlar',
        },
        {
            value: 'reduced',
            label: 'Azaltılmış',
            description: 'Bazı animasyonlar kapalı',
        },
        {
            value: 'none',
            label: 'Yok',
            description: 'Hiç animasyon yok',
        },
    ];

export const AccessibilityScreen: React.FC = () => {
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

    const handleToggleSetting = async (
        key: keyof IUserSettings['accessibility'],
        value: boolean | string | number
    ) => {
        if (!user?.id || !settings) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updateAccessibility(user.id, {
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

    const handleSelectTextSize = () => {
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'default' | 'cancel' | 'destructive';
        }> = TEXT_SIZE_OPTIONS.map((size) => ({
            text: `${size.label} - Örnek: ${size.preview}pt`,
            onPress: () => handleToggleSetting('textSize', size.value),
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Yazı Boyutu', 'Yazı boyutunu seçin:', options);
    };

    const handleSelectColorScheme = () => {
        const options: Array<{
            text: string;
            onPress?: () => void;   
            style?: 'default' | 'cancel' | 'destructive';
        }> = COLOR_SCHEME_OPTIONS.map((scheme) => ({
            text: `${scheme.label} - ${scheme.description}`,
            onPress: () => handleToggleSetting('colorScheme', scheme.value),
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Renk Şeması', 'Renk şemasını seçin:', options);
    };

    // const handleSelectMotionPreference = () => {
    //     const options = MOTION_PREFERENCE_OPTIONS.map((motion) => ({
    //         text: `${motion.label} - ${motion.description}`,
    //         onPress: () => {
    //             handleToggleSetting('reduceMotion', motion.value);
    //         },
    //     }));
    //     options.push({ text: 'İptal', style: 'cancel' as const });

    //     Alert.alert('Hareket Tercihi', 'Animasyon seviyesini seçin:', options);
    // };

    const getTextSizeLabel = (): string => {
        if (!settings) return '';
        const size = TEXT_SIZE_OPTIONS.find(
            (s) => s.value === settings.accessibility.textSize
        );
        return size?.label || 'Orta (Varsayılan)';
    };

    const getColorSchemeLabel = (): string => {
        if (!settings) return '';
        const scheme = COLOR_SCHEME_OPTIONS.find(
            (s) => s.value === settings.accessibility.colorScheme
        );
        return scheme?.label || 'Normal';
    };

    // const getMotionPreferenceLabel = (): string => {
    //     if (!settings) return '';
    //     const motion = MOTION_PREFERENCE_OPTIONS.find(
    //         (m) => m.value === settings.accessibility.reduceMotion
    //     );
    //     return motion?.label || 'Normal';
    // };

    const getCurrentTextSizeMultiplier = (): number => {
        if (!settings) return 1.0;
        const size = TEXT_SIZE_OPTIONS.find(
            (s) => s.value === settings.accessibility.textSize
        );
        return size?.multiplier || 1.0;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <CustomHeader
                    title="Erişilebilirlik"
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
                    title="Erişilebilirlik"
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
                title="Erişilebilirlik"
                showBack={true}
                onLeftPress={() => goBack()}
            />
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Eye size={24} color="#3B82F6" strokeWidth={2} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Erişilebilirlik</Text>
                        <Text style={styles.infoText}>
                            Uygulamayı herkes için daha kullanışlı hale getirin. Görme,
                            işitme ve hareket erişilebilirliği ayarlarını özelleştirin.
                        </Text>
                    </View>
                </View>

                {/* Text Size Preview */}
                <View style={styles.previewCard}>
                    <View style={styles.previewHeader}>
                        <Type size={20} color="#8B5CF6" strokeWidth={2} />
                        <Text style={styles.previewTitle}>Yazı Boyutu Önizleme</Text>
                    </View>
                    <View style={styles.previewContent}>
                        <Text
                            style={[
                                styles.previewText,
                                { fontSize: 15 * getCurrentTextSizeMultiplier() },
                            ]}
                        >
                            Bu bir örnek metindir.
                        </Text>
                        <Text
                            style={[
                                styles.previewSubtext,
                                { fontSize: 13 * getCurrentTextSizeMultiplier() },
                            ]}
                        >
                            Yazı boyutu ayarı tüm uygulamada geçerli olacaktır.
                        </Text>
                    </View>
                </View>

                {/* Visual Settings */}
                <SettingsSection
                    title="Görsel Ayarlar"
                    footer="Görsel öğeleri özelleştirin"
                >
                    <SettingsItem
                        icon={<Type size={22} color="#8B5CF6" strokeWidth={2} />}
                        title="Yazı Boyutu"
                        subtitle="Uygulama genelinde yazı boyutu"
                        value={getTextSizeLabel()}
                        onPress={handleSelectTextSize}
                        showChevron={true}
                        disabled={saving}
                    />

                    <SettingsItem
                        icon={<Sun size={22} color="#F59E0B" strokeWidth={2} />}
                        title="Renk Şeması"
                        subtitle="Renk ve kontrast ayarları"
                        value={getColorSchemeLabel()}
                        onPress={handleSelectColorScheme}
                        showChevron={true}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Kalın Yazı"
                        subtitle="Yazıları daha kalın göster"
                        value={settings.accessibility.boldText}
                        onValueChange={(value) => handleToggleSetting('boldText', value)}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Yüksek Kontrast"
                        subtitle="Daha belirgin renkler kullan"
                        value={settings.accessibility.highContrast}
                        onValueChange={(value) => handleToggleSetting('highContrast', value)}
                        disabled={saving}
                    />
                </SettingsSection>

                {/* Motion Settings */}
                {/* <SettingsSection
                    title="Hareket ve Animasyon"
                    footer="Animasyonları ve geçişleri kontrol edin"
                >
                    <SettingsItem
                        icon={<Play size={22} color="#10B981" strokeWidth={2} />}
                        title="Animasyon Seviyesi"
                        subtitle="Hareket ve geçiş efektleri"
                        value={getMotionPreferenceLabel()}
                        onPress={handleSelectMotionPreference}
                        showChevron={true}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Otomatik Oynatma"
                        subtitle="Videoları otomatik oynat"
                        value={settings.accessibility.autoPlayVideos}
                        onValueChange={(value) => handleToggleSetting('autoPlayVideos', value)}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Paralaks Efekti"
                        subtitle="Kaydırma efektlerini göster"
                        value={settings.accessibility.parallaxEffects}
                        onValueChange={(value) => handleToggleSetting('parallaxEffects', value)}
                        disabled={saving}
                    />
                </SettingsSection> */}

                {/* Screen Reader Settings */}
                {/* <SettingsSection
                    title="Ekran Okuyucu"
                    footer="Ekran okuyucu için iyileştirmeler"
                >
                    <SettingsToggle
                        title="Ekran Okuyucu Desteği"
                        subtitle="VoiceOver/TalkBack için optimize et"
                        value={settings.accessibility.screenReader}
                        onValueChange={(value) => handleToggleSetting('screenReader', value)}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Genişletilmiş Açıklamalar"
                        subtitle="Daha detaylı etiketler"
                        value={settings.accessibility.extendedLabels}
                        onValueChange={(value) => handleToggleSetting('extendedLabels', value)}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Ses İpuçları"
                        subtitle="Önemli eylemlerde ses çal"
                        value={settings.accessibility.audioHints}
                        onValueChange={(value) => handleToggleSetting('audioHints', value)}
                        disabled={saving}
                    />
                </SettingsSection> */}

                {/* Interaction Settings */}
                {/* <SettingsSection
                    title="Etkileşim"
                    footer="Dokunma ve etkileşim ayarları"
                >
                    <SettingsToggle
                        title="Büyük Dokunma Hedefleri"
                        subtitle="Butonları daha büyük yap"
                        value={settings.accessibility.largerTouchTargets}
                        onValueChange={(value) =>
                            handleToggleSetting('largerTouchTargets', value)
                        }
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Haptik Geri Bildirim"
                        subtitle="Dokunmalarda titreşim"
                        value={settings.accessibility.hapticFeedback}
                        onValueChange={(value) => handleToggleSetting('hapticFeedback', value)}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Uzun Basma Süresi Uzat"
                        subtitle="Daha uzun basılı tutma süresi"
                        value={settings.accessibility.longPressDelay}
                        onValueChange={(value) => handleToggleSetting('longPressDelay', value)}
                        disabled={saving}
                    />
                </SettingsSection> */}

                {/* Navigation Settings */}
                {/* <SettingsSection
                    title="Navigasyon"
                    footer="Gezinme kolaylıkları"
                >
                    <SettingsToggle
                        title="Basitleştirilmiş Navigasyon"
                        subtitle="Daha az menü seviyesi"
                        value={settings.accessibility.simplifiedNavigation}
                        onValueChange={(value) =>
                            handleToggleSetting('simplifiedNavigation', value)
                        }
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Geri Butonunu Göster"
                        subtitle="Her ekranda geri butonu"
                        value={settings.accessibility.showBackButton}
                        onValueChange={(value) => handleToggleSetting('showBackButton', value)}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Gezinme İpuçları"
                        subtitle="Yardımcı açıklamalar göster"
                        value={settings.accessibility.navigationHints}
                        onValueChange={(value) => handleToggleSetting('navigationHints', value)}
                        disabled={saving}
                    />
                </SettingsSection> */}

                {/* Reading Settings */}
                {/* <SettingsSection
                    title="Okuma"
                    footer="Metin okuma kolaylıkları"
                >
                    <SettingsToggle
                        title="Okuma Modu"
                        subtitle="Dikkat dağıtıcı öğeleri gizle"
                        value={settings.accessibility.readingMode}
                        onValueChange={(value) => handleToggleSetting('readingMode', value)}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Satır Yüksekliği Artır"
                        subtitle="Satırlar arası mesafe"
                        value={settings.accessibility.increaseLineHeight}
                        onValueChange={(value) =>
                            handleToggleSetting('increaseLineHeight', value)
                        }
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Harf Aralığı Artır"
                        subtitle="Harfler arası mesafe"
                        value={settings.accessibility.increaseLetterSpacing}
                        onValueChange={(value) =>
                            handleToggleSetting('increaseLetterSpacing', value)
                        }
                        disabled={saving}
                    />
                </SettingsSection> */}

                {/* Quick Settings Summary */}
                {/* <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Aktif Erişilebilirlik Özellikleri</Text>
                    <View style={styles.summaryContent}>
                        {settings.accessibility.screenReader && (
                            <View style={styles.summaryItem}>
                                <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                                <Text style={styles.summaryItemText}>Ekran Okuyucu</Text>
                            </View>
                        )}
                        {settings.accessibility.highContrast && (
                            <View style={styles.summaryItem}>
                                <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                                <Text style={styles.summaryItemText}>Yüksek Kontrast</Text>
                            </View>
                        )}
                        {settings.accessibility.boldText && (
                            <View style={styles.summaryItem}>
                                <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                                <Text style={styles.summaryItemText}>Kalın Yazı</Text>
                            </View>
                        )}
                        {settings.accessibility.largerTouchTargets && (
                            <View style={styles.summaryItem}>
                                <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                                <Text style={styles.summaryItemText}>Büyük Dokunma Hedefleri</Text>
                            </View>
                        )}
                        {settings.accessibility.reduceMotion !== 'normal' && (
                            <View style={styles.summaryItem}>
                                <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                                <Text style={styles.summaryItemText}>Azaltılmış Hareket</Text>
                            </View>
                        )}
                        {!settings.accessibility.screenReader &&
                            !settings.accessibility.highContrast &&
                            !settings.accessibility.boldText &&
                            !settings.accessibility.largerTouchTargets &&
                            settings.accessibility.reduceMotion === 'normal' && (
                                <Text style={styles.summaryEmpty}>
                                    Henüz hiç erişilebilirlik özelliği aktif değil
                                </Text>
                            )}
                    </View>
                </View> */}

                {/* System Settings Link */}
                <View style={styles.systemCard}>
                    <Smartphone size={20} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.systemText}>
                        Daha fazla erişilebilirlik özelliği için cihazınızın sistem ayarlarını
                        kontrol edin.
                    </Text>
                </View>

                {/* Tips Card */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 İpuçları</Text>
                    <Text style={styles.tipsText}>
                        • Ekran okuyucu özelliği VoiceOver ve TalkBack ile uyumludur{'\n'}
                        • Yazı boyutu ayarı tüm uygulamada geçerlidir{'\n'}
                        • Yüksek kontrast modu göz yorgunluğunu azaltır{'\n'}
                        • Haptik geri bildirim pil tüketimini artırabilir{'\n'}
                        • Basitleştirilmiş navigasyon yeni kullanıcılar için uygundur
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

    // Info Card
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        gap: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },

    // Preview Card
    previewCard: {
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
    previewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    previewTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
    },
    previewContent: {
        gap: 8,
    },
    previewText: {
        fontWeight: '600',
        color: '#1F2937',
    },
    previewSubtext: {
        color: '#6B7280',
        lineHeight: 20,
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
    summaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    summaryItemText: {
        fontSize: 14,
        color: '#1F2937',
    },
    summaryEmpty: {
        fontSize: 14,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },

    // System Card
    systemCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    systemText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
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