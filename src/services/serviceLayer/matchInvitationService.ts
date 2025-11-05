// // ============================================
// // services/MatchInvitationService.ts - COMPLETE PRODUCTION VERSION
// // ============================================
// import { matchInvitationsAPI } from '../../api/apiLayer/matchInvitationsAPI';
// import { matchAPI } from '../../api/apiLayer/matchAPI';
// import { playerAPI } from '../../api/apiLayer/playerAPI';
// import { leagueAPI } from '../../api/apiLayer/leagueAPI';
// import { ApiResponse } from '../../api/base/BaseAPI';
// import { IMatchInvitation, MatchStatus, MatchType } from '../../types/entity/types';
// import { ApiLogger } from '../../api/base/ApiLogger';

// export class MatchInvitationService {
//   // ============================================
//   // 1. INVITATION CREATION
//   // ============================================

//   /**
//    * Send match invitation
//    */
//   static async sendInvitation(data: {
//     matchId: string;
//     inviterId: string;
//     inviteeId: string;
//     message?: string;
//     expiresInHours?: number; // Default: 24 hours
//   }): Promise<ApiResponse<IMatchInvitation>> {
//     try {
//       ApiLogger.log('MatchInvitationService', 'sendInvitation', {
//         matchId: data.matchId,
//         inviterId: data.inviterId,
//         inviteeId: data.inviteeId,
//       });

//       // Validate: Cannot invite yourself
//       if (data.inviterId === data.inviteeId) {
//         return {
//           success: false,
//           error: {
//             code: 'CANNOT_INVITE_SELF',
//             message: 'Kendinizi davet edemezsiniz',
//             statusCode: 400,
//           },
//         };
//       }

//       // Get match to validate
//       const matchResult = await matchAPI.getById(data.matchId);

//       if (!matchResult.success || !matchResult.data) {
//         return {
//           success: false,
//           error: matchResult.error || {
//             code: 'MATCH_NOT_FOUND',
//             message: 'Maç bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       const match = matchResult.data;

//       // Check if match is in valid status for invitations
//       if (match.status !== MatchStatus.CREATED && match.status !== MatchStatus.REGISTRATION_OPEN) {
//         return {
//           success: false,
//           error: {
//             code: 'INVALID_MATCH_STATUS',
//             message: 'Bu maç için davet gönderilemez',
//             statusCode: 400,
//           },
//         };
//       }

//       // Check if invitee is already in the match
//       const allPlayerIds = match.players.teams
//         ? [
//             ...match.players.teams.team1.map(p => p.playerId),
//             ...match.players.teams.team2.map(p => p.playerId),
//           ]
//         : [];

//       if (allPlayerIds.includes(data.inviteeId)) {
//         return {
//           success: false,
//           error: {
//             code: 'ALREADY_IN_MATCH',
//             message: 'Bu oyuncu zaten maçta',
//             statusCode: 400,
//           },
//         };
//       }

//       // Check if match is full
//       const totalPlayers = allPlayerIds.length;
//       const maxPlayers = match.squad?.totalPlayers || 0;

//       if (totalPlayers >= maxPlayers) {
//         return {
//           success: false,
//           error: {
//             code: 'MATCH_FULL',
//             message: 'Maç kadrosu dolu',
//             statusCode: 400,
//           },
//         };
//       }

//       // Get player names for cache
//       const [inviterResult, inviteeResult] = await Promise.all([
//         playerAPI.getById(data.inviterId),
//         playerAPI.getById(data.inviteeId),
//       ]);

//       const inviterName = inviterResult.success && inviterResult.data
//         ? `${inviterResult.data.name} ${inviterResult.data.surname}`
//         : 'Unknown Player';

//       const inviteeName = inviteeResult.success && inviteeResult.data
//         ? `${inviteeResult.data.name} ${inviteeResult.data.surname}`
//         : 'Unknown Player';

//       // Calculate expiration
//       const expiresAt = new Date();
//       expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));

