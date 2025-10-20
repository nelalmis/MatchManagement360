// ============================================
// services/AnnouncementService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { announcementsAPI } from '../../api/apiLayer/announcementsAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IAnnouncement } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class AnnouncementService {
  // ============================================
  // 1. QUERY OPERATIONS
  // ============================================

  /**
   * Get announcement by ID
   */
  static async getAnnouncement(id: string): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.getById(id);
  }

  /**
   * Get all active announcements
   */
  static async getActiveAnnouncements(): Promise<ApiResponse<IAnnouncement[]>> {
    return announcementsAPI.getActiveAnnouncements();
  }

  /**
   * Get global announcements
   */
  static async getGlobalAnnouncements(
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    return announcementsAPI.getGlobalAnnouncements(activeOnly);
  }

  /**
   * Get announcements for specific league
   */
  static async getLeagueAnnouncements(
    leagueId: string,
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    return announcementsAPI.getLeagueAnnouncements(leagueId, activeOnly);
  }

  /**
   * Get announcements for specific user
   */
  static async getUserAnnouncements(
    userId: string,
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    return announcementsAPI.getUserAnnouncements(userId, activeOnly);
  }

  /**
   * Get home page announcements
   */
  static async getHomeAnnouncements(
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    return announcementsAPI.getHomeAnnouncements(activeOnly);
  }

  /**
   * Get popup announcements
   */
  static async getPopupAnnouncements(
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    return announcementsAPI.getPopupAnnouncements(activeOnly);
  }

  /**
   * Get announcements by type
   */
  static async getAnnouncementsByType(
    type: IAnnouncement['type'],
    activeOnly: boolean = true
  ): Promise<ApiResponse<IAnnouncement[]>> {
    return announcementsAPI.getByType(type, activeOnly);
  }

  /**
   * Get announcements by creator
   */
  static async getAnnouncementsByCreator(
    createdBy: string
  ): Promise<ApiResponse<IAnnouncement[]>> {
    return announcementsAPI.getByCreator(createdBy);
  }

  // ============================================
  // 2. ANNOUNCEMENT MANAGEMENT
  // ============================================

  /**
   * Create announcement
   */
  static async createAnnouncement(data: {
    title: string;
    message: string;
    type: IAnnouncement['type'];
    target: IAnnouncement['target'];
    display: IAnnouncement['display'];
    schedule: IAnnouncement['schedule'];
    action?: IAnnouncement['action'];
    createdBy: string;
  }): Promise<ApiResponse<IAnnouncement>> {
    try {
      // Validate input
      if (!data.title || data.title.trim().length < 3) {
        return {
          success: false,
          error: {
            code: 'INVALID_TITLE',
            message: 'Başlık en az 3 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      if (!data.message || data.message.trim().length < 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_MESSAGE',
            message: 'Mesaj en az 10 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      // Validate dates
      const startDate = new Date(data.schedule.startDate);
      const endDate = new Date(data.schedule.endDate);

      if (endDate <= startDate) {
        return {
          success: false,
          error: {
            code: 'INVALID_DATES',
            message: 'Bitiş tarihi başlangıç tarihinden sonra olmalı',
            statusCode: 400,
          },
        };
      }

      // Validate target
      if (data.target.scope === 'league' && (!data.target.leagueIds || data.target.leagueIds.length === 0)) {
        return {
          success: false,
          error: {
            code: 'INVALID_TARGET',
            message: 'Lig hedefi için en az bir lig seçilmeli',
            statusCode: 400,
          },
        };
      }

      if (data.target.scope === 'users' && (!data.target.userIds || data.target.userIds.length === 0)) {
        return {
          success: false,
          error: {
            code: 'INVALID_TARGET',
            message: 'Kullanıcı hedefi için en az bir kullanıcı seçilmeli',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('AnnouncementService', 'createAnnouncement', {
        type: data.type,
        scope: data.target.scope,
      });

      const result = await announcementsAPI.createAnnouncement(data);

      if (result.success) {
        ApiLogger.success('AnnouncementService', 'createAnnouncement', {
          announcementId: result.data?.id,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AnnouncementService', 'createAnnouncement', error);
      return {
        success: false,
        error: {
          code: 'CREATE_ANNOUNCEMENT_ERROR',
          message: error.message || 'Duyuru oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update announcement
   */
  static async updateAnnouncement(
    id: string,
    updates: Partial<Omit<IAnnouncement, 'id' | 'stats' | 'createdAt' | 'createdBy' | 'updatedAt'>>
  ): Promise<ApiResponse<IAnnouncement>> {
    try {
      // Validate if dates are being updated
      if (updates.schedule) {
        const announcement = await this.getAnnouncement(id);
        
        if (!announcement.success || !announcement.data) {
          return {
            success: false,
            error: {
              code: 'ANNOUNCEMENT_NOT_FOUND',
              message: 'Duyuru bulunamadı',
              statusCode: 404,
            },
          };
        }

        const startDate = new Date(updates.schedule.startDate || announcement.data.schedule.startDate);
        const endDate = new Date(updates.schedule.endDate || announcement.data.schedule.endDate);

        if (endDate <= startDate) {
          return {
            success: false,
            error: {
              code: 'INVALID_DATES',
              message: 'Bitiş tarihi başlangıç tarihinden sonra olmalı',
              statusCode: 400,
            },
          };
        }
      }

      ApiLogger.log('AnnouncementService', 'updateAnnouncement', { id });

      const result = await announcementsAPI.updateAnnouncement(id, updates);

      if (result.success) {
        ApiLogger.success('AnnouncementService', 'updateAnnouncement', { id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AnnouncementService', 'updateAnnouncement', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_ANNOUNCEMENT_ERROR',
          message: error.message || 'Duyuru güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete announcement
   */
  static async deleteAnnouncement(id: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('AnnouncementService', 'deleteAnnouncement', { id });

      const result = await announcementsAPI.delete(id);

      if (result.success) {
        ApiLogger.success('AnnouncementService', 'deleteAnnouncement', { id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AnnouncementService', 'deleteAnnouncement', error);
      return {
        success: false,
        error: {
          code: 'DELETE_ANNOUNCEMENT_ERROR',
          message: error.message || 'Duyuru silinemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. SCHEDULE MANAGEMENT
  // ============================================

  /**
   * Activate announcement
   */
  static async activateAnnouncement(id: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      ApiLogger.log('AnnouncementService', 'activateAnnouncement', { id });

      const result = await announcementsAPI.activateAnnouncement(id);

      if (result.success) {
        ApiLogger.success('AnnouncementService', 'activateAnnouncement', { id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AnnouncementService', 'activateAnnouncement', error);
      return {
        success: false,
        error: {
          code: 'ACTIVATE_ERROR',
          message: error.message || 'Duyuru aktifleştirilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Deactivate announcement
   */
  static async deactivateAnnouncement(id: string): Promise<ApiResponse<IAnnouncement>> {
    try {
      ApiLogger.log('AnnouncementService', 'deactivateAnnouncement', { id });

      const result = await announcementsAPI.deactivateAnnouncement(id);

      if (result.success) {
        ApiLogger.success('AnnouncementService', 'deactivateAnnouncement', { id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AnnouncementService', 'deactivateAnnouncement', error);
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_ERROR',
          message: error.message || 'Duyuru devre dışı bırakılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update schedule
   */
  static async updateSchedule(
    id: string,
    schedule: Partial<IAnnouncement['schedule']>
  ): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.updateSchedule(id, schedule);
  }

  /**
   * Check if announcement is currently active (based on time)
   */
  static isAnnouncementActive(announcement: IAnnouncement): boolean {
    if (!announcement.schedule.isActive) return false;

    const now = new Date();
    const startDate = new Date(announcement.schedule.startDate);
    const endDate = new Date(announcement.schedule.endDate);

    return now >= startDate && now <= endDate;
  }

  // ============================================
  // 4. STATISTICS (CACHE)
  // ============================================

  /**
   * Increment view count
   */
  static async incrementViews(id: string): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.incrementViews(id);
  }

  /**
   * Increment click count
   */
  static async incrementClicks(id: string): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.incrementClicks(id);
  }

  /**
   * Increment dismissed count
   */
  static async incrementDismissed(id: string): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.incrementDismissed(id);
  }

  /**
   * Reset statistics
   */
  static async resetStats(id: string): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.resetStats(id);
  }

  /**
   * Get announcement statistics
   */
  static async getAnnouncementStats(id: string): Promise<ApiResponse<{
    views: number;
    clicks: number;
    dismissed: number;
    clickRate: number;
    dismissRate: number;
  }>> {
    try {
      const announcementResult = await this.getAnnouncement(id);

      if (!announcementResult.success || !announcementResult.data) {
        return {
          success: false,
          error: announcementResult.error || {
            code: 'ANNOUNCEMENT_NOT_FOUND',
            message: 'Duyuru bulunamadı',
            statusCode: 404,
          },
        };
      }

      const stats = announcementResult.data.stats;
      const clickRate = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0;
      const dismissRate = stats.views > 0 ? (stats.dismissed / stats.views) * 100 : 0;

      return {
        success: true,
        data: {
          views: stats.views,
          clicks: stats.clicks,
          dismissed: stats.dismissed,
          clickRate: parseFloat(clickRate.toFixed(2)),
          dismissRate: parseFloat(dismissRate.toFixed(2)),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATS_ERROR',
          message: error.message || 'İstatistikler alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. DISPLAY MANAGEMENT
  // ============================================

  /**
   * Update display settings
   */
  static async updateDisplay(
    id: string,
    display: Partial<IAnnouncement['display']>
  ): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.updateDisplay(id, display);
  }

  // ============================================
  // 6. TARGET MANAGEMENT
  // ============================================

  /**
   * Update target settings
   */
  static async updateTarget(
    id: string,
    target: Partial<IAnnouncement['target']>
  ): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.updateTarget(id, target);
  }

  /**
   * Add league to target
   */
  static async addLeagueToTarget(
    id: string,
    leagueId: string
  ): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.addLeagueToTarget(id, leagueId);
  }

  /**
   * Remove league from target
   */
  static async removeLeagueFromTarget(
    id: string,
    leagueId: string
  ): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.removeLeagueFromTarget(id, leagueId);
  }

  /**
   * Add user to target
   */
  static async addUserToTarget(
    id: string,
    userId: string
  ): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.addUserToTarget(id, userId);
  }

  /**
   * Remove user from target
   */
  static async removeUserFromTarget(
    id: string,
    userId: string
  ): Promise<ApiResponse<IAnnouncement>> {
    return announcementsAPI.removeUserFromTarget(id, userId);
  }

  /**
   * Set target leagues (replace all)
   */
  static async setTargetLeagues(
    id: string,
    leagueIds: string[]
  ): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcement = await this.getAnnouncement(id);

      if (!announcement.success || !announcement.data) {
        return {
          success: false,
          error: {
            code: 'ANNOUNCEMENT_NOT_FOUND',
            message: 'Duyuru bulunamadı',
            statusCode: 404,
          },
        };
      }

      return this.updateTarget(id, {
        ...announcement.data.target,
        leagueIds,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SET_LEAGUES_ERROR',
          message: error.message || 'Lig hedefleri ayarlanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Set target users (replace all)
   */
  static async setTargetUsers(
    id: string,
    userIds: string[]
  ): Promise<ApiResponse<IAnnouncement>> {
    try {
      const announcement = await this.getAnnouncement(id);

      if (!announcement.success || !announcement.data) {
        return {
          success: false,
          error: {
            code: 'ANNOUNCEMENT_NOT_FOUND',
            message: 'Duyuru bulunamadı',
            statusCode: 404,
          },
        };
      }

      return this.updateTarget(id, {
        ...announcement.data.target,
        userIds,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SET_USERS_ERROR',
          message: error.message || 'Kullanıcı hedefleri ayarlanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 7. CLEANUP
  // ============================================

  /**
   * Delete expired announcements
   */
  static async deleteExpiredAnnouncements(): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('AnnouncementService', 'deleteExpiredAnnouncements', {});

      const result = await announcementsAPI.deleteExpiredAnnouncements();

      if (result.success) {
        ApiLogger.success('AnnouncementService', 'deleteExpiredAnnouncements', {
          deletedCount: result.data,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('AnnouncementService', 'deleteExpiredAnnouncements', error);
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: error.message || 'Süresi dolmuş duyurular temizlenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 8. GROUPED & ORGANIZED
  // ============================================

  /**
   * Get announcements grouped by type
   */
  static async getAnnouncementsGroupedByType(
    activeOnly: boolean = true
  ): Promise<ApiResponse<Record<IAnnouncement['type'], IAnnouncement[]>>> {
    try {
      const types: IAnnouncement['type'][] = ['info', 'warning', 'success', 'error'];

      const results = await Promise.all(
        types.map(type => this.getAnnouncementsByType(type, activeOnly))
      );

      const grouped: Record<IAnnouncement['type'], IAnnouncement[]> = {
        info: results[0].data || [],
        warning: results[1].data || [],
        success: results[2].data || [],
        error: results[3].data || [],
      };

      return {
        success: true,
        data: grouped,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GROUP_BY_TYPE_ERROR',
          message: error.message || 'Duyurular gruplandırılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get dashboard announcements (for admin)
   */
  static async getDashboardAnnouncements(): Promise<ApiResponse<{
    active: IAnnouncement[];
    upcoming: IAnnouncement[];
    expired: IAnnouncement[];
    total: number;
  }>> {
    try {
      const allResult = await announcementsAPI.getAll();

      if (!allResult.success || !allResult.data) {
        return {
          success: false,
          error: allResult.error || {
            code: 'GET_DASHBOARD_ERROR',
            message: 'Dashboard verileri alınamadı',
            statusCode: 500,
          },
        };
      }

      const now = new Date();
      const active: IAnnouncement[] = [];
      const upcoming: IAnnouncement[] = [];
      const expired: IAnnouncement[] = [];

      for (const announcement of allResult.data) {
        const startDate = new Date(announcement.schedule.startDate);
        const endDate = new Date(announcement.schedule.endDate);

        if (endDate < now) {
          expired.push(announcement);
        } else if (startDate > now) {
          upcoming.push(announcement);
        } else {
          active.push(announcement);
        }
      }

      return {
        success: true,
        data: {
          active,
          upcoming,
          expired,
          total: allResult.data.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_DASHBOARD_ERROR',
          message: error.message || 'Dashboard verileri alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 9. HELPER METHODS
  // ============================================

  /**
   * Get type display info
   */
  static getTypeDisplay(type: IAnnouncement['type']): {
    label: string;
    icon: string;
    color: string;
  } {
    const typeMap: Record<
      IAnnouncement['type'],
      { label: string; icon: string; color: string }
    > = {
      info: { label: 'Bilgi', icon: 'ℹ️', color: 'blue' },
      warning: { label: 'Uyarı', icon: '⚠️', color: 'yellow' },
      success: { label: 'Başarı', icon: '✅', color: 'green' },
      error: { label: 'Hata', icon: '❌', color: 'red' },
    };

    return typeMap[type];
  }

  /**
   * Format announcement for display
   */
  static formatAnnouncement(announcement: IAnnouncement): {
    id?: string;
    title: string;
    message: string;
    type: ReturnType<typeof AnnouncementService.getTypeDisplay>;
    scope: string;
    isActive: boolean;
    timeStatus: 'active' | 'upcoming' | 'expired';
    stats: {
      views: number;
      clickRate: string;
      dismissRate: string;
    };
  } {
    const now = new Date();
    const startDate = new Date(announcement.schedule.startDate);
    const endDate = new Date(announcement.schedule.endDate);

    let timeStatus: 'active' | 'upcoming' | 'expired';
    if (endDate < now) {
      timeStatus = 'expired';
    } else if (startDate > now) {
      timeStatus = 'upcoming';
    } else {
      timeStatus = 'active';
    }

    const clickRate =
      announcement.stats.views > 0
        ? ((announcement.stats.clicks / announcement.stats.views) * 100).toFixed(1)
        : '0.0';

    const dismissRate =
      announcement.stats.views > 0
        ? ((announcement.stats.dismissed / announcement.stats.views) * 100).toFixed(1)
        : '0.0';

    return {
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      type: this.getTypeDisplay(announcement.type),
      scope: announcement.target.scope === 'global' ? 'Tüm Kullanıcılar' :
             announcement.target.scope === 'league' ? `${announcement.target.leagueIds?.length} Lig` :
             `${announcement.target.userIds?.length} Kullanıcı`,
      isActive: this.isAnnouncementActive(announcement),
      timeStatus,
      stats: {
        views: announcement.stats.views,
        clickRate: `${clickRate}%`,
        dismissRate: `${dismissRate}%`,
      },
    };
  }

  /**
   * Validate announcement data
   */
  static validateAnnouncement(data: {
    title: string;
    message: string;
    schedule: IAnnouncement['schedule'];
    target: IAnnouncement['target'];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Title validation
    if (!data.title || data.title.trim().length < 3) {
      errors.push('Başlık en az 3 karakter olmalı');
    }

    if (data.title && data.title.length > 200) {
      errors.push('Başlık en fazla 200 karakter olabilir');
    }

    // Message validation
    if (!data.message || data.message.trim().length < 10) {
      errors.push('Mesaj en az 10 karakter olmalı');
    }

    if (data.message && data.message.length > 2000) {
      errors.push('Mesaj en fazla 2000 karakter olabilir');
    }

    // Date validation
    const startDate = new Date(data.schedule.startDate);
    const endDate = new Date(data.schedule.endDate);

    if (endDate <= startDate) {
      errors.push('Bitiş tarihi başlangıç tarihinden sonra olmalı');
    }

    // Target validation
    if (data.target.scope === 'league' && (!data.target.leagueIds || data.target.leagueIds.length === 0)) {
      errors.push('Lig hedefi için en az bir lig seçilmeli');
    }

    if (data.target.scope === 'users' && (!data.target.userIds || data.target.userIds.length === 0)) {
      errors.push('Kullanıcı hedefi için en az bir kullanıcı seçilmeli');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get announcement summary for admin dashboard
   */
  static async getAnnouncementSummary(): Promise<ApiResponse<{
    total: number;
    active: number;
    upcoming: number;
    expired: number;
    byType: Record<string, number>;
    totalViews: number;
    totalClicks: number;
    avgClickRate: number;
  }>> {
    try {
      const dashboardResult = await this.getDashboardAnnouncements();

      if (!dashboardResult.success || !dashboardResult.data) {
        return {
          success: false,
          error: dashboardResult.error || {
            code: 'GET_SUMMARY_ERROR',
            message: 'Özet alınamadı',
            statusCode: 500,
          },
        };
      }

      const { active, upcoming, expired, total } = dashboardResult.data;
      const allAnnouncements = [...active, ...upcoming, ...expired];

      const byType: Record<string, number> = {
        info: 0,
        warning: 0,
        success: 0,
        error: 0,
      };

      let totalViews = 0;
      let totalClicks = 0;

      for (const announcement of allAnnouncements) {
        byType[announcement.type]++;
        totalViews += announcement.stats.views;
        totalClicks += announcement.stats.clicks;
      }

      const avgClickRate = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

      return {
        success: true,
        data: {
          total,
          active: active.length,
          upcoming: upcoming.length,
          expired: expired.length,
          byType,
          totalViews,
          totalClicks,
          avgClickRate: parseFloat(avgClickRate.toFixed(2)),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Özet alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

export default AnnouncementService;


/*

// ✅ Create global announcement
const announcement = await AnnouncementService.createAnnouncement({
  title: 'Sistem Bakımı',
  message: 'Yarın saat 02:00-04:00 arası sistem bakım çalışması yapılacaktır.',
  type: 'warning',
  target: {
    scope: 'global',
  },
  display: {
    showOnHome: true,
    showAsPopup: true,
    showInLeague: true,
    dismissable: true,
  },
  schedule: {
    startDate: '2025-01-15T00:00:00Z',
    endDate: '2025-01-16T23:59:59Z',
    isActive: true,
  },
  action: {
    label: 'Daha Fazla Bilgi',
    url: '/maintenance',
  },
  createdBy: adminId,
});

// ✅ Create league-specific announcement
await AnnouncementService.createAnnouncement({
  title: 'Lig Sezonu Başladı',
  message: 'Yeni sezon başladı! İlk maçınız için kayıt olun.',
  type: 'success',
  target: {
    scope: 'league',
    leagueIds: [league1Id, league2Id],
  },
  display: {
    showOnHome: false,
    showAsPopup: true,
    showInLeague: true,
    dismissable: true,
  },
  schedule: {
    startDate: '2025-01-01T00:00:00Z',
    endDate: '2025-01-31T23:59:59Z',
    isActive: true,
  },
  createdBy: adminId,
});

// ✅ Get announcements for user (combines global + user-specific)
const userAnnouncements = await AnnouncementService.getUserAnnouncements(userId);

// ✅ Get announcements for league (combines global + league-specific)
const leagueAnnouncements = await AnnouncementService.getLeagueAnnouncements(leagueId);

// ✅ When user views announcement, track view
await AnnouncementService.incrementViews(announcementId);

// ✅ When user clicks CTA button, track click
await AnnouncementService.incrementClicks(announcementId);

// ✅ When user dismisses announcement, track dismiss
await AnnouncementService.incrementDismissed(announcementId);

// ✅ Get announcement statistics
const stats = await AnnouncementService.getAnnouncementStats(announcementId);
console.log(`Views: ${stats.data?.views}`);
console.log(`Click rate: ${stats.data?.clickRate}%`);
console.log(`Dismiss rate: ${stats.data?.dismissRate}%`);

// ✅ Get popup announcements for homepage
const popups = await AnnouncementService.getPopupAnnouncements();
// Show as modal/toast

// ✅ Admin dashboard - get all announcements grouped
const dashboard = await AnnouncementService.getDashboardAnnouncements();
console.log('Active:', dashboard.data?.active.length);
console.log('Upcoming:', dashboard.data?.upcoming.length);
console.log('Expired:', dashboard.data?.expired.length);

// ✅ Validate before create/update
const validation = AnnouncementService.validateAnnouncement({
  title: 'Hi',
  message: 'Short',
  schedule: {
    startDate: '2025-01-15',
    endDate: '2025-01-14', // Invalid: before start
    isActive: true,
  },
  target: {
    scope: 'league',
*/