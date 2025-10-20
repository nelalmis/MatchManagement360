// ============================================
// api/FeedbacksAPI.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { ApiLogger } from '../base/ApiLogger';
import { IFeedback } from '../../types/entity/types';

// ============================================
// TYPES
// ============================================
export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'complaint' | 'other';
export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed';
export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

// ============================================
// API CLASS
// ============================================
export class FeedbacksAPI extends BaseAPI<IFeedback> {
    constructor() {
        super('feedbacks');
    }

    // ============================================
    // CORE METHODS
    // ============================================

    /**
     * Create a new feedback
     */
    async createFeedback(
        feedbackData: Omit<IFeedback, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'resolvedAt' | 'response'>
    ): Promise<ApiResponse<IFeedback>> {
        try {
            const dataWithDefaults: Omit<IFeedback, 'id'> = {
                ...feedbackData,
                status: 'new',
                priority: feedbackData.priority || 'medium',
                createdAt: new Date().toISOString(),
            };

            return this.create(dataWithDefaults);
        } catch (error: any) {
            ApiLogger.error('feedbacks', 'createFeedback', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_FEEDBACK_ERROR',
                    message: error.message || 'Failed to create feedback',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update feedback
     */
    async updateFeedback(
        id: string,
        updates: Partial<Omit<IFeedback, 'id' | 'userId' | 'userName' | 'userEmail' | 'createdAt' | 'updatedAt'>>
    ): Promise<ApiResponse<IFeedback>> {
        return this.update(id, updates);
    }

    // ============================================
    // QUERY METHODS
    // ============================================

    /**
     * Get feedbacks by user
     */
    async getByUserId(userId: string): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            where: [{ field: 'userId', operator: '==', value: userId }],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
        });
    }

