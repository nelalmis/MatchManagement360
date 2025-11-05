// // ============================================
// // api/MatchInvitationsAPI.ts
// // ============================================
// import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
// import { ApiLogger } from '../base/ApiLogger';
// import { IMatchInvitation, MatchType } from '../../types/entity/types';

// // ============================================
// // API CLASS
// // ============================================
// export class MatchInvitationsAPI extends BaseAPI<IMatchInvitation> {
//     constructor() {
//         super('match_invitations');
//     }

//     // ============================================
//     // SPECIALIZED QUERIES
//     // ============================================

//     async getByMatchId(matchId: string): Promise<ApiResponse<IMatchInvitation[]>> {
//         return this.getAll({
//             where: [{ field: 'matchId', operator: '==', value: matchId }],
//             orderBy: [{ field: 'sentAt', direction: 'desc' }],
//         });
//     }

//     async getByInviterId(inviterId: string): Promise<ApiResponse<IMatchInvitation[]>> {
//         return this.getAll({
//             where: [{ field: 'inviterId', operator: '==', value: inviterId }],
//             orderBy: [{ field: 'sentAt', direction: 'desc' }],
//         });
//     }

//     async getByInviteeId(inviteeId: string): Promise<ApiResponse<IMatchInvitation[]>> {
//         return this.getAll({
//             where: [{ field: 'inviteeId', operator: '==', value: inviteeId }],
//             orderBy: [{ field: 'sentAt', direction: 'desc' }],
//         });
//     }

//     async getPendingByInviteeId(inviteeId: string): Promise<ApiResponse<IMatchInvitation[]>> {
//         return this.getAll({
//             where: [
//                 { field: 'inviteeId', operator: '==', value: inviteeId },
//                 { field: 'status', operator: '==', value: 'pending' },
//             ],
//             orderBy: [{ field: 'sentAt', direction: 'desc' }],
//         });
//     }

//     async getPendingByMatchId(matchId: string): Promise<ApiResponse<IMatchInvitation[]>> {
//         return this.getAll({
//             where: [
//                 { field: 'matchId', operator: '==', value: matchId },
//                 { field: 'status', operator: '==', value: 'pending' },
//             ],
//             orderBy: [{ field: 'sentAt', direction: 'desc' }],
//         });
//     }

//     async getByStatus(
//         status: 'pending' | 'accepted' | 'declined' | 'expired',
//         limitCount?: number
//     ): Promise<ApiResponse<IMatchInvitation[]>> {
//         return this.getAll({
//             where: [{ field: 'status', operator: '==', value: status }],
//             orderBy: [{ field: 'sentAt', direction: 'desc' }],
//             limit: limitCount || 50,
//         });
//     }

//     async getInvitationBetweenUsers(
//         matchId: string,
//         inviterId: string,
//         inviteeId: string
//     ): Promise<ApiResponse<IMatchInvitation | null>> {
//         const result = await this.getAll({
//             where: [
//                 { field: 'matchId', operator: '==', value: matchId },
//                 { field: 'inviterId', operator: '==', value: inviterId },
//                 { field: 'inviteeId', operator: '==', value: inviteeId },
//             ],
//             limit: 1,
//         });

//         if (!result.success || !result.data || result.data.length === 0) {
//             return {
//                 success: true,
//                 data: null,
//             };
//         }

//         return {
//             success: true,
//             data: result.data[0],
//         };
//     }

//     // ============================================
//     // INVITATION ACTIONS
//     // ============================================

//     async createInvitation(
//         invitationData: Omit<IMatchInvitation, 'id' | 'sentAt' | 'respondedAt' | 'createdAt' | 'updatedAt'>
//     ): Promise<ApiResponse<IMatchInvitation>> {
//         try {
//             // Check if invitation already exists
//             const existingResult = await this.getInvitationBetweenUsers(
//                 invitationData.matchId,
//                 invitationData.inviterId,
//                 invitationData.inviteeId
//             );

//             if (!existingResult.success) {
//                 return existingResult as ApiResponse<IMatchInvitation>;
//             }

//             if (existingResult.data) {
//                 return {
//                     success: false,
//                     error: {
//                         code: 'ALREADY_EXISTS',
//                         message: 'Invitation already exists for this match and user',
//                         statusCode: 409,
//                     },
//                 };
//             }

//             const dataToCreate = {
//                 ...invitationData,
//                 sentAt: new Date().toISOString(),
//                 status: invitationData.status || 'pending',
//             };

//             return this.create(dataToCreate);
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'createInvitation', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'CREATE_ERROR',
//                     message: error.message || 'Failed to create invitation',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     async acceptInvitation(id: string): Promise<ApiResponse<IMatchInvitation>> {
//         return this.update(id, {
//             status: 'accepted',
//             respondedAt: new Date().toISOString(),
//         });
//     }

