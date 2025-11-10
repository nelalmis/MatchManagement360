// src/screens/Settings/Preferences/PaymentPreferencesScreen.tsx

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
    CreditCard,
    Wallet,
    Building2,
    DollarSign,
    Bell,
    CheckCircle2,
    Circle,
    Clock,
    Shield,
    Info,
    AlertCircle,
    TrendingUp,
} from 'lucide-react-native';
import { CustomHeader } from '../../../components/CustomHeader';
import { SettingsSection } from '../components/SettingsSection';
import { SettingsToggle } from '../components/SettingsToggle';
import { SettingsItem } from '../components/SettingsItem';
import { useAuth } from '../../../hooks';
import UserSettingsService from '../../../services/serviceLayer/userSettingsService';
import { IUserSettings } from '../../../types/entity/types';
import { goBack } from '../../../navigation';

type PaymentMethod = 'cash' | 'card' | 'bank' | 'mixed';
type ReminderDays = 1 | 2 | 3 | 7;

interface PaymentMethodOption {
    value: PaymentMethod;
    label: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    pros: string[];
    cons: string[];
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
    {
        value: 'cash',
        label: 'Nakit',
        description: 'Sahada nakit ödeme',
        icon: <Wallet size={32} color="#10B981" strokeWidth={2} />,
        color: '#10B981',
        pros: ['Anında ödeme', 'Komisyon yok', 'Herkes kullanabilir'],
        cons: ['Nakit taşıma zorunluluğu', 'Para üstü sorunu', 'Takip zorluğu'],
    },
    {
        value: 'card',
        label: 'Kredi/Banka Kartı',
        description: 'Online kart ile ödeme',
        icon: <CreditCard size={32} color="#3B82F6" strokeWidth={2} />,
        color: '#3B82F6',
        pros: ['Güvenli', 'Hızlı', 'Otomatik kayıt', 'Nakit gerektirmez'],
        cons: ['Komisyon ücretleri', 'İnternet gerekli'],
    },
    {
        value: 'bank',
        label: 'Banka Havalesi',
        description: 'EFT/Havale ile ödeme',
        icon: <Building2 size={32} color="#F59E0B" strokeWidth={2} />,
        color: '#F59E0B',
        pros: ['Düşük komisyon', 'Büyük tutarlar için uygun', 'Güvenli'],
        cons: ['Yavaş', 'Onay gerektir', 'Banka işlem saatleri'],
    },
    {
        value: 'mixed',
        label: 'Karma',
        description: 'Tüm yöntemleri kullan',
        icon: <DollarSign size={32} color="#8B5CF6" strokeWidth={2} />,
        color: '#8B5CF6',
        pros: ['Esnek', 'Her duruma uygun', 'Seçenek çokluğu'],
        cons: ['Karmaşık yönetim'],
    },
];

const REMINDER_DAYS_OPTIONS: { value: ReminderDays; label: string }[] = [
    { value: 1, label: '1 gün önce' },
    { value: 2, label: '2 gün önce' },
    { value: 3, label: '3 gün önce' },
    { value: 7, label: '1 hafta önce' },
];

