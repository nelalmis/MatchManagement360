// ============================================
// services/ActivityLogService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { activityLogAPI } from '../../api/apiLayer/activityLogAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IActivityLog } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class ActivityLogService {
  // ============================================
  // 1. QUERY OPERATIONS
  // ============================================

  /**
   * Get activity log by ID
   */
  static async getActivityLog(logId: string): Promise<ApiResponse<IActivityLog>> {
    return activityLogAPI.getById(logId);
  }

  /**
   * Get user activity logs
   */
  static async getUserActivity(
    userId: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getByUser(userId, limit);
  }

  /**
   * Get activity logs by action
   */
  static async getActivityByAction(
    action: IActivityLog['action'],
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getByAction(action, limit);
  }

  /**
   * Get entity activity logs
   */
  static async getEntityActivity(
    entityType: IActivityLog['entityType'],
    entityId: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getByEntity(entityType, entityId, limit);
  }

  /**
   * Get league activity logs
   */
  static async getLeagueActivity(
    leagueId: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getLeagueActivity(leagueId, limit);
  }

  /**
   * Get match activity logs
   */
  static async getMatchActivity(
    matchId: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getMatchActivity(matchId, limit);
  }

  /**
   * Get season activity logs
   */
  static async getSeasonActivity(
    seasonId: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getSeasonActivity(seasonId, limit);
  }

  /**
   * Get fixture activity logs
   */
  static async getFixtureActivity(
    fixtureId: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getFixtureActivity(fixtureId, limit);
  }

  /**
   * Get player activity logs
   */
  static async getPlayerActivity(
    playerId: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getPlayerActivity(playerId, limit);
  }

  /**
   * Get recent activity (system-wide)
   */
  static async getRecentActivity(limit: number = 100): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getRecentActivity(limit);
  }

  /**
   * Get activity by date range
   */
  static async getActivityByDateRange(
    startDate: string,
    endDate: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getActivityByDateRange(startDate, endDate, limit);
  }

  /**
   * Get user activity by date range
   */
  static async getUserActivityByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getUserActivityByDateRange(userId, startDate, endDate);
  }

  /**
   * Get activity by IP address (security)
   */
  static async getActivityByIP(ipAddress: string): Promise<ApiResponse<IActivityLog[]>> {
    return activityLogAPI.getByIpAddress(ipAddress);
  }

  // ============================================
  // 2. LOG CREATION (GENERIC)
  // ============================================

  /**
   * Create generic activity log
   */
  static async logActivity(data: {
    userId: string;
    action: IActivityLog['action'];
    entityType: IActivityLog['entityType'];
    entityId: string;
    entityName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }): Promise<ApiResponse<IActivityLog>> {
    try {
      // Get user name
      const userResult = await playerAPI.getById(data.userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logActivity({
        ...data,
        userName,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ACTIVITY_ERROR',
          message: error.message || 'Aktivite kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. SPECIFIC ACTION LOGS
  // ============================================

  /**
   * Log league creation
   */
  static async logLeagueCreated(
    userId: string,
    leagueId: string,
    leagueName: string,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logLeagueCreated(
        userId,
        userName,
        leagueId,
        leagueName,
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Log match creation
   */
  static async logMatchCreated(
    userId: string,
    matchId: string,
    matchTitle: string,
    details?: Record<string, any>,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logMatchCreated(
        userId,
        userName,
        matchId,
        matchTitle,
        details,
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Log match registration
   */
  static async logMatchRegistered(
    userId: string,
    matchId: string,
    matchTitle: string,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logMatchRegistered(
        userId,
        userName,
        matchId,
        matchTitle,
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Log team assignment
   */
  static async logTeamAssigned(
    userId: string,
    matchId: string,
    matchTitle: string,
    team: string,
    position?: string,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logTeamAssigned(
        userId,
        userName,
        matchId,
        matchTitle,
        { team, position },
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Log score submission
   */
  static async logScoreSubmitted(
    userId: string,
    matchId: string,
    matchTitle: string,
    team1Score: number,
    team2Score: number,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logScoreSubmitted(
        userId,
        userName,
        matchId,
        matchTitle,
        { team1Score, team2Score },
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Log payment confirmation
   */
  static async logPaymentConfirmed(
    userId: string,
    matchId: string,
    matchTitle: string,
    playerId: string,
    amount: number,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logPaymentConfirmed(
        userId,
        userName,
        matchId,
        matchTitle,
        { playerId, amount },
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Log rating given
   */
  static async logRatingGiven(
    userId: string,
    matchId: string,
    matchTitle: string,
    ratedPlayerId: string,
    rating: number,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logRatingGiven(
        userId,
        userName,
        matchId,
        matchTitle,
        { ratedPlayerId, rating },
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Log comment posted
   */
  static async logCommentPosted(
    userId: string,
    matchId: string,
    matchTitle: string,
    commentId: string,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logCommentPosted(
        userId,
        userName,
        matchId,
        matchTitle,
        { commentId },
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Log MVP awarded
   */
  static async logMVPAwarded(
    userId: string,
    matchId: string,
    matchTitle: string,
    mvpPlayerId: string,
    mvpPlayerName: string,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    try {
      const userResult = await playerAPI.getById(userId);
      const userName = userResult.success && userResult.data
        ? `${userResult.data.name} ${userResult.data.surname}`
        : 'Unknown User';

      return activityLogAPI.logMVPAwarded(
        userId,
        userName,
        matchId,
        matchTitle,
        { mvpPlayerId, mvpPlayerName },
        ipAddress
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'LOG_ERROR',
          message: error.message || 'Log kaydedilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(userId: string): Promise<ApiResponse<{
    totalActivities: number;
    byAction: Record<string, number>;
    mostRecentActivity?: IActivityLog;
    firstActivity?: IActivityLog;
    mostCommonAction: string;
    activityRate: string; // activities per day
  }>> {
    try {
      const summaryResult = await activityLogAPI.getUserActivitySummary(userId);

      if (!summaryResult.success || !summaryResult.data) {
        return {
          success: false,
          error: summaryResult.error || {
            code: 'GET_SUMMARY_ERROR',
            message: 'Özet alınamadı',
            statusCode: 500,
          },
        };
      }

      const summary = summaryResult.data;

      // Find most common action
      let mostCommonAction = '';
      let maxCount = 0;

      for (const [action, count] of Object.entries(summary.byAction)) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonAction = action;
        }
      }

      // Calculate activity rate
      let activityRate = '0';
      if (summary.firstActivity && summary.mostRecentActivity) {
        const firstDate = new Date(summary.firstActivity.timestamp);
        const lastDate = new Date(summary.mostRecentActivity.timestamp);
        const daysDiff = Math.max(
          1,
          Math.floor((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))
        );
        const rate = summary.totalActivities / daysDiff;
        activityRate = rate.toFixed(1);
      }

      return {
        success: true,
        data: {
          ...summary,
          mostCommonAction,
          activityRate,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Özet alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get entity activity summary
   */
  static async getEntityActivitySummary(
    entityType: IActivityLog['entityType'],
    entityId: string
  ): Promise<ApiResponse<{
    totalActivities: number;
    byAction: Record<string, number>;
    byUser: Record<string, number>;
    recentActivities: IActivityLog[];
    mostActiveUser?: { userId: string; count: number };
  }>> {
    try {
      const summaryResult = await activityLogAPI.getEntityActivitySummary(
        entityType,
        entityId
      );

      if (!summaryResult.success || !summaryResult.data) {
        return {
          success: false,
          error: summaryResult.error || {
            code: 'GET_SUMMARY_ERROR',
            message: 'Özet alınamadı',
            statusCode: 500,
          },
        };
      }

      const summary = summaryResult.data;

      // Find most active user
      let mostActiveUser: { userId: string; count: number } | undefined;
      let maxCount = 0;

      for (const [userId, count] of Object.entries(summary.byUser)) {
        if (count > maxCount) {
          maxCount = count;
          mostActiveUser = { userId, count };
        }
      }

      return {
        success: true,
        data: {
          ...summary,
          mostActiveUser,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Özet alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get system activity statistics (admin)
   */
  static async getSystemActivityStats(days: number = 7): Promise<ApiResponse<{
    totalActivities: number;
    byAction: Record<string, number>;
    byEntityType: Record<string, number>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
    activityTimeline: Array<{ date: string; count: number }>;
    averageActivitiesPerDay: number;
    peakActivityDay: string;
  }>> {
    try {
      const statsResult = await activityLogAPI.getSystemActivityStats(days);

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: statsResult.error || {
            code: 'GET_STATS_ERROR',
            message: 'İstatistikler alınamadı',
            statusCode: 500,
          },
        };
      }

      const stats = statsResult.data;

      // Calculate average per day
      const averageActivitiesPerDay = stats.activityTimeline.length > 0
        ? stats.totalActivities / stats.activityTimeline.length
        : 0;

      // Find peak activity day
      let peakActivityDay = '';
      let maxDayCount = 0;

      for (const day of stats.activityTimeline) {
        if (day.count > maxDayCount) {
          maxDayCount = day.count;
          peakActivityDay = day.date;
        }
      }

      return {
        success: true,
        data: {
          ...stats,
          averageActivitiesPerDay,
          peakActivityDay,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATS_ERROR',
          message: error.message || 'İstatistikler alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. TIMELINE GENERATION
  // ============================================

  /**
   * Generate formatted timeline for UI
   */
  static async generateTimeline(
    entityType: IActivityLog['entityType'],
    entityId: string,
    limit: number = 50
  ): Promise<ApiResponse<Array<{
    id: string;
    action: string;
    description: string;
    user: string;
    timestamp: string;
    age: string;
    icon: string;
    color: string;
    details?: Record<string, any>;
  }>>> {
    try {
      const activitiesResult = await activityLogAPI.getByEntity(
        entityType,
        entityId,
        limit
      );

      if (!activitiesResult.success || !activitiesResult.data) {
        return {
          success: false,
          error: activitiesResult.error || {
            code: 'GET_ACTIVITIES_ERROR',
            message: 'Aktiviteler alınamadı',
            statusCode: 500,
          },
        };
      }

      const activities = activitiesResult.data;

      const timeline = activities.map(activity => {
        const display = this.getActionDisplay(activity.action);
        const description = this.generateDescription(activity);
        const age = this.getActivityAge(activity);

        return {
          id: activity.id,
          action: activity.action,
          description,
          user: activity.userName,
          timestamp: activity.timestamp,
          age,
          icon: display.icon,
          color: display.color,
          details: activity.details,
        };
      });

      return {
        success: true,
        data: timeline,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GENERATE_TIMELINE_ERROR',
          message: error.message || 'Timeline oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. CLEANUP & MAINTENANCE
  // ============================================

  /**
   * Delete old activity logs (data retention)
   */
  static async deleteOldLogs(
    daysOld: number = 90
  ): Promise<ApiResponse<{
    deleted: number;
  }>> {
    try {
      const result = await activityLogAPI.deleteOldLogs(daysOld);

      if (result.success) {
        return {
          success: true,
          data: {
            deleted: result.data || 0,
          },
        };
      }

      return {
        success: false,
        error: result.error || {
          code: 'DELETE_ERROR',
          message: 'Eski kayıtlar silinemedi',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Eski kayıtlar silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 7. HELPER METHODS
  // ============================================

  /**
   * Get action display info
   */
  private static getActionDisplay(action: IActivityLog['action']): {
    label: string;
    icon: string;
    color: string;
  } {
    const actionMap: Record<IActivityLog['action'], {
      label: string;
      icon: string;
      color: string;
    }> = {
      league_created: { label: 'Lig Oluşturuldu', icon: '🏆', color: 'blue' },
      match_created: { label: 'Maç Oluşturuldu', icon: '⚽', color: 'green' },
      match_registered: { label: 'Maça Kayıt Oldu', icon: '✅', color: 'green' },
      team_assigned: { label: 'Takıma Atandı', icon: '👥', color: 'purple' },
      score_submitted: { label: 'Skor Girildi', icon: '🎯', color: 'orange' },
      payment_confirmed: { label: 'Ödeme Onaylandı', icon: '💰', color: 'yellow' },
      rating_given: { label: 'Puanlama Yapıldı', icon: '⭐', color: 'gold' },
      comment_posted: { label: 'Yorum Yapıldı', icon: '💬', color: 'blue' },
      mvp_awarded: { label: 'MVP Verildi', icon: '🏅', color: 'gold' },
    };

    return actionMap[action] || { label: 'Aktivite', icon: '📝', color: 'gray' };
  }

  /**
   * Generate human-readable description
   */
  private static generateDescription(activity: IActivityLog): string {
    const display = this.getActionDisplay(activity.action);
    
    switch (activity.action) {
      case 'league_created':
        return `${activity.userName} "${activity.entityName}" ligini oluşturdu`;
      case 'match_created':
        return `${activity.userName} "${activity.entityName}" maçını oluşturdu`;
      case 'match_registered':
        return `${activity.userName} maça kayıt oldu`;
      case 'team_assigned':
        return activity.details?.team
          ? `${activity.userName} ${activity.details.team} takımına atandı`
          : `${activity.userName} takıma atandı`;
      case 'score_submitted':
        return activity.details?.team1Score !== undefined
          ? `${activity.userName} skoru girdi: ${activity.details.team1Score}-${activity.details.team2Score}`
          : `${activity.userName} skoru girdi`;
      case 'payment_confirmed':
        return activity.details?.amount
          ? `${activity.userName} ${activity.details.amount} TL ödemeyi onayladı`
          : `${activity.userName} ödemeyi onayladı`;
      case 'rating_given':
        return activity.details?.rating
          ? `${activity.userName} ${activity.details.rating} puan verdi`
          : `${activity.userName} puanlama yaptı`;
      case 'comment_posted':
        return `${activity.userName} yorum yaptı`;
      case 'mvp_awarded':
        return activity.details?.mvpPlayerName
          ? `${activity.details.mvpPlayerName} MVP seçildi`
          : `MVP verildi`;
      default:
        return `${activity.userName} ${display.label.toLowerCase()}`;
    }
  }

  /**
   * Get activity age (human-readable)
   */
  private static getActivityAge(activity: IActivityLog): string {
    const now = new Date();
    const timestamp = new Date(activity.timestamp);
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays === 1) return 'Dün';
    if (diffDays < 7) return `${diffDays} gün önce`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
    return `${Math.floor(diffDays / 30)} ay önce`;
  }

  /**
   * Group activities by date
   */
  static groupActivitiesByDate(
    activities: IActivityLog[]
  ): Record<string, IActivityLog[]> {
    const groups: Record<string, IActivityLog[]> = {};

    for (const activity of activities) {
      const date = new Date(activity.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Bugün';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Dün';
      } else {
        groupKey = date.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(activity);
    }

    return groups;
  }
}

export default ActivityLogService;



/*

// ✅ Match detail page - Show timeline
const timeline = await ActivityLogService.generateTimeline('match', matchId);
// Returns formatted data with icons, colors, descriptions

// ✅ After creating a match
await ActivityLogService.logMatchCreated(userId, matchId, matchTitle, details, req.ip);

// ✅ Admin dashboard - System stats
const stats = await ActivityLogService.getSystemActivityStats(7);
console.log(stats.topUsers); // Top 10 most active users
console.log(stats.peakActivityDay); // Busiest day

// ✅ User profile - Activity summary
const summary = await ActivityLogService.getUserActivitySummary(userId);
console.log(summary.activityRate); // "3.5 activities per day"

// ✅ Security investigation
const suspiciousActivities = await ActivityLogService.getActivityByIP(ipAddress);

// ✅ Data retention - GDPR compliance
await ActivityLogService.deleteOldLogs(90); // Delete logs older than 90 days
*/