// src/screens/Settings/Preferences/GamePreferencesScreen.tsx

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
    Settings as SettingsIcon,
    Users,
    MapPin,
    Clock,
    DollarSign,
    Calendar,
    Shield,
    Zap,
    CheckCircle2,
    Circle,
    Info,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { SettingsItem } from '../components/SettingsItem';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';

type TeamSizePreference = 'small' | 'medium' | 'large' | 'any';
type DistancePreference = 5 | 10 | 20 | 50 | 100;
type PaymentPreference = 'free' | 'paid' | 'both';

interface TeamSizeOption {
    value: TeamSizePreference;
    label: string;
    description: string;
    minPlayers: number | null;
    maxPlayers: number | null;
}

const TEAM_SIZE_OPTIONS: TeamSizeOption[] = [
    {
        value: 'small',
        label: 'Küçük Takımlar',
        description: '3v3, 4v4, 5v5',
        minPlayers: 3,
        maxPlayers: 5,
    },
    {
        value: 'medium',
        label: 'Orta Takımlar',
        description: '6v6, 7v7, 8v8',
        minPlayers: 6,
        maxPlayers: 8,
    },
    {
        value: 'large',
        label: 'Büyük Takımlar',
        description: '9v9, 10v10, 11v11',
        minPlayers: 9,
        maxPlayers: 11,
    },
    {
        value: 'any',
        label: 'Farketmez',
        description: 'Tüm takım büyüklükleri',
        minPlayers: null,
        maxPlayers: null,
    },
];

const DISTANCE_OPTIONS: { value: DistancePreference; label: string }[] = [
    { value: 5, label: '5 km' },
    { value: 10, label: '10 km' },
    { value: 20, label: '20 km' },
    { value: 50, label: '50 km' },
    { value: 100, label: '100 km+' },
];

const PAYMENT_OPTIONS: {
    value: PaymentPreference;
    label: string;
    description: string;
}[] = [
        {
            value: 'free',
            label: 'Ücretsiz',
            description: 'Sadece ücretsiz maçlar',
        },
        {
            value: 'paid',
            label: 'Ücretli',
            description: 'Sadece ücretli maçlar',
        },
        {
            value: 'both',
            label: 'Farketmez',
            description: 'Hem ücretsiz hem ücretli',
        },
    ];

