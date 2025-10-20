// ============================================
// services/SystemLogsService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { systemLogsAPI, LogLevel, LogCategory, LogSource, ISystemLog } from '../../api/apiLayer/systemLogsAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { ApiLogger } from '../../api/base/ApiLogger';

export class SystemLogsService {
  // ============================================
  // 1. CORE LOGGING OPERATIONS
  // ============================================

  /**
   * Create a system log entry
   */
  static async log(
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
    return systemLogsAPI.log(level, category, message, options);
  }

  /**
   * Log info message
   */
  static async logInfo(
    category: LogCategory,
    message: string,
    options?: {
      details?: ISystemLog['details'];
      source?: LogSource;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<ApiResponse<ISystemLog>> {
    return systemLogsAPI.logInfo(category, message, options);
  }

  /**
   * Log warning message
   */
  static async logWarning(
    category: LogCategory,
    message: string,
    options?: {
      details?: ISystemLog['details'];
      source?: LogSource;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<ApiResponse<ISystemLog>> {
    return systemLogsAPI.logWarning(category, message, options);
  }

  /**
   * Log error message
   */
  static async logError(
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
    return systemLogsAPI.logError(category, message, error, options);
  }

  /**
   * Log critical message
   */
  static async logCritical(
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
    return systemLogsAPI.logCritical(category, message, error, options);
  }

  // ============================================
  // 2. SPECIALIZED CATEGORY LOGGERS
  // ============================================

  /**
   * Log authentication event
   */
  static async logAuth(
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
    return systemLogsAPI.logAuth(level, message, userId, options);
  }

  /**
   * Log match event
   */
  static async logMatch(
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
    return systemLogsAPI.logMatch(level, message, matchId, options);
  }

  /**
   * Log payment event
   */
  static async logPayment(
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
    return systemLogsAPI.logPayment(level, message, options);
  }

  /**
   * Log notification event
   */
  static async logNotification(
    level: LogLevel,
    message: string,
    userId: string,
    options?: {
      source?: LogSource;
      error?: any;
    }
  ): Promise<ApiResponse<ISystemLog>> {
    return systemLogsAPI.logNotification(level, message, userId, options);
  }

  /**
   * Log security event
   */
  static async logSecurity(
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
    return systemLogsAPI.logSecurity(level, message, options);
  }

  // ============================================
  // 3. QUERY OPERATIONS
  // ============================================

  /**
   * Get logs by level
   */
  static async getByLevel(
    level: LogLevel,
    limit?: number
  ): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getByLevel(level, limit);
  }

  /**
   * Get logs by category
   */
  static async getByCategory(
    category: LogCategory,
    limit?: number
  ): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getByCategory(category, limit);
  }

  /**
   * Get logs by source
   */
  static async getBySource(
    source: LogSource,
    limit?: number
  ): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getBySource(source, limit);
  }

  /**
   * Get logs by user ID
   */
  static async getByUserId(
    userId: string,
    limit?: number
  ): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getByUserId(userId, limit);
  }