//     async declineInvitation(id: string): Promise<ApiResponse<IMatchInvitation>> {
//         return this.update(id, {
//             status: 'declined',
//             respondedAt: new Date().toISOString(),
//         });
//     }

//     async expireInvitation(id: string): Promise<ApiResponse<IMatchInvitation>> {
//         return this.update(id, {
//             status: 'expired',
//         });
//     }

//     async cancelInvitation(id: string): Promise<ApiResponse<void>> {
//         try {
//             const invitationResult = await this.getById(id);

//             if (!invitationResult.success || !invitationResult.data) {
//                 return {
//                     success: false,
//                     error: invitationResult.error || {
//                         code: 'NOT_FOUND',
//                         message: 'Invitation not found',
//                         statusCode: 404,
//                     },
//                 };
//             }

//             if (invitationResult.data.status !== 'pending') {
//                 return {
//                     success: false,
//                     error: {
//                         code: 'INVALID_STATUS',
//                         message: 'Can only cancel pending invitations',
//                         statusCode: 400,
//                     },
//                 };
//             }

//             return this.delete(id);
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'cancelInvitation', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'CANCEL_ERROR',
//                     message: error.message || 'Failed to cancel invitation',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     // ============================================
//     // BATCH OPERATIONS
//     // ============================================

//     async createBulkInvitations(
//         invitations: Array<Omit<IMatchInvitation, 'id' | 'sentAt' | 'respondedAt' | 'createdAt' | 'updatedAt'>>
//     ): Promise<ApiResponse<IMatchInvitation[]>> {
//         try {
//             const sentAt = new Date().toISOString();

//             const invitationsWithTimestamp = invitations.map((inv) => ({
//                 ...inv,
//                 sentAt,
//                 status: inv.status || 'pending',
//             }));

//             return this.createBatch(invitationsWithTimestamp);
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'createBulkInvitations', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'BULK_CREATE_ERROR',
//                     message: error.message || 'Failed to create bulk invitations',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     async expirePendingInvitations(matchId: string): Promise<ApiResponse<void>> {
//         try {
//             const pendingResult = await this.getPendingByMatchId(matchId);

//             if (!pendingResult.success || !pendingResult.data) {
//                 return {
//                     success: false,
//                     error: pendingResult.error || {
//                         code: 'QUERY_ERROR',
//                         message: 'Failed to get pending invitations',
//                         statusCode: 500,
//                     },
//                 };
//             }

//             if (pendingResult.data.length === 0) {
//                 return { success: true };
//             }

//             const updates = pendingResult.data
//                 .filter(inv => inv.id)
//                 .map((inv) => ({
//                     id: inv.id!,
//                     data: { status: 'expired' as const },
//                 }));

//             return this.updateBatch(updates);
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'expirePendingInvitations', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'EXPIRE_ERROR',
//                     message: error.message || 'Failed to expire pending invitations',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     async deleteByMatchId(matchId: string): Promise<ApiResponse<void>> {
//         try {
//             const invitationsResult = await this.getByMatchId(matchId);

//             if (!invitationsResult.success || !invitationsResult.data) {
//                 return {
//                     success: false,
//                     error: invitationsResult.error || {
//                         code: 'QUERY_ERROR',
//                         message: 'Failed to get invitations',
//                         statusCode: 500,
//                     },
//                 };
//             }

//             if (invitationsResult.data.length === 0) {
//                 return { success: true };
//             }

//             const ids = invitationsResult.data
//                 .filter(inv => inv.id)
//                 .map((inv) => inv.id!);

//             return this.deleteBatch(ids);
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'deleteByMatchId', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'DELETE_ERROR',
//                     message: error.message || 'Failed to delete invitations',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     // ============================================
//     // STATISTICS & ANALYTICS
//     // ============================================

//     async getInvitationStats(userId: string): Promise<ApiResponse<{
//         sent: number;
//         received: number;
//         accepted: number;
//         declined: number;
//         pending: number;
//     }>> {
//         try {
//             const [sentResult, receivedResult] = await Promise.all([
//                 this.getByInviterId(userId),
//                 this.getByInviteeId(userId),
//             ]);

//             if (!sentResult.success || !receivedResult.success) {
//                 return {
//                     success: false,
//                     error: {
//                         code: 'STATS_ERROR',
//                         message: 'Failed to get invitation stats',
//                         statusCode: 500,
//                     },
//                 };
//             }

//             const sent = sentResult.data || [];
//             const received = receivedResult.data || [];

//             const stats = {
//                 sent: sent.length,
//                 received: received.length,
//                 accepted: received.filter((inv) => inv.status === 'accepted').length,
//                 declined: received.filter((inv) => inv.status === 'declined').length,
//                 pending: received.filter((inv) => inv.status === 'pending').length,
//             };