//       // Create invitation
//       const invitationData: Omit<IMatchInvitation, 'id' | 'sentAt' | 'respondedAt'> = {
//         matchId: data.matchId,
//         matchType: match.type,
//         inviterId: data.inviterId,
//         inviterName,
//         inviteeId: data.inviteeId,
//         inviteeName,
//         status: 'pending',
//         message: data.message,
//         expiresAt: expiresAt.toISOString(),
//       };

//       const result = await matchInvitationsAPI.createInvitation(invitationData);

//       if (result.success) {
//         ApiLogger.success('MatchInvitationService', 'sendInvitation', {
//           invitationId: result.data?.id,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('MatchInvitationService', 'sendInvitation', error);
//       return {
//         success: false,
//         error: {
//           code: 'SEND_INVITATION_ERROR',
//           message: error.message || 'Davet gönderilirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Send bulk invitations
//    */
//   static async sendBulkInvitations(data: {
//     matchId: string;
//     inviterId: string;
//     inviteeIds: string[];
//     message?: string;
//     expiresInHours?: number;
//   }): Promise<ApiResponse<{
//     success: number;
//     failed: number;
//     results: Array<{
//       inviteeId: string;
//       inviteeName: string;
//       success: boolean;
//       error?: string;
//     }>;
//   }>> {
//     try {
//       ApiLogger.log('MatchInvitationService', 'sendBulkInvitations', {
//         matchId: data.matchId,
//         inviterId: data.inviterId,
//         count: data.inviteeIds.length,
//       });

//       const results: Array<{
//         inviteeId: string;
//         inviteeName: string;
//         success: boolean;
//         error?: string;
//       }> = [];

//       let successCount = 0;
//       let failedCount = 0;

//       for (const inviteeId of data.inviteeIds) {
//         const result = await this.sendInvitation({
//           matchId: data.matchId,
//           inviterId: data.inviterId,
//           inviteeId,
//           message: data.message,
//           expiresInHours: data.expiresInHours,
//         });

//         if (result.success && result.data) {
//           successCount++;
//           results.push({
//             inviteeId,
//             inviteeName: result.data.inviteeName,
//             success: true,
//           });
//         } else {
//           failedCount++;
//           results.push({
//             inviteeId,
//             inviteeName: 'Unknown',
//             success: false,
//             error: result.error?.message,
//           });
//         }
//       }

//       ApiLogger.success('MatchInvitationService', 'sendBulkInvitations', {
//         success: successCount,
//         failed: failedCount,
//       });

//       return {
//         success: true,
//         data: {
//           success: successCount,
//           failed: failedCount,
//           results,
//         },
//       };
//     } catch (error: any) {
//       ApiLogger.error('MatchInvitationService', 'sendBulkInvitations', error);
//       return {
//         success: false,
//         error: {
//           code: 'BULK_INVITATION_ERROR',
//           message: error.message || 'Toplu davet gönderilirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 2. INVITATION RESPONSES
//   // ============================================

//   /**
//    * Accept invitation
//    */
//   static async acceptInvitation(
//     invitationId: string,
//     userId: string
//   ): Promise<ApiResponse<IMatchInvitation>> {
//     try {
//       ApiLogger.log('MatchInvitationService', 'acceptInvitation', {
//         invitationId,
//         userId,
//       });

//       // Get invitation
//       const invitationResult = await matchInvitationsAPI.getById(invitationId);

//       if (!invitationResult.success || !invitationResult.data) {
//         return {
//           success: false,
//           error: invitationResult.error || {
//             code: 'INVITATION_NOT_FOUND',
//             message: 'Davet bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       const invitation = invitationResult.data;

//       // Verify user is the invitee
//       if (invitation.inviteeId !== userId) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Bu daveti sadece davet edilen oyuncu kabul edebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       // Check if invitation is pending
//       if (invitation.status !== 'pending') {
//         return {
//           success: false,
//           error: {
//             code: 'INVALID_STATUS',
//             message: `Davet zaten ${invitation.status} durumunda`,
//             statusCode: 400,
//           },
//         };
//       }

