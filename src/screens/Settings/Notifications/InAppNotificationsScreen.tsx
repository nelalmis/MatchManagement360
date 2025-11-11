// src/screens/Settings/Notifications/InAppNotificationsScreen.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import {
    Bell,
    Volume2,
    VolumeX,
    Vibrate,
    Eye,
    Clock,
    CheckCircle2,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { SettingsItem } from '../components/SettingsItem';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';
import { LoadingScreen } from '../..';

type SoundType = 'default' | 'gentle' | 'alert' | 'none';
type DisplayDuration = 3 | 5 | 7 | 10;

interface SoundOption {
    value: SoundType;
    label: string;
    description: string;
    icon: React.ReactNode;
}

const SOUND_OPTIONS: SoundOption[] = [
    {
        value: 'default',
        label: 'Varsayılan',
        description: 'Standart bildirim sesi',
        icon: <Volume2 size={20} color="#3B82F6" strokeWidth={2} />,
    },
    {
        value: 'gentle',
        label: 'Nazik',
        description: 'Yumuşak ve rahatlatıcı',
        icon: <Volume2 size={20} color="#10B981" strokeWidth={2} />,
    },
    {
        value: 'alert',
        label: 'Uyarı',
        description: 'Dikkat çekici ve yüksek',
        icon: <Volume2 size={20} color="#EF4444" strokeWidth={2} />,
    },
    {
        value: 'none',
        label: 'Sessiz',
        description: 'Ses çıkarma',
        icon: <VolumeX size={20} color="#9CA3AF" strokeWidth={2} />,
    },
];

const DISPLAY_DURATION_OPTIONS: { value: DisplayDuration; label: string }[] = [
    { value: 3, label: '3 saniye' },
    { value: 5, label: '5 saniye' },
    { value: 7, label: '7 saniye' },
    { value: 10, label: '10 saniye' },
];

