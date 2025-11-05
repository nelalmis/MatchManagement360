// // ============================================
// // services/LeagueInvitationService.ts
// // ============================================
// import { leagueInvitationAPI } from '../../api/apiLayer/leagueInvitationAPI';
// import { playerAPI } from '../../api/apiLayer/playerAPI';
// import { ApiResponse } from '../../api/base/BaseAPI';
// import { 
//   ILeagueInvitation, 
//   IGenerateInviteOptions, 
//   IJoinLeagueRequest,
//   IInviteValidation,
//   ILeagueInvitationUse,
// } from '../../types/entity/types';
// import { ApiLogger } from '../../api/base/ApiLogger';
// import { leagueAPI } from '../../api/apiLayer/leagueAPI';

// export class LeagueInvitationService {
//   // ============================================
//   // 1. CREATE INVITATION
//   // ============================================

//   /**
//    * Generate invitation code for league
//    */
//   static async generateInvite(
//     options: IGenerateInviteOptions
//   ): Promise<ApiResponse<ILeagueInvitation>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'generateInvite', {
//         leagueId: options.leagueId,
//         creatorId: options.creatorId,
//       });

//       // Check if creator is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(options.leagueId, options.creatorId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri davet kodu oluşturabilir',
//             statusCode: 403,
//           },
//         };
//       }

//       // Validate league exists
//       const leagueCheck = await leagueAPI.exists(options.leagueId);
//       if (!leagueCheck.success || !leagueCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'LEAGUE_NOT_FOUND',
//             message: 'Lig bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       // Generate invitation
//       const result = await leagueInvitationAPI.createInvitation(options);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'generateInvite', {
//           code: result.data?.code,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'generateInvite', error);
//       return {
//         success: false,
//         error: {
//           code: 'GENERATE_INVITE_ERROR',
//           message: error.message || 'Davet kodu oluşturulurken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 2. VALIDATE & JOIN
//   // ============================================

//   /**
//    * Validate invitation code and get league info
//    */
//   static async validateInvite(
//     code: string,
//     userId: string
//   ): Promise<ApiResponse<IInviteValidation>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'validateInvite', {
//         code: code.substring(0, 4) + '****',
//         userId,
//       });

//       // Get invitation by code
//       const inviteResult = await leagueInvitationAPI.getByCode(code);

//       if (!inviteResult.success) {
//         return {
//           success: true,
//           data: {
//             valid: false,
//             error: {
//               code: 'INVALID_CODE',
//               message: 'Geçersiz davet kodu',
//             },
//           },
//         };
//       }

//       if (!inviteResult.data) {
//         return {
//           success: true,
//           data: {
//             valid: false,
//             error: {
//               code: 'INVALID_CODE',
//               message: 'Davet kodu bulunamadı',
//             },
//           },
//         };
//       }

//       const invitation = inviteResult.data;

//       // Check if active
//       if (!invitation.isActive) {
//         return {
//           success: true,
//           data: {
//             valid: false,
//             invitation,
//             error: {
//               code: 'INACTIVE',
//               message: 'Bu davet kodu devre dışı bırakılmış',
//             },
//           },
//         };
//       }

//       // Check expiry
//       if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
//         return {
//           success: true,
//           data: {
//             valid: false,
//             invitation,
//             error: {
//               code: 'EXPIRED',
//               message: 'Bu davet kodunun süresi dolmuş',
//             },
//           },
//         };
//       }

//       // Check max uses
//       if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
//         return {
//           success: true,
//           data: {
//             valid: false,
//             invitation,
//             error: {
//               code: 'MAX_USES_REACHED',
//               message: 'Bu davet kodu maksimum kullanım sayısına ulaştı',
//             },
//           },
//         };
//       }

//       // Get league info
//       const leagueResult = await leagueAPI.getById(invitation.leagueId);
//       if (!leagueResult.success || !leagueResult.data) {
//         return {
//           success: true,
//           data: {
//             valid: false,
//             invitation,
//             error: {
//               code: 'INVALID_CODE',
//               message: 'Lig bulunamadı',
//             },
//           },
//         };
//       }

//       const league = leagueResult.data;

