import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import {
    ArrowLeft,
    Calendar,
    Clock,
    MapPin,
    DollarSign,
    User,
    Check,
    X,
    Users,
    Timer,
    MessageSquare,
} from 'lucide-react-native';
import { matchInvitationService } from '../../services/matchInvitationService';
import { matchService } from '../../services/matchService';
import { playerService } from '../../services/playerService';
import { IMatchInvitation, IMatch, SPORT_CONFIGS } from '../../types/types';
import { useAppContext } from '../../context/AppContext';
import { NavigationService } from '../../navigation';

interface InvitationWithDetails extends IMatchInvitation {
    match?: IMatch;
    inviterName?: string;
}

export const FriendlyMatchInvitationsScreen: React.FC = () => {
    const { user } = useAppContext();

    const [invitations, setInvitations] = useState<InvitationWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        try {
            setLoading(true);

            // Get pending invitations
            const pendingInvitations = await matchInvitationService.getPendingInvitations(
                user!.id!
            );

            // Load match and inviter details for each invitation
            const invitationsWithDetails = await Promise.all(
                pendingInvitations.map(async (inv: any) => {
                    const match = await matchService.getById(inv.matchId);
                    const inviter = await playerService.getById(inv.inviterId);

                    return {
                        ...inv,
                        match,
                        inviterName: inviter?.name || 'Bilinmeyen',
                    };
                })
            );

            // Filter out invitations with no match (deleted matches)
            const validInvitations = invitationsWithDetails.filter(
                (inv: any) => inv.match !== null
            );

            // Sort by date (newest first)
            validInvitations.sort((a: any, b: any) => {
                const dateA = new Date(a.sentAt).getTime();
                const dateB = new Date(b.sentAt).getTime();
                return dateB - dateA;
            });

            setInvitations(validInvitations);
        } catch (error) {
            console.error('Error loading invitations:', error);
            Alert.alert('Hata', 'Davetler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadInvitations();
    }, []);

    const handleAccept = async (invitation: InvitationWithDetails) => {
        if (!invitation.match) return;

        try {
            //bu kodu düzelt
            setProcessingIds((prev: Set<string>) => {
                const newSet = new Set(prev);
                newSet.add(invitation.id);
                return newSet;
            });
            // Accept invitation and register to match
            await matchInvitationService.acceptInvitation(invitation.id);
            await matchService.registerPlayer(invitation.matchId, user!.id!);

            Alert.alert(
                'Başarılı! 🎉',
                `${invitation.match.title} maçına kaydoldunuz.`,
                [
                    {
                        text: 'Tamam',
                        onPress: () => {
                            loadInvitations();
                        },
                    },
                    {
                        text: 'Maçı Görüntüle',
                        onPress: () => {
                            NavigationService.navigateToMatch(invitation.matchId);
                        },
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error accepting invitation:', error);
            Alert.alert('Hata', error.message || 'Davet kabul edilirken bir hata oluştu');
        } finally {
            setProcessingIds((prev: Set<string>) => {
                const newSet = new Set(prev);
                newSet.delete(invitation.id);
                return newSet;
            });
        }
    };

    const handleDecline = async (invitation: InvitationWithDetails) => {
        Alert.alert(
            'Daveti Reddet',
            `${invitation.match?.title} maçı davetini reddetmek istediğinizden emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Reddet',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setProcessingIds((prev: Set<string>) => {
                                const newSet = new Set(prev);
                                newSet.add(invitation.id);
                                return newSet;
                            });

                            await matchInvitationService.declineInvitation(invitation.id);

                            Alert.alert('Başarılı', 'Davet reddedildi');
                            loadInvitations();
                        } catch (error) {
                            console.error('Error declining invitation:', error);
                            Alert.alert('Hata', 'Davet reddedilirken bir hata oluştu');
                        } finally {
                            setProcessingIds((prev: Set<string>) => {
                                const newSet = new Set(prev);
                                newSet.delete(invitation.id);
                                return newSet;
                            });
                        }
                    },
                },
            ]
        );
    };

    const handleAcceptAll = async () => {
        if (invitations.length === 0) return;

        Alert.alert(
            'Tümünü Kabul Et',
            `${invitations.length} daveti kabul etmek istediğinizden emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Tümünü Kabul Et',
                    onPress: async () => {
                        try {
                            setLoading(true);

                            let successCount = 0;
                            let failCount = 0;

                            for (const inv of invitations) {
                                try {
                                    await matchInvitationService.acceptInvitation(inv.id);
                                    await matchService.registerPlayer(inv.matchId, user!.id!);
                                    successCount++;
                                } catch (error) {
                                    failCount++;
                                    console.error('Error accepting invitation:', error);
                                }
                            }

                            if (failCount > 0) {
                                Alert.alert(
                                    'Tamamlandı',
                                    `${successCount} davet kabul edildi, ${failCount} davet başarısız oldu.`
                                );
                            } else {
                                Alert.alert('Başarılı! 🎉', 'Tüm davetler kabul edildi');
                            }

                            loadInvitations();
                        } catch (error) {
                            console.error('Error accepting all:', error);
                            Alert.alert('Hata', 'Davetler kabul edilirken bir hata oluştu');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const isExpired = (invitation: InvitationWithDetails): boolean => {
        if (!invitation.expiresAt) return false;
        return new Date(invitation.expiresAt) < new Date();
    };

    const getTimeUntilExpiry = (invitation: InvitationWithDetails): string => {
        if (!invitation.expiresAt) return '';

        const now = new Date().getTime();
        const expiry = new Date(invitation.expiresAt).getTime();
        const diff = expiry - now;

        if (diff < 0) return 'Süresi doldu';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days} gün kaldı`;
        } else if (hours > 0) {
            return `${hours} saat kaldı`;
        } else {
            return `${minutes} dakika kaldı`;
        }
    };

    const renderInvitationCard = (invitation: InvitationWithDetails) => {
        const match = invitation.match;
        if (!match) return null;

        const expired = isExpired(invitation);
        const processing = processingIds.has(invitation.id);
        const sportConfig = SPORT_CONFIGS[match.sportType || 'Futbol'];

        return (
            <View
                key={invitation.id}
                style={[styles.invitationCard, expired && styles.invitationCardExpired]}
            >
                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.sportBadge}>
                        <Text style={styles.sportEmoji}>{sportConfig.emoji}</Text>
                        <Text style={styles.sportName}>{sportConfig.name}</Text>
                    </View>
                    {expired && (
                        <View style={styles.expiredBadge}>
                            <Text style={styles.expiredBadgeText}>Süresi Doldu</Text>
                        </View>
                    )}
                </View>

                {/* Match Title */}
                <TouchableOpacity
                    onPress={() => NavigationService.navigateToMatch(match.id)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.matchTitle}>{match.title}</Text>
                </TouchableOpacity>

                {/* Inviter */}
                <View style={styles.inviterRow}>
                    <User size={16} color="#666" />
                    <Text style={styles.inviterText}>
                        <Text style={styles.inviterName}>{invitation.inviterName}</Text> sizi davet etti
                    </Text>
                </View>

                {/* Match Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Calendar size={16} color="#666" />
                        <Text style={styles.detailText}>
                            {new Date(match.matchStartTime).toLocaleDateString('tr-TR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Clock size={16} color="#666" />
                        <Text style={styles.detailText}>
                            {new Date(match.matchStartTime).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </View>

                    <View style={styles.detailRow}>
                        <MapPin size={16} color="#666" />
                        <Text style={styles.detailText}>{match.location}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <DollarSign size={16} color="#666" />
                        <Text style={styles.detailText}>₺{match.pricePerPlayer}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Users size={16} color="#666" />
                        <Text style={styles.detailText}>
                            {match.staffPlayerCount} kişi ({match.reservePlayerCount} yedek)
                        </Text>
                    </View>
                </View>

                {/* Message */}
                {invitation.message && (
                    <View style={styles.messageContainer}>
                        <MessageSquare size={16} color="#666" />
                        <Text style={styles.messageText}>{invitation.message}</Text>
                    </View>
                )}

                {/* Expiry Info */}
                {invitation.expiresAt && !expired && (
                    <View style={styles.expiryContainer}>
                        <Timer size={14} color="#F59E0B" />
                        <Text style={styles.expiryText}>{getTimeUntilExpiry(invitation)}</Text>
                    </View>
                )}

                {/* Actions */}
                {!expired && (
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.declineButton]}
                            onPress={() => handleDecline(invitation)}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator size="small" color="#EF4444" />
                            ) : (
                                <>
                                    <X size={18} color="#EF4444" />
                                    <Text style={styles.declineButtonText}>Reddet</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.acceptButton]}
                            onPress={() => handleAccept(invitation)}
                            disabled={processing}
                        >
                            {processing ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <Check size={18} color="#FFF" />
                                    <Text style={styles.acceptButtonText}>Kabul Et</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => NavigationService.goBack()} style={styles.backButton}>
                        <ArrowLeft size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Davetlerim</Text>
                    <View style={styles.headerRight} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Davetler yükleniyor...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => NavigationService.goBack()} style={styles.backButton}>
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Davetlerim</Text>
                <View style={styles.headerRight}>
                    {invitations.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{invitations.length}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Stats Header */}
            {invitations.length > 0 && (
                <View style={styles.statsHeader}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{invitations.length}</Text>
                        <Text style={styles.statLabel}>Bekleyen</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {invitations.filter((inv: any) => !isExpired(inv)).length}
                        </Text>
                        <Text style={styles.statLabel}>Aktif</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>
                            {invitations.filter((inv: any) => isExpired(inv)).length}
                        </Text>
                        <Text style={styles.statLabel}>Süresi Dolmuş</Text>
                    </View>
                </View>
            )}

            {/* Accept All Button */}
            {invitations.filter((inv: any) => !isExpired(inv)).length > 1 && (
                <View style={styles.acceptAllContainer}>
                    <TouchableOpacity
                        style={styles.acceptAllButton}
                        onPress={handleAcceptAll}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#007AFF" />
                        ) : (
                            <>
                                <Check size={20} color="#007AFF" />
                                <Text style={styles.acceptAllButtonText}>
                                    Tümünü Kabul Et ({invitations.filter((inv: any) => !isExpired(inv)).length})
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Invitations List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {invitations.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MessageSquare size={64} color="#CCC" />
                        <Text style={styles.emptyStateTitle}>Davet Yok</Text>
                        <Text style={styles.emptyStateText}>
                            Dostluk maçı davetleri burada görünecek
                        </Text>
                    </View>
                ) : (
                    invitations.map((invitation: any) => renderInvitationCard(invitation))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    headerRight: {
        width: 40,
        alignItems: 'flex-end',
    },
    badge: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    statsHeader: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    statDivider: {
        width: 1,
        backgroundColor: '#E0E0E0',
    },
    acceptAllContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    acceptAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
    },
    acceptAllButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#007AFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    invitationCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    invitationCardExpired: {
        opacity: 0.6,
        backgroundColor: '#F9F9F9',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sportBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
    },
    sportEmoji: {
        fontSize: 16,
    },
    sportName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    expiredBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: '#FEE2E2',
        borderRadius: 12,
    },
    expiredBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#EF4444',
    },
    matchTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    inviterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    inviterText: {
        fontSize: 14,
        color: '#666',
    },
    inviterName: {
        fontWeight: '600',
        color: '#000',
    },
    detailsContainer: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#666',
    },
    messageContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        padding: 12,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        marginBottom: 12,
    },
    messageText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    expiryText: {
        fontSize: 13,
        color: '#F59E0B',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderRadius: 8,
    },
    declineButton: {
        backgroundColor: '#FEE2E2',
    },
    declineButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444',
    },
    acceptButton: {
        backgroundColor: '#007AFF',
    },
    acceptButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFF',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#000',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
});
