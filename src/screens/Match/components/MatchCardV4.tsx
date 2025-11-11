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
    viewMode?: 'list' | 'compact';
}

export const MatchCard: React.FC<MatchCardProps> = ({
    match,
    sportColor,
    onPress,
    playerId,
    league,
    viewMode = 'list',
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

    const formatDate = useCallback((date: Date) => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }, []);

    const formatTime = useCallback((date: Date) => {
        return new Date(date).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    // Result color mapping
    const getResultColor = () => {
        if (result === 'win') return '#10B981';
        if (result === 'draw') return '#F59E0B';
        if (result === 'loss') return '#EF4444';
        return matchSportColor;
    };

    const resultColor = getResultColor();

    // Compact View
    if (viewMode === 'compact') {
        return (
            <TouchableOpacity
                style={[styles.compactCard, isPast && styles.compactCardPast]}
                onPress={() => onPress ? onPress() : MatchNavigationService.navigateToMatchRegistration(match.id!)}
                activeOpacity={0.7}
            >
                <View style={styles.compactLeft}>
                    {matchSportType && (
                        <View style={[styles.compactSportIcon, { backgroundColor: matchSportColor + '15' }]}>
                            <Text style={styles.compactSportEmoji}>{sportThemes[matchSportType].emoji}</Text>
                        </View>
                    )}
                    <View style={styles.compactInfo}>
                        <View style={styles.compactTitleRow}>
                            <Text style={styles.compactTitle} numberOfLines={1}>{match.title}</Text>
                            {isFriendly && (
                                <View style={styles.compactFriendlyBadge}>
                                    <Users size={10} color="#10B981" strokeWidth={2} />
                                </View>
                            )}
                        </View>
                        <Text style={styles.compactDate}>{formatDate(match.schedule.matchStart)}</Text>
                    </View>
                </View>
                <View style={styles.compactRight}>
                    {result && (
                        <View
                            style={[
                                styles.compactResultBadge,
                                result === 'win' && styles.resultBadgeWin,
                                result === 'draw' && styles.resultBadgeDraw,
                                result === 'loss' && styles.resultBadgeLoss,
                            ]}
                        >
                            <Text style={styles.compactResultText}>
                                {result === 'win' ? 'G' : result === 'draw' ? 'B' : 'M'}
                            </Text>
                        </View>
                    )}
                    <ChevronRight size={16} color="#9CA3AF" strokeWidth={2} />
                </View>
            </TouchableOpacity>
        );
    }

    // List View
    return (
        <TouchableOpacity
            style={[styles.matchCard, isPast && styles.matchCardPast]}
            onPress={() => onPress ? onPress() : MatchNavigationService.navigateToMatchRegistration(match.id!)}
            activeOpacity={0.7}
        >
            <View style={styles.matchTypeHeaderBadge}>
                {isFriendly ? (
                    <View style={[styles.matchTypeBadge, { backgroundColor: '#10B981' + '20' }]}>
                        <Users size={12} color="#10B981" strokeWidth={2} />
                        <Text style={[styles.matchTypeBadgeText, { color: '#10B981' }]}>Dostluk</Text>
                    </View>
                ) : (
                    <View style={[styles.matchTypeBadge, { backgroundColor: '#3B82F6' + '20' }]}>
                        <Trophy size={12} color="#3B82F6" strokeWidth={2} />
                        <Text style={[styles.matchTypeBadgeText, { color: '#3B82F6' }]}>Lig</Text>
                    </View>
                )}

                {result && (
                    <View
                        style={[
                            styles.resultBadge,
                            result === 'win' && styles.resultBadgeWin,
                            result === 'draw' && styles.resultBadgeDraw,
                            result === 'loss' && styles.resultBadgeLoss,
                        ]}
                    >
                        {result === 'win' && <CheckCircle2 size={14} color="white" strokeWidth={2.5} />}
                        {result === 'draw' && <Minus size={14} color="white" strokeWidth={2.5} />}
                        {result === 'loss' && <XCircle size={14} color="white" strokeWidth={2.5} />}
                        <Text style={styles.resultBadgeText}>
                            {result === 'win' ? 'G' : result === 'draw' ? 'B' : 'M'}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.matchHeader}>
                <View style={styles.matchHeaderLeft}>
                    {matchSportType && (
                        <View style={[
                            styles.sportIconContainer,
                            { backgroundColor: matchSportColor + '15' }
                        ]}>
                            <Text style={styles.matchSportEmoji}>{sportThemes[matchSportType].emoji}</Text>
                        </View>
                    )}
                    <View style={styles.matchHeaderInfo}>
                        <Text style={styles.matchTitle} numberOfLines={1}>{match.title}</Text>
                        <Text style={styles.matchLeague} numberOfLines={1}>
                            {league?.title || (isFriendly ? 'Dostluk Maçı' : 'Lig bilgisi yok')}
                        </Text>
                    </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </View>

            <View style={styles.matchInfo}>
                <View style={styles.matchInfoItem}>
                    <Calendar size={14} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.matchInfoText}>{formatDate(match.schedule.matchStart)}</Text>
                    <View style={styles.infoSeparator} />
                    <Clock size={14} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.matchInfoText}>{formatTime(match.schedule.matchStart)}</Text>
                </View>
                {match.venue?.location && (
                    <View style={styles.matchInfoItem}>
                        <MapPin size={14} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.matchInfoText} numberOfLines={1}>{match.venue.location}</Text>
                    </View>
                )}
            </View>

            {match.status === MatchStatus.COMPLETED && match.score && (
                <View style={styles.matchScore}>
                    <View style={styles.scoreTeam}>
                        <Text style={styles.scoreLabel}>Takım 1</Text>
                        <Text style={styles.scoreValue}>{match.score.team1}</Text>
                    </View>
                    <View style={styles.scoreDivider}>
                        <Text style={styles.scoreDividerText}>vs</Text>
                    </View>
                    <View style={styles.scoreTeam}>
                        <Text style={styles.scoreLabel}>Takım 2</Text>
                        <Text style={styles.scoreValue}>{match.score.team2}</Text>
                    </View>
                </View>
            )}

            {/* Player Performance */}
            {match.status === MatchStatus.COMPLETED && (goals > 0 || assists > 0 || playerRating || isMVP) && (
                <View style={styles.playerPerformance}>
                    <View style={styles.performanceStats}>
                        {goals > 0 && (
                            <View style={styles.performanceBadge}>
                                <Target size={12} color="#EF4444" strokeWidth={2} />
                                <Text style={styles.performanceText}>{goals} Gol</Text>
                            </View>
                        )}

                        {assists > 0 && (
                            <View style={styles.performanceBadge}>
                                <Users size={12} color="#10B981" strokeWidth={2} />
                                <Text style={styles.performanceText}>{assists} Asist</Text>
                            </View>
                        )}

                        {playerRating && (
                            <View style={styles.performanceBadge}>
                                <Award size={12} color="#F59E0B" strokeWidth={2} />
                                <Text style={styles.performanceText}>
                                    {playerRating.toFixed(1)} ⭐
                                </Text>
                            </View>
                        )}
                    </View>

                    {isMVP && (
                        <View style={styles.mvpBadge}>
                            <Crown size={14} color="#F59E0B" strokeWidth={2.5} />
                            <Text style={styles.mvpText}>MVP</Text>
                        </View>
                    )}
                </View>
            )}

            {match.status !== MatchStatus.COMPLETED && (
                <View style={styles.matchStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: getMatchStatusColor(match.status) + '15' }]}>
                        <View style={[styles.statusDot, { backgroundColor: getMatchStatusColor(match.status) }]} />
                        <Text style={[styles.statusText, { color: getMatchStatusColor(match.status) }]}>
                            {getMatchStatusText(match.status)}
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.matchFooter}>
                <Text style={styles.viewDetails}>Detayları Gör</Text>
                <ChevronRight size={16} color="#16a34a" strokeWidth={2} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({

    // Match Cards
    matchCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    matchCardPast: {
        opacity: 0.75,
    },
    matchTypeHeaderBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    matchTypeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    matchTypeBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    matchHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    matchHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        flex: 1,
    },
    sportIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    matchSportEmoji: {
        fontSize: 22,
    },
    matchHeaderInfo: {
        flex: 1,
        paddingTop: 2,
    },
    matchTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    matchLeague: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    resultBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 'auto',
    },
    resultBadgeWin: {
        backgroundColor: '#10B981',
    },
    resultBadgeDraw: {
        backgroundColor: '#F59E0B',
    },
    resultBadgeLoss: {
        backgroundColor: '#EF4444',
    },
    resultBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
    },
    matchInfo: {
        gap: 8,
        marginBottom: 12,
    },
    matchInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoSeparator: {
        width: 1,
        height: 12,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    matchInfoText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
        flex: 1,
    },
    matchScore: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    scoreTeam: {
        flex: 1,
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
    },
    scoreDivider: {
        paddingHorizontal: 16,
    },
    scoreDividerText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    playerPerformance: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    performanceStats: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
        flexWrap: 'wrap',
    },
    performanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    performanceText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
    },
    mvpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    mvpText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F59E0B',
    },
    matchStatus: {
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    matchFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    viewDetails: {
        fontSize: 13,
        fontWeight: '600',
        color: '#16a34a',
    },

    // Compact View
    compactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    compactCardPast: {
        opacity: 0.75,
    },
    compactLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    compactSportIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactSportEmoji: {
        fontSize: 18,
    },
    compactInfo: {
        flex: 1,
    },
    compactTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    compactTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    compactFriendlyBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactDate: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    compactRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    compactResultBadge: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactResultText: {
        fontSize: 12,
        fontWeight: '700',
        color: 'white',
    },
});