//       // Check if already member
//       if (league.members.all.includes(userId)) {
//         return {
//           success: true,
//           data: {
//             valid: false,
//             invitation,
//             error: {
//               code: 'ALREADY_MEMBER',
//               message: 'Zaten bu ligin üyesisiniz',
//             },
//           },
//         };
//       }

//       // Increment view count
//       await leagueInvitationAPI.incrementViews(invitation.id!);

//       // Return valid with league info
//       return {
//         success: true,
//         data: {
//           valid: true,
//           invitation,
//           league: {
//             id: league.id!,
//             title: league.title,
//             sportType: league.sportType,
//             logo: league.logo,
//             memberCount: league.totalMembers,
//           },
//         },
//       };
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'validateInvite', error);
//       return {
//         success: false,
//         error: {
//           code: 'VALIDATE_INVITE_ERROR',
//           message: error.message || 'Davet kodu doğrulanırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Join league with invitation code
//    */
//   static async joinLeague(
//     request: IJoinLeagueRequest
//   ): Promise<ApiResponse<{ leagueId: string; assignedRole?: string }>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'joinLeague', {
//         code: request.code.substring(0, 4) + '****',
//         userId: request.userId,
//       });

//       // Validate invite
//       const validationResult = await this.validateInvite(request.code, request.userId);

//       if (!validationResult.success || !validationResult.data) {
//         return {
//           success: false,
//           error: validationResult.error,
//         };
//       }

//       const validation = validationResult.data;

//       if (!validation.valid || !validation.invitation) {
//         return {
//           success: false,
//           error: validation.error || {
//             code: 'INVALID_CODE',
//             message: 'Geçersiz davet kodu',
//             statusCode: 400,
//           },
//         };
//       }

//       const invitation = validation.invitation;

//       // Increment attempt count
//       await leagueInvitationAPI.incrementAttempts(invitation.id!);

//       // Check if player exists
//       const playerCheck = await playerAPI.exists(request.userId);
//       if (!playerCheck.success || !playerCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'PLAYER_NOT_FOUND',
//             message: 'Oyuncu bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       // Add member to league
//       const addMemberResult = await leagueAPI.addMember(invitation.leagueId, request.userId);

//       if (!addMemberResult.success) {
//         return {
//           success: false,
//           error: addMemberResult.error || {
//             code: 'ADD_MEMBER_ERROR',
//             message: 'Üye eklenirken hata oluştu',
//             statusCode: 500,
//           },
//         };
//       }

//       // Assign role based on invitation metadata
//       const assignedRole = invitation.metadata.assignRole;

//       if (assignedRole === 'premium') {
//         await leagueAPI.addPremiumPlayer(invitation.leagueId, request.userId);
//       } else if (assignedRole === 'direct') {
//         await leagueAPI.addDirectPlayer(invitation.leagueId, request.userId);
//       }

//       // Record invitation use
//       await leagueInvitationAPI.recordUse(invitation.id!, {
//         leagueId: invitation.leagueId,
//         userId: request.userId,
//         joinedAt: new Date().toISOString(),
//         device: request.device || {
//           platform: 'web',
//         },
//         assignedRole,
//       });

//       ApiLogger.success('LeagueInvitationService', 'joinLeague', {
//         leagueId: invitation.leagueId,
//         userId: request.userId,
//         assignedRole,
//       });

//       return {
//         success: true,
//         data: {
//           leagueId: invitation.leagueId,
//           assignedRole,
//         },
//       };
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'joinLeague', error);
//       return {
//         success: false,
//         error: {
//           code: 'JOIN_LEAGUE_ERROR',
//           message: error.message || 'Lige katılırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 3. MANAGE INVITATIONS
//   // ============================================

//   /**
//    * Get all invitations for a league
//    */
//   static async getLeagueInvitations(
//     leagueId: string,
//     userId: string
//   ): Promise<ApiResponse<ILeagueInvitation[]>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'getLeagueInvitations', { leagueId, userId });