export const PaymentPreferencesScreen: React.FC = () => {
    const { user } = useAuth();
    const [settings, setSettings] = useState<IUserSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

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
                setSelectedMethod(result.data.preferences.paymentMethod);
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

    const handleSelectPaymentMethod = async (method: PaymentMethod) => {
        if (!user?.id) return;

        setSelectedMethod(method);
        setSaving(true);
        try {
            const result = await UserSettingsService.updatePreferences(user.id, {
                paymentMethod: method,
            });

            if (result.success && result.data) {
                setSettings(result.data);

                const methodOption = PAYMENT_METHODS.find((m) => m.value === method);
                Alert.alert(
                    'Ödeme Yöntemi Güncellendi',
                    `Varsayılan ödeme yönteminiz "${methodOption?.label}" olarak ayarlandı.`
                );
            } else {
                Alert.alert('Hata', 'Ödeme yöntemi güncellenemedi');
            }
        } catch (error) {
            console.error('Update payment method error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleAutoPayment = async (value: boolean) => {
        if (!user?.id) return;

        // Show confirmation for enabling auto payment
        if (value) {
            Alert.alert(
                'Otomatik Ödeme',
                'Otomatik ödeme özelliği maç ücretlerini belirlenen yöntemle otomatik olarak öder. Devam etmek istiyor musunuz?',
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Etkinleştir',
                        onPress: () => updateAutoPayment(value),
                    },
                ]
            );
            return;
        }

        updateAutoPayment(value);
    };

    const updateAutoPayment = async (value: boolean) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updatePreferences(user.id, {
                autoPayment: value,
            });

            if (result.success && result.data) {
                setSettings(result.data);
            } else {
                Alert.alert('Hata', 'Ayar güncellenemedi');
            }
        } catch (error) {
            console.error('Toggle auto payment error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePaymentReminder = async (value: boolean) => {
        if (!user?.id || !settings) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updatePreferences(user.id, {
                paymentReminder: {
                    enabled: value,
                    daysBefore: settings.preferences.paymentReminder?.daysBefore || 2,
                },
            });

            if (result.success && result.data) {
                setSettings(result.data);
            } else {
                Alert.alert('Hata', 'Ayar güncellenemedi');
            }
        } catch (error) {
            console.error('Toggle payment reminder error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectReminderDays = () => {
        if (!settings?.preferences.paymentReminder?.enabled) {
            Alert.alert(
                'Hatırlatıcı Kapalı',
                'Önce ödeme hatırlatıcısını etkinleştirmelisiniz.'
            );
            return;
        }

        const options: Array<{
            text: string;
            onPress?: () => void;
            style?: 'cancel' | 'destructive'
        }
        > = REMINDER_DAYS_OPTIONS.map((option) => ({
            text: option.label,
            onPress: () => updateReminderDays(option.value),
        }));
        options.push({ text: 'İptal', style: 'cancel' as const });

        Alert.alert('Hatırlatma Zamanı', 'Ne kadar önce hatırlatmak istersiniz?', options);
    };

    const updateReminderDays = async (days: ReminderDays) => {
        if (!user?.id) return;

        setSaving(true);
        try {
            const result = await UserSettingsService.updatePreferences(user.id, {
                paymentReminder: {
                    enabled: true,
                    daysBefore: days,
                },
            });

            if (result.success && result.data) {
                setSettings(result.data);
                Alert.alert('Başarılı', 'Hatırlatma zamanı güncellendi');
            } else {
                Alert.alert('Hata', 'Ayar güncellenemedi');
            }
        } catch (error) {
            console.error('Update reminder days error:', error);
            Alert.alert('Hata', 'Bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const getPaymentMethodLabel = (): string => {
        if (!settings) return '';
        const method = PAYMENT_METHODS.find(
            (m) => m.value === settings.preferences.paymentMethod
        );
        return method?.label || 'Karma';
    };

    const getReminderDaysLabel = (): string => {
        if (!settings?.preferences.paymentReminder?.daysBefore) return '2 gün önce';
        const days = settings.preferences.paymentReminder.daysBefore;
        const option = REMINDER_DAYS_OPTIONS.find((opt) => opt.value === days);
        return option?.label || `${days} gün önce`;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <CustomHeader
                    title="Ödeme Tercihleri"
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
                    title="Ödeme Tercihleri"
                    showBack={true}
                    onLeftPress={() => goBack()}
                />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
                </View>
            </View>
        );
    }

    const currentMethod = PAYMENT_METHODS.find(
        (m) => m.value === settings.preferences.paymentMethod
    );

    return (
        <View style={styles.container}>
            <CustomHeader
                title="Ödeme Tercihleri"
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
                    <DollarSign size={24} color="#10B981" strokeWidth={2} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>Ödeme Tercihleri</Text>
                        <Text style={styles.infoText}>
                            Maç ödemeleriniz için tercih ettiğiniz ödeme yöntemini seçin ve
                            otomatik ödeme ayarlarını yapın.
                        </Text>
                    </View>
                </View>

                {/* Current Method Card */}
                {currentMethod && (
                    <View
                        style={[
                            styles.currentMethodCard,
                            { borderLeftColor: currentMethod.color },
                        ]}
                    >
                        <View style={styles.currentMethodHeader}>
                            <View
                                style={[
                                    styles.currentMethodIcon,
                                    { backgroundColor: `${currentMethod.color}20` },
                                ]}
                            >
                                {currentMethod.icon}
                            </View>
                            <View style={styles.currentMethodInfo}>
                                <Text style={styles.currentMethodLabel}>Aktif Yöntem</Text>
                                <Text style={styles.currentMethodTitle}>
                                    {currentMethod.label}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Payment Methods */}
                <SettingsSection
                    title="Ödeme Yöntemi Seçin"
                    footer="Maç ödemeleri için kullanmak istediğiniz yöntemi seçin"
                >
                    <View style={styles.paymentMethodsList}>
                        {PAYMENT_METHODS.map((method) => {
                            const isSelected = selectedMethod === method.value;

                            return (
                                <TouchableOpacity
                                    key={method.value}
                                    style={[
                                        styles.paymentMethodCard,
                                        isSelected && [
                                            styles.paymentMethodCardActive,
                                            { borderColor: method.color },
                                        ],
                                    ]}
                                    onPress={() => handleSelectPaymentMethod(method.value)}
                                    disabled={saving}
                                    activeOpacity={0.7}
                                >
                                    {/* Header */}
                                    <View style={styles.paymentMethodHeader}>
                                        <View
                                            style={[
                                                styles.paymentMethodIconContainer,
                                                { backgroundColor: `${method.color}20` },
                                            ]}
                                        >
                                            {method.icon}
                                        </View>
                                        {isSelected && (
                                            <View style={styles.paymentMethodCheckmark}>
                                                <CheckCircle2
                                                    size={24}
                                                    color={method.color}
                                                    strokeWidth={2}
                                                    fill={method.color}
                                                />
                                            </View>
                                        )}
                                    </View>

                                    {/* Info */}
                                    <View style={styles.paymentMethodInfo}>
                                        <Text
                                            style={[
                                                styles.paymentMethodLabel,
                                                isSelected && { color: method.color },
                                            ]}
                                        >
                                            {method.label}
                                        </Text>
                                        <Text style={styles.paymentMethodDescription}>
                                            {method.description}
                                        </Text>
                                    </View>

                                    {/* Pros & Cons */}
                                    <View style={styles.prosConsList}>
                                        <View style={styles.prosList}>
                                            <Text style={styles.prosConsTitle}>Avantajlar:</Text>
                                            {method.pros.map((pro, index) => (
                                                <View key={index} style={styles.prosConsItem}>
                                                    <View
                                                        style={[
                                                            styles.prosDot,
                                                            { backgroundColor: method.color },
                                                        ]}
                                                    />
                                                    <Text style={styles.prosConsText}>{pro}</Text>
                                                </View>
                                            ))}
                                        </View>
                                        <View style={styles.consList}>
                                            <Text style={styles.prosConsTitle}>Dezavantajlar:</Text>
                                            {method.cons.map((con, index) => (
                                                <View key={index} style={styles.prosConsItem}>
                                                    <View style={styles.consDot} />
                                                    <Text style={styles.prosConsText}>{con}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </SettingsSection>

                {/* Auto Payment */}
                <SettingsSection
                    title="Otomatik Ödeme"
                    footer="Maç ücretlerini otomatik olarak ödeyin"
                >
                    <SettingsToggle
                        title="Otomatik Ödeme"
                        subtitle={
                            settings.preferences.autoPayment
                                ? 'Maç ücretleri otomatik ödenecek'
                                : 'Manuel ödeme yapacaksınız'
                        }
                        value={settings.preferences.autoPayment}
                        onValueChange={handleToggleAutoPayment}
                        disabled={saving}
                    />

                    {settings.preferences.autoPayment && (
                        <View style={styles.autoPaymentWarning}>
                            <Shield size={18} color="#F59E0B" strokeWidth={2} />
                            <Text style={styles.autoPaymentWarningText}>
                                Otomatik ödeme aktif. Maçlara katıldığınızda ücret seçili
                                yöntemle otomatik ödenecek.
                            </Text>
                        </View>
                    )}
                </SettingsSection>

                {/* Payment Reminder */}
                <SettingsSection
                    title="Ödeme Hatırlatıcısı"
                    footer="Ödeme yapmanız gerektiğinde hatırlatılın"
                >
                    <SettingsToggle
                        title="Ödeme Hatırlatıcısı"
                        subtitle={
                            settings.preferences.paymentReminder?.enabled
                                ? 'Hatırlatıcılar açık'
                                : 'Hatırlatıcılar kapalı'
                        }
                        value={settings.preferences.paymentReminder?.enabled || false}
                        onValueChange={handleTogglePaymentReminder}
                        disabled={saving}
                    />

                    {settings.preferences.paymentReminder?.enabled && (
                        <SettingsItem
                            icon={<Clock size={22} color="#3B82F6" strokeWidth={2} />}
                            title="Hatırlatma Zamanı"
                            subtitle="Ne kadar önce hatırlatılmak istersiniz"
                            value={getReminderDaysLabel()}
                            onPress={handleSelectReminderDays}
                            showChevron={true}
                            disabled={saving}
                        />
                    )}
                </SettingsSection>

                {/* Payment Summary */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryHeader}>
                        <TrendingUp size={20} color="#10B981" strokeWidth={2} />
                        <Text style={styles.summaryTitle}>Ödeme Özeti</Text>
                    </View>
                    <View style={styles.summaryContent}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Varsayılan Yöntem:</Text>
                            <Text style={styles.summaryValue}>{getPaymentMethodLabel()}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Otomatik Ödeme:</Text>
                            <View style={styles.summaryBadge}>
                                {settings.preferences.autoPayment ? (
                                    <CheckCircle2 size={14} color="#10B981" strokeWidth={2} />
                                ) : (
                                    <Circle size={14} color="#9CA3AF" strokeWidth={2} />
                                )}
                                <Text
                                    style={[
                                        styles.summaryBadgeText,
                                        settings.preferences.autoPayment &&
                                        styles.summaryBadgeTextActive,
                                    ]}
                                >
                                    {settings.preferences.autoPayment ? 'Açık' : 'Kapalı'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Hatırlatıcı:</Text>
                            <View style={styles.summaryBadge}>
                                {settings.preferences.paymentReminder?.enabled ? (
                                    <CheckCircle2 size={14} color="#10B981" strokeWidth={2} />
                                ) : (
                                    <Circle size={14} color="#9CA3AF" strokeWidth={2} />
                                )}
                                <Text
                                    style={[
                                        styles.summaryBadgeText,
                                        settings.preferences.paymentReminder?.enabled &&
                                        styles.summaryBadgeTextActive,
                                    ]}
                                >
                                    {settings.preferences.paymentReminder?.enabled
                                        ? getReminderDaysLabel()
                                        : 'Kapalı'}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Security Info */}
                <View style={styles.securityCard}>
                    <View style={styles.securityHeader}>
                        <Shield size={20} color="#10B981" strokeWidth={2} />
                        <Text style={styles.securityTitle}>Güvenlik</Text>
                    </View>
                    <View style={styles.securityContent}>
                        <View style={styles.securityItem}>
                            <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                            <Text style={styles.securityText}>
                                Tüm ödemeler SSL ile şifrelenir
                            </Text>
                        </View>
                        <View style={styles.securityItem}>
                            <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                            <Text style={styles.securityText}>
                                Kart bilgileriniz saklanmaz
                            </Text>
                        </View>
                        <View style={styles.securityItem}>
                            <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                            <Text style={styles.securityText}>
                                PCI-DSS standartlarına uygun
                            </Text>
                        </View>
                        <View style={styles.securityItem}>
                            <CheckCircle2 size={16} color="#10B981" strokeWidth={2} />
                            <Text style={styles.securityText}>
                                3D Secure ile ekstra koruma
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tips Card */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 İpuçları</Text>
                    <Text style={styles.tipsText}>
                        • Otomatik ödeme zamandan tasarruf sağlar{'\n'}
                        • Hatırlatıcılar son dakika stresini önler{'\n'}
                        • Nakit ödeme için para üstü götürün{'\n'}
                        • Kart ödemelerinde komisyon olabilir{'\n'}
                        • Ödeme geçmişinizi düzenli kontrol edin
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
        backgroundColor: '#D1FAE5',
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
        color: '#065F46',
        marginBottom: 4,
    },
    infoText: {
        fontSize: 13,
        color: '#065F46',
        lineHeight: 18,
    },

    // Current Method Card
    currentMethodCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    currentMethodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    currentMethodIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentMethodInfo: {
        flex: 1,
    },
    currentMethodLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 2,
    },
    currentMethodTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },

    // Payment Methods List
    paymentMethodsList: {
        padding: 16,
        gap: 16,
    },
    paymentMethodCard: {
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
    paymentMethodCardActive: {
        borderWidth: 3,
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    paymentMethodHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    paymentMethodIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    paymentMethodCheckmark: {
        position: 'absolute',
        top: 0,
        right: 0,
    },
    paymentMethodInfo: {
        marginBottom: 16,
    },
    paymentMethodLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    paymentMethodDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    prosConsList: {
        gap: 12,
    },
    prosList: {
        gap: 6,
    },
    consList: {
        gap: 6,
    },
    prosConsTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    prosConsItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    prosDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
    },
    consDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#EF4444',
        marginTop: 6,
    },
    prosConsText: {
        flex: 1,
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },

    // Auto Payment Warning
    autoPaymentWarning: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginHorizontal: 16,
        marginTop: -8,
        marginBottom: 8,
        borderRadius: 8,
        backgroundColor: '#FEF3C7',
    },
    autoPaymentWarningText: {
        flex: 1,
        fontSize: 13,
        color: '#92400E',
        lineHeight: 18,
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
    summaryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    summaryContent: {
        gap: 10,
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
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: '#F9FAFB',
    },
    summaryBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#9CA3AF',
    },
    summaryBadgeTextActive: {
        color: '#10B981',
    },

    // Security Card
    securityCard: {
        backgroundColor: '#D1FAE5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    securityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    securityTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#065F46',
    },
    securityContent: {
        gap: 8,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    securityText: {
        fontSize: 13,
        color: '#065F46',
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