export const GamePreferencesScreen: React.FC = () => {
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
        key: keyof IUserSettings['preferences'],
        value: boolean | number | string | object
    ) => {
        if (!user?.id || !settings) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updatePreferences(user.id, {
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

    const handleSelectTeamSize = () => {
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'default' | 'cancel' | 'destructive';
        }> = TEAM_SIZE_OPTIONS.map((size) => ({
            text: `${size.label} - ${size.description}`,
            onPress: () => {
                updateTeamSize(size.minPlayers, size.maxPlayers);
            },
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Takım Büyüklüğü', 'Tercih ettiğiniz takım büyüklüğünü seçin:', options);
    };

    const updateTeamSize = async (min: number | null, max: number | null) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updatePreferences(user.id, {
                preferredTeamSize: {
                    min: min ?? undefined,
                    max: max ?? undefined,
                },
            });

            if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Takım büyüklüğü tercihi güncellendi');
            } else {
                Alert.alert('Hata', 'Ayar güncellenemedi');
            }
        } catch (error) {
            console.error('Update team size error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectDistance = () => {
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'default' | 'cancel' | 'destructive';
        }> = DISTANCE_OPTIONS.map((distance) => ({
            text: distance.label,
            onPress: () => {
                handleToggleSetting('maxDistanceKm', distance.value);
            },
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Maksimum Mesafe', 'Ne kadar uzaktaki maçlara katılmak istersiniz?', options);
    };

    const handleSelectPaymentPreference = () => {
        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'default' | 'cancel' | 'destructive';
        }> = PAYMENT_OPTIONS.map((payment) => ({
            text: `${payment.label} - ${payment.description}`,
            onPress: () => {
                handleToggleSetting('paymentMethod', payment.value);
            },
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Ödeme Tercihi', 'Hangi tür maçları tercih edersiniz?', options);
    };

    const getTeamSizeLabel = (): string => {
        if (!settings?.preferences.preferredTeamSize) return 'Farketmez';

        const { min, max } = settings.preferences.preferredTeamSize;

        if (!min && !max) return 'Farketmez';

        const option = TEAM_SIZE_OPTIONS.find(
            (opt) => opt.minPlayers === min && opt.maxPlayers === max
        );

        return option?.label || `${min || '?'} - ${max || '?'} oyuncu`;
    };

    const getDistanceLabel = (): string => {
        if (!settings?.preferences.maxDistanceKm) return 'Belirlenmedi';

        const distance = settings.preferences.maxDistanceKm;
        const option = DISTANCE_OPTIONS.find((opt) => opt.value === distance);

        return option?.label || `${distance} km`;
    };

    const getPaymentPreferenceLabel = (): string => {
        if (!settings?.preferences.paymentMethod) return 'Farketmez';

        const payment = settings.preferences.paymentMethod;

        // Map payment method to preference
        if (payment === 'cash') return 'Nakit';
        if (payment === 'card') return 'Kart';
        if (payment === 'bank') return 'Banka';

        return 'Karma';
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <CustomHeader
                    title="Maç Tercihleri"
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
                    title="Maç Tercihleri"
                    showBack={true}
                    onLeftPress={() => goBack}
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
                title="Maç Tercihleri"
                showBack={true}
                onLeftPress={() => goBack}
            />
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <View style={styles.infoCard}>
                    <SettingsIcon size={24} color="#8B5CF6" strokeWidth={2} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Maç Tercihleri</Text>
                        <Text style={styles.infoText}>
                            Oyun tercihlerinizi belirleyin. Bu ayarlar size uygun maçları
                            bulmanıza ve davet almaya yardımcı olur.
                        </Text>
                    </View>
                </View>

                {/* Team Settings */}
                <SettingsSection
                    title="Takım Ayarları"
                    footer="Takım büyüklüğü ve oyuncu tercihleri"
                >
                    <SettingsItem
                        icon={<Users size={22} color="#3B82F6" strokeWidth={2} />}
                        title="Tercih Edilen Takım Büyüklüğü"
                        subtitle="Hangi büyüklükte takımlarda oynamak istersiniz"
                        value={getTeamSizeLabel()}
                        onPress={handleSelectTeamSize}
                        showChevron={true}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Sadece Arkadaşlarla Oyna"
                        subtitle="Sadece tanıdığınız kişilerle maç yapın"
                        value={settings.preferences.playWithFriendsOnly}
                        onValueChange={(value) =>
                            handleToggleSetting('playWithFriendsOnly', value)
                        }
                        disabled={saving}
                    />
                </SettingsSection>

                {/* Location Settings */}
                <SettingsSection
                    title="Konum Ayarları"
                    footer="Saha mesafesi ve konum tercihleri"
                >
                    <SettingsItem
                        icon={<MapPin size={22} color="#10B981" strokeWidth={2} />}
                        title="Maksimum Mesafe"
                        subtitle="Ne kadar uzaktaki maçlara katılırsınız"
                        value={getDistanceLabel()}
                        onPress={handleSelectDistance}
                        showChevron={true}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Otomatik Konum Güncelleme"
                        subtitle="Konumunuz otomatik güncellensin"
                        value={settings.preferences.autoLocationUpdate}
                        onValueChange={(value) =>
                            handleToggleSetting('autoLocationUpdate', value)
                        }
                        disabled={saving}
                    />
                </SettingsSection>

                {/* Match Invitations */}
                <SettingsSection
                    title="Maç Davetleri"
                    footer="Maç davetlerini nasıl yönetmek istersiniz"
                >
                    <SettingsToggle
                        title="Otomatik Davet Kabul"
                        subtitle="Uygun maçlara otomatik katıl"
                        value={settings.preferences.autoAcceptInvitations}
                        onValueChange={(value) =>
                            handleToggleSetting('autoAcceptInvitations', value)
                        }
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Liglere Otomatik Kayıt"
                        subtitle="Uygun liglere otomatik kayıt ol"
                        value={settings.preferences.autoRegisterToLeagues}
                        onValueChange={(value) =>
                            handleToggleSetting('autoRegisterToLeagues', value)
                        }
                        disabled={saving}
                    />
                </SettingsSection>

                {/* Payment Settings */}
                <SettingsSection
                    title="Ödeme Tercihleri"
                    footer="Maç ücretleri ve ödeme yöntemi"
                >
                    <SettingsItem
                        icon={<DollarSign size={22} color="#F59E0B" strokeWidth={2} />}
                        title="Ödeme Yöntemi"
                        subtitle="Tercih ettiğiniz ödeme şekli"
                        value={getPaymentPreferenceLabel()}
                        onPress={handleSelectPaymentPreference}
                        showChevron={true}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Otomatik Ödeme"
                        subtitle="Maç ücretini otomatik öde"
                        value={settings.preferences.autoPayment}
                        onValueChange={(value) => handleToggleSetting('autoPayment', value)}
                        disabled={saving}
                    />

                    <SettingsToggle
                        title="Ödeme Hatırlatıcısı"
                        subtitle="Ödeme zamanı geldiğinde hatırlat"
                        value={settings.preferences.paymentReminder?.enabled || false}
                        onValueChange={(value) =>
                            handleToggleSetting('paymentReminder', {
                                enabled: value,
                                daysBefore: settings?.preferences?.paymentReminder?.daysBefore || 1,
                            })
                        }
                        disabled={saving}
                    />
                </SettingsSection>

                {/* Quick Stats */}
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Tercih Özeti</Text>
                    <View style={styles.statsContent}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Takım Büyüklüğü:</Text>
                            <Text style={styles.statValue}>{getTeamSizeLabel()}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Maksimum Mesafe:</Text>
                            <Text style={styles.statValue}>{getDistanceLabel()}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Otomatik Kabul:</Text>
                            <View style={styles.statBadge}>
                                {settings.preferences.autoAcceptInvitations ? (
                                    <CheckCircle2 size={14} color="#10B981" strokeWidth={2} />
                                ) : (
                                    <Circle size={14} color="#9CA3AF" strokeWidth={2} />
                                )}
                                <Text
                                    style={[
                                        styles.statBadgeText,
                                        settings.preferences.autoAcceptInvitations &&
                                        styles.statBadgeTextActive,
                                    ]}
                                >
                                    {settings.preferences.autoAcceptInvitations ? 'Açık' : 'Kapalı'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Sadece Arkadaşlar:</Text>
                            <View style={styles.statBadge}>
                                {settings.preferences.playWithFriendsOnly ? (
                                    <CheckCircle2 size={14} color="#10B981" strokeWidth={2} />
                                ) : (
                                    <Circle size={14} color="#9CA3AF" strokeWidth={2} />
                                )}
                                <Text
                                    style={[
                                        styles.statBadgeText,
                                        settings.preferences.playWithFriendsOnly &&
                                        styles.statBadgeTextActive,
                                    ]}
                                >
                                    {settings.preferences.playWithFriendsOnly ? 'Evet' : 'Hayır'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Smart Recommendations */}
                <View style={styles.recommendationsCard}>
                    <View style={styles.recommendationsHeader}>
                        <Zap size={20} color="#F59E0B" strokeWidth={2} />
                        <Text style={styles.recommendationsTitle}>Akıllı Öneriler</Text>
                    </View>
                    <View style={styles.recommendationsList}>
                        {settings.preferences.autoAcceptInvitations && (
                            <View style={styles.recommendationItem}>
                                <Info size={16} color="#3B82F6" strokeWidth={2} />
                                <Text style={styles.recommendationText}>
                                    Otomatik kabul açık. Müsaitlik ayarlarınızı kontrol edin.
                                </Text>
                            </View>
                        )}
                        {!settings.preferences.maxDistanceKm && (
                            <View style={styles.recommendationItem}>
                                <Info size={16} color="#F59E0B" strokeWidth={2} />
                                <Text style={styles.recommendationText}>
                                    Maksimum mesafe belirlenmemiş. Daha fazla maç bulabilirsiniz.
                                </Text>
                            </View>
                        )}
                        {settings.preferences.playWithFriendsOnly && (
                            <View style={styles.recommendationItem}>
                                <Info size={16} color="#8B5CF6" strokeWidth={2} />
                                <Text style={styles.recommendationText}>
                                    Sadece arkadaşlarla oyun seçili. Yeni oyuncularla tanışamazsınız.
                                </Text>
                            </View>
                        )}
                        {!settings.preferences.autoAcceptInvitations &&
                            !settings.preferences.maxDistanceKm &&
                            !settings.preferences.playWithFriendsOnly && (
                                <Text style={styles.recommendationEmpty}>
                                    Şu an için öneri yok. Tercihleriniz dengeli görünüyor! ✨
                                </Text>
                            )}
                    </View>
                </View>

                {/* Tips Card */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 İpuçları</Text>
                    <Text style={styles.tipsText}>
                        • Otomatik kabul açıksa müsaitlik ayarlarınız önemli{'\n'}
                        • Mesafe sınırı koyarak zamandan tasarruf edin{'\n'}
                        • Arkadaşlarla oynamak daha keyifli ama yeni insanlar tanıyın{'\n'}
                        • Ödeme hatırlatıcısı son dakika stresini önler{'\n'}
                        • Tercihlerinizi zaman içinde güncelleyebilirsiniz
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
        backgroundColor: '#F5F3FF',
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
        color: '#5B21B6',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#5B21B6',
        lineHeight: 18,
    },

    // Stats Card
    statsCard: {
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
    statsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    statsContent: {
        gap: 10,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    statBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    statBadgeTextActive: {
        color: '#10B981',
    },

    // Recommendations Card
    recommendationsCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    recommendationsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    recommendationsTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#92400E',
    },
    recommendationsList: {
        gap: 10,
    },
    recommendationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    recommendationText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
    },
    recommendationEmpty: {
        fontSize: 14,
        color: '#92400E',
        fontStyle: 'italic',
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