//       // Check if invitation is expired
//       if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
//         // Mark as expired
//         await matchInvitationsAPI.expireInvitation(invitationId);
        
//         return {
//           success: false,
//           error: {
//             code: 'INVITATION_EXPIRED',
//             message: 'Davetin süresi dolmuş',
//             statusCode: 400,
//           },
//         };
//       }

//       // Get match to verify it's still valid
//       const matchResult = await matchAPI.getById(invitation.matchId);

//       if (!matchResult.success || !matchResult.data) {
//         return {
//           success: false,
//           error: {
//             code: 'MATCH_NOT_FOUND',
//             message: 'Maç bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       const match = matchResult.data;

//       // Check if match is still accepting players
//       if (match.status !== MatchStatus.CREATED && match.status !== MatchStatus.REGISTRATION_OPEN) {
//         return {
//           success: false,
//           error: {
//             code: 'MATCH_NOT_ACCEPTING',
//             message: 'Maç artık oyuncu kabul etmiyor',
//             statusCode: 400,
//           },
//         };
//       }

//       // Accept invitation
//       const result = await matchInvitationsAPI.acceptInvitation(invitationId);

//       if (result.success) {
//         // Add player to match (handled by MatchService separately)
//         ApiLogger.success('MatchInvitationService', 'acceptInvitation', {
//           invitationId,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('MatchInvitationService', 'acceptInvitation', error);
//       return {
//         success: false,
//         error: {
//           code: 'ACCEPT_ERROR',
//           message: error.message || 'Davet kabul edilirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Decline invitation
//    */
//   static async declineInvitation(
//     invitationId: string,
//     userId: string
//   ): Promise<ApiResponse<IMatchInvitation>> {
//     try {
//       ApiLogger.log('MatchInvitationService', 'declineInvitation', {
//         invitationId,
//         userId,
//       });

//       // Get invitation
//       const invitationResult = await matchInvitationsAPI.getById(invitationId);

//       if (!invitationResult.success || !invitationResult.data) {
//         return {
//           success: false,
//           error: invitationResult.error || {
//             code: 'INVITATION_NOT_FOUND',
//             message: 'Davet bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       const invitation = invitationResult.data;

//       // Verify user is the invitee
//       if (invitation.inviteeId !== userId) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Bu daveti sadece davet edilen oyuncu reddedebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       // Check if invitation is pending
//       if (invitation.status !== 'pending') {
//         return {
//           success: false,
//           error: {
//             code: 'INVALID_STATUS',
//             message: `Davet zaten ${invitation.status} durumunda`,
//             statusCode: 400,
//           },
//         };
//       }

//       const result = await matchInvitationsAPI.declineInvitation(invitationId);

//       if (result.success) {
//         ApiLogger.success('MatchInvitationService', 'declineInvitation', {
//           invitationId,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('MatchInvitationService', 'declineInvitation', error);
//       return {
//         success: false,
//         error: {
//           code: 'DECLINE_ERROR',
//           message: error.message || 'Davet reddedilirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Cancel invitation (by inviter)
//    */
//   static async cancelInvitation(
//     invitationId: string,
//     userId: string
//   ): Promise<ApiResponse<void>> {
//     try {
//       ApiLogger.log('MatchInvitationService', 'cancelInvitation', {
//         invitationId,
//         userId,
//       });

//       // Get invitation
//       const invitationResult = await matchInvitationsAPI.getById(invitationId);

//       if (!invitationResult.success || !invitationResult.data) {
//         return {
//           success: false,
//           error: invitationResult.error || {
//             code: 'INVITATION_NOT_FOUND',
//             message: 'Davet bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       const invitation = invitationResult.data;

//       // Verify user is the inviter
//       if (invitation.inviterId !== userId) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Bu daveti sadece gönderen oyuncu iptal edebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await matchInvitationsAPI.cancelInvitation(invitationId);

