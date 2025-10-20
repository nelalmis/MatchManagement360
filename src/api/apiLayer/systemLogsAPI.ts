// ============================================
// api/SystemLogsAPI.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { ApiLogger } from '../base/ApiLogger';

// ============================================
// TYPES
// ============================================
export type LogLevel = 'info' | 'warning' | 'error' | 'critical';
export type LogCategory =
    | 'auth'
    | 'match'
    | 'payment'
    | 'notification'
    | 'calculation'
    | 'integration'
    | 'security';

export type LogSource = 'web' | 'api' | 'cron' | 'webhook';

export interface ISystemLog {
    id?: string;

    level: LogLevel;
    category: LogCategory;
    message: string;

    details?: {
        userId?: string;
        leagueId?: string;
        matchId?: string;
        error?: any;
        stackTrace?: string;
        request?: any;
        response?: any;
    };

    timestamp?: string;
    source: LogSource;
    ipAddress?: string;
    userAgent?: string;

    createdAt?: string;
}

// ============================================
// API CLASS
// ============================================
export class SystemLogsAPI extends BaseAPI<ISystemLog> {
    constructor() {
        super('system_logs');
    }

    // ============================================
    // CORE LOGGING METHODS
    // ============================================

    /**
     * Create a system log entry
     */
    async log(
        level: LogLevel,
        category: LogCategory,
        message: string,
        options?: {
            details?: ISystemLog['details'];
            source?: LogSource;
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        try {
            const logEntry: Omit<ISystemLog, 'id' | 'createdAt'> = {
                level,
                category,
                message,
                timestamp: new Date().toISOString(),
                source: options?.source || 'web',
                details: options?.details,
                ipAddress: options?.ipAddress,
                userAgent: options?.userAgent,
            };

            return this.create(logEntry);
        } catch (error: any) {
            ApiLogger.error('system_logs', 'log', error);
            return {
                success: false,
                error: {
                    code: 'LOG_ERROR',
                    message: error.message || 'Failed to create log entry',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Log an info message
     */
    async logInfo(
        category: LogCategory,
        message: string,
        options?: {
            details?: ISystemLog['details'];
            source?: LogSource;
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        return this.log('info', category, message, options);
    }

    /**
     * Log a warning message
     */
    async logWarning(
        category: LogCategory,
        message: string,
        options?: {
            details?: ISystemLog['details'];
            source?: LogSource;
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        return this.log('warning', category, message, options);
    }

    /**
     * Log an error message
     */
    async logError(
        category: LogCategory,
        message: string,
        error?: Error | any,
        options?: {
            details?: ISystemLog['details'];
            source?: LogSource;
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        const details: ISystemLog['details'] = {
            ...options?.details,
            error: error?.message || error,
            stackTrace: error?.stack,
        };

        return this.log('error', category, message, {
            ...options,
            details,
        });
    }

    /**
     * Log a critical message
     */
    async logCritical(
        category: LogCategory,
        message: string,
        error?: Error | any,
        options?: {
            details?: ISystemLog['details'];
            source?: LogSource;
            ipAddress?: string;
            userAgent?: string;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        const details: ISystemLog['details'] = {
            ...options?.details,
            error: error?.message || error,
            stackTrace: error?.stack,
        };

        return this.log('critical', category, message, {
            ...options,
            details,
        });
    }

    // ============================================
    // QUERY METHODS
    // ============================================

    /**
     * Get logs by level
     */
    async getByLevel(
        level: LogLevel,
        limitCount?: number
    ): Promise<ApiResponse<ISystemLog[]>> {
        return this.getAll({
            where: [{ field: 'level', operator: '==', value: level }],
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: limitCount || 100,
        });
    }

    /**
     * Get logs by category
     */
    async getByCategory(
        category: LogCategory,
        limitCount?: number
    ): Promise<ApiResponse<ISystemLog[]>> {
        return this.getAll({
            where: [{ field: 'category', operator: '==', value: category }],
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: limitCount || 100,
        });
    }

    /**
     * Get logs by source
     */
    async getBySource(
        source: LogSource,
        limitCount?: number
    ): Promise<ApiResponse<ISystemLog[]>> {
        return this.getAll({
            where: [{ field: 'source', operator: '==', value: source }],
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: limitCount || 100,
        });
    }

    /**
     * Get logs by user ID
     */
    async getByUserId(userId: string, limitCount?: number): Promise<ApiResponse<ISystemLog[]>> {
        return this.getAll({
            where: [{ field: 'details.userId', operator: '==', value: userId }],
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: limitCount || 50,
        });
    }

    /**
     * Get logs by league ID
     */
    async getByLeagueId(leagueId: string, limitCount?: number): Promise<ApiResponse<ISystemLog[]>> {
        return this.getAll({
            where: [{ field: 'details.leagueId', operator: '==', value: leagueId }],
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: limitCount || 50,
        });
    }

    /**
     * Get logs by match ID
     */
    async getByMatchId(matchId: string, limitCount?: number): Promise<ApiResponse<ISystemLog[]>> {
        return this.getAll({
            where: [{ field: 'details.matchId', operator: '==', value: matchId }],
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: limitCount || 50,
        });
    }

    /**
     * Get logs within a time range
     */
    async getByTimeRange(
        startTime: string,
        endTime: string,
        options?: {
            level?: LogLevel;
            category?: LogCategory;
            limit?: number;
        }
    ): Promise<ApiResponse<ISystemLog[]>> {
        const whereConditions: QueryOptions['where'] = [
            { field: 'timestamp', operator: '>=', value: startTime },
            { field: 'timestamp', operator: '<=', value: endTime },
        ];

        if (options?.level) {
            whereConditions.push({ field: 'level', operator: '==', value: options.level });
        }

        if (options?.category) {
            whereConditions.push({ field: 'category', operator: '==', value: options.category });
        }

        return this.getAll({
            where: whereConditions,
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: options?.limit || 100,
        });
    }

    /**
     * Get recent logs
     */
    async getRecentLogs(limitCount: number = 50): Promise<ApiResponse<ISystemLog[]>> {
        return this.getAll({
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: limitCount,
        });
    }

    /**
     * Get critical and error logs
     */
    async getCriticalAndErrorLogs(limitCount?: number): Promise<ApiResponse<ISystemLog[]>> {
        return this.getAll({
            where: [{ field: 'level', operator: 'in', value: ['critical', 'error'] }],
            orderBy: [{ field: 'timestamp', direction: 'desc' }],
            limit: limitCount || 100,
        });
    }

    // ============================================
    // ADVANCED QUERIES
    // ============================================

    /**
     * Get logs with filters
     */
    async getLogsFiltered(filters: {
        level?: LogLevel;
        category?: LogCategory;
        source?: LogSource;
        userId?: string;
        leagueId?: string;
        matchId?: string;
        startTime?: string;
        endTime?: string;
        limit?: number;
    }): Promise<ApiResponse<ISystemLog[]>> {
        try {
            const whereConditions: QueryOptions['where'] = [];

            if (filters.level) {
                whereConditions.push({ field: 'level', operator: '==', value: filters.level });
            }

            if (filters.category) {
                whereConditions.push({ field: 'category', operator: '==', value: filters.category });
            }

            if (filters.source) {
                whereConditions.push({ field: 'source', operator: '==', value: filters.source });
            }

            if (filters.userId) {
                whereConditions.push({ field: 'details.userId', operator: '==', value: filters.userId });
            }

            if (filters.leagueId) {
                whereConditions.push({ field: 'details.leagueId', operator: '==', value: filters.leagueId });
            }

            if (filters.matchId) {
                whereConditions.push({ field: 'details.matchId', operator: '==', value: filters.matchId });
            }

            if (filters.startTime) {
                whereConditions.push({ field: 'timestamp', operator: '>=', value: filters.startTime });
            }

            if (filters.endTime) {
                whereConditions.push({ field: 'timestamp', operator: '<=', value: filters.endTime });
            }

            return this.getAll({
                where: whereConditions.length > 0 ? whereConditions : undefined,
                orderBy: [{ field: 'timestamp', direction: 'desc' }],
                limit: filters.limit || 100,
            });
        } catch (error: any) {
            ApiLogger.error('system_logs', 'getLogsFiltered', error);
            return {
                success: false,
                error: {
                    code: 'FILTER_ERROR',
                    message: error.message || 'Failed to filter logs',
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
     * Get log statistics
     */
    async getLogStats(options?: {
        startTime?: string;
        endTime?: string;
    }): Promise<ApiResponse<{
            total: number;
            byLevel: Record<LogLevel, number>;
            byCategory: Record<LogCategory, number>;
            bySource: Record<LogSource, number>;
        }>
    > {
        try {
            const queryOptions: QueryOptions = {
                orderBy: [{ field: 'timestamp', direction: 'desc' }],
            };

            const whereConditions: QueryOptions['where'] = [];

            if (options?.startTime) {
                whereConditions.push({ field: 'timestamp', operator: '>=', value: options.startTime });
            }

            if (options?.endTime) {
                whereConditions.push({ field: 'timestamp', operator: '<=', value: options.endTime });
            }

            if (whereConditions.length > 0) {
                queryOptions.where = whereConditions;
            }

            const logsResult = await this.getAll(queryOptions);

            if (!logsResult.success || !logsResult.data) {
                return {
                    success: false,
                    error: logsResult.error || {
                        code: 'STATS_ERROR',
                        message: 'Failed to get logs for statistics',
                        statusCode: 500,
                    },
                };
            }

            const logs = logsResult.data;

            const stats = {
                total: logs.length,
                byLevel: {
                    info: 0,
                    warning: 0,
                    error: 0,
                    critical: 0,
                } as Record<LogLevel, number>,
                byCategory: {
                    auth: 0,
                    match: 0,
                    payment: 0,
                    notification: 0,
                    calculation: 0,
                    integration: 0,
                    security: 0,
                } as Record<LogCategory, number>,
                bySource: {
                    web: 0,
                    api: 0,
                    cron: 0,
                    webhook: 0,
                } as Record<LogSource, number>,
            };

            logs.forEach((log) => {
                stats.byLevel[log.level]++;
                stats.byCategory[log.category]++;
                stats.bySource[log.source]++;
            });

            return {
                success: true,
                data: stats,
            };
        } catch (error: any) {
            ApiLogger.error('system_logs', 'getLogStats', error);
            return {
                success: false,
                error: {
                    code: 'STATS_ERROR',
                    message: error.message || 'Failed to get log statistics',
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
     * Delete logs older than specified days
     */
    async cleanupOldLogs(daysToKeep: number = 90): Promise<ApiResponse<number>> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            const cutoffTimestamp = cutoffDate.toISOString();

            const oldLogsResult = await this.getAll({
                where: [{ field: 'timestamp', operator: '<', value: cutoffTimestamp }],
            });

            if (!oldLogsResult.success || !oldLogsResult.data) {
                return {
                    success: false,
                    error: oldLogsResult.error || {
                        code: 'CLEANUP_ERROR',
                        message: 'Failed to get old logs',
                        statusCode: 500,
                    },
                };
            }

            if (oldLogsResult.data.length === 0) {
                return { success: true, data: 0 };
            }

            const ids = oldLogsResult.data.filter(log => log.id).map((log) => log.id!);
            const deleteResult = await this.deleteBatch(ids);

            if (!deleteResult.success) {
                return {
                    success: false,
                    error: deleteResult.error || {
                        code: 'CLEANUP_ERROR',
                        message: 'Failed to delete old logs',
                        statusCode: 500,
                    },
                };
            }

            return {
                success: true,
                data: ids.length,
            };
        } catch (error: any) {
            ApiLogger.error('system_logs', 'cleanupOldLogs', error);
            return {
                success: false,
                error: {
                    code: 'CLEANUP_ERROR',
                    message: error.message || 'Failed to cleanup old logs',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Delete logs by level
     */
    async deleteLogsByLevel(level: LogLevel): Promise<ApiResponse<number>> {
        try {
            const logsResult = await this.getByLevel(level, 1000);

            if (!logsResult.success || !logsResult.data) {
                return {
                    success: false,
                    error: logsResult.error || {
                        code: 'DELETE_ERROR',
                        message: 'Failed to get logs by level',
                        statusCode: 500,
                    },
                };
            }

            if (logsResult.data.length === 0) {
                return { success: true, data: 0 };
            }

            const ids = logsResult.data.filter(log => log.id).map((log) => log.id!);
            const deleteResult = await this.deleteBatch(ids);

            if (!deleteResult.success) {
                return {
                    success: false,
                    error: deleteResult.error || {
                        code: 'DELETE_ERROR',
                        message: 'Failed to delete logs',
                        statusCode: 500,
                    },
                };
            }

            return {
                success: true,
                data: ids.length,
            };
        } catch (error: any) {
            ApiLogger.error('system_logs', 'deleteLogsByLevel', error);
            return {
                success: false,
                error: {
                    code: 'DELETE_ERROR',
                    message: error.message || 'Failed to delete logs by level',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // SPECIALIZED CATEGORY LOGGERS
    // ============================================

    async logAuth(
        level: LogLevel,
        message: string,
        userId?: string,
        options?: {
            source?: LogSource;
            ipAddress?: string;
            userAgent?: string;
            error?: any;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        return this.log(level, 'auth', message, {
            ...options,
            details: { userId, error: options?.error },
        });
    }

    async logMatch(
        level: LogLevel,
        message: string,
        matchId: string,
        options?: {
            leagueId?: string;
            userId?: string;
            source?: LogSource;
            error?: any;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        return this.log(level, 'match', message, {
            ...options,
            details: {
                matchId,
                leagueId: options?.leagueId,
                userId: options?.userId,
                error: options?.error,
            },
        });
    }

    async logPayment(
        level: LogLevel,
        message: string,
        options?: {
            userId?: string;
            matchId?: string;
            leagueId?: string;
            source?: LogSource;
            error?: any;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        return this.log(level, 'payment', message, {
            ...options,
            details: {
                userId: options?.userId,
                matchId: options?.matchId,
                leagueId: options?.leagueId,
                error: options?.error,
            },
        });
    }

    async logNotification(
        level: LogLevel,
        message: string,
        userId: string,
        options?: {
            source?: LogSource;
            error?: any;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        return this.log(level, 'notification', message, {
            ...options,
            details: { userId, error: options?.error },
        });
    }

    async logSecurity(
        level: LogLevel,
        message: string,
        options?: {
            userId?: string;
            source?: LogSource;
            ipAddress?: string;
            userAgent?: string;
            error?: any;
        }
    ): Promise<ApiResponse<ISystemLog>> {
        return this.log(level, 'security', message, options);
    }
}

// Export singleton instance
export const systemLogsAPI = new SystemLogsAPI();