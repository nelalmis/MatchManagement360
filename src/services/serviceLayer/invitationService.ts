// ============================================
// services/InvitationService.ts - SEPARATE COLLECTIONS
// ============================================

import {
  leagueInvitationAPI,
  matchInvitationAPI,
  teamInvitationAPI,
  invitationSearchAPI,
} from '../../api/apiLayer/invitationAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import {
  ILeagueInvitation,
  IMatchInvitation,
  ITeamInvitation,
  IInvitationUse,
  InvitationType,
  InvitationStatus,
} from '../../types/entity/invitation';
import { ApiLogger } from '../../api/base/ApiLogger';
import { Timestamp } from 'firebase/firestore';
import { ApiResponse } from '../../api/base/BaseAPI';

// ============================================
// REQUEST TYPES
// ============================================

export interface IGenerateLeagueInviteOptions {
  leagueId: string;
  creatorId: string;
  description?: string;
  tags?: string[];
  assignRole?: 'member' | 'premium' | 'direct';
  autoApprove?: boolean;
  welcomeMessage?: string;
  expiresInDays?: number;
  maxUses?: number;
}

export interface IGenerateMatchInviteOptions {
  matchId: string;
  creatorId: string;
  matchType: 'FRIENDLY' | 'LEAGUE' | 'TOURNAMENT';
  description?: string;
  tags?: string[];
  allowGuests?: boolean;
  registrationType?: 'player' | 'reserve' | 'any';
  teamAssignment?: 'auto' | 'team1' | 'team2' | 'manual';
  maxPlayersPerInvite?: number;
  expiresInHours: number;
  maxUses: number;
}

export interface IGenerateTeamInviteOptions {
  teamId: string;
  creatorId: string;
  description?: string;
  tags?: string[];
  assignRole?: 'player' | 'coach' | 'staff';
  requireApproval?: boolean;
  requiredSkillLevel?: number;
  expiresInDays?: number;
  maxUses?: number;
}

export interface IJoinLeagueRequest {
  code: string;
  userId: string;
  device?: {
    platform: 'ios' | 'android' | 'web' | 'windows' | 'macos';
    model?: string;
    osVersion?: string;
  };
}

export interface IJoinMatchRequest {
  code: string;
  userId: string;
  device?: {
    platform: 'ios' | 'android' | 'web' | 'windows' | 'macos';
    model?: string;
    osVersion?: string;
  };
  guestInfo?: {
    fullName: string;
    phone?: string;
  };
}

export interface IInviteValidation {
  valid: boolean;
  invitation?: ILeagueInvitation | IMatchInvitation | ITeamInvitation;
  error?: {
    code: string;
    message: string;
  };
  league?: {
    id: string;
    title: string;
    sportType: string;
    logo?: string;
    memberCount: number;
  };
  match?: {
    id: string;
    title: string;
    sportType: string;
    matchDate: string;
    location?: string;
    registeredCount: number;
    totalSlots: number;
  };
}

// ============================================
// LEAGUE INVITATION SERVICE
// ============================================

export class LeagueInvitationService {
  // ============================================
  // 1. CREATE INVITATION
  // ============================================

