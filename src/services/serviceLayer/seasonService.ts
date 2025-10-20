// ============================================
// services/SeasonService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { seasonAPI } from '../../api/apiLayer/seasonAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { standingsAPI } from '../../api/apiLayer/standingsAPI';
import { playerStatsAPI } from '../../api/apiLayer/playerStatsAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { ISeason, SeasonStatus, IStandings } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class SeasonService {
  // ============================================
  // 1. SEASON CREATION
  // ============================================

  /**
   * Create new season
   */
  static async createSeason(data: {
    leagueId: string;
    creatorId: string;
    name: string;
    seasonNumber?: number;
    startDate?: Date;
    durationDays?: number;
    settings?: Partial<ISeason['settings']>;
    autoActivate?: boolean; // Default: true
  }): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('SeasonService', 'createSeason', {
        leagueId: data.leagueId,
        name: data.name,
      });

      // Validate league exists
      const leagueResult = await leagueAPI.getById(data.leagueId);

      if (!leagueResult.success || !leagueResult.data) {
        return {
          success: false,
          error: leagueResult.error || {
            code: 'LEAGUE_NOT_FOUND',
            message: 'Lig bulunamadı',
            statusCode: 404,
          },
        };
      }

      const league = leagueResult.data;

      // Check if user is admin
      const isAdminCheck = await leagueAPI.isAdmin(data.leagueId, data.creatorId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sezon oluşturma yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Calculate season number if not provided
      let seasonNumber = data.seasonNumber;
      if (!seasonNumber) {
        const seasonsResult = await seasonAPI.getByLeague(data.leagueId);
        seasonNumber = seasonsResult.success && seasonsResult.data
          ? seasonsResult.data.length + 1
          : 1;
      }

      // Calculate dates
      const startDate = data.startDate || new Date();
      const durationDays = data.durationDays || league.seasonSettings.seasonDuration || 365;
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + durationDays);

      // Prepare settings with defaults
      const settings: ISeason['settings'] = {
        pointsForWin: data.settings?.pointsForWin ?? 3,
        pointsForDraw: data.settings?.pointsForDraw ?? 1,
        pointsForLoss: data.settings?.pointsForLoss ?? 0,
      };

      // Validate settings
      if (settings.pointsForWin < 0 || settings.pointsForDraw < 0 || settings.pointsForLoss < 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_SETTINGS',
            message: 'Puan değerleri negatif olamaz',
            statusCode: 400,
          },
        };
      }

      // Determine initial status
      const now = new Date();
      let status: SeasonStatus;
      if (startDate > now) {
        status = SeasonStatus.UPCOMING;
      } else if (endDate < now) {
        status = SeasonStatus.COMPLETED;
      } else {
        status = data.autoActivate !== false ? SeasonStatus.ACTIVE : SeasonStatus.UPCOMING;
      }

      // Create season data
      const seasonData: Omit<ISeason, 'id'> = {
        leagueId: data.leagueId,
        name: data.name.trim(),
        seasonNumber,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status,
        settings,
        createdAt: new Date().toISOString(),
      };

      // Create season
      const result = await seasonAPI.create(seasonData);

      if (result.success && result.data) {
        // Create standings for this season
        const standingsResult = await standingsAPI.create({
          leagueId: data.leagueId,
          seasonId: result.data.id!,
          standings: [],
          lastUpdated: new Date().toISOString(),
        });

        if (standingsResult.success && standingsResult.data) {
          // Link standings to season
          await seasonAPI.update(result.data.id!, {
            standingsId: standingsResult.data.id,
          } as Partial<Omit<ISeason, 'id'>>);
        }

        // Update league cache if this is active season
        if (status === 'active') {
          await leagueAPI.update(data.leagueId, {
            currentSeasonId: result.data.id,
            totalSeasons: (league.totalSeasons || 0) + 1,
          } as Partial<Omit<import('../../types/entity/types').ILeague, 'id'>>);
        }

        ApiLogger.success('SeasonService', 'createSeason', {
          seasonId: result.data.id,
          status,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'createSeason', error);
      return {
        success: false,
        error: {
          code: 'CREATE_SEASON_ERROR',
          message: error.message || 'Sezon oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 2. SEASON UPDATES
  // ============================================

  /**
   * Update season basic info
   */
  static async updateBasicInfo(
    seasonId: string,
    userId: string,
    updates: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('SeasonService', 'updateBasicInfo', { seasonId, userId });

      // Get season to check league
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(season.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Bu sezonu düzenleme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Cannot update completed or archived seasons
      if (season.status === 'completed' || season.status === 'archived') {
        return {
          success: false,
          error: {
            code: 'SEASON_LOCKED',
            message: 'Tamamlanmış veya arşivlenmiş sezon düzenlenemez',
            statusCode: 400,
          },
        };
      }

      const updateData: Partial<Omit<ISeason, 'id'>> = {};

      if (updates.name) {
        updateData.name = updates.name.trim();
      }

      if (updates.startDate) {
        updateData.startDate = updates.startDate.toISOString();
      }

      if (updates.endDate) {
        updateData.endDate = updates.endDate.toISOString();
      }

      // Validate dates if both provided
      if (updateData.startDate && updateData.endDate) {
        const start = new Date(updateData.startDate);
        const end = new Date(updateData.endDate);

        if (end <= start) {
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

      const result = await seasonAPI.update(seasonId, updateData);

      if (result.success) {
        ApiLogger.success('SeasonService', 'updateBasicInfo', { seasonId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'updateBasicInfo', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_INFO_ERROR',
          message: error.message || 'Bilgiler güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update season settings
   */
  static async updateSettings(
    seasonId: string,
    userId: string,
    settings: Partial<ISeason['settings']>
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('SeasonService', 'updateSettings', { seasonId, userId });

      // Get season to check league
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(season.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Bu sezonu düzenleme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Cannot update completed or archived seasons
      if (season.status === 'completed' || season.status === 'archived') {
        return {
          success: false,
          error: {
            code: 'SEASON_LOCKED',
            message: 'Tamamlanmış veya arşivlenmiş sezon ayarları değiştirilemez',
            statusCode: 400,
          },
        };
      }

      const currentSettings = season.settings;
      const newSettings = {
        ...currentSettings,
        ...settings,
      };

      // Validate settings
      if (newSettings.pointsForWin < 0 || newSettings.pointsForDraw < 0 || newSettings.pointsForLoss < 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_SETTINGS',
            message: 'Puan değerleri negatif olamaz',
            statusCode: 400,
          },
        };
      }

      const result = await seasonAPI.update(seasonId, {
        settings: newSettings,
      } as Partial<Omit<ISeason, 'id'>>);

      if (result.success) {
        ApiLogger.success('SeasonService', 'updateSettings', { seasonId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'updateSettings', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SETTINGS_ERROR',
          message: error.message || 'Ayarlar güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. SEASON STATUS MANAGEMENT
  // ============================================

  /**
   * Start season (upcoming → active)
   */
  static async startSeason(
    seasonId: string,
    userId: string
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('SeasonService', 'startSeason', { seasonId, userId });

      // Get season
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(season.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sezon başlatma yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Can only start upcoming seasons
      if (season.status !== 'upcoming') {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Sadece yaklaşan sezonlar başlatılabilir. Mevcut durum: ${season.status}`,
            statusCode: 400,
          },
        };
      }

      // Deactivate current active season if exists
      const leagueResult = await leagueAPI.getById(season.leagueId);
      if (leagueResult.success && leagueResult.data?.currentSeasonId) {
        const currentSeasonId = leagueResult.data.currentSeasonId;
        if (currentSeasonId !== seasonId) {
          await seasonAPI.update(currentSeasonId, {
            status: 'completed',
            completedAt: new Date().toISOString(),
          } as Partial<Omit<ISeason, 'id'>>);
        }
      }

      // Start season
      const result = await seasonAPI.update(seasonId, {
        status: 'active',
        startDate: new Date().toISOString(), // Update start date to now
      } as Partial<Omit<ISeason, 'id'>>);

      if (result.success) {
        // Set as current season in league
        await leagueAPI.update(season.leagueId, {
          currentSeasonId: seasonId,
        } as Partial<Omit<import('../../types/entity/types').ILeague, 'id'>>);

        ApiLogger.success('SeasonService', 'startSeason', { seasonId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'startSeason', error);
      return {
        success: false,
        error: {
          code: 'START_SEASON_ERROR',
          message: error.message || 'Sezon başlatılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Complete season (active → completed)
   */
  static async completeSeason(
    seasonId: string,
    userId: string,
    autoCalculateSummary: boolean = true
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('SeasonService', 'completeSeason', { seasonId, userId });

      // Get season
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(season.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sezon tamamlama yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Can only complete active seasons
      if (season.status !== 'active') {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Sadece aktif sezonlar tamamlanabilir. Mevcut durum: ${season.status}`,
            statusCode: 400,
          },
        };
      }

      let summary: ISeason['summary'] | undefined;

      // Calculate summary if requested
      if (autoCalculateSummary) {
        const summaryResult = await this.calculateSeasonSummary(seasonId);
        if (summaryResult.success && summaryResult.data) {
          summary = summaryResult.data;
        }
      }

      // Complete season
      const result = await seasonAPI.update(seasonId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        summary,
      } as Partial<Omit<ISeason, 'id'>>);

      if (result.success) {
        // Clear as current season in league
        const leagueResult = await leagueAPI.getById(season.leagueId);
        if (leagueResult.success && leagueResult.data?.currentSeasonId === seasonId) {
          await leagueAPI.update(season.leagueId, {
            currentSeasonId: undefined,
          } as Partial<Omit<import('../../types/entity/types').ILeague, 'id'>>);
        }

        ApiLogger.success('SeasonService', 'completeSeason', { seasonId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'completeSeason', error);
      return {
        success: false,
        error: {
          code: 'COMPLETE_SEASON_ERROR',
          message: error.message || 'Sezon tamamlanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Archive season (completed → archived)
   */
  static async archiveSeason(
    seasonId: string,
    userId: string
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('SeasonService', 'archiveSeason', { seasonId, userId });

      // Get season
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(season.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sezon arşivleme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Can only archive completed seasons
      if (season.status !== 'completed') {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Sadece tamamlanmış sezonlar arşivlenebilir. Mevcut durum: ${season.status}`,
            statusCode: 400,
          },
        };
      }

      // Archive season
      const result = await seasonAPI.update(seasonId, {
        status: 'archived',
        archivedAt: new Date().toISOString(),
      } as Partial<Omit<ISeason, 'id'>>);

      if (result.success) {
        ApiLogger.success('SeasonService', 'archiveSeason', { seasonId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'archiveSeason', error);
      return {
        success: false,
        error: {
          code: 'ARCHIVE_SEASON_ERROR',
          message: error.message || 'Sezon arşivlenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Unarchive season (archived → completed)
   */
  static async unarchiveSeason(
    seasonId: string,
    userId: string
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('SeasonService', 'unarchiveSeason', { seasonId, userId });

      // Get season
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(season.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sezon arşivden çıkarma yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Can only unarchive archived seasons
      if (season.status !== 'archived') {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Sadece arşivlenmiş sezonlar arşivden çıkarılabilir. Mevcut durum: ${season.status}`,
            statusCode: 400,
          },
        };
      }

      // Unarchive season
      const result = await seasonAPI.update(seasonId, {
        status: 'completed',
        archivedAt: undefined,
      } as Partial<Omit<ISeason, 'id'>>);

      if (result.success) {
        ApiLogger.success('SeasonService', 'unarchiveSeason', { seasonId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'unarchiveSeason', error);
      return {
        success: false,
        error: {
          code: 'UNARCHIVE_SEASON_ERROR',
          message: error.message || 'Sezon arşivden çıkarılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. SEASON SUMMARY & STATISTICS
  // ============================================

  /**
   * Calculate season summary
   */
  static async calculateSeasonSummary(
    seasonId: string
  ): Promise<ApiResponse<ISeason['summary']>> {
    try {
      ApiLogger.log('SeasonService', 'calculateSeasonSummary', { seasonId });

      // Get season
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Get all matches for this season
      const matchesResult = await matchAPI.getBySeason(seasonId);
      const matches = matchesResult.success && matchesResult.data
        ? matchesResult.data.filter(m => m.status === 'completed')
        : [];

      const totalMatches = matches.length;
      let totalGoals = 0;

      // Calculate total goals
      for (const match of matches) {
        if (match.score) {
          totalGoals += match.score.team1 + match.score.team2;
        }
      }

      // Get standings to find top scorer
      let topScorer: {
        playerId: string;
        playerName: string;
        goals: number;
      } | undefined;

      if (season.standingsId) {
        const standingsResult = await standingsAPI.getById(season.standingsId);

        if (standingsResult.success && standingsResult.data) {
          const standings = standingsResult.data.standings || [];

          if (standings.length > 0) {
            // Sort by goals to find top scorer
            const sorted = [...standings].sort((a, b) => b.league.goals - a.league.goals);

            if (sorted[0] && sorted[0].league.goals > 0) {
              topScorer = {
                playerId: sorted[0].playerId,
                playerName: sorted[0].playerName,
                goals: sorted[0].league.goals,
              };
            }
          }
        }
      }

      // Calculate MVP (most MVP awards)
      let mvp: {
        playerId: string;
        playerName: string;
        rating: number;
        mvpCount: number;
      } | undefined;

      if (season.standingsId) {
        const standingsResult = await standingsAPI.getById(season.standingsId);

        if (standingsResult.success && standingsResult.data) {
          const standings = standingsResult.data.standings || [];

          if (standings.length > 0) {
            // Sort by MVP count and average rating
            const sorted = [...standings]
              .filter(s => s.performance.mvpCount > 0)
              .sort((a, b) => {
                if (b.performance.mvpCount !== a.performance.mvpCount) {
                  return b.performance.mvpCount - a.performance.mvpCount;
                }
                return b.performance.rating - a.performance.rating;
              });

            if (sorted[0]) {
              mvp = {
                playerId: sorted[0].playerId,
                playerName: sorted[0].playerName,
                rating: sorted[0].performance.rating,
                mvpCount: sorted[0].performance.mvpCount,
              };
            }
          }
        }
      }

      const summary: ISeason['summary'] = {
        totalMatches,
        totalGoals,
        topScorer,
        mvp,
      };

      ApiLogger.success('SeasonService', 'calculateSeasonSummary', {
        seasonId,
        totalMatches,
        totalGoals,
      });

      return {
        success: true,
        data: summary,
      };
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'calculateSeasonSummary', error);
      return {
        success: false,
        error: {
          code: 'CALCULATE_SUMMARY_ERROR',
          message: error.message || 'Özet hesaplanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Recalculate and update season summary
   */
  static async updateSeasonSummary(
    seasonId: string,
    userId: string
  ): Promise<ApiResponse<ISeason>> {
    try {
      ApiLogger.log('SeasonService', 'updateSeasonSummary', { seasonId, userId });

      // Get season
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(season.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Özet güncelleme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Calculate new summary
      const summaryResult = await this.calculateSeasonSummary(seasonId);

      if (!summaryResult.success || !summaryResult.data) {
        return {
          success: false,
          error: summaryResult.error || {
            code: 'CALCULATE_ERROR',
            message: 'Özet hesaplanamadı',
            statusCode: 500,
          },
        };
      }

      // Update season with new summary
      const result = await seasonAPI.update(seasonId, {
        summary: summaryResult.data,
      } as Partial<Omit<ISeason, 'id'>>);

      if (result.success) {
        ApiLogger.success('SeasonService', 'updateSeasonSummary', { seasonId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'updateSeasonSummary', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SUMMARY_ERROR',
          message: error.message || 'Özet güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get season statistics
   */
  static async getSeasonStatistics(seasonId: string): Promise<ApiResponse<{
    totalMatches: number;
    completedMatches: number;
    upcomingMatches: number;
    totalGoals: number;
    averageGoalsPerMatch: number;
    totalPlayers: number;
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
      // Get season
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Get matches
      const matchesResult = await matchAPI.getBySeason(seasonId);
      const matches = matchesResult.success && matchesResult.data ? matchesResult.data : [];

      const totalMatches = matches.length;
      const completedMatches = matches.filter(m => m.status === 'completed').length;
      const upcomingMatches = matches.filter(m =>
        m.status !== 'completed' && m.status !== 'cancelled'
      ).length;

      // Calculate total goals
      let totalGoals = 0;
      for (const match of matches) {
        if (match.status === 'completed' && match.score) {
          totalGoals += match.score.team1 + match.score.team2;
        }
      }

      const averageGoalsPerMatch = completedMatches > 0 ? totalGoals / completedMatches : 0;

      // Get standings for player count and top performers
      let totalPlayers = 0;
      let topScorer: any = undefined;
      let mvp: any = undefined;

      if (season.standingsId) {
        const standingsResult = await standingsAPI.getById(season.standingsId);

        if (standingsResult.success && standingsResult.data) {
          const standings = standingsResult.data.standings || [];
          totalPlayers = standings.length;

          // Top scorer
          if (standings.length > 0) {
            const sortedByGoals = [...standings].sort((a, b) => b.league.goals - a.league.goals);
            if (sortedByGoals[0] && sortedByGoals[0].league.goals > 0) {
              topScorer = {
                playerId: sortedByGoals[0].playerId,
                playerName: sortedByGoals[0].playerName,
                goals: sortedByGoals[0].league.goals,
              };
            }

            // MVP
            const sortedByMVP = [...standings]
              .filter(s => s.performance.mvpCount > 0)
              .sort((a, b) => {
                if (b.performance.mvpCount !== a.performance.mvpCount) {
                  return b.performance.mvpCount - a.performance.mvpCount;
                }
                return b.performance.rating - a.performance.rating;
              });

            if (sortedByMVP[0]) {
              mvp = {
                playerId: sortedByMVP[0].playerId,
                playerName: sortedByMVP[0].playerName,
                rating: sortedByMVP[0].performance.rating,
                mvpCount: sortedByMVP[0].performance.mvpCount,
              };
            }
          }
        }
      }

      return {
        success: true,
        data: {
          totalMatches,
          completedMatches,
          upcomingMatches,
          totalGoals,
          averageGoalsPerMatch,
          totalPlayers,
          topScorer,
          mvp,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATISTICS_ERROR',
          message: error.message || 'İstatistikler alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. AUTO ARCHIVING
  // ============================================

  /**
   * Auto-archive old completed seasons (batch operation)
   */
  static async autoArchiveOldSeasons(
    leagueId: string,
    monthsOld: number = 12
  ): Promise<ApiResponse<{
    archived: number;
    skipped: number;
  }>> {
    try {
      ApiLogger.log('SeasonService', 'autoArchiveOldSeasons', {
        leagueId,
        monthsOld,
      });

      // Get all completed seasons for league
      const seasonsResult = await seasonAPI.getByLeague(leagueId);

      if (!seasonsResult.success || !seasonsResult.data) {
        return {
          success: false,
          error: seasonsResult.error || {
            code: 'GET_SEASONS_ERROR',
            message: 'Sezonlar alınamadı',
            statusCode: 500,
          },
        };
      }

      const seasons = seasonsResult.data.filter(s => s.status === 'completed');

      // Calculate cutoff date
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

      let archivedCount = 0;
      let skippedCount = 0;

      for (const season of seasons) {
        const completedDate = season.completedAt ? new Date(season.completedAt) : null;

        if (completedDate && completedDate < cutoffDate) {
          // Archive this season
          const archiveResult = await seasonAPI.update(season.id!, {
            status: 'archived',
            archivedAt: new Date().toISOString(),
          } as Partial<Omit<ISeason, 'id'>>);

          if (archiveResult.success) {
            archivedCount++;
          } else {
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      ApiLogger.success('SeasonService', 'autoArchiveOldSeasons', {
        leagueId,
        archived: archivedCount,
        skipped: skippedCount,
      });

      return {
        success: true,
        data: {
          archived: archivedCount,
          skipped: skippedCount,
        },
      };
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'autoArchiveOldSeasons', error);
      return {
        success: false,
        error: {
          code: 'AUTO_ARCHIVE_ERROR',
          message: error.message || 'Otomatik arşivleme sırasında hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. QUERY & READ OPERATIONS
  // ============================================

  static async getSeason(seasonId: string): Promise<ApiResponse<ISeason>> {
    return seasonAPI.getById(seasonId);
  }

  static async getLeagueSeasons(leagueId: string): Promise<ApiResponse<ISeason[]>> {
    return seasonAPI.getByLeague(leagueId);
  }

  static async getActiveSeason(leagueId: string): Promise<ApiResponse<ISeason | null>> {
    return seasonAPI.getActiveSeason(leagueId);
  }

  static async getCompletedSeasons(leagueId: string): Promise<ApiResponse<ISeason[]>> {
    return seasonAPI.getCompletedSeasons(leagueId);
  }

  static async getArchivedSeasons(leagueId: string): Promise<ApiResponse<ISeason[]>> {
    return seasonAPI.getArchivedSeasons(leagueId);
  }

  /**
   * Get season with full details
   */
  static async getSeasonDetails(seasonId: string): Promise<ApiResponse<{
    season: ISeason;
    standings?: IStandings;
    totalMatches: number;
    completedMatches: number;
    totalPlayers: number;
  }>> {
    try {
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Get standings
      let standings: IStandings | undefined;
      if (season.standingsId) {
        const standingsResult = await standingsAPI.getById(season.standingsId);
        if (standingsResult.success && standingsResult.data) {
          standings = standingsResult.data;
        }
      }

      // Get matches
      const matchesResult = await matchAPI.getBySeason(seasonId);
      const matches = matchesResult.success && matchesResult.data ? matchesResult.data : [];

      const totalMatches = matches.length;
      const completedMatches = matches.filter(m => m.status === 'completed').length;

      const totalPlayers = standings?.standings?.length || 0;

      return {
        success: true,
        data: {
          season,
          standings,
          totalMatches,
          completedMatches,
          totalPlayers,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_DETAILS_ERROR',
          message: error.message || 'Sezon detayları alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 7. DELETE OPERATIONS
  // ============================================

  /**
   * Delete season (only if no matches exist)
   */
  static async deleteSeason(
    seasonId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('SeasonService', 'deleteSeason', { seasonId, userId });

      // Get season
      const seasonResult = await seasonAPI.getById(seasonId);

      if (!seasonResult.success || !seasonResult.data) {
        return {
          success: false,
          error: seasonResult.error || {
            code: 'SEASON_NOT_FOUND',
            message: 'Sezon bulunamadı',
            statusCode: 404,
          },
        };
      }

      const season = seasonResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(season.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sezon silme yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Cannot delete active season
      if (season.status === 'active') {
        return {
          success: false,
          error: {
            code: 'SEASON_ACTIVE',
            message: 'Aktif sezon silinemez',
            statusCode: 400,
          },
        };
      }

      // Check if there are any matches
      const matchesResult = await matchAPI.getBySeason(seasonId);
      if (matchesResult.success && matchesResult.data && matchesResult.data.length > 0) {
        return {
          success: false,
          error: {
            code: 'HAS_MATCHES',
            message: 'Maçları olan sezon silinemez',
            statusCode: 400,
          },
        };
      }

      // Delete standings if exists
      if (season.standingsId) {
        await standingsAPI.delete(season.standingsId);
      }

      const result = await seasonAPI.delete(seasonId);

      if (result.success) {
        // Update league cache
        const leagueResult = await leagueAPI.getById(season.leagueId);
        if (leagueResult.success && leagueResult.data) {
          await leagueAPI.update(season.leagueId, {
            totalSeasons: Math.max(0, (leagueResult.data.totalSeasons || 0) - 1),
          } as Partial<Omit<import('../../types/entity/types').ILeague, 'id'>>);
        }

        ApiLogger.success('SeasonService', 'deleteSeason', { seasonId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('SeasonService', 'deleteSeason', error);
      return {
        success: false,
        error: {
          code: 'DELETE_SEASON_ERROR',
          message: error.message || 'Sezon silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

export default SeasonService;