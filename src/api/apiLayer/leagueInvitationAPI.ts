// ============================================
// api/LeagueInvitationAPI.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { 
  ILeagueInvitation, 
  IInvitationUse, 
  IGenerateInviteOptions 
} from '../../types/entity/types';
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
  limit, 
  increment 
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class LeagueInvitationAPI extends BaseAPI<ILeagueInvitation> {
  constructor() {
    super('league_invitations');
  }

  // ============================================
  // CODE GENERATION
  // ============================================

  /**
   * Generate unique 8-character invitation code
   * Excludes similar characters: I, O, 0, 1
   */
  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Check if code already exists
   */
  private async codeExists(code: string): Promise<boolean> {
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
  private async generateUniqueCode(): Promise<string> {
    let code = this.generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (await this.codeExists(code) && attempts < maxAttempts) {
      code = this.generateInviteCode();
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique invite code after 10 attempts');
    }

    return code;
  }

  // ============================================
  // CREATE INVITATION
  // ============================================

  /**
   * Create new invitation
   */
  async createInvitation(options: IGenerateInviteOptions): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log(this.collectionName, 'createInvitation', {
        leagueId: options.leagueId,
        creatorId: options.creatorId,
      });

      // Generate unique code
      const code = await this.generateUniqueCode();

      // Generate deep link
      const inviteLink = `matchmanagement360://join-league/${code}`;

      // Calculate expiry date
      let expiresAt: string | undefined;
      if (options.expiresInDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + options.expiresInDays);
        expiresAt = expiryDate.toISOString();
      }

      const invitationData: Omit<ILeagueInvitation, 'id'> = {
        leagueId: options.leagueId,
        code,
        inviteLink,
        createdBy: options.creatorId,
        createdAt: new Date().toISOString(),
        expiresAt,
        maxUses: options.maxUses,
        usedCount: 0,
        isActive: true,
        metadata: {
          description: options.description,
          tags: options.tags,
          assignRole: options.assignRole,
        },
        stats: {
          totalViews: 0,
          totalAttempts: 0,
          successfulJoins: 0,
        },
      };

      const result = await this.create(invitationData);

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

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get invitation by code
   */
  async getByCode(code: string): Promise<ApiResponse<ILeagueInvitation | null>> {
    try {
      ApiLogger.log(this.collectionName, 'getByCode', { code: code.substring(0, 4) + '****' });

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
        }
      }

      if (!result.data || result.data.length === 0) {
        return {
          success: true,
          data: null,
        };
      }

      ApiLogger.success(this.collectionName, 'getByCode', { invitationId: result.data[0].id });

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
   * Get all invitations for a league
   */
  async getByLeague(leagueId: string): Promise<ApiResponse<ILeagueInvitation[]>> {
    return this.getAll({
      where: [{ field: 'leagueId', operator: '==', value: leagueId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get active invitations for a league
   */
  async getActiveByLeague(leagueId: string): Promise<ApiResponse<ILeagueInvitation[]>> {
    try {
      const result = await this.getAll({
        where: [
          { field: 'leagueId', operator: '==', value: leagueId },
          { field: 'isActive', operator: '==', value: true },
        ],
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
      });

      if (!result.success || !result.data) {
        return result;
      }

      // Filter expired invitations in memory
      const now = new Date();
      const activeInvitations = result.data.filter(inv => {
        if (!inv.expiresAt) return true;
        return new Date(inv.expiresAt) > now;
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
  async getByCreator(creatorId: string): Promise<ApiResponse<ILeagueInvitation[]>> {
    return this.getAll({
      where: [{ field: 'createdBy', operator: '==', value: creatorId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  /**
   * Deactivate invitation
   */
  async deactivate(invitationId: string): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log(this.collectionName, 'deactivate', { invitationId });

      const result = await this.update(invitationId, {
        isActive: false,
      } as Partial<Omit<ILeagueInvitation, 'id'>>);

      if (result.success) {
        ApiLogger.success(this.collectionName, 'deactivate', { invitationId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'deactivate', error);
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_ERROR',
          message: error.message || 'Failed to deactivate invitation',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reactivate invitation
   */
  async reactivate(invitationId: string): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log(this.collectionName, 'reactivate', { invitationId });

      const result = await this.update(invitationId, {
        isActive: true,
      } as Partial<Omit<ILeagueInvitation, 'id'>>);

      if (result.success) {
        ApiLogger.success(this.collectionName, 'reactivate', { invitationId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'reactivate', error);
      return {
        success: false,
        error: {
          code: 'REACTIVATE_ERROR',
          message: error.message || 'Failed to reactivate invitation',
          details: error,
          statusCode: 500,
        },
      };
    }
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
        updatedAt: new Date().toISOString(),
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
  async incrementAttempts(invitationId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, invitationId);

      await updateDoc(docRef, {
        'stats.totalAttempts': increment(1),
        updatedAt: new Date().toISOString(),
      });

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
        'stats.lastUsedAt': new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
  // METADATA MANAGEMENT
  // ============================================

  /**
   * Update invitation metadata
   */
  async updateMetadata(
    invitationId: string,
    metadata: Partial<ILeagueInvitation['metadata']>
  ): Promise<ApiResponse<ILeagueInvitation>> {
    try {
      ApiLogger.log(this.collectionName, 'updateMetadata', { invitationId });

      const invitationResult = await this.getById(invitationId);

      if (!invitationResult.success || !invitationResult.data) {
        return invitationResult;
      }

      const updatedMetadata = {
        ...invitationResult.data.metadata,
        ...metadata,
      };

      const result = await this.update(invitationId, {
        metadata: updatedMetadata,
      } as Partial<Omit<ILeagueInvitation, 'id'>>);

      if (result.success) {
        ApiLogger.success(this.collectionName, 'updateMetadata', { invitationId });
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

  // ============================================
  // USAGE TRACKING (SUB-COLLECTION)
  // ============================================

  /**
   * Record invitation usage
   */
  async recordUse(
    invitationId: string,
    useData: Omit<IInvitationUse, 'id' | 'invitationId'>
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
  async getUsageHistory(invitationId: string): Promise<ApiResponse<IInvitationUse[]>> {
    try {
      ApiLogger.log(this.collectionName, 'getUsageHistory', { invitationId });

      const q = query(
        collection(db, this.collectionName, invitationId, 'uses'),
        orderBy('joinedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const uses = snapshot.docs.map(doc => ({
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
   * Get usage count for a specific user in a league
   */
  async getUserUsageInLeague(leagueId: string, userId: string): Promise<ApiResponse<number>> {
    try {
      // Query across all invitations for this league
      const invitationsResult = await this.getByLeague(leagueId);

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

      let totalUses = 0;

      for (const invitation of invitationsResult.data) {
        const usesResult = await this.getUsageHistory(invitation.id!);
        if (usesResult.success && usesResult.data) {
          const userUses = usesResult.data.filter(use => use.userId === userId);
          totalUses += userUses.length;
        }
      }

      return {
        success: true,
        data: totalUses,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_USER_USAGE_ERROR',
          message: error.message || 'Failed to get user usage',
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

      // Check if active
      if (!invitation.isActive) {
        return { success: true, data: false };
      }

      // Check expiry
      if (invitation.expiresAt && new Date(invitation.expiresAt) < new Date()) {
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
   * Deactivate all invitations for a league
   */
  async deactivateAllByLeague(leagueId: string): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log(this.collectionName, 'deactivateAllByLeague', { leagueId });

      const invitationsResult = await this.getByLeague(leagueId);

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
        if (invitation.isActive) {
          const result = await this.deactivate(invitation.id!);
          if (result.success) {
            deactivatedCount++;
          }
        }
      }

      ApiLogger.success(this.collectionName, 'deactivateAllByLeague', {
        leagueId,
        deactivatedCount,
      });

      return {
        success: true,
        data: deactivatedCount,
      };
    } catch (error: any) {
      ApiLogger.error(this.collectionName, 'deactivateAllByLeague', error);
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

      const now = new Date().toISOString();

      // Get all invitations (we'll filter in memory since Firestore doesn't support direct expiry queries easily)
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
        inv => inv.expiresAt && new Date(inv.expiresAt) < new Date(now)
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

// Export singleton instance
export const leagueInvitationAPI = new LeagueInvitationAPI();