//             return {
//                 success: true,
//                 data: stats,
//             };
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'getInvitationStats', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'STATS_ERROR',
//                     message: error.message || 'Failed to get invitation stats',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     async hasUserBeenInvited(matchId: string, userId: string): Promise<ApiResponse<boolean>> {
//         try {
//             const result = await this.getAll({
//                 where: [
//                     { field: 'matchId', operator: '==', value: matchId },
//                     { field: 'inviteeId', operator: '==', value: userId },
//                 ],
//                 limit: 1,
//             });

//             if (!result.success) {
//                 return {
//                     success: false,
//                     error: result.error || {
//                         code: 'CHECK_ERROR',
//                         message: 'Failed to check invitation',
//                         statusCode: 500,
//                     },
//                 };
//             }

//             return {
//                 success: true,
//                 data: result.data !== undefined && result.data.length > 0,
//             };
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'hasUserBeenInvited', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'CHECK_ERROR',
//                     message: error.message || 'Failed to check invitation',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     // ============================================
//     // EXPIRED INVITATIONS CLEANUP
//     // ============================================

//     async cleanupExpiredInvitations(): Promise<ApiResponse<number>> {
//         try {
//             const now = new Date().toISOString();

//             const expiredResult = await this.getAll({
//                 where: [
//                     { field: 'status', operator: '==', value: 'pending' },
//                     { field: 'expiresAt', operator: '<=', value: now },
//                 ],
//             });

//             if (!expiredResult.success || !expiredResult.data) {
//                 return {
//                     success: false,
//                     error: expiredResult.error || {
//                         code: 'CLEANUP_ERROR',
//                         message: 'Failed to get expired invitations',
//                         statusCode: 500,
//                     },
//                 };
//             }

//             if (expiredResult.data.length === 0) {
//                 return { success: true, data: 0 };
//             }

//             const updates = expiredResult.data
//                 .filter(inv => inv.id)
//                 .map((inv) => ({
//                     id: inv.id!,
//                     data: { status: 'expired' as const },
//                 }));

//             const updateResult = await this.updateBatch(updates);

//             if (!updateResult.success) {
//                 return {
//                     success: false,
//                     error: updateResult.error || {
//                         code: 'CLEANUP_ERROR',
//                         message: 'Failed to update expired invitations',
//                         statusCode: 500,
//                     },
//                 };
//             }

//             return {
//                 success: true,
//                 data: expiredResult.data.length,
//             };
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'cleanupExpiredInvitations', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'CLEANUP_ERROR',
//                     message: error.message || 'Failed to cleanup expired invitations',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     // ============================================
//     // ADVANCED QUERIES
//     // ============================================

//     async getInvitationsFiltered(filters: {
//         matchId?: string;
//         inviterId?: string;
//         inviteeId?: string;
//         status?: 'pending' | 'accepted' | 'declined' | 'expired';
//         matchType?: MatchType;
//         limit?: number;
//     }): Promise<ApiResponse<IMatchInvitation[]>> {
//         try {
//             const queryOptions: QueryOptions = {
//                 limit: filters.limit || 50,
//                 orderBy: [{ field: 'sentAt', direction: 'desc' }],
//             };

//             const whereConditions: Array<{
//                 field: string;
//                 operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not-in' | 'array-contains' | 'array-contains-any';
//                 value: any;
//             }> = [];

//             if (filters.matchId) {
//                 whereConditions.push({ field: 'matchId', operator: '==', value: filters.matchId });
//             }
//             if (filters.inviterId) {
//                 whereConditions.push({ field: 'inviterId', operator: '==', value: filters.inviterId });
//             }
//             if (filters.inviteeId) {
//                 whereConditions.push({ field: 'inviteeId', operator: '==', value: filters.inviteeId });
//             }
//             if (filters.status) {
//                 whereConditions.push({ field: 'status', operator: '==', value: filters.status });
//             }
//             if (filters.matchType) {
//                 whereConditions.push({ field: 'matchType', operator: '==', value: filters.matchType });
//             }

//             if (whereConditions.length > 0) {
//                 queryOptions.where = whereConditions;
//             }

//             return this.getAll(queryOptions);
//         } catch (error: any) {
//             ApiLogger.error('invitations', 'getInvitationsFiltered', error);
//             return {
//                 success: false,
//                 error: {
//                     code: 'FILTER_ERROR',
//                     message: error.message || 'Failed to filter invitations',
//                     details: error,
//                     statusCode: 500,
//                 },
//             };
//         }
//     }

//     async getRecentInvitations(limitCount: number = 20): Promise<ApiResponse<IMatchInvitation[]>> {
//         return this.getAll({
//             orderBy: [{ field: 'sentAt', direction: 'desc' }],
//             limit: limitCount,
//         });
//     }
// }

// // Export singleton instance
// export const matchInvitationsAPI = new MatchInvitationsAPI();