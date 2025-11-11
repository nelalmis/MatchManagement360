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
            toValue: 0.98,
            useNativeDriver: true,
            tension: 150,
            friction: 8,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 8,
        }).start();
    };

    return (
        <ErrorBoundary>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <View
                    style={[
                        styles.card,
                        isPast && styles.cardPast,
                    ]}
                >
                    <TouchableOpacity
                        style={styles.cardContent}
                        onPress={onPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        activeOpacity={1}
                    >
                        {/* Header Row */}
                        <View style={styles.header}>
                            {/* Left: Date Badge */}
                            <View style={[styles.dateBadge, { backgroundColor: matchSportColor + '15' }]}>
                                <Text style={[styles.dateDay, { color: matchSportColor }]}>{dateObj.day}</Text>
                                <Text style={[styles.dateMonth, { color: matchSportColor }]}>KAS</Text>
                            </View>

                            {/* Center: Title & League */}
                            <View style={styles.centerInfo}>
                                <Text style={styles.title} numberOfLines={1}>
                                    {match.title}
                                </Text>
                                
                                {league?.title && !isFriendly && (
                                    <View style={styles.leagueRow}>
                                        <Trophy size={12} color="#8B5CF6" strokeWidth={2.5} />
                                        <Text style={styles.leagueText}>{league.title}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Right: Sport Icon */}
                            <View style={[styles.sportBadge, { backgroundColor: matchSportColor }]}>
                                {matchSportType ? (
                                    <Text style={styles.sportIcon}>{sportThemes[matchSportType].emoji}</Text>
                                ) : (
                                    <Trophy size={18} color="white" strokeWidth={2.5} />
                                )}
                            </View>
                        </View>

                        {/* Score Section - Only for Completed */}
                        {match.status === MatchStatus.COMPLETED && match.score && (
                            <View style={[styles.scoreContainer, { 
                                backgroundColor: resultColor + '08',
                            }]}>
                                <View style={styles.scoreRow}>
                                    <View style={styles.teamScore}>
                                        <Text style={styles.teamLabel}>T1</Text>
                                        <Text style={[styles.scoreText, { color: resultColor }]}>
                                            {match.score.team1}
                                        </Text>
                                    </View>

                                    <View style={styles.scoreDivider}>
                                        {result === 'win' && <CheckCircle2 size={16} color={resultColor} strokeWidth={2.5} />}
                                        {result === 'draw' && <Minus size={16} color={resultColor} strokeWidth={2.5} />}
                                        {result === 'loss' && <XCircle size={16} color={resultColor} strokeWidth={2.5} />}
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
                                    <View style={styles.playerStats}>
                                        {goals > 0 && (
                                            <View style={styles.statBadge}>
                                                <Target size={10} color="#EF4444" strokeWidth={2.5} />
                                                <Text style={styles.statText}>{goals}</Text>
                                            </View>
                                        )}
                                        {assists > 0 && (
                                            <View style={styles.statBadge}>
                                                <Zap size={10} color="#10B981" strokeWidth={2.5} />
                                                <Text style={styles.statText}>{assists}</Text>
                                            </View>
                                        )}
                                        {isMVP && (
                                            <View style={[styles.statBadge, { backgroundColor: '#FEF3C7' }]}>
                                                <Crown size={10} color="#F59E0B" strokeWidth={2.5} />
                                            </View>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Info Row */}
                        <View style={styles.infoRow}>
                            <View style={styles.infoItem}>
                                <Clock size={13} color="#9CA3AF" strokeWidth={2} />
                                <Text style={styles.infoText}>{formatTime(match.schedule.matchStart)}</Text>
                            </View>

                            {match.venue?.location && (
                                <View style={[styles.infoItem, { flex: 1 }]}>
                                    <MapPin size={13} color="#9CA3AF" strokeWidth={2} />
                                    <Text style={styles.infoText} numberOfLines={1}>
                                        {match.venue.location}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Bottom Row */}
                        <View style={styles.bottomRow}>
                            {match.squad && (
                                <View style={styles.playersInfo}>
                                    <Users size={14} color="#6B7280" strokeWidth={2} />
                                    <Text style={styles.playersText}>
                                        {registeredCount}/{match.squad.totalPlayers}
                                    </Text>
                                </View>
                            )}

                            {match.venue?.pricePerPlayer != null && match.venue.pricePerPlayer > 0 && (
                                <View style={styles.priceTag}>
                                    <Text style={styles.priceText}>
                                        {match.venue.pricePerPlayer} TL
                                    </Text>
                                </View>
                            )}

                            {match.status !== MatchStatus.COMPLETED && match.status !== MatchStatus.REGISTRATION_OPEN && (
                                <View style={[styles.statusBadge, { backgroundColor: getMatchStatusColor(match.status) + '15' }]}>
                                    <View style={[styles.statusDot, { backgroundColor: getMatchStatusColor(match.status) }]} />
                                    <Text style={[styles.statusText, { color: getMatchStatusColor(match.status) }]}>
                                        {getMatchStatusText(match.status)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>

                    {/* Action Buttons */}
                    <View style={styles.actionsRow}>
                        {match.status === MatchStatus.REGISTRATION_OPEN && !isPlayerInMatchState && (
                            <TouchableOpacity
                                style={[styles.primaryButton, { backgroundColor: matchSportColor }]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    MatchNavigationService.navigateToMatchRegistration(match.id!);
                                }}
                                activeOpacity={0.8}
                            >
                                <Zap size={16} color="white" strokeWidth={2.5} />
                                <Text style={styles.primaryButtonText}>Hemen Katıl</Text>
                                <ChevronRight size={16} color="white" strokeWidth={2.5} />
                            </TouchableOpacity>
                        )}

                        {match.status === MatchStatus.REGISTRATION_OPEN && !isPlayerInMatchState && (
                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={onPress}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.secondaryButtonText, { color: matchSportColor }]}>Detay</Text>
                                <ChevronRight size={14} color={matchSportColor} strokeWidth={2.5} />
                            </TouchableOpacity>
                        )}

                        {(!match.status || match.status !== MatchStatus.REGISTRATION_OPEN || isPlayerInMatchState) && (
                            <TouchableOpacity
                                style={[styles.detailButton, { borderColor: matchSportColor + '30' }]}
                                onPress={onPress}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.detailButtonText, { color: matchSportColor }]}>Detay</Text>
                                <ChevronRight size={14} color={matchSportColor} strokeWidth={2.5} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Player Indicator */}
                    {isPlayerInMatchState && (
                        <View style={[styles.playerIndicator, { backgroundColor: matchSportColor }]} />
                    )}

                    {/* MVP Badge */}
                    {isMVP && (
                        <View style={styles.mvpBadge}>
                            <Crown size={14} color="#F59E0B" strokeWidth={2.5} />
                        </View>
                    )}
                </View>
            </Animated.View>
        </ErrorBoundary>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        position: 'relative',
        overflow: 'hidden',
    },
    cardPast: {
        opacity: 0.7,
    },
    cardContent: {
        padding: 16,
        gap: 12,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateBadge: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateDay: {
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 22,
    },
    dateMonth: {
        fontSize: 9,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 1,
    },
    centerInfo: {
        flex: 1,
        gap: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        letterSpacing: -0.2,
    },
    leagueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    leagueText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    sportBadge: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sportIcon: {
        fontSize: 20,
    },

    // Score
    scoreContainer: {
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    teamScore: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    teamLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scoreText: {
        fontSize: 28,
        fontWeight: '900',
        lineHeight: 32,
    },
    scoreDivider: {
        paddingHorizontal: 12,
    },
    playerStats: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
    },
    statBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: '#F9FAFB',
    },
    statText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#111827',
    },

    // Info Row
    infoRow: {
        flexDirection: 'row',
        gap: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    infoText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#6B7280',
    },

    // Bottom Row
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    playersInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    playersText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    priceTag: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    priceText: {
        fontSize: 13,
        fontWeight: '800',
        color: '#059669',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    // Actions
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.2,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    detailButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        backgroundColor: 'white',
    },
    detailButtonText: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },

    // Indicators
    playerIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    mvpBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
});