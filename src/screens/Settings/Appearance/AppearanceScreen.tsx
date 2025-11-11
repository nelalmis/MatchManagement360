// src/screens/Settings/Appearance/AppearanceScreen.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
    useColorScheme,
} from 'react-native';
import {
    Palette,
    Sun,
    Moon,
    Smartphone,
    Type,
    Globe,
    CheckCircle2,
    Circle,
    Monitor,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsItem } from '../components/SettingsItem';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';
import { LoadingScreen } from '../../Common';

type Theme = 'light' | 'dark' | 'system';
type Language = 'tr' | 'en';
type FontSize = 'small' | 'medium' | 'large' | 'extraLarge';
type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
type TimeFormat = '12h' | '24h';

interface ThemeOption {
    value: Theme;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

interface LanguageOption {
    value: Language;
    label: string;
    nativeName: string;
    flag: string;
}

interface FontSizeOption {
    value: FontSize;
    label: string;
    description: string;
    preview: number;
}

const THEME_OPTIONS: ThemeOption[] = [
    {
        value: 'light',
        label: 'Açık Tema',
        description: 'Her zaman açık tema kullan',
        icon: <Sun size={24} color="#F59E0B" strokeWidth={2} />,
        color: '#F59E0B',
    },
    {
        value: 'dark',
        label: 'Koyu Tema',
        description: 'Her zaman koyu tema kullan',
        icon: <Moon size={24} color="#3B82F6" strokeWidth={2} />,
        color: '#3B82F6',
    },
    {
        value: 'system',
        label: 'Sistem Ayarı',
        description: 'Cihazın tema ayarını takip et',
        icon: <Smartphone size={24} color="#8B5CF6" strokeWidth={2} />,
        color: '#8B5CF6',
    },
];

const LANGUAGE_OPTIONS: LanguageOption[] = [
    {
        value: 'tr',
        label: 'Türkçe',
        nativeName: 'Türkçe',
        flag: '🇹🇷',
    },
    {
        value: 'en',
        label: 'İngilizce',
        nativeName: 'English',
        flag: '🇬🇧',
    },
];

const FONT_SIZE_OPTIONS: FontSizeOption[] = [
    {
        value: 'small',
        label: 'Küçük',
        description: 'Daha kompakt görünüm',
        preview: 13,
    },
    {
        value: 'medium',
        label: 'Orta',
        description: 'Varsayılan boyut (önerilen)',
        preview: 15,
    },
    {
        value: 'large',
        label: 'Büyük',
        description: 'Daha rahat okuma',
        preview: 17,
    },
    {
        value: 'extraLarge',
        label: 'Çok Büyük',
        description: 'Maksimum okunabilirlik',
        preview: 19,
    },
];

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string; example: string }[] = [
    { value: 'DD/MM/YYYY', label: 'Gün/Ay/Yıl', example: '31/12/2024' },
    { value: 'MM/DD/YYYY', label: 'Ay/Gün/Yıl', example: '12/31/2024' },
    { value: 'YYYY-MM-DD', label: 'Yıl-Ay-Gün', example: '2024-12-31' },
];

const TIME_FORMAT_OPTIONS: { value: TimeFormat; label: string; example: string }[] = [
    { value: '12h', label: '12 Saat', example: '02:30 PM' },
    { value: '24h', label: '24 Saat', example: '14:30' },
];