    /**
     * Get feedbacks by type
     */
    async getByType(type: FeedbackType): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            where: [{ field: 'type', operator: '==', value: type }],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
        });
    }

    /**
     * Get feedbacks by status
     */
    async getByStatus(status: FeedbackStatus): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            where: [{ field: 'status', operator: '==', value: status }],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
        });
    }

    /**
     * Get feedbacks by priority
     */
    async getByPriority(priority: FeedbackPriority): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            where: [{ field: 'priority', operator: '==', value: priority }],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
        });
    }

    /**
     * Get new feedbacks
     */
    async getNewFeedbacks(): Promise<ApiResponse<IFeedback[]>> {
        return this.getByStatus('new');
    }

    /**
     * Get unresolved feedbacks
     */
    async getUnresolvedFeedbacks(): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            where: [{ field: 'status', operator: 'in', value: ['new', 'in_progress'] }],
            orderBy: [{ field: 'priority', direction: 'desc' }, { field: 'createdAt', direction: 'asc' }],
        });
    }

    /**
     * Get critical feedbacks
     */
    async getCriticalFeedbacks(): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            where: [
                { field: 'priority', operator: '==', value: 'critical' },
                { field: 'status', operator: 'in', value: ['new', 'in_progress'] },
            ],
            orderBy: [{ field: 'createdAt', direction: 'asc' }],
        });
    }

    /**
     * Get bug reports
     */
    async getBugReports(statusFilter?: FeedbackStatus): Promise<ApiResponse<IFeedback[]>> {
        const whereConditions: QueryOptions['where'] = [
            { field: 'type', operator: '==', value: 'bug' },
        ];

        if (statusFilter) {
            whereConditions.push({ field: 'status', operator: '==', value: statusFilter });
        }

        return this.getAll({
            where: whereConditions,
            orderBy: [{ field: 'priority', direction: 'desc' }, { field: 'createdAt', direction: 'desc' }],
        });
    }

    /**
     * Get feature requests
     */
    async getFeatureRequests(statusFilter?: FeedbackStatus): Promise<ApiResponse<IFeedback[]>> {
        const whereConditions: QueryOptions['where'] = [
            { field: 'type', operator: '==', value: 'feature' },
        ];

        if (statusFilter) {
            whereConditions.push({ field: 'status', operator: '==', value: statusFilter });
        }

        return this.getAll({
            where: whereConditions,
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
        });
    }

    /**
     * Get feedbacks by page
     */
    async getByPage(page: string): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            where: [{ field: 'page', operator: '==', value: page }],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
        });
    }

    /**
     * Get feedbacks by feature
     */
    async getByFeature(feature: string): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            where: [{ field: 'feature', operator: '==', value: feature }],
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
        });
    }

    /**
     * Get recent feedbacks
     */
    async getRecentFeedbacks(limitCount: number = 20): Promise<ApiResponse<IFeedback[]>> {
        return this.getAll({
            orderBy: [{ field: 'createdAt', direction: 'desc' }],
            limit: limitCount,
        });
    }

    // ============================================
    // STATUS METHODS
    // ============================================

    /**
     * Update feedback status
     */
    async updateStatus(
        id: string,
        status: FeedbackStatus,
        resolvedAt?: string
    ): Promise<ApiResponse<IFeedback>> {
        const updates: Partial<IFeedback> = { status };

        if (status === 'resolved' || status === 'closed') {
            updates.resolvedAt = resolvedAt || new Date().toISOString();
        }

        return this.update(id, updates);
    }

    /**
     * Mark as in progress
     */
    async markAsInProgress(id: string): Promise<ApiResponse<IFeedback>> {
        return this.updateStatus(id, 'in_progress');
    }

    /**
     * Mark as resolved
     */
    async markAsResolved(id: string): Promise<ApiResponse<IFeedback>> {
        return this.updateStatus(id, 'resolved');
    }

    /**
     * Mark as closed
     */
    async markAsClosed(id: string): Promise<ApiResponse<IFeedback>> {
        return this.updateStatus(id, 'closed');
    }

    /**
     * Reopen feedback
     */
    async reopenFeedback(id: string): Promise<ApiResponse<IFeedback>> {
        return this.update(id, {
            status: 'new',
            resolvedAt: undefined,
        });
    }

    // ============================================
    // PRIORITY METHODS
    // ============================================

    /**
     * Update priority
     */
    async updatePriority(
        id: string,
        priority: FeedbackPriority
    ): Promise<ApiResponse<IFeedback>> {
        return this.update(id, { priority });
    }

    /**
     * Set priority to critical
     */
    async setPriorityCritical(id: string): Promise<ApiResponse<IFeedback>> {
        return this.updatePriority(id, 'critical');
    }

    /**
     * Set priority to high
     */
    async setPriorityHigh(id: string): Promise<ApiResponse<IFeedback>> {
        return this.updatePriority(id, 'high');
    }

    /**
     * Set priority to medium
     */
    async setPriorityMedium(id: string): Promise<ApiResponse<IFeedback>> {
        return this.updatePriority(id, 'medium');
    }

    /**
     * Set priority to low
     */
    async setPriorityLow(id: string): Promise<ApiResponse<IFeedback>> {
        return this.updatePriority(id, 'low');
    }

    // ============================================
    // RESPONSE METHODS
    // ============================================

    /**
     * Add response to feedback
     */
    async addResponse(
        id: string,
        message: string,
        respondedBy: string
    ): Promise<ApiResponse<IFeedback>> {
        const response = {
            message,
            respondedBy,
            respondedAt: new Date().toISOString(),
        };

        return this.update(id, { response });
    }

    /**
     * Update response
     */
    async updateResponse(
        id: string,
        message: string
    ): Promise<ApiResponse<IFeedback>> {
        try {
            const feedbackResult = await this.getById(id);

            if (!feedbackResult.success || !feedbackResult.data) {
                return {
                    success: false,
                    error: feedbackResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Feedback not found',
                        statusCode: 404,
                    },
                };
            }

            if (!feedbackResult.data.response) {
                return {
                    success: false,
                    error: {
                        code: 'NO_RESPONSE',
                        message: 'Feedback has no response to update',
                        statusCode: 400,
                    },
                };
            }

            return this.update(id, {
                response: {
                    ...feedbackResult.data.response,
                    message,
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_RESPONSE_ERROR',
                    message: error.message || 'Failed to update response',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove response
     */
    async removeResponse(id: string): Promise<ApiResponse<IFeedback>> {
        return this.update(id, { response: undefined });
    }

    // ============================================
    // ATTACHMENT METHODS
    // ============================================

    /**
     * Add attachment
     */
    async addAttachment(id: string, attachmentUrl: string): Promise<ApiResponse<IFeedback>> {
        try {
            const feedbackResult = await this.getById(id);

            if (!feedbackResult.success || !feedbackResult.data) {
                return {
                    success: false,
                    error: feedbackResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Feedback not found',
                        statusCode: 404,
                    },
                };
            }

            const currentAttachments = feedbackResult.data.attachments || [];

            return this.update(id, {
                attachments: [...currentAttachments, attachmentUrl],
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'ADD_ATTACHMENT_ERROR',
                    message: error.message || 'Failed to add attachment',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove attachment
     */
    async removeAttachment(id: string, attachmentUrl: string): Promise<ApiResponse<IFeedback>> {
        try {
            const feedbackResult = await this.getById(id);

            if (!feedbackResult.success || !feedbackResult.data) {
                return {
                    success: false,
                    error: feedbackResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Feedback not found',
                        statusCode: 404,
                    },
                };
            }

            const currentAttachments = feedbackResult.data.attachments || [];
            const updatedAttachments = currentAttachments.filter((url) => url !== attachmentUrl);

            return this.update(id, {
                attachments: updatedAttachments,
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_ATTACHMENT_ERROR',
                    message: error.message || 'Failed to remove attachment',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Add screenshot
     */
    async addScreenshot(id: string, screenshotUrl: string): Promise<ApiResponse<IFeedback>> {
        try {
            const feedbackResult = await this.getById(id);

            if (!feedbackResult.success || !feedbackResult.data) {
                return {
                    success: false,
                    error: feedbackResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Feedback not found',
                        statusCode: 404,
                    },
                };
            }

            const currentScreenshots = feedbackResult.data.screenshots || [];

            return this.update(id, {
                screenshots: [...currentScreenshots, screenshotUrl],
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'ADD_SCREENSHOT_ERROR',
                    message: error.message || 'Failed to add screenshot',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove screenshot
     */
    async removeScreenshot(id: string, screenshotUrl: string): Promise<ApiResponse<IFeedback>> {
        try {
            const feedbackResult = await this.getById(id);

            if (!feedbackResult.success || !feedbackResult.data) {
                return {
                    success: false,
                    error: feedbackResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Feedback not found',
                        statusCode: 404,
                    },
                };
            }

            const currentScreenshots = feedbackResult.data.screenshots || [];
            const updatedScreenshots = currentScreenshots.filter((url) => url !== screenshotUrl);

            return this.update(id, {
                screenshots: updatedScreenshots,
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_SCREENSHOT_ERROR',
                    message: error.message || 'Failed to remove screenshot',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // ADVANCED QUERIES
    // ============================================

    /**
     * Get feedbacks with filters
     */
    async getFeedbacksFiltered(filters: {
        type?: FeedbackType;
        status?: FeedbackStatus;
        priority?: FeedbackPriority;
        userId?: string;
        page?: string;
        feature?: string;
        hasResponse?: boolean;
        limit?: number;
    }): Promise<ApiResponse<IFeedback[]>> {
        try {
            const whereConditions: QueryOptions['where'] = [];

            if (filters.type) {
                whereConditions.push({ field: 'type', operator: '==', value: filters.type });
            }

            if (filters.status) {
                whereConditions.push({ field: 'status', operator: '==', value: filters.status });
            }

            if (filters.priority) {
                whereConditions.push({ field: 'priority', operator: '==', value: filters.priority });
            }

            if (filters.userId) {
                whereConditions.push({ field: 'userId', operator: '==', value: filters.userId });
            }

            if (filters.page) {
                whereConditions.push({ field: 'page', operator: '==', value: filters.page });
            }

            if (filters.feature) {
                whereConditions.push({ field: 'feature', operator: '==', value: filters.feature });
            }

            return this.getAll({
                where: whereConditions.length > 0 ? whereConditions : undefined,
                orderBy: [{ field: 'createdAt', direction: 'desc' }],
                limit: filters.limit || 100,
            });
        } catch (error: any) {
            ApiLogger.error('feedbacks', 'getFeedbacksFiltered', error);
            return {
                success: false,
                error: {
                    code: 'FILTER_ERROR',
                    message: error.message || 'Failed to filter feedbacks',
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
     * Get feedback statistics
     */
    async getFeedbackStats(): Promise<
        ApiResponse<{
            total: number;
            byType: Record<FeedbackType, number>;
            byStatus: Record<FeedbackStatus, number>;
            byPriority: Record<FeedbackPriority, number>;
            unresolved: number;
            resolved: number;
            averageResolutionTime?: number;
        }>> {
        try {
            const feedbacksResult = await this.getAll();

            if (!feedbacksResult.success || !feedbacksResult.data) {
                return {
                    success: false,
                    error: feedbacksResult.error || {
                        code: 'STATS_ERROR',
                        message: 'Failed to get feedbacks for statistics',
                        statusCode: 500,
                    },
                };
            }

            const feedbacks = feedbacksResult.data;

            const stats = {
                total: feedbacks.length,
                byType: {
                    bug: 0,
                    feature: 0,
                    improvement: 0,
                    complaint: 0,
                    other: 0,
                } as Record<FeedbackType, number>,
                byStatus: {
                    new: 0,
                    in_progress: 0,
                    resolved: 0,
                    closed: 0,
                } as Record<FeedbackStatus, number>,
                byPriority: {
                    low: 0,
                    medium: 0,
                    high: 0,
                    critical: 0,
                } as Record<FeedbackPriority, number>,
                unresolved: 0,
                resolved: 0,
                averageResolutionTime: undefined as number | undefined,
            };

            let totalResolutionTime = 0;
            let resolvedCount = 0;

            feedbacks.forEach((feedback) => {
                stats.byType[feedback.type]++;
                stats.byStatus[feedback.status]++;
                stats.byPriority[feedback.priority]++;

                if (feedback.status === 'new' || feedback.status === 'in_progress') {
                    stats.unresolved++;
                } else {
                    stats.resolved++;

                    if (feedback.createdAt && feedback.resolvedAt) {
                        const created = new Date(feedback.createdAt).getTime();
                        const resolved = new Date(feedback.resolvedAt).getTime();
                        totalResolutionTime += resolved - created;
                        resolvedCount++;
                    }
                }
            });

            if (resolvedCount > 0) {
                stats.averageResolutionTime = Math.round(
                    totalResolutionTime / resolvedCount / (1000 * 60 * 60 * 24)
                ); // Days
            }

            return {
                success: true,
                data: stats,
            };
        } catch (error: any) {
            ApiLogger.error('feedbacks', 'getFeedbackStats', error);
            return {
                success: false,
                error: {
                    code: 'STATS_ERROR',
                    message: error.message || 'Failed to get feedback statistics',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Get user feedback summary
     */
    async getUserFeedbackSummary(userId: string): Promise<
        ApiResponse<{
            total: number;
            byType: Record<FeedbackType, number>;
            byStatus: Record<FeedbackStatus, number>;
            resolved: number;
            pending: number;
        }>
    > {
        try {
            const feedbacksResult = await this.getByUserId(userId);

            if (!feedbacksResult.success || !feedbacksResult.data) {
                return {
                    success: false,
                    error: feedbacksResult.error || {
                        code: 'SUMMARY_ERROR',
                        message: 'Failed to get user feedbacks',
                        statusCode: 500,
                    },
                };
            }

            const feedbacks = feedbacksResult.data;

            const summary = {
                total: feedbacks.length,
                byType: {
                    bug: 0,
                    feature: 0,
                    improvement: 0,
                    complaint: 0,
                    other: 0,
                } as Record<FeedbackType, number>,
                byStatus: {
                    new: 0,
                    in_progress: 0,
                    resolved: 0,
                    closed: 0,
                } as Record<FeedbackStatus, number>,
                resolved: 0,
                pending: 0,
            };

            feedbacks.forEach((feedback) => {
                summary.byType[feedback.type]++;
                summary.byStatus[feedback.status]++;

                if (feedback.status === 'resolved' || feedback.status === 'closed') {
                    summary.resolved++;
                } else {
                    summary.pending++;
                }
            });

            return {
                success: true,
                data: summary,
            };
        } catch (error: any) {
            ApiLogger.error('feedbacks', 'getUserFeedbackSummary', error);
            return {
                success: false,
                error: {
                    code: 'SUMMARY_ERROR',
                    message: error.message || 'Failed to get user feedback summary',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
}

// Export singleton instance
export const feedbacksAPI = new FeedbacksAPI();