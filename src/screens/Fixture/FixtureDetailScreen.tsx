import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import {
    ChevronLeft,
    Edit,
    MapPin,
    Calendar,
    Clock,
    Users,
    DollarSign,
    Plus,
    Repeat,
    Trophy,
    Settings,
    AlertCircle,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { useNavigationContext } from '../../context/NavigationContext';
import {
    IMatchFixture,
    IMatch,
    ILeague,
    IPlayer,
    getSportIcon,
    getSportColor,
} from '../../types/types';
import { matchFixtureService } from '../../services/matchFixtureService';
import { matchService } from '../../services/matchService';
import { leagueService } from '../../services/leagueService';
import { playerService } from '../../services/playerService';

export const FixtureDetailScreen: React.FC = () => {
    const route: any = useRoute();
    const { user } = useAppContext();
    const navigation = useNavigationContext();
    const fixtureId = route.params?.fixtureId;

    const [fixture, setFixture] = useState<IMatchFixture | null>(null);
    const [league, setLeague] = useState<ILeague | null>(null);
    const [matches, setMatches] = useState<IMatch[]>([]);
    const [organizers, setOrganizers] = useState<IPlayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, [fixtureId, route.params?._refresh]);

    const loadData = async () => {
        if (!fixtureId) {
            Alert.alert('Hata', 'Fikstür ID bulunamadı');
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);

            const [fixtureData, matchesData] = await Promise.all([
                matchFixtureService.getById(fixtureId),
                matchService.getMatchesByFixture(fixtureId),
            ]);

            if (!fixtureData) {
                Alert.alert('Hata', 'Fikstür bulunamadı');
                navigation.goBack();
                return;
            }

            setFixture(fixtureData);
            setMatches(matchesData.sort((a, b) =>
                new Date(b.matchStartTime).getTime() - new Date(a.matchStartTime).getTime()
            ));

            // Load league
            const leagueData = await leagueService.getById(fixtureData.leagueId);
            setLeague(leagueData);

            // Load organizers
            if (fixtureData.organizerPlayerIds.length > 0) {
                const organizersData = await playerService.getPlayersByIds(fixtureData.organizerPlayerIds);
                setOrganizers(organizersData);
            }
        } catch (error) {
            console.error('Error loading fixture:', error);
            Alert.alert('Hata', 'Fikstür yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const isOrganizer = () => {
        if (!fixture || !user?.id) return false;
        return fixture.organizerPlayerIds.includes(user.id);
    };

    const handleCreateMatch = () => {
        if (!fixture) return;
        navigation.navigate('createMatch', { fixtureId: fixture.id });
    };

    const handleEditFixture = () => {
        if (!fixture) return;
        navigation.navigate('editFixture', { fixtureId: fixture.id });
    };

    const handleToggleStatus = async () => {
        if (!fixture) return;

        const newStatus = fixture.status === 'Aktif' ? 'Pasif' : 'Aktif';
        const action = newStatus === 'Aktif' ? 'aktifleştir' : 'pasifleştir';

        Alert.alert(
            'Fikstür Durumu',
            `Fikstürü ${action}mek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet',
                    onPress: async () => {
                        try {
                            await matchFixtureService.update(fixture.id, { status: newStatus });
                            setFixture({ ...fixture, status: newStatus });
                            Alert.alert('Başarılı', `Fikstür ${action}ldi`);
                        } catch (error) {
                            Alert.alert('Hata', 'İşlem başarısız oldu');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMatchStatusColor = (status: IMatch['status']) => {
        switch (status) {
            case 'Oluşturuldu': return '#9CA3AF';
            case 'Kayıt Açık': return '#10B981';
            case 'Kayıt Kapandı': return '#F59E0B';
            case 'Takımlar Oluşturuldu': return '#2563EB';
            case 'Oynanıyor': return '#8B5CF6';
            case 'Skor Bekleniyor': return '#F59E0B';
            case 'Tamamlandı': return '#16a34a';
            case 'İptal Edildi': return '#DC2626';
            default: return '#6B7280';
        }
    };

    if (loading || !fixture || !league) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>Fikstür yükleniyor...</Text>
            </View>
        );
    }

    const upcomingMatches = matches.filter(m =>
        new Date(m.matchStartTime) > new Date() && m.status !== 'İptal Edildi'
    );
    const pastMatches = matches.filter(m =>
        new Date(m.matchStartTime) <= new Date() || m.status === 'Tamamlandı'
    );
    const sportColor = getSportColor(fixture.sportType);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: sportColor }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.headerButton}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color="white" strokeWidth={2} />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{fixture.title}</Text>
                    <Text style={styles.headerSubtitle}>
                        {getSportIcon(fixture.sportType)} {league.title}
                    </Text>
                </View>

                {isOrganizer() && (
                    <TouchableOpacity
                        onPress={handleEditFixture}
                        style={styles.headerButton}
                        activeOpacity={0.7}
                    >
                        <Edit size={22} color="white" strokeWidth={2} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Status Banner */}
                <View style={[
                    styles.statusBanner,
                    { backgroundColor: fixture.status === 'Aktif' ? '#DCFCE7' : '#FEE2E2' }
                ]}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: fixture.status === 'Aktif' ? '#16a34a' : '#DC2626' }
                    ]} />
                    <Text style={[
                        styles.statusText,
                        { color: fixture.status === 'Aktif' ? '#15803d' : '#991b1b' }
                    ]}>
                        {fixture.status === 'Aktif' ? 'Aktif Fikstür' : 'Pasif Fikstür'}
                    </Text>
                    {isOrganizer() && (
                        <TouchableOpacity
                            onPress={handleToggleStatus}
                            style={styles.statusToggle}
                            activeOpacity={0.7}
                        >
                            <Settings size={16} color={fixture.status === 'Aktif' ? '#15803d' : '#991b1b'} strokeWidth={2} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Info Cards */}
                <View style={styles.section}>
                    {/* Location */}
                    <View style={styles.infoCard}>
                        <View style={[styles.iconContainer, { backgroundColor: sportColor + '20' }]}>
                            <MapPin size={20} color={sportColor} strokeWidth={2} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Lokasyon</Text>
                            <Text style={styles.infoValue}>{fixture.location}</Text>
                        </View>
                    </View>

                    {/* Schedule */}
                    <View style={styles.infoCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
                            <Calendar size={20} color="#3B82F6" strokeWidth={2} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Maç Zamanı</Text>
                            <Text style={styles.infoValue}>{formatDateTime(fixture.matchStartTime)}</Text>
                        </View>
                    </View>

                    {/* Duration */}
                    <View style={styles.infoCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#8B5CF620' }]}>
                            <Clock size={20} color="#8B5CF6" strokeWidth={2} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Süre</Text>
                            <Text style={styles.infoValue}>{fixture.matchTotalTimeInMinute} dakika</Text>
                        </View>
                    </View>

                    {/* Squad */}
                    <View style={styles.infoCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#F59E0B20' }]}>
                            <Users size={20} color="#F59E0B" strokeWidth={2} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Kadro</Text>
                            <Text style={styles.infoValue}>
                                {fixture.staffPlayerCount} + {fixture.reservePlayerCount} yedek
                            </Text>
                        </View>
                    </View>

                    {/* Price */}
                    <View style={styles.infoCard}>
                        <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                            <DollarSign size={20} color="#10B981" strokeWidth={2} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Ücret</Text>
                            <Text style={styles.infoValue}>{fixture.pricePerPlayer} TL</Text>
                        </View>
                    </View>

                    {/* Periodic */}
                    {fixture.isPeriodic && (
                        <View style={styles.infoCard}>
                            <View style={[styles.iconContainer, { backgroundColor: '#EC489920' }]}>
                                <Repeat size={20} color="#EC4899" strokeWidth={2} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Periyot</Text>
                                <Text style={styles.infoValue}>
                                    Her {fixture.periodDayCount} günde bir
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Organizers */}
                {organizers.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Organizatörler</Text>
                        <View style={styles.card}>
                            {organizers.map((organizer, index) => (
                                <View key={organizer.id} style={[
                                    styles.organizerItem,
                                    index !== organizers.length - 1 && styles.organizerItemBorder
                                ]}>
                                    <View style={styles.organizerAvatar}>
                                        <Text style={styles.organizerInitial}>
                                            {organizer.name?.[0]}{organizer.surname?.[0]}
                                        </Text>
                                    </View>
                                    <View style={styles.organizerInfo}>
                                        <Text style={styles.organizerName}>
                                            {organizer.name} {organizer.surname}
                                        </Text>
                                        <Text style={styles.organizerPhone}>{organizer.phone}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Payment Info */}
                {fixture.peterFullName && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>
                        <View style={styles.card}>
                            <View style={styles.paymentRow}>
                                <Text style={styles.paymentLabel}>Alıcı</Text>
                                <Text style={styles.paymentValue}>{fixture.peterFullName}</Text>
                            </View>
                            {fixture.peterIban && (
                                <View style={styles.paymentRow}>
                                    <Text style={styles.paymentLabel}>IBAN</Text>
                                    <Text style={styles.paymentValue}>{fixture.peterIban}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Stats */}
                <View style={styles.section}>
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Trophy size={24} color={sportColor} strokeWidth={2} />
                            <Text style={styles.statValue}>{matches.length}</Text>
                            <Text style={styles.statLabel}>Toplam Maç</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Calendar size={24} color="#3B82F6" strokeWidth={2} />
                            <Text style={styles.statValue}>{upcomingMatches.length}</Text>
                            <Text style={styles.statLabel}>Yaklaşan</Text>
                        </View>

                        <View style={styles.statCard}>
                            <Users size={24} color="#10B981" strokeWidth={2} />
                            <Text style={styles.statValue}>{fixture.staffPlayerCount}</Text>
                            <Text style={styles.statLabel}>Kadro</Text>
                        </View>
                    </View>
                </View>

                {/* Upcoming Matches */}
                {upcomingMatches.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Yaklaşan Maçlar ({upcomingMatches.length})</Text>
                        {upcomingMatches.map(match => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                onPress={() => navigation.navigate('matchDetail', { matchId: match.id })}
                                getMatchStatusColor={getMatchStatusColor}
                                formatDateTime={formatDateTime}
                            />
                        ))}
                    </View>
                )}

                {/* Past Matches */}
                {pastMatches.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Geçmiş Maçlar ({pastMatches.length})</Text>
                        {pastMatches.slice(0, 5).map(match => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                onPress={() => navigation.navigate('matchDetail', { matchId: match.id })}
                                getMatchStatusColor={getMatchStatusColor}
                                formatDateTime={formatDateTime}
                                isPast
                            />
                        ))}
                        {pastMatches.length > 5 && (
                            <TouchableOpacity
                                style={styles.showMoreButton}
                                onPress={() => navigation.navigate('matchList', { fixtureId: fixture.id })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.showMoreText}>
                                    Tüm Maçları Gör ({matches.length} maç)
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Empty State */}
                {matches.length === 0 && (
                    <View style={styles.emptyState}>
                        <Calendar size={64} color="#D1D5DB" strokeWidth={1.5} />
                        <Text style={styles.emptyStateTitle}>Henüz maç yok</Text>
                        <Text style={styles.emptyStateText}>
                            {isOrganizer()
                                ? 'İlk maçı oluşturmak için aşağıdaki butona tıklayın'
                                : 'Organizatör henüz maç oluşturmadı'}
                        </Text>
                    </View>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Create Match FAB */}
            {isOrganizer() && fixture.status === 'Aktif' && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: sportColor }]}
                    onPress={handleCreateMatch}
                    activeOpacity={0.8}
                >
                    <Plus size={28} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
            )}
        </View>
    );
};

// Match Card Component
interface MatchCardProps {
    match: IMatch;
    onPress: () => void;
    getMatchStatusColor: (status: IMatch['status']) => string;
    formatDateTime: (date: Date) => string;
    isPast?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
    match,
    onPress,
    getMatchStatusColor,
    formatDateTime,
    isPast = false,
}) => {
    const statusColor = getMatchStatusColor(match.status);

    return (
        <TouchableOpacity
            style={[styles.matchCard, isPast && styles.matchCardPast]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.matchCardHeader}>
                <View style={styles.matchCardLeft}>
                    <Calendar size={18} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.matchCardDate}>{formatDateTime(match.matchStartTime)}</Text>
                </View>
                <View style={[styles.matchStatusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.matchStatusText, { color: statusColor }]}>
                        {match.status}
                    </Text>
                </View>
            </View>

            <Text style={styles.matchCardTitle}>{match.title}</Text>

            <View style={styles.matchCardFooter}>
                <View style={styles.matchCardInfo}>
                    <Users size={16} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.matchCardInfoText}>
                        {(match.registeredPlayerIds?.length || 0)} kayıtlı
                    </Text>
                </View>

                {match.score && (
                    <View style={styles.matchScore}>
                        <Text style={styles.matchScoreText}>{match.score}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
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
        paddingTop: 12,
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
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    statusToggle: {
        padding: 4,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 20,
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
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 15,
        color: '#1F2937',
        fontWeight: '600',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    organizerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    organizerItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    organizerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    organizerInitial: {
        fontSize: 16,
        fontWeight: '700',
        color: '#16a34a',
    },
    organizerInfo: {
        flex: 1,
    },
    organizerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    organizerPhone: {
        fontSize: 13,
        color: '#6B7280',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    paymentLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    paymentValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginTop: 4,
    },
    matchCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    matchCardPast: {
        opacity: 0.7,
    },
    matchCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    matchCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchCardDate: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    matchStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    matchStatusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    matchCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    matchCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    matchCardInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchCardInfoText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    matchScore: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
    },
    matchScoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
    },
    showMoreButton: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 4,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    showMoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#6B7280',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    bottomSpacing: {
        height: 80,
    },
    fab: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});