//       if (result.success) {
//         ApiLogger.success('MatchInvitationService', 'cancelInvitation', {
//           invitationId,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('MatchInvitationService', 'cancelInvitation', error);
//       return {
//         success: false,
//         error: {
//           code: 'CANCEL_ERROR',
//           message: error.message || 'Davet iptal edilirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 3. QUERY OPERATIONS
//   // ============================================

//   /**
//    * Get invitation by ID
//    */
//   static async getInvitation(invitationId: string): Promise<ApiResponse<IMatchInvitation>> {
//     return matchInvitationsAPI.getById(invitationId);
//   }

//   /**
//    * Get invitations for a match
//    */
//   static async getMatchInvitations(matchId: string): Promise<ApiResponse<IMatchInvitation[]>> {
//     return matchInvitationsAPI.getByMatchId(matchId);
//   }

//   /**
//    * Get pending invitations for a match
//    */
//   static async getPendingMatchInvitations(
//     matchId: string
//   ): Promise<ApiResponse<IMatchInvitation[]>> {
//     return matchInvitationsAPI.getPendingByMatchId(matchId);
//   }

//   /**
//    * Get invitations sent by user
//    */
//   static async getSentInvitations(userId: string): Promise<ApiResponse<IMatchInvitation[]>> {
//     return matchInvitationsAPI.getByInviterId(userId);
//   }

//   /**
//    * Get invitations received by user
//    */
//   static async getReceivedInvitations(
//     userId: string
//   ): Promise<ApiResponse<IMatchInvitation[]>> {
//     return matchInvitationsAPI.getByInviteeId(userId);
//   }

//   /**
//    * Get pending invitations for user
//    */
//   static async getPendingInvitations(
//     userId: string
//   ): Promise<ApiResponse<IMatchInvitation[]>> {
//     return matchInvitationsAPI.getPendingByInviteeId(userId);
//   }

//   /**
//    * Get invitations with filters
//    */
//   static async getInvitationsFiltered(filters: {
//     matchId?: string;
//     inviterId?: string;
//     inviteeId?: string;
//     status?: 'pending' | 'accepted' | 'declined' | 'expired';
//     matchType?: MatchType;
//     limit?: number;
//   }): Promise<ApiResponse<IMatchInvitation[]>> {
//     return matchInvitationsAPI.getInvitationsFiltered(filters);
//   }

//   /**
//    * Check if user has been invited to match
//    */
//   static async hasUserBeenInvited(
//     matchId: string,
//     userId: string
//   ): Promise<ApiResponse<boolean>> {
//     return matchInvitationsAPI.hasUserBeenInvited(matchId, userId);
//   }

//   // ============================================
//   // 4. STATISTICS & ANALYTICS
//   // ============================================

//   /**
//    * Get invitation statistics for user
//    */
//   static async getInvitationStats(userId: string): Promise<ApiResponse<{
//     sent: number;
//     received: number;
//     accepted: number;
//     declined: number;
//     pending: number;
//     acceptanceRate: number;
//   }>> {
//     try {
//       const statsResult = await matchInvitationsAPI.getInvitationStats(userId);

//       if (!statsResult.success || !statsResult.data) {
//         return {
//           success: false,
//           error: statsResult.error || {
//             code: 'GET_STATS_ERROR',
//             message: 'İstatistikler alınamadı',
//             statusCode: 500,
//           },
//         };
//       }

//       const stats = statsResult.data;
//       const acceptanceRate = stats.received > 0
//         ? (stats.accepted / stats.received) * 100
//         : 0;

//       return {
//         success: true,
//         data: {
//           ...stats,
//           acceptanceRate,
//         },
//       };
//     } catch (error: any) {
//       return {
//         success: false,
//         error: {
//           code: 'GET_STATS_ERROR',
//           message: error.message || 'İstatistikler alınırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Get match invitation summary
//    */
//   static async getMatchInvitationSummary(matchId: string): Promise<ApiResponse<{
//     total: number;
//     pending: number;
//     accepted: number;
//     declined: number;
//     expired: number;
//     acceptanceRate: number;
//   }>> {
//     try {
//       const invitationsResult = await matchInvitationsAPI.getByMatchId(matchId);

