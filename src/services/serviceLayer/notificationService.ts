// ============================================
// services/NotificationService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { notificationAPI } from '../../api/apiLayer/notificationAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { seasonAPI } from '../../api/apiLayer/seasonAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { INotification } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class NotificationService {
  // ============================================
  // 1. QUERY OPERATIONS
  // ============================================

  /**
   * Get notification by ID
   */
  static async getNotification(notificationId: string): Promise<ApiResponse<INotification>> {
    return notificationAPI.getById(notificationId);
  }

  /**
   * Get all notifications for user
   */
  static async getUserNotifications(userId: string): Promise<ApiResponse<INotification[]>> {
    return notificationAPI.getByUser(userId);
  }

  /**
   * Get unread notifications
   */
  static async getUnreadNotifications(userId: string): Promise<ApiResponse<INotification[]>> {
    return notificationAPI.getUnreadByUser(userId);
  }

  /**
   * Get read notifications
   */
  static async getReadNotifications(userId: string): Promise<ApiResponse<INotification[]>> {
    return notificationAPI.getReadByUser(userId);
  }

  /**
   * Get recent notifications
   */
  static async getRecentNotifications(
    userId: string,
    limit: number = 20
  ): Promise<ApiResponse<INotification[]>> {
    return notificationAPI.getRecent(userId, limit);
  }

  /**
   * Get notifications by type
   */
  static async getNotificationsByType(
    userId: string,
    type: INotification['type']
  ): Promise<ApiResponse<INotification[]>> {
    return notificationAPI.getByType(userId, type);
  }

  /**
   * Get match notifications
   */
  static async getMatchNotifications(
    userId: string,
    matchId: string
  ): Promise<ApiResponse<INotification[]>> {
    return notificationAPI.getMatchNotifications(userId, matchId);
  }

  /**
   * Get league notifications
   */
  static async getLeagueNotifications(
    userId: string,
    leagueId: string
  ): Promise<ApiResponse<INotification[]>> {
    return notificationAPI.getLeagueNotifications(userId, leagueId);
  }

  /**
   * Get season notifications
   */
  static async getSeasonNotifications(
    userId: string,
    seasonId: string
  ): Promise<ApiResponse<INotification[]>> {
    return notificationAPI.getSeasonNotifications(userId, seasonId);
  }

  /**
   * Get unread count
   */
  static async getUnreadCount(userId: string): Promise<ApiResponse<number>> {
    return notificationAPI.getUnreadCount(userId);
  }

  // ============================================
  // 2. CREATE GENERIC NOTIFICATION
  // ============================================

  /**
   * Create custom notification
   */
  static async createNotification(data: {
    userId: string;
    type: INotification['type'];
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: 'match' | 'league' | 'season' | 'player';
    actionUrl?: string;
    actionLabel?: string;
  }): Promise<ApiResponse<INotification>> {
    return notificationAPI.createNotification(data);
  }

  /**
   * Create bulk notifications
   */
  static async createBulkNotifications(
    userIds: string[],
    notificationData: {
      type: INotification['type'];
      title: string;
      message: string;
      relatedId?: string;
      relatedType?: 'match' | 'league' | 'season' | 'player';
      actionUrl?: string;
      actionLabel?: string;
    }
  ): Promise<ApiResponse<{
    sent: number;
    failed: number;
  }>> {
    try {
      const result = await notificationAPI.createBulkNotifications(
        userIds,
        notificationData
      );

      if (result.success) {
        return {
          success: true,
          data: {
            sent: result.data || 0,
            failed: userIds.length - (result.data || 0),
          },
        };
      }

      return {
        success: false,
        error: result.error || {
          code: 'BULK_CREATE_ERROR',
          message: 'Toplu bildirim oluşturulamadı',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'BULK_CREATE_ERROR',
          message: error.message || 'Toplu bildirim oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. SPECIFIC NOTIFICATION CREATORS
  // ============================================

  /**
   * Send match invitation notification
   */
  static async sendMatchInvitation(
    userId: string,
    matchId: string
  ): Promise<ApiResponse<INotification>> {
    try {
      // Get match details
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;
      const matchDate = new Date(match.schedule.matchStart).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
      });

      return notificationAPI.sendMatchInvitation(
        userId,
        matchId,
        match.title || 'Maç',
        matchDate
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_INVITATION_ERROR',
          message: error.message || 'Davet bildirimi gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Send match reminder notification
   */
  static async sendMatchReminder(
    userId: string,
    matchId: string,
    hoursUntilMatch: number
  ): Promise<ApiResponse<INotification>> {
    try {
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

      const match = matchResult.data;

      return notificationAPI.sendMatchReminder(
        userId,
        matchId,
        match.title || 'Maç',
        hoursUntilMatch
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_REMINDER_ERROR',
          message: error.message || 'Hatırlatma bildirimi gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Send team assignment notification
   */
  static async sendTeamAssignment(
    userId: string,
    matchId: string,
    teamName: string
  ): Promise<ApiResponse<INotification>> {
    try {
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

      const match = matchResult.data;

      return notificationAPI.sendTeamAssignment(
        userId,
        matchId,
        match.title || 'Maç',
        teamName
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_ASSIGNMENT_ERROR',
          message: error.message || 'Takım atama bildirimi gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Send payment reminder notification
   */
  static async sendPaymentReminder(
    userId: string,
    matchId: string,
    amount: number
  ): Promise<ApiResponse<INotification>> {
    try {
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

      const match = matchResult.data;

      return notificationAPI.sendPaymentReminder(
        userId,
        matchId,
        match.title || 'Maç',
        amount
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_PAYMENT_ERROR',
          message: error.message || 'Ödeme hatırlatma bildirimi gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Send rating request notification
   */
  static async sendRatingRequest(
    userId: string,
    matchId: string
  ): Promise<ApiResponse<INotification>> {
    try {
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

      const match = matchResult.data;

      return notificationAPI.sendRatingRequest(
        userId,
        matchId,
        match.title || 'Maç'
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_RATING_ERROR',
          message: error.message || 'Puanlama bildirimi gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Send MVP announcement notification
   */
  static async sendMVPAnnouncement(
    userId: string,
    matchId: string
  ): Promise<ApiResponse<INotification>> {
    try {
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

      const match = matchResult.data;

      return notificationAPI.sendMVPAnnouncement(
        userId,
        matchId,
        match.title || 'Maç'
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_MVP_ERROR',
          message: error.message || 'MVP bildirimi gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Send season start notification
   */
  static async sendSeasonStart(
    userId: string,
    seasonId: string
  ): Promise<ApiResponse<INotification>> {
    try {
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      return notificationAPI.sendSeasonStart(
        userId,
        seasonId,
        season.leagueId,
        season.name
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_SEASON_START_ERROR',
          message: error.message || 'Sezon başlangıç bildirimi gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Send season end notification
   */
  static async sendSeasonEnd(
    userId: string,
    seasonId: string,
    finalPosition?: number
  ): Promise<ApiResponse<INotification>> {
    try {
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      return notificationAPI.sendSeasonEnd(
        userId,
        seasonId,
        season.leagueId,
        season.name,
        finalPosition
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_SEASON_END_ERROR',
          message: error.message || 'Sezon bitiş bildirimi gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Send bulk match reminders (for all players in a match)
   */
  static async sendBulkMatchReminders(
    matchId: string,
    hoursUntilMatch: number
  ): Promise<ApiResponse<{ sent: number; failed: number }>> {
    try {
      ApiLogger.log('NotificationService', 'sendBulkMatchReminders', {
        matchId,
        hoursUntilMatch,
      });

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

      const match = matchResult.data;

      // Get all player IDs
      const playerIds = match.players.teams
        ? [
            ...match.players.teams.team1.map(p => p.playerId),
            ...match.players.teams.team2.map(p => p.playerId),
          ]
        : [];

      if (playerIds.length === 0) {
        return {
          success: true,
          data: { sent: 0, failed: 0 },
        };
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const playerId of playerIds) {
        const result = await this.sendMatchReminder(playerId, matchId, hoursUntilMatch);
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      }

      ApiLogger.success('NotificationService', 'sendBulkMatchReminders', {
        sent: sentCount,
        failed: failedCount,
      });

      return {
        success: true,
        data: { sent: sentCount, failed: failedCount },
      };
    } catch (error: any) {
      ApiLogger.error('NotificationService', 'sendBulkMatchReminders', error);
      return {
        success: false,
        error: {
          code: 'BULK_REMINDER_ERROR',
          message: error.message || 'Toplu hatırlatma gönderilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. MARK AS READ/UNREAD
  // ============================================

  /**
   * Mark notification as read
   */
  static async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<ApiResponse<INotification>> {
    try {
      // Verify ownership
      const notificationResult = await notificationAPI.getById(notificationId);

      if (!notificationResult.success || !notificationResult.data) {
        return {
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Bildirim bulunamadı',
            statusCode: 404,
          },
        };
      }

      if (notificationResult.data.userId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Bu bildirimi işaretleme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      return notificationAPI.markAsRead(notificationId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'MARK_READ_ERROR',
          message: error.message || 'Bildirim işaretlenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Mark notification as unread
   */
  static async markAsUnread(
    notificationId: string,
    userId: string
  ): Promise<ApiResponse<INotification>> {
    try {
      // Verify ownership
      const notificationResult = await notificationAPI.getById(notificationId);

      if (!notificationResult.success || !notificationResult.data) {
        return {
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Bildirim bulunamadı',
            statusCode: 404,
          },
        };
      }

      if (notificationResult.data.userId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Bu bildirimi işaretleme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      return notificationAPI.markAsUnread(notificationId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'MARK_UNREAD_ERROR',
          message: error.message || 'Bildirim işaretlenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<ApiResponse<{
    marked: number;
  }>> {
    try {
      const result = await notificationAPI.markAllAsRead(userId);

      if (result.success) {
        return {
          success: true,
          data: {
            marked: result.data || 0,
          },
        };
      }

      return {
        success: false,
        error: result.error || {
          code: 'MARK_ALL_ERROR',
          message: 'Tümü işaretlenemedi',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'MARK_ALL_ERROR',
          message: error.message || 'Tümü işaretlenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. DELETE OPERATIONS
  // ============================================

  /**
   * Delete notification
   */
  static async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    return notificationAPI.deleteNotification(notificationId, userId);
  }

  /**
   * Delete all read notifications
   */
  static async deleteAllRead(userId: string): Promise<ApiResponse<{
    deleted: number;
  }>> {
    try {
      const result = await notificationAPI.deleteAllRead(userId);

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
          code: 'DELETE_ALL_ERROR',
          message: 'Okunmuşlar silinemedi',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_ALL_ERROR',
          message: error.message || 'Okunmuşlar silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete all notifications for user
   */
  static async deleteAllNotifications(userId: string): Promise<ApiResponse<{
    deleted: number;
  }>> {
    try {
      const result = await notificationAPI.deleteAllForUser(userId);

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
          code: 'DELETE_ALL_ERROR',
          message: 'Tümü silinemedi',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_ALL_ERROR',
          message: error.message || 'Tümü silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete old notifications (cleanup)
   */
  static async deleteOldNotifications(
    userId: string,
    daysOld: number = 30
  ): Promise<ApiResponse<{
    deleted: number;
  }>> {
    try {
      const result = await notificationAPI.deleteOldNotifications(userId, daysOld);

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
          code: 'DELETE_OLD_ERROR',
          message: 'Eskiler silinemedi',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DELETE_OLD_ERROR',
          message: error.message || 'Eskiler silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get notification statistics
   */
  static async getNotificationStats(userId: string): Promise<ApiResponse<{
    total: number;
    unread: number;
    read: number;
    byType: Record<string, number>;
    unreadPercentage: number;
  }>> {
    try {
      const statsResult = await notificationAPI.getUserNotificationStats(userId);

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
      const unreadPercentage = stats.total > 0
        ? (stats.unread / stats.total) * 100
        : 0;

      return {
        success: true,
        data: {
          ...stats,
          unreadPercentage,
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
  // 7. HELPER METHODS
  // ============================================

  /**
   * Get notification type display
   */
  static getTypeDisplay(type: INotification['type']): {
    label: string;
    icon: string;
    color: string;
  } {
    const typeMap: Record<INotification['type'], { label: string; icon: string; color: string }> = {
      match_invitation: { label: 'Maç Daveti', icon: '📨', color: 'blue' },
      match_reminder: { label: 'Maç Hatırlatması', icon: '⏰', color: 'yellow' },
      team_assignment: { label: 'Takım Atama', icon: '⚽', color: 'green' },
      payment_reminder: { label: 'Ödeme Hatırlatması', icon: '💰', color: 'orange' },
      rating_request: { label: 'Puanlama Talebi', icon: '⭐', color: 'purple' },
      mvp_announcement: { label: 'MVP', icon: '🏆', color: 'gold' },
      season_start: { label: 'Sezon Başlangıcı', icon: '🎉', color: 'green' },
      season_end: { label: 'Sezon Bitişi', icon: '🏁', color: 'red' },
    };

    return typeMap[type] || { label: 'Bildirim', icon: '🔔', color: 'gray' };
  }

  /**
   * Get notification age (human-readable)
   */
  static getNotificationAge(notification: INotification): string {
    const now = new Date();
    const created = new Date(notification.createdAt);
    const diffMs = now.getTime() - created.getTime();
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
   * Format notification for display
   */
  static formatNotification(notification: INotification): {
    id: string;
    type: ReturnType<typeof NotificationService.getTypeDisplay>;
    title: string;
    message: string;
    age: string;
    isRead: boolean;
    hasAction: boolean;
    actionUrl?: string;
    actionLabel?: string;
  } {
    return {
      id: notification.id,
      type: this.getTypeDisplay(notification.type),
      title: notification.title,
      message: notification.message,
      age: this.getNotificationAge(notification),
      isRead: notification.read,
      hasAction: !!notification.actionUrl,
      actionUrl: notification.actionUrl,
      actionLabel: notification.actionLabel,
    };
  }

  /**
   * Group notifications by date
   */
  static groupNotificationsByDate(
    notifications: INotification[]
  ): Record<string, INotification[]> {
    const groups: Record<string, INotification[]> = {};

    for (const notification of notifications) {
      const date = new Date(notification.createdAt);
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

      groups[groupKey].push(notification);
    }

    return groups;
  }
}

export default NotificationService;