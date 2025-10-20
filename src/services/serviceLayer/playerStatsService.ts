// ============================================
// services/PlayerStatsService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { playerStatsAPI } from '../../api/apiLayer/playerStatsAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { seasonAPI } from '../../api/apiLayer/seasonAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IPlayerStats } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class PlayerStatsService {
  // ============================================
  // 1. QUERY & READ OPERATIONS
  // ============================================

  /**
   * Get player stats by ID
   */
  static async getPlayerStats(statsId: string): Promise<ApiResponse<IPlayerStats>> {
    return playerStatsAPI.getById(statsId);
  }

  /**
   * Get player stats for specific season
   */
  static async getPlayerSeasonStats(
    playerId: string,
    leagueId: string,
    seasonId: string
  ): Promise<ApiResponse<IPlayerStats | null>> {
    return playerStatsAPI.getByPlayerLeagueSeason(playerId, leagueId, seasonId);
  }

  /**
   * Get all stats for a player (all seasons)
   */
  static async getAllPlayerStats(playerId: string): Promise<ApiResponse<IPlayerStats[]>> {
    return playerStatsAPI.getByPlayer(playerId);
  }

  /**
   * Get all stats for a season
   */
  static async getSeasonStats(seasonId: string): Promise<ApiResponse<IPlayerStats[]>> {
    return playerStatsAPI.getBySeason(seasonId);
  }

  /**
   * Get all stats for a league
   */
  static async getLeagueStats(leagueId: string): Promise<ApiResponse<IPlayerStats[]>> {
    return playerStatsAPI.getByLeague(leagueId);
  }

  /**
   * Get player career stats (aggregated)
   */
  static async getCareerStats(playerId: string): Promise<ApiResponse<{
    league: IPlayerStats['league'];
    friendly: IPlayerStats['friendly'];
    total: IPlayerStats['total'];
    rating: IPlayerStats['rating'];
    mvp: IPlayerStats['mvp'];
    attendance: IPlayerStats['attendance'];
    totalSeasons: number;
    bestSeason?: {
      seasonId: string;
      seasonName: string;
      goals: number;
      rating: number;
    };
  }>> {
    try {
      ApiLogger.log('PlayerStatsService', 'getCareerStats', { playerId });

      const careerResult = await playerStatsAPI.getCareerStats(playerId);

      if (!careerResult.success || !careerResult.data) {
        return {
          success: false,
          error: careerResult.error || {
            code: 'GET_CAREER_ERROR',
            message: 'Kariyer istatistikleri alınamadı',
            statusCode: 500,
          },
        };
      }

      // Get all seasons for best season calculation
      const allStatsResult = await playerStatsAPI.getByPlayer(playerId);
      const allStats = allStatsResult.success && allStatsResult.data ? allStatsResult.data : [];

      let bestSeason: any = undefined;

      if (allStats.length > 0) {
        // Find best season by goals
        const sorted = [...allStats].sort((a, b) => b.league.goals - a.league.goals);
        const best = sorted[0];

        if (best && best.league.goals > 0) {
          const seasonResult = await seasonAPI.getById(best.seasonId);
          bestSeason = {
            seasonId: best.seasonId,
            seasonName: seasonResult.success && seasonResult.data
              ? seasonResult.data.name
              : 'Unknown Season',
            goals: best.league.goals,
            rating: best.rating.average,
          };
        }
      }

      return {
        success: true,
        data: {
          ...careerResult.data,
          totalSeasons: allStats.length,
          bestSeason,
        },
      };
    } catch (error: any) {
      ApiLogger.error('PlayerStatsService', 'getCareerStats', error);
      return {
        success: false,
        error: {
          code: 'GET_CAREER_ERROR',
          message: error.message || 'Kariyer istatistikleri alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 2. LEADERBOARDS
  // ============================================

  /**
   * Get top scorers for a season
   */
  static async getTopScorers(
    seasonId: string,
    limit: number = 10
  ): Promise<ApiResponse<IPlayerStats[]>> {
    return playerStatsAPI.getTopScorers(seasonId, limit);
  }

  /**
   * Get top assists for a season
   */
  static async getTopAssists(
    seasonId: string,
    limit: number = 10
  ): Promise<ApiResponse<IPlayerStats[]>> {
    return playerStatsAPI.getTopAssists(seasonId, limit);
  }

  /**
   * Get top rated players for a season
   */
  static async getTopRatings(
    seasonId: string,
    limit: number = 10
  ): Promise<ApiResponse<IPlayerStats[]>> {
    return playerStatsAPI.getTopRatings(seasonId, limit);
  }

  /**
   * Get most MVPs for a season
   */
  static async getMostMVPs(
    seasonId: string,
    limit: number = 10
  ): Promise<ApiResponse<IPlayerStats[]>> {
    return playerStatsAPI.getMostMVPs(seasonId, limit);
  }

  /**
   * Get best win rate for a season
   */
  static async getBestWinRate(
    seasonId: string,
    minMatches: number = 5,
    limit: number = 10
  ): Promise<ApiResponse<IPlayerStats[]>> {
    return playerStatsAPI.getBestWinRate(seasonId, minMatches, limit);
  }

  /**
   * Get comprehensive leaderboards
   */
  static async getLeaderboards(
    seasonId: string,
    limit: number = 10
  ): Promise<ApiResponse<{
    topScorers: IPlayerStats[];
    topAssists: IPlayerStats[];
    topRatings: IPlayerStats[];
    mostMVPs: IPlayerStats[];
    bestWinRate: IPlayerStats[];
  }>> {
    try {
      ApiLogger.log('PlayerStatsService', 'getLeaderboards', { seasonId });

      const [scorers, assists, ratings, mvps, winRate] = await Promise.all([
        playerStatsAPI.getTopScorers(seasonId, limit),
        playerStatsAPI.getTopAssists(seasonId, limit),
        playerStatsAPI.getTopRatings(seasonId, limit),
        playerStatsAPI.getMostMVPs(seasonId, limit),
        playerStatsAPI.getBestWinRate(seasonId, 5, limit),
      ]);

      return {
        success: true,
        data: {
          topScorers: scorers.success && scorers.data ? scorers.data : [],
          topAssists: assists.success && assists.data ? assists.data : [],
          topRatings: ratings.success && ratings.data ? ratings.data : [],
          mostMVPs: mvps.success && mvps.data ? mvps.data : [],
          bestWinRate: winRate.success && winRate.data ? winRate.data : [],
        },
      };
    } catch (error: any) {
      ApiLogger.error('PlayerStatsService', 'getLeaderboards', error);
      return {
        success: false,
        error: {
          code: 'GET_LEADERBOARDS_ERROR',
          message: error.message || 'Liderlik tabloları alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. PLAYER COMPARISON
  // ============================================

  /**
   * Compare two players in the same season
   */
  static async comparePlayers(
    player1Id: string,
    player2Id: string,
    leagueId: string,
    seasonId: string
  ): Promise<ApiResponse<{
    player1: IPlayerStats | null;
    player2: IPlayerStats | null;
    comparison: {
      goalsDiff: number;
      assistsDiff: number;
      pointsDiff: number;
      ratingDiff: number;
      mvpDiff: number;
      winRateDiff: number;
      betterPlayer: string; // 'player1' | 'player2' | 'tied'
    };
  }>> {
    try {
      ApiLogger.log('PlayerStatsService', 'comparePlayers', {
        player1Id,
        player2Id,
        seasonId,
      });

      const [stats1Result, stats2Result] = await Promise.all([
        playerStatsAPI.getByPlayerLeagueSeason(player1Id, leagueId, seasonId),
        playerStatsAPI.getByPlayerLeagueSeason(player2Id, leagueId, seasonId),
      ]);

      const player1 = stats1Result.success ? stats1Result.data : null;
      const player2 = stats2Result.success ? stats2Result.data : null;

      if (!player1 || !player2) {
        return {
          success: false,
          error: {
            code: 'STATS_NOT_FOUND',
            message: 'Oyunculardan biri veya her ikisi için istatistik bulunamadı',
            statusCode: 404,
          },
        };
      }

      const goalsDiff = player1.league.goals - player2.league.goals;
      const assistsDiff = player1.league.assists - player2.league.assists;
      const pointsDiff = player1.league.points - player2.league.points;
      const ratingDiff = player1.rating.average - player2.rating.average;
      const mvpDiff = player1.mvp.count - player2.mvp.count;
      const winRateDiff = player1.league.winRate - player2.league.winRate;

      // Calculate overall score (weighted)
      const player1Score =
        player1.league.goals * 2 +
        player1.league.assists * 1 +
        player1.league.points * 0.5 +
        player1.rating.average * 3 +
        player1.mvp.count * 5;

      const player2Score =
        player2.league.goals * 2 +
        player2.league.assists * 1 +
        player2.league.points * 0.5 +
        player2.rating.average * 3 +
        player2.mvp.count * 5;

      let betterPlayer: string;
      if (Math.abs(player1Score - player2Score) < 1) {
        betterPlayer = 'tied';
      } else {
        betterPlayer = player1Score > player2Score ? 'player1' : 'player2';
      }

      return {
        success: true,
        data: {
          player1,
          player2,
          comparison: {
            goalsDiff,
            assistsDiff,
            pointsDiff,
            ratingDiff,
            mvpDiff,
            winRateDiff,
            betterPlayer,
          },
        },
      };
    } catch (error: any) {
      ApiLogger.error('PlayerStatsService', 'comparePlayers', error);
      return {
        success: false,
        error: {
          code: 'COMPARE_ERROR',
          message: error.message || 'Oyuncular karşılaştırılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. PERFORMANCE ANALYSIS
  // ============================================

  /**
   * Get player performance analysis
   */
  static async getPerformanceAnalysis(
    playerId: string,
    leagueId: string,
    seasonId: string
  ): Promise<ApiResponse<{
    stats: IPlayerStats;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    percentiles: {
      goals: number;
      assists: number;
      rating: number;
      winRate: number;
    };
  }>> {
    try {
      ApiLogger.log('PlayerStatsService', 'getPerformanceAnalysis', {
        playerId,
        seasonId,
      });

      // Get player stats
      const statsResult = await playerStatsAPI.getByPlayerLeagueSeason(
        playerId,
        leagueId,
        seasonId
      );

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: statsResult.error || {
            code: 'STATS_NOT_FOUND',
            message: 'Oyuncu istatistikleri bulunamadı',
            statusCode: 404,
          },
        };
      }

      const stats = statsResult.data;

      // Get all season stats for percentile calculation
      const allStatsResult = await playerStatsAPI.getBySeason(seasonId);
      const allStats = allStatsResult.success && allStatsResult.data ? allStatsResult.data : [];

      // Calculate percentiles
      const goalPercentile = this.calculatePercentile(
        stats.league.goals,
        allStats.map(s => s.league.goals)
      );
      const assistPercentile = this.calculatePercentile(
        stats.league.assists,
        allStats.map(s => s.league.assists)
      );
      const ratingPercentile = this.calculatePercentile(
        stats.rating.average,
        allStats.map(s => s.rating.average)
      );
      const winRatePercentile = this.calculatePercentile(
        stats.league.winRate,
        allStats.map(s => s.league.winRate)
      );

      // Analyze strengths and weaknesses
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const recommendations: string[] = [];

      if (goalPercentile >= 75) {
        strengths.push('Mükemmel gol skoru - takımın en iyi golcülerinden biri');
      } else if (goalPercentile < 25) {
        weaknesses.push('Gol sayısı düşük');
        recommendations.push('Daha fazla şut çekmeyi ve pozisyon almayı deneyin');
      }

      if (assistPercentile >= 75) {
        strengths.push('Harika asist yeteneği - takım oyunu güçlü');
      } else if (assistPercentile < 25) {
        weaknesses.push('Asist sayısı düşük');
        recommendations.push('Takım arkadaşlarınızla daha fazla iletişim kurun');
      }

      if (ratingPercentile >= 75) {
        strengths.push('Yüksek performans değerlendirmesi');
      } else if (ratingPercentile < 25) {
        weaknesses.push('Genel performans ortalamanın altında');
        recommendations.push('Maçlara daha konsantre katılmayı deneyin');
      }

      if (winRatePercentile >= 75) {
        strengths.push('Yüksek kazanma oranı - takıma değerli katkı');
      } else if (winRatePercentile < 25) {
        weaknesses.push('Düşük kazanma oranı');
      }

      if (stats.rating.trend === 'improving') {
        strengths.push('Performansınız sürekli gelişiyor');
      } else if (stats.rating.trend === 'declining') {
        weaknesses.push('Son performans düşüşte');
        recommendations.push('Dinlenmeye ve motivasyona dikkat edin');
      }

      if (stats.mvp.rate >= 20) {
        strengths.push('Sık sık MVP seçiliyorsunuz');
      }

      if (stats.attendance.rate < 80) {
        weaknesses.push('Katılım oranı düşük');
        recommendations.push('Maçlara daha düzenli katılmaya çalışın');
      }

      if (strengths.length === 0) {
        strengths.push('Kararlı performans gösteriyorsunuz');
      }

      if (recommendations.length === 0) {
        recommendations.push('Harika gidiyorsunuz! Böyle devam edin.');
      }

      return {
        success: true,
        data: {
          stats,
          strengths,
          weaknesses,
          recommendations,
          percentiles: {
            goals: goalPercentile,
            assists: assistPercentile,
            rating: ratingPercentile,
            winRate: winRatePercentile,
          },
        },
      };
    } catch (error: any) {
      ApiLogger.error('PlayerStatsService', 'getPerformanceAnalysis', error);
      return {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: error.message || 'Performans analizi yapılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get player trends over time
   */
  static async getPlayerTrends(
    playerId: string,
    leagueId: string,
    lastNSeasons: number = 5
  ): Promise<ApiResponse<{
    seasons: Array<{
      seasonId: string;
      seasonName: string;
      goals: number;
      assists: number;
      rating: number;
      mvpCount: number;
      winRate: number;
    }>;
    trends: {
      goals: 'improving' | 'stable' | 'declining';
      rating: 'improving' | 'stable' | 'declining';
    };
  }>> {
    try {
      ApiLogger.log('PlayerStatsService', 'getPlayerTrends', {
        playerId,
        leagueId,
      });

      // Get all player stats for this league
      const allStatsResult = await playerStatsAPI.getByPlayer(playerId);
      const allStats = allStatsResult.success && allStatsResult.data
        ? allStatsResult.data.filter(s => s.leagueId === leagueId)
        : [];

      // Get recent seasons
      const recentStats = allStats.slice(0, lastNSeasons);

      const seasons: Array<{
        seasonId: string;
        seasonName: string;
        goals: number;
        assists: number;
        rating: number;
        mvpCount: number;
        winRate: number;
      }> = [];

      for (const stat of recentStats) {
        const seasonResult = await seasonAPI.getById(stat.seasonId);
        const seasonName = seasonResult.success && seasonResult.data
          ? seasonResult.data.name
          : 'Unknown Season';

        seasons.push({
          seasonId: stat.seasonId,
          seasonName,
          goals: stat.league.goals,
          assists: stat.league.assists,
          rating: stat.rating.average,
          mvpCount: stat.mvp.count,
          winRate: stat.league.winRate,
        });
      }

      // Calculate trends
      let goalsTrend: 'improving' | 'stable' | 'declining' = 'stable';
      let ratingTrend: 'improving' | 'stable' | 'declining' = 'stable';

      if (seasons.length >= 3) {
        // Goals trend
        const recentGoals = seasons.slice(0, 2).reduce((sum, s) => sum + s.goals, 0) / 2;
        const olderGoals = seasons.slice(2).reduce((sum, s) => sum + s.goals, 0) / (seasons.length - 2);
        
        if (recentGoals > olderGoals * 1.2) {
          goalsTrend = 'improving';
        } else if (recentGoals < olderGoals * 0.8) {
          goalsTrend = 'declining';
        }

        // Rating trend
        const recentRating = seasons.slice(0, 2).reduce((sum, s) => sum + s.rating, 0) / 2;
        const olderRating = seasons.slice(2).reduce((sum, s) => sum + s.rating, 0) / (seasons.length - 2);
        
        if (recentRating > olderRating + 0.3) {
          ratingTrend = 'improving';
        } else if (recentRating < olderRating - 0.3) {
          ratingTrend = 'declining';
        }
      }

      return {
        success: true,
        data: {
          seasons,
          trends: {
            goals: goalsTrend,
            rating: ratingTrend,
          },
        },
      };
    } catch (error: any) {
      ApiLogger.error('PlayerStatsService', 'getPlayerTrends', error);
      return {
        success: false,
        error: {
          code: 'GET_TRENDS_ERROR',
          message: error.message || 'Trendler alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. POSITION ANALYSIS
  // ============================================

  /**
   * Get player's best position
   */
  static async getBestPosition(
    playerId: string,
    leagueId: string,
    seasonId: string
  ): Promise<ApiResponse<{
    bestPosition: string | null;
    positionStats: Record<string, {
      matches: number;
      goals: number;
      assists: number;
      rating: number;
      performance: 'excellent' | 'good' | 'average' | 'poor';
    }>;
  }>> {
    try {
      const statsResult = await playerStatsAPI.getByPlayerLeagueSeason(
        playerId,
        leagueId,
        seasonId
      );

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: statsResult.error || {
            code: 'STATS_NOT_FOUND',
            message: 'Oyuncu istatistikleri bulunamadı',
            statusCode: 404,
          },
        };
      }

      const stats = statsResult.data;
      const positions = stats.positions || {};

      // Analyze each position
      const positionStats: Record<string, {
        matches: number;
        goals: number;
        assists: number;
        rating: number;
        performance: 'excellent' | 'good' | 'average' | 'poor';
      }> = {};

      let bestPosition: string | null = null;
      let bestScore = 0;

      for (const [position, data] of Object.entries(positions)) {
        // Calculate performance score
        const score =
          data.rating * 10 +
          data.goals * 2 +
          data.assists * 1;

        let performance: 'excellent' | 'good' | 'average' | 'poor';
        if (data.rating >= 4.5) performance = 'excellent';
        else if (data.rating >= 4.0) performance = 'good';
        else if (data.rating >= 3.5) performance = 'average';
        else performance = 'poor';

        positionStats[position] = {
          matches: data.matches,
          goals: data.goals,
          assists: data.assists,
          rating: data.rating,
          performance,
        };

        if (score > bestScore && data.matches >= 3) {
          bestScore = score;
          bestPosition = position;
        }
      }

      return {
        success: true,
        data: {
          bestPosition,
          positionStats,
        },
      };
    } catch (error: any) {
      ApiLogger.error('PlayerStatsService', 'getBestPosition', error);
      return {
        success: false,
        error: {
          code: 'POSITION_ANALYSIS_ERROR',
          message: error.message || 'Pozisyon analizi yapılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. ADMIN OPERATIONS
  // ============================================

  /**
   * Reset season stats (admin only)
   */
  static async resetSeasonStats(
    seasonId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('PlayerStatsService', 'resetSeasonStats', {
        seasonId,
        userId,
      });

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
            message: 'İstatistikleri sıfırlama yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      const result = await playerStatsAPI.resetSeasonStats(seasonId);

      if (result.success) {
        ApiLogger.success('PlayerStatsService', 'resetSeasonStats', {
          seasonId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerStatsService', 'resetSeasonStats', error);
      return {
        success: false,
        error: {
          code: 'RESET_STATS_ERROR',
          message: error.message || 'İstatistikler sıfırlanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Recalculate player stats from matches
   */
  static async recalculatePlayerStats(
    playerId: string,
    leagueId: string,
    seasonId: string,
    userId: string
  ): Promise<ApiResponse<IPlayerStats>> {
    try {
      ApiLogger.log('PlayerStatsService', 'recalculatePlayerStats', {
        playerId,
        seasonId,
        userId,
      });

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'İstatistikleri yeniden hesaplama yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Delete existing stats
      const existingStats = await playerStatsAPI.getByPlayerLeagueSeason(
        playerId,
        leagueId,
        seasonId
      );

      if (existingStats.success && existingStats.data && existingStats.data.id) {
        await playerStatsAPI.delete(existingStats.data.id);
      }

      // Get all matches for this player in this season
      const matchesResult = await matchAPI.getBySeason(seasonId);
      const matches = matchesResult.success && matchesResult.data
        ? matchesResult.data.filter(m =>
            m.status === 'completed' &&
            m.players.teams &&
            (m.players.teams.team1.some(p => p.playerId === playerId) ||
             m.players.teams.team2.some(p => p.playerId === playerId))
          )
        : [];

      // Recalculate from each match
      for (const match of matches) {
        // This would be done by MatchService normally
        // For now, just inform that recalculation is needed
        ApiLogger.log('PlayerStatsService', 'recalculatePlayerStats', {
          matchId: match.id,
          note: 'Match stats would be recalculated here',
        });
      }

      // Get updated stats
      const result = await playerStatsAPI.getByPlayerLeagueSeason(
        playerId,
        leagueId,
        seasonId
      );

      if (result.success && result.data) {
        ApiLogger.success('PlayerStatsService', 'recalculatePlayerStats', {
          playerId,
          seasonId,
          matchesProcessed: matches.length,
        });

        return {
          success: true,
          data: result.data,
        };
      }

      return {
        success: false,
        error: {
          code: 'RECALCULATE_ERROR',
          message: 'İstatistikler yeniden hesaplanamadı',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      ApiLogger.error('PlayerStatsService', 'recalculatePlayerStats', error);
      return {
        success: false,
        error: {
          code: 'RECALCULATE_ERROR',
          message: error.message || 'İstatistikler yeniden hesaplanırken hata oluştu',
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
   * Calculate percentile for a value in a dataset
   */
  private static calculatePercentile(value: number, dataset: number[]): number {
    if (dataset.length === 0) return 0;

    const sorted = [...dataset].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);

    if (index === -1) return 100;
    if (index === 0) return 0;

    return (index / sorted.length) * 100;
  }

  /**
   * Format rating trend for display
   */
  static formatRatingTrend(trend: 'improving' | 'stable' | 'declining'): string {
    switch (trend) {
      case 'improving':
        return '📈 Yükseliyor';
      case 'declining':
        return '📉 Düşüyor';
      case 'stable':
        return '➡️ Stabil';
    }
  }

  /**
   * Calculate performance grade
   */
  static calculatePerformanceGrade(rating: number): {
    grade: string;
    description: string;
  } {
    if (rating >= 4.5) {
      return { grade: 'A+', description: 'Mükemmel' };
    } else if (rating >= 4.0) {
      return { grade: 'A', description: 'Harika' };
    } else if (rating >= 3.5) {
      return { grade: 'B', description: 'İyi' };
    } else if (rating >= 3.0) {
      return { grade: 'C', description: 'Orta' };
    } else if (rating >= 2.5) {
      return { grade: 'D', description: 'Zayıf' };
    } else {
      return { grade: 'F', description: 'Çok Zayıf' };
    }
  }
}

export default PlayerStatsService;