export const AppearanceScreen: React.FC = () => {
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

    const handleSelectTheme = (theme: Theme) => {
        Alert.alert(
            'Tema Değiştir',
            `${THEME_OPTIONS.find((t) => t.value === theme)?.label} temasına geçmek istiyor musunuz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Değiştir',
                    onPress: () => updateTheme(theme),
                },
            ]
        );
    };

    const updateTheme = async (theme: Theme) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updateAppearance(user.id, {
                theme,
            });

            if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Tema değiştirildi');
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

    const handleSelectLanguage = () => {
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'default' | 'cancel' | 'destructive';
        }> = LANGUAGE_OPTIONS.map((lang) => ({
            text: `${lang.flag} ${lang.nativeName}`,
            onPress: () => updateLanguage(lang.value),
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Dil Seçin', 'Uygulama dilini değiştirin', options);
    };

    const updateLanguage = async (language: Language) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updateAppearance(user.id, {
                language,
            });

            if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert(
                    'Başarılı',
                    'Dil değiştirildi. Bazı değişiklikler için uygulamayı yeniden başlatmanız gerekebilir.'
                );
            } else {
                Alert.alert('Hata', 'Dil değiştirilemedi');
            }
        } catch (error) {
            console.error('Update language error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectFontSize = (fontSize: FontSize) => {
        updateFontSize(fontSize);
    };

    const updateFontSize = async (fontSize: FontSize) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updateAppearance(user.id, {
                fontSize,
            });

            if (result.success && result.data) {
                setSettings(result.data);
            } else {
                Alert.alert('Hata', 'Font boyutu değiştirilemedi');
            }
        } catch (error) {
            console.error('Update font size error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectDateFormat = () => {
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'default' | 'cancel' | 'destructive';
        }> = DATE_FORMAT_OPTIONS.map((format) => ({
            text: `${format.label} (${format.example})`,
            onPress: () => updateDateFormat(format.value),
        }));

        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Tarih Formatı', 'Tarih gösterim formatını seçin', options);
    };

    const updateDateFormat = async (dateFormat: DateFormat) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updateAppearance(user.id, {
                dateFormat,
            });

            if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Tarih formatı değiştirildi');
            } else {
                Alert.alert('Hata', 'Tarih formatı değiştirilemedi');
            }
        } catch (error) {
            console.error('Update date format error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectTimeFormat = () => {
        // const options = TIME_FORMAT_OPTIONS.map((format) => ({
        //   text: `${format.label} (${format.example})`,
        //   onPress: () => updateTimeFormat(format.value),
        // }));
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'default' | 'cancel' | 'destructive';
        }> = TIME_FORMAT_OPTIONS.map((format) => ({
            text: `${format.label} (${format.example})`,
            onPress: () => updateTimeFormat(format.value),
        }));

        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Saat Formatı', 'Saat gösterim formatını seçin', options);

    };

    const updateTimeFormat = async (timeFormat: TimeFormat) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updateAppearance(user.id, {
                timeFormat,
            });

            if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Saat formatı değiştirildi');
            } else {
                Alert.alert('Hata', 'Saat formatı değiştirilemedi');
            }
        } catch (error) {
            console.error('Update time format error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const getActiveThemeLabel = (): string => {
        if (!settings) return '';
        const theme = THEME_OPTIONS.find((t) => t.value === settings.appearance.theme);
        return theme?.label || '';
    };

    const getLanguageLabel = (): string => {
        if (!settings) return '';
        const lang = LANGUAGE_OPTIONS.find((l) => l.value === settings.appearance.language);
        return lang ? `${lang.flag} ${lang.label}` : '';
    };

    const getFontSizeLabel = (): string => {
        if (!settings) return '';
        const fontSize = FONT_SIZE_OPTIONS.find(
            (f) => f.value === settings.appearance.fontSize
        );
        return fontSize?.label || '';
    };

    const getDateFormatLabel = (): string => {
        if (!settings) return '';
        const format = DATE_FORMAT_OPTIONS.find(
            (f) => f.value === settings.appearance.dateFormat
        );
        return format ? `${format.label} (${format.example})` : '';
    };

    const getTimeFormatLabel = (): string => {
        if (!settings) return '';
        const format = TIME_FORMAT_OPTIONS.find(
            (f) => f.value === settings.appearance.timeFormat
        );
        return format ? `${format.label} (${format.example})` : '';
    };
    const renderHeader = () => (
        <CustomHeader
            title="Görünüm"
            showBack={true}
            onLeftPress={() => goBack()}
        />
    );

    if (loading) {
       return <LoadingScreen header={renderHeader()} />;
    }

    if (!settings) {
        return (
            <View style={styles.container}>
                {renderHeader()}
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Current Theme Display */}
                <View style={styles.currentThemeCard}>
                    <Palette size={24} color="#8B5CF6" strokeWidth={2} />
                    <View style={styles.currentThemeContent}>
                        <Text style={styles.currentThemeTitle}>Aktif Tema</Text>
                        <Text style={styles.currentThemeValue}>{getActiveThemeLabel()}</Text>
                        {settings.appearance.theme === 'system' && (
                            <Text style={styles.currentThemeSubtext}>
                                Şu anda: {systemColorScheme === 'dark' ? 'Koyu' : 'Açık'}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Theme Selection */}
                <SettingsSection
                    title="Tema"
                    footer="Uygulamanın görünümünü değiştirin"
                >
                    <View style={styles.themeOptions}>
                        {THEME_OPTIONS.map((theme) => {
                            const isSelected = settings.appearance.theme === theme.value;

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
                                    <View
                                        style={[
                                            styles.themeIconContainer,
                                            { backgroundColor: `${theme.color}20` },
                                        ]}
                                    >
                                        {theme.icon}
                                    </View>

                                    <Text
                                        style={[
                                            styles.themeLabel,
                                            isSelected && { color: theme.color },
                                        ]}
                                    >
                                        {theme.label}
                                    </Text>
                                    <Text style={styles.themeDescription}>{theme.description}</Text>

                                    {isSelected && (
                                        <View style={styles.themeCheckmark}>
                                            <CheckCircle2
                                                size={20}
                                                color={theme.color}
                                                strokeWidth={2}
                                                fill={theme.color}
                                            />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </SettingsSection>

                {/* Language */}
                <SettingsSection
                    title="Dil"
                    footer="Uygulama dilini değiştirin"
                >
                    <SettingsItem
                        icon={<Globe size={22} color="#10B981" strokeWidth={2} />}
                        title="Uygulama Dili"
                        subtitle="Language / Язык / भाषा"
                        value={getLanguageLabel()}
                        onPress={handleSelectLanguage}
                        showChevron={true}
                    />
                </SettingsSection>

                {/* Font Size */}
                <SettingsSection
                    title="Yazı Boyutu"
                    footer="Uygulama genelindeki yazı boyutunu ayarlayın"
                >
                    <View style={styles.fontSizeOptions}>
                        {FONT_SIZE_OPTIONS.map((fontSize) => {
                            const isSelected = settings.appearance.fontSize === fontSize.value;

                            return (
                                <TouchableOpacity
                                    key={fontSize.value}
                                    style={[
                                        styles.fontSizeCard,
                                        isSelected && styles.fontSizeCardActive,
                                    ]}
                                    onPress={() => handleSelectFontSize(fontSize.value)}
                                    disabled={saving}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.fontSizeHeader}>
                                        <Text
                                            style={[
                                                styles.fontSizeLabel,
                                                isSelected && styles.fontSizeLabelActive,
                                            ]}
                                        >
                                            {fontSize.label}
                                        </Text>
                                        {isSelected && (
                                            <CheckCircle2
                                                size={18}
                                                color="#16a34a"
                                                strokeWidth={2}
                                            />
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            styles.fontSizePreview,
                                            { fontSize: fontSize.preview },
                                        ]}
                                    >
                                        Aa
                                    </Text>
                                    <Text style={styles.fontSizeDescription}>
                                        {fontSize.description}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </SettingsSection>

                {/* Date & Time Format */}
                <SettingsSection
                    title="Format Ayarları"
                    footer="Tarih ve saat gösterim formatı"
                >
                    <SettingsItem
                        icon={<Monitor size={22} color="#3B82F6" strokeWidth={2} />}
                        title="Tarih Formatı"
                        subtitle="Tarihlerin gösterim şekli"
                        value={getDateFormatLabel()}
                        onPress={handleSelectDateFormat}
                        showChevron={true}
                    />

                    <SettingsItem
                        icon={<Monitor size={22} color="#8B5CF6" strokeWidth={2} />}
                        title="Saat Formatı"
                        subtitle="Saatlerin gösterim şekli"
                        value={getTimeFormatLabel()}
                        onPress={handleSelectTimeFormat}
                        showChevron={true}
                    />
                </SettingsSection>

                {/* Preview Card */}
                <View style={styles.previewCard}>
                    <Text style={styles.previewTitle}>Önizleme</Text>
                    <View style={styles.previewContent}>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Tema:</Text>
                            <Text style={styles.previewValue}>
                                {getActiveThemeLabel()}
                            </Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Dil:</Text>
                            <Text style={styles.previewValue}>
                                {getLanguageLabel()}
                            </Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Yazı Boyutu:</Text>
                            <Text style={styles.previewValue}>
                                {getFontSizeLabel()}
                            </Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Tarih:</Text>
                            <Text style={styles.previewValue}>
                                {getDateFormatLabel()}
                            </Text>
                        </View>
                        <View style={styles.previewRow}>
                            <Text style={styles.previewLabel}>Saat:</Text>
                            <Text style={styles.previewValue}>
                                {getTimeFormatLabel()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>💡 Bilgi</Text>
                    <Text style={styles.infoText}>
                        • Sistem teması seçiliyken cihazınızın tema ayarı otomatik takip edilir
                        {'\n'}• Bazı dil değişiklikleri uygulamayı yeniden başlatmayı gerektirebilir
                        {'\n'}• Yazı boyutu değişikliği tüm ekranlarda uygulanır
                        {'\n'}• Format değişiklikleri hemen yansır
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
    },

    // Current Theme Card
    currentThemeCard: {
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
    currentThemeContent: {
        flex: 1,
    },
    currentThemeTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    currentThemeValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    currentThemeSubtext: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },

    // Theme Options
    themeOptions: {
        padding: 16,
        gap: 12,
    },
    themeCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    themeCardActive: {
        borderWidth: 2,
    },
    themeIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    themeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    themeDescription: {
        fontSize: 13,
        color: '#6B7280',
    },
    themeCheckmark: {
        position: 'absolute',
        top: 12,
        right: 12,
    },

    // Font Size Options
    fontSizeOptions: {
        padding: 16,
        gap: 12,
    },
    fontSizeCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    fontSizeCardActive: {
        backgroundColor: '#D1FAE5',
        borderColor: '#16a34a',
    },
    fontSizeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    fontSizeLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    fontSizeLabelActive: {
        color: '#16a34a',
    },
    fontSizePreview: {
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    fontSizeDescription: {
        fontSize: 12,
        color: '#6B7280',
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
    previewTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    previewContent: {
        gap: 8,
    },
    previewRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    previewLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    previewValue: {
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
        lineHeight: 22,
    },
});