export const InAppNotificationsScreen: React.FC = () => {
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

    const handleToggleInAppEnabled = async (value: boolean) => {
        if (!user?.id || !settings) return;

        // Check if main notifications are enabled
        if (!settings.notifications.enabled && value) {
            Alert.alert(
                'Bildirimler Kapalı',
                'Uygulama içi bildirimler için önce ana bildirim ayarını açmalısınız.',
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
            const result = await UserSettingsService.updateInAppNotifications(user.id, {
                enabled: value,
            });

            if (result.success && result.data) {
                setSettings(result.data);

                if (!value) {
                    Alert.alert(
                        'Uygulama İçi Bildirimler Kapatıldı',
                        'Artık uygulama içi bildirim görmeyeceksiniz.'
                    );
                }
            } else {
                Alert.alert('Hata', 'Uygulama içi bildirimler güncellenemedi');
            }
        } catch (error) {
            console.error('Toggle in-app error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleSetting = async (
        key: keyof IUserSettings['notifications']['inApp'],
        value: boolean
    ) => {
        if (!user?.id || !settings) return;

        // Check if in-app notifications are enabled
        if (!settings.notifications.inApp.enabled && value) {
            Alert.alert(
                'Uygulama İçi Bildirimler Kapalı',
                'Bu bildirimi açmak için önce uygulama içi bildirimleri aktif etmelisiniz.'
            );
            return;
        }

        setSaving(true);
        try {
            const result = await UserSettingsService.updateInAppNotifications(user.id, {
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

    const handleSelectSound = () => {
        if (!settings?.notifications.inApp.enabled) {
            Alert.alert(
                'Bildirimler Kapalı',
                'Önce uygulama içi bildirimleri açmalısınız.'
            );
            return;
        }

        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'cancel' | 'destructive';
        }> = SOUND_OPTIONS.map((sound) => ({
            text: `${sound.label} - ${sound.description}`,
            onPress: () => updateSound(sound.value),
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Bildirim Sesi', 'Bildirim sesini seçin:', options);
    };

    const updateSound = async (sound: SoundType) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updateInAppNotifications(user.id, {
                sound,
            });

            if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Bildirim sesi değiştirildi');
            } else {
                Alert.alert('Hata', 'Ses ayarı güncellenemedi');
            }
        } catch (error) {
            console.error('Update sound error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectDisplayDuration = () => {
        if (!settings?.notifications.inApp.enabled) {
            Alert.alert(
                'Bildirimler Kapalı',
                'Önce uygulama içi bildirimleri açmalısınız.'
            );
            return;
        }

        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'cancel' | 'destructive';
        }> = DISPLAY_DURATION_OPTIONS.map((duration) => ({
            text: duration.label,
            onPress: () => updateDisplayDuration(duration.value),
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Gösterim Süresi', 'Bildirim ne kadar süre görünsün?', options);
    };

    const updateDisplayDuration = async (duration: DisplayDuration) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updateInAppNotifications(user.id, {
                displayDuration: duration,
            });

            if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Gösterim süresi değiştirildi');
            } else {
                Alert.alert('Hata', 'Gösterim süresi güncellenemedi');
            }
        } catch (error) {
            console.error('Update display duration error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleTestNotification = () => {
        if (!settings?.notifications.inApp.enabled) {
            Alert.alert(
                'Bildirimler Kapalı',
                'Test bildirimi göstermek için önce uygulama içi bildirimleri açmalısınız.'
            );
            return;
        }

        // TODO: Implement test notification
        Alert.alert(
            'Test Bildirimi',
            'Bu özellik yakında eklenecek. Bildirim ayarlarınız aktif durumda.',
            [{ text: 'Tamam' }]
        );
    };

    const getSoundLabel = (): string => {
        if (!settings) return '';
        const sound = SOUND_OPTIONS.find(
            (s) => s.value === settings.notifications.inApp.sound
        );
        return sound?.label || 'Varsayılan';
    };

    const getDisplayDurationLabel = (): string => {
        if (!settings) return '';
        const duration = DISPLAY_DURATION_OPTIONS.find(
            (d) => d.value === settings.notifications.inApp.displayDuration
        );
        return duration?.label || '5 saniye';
    };
    const renderHeader = () => (
        <CustomHeader
            title="Uygulama İçi Bildirimler"
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

    const inAppEnabled =
        settings.notifications.enabled && settings.notifications.inApp.enabled;

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <Bell size={24} color="#F59E0B" strokeWidth={2} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Uygulama İçi Bildirimler</Text>
                        <Text style={styles.infoText}>
                            Uygulamayı kullanırken ekranda görünen bildirimlerdir. Bu
                            bildirimler anlık olarak gösterilir ve otomatik kaybolur.
                        </Text>
                    </View>
                </View>

                {/* Master Toggle */}
                <SettingsSection
                    title="Genel"
                    footer="Uygulama içi bildirimleri tamamen açıp kapatabilirsiniz"
                >
                    <SettingsToggle
                        title="Uygulama İçi Bildirimleri Aktif Et"
                        subtitle={
                            inAppEnabled
                                ? 'Uygulama içi bildirimler açık'
                                : 'Uygulama içi bildirimler kapalı'
                        }
                        value={settings.notifications.inApp.enabled}
                        onValueChange={handleToggleInAppEnabled}
                        disabled={saving || !settings.notifications.enabled}
                    />
                </SettingsSection>

                {/* Appearance Settings */}
                <SettingsSection
                    title="Görünüm Ayarları"
                    footer="Bildirimlerin nasıl görüneceğini ayarlayın"
                >
                    <SettingsItem
                        icon={<Volume2 size={22} color="#3B82F6" strokeWidth={2} />}
                        title="Bildirim Sesi"
                        subtitle="Bildirim geldiğinde çalacak ses"
                        value={getSoundLabel()}
                        onPress={handleSelectSound}
                        showChevron={true}
                        disabled={!inAppEnabled}
                    />

                    <SettingsItem
                        icon={<Clock size={22} color="#8B5CF6" strokeWidth={2} />}
                        title="Gösterim Süresi"
                        subtitle="Bildirim ne kadar süre görünsün"
                        value={getDisplayDurationLabel()}
                        onPress={handleSelectDisplayDuration}
                        showChevron={true}
                        disabled={!inAppEnabled}
                    />
                </SettingsSection>

                {/* Behavior Settings */}
                <SettingsSection
                    title="Davranış Ayarları"
                    footer="Bildirimlerin nasıl davranacağını ayarlayın"
                >
                    <SettingsToggle
                        title="Titreşim"
                        subtitle="Bildirim geldiğinde titreşim"
                        value={settings.notifications.inApp.vibrate}
                        onValueChange={(value) => handleToggleSetting('vibrate', value)}
                        disabled={saving || !inAppEnabled}
                    />

                    <SettingsToggle
                        title="Önizleme Göster"
                        subtitle="Bildirim içeriğini göster"
                        value={settings.notifications.inApp.showPreview}
                        onValueChange={(value) => handleToggleSetting('showPreview', value)}
                        disabled={saving || !inAppEnabled}
                    />

                    <SettingsToggle
                        title="Badge Göster"
                        subtitle="Bildirim sayısını icon üzerinde göster"
                        value={settings.notifications.inApp.showBadges}
                        onValueChange={(value) => handleToggleSetting('showBadges', value)}
                        disabled={saving || !inAppEnabled}
                    />
                </SettingsSection>

                {/* Priority Settings */}
                <SettingsSection
                    title="Öncelik Ayarları"
                    footer="Önemli bildirimlerin davranışını belirleyin"
                >
                    <SettingsToggle
                        title="Önemli Bildirimleri Vurgula"
                        subtitle="Kritik bildirimler daha belirgin gösterilir"
                        value={settings.notifications.inApp.highlightImportant}
                        onValueChange={(value) =>
                            handleToggleSetting('highlightImportant', value)
                        }
                        disabled={saving || !inAppEnabled}
                    />

                    <SettingsToggle
                        title="Tam Ekran Bildirimler"
                        subtitle="Önemli bildirimleri tam ekranda göster"
                        value={settings.notifications.inApp.fullScreenForImportant}
                        onValueChange={(value) =>
                            handleToggleSetting('fullScreenForImportant', value)
                        }
                        disabled={saving || !inAppEnabled}
                    />
                </SettingsSection>

                {/* Grouping Settings */}
                {/* <SettingsSection
                    title="Gruplama"
                    footer="Birden fazla bildirimi nasıl göstereceğinizi ayarlayın"
                >
                    <SettingsToggle
                        title="Bildirimleri Grupla"
                        subtitle="Aynı türdeki bildirimleri birleştir"
                        value={settings.notifications.inApp.groupNotifications}
                        onValueChange={(value) =>
                            handleToggleSetting('groupNotifications', value)
                        }
                        disabled={saving || !inAppEnabled}
                    />

                    <SettingsToggle
                        title="Otomatik Temizle"
                        subtitle="Eski bildirimleri otomatik sil"
                        value={settings.notifications.inApp.autoExpand}
                        onValueChange={(value) => handleToggleSetting('autoExpand', value)}
                        disabled={saving || !inAppEnabled}
                    />
                </SettingsSection> */}

                {/* Test Notification */}
                <SettingsSection>
                    <TouchableOpacity
                        style={[
                            styles.testButton,
                            (!inAppEnabled || saving) && styles.testButtonDisabled,
                        ]}
                        onPress={handleTestNotification}
                        disabled={!inAppEnabled || saving}
                        activeOpacity={0.7}
                    >
                        <Bell size={20} color="#16a34a" strokeWidth={2} />
                        <Text style={styles.testButtonText}>Test Bildirimi Gönder</Text>
                    </TouchableOpacity>
                </SettingsSection>

                {/* Current Settings Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Aktif Ayarlar Özeti</Text>
                    <View style={styles.summaryContent}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Durum</Text>
                            <View
                                style={[
                                    styles.summaryBadge,
                                    inAppEnabled && styles.summaryBadgeActive,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.summaryBadgeText,
                                        inAppEnabled && styles.summaryBadgeTextActive,
                                    ]}
                                >
                                    {inAppEnabled ? 'Açık' : 'Kapalı'}
                                </Text>
                            </View>
                        </View>

                        {inAppEnabled && (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Bildirim Sesi</Text>
                                    <Text style={styles.summaryValue}>{getSoundLabel()}</Text>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Gösterim Süresi</Text>
                                    <Text style={styles.summaryValue}>
                                        {getDisplayDurationLabel()}
                                    </Text>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Titreşim</Text>
                                    <Text style={styles.summaryValue}>
                                        {settings.notifications.inApp.vibrate ? 'Açık' : 'Kapalı'}
                                    </Text>
                                </View>

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Önizleme</Text>
                                    <Text style={styles.summaryValue}>
                                        {settings.notifications.inApp.showPreview
                                            ? 'Göster'
                                            : 'Gizle'}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Tips Card */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 İpuçları</Text>
                    <Text style={styles.tipsText}>
                        • Önemli bildirimleri kaçırmamak için vurgulama özelliğini açın{'\n'}
                        • Çok fazla bildirim alıyorsanız gruplama özelliğini kullanın{'\n'}
                        • Bildirimlerin sesini "Nazik" yaparak daha az rahatsız olun{'\n'}
                        • Tam ekran bildirimleri sadece kritik durumlar için kullanın
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

    // Info Card
    infoCard: {
        flexDirection: 'row',
        backgroundColor: '#FEF3C7',
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
        color: '#92400E',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },

    // Test Button
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        marginHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#D1FAE5',
        borderWidth: 1,
        borderColor: '#86EFAC',
    },
    testButtonDisabled: {
        opacity: 0.5,
    },
    testButtonText: {
        fontSize: 15,
        fontWeight: '600',
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
    summaryBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#FEE2E2',
    },
    summaryBadgeActive: {
        backgroundColor: '#D1FAE5',
    },
    summaryBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#EF4444',
    },
    summaryBadgeTextActive: {
        color: '#16a34a',
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