//       if (!invitationsResult.success || !invitationsResult.data) {
//         return {
//           success: false,
//           error: invitationsResult.error || {
//             code: 'GET_SUMMARY_ERROR',
//             message: 'Özet alınamadı',
//             statusCode: 500,
//           },
//         };
//       }

//       const invitations = invitationsResult.data;

//       const total = invitations.length;
//       const pending = invitations.filter(i => i.status === 'pending').length;
//       const accepted = invitations.filter(i => i.status === 'accepted').length;
//       const declined = invitations.filter(i => i.status === 'declined').length;
//       const expired = invitations.filter(i => i.status === 'expired').length;
      
//       const responded = accepted + declined;
//       const acceptanceRate = responded > 0 ? (accepted / responded) * 100 : 0;

//       return {
//         success: true,
//         data: {
//           total,
//           pending,
//           accepted,
//           declined,
//           expired,
//           acceptanceRate,
//         },
//       };
//     } catch (error: any) {
//       return {
//         success: false,
//         error: {
//           code: 'GET_SUMMARY_ERROR',
//           message: error.message || 'Özet alınırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 5. ADMIN OPERATIONS
//   // ============================================

//   /**
//    * Expire all pending invitations for a match
//    */
//   static async expireMatchInvitations(
//     matchId: string,
//     userId: string
//   ): Promise<ApiResponse<void>> {
//     try {
//       ApiLogger.log('MatchInvitationService', 'expireMatchInvitations', {
//         matchId,
//         userId,
//       });

//       // Get match to check permissions
//       const matchResult = await matchAPI.getById(matchId);

//       if (!matchResult.success || !matchResult.data) {
//         return {
//           success: false,
//           error: matchResult.error || {
//             code: 'MATCH_NOT_FOUND',
//             message: 'Maç bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       const match = matchResult.data;

//       // Check if user is league admin
//       if (match.leagueId) {
//         const isAdminCheck = await leagueAPI.isAdmin(match.leagueId, userId);
//         if (!isAdminCheck.success || !isAdminCheck.data) {
//           return {
//             success: false,
//             error: {
//               code: 'UNAUTHORIZED',
//               message: 'Davetleri iptal etme yetkiniz yok',
//               statusCode: 403,
//             },
//           };
//         }
//       }

//       const result = await matchInvitationsAPI.expirePendingInvitations(matchId);

//       if (result.success) {
//         ApiLogger.success('MatchInvitationService', 'expireMatchInvitations', {
//           matchId,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('MatchInvitationService', 'expireMatchInvitations', error);
//       return {
//         success: false,
//         error: {
//           code: 'EXPIRE_ERROR',
//           message: error.message || 'Davetler iptal edilirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Delete all invitations for a match
//    */
//   static async deleteMatchInvitations(
//     matchId: string,
//     userId: string
//   ): Promise<ApiResponse<void>> {
//     try {
//       ApiLogger.log('MatchInvitationService', 'deleteMatchInvitations', {
//         matchId,
//         userId,
//       });

//       // Get match to check permissions
//       const matchResult = await matchAPI.getById(matchId);

//       if (!matchResult.success || !matchResult.data) {
//         return {
//           success: false,
//           error: matchResult.error || {
//             code: 'MATCH_NOT_FOUND',
//             message: 'Maç bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       const match = matchResult.data;

//       // Check if user is league admin
//       if (match.leagueId) {
//         const isAdminCheck = await leagueAPI.isAdmin(match.leagueId, userId);
//         if (!isAdminCheck.success || !isAdminCheck.data) {
//           return {
//             success: false,
//             error: {
//               code: 'UNAUTHORIZED',
//               message: 'Davetleri silme yetkiniz yok',
//               statusCode: 403,
//             },
//           };
//         }
//       }

