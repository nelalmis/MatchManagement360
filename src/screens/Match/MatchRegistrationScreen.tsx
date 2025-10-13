import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import {
    X,
    Check,
    Calendar,
    MapPin,
    Users,
    DollarSign,
    Clock,
    AlertCircle,
    UserCheck,
    UserX,
    Trophy,
    Info,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
    IMatch,
    IMatchFixture,
    IPlayer,
    getSportIcon,
    getSportColor,
} from '../../types/types';
import { canRegisterToMatch } from '../../helper/matchRegisterHelper';
import { matchService } from '../../services/matchService';
import { matchFixtureService } from '../../services/matchFixtureService';
import { playerService } from '../../services/playerService';
import { NavigationService } from '../../navigation/NavigationService';
import { eventManager, Events } from '../../utils';

export const MatchRegistrationScreen: React.FC = () => {
    const route: any = useRoute();
    const { user } = useAppContext();
    const matchId = route.params?.matchId;

    const [match, setMatch] = useState<IMatch | null>(null);
    const [fixture, setFixture] = useState<IMatchFixture | null>(null);
    const [registeredPlayers, setRegisteredPlayers] = useState<IPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);

    const [isRegistered, setIsRegistered] = useState(false);
    const [isReserve, setIsReserve] = useState(false);
    const [availableSlots, setAvailableSlots] = useState(0);
    const [reserveSlots, setReserveSlots] = useState(0);

    useEffect(() => {
        loadData();
    }, [matchId]);

    const loadData = async () => {
        if (!matchId || !user?.id) {
            Alert.alert('Hata', 'Maç ID bulunamadı');
            NavigationService.goBack();
            return;
        }

        try {
            setLoading(true);

            const matchData = await matchService.getById(matchId);
            if (!matchData) {
                Alert.alert('Hata', 'Maç bulunamadı');
                NavigationService.goBack();
                return;
            }

            setMatch(matchData);

            // Get fixture
            const fixtureData = await matchFixtureService.getById(matchData.fixtureId);
            setFixture(fixtureData);

            // Check registration status
            const registered = matchData.registeredPlayerIds?.includes(user.id) || false;
            const reserve = matchData.reservePlayerIds?.includes(user.id) || false;

            setIsRegistered(registered);
            setIsReserve(reserve);

            // Calculate slots
            const totalRegistered = matchData.registeredPlayerIds?.length || 0;
            const totalDirect = matchData.directPlayerIds?.length || 0;
            const totalPremium = matchData.premiumPlayerIds?.length || 0;

            const staffSlots = fixtureData?.staffPlayerCount || 0;
            const reserveCount = fixtureData?.reservePlayerCount || 0;

            const occupied = totalRegistered + totalDirect;
            const available = Math.max(0, staffSlots - occupied);
            const reserveOccupied = matchData.reservePlayerIds?.length || 0;
            const reserveAvailable = Math.max(0, reserveCount - reserveOccupied);

            setAvailableSlots(available);
            setReserveSlots(reserveAvailable);

            // Load registered players
            if (matchData.registeredPlayerIds && matchData.registeredPlayerIds.length > 0) {
                const players = await playerService.getPlayersByIds(matchData.registeredPlayerIds);
                setRegisteredPlayers(players);
            }

        } catch (error) {
            console.error('Error loading match:', error);
            Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!match || !user?.id) return;

        // Check if registration is open
        if (match.status !== 'Kayıt Açık') {
            Alert.alert('Uyarı', 'Kayıtlar kapalı');
            return;
        }

        // Check registration time
        const now = new Date();
        if (now < new Date(match.registrationTime)) {
            Alert.alert('Uyarı', 'Kayıt henüz başlamadı');
            return;
        }

        if (now > new Date(match.registrationEndTime)) {
            Alert.alert('Uyarı', 'Kayıt süresi doldu');
            return;
        }

        Alert.alert(
            'Kayıt Ol',
            `${match.title} maçına kayıt olmak istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Kayıt Ol',
                    onPress: async () => {
                        try {
                            setRegistering(true);
                            const success = await matchService.registerPlayer(match.id, user.id);

                            if (success) {
                                // ✅ Event tetikle
                                eventManager.emit(Events.MATCH_REGISTERED, {
                                    matchId: match.id,
                                    timestamp: Date.now()
                                });

                                Alert.alert(
                                    'Başarılı! 🎉',
                                    availableSlots > 0
                                        ? 'Maça başarıyla kayıt oldunuz!'
                                        : 'Yedek listesine eklendi. Kadro oluşturulduğunda bilgilendirileceksiniz.',
                                    [
                                        {
                                            text: 'Tamam',
                                            onPress: () => NavigationService.goBack() // ✅ DEĞİŞTİ
                                        }
                                    ]
                                );
                            } else {
                                Alert.alert('Hata', 'Kayıt işlemi başarısız oldu');
                            }
                        } catch (error) {
                            Alert.alert('Hata', 'Kayıt sırasında bir hata oluştu');
                        } finally {
                            setRegistering(false);
                        }
                    }
                }
            ]
        );
    };

    const handleUnregister = async () => {
        if (!match || !user?.id) return;

        Alert.alert(
            'Kaydı İptal Et',
            'Maç kaydınızı iptal etmek istediğinize emin misiniz?',
            [
                { text: 'Vazgeç', style: 'cancel' },
                {
                    text: 'İptal Et',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setRegistering(true);
                            const success = await matchService.unregisterPlayer(match.id, user.id);

                            if (success) {
                                // ✅ Event tetikle
                                eventManager.emit(Events.MATCH_UNREGISTERED, {
                                    matchId: match.id,
                                    timestamp: Date.now()
                                });

                                Alert.alert('Başarılı', 'Kayıt iptal edildi', [
                                    {
                                        text: 'Tamam',
                                        onPress: () => NavigationService.goBack() // ✅ DEĞİŞTİ
                                    }
                                ]);
                            } else {
                                Alert.alert('Hata', 'İptal işlemi başarısız oldu');
                            }
                        } catch (error) {
                            Alert.alert('Hata', 'İptal sırasında bir hata oluştu');
                        } finally {
                            setRegistering(false);
                        }
                    }
                }
            ]
        );
    };

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getRegistrationStatus = () => {
        if (!match) return { color: '#9CA3AF', text: 'Bilinmiyor', icon: AlertCircle };

        const now = new Date();
        const regStart = new Date(match.registrationTime);
        const regEnd = new Date(match.registrationEndTime);

        if (now < regStart) {
            return { color: '#F59E0B', text: 'Henüz Başlamadı', icon: Clock };
        }
        if (now > regEnd || match.status !== 'Kayıt Açık') {
            return { color: '#DC2626', text: 'Kapandı', icon: X };
        }
        return { color: '#10B981', text: 'Açık', icon: Check };
    };

    // Yardımcı fonksiyon: Maça kayıt olabilir mi?
    const canRegisterToMatch = (match:IMatch, userId:any, fixture:IMatchFixture) => {
        if (!match || !userId || !fixture) return false;
        const now = new Date();
        if (match.status !== 'Kayıt Açık') return false;
        if (now < new Date(match.registrationTime)) return false;
        if (now > new Date(match.registrationEndTime)) return false;
        if (match.registeredPlayerIds?.includes(userId)) return false;
        if (match.reservePlayerIds?.includes(userId)) return false;
        const totalRegistered = match.registeredPlayerIds?.length || 0;
        const totalDirect = match.directPlayerIds?.length || 0;
        const staffSlots = fixture.staffPlayerCount || 0;
        const occupied = totalRegistered + totalDirect;
        if (occupied >= staffSlots) return false;
        return true;
    };

    if (loading || !match || !fixture) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    const sportColor = getSportColor(fixture.sportType);
    const regStatus = getRegistrationStatus();
    const canRegister = canRegisterToMatch(match, user?.id, fixture);
    const StatusIcon = regStatus.icon;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: sportColor }]}>
                <TouchableOpacity
                    onPress={() => NavigationService.goBack()}
                    style={styles.headerButton}
                    activeOpacity={0.7}
                >
                    <X size={24} color="white" strokeWidth={2} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Maç Kaydı</Text>
                    <Text style={styles.headerSubtitle}>
                        {getSportIcon(fixture.sportType)} {match.title}
                    </Text>
                </View>

                <View style={styles.headerButton} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Status Card */}
                <View style={[styles.statusCard, { backgroundColor: regStatus.color + '20' }]}>
                    <StatusIcon size={24} color={regStatus.color} strokeWidth={2} />
                    <View style={styles.statusContent}>
                        <Text style={styles.statusTitle}>Kayıt Durumu</Text>
                        <Text style={[styles.statusText, { color: regStatus.color }]}>
                            {regStatus.text}
                        </Text>
                    </View>
                </View>

                {/* Current Status */}
                {(isRegistered || isReserve) && (
                    <View style={styles.currentStatusCard}>
                        <UserCheck size={24} color="#16a34a" strokeWidth={2} />
                        <View style={styles.currentStatusContent}>
                            <Text style={styles.currentStatusTitle}>
                                {isReserve ? '✋ Yedek Listesinde' : '✅ Kayıtlısınız'}
                            </Text>
                            <Text style={styles.currentStatusText}>
                                {isReserve
                                    ? 'Kadro oluşturulduğunda bilgilendirileceksiniz'
                                    : 'Maça katılım onaylandı'}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Match Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Maç Bilgileri</Text>

                    <View style={styles.infoCard}>
                        <Calendar size={20} color={sportColor} strokeWidth={2} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Maç Tarihi</Text>
                            <Text style={styles.infoValue}>{formatDateTime(match.matchStartTime)}</Text>
                        </View>
                    </View>

                    {match.location && (
                        <View style={styles.infoCard}>
                            <MapPin size={20} color="#3B82F6" strokeWidth={2} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Lokasyon</Text>
                                <Text style={styles.infoValue}>{match.location}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.infoCard}>
                        <Clock size={20} color="#8B5CF6" strokeWidth={2} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Kayıt Süresi</Text>
                            <Text style={styles.infoValue}>
                                {formatDate(match.registrationTime)} - {formatTime(match.registrationEndTime)}
                            </Text>
                        </View>
                    </View>

                    {match.pricePerPlayer && (
                        <View style={styles.infoCard}>
                            <DollarSign size={20} color="#10B981" strokeWidth={2} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Ücret</Text>
                                <Text style={styles.infoValue}>{match.pricePerPlayer} TL / Kişi</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Quota Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kadro Durumu</Text>

                    <View style={styles.quotaCard}>
                        <View style={styles.quotaRow}>
                            <View style={styles.quotaItem}>
                                <Users size={20} color={sportColor} strokeWidth={2} />
                                <Text style={styles.quotaLabel}>Kadro</Text>
                            </View>
                            <Text style={styles.quotaValue}>
                                {fixture.staffPlayerCount - availableSlots} / {fixture.staffPlayerCount}
                            </Text>
                        </View>

                        <View style={styles.quotaProgress}>
                            <View
                                style={[
                                    styles.quotaProgressBar,
                                    {
                                        width: `${((fixture.staffPlayerCount - availableSlots) / fixture.staffPlayerCount) * 100}%`,
                                        backgroundColor: sportColor
                                    }
                                ]}
                            />
                        </View>

                        {availableSlots > 0 ? (
                            <View style={styles.quotaBadge}>
                                <Check size={14} color="#10B981" strokeWidth={2.5} />
                                <Text style={styles.quotaBadgeText}>
                                    {availableSlots} yer boş
                                </Text>
                            </View>
                        ) : (
                            <View style={[styles.quotaBadge, { backgroundColor: '#FEE2E2' }]}>
                                <X size={14} color="#DC2626" strokeWidth={2.5} />
                                <Text style={[styles.quotaBadgeText, { color: '#DC2626' }]}>
                                    Kadro dolu
                                </Text>
                            </View>
                        )}
                    </View>

                    {fixture.reservePlayerCount > 0 && (
                        <View style={styles.quotaCard}>
                            <View style={styles.quotaRow}>
                                <View style={styles.quotaItem}>
                                    <Users size={20} color="#F59E0B" strokeWidth={2} />
                                    <Text style={styles.quotaLabel}>Yedek</Text>
                                </View>
                                <Text style={styles.quotaValue}>
                                    {fixture.reservePlayerCount - reserveSlots} / {fixture.reservePlayerCount}
                                </Text>
                            </View>

                            <View style={styles.quotaProgress}>
                                <View
                                    style={[
                                        styles.quotaProgressBar,
                                        {
                                            width: `${((fixture.reservePlayerCount - reserveSlots) / fixture.reservePlayerCount) * 100}%`,
                                            backgroundColor: '#F59E0B'
                                        }
                                    ]}
                                />
                            </View>

                            {reserveSlots > 0 && (
                                <View style={[styles.quotaBadge, { backgroundColor: '#FEF3C7' }]}>
                                    <Text style={[styles.quotaBadgeText, { color: '#F59E0B' }]}>
                                        {reserveSlots} yedek kontenjanı
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* Registered Players */}
                {registeredPlayers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Kayıtlı Oyuncular ({registeredPlayers.length})
                        </Text>
                        <View style={styles.playersList}>
                            {registeredPlayers.map((player) => (
                                <View key={player.id} style={styles.playerItem}>
                                    <Text style={styles.playerName}>{player.name}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Info size={20} color="#2563EB" strokeWidth={2} />
                    <View style={styles.infoBoxContent}>
                        <Text style={styles.infoBoxTitle}>Bilgilendirme</Text>
                        <Text style={styles.infoBoxText}>
                            • Kadro dolarsa yedek listesine alınırsınız{'\n'}
                            • Premium oyuncular önceliklidir{'\n'}
                            • Maç başlamadan 24 saat öncesine kadar iptal edebilirsiniz{'\n'}
                            • Kayıt iptal ederseniz sıranızı kaybedersiniz
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                {isRegistered || isReserve ? (
                    <TouchableOpacity
                        style={styles.unregisterButton}
                        onPress={handleUnregister}
                        disabled={registering}
                        activeOpacity={0.7}
                    >
                        {registering ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <UserX size={20} color="white" strokeWidth={2.5} />
                                <Text style={styles.unregisterButtonText}>Kaydı İptal Et</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : canRegister ? (
                    <TouchableOpacity
                        style={[styles.registerButton, { backgroundColor: sportColor }]}
                        onPress={handleRegister}
                        disabled={registering}
                        activeOpacity={0.7}
                    >
                        {registering ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <>
                                <UserCheck size={20} color="white" strokeWidth={2.5} />
                                <Text style={styles.registerButtonText}>
                                    {availableSlots > 0 ? 'Kayıt Ol' : 'Yedek Listesine Kayıt Ol'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.disabledButton}>
                        <AlertCircle size={20} color="#9CA3AF" strokeWidth={2} />
                        <Text style={styles.disabledButtonText}>Kayıt Yapılamıyor</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 40,
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
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    content: {
        flex: 1,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
    },
    statusContent: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 12,
        fontWeight: '500',
        color: '#6B7280',
        marginBottom: 2,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '700',
    },
    currentStatusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#DCFCE7',
        borderWidth: 2,
        borderColor: '#16a34a',
    },
    currentStatusContent: {
        flex: 1,
    },
    currentStatusTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#15803d',
        marginBottom: 4,
    },
    currentStatusText: {
        fontSize: 13,
        color: '#166534',
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    },
    quotaCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    quotaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    quotaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quotaLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    quotaValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    quotaProgress: {
        height: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    quotaProgressBar: {
        height: '100%',
        borderRadius: 4,
    },
    quotaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    quotaBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#10B981',
    },
    playersList: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    playerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    playerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerInitial: {
        fontSize: 14,
        fontWeight: '700',
        color: '#16a34a',
    },
    playerInfo: {
        flex: 1,
    },
    playerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    playerOrder: {
        fontSize: 12,
        color: '#6B7280',
    },
    infoBox: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 20,
    },
    infoBoxContent: {
        flex: 1,
    },
    infoBoxTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 6,
    },
    infoBoxText: {
        fontSize: 12,
        color: '#1E40AF',
        lineHeight: 18,
    },
    bottomSpacing: {
        height: 20,
    },
    bottomActions: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    registerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    unregisterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#DC2626',
        paddingVertical: 16,
        borderRadius: 12,
    },
    unregisterButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: 'white',
    },
    disabledButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#F3F4F6',
        paddingVertical: 16,
        borderRadius: 12,
    },
    disabledButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#9CA3AF',
    },
});