  /**
   * Generate invitation code for league
   */
  static async generateInvite(
    options: IGenerateLeagueInviteOptions
  ): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'generateInvite', {
        leagueId: options.leagueId,
        creatorId: options.creatorId,
      });

      // Check if creator is league admin
      const isAdminCheck = await leagueAPI.isAdmin(options.leagueId, options.creatorId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri davet kodu oluşturabilir',
            statusCode: 403,
          },
        };
      }

      // Validate league exists
      const leagueCheck = await leagueAPI.exists(options.leagueId);
      if (!leagueCheck.success || !leagueCheck.data) {
        return {
          success: false,
          error: {
            code: 'LEAGUE_NOT_FOUND',
            message: 'Lig bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Generate invitation
      const result = await leagueInvitationAPI.createInvitation({
        leagueId: options.leagueId,
        createdBy: options.creatorId,
        description: options.description,
        tags: options.tags,
        assignRole: options.assignRole,
        autoApprove: options.autoApprove,
        welcomeMessage: options.welcomeMessage,
        expiresInDays: options.expiresInDays,
        maxUses: options.maxUses,
      });

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'generateInvite', {
          code: result.data?.code,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'generateInvite', error);
      return {
        success: false,
        error: {
          code: 'GENERATE_INVITE_ERROR',
          message: error.message || 'Davet kodu oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 2. VALIDATE & JOIN
  // ============================================

  /**
   * Validate invitation code and get league info
   */
  static async validateInvite(
    code: string,
    userId: string
  ): Promise<ApiResponse<IInviteValidation>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'validateInvite', {
        code: code.substring(0, 4) + '****',
        userId,
      });

      // Get invitation by code
      const inviteResult = await leagueInvitationAPI.getByCode(code);

      if (!inviteResult.success) {
        return {
          success: true,
          data: {
            valid: false,
            error: {
              code: 'INVALID_CODE',
              message: 'Geçersiz davet kodu',
            },
          },
        };
      }

      if (!inviteResult.data) {
        return {
          success: true,
          data: {
            valid: false,
            error: {
              code: 'INVALID_CODE',
              message: 'Davet kodu bulunamadı',
            },
          },
        };
      }

      const invitation = inviteResult.data;

      // Check if active
      if (invitation.status !== InvitationStatus.ACTIVE) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'INACTIVE',
              message: 'Bu davet kodu devre dışı bırakılmış',
            },
          },
        };
      }

      // Check expiry
      if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'EXPIRED',
              message: 'Bu davet kodunun süresi dolmuş',
            },
          },
        };
      }

      // Check max uses
      if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'MAX_USES_REACHED',
              message: 'Bu davet kodu maksimum kullanım sayısına ulaştı',
            },
          },
        };
      }

      // Get league info
      const leagueResult = await leagueAPI.getById(invitation.targetId);
      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'LEAGUE_NOT_FOUND',
              message: 'Lig bulunamadı',
            },
          },
        };
      }

      const league = leagueResult.data;

      // Check if already member
      if (league.members.all.includes(userId)) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'ALREADY_MEMBER',
              message: 'Zaten bu ligin üyesisiniz',
            },
          },
        };
      }

      // Increment view count
      await leagueInvitationAPI.incrementViews(invitation.id!);

      // Return valid with league info
      return {
        success: true,
        data: {
          valid: true,
          invitation,
          league: {
            id: league.id!,
            title: league.title,
            sportType: league.sportType,
            logo: league.logo,
            memberCount: league.totalMembers,
          },
        },
      };
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'validateInvite', error);
      return {
        success: false,
        error: {
          code: 'VALIDATE_INVITE_ERROR',
          message: error.message || 'Davet kodu doğrulanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Join league with invitation code
   */
  static async joinLeague(
    request: IJoinLeagueRequest
  ): Promise<ApiResponse<{ leagueId: string; assignedRole?: string }>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'joinLeague', {
        code: request.code.substring(0, 4) + '****',
        userId: request.userId,
      });

      // Validate invite
      const validationResult = await this.validateInvite(request.code, request.userId);

      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      const validation = validationResult.data;

      if (!validation.valid || !validation.invitation) {
        return {
          success: false,
          error: validation.error || {
            code: 'INVALID_CODE',
            message: 'Geçersiz davet kodu',
            statusCode: 400,
          },
        };
      }

      const invitation = validation.invitation as ILeagueInvitation;

      // Increment attempt count
      await leagueInvitationAPI.incrementAttempts(invitation.id!, true);

      // Check if player exists
      const playerCheck = await playerAPI.exists(request.userId);
      if (!playerCheck.success || !playerCheck.data) {
        return {
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Oyuncu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Add member to league
      const addMemberResult = await leagueAPI.addMember(invitation.targetId, request.userId);

      if (!addMemberResult.success) {
        return {
          success: false,
          error: addMemberResult.error || {
            code: 'ADD_MEMBER_ERROR',
            message: 'Üye eklenirken hata oluştu',
            statusCode: 500,
          },
        };
      }

      // Assign role based on invitation settings
      const assignedRole = invitation.leagueSettings.assignRole;

      if (assignedRole === 'premium') {
        await leagueAPI.addPremiumPlayer(invitation.targetId, request.userId);
      } else if (assignedRole === 'direct') {
        await leagueAPI.addDirectPlayer(invitation.targetId, request.userId);
      }

      // Record invitation use
      await leagueInvitationAPI.recordUse(invitation.id!, {
        type: InvitationType.LEAGUE,
        targetId: invitation.targetId,
        userId: request.userId,
        status: 'success',
        device: request.device || { platform: 'web' },
        leagueData: {
          assignedRole,
        },
      });

      ApiLogger.success('LeagueInvitationService', 'joinLeague', {
        leagueId: invitation.targetId,
        userId: request.userId,
        assignedRole,
      });

      return {
        success: true,
        data: {
          leagueId: invitation.targetId,
          assignedRole,
        },
      };
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'joinLeague', error);
      return {
        success: false,
        error: {
          code: 'JOIN_LEAGUE_ERROR',
          message: error.message || 'Lige katılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. MANAGE INVITATIONS
  // ============================================

  /**
   * Get all invitations for a league
   */
  static async getLeagueInvitations(
    leagueId: string,
    userId: string
  ): Promise<ApiResponse<ILeagueInvitation[]>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'getLeagueInvitations', { leagueId, userId });

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri davet kodlarını görüntüleyebilir',
            statusCode: 403,
          },
        };
      }

      const result = await leagueInvitationAPI.getByLeague(leagueId);

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'getLeagueInvitations', {
          count: result.data?.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'getLeagueInvitations', error);
      return {
        success: false,
        error: {
          code: 'GET_INVITATIONS_ERROR',
          message: error.message || 'Davet kodları alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get active invitations for a league
   */
  static async getActiveInvitations(
    leagueId: string,
    userId: string
  ): Promise<ApiResponse<ILeagueInvitation[]>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'getActiveInvitations', { leagueId, userId });

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri davet kodlarını görüntüleyebilir',
            statusCode: 403,
          },
        };
      }

      const result = await leagueInvitationAPI.getActiveByLeague(leagueId);

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'getActiveInvitations', {
          count: result.data?.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'getActiveInvitations', error);
      return {
        success: false,
        error: {
          code: 'GET_ACTIVE_ERROR',
          message: error.message || 'Aktif davet kodları alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Deactivate invitation
   */
  static async deactivateInvite(
    invitationId: string,
    userId: string
  ): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'deactivateInvite', { invitationId, userId });

      // Get invitation
      const inviteResult = await leagueInvitationAPI.getById(invitationId);
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Davet kodu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.targetId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri davet kodunu devre dışı bırakabilir',
            statusCode: 403,
          },
        };
      }

      const result = await leagueInvitationAPI.deactivate(invitationId);

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'deactivateInvite', { invitationId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'deactivateInvite', error);
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_INVITE_ERROR',
          message: error.message || 'Davet kodu devre dışı bırakılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reactivate invitation
   */
  static async reactivateInvite(
    invitationId: string,
    userId: string
  ): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'reactivateInvite', { invitationId, userId });

      // Get invitation
      const inviteResult = await leagueInvitationAPI.getById(invitationId);
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Davet kodu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.targetId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri davet kodunu aktif edebilir',
            statusCode: 403,
          },
        };
      }

      const result = await leagueInvitationAPI.reactivate(invitationId);

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'reactivateInvite', { invitationId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'reactivateInvite', error);
      return {
        success: false,
        error: {
          code: 'REACTIVATE_INVITE_ERROR',
          message: error.message || 'Davet kodu aktif edilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete invitation
   */
  static async deleteInvite(
    invitationId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'deleteInvite', { invitationId, userId });

      // Get invitation
      const inviteResult = await leagueInvitationAPI.getById(invitationId);
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Davet kodu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.targetId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri davet kodunu silebilir',
            statusCode: 403,
          },
        };
      }

      const result = await leagueInvitationAPI.delete(invitationId);

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'deleteInvite', { invitationId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'deleteInvite', error);
      return {
        success: false,
        error: {
          code: 'DELETE_INVITE_ERROR',
          message: error.message || 'Davet kodu silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update invitation metadata
   */
  static async updateInviteMetadata(
    invitationId: string,
    userId: string,
    metadata: Partial<ILeagueInvitation['settings']>
  ): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'updateInviteMetadata', { invitationId, userId });

      // Get invitation
      const inviteResult = await leagueInvitationAPI.getById(invitationId);
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Davet kodu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.targetId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri davet kodunu düzenleyebilir',
            statusCode: 403,
          },
        };
      }

      const result = await leagueInvitationAPI.updateMetadata(invitationId, metadata);

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'updateInviteMetadata', { invitationId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'updateInviteMetadata', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_METADATA_ERROR',
          message: error.message || 'Davet kodu güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. USAGE TRACKING
  // ============================================

  /**
   * Get invitation usage history
   */
  static async getInvitationUsage(
    invitationId: string,
    userId: string
  ): Promise<ApiResponse<IInvitationUse[]>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'getInvitationUsage', { invitationId, userId });

      // Get invitation
      const inviteResult = await leagueInvitationAPI.getById(invitationId);
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Davet kodu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(inviteResult.data.targetId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri kullanım geçmişini görüntüleyebilir',
            statusCode: 403,
          },
        };
      }

      const result = await leagueInvitationAPI.getUsageHistory(invitationId);

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'getInvitationUsage', {
          count: result.data?.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'getInvitationUsage', error);
      return {
        success: false,
        error: {
          code: 'GET_USAGE_ERROR',
          message: error.message || 'Kullanım geçmişi alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. BULK OPERATIONS
  // ============================================

  /**
   * Deactivate all invitations for a league
   */
  static async deactivateAllLeagueInvites(
    leagueId: string,
    userId: string
  ): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('LeagueInvitationService', 'deactivateAllLeagueInvites', {
        leagueId,
        userId,
      });

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece lig yöneticileri tüm davet kodlarını devre dışı bırakabilir',
            statusCode: 403,
          },
        };
      }

      const result = await leagueInvitationAPI.deactivateAllByTarget(leagueId);

      if (result.success) {
        ApiLogger.success('LeagueInvitationService', 'deactivateAllLeagueInvites', {
          deactivatedCount: result.data,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('LeagueInvitationService', 'deactivateAllLeagueInvites', error);
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_ALL_ERROR',
          message: error.message || 'Tüm davet kodları devre dışı bırakılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. VALIDATION HELPERS
  // ============================================

  /**
   * Check if invitation is valid
   */
  static async checkInvitationValidity(
    invitationId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      return await leagueInvitationAPI.isValid(invitationId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_VALIDITY_ERROR',
          message: error.message || 'Davet kodu geçerliliği kontrol edilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// ============================================
// MATCH INVITATION SERVICE
// ============================================

export class MatchInvitationService {
  // ============================================
  // 1. CREATE INVITATION
  // ============================================

  /**
   * Generate invitation code for match
   */
  static async generateInvite(
    options: IGenerateMatchInviteOptions
  ): Promise<ApiResponse<IMatchInvitation>> {
    try {
      ApiLogger.log('MatchInvitationService', 'generateInvite', {
        matchId: options.matchId,
        creatorId: options.creatorId,
      });

      // Check if creator is match organizer
      const matchResult = await matchAPI.getById(options.matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      if (match.organizerId !== options.creatorId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece maç organizatörü davet kodu oluşturabilir',
            statusCode: 403,
          },
        };
      }

      // Generate invitation
      const result = await matchInvitationAPI.createInvitation({
        matchId: options.matchId,
        createdBy: options.creatorId,
        matchType: options.matchType,
        description: options.description,
        tags: options.tags,
        allowGuests: options.allowGuests,
        registrationType: options.registrationType,
        teamAssignment: options.teamAssignment,
        maxPlayersPerInvite: options.maxPlayersPerInvite,
        expiresInHours: options.expiresInHours,
        maxUses: options.maxUses,
      });

      if (result.success) {
        ApiLogger.success('MatchInvitationService', 'generateInvite', {
          code: result.data?.code,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'generateInvite', error);
      return {
        success: false,
        error: {
          code: 'GENERATE_INVITE_ERROR',
          message: error.message || 'Davet kodu oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 2. VALIDATE & JOIN
  // ============================================

  /**
   * Validate invitation code and get match info
   */
  static async validateInvite(
    code: string,
    userId: string
  ): Promise<ApiResponse<IInviteValidation>> {
    try {
      ApiLogger.log('MatchInvitationService', 'validateInvite', {
        code: code.substring(0, 2) + '****',
        userId,
      });

      // Get invitation by code
      const inviteResult = await matchInvitationAPI.getByCode(code);

      if (!inviteResult.success) {
        return {
          success: true,
          data: {
            valid: false,
            error: {
              code: 'INVALID_CODE',
              message: 'Geçersiz davet kodu',
            },
          },
        };
      }

      if (!inviteResult.data) {
        return {
          success: true,
          data: {
            valid: false,
            error: {
              code: 'INVALID_CODE',
              message: 'Davet kodu bulunamadı',
            },
          },
        };
      }

      const invitation = inviteResult.data;

      // Check if active
      if (invitation.status !== InvitationStatus.ACTIVE) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'INACTIVE',
              message: 'Bu davet kodu devre dışı bırakılmış',
            },
          },
        };
      }

      // Check expiry (always set for matches)
      if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'CODE_EXPIRED',
              message: 'Bu davet kodunun süresi dolmuş',
            },
          },
        };
      }

      // Check max uses
      if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'MAX_USES_REACHED',
              message: 'Bu davet kodu maksimum kullanım sayısına ulaştı',
            },
          },
        };
      }

      // Get match info
      const matchResult = await matchAPI.getById(invitation.targetId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'MATCH_NOT_FOUND',
              message: 'Maç bulunamadı',
            },
          },
        };
      }

      const match = matchResult.data;

      // Check if already registered
      const isRegistered =
        match.players.registered?.some((p) => p.playerId === userId) ||
        match.players.guests?.some((g) => g === userId);

      if (isRegistered) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'ALREADY_REGISTERED',
              message: 'Zaten bu maça kayıtlısınız',
            },
          },
        };
      }

      // Check if match is full
      const totalRegistered =
        (match.players.registered?.length || 0) + (match.players.guests?.length || 0);
      const totalSlots = match.squad?.totalPlayers || 0;

      if (totalRegistered >= totalSlots) {
        return {
          success: true,
          data: {
            valid: false,
            invitation,
            error: {
              code: 'MATCH_FULL',
              message: 'Maç kontenjanı doldu',
            },
          },
        };
      }

      // Increment view count
      await matchInvitationAPI.incrementViews(invitation.id!);

      // Return valid with match info
      return {
        success: true,
        data: {
          valid: true,
          invitation,
          match: {
            id: match.id!,
            title: match.title,
            sportType: match.sportType,
            matchDate: match.schedule.matchStart.toISOString(),
            location: match.venue?.location,
            registeredCount: totalRegistered,
            totalSlots,
          },
        },
      };
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'validateInvite', error);
      return {
        success: false,
        error: {
          code: 'VALIDATE_INVITE_ERROR',
          message: error.message || 'Davet kodu doğrulanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Join match with invitation code
   * Note: This only validates and records the invitation use.
   * User will complete registration on MatchRegistrationScreen.
   */
  static async joinMatch(
    request: IJoinMatchRequest
  ): Promise<ApiResponse<{ matchId: string; invitationId: string }>> {
    try {
      ApiLogger.log('MatchInvitationService', 'joinMatch', {
        code: request.code.substring(0, 2) + '****',
        userId: request.userId,
      });

      // Validate invite
      const validationResult = await this.validateInvite(request.code, request.userId);

      if (!validationResult.success || !validationResult.data) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      const validation = validationResult.data;

      if (!validation.valid || !validation.invitation) {
        return {
          success: false,
          error: validation.error || {
            code: 'INVALID_CODE',
            message: 'Geçersiz davet kodu',
            statusCode: 400,
          },
        };
      }

      const invitation = validation.invitation as IMatchInvitation;

      // Increment attempt count
      await matchInvitationAPI.incrementAttempts(invitation.id!, true);

      // Check if player exists
      const playerCheck = await playerAPI.exists(request.userId);
      if (!playerCheck.success || !playerCheck.data) {
        return {
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Oyuncu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Record invitation use (status: pending until registration is completed)
      await matchInvitationAPI.recordUse(invitation.id!, {
        type: InvitationType.MATCH,
        targetId: invitation.targetId,
        userId: request.userId,
        status: 'pending',
        device: request.device || { platform: 'web' },
        matchData: {
          registeredAs: invitation.matchSettings.registrationType,
          guestInfo: request.guestInfo
            ? {
                fullName: request.guestInfo.fullName,
                phone: request.guestInfo.phone,
                accompaniedBy: request.userId,
              }
            : undefined,
        },
      });

      ApiLogger.success('MatchInvitationService', 'joinMatch', {
        matchId: invitation.targetId,
        userId: request.userId,
      });

      // Return match ID and invitation ID
      // User will be redirected to MatchRegistrationScreen
      return {
        success: true,
        data: {
          matchId: invitation.targetId,
          invitationId: invitation.id!,
        },
      };
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'joinMatch', error);
      return {
        success: false,
        error: {
          code: 'JOIN_MATCH_ERROR',
          message: error.message || 'Maça katılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. MANAGE INVITATIONS
  // ============================================

  /**
   * Get all invitations for a match
   */
  static async getMatchInvitations(
    matchId: string,
    userId: string
  ): Promise<ApiResponse<IMatchInvitation[]>> {
    try {
      ApiLogger.log('MatchInvitationService', 'getMatchInvitations', { matchId, userId });

      // Check if user is match organizer
      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      if (matchResult.data.organizerId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece maç organizatörü davet kodlarını görüntüleyebilir',
            statusCode: 403,
          },
        };
      }

      const result = await matchInvitationAPI.getByMatch(matchId);

      if (result.success) {
        ApiLogger.success('MatchInvitationService', 'getMatchInvitations', {
          count: result.data?.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'getMatchInvitations', error);
      return {
        success: false,
        error: {
          code: 'GET_INVITATIONS_ERROR',
          message: error.message || 'Davet kodları alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get active invitations for a match
   */
  static async getActiveInvitations(
    matchId: string,
    userId: string
  ): Promise<ApiResponse<IMatchInvitation[]>> {
    try {
      ApiLogger.log('MatchInvitationService', 'getActiveInvitations', { matchId, userId });

      // Check if user is match organizer
      const matchResult = await matchAPI.getById(matchId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      if (matchResult.data.organizerId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece maç organizatörü davet kodlarını görüntüleyebilir',
            statusCode: 403,
          },
        };
      }

      const result = await matchInvitationAPI.getActiveByMatch(matchId);

      if (result.success) {
        ApiLogger.success('MatchInvitationService', 'getActiveInvitations', {
          count: result.data?.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'getActiveInvitations', error);
      return {
        success: false,
        error: {
          code: 'GET_ACTIVE_ERROR',
          message: error.message || 'Aktif davet kodları alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get pending invitations for a user
   */
  static async getPendingInvitations(
    userId: string
  ): Promise<ApiResponse<IMatchInvitation[]>> {
    try {
      ApiLogger.log('MatchInvitationService', 'getPendingInvitations', { userId });

      const result = await matchInvitationAPI.getByCreatorAndStatus(userId, InvitationStatus.ACTIVE);

      if (result.success) {
        ApiLogger.success('MatchInvitationService', 'getPendingInvitations', {
          count: result.data?.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'getPendingInvitations', error);
      return {
        success: false,
        error: {
          code: 'GET_PENDING_ERROR',
          message: error.message || 'Bekleyen davet kodları alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Deactivate invitation
   */
  static async deactivateInvite(
    invitationId: string,
    userId: string
  ): Promise<ApiResponse<IMatchInvitation>> {
    try {
      ApiLogger.log('MatchInvitationService', 'deactivateInvite', { invitationId, userId });

      // Get invitation
      const inviteResult = await matchInvitationAPI.getById(invitationId);
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Davet kodu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Check if user is match organizer
      const matchResult = await matchAPI.getById(inviteResult.data.targetId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      if (matchResult.data.organizerId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece maç organizatörü davet kodunu devre dışı bırakabilir',
            statusCode: 403,
          },
        };
      }

      const result = await matchInvitationAPI.deactivate(invitationId);

      if (result.success) {
        ApiLogger.success('MatchInvitationService', 'deactivateInvite', { invitationId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'deactivateInvite', error);
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_INVITE_ERROR',
          message: error.message || 'Davet kodu devre dışı bırakılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete invitation
   */
  static async deleteInvite(
    invitationId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('MatchInvitationService', 'deleteInvite', { invitationId, userId });

      // Get invitation
      const inviteResult = await matchInvitationAPI.getById(invitationId);
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Davet kodu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Check if user is match organizer
      const matchResult = await matchAPI.getById(inviteResult.data.targetId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      if (matchResult.data.organizerId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece maç organizatörü davet kodunu silebilir',
            statusCode: 403,
          },
        };
      }

      const result = await matchInvitationAPI.delete(invitationId);

      if (result.success) {
        ApiLogger.success('MatchInvitationService', 'deleteInvite', { invitationId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'deleteInvite', error);
      return {
        success: false,
        error: {
          code: 'DELETE_INVITE_ERROR',
          message: error.message || 'Davet kodu silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. USAGE TRACKING
  // ============================================

  /**
   * Get invitation usage history
   */
  static async getInvitationUsage(
    invitationId: string,
    userId: string
  ): Promise<ApiResponse<IInvitationUse[]>> {
    try {
      ApiLogger.log('MatchInvitationService', 'getInvitationUsage', { invitationId, userId });

      // Get invitation
      const inviteResult = await matchInvitationAPI.getById(invitationId);
      if (!inviteResult.success || !inviteResult.data) {
        return {
          success: false,
          error: {
            code: 'INVITATION_NOT_FOUND',
            message: 'Davet kodu bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Check if user is match organizer
      const matchResult = await matchAPI.getById(inviteResult.data.targetId);
      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      if (matchResult.data.organizerId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece maç organizatörü kullanım geçmişini görüntüleyebilir',
            statusCode: 403,
          },
        };
      }

      const result = await matchInvitationAPI.getUsageHistory(invitationId);

      if (result.success) {
        ApiLogger.success('MatchInvitationService', 'getInvitationUsage', {
          count: result.data?.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'getInvitationUsage', error);
      return {
        success: false,
        error: {
          code: 'GET_USAGE_ERROR',
          message: error.message || 'Kullanım geçmişi alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. MAINTENANCE
  // ============================================

  /**
   * Cleanup expired match invitations
   */
  static async cleanupExpired(): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('MatchInvitationService', 'cleanupExpired', {});

      const result = await matchInvitationAPI.deleteExpired();

      if (result.success) {
        ApiLogger.success('MatchInvitationService', 'cleanupExpired', {
          deletedCount: result.data,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchInvitationService', 'cleanupExpired', error);
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: error.message || 'Süresi dolmuş davet kodları silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. VALIDATION HELPERS
  // ============================================

  /**
   * Check if invitation is valid
   */
  static async checkInvitationValidity(
    invitationId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      return await matchInvitationAPI.isValid(invitationId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_VALIDITY_ERROR',
          message: error.message || 'Davet kodu geçerliliği kontrol edilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// ============================================
// UNIFIED INVITATION SERVICE
// ============================================

export class InvitationService {
  /**
   * Find invitation by code (searches all collections)
   */
  static async findInvitationByCode(
    code: string
  ): Promise<ApiResponse<{ type: InvitationType; invitation: any }>> {
    try {
      ApiLogger.log('InvitationService', 'findInvitationByCode', {
        code: code.substring(0, 2) + '****',
      });

      const result = await invitationSearchAPI.findByCode(code);

      if (result.success) {
        ApiLogger.success('InvitationService', 'findInvitationByCode', {
          type: result.data?.type,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('InvitationService', 'findInvitationByCode', error);
      return {
        success: false,
        error: {
          code: 'FIND_INVITATION_ERROR',
          message: error.message || 'Davet kodu bulunamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Validate invitation code (routes to specific service)
   */
  static async validateInvitationCode(
    code: string,
    userId: string
  ): Promise<ApiResponse<IInviteValidation>> {
    try {
      // Find invitation type first
      const findResult = await this.findInvitationByCode(code);

      if (!findResult.success || !findResult.data) {
        return {
          success: true,
          data: {
            valid: false,
            error: {
              code: 'INVALID_CODE',
              message: 'Geçersiz davet kodu',
            },
          },
        };
      }

      const { type } = findResult.data;

      // Route to specific service
      if (type === InvitationType.LEAGUE) {
        return await LeagueInvitationService.validateInvite(code, userId);
      } else if (type === InvitationType.MATCH) {
        return await MatchInvitationService.validateInvite(code, userId);
      }

      return {
        success: true,
        data: {
          valid: false,
          error: {
            code: 'UNSUPPORTED_TYPE',
            message: 'Desteklenmeyen davet tipi',
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VALIDATE_ERROR',
          message: error.message || 'Davet kodu doğrulanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

export default LeagueInvitationService;