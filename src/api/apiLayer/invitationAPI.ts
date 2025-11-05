// ============================================
// api/InvitationAPI.ts - SEPARATE COLLECTIONS
// ============================================

import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import {
  IInvitation,
  ILeagueInvitation,
  IMatchInvitation,
  ITeamInvitation,
  IInvitationUse,
  ILeagueInvitationUse,
  IMatchInvitationUse,
  ITeamInvitationUse,
  InvitationType,
  InvitationStatus,
} from '../../types/entity/invitation';
import { ApiLogger } from '../base/ApiLogger';
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

// ============================================
// BASE INVITATION API (Abstract)
// ============================================

abstract class BaseInvitationAPI<T extends IInvitation> extends BaseAPI<T> {
  // ============================================
  // CODE GENERATION
  // ============================================

  /**
   * Generate unique invitation code
   * Excludes similar characters: I, O, 0, 1
   */
  protected generateInviteCode(length: number = 6): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Check if code already exists
   */
  protected async codeExists(code: string): Promise<boolean> {
    try {
      const result = await this.getByCode(code);
      return result.success && result.data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate unique code with retry mechanism
   */
  protected async generateUniqueCode(length: number = 6): Promise<string> {
    let code = this.generateInviteCode(length);
    let attempts = 0;
    const maxAttempts = 10;

    while ((await this.codeExists(code)) && attempts < maxAttempts) {
      code = this.generateInviteCode(length);
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique invite code after 10 attempts');
    }

    return code;
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get invitation by code
   */
  async getByCode(code: string): Promise<ApiResponse<T | null>> {
    try {
      ApiLogger.log(this.collectionName, 'getByCode', {
        code: code.substring(0, 2) + '****',
      });

      const result = await this.getAll({
        where: [{ field: 'code', operator: '==', value: code.toUpperCase() }],
        limit: 1,
      });

      if (!result.success) {
        return {
          success: false,
          error: result.error || {
            code: 'GET_BY_CODE_ERROR',
            message: 'Failed to get invitation by code',
            statusCode: 500,
          },
        };
      }

      if (!result.data || result.data.length === 0) {
        return {
          success: true,
          data: null,
        };
      }

      ApiLogger.success(this.collectionName, 'getByCode', {
        invitationId: result.data[0].id,
      });

      return {
        success: true,
        data: result.data[0],
      };
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'getByCode', error);
      return {
        success: false,
        error: {
          code: 'GET_BY_CODE_ERROR',
          message: error.message || 'Failed to get invitation by code',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get invitations by target
   */
  async getByTarget(targetId: string): Promise<ApiResponse<T[]>> {
    return this.getAll({
      where: [{ field: 'targetId', operator: '==', value: targetId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get active invitations by target
   */
  async getActiveByTarget(targetId: string): Promise<ApiResponse<T[]>> {
    try {
      const result = await this.getAll({
        where: [
          { field: 'targetId', operator: '==', value: targetId },
          { field: 'status', operator: '==', value: InvitationStatus.ACTIVE },
        ],
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
      });

      if (!result.success || !result.data) {
        return result;
      }

      // Filter expired invitations in memory
      const now = new Date();
      const activeInvitations = result.data.filter((inv) => {
        if (!inv.expiresAt) return true;
        return inv.expiresAt.toDate() > now;
      });

      return {
        success: true,
        data: activeInvitations,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_ACTIVE_ERROR',
          message: error.message || 'Failed to get active invitations',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get invitations created by a user
   */
  async getByCreator(creatorId: string): Promise<ApiResponse<T[]>> {
    return this.getAll({
      where: [{ field: 'createdBy', operator: '==', value: creatorId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  /**
   * Update invitation status
   */
  async updateStatus(
    invitationId: string,
    status: InvitationStatus
  ): Promise<ApiResponse<T>> {
    try {
      ApiLogger.log(this.collectionName, 'updateStatus', {
        invitationId,
        status,
      });

      const result = await this.update(invitationId, {
        status,
        updatedAt: Timestamp.now(),
      } as Partial<Omit<T, 'id'>>);

      if (result.success) {
        ApiLogger.success(this.collectionName, 'updateStatus', {
          invitationId,
          status,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'updateStatus', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_STATUS_ERROR',
          message: error.message || 'Failed to update status',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Deactivate invitation
   */
  async deactivate(invitationId: string): Promise<ApiResponse<T>> {
    return this.updateStatus(invitationId, InvitationStatus.DISABLED);
  }

  /**
   * Reactivate invitation
   */
  async reactivate(invitationId: string): Promise<ApiResponse<T>> {
    return this.updateStatus(invitationId, InvitationStatus.ACTIVE);
  }

  // ============================================
  // STATS MANAGEMENT
  // ============================================

  /**
   * Increment view count
   */
  async incrementViews(invitationId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, invitationId);

      await updateDoc(docRef, {
        'stats.totalViews': increment(1),
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_VIEWS_ERROR',
          message: error.message || 'Failed to increment views',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Increment attempt count
   */
  async incrementAttempts(
    invitationId: string,
    success: boolean
  ): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, invitationId);

      const updates: any = {
        'stats.totalAttempts': increment(1),
        updatedAt: Timestamp.now(),
      };

      if (!success) {
        updates['stats.failedAttempts'] = increment(1);
      }

      await updateDoc(docRef, updates);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_ATTEMPTS_ERROR',
          message: error.message || 'Failed to increment attempts',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Increment successful joins and used count
   */
  async incrementUsage(invitationId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, invitationId);

      await updateDoc(docRef, {
        usedCount: increment(1),
        'stats.successfulJoins': increment(1),
        'stats.lastUsedAt': Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_USAGE_ERROR',
          message: error.message || 'Failed to increment usage',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // USAGE TRACKING (SUB-COLLECTION)
  // ============================================

  /**
   * Record invitation usage
   */
  async recordUse(
    invitationId: string,
    useData: Omit<any, 'id' | 'invitationId' | 'joinedAt'> // Accept any type of invitation use
  ): Promise<ApiResponse<IInvitationUse>> {
    try {
      ApiLogger.log(this.collectionName, 'recordUse', {
        invitationId,
        userId: useData.userId,
      });

      // Add use record to sub-collection
      const useDoc = await addDoc(
        collection(db, this.collectionName, invitationId, 'uses'),
        {
          invitationId,
          joinedAt: Timestamp.now(),
          ...useData,
        }
      );

      // Increment usage stats
      await this.incrementUsage(invitationId);

      ApiLogger.success(this.collectionName, 'recordUse', {
        invitationId,
        useId: useDoc.id,
      });

      return {
        success: true,
        data: {
          id: useDoc.id,
          invitationId,
          joinedAt: Timestamp.now(),
          ...useData,
        } as IInvitationUse,
      };
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'recordUse', error);
      return {
        success: false,
        error: {
          code: 'RECORD_USE_ERROR',
          message: error.message || 'Failed to record usage',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get invitation usage history
   */
  async getUsageHistory(
    invitationId: string
  ): Promise<ApiResponse<IInvitationUse[]>> {
    try {
      ApiLogger.log(this.collectionName, 'getUsageHistory', { invitationId });

      const q = query(
        collection(db, this.collectionName, invitationId, 'uses'),
        orderBy('joinedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const uses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as IInvitationUse[];

      ApiLogger.success(this.collectionName, 'getUsageHistory', {
        invitationId,
        count: uses.length,
      });

      return {
        success: true,
        data: uses,
      };
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'getUsageHistory', error);
      return {
        success: false,
        error: {
          code: 'GET_USAGE_HISTORY_ERROR',
          message: error.message || 'Failed to get usage history',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if user has used this invitation
   */
  async hasUserUsed(
    invitationId: string,
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const q = query(
        collection(db, this.collectionName, invitationId, 'uses'),
        where('userId', '==', userId),
        firestoreLimit(1)
      );

      const snapshot = await getDocs(q);

      return {
        success: true,
        data: !snapshot.empty,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_USER_USED_ERROR',
          message: error.message || 'Failed to check if user used invitation',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  /**
   * Check if invitation is valid for use
   */
  async isValid(invitationId: string): Promise<ApiResponse<boolean>> {
    try {
      const invitationResult = await this.getById(invitationId);

      if (!invitationResult.success || !invitationResult.data) {
        return {
          success: true,
          data: false,
        };
      }

      const invitation = invitationResult.data;

      // Check status
      if (invitation.status !== InvitationStatus.ACTIVE) {
        return { success: true, data: false };
      }

      // Check expiry
      if (invitation.expiresAt && invitation.expiresAt.toDate() < new Date()) {
        return { success: true, data: false };
      }

      // Check max uses
      if (invitation.maxUses && invitation.usedCount >= invitation.maxUses) {
        return { success: true, data: false };
      }

      return { success: true, data: true };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message || 'Failed to validate invitation',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Deactivate all invitations for a target
   */
  async deactivateAllByTarget(targetId: string): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log(this.collectionName, 'deactivateAllByTarget', { targetId });

      const invitationsResult = await this.getByTarget(targetId);

      if (!invitationsResult.success || !invitationsResult.data) {
        return {
          success: false,
          error: invitationsResult.error || {
            code: 'GET_INVITATIONS_ERROR',
            message: 'Failed to get invitations',
            statusCode: 500,
          },
        };
      }

      let deactivatedCount = 0;

      for (const invitation of invitationsResult.data) {
        if (invitation.status === InvitationStatus.ACTIVE) {
          const result = await this.deactivate(invitation.id!);
          if (result.success) {
            deactivatedCount++;
          }
        }
      }

      ApiLogger.success(this.collectionName, 'deactivateAllByTarget', {
        targetId,
        deactivatedCount,
      });

      return {
        success: true,
        data: deactivatedCount,
      };
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'deactivateAllByTarget', error);
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_ALL_ERROR',
          message: error.message || 'Failed to deactivate all invitations',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete expired invitations
   */
  async deleteExpired(): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log(this.collectionName, 'deleteExpired', {});

      const now = new Date();

      // Get all invitations
      const allInvitations = await this.getAll({});

      if (!allInvitations.success || !allInvitations.data) {
        return {
          success: false,
          error: allInvitations.error || {
            code: 'GET_ALL_ERROR',
            message: 'Failed to get invitations',
            statusCode: 500,
          },
        };
      }

      const expiredInvitations = allInvitations.data.filter(
        (inv) => inv.expiresAt && inv.expiresAt.toDate() < now
      );

      let deletedCount = 0;

      for (const invitation of expiredInvitations) {
        const result = await this.delete(invitation.id!);
        if (result.success) {
          deletedCount++;
        }
      }

      ApiLogger.success(this.collectionName, 'deleteExpired', { deletedCount });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'deleteExpired', error);
      return {
        success: false,
        error: {
          code: 'DELETE_EXPIRED_ERROR',
          message: error.message || 'Failed to delete expired invitations',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// ============================================
// LEAGUE INVITATION API
// ============================================

export class LeagueInvitationAPI extends BaseInvitationAPI<ILeagueInvitation> {
  constructor() {
    super('invitations');
  }

  /**
   * Create league invitation
   */
  async createInvitation(options: {
    leagueId: string;
    createdBy: string;
    description?: string;
    tags?: string[];
    assignRole?: 'member' | 'premium' | 'direct';
    autoApprove?: boolean;
    welcomeMessage?: string;
    expiresInDays?: number;
    maxUses?: number;
  }): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log(this.collectionName, 'createInvitation', {
        leagueId: options.leagueId,
        createdBy: options.createdBy,
      });

      // Generate unique code (8 chars for leagues)
      const code = await this.generateUniqueCode(8);

      // Generate deep link
      const inviteLink = `matchmanagement360://join-league/${code}`;

      // Calculate expiry date
      let expiresAt: Timestamp | undefined;
      if (options.expiresInDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + options.expiresInDays);
        expiresAt = Timestamp.fromDate(expiryDate);
      }

      const invitationData: Omit<
        ILeagueInvitation,
        'id' | 'createdAt' | 'updatedAt' | 'usedCount' | 'stats'
      > = {
        type: InvitationType.LEAGUE,
        targetId: options.leagueId,
        code,
        inviteLink,
        createdBy: options.createdBy,
        expiresAt,
        maxUses: options.maxUses,
        status: InvitationStatus.ACTIVE,
        settings: {
          description: options.description,
          tags: options.tags,
          autoAccept: options.autoApprove || false,
          requireApproval: !(options.autoApprove || false),
        },
        leagueSettings: {
          assignRole: options.assignRole || 'member',
          autoApprove: options.autoApprove || false,
          welcomeMessage: options.welcomeMessage,
        },
      };

      // Create with BaseAPI
      const result = await this.create(invitationData as Omit<ILeagueInvitation, 'id'>);

      if (result.success) {
        ApiLogger.success(this.collectionName, 'createInvitation', {
          invitationId: result.data?.id,
          code,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'createInvitation', error);
      return {
        success: false,
        error: {
          code: 'CREATE_INVITATION_ERROR',
          message: error.message || 'Failed to create invitation',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get by league
   */
  async getByLeague(leagueId: string): Promise<ApiResponse<ILeagueInvitation[]>> {
    return this.getByTarget(leagueId);
  }

  /**
   * Get active by league
   */
  async getActiveByLeague(
    leagueId: string
  ): Promise<ApiResponse<ILeagueInvitation[]>> {
    return this.getActiveByTarget(leagueId);
  }

  /**
   * Update metadata
   */
  async updateMetadata(
    invitationId: string,
    metadata: Partial<ILeagueInvitation['settings']>
  ): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log(this.collectionName, 'updateMetadata', { invitationId });

      const invitationResult = await this.getById(invitationId);

      if (!invitationResult.success || !invitationResult.data) {
        return invitationResult;
      }

      const updatedSettings = {
        ...invitationResult.data.settings,
        ...metadata,
      };

      const result = await this.update(invitationId, {
        settings: updatedSettings,
        updatedAt: Timestamp.now(),
      } as Partial<Omit<ILeagueInvitation, 'id'>>);

      if (result.success) {
        ApiLogger.success(this.collectionName, 'updateMetadata', {
          invitationId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'updateMetadata', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_METADATA_ERROR',
          message: error.message || 'Failed to update metadata',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// ============================================
// MATCH INVITATION API
// ============================================

export class MatchInvitationAPI extends BaseInvitationAPI<IMatchInvitation> {
  constructor() {
    super('invitations');
  }

  /**
   * Create match invitation
   */
  async createInvitation(options: {
    matchId: string;
    createdBy: string;
    matchType: 'FRIENDLY' | 'LEAGUE' | 'TOURNAMENT';
    description?: string;
    tags?: string[];
    allowGuests?: boolean;
    registrationType?: 'player' | 'reserve' | 'any';
    teamAssignment?: 'auto' | 'team1' | 'team2' | 'manual';
    maxPlayersPerInvite?: number;
    expiresInHours: number;
    maxUses: number;
  }): Promise<ApiResponse<IMatchInvitation>> {
    try {
      ApiLogger.log(this.collectionName, 'createInvitation', {
        matchId: options.matchId,
        createdBy: options.createdBy,
      });

      // Generate unique code (6 chars for matches)
      const code = await this.generateUniqueCode(6);

      // Generate deep link
      const inviteLink = `matchmanagement360://join-match/${code}`;

      // Calculate expiry (always required for matches)
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + options.expiresInHours);
      const expiresAt = Timestamp.fromDate(expiryDate);

      const invitationData: Omit<
        IMatchInvitation,
        'id' | 'createdAt' | 'updatedAt' | 'usedCount' | 'stats'
      > = {
        type: InvitationType.MATCH,
        targetId: options.matchId,
        code,
        inviteLink,
        createdBy: options.createdBy,
        expiresAt,
        maxUses: options.maxUses,
        status: InvitationStatus.ACTIVE,
        settings: {
          description: options.description,
          tags: options.tags,
        },
        matchSettings: {
          matchType: options.matchType,
          allowGuests: options.allowGuests || false,
          registrationType: options.registrationType || 'any',
          teamAssignment: options.teamAssignment || 'manual',
          maxPlayersPerInvite: options.maxPlayersPerInvite || 1,
          guestSettings: options.allowGuests
            ? {
                requireFullName: true,
                requirePhone: false,
                allowMultipleGuests: (options.maxPlayersPerInvite || 1) > 1,
              }
            : undefined,
        },
      };

      const result = await this.create(invitationData as Omit<IMatchInvitation, 'id'>);

      if (result.success) {
        ApiLogger.success(this.collectionName, 'createInvitation', {
          invitationId: result.data?.id,
          code,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'createInvitation', error);
      return {
        success: false,
        error: {
          code: 'CREATE_INVITATION_ERROR',
          message: error.message || 'Failed to create invitation',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get by match
   */
  async getByMatch(matchId: string): Promise<ApiResponse<IMatchInvitation[]>> {
    return this.getByTarget(matchId);
  }

  /**
   * Get active by match
   */
  async getActiveByMatch(
    matchId: string
  ): Promise<ApiResponse<IMatchInvitation[]>> {
    return this.getActiveByTarget(matchId);
  }
}

// ============================================
// TEAM INVITATION API
// ============================================

export class TeamInvitationAPI extends BaseInvitationAPI<ITeamInvitation> {
  constructor() {
    super('invitations');
  }

  /**
   * Create team invitation
   */
  async createInvitation(options: {
    teamId: string;
    createdBy: string;
    description?: string;
    tags?: string[];
    assignRole?: 'player' | 'coach' | 'staff';
    requireApproval?: boolean;
    requiredSkillLevel?: number;
    expiresInDays?: number;
    maxUses?: number;
  }): Promise<ApiResponse<ITeamInvitation>> {
    try {
      ApiLogger.log(this.collectionName, 'createInvitation', {
        teamId: options.teamId,
        createdBy: options.createdBy,
      });

      // Generate unique code (6 chars for teams)
      const code = await this.generateUniqueCode(6);

      // Generate deep link
      const inviteLink = `matchmanagement360://join-team/${code}`;

      // Calculate expiry date
      let expiresAt: Timestamp | undefined;
      if (options.expiresInDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + options.expiresInDays);
        expiresAt = Timestamp.fromDate(expiryDate);
      }

      const invitationData: Omit<
        ITeamInvitation,
        'id' | 'createdAt' | 'updatedAt' | 'usedCount' | 'stats'
      > = {
        type: InvitationType.TEAM,
        targetId: options.teamId,
        code,
        inviteLink,
        createdBy: options.createdBy,
        expiresAt,
        maxUses: options.maxUses,
        status: InvitationStatus.ACTIVE,
        settings: {
          description: options.description,
          tags: options.tags,
          requireApproval: options.requireApproval || false,
        },
        teamSettings: {
          assignRole: options.assignRole || 'player',
          requireApproval: options.requireApproval || false,
          requiredSkillLevel: options.requiredSkillLevel,
        },
      };

      const result = await this.create(invitationData as Omit<ITeamInvitation, 'id'>);

      if (result.success) {
        ApiLogger.success(this.collectionName, 'createInvitation', {
          invitationId: result.data?.id,
          code,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'createInvitation', error);
      return {
        success: false,
        error: {
          code: 'CREATE_INVITATION_ERROR',
          message: error.message || 'Failed to create invitation',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get by team
   */
  async getByTeam(teamId: string): Promise<ApiResponse<ITeamInvitation[]>> {
    return this.getByTarget(teamId);
  }

  /**
   * Get active by team
   */
  async getActiveByTeam(teamId: string): Promise<ApiResponse<ITeamInvitation[]>> {
    return this.getActiveByTarget(teamId);
  }
}

// ============================================
// UNIFIED SEARCH API
// ============================================

export class InvitationSearchAPI {
  private leagueAPI: LeagueInvitationAPI;
  private matchAPI: MatchInvitationAPI;
  private teamAPI: TeamInvitationAPI;

  constructor() {
    this.leagueAPI = new LeagueInvitationAPI();
    this.matchAPI = new MatchInvitationAPI();
    this.teamAPI = new TeamInvitationAPI();
  }

  /**
   * Find invitation by code (searches all collections)
   */
  async findByCode(code: string): Promise<
    ApiResponse<{
      type: InvitationType;
      invitation: IInvitation;
    }>
  > {
    try {
      const upperCode = code.toUpperCase();

      // Try League first (most common)
      const leagueResult = await this.leagueAPI.getByCode(upperCode);
      if (leagueResult.success && leagueResult.data) {
        return {
          success: true,
          data: {
            type: InvitationType.LEAGUE,
            invitation: leagueResult.data,
          },
        };
      }

      // Try Match
      const matchResult = await this.matchAPI.getByCode(upperCode);
      if (matchResult.success && matchResult.data) {
        return {
          success: true,
          data: {
            type: InvitationType.MATCH,
            invitation: matchResult.data,
          },
        };
      }

      // Try Team
      const teamResult = await this.teamAPI.getByCode(upperCode);
      if (teamResult.success && teamResult.data) {
        return {
          success: true,
          data: {
            type: InvitationType.TEAM,
            invitation: teamResult.data,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'INVALID_CODE',
          message: 'Invalid invitation code',
          statusCode: 404,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error.message || 'Failed to search invitation',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// ============================================
// EXPORT SINGLETON INSTANCES
// ============================================

export const leagueInvitationAPI = new LeagueInvitationAPI();
export const matchInvitationAPI = new MatchInvitationAPI();
export const teamInvitationAPI = new TeamInvitationAPI();
export const invitationSearchAPI = new InvitationSearchAPI();