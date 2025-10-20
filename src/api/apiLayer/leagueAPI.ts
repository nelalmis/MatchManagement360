// ============================================
// api/LeagueAPI.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { ILeague, SportType } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class LeagueAPI extends BaseAPI<ILeague> {
  constructor() {
    super('leagues');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get leagues by sport type
   */
  async getBySportType(sportType: SportType): Promise<ApiResponse<ILeague[]>> {
    return this.getAll({
      where: [{ field: 'sportType', operator: '==', value: sportType }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get leagues created by a user
   */
  async getByCreator(creatorId: string): Promise<ApiResponse<ILeague[]>> {
    return this.getAll({
      where: [{ field: 'createdBy', operator: '==', value: creatorId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get leagues where user is a member
   */
  async getByMember(playerId: string): Promise<ApiResponse<ILeague[]>> {
    return this.getAll({
      where: [{ field: 'members.all', operator: 'array-contains', value: playerId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get leagues where user is an admin
   */
  async getByAdmin(playerId: string): Promise<ApiResponse<ILeague[]>> {
    return this.getAll({
      where: [{ field: 'members.admins', operator: 'array-contains', value: playerId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get active leagues (has active season)
   */
  async getActiveLeagues(): Promise<ApiResponse<ILeague[]>> {
    return this.getAll({
      where: [{ field: 'currentSeasonId', operator: '!=', value: null }],
      orderBy: [{ field: 'currentSeasonId', direction: 'asc' }, { field: 'createdAt', direction: 'desc' }],
    });
  }

  // ============================================
  // MEMBER MANAGEMENT
  // ============================================

  /**
   * Add member to league
   */
  async addMember(leagueId: string, playerId: string): Promise<ApiResponse<ILeague>> {
    try {
      ApiLogger.log('leagues', 'addMember', { leagueId, playerId });

      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: false,
          error: leagueResult.error || {
            code: 'NOT_FOUND',
            message: 'League not found',
            statusCode: 404,
          },
        };
      }

      // Check if already a member
      if (leagueResult.data.members.all.includes(playerId)) {
        return {
          success: true,
          data: leagueResult.data,
        };
      }

      const docRef = doc(db, this.collectionName, leagueId);

      await updateDoc(docRef, {
        'members.all': arrayUnion(playerId),
        totalMembers: (leagueResult.data.totalMembers || 0) + 1,
        updatedAt: new Date().toISOString(),
      });

      const updatedLeague = await this.getById(leagueId);

      ApiLogger.success('leagues', 'addMember', { leagueId, playerId });

      return updatedLeague;
    } catch (error: any) {
      ApiLogger.error('leagues', 'addMember', error);
      return {
        success: false,
        error: {
          code: 'ADD_MEMBER_ERROR',
          message: error.message || 'Failed to add member',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove member from league
   */
  async removeMember(leagueId: string, playerId: string): Promise<ApiResponse<ILeague>> {
    try {
      ApiLogger.log('leagues', 'removeMember', { leagueId, playerId });

      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: false,
          error: leagueResult.error || {
            code: 'NOT_FOUND',
            message: 'League not found',
            statusCode: 404,
          },
        };
      }

      const docRef = doc(db, this.collectionName, leagueId);

      await updateDoc(docRef, {
        'members.all': arrayRemove(playerId),
        'members.admins': arrayRemove(playerId), // Also remove from admins if present
        totalMembers: Math.max((leagueResult.data.totalMembers || 1) - 1, 0),
        updatedAt: new Date().toISOString(),
      });

      // Also remove from default players
      const updatedDefaultPlayers = {
        'defaultPlayers.premium': arrayRemove(playerId),
        'defaultPlayers.direct': arrayRemove(playerId),
      };

      await updateDoc(docRef, updatedDefaultPlayers);

      const updatedLeague = await this.getById(leagueId);

      ApiLogger.success('leagues', 'removeMember', { leagueId, playerId });

      return updatedLeague;
    } catch (error: any) {
      ApiLogger.error('leagues', 'removeMember', error);
      return {
        success: false,
        error: {
          code: 'REMOVE_MEMBER_ERROR',
          message: error.message || 'Failed to remove member',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add admin to league
   */
  async addAdmin(leagueId: string, playerId: string): Promise<ApiResponse<ILeague>> {
    try {
      ApiLogger.log('leagues', 'addAdmin', { leagueId, playerId });

      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: false,
          error: leagueResult.error || {
            code: 'NOT_FOUND',
            message: 'League not found',
            statusCode: 404,
          },
        };
      }

      // Must be a member first
      if (!leagueResult.data.members.all.includes(playerId)) {
        return {
          success: false,
          error: {
            code: 'NOT_MEMBER',
            message: 'Player must be a league member first',
            statusCode: 400,
          },
        };
      }

      // Check if already admin
      if (leagueResult.data.members.admins.includes(playerId)) {
        return {
          success: true,
          data: leagueResult.data,
        };
      }

      const docRef = doc(db, this.collectionName, leagueId);

      await updateDoc(docRef, {
        'members.admins': arrayUnion(playerId),
        updatedAt: new Date().toISOString(),
      });

      const updatedLeague = await this.getById(leagueId);

      ApiLogger.success('leagues', 'addAdmin', { leagueId, playerId });

      return updatedLeague;
    } catch (error: any) {
      ApiLogger.error('leagues', 'addAdmin', error);
      return {
        success: false,
        error: {
          code: 'ADD_ADMIN_ERROR',
          message: error.message || 'Failed to add admin',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove admin from league
   */
  async removeAdmin(leagueId: string, playerId: string): Promise<ApiResponse<ILeague>> {
    try {
      ApiLogger.log('leagues', 'removeAdmin', { leagueId, playerId });

      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: false,
          error: leagueResult.error || {
            code: 'NOT_FOUND',
            message: 'League not found',
            statusCode: 404,
          },
        };
      }

      // Cannot remove creator as admin
      if (leagueResult.data.createdBy === playerId) {
        return {
          success: false,
          error: {
            code: 'CANNOT_REMOVE_CREATOR',
            message: 'Cannot remove league creator as admin',
            statusCode: 400,
          },
        };
      }

      const docRef = doc(db, this.collectionName, leagueId);

      await updateDoc(docRef, {
        'members.admins': arrayRemove(playerId),
        updatedAt: new Date().toISOString(),
      });

      const updatedLeague = await this.getById(leagueId);

      ApiLogger.success('leagues', 'removeAdmin', { leagueId, playerId });

      return updatedLeague;
    } catch (error: any) {
      ApiLogger.error('leagues', 'removeAdmin', error);
      return {
        success: false,
        error: {
          code: 'REMOVE_ADMIN_ERROR',
          message: error.message || 'Failed to remove admin',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if player is admin
   */
  async isAdmin(leagueId: string, playerId: string): Promise<ApiResponse<boolean>> {
    try {
      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: false,
          error: leagueResult.error || {
            code: 'NOT_FOUND',
            message: 'League not found',
            statusCode: 404,
          },
        };
      }

      const isAdmin =
        leagueResult.data.createdBy === playerId ||
        leagueResult.data.members.admins.includes(playerId);

      return {
        success: true,
        data: isAdmin,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_ADMIN_ERROR',
          message: error.message || 'Failed to check admin status',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // LeagueAPI - Add this method
  // ============================================

  /**
   * Check if player is member
   */
  async isMember(leagueId: string, playerId: string): Promise<ApiResponse<boolean>> {
    try {
      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: false,
          error: leagueResult.error || {
            code: 'NOT_FOUND',
            message: 'League not found',
            statusCode: 404,
          },
        };
      }

      const isMember = leagueResult.data.members.all.includes(playerId);

      return {
        success: true,
        data: isMember,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_MEMBER_ERROR',
          message: error.message || 'Failed to check member status',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // DEFAULT PLAYERS MANAGEMENT
  // ============================================

  /**
   * Add player to premium list
   */
  async addPremiumPlayer(leagueId: string, playerId: string): Promise<ApiResponse<ILeague>> {
    try {
      const docRef = doc(db, this.collectionName, leagueId);

      await updateDoc(docRef, {
        'defaultPlayers.premium': arrayUnion(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(leagueId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_PREMIUM_ERROR',
          message: error.message || 'Failed to add premium player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove player from premium list
   */
  async removePremiumPlayer(leagueId: string, playerId: string): Promise<ApiResponse<ILeague>> {
    try {
      const docRef = doc(db, this.collectionName, leagueId);

      await updateDoc(docRef, {
        'defaultPlayers.premium': arrayRemove(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(leagueId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_PREMIUM_ERROR',
          message: error.message || 'Failed to remove premium player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add player to direct list
   */
  async addDirectPlayer(leagueId: string, playerId: string): Promise<ApiResponse<ILeague>> {
    try {
      const docRef = doc(db, this.collectionName, leagueId);

      await updateDoc(docRef, {
        'defaultPlayers.direct': arrayUnion(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(leagueId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_DIRECT_ERROR',
          message: error.message || 'Failed to add direct player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove player from direct list
   */
  async removeDirectPlayer(leagueId: string, playerId: string): Promise<ApiResponse<ILeague>> {
    try {
      const docRef = doc(db, this.collectionName, leagueId);

      await updateDoc(docRef, {
        'defaultPlayers.direct': arrayRemove(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(leagueId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_DIRECT_ERROR',
          message: error.message || 'Failed to remove direct player',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update default players (bulk update)
   */
  async updateDefaultPlayers(
    leagueId: string,
    defaultPlayers: {
      premium?: string[];
      direct?: string[];
    }
  ): Promise<ApiResponse<ILeague>> {
    return this.update(leagueId, {
      defaultPlayers,
    } as Partial<Omit<ILeague, 'id'>>);
  }

  // ============================================
  // SEASON MANAGEMENT
  // ============================================

  /**
   * Update current season
   */
  async updateCurrentSeason(leagueId: string, seasonId: string): Promise<ApiResponse<ILeague>> {
    return this.update(leagueId, {
      currentSeasonId: seasonId,
    } as Partial<Omit<ILeague, 'id'>>);
  }

  /**
   * Increment total seasons
   */
  async incrementTotalSeasons(leagueId: string): Promise<ApiResponse<ILeague>> {
    try {
      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return leagueResult;
      }

      return this.update(leagueId, {
        totalSeasons: (leagueResult.data.totalSeasons || 0) + 1,
      } as Partial<Omit<ILeague, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_SEASONS_ERROR',
          message: error.message || 'Failed to increment total seasons',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Increment total matches
   */
  async incrementTotalMatches(leagueId: string, count: number = 1): Promise<ApiResponse<ILeague>> {
    try {
      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return leagueResult;
      }

      return this.update(leagueId, {
        totalMatches: (leagueResult.data.totalMatches || 0) + count,
      } as Partial<Omit<ILeague, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_MATCHES_ERROR',
          message: error.message || 'Failed to increment total matches',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  /**
   * Update league settings
   */
  async updateSettings(
    leagueId: string,
    settings: Partial<ILeague['settings']>
  ): Promise<ApiResponse<ILeague>> {
    try {
      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return leagueResult;
      }

      const updatedSettings = {
        ...leagueResult.data.settings,
        ...settings,
      };

      return this.update(leagueId, {
        settings: updatedSettings,
      } as Partial<Omit<ILeague, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SETTINGS_ERROR',
          message: error.message || 'Failed to update settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update season settings
   */
  async updateSeasonSettings(
    leagueId: string,
    seasonSettings: Partial<ILeague['seasonSettings']>
  ): Promise<ApiResponse<ILeague>> {
    try {
      const leagueResult = await this.getById(leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return leagueResult;
      }

      const updatedSeasonSettings = {
        ...leagueResult.data.seasonSettings,
        ...seasonSettings,
      };

      return this.update(leagueId, {
        seasonSettings: updatedSeasonSettings,
      } as Partial<Omit<ILeague, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SEASON_SETTINGS_ERROR',
          message: error.message || 'Failed to update season settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SEARCH & FILTERS
  // ============================================

  /**
   * Search leagues by title
   */
  async searchByTitle(searchTerm: string): Promise<ApiResponse<ILeague[]>> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return { success: true, data: [] };
    }

    const normalized = searchTerm.trim().toLowerCase();

    return this.getAll({
      where: [
        { field: 'title', operator: '>=', value: normalized },
        { field: 'title', operator: '<=', value: normalized + '\uf8ff' },
      ],
      orderBy: [{ field: 'title', direction: 'asc' }],
      limit: 20,
    });
  }

  /**
   * Get leagues with filters
   */
  async getLeaguesFiltered(filters: {
    sportType?: SportType;
    creatorId?: string;
    hasActiveSeason?: boolean;
    limit?: number;
  }): Promise<ApiResponse<ILeague[]>> {
    const queryOptions: QueryOptions = {
      limit: filters.limit || 50,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    };

    const whereConditions: QueryOptions['where'] = [];

    if (filters.sportType) {
      whereConditions.push({
        field: 'sportType',
        operator: '==',
        value: filters.sportType,
      });
    }

    if (filters.creatorId) {
      whereConditions.push({
        field: 'createdBy',
        operator: '==',
        value: filters.creatorId,
      });
    }

    if (filters.hasActiveSeason !== undefined) {
      whereConditions.push({
        field: 'currentSeasonId',
        operator: filters.hasActiveSeason ? '!=' : '==',
        value: null,
      });
    }

    if (whereConditions.length > 0) {
      queryOptions.where = whereConditions;
    }

    return this.getAll(queryOptions);
  }
}

// Export singleton instance
export const leagueAPI = new LeagueAPI();