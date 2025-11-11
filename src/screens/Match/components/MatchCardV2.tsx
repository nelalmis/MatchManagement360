import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import {
    Calendar,
    MapPin,
    Users,
    Trophy,
    ChevronRight,
    Globe,
    Lock,
    CheckCircle2,
    Minus,
    XCircle,
    Clock,
    Award,
    Crown,
    Target,
    Zap,
    TrendingUp,
} from 'lucide-react-native';
import {
    IMatch,
    MatchType,
    MatchStatus,
    ILeague,
    IFixture,
} from '../../../types/entity/types';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import { sportThemes } from '../../../utils/theme';
import { MatchNavigationService } from '../../../navigation';
import { getMatchResultBadge, getMatchStatusColor, getMatchStatusText, isPlayerInMatch } from '../../../helper/matchHelper';

interface MatchCardProps {
    match: IMatch;
    league?: ILeague | null;
    fixture?: IFixture | null;
    sportColor: string;
    onPress: () => void;
    playerId: string | null;
}

export const MatchCard: React.FC<MatchCardProps> = ({
    match,
    sportColor,
    onPress,
    playerId,
    league,
}) => {
    const isPast = new Date(match.schedule.matchStart) < new Date() || match.status === MatchStatus.COMPLETED;
    const isFriendly = match.type === MatchType.FRIENDLY;
    const result = match.status === MatchStatus.COMPLETED ? getMatchResultBadge(match, playerId || '') : null;
    const matchSportType = match.sportType || league?.sportType;
    const matchSportColor = matchSportType ? sportThemes[matchSportType].primary : sportColor;

    const playerScorer = match.score?.scorers.find(s => s.playerId === playerId);
    const goals = playerScorer?.goals || 0;
    const assists = playerScorer?.assists || 0;
    const isMVP = match.mvp?.playerId === playerId;
    const playerRating = match.ratingSummary?.details?.topRated.find(
        r => r.playerId === playerId
    )?.averageRating;

    const [isPlayerInMatchState, setIsPlayerInMatchState] = useState<boolean>(false);
    const [scaleAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        const inMatch = isPlayerInMatch(playerId, match);
        setIsPlayerInMatchState(inMatch);
    }, [playerId, match.players]);

    const registeredCount = (match.players.registered?.length || 0) +
        (match.players.guests?.length || 0);

    const getDate = (date: any): Date | null => {
        if (!date) return null;
        if (date && typeof date === 'object' && 'toDate' in date) {
            return date.toDate();
        }
        if (typeof date === 'string') {
            return new Date(date);
        }
        if (typeof date === 'number') {
            return new Date(date);
        }
        return date;
    };

    const formatDate = useCallback((date: any) => {
        const d = getDate(date);
        if (!d) return 'Tarih yok';
        const day = new Date(d).toLocaleDateString('tr-TR', { day: 'numeric' });
        const month = new Date(d).toLocaleDateString('tr-TR', { month: 'short' });
        return { day, month };
    }, []);

    const formatTime = useCallback((date: any) => {
        const d = getDate(date);
        if (!d) return '';
        return new Date(d).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    const dateObj:any = formatDate(match.schedule.matchStart);

    // Result color mapping
    const getResultColor = () => {
        if (result === 'win') return '#10B981';
        if (result === 'draw') return '#F59E0B';
        if (result === 'loss') return '#EF4444';
        return matchSportColor;
    };

    const resultColor = getResultColor();

    // Animation handlers
    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.97,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
        }).start();
    };

    return (
        <ErrorBoundary>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                    style={[
                        styles.card,
                        isPast && styles.cardPast,
                        isPlayerInMatchState && { 
                            borderColor: matchSportColor, 
                            borderWidth: 2.5,
                            shadowColor: matchSportColor,
                            shadowOpacity: 0.25,
                        },
                    ]}
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    activeOpacity={1}
                >
                    {/* Gradient Background Overlay */}
                    <View style={[styles.gradientOverlay, { backgroundColor: matchSportColor }]} />

                    {/* Top Section */}
                    <View style={styles.topSection}>
                        {/* Date Badge */}
                        <View style={[styles.dateBadge, { borderColor: matchSportColor }]}>
                            <Text style={[styles.dateDay, { color: matchSportColor }]}>{dateObj.day}</Text>
                            <Text style={styles.dateMonth}>{dateObj?.month || ''}</Text>
                        </View>

                        {/* Match Info */}
                        <View style={styles.matchInfo}>
                            <View style={styles.titleRow}>
                                <Text style={styles.title} numberOfLines={1}>
                                    {match.title}
                                </Text>
                                {isPlayerInMatchState && (
                                    <View style={[styles.activeDot, { backgroundColor: matchSportColor }]} />
                                )}
                            </View>

                            {league?.title && (
                                <View style={styles.leagueRow}>
                                    {isFriendly ? (
                                        <View style={styles.friendlyTag}>
                                            <Users size={12} color="#10B981" strokeWidth={2.5} />
                                            <Text style={styles.friendlyTagText}>Dostluk</Text>
                                        </View>
                                    ) : (
                                        <View style={styles.leagueTag}>
                                            <Trophy size={12} color="#6366F1" strokeWidth={2.5} />
                                            <Text style={styles.leagueTagText}>{league.title}</Text>
                                        </View>
                                    )}

                                    {isFriendly && match.friendlySettings && (
                                        <View style={styles.privacyIcon}>
                                            {match.friendlySettings.isPublic ? (
                                                <Globe size={12} color="#6B7280" strokeWidth={2} />
                                            ) : (
                                                <Lock size={12} color="#6B7280" strokeWidth={2} />
                                            )}
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Sport Icon */}
                        <View style={[styles.sportBadge, { backgroundColor: matchSportColor }]}>
                            {matchSportType ? (
                                <Text style={styles.sportIcon}>{sportThemes[matchSportType].emoji}</Text>
                            ) : (
                                <Trophy size={20} color="white" strokeWidth={2.5} />
                            )}
                        </View>
                    </View>

                    {/* Score Section - Only for Completed */}
                    {match.status === MatchStatus.COMPLETED && match.score && (
                        <View style={[styles.scoreContainer, { 
                            backgroundColor: resultColor + '10',
                            borderColor: resultColor + '30',
                        }]}>
                            <View style={styles.scoreInner}>
                                <View style={styles.teamScore}>
                                    <Text style={styles.teamLabel}>T1</Text>
                                    <Text style={[styles.scoreText, { color: resultColor }]}>
                                        {match.score.team1}
                                    </Text>
                                </View>

                                <View style={styles.scoreDivider}>
                                    {result === 'win' && <CheckCircle2 size={20} color={resultColor} strokeWidth={2.5} />}
                                    {result === 'draw' && <Minus size={20} color={resultColor} strokeWidth={2.5} />}
                                    {result === 'loss' && <XCircle size={20} color={resultColor} strokeWidth={2.5} />}
                                </View>

                                <View style={styles.teamScore}>
                                    <Text style={styles.teamLabel}>T2</Text>
                                    <Text style={[styles.scoreText, { color: resultColor }]}>
                                        {match.score.team2}
                                    </Text>
                                </View>
                            </View>

                            {/* Player Stats */}
                            {(goals > 0 || assists > 0 || isMVP) && (
                                <View style={styles.playerStatsRow}>
                                    {goals > 0 && (
                                        <View style={[styles.microStat, { borderColor: '#EF4444' }]}>
                                            <Target size={10} color="#EF4444" strokeWidth={2.5} />
                                            <Text style={styles.microStatText}>{goals}</Text>
                                        </View>
                                    )}
                                    {assists > 0 && (
                                        <View style={[styles.microStat, { borderColor: '#10B981' }]}>
                                            <Zap size={10} color="#10B981" strokeWidth={2.5} />
                                            <Text style={styles.microStatText}>{assists}</Text>
                                        </View>
                                    )}
                                    {isMVP && (
                                        <View style={styles.mvpMicro}>
                                            <Crown size={10} color="#F59E0B" strokeWidth={2.5} />
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Match Details */}
                    <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                            <Clock size={14} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.detailText}>{formatTime(match.schedule.matchStart)}</Text>
                        </View>

                        {match.venue?.location && (
                            <View style={styles.detailItem}>
                                <MapPin size={14} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.detailText} numberOfLines={1}>
                                    {match.venue.location}
                                </Text>
                            </View>
                        )}

                        {match.squad && (
                            <View style={styles.detailItem}>
                                <Users size={14} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.detailText}>
                                    {registeredCount}/{match.squad.totalPlayers}
                                </Text>
                            </View>
                        )}

                        {match.venue?.pricePerPlayer != null && match.venue.pricePerPlayer > 0 && (
                            <View style={[styles.detailItem, styles.priceItem]}>
                                <Text style={styles.priceTag}>
                                    {match.venue.pricePerPlayer} TL
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        {match.status !== MatchStatus.COMPLETED ? (
                            <View style={[styles.statusPill, { 
                                backgroundColor: getMatchStatusColor(match.status) + '15',
                                borderColor: getMatchStatusColor(match.status) + '30',
                            }]}>
                                <View style={[styles.pulse, { backgroundColor: getMatchStatusColor(match.status) }]} />
                                <Text style={[styles.statusText, { color: getMatchStatusColor(match.status) }]}>
                                    {getMatchStatusText(match.status)}
                                </Text>
                            </View>
                        ) : (
                            <View />
                        )}

                        <TouchableOpacity 
                            style={[styles.actionButton, { backgroundColor: matchSportColor }]}
                            onPress={onPress}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.actionText}>Detay</Text>
                            <ChevronRight size={16} color="white" strokeWidth={3} />
                        </TouchableOpacity>
                    </View>

                    {/* Registration Banner */}
                    {match.status === MatchStatus.REGISTRATION_OPEN && !isPlayerInMatchState && (
                        <TouchableOpacity
                            style={[styles.regBanner, { backgroundColor: matchSportColor }]}
                            onPress={(e) => {
                                e.stopPropagation();
                                MatchNavigationService.navigateToMatchRegistration(match.id!);
                            }}
                            activeOpacity={0.9}
                        >
                            <Zap size={16} color="white" strokeWidth={2.5} />
                            <Text style={styles.regText}>Hemen Katıl</Text>
                            <ChevronRight size={16} color="white" strokeWidth={3} />
                        </TouchableOpacity>
                    )}

                    {/* MVP Corner Badge */}
                    {isMVP && (
                        <View style={styles.mvpCorner}>
                            <Crown size={16} color="#F59E0B" strokeWidth={2.5} />
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </ErrorBoundary>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
        position: 'relative',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardPast: {
        opacity: 0.75,
    },
    gradientOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        opacity: 0.9,
    },

    // Top Section
    topSection: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        paddingTop: 18,
        gap: 12,
    },
    dateBadge: {
        width: 56,
        height: 56,
        borderRadius: 14,
        borderWidth: 2,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    dateDay: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 26,
    },
    dateMonth: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    matchInfo: {
        flex: 1,
        gap: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        flex: 1,
        letterSpacing: -0.3,
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowColor: 'currentColor',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    leagueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    friendlyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    friendlyTagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669',
    },
    leagueTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E0E7FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    leagueTagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#4F46E5',
    },
    privacyIcon: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sportBadge: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 3,
    },
    sportIcon: {
        fontSize: 24,
    },

    // Score Container
    scoreContainer: {
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 18,
        borderWidth: 2,
        padding: 16,
        gap: 12,
    },
    scoreInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    teamScore: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    teamLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    scoreText: {
        fontSize: 36,
        fontWeight: '900',
        lineHeight: 40,
    },
    scoreDivider: {
        paddingHorizontal: 16,
    },
    playerStatsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    microStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: 'white',
        borderWidth: 1.5,
    },
    microStatText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#111827',
    },
    mvpMicro: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Details Grid
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 10,
        marginBottom: 14,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    detailText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
    },
    priceItem: {
        backgroundColor: '#ECFDF5',
        borderColor: '#D1FAE5',
    },
    priceTag: {
        fontSize: 13,
        fontWeight: '800',
        color: '#059669',
    },

    // Footer
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },
    pulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
        elevation: 3,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.3,
    },

    // Registration Banner
    regBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginBottom: 16,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    regText: {
        fontSize: 15,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },

    // MVP Corner
    mvpCorner: {
        position: 'absolute',
        top: 18,
        right: 16,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 2,
        borderColor: '#FDE68A',
    },
});