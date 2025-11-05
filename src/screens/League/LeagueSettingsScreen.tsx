// src/screens/League/LeagueSettingsScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {
    ChevronLeft,
    Save,
    Settings,
    DollarSign,
    Users,
    Clock,
    Trophy,
    Star,
    MessageSquare,
    Zap,
    Shield,
    AlertCircle,
    Check,
    Info,
} from 'lucide-react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useAuth } from '../../hooks';
import { NavigationService } from '../../navigation/NavigationService';
import { LeagueSettingsService } from '../../services/serviceLayer/leagueSettingsService';
import { ILeagueSettings } from '../../types/entity/types';
import { CustomHeader } from '../../components/CustomHeader';

// ============================================
// TYPES
// ============================================

type LeagueSettingsRouteProp = RouteProp<{ params: { leagueId: string } }, 'params'>;

interface SettingsSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}

// ============================================
// MAIN COMPONENT
// ============================================

export const LeagueSettingsScreen: React.FC = () => {
    const { user } = useAuth();
    const route = useRoute<LeagueSettingsRouteProp>();
    const { leagueId } = route.params;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<ILeagueSettings | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // ============================================
    // DATA LOADING
    // ============================================

    useEffect(() => {
        loadSettings();
    }, [leagueId]);

    const loadSettings = async () => {
        if (!leagueId || !user?.id) return;

        try {
            setLoading(true);
            
            const result = await LeagueSettingsService.getOrCreateSettings(leagueId, user.id);

            if (result.success && result.data) {
                setSettings(result.data);
            } else {
                Alert.alert('Hata', result.error?.message || 'Ayarlar yüklenemedi');
            }
        } catch (error) {
            console.error('Error loading settings:', error);
            Alert.alert('Hata', 'Ayarlar yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // UPDATE HANDLERS
    // ============================================

    const updateSettings = <K extends keyof ILeagueSettings>(
        section: K,
        value: Partial<ILeagueSettings[K]>
    ) => {
        if (!settings) return;

        setSettings(prev => {
            if (!prev) return prev;

            const currentSection = prev[section];

            // Type guard - ensure section is an object
            if (typeof currentSection !== 'object' || currentSection === null) {
                return prev;
            }

            return {
                ...prev,
                [section]: {
                    ...(currentSection as object),  // ✅ Explicit type assertion
                    ...value,
                },
            } as ILeagueSettings;  // ✅ Return type assertion
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!settings || !user?.id) return;

        try {
            setSaving(true);

            // Update each section separately using the appropriate service methods
            const updatePromises: Promise<any>[] = [];

            // 1. Update Rules
            updatePromises.push(
                LeagueSettingsService.updateRules(leagueId, settings.rules, user.id)
            );

            // 2. Update Match Rules
            updatePromises.push(
                LeagueSettingsService.updateMatchRules(leagueId, settings.matchRules, user.id)
            );

            // 3. Update Registration Rules
            updatePromises.push(
                LeagueSettingsService.updateRegistrationRules(leagueId, settings.registration, user.id)
            );

            // 4. Update Scoring Rules
            updatePromises.push(
                LeagueSettingsService.updateScoringRules(leagueId, settings.scoring, user.id)
            );

            // 5. Update Rating Rules
            updatePromises.push(
                LeagueSettingsService.updateRatingRules(leagueId, settings.rating, user.id)
            );

            // 6. Update Comment Rules
            updatePromises.push(
                LeagueSettingsService.updateCommentRules(leagueId, settings.comments, user.id)
            );

            // 7. Update Payment Settings
            updatePromises.push(
                LeagueSettingsService.updatePaymentSettings(leagueId, settings.payment, user.id)
            );

            // 8. Update Integrations (if exists)
            if (settings.integrations) {
                updatePromises.push(
                    LeagueSettingsService.updateIntegrations(leagueId, settings.integrations, user.id)
                );
            }

            // Execute all updates in parallel
            const results = await Promise.all(updatePromises);

            // Check if all updates were successful
            const allSuccessful = results.every(result => result.success);

            if (allSuccessful) {
                setHasChanges(false);
                Alert.alert('✅ Başarılı', 'Tüm ayarlar kaydedildi');
            } else {
                // Find failed updates
                const failedUpdates = results
                    .map((result, index) => ({ result, index }))
                    .filter(({ result }) => !result.success);

                const sectionNames = [
                    'Genel Kurallar',
                    'Maç Kuralları',
                    'Kayıt Kuralları',
                    'Skor & İstatistik',
                    'Oyuncu Puanlama',
                    'Yorum Ayarları',
                    'Ödeme Ayarları',
                    'Entegrasyonlar',
                ];

                const failedSections = failedUpdates.map(({ index }) => sectionNames[index]).join(', ');

                Alert.alert(
                    '⚠️ Kısmi Başarı',
                    `Bazı ayarlar kaydedilemedi: ${failedSections}`,
                    [
                        { text: 'Tamam' },
                        {
                            text: 'Tekrar Dene',
                            onPress: handleSave,
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            Alert.alert('Hata', 'Ayarlar kaydedilirken bir hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // RENDER HELPERS
    // ============================================

    const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, children }) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                {icon}
                <Text style={styles.sectionTitle}>{title}</Text>
            </View>
            <View style={styles.sectionContent}>{children}</View>
        </View>
    );

    const SettingRow = ({
        label,
        value,
        onValueChange,
        type = 'switch',
        placeholder = '',
        suffix = '',
        info = '',
    }: {
        label: string;
        value: any;
        onValueChange: (value: any) => void;
        type?: 'switch' | 'number' | 'text';
        placeholder?: string;
        suffix?: string;
        info?: string;
    }) => (
        <View style={styles.settingRow}>
            <View style={styles.settingLabel}>
                <Text style={styles.settingLabelText}>{label}</Text>
                {info && (
                    <TouchableOpacity
                        style={styles.infoButton}
                        onPress={() => Alert.alert(label, info)}
                    >
                        <Info size={16} color="#9CA3AF" strokeWidth={2} />
                    </TouchableOpacity>
                )}
            </View>

            {type === 'switch' && (
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: '#D1D5DB', true: '#86EFAC' }}
                    thumbColor={value ? '#16a34a' : '#F3F4F6'}
                />
            )}

            {type === 'number' && (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={value?.toString() || ''}
                        onChangeText={(text) => {
                            const num = parseInt(text) || 0;
                            onValueChange(num);
                        }}
                        keyboardType="numeric"
                        placeholder={placeholder}
                        placeholderTextColor="#9CA3AF"
                    />
                    {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
                </View>
            )}

            {type === 'text' && (
                <TextInput
                    style={[styles.input, styles.textInput]}
                    value={value || ''}
                    onChangeText={onValueChange}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                />
            )}
        </View>
    );

    // ============================================
    // RENDER
    // ============================================

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>Ayarlar yükleniyor...</Text>
            </View>
        );
    }

    if (!settings) {
        return (
            <View style={styles.errorContainer}>
                <AlertCircle size={48} color="#EF4444" strokeWidth={2} />
                <Text style={styles.errorText}>Ayarlar yüklenemedi</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
                    <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* HEADER */}
            <CustomHeader 
                title="Lig Ayarları"
                showBack={true}
                onLeftPress={() => {
                    if (hasChanges) {
                        Alert.alert(
                            'Kaydedilmemiş Değişiklikler',
                            'Değişiklikleriniz kaydedilmedi. Çıkmak istediğinize emin misiniz?',
                            [
                                { text: 'Kalmaya Devam Et', style: 'cancel' },
                                { text: 'Çık', style: 'destructive', onPress: () => NavigationService.goBack() },
                            ]
                        );
                    } else {
                        NavigationService.goBack();
                    }
                }}
                customIcon={Settings}
                showIcon={true}
                showSave={true}
                // sportType={settings}
                loading={saving}
                disableSave={!hasChanges || saving}
                onSavePress={handleSave}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* General Rules */}
                <SettingsSection
                    title="Genel Kurallar"
                    icon={<Shield size={20} color="#16a34a" strokeWidth={2} />}
                >
                    <SettingRow
                        label="Geç Gelme Cezası"
                        value={settings.rules.lateArrivalPenalty}
                        onValueChange={(value) => updateSettings('rules', { lateArrivalPenalty: value })}
                        type="number"
                        placeholder="0"
                        suffix="₺"
                        info="Oyuncular maça geç geldiğinde ödenecek ceza miktarı"
                    />

                    <SettingRow
                        label="Haber Vermeden Gelmeme Cezası"
                        value={settings.rules.absentWithoutNoticePenalty}
                        onValueChange={(value) =>
                            updateSettings('rules', { absentWithoutNoticePenalty: value })
                        }
                        type="number"
                        placeholder="0"
                        suffix="₺"
                        info="Haber vermeden maça gelmeyen oyuncular için ceza"
                    />

                    <SettingRow
                        label="Sarı Kart Cezası"
                        value={settings.rules.yellowCardFine}
                        onValueChange={(value) => updateSettings('rules', { yellowCardFine: value })}
                        type="number"
                        placeholder="0"
                        suffix="₺"
                    />

                    <SettingRow
                        label="Kırmızı Kart Cezası"
                        value={settings.rules.redCardFine}
                        onValueChange={(value) => updateSettings('rules', { redCardFine: value })}
                        type="number"
                        placeholder="0"
                        suffix="₺"
                    />

                    <SettingRow
                        label="Minimum Katılım Oranı"
                        value={settings.rules.minAttendanceRate}
                        onValueChange={(value) => updateSettings('rules', { minAttendanceRate: value })}
                        type="number"
                        placeholder="0"
                        suffix="%"
                        info="Ligde kalabilmek için gereken minimum katılım oranı"
                    />
                </SettingsSection>

                {/* Match Rules */}
                <SettingsSection
                    title="Maç Kuralları"
                    icon={<Users size={20} color="#2563EB" strokeWidth={2} />}
                >
                    <SettingRow
                        label="Misafir Oyuncu İzni"
                        value={settings.matchRules.allowGuestPlayers}
                        onValueChange={(value) =>
                            updateSettings('matchRules', { allowGuestPlayers: value })
                        }
                        type="switch"
                        info="Lige üye olmayan oyuncuların maça katılmasına izin ver"
                    />

                    {settings.matchRules.allowGuestPlayers && (
                        <>
                            <SettingRow
                                label="Maç Başına Max Misafir"
                                value={settings.matchRules.maxGuestPlayersPerMatch}
                                onValueChange={(value) =>
                                    updateSettings('matchRules', { maxGuestPlayersPerMatch: value })
                                }
                                type="number"
                                placeholder="0"
                                suffix="oyuncu"
                            />

                            <SettingRow
                                label="Misafir Oyuncu Fiyat Çarpanı"
                                value={settings.matchRules.guestPlayerPriceMultiplier}
                                onValueChange={(value) =>
                                    updateSettings('matchRules', { guestPlayerPriceMultiplier: value })
                                }
                                type="number"
                                placeholder="1"
                                suffix="x"
                                info="Örn: 1.5 = %50 daha pahalı"
                            />
                        </>
                    )}

                    <SettingRow
                        label="Otomatik Takım Kurma"
                        value={settings.matchRules.autoAssignTeams}
                        onValueChange={(value) => updateSettings('matchRules', { autoAssignTeams: value })}
                        type="switch"
                        info="Algoritma kullanarak otomatik dengeli takımlar oluştur"
                    />
                </SettingsSection>

                {/* Registration Rules */}
                <SettingsSection
                    title="Kayıt Kuralları"
                    icon={<Clock size={20} color="#F59E0B" strokeWidth={2} />}
                >
                    <SettingRow
                        label="Geç Kayıt İzni"
                        value={settings.registration.allowLateRegistration}
                        onValueChange={(value) =>
                            updateSettings('registration', { allowLateRegistration: value })
                        }
                        type="switch"
                    />

                    {settings.registration.allowLateRegistration && (
                        <SettingRow
                            label="Geç Kayıt Deadline"
                            value={settings.registration.lateRegistrationDeadlineHours}
                            onValueChange={(value) =>
                                updateSettings('registration', { lateRegistrationDeadlineHours: value })
                            }
                            type="number"
                            placeholder="0"
                            suffix="saat önce"
                            info="Maçtan kaç saat önceye kadar geç kayıt yapılabilir"
                        />
                    )}

                    <SettingRow
                        label="Kadroya Girmek İçin Organizör Onayı Gerekli"
                        value={settings.registration.requireOrganizerApprovalForSquad}
                        onValueChange={(value) =>
                            updateSettings('registration', { requireOrganizerApprovalForSquad: value })
                        }
                        type="switch"
                    />

                    <SettingRow
                        label="Kayıt İçin Ödeme Zorunlu"
                        value={settings.registration.requirePaymentForRegistration}
                        onValueChange={(value) =>
                            updateSettings('registration', { requirePaymentForRegistration: value })
                        }
                        type="switch"
                    />

                    <SettingRow
                        label="Ödeme Otomatik Onayla"
                        value={settings.registration.autoConfirmPayment}
                        onValueChange={(value) =>
                            updateSettings('registration', { autoConfirmPayment: value })
                        }
                        type="switch"
                        info="Ödeme bildirimleri manuel onay gerektirmesin"
                    />

                    <SettingRow
                        label="İptal Deadline"
                        value={settings.registration.cancellationDeadlineHours}
                        onValueChange={(value) =>
                            updateSettings('registration', { cancellationDeadlineHours: value })
                        }
                        type="number"
                        placeholder="0"
                        suffix="saat önce"
                        info="Maçtan kaç saat önceye kadar kayıt iptal edilebilir"
                    />
                </SettingsSection>

                {/* Scoring Rules */}
                <SettingsSection
                    title="Skor & İstatistik"
                    icon={<Trophy size={20} color="#8B5CF6" strokeWidth={2} />}
                >
                    <SettingRow
                        label="Skor Onayı Gerekli"
                        value={settings.scoring.requireScoreConfirmation}
                        onValueChange={(value) =>
                            updateSettings('scoring', { requireScoreConfirmation: value })
                        }
                        type="switch"
                        info="Girilen skorların admin tarafından onaylanması gereksin"
                    />

                    {settings.scoring.requireScoreConfirmation && (
                        <SettingRow
                            label="Onay Timeout"
                            value={settings.scoring.scoreConfirmationTimeoutHours}
                            onValueChange={(value) =>
                                updateSettings('scoring', { scoreConfirmationTimeoutHours: value })
                            }
                            type="number"
                            placeholder="24"
                            suffix="saat"
                        />
                    )}

                    <SettingRow
                        label="Oyuncular Kendi Gollerini Girebilir"
                        value={settings.scoring.allowPlayerSelfReporting}
                        onValueChange={(value) =>
                            updateSettings('scoring', { allowPlayerSelfReporting: value })
                        }
                        type="switch"
                    />
                </SettingsSection>

                {/* Rating Rules */}
                <SettingsSection
                    title="Oyuncu Puanlama"
                    icon={<Star size={20} color="#EAB308" strokeWidth={2} />}
                >
                    <SettingRow
                        label="Puanlama Aktif"
                        value={settings.rating.enabled}
                        onValueChange={(value) => updateSettings('rating', { enabled: value })}
                        type="switch"
                    />

                    {settings.rating.enabled && (
                        <>
                            <SettingRow
                                label="Puanlama Zorunlu"
                                value={settings.rating.mandatory}
                                onValueChange={(value) => updateSettings('rating', { mandatory: value })}
                                type="switch"
                                info="Oyuncular maç sonrası puanlama yapmak zorunda"
                            />

                            <SettingRow
                                label="Anonim Puanlama"
                                value={settings.rating.anonymous}
                                onValueChange={(value) => updateSettings('rating', { anonymous: value })}
                                type="switch"
                                info="Puanlayanın kimliği gizli kalsın"
                            />

                            <SettingRow
                                label="Puanlama Deadline"
                                value={settings.rating.ratingDeadlineHours}
                                onValueChange={(value) =>
                                    updateSettings('rating', { ratingDeadlineHours: value })
                                }
                                type="number"
                                placeholder="24"
                                suffix="saat"
                                info="Maç bitiminden sonra kaç saat içinde puanlama yapılmalı"
                            />

                            <SettingRow
                                label="MVP İçin Min Puanlama"
                                value={settings.rating.minRatingsForMVP}
                                onValueChange={(value) => updateSettings('rating', { minRatingsForMVP: value })}
                                type="number"
                                placeholder="5"
                                suffix="oy"
                                info="Bir oyuncunun MVP olabilmesi için gereken minimum oy sayısı"
                            />

                            <SettingRow
                                label="Kategorik Puanlama"
                                value={settings.rating.allowCategoryRating}
                                onValueChange={(value) =>
                                    updateSettings('rating', { allowCategoryRating: value })
                                }
                                type="switch"
                                info="Teknik, Fiziksel, Taktik gibi kategorilerde ayrı puanlama"
                            />
                        </>
                    )}
                </SettingsSection>

                {/* Comments Rules */}
                <SettingsSection
                    title="Yorum Ayarları"
                    icon={<MessageSquare size={20} color="#06B6D4" strokeWidth={2} />}
                >
                    <SettingRow
                        label="Yorumlar Aktif"
                        value={settings.comments.enabled}
                        onValueChange={(value) => updateSettings('comments', { enabled: value })}
                        type="switch"
                    />

                    {settings.comments.enabled && (
                        <>
                            <SettingRow
                                label="Yorum Onayı Gerekli"
                                value={settings.comments.requireApproval}
                                onValueChange={(value) =>
                                    updateSettings('comments', { requireApproval: value })
                                }
                                type="switch"
                            />

                            <SettingRow
                                label="Beğeni İzni"
                                value={settings.comments.allowLikes}
                                onValueChange={(value) => updateSettings('comments', { allowLikes: value })}
                                type="switch"
                            />

                            <SettingRow
                                label="Max Yorum Uzunluğu"
                                value={settings.comments.maxLength}
                                onValueChange={(value) => updateSettings('comments', { maxLength: value })}
                                type="number"
                                placeholder="500"
                                suffix="karakter"
                            />
                        </>
                    )}
                </SettingsSection>

                {/* Payment Settings */}
                <SettingsSection
                    title="Ödeme Ayarları"
                    icon={<DollarSign size={20} color="#10B981" strokeWidth={2} />}
                >
                    <SettingRow
                        label="Varsayılan IBAN"
                        value={settings.payment.defaultIban}
                        onValueChange={(value) => updateSettings('payment', { defaultIban: value })}
                        type="text"
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                    />

                    <SettingRow
                        label="Hesap Sahibi"
                        value={settings.payment.defaultAccountName}
                        onValueChange={(value) => updateSettings('payment', { defaultAccountName: value })}
                        type="text"
                        placeholder="Ad Soyad"
                    />

                    <SettingRow
                        label="Oyuncu Başı Fiyat"
                        value={settings.payment.defaultPricePerPlayer}
                        onValueChange={(value) =>
                            updateSettings('payment', { defaultPricePerPlayer: value })
                        }
                        type="number"
                        placeholder="0"
                        suffix="₺"
                    />

                    <SettingRow
                        label="Taksit İzni"
                        value={settings.payment.allowInstallment}
                        onValueChange={(value) => updateSettings('payment', { allowInstallment: value })}
                        type="switch"
                        info="Oyuncuların taksitli ödeme yapmasına izin ver"
                    />
                </SettingsSection>

                {/* Integrations */}
                {settings.integrations && (
                    <SettingsSection
                        title="Entegrasyonlar"
                        icon={<Zap size={20} color="#F97316" strokeWidth={2} />}
                    >
                        <SettingRow
                            label="Google Calendar"
                            value={settings.integrations.googleCalendar}
                            onValueChange={(value) =>
                                updateSettings('integrations', { googleCalendar: value })
                            }
                            type="switch"
                            info="Maç fikstürlerini Google Calendar'a aktar"
                        />

                        <SettingRow
                            label="Google Sheets"
                            value={settings.integrations.googleSheets}
                            onValueChange={(value) =>
                                updateSettings('integrations', { googleSheets: value })
                            }
                            type="switch"
                            info="İstatistikleri Google Sheets'e aktar"
                        />

                        <SettingRow
                            label="WhatsApp Bildirimleri"
                            value={settings.integrations.whatsapp}
                            onValueChange={(value) => updateSettings('integrations', { whatsapp: value })}
                            type="switch"
                        />

                        <SettingRow
                            label="Slack Entegrasyonu"
                            value={settings.integrations.slack}
                            onValueChange={(value) => updateSettings('integrations', { slack: value })}
                            type="switch"
                        />
                    </SettingsSection>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Floating Save Button */}
            {hasChanges && (
                <View style={styles.floatingSaveContainer}>
                    <TouchableOpacity
                        style={styles.floatingSaveButton}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.9}
                    >
                        {saving ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <Check size={24} color="white" strokeWidth={3} />
                                <Text style={styles.floatingSaveText}>Değişiklikleri Kaydet</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </KeyboardAvoidingView>
    );
};

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },

    // Content
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },

    // Section
    section: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    sectionContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },

    // Setting Row
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    settingLabel: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    settingLabelText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    infoButton: {
        padding: 4,
    },

    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    input: {
        minWidth: 80,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'right',
    },
    textInput: {
        flex: 1,
        minWidth: 150,
        textAlign: 'left',
    },
    inputSuffix: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },

    // Loading & Error
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 15,
        color: '#6B7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
        marginTop: 16,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    retryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },

    // Floating Save
    floatingSaveContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    floatingSaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#16a34a',
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    floatingSaveText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },

    // Spacing
    bottomSpacing: {
        height: 40,
    },
});