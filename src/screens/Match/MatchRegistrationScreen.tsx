// src/screens/Match/MatchRegistrationScreen.tsx
// 🎯 MODERN MATCH REGISTRATION - League & Friendly Support

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Calendar,
    MapPin,
    Users,
    DollarSign,
    Clock,
    AlertCircle,
    UserCheck,
    UserX,
    Info,
    CreditCard,
    User,
    ArrowRight,
    Sparkles,
    Trophy,
    Globe,
    Lock,
    Check,
    X,
    CheckCircle,
} from 'lucide-react-native';
import { useRoute } from '@react-navigation/native';
import {
    IMatch,
    IFixture,
    ILeague,
    MatchType,
    MatchStatus,
} from '../../types/entity/types';
import { MatchService } from '../../services/serviceLayer/matchService';
import { FixtureService } from '../../services/serviceLayer/fixtureService';
import { LeagueService } from '../../services/serviceLayer/leagueService';
import { eventManager, Events } from '../../utils';
import { useAuth } from '../../hooks';
import { CustomHeader } from '../../components/CustomHeader';
import { sportThemes } from '../../utils/theme';
import { goBack, MatchNavigationService } from '../../navigation';
import { LoadingScreen } from '../Common';

export const MatchRegistrationScreen: React.FC = () => {
    const route: any = useRoute();
    const { user } = useAuth();
    const matchId = route.params?.matchId;

    const [match, setMatch] = useState<IMatch | null>(null);
    const [fixture, setFixture] = useState<IFixture | null>(null);
    const [league, setLeague] = useState<ILeague | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);

    const [isRegistered, setIsRegistered] = useState(false);
    const [isInvited, setIsInvited] = useState(false);

    useEffect(() => {
        loadData();
    }, [matchId]);

    const loadData = useCallback(async () => {
        if (!matchId || !user?.id) {
            Alert.alert('Hata', 'Geçersiz bilgi');
           goBack();
            return;
        }

        console.log('Loading match registration for matchId:', matchId);
        console.log('Current userId:', user.id);
        try {
            setLoading(true);

            // Get match
            const matchResult = await MatchService.getMatch(matchId);
            if (!matchResult.success || !matchResult.data) {
                Alert.alert('Hata', 'Maç bulunamadı');
               goBack();
                return;
            }

            const matchData = matchResult.data;
            setMatch(matchData);

            const isFriendly = matchData.type === MatchType.FRIENDLY;

            // Get fixture & league for League matches
            if (!isFriendly && matchData.fixtureId) {
                const fixtureResult = await FixtureService.getFixture(matchData.fixtureId);
                if (fixtureResult.success && fixtureResult.data) {
                    setFixture(fixtureResult.data);

                    if (matchData.leagueId) {
                        const leagueResult = await LeagueService.getLeague(matchData.leagueId);
                        if (leagueResult.success && leagueResult.data) {
                            setLeague(leagueResult.data);
                        }
                    }
                }
            } else if (isFriendly && matchData.linkedLeagueId) {
                // Friendly match bağlı liga
                const leagueResult = await LeagueService.getLeague(matchData.linkedLeagueId);
                if (leagueResult.success && leagueResult.data) {
                    setLeague(leagueResult.data);
                }
            }

            // Check registration status
            const registered = isPlayerInMatch(matchData, user.id);
            setIsRegistered(registered);

            // Check invitation status (friendly için)
            if (isFriendly && matchData.friendlySettings && !matchData.friendlySettings.isPublic) {
                const invited = matchData.friendlySettings.invitedPlayerIds?.includes(user.id) || false;
                setIsInvited(invited);
            }

        } catch (error) {
            console.error('Error loading match:', error);
            Alert.alert('Hata', 'Maç yüklenirken bir hata oluştu');
           goBack();
        } finally {
            setLoading(false);
        }
    }, [matchId, user?.id]);

    const isPlayerInMatch = (match: IMatch, playerId: string): boolean => {
        // Check registered
        if (match.players.registered?.some(r => r.playerId === playerId)) return true;

        // Check guests
        if (match.players.guests?.includes(playerId)) return true;

        // Check teams
        if (match.players.teams) {
            const inTeam1 = match.players.teams.team1.some(p => p.playerId === playerId);
            const inTeam2 = match.players.teams.team2.some(p => p.playerId === playerId);
            return inTeam1 || inTeam2;
        }

        return false;
    };

    const handleRegister = async () => {
        if (!match || !user?.id) return;

        // Check if registration is open
        if (match.status !== MatchStatus.REGISTRATION_OPEN) {
            Alert.alert('Uyarı', 'Kayıtlar kapalı');
            return;
        }

        // Check registration time
        const now = new Date();
        const registrationEnd = match.schedule.registrationEnd;

        if (registrationEnd && now > new Date(registrationEnd)) {
            Alert.alert('Uyarı', 'Kayıt süresi doldu');
            return;
        }

        // Friendly match için davet kontrolü
        if (isFriendly && match.friendlySettings && !match.friendlySettings.isPublic) {
            if (!isInvited) {
                Alert.alert('Uyarı', 'Bu maça davet edilmediniz');
                return;
            }
        }

        const alertTitle = isFriendly && !match.friendlySettings?.isPublic ? 'Daveti Kabul Et' : 'Kayıt Ol';
        const alertMessage = isFriendly && !match.friendlySettings?.isPublic
            ? `${match.title} maçına katılmak istediğinize emin misiniz?`
            : `${match.title} maçına kayıt olmak istediğinize emin misiniz?`;

        Alert.alert(
            alertTitle,
            alertMessage,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet',
                    onPress: async () => {
                        try {
                            setRegistering(true);
                            const result = await MatchService.registerPlayer(match.id!, user.id);

                            if (result.success) {
                                eventManager.emit(Events.MATCH_REGISTERED, {
                                    matchId: match.id,
                                    timestamp: Date.now()
                                });

                                Alert.alert(
                                    'Başarılı! 🎉',
                                    hasAvailableSlots
                                        ? 'Maça başarıyla kayıt oldunuz!'
                                        : 'Kadro dolu. Bir yer açılırsa bilgilendirileceksiniz.',
                                    [
                                        {
                                            text: 'Tamam',
                                            onPress: () =>goBack()
                                        }
                                    ]
                                );
                            } else {
                                Alert.alert('Hata', result.error?.message || 'Kayıt işlemi başarısız oldu');
                            }
                        } catch (error) {
                            console.error('Registration error:', error);
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
                            const result = await MatchService.unregisterPlayer(match.id!, user.id);

                            if (result.success) {
                                eventManager.emit(Events.MATCH_UNREGISTERED, {
                                    matchId: match.id,
                                    timestamp: Date.now()
                                });

                                Alert.alert('Başarılı', 'Kayıt iptal edildi', [
                                    {
                                        text: 'Tamam',
                                        onPress: () =>goBack()
                                    }
                                ]);
                            } else {
                                Alert.alert('Hata', result.error?.message || 'İptal işlemi başarısız oldu');
                            }
                        } catch (error) {
                            console.error('Unregister error:', error);
                            Alert.alert('Hata', 'İptal sırasında bir hata oluştu');
                        } finally {
                            setRegistering(false);
                        }
                    }
                }
            ]
        );
    };

    const handleGoToMatch = () => {
        if (!match?.id) return;
        MatchNavigationService.navigateToMatchDetail(match.id);
    };

    const formatDateTime = useCallback((date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    const formatDate = useCallback((date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }, []);

    const formatTime = useCallback((date: Date) => {
        return new Date(date).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    // Memoized values
    const isFriendly = useMemo(() =>
        match?.type === MatchType.FRIENDLY,
        [match]
    );

    const sportType = useMemo(() => {
        if (match?.sportType) return match.sportType;
        if (league) return league.sportType;
        return undefined;
    }, [match, league]);

    const sportColor = useMemo(() =>
        sportType ? sportThemes[sportType].primary : '#16a34a',
        [sportType]
    );

    const eligiblePlayers = useMemo(() => {
        if (!match) return { all: [], squad: [], reserve: [] };
        return MatchService.getEligiblePlayers(match);
    }, [match]);

    const registeredCount = useMemo(() => {
        if (!match) return 0;
        return eligiblePlayers.all.length;
    }, [eligiblePlayers, match]);

    const totalSlots = useMemo(() => {
        return (match?.squad?.totalPlayers || 0) + (match?.squad?.reservePlayers || 0);
    }, [match]);

    const hasAvailableSlots = useMemo(() => {
        return registeredCount < totalSlots;
    }, [registeredCount, totalSlots]);

    const availableSlots = useMemo(() => {
        return Math.max(0, totalSlots - registeredCount);
    }, [totalSlots, registeredCount]);

    const getRegistrationStatus = useCallback(() => {
        if (!match) return { color: '#9CA3AF', text: 'Bilinmiyor', icon: AlertCircle };

        if (match.status !== MatchStatus.REGISTRATION_OPEN) {
            return { color: '#DC2626', text: 'Kapandı', icon: X };
        }

        const now = new Date();
        const regEnd = match.schedule.registrationEnd;

        if (regEnd && now > new Date(regEnd)) {
            return { color: '#DC2626', text: 'Süresi Doldu', icon: X };
        }

        return { color: '#10B981', text: 'Açık', icon: Check };
    }, [match]);

    const canUnRegister = useMemo(() => {
        if (!match || !user?.id) return false;
        if (!isRegistered) return false;

        const now = new Date();
        const registrationEnd = match.schedule.registrationEnd;

        if (registrationEnd && now > new Date(registrationEnd)) {
            return false;
        }
        return isRegistered;
    }, [isRegistered, match, user?.id]);

    const canRegister = useMemo(() => {
        if (!match || !user?.id) return false;

        // Already registered
        if (isRegistered) return false;

        // Status check
        if (match.status !== MatchStatus.REGISTRATION_OPEN) return false;

        // Time check
        const now = new Date();
        const regEnd = match.schedule.registrationEnd;
        if (regEnd && now > new Date(regEnd)) return false;

        // Friendly match için özel kontrol
        if (isFriendly && match.friendlySettings) {
            // Public değilse ve davet listesinde değilse kayıt olamaz
            if (!match.friendlySettings.isPublic && !isInvited) return false;
        }

        return true;
    }, [match, user?.id, isRegistered, isFriendly, isInvited]);

    if (loading || !match) {
        return <LoadingScreen loadingText="Yükleniyor..." color={sportColor} />;
    }

    const regStatus = getRegistrationStatus();
    const StatusIcon = regStatus.icon;

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <CustomHeader
                title={isFriendly ? 'Dostluk Maçı' : 'Maç Kaydı'}
                subtitle={match.title}
                sportType={sportType}
                showIcon={!!sportType}
                showBack={true}
                onLeftPress={() =>goBack()}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Match Type Badges */}
                <View style={styles.badgesContainer}>
                    {isFriendly ? (
                        <View style={[styles.typeBadge, { backgroundColor: '#10B981' + '20' }]}>
                            <Sparkles size={16} color="#10B981" strokeWidth={2} />
                            <Text style={[styles.typeBadgeText, { color: '#10B981' }]}>
                                Dostluk Maçı
                            </Text>
                        </View>
                    ) : (
                        <View style={[styles.typeBadge, { backgroundColor: '#3B82F6' + '20' }]}>
                            <Trophy size={16} color="#3B82F6" strokeWidth={2} />
                            <Text style={[styles.typeBadgeText, { color: '#3B82F6' }]}>
                                Lig Maçı
                            </Text>
                        </View>
                    )}

                    {/* Privacy Badge (Friendly) */}
                    {isFriendly && match.friendlySettings && (
                        <View style={[styles.privacyBadge, {
                            backgroundColor: match.friendlySettings.isPublic ? '#10B981' + '15' : '#F59E0B' + '15'
                        }]}>
                            {match.friendlySettings.isPublic ? (
                                <>
                                    <Globe size={12} color="#10B981" strokeWidth={2} />
                                    <Text style={[styles.privacyBadgeText, { color: '#10B981' }]}>Açık</Text>
                                </>
                            ) : (
                                <>
                                    <Lock size={12} color="#F59E0B" strokeWidth={2} />
                                    <Text style={[styles.privacyBadgeText, { color: '#F59E0B' }]}>Özel Davet</Text>
                                </>
                            )}
                        </View>
                    )}
                </View>

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
                {isRegistered && (
                    <View style={styles.currentStatusCard}>
                        <CheckCircle size={24} color="#16a34a" strokeWidth={2} />
                        <View style={styles.currentStatusContent}>
                            <Text style={styles.currentStatusTitle}>
                                ✅ Kayıtlısınız
                            </Text>
                            <Text style={styles.currentStatusText}>
                                Maça katılım onaylandı
                            </Text>
                        </View>
                    </View>
                )}

                {/* Invitation Status (Private Friendly) */}
                {isFriendly && match.friendlySettings && !match.friendlySettings.isPublic && isInvited && !isRegistered && (
                    <View style={styles.invitationCard}>
                        <Sparkles size={24} color="#F59E0B" strokeWidth={2} />
                        <View style={styles.invitationContent}>
                            <Text style={styles.invitationTitle}>
                                🎉 Davet Edildiniz!
                            </Text>
                            <Text style={styles.invitationText}>
                                Bu özel maça davet edildiniz. Hemen katılın!
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
                            <Text style={styles.infoValue}>{formatDateTime(match.schedule.matchStart)}</Text>
                        </View>
                    </View>

                    {match.venue?.location && (
                        <View style={styles.infoCard}>
                            <MapPin size={20} color="#3B82F6" strokeWidth={2} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Lokasyon</Text>
                                <Text style={styles.infoValue}>{match.venue.location}</Text>
                            </View>
                        </View>
                    )}

                    {match.schedule.registrationEnd && (
                        <View style={styles.infoCard}>
                            <Clock size={20} color="#8B5CF6" strokeWidth={2} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Kayıt Bitiş</Text>
                                <Text style={styles.infoValue}>
                                    {formatDate(match.schedule.registrationEnd)} - {formatTime(match.schedule.registrationEnd)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {match.venue?.pricePerPlayer && match.venue.pricePerPlayer > 0 && (
                        <View style={styles.infoCard}>
                            <DollarSign size={20} color="#10B981" strokeWidth={2} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Ücret</Text>
                                <Text style={styles.infoValue}>{match.venue.pricePerPlayer} TL / Kişi</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Payment Info - Friendly Match */}
                {isFriendly && match.venue?.payment && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ödeme Bilgileri</Text>

                        <View style={styles.paymentCard}>
                            {match.venue.payment.accountName && (
                                <View style={styles.paymentRow}>
                                    <User size={18} color="#6B7280" strokeWidth={2} />
                                    <View style={styles.paymentContent}>
                                        <Text style={styles.paymentLabel}>Hesap Sahibi</Text>
                                        <Text style={styles.paymentValue}>
                                            {match.venue.payment.accountName}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {match.venue.payment.iban && (
                                <View style={styles.paymentRow}>
                                    <CreditCard size={18} color="#6B7280" strokeWidth={2} />
                                    <View style={styles.paymentContent}>
                                        <Text style={styles.paymentLabel}>IBAN</Text>
                                        <Text style={styles.paymentValue}>
                                            {match.venue.payment.iban}
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Quota Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Kadro Durumu</Text>

                    <View style={styles.quotaCard}>
                        <View style={styles.quotaRow}>
                            <View style={styles.quotaItem}>
                                <Users size={20} color={sportColor} strokeWidth={2} />
                                <Text style={styles.quotaLabel}>Oyuncu Sayısı</Text>
                            </View>
                            <Text style={styles.quotaValue}>
                                {registeredCount} / {totalSlots}
                            </Text>
                        </View>

                        <View style={styles.quotaProgress}>
                            <View
                                style={[
                                    styles.quotaProgressBar,
                                    {
                                        width: `${totalSlots > 0 ? (registeredCount / totalSlots) * 100 : 0}%`,
                                        backgroundColor: sportColor
                                    }
                                ]}
                            />
                        </View>

                        {hasAvailableSlots ? (
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
                </View>

                {/* Registered Players List */}
                {registeredCount > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Kayıtlı Oyuncular ({registeredCount})
                        </Text>
                        <View style={styles.playersList}>
                            {eligiblePlayers.all?.map((playerId, index) => (
                                <View key={playerId} style={styles.playerItem}>
                                    <View style={styles.playerAvatar}>
                                        <Text style={styles.playerInitial}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <View style={styles.playerInfo}>
                                        <Text style={styles.playerName}>Oyuncu {index + 1}</Text>
                                        <Text style={styles.playerOrder}>#{index + 1} sırada</Text>
                                    </View>
                                    {playerId === user?.id && (
                                        <View style={styles.youBadge}>
                                            <Text style={styles.youBadgeText}>Siz</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Go to Match Button */}
                {isRegistered && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[styles.goToMatchButton, { borderColor: sportColor }]}
                            onPress={handleGoToMatch}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.goToMatchText, { color: sportColor }]}>
                                Maç Detaylarını Gör
                            </Text>
                            <ArrowRight size={20} color={sportColor} strokeWidth={2} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Info Box */}
                <View style={styles.infoBox}>
                    <Info size={20} color="#2563EB" strokeWidth={2} />
                    <View style={styles.infoBoxContent}>
                        <Text style={styles.infoBoxTitle}>Bilgilendirme</Text>
                        <Text style={styles.infoBoxText}>
                            {isFriendly ? (
                                <>
                                    • Dostluk maçları esnek katılım imkanı sunar{'\n'}
                                    • Kayıt olduktan sonra maç detaylarına erişebilirsiniz{'\n'}
                                    {match.venue?.pricePerPlayer && '• Ödeme bilgileri yukarıda belirtilmiştir\n'}
                                    • Kayıt iptal ederseniz sıranızı kaybedersiniz
                                </>
                            ) : (
                                <>
                                    • Kadro dolarsa bekleme listesine alınırsınız{'\n'}
                                    • Maç başlamadan önce kayıt iptal edebilirsiniz{'\n'}
                                    • Kayıt sıranız önemlidir{'\n'}
                                    • Kayıt iptal ederseniz sıranızı kaybedersiniz
                                </>
                            )}
                        </Text>
                    </View>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                {canUnRegister ? (
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
                                    {isFriendly && !match.friendlySettings?.isPublic ? 'Daveti Kabul Et' : 'Kayıt Ol'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.disabledButton}>
                        <AlertCircle size={20} color="#9CA3AF" strokeWidth={2} />
                        <Text style={styles.disabledButtonText}>
                            {isRegistered
                                ? 'Zaten kayıtlısınız'
                                : isFriendly && !match.friendlySettings?.isPublic && !isInvited
                                    ? 'Davet gerekli'
                                    : 'Kayıt yapılamıyor'}
                        </Text>
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
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    badgesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    privacyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 16,
    },
    privacyBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 12,
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
    invitationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FEF3C7',
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    invitationContent: {
        flex: 1,
    },
    invitationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 4,
    },
    invitationText: {
        fontSize: 13,
        color: '#92400E',
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
    paymentCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    paymentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    paymentContent: {
        flex: 1,
    },
    paymentLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        marginBottom: 4,
    },
    paymentValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    quotaCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
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
        fontSize: 16,
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
    youBadge: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    youBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: 'white',
    },
    goToMatchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
    },
    goToMatchText: {
        fontSize: 15,
        fontWeight: '700',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
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