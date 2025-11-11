import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
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
        return new Date(d).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }, []);

    const formatTime = useCallback((date: any) => {
        const d = getDate(date);
        if (!d) return '';
        return new Date(d).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    return (
        <ErrorBoundary>
            <TouchableOpacity
                style={[
                    styles.matchCard,
                    isPast && styles.matchCardPast,
                    isPlayerInMatchState && styles.matchCardPlayer,
                ]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                {/* Header - Match Type & Result */}
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        {/* Match Type Badge */}
                        {isFriendly ? (
                            <View style={styles.friendlyBadge}>
                                <Users size={14} color="#10B981" strokeWidth={2.5} />
                                <Text style={styles.friendlyText}>Dostluk</Text>
                            </View>
                        ) : (
                            <View style={styles.leagueBadge}>
                                <Trophy size={14} color="#3B82F6" strokeWidth={2.5} />
                                <Text style={styles.leagueText}>Lig</Text>
                            </View>
                        )}

                        {/* Privacy Badge */}
                        {isFriendly && match.friendlySettings && (
                            <View style={[styles.smallBadge, {
                                backgroundColor: match.friendlySettings.isPublic ? '#DCFCE7' : '#FEF3C7'
                            }]}>
                                {match.friendlySettings.isPublic ? (
                                    <Globe size={10} color="#15803d" strokeWidth={2} />
                                ) : (
                                    <Lock size={10} color="#B45309" strokeWidth={2} />
                                )}
                            </View>
                        )}
                    </View>

                    {/* Result Badge */}
                    {result && (
                        <View style={[
                            styles.resultBadge,
                            result === 'win' && styles.winBadge,
                            result === 'draw' && styles.drawBadge,
                            result === 'loss' && styles.lossBadge,
                        ]}>
                            {result === 'win' && <CheckCircle2 size={16} color="white" strokeWidth={2.5} />}
                            {result === 'draw' && <Minus size={16} color="white" strokeWidth={2.5} />}
                            {result === 'loss' && <XCircle size={16} color="white" strokeWidth={2.5} />}
                        </View>
                    )}
                </View>

                {/* Match Title Section */}
                <View style={styles.titleSection}>
                    <View style={[styles.sportIcon, { backgroundColor: matchSportColor + '15' }]}>
                        {matchSportType ? (
                            <Text style={styles.sportEmoji}>{sportThemes[matchSportType].emoji}</Text>
                        ) : (
                            <Trophy size={24} color={matchSportColor} strokeWidth={2} />
                        )}
                    </View>

                    <View style={styles.titleContent}>
                        <View style={styles.titleRow}>
                            <Text style={styles.matchTitle} numberOfLines={1}>
                                {match.title}
                            </Text>
                            {isPlayerInMatchState && (
                                <View style={[styles.checkMark, { backgroundColor: matchSportColor }]}>
                                    <Text style={styles.checkText}>✓</Text>
                                </View>
                            )}
                        </View>
                        {league?.title && (
                            <Text style={styles.leagueTitle} numberOfLines={1}>
                                {league.title}
                            </Text>
                        )}
                    </View>
                </View>

                {/* Match Info Grid */}
                <View style={styles.infoGrid}>
                    {/* Date & Time */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Calendar size={16} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.infoText}>{formatDate(match.schedule.matchStart)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Clock size={16} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.infoText}>{formatTime(match.schedule.matchStart)}</Text>
                        </View>
                    </View>

                    {/* Location */}
                    {match.venue?.location && (
                        <View style={styles.infoRow}>
                            <MapPin size={16} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.infoText} numberOfLines={1}>
                                {match.venue.location}
                            </Text>
                        </View>
                    )}

                    {/* Players */}
                    {match.squad && (
                        <View style={styles.infoRow}>
                            <Users size={16} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.infoText}>
                                {registeredCount}/{match.squad.totalPlayers} oyuncu
                            </Text>
                        </View>
                    )}

                    {/* Price */}
                    {match.venue?.pricePerPlayer != null && match.venue.pricePerPlayer > 0 && (
                        <View style={styles.priceRow}>
                            <Text style={styles.priceText}>
                                💰 {match.venue.pricePerPlayer} TL/kişi
                            </Text>
                        </View>
                    )}
                </View>

                {/* Match Score - Completed Matches */}
                {match.status === MatchStatus.COMPLETED && match.score && (
                    <View style={styles.scoreSection}>
                        <View style={styles.scoreBox}>
                            <Text style={styles.scoreLabel}>Takım 1</Text>
                            <Text style={styles.scoreValue}>{match.score.team1}</Text>
                        </View>
                        <View style={styles.scoreVs}>
                            <Text style={styles.vsText}>-</Text>
                        </View>
                        <View style={styles.scoreBox}>
                            <Text style={styles.scoreLabel}>Takım 2</Text>
                            <Text style={styles.scoreValue}>{match.score.team2}</Text>
                        </View>
                    </View>
                )}

                {/* Player Performance */}
                {match.status === MatchStatus.COMPLETED && (goals > 0 || assists > 0 || playerRating || isMVP) && (
                    <View style={styles.performanceSection}>
                        <View style={styles.statsRow}>
                            {goals > 0 && (
                                <View style={styles.statChip}>
                                    <Target size={12} color="#EF4444" strokeWidth={2} />
                                    <Text style={styles.statText}>{goals}</Text>
                                </View>
                            )}
                            {assists > 0 && (
                                <View style={styles.statChip}>
                                    <Users size={12} color="#10B981" strokeWidth={2} />
                                    <Text style={styles.statText}>{assists}</Text>
                                </View>
                            )}
                            {playerRating && (
                                <View style={styles.statChip}>
                                    <Award size={12} color="#F59E0B" strokeWidth={2} />
                                    <Text style={styles.statText}>{playerRating.toFixed(1)} ⭐</Text>
                                </View>
                            )}
                        </View>
                        {isMVP && (
                            <View style={styles.mvpChip}>
                                <Crown size={14} color="#F59E0B" strokeWidth={2.5} />
                                <Text style={styles.mvpLabel}>MVP</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Footer - Status & Action */}
                <View style={styles.cardFooter}>
                    {match.status !== MatchStatus.COMPLETED ? (
                        <View style={[styles.statusChip, { 
                            backgroundColor: getMatchStatusColor(match.status) + '15' 
                        }]}>
                            <View style={[styles.statusDot, { 
                                backgroundColor: getMatchStatusColor(match.status) 
                            }]} />
                            <Text style={[styles.statusLabel, { 
                                color: getMatchStatusColor(match.status) 
                            }]}>
                                {getMatchStatusText(match.status)}
                            </Text>
                        </View>
                    ) : (
                        <View />
                    )}

                    <View style={styles.viewAction}>
                        <Text style={styles.viewText}>Detay</Text>
                        <ChevronRight size={18} color={matchSportColor} strokeWidth={2.5} />
                    </View>
                </View>

                {/* Registration Banner */}
                {match.status === MatchStatus.REGISTRATION_OPEN && !isPlayerInMatchState && (
                    <TouchableOpacity
                        style={styles.registerBanner}
                        onPress={(e) => {
                            e.stopPropagation();
                            MatchNavigationService.navigateToMatchRegistration(match.id!);
                        }}
                        activeOpacity={0.8}
                    >
                        <View style={styles.registerContent}>
                            <Text style={styles.registerText}>Kayıt Aç - Hemen Katıl!</Text>
                            <ChevronRight size={18} color="white" strokeWidth={2.5} />
                        </View>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        </ErrorBoundary>
    );
};

const styles = StyleSheet.create({
    matchCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    matchCardPast: {
        opacity: 0.75,
    },
    matchCardPlayer: {
        borderWidth: 2,
        borderColor: '#16a34a',
        shadowColor: '#16a34a',
        shadowOpacity: 0.15,
    },

    // Header
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    friendlyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    friendlyText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#15803d',
    },
    leagueBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#DBEAFE',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    leagueText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E40AF',
    },
    smallBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultBadge: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    winBadge: {
        backgroundColor: '#10B981',
    },
    drawBadge: {
        backgroundColor: '#F59E0B',
    },
    lossBadge: {
        backgroundColor: '#EF4444',
    },

    // Title Section
    titleSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sportIcon: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sportEmoji: {
        fontSize: 28,
    },
    titleContent: {
        flex: 1,
        gap: 4,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    matchTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        flex: 1,
    },
    checkMark: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
    leagueTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },

    // Info Grid
    infoGrid: {
        gap: 10,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        flex: 1,
    },
    priceRow: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#ECFDF5',
        borderRadius: 10,
    },
    priceText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#059669',
    },

    // Score Section
    scoreSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    scoreBox: {
        flex: 1,
        alignItems: 'center',
        gap: 6,
    },
    scoreLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111827',
    },
    scoreVs: {
        paddingHorizontal: 16,
    },
    vsText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#9CA3AF',
    },

    // Performance Section
    performanceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
    },
    statChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
    },
    mvpChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    mvpLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#B45309',
    },

    // Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    viewAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    viewText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#16a34a',
    },

    // Registration Banner
    registerBanner: {
        marginTop: 12,
        backgroundColor: '#16a34a',
        borderRadius: 12,
        overflow: 'hidden',
    },
    registerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
    },
    registerText: {
        fontSize: 14,
        fontWeight: '700',
        color: 'white',
    },
});