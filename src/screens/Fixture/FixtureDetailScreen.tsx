// src/screens/Fixture/FixtureDetailScreen.tsx
// 🎯 MODERN SPORTS APP - Balanced & Informative Design

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
    Platform,
} from 'react-native';
import {
    ArrowLeft,
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
    ChevronRight,
    Copy,
    BarChart3,
    CheckCircle,
    XCircle,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import { FixtureDetailRouteProp, FixtureNavigationService, goBack, MatchNavigationService } from '../../navigation';
import { useAuth } from '../../hooks';
import { IFixture, ILeague, IMatch, MatchStatus } from '../../types/entity/types';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { MatchService } from '../../services/serviceLayer/matchService';
import { PlayerService } from '../../services/serviceLayer/playerService';
import { getSportEmoji, getSportPrimaryColor } from '../../utils/theme';
import * as Clipboard from 'expo-clipboard';
import { getPatternDisplayName } from '../../types/entity/recurringPattern';
import { calculateRegistrationCloseTime, calculateRegistrationOpenTime, getRegistrationStatusColor, getRegistrationStatusText, getRegistrationTimingDescription } from '../../types/entity/registrationScheduleType';
import { CustomHeader } from '../../components/CustomHeader';

export const FixtureDetailScreen: React.FC = () => {
    const route = useRoute<FixtureDetailRouteProp>();
    const { user } = useAuth();
    const fixtureId = route.params.fixtureId;

    // State
    const [fixture, setFixture] = useState<IFixture | null>(null);
    const [league, setLeague] = useState<ILeague | null>(null);
    const [matches, setMatches] = useState<IMatch[]>([]);
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const isOrganizer = fixture?.permissions.organizers.includes(user?.id || '') || false;

    useEffect(() => {
        loadData();
    }, [fixtureId]);

    const loadData = async () => {
        try {
            setLoading(true);

            console.log('Loading fixture data for fixtureId:', fixtureId);

            const [fixtureResponse, matchResponse] = await Promise.all([
                FixtureService.getFixture(fixtureId),
                MatchService.getFixtureMatches(fixtureId),
            ]);

            if (!fixtureResponse.success || !fixtureResponse.data) {
                Alert.alert('Hata', 'Fikstür bulunamadı');
                goBack();
                return;
            }

            setFixture(fixtureResponse.data);

            const leagueResponse = await LeagueService.getLeague(fixtureResponse.data.leagueId);
            if (leagueResponse.success && leagueResponse.data) {
                setLeague(leagueResponse.data);
            }

            if (matchResponse.success && matchResponse.data) {
                setMatches(
                    matchResponse.data.sort(
                        (a, b) =>
                            new Date(b.schedule.matchStart).getTime() -
                            new Date(a.schedule.matchStart).getTime()
                    )
                );
            }

            if (fixtureResponse.data.permissions.organizers.length > 0) {
                const organizersResponse = await PlayerService.getPlayersByIds(
                    fixtureResponse.data.permissions.organizers
                );
                if (organizersResponse.success && organizersResponse.data) {
                    setOrganizers(organizersResponse.data);
                }
            }
        } catch (error) {
            console.error('Error loading fixture:', error);
            Alert.alert('Hata', 'Fikstür yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleEdit = () => {
        if (!fixture) return;
        FixtureNavigationService.navigateToEditFixture(fixtureId);
    };

    const handleToggleStatus = async () => {
        if (!fixture || !user?.id) return;

        const newStatus = fixture.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'aktifleştir' : 'pasifleştir';

        Alert.alert('Fikstür Durumu', `Fikstürü ${action}mek istediğinize emin misiniz?`, [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Evet',
                onPress: async () => {
                    try {
                        await FixtureService.toggleStatus(fixtureId, user.id);
                        setFixture({ ...fixture, status: newStatus });
                        Alert.alert('Başarılı', `Fikstür ${action}ldi`);
                    } catch (error) {
                        Alert.alert('Hata', 'İşlem başarısız oldu');
                    }
                },
            },
        ]);
    };

    const handleCreateMatch = () => {
        if (!fixture) return;
        // NavigationService.navigateToCreateMatch(fixtureId);
    };

    const handleCopyIBAN = async () => {
        if (!fixture?.venue.payment?.iban) return;
        await Clipboard.setStringAsync(fixture.venue.payment.iban);
        Alert.alert('✓ Kopyalandı', 'IBAN panoya kopyalandı');
    };

    const formatTime = (time: string) => time;

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatFullDate = (date: string) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPatternText = () => {
        if (!fixture?.schedule.isRecurring || !fixture.schedule.pattern) return null;
        const pattern = fixture.schedule.pattern;

        switch (pattern.type) {
            case 'weekly':
                return 'Her hafta';
            case 'biweekly':
                return 'İki haftada bir';
            case 'monthly':
                return 'Her ay';
            case 'custom':
                return `${pattern.interval} günde bir`;
            default:
                return null;
        }
    };

    const getMatchStatusColor = (status: MatchStatus) => {
        switch (status) {
            case MatchStatus.REGISTRATION_OPEN:
                return '#10B981';
            case MatchStatus.REGISTRATION_CLOSED:
                return '#F59E0B';
            case MatchStatus.IN_PROGRESS:
                return '#8B5CF6';
            case MatchStatus.COMPLETED:
                return '#16a34a';
            case MatchStatus.CANCELLED:
                return '#EF4444';
            default:
                return '#6B7280';
        }
    };

    const getMatchStatusText = (status: MatchStatus) => {
        switch (status) {
            case MatchStatus.CREATED:
                return 'Oluşturuldu';
            case MatchStatus.REGISTRATION_OPEN:
                return 'Kayıt Açık';
            case MatchStatus.REGISTRATION_CLOSED:
                return 'Kayıt Kapandı';
            case MatchStatus.TEAMS_SET:
                return 'Takımlar Kuruldu';
            case MatchStatus.IN_PROGRESS:
                return 'Oynanıyor';
            case MatchStatus.AWAITING_SCORE:
                return 'Skor Bekleniyor';
            case MatchStatus.COMPLETED:
                return 'Tamamlandı';
            case MatchStatus.CANCELLED:
                return 'İptal';
            default:
                return status;
        }
    };

    if (loading || !fixture || !league) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#16a34a" />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
        );
    }

    const sportColor = getSportPrimaryColor(league.sportType);
    const upcomingMatches = matches.filter(
        (m) =>
            new Date(m.schedule.matchStart) > new Date() && m.status !== MatchStatus.CANCELLED
    );
    const pastMatches = matches.filter(
        (m) =>
            new Date(m.schedule.matchStart) <= new Date() || m.status === MatchStatus.COMPLETED
    );

    return (
        <View style={styles.container}>
            {/* Gradient Header */}
            <CustomHeader
                title={fixture.title}
                subtitle={league.title}
                sportType={league.sportType}
                showBack={true}
                onLeftPress={() => goBack()}
                showEdit={isOrganizer}
                onEditPress={handleEdit}
                showIcon={true}

            />
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[sportColor]} />}
            >
                {/* Status Badge - Modern Version */}
                <View style={styles.statusBadgeContainer}>
                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor: fixture.status === 'active' ? '#10B981' : '#EF4444',
                            },
                        ]}
                    >
                        {fixture.status === 'active' ? (
                            <CheckCircle size={16} color="white" strokeWidth={2.5} />
                        ) : (
                            <XCircle size={16} color="white" strokeWidth={2.5} />
                        )}
                        <Text style={styles.statusText}>
                            {fixture.status === 'active' ? 'Aktif Fikstür' : 'Pasif Fikstür'}
                        </Text>
                    </View>

                    {isOrganizer && (
                        <TouchableOpacity
                            onPress={handleToggleStatus}
                            style={styles.statusSettingsButton}
                            activeOpacity={0.7}
                        >
                            <Settings size={18} color="#6B7280" strokeWidth={2.5} />
                        </TouchableOpacity>
                    )}
                </View>
                {/* Description */}
                {fixture.description && (
                    <View style={styles.card}>
                        <Text style={styles.description}>{fixture.description}</Text>
                    </View>
                )}

                {/* Schedule Card - Combined */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Calendar size={20} color={sportColor} strokeWidth={2.5} />
                        <Text style={styles.cardTitle}>Zamanlama</Text>

                        {/* Registration Status Badge */}
                        {fixture.nextMatchDate && (
                            <View
                                style={[
                                    styles.registrationStatusBadge,
                                    {
                                        backgroundColor: getRegistrationStatusColor(
                                            fixture.schedule.registrationSchedule,
                                            new Date(fixture.nextMatchDate)
                                        ) + '20',
                                        borderColor: getRegistrationStatusColor(
                                            fixture.schedule.registrationSchedule,
                                            new Date(fixture.nextMatchDate)
                                        ),
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.registrationStatusBadgeText,
                                        {
                                            color: getRegistrationStatusColor(
                                                fixture.schedule.registrationSchedule,
                                                new Date(fixture.nextMatchDate)
                                            ),
                                        },
                                    ]}
                                >
                                    {getRegistrationStatusText(
                                        fixture.schedule.registrationSchedule,
                                        new Date(fixture.nextMatchDate)
                                    )}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.cardContent}>
                        {/* Registration Timing */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoLeft}>
                                <Clock size={16} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.infoLabel}>Kayıt Açılışı</Text>
                            </View>
                            <Text style={styles.infoValue}>
                                {getRegistrationTimingDescription(fixture.schedule.registrationSchedule)}
                            </Text>
                        </View>

                        {/* If we have next match date, show calculated times */}
                        {fixture.nextMatchDate && (
                            <>
                                <View style={styles.infoRow}>
                                    <View style={styles.infoLeft}>
                                        <Calendar size={16} color="#6B7280" strokeWidth={2} />
                                        <Text style={styles.infoLabel}>Kayıt Başlar</Text>
                                    </View>
                                    <Text style={styles.infoValue}>
                                        {calculateRegistrationOpenTime(
                                            new Date(fixture.nextMatchDate),
                                            fixture.schedule.registrationSchedule
                                        ).toLocaleString('tr-TR', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <View style={styles.infoLeft}>
                                        <Calendar size={16} color="#6B7280" strokeWidth={2} />
                                        <Text style={styles.infoLabel}>Kayıt Biter</Text>
                                    </View>
                                    <Text style={styles.infoValue}>
                                        {calculateRegistrationCloseTime(
                                            new Date(fixture.nextMatchDate),
                                            fixture.schedule.registrationSchedule
                                        ).toLocaleString('tr-TR', {
                                            day: '2-digit',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </View>
                            </>
                        )}

                        <View style={styles.divider} />

                        {/* Match Timing */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoLeft}>
                                <Clock size={16} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.infoLabel}>Maç Başlangıç</Text>
                            </View>
                            <Text style={styles.infoValue}>{fixture.schedule.matchStartTime}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <View style={styles.infoLeft}>
                                <Clock size={16} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.infoLabel}>Maç Süresi</Text>
                            </View>
                            <Text style={styles.infoValue}>{fixture.schedule.matchDuration} dakika</Text>
                        </View>

                        {/* Recurring Pattern */}
                        {fixture.schedule.isRecurring && fixture.schedule.pattern && (
                            <>
                                <View style={styles.divider} />
                                <View style={[styles.infoRow, styles.recurringRow]}>
                                    <Repeat size={16} color={sportColor} strokeWidth={2} />
                                    <Text style={[styles.infoValue, { color: sportColor, fontWeight: '600' }]}>
                                        {getPatternDisplayName(fixture.schedule.pattern)}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                </View>

                {/* Venue & Squad Card - Combined */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MapPin size={20} color="#3B82F6" strokeWidth={2.5} />
                        <Text style={styles.cardTitle}>Saha & Kadro</Text>
                    </View>

                    <View style={styles.cardContent}>
                        <View style={styles.venueInfo}>
                            <Text style={styles.venueName}>{fixture.venue.location}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Users size={18} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.statValue}>
                                    {fixture.squad.totalPlayers} + {fixture.squad.reservePlayers}
                                </Text>
                                <Text style={styles.statLabel}>Oyuncu + Yedek</Text>
                            </View>

                            <View style={styles.statDivider} />

                            <View style={styles.statItem}>
                                <DollarSign size={18} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.statValue}>{fixture.venue.pricePerPlayer} TL</Text>
                                <Text style={styles.statLabel}>Kişi Başı</Text>
                            </View>

                            <View style={styles.statDivider} />

                            <View style={styles.statItem}>
                                <Clock size={18} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.statValue}>{fixture.schedule.matchDuration}</Text>
                                <Text style={styles.statLabel}>Dakika</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Stats Card - Horizontal */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <BarChart3 size={20} color="#8B5CF6" strokeWidth={2.5} />
                        <Text style={styles.cardTitle}>İstatistikler</Text>
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statBox}>
                            <Trophy size={24} color={sportColor} strokeWidth={2} />
                            <Text style={styles.statBoxValue}>{matches.length}</Text>
                            <Text style={styles.statBoxLabel}>Toplam Maç</Text>
                        </View>

                        <View style={styles.statBox}>
                            <Calendar size={24} color="#3B82F6" strokeWidth={2} />
                            <Text style={styles.statBoxValue}>{upcomingMatches.length}</Text>
                            <Text style={styles.statBoxLabel}>Yaklaşan</Text>
                        </View>

                        <View style={styles.statBox}>
                            <Users size={24} color="#10B981" strokeWidth={2} />
                            <Text style={styles.statBoxValue}>{fixture.squad.totalPlayers}</Text>
                            <Text style={styles.statBoxLabel}>Kadro</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Info */}
                {fixture.venue.payment?.iban && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <DollarSign size={20} color="#10B981" strokeWidth={2.5} />
                            <Text style={styles.cardTitle}>Ödeme Bilgileri</Text>
                        </View>

                        <View style={styles.cardContent}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Hesap Sahibi</Text>
                                <Text style={styles.infoValue}>{fixture.venue.payment.accountName}</Text>
                            </View>

                            <TouchableOpacity onPress={handleCopyIBAN} style={styles.ibanRow} activeOpacity={0.7}>
                                <View style={styles.ibanLeft}>
                                    <Text style={styles.infoLabel}>IBAN</Text>
                                    <Text style={styles.ibanValue}>{fixture.venue.payment.iban}</Text>
                                </View>
                                <View style={styles.copyButton}>
                                    <Copy size={14} color="white" strokeWidth={2.5} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Organizers */}
                {organizers.length > 0 && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Users size={20} color="#F59E0B" strokeWidth={2.5} />
                            <Text style={styles.cardTitle}>Organizatörler</Text>
                        </View>

                        <View style={styles.cardContent}>
                            {organizers.map((organizer, index) => (
                                <View key={organizer.id}>
                                    <View style={styles.organizerRow}>
                                        <View style={[styles.organizerAvatar, { backgroundColor: sportColor + '20' }]}>
                                            <Text style={[styles.organizerInitial, { color: sportColor }]}>
                                                {organizer.name?.[0]}
                                                {organizer.surname?.[0]}
                                            </Text>
                                        </View>
                                        <View style={styles.organizerInfo}>
                                            <Text style={styles.organizerName}>
                                                {organizer.name} {organizer.surname}
                                            </Text>
                                            <Text style={styles.organizerPhone}>{organizer.phone}</Text>
                                        </View>
                                    </View>
                                    {index < organizers.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Upcoming Matches */}
                {upcomingMatches.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Yaklaşan Maçlar ({upcomingMatches.length})</Text>
                            {upcomingMatches.length > 3 && (
                                <TouchableOpacity onPress={() => MatchNavigationService.navigateToMatchList({ fixtureId })} activeOpacity={0.7}>
                                    <Text style={[styles.seeAllText, { color: sportColor }]}>Tümü</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {upcomingMatches.slice(0, 3).map((match) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                onPress={() => MatchNavigationService.navigateToMatchDetail(match.id)}
                                formatDateTime={formatDateTime}
                                getStatusColor={getMatchStatusColor}
                                getStatusText={getMatchStatusText}
                            />
                        ))}
                    </View>
                )}

                {/* Past Matches */}
                {pastMatches.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Geçmiş Maçlar ({pastMatches.length})</Text>
                            {pastMatches.length > 3 && (
                                <TouchableOpacity onPress={() => MatchNavigationService.navigateToMatchList({ fixtureId })} activeOpacity={0.7}>
                                    <Text style={[styles.seeAllText, { color: sportColor }]}>Tümü</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {pastMatches.slice(0, 3).map((match) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                onPress={() => MatchNavigationService.navigateToMatchDetail(match.id)}
                                formatDateTime={formatDateTime}
                                getStatusColor={getMatchStatusColor}
                                getStatusText={getMatchStatusText}
                                isPast
                            />
                        ))}
                    </View>
                )}

                {/* Empty State */}
                {matches.length === 0 && (
                    <View style={styles.emptyState}>
                        <Calendar size={64} color="#D1D5DB" strokeWidth={2} />
                        <Text style={styles.emptyTitle}>Henüz maç yok</Text>
                        <Text style={styles.emptyDescription}>
                            {isOrganizer ? 'İlk maçı oluşturmak için aşağıdaki butona tıklayın' : 'Organizatör henüz maç oluşturmadı'}
                        </Text>
                    </View>
                )}

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Bottom Action Bar */}
            {/* {isOrganizer && fixture.status === 'active' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            onPress={handleCreateMatch}
            style={[styles.actionButton, styles.primaryButton, { backgroundColor: sportColor }]}
            activeOpacity={0.8}
          >
            <Plus size={20} color="white" strokeWidth={2.5} />
            <Text style={styles.primaryButtonText}>Yeni Maç</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}} style={[styles.actionButton, styles.secondaryButton]} activeOpacity={0.8}>
            <BarChart3 size={20} color="#6B7280" strokeWidth={2.5} />
            <Text style={styles.secondaryButtonText}>İstatistikler</Text>
          </TouchableOpacity>
        </View>
      )} */}
        </View>
    );
};

// ============================================
// MATCH CARD COMPONENT
// ============================================

interface MatchCardProps {
    match: IMatch;
    onPress: () => void;
    formatDateTime: (date: Date) => string;
    getStatusColor: (status: MatchStatus) => string;
    getStatusText: (status: MatchStatus) => string;
    isPast?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
    match,
    onPress,
    formatDateTime,
    getStatusColor,
    getStatusText,
    isPast = false,
}) => {
    const statusColor = getStatusColor(match.status);

    return (
        <TouchableOpacity style={[styles.matchCard, isPast && styles.matchCardPast]} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.matchHeader}>
                <View style={styles.matchDateRow}>
                    <Calendar size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.matchDate}>{formatDateTime(match.schedule.matchStart)}</Text>
                </View>
                <View style={[styles.matchStatusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.matchStatusText, { color: statusColor }]}>{getStatusText(match.status)}</Text>
                </View>
            </View>

            <View style={styles.matchBody}>
                <Users size={14} color="#6B7280" strokeWidth={2} />
                <Text style={styles.matchInfo}>
                    {match.players.registered?.length || 0} / {match.squad.totalPlayers} kayıtlı
                </Text>
            </View>

            <ChevronRight size={18} color="#D1D5DB" strokeWidth={2} style={styles.matchChevron} />
        </TouchableOpacity>
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
        fontWeight: '600',
    },

    // Header
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        alignItems: 'center',
    },
    headerEmoji: {
        fontSize: 48,
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 16,
    },
    statusBadgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    statusBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.3,
    },
    statusButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusSettingsButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    registrationStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        marginLeft: 'auto',
    },
    registrationStatusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 12,
    },


    // Content
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },

    // Card
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    cardContent: {
        gap: 12,
    },

    // Description
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },

    // Info Row
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    infoValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '700',
    },
    recurringRow: {
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 4,
        gap: 8,
    },

    // Venue
    venueInfo: {
        paddingVertical: 4,
    },
    venueName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
    },


    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        paddingTop: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    statDivider: {
        width: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 8,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
        textAlign: 'center',
    },

    // Stats Container (Horizontal boxes)
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
    },
    statBoxValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 8,
    },
    statBoxLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 4,
    },

    // IBAN
    ibanRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    ibanLeft: {
        flex: 1,
    },
    ibanValue: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#10B981',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Organizer
    organizerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    organizerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    organizerInitial: {
        fontSize: 14,
        fontWeight: '700',
    },
    organizerInfo: {
        flex: 1,
    },
    organizerName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    organizerPhone: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },

    // Section
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '700',
    },

    // Match Card
    matchCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        position: 'relative',
    },
    matchCardPast: {
        opacity: 0.6,
    },
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    matchDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchDate: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    matchStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    matchStatusText: {
        fontSize: 10,
        fontWeight: '700',
    },
    matchBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    matchInfo: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    matchChevron: {
        position: 'absolute',
        right: 16,
        top: '50%',
        marginTop: -9,
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Bottom Action Bar
    bottomBar: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    primaryButton: {
        flex: 2,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: 'white',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },

    bottomSpacing: {
        height: 20,
    },
});