//       const result = await matchInvitationsAPI.deleteByMatchId(matchId);

//       if (result.success) {
//         ApiLogger.success('MatchInvitationService', 'deleteMatchInvitations', {
//           matchId,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('MatchInvitationService', 'deleteMatchInvitations', error);
//       return {
//         success: false,
//         error: {
//           code: 'DELETE_ERROR',
//           message: error.message || 'Davetler silinirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Cleanup expired invitations (cron job)
//    */
//   static async cleanupExpiredInvitations(): Promise<ApiResponse<{
//     cleaned: number;
//   }>> {
//     try {
//       ApiLogger.log('MatchInvitationService', 'cleanupExpiredInvitations', {});

//       const result = await matchInvitationsAPI.cleanupExpiredInvitations();

//       if (result.success) {
//         ApiLogger.success('MatchInvitationService', 'cleanupExpiredInvitations', {
//           cleaned: result.data,
//         });

//         return {
//           success: true,
//           data: {
//             cleaned: result.data || 0,
//           },
//         };
//       }

//       return {
//         success: false,
//         error: result.error || {
//           code: 'CLEANUP_ERROR',
//           message: 'Temizleme başarısız',
//           statusCode: 500,
//         },
//       };
//     } catch (error: any) {
//       ApiLogger.error('MatchInvitationService', 'cleanupExpiredInvitations', error);
//       return {
//         success: false,
//         error: {
//           code: 'CLEANUP_ERROR',
//           message: error.message || 'Temizleme sırasında hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 6. HELPER METHODS
//   // ============================================

//   /**
//    * Check if invitation is expired
//    */
//   static isExpired(invitation: IMatchInvitation): boolean {
//     if (!invitation.expiresAt) return false;
//     return new Date(invitation.expiresAt) < new Date();
//   }

//   /**
//    * Get invitation status display
//    */
//   static getStatusDisplay(status: IMatchInvitation['status']): {
//     label: string;
//     icon: string;
//     color: string;
//   } {
//     switch (status) {
//       case 'pending':
//         return { label: 'Bekliyor', icon: '⏳', color: 'yellow' };
//       case 'accepted':
//         return { label: 'Kabul Edildi', icon: '✅', color: 'green' };
//       case 'declined':
//         return { label: 'Reddedildi', icon: '❌', color: 'red' };
//       case 'expired':
//         return { label: 'Süresi Doldu', icon: '⌛', color: 'gray' };
//     }
//   }

//   /**
//    * Get time until expiration
//    */
//   static getTimeUntilExpiration(invitation: IMatchInvitation): string | null {
//     if (!invitation.expiresAt) return null;

//     const now = new Date();
//     const expires = new Date(invitation.expiresAt);
//     const diffMs = expires.getTime() - now.getTime();

//     if (diffMs <= 0) return 'Süresi doldu';

//     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
//     const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

//     if (diffHours > 0) {
//       return `${diffHours} saat ${diffMins} dakika kaldı`;
//     } else {
//       return `${diffMins} dakika kaldı`;
//     }
//   }

//   /**
//    * Format invitation for display
//    */
//   static formatInvitation(invitation: IMatchInvitation): {
//     id: string;
//     matchId: string;
//     inviter: string;
//     invitee: string;
//     status: ReturnType<typeof MatchInvitationService.getStatusDisplay>;
//     message?: string;
//     sentAt: string;
//     expiresIn?: string;
//     isExpired: boolean;
//   } {
//     return {
//       id: invitation.id,
//       matchId: invitation.matchId,
//       inviter: invitation.inviterName,
//       invitee: invitation.inviteeName,
//       status: this.getStatusDisplay(invitation.status),
//       message: invitation.message,
//       sentAt: invitation.sentAt,
//       expiresIn: this.getTimeUntilExpiration(invitation) || undefined,
//       isExpired: this.isExpired(invitation),
//     };
//   }
// }

// export default MatchInvitationService;