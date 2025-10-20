// ============================================
// api/notificationApi.ts - UPDATED FOR YOUR TYPE
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { INotification } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class NotificationAPI extends BaseAPI<INotification> {
  constructor() {
    super('notifications');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get all notifications for a user
   */
  async getByUser(userId: string): Promise<ApiResponse<INotification[]>> {
    return this.getAll({
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get unread notifications for a user
   */
  async getUnreadByUser(userId: string): Promise<ApiResponse<INotification[]>> {
    return this.getAll({
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'read', operator: '==', value: false },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get read notifications for a user
   */
  async getReadByUser(userId: string): Promise<ApiResponse<INotification[]>> {
    return this.getAll({
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'read', operator: '==', value: true },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get notifications by type
   */
  async getByType(
    userId: string,
    type: INotification['type']
  ): Promise<ApiResponse<INotification[]>> {
    return this.getAll({
      where: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'type', operator: '==', value: type },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get recent notifications (last N)
   */
  async getRecent(userId: string, limit: number = 20): Promise<ApiResponse<INotification[]>> {
    return this.getAll({
      where: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Get notifications related to a specific entity
   */
  async getByRelatedEntity(
    userId: string,
    relatedId: string,
    relatedType?: 'match' | 'league' | 'season' | 'player'
  ): Promise<ApiResponse<INotification[]>> {
    const where: any[] = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'relatedId', operator: '==', value: relatedId },
    ];

    if (relatedType) {
      where.push({ field: 'relatedType', operator: '==', value: relatedType });
    }

    return this.getAll({
      where,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get match-related notifications
   */
  async getMatchNotifications(userId: string, matchId: string): Promise<ApiResponse<INotification[]>> {
    return this.getByRelatedEntity(userId, matchId, 'match');
  }

  /**
   * Get league-related notifications
   */
  async getLeagueNotifications(userId: string, leagueId: string): Promise<ApiResponse<INotification[]>> {
    return this.getByRelatedEntity(userId, leagueId, 'league');
  }

  /**
   * Get season-related notifications
   */
  async getSeasonNotifications(userId: string, seasonId: string): Promise<ApiResponse<INotification[]>> {
    return this.getByRelatedEntity(userId, seasonId, 'season');
  }

  // ============================================
  // NOTIFICATION CREATION
  // ============================================

  /**
   * Create notification
   */
  async createNotification(data: {
    userId: string;
    type: INotification['type'];
    title: string;
    message: string;
    relatedId?: string;
    relatedType?: 'match' | 'league' | 'season' | 'player';
    actionUrl?: string;
    actionLabel?: string;
  }): Promise<ApiResponse<INotification>> {
    try {
      ApiLogger.log('notifications', 'createNotification', {
        userId: data.userId,
        type: data.type,
      });

      const notificationData: Omit<INotification, 'id'> = {
        userId: data.userId,
        type: data.type,
        title: data.title.trim(),
        message: data.message.trim(),
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
        read: false,
        createdAt: new Date().toISOString(),
      };

      const result = await this.create(notificationData);

      if (result.success) {
        ApiLogger.success('notifications', 'createNotification', {
          notificationId: result.data?.id,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('notifications', 'createNotification', error);
      return {
        success: false,
        error: {
          code: 'CREATE_NOTIFICATION_ERROR',
          message: error.message || 'Failed to create notification',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Create bulk notifications (for multiple users)
   */
  async createBulkNotifications(
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
  ): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('notifications', 'createBulkNotifications', {
        count: userIds.length,
        type: notificationData.type,
      });

      let successCount = 0;

      for (const userId of userIds) {
        const result = await this.createNotification({
          ...notificationData,
          userId,
        });

        if (result.success) successCount++;
      }

      ApiLogger.success('notifications', 'createBulkNotifications', {
        successCount,
        totalCount: userIds.length,
      });

      return {
        success: true,
        data: successCount,
      };
    } catch (error: any) {
      ApiLogger.error('notifications', 'createBulkNotifications', error);
      return {
        success: false,
        error: {
          code: 'CREATE_BULK_ERROR',
          message: error.message || 'Failed to create bulk notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // NOTIFICATION HELPERS (SPECIFIC TYPES)
  // ============================================

  /**
   * Send match invitation notification
   */
  async sendMatchInvitation(
    userId: string,
    matchId: string,
    matchTitle: string,
    matchDate: string
  ): Promise<ApiResponse<INotification>> {
    return this.createNotification({
      userId,
      type: 'match_invitation',
      title: 'Maç Daveti',
      message: `${matchTitle} maçına davet edildiniz. ${matchDate}`,
      relatedId: matchId,
      relatedType: 'match',
      actionUrl: `/matches/${matchId}`,
      actionLabel: 'Maçı Görüntüle',
    });
  }

  /**
   * Send match reminder notification
   */
  async sendMatchReminder(
    userId: string,
    matchId: string,
    matchTitle: string,
    hoursUntilMatch: number
  ): Promise<ApiResponse<INotification>> {
    return this.createNotification({
      userId,
      type: 'match_reminder',
      title: 'Maç Hatırlatması',
      message: `${matchTitle} maçına ${hoursUntilMatch} saat kaldı!`,
      relatedId: matchId,
      relatedType: 'match',
      actionUrl: `/matches/${matchId}`,
      actionLabel: 'Maça Git',
    });
  }

  /**
   * Send team assignment notification
   */
  async sendTeamAssignment(
    userId: string,
    matchId: string,
    matchTitle: string,
    teamName: string
  ): Promise<ApiResponse<INotification>> {
    return this.createNotification({
      userId,
      type: 'team_assignment',
      title: 'Takıma Atandınız',
      message: `${matchTitle} maçında ${teamName} takımına atandınız.`,
      relatedId: matchId,
      relatedType: 'match',
      actionUrl: `/matches/${matchId}`,
      actionLabel: 'Takımı Gör',
    });
  }

  /**
   * Send payment reminder notification
   */
  async sendPaymentReminder(
    userId: string,
    matchId: string,
    matchTitle: string,
    amount: number
  ): Promise<ApiResponse<INotification>> {
    return this.createNotification({
      userId,
      type: 'payment_reminder',
      title: 'Ödeme Hatırlatması',
      message: `${matchTitle} maçı için ${amount} TL ödeme bekleniyor.`,
      relatedId: matchId,
      relatedType: 'match',
      actionUrl: `/matches/${matchId}/payment`,
      actionLabel: 'Ödeme Yap',
    });
  }

  /**
   * Send rating request notification
   */
  async sendRatingRequest(
    userId: string,
    matchId: string,
    matchTitle: string
  ): Promise<ApiResponse<INotification>> {
    return this.createNotification({
      userId,
      type: 'rating_request',
      title: 'Puanlama Talebi',
      message: `${matchTitle} maçı için oyuncu puanlaması yapabilirsiniz.`,
      relatedId: matchId,
      relatedType: 'match',
      actionUrl: `/matches/${matchId}/rate`,
      actionLabel: 'Puanla',
    });
  }

  /**
   * Send MVP announcement notification
   */
  async sendMVPAnnouncement(
    userId: string,
    matchId: string,
    matchTitle: string
  ): Promise<ApiResponse<INotification>> {
    return this.createNotification({
      userId,
      type: 'mvp_announcement',
      title: 'Tebrikler! 🏆',
      message: `${matchTitle} maçında MVP seçildiniz!`,
      relatedId: matchId,
      relatedType: 'match',
      actionUrl: `/matches/${matchId}`,
      actionLabel: 'Maçı Gör',
    });
  }

  /**
   * Send season start notification
   */
  async sendSeasonStart(
    userId: string,
    seasonId: string,
    leagueId: string,
    seasonName: string
  ): Promise<ApiResponse<INotification>> {
    return this.createNotification({
      userId,
      type: 'season_start',
      title: 'Sezon Başladı',
      message: `${seasonName} başladı! İyi şanslar.`,
      relatedId: seasonId,
      relatedType: 'season',
      actionUrl: `/leagues/${leagueId}/seasons/${seasonId}`,
      actionLabel: 'Sezonu Gör',
    });
  }

  /**
   * Send season end notification
   */
  async sendSeasonEnd(
    userId: string,
    seasonId: string,
    leagueId: string,
    seasonName: string,
    finalPosition?: number
  ): Promise<ApiResponse<INotification>> {
    const message = finalPosition
      ? `${seasonName} sona erdi! Sıralama: ${finalPosition}.`
      : `${seasonName} sona erdi!`;

    return this.createNotification({
      userId,
      type: 'season_end',
      title: 'Sezon Bitti',
      message,
      relatedId: seasonId,
      relatedType: 'season',
      actionUrl: `/leagues/${leagueId}/seasons/${seasonId}`,
      actionLabel: 'Sonuçları Gör',
    });
  }

  // ============================================
  // MARK AS READ/UNREAD
  // ============================================

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<ApiResponse<INotification>> {
    try {
      ApiLogger.log('notifications', 'markAsRead', { notificationId });

      const docRef = doc(db, this.collectionName, notificationId);

      await updateDoc(docRef, {
        read: true,
        readAt: new Date().toISOString(),
      });

      const result = await this.getById(notificationId);

      ApiLogger.success('notifications', 'markAsRead', { notificationId });

      return result;
    } catch (error: any) {
      ApiLogger.error('notifications', 'markAsRead', error);
      return {
        success: false,
        error: {
          code: 'MARK_READ_ERROR',
          message: error.message || 'Failed to mark as read',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Mark notification as unread
   */
  async markAsUnread(notificationId: string): Promise<ApiResponse<INotification>> {
    try {
      ApiLogger.log('notifications', 'markAsUnread', { notificationId });

      const docRef = doc(db, this.collectionName, notificationId);

      await updateDoc(docRef, {
        read: false,
        readAt: null,
      });

      const result = await this.getById(notificationId);

      ApiLogger.success('notifications', 'markAsUnread', { notificationId });

      return result;
    } catch (error: any) {
      ApiLogger.error('notifications', 'markAsUnread', error);
      return {
        success: false,
        error: {
          code: 'MARK_UNREAD_ERROR',
          message: error.message || 'Failed to mark as unread',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('notifications', 'markAllAsRead', { userId });

      const unreadResult = await this.getUnreadByUser(userId);

      if (!unreadResult.success || !unreadResult.data) {
        return {
          success: false,
          error: unreadResult.error || {
            code: 'GET_UNREAD_ERROR',
            message: 'Failed to get unread notifications',
            statusCode: 500,
          },
        };
      }

      let markedCount = 0;

      for (const notification of unreadResult.data) {
        if (notification.id) {
          const result = await this.markAsRead(notification.id);
          if (result.success) markedCount++;
        }
      }

      ApiLogger.success('notifications', 'markAllAsRead', {
        userId,
        count: markedCount,
      });

      return {
        success: true,
        data: markedCount,
      };
    } catch (error: any) {
      ApiLogger.error('notifications', 'markAllAsRead', error);
      return {
        success: false,
        error: {
          code: 'MARK_ALL_READ_ERROR',
          message: error.message || 'Failed to mark all as read',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('notifications', 'deleteNotification', {
        notificationId,
        userId,
      });

      // Verify notification belongs to user
      const notificationResult = await this.getById(notificationId);

      if (!notificationResult.success || !notificationResult.data) {
        return {
          success: false,
          error: notificationResult.error || {
            code: 'NOT_FOUND',
            message: 'Notification not found',
            statusCode: 404,
          },
        };
      }

      if (notificationResult.data.userId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You can only delete your own notifications',
            statusCode: 403,
          },
        };
      }

      const result = await this.delete(notificationId);

      ApiLogger.success('notifications', 'deleteNotification', { notificationId });

      return result;
    } catch (error: any) {
      ApiLogger.error('notifications', 'deleteNotification', error);
      return {
        success: false,
        error: {
          code: 'DELETE_NOTIFICATION_ERROR',
          message: error.message || 'Failed to delete notification',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete all read notifications for a user
   */
  async deleteAllRead(userId: string): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('notifications', 'deleteAllRead', { userId });

      const readResult = await this.getReadByUser(userId);

      if (!readResult.success || !readResult.data) {
        return {
          success: false,
          error: readResult.error || {
            code: 'GET_READ_ERROR',
            message: 'Failed to get read notifications',
            statusCode: 500,
          },
        };
      }

      let deletedCount = 0;

      for (const notification of readResult.data) {
        if (notification.id) {
          const result = await this.delete(notification.id);
          if (result.success) deletedCount++;
        }
      }

      ApiLogger.success('notifications', 'deleteAllRead', {
        userId,
        count: deletedCount,
      });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error: any) {
      ApiLogger.error('notifications', 'deleteAllRead', error);
      return {
        success: false,
        error: {
          code: 'DELETE_ALL_READ_ERROR',
          message: error.message || 'Failed to delete all read notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllForUser(userId: string): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('notifications', 'deleteAllForUser', { userId });

      const notificationsResult = await this.getByUser(userId);

      if (!notificationsResult.success || !notificationsResult.data) {
        return {
          success: false,
          error: notificationsResult.error || {
            code: 'GET_NOTIFICATIONS_ERROR',
            message: 'Failed to get user notifications',
            statusCode: 500,
          },
        };
      }

      let deletedCount = 0;

      for (const notification of notificationsResult.data) {
        if (notification.id) {
          const result = await this.delete(notification.id);
          if (result.success) deletedCount++;
        }
      }

      ApiLogger.success('notifications', 'deleteAllForUser', {
        userId,
        count: deletedCount,
      });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error: any) {
      ApiLogger.error('notifications', 'deleteAllForUser', error);
      return {
        success: false,
        error: {
          code: 'DELETE_ALL_ERROR',
          message: error.message || 'Failed to delete all notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete old notifications (older than X days)
   */
  async deleteOldNotifications(
    userId: string,
    daysOld: number = 30
  ): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('notifications', 'deleteOldNotifications', { userId, daysOld });

      const notificationsResult = await this.getByUser(userId);

      if (!notificationsResult.success || !notificationsResult.data) {
        return {
          success: false,
          error: notificationsResult.error || {
            code: 'GET_NOTIFICATIONS_ERROR',
            message: 'Failed to get user notifications',
            statusCode: 500,
          },
        };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const oldNotifications = notificationsResult.data.filter((notification) => {
        const createdDate = new Date(notification.createdAt);
        return createdDate < cutoffDate;
      });

      let deletedCount = 0;

      for (const notification of oldNotifications) {
        if (notification.id) {
          const result = await this.delete(notification.id);
          if (result.success) deletedCount++;
        }
      }

      ApiLogger.success('notifications', 'deleteOldNotifications', {
        userId,
        count: deletedCount,
      });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error: any) {
      ApiLogger.error('notifications', 'deleteOldNotifications', error);
      return {
        success: false,
        error: {
          code: 'DELETE_OLD_ERROR',
          message: error.message || 'Failed to delete old notifications',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<ApiResponse<number>> {
    try {
      const unreadResult = await this.getUnreadByUser(userId);

      if (!unreadResult.success || !unreadResult.data) {
        return {
          success: false,
          error: unreadResult.error || {
            code: 'GET_UNREAD_ERROR',
            message: 'Failed to get unread notifications',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: unreadResult.data.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_COUNT_ERROR',
          message: error.message || 'Failed to get unread count',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get notification statistics for a user
   */
  async getUserNotificationStats(userId: string): Promise<ApiResponse<{
    total: number;
    unread: number;
    read: number;
    byType: Record<string, number>;
  }>> {
    try {
      const notificationsResult = await this.getByUser(userId);

      if (!notificationsResult.success || !notificationsResult.data) {
        return {
          success: false,
          error: notificationsResult.error || {
            code: 'GET_NOTIFICATIONS_ERROR',
            message: 'Failed to get user notifications',
            statusCode: 500,
          },
        };
      }

      const notifications = notificationsResult.data;

      const stats = {
        total: notifications.length,
        unread: notifications.filter((n) => !n.read).length,
        read: notifications.filter((n) => n.read).length,
        byType: {} as Record<string, number>,
      };

      // Count by type
      for (const notification of notifications) {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = 0;
        }
        stats.byType[notification.type]++;
      }

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATS_ERROR',
          message: error.message || 'Failed to get notification statistics',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const notificationAPI = new NotificationAPI();