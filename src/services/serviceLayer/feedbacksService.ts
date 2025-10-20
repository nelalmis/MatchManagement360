// ============================================
// services/FeedbackService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { feedbacksAPI } from '../../api/apiLayer/feedbacksAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IFeedback } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class FeedbackService {
  // ============================================
  // 1. QUERY OPERATIONS
  // ============================================

  /**
   * Get feedback by ID
   */
  static async getFeedback(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.getById(id);
  }

  /**
   * Get all feedbacks
   */
  static async getAllFeedbacks(): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getAll();
  }

  /**
   * Get feedbacks by user
   */
  static async getUserFeedbacks(userId: string): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getByUserId(userId);
  }

  /**
   * Get feedbacks by type
   */
  static async getFeedbacksByType(
    type: IFeedback['type']
  ): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getByType(type);
  }

  /**
   * Get feedbacks by status
   */
  static async getFeedbacksByStatus(
    status: IFeedback['status']
  ): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getByStatus(status);
  }

  /**
   * Get feedbacks by priority
   */
  static async getFeedbacksByPriority(
    priority: IFeedback['priority']
  ): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getByPriority(priority);
  }

  /**
   * Get new feedbacks
   */
  static async getNewFeedbacks(): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getNewFeedbacks();
  }

  /**
   * Get unresolved feedbacks
   */
  static async getUnresolvedFeedbacks(): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getUnresolvedFeedbacks();
  }

  /**
   * Get critical feedbacks
   */
  static async getCriticalFeedbacks(): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getCriticalFeedbacks();
  }

  /**
   * Get bug reports
   */
  static async getBugReports(
    statusFilter?: IFeedback['status']
  ): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getBugReports(statusFilter);
  }

  /**
   * Get feature requests
   */
  static async getFeatureRequests(
    statusFilter?: IFeedback['status']
  ): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getFeatureRequests(statusFilter);
  }

  /**
   * Get feedbacks by page
   */
  static async getFeedbacksByPage(page: string): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getByPage(page);
  }

  /**
   * Get feedbacks by feature
   */
  static async getFeedbacksByFeature(feature: string): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getByFeature(feature);
  }

  /**
   * Get recent feedbacks
   */
  static async getRecentFeedbacks(limit: number = 20): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getRecentFeedbacks(limit);
  }

  /**
   * Get feedbacks with filters
   */
  static async getFeedbacksFiltered(filters: {
    type?: IFeedback['type'];
    status?: IFeedback['status'];
    priority?: IFeedback['priority'];
    userId?: string;
    page?: string;
    feature?: string;
    hasResponse?: boolean;
    limit?: number;
  }): Promise<ApiResponse<IFeedback[]>> {
    return feedbacksAPI.getFeedbacksFiltered(filters);
  }

  // ============================================
  // 2. FEEDBACK MANAGEMENT
  // ============================================

  /**
   * Create feedback
   */
  static async createFeedback(data: {
    userId: string;
    userName: string;
    userEmail: string;
    type: IFeedback['type'];
    title: string;
    description: string;
    page?: string;
    feature?: string;
    priority: IFeedback['priority'] ;
    attachments?: string[];
    screenshots?: string[];
    systemInfo?: IFeedback['systemInfo'];
  }): Promise<ApiResponse<IFeedback>> {
    try {
      // Validate input
      if (!data.title || data.title.trim().length < 5) {
        return {
          success: false,
          error: {
            code: 'INVALID_TITLE',
            message: 'Başlık en az 5 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      if (!data.description || data.description.trim().length < 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_DESCRIPTION',
            message: 'Açıklama en az 10 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FeedbackService', 'createFeedback', {
        userId: data.userId,
        type: data.type,
      });

      const result = await feedbacksAPI.createFeedback(data);

      if (result.success) {
        ApiLogger.success('FeedbackService', 'createFeedback', {
          feedbackId: result.data?.id,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FeedbackService', 'createFeedback', error);
      return {
        success: false,
        error: {
          code: 'CREATE_FEEDBACK_ERROR',
          message: error.message || 'Geri bildirim oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update feedback
   */
  static async updateFeedback(
    id: string,
    updates: Partial<Omit<IFeedback, 'id' | 'userId' | 'userName' | 'userEmail' | 'createdAt' | 'updatedAt'>>
  ): Promise<ApiResponse<IFeedback>> {
    try {
      // Validate if updating title or description
      if (updates.title && updates.title.trim().length < 5) {
        return {
          success: false,
          error: {
            code: 'INVALID_TITLE',
            message: 'Başlık en az 5 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      if (updates.description && updates.description.trim().length < 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_DESCRIPTION',
            message: 'Açıklama en az 10 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FeedbackService', 'updateFeedback', { id });

      const result = await feedbacksAPI.updateFeedback(id, updates);

      if (result.success) {
        ApiLogger.success('FeedbackService', 'updateFeedback', { id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FeedbackService', 'updateFeedback', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FEEDBACK_ERROR',
          message: error.message || 'Geri bildirim güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete feedback
   */
  static async deleteFeedback(id: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('FeedbackService', 'deleteFeedback', { id });

      const result = await feedbacksAPI.delete(id);

      if (result.success) {
        ApiLogger.success('FeedbackService', 'deleteFeedback', { id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FeedbackService', 'deleteFeedback', error);
      return {
        success: false,
        error: {
          code: 'DELETE_FEEDBACK_ERROR',
          message: error.message || 'Geri bildirim silinemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. STATUS MANAGEMENT
  // ============================================

  /**
   * Update status
   */
  static async updateStatus(
    id: string,
    status: IFeedback['status']
  ): Promise<ApiResponse<IFeedback>> {
    try {
      ApiLogger.log('FeedbackService', 'updateStatus', { id, status });

      const result = await feedbacksAPI.updateStatus(id, status);

      if (result.success) {
        ApiLogger.success('FeedbackService', 'updateStatus', { id, status });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FeedbackService', 'updateStatus', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_STATUS_ERROR',
          message: error.message || 'Durum güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Mark as in progress
   */
  static async markAsInProgress(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.markAsInProgress(id);
  }

  /**
   * Mark as resolved
   */
  static async markAsResolved(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.markAsResolved(id);
  }

  /**
   * Mark as closed
   */
  static async markAsClosed(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.markAsClosed(id);
  }

  /**
   * Reopen feedback
   */
  static async reopenFeedback(id: string): Promise<ApiResponse<IFeedback>> {
    try {
      ApiLogger.log('FeedbackService', 'reopenFeedback', { id });

      const result = await feedbacksAPI.reopenFeedback(id);

      if (result.success) {
        ApiLogger.success('FeedbackService', 'reopenFeedback', { id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FeedbackService', 'reopenFeedback', error);
      return {
        success: false,
        error: {
          code: 'REOPEN_ERROR',
          message: error.message || 'Geri bildirim yeniden açılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. PRIORITY MANAGEMENT
  // ============================================

  /**
   * Update priority
   */
  static async updatePriority(
    id: string,
    priority: IFeedback['priority']
  ): Promise<ApiResponse<IFeedback>> {
    try {
      ApiLogger.log('FeedbackService', 'updatePriority', { id, priority });

      const result = await feedbacksAPI.updatePriority(id, priority);

      if (result.success) {
        ApiLogger.success('FeedbackService', 'updatePriority', { id, priority });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FeedbackService', 'updatePriority', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PRIORITY_ERROR',
          message: error.message || 'Öncelik güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Set priority to critical
   */
  static async setPriorityCritical(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.setPriorityCritical(id);
  }

  /**
   * Set priority to high
   */
  static async setPriorityHigh(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.setPriorityHigh(id);
  }

  /**
   * Set priority to medium
   */
  static async setPriorityMedium(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.setPriorityMedium(id);
  }

  /**
   * Set priority to low
   */
  static async setPriorityLow(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.setPriorityLow(id);
  }

  // ============================================
  // 5. RESPONSE MANAGEMENT
  // ============================================

  /**
   * Add response to feedback
   */
  static async addResponse(
    id: string,
    message: string,
    respondedBy: string
  ): Promise<ApiResponse<IFeedback>> {
    try {
      if (!message || message.trim().length < 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Yanıt en az 10 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FeedbackService', 'addResponse', { id });

      const result = await feedbacksAPI.addResponse(id, message, respondedBy);

      if (result.success) {
        ApiLogger.success('FeedbackService', 'addResponse', { id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FeedbackService', 'addResponse', error);
      return {
        success: false,
        error: {
          code: 'ADD_RESPONSE_ERROR',
          message: error.message || 'Yanıt eklenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update response
   */
  static async updateResponse(
    id: string,
    message: string
  ): Promise<ApiResponse<IFeedback>> {
    try {
      if (!message || message.trim().length < 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Yanıt en az 10 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      return feedbacksAPI.updateResponse(id, message);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_RESPONSE_ERROR',
          message: error.message || 'Yanıt güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove response
   */
  static async removeResponse(id: string): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.removeResponse(id);
  }

  // ============================================
  // 6. ATTACHMENT MANAGEMENT
  // ============================================

  /**
   * Add attachment
   */
  static async addAttachment(
    id: string,
    attachmentUrl: string
  ): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.addAttachment(id, attachmentUrl);
  }

  /**
   * Remove attachment
   */
  static async removeAttachment(
    id: string,
    attachmentUrl: string
  ): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.removeAttachment(id, attachmentUrl);
  }

  /**
   * Add screenshot
   */
  static async addScreenshot(
    id: string,
    screenshotUrl: string
  ): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.addScreenshot(id, screenshotUrl);
  }

  /**
   * Remove screenshot
   */
  static async removeScreenshot(
    id: string,
    screenshotUrl: string
  ): Promise<ApiResponse<IFeedback>> {
    return feedbacksAPI.removeScreenshot(id, screenshotUrl);
  }

  // ============================================
  // 7. STATISTICS
  // ============================================

  /**
   * Get feedback statistics
   */
  static async getFeedbackStats(): Promise<ApiResponse<{
    total: number;
    byType: Record<IFeedback['type'], number>;
    byStatus: Record<IFeedback['status'], number>;
    byPriority: Record<IFeedback['priority'], number>;
    unresolved: number;
    resolved: number;
    averageResolutionTime?: number;
  }>> {
    return feedbacksAPI.getFeedbackStats();
  }

  /**
   * Get user feedback summary
   */
  static async getUserFeedbackSummary(userId: string): Promise<ApiResponse<{
    total: number;
    byType: Record<IFeedback['type'], number>;
    byStatus: Record<IFeedback['status'], number>;
    resolved: number;
    pending: number;
  }>> {
    return feedbacksAPI.getUserFeedbackSummary(userId);
  }

  // ============================================
  // 8. GROUPED & ORGANIZED
  // ============================================

  /**
   * Get feedbacks grouped by type
   */
  static async getFeedbacksGroupedByType(): Promise<ApiResponse<
    Record<IFeedback['type'], IFeedback[]>
  >> {
    try {
      const types: IFeedback['type'][] = ['bug', 'feature', 'improvement', 'complaint', 'other'];

      const results = await Promise.all(
        types.map(type => this.getFeedbacksByType(type))
      );

      const grouped: Record<IFeedback['type'], IFeedback[]> = {
        bug: results[0].data || [],
        feature: results[1].data || [],
        improvement: results[2].data || [],
        complaint: results[3].data || [],
        other: results[4].data || [],
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
          message: error.message || 'Geri bildirimler gruplandırılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get dashboard feedbacks (for admin)
   */
  static async getDashboardFeedbacks(): Promise<ApiResponse<{
    new: IFeedback[];
    inProgress: IFeedback[];
    critical: IFeedback[];
    recent: IFeedback[];
    total: number;
  }>> {
    try {
      const [newResult, inProgressResult, criticalResult, recentResult, allResult] =
        await Promise.all([
          this.getNewFeedbacks(),
          this.getFeedbacksByStatus('in_progress'),
          this.getCriticalFeedbacks(),
          this.getRecentFeedbacks(10),
          this.getAllFeedbacks(),
        ]);

      if (!allResult.success) {
        return {
          success: false,
          error: allResult.error || {
            code: 'GET_DASHBOARD_ERROR',
            message: 'Dashboard verileri alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: {
          new: newResult.data || [],
          inProgress: inProgressResult.data || [],
          critical: criticalResult.data || [],
          recent: recentResult.data || [],
          total: allResult.data?.length || 0,
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
  static getTypeDisplay(type: IFeedback['type']): {
    label: string;
    icon: string;
    color: string;
  } {
    const typeMap: Record<
      IFeedback['type'],
      { label: string; icon: string; color: string }
    > = {
      bug: { label: 'Hata', icon: '🐛', color: 'red' },
      feature: { label: 'Özellik İsteği', icon: '💡', color: 'blue' },
      improvement: { label: 'İyileştirme', icon: '📈', color: 'green' },
      complaint: { label: 'Şikayet', icon: '😞', color: 'orange' },
      other: { label: 'Diğer', icon: '📝', color: 'gray' },
    };

    return typeMap[type];
  }

  /**
   * Get status display info
   */
  static getStatusDisplay(status: IFeedback['status']): {
    label: string;
    icon: string;
    color: string;
  } {
    const statusMap: Record<
      IFeedback['status'],
      { label: string; icon: string; color: string }
    > = {
      new: { label: 'Yeni', icon: '🆕', color: 'blue' },
      in_progress: { label: 'İşlemde', icon: '⏳', color: 'yellow' },
      resolved: { label: 'Çözüldü', icon: '✅', color: 'green' },
      closed: { label: 'Kapatıldı', icon: '🔒', color: 'gray' },
    };

    return statusMap[status];
  }

  /**
   * Get priority display info
   */
  static getPriorityDisplay(priority: IFeedback['priority']): {
    label: string;
    icon: string;
    color: string;
  } {
    const priorityMap: Record<
      IFeedback['priority'],
      { label: string; icon: string; color: string }
    > = {
      low: { label: 'Düşük', icon: '⬇️', color: 'gray' },
      medium: { label: 'Orta', icon: '➡️', color: 'blue' },
      high: { label: 'Yüksek', icon: '⬆️', color: 'orange' },
      critical: { label: 'Kritik', icon: '🚨', color: 'red' },
    };

    return priorityMap[priority];
  }

  /**
   * Format feedback for display
   */
  static formatFeedback(feedback: IFeedback): {
    id: string;
    title: string;
    type: ReturnType<typeof FeedbackService.getTypeDisplay>;
    status: ReturnType<typeof FeedbackService.getStatusDisplay>;
    priority: ReturnType<typeof FeedbackService.getPriorityDisplay>;
    userName: string;
    hasResponse: boolean;
    hasAttachments: boolean;
    createdAt: string;
    daysOpen: number;
  } {
    const now = new Date();
    const createdDate = new Date(feedback.createdAt);
    const daysDiff = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      id: feedback.id,
      title: feedback.title,
      type: this.getTypeDisplay(feedback.type),
      status: this.getStatusDisplay(feedback.status),
      priority: this.getPriorityDisplay(feedback.priority),
      userName: feedback.userName,
      hasResponse: !!feedback.response,
      hasAttachments: (feedback.attachments?.length || 0) + (feedback.screenshots?.length || 0) > 0,
      createdAt: feedback.createdAt,
      daysOpen: daysDiff,
    };
  }

  /**
   * Validate feedback data
   */
  static validateFeedback(data: {
    title: string;
    description: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Title validation
    if (!data.title || data.title.trim().length < 5) {
      errors.push('Başlık en az 5 karakter olmalı');
    }

    if (data.title && data.title.length > 200) {
      errors.push('Başlık en fazla 200 karakter olabilir');
    }

    // Description validation
    if (!data.description || data.description.trim().length < 10) {
      errors.push('Açıklama en az 10 karakter olmalı');
    }

    if (data.description && data.description.length > 5000) {
      errors.push('Açıklama en fazla 5000 karakter olabilir');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get feedback summary for admin dashboard
   */
  static async getFeedbackSummary(): Promise<ApiResponse<{
    total: number;
    new: number;
    inProgress: number;
    resolved: number;
    critical: number;
    byType: Record<string, number>;
    avgResolutionTime: number;
  }>> {
    try {
      const statsResult = await this.getFeedbackStats();

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: statsResult.error || {
            code: 'GET_SUMMARY_ERROR',
            message: 'Özet alınamadı',
            statusCode: 500,
          },
        };
      }

      const stats = statsResult.data;

      return {
        success: true,
        data: {
          total: stats.total,
          new: stats.byStatus.new,
          inProgress: stats.byStatus.in_progress,
          resolved: stats.byStatus.resolved + stats.byStatus.closed,
          critical: stats.byPriority.critical,
          byType: stats.byType,
          avgResolutionTime: stats.averageResolutionTime || 0,
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

  /**
   * Calculate resolution time
   */
  static calculateResolutionTime(feedback: IFeedback): number | null {
    if (!feedback.resolvedAt) return null;

    const created = new Date(feedback.createdAt).getTime();
    const resolved = new Date(feedback.resolvedAt).getTime();
    const days = Math.floor((resolved - created) / (1000 * 60 * 60 * 24));

    return days;
  }
}

export default FeedbackService;


/*
// ✅ User submits feedback
const feedback = await FeedbackService.createFeedback({
  userId: user.id,
  userName: user.name,
  userEmail: user.email,
  type: 'bug',
  title: 'Maç oluştururken hata alıyorum',
  description: 'Maç oluştur butonuna tıkladığımda sayfa donuyor...',
  page: '/matches/create',
  feature: 'match_creation',
  priority: 'high',
  screenshots: [screenshotUrl1, screenshotUrl2],
  systemInfo: {
    browser: 'Chrome 120',
    os: 'Windows 11',
    device: 'Desktop',
    appVersion: '1.5.0',
  },
});

// ✅ Admin views dashboard
const dashboard = await FeedbackService.getDashboardFeedbacks();
console.log('Yeni:', dashboard.data?.new.length);
console.log('İşlemde:', dashboard.data?.inProgress.length);
console.log('Kritik:', dashboard.data?.critical.length);

// ✅ Admin updates priority
await FeedbackService.setPriorityCritical(feedbackId);

// ✅ Admin marks as in progress
await FeedbackService.markAsInProgress(feedbackId);

// ✅ Admin adds response
await FeedbackService.addResponse(
  feedbackId,
  'Bu hatayı tespit ettik ve düzeltme çalışmalarına başladık. Yakında güncellenecek.',
  adminId
);

// ✅ Admin marks as resolved
await FeedbackService.markAsResolved(feedbackId);

// ✅ User reopens feedback
await FeedbackService.reopenFeedback(feedbackId);

// ✅ Get bug reports (unresolved)
const bugs = await FeedbackService.getBugReports('new');

// ✅ Get feature requests
const features = await FeedbackService.getFeatureRequests();

// ✅ Get critical feedbacks (unresolved + critical priority)
const critical = await FeedbackService.getCriticalFeedbacks();

// ✅ Get user's feedback history
const userFeedbacks = await FeedbackService.getUserFeedbacks(userId);

// ✅ Get user feedback summary
const summary = await FeedbackService.getUserFeedbackSummary(userId);
console.log(`Toplam: ${summary.data?.total}`);
console.log(`Çözüldü: ${summary.data?.resolved}`);
console.log(`Bekliyor: ${summary.data?.pending}`);

// ✅ Get feedbacks for specific page (to see page-specific issues)
const pageFeeds = await FeedbackService.getFeedbacksByPage('/matches/create');

// ✅ Get complete statistics
const stats = await FeedbackService.getFeedbackStats();
console.log('Total:', stats.data?.total);
console.log('By type:', stats.data?.byType);
console.log('Unresolved:', stats.data?.unresolved);
console.log('Avg resolution time:', stats.data?.averageResolutionTime, 'days');

// ✅ Format feedback for display
const formatted = FeedbackService.formatFeedback(feedback);
console.log(`${formatted.type.icon} ${formatted.title}`);
console.log(`Status: ${formatted.status.label} ${formatted.status.icon}`);
console.log(`Priority: ${formatted.priority.label} ${formatted.priority.icon}`);
console.log(`Days open: ${formatted.daysOpen}`);

// ✅ Validate before submit
const validation = FeedbackService.validateFeedback({
  title: 'Bug',
  description: 'Short',
});

if (!validation.valid) {
  console.error('Errors:', validation.errors);
}

// ✅ Add screenshot after creation
await FeedbackService.addScreenshot(feedbackId, newScreenshotUrl);

// ✅ Calculate resolution time
const resolutionDays = FeedbackService.calculateResolutionTime(feedback);
console.log(`Resolved in ${resolutionDays} days`);

// ✅ Get admin summary for dashboard
const adminSummary = await FeedbackService.getFeedbackSummary();
console.log(`Total: ${adminSummary.data?.total}`);
console.log(`New: ${adminSummary.data?.new}`);
console.log(`Critical: ${adminSummary.data?.critical}`);
console.log(`Avg resolution: ${adminSummary.data?.avgResolutionTime} days`);
*/