import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import {
    ListOrdered,
    Calendar,
    MapPin,
    DollarSign,
    Repeat,
    ChevronRight,
    Clock,
} from 'lucide-react-native';
import { IFixture, ILeague } from '../../../types/entity/types';
import { FixtureNavigationService } from '../../../navigation';

interface FixtureCardProps {
    fixture: IFixture;
    sportColor: string;
    isOrganizer: boolean;
    onPress: () => void;
    viewMode?: 'compact' | 'detailed';
}

export const FixtureCard: React.FC<FixtureCardProps> = ({
    fixture,
    sportColor,
    isOrganizer,
    onPress,
    viewMode = 'detailed',
}) => {

    const handleFixturePress = (fixtureId: string) => {
        FixtureNavigationService.navigateToFixtureDetail(fixtureId);
    };

    // ============================================
    // HELPER FUNCTIONS
    // ============================================

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = date.getTime() - now.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) {
            return `Bugün ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffInDays === 1) {
            return `Yarın ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffInDays > 0 && diffInDays < 7) {
            const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
            return `${dayNames[date.getDay()]} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    };

    const getTimeUntilMatch = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = date.getTime() - now.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

        if (diffInDays > 0) {
            return `${diffInDays} gün`;
        } else if (diffInHours > 0) {
            return `${diffInHours} saat`;
        } else {
            return 'Yakında';
        }
    };

    const getPatternText = (pattern?: IFixture['schedule']['pattern']) => {
        if (!pattern) return '';
        switch (pattern.type) {
            case 'weekly':
                return 'Haftalık';
            case 'biweekly':
                return 'İki haftada bir';
            case 'monthly':
                return 'Aylık';
            case 'custom':
                return `${pattern.interval} günde bir`;
            default:
                return '';
        }
    };

    if (viewMode === 'compact') {
        return (
            <TouchableOpacity
                key={fixture.id}
                style={styles.fixtureCompactCard}
                onPress={() =>
                    FixtureNavigationService.navigateToFixtureDetail(fixture.id!)
                }
                activeOpacity={0.7}
            >
                <View style={styles.fixtureCompactHeader}>
                    <View style={styles.fixtureCompactTitleRow}>
                        <ListOrdered size={18} color={sportColor} strokeWidth={2} />
                        <Text style={styles.fixtureCompactTitle}>{fixture.title}</Text>
                    </View>
                    <View
                        style={[
                            styles.fixtureCompactStatusBadge,
                            styles.fixtureCompactStatusActive,
                        ]}
                    >
                        <Text style={styles.fixtureCompactStatusText}>Aktif</Text>
                    </View>
                </View>

                {/* Next Match Date */}
                {fixture.nextMatchDate ? (
                    <View style={styles.fixtureCompactInfo}>
                        <Calendar size={16} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.fixtureCompactInfoText}>
                            Sonraki Maç: {formatDate(fixture.nextMatchDate)}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.fixtureCompactInfo}>
                        <Calendar size={16} color="#9CA3AF" strokeWidth={2} />
                        <Text style={[styles.fixtureCompactInfoText, { color: '#9CA3AF' }]}>
                            Maç planlanmadı
                        </Text>
                    </View>
                )}

                {/* Location */}
                {fixture.venue.location && (
                    <View style={styles.fixtureCompactInfo}>
                        <MapPin size={16} color="#6B7280" strokeWidth={2} />
                        <Text style={styles.fixtureInfoText}>
                            {fixture.venue.location}
                        </Text>
                    </View>
                )}

                {/* Stats Row */}
                <View style={styles.fixtureCompactStatsRow}>
                    <View style={styles.fixtureCompactStatItem}>
                        <Calendar size={14} color="#9CA3AF" strokeWidth={2} />
                        <Text style={styles.fixtureCompactStatText}>
                            {fixture.totalMatches} maç
                        </Text>
                    </View>
                    {fixture.schedule.isRecurring && (
                        <View style={styles.fixtureCompactStatItem}>
                            <Repeat size={14} color="#9CA3AF" strokeWidth={2} />
                            <Text style={styles.fixtureCompactStatText}>
                                {fixture.schedule.pattern?.type === 'weekly' && 'Haftalık'}
                                {fixture.schedule.pattern?.type === 'biweekly' && 'İki haftada bir'}
                                {fixture.schedule.pattern?.type === 'monthly' && 'Aylık'}
                                {fixture.schedule.pattern?.type === 'custom' && 'Özel'}
                            </Text>
                        </View>
                    )}
                    <View style={styles.fixtureCompactStatItem}>
                        <DollarSign size={14} color="#9CA3AF" strokeWidth={2} />
                        <Text style={styles.fixtureCompactStatText}>
                            {fixture.venue.pricePerPlayer} TL
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }
    return (
        <TouchableOpacity
            style={[
                styles.fixtureCard,
                isOrganizer && { borderColor: sportColor, borderWidth: 2 },
            ]}
            onPress={() => onPress ? onPress() : () => handleFixturePress(fixture.id!)}
            activeOpacity={0.7}
        >
            {/* Header */}
            <View style={styles.fixtureHeader}>
                <View style={styles.fixtureTitleRow}>
                    <View
                        style={[styles.fixtureIcon, { backgroundColor: sportColor + '20' }]}
                    >
                        <ListOrdered size={18} color={sportColor} strokeWidth={2} />
                    </View>
                    <View style={styles.fixtureTitleContainer}>
                        <Text style={styles.fixtureTitle} numberOfLines={1}>
                            {fixture.title}
                        </Text>
                        {isOrganizer && (
                            <View
                                style={[styles.organizerBadge, { backgroundColor: sportColor }]}
                            >
                                <Text style={styles.organizerBadgeText}>Organizatör</Text>
                            </View>
                        )}
                    </View>
                </View>
                <ChevronRight size={20} color="#9CA3AF" strokeWidth={2} />
            </View>

            {/* Description */}
            {fixture.description && (
                <Text style={styles.fixtureDescription} numberOfLines={2}>
                    {fixture.description}
                </Text>
            )}

            {/* Next Match - Prominent Display */}
            {fixture.nextMatchDate ? (
                <View style={styles.nextMatchContainer}>
                    <View style={styles.nextMatchHeader}>
                        <Clock size={14} color={sportColor} strokeWidth={2} />
                        <Text style={[styles.nextMatchLabel, { color: sportColor }]}>
                            Sonraki Maç
                        </Text>
                    </View>
                    <View style={styles.nextMatchBody}>
                        <Text style={styles.nextMatchDate}>
                            {formatDate(fixture.nextMatchDate)}
                        </Text>
                        <View
                            style={[
                                styles.nextMatchBadge,
                                { backgroundColor: sportColor + '20' },
                            ]}
                        >
                            <Text style={[styles.nextMatchBadgeText, { color: sportColor }]}>
                                {getTimeUntilMatch(fixture.nextMatchDate)} kaldı
                            </Text>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.noMatchContainer}>
                    <Calendar size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.noMatchText}>Maç planlanmadı</Text>
                </View>
            )}

            {/* Location */}
            {fixture.venue.location && (
                <View style={styles.fixtureInfoRow}>
                    <MapPin size={14} color="#6B7280" strokeWidth={2} />
                    <Text style={styles.fixtureInfoText} numberOfLines={1}>
                        {fixture.venue.location}
                    </Text>
                </View>
            )}

            {/* Stats Footer */}
            <View style={styles.fixtureFooter}>
                <View style={styles.fixtureStatItem}>
                    <Calendar size={12} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.fixtureStatText}>{fixture.totalMatches} maç</Text>
                </View>

                {fixture.schedule.isRecurring && (
                    <View style={styles.fixtureStatItem}>
                        <Repeat size={12} color="#8B5CF6" strokeWidth={2} />
                        <Text style={[styles.fixtureStatText, { color: '#8B5CF6' }]}>
                            {getPatternText(fixture.schedule.pattern)}
                        </Text>
                    </View>
                )}

                <View style={styles.fixtureStatItem}>
                    <DollarSign size={12} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.fixtureStatText}>
                        {fixture.venue.pricePerPlayer} TL
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );


};
const styles = StyleSheet.create({

    // Fixture Card
    fixtureCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    fixtureHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    fixtureTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    fixtureIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fixtureTitleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    fixtureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    organizerBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    organizerBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: 'white',
    },
    fixtureDescription: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 18,
        marginBottom: 12,
    },

    // Next Match Container - Prominent
    nextMatchContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    nextMatchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    nextMatchLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    nextMatchBody: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    nextMatchDate: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
    },
    nextMatchBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    nextMatchBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // No Match
    noMatchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        padding: 12,
        marginBottom: 12,
    },
    noMatchText: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },

    // Info Row
    fixtureInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    fixtureInfoText: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
    },

    // Footer
    fixtureFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    fixtureStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    fixtureStatText: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },

    // Compact View Styles

    // Fixture Card Styles
    fixtureCompactCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    fixtureCompactHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    fixtureCompactTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        flex: 1,
        marginRight: 8,
    },
    fixtureCompactStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    fixtureCompactStatusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#16a34a',
    },
    fixtureCompactInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },

    // Fixture Stats Row
    fixtureCompactStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    fixtureCompactStatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    fixtureCompactStatText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },

    // Fixture Card Updates
    fixtureCompactTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    fixtureCompactStatusActive: {
        backgroundColor: '#DCFCE7',
    },
    fixtureCompactInfoText: {
        fontSize: 13,
        color: '#6B7280',
        flex: 1,
    },

});