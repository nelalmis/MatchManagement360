
// ============================================
// LEAGUE CARD COMPONENT

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import {
    Users,
    Calendar,
    Trophy,
    ChevronRight,
} from 'lucide-react-native';
import {
    ILeague,
    SportType,
} from '../../../types/entity/types';
import { getSportEmoji, getThemeForSport } from '../../../utils/theme';
import { LeagueNavigationService } from '../../../navigation';

// ============================================
interface LeagueCardProps {
    league: ILeague;
    isMember: boolean;
    isAdmin: boolean;
    onPress: () => void;
    viewMode?: 'compact' | 'detailed';
}

export const LeagueCard: React.FC<LeagueCardProps> = ({
    league,
    isMember,
    isAdmin,
    onPress,
    viewMode = 'detailed',
}) => {

    const sportConfig = getThemeForSport(league.sportType);
    const sportColor = sportConfig?.sport.primary || '#16a34a';

    const handleLeaguePress = useCallback((leagueId: string) => {
        LeagueNavigationService.navigateToLeagueDetail(leagueId);
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (viewMode === 'compact') {
        return (
            <TouchableOpacity
                key={league.id}
                style={styles.leagueCompactCard}
                onPress={() => handleLeaguePress(league.id!)}
                activeOpacity={0.7}
            >
                <View style={styles.leagueCompactCardLeft}>
                    <Text style={styles.leagueCompactEmoji}>
                        {getSportEmoji(league.sportType as SportType)}
                    </Text>
                    <View style={styles.leagueCompactCardInfo}>
                        <Text style={styles.leagueCompactCardTitle}>{league.title}</Text>
                        <View style={styles.leagueCompactCardMeta}>
                            <Users size={12} color="#6B7280" strokeWidth={2} />
                            <Text style={styles.leagueCompactCardMetaText}>
                                {league.totalMembers} Üye
                            </Text>
                        </View>
                    </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </TouchableOpacity>
        )
    }

    return (
        <TouchableOpacity
            style={[
                styles.leagueCard,
                isMember && styles.leagueCardMember,
            ]}
            onPress={onPress ? () => onPress() : () => handleLeaguePress(league.id!)}
            activeOpacity={0.7}
        >
            {/* Header */}
            <View style={styles.leagueCardHeader}>
                <View style={styles.leagueCardLeft}>
                    <View style={[styles.sportIcon, { backgroundColor: sportColor + '20' }]}>
                        <Text style={styles.sportEmoji}>{getSportEmoji(league.sportType)}</Text>
                    </View>

                    <View style={styles.leagueCardInfo}>
                        <View style={styles.leagueCardTitleRow}>
                            <Text style={styles.leagueCardTitle} numberOfLines={1}>
                                {league.title}
                            </Text>
                            {isMember && (
                                <View style={styles.memberBadge}>
                                    <Text style={styles.memberBadgeText}>
                                        {isAdmin ? 'YÖNETİCİ' : 'ÜYE'}
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.leagueCardMeta}>
                            <View style={styles.metaItem}>
                                <Users size={14} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.metaText}>{league.totalMembers} üye</Text>
                            </View>

                            <View style={styles.metaItem}>
                                <Calendar size={14} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.metaText}>{league.totalSeasons} sezon</Text>
                            </View>

                            <View style={styles.metaItem}>
                                <Trophy size={14} color="#6B7280" strokeWidth={2} />
                                <Text style={styles.metaText}>{league.totalMatches} maç</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </View>

            {/* Description */}
            {league.description && (
                <Text style={styles.leagueDescription} numberOfLines={2}>
                    {league.description}
                </Text>
            )}

            {/* Footer */}
            <View style={styles.leagueCardFooter}>
                <Text style={styles.leagueCardDate}>
                    Oluşturulma: {formatDate(league.createdAt)}
                </Text>
                {league.currentSeasonId && (
                    <View style={[styles.activeBadge, { backgroundColor: sportColor + '20' }]}>
                        <Text style={[styles.activeBadgeText, { color: sportColor }]}>
                            Aktif Sezon
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    leagueCard: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    leagueCardMember: {
        borderWidth: 2,
        borderColor: '#16a34a',
    },
    leagueCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    leagueCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    sportIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sportEmoji: {
        fontSize: 24,
    },
    leagueCardInfo: {
        flex: 1,
    },
    leagueCardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    leagueCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    memberBadge: {
        backgroundColor: '#16a34a',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    memberBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: 'white',
    },
    leagueCardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    leagueDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 12,
    },
    leagueCardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    leagueCardDate: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    activeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },


    // League Card
    leagueCompactCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    leagueCompactCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
    },
    leagueCompactEmoji: {
        fontSize: 32,
        marginRight: 12,
    },
    leagueCompactCardInfo: {
        flex: 1,
    },
    leagueCompactCardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
    },
    leagueCompactCardMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    leagueCompactCardMetaText: {
        fontSize: 12,
        color: '#6B7280',
    },
});