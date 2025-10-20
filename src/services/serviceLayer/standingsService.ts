// ============================================
// services/StandingsService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { standingsAPI } from '../../api/apiLayer/standingsAPI';
import { seasonAPI } from '../../api/apiLayer/seasonAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { playerStatsAPI } from '../../api/apiLayer/playerStatsAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IStandings, ISeason } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class StandingsService {
  // ============================================
  // 1. QUERY & READ OPERATIONS
  // ============================================

  /**
   * Get standings by ID
   */
  static async getStandings(standingsId: string): Promise<ApiResponse<IStandings>> {
    return standingsAPI.getById(standingsId);
  }

  /**
   * Get standings by season
   */
  static async getSeasonStandings(seasonId: string): Promise<ApiResponse<IStandings | null>> {
    return standingsAPI.getBySeason(seasonId);
  }

  /**
   * Get standings by league (all seasons)
   */
  static async getLeagueStandings(leagueId: string): Promise<ApiResponse<IStandings[]>> {
    return standingsAPI.getByLeague(leagueId);
  }

  /**
   * Get player position in standings
   */
  static async getPlayerPosition(
    standingsId: string,
    playerId: string
  ): Promise<ApiResponse<{
    entry: IStandings['standings'][0] | null;
    rank: number | null;
    totalPlayers: number;
  }>> {
    return standingsAPI.getPlayerPosition(standingsId, playerId);
  }

  /**
   * Get top players by points
   */
  static async getTopPlayers(
    standingsId: string,
    limit: number = 10
  ): Promise<ApiResponse<IStandings['standings']>> {
    return standingsAPI.getTopPlayers(standingsId, limit);
  }

  /**
   * Get top scorers
   */
  static async getTopScorers(
    standingsId: string,
    limit: number = 10
  ): Promise<ApiResponse<IStandings['standings']>> {
    return standingsAPI.getTopScorers(standingsId, limit);
  }

  /**
   * Get top rated players
   */
  static async getTopRatings(
    standingsId: string,
    limit: number = 10
  ): Promise<ApiResponse<IStandings['standings']>> {
    return standingsAPI.getTopRatings(standingsId, limit);
  }

  /**
   * Get standings with detailed statistics
   */
  static async getStandingsWithStats(standingsId: string): Promise<ApiResponse<{
    standings: IStandings;
    totalPlayers: number;
    totalMatches: number;
    totalGoals: number;
    averageGoalsPerMatch: number;
    topScorer: IStandings['standings'][0] | null;
    mvp: IStandings['standings'][0] | null;
  }>> {
    try {
      const standingsResult = await standingsAPI.getById(standingsId);

      if (!standingsResult.success || !standingsResult.data) {
        return {
          success: false,
          error: standingsResult.error || {
            code: 'STANDINGS_NOT_FOUND',
            message: 'Puan durumu bulunamadı',
            statusCode: 404,
          },
        };
      }

      const standings = standingsResult.data;
      const entries = standings.standings || [];

      const totalPlayers = entries.length;

      // Calculate total matches (sum of all played)
      const totalMatches = entries.reduce((sum, e) => sum + e.league.played, 0);

      // Calculate total goals
      const totalGoals = entries.reduce((sum, e) => sum + e.league.goals, 0);

      // Average goals per match
      const averageGoalsPerMatch = totalMatches > 0 ? totalGoals / totalMatches : 0;

      // Find top scorer
      let topScorer: IStandings['standings'][0] | null = null;
      if (entries.length > 0) {
        const sorted = [...entries].sort((a, b) => b.league.goals - a.league.goals);
        if (sorted[0] && sorted[0].league.goals > 0) {
          topScorer = sorted[0];
        }
      }

      // Find MVP (most MVP awards)
      let mvp: IStandings['standings'][0] | null = null;
      if (entries.length > 0) {
        const sorted = [...entries]
          .filter(e => e.performance.mvpCount > 0)
          .sort((a, b) => {
            if (b.performance.mvpCount !== a.performance.mvpCount) {
              return b.performance.mvpCount - a.performance.mvpCount;
            }
            return b.performance.rating - a.performance.rating;
          });
        if (sorted[0]) {
          mvp = sorted[0];
        }
      }

      return {
        success: true,
        data: {
          standings,
          totalPlayers,
          totalMatches,
          totalGoals,
          averageGoalsPerMatch,
          topScorer,
          mvp,
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
  // 2. STANDINGS UPDATES
  // ============================================

  /**
   * Update single player standing
   */
  static async updatePlayerStanding(
    standingsId: string,
    playerId: string,
    updates: {
      league?: Partial<IStandings['standings'][0]['league']>;
      friendly?: Partial<IStandings['standings'][0]['friendly']>;
      performance?: Partial<IStandings['standings'][0]['performance']>;
    }
  ): Promise<ApiResponse<IStandings>> {
    try {
      ApiLogger.log('StandingsService', 'updatePlayerStanding', {
        standingsId,
        playerId,
      });

      // Get player name for cache
      const playerResult = await playerAPI.getById(playerId);
      const playerName = playerResult.success && playerResult.data
        ? `${playerResult.data.name} ${playerResult.data.surname}`
        : 'Unknown Player';

      const result = await standingsAPI.updatePlayerStanding(
        standingsId,
        playerId,
        playerName,
        updates
      );

      if (result.success) {
        ApiLogger.success('StandingsService', 'updatePlayerStanding', {
          standingsId,
          playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('StandingsService', 'updatePlayerStanding', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_STANDING_ERROR',
          message: error.message || 'Puan durumu güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Recalculate standings from scratch
   */
  static async recalculateStandings(
    standingsId: string,
    userId: string
  ): Promise<ApiResponse<IStandings>> {
    try {
      ApiLogger.log('StandingsService', 'recalculateStandings', {
        standingsId,
        userId,
      });

      // Get standings to check season and league
      const standingsResult = await standingsAPI.getById(standingsId);

      if (!standingsResult.success || !standingsResult.data) {
        return {
          success: false,
          error: standingsResult.error || {
            code: 'STANDINGS_NOT_FOUND',
            message: 'Puan durumu bulunamadı',
            statusCode: 404,
          },
        };
      }

      const standings = standingsResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(standings.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Puan durumu yeniden hesaplama yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      // Reset standings
      await standingsAPI.resetStandings(standingsId);

      // Get all completed matches for this season
      const matchesResult = await matchAPI.getBySeason(standings.seasonId);
      const matches = matchesResult.success && matchesResult.data
        ? matchesResult.data.filter(m => m.status === 'completed')
        : [];

      // Get season settings for points calculation
      const seasonResult = await seasonAPI.getById(standings.seasonId);
      const pointsForWin = seasonResult.success && seasonResult.data
        ? seasonResult.data.settings.pointsForWin
        : 3;
      const pointsForDraw = seasonResult.success && seasonResult.data
        ? seasonResult.data.settings.pointsForDraw
        : 1;

      // Process each match
      for (const match of matches) {
        if (!match.score || !match.players.teams) continue;

        const team1Won = match.score.team1 > match.score.team2;
        const team2Won = match.score.team2 > match.score.team1;
        const drawn = match.score.team1 === match.score.team2;

        const team1Points = team1Won ? pointsForWin : (drawn ? pointsForDraw : 0);
        const team2Points = team2Won ? pointsForWin : (drawn ? pointsForDraw : 0);

        // Get player names
        const allPlayerIds = [
          ...match.players.teams.team1.map(p => p.playerId),
          ...match.players.teams.team2.map(p => p.playerId),
        ];
        const playerNames = await this.getPlayerNames(allPlayerIds);

        // Prepare updates
        const matchUpdates: Array<{
          playerId: string;
          playerName: string;
          won: boolean;
          drawn: boolean;
          lost: boolean;
          goals: number;
          goalsAgainst: number;
          assists: number;
          points: number;
          form: 'W' | 'D' | 'L';
          rating?: number;
          isMVP?: boolean;
        }> = [];

        // Team 1 players
        for (const player of match.players.teams.team1) {
          const scorer = match.score.scorers?.find(s => s.playerId === player.playerId);
          matchUpdates.push({
            playerId: player.playerId,
            playerName: playerNames[player.playerId] || 'Unknown',
            won: team1Won,
            drawn,
            lost: team2Won,
            goals: scorer?.goals || 0,
            goalsAgainst: match.score.team2,
            assists: scorer?.assists || 0,
            points: team1Points,
            form: team1Won ? 'W' : (drawn ? 'D' : 'L'),
            isMVP: match.mvp?.playerId === player.playerId,
          });
        }

        // Team 2 players
        for (const player of match.players.teams.team2) {
          const scorer = match.score.scorers?.find(s => s.playerId === player.playerId);
          matchUpdates.push({
            playerId: player.playerId,
            playerName: playerNames[player.playerId] || 'Unknown',
            won: team2Won,
            drawn,
            lost: team1Won,
            goals: scorer?.goals || 0,
            goalsAgainst: match.score.team1,
            assists: scorer?.assists || 0,
            points: team2Points,
            form: team2Won ? 'W' : (drawn ? 'D' : 'L'),
            isMVP: match.mvp?.playerId === player.playerId,
          });
        }

        // Update standings with this match
        await standingsAPI.updateAfterLeagueMatch(standingsId, matchUpdates);
      }

      // Get updated standings
      const result = await standingsAPI.getById(standingsId);

      if (result.success) {
        ApiLogger.success('StandingsService', 'recalculateStandings', {
          standingsId,
          matchesProcessed: matches.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('StandingsService', 'recalculateStandings', error);
      return {
        success: false,
        error: {
          code: 'RECALCULATE_ERROR',
          message: error.message || 'Puan durumu yeniden hesaplanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reset standings (clear all data)
   */
  static async resetStandings(
    standingsId: string,
    userId: string
  ): Promise<ApiResponse<IStandings>> {
    try {
      ApiLogger.log('StandingsService', 'resetStandings', {
        standingsId,
        userId,
      });

      // Get standings to check league
      const standingsResult = await standingsAPI.getById(standingsId);

      if (!standingsResult.success || !standingsResult.data) {
        return {
          success: false,
          error: standingsResult.error || {
            code: 'STANDINGS_NOT_FOUND',
            message: 'Puan durumu bulunamadı',
            statusCode: 404,
          },
        };
      }

      const standings = standingsResult.data;

      // Check if user is league admin
      const isAdminCheck = await leagueAPI.isAdmin(standings.leagueId, userId);
      if (!isAdminCheck.success || !isAdminCheck.data) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Puan durumu sıfırlama yetkiniz yok',
            statusCode: 403,
          },
        };
      }

      const result = await standingsAPI.resetStandings(standingsId);

      if (result.success) {
        ApiLogger.success('StandingsService', 'resetStandings', {
          standingsId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('StandingsService', 'resetStandings', error);
      return {
        success: false,
        error: {
          code: 'RESET_STANDINGS_ERROR',
          message: error.message || 'Puan durumu sıfırlanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. COMPARISON & ANALYSIS
  // ============================================

  /**
   * Compare two players in standings
   */
  static async comparePlayers(
    standingsId: string,
    player1Id: string,
    player2Id: string
  ): Promise<ApiResponse<{
    player1: IStandings['standings'][0] | null;
    player2: IStandings['standings'][0] | null;
    comparison: {
      pointsDiff: number;
      goalsDiff: number;
      ratingDiff: number;
      mvpDiff: number;
      formDiff: string;
    };
  }>> {
    try {
      const standingsResult = await standingsAPI.getById(standingsId);

      if (!standingsResult.success || !standingsResult.data) {
        return {
          success: false,
          error: standingsResult.error || {
            code: 'STANDINGS_NOT_FOUND',
            message: 'Puan durumu bulunamadı',
            statusCode: 404,
          },
        };
      }

      const entries = standingsResult.data.standings || [];

      const player1 = entries.find(e => e.playerId === player1Id) || null;
      const player2 = entries.find(e => e.playerId === player2Id) || null;

      if (!player1 || !player2) {
        return {
          success: false,
          error: {
            code: 'PLAYER_NOT_FOUND',
            message: 'Oyunculardan biri veya her ikisi puan durumunda bulunamadı',
            statusCode: 404,
          },
        };
      }

      const comparison = {
        pointsDiff: player1.league.points - player2.league.points,
        goalsDiff: player1.league.goals - player2.league.goals,
        ratingDiff: player1.performance.rating - player2.performance.rating,
        mvpDiff: player1.performance.mvpCount - player2.performance.mvpCount,
        formDiff: `${player1.performance.form} vs ${player2.performance.form}`,
      };

      return {
        success: true,
        data: {
          player1,
          player2,
          comparison,
        },
      };
    } catch (error: any) {
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

  /**
   * Get standings trends (historical comparison)
   */
  static async getStandingsTrends(
    leagueId: string,
    playerId: string,
    lastNSeasons: number = 3
  ): Promise<ApiResponse<{
    seasons: Array<{
      seasonId: string;
      seasonName: string;
      rank: number | null;
      points: number;
      goals: number;
      rating: number;
    }>;
  }>> {
    try {
      // Get all standings for the league
      const standingsListResult = await standingsAPI.getByLeague(leagueId);

      if (!standingsListResult.success || !standingsListResult.data) {
        return {
          success: false,
          error: standingsListResult.error || {
            code: 'STANDINGS_NOT_FOUND',
            message: 'Puan durumları bulunamadı',
            statusCode: 404,
          },
        };
      }

      const allStandings = standingsListResult.data;

      // Get last N seasons
      const recentStandings = allStandings.slice(0, lastNSeasons);

      const trends: Array<{
        seasonId: string;
        seasonName: string;
        rank: number | null;
        points: number;
        goals: number;
        rating: number;
      }> = [];

      for (const standings of recentStandings) {
        const entries = standings.standings || [];
        const playerIndex = entries.findIndex(e => e.playerId === playerId);
        const playerEntry = playerIndex >= 0 ? entries[playerIndex] : null;

        // Get season name
        const seasonResult = await seasonAPI.getById(standings.seasonId);
        const seasonName = seasonResult.success && seasonResult.data
          ? seasonResult.data.name
          : 'Unknown Season';

        trends.push({
          seasonId: standings.seasonId,
          seasonName,
          rank: playerIndex >= 0 ? playerIndex + 1 : null,
          points: playerEntry?.league.points || 0,
          goals: playerEntry?.league.goals || 0,
          rating: playerEntry?.performance.rating || 0,
        });
      }

      return {
        success: true,
        data: {
          seasons: trends,
        },
      };
    } catch (error: any) {
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
  // 4. EXPORT & REPORTING
  // ============================================

  /**
   * Get standings summary for reporting
   */
  static async getStandingsSummary(
    standingsId: string
  ): Promise<ApiResponse<{
    totalPlayers: number;
    totalMatches: number;
    totalGoals: number;
    champion: IStandings['standings'][0] | null;
    topScorer: IStandings['standings'][0] | null;
    mvp: IStandings['standings'][0] | null;
    averageRating: number;
    top3: IStandings['standings'];
    bottom3: IStandings['standings'];
  }>> {
    try {
      const standingsResult = await standingsAPI.getById(standingsId);

      if (!standingsResult.success || !standingsResult.data) {
        return {
          success: false,
          error: standingsResult.error || {
            code: 'STANDINGS_NOT_FOUND',
            message: 'Puan durumu bulunamadı',
            statusCode: 404,
          },
        };
      }

      const entries = standingsResult.data.standings || [];

      const totalPlayers = entries.length;
      const totalMatches = entries.reduce((sum, e) => sum + e.league.played, 0);
      const totalGoals = entries.reduce((sum, e) => sum + e.league.goals, 0);

      // Champion (first place)
      const champion = entries.length > 0 ? entries[0] : null;

      // Top scorer
      let topScorer: IStandings['standings'][0] | null = null;
      if (entries.length > 0) {
        const sorted = [...entries].sort((a, b) => b.league.goals - a.league.goals);
        if (sorted[0] && sorted[0].league.goals > 0) {
          topScorer = sorted[0];
        }
      }

      // MVP
      let mvp: IStandings['standings'][0] | null = null;
      if (entries.length > 0) {
        const sorted = [...entries]
          .filter(e => e.performance.mvpCount > 0)
          .sort((a, b) => {
            if (b.performance.mvpCount !== a.performance.mvpCount) {
              return b.performance.mvpCount - a.performance.mvpCount;
            }
            return b.performance.rating - a.performance.rating;
          });
        if (sorted[0]) {
          mvp = sorted[0];
        }
      }

      // Average rating
      const totalRating = entries.reduce((sum, e) => sum + e.performance.rating, 0);
      const averageRating = entries.length > 0 ? totalRating / entries.length : 0;

      // Top 3 and bottom 3
      const top3 = entries.slice(0, 3);
      const bottom3 = entries.length > 3 ? entries.slice(-3).reverse() : [];

      return {
        success: true,
        data: {
          totalPlayers,
          totalMatches,
          totalGoals,
          champion,
          topScorer,
          mvp,
          averageRating,
          top3,
          bottom3,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Özet alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. HELPER METHODS
  // ============================================

  /**
   * Get player names in bulk
   */
  private static async getPlayerNames(playerIds: string[]): Promise<Record<string, string>> {
    const names: Record<string, string> = {};

    for (const playerId of playerIds) {
      const playerResult = await playerAPI.getById(playerId);
      if (playerResult.success && playerResult.data) {
        names[playerId] = `${playerResult.data.name} ${playerResult.data.surname}`;
      }
    }

    return names;
  }

  /**
   * Calculate form string from match results
   */
  static calculateFormString(results: Array<'W' | 'D' | 'L'>): string {
    return results.slice(-5).join('');
  }

  /**
   * Calculate rating trend
   */
  static calculateRatingTrend(
    previousRating: number,
    currentRating: number
  ): 'up' | 'stable' | 'down' {
    const diff = currentRating - previousRating;
    if (diff > 0.3) return 'up';
    if (diff < -0.3) return 'down';
    return 'stable';
  }

  /**
   * Get form analysis
   */
  static analyzeForm(form: string): {
    wins: number;
    draws: number;
    losses: number;
    percentage: number;
    streak: string;
  } {
    const wins = (form.match(/W/g) || []).length;
    const draws = (form.match(/D/g) || []).length;
    const losses = (form.match(/L/g) || []).length;
    const total = wins + draws + losses;
    const percentage = total > 0 ? ((wins * 3 + draws) / (total * 3)) * 100 : 0;

    // Determine current streak
    let streak = 'None';
    if (form.length > 0) {
      const lastChar = form[form.length - 1];
      let count = 1;
      for (let i = form.length - 2; i >= 0; i--) {
        if (form[i] === lastChar) {
          count++;
        } else {
          break;
        }
      }
      const streakType = lastChar === 'W' ? 'Win' : lastChar === 'D' ? 'Draw' : 'Loss';
      streak = `${count} ${streakType}${count > 1 ? 's' : ''}`;
    }

    return {
      wins,
      draws,
      losses,
      percentage,
      streak,
    };
  }
}

export default StandingsService;