//       // Check if user is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri davet kodlarını görüntüleyebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.getByLeague(leagueId);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'getLeagueInvitations', {
//           count: result.data?.length,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'getLeagueInvitations', error);
//       return {
//         success: false,
//         error: {
//           code: 'GET_INVITATIONS_ERROR',
//           message: error.message || 'Davet kodları alınırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Get active invitations for a league
//    */
//   static async getActiveInvitations(
//     leagueId: string,
//     userId: string
//   ): Promise<ApiResponse<ILeagueInvitation[]>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'getActiveInvitations', { leagueId, userId });

//       // Check if user is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri davet kodlarını görüntüleyebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.getActiveByLeague(leagueId);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'getActiveInvitations', {
//           count: result.data?.length,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'getActiveInvitations', error);
//       return {
//         success: false,
//         error: {
//           code: 'GET_ACTIVE_ERROR',
//           message: error.message || 'Aktif davet kodları alınırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Deactivate invitation
//    */
//   static async deactivateInvite(
//     invitationId: string,
//     userId: string
//   ): Promise<ApiResponse<ILeagueInvitation>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'deactivateInvite', { invitationId, userId });

//       // Get invitation
//       const inviteResult = await leagueInvitationAPI.getById(invitationId);
//       if (!inviteResult.success || !inviteResult.data) {
//         return {
//           success: false,
//           error: {
//             code: 'INVITATION_NOT_FOUND',
//             message: 'Davet kodu bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       // Check if user is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.leagueId, userId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri davet kodunu devre dışı bırakabilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.deactivate(invitationId);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'deactivateInvite', { invitationId });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'deactivateInvite', error);
//       return {
//         success: false,
//         error: {
//           code: 'DEACTIVATE_INVITE_ERROR',
//           message: error.message || 'Davet kodu devre dışı bırakılırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Reactivate invitation
//    */
//   static async reactivateInvite(
//     invitationId: string,
//     userId: string
//   ): Promise<ApiResponse<ILeagueInvitation>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'reactivateInvite', { invitationId, userId });

//       // Get invitation
//       const inviteResult = await leagueInvitationAPI.getById(invitationId);
//       if (!inviteResult.success || !inviteResult.data) {
//         return {
//           success: false,
//           error: {
//             code: 'INVITATION_NOT_FOUND',
//             message: 'Davet kodu bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       // Check if user is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.leagueId, userId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri davet kodunu aktif edebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.reactivate(invitationId);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'reactivateInvite', { invitationId });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'reactivateInvite', error);
//       return {
//         success: false,
//         error: {
//           code: 'REACTIVATE_INVITE_ERROR',
//           message: error.message || 'Davet kodu aktif edilirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Delete invitation
//    */
//   static async deleteInvite(
//     invitationId: string,
//     userId: string
//   ): Promise<ApiResponse<void>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'deleteInvite', { invitationId, userId });

//       // Get invitation
//       const inviteResult = await leagueInvitationAPI.getById(invitationId);
//       if (!inviteResult.success || !inviteResult.data) {
//         return {
//           success: false,
//           error: {
//             code: 'INVITATION_NOT_FOUND',
//             message: 'Davet kodu bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       // Check if user is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.leagueId, userId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri davet kodunu silebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.delete(invitationId);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'deleteInvite', { invitationId });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'deleteInvite', error);
//       return {
//         success: false,
//         error: {
//           code: 'DELETE_INVITE_ERROR',
//           message: error.message || 'Davet kodu silinirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Update invitation metadata
//    */
//   static async updateInviteMetadata(
//     invitationId: string,
//     userId: string,
//     metadata: Partial<ILeagueInvitation['metadata']>
//   ): Promise<ApiResponse<ILeagueInvitation>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'updateInviteMetadata', { invitationId, userId });

//       // Get invitation
//       const inviteResult = await leagueInvitationAPI.getById(invitationId);
//       if (!inviteResult.success || !inviteResult.data) {
//         return {
//           success: false,
//           error: {
//             code: 'INVITATION_NOT_FOUND',
//             message: 'Davet kodu bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       // Check if user is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.leagueId, userId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri davet kodunu düzenleyebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.updateMetadata(invitationId, metadata);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'updateInviteMetadata', { invitationId });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'updateInviteMetadata', error);
//       return {
//         success: false,
//         error: {
//           code: 'UPDATE_METADATA_ERROR',
//           message: error.message || 'Davet kodu güncellenirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 4. USAGE TRACKING
//   // ============================================