  /**
   * Get logs by league ID
   */
  static async getByLeagueId(
    leagueId: string,
    limit?: number
  ): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getByLeagueId(leagueId, limit);
  }

  /**
   * Get logs by match ID
   */
  static async getByMatchId(
    matchId: string,
    limit?: number
  ): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getByMatchId(matchId, limit);
  }

  /**
   * Get logs by time range
   */
  static async getByTimeRange(
    startTime: string,
    endTime: string,
    options?: {
      level?: LogLevel;
      category?: LogCategory;
      limit?: number;
    }
  ): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getByTimeRange(startTime, endTime, options);
  }

  /**
   * Get recent logs
   */
  static async getRecentLogs(limit: number = 50): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getRecentLogs(limit);
  }

  /**
   * Get critical and error logs
   */
  static async getCriticalAndErrorLogs(
    limit?: number
  ): Promise<ApiResponse<ISystemLog[]>> {
    return systemLogsAPI.getCriticalAndErrorLogs(limit);
  }

  /**
   * Get logs with advanced filters
   */
  static async getLogsFiltered(filters: {
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
    return systemLogsAPI.getLogsFiltered(filters);
  }

  // ============================================
  // 4. STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get log statistics
   */
  static async getLogStats(options?: {
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<LogCategory, number>;
    bySource: Record<LogSource, number>;
  }>> {
    return systemLogsAPI.getLogStats(options);
  }

  /**
   * Get error rate percentage
   */
  static async getErrorRate(options?: {
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    totalLogs: number;
    errorLogs: number;
    criticalLogs: number;
    errorRate: number;
    criticalRate: number;
  }>> {
    try {
      const statsResult = await this.getLogStats(options);

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
      const totalLogs = stats.total;
      const errorLogs = stats.byLevel.error;
      const criticalLogs = stats.byLevel.critical;

      const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0;
      const criticalRate = totalLogs > 0 ? (criticalLogs / totalLogs) * 100 : 0;

      return {
        success: true,
        data: {
          totalLogs,
          errorLogs,
          criticalLogs,
          errorRate,
          criticalRate,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_ERROR_RATE_ERROR',
          message: error.message || 'Hata oranı hesaplanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get most problematic categories
   */
  static async getMostProblematicCategories(
    limit: number = 5,
    options?: {
      startTime?: string;
      endTime?: string;
    }
  ): Promise<ApiResponse<Array<{
    category: LogCategory;
    errorCount: number;
    criticalCount: number;
    totalCount: number;
    percentage: number;
  }>>> {
    try {
      const statsResult = await this.getLogStats(options);

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

      // Get errors and criticals for each category
      const categoryProblems: Array<{
        category: LogCategory;
        errorCount: number;
        criticalCount: number;
        totalCount: number;
        percentage: number;
      }> = [];

      for (const [category, count] of Object.entries(stats.byCategory)) {
        // Get category-specific error/critical counts
        const categoryErrorsResult = await this.getLogsFiltered({
          category: category as LogCategory,
          level: 'error',
          startTime: options?.startTime,
          endTime: options?.endTime,
          limit: 1000,
        });

        const categoryCriticalsResult = await this.getLogsFiltered({
          category: category as LogCategory,
          level: 'critical',
          startTime: options?.startTime,
          endTime: options?.endTime,
          limit: 1000,
        });

        const errorCount = categoryErrorsResult.success 
          ? (categoryErrorsResult.data?.length || 0) 
          : 0;
        const criticalCount = categoryCriticalsResult.success 
          ? (categoryCriticalsResult.data?.length || 0) 
          : 0;

        const totalProblems = errorCount + criticalCount;

        if (totalProblems > 0) {
          categoryProblems.push({
            category: category as LogCategory,
            errorCount,
            criticalCount,
            totalCount: totalProblems,
            percentage: stats.total > 0 ? (totalProblems / stats.total) * 100 : 0,
          });
        }
      }

      // Sort by total problems and take top N
      categoryProblems.sort((a, b) => b.totalCount - a.totalCount);
      const topProblems = categoryProblems.slice(0, limit);

      return {
        success: true,
        data: topProblems,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_PROBLEMATIC_ERROR',
          message: error.message || 'Problemli kategoriler alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get system health summary
   */
  static async getSystemHealthSummary(options?: {
    startTime?: string;
    endTime?: string;
  }): Promise<ApiResponse<{
    status: 'healthy' | 'warning' | 'critical';
    totalLogs: number;
    errorRate: number;
    criticalRate: number;
    topIssues: Array<{ category: LogCategory; count: number }>;
    recentCritical: ISystemLog[];
  }>> {
    try {
      const statsResult = await this.getLogStats(options);

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
      const errorRateResult = await this.getErrorRate(options);

      if (!errorRateResult.success || !errorRateResult.data) {
        return {
          success: false,
          error: errorRateResult.error || {
            code: 'GET_ERROR_RATE_ERROR',
            message: 'Hata oranı alınamadı',
            statusCode: 500,
          },
        };
      }

      const errorRate = errorRateResult.data.errorRate;
      const criticalRate = errorRateResult.data.criticalRate;

      // Determine system status
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalRate > 5 || errorRate > 20) {
        status = 'critical';
      } else if (criticalRate > 1 || errorRate > 10) {
        status = 'warning';
      }

      // Get top issues by category
      const topIssues = Object.entries(stats.byCategory)
        .map(([category, count]) => ({
          category: category as LogCategory,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent critical logs
      const recentCriticalResult = await this.getByLevel('critical', 10);
      const recentCritical = recentCriticalResult.success 
        ? (recentCriticalResult.data || []) 
        : [];

      return {
        success: true,
        data: {
          status,
          totalLogs: stats.total,
          errorRate,
          criticalRate,
          topIssues,
          recentCritical,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_HEALTH_ERROR',
          message: error.message || 'Sistem sağlığı alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. CLEANUP OPERATIONS
  // ============================================

  /**
   * Delete old logs (data retention)
   */
  static async cleanupOldLogs(
    daysToKeep: number = 90
  ): Promise<ApiResponse<{
    deleted: number;
  }>> {
    try {
      ApiLogger.log('SystemLogsService', 'cleanupOldLogs', { daysToKeep });

      const result = await systemLogsAPI.cleanupOldLogs(daysToKeep);

      if (result.success) {
        ApiLogger.success('SystemLogsService', 'cleanupOldLogs', {
          deleted: result.data,
        });

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
          code: 'CLEANUP_ERROR',
          message: 'Eski loglar temizlenemedi',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      ApiLogger.error('SystemLogsService', 'cleanupOldLogs', error);
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: error.message || 'Temizlik yapılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete logs by level
   */
  static async deleteLogsByLevel(
    level: LogLevel
  ): Promise<ApiResponse<{
    deleted: number;
  }>> {
    try {
      ApiLogger.log('SystemLogsService', 'deleteLogsByLevel', { level });

      const result = await systemLogsAPI.deleteLogsByLevel(level);

      if (result.success) {
        ApiLogger.success('SystemLogsService', 'deleteLogsByLevel', {
          deleted: result.data,
        });

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
          message: 'Loglar silinemedi',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      ApiLogger.error('SystemLogsService', 'deleteLogsByLevel', error);
      return {
        success: false,
        error: {
          code: 'DELETE_ERROR',
          message: error.message || 'Loglar silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. HELPER METHODS
  // ============================================

  /**
   * Get log level display info
   */
  static getLogLevelDisplay(level: LogLevel): {
    label: string;
    icon: string;
    color: string;
  } {
    const levelMap: Record<LogLevel, { label: string; icon: string; color: string }> = {
      info: { label: 'Bilgi', icon: 'ℹ️', color: 'blue' },
      warning: { label: 'Uyarı', icon: '⚠️', color: 'yellow' },
      error: { label: 'Hata', icon: '❌', color: 'red' },
      critical: { label: 'Kritik', icon: '🚨', color: 'darkred' },
    };

    return levelMap[level];
  }

  /**
   * Get category display info
   */
  static getCategoryDisplay(category: LogCategory): {
    label: string;
    icon: string;
  } {
    const categoryMap: Record<LogCategory, { label: string; icon: string }> = {
      auth: { label: 'Kimlik Doğrulama', icon: '🔐' },
      match: { label: 'Maç', icon: '⚽' },
      payment: { label: 'Ödeme', icon: '💰' },
      notification: { label: 'Bildirim', icon: '🔔' },
      calculation: { label: 'Hesaplama', icon: '🧮' },
      integration: { label: 'Entegrasyon', icon: '🔌' },
      security: { label: 'Güvenlik', icon: '🛡️' },
    };

    return categoryMap[category];
  }

  /**
   * Format log for display
   */
  static formatLog(log: ISystemLog): {
    id?: string;
    level: ReturnType<typeof SystemLogsService.getLogLevelDisplay>;
    category: ReturnType<typeof SystemLogsService.getCategoryDisplay>;
    message: string;
    timestamp: string;
    age: string;
    source: string;
    hasError: boolean;
  } {
    return {
      id: log.id,
      level: this.getLogLevelDisplay(log.level),
      category: this.getCategoryDisplay(log.category),
      message: log.message,
      timestamp: log.timestamp!,
      age: this.getLogAge(log.timestamp!),
      source: log.source,
      hasError: !!log.details?.error,
    };
  }

  /**
   * Get log age (human-readable)
   */
  private static getLogAge(timestamp: string): string {
    const now = new Date();
    const logTime = new Date(timestamp);
    const diffMs = now.getTime() - logTime.getTime();
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
   * Export logs to JSON
   */
  static async exportLogs(filters: {
    level?: LogLevel;
    category?: LogCategory;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }): Promise<ApiResponse<string>> {
    try {
      const logsResult = await this.getLogsFiltered(filters);

      if (!logsResult.success || !logsResult.data) {
        return {
          success: false,
          error: logsResult.error || {
            code: 'EXPORT_ERROR',
            message: 'Loglar alınamadı',
            statusCode: 500,
          },
        };
      }

      const jsonString = JSON.stringify(logsResult.data, null, 2);

      return {
        success: true,
        data: jsonString,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: error.message || 'Loglar dışa aktarılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Group logs by date
   */
  static groupLogsByDate(logs: ISystemLog[]): Record<string, ISystemLog[]> {
    const groups: Record<string, ISystemLog[]> = {};

    for (const log of logs) {
      const date = new Date(log.timestamp!);
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

      groups[groupKey].push(log);
    }

    return groups;
  }
}

export default SystemLogsService;


/*
// ✅ Log info
await SystemLogsService.logInfo(
  'match',
  'Match created successfully',
  {
    details: { userId, matchId },
    source: 'web',
  }
);

// ✅ Log error with stack trace
try {
  // ... some operation
} catch (error) {
  await SystemLogsService.logError(
    'payment',
    'Payment processing failed',
    error,
    {
      details: { userId, matchId, amount: 100 },
      source: 'api',
      ipAddress: req.ip,
    }
  );
}

// ✅ Log critical issue
await SystemLogsService.logCritical(
  'security',
  'Unauthorized access attempt detected',
  error,
  {
    details: { userId, attemptedResource: '/admin' },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }
);

// ✅ Log authentication
await SystemLogsService.logAuth(
  'info',
  'User logged in successfully',
  userId,
  {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  }
);

// ✅ Get system health
const health = await SystemLogsService.getSystemHealthSummary({
  startTime: last24Hours,
  endTime: now,
});

if (health.data?.status === 'critical') {
  // Send alert to admin
  console.error('CRITICAL: System health is critical!');
  console.log('Error rate:', health.data.errorRate);
  console.log('Critical rate:', health.data.criticalRate);
}

// ✅ Get error rate
const errorRate = await SystemLogsService.getErrorRate({
  startTime: lastWeek,
  endTime: now,
});
console.log(`Error rate: ${errorRate.data?.errorRate.toFixed(2)}%`);

// ✅ Get most problematic categories
const problematic = await SystemLogsService.getMostProblematicCategories(5);
console.log('Top 5 problem areas:', problematic.data);

// ✅ Get recent critical logs
const criticals = await SystemLogsService.getCriticalAndErrorLogs(10);
for (const log of criticals.data || []) {
  console.error(`[${log.level}] ${log.category}: ${log.message}`);
}

// ✅ Advanced filtering
const matchErrors = await SystemLogsService.getLogsFiltered({
  category: 'match',
  level: 'error',
  matchId: matchId,
  startTime: matchStartTime,
  limit: 50,
});

// ✅ Export logs for analysis
const exported = await SystemLogsService.exportLogs({
  level: 'error',
  startTime: lastMonth,
  endTime: now,
});

if (exported.success) {
  // Save to file or send to external service
  fs.writeFileSync('error-logs.json', exported.data!);
}

// ✅ Cleanup old logs (GDPR compliance)
const cleanup = await SystemLogsService.cleanupOldLogs(90); // Keep 90 days
console.log(`Deleted ${cleanup.data?.deleted} old logs`);

// ✅ Format log for display
const logs = await SystemLogsService.getRecentLogs(20);
const formatted = logs.data?.map(log => 
  SystemLogsService.formatLog(log)
);
// Display in UI with colors, icons, etc.

// ✅ Group logs by date
const grouped = SystemLogsService.groupLogsByDate(logs.data || []);
// Display as: Bugün (5 logs), Dün (10 logs), 15 Mart 2025 (3 logs)


*/