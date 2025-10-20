// ============================================
// api/activityLogApi.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { IActivityLog } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';

export class ActivityLogAPI extends BaseAPI<IActivityLog> {
  constructor() {
    super('activityLogs');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get activity logs by user
   */
  async getByUser(userId: string, limit?: number): Promise<ApiResponse<IActivityLog[]>> {
    return this.getAll({
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: limit || 50,
    });
  }

  /**
   * Get activity logs by action
   */
  async getByAction(action: IActivityLog['action'], limit?: number): Promise<ApiResponse<IActivityLog[]>> {
    return this.getAll({
      where: [{ field: 'action', operator: '==', value: action }],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: limit || 50,
    });
  }

  /**
   * Get activity logs by entity
   */
  async getByEntity(
    entityType: IActivityLog['entityType'],
    entityId: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return this.getAll({
      where: [
        { field: 'entityType', operator: '==', value: entityType },
        { field: 'entityId', operator: '==', value: entityId },
      ],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: limit || 50,
    });
  }

  /**
   * Get league activity logs
   */
  async getLeagueActivity(leagueId: string, limit?: number): Promise<ApiResponse<IActivityLog[]>> {
    return this.getByEntity('league', leagueId, limit);
  }

  /**
   * Get match activity logs
   */
  async getMatchActivity(matchId: string, limit?: number): Promise<ApiResponse<IActivityLog[]>> {
    return this.getByEntity('match', matchId, limit);
  }

  /**
   * Get season activity logs
   */
  async getSeasonActivity(seasonId: string, limit?: number): Promise<ApiResponse<IActivityLog[]>> {
    return this.getByEntity('season', seasonId, limit);
  }

  /**
   * Get fixture activity logs
   */
  async getFixtureActivity(fixtureId: string, limit?: number): Promise<ApiResponse<IActivityLog[]>> {
    return this.getByEntity('fixture', fixtureId, limit);
  }

  /**
   * Get player activity logs
   */
  async getPlayerActivity(playerId: string, limit?: number): Promise<ApiResponse<IActivityLog[]>> {
    return this.getByEntity('player', playerId, limit);
  }

  /**
   * Get recent activity logs (system-wide)
   */
  async getRecentActivity(limit: number = 100): Promise<ApiResponse<IActivityLog[]>> {
    return this.getAll({
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Get activity logs within date range
   */
  async getActivityByDateRange(
    startDate: string,
    endDate: string,
    limit?: number
  ): Promise<ApiResponse<IActivityLog[]>> {
    return this.getAll({
      where: [
        { field: 'timestamp', operator: '>=', value: startDate },
        { field: 'timestamp', operator: '<=', value: endDate },
      ],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: limit || 100,
    });
  }

  /**
   * Get user activity within date range
   */
  async getUserActivityByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<IActivityLog[]>> {
    return this.getAll({
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'timestamp', operator: '>=', value: startDate },
        { field: 'timestamp', operator: '<=', value: endDate },
      ],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
    });
  }

  /**
   * Get activity logs by IP address (security)
   */
  async getByIpAddress(ipAddress: string): Promise<ApiResponse<IActivityLog[]>> {
    return this.getAll({
      where: [{ field: 'ipAddress', operator: '==', value: ipAddress }],
      orderBy: [{ field: 'timestamp', direction: 'desc' }],
      limit: 50,
    });
  }

  // ============================================
  // LOG CREATION
  // ============================================

  /**
   * Create activity log
   */
  async logActivity(data: {
    userId: string;
    userName: string;
    action: IActivityLog['action'];
    entityType: IActivityLog['entityType'];
    entityId: string;
    entityName?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }): Promise<ApiResponse<IActivityLog>> {
    try {
      ApiLogger.log('activityLogs', 'logActivity', {
        userId: data.userId,
        action: data.action,
      });

      const logData: Omit<IActivityLog, 'id'> = {
        userId: data.userId,
        userName: data.userName,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName,
        details: data.details,
        ipAddress: data.ipAddress,
        timestamp: new Date().toISOString(),
      };

      const result = await this.create(logData);

      if (result.success) {
        ApiLogger.success('activityLogs', 'logActivity', {
          logId: result.data?.id,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('activityLogs', 'logActivity', error);
      return {
        success: false,
        error: {
          code: 'LOG_ACTIVITY_ERROR',
          message: error.message || 'Failed to log activity',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SPECIFIC ACTION LOGS
  // ============================================

  /**
   * Log league creation
   */
  async logLeagueCreated(
    userId: string,
    userName: string,
    leagueId: string,
    leagueName: string,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'league_created',
      entityType: 'league',
      entityId: leagueId,
      entityName: leagueName,
      ipAddress,
    });
  }

  /**
   * Log match creation
   */
  async logMatchCreated(
    userId: string,
    userName: string,
    matchId: string,
    matchTitle: string,
    details?: Record<string, any>,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'match_created',
      entityType: 'match',
      entityId: matchId,
      entityName: matchTitle,
      details,
      ipAddress,
    });
  }

  /**
   * Log match registration
   */
  async logMatchRegistered(
    userId: string,
    userName: string,
    matchId: string,
    matchTitle: string,
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'match_registered',
      entityType: 'match',
      entityId: matchId,
      entityName: matchTitle,
      ipAddress,
    });
  }

  /**
   * Log team assignment
   */
  async logTeamAssigned(
    userId: string,
    userName: string,
    matchId: string,
    matchTitle: string,
    details?: { team: string; position?: string },
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'team_assigned',
      entityType: 'match',
      entityId: matchId,
      entityName: matchTitle,
      details,
      ipAddress,
    });
  }

  /**
   * Log score submission
   */
  async logScoreSubmitted(
    userId: string,
    userName: string,
    matchId: string,
    matchTitle: string,
    details?: { team1Score: number; team2Score: number },
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'score_submitted',
      entityType: 'match',
      entityId: matchId,
      entityName: matchTitle,
      details,
      ipAddress,
    });
  }

  /**
   * Log payment confirmation
   */
  async logPaymentConfirmed(
    userId: string,
    userName: string,
    matchId: string,
    matchTitle: string,
    details?: { playerId: string; amount: number },
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'payment_confirmed',
      entityType: 'match',
      entityId: matchId,
      entityName: matchTitle,
      details,
      ipAddress,
    });
  }

  /**
   * Log rating given
   */
  async logRatingGiven(
    userId: string,
    userName: string,
    matchId: string,
    matchTitle: string,
    details?: { ratedPlayerId: string; rating: number },
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'rating_given',
      entityType: 'match',
      entityId: matchId,
      entityName: matchTitle,
      details,
      ipAddress,
    });
  }

  /**
   * Log comment posted
   */
  async logCommentPosted(
    userId: string,
    userName: string,
    matchId: string,
    matchTitle: string,
    details?: { commentId: string },
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'comment_posted',
      entityType: 'match',
      entityId: matchId,
      entityName: matchTitle,
      details,
      ipAddress,
    });
  }

  /**
   * Log MVP awarded
   */
  async logMVPAwarded(
    userId: string,
    userName: string,
    matchId: string,
    matchTitle: string,
    details?: { mvpPlayerId: string; mvpPlayerName: string },
    ipAddress?: string
  ): Promise<ApiResponse<IActivityLog>> {
    return this.logActivity({
      userId,
      userName,
      action: 'mvp_awarded',
      entityType: 'match',
      entityId: matchId,
      entityName: matchTitle,
      details,
      ipAddress,
    });
  }

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<ApiResponse<{
    totalActivities: number;
    byAction: Record<string, number>;
    mostRecentActivity?: IActivityLog;
    firstActivity?: IActivityLog;
  }>> {
    try {
      const activitiesResult = await this.getByUser(userId, 1000);

      if (!activitiesResult.success || !activitiesResult.data) {
        return {
          success: false,
          error: activitiesResult.error || {
            code: 'GET_ACTIVITIES_ERROR',
            message: 'Failed to get user activities',
            statusCode: 500,
          },
        };
      }

      const activities = activitiesResult.data;

      const byAction: Record<string, number> = {};
      
      for (const activity of activities) {
        if (!byAction[activity.action]) {
          byAction[activity.action] = 0;
        }
        byAction[activity.action]++;
      }

      const summary = {
        totalActivities: activities.length,
        byAction,
        mostRecentActivity: activities[0],
        firstActivity: activities[activities.length - 1],
      };

      return {
        success: true,
        data: summary,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Failed to get activity summary',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get entity activity summary
   */
  async getEntityActivitySummary(
    entityType: IActivityLog['entityType'],
    entityId: string
  ): Promise<ApiResponse<{
    totalActivities: number;
    byAction: Record<string, number>;
    byUser: Record<string, number>;
    recentActivities: IActivityLog[];
  }>> {
    try {
      const activitiesResult = await this.getByEntity(entityType, entityId, 500);

      if (!activitiesResult.success || !activitiesResult.data) {
        return {
          success: false,
          error: activitiesResult.error || {
            code: 'GET_ACTIVITIES_ERROR',
            message: 'Failed to get entity activities',
            statusCode: 500,
          },
        };
      }

      const activities = activitiesResult.data;

      const byAction: Record<string, number> = {};
      const byUser: Record<string, number> = {};
      
      for (const activity of activities) {
        // Count by action
        if (!byAction[activity.action]) {
          byAction[activity.action] = 0;
        }
        byAction[activity.action]++;

        // Count by user
        if (!byUser[activity.userId]) {
          byUser[activity.userId] = 0;
        }
        byUser[activity.userId]++;
      }

      const summary = {
        totalActivities: activities.length,
        byAction,
        byUser,
        recentActivities: activities.slice(0, 10),
      };

      return {
        success: true,
        data: summary,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Failed to get entity activity summary',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get system activity statistics (admin)
   */
  async getSystemActivityStats(days: number = 7): Promise<ApiResponse<{
    totalActivities: number;
    byAction: Record<string, number>;
    byEntityType: Record<string, number>;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
    activityTimeline: Array<{ date: string; count: number }>;
  }>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const activitiesResult = await this.getActivityByDateRange(
        startDate.toISOString(),
        new Date().toISOString(),
        1000
      );

      if (!activitiesResult.success || !activitiesResult.data) {
        return {
          success: false,
          error: activitiesResult.error || {
            code: 'GET_ACTIVITIES_ERROR',
            message: 'Failed to get activities',
            statusCode: 500,
          },
        };
      }

      const activities = activitiesResult.data;

      const byAction: Record<string, number> = {};
      const byEntityType: Record<string, number> = {};
      const userCounts: Record<string, { userName: string; count: number }> = {};
      const dailyCounts: Record<string, number> = {};

      for (const activity of activities) {
        // By action
        if (!byAction[activity.action]) {
          byAction[activity.action] = 0;
        }
        byAction[activity.action]++;

        // By entity type
        if (!byEntityType[activity.entityType]) {
          byEntityType[activity.entityType] = 0;
        }
        byEntityType[activity.entityType]++;

        // By user
        if (!userCounts[activity.userId]) {
          userCounts[activity.userId] = {
            userName: activity.userName,
            count: 0,
          };
        }
        userCounts[activity.userId].count++;

        // By date
        const date = activity.timestamp.split('T')[0];
        if (!dailyCounts[date]) {
          dailyCounts[date] = 0;
        }
        dailyCounts[date]++;
      }

      // Top users
      const topUsers = Object.entries(userCounts)
        .map(([userId, data]) => ({
          userId,
          userName: data.userName,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Activity timeline
      const activityTimeline = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const stats = {
        totalActivities: activities.length,
        byAction,
        byEntityType,
        topUsers,
        activityTimeline,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATS_ERROR',
          message: error.message || 'Failed to get system activity stats',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Delete old activity logs (data retention)
   */
  async deleteOldLogs(daysOld: number = 90): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('activityLogs', 'deleteOldLogs', { daysOld });

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldLogsResult = await this.getAll({
        where: [{ field: 'timestamp', operator: '<', value: cutoffDate.toISOString() }],
        limit: 500,
      });

      if (!oldLogsResult.success || !oldLogsResult.data) {
        return {
          success: false,
          error: oldLogsResult.error || {
            code: 'GET_OLD_LOGS_ERROR',
            message: 'Failed to get old logs',
            statusCode: 500,
          },
        };
      }

      let deletedCount = 0;

      for (const log of oldLogsResult.data) {
        if (log.id) {
          const result = await this.delete(log.id);
          if (result.success) deletedCount++;
        }
      }

      ApiLogger.success('activityLogs', 'deleteOldLogs', { count: deletedCount });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error: any) {
      ApiLogger.error('activityLogs', 'deleteOldLogs', error);
      return {
        success: false,
        error: {
          code: 'DELETE_OLD_LOGS_ERROR',
          message: error.message || 'Failed to delete old logs',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const activityLogAPI = new ActivityLogAPI();



/*  USAGE EXAMPLES:

// LeagueService.createLeague içinde
const result = await leagueAPI.create(leagueData);
if (result.success) {
  // ✅ Log the activity
  await activityLogAPI.logLeagueCreated(
    data.createdBy,
    creatorName,
    result.data.id,
    data.title,
    req.ip
  );
}

// MatchService.registerPlayer içinde
if (result.success) {
  await activityLogAPI.logMatchRegistered(
    playerId,
    playerName,
    matchId,
    matchTitle
  );
}

// MatchService.submitScore içinde
await activityLogAPI.logScoreSubmitted(
  userId,
  userName,
  matchId,
  matchTitle,
  { team1Score: 3, team2Score: 2 }
);


// Match detail sayfasında
const matchActivity = await activityLogAPI.getMatchActivity(matchId);
// Timeline gösterir: Kim ne zaman kayıt oldu, kim skorları girdi, vb.

// League detail sayfasında
const leagueActivity = await activityLogAPI.getLeagueActivity(leagueId);
// Kim lige katıldı, kim admin yapıldı, vb.


// Şüpheli işlemler için
const recentByIP = await activityLogAPI.getByIpAddress(suspiciousIP);
const userActions = await activityLogAPI.getByAction('payment_confirmed');

// Data retention - GDPR uyumu
await activityLogAPI.deleteOldLogs(90); // 90 günden eski logları sil


// En aktif kullanıcılar
const stats = await activityLogAPI.getSystemActivityStats(7);
console.log(stats.topUsers); // Top 10 aktif kullanıcı

// Hangi özellikler en çok kullanılıyor
console.log(stats.byAction); 
// { match_created: 50, rating_given: 200, ... }


// ActivityLog oluşturulunca notification gönder
if (action === 'mvp_awarded') {
  await notificationAPI.sendMVPAnnouncement(userId, matchId, matchTitle);
}
```

## 📊 Örnek Senaryolar

**Senaryo 1: Match Timeline**
```
15:00 - Ahmet maçı oluşturdu
15:05 - Mehmet maça kayıt oldu
15:10 - Can maça kayıt oldu
19:00 - Ahmet takımları belirledi
21:00 - Ahmet skoru girdi (3-2)
21:30 - Can MVP seçildi
```

**Senaryo 2: Admin Investigation**
```
"Kim bu maçın skorunu değiştirdi?"
→ activityLogAPI.getByEntity('match', matchId)
→ Gösterir: "Ahmet 21:45'te skoru 2-2'den 3-2'ye değiştirdi"
```

**Senaryo 3: User Insights**
```
Kullanıcı profili:
- 45 maç oluşturdu
- 120 maça kayıt oldu
- 89 kez rating verdi
- 5 kez MVP seçildi
- İlk aktivite: 2024-01-15


🚫 KULLANMAYACAĞIN Yerler
❌ Her API call'da
❌ Get/Read işlemlerinde (sadece Create/Update/Delete)
❌ Frontend'de direkt (sadece Service katmanından)
❌ Real-time chat/messaging için (çok fazla log olur)
Özetle: "Kim, ne zaman, neyi, neden yaptı?" sorularını cevaplayabilmek için kullanacaksın! 🎯
*/