//   /**
//    * Get invitation usage history
//    */
//   static async getInvitationUsage(
//     leagueInvitationId: string,
//     userId: string
//   ): Promise<ApiResponse<ILeagueInvitationUse[]>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'getInvitationUsage', { leagueInvitationId, userId });

//       // Get invitation
//       const inviteResult = await leagueInvitationAPI.getById(leagueInvitationId);
//       if (!inviteResult.success || !inviteResult.data) {
//         return {
//           success: false,
//           error: {
//             code: 'INVITATION_NOT_FOUND',
//             message: 'Davet kodu bulunamadı',
//             statusCode: 404,
//           },
//         };
//       }

//       // Check if user is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.leagueId, userId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri kullanım geçmişini görüntüleyebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.getUsageHistory(leagueInvitationId);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'getInvitationUsage', {
//           count: result.data?.length,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'getInvitationUsage', error);
//       return {
//         success: false,
//         error: {
//           code: 'GET_USAGE_ERROR',
//           message: error.message || 'Kullanım geçmişi alınırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   /**
//    * Get user's total usage across all league invitations
//    */
//   static async getUserLeagueUsage(
//     leagueId: string,
//     userId: string,
//     requesterId: string
//   ): Promise<ApiResponse<number>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'getUserLeagueUsage', {
//         leagueId,
//         userId,
//         requesterId,
//       });

//       // Check if requester is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(leagueId, requesterId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri kullanım istatistiklerini görüntüleyebilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.getUserUsageInLeague(leagueId, userId);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'getUserLeagueUsage', {
//           usageCount: result.data,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'getUserLeagueUsage', error);
//       return {
//         success: false,
//         error: {
//           code: 'GET_USER_USAGE_ERROR',
//           message: error.message || 'Kullanıcı istatistikleri alınırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 5. BULK OPERATIONS
//   // ============================================

//   /**
//    * Deactivate all invitations for a league
//    */
//   static async deactivateAllLeagueInvites(
//     leagueId: string,
//     userId: string
//   ): Promise<ApiResponse<number>> {
//     try {
//       ApiLogger.log('LeagueInvitationService', 'deactivateAllLeagueInvites', {
//         leagueId,
//         userId,
//       });

//       // Check if user is league admin
//       const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
//       if (!isAdminCheck.success || !isAdminCheck.data) {
//         return {
//           success: false,
//           error: {
//             code: 'UNAUTHORIZED',
//             message: 'Sadece lig yöneticileri tüm davet kodlarını devre dışı bırakabilir',
//             statusCode: 403,
//           },
//         };
//       }

//       const result = await leagueInvitationAPI.deactivateAllByLeague(leagueId);

//       if (result.success) {
//         ApiLogger.success('LeagueInvitationService', 'deactivateAllLeagueInvites', {
//           deactivatedCount: result.data,
//         });
//       }

//       return result;
//     } catch (error: any) {
//       ApiLogger.error('LeagueInvitationService', 'deactivateAllLeagueInvites', error);
//       return {
//         success: false,
//         error: {
//           code: 'DEACTIVATE_ALL_ERROR',
//           message: error.message || 'Tüm davet kodları devre dışı bırakılırken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }

//   // ============================================
//   // 6. VALIDATION HELPERS
//   // ============================================

//   /**
//    * Check if invitation is valid
//    */
//   static async checkInvitationValidity(
//     invitationId: string
//   ): Promise<ApiResponse<boolean>> {
//     try {
//       return await leagueInvitationAPI.isValid(invitationId);
//     } catch (error: any) {
//       return {
//         success: false,
//         error: {
//           code: 'CHECK_VALIDITY_ERROR',
//           message: error.message || 'Davet kodu geçerliliği kontrol edilirken hata oluştu',
//           details: error,
//           statusCode: 500,
//         },
//       };
//     }
//   }
// }

// export default LeagueInvitationService;