// src/screens/Invitation/CreateInvitationScreen.tsx
// 🎯 GENERIC CREATE INVITATION - Type-specific forms

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Switch,
} from 'react-native';
import {
    X,
    Check,
    Calendar,
    Users,
    Info,
    Crown,
    Shield,
    UserPlus,
    ChevronLeft,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { NavigationService } from '../../navigation/NavigationService';
import {
    LeagueInvitationService,
    MatchInvitationService,
} from '../../services/serviceLayer/invitationService';
import { useAuth } from '../../hooks';
import { InvitationType } from '../../types/entity/invitation';
import { getSportEmoji, getSportPrimaryColor } from '../../utils/theme';
import { CustomHeader } from '../../components/CustomHeader';
import { SportType } from '../../types/entity/types';

type CreateInvitationParams = {
    type: 'league' | 'match';
    targetId: string;
    targetTitle: string;
    sportType?: SportType;
};

export const CreateInvitationScreen: React.FC = () => {
    const route: any = useRoute();
    const { user } = useAuth();
    const params: CreateInvitationParams = route.params;

    const { type, targetId, targetTitle, sportType } = params;

    // Common fields
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [hasExpiry, setHasExpiry] = useState(false);
    const [expiryDays, setExpiryDays] = useState('30');
    const [hasLimit, setHasLimit] = useState(false);
    const [maxUses, setMaxUses] = useState('100');

    // League-specific fields
    const [assignRole, setAssignRole] = useState<'member' | 'premium' | 'direct'>('member');
    const [autoApprove, setAutoApprove] = useState(true);
    const [welcomeMessage, setWelcomeMessage] = useState('');

    // Match-specific fields
    const [matchType, setMatchType] = useState<'FRIENDLY' | 'LEAGUE' | 'TOURNAMENT'>('FRIENDLY');
    const [allowGuests, setAllowGuests] = useState(false);
    const [registrationType, setRegistrationType] = useState<'player' | 'reserve' | 'any'>('any');
    const [teamAssignment, setTeamAssignment] = useState<'auto' | 'team1' | 'team2' | 'manual'>(
        'manual'
    );
    const [maxPlayersPerInvite, setMaxPlayersPerInvite] = useState('1');
    const [expiryHours, setExpiryHours] = useState('48');

    const [creating, setCreating] = useState(false);

    const sportColor = sportType ? getSportPrimaryColor(sportType as any) : '#16a34a';
    const sportEmoji = sportType ? getSportEmoji(sportType as any) : '🏆';

    // ============================================
    // CREATE INVITATION
    // ============================================

    const handleCreate = async () => {
        if (!user?.id) {
            Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
            return;
        }

        // Validation
        if (hasExpiry) {
            const days = parseInt(expiryDays);
            if (isNaN(days) || days < 1) {
                Alert.alert('Hata', 'Geçerli bir süre girin');
                return;
            }
        }

        if (hasLimit) {
            const limit = parseInt(maxUses);
            if (isNaN(limit) || limit < 1) {
                Alert.alert('Hata', 'Geçerli bir limit girin');
                return;
            }
        }

        if (type === 'match') {
            const hours = parseInt(expiryHours);
            if (isNaN(hours) || hours < 1) {
                Alert.alert('Hata', 'Geçerli bir süre girin');
                return;
            }

            const staffLimit = parseInt(maxUses);
            if (isNaN(staffLimit) || staffLimit < 1) {
                Alert.alert('Hata', 'Geçerli bir kadro limiti girin');
                return;
            }
        }

        try {
            setCreating(true);

            if (type === 'league') {
                // Create League Invitation
                const result = await LeagueInvitationService.generateInvite({
                    leagueId: targetId,
                    creatorId: user.id,
                    description: description.trim() || undefined,
                    tags: tags.trim() ? tags.split(',').map((t) => t.trim()) : undefined,
                    assignRole,
                    autoApprove,
                    welcomeMessage: welcomeMessage.trim() || undefined,
                    expiresInDays: hasExpiry ? parseInt(expiryDays) : undefined,
                    maxUses: hasLimit ? parseInt(maxUses) : undefined,
                });

                if (!result.success) {
                    Alert.alert('Hata', result.error?.message || 'Davet kodu oluşturulamadı');
                    return;
                }

                Alert.alert('Başarılı! 🎉', `Davet kodu oluşturuldu: ${result.data!.code}`, [
                    {
                        text: 'Tamam',
                        onPress: () => NavigationService.goBack(),
                    },
                ]);
            } else {
                // Create Match Invitation
                const result = await MatchInvitationService.generateInvite({
                    matchId: targetId,
                    creatorId: user.id,
                    matchType,
                    description: description.trim() || undefined,
                    tags: tags.trim() ? tags.split(',').map((t) => t.trim()) : undefined,
                    allowGuests,
                    registrationType,
                    teamAssignment,
                    maxPlayersPerInvite: parseInt(maxPlayersPerInvite),
                    expiresInHours: parseInt(expiryHours),
                    maxUses: parseInt(maxUses),
                });

                if (!result.success) {
                    Alert.alert('Hata', result.error?.message || 'Davet kodu oluşturulamadı');
                    return;
                }

                Alert.alert('Başarılı! 🎉', `Davet kodu oluşturuldu: ${result.data!.code}`, [
                    {
                        text: 'Tamam',
                        onPress: () => NavigationService.goBack(),
                    },
                ]);
            }
        } catch (error) {
            console.error('Error creating invitation:', error);
            Alert.alert('Hata', 'Beklenmeyen bir hata oluştu');
        } finally {
            setCreating(false);
        }
    };

    // ============================================
    // RENDER LEAGUE FORM
    // ============================================

    const renderLeagueForm = () => (
        <>
            {/* Role Selection */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Atanacak Rol</Text>
                <Text style={styles.sectionSubtitle}>
                    Davet edilen oyunculara hangi rol atansın?
                </Text>

                <View style={styles.roleButtons}>
                    <TouchableOpacity
                        style={[
                            styles.roleButton,
                            assignRole === 'member' && [styles.roleButtonActive, { borderColor: sportColor }],
                        ]}
                        onPress={() => setAssignRole('member')}
                        activeOpacity={0.7}
                    >
                        <UserPlus
                            size={20}
                            color={assignRole === 'member' ? sportColor : '#6B7280'}
                            strokeWidth={2}
                        />
                        <Text
                            style={[
                                styles.roleButtonText,
                                assignRole === 'member' && [styles.roleButtonTextActive, { color: sportColor }],
                            ]}
                        >
                            Üye
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.roleButton,
                            assignRole === 'premium' && [styles.roleButtonActive, { borderColor: sportColor }],
                        ]}
                        onPress={() => setAssignRole('premium')}
                        activeOpacity={0.7}
                    >
                        <Crown
                            size={20}
                            color={assignRole === 'premium' ? sportColor : '#6B7280'}
                            strokeWidth={2}
                        />
                        <Text
                            style={[
                                styles.roleButtonText,
                                assignRole === 'premium' && [styles.roleButtonTextActive, { color: sportColor }],
                            ]}
                        >
                            Premium
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.roleButton,
                            assignRole === 'direct' && [styles.roleButtonActive, { borderColor: sportColor }],
                        ]}
                        onPress={() => setAssignRole('direct')}
                        activeOpacity={0.7}
                    >
                        <Shield
                            size={20}
                            color={assignRole === 'direct' ? sportColor : '#6B7280'}
                            strokeWidth={2}
                        />
                        <Text
                            style={[
                                styles.roleButtonText,
                                assignRole === 'direct' && [styles.roleButtonTextActive, { color: sportColor }],
                            ]}
                        >
                            Direkt
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Auto Approve */}
            <View style={styles.section}>
                <View style={styles.switchRow}>
                    <View style={styles.switchLabel}>
                        <Text style={styles.switchTitle}>Otomatik Onay</Text>
                        <Text style={styles.switchSubtitle}>
                            Oyuncular onaysız doğrudan lige eklensin
                        </Text>
                    </View>
                    <Switch
                        value={autoApprove}
                        onValueChange={setAutoApprove}
                        trackColor={{ false: '#D1D5DB', true: sportColor + '40' }}
                        thumbColor={autoApprove ? sportColor : '#F3F4F6'}
                    />
                </View>
            </View>

            {/* Welcome Message */}
            <View style={styles.section}>
                <Text style={styles.label}>Karşılama Mesajı (Opsiyonel)</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Hoş geldiniz! Ligemize katıldığınız için teşekkürler..."
                    placeholderTextColor="#9CA3AF"
                    value={welcomeMessage}
                    onChangeText={setWelcomeMessage}
                    multiline
                    numberOfLines={3}
                    maxLength={200}
                />
                <Text style={styles.charCount}>{welcomeMessage.length}/200</Text>
            </View>
        </>
    );

    // ============================================
    // RENDER MATCH FORM
    // ============================================

    const renderMatchForm = () => (
        <>
            {/* Match Type */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Maç Tipi</Text>
                <View style={styles.chipRow}>
                    <TouchableOpacity
                        style={[
                            styles.chip,
                            matchType === 'FRIENDLY' && [styles.chipActive, { backgroundColor: sportColor + '20', borderColor: sportColor }],
                        ]}
                        onPress={() => setMatchType('FRIENDLY')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                matchType === 'FRIENDLY' && [styles.chipTextActive, { color: sportColor }],
                            ]}
                        >
                            Dostluk
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.chip,
                            matchType === 'LEAGUE' && [styles.chipActive, { backgroundColor: sportColor + '20', borderColor: sportColor }],
                        ]}
                        onPress={() => setMatchType('LEAGUE')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                matchType === 'LEAGUE' && [styles.chipTextActive, { color: sportColor }],
                            ]}
                        >
                            Lig
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.chip,
                            matchType === 'TOURNAMENT' && [styles.chipActive, { backgroundColor: sportColor + '20', borderColor: sportColor }],
                        ]}
                        onPress={() => setMatchType('TOURNAMENT')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                matchType === 'TOURNAMENT' && [styles.chipTextActive, { color: sportColor }],
                            ]}
                        >
                            Turnuva
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Registration Type */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kayıt Tipi</Text>
                <View style={styles.chipRow}>
                    <TouchableOpacity
                        style={[
                            styles.chip,
                            registrationType === 'player' && [styles.chipActive, { backgroundColor: sportColor + '20', borderColor: sportColor }],
                        ]}
                        onPress={() => setRegistrationType('player')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                registrationType === 'player' && [styles.chipTextActive, { color: sportColor }],
                            ]}
                        >
                            Oyuncu
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.chip,
                            registrationType === 'reserve' && [styles.chipActive, { backgroundColor: sportColor + '20', borderColor: sportColor }],
                        ]}
                        onPress={() => setRegistrationType('reserve')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                registrationType === 'reserve' && [styles.chipTextActive, { color: sportColor }],
                            ]}
                        >
                            Yedek
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.chip,
                            registrationType === 'any' && [styles.chipActive, { backgroundColor: sportColor + '20', borderColor: sportColor }],
                        ]}
                        onPress={() => setRegistrationType('any')}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                registrationType === 'any' && [styles.chipTextActive, { color: sportColor }],
                            ]}
                        >
                            Herhangi
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Allow Guests */}
            <View style={styles.section}>
                <View style={styles.switchRow}>
                    <View style={styles.switchLabel}>
                        <Text style={styles.switchTitle}>Misafir Oyunculara İzin Ver</Text>
                        <Text style={styles.switchSubtitle}>
                            Kayıtsız oyuncular misafir olarak eklenebilir
                        </Text>
                    </View>
                    <Switch
                        value={allowGuests}
                        onValueChange={setAllowGuests}
                        trackColor={{ false: '#D1D5DB', true: sportColor + '40' }}
                        thumbColor={allowGuests ? sportColor : '#F3F4F6'}
                    />
                </View>
            </View>

            {/* Expiry Hours */}
            <View style={styles.section}>
                <Text style={styles.label}>Geçerlilik Süresi (Saat)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="48"
                    placeholderTextColor="#9CA3AF"
                    value={expiryHours}
                    onChangeText={setExpiryHours}
                    keyboardType="number-pad"
                    maxLength={3}
                />
                <Text style={styles.hint}>Maç davet kodları her zaman bir son kullanma tarihine sahiptir</Text>
            </View>

            {/* Max Uses (Staff Limit) */}
            <View style={styles.section}>
                <Text style={styles.label}>Maksimum Kullanım (Kadro Limiti)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="20"
                    placeholderTextColor="#9CA3AF"
                    value={maxUses}
                    onChangeText={setMaxUses}
                    keyboardType="number-pad"
                    maxLength={3}
                />
                <Text style={styles.hint}>Bu kod ile kaç oyuncu kaydolabilir</Text>
            </View>
        </>
    );

    // ============================================
    // MAIN RENDER
    // ============================================

    return (
        <View style={styles.container}>
            {/* Header */}
            <CustomHeader
                title="Davet Kodu Oluştur"
                subtitle={targetTitle}
                showBack={true}
                onLeftPress={() => NavigationService.goBack()}
                sportType={sportType}
            />

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Info Banner */}
                <View style={styles.infoBanner}>
                    <Info size={20} color="#3B82F6" strokeWidth={2} />
                    <Text style={styles.infoBannerText}>
                        {type === 'league'
                            ? 'Lig davet kodları yeni üyeler eklemenizi sağlar'
                            : 'Maç davet kodları oyuncu çağırmanızı sağlar'}
                    </Text>
                </View>

                {/* Description */}
                <View style={styles.section}>
                    <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={type === 'league' ? 'Sezon 1 Daveti' : 'Hafta Sonu Maçı'}
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDescription}
                        maxLength={50}
                    />
                </View>

                {/* Tags */}
                <View style={styles.section}>
                    <Text style={styles.label}>Etiketler (Opsiyonel)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="sezon1, premium, vip"
                        placeholderTextColor="#9CA3AF"
                        value={tags}
                        onChangeText={setTags}
                        maxLength={50}
                    />
                    <Text style={styles.hint}>Virgülle ayırarak yazın</Text>
                </View>

                {/* Type-specific forms */}
                {type === 'league' ? renderLeagueForm() : renderMatchForm()}

                {/* Expiry (League only - optional) */}
                {type === 'league' && (
                    <>
                        <View style={styles.section}>
                            <View style={styles.switchRow}>
                                <View style={styles.switchLabel}>
                                    <Text style={styles.switchTitle}>Son Kullanma Tarihi Ekle</Text>
                                    <Text style={styles.switchSubtitle}>
                                        Belirli bir tarihte otomatik olarak devre dışı bırakılsın
                                    </Text>
                                </View>
                                <Switch
                                    value={hasExpiry}
                                    onValueChange={setHasExpiry}
                                    trackColor={{ false: '#D1D5DB', true: sportColor + '40' }}
                                    thumbColor={hasExpiry ? sportColor : '#F3F4F6'}
                                />
                            </View>
                        </View>

                        {hasExpiry && (
                            <View style={styles.section}>
                                <Text style={styles.label}>Geçerlilik Süresi (Gün)</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="30"
                                    placeholderTextColor="#9CA3AF"
                                    value={expiryDays}
                                    onChangeText={setExpiryDays}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                            </View>
                        )}

                        {/* Max Uses (League only - optional) */}
                        <View style={styles.section}>
                            <View style={styles.switchRow}>
                                <View style={styles.switchLabel}>
                                    <Text style={styles.switchTitle}>Kullanım Limiti Ekle</Text>
                                    <Text style={styles.switchSubtitle}>
                                        Belirli sayıda kullanımdan sonra otomatik kapansın
                                    </Text>
                                </View>
                                <Switch
                                    value={hasLimit}
                                    onValueChange={setHasLimit}
                                    trackColor={{ false: '#D1D5DB', true: sportColor + '40' }}
                                    thumbColor={hasLimit ? sportColor : '#F3F4F6'}
                                />
                            </View>
                        </View>

                        {hasLimit && (
                            <View style={styles.section}>
                                <Text style={styles.label}>Maksimum Kullanım</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="100"
                                    placeholderTextColor="#9CA3AF"
                                    value={maxUses}
                                    onChangeText={setMaxUses}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                />
                            </View>
                        )}
                    </>
                )}

                {/* Create Button */}
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: sportColor }, creating && styles.createButtonDisabled]}
                    onPress={handleCreate}
                    disabled={creating}
                    activeOpacity={0.7}
                >
                    {creating ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Check size={20} color="#FFF" strokeWidth={2.5} />
                            <Text style={styles.createButtonText}>Davet Kodu Oluştur</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#EFF6FF',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    infoBannerText: {
        flex: 1,
        fontSize: 13,
        color: '#1E40AF',
        lineHeight: 18,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginBottom: 12,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
    },
    textArea: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 6,
    },
    charCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 6,
    },
    roleButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    roleButtonActive: {
        backgroundColor: '#FFF',
    },
    roleButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    roleButtonTextActive: {
        fontWeight: '700',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    switchLabel: {
        flex: 1,
        marginRight: 12,
    },
    switchTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    switchSubtitle: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    chipActive: {
        backgroundColor: '#DCFCE7',
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    chipTextActive: {
        fontWeight: '700',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        marginHorizontal: 16,
        marginTop: 32,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    bottomSpacing: {
        height: 40,
    },
});