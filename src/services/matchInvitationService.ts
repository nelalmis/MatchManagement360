import { matchInvitationApi, IMatchInvitation, MatchType } from '../api/matchInvitationApi';

export class MatchInvitationService {
    /**
     * Send invitation to a player
     */
    async sendInvitation(data: {
        matchId: string;
        matchType: MatchType;
        inviterId: string;
        inviteeId: string;
        message?: string;
        expiresInHours?: number;
    }): Promise<string | undefined> {
        // Check if invitation already exists
        const existing = await matchInvitationApi.checkInvitationExists(data.matchId, data.inviteeId);

        if (existing && existing.status === 'pending') {
            throw new Error('Bu oyuncuya zaten davet gönderilmiş');
        }

        // Calculate expiration
        let expiresAt: string | undefined;
        if (data.expiresInHours) {
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + data.expiresInHours);
            expiresAt = expiryDate.toISOString();
        }

        const invitation: Omit<IMatchInvitation, 'id'> = {
            matchId: data.matchId,
            matchType: data.matchType,
            inviterId: data.inviterId,
            inviteeId: data.inviteeId,
            status: 'pending',
            message: data.message,
            sentAt: new Date().toISOString(),
            expiresAt
        };

        const result = await matchInvitationApi.add(invitation);
        return result.id;
    }

    /**
     * Send bulk invitations
     */
    async sendBulkInvitations(data: {
        matchId: string;
        matchType: MatchType;
        inviterId: string;
        inviteeIds: string[];
        message?: string;
        expiresInHours?: number;
    }): Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }> {
        const results = {
            success: [] as string[],
            failed: [] as Array<{ id: string; error: string }>
        };

        for (const inviteeId of data.inviteeIds) {
            try {
                const invitationId = await this.sendInvitation({
                    matchId: data.matchId,
                    matchType: data.matchType,
                    inviterId: data.inviterId,
                    inviteeId,
                    message: data.message,
                    expiresInHours: data.expiresInHours
                });
                if (invitationId) {
                    results.success.push(invitationId);
                }
            } catch (error: any) {
                results.failed.push({
                    id: inviteeId,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Accept invitation
     */
    async acceptInvitation(invitationId: string): Promise<any> {
        const invitation: any = await matchInvitationApi.getById(invitationId);

        if (!invitation) {
            throw new Error('Davet bulunamadı');
        }

        if (invitation.status !== 'pending') {
            throw new Error('Bu davet artık geçerli değil');
        }

        // Check if expired
        if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
            await matchInvitationApi.update(invitationId, {
                status: 'expired'
            });
            throw new Error('Bu davetin süresi dolmuş');
        }

        return await matchInvitationApi.update(invitationId, {
            status: 'accepted',
            respondedAt: new Date().toISOString()
        });
    }

    /**
     * Decline invitation
     */
    async declineInvitation(invitationId: string): Promise<any> {
        const invitation: any = await matchInvitationApi.getById(invitationId);

        if (!invitation) {
            throw new Error('Davet bulunamadı');
        }

        if (invitation.status !== 'pending') {
            throw new Error('Bu davet artık geçerli değil');
        }

        return await matchInvitationApi.update(invitationId, {
            status: 'declined',
            respondedAt: new Date().toISOString()
        });
    }

    /**
     * Cancel invitation (by sender)
     */
    async cancelInvitation(invitationId: string, inviterId: string): Promise<any> {
        const invitation: any = await matchInvitationApi.getById(invitationId);

        if (!invitation) {
            throw new Error('Davet bulunamadı');
        }

        if (invitation.inviterId !== inviterId) {
            throw new Error('Bu daveti sadece gönderen iptal edebilir');
        }

        if (invitation.status !== 'pending') {
            throw new Error('Bu davet artık iptal edilemez');
        }

        return await matchInvitationApi.delete(invitationId);
    }

    /**
     * Get pending invitations for a player
     */
    async getPendingInvitations(playerId: string): Promise<IMatchInvitation[]> {
        return await matchInvitationApi.getPendingInvitations(playerId);
    }

    /**
     * Get invitation count for a player
     */
    async getPendingInvitationCount(playerId: string): Promise<number> {
        const invitations = await this.getPendingInvitations(playerId);
        return invitations.length;
    }

    /**
     * Get sent invitations
     */
    async getSentInvitations(senderId: string): Promise<IMatchInvitation[]> {
        return await matchInvitationApi.getBySenderId(senderId);
    }

    /**
     * Get received invitations
     */
    async getReceivedInvitations(receiverId: string): Promise<IMatchInvitation[]> {
        return await matchInvitationApi.getByReceiverId(receiverId);
    }

    /**
     * Get invitations for a match
     */
    async getMatchInvitations(matchId: string): Promise<IMatchInvitation[]> {
        return await matchInvitationApi.getByMatchId(matchId);
    }

    /**
     * Get active invitations for a match
     */
    async getActiveMatchInvitations(matchId: string): Promise<IMatchInvitation[]> {
        return await matchInvitationApi.getActiveInvitationsByMatch(matchId);
    }

    /**
     * Check if player has pending invitation for match
     */
    async hasInvitation(matchId: string, playerId: string): Promise<boolean> {
        const invitation = await matchInvitationApi.checkInvitationExists(matchId, playerId);
        return invitation !== null && invitation.status === 'pending';
    }

    /**
     * Get invitation statistics
     */
    async getStats(userId: string) {
        return await matchInvitationApi.getInvitationStats(userId);
    }

    /**
     * Mark expired invitations
     */
    async markExpiredInvitations(): Promise<number> {
        const expired = await matchInvitationApi.getExpiredInvitations();

        if (expired.length === 0) {
            return 0;
        }

        const invitationIds = expired.map(inv => inv.id);
        await matchInvitationApi.bulkUpdateStatus(invitationIds, 'expired');

        return expired.length;
    }

    /**
     * Resend invitation
     */
    async resendInvitation(
        invitationId: string,
        expiresInHours?: number
    ): Promise<string | undefined> {
        const oldInvitation: any = await matchInvitationApi.getById(invitationId);

        if (!oldInvitation) {
            throw new Error('Davet bulunamadı');
        }

        // Delete old invitation
        await matchInvitationApi.delete(invitationId);

        // Send new one
        return await this.sendInvitation({
            matchId: oldInvitation.matchId,
            matchType: oldInvitation.matchType,
            inviterId: oldInvitation.inviterId,
            inviteeId: oldInvitation.inviteeId,
            message: oldInvitation.message,
            expiresInHours
        });
    }

    /**
     * Cancel all invitations for a match
     */
    async cancelAllMatchInvitations(matchId: string): Promise<number> {
        const invitations = await matchInvitationApi.getActiveInvitationsByMatch(matchId);

        if (invitations.length === 0) {
            return 0;
        }

        await matchInvitationApi.deleteByMatchId(matchId);
        return invitations.length;
    }

    /**
     * Get invitations grouped by status
     */
    async getInvitationsGroupedByStatus(playerId: string) {
        const sent = await this.getSentInvitations(playerId);
        const received = await this.getReceivedInvitations(playerId);

        return {
            sent: {
                pending: sent.filter(i => i.status === 'pending'),
                accepted: sent.filter(i => i.status === 'accepted'),
                declined: sent.filter(i => i.status === 'declined'),
                expired: sent.filter(i => i.status === 'expired')
            },
            received: {
                pending: received.filter(i => i.status === 'pending'),
                accepted: received.filter(i => i.status === 'accepted'),
                declined: received.filter(i => i.status === 'declined'),
                expired: received.filter(i => i.status === 'expired')
            }
        };
    }

    /**
     * Auto-accept invitations from favorite players
     */
    async autoAcceptFromFavorites(
        playerId: string,
        favoritePlayerIds: string[]
    ): Promise<number> {
        const pendingInvitations = await this.getPendingInvitations(playerId);

        const toAccept = pendingInvitations.filter(inv =>
            favoritePlayerIds.includes(inv.inviterId)
        );

        for (const invitation of toAccept) {
            await this.acceptInvitation(invitation.id);
        }

        return toAccept.length;
    }

    /**
     * Get invitation acceptance rate for a user
     */
    async getAcceptanceRate(userId: string): Promise<{
        sent: number;
        received: number;
    }> {
        const stats = await this.getStats(userId);

        const sentRate = stats.sent.total > 0
            ? (stats.sent.accepted / stats.sent.total) * 100
            : 0;

        const receivedRate = stats.received.total > 0
            ? (stats.received.accepted / stats.received.total) * 100
            : 0;

        return {
            sent: Math.round(sentRate),
            received: Math.round(receivedRate)
        };
    }

    /**
     * Get most responsive players (who accept invitations quickly)
     */
    async getMostResponsivePlayers(inviterId: string, limit: number = 10) {
        const invitations = await this.getSentInvitations(inviterId);

        const playerStats = new Map<string, {
            total: number;
            accepted: number;
            avgResponseTime: number;
        }>();

        invitations
            .filter(inv => inv.status === 'accepted' && inv.respondedAt)
            .forEach(inv => {
                const playerId = inv.inviteeId;
                const responseTime = new Date(inv.respondedAt!).getTime() - new Date(inv.sentAt).getTime();

                if (!playerStats.has(playerId)) {
                    playerStats.set(playerId, { total: 0, accepted: 0, avgResponseTime: 0 });
                }

                const stats = playerStats.get(playerId)!;
                stats.total++;
                stats.accepted++;
                stats.avgResponseTime = (stats.avgResponseTime * (stats.total - 1) + responseTime) / stats.total;
            });

        return Array.from(playerStats.entries())
            .map(([playerId, stats]) => ({
                playerId,
                acceptanceRate: (stats.accepted / stats.total) * 100,
                avgResponseTimeMinutes: Math.round(stats.avgResponseTime / (1000 * 60))
            }))
            .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
            .slice(0, limit);
    }
}

export const matchInvitationService = new MatchInvitationService();


/*

// 1. Tekil davet gönder
await matchInvitationService.sendInvitation({
  matchId: 'match123',
  matchType: MatchType.FRIENDLY,
  inviterId: currentUserId,
  inviteeId: 'player456',
  message: 'Cumartesi maçına gelir misin?',
  expiresInHours: 48
});

// 2. Toplu davet
const result = await matchInvitationService.sendBulkInvitations({
  matchId: 'match123',
  matchType: MatchType.FRIENDLY,
  inviterId: currentUserId,
  inviteeIds: ['p1', 'p2', 'p3'],
  expiresInHours: 24
});
console.log(`${result.success.length} başarılı, ${result.failed.length} başarısız`);

// 3. Bekleyen davetleri göster
const pending = await matchInvitationService.getPendingInvitations(userId);
const count = await matchInvitationService.getPendingInvitationCount(userId);

// 4. Daveti kabul et
await matchInvitationService.acceptInvitation(invitationId);

// 5. İstatistikleri göster
const stats = await matchInvitationService.getStats(userId);
const acceptanceRate = await matchInvitationService.getAcceptanceRate(userId);

// 6. En hızlı cevap verenler
const responsive = await matchInvitationService.getMostResponsivePlayers(organizerId);


*/