// ============================================
// api/AnnouncementsAPI.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { ApiLogger } from '../base/ApiLogger';
import { IAnnouncement } from '../../types/entity/types';

// ============================================
// TYPES
// ============================================
export type AnnouncementType = 'info' | 'warning' | 'success' | 'error';
export type AnnouncementScope = 'global' | 'league' | 'users';


// ============================================
// API CLASS
// ============================================
export class AnnouncementsAPI extends BaseAPI<IAnnouncement> {
  constructor() {
    super('announcements');
  }

  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Create a new announcement
   */
  async createAnnouncement(
    announcementData: Omit<IAnnouncement, 'id' | 'stats' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<IAnnouncement>> {
    try {
      const dataWithStats: Omit<IAnnouncement, 'id' > = {
        ...announcementData,
        stats: {
          views: 0,
          clicks: 0,
          dismissed: 0,
        },
        createdAt: new Date().toISOString(),
      };

      return this.create(dataWithStats);
    } catch (error: any) {
      ApiLogger.error('announcements', 'createAnnouncement', error);
      return {
        success: false,
        error: {
          code: 'CREATE_ANNOUNCEMENT_ERROR',
          message: error.message || 'Failed to create announcement',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update announcement
   */
  async updateAnnouncement(
    id: string,
    updates: Partial<Omit<IAnnouncement, 'id' | 'stats' | 'createdAt' | 'createdBy' | 'updatedAt'>>
  ): Promise<ApiResponse<IAnnouncement>> {
    return this.update(id, updates);
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Get active announcements
   */
  async getActiveAnnouncements(): Promise<ApiResponse<IAnnouncement[]>> {
    const now = new Date().toISOString();

    return this.getAll({
      where: [
        { field: 'schedule.isActive', operator: '==', value: true },
        { field: 'schedule.startDate', operator: '<=', value: now },
        { field: 'schedule.endDate', operator: '>=', value: now },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get global announcements
   */
  async getGlobalAnnouncements(activeOnly: boolean = true): Promise<ApiResponse<IAnnouncement[]>> {
    const whereConditions: QueryOptions['where'] = [
      { field: 'target.scope', operator: '==', value: 'global' },
    ];

    if (activeOnly) {
      const now = new Date().toISOString();
      whereConditions.push(
        { field: 'schedule.isActive', operator: '==', value: true },
        { field: 'schedule.startDate', operator: '<=', value: now },
        { field: 'schedule.endDate', operator: '>=', value: now }
      );
    }

    return this.getAll({
      where: whereConditions,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get announcements for a specific league
   */
  async getLeagueAnnouncements(
    leagueId: string,
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    try {
      // Get global announcements
      const globalResult = await this.getGlobalAnnouncements(activeOnly);

      // Get league-specific announcements
      const whereConditions: QueryOptions['where'] = [
        { field: 'target.scope', operator: '==', value: 'league' },
        { field: 'target.leagueIds', operator: 'array-contains', value: leagueId },
      ];

      if (activeOnly) {
        const now = new Date().toISOString();
        whereConditions.push(
          { field: 'schedule.isActive', operator: '==', value: true },
          { field: 'schedule.startDate', operator: '<=', value: now },
          { field: 'schedule.endDate', operator: '>=', value: now }
        );
      }

      const leagueResult = await this.getAll({
        where: whereConditions,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
      });

      // Combine results
      const allAnnouncements = [
        ...(globalResult.data || []),
        ...(leagueResult.data || []),
      ];

      return {
        success: true,
        data: allAnnouncements,
      };
    } catch (error: any) {
      ApiLogger.error('announcements', 'getLeagueAnnouncements', error);
      return {
        success: false,
        error: {
          code: 'GET_LEAGUE_ANNOUNCEMENTS_ERROR',
          message: error.message || 'Failed to get league announcements',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get announcements for a specific user
   */
  async getUserAnnouncements(
    userId: string,
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    try {
      // Get global announcements
      const globalResult = await this.getGlobalAnnouncements(activeOnly);

      // Get user-specific announcements
      const whereConditions: QueryOptions['where'] = [
        { field: 'target.scope', operator: '==', value: 'users' },
        { field: 'target.userIds', operator: 'array-contains', value: userId },
      ];

      if (activeOnly) {
        const now = new Date().toISOString();
        whereConditions.push(
          { field: 'schedule.isActive', operator: '==', value: true },
          { field: 'schedule.startDate', operator: '<=', value: now },
          { field: 'schedule.endDate', operator: '>=', value: now }
        );
      }

      const userResult = await this.getAll({
        where: whereConditions,
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
      });

      // Combine results
      const allAnnouncements = [
        ...(globalResult.data || []),
        ...(userResult.data || []),
      ];

      return {
        success: true,
        data: allAnnouncements,
      };
    } catch (error: any) {
      ApiLogger.error('announcements', 'getUserAnnouncements', error);
      return {
        success: false,
        error: {
          code: 'GET_USER_ANNOUNCEMENTS_ERROR',
          message: error.message || 'Failed to get user announcements',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get home page announcements
   */
  async getHomeAnnouncements(activeOnly: boolean = true): Promise<ApiResponse<IAnnouncement[]>> {
    const whereConditions: QueryOptions['where'] = [
      { field: 'display.showOnHome', operator: '==', value: true },
    ];

    if (activeOnly) {
      const now = new Date().toISOString();
      whereConditions.push(
        { field: 'schedule.isActive', operator: '==', value: true },
        { field: 'schedule.startDate', operator: '<=', value: now },
        { field: 'schedule.endDate', operator: '>=', value: now }
      );
    }

    return this.getAll({
      where: whereConditions,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get popup announcements
   */
  async getPopupAnnouncements(activeOnly: boolean = true): Promise<ApiResponse<IAnnouncement[]>> {
    const whereConditions: QueryOptions['where'] = [
      { field: 'display.showAsPopup', operator: '==', value: true },
    ];

    if (activeOnly) {
      const now = new Date().toISOString();
      whereConditions.push(
        { field: 'schedule.isActive', operator: '==', value: true },
        { field: 'schedule.startDate', operator: '<=', value: now },
        { field: 'schedule.endDate', operator: '>=', value: now }
      );
    }

    return this.getAll({
      where: whereConditions,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get announcements by type
   */
  async getByType(
    type: AnnouncementType,
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    const whereConditions: QueryOptions['where'] = [
      { field: 'type', operator: '==', value: type },
    ];

    if (activeOnly) {
      const now = new Date().toISOString();
      whereConditions.push(
        { field: 'schedule.isActive', operator: '==', value: true },
        { field: 'schedule.startDate', operator: '<=', value: now },
        { field: 'schedule.endDate', operator: '>=', value: now }
      );
    }

    return this.getAll({
      where: whereConditions,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get announcements by creator
   */
  async getByCreator(createdBy: string): Promise<ApiResponse<IAnnouncement[]>> {
    return this.getAll({
      where: [{ field: 'createdBy', operator: '==', value: createdBy }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  // ============================================
  // SCHEDULE METHODS
  // ============================================

  /**
   * Activate announcement
   */
  async activateAnnouncement(id: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      return this.update(id, {
        schedule: {
          ...announcementResult.data.schedule,
          isActive: true,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ACTIVATE_ERROR',
          message: error.message || 'Failed to activate announcement',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Deactivate announcement
   */
  async deactivateAnnouncement(id: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      return this.update(id, {
        schedule: {
          ...announcementResult.data.schedule,
          isActive: false,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_ERROR',
          message: error.message || 'Failed to deactivate announcement',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update schedule
   */
  async updateSchedule(
    id: string,
    schedule: Partial<IAnnouncement['schedule']>
  ): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      return this.update(id, {
        schedule: {
          ...announcementResult.data.schedule,
          ...schedule,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SCHEDULE_ERROR',
          message: error.message || 'Failed to update schedule',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATS METHODS (CACHE)
  // ============================================

  /**
   * Increment view count
   */
  async incrementViews(id: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      return this.update(id, {
        stats: {
          ...announcementResult.data.stats,
          views: announcementResult.data.stats.views + 1,
        },
      });
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
   * Increment click count
   */
  async incrementClicks(id: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      return this.update(id, {
        stats: {
          ...announcementResult.data.stats,
          clicks: announcementResult.data.stats.clicks + 1,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_CLICKS_ERROR',
          message: error.message || 'Failed to increment clicks',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Increment dismissed count
   */
  async incrementDismissed(id: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      return this.update(id, {
        stats: {
          ...announcementResult.data.stats,
          dismissed: announcementResult.data.stats.dismissed + 1,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_DISMISSED_ERROR',
          message: error.message || 'Failed to increment dismissed',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reset stats
   */
  async resetStats(id: string): Promise<ApiResponse<IAnnouncement>> {
    return this.update(id, {
      stats: {
        views: 0,
        clicks: 0,
        dismissed: 0,
      },
    });
  }

  // ============================================
  // DISPLAY METHODS
  // ============================================

  /**
   * Update display settings
   */
  async updateDisplay(
    id: string,
    display: Partial<IAnnouncement['display']>
  ): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      return this.update(id, {
        display: {
          ...announcementResult.data.display,
          ...display,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_DISPLAY_ERROR',
          message: error.message || 'Failed to update display settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // TARGET METHODS
  // ============================================

  /**
   * Update target settings
   */
  async updateTarget(
    id: string,
    target: Partial<IAnnouncement['target']>
  ): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      return this.update(id, {
        target: {
          ...announcementResult.data.target,
          ...target,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_TARGET_ERROR',
          message: error.message || 'Failed to update target settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add league to target
   */
  async addLeagueToTarget(id: string, leagueId: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      const currentLeagues = announcementResult.data.target.leagueIds || [];

      if (currentLeagues.includes(leagueId)) {
        return {
          success: true,
          data: announcementResult.data,
        };
      }

      return this.update(id, {
        target: {
          ...announcementResult.data.target,
          leagueIds: [...currentLeagues, leagueId],
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_LEAGUE_ERROR',
          message: error.message || 'Failed to add league to target',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove league from target
   */
  async removeLeagueFromTarget(id: string, leagueId: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      const currentLeagues = announcementResult.data.target.leagueIds || [];
      const updatedLeagues = currentLeagues.filter((id) => id !== leagueId);

      return this.update(id, {
        target: {
          ...announcementResult.data.target,
          leagueIds: updatedLeagues,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_LEAGUE_ERROR',
          message: error.message || 'Failed to remove league from target',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add user to target
   */
  async addUserToTarget(id: string, userId: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      const currentUsers = announcementResult.data.target.userIds || [];

      if (currentUsers.includes(userId)) {
        return {
          success: true,
          data: announcementResult.data,
        };
      }

      return this.update(id, {
        target: {
          ...announcementResult.data.target,
          userIds: [...currentUsers, userId],
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_USER_ERROR',
          message: error.message || 'Failed to add user to target',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove user from target
   */
  async removeUserFromTarget(id: string, userId: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcementResult = await this.getById(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'NOT_FOUND',
            message: 'Announcement not found',
            statusCode: 404,
          },
        };
      }

      const currentUsers = announcementResult.data.target.userIds || [];
      const updatedUsers = currentUsers.filter((id) => id !== userId);

      return this.update(id, {
        target: {
          ...announcementResult.data.target,
          userIds: updatedUsers,
        },
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_USER_ERROR',
          message: error.message || 'Failed to remove user from target',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // CLEANUP METHODS
  // ============================================

  /**
   * Delete expired announcements
   */
  async deleteExpiredAnnouncements(): Promise<ApiResponse<number>> {
    try {
      const now = new Date().toISOString();

      const expiredResult = await this.getAll({
        where: [{ field: 'schedule.endDate', operator: '<', value: now }],
      });

      if (!expiredResult.success || !expiredResult.data) {
        return {
          success: false,
          error: expiredResult.error || {
            code: 'CLEANUP_ERROR',
            message: 'Failed to get expired announcements',
            statusCode: 500,
          },
        };
      }

      if (expiredResult.data.length === 0) {
        return { success: true, data: 0 };
      }

      const ids = expiredResult.data.filter(ann => ann.id).map((ann) => ann.id!);
      const deleteResult = await this.deleteBatch(ids);

      if (!deleteResult.success) {
        return {
          success: false,
          error: deleteResult.error || {
            code: 'CLEANUP_ERROR',
            message: 'Failed to delete expired announcements',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: ids.length,
      };
    } catch (error: any) {
      ApiLogger.error('announcements', 'deleteExpiredAnnouncements', error);
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: error.message || 'Failed to cleanup expired announcements',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const announcementsAPI = new AnnouncementsAPI();