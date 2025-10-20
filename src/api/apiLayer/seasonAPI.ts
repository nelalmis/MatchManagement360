// ============================================
// api/SeasonAPI.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { ISeason, SeasonStatus } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';

export class SeasonAPI extends BaseAPI<ISeason> {
  constructor() {
    super('seasons');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get seasons by league
   */
  async getByLeague(leagueId: string): Promise<ApiResponse<ISeason[]>> {
    return this.getAll({
      where: [{ field: 'leagueId', operator: '==', value: leagueId }],
      orderBy: [{ field: 'seasonNumber', direction: 'desc' }],
    });
  }

  /**
   * Get active season for a league
   */
  async getActiveSeason(leagueId: string): Promise<ApiResponse<ISeason | null>> {
    const result = await this.getAll({
      where: [
        { field: 'leagueId', operator: '==', value: leagueId },
        { field: 'status', operator: '==', value: SeasonStatus.ACTIVE },
      ],
      limit: 1,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: result.data[0],
    };
  }

  /**
   * Get seasons by status
   */
  async getByStatus(
    leagueId: string,
    status: SeasonStatus
  ): Promise<ApiResponse<ISeason[]>> {
    return this.getAll({
      where: [
        { field: 'leagueId', operator: '==', value: leagueId },
        { field: 'status', operator: '==', value: status },
      ],
      orderBy: [{ field: 'seasonNumber', direction: 'desc' }],
    });
  }

  /**
   * Get upcoming seasons
   */
  async getUpcomingSeasons(leagueId: string): Promise<ApiResponse<ISeason[]>> {
    return this.getByStatus(leagueId, SeasonStatus.UPCOMING);
  }

  /**
   * Get completed seasons
   */
  async getCompletedSeasons(leagueId: string): Promise<ApiResponse<ISeason[]>> {
    return this.getByStatus(leagueId, SeasonStatus.COMPLETED);
  }

  /**
   * Get archived seasons
   */
  async getArchivedSeasons(leagueId: string): Promise<ApiResponse<ISeason[]>> {
    return this.getByStatus(leagueId, SeasonStatus.ARCHIVED);
  }

  /**
   * Get latest season number for a league
   */
  async getLatestSeasonNumber(leagueId: string): Promise<ApiResponse<number>> {
    try {
      const result = await this.getAll({
        where: [{ field: 'leagueId', operator: '==', value: leagueId }],
        orderBy: [{ field: 'seasonNumber', direction: 'desc' }],
        limit: 1,
      });

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: true,
          data: 0,
        };
      }

      return {
        success: true,
        data: result.data[0].seasonNumber,
      };
    } catch (error: any) {
      ApiLogger.error('seasons', 'getLatestSeasonNumber', error);
      return {
        success: false,
        error: {
          code: 'GET_LATEST_NUMBER_ERROR',
          message: error.message || 'Failed to get latest season number',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get season by number
   */
  async getBySeasonNumber(
    leagueId: string,
    seasonNumber: number
  ): Promise<ApiResponse<ISeason | null>> {
    const result = await this.getAll({
      where: [
        { field: 'leagueId', operator: '==', value: leagueId },
        { field: 'seasonNumber', operator: '==', value: seasonNumber },
      ],
      limit: 1,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return {
        success: true,
        data: null,
      };
    }

    return {
      success: true,
      data: result.data[0],
    };
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  /**
   * Update season status
   */
  async updateStatus(
    seasonId: string,
    status: SeasonStatus
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('seasons', 'updateStatus', { seasonId, status });

      const updateData: Partial<ISeason> = {
        status,
      };

      // Add timestamps based on status
      if (status === SeasonStatus.COMPLETED) {
        updateData.completedAt = new Date().toISOString();
      } else if (status === SeasonStatus.ARCHIVED) {
        updateData.archivedAt = new Date().toISOString();
      }

      const result = await this.update(seasonId, updateData as Partial<Omit<ISeason, 'id'>>);

      ApiLogger.success('seasons', 'updateStatus', { seasonId, status });

      return result;
    } catch (error: any) {
      ApiLogger.error('seasons', 'updateStatus', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_STATUS_ERROR',
          message: error.message || 'Failed to update season status',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Start season (set to active)
   */
  async startSeason(seasonId: string): Promise<ApiResponse<ISeason>> {
    return this.updateStatus(seasonId, SeasonStatus.ACTIVE);
  }

  /**
   * Complete season
   */
  async completeSeason(seasonId: string): Promise<ApiResponse<ISeason>> {
    return this.updateStatus(seasonId, SeasonStatus.COMPLETED);
  }

  /**
   * Archive season
   */
  async archiveSeason(seasonId: string): Promise<ApiResponse<ISeason>> {
    return this.updateStatus(seasonId, SeasonStatus.ARCHIVED);
  }

  // ============================================
  // SUMMARY MANAGEMENT
  // ============================================

  /**
   * Update season summary
   */
  async updateSummary(
    seasonId: string,
    summary: Partial<ISeason['summary']>
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('seasons', 'updateSummary', { seasonId, summary });

      const seasonResult = await this.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'NOT_FOUND',
            message: 'Season not found',
            statusCode: 404,
          },
        };
      }

      const updatedSummary = {
        ...seasonResult.data.summary,
        ...summary,
      };

      const result = await this.update(seasonId, {
        summary: updatedSummary,
      } as Partial<Omit<ISeason, 'id'>>);

      ApiLogger.success('seasons', 'updateSummary', { seasonId });

      return result;
    } catch (error: any) {
      ApiLogger.error('seasons', 'updateSummary', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SUMMARY_ERROR',
          message: error.message || 'Failed to update season summary',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update top scorer
   */
  async updateTopScorer(
    seasonId: string,
    topScorer: {
      playerId: string;
      playerName: string;
      goals: number;
    }
  ): Promise<ApiResponse<ISeason>> {
    return this.updateSummary(seasonId, {
      topScorer,
    });
  }

  /**
   * Update season MVP
   */
  async updateMVP(
    seasonId: string,
    mvp: {
      playerId: string;
      playerName: string;
      rating: number;
      mvpCount: number;
    }
  ): Promise<ApiResponse<ISeason>> {
    return this.updateSummary(seasonId, {
      mvp,
    });
  }

  /**
   * Increment total matches
   */
  async incrementTotalMatches(seasonId: string, count: number = 1): Promise<ApiResponse<ISeason>> {
    try {
      const seasonResult = await this.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return seasonResult;
      }

      const currentTotal = seasonResult.data.summary?.totalMatches || 0;

      return this.updateSummary(seasonId, {
        totalMatches: currentTotal + count,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_MATCHES_ERROR',
          message: error.message || 'Failed to increment total matches',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Increment total goals
   */
  async incrementTotalGoals(seasonId: string, count: number = 1): Promise<ApiResponse<ISeason>> {
    try {
      const seasonResult = await this.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return seasonResult;
      }

      const currentTotal = seasonResult.data.summary?.totalGoals || 0;

      return this.updateSummary(seasonId, {
        totalGoals: currentTotal + count,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_GOALS_ERROR',
          message: error.message || 'Failed to increment total goals',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STANDINGS MANAGEMENT
  // ============================================

  /**
   * Link standings to season
   */
  async linkStandings(seasonId: string, standingsId: string): Promise<ApiResponse<ISeason>> {
    return this.update(seasonId, {
      standingsId,
    } as Partial<Omit<ISeason, 'id'>>);
  }

  // ============================================
  // SETTINGS MANAGEMENT
  // ============================================

  /**
   * Update season settings
   */
  async updateSettings(
    seasonId: string,
    settings: Partial<ISeason['settings']>
  ): Promise<ApiResponse<ISeason>> {
    try {
      const seasonResult = await this.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'NOT_FOUND',
            message: 'Season not found',
            statusCode: 404,
          },
        };
      }

      const updatedSettings = {
        ...seasonResult.data.settings,
        ...settings,
      };

      return this.update(seasonId, {
        settings: updatedSettings,
      } as Partial<Omit<ISeason, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SETTINGS_ERROR',
          message: error.message || 'Failed to update season settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // DATE MANAGEMENT
  // ============================================

  /**
   * Update season dates
   */
  async updateDates(
    seasonId: string,
    dates: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ApiResponse<ISeason>> {
    return this.update(seasonId, dates as Partial<Omit<ISeason, 'id'>>);
  }

  /**
   * Extend season end date
   */
  async extendSeason(seasonId: string, newEndDate: string): Promise<ApiResponse<ISeason>> {
    return this.updateDates(seasonId, { endDate: newEndDate });
  }

  // ============================================
  // VALIDATION & HELPERS
  // ============================================

  /**
   * Check if season is active
   */
  async isActive(seasonId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getById(seasonId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'NOT_FOUND',
            message: 'Season not found',
            statusCode: 404,
          },
        };
      }

      return {
        success: true,
        data: result.data.status === SeasonStatus.ACTIVE,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_ACTIVE_ERROR',
          message: error.message || 'Failed to check if season is active',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if season can be started
   */
  async canStart(seasonId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getById(seasonId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'NOT_FOUND',
            message: 'Season not found',
            statusCode: 404,
          },
        };
      }

      const canStart = result.data.status === SeasonStatus.UPCOMING;

      return {
        success: true,
        data: canStart,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_CAN_START_ERROR',
          message: error.message || 'Failed to check if season can start',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if season can be completed
   */
  async canComplete(seasonId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getById(seasonId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'NOT_FOUND',
            message: 'Season not found',
            statusCode: 404,
          },
        };
      }

      const canComplete = result.data.status === SeasonStatus.ACTIVE;

      return {
        success: true,
        data: canComplete,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_CAN_COMPLETE_ERROR',
          message: error.message || 'Failed to check if season can be completed',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Archive old seasons (older than specified months)
   */
  async archiveOldSeasons(
    leagueId: string,
    monthsOld: number = 12
  ): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('seasons', 'archiveOldSeasons', { leagueId, monthsOld });

      const completedSeasons = await this.getCompletedSeasons(leagueId);

      if (!completedSeasons.success || !completedSeasons.data) {
        return {
          success: false,
          error: completedSeasons.error || {
            code: 'GET_SEASONS_ERROR',
            message: 'Failed to get completed seasons',
          },
        };
      }

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

      const seasonsToArchive = completedSeasons.data.filter((season) => {
        if (!season.completedAt) return false;
        const completedDate = new Date(season.completedAt);
        return completedDate < cutoffDate;
      });

      // Archive each season
      for (const season of seasonsToArchive) {
        if (season.id) {
          await this.archiveSeason(season.id);
        }
      }

      ApiLogger.success('seasons', 'archiveOldSeasons', {
        count: seasonsToArchive.length,
      });

      return {
        success: true,
        data: seasonsToArchive.length,
      };
    } catch (error: any) {
      ApiLogger.error('seasons', 'archiveOldSeasons', error);
      return {
        success: false,
        error: {
          code: 'ARCHIVE_OLD_SEASONS_ERROR',
          message: error.message || 'Failed to archive old seasons',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
 * Get season statistics
 */
async getStatistics(seasonId: string): Promise<ApiResponse<{
  totalMatches: number;
  totalGoals: number;
  averageGoalsPerMatch: number;
  topScorer?: {
    playerId: string;
    playerName: string;
    goals: number;
  };
  mvp?: {
    playerId: string;
    playerName: string;
    rating: number;
    mvpCount: number;
  };
}>> {
  try {
    const result = await this.getById(seasonId);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || {
          code: 'NOT_FOUND',
          message: 'Season not found',
          statusCode: 404,
        },
      };
    }

    const summary = result.data.summary;
    const totalMatches = summary?.totalMatches || 0;
    const totalGoals = summary?.totalGoals || 0;
    const averageGoalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;

    return {
      success: true,
      data: {
        totalMatches,
        totalGoals,
        averageGoalsPerMatch,
        topScorer: summary?.topScorer,
        mvp: summary?.mvp,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'GET_STATISTICS_ERROR',
        message: error.message || 'Failed to get season statistics',
        details: error,
        statusCode: 500,
      },
    };
  }
}
}

// Export singleton instance
export const seasonAPI = new SeasonAPI();