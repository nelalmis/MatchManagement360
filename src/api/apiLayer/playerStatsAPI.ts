// ============================================
// api/playerStatsApi.ts - UPDATED FOR YOUR TYPE
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { IPlayerStats } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';

export class PlayerStatsAPI extends BaseAPI<IPlayerStats> {
  constructor() {
    super('playerStats');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get stats by player, league and season
   */
  async getByPlayerLeagueSeason(
    playerId: string,
    leagueId: string,
    seasonId: string
  ): Promise<ApiResponse<IPlayerStats | null>> {
    const result = await this.getAll({
      where: [
        { field: 'playerId', operator: '==', value: playerId },
        { field: 'leagueId', operator: '==', value: leagueId },
        { field: 'seasonId', operator: '==', value: seasonId },
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
   * Get all stats for a player
   */
  async getByPlayer(playerId: string): Promise<ApiResponse<IPlayerStats[]>> {
    return this.getAll({
      where: [{ field: 'playerId', operator: '==', value: playerId }],
      orderBy: [{ field: 'lastUpdated', direction: 'desc' }],
    });
  }

  /**
   * Get all stats for a season
   */
  async getBySeason(seasonId: string): Promise<ApiResponse<IPlayerStats[]>> {
    return this.getAll({
      where: [{ field: 'seasonId', operator: '==', value: seasonId }],
    });
  }

  /**
   * Get all stats for a league
   */
  async getByLeague(leagueId: string): Promise<ApiResponse<IPlayerStats[]>> {
    return this.getAll({
      where: [{ field: 'leagueId', operator: '==', value: leagueId }],
    });
  }

  /**
   * Get top scorers for a season (league goals)
   */
  async getTopScorers(seasonId: string, limit: number = 10): Promise<ApiResponse<IPlayerStats[]>> {
    return this.getAll({
      where: [{ field: 'seasonId', operator: '==', value: seasonId }],
      orderBy: [{ field: 'league.goals', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Get players with most assists
   */
  async getTopAssists(seasonId: string, limit: number = 10): Promise<ApiResponse<IPlayerStats[]>> {
    return this.getAll({
      where: [{ field: 'seasonId', operator: '==', value: seasonId }],
      orderBy: [{ field: 'league.assists', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Get players with highest average rating
   */
  async getTopRatings(seasonId: string, limit: number = 10): Promise<ApiResponse<IPlayerStats[]>> {
    return this.getAll({
      where: [{ field: 'seasonId', operator: '==', value: seasonId }],
      orderBy: [{ field: 'rating.average', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Get most MVP awards
   */
  async getMostMVPs(seasonId: string, limit: number = 10): Promise<ApiResponse<IPlayerStats[]>> {
    return this.getAll({
      where: [{ field: 'seasonId', operator: '==', value: seasonId }],
      orderBy: [{ field: 'mvp.count', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Get players with best win rate
   */
  async getBestWinRate(seasonId: string, minMatches: number = 5, limit: number = 10): Promise<ApiResponse<IPlayerStats[]>> {
    try {
      const result = await this.getAll({
        where: [{ field: 'seasonId', operator: '==', value: seasonId }],
      });

      if (!result.success || !result.data) {
        return result;
      }

      // Filter by minimum matches and sort by win rate
      const filtered = result.data
        .filter(stat => stat.league.matches >= minMatches)
        .sort((a, b) => b.league.winRate - a.league.winRate)
        .slice(0, limit);

      return {
        success: true,
        data: filtered,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_WIN_RATE_ERROR',
          message: error.message || 'Failed to get best win rate',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATS UPDATES - LEAGUE MATCH
  // ============================================

  /**
   * Update stats after league match
   */
  async updateAfterLeagueMatch(
    playerId: string,
    leagueId: string,
    seasonId: string,
    matchData: {
      won: boolean;
      drawn: boolean;
      lost: boolean;
      goals: number;
      assists: number;
      points: number;
      rating?: number;
      ratingCategory?: {
        skill?: number;
        teamwork?: number;
        sportsmanship?: number;
        effort?: number;
      };
      ratingSource?: 'teammate' | 'opponent';
      isMVP: boolean;
      position?: string;
      cleanSheet?: boolean;
      wasInvited?: boolean;
    }
  ): Promise<ApiResponse<IPlayerStats>> {
    try {
      ApiLogger.log('playerStats', 'updateAfterLeagueMatch', { playerId, seasonId });

      // Get or create stats
      let statsResult = await this.getByPlayerLeagueSeason(playerId, leagueId, seasonId);
      
      let stats: IPlayerStats;
      let isNew = false;

      if (!statsResult.data) {
        // Create new stats
        isNew = true;
        stats = this.createEmptyStats(playerId, leagueId, seasonId);
      } else {
        stats = statsResult.data;
      }

      // Update league stats
      stats.league.matches += 1;
      if (matchData.won) stats.league.wins += 1;
      if (matchData.drawn) stats.league.draws += 1;
      if (matchData.lost) stats.league.losses += 1;
      stats.league.goals += matchData.goals;
      stats.league.assists += matchData.assists;
      stats.league.points += matchData.points;
      if (matchData.cleanSheet) {
        stats.league.cleanSheets = (stats.league.cleanSheets || 0) + 1;
      }

      // Recalculate league metrics
      stats.league.goalsPerMatch = stats.league.matches > 0 
        ? stats.league.goals / stats.league.matches 
        : 0;
      stats.league.assistsPerMatch = stats.league.matches > 0 
        ? stats.league.assists / stats.league.matches 
        : 0;
      stats.league.winRate = stats.league.matches > 0 
        ? (stats.league.wins / stats.league.matches) * 100 
        : 0;

      // Update total stats
      stats.total.matches = stats.league.matches + stats.friendly.matches;
      stats.total.goals = stats.league.goals + stats.friendly.goals;
      stats.total.assists = stats.league.assists + stats.friendly.assists;
      stats.total.points = stats.league.points;

      // Update rating
      if (matchData.rating !== undefined) {
        const totalRating = (stats.rating.average * stats.rating.totalReceived) + matchData.rating;
        stats.rating.totalReceived += 1;
        stats.rating.average = totalRating / stats.rating.totalReceived;

        // Update category ratings
        if (matchData.ratingCategory) {
          if (!stats.rating.categories) {
            stats.rating.categories = {
              skill: 0,
              teamwork: 0,
              sportsmanship: 0,
              effort: 0,
            };
          }

          if (matchData.ratingCategory.skill) {
            stats.rating.categories.skill = this.updateCategoryAverage(
              stats.rating.categories.skill,
              matchData.ratingCategory.skill,
              stats.rating.totalReceived
            );
          }
          if (matchData.ratingCategory.teamwork) {
            stats.rating.categories.teamwork = this.updateCategoryAverage(
              stats.rating.categories.teamwork,
              matchData.ratingCategory.teamwork,
              stats.rating.totalReceived
            );
          }
          if (matchData.ratingCategory.sportsmanship) {
            stats.rating.categories.sportsmanship = this.updateCategoryAverage(
              stats.rating.categories.sportsmanship,
              matchData.ratingCategory.sportsmanship,
              stats.rating.totalReceived
            );
          }
          if (matchData.ratingCategory.effort) {
            stats.rating.categories.effort = this.updateCategoryAverage(
              stats.rating.categories.effort,
              matchData.ratingCategory.effort,
              stats.rating.totalReceived
            );
          }
        }

        // Update last five ratings
        stats.rating.lastFiveRatings = [matchData.rating, ...stats.rating.lastFiveRatings].slice(0, 5);

        // Calculate trend
        stats.rating.trend = this.calculateRatingTrend(stats.rating.lastFiveRatings);

        // Update source-based ratings
        if (matchData.ratingSource === 'teammate') {
          const totalTeammateRating = (stats.rating.fromTeammates.average * stats.rating.fromTeammates.count) + matchData.rating;
          stats.rating.fromTeammates.count += 1;
          stats.rating.fromTeammates.average = totalTeammateRating / stats.rating.fromTeammates.count;
        } else if (matchData.ratingSource === 'opponent') {
          const totalOpponentRating = (stats.rating.fromOpponents.average * stats.rating.fromOpponents.count) + matchData.rating;
          stats.rating.fromOpponents.count += 1;
          stats.rating.fromOpponents.average = totalOpponentRating / stats.rating.fromOpponents.count;
        }
      }

      // Update MVP
      if (matchData.isMVP) {
        stats.mvp.count += 1;
        stats.mvp.lastMvpDate = new Date().toISOString();
      }
      stats.mvp.rate = stats.total.matches > 0 
        ? (stats.mvp.count / stats.total.matches) * 100 
        : 0;

      // Update attendance
      if (matchData.wasInvited) {
        stats.attendance.invited += 1;
      }
      stats.attendance.played += 1;
      stats.attendance.rate = stats.attendance.invited > 0 
        ? (stats.attendance.played / stats.attendance.invited) * 100 
        : 100;

      // Update position stats
      if (matchData.position) {
        if (!stats.positions) {
          stats.positions = {};
        }

        if (!stats.positions[matchData.position]) {
          stats.positions[matchData.position] = {
            matches: 0,
            goals: 0,
            assists: 0,
            rating: 0,
          };
        }

        const posStats = stats.positions[matchData.position];
        const totalPosRating = (posStats.rating * posStats.matches) + (matchData.rating || 0);
        posStats.matches += 1;
        posStats.goals += matchData.goals;
        posStats.assists += matchData.assists;
        posStats.rating = matchData.rating !== undefined 
          ? totalPosRating / posStats.matches 
          : posStats.rating;
      }

      // Update lastUpdated
      stats.lastUpdated = new Date().toISOString();

      // Save stats
      let result: ApiResponse<IPlayerStats>;
      
      if (isNew) {
        result = await this.create(stats);
      } else {
        result = await this.update(stats.id!, stats as Partial<Omit<IPlayerStats, 'id'>>);
      }

      ApiLogger.success('playerStats', 'updateAfterLeagueMatch', { playerId, seasonId });

      return result;
    } catch (error: any) {
      ApiLogger.error('playerStats', 'updateAfterLeagueMatch', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_LEAGUE_STATS_ERROR',
          message: error.message || 'Failed to update league stats',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATS UPDATES - FRIENDLY MATCH
  // ============================================

  /**
   * Update stats after friendly match
   */
  async updateAfterFriendlyMatch(
    playerId: string,
    leagueId: string,
    seasonId: string,
    matchData: {
      won: boolean;
      drawn: boolean;
      lost: boolean;
      goals: number;
      assists: number;
      rating?: number;
      ratingCategory?: {
        skill?: number;
        teamwork?: number;
        sportsmanship?: number;
        effort?: number;
      };
      ratingSource?: 'teammate' | 'opponent';
      isMVP: boolean;
      position?: string;
      wasInvited?: boolean;
    }
  ): Promise<ApiResponse<IPlayerStats>> {
    try {
      ApiLogger.log('playerStats', 'updateAfterFriendlyMatch', { playerId, seasonId });

      // Get or create stats
      let statsResult = await this.getByPlayerLeagueSeason(playerId, leagueId, seasonId);
      
      let stats: IPlayerStats;
      let isNew = false;

      if (!statsResult.data) {
        isNew = true;
        stats = this.createEmptyStats(playerId, leagueId, seasonId);
      } else {
        stats = statsResult.data;
      }

      // Update friendly stats
      stats.friendly.matches += 1;
      if (matchData.won) stats.friendly.wins += 1;
      if (matchData.drawn) stats.friendly.draws += 1;
      if (matchData.lost) stats.friendly.losses += 1;
      stats.friendly.goals += matchData.goals;
      stats.friendly.assists += matchData.assists;

      // Recalculate friendly metrics
      stats.friendly.goalsPerMatch = stats.friendly.matches > 0 
        ? stats.friendly.goals / stats.friendly.matches 
        : 0;
      stats.friendly.assistsPerMatch = stats.friendly.matches > 0 
        ? stats.friendly.assists / stats.friendly.matches 
        : 0;
      stats.friendly.winRate = stats.friendly.matches > 0 
        ? (stats.friendly.wins / stats.friendly.matches) * 100 
        : 0;

      // Update total stats
      stats.total.matches = stats.league.matches + stats.friendly.matches;
      stats.total.goals = stats.league.goals + stats.friendly.goals;
      stats.total.assists = stats.league.assists + stats.friendly.assists;

      // Update rating (same logic as league)
      if (matchData.rating !== undefined) {
        const totalRating = (stats.rating.average * stats.rating.totalReceived) + matchData.rating;
        stats.rating.totalReceived += 1;
        stats.rating.average = totalRating / stats.rating.totalReceived;

        // Update category ratings
        if (matchData.ratingCategory) {
          if (!stats.rating.categories) {
            stats.rating.categories = {
              skill: 0,
              teamwork: 0,
              sportsmanship: 0,
              effort: 0,
            };
          }

          if (matchData.ratingCategory.skill) {
            stats.rating.categories.skill = this.updateCategoryAverage(
              stats.rating.categories.skill,
              matchData.ratingCategory.skill,
              stats.rating.totalReceived
            );
          }
          if (matchData.ratingCategory.teamwork) {
            stats.rating.categories.teamwork = this.updateCategoryAverage(
              stats.rating.categories.teamwork,
              matchData.ratingCategory.teamwork,
              stats.rating.totalReceived
            );
          }
          if (matchData.ratingCategory.sportsmanship) {
            stats.rating.categories.sportsmanship = this.updateCategoryAverage(
              stats.rating.categories.sportsmanship,
              matchData.ratingCategory.sportsmanship,
              stats.rating.totalReceived
            );
          }
          if (matchData.ratingCategory.effort) {
            stats.rating.categories.effort = this.updateCategoryAverage(
              stats.rating.categories.effort,
              matchData.ratingCategory.effort,
              stats.rating.totalReceived
            );
          }
        }

        stats.rating.lastFiveRatings = [matchData.rating, ...stats.rating.lastFiveRatings].slice(0, 5);
        stats.rating.trend = this.calculateRatingTrend(stats.rating.lastFiveRatings);

        if (matchData.ratingSource === 'teammate') {
          const totalTeammateRating = (stats.rating.fromTeammates.average * stats.rating.fromTeammates.count) + matchData.rating;
          stats.rating.fromTeammates.count += 1;
          stats.rating.fromTeammates.average = totalTeammateRating / stats.rating.fromTeammates.count;
        } else if (matchData.ratingSource === 'opponent') {
          const totalOpponentRating = (stats.rating.fromOpponents.average * stats.rating.fromOpponents.count) + matchData.rating;
          stats.rating.fromOpponents.count += 1;
          stats.rating.fromOpponents.average = totalOpponentRating / stats.rating.fromOpponents.count;
        }
      }

      // Update MVP
      if (matchData.isMVP) {
        stats.mvp.count += 1;
        stats.mvp.lastMvpDate = new Date().toISOString();
      }
      stats.mvp.rate = stats.total.matches > 0 
        ? (stats.mvp.count / stats.total.matches) * 100 
        : 0;

      // Update attendance
      if (matchData.wasInvited) {
        stats.attendance.invited += 1;
      }
      stats.attendance.played += 1;
      stats.attendance.rate = stats.attendance.invited > 0 
        ? (stats.attendance.played / stats.attendance.invited) * 100 
        : 100;

      // Update position stats
      if (matchData.position) {
        if (!stats.positions) {
          stats.positions = {};
        }

        if (!stats.positions[matchData.position]) {
          stats.positions[matchData.position] = {
            matches: 0,
            goals: 0,
            assists: 0,
            rating: 0,
          };
        }

        const posStats = stats.positions[matchData.position];
        const totalPosRating = (posStats.rating * posStats.matches) + (matchData.rating || 0);
        posStats.matches += 1;
        posStats.goals += matchData.goals;
        posStats.assists += matchData.assists;
        posStats.rating = matchData.rating !== undefined 
          ? totalPosRating / posStats.matches 
          : posStats.rating;
      }

      stats.lastUpdated = new Date().toISOString();

      // Save stats
      let result: ApiResponse<IPlayerStats>;
      
      if (isNew) {
        result = await this.create(stats);
      } else {
        result = await this.update(stats.id!, stats as Partial<Omit<IPlayerStats, 'id'>>);
      }

      ApiLogger.success('playerStats', 'updateAfterFriendlyMatch', { playerId, seasonId });

      return result;
    } catch (error: any) {
      ApiLogger.error('playerStats', 'updateAfterFriendlyMatch', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FRIENDLY_STATS_ERROR',
          message: error.message || 'Failed to update friendly stats',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private createEmptyStats(playerId: string, leagueId: string, seasonId: string): IPlayerStats {
    return {
      id: '',
      playerId,
      leagueId,
      seasonId,
      league: {
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
        assists: 0,
        points: 0,
        goalsPerMatch: 0,
        assistsPerMatch: 0,
        winRate: 0,
        cleanSheets: 0,
      },
      friendly: {
        matches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals: 0,
        assists: 0,
        goalsPerMatch: 0,
        assistsPerMatch: 0,
        winRate: 0,
      },
      total: {
        matches: 0,
        goals: 0,
        assists: 0,
        points: 0,
      },
      rating: {
        average: 0,
        totalReceived: 0,
        lastFiveRatings: [],
        trend: 'stable',
        fromTeammates: {
          average: 0,
          count: 0,
        },
        fromOpponents: {
          average: 0,
          count: 0,
        },
      },
      mvp: {
        count: 0,
        rate: 0,
      },
      attendance: {
        invited: 0,
        played: 0,
        rate: 0,
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  private updateCategoryAverage(currentAvg: number, newValue: number, totalCount: number): number {
    const previousTotal = currentAvg * (totalCount - 1);
    return (previousTotal + newValue) / totalCount;
  }

  private calculateRatingTrend(lastFiveRatings: number[]): 'improving' | 'stable' | 'declining' {
    if (lastFiveRatings.length < 3) return 'stable';

    const recentAvg = lastFiveRatings.slice(0, 2).reduce((a, b) => a + b, 0) / Math.min(2, lastFiveRatings.length);
    const olderAvg = lastFiveRatings.slice(2).reduce((a, b) => a + b, 0) / lastFiveRatings.slice(2).length;

    const diff = recentAvg - olderAvg;

    if (diff > 0.3) return 'improving';
    if (diff < -0.3) return 'declining';
    return 'stable';
  }

  // ============================================
  // CAREER STATS
  // ============================================

  /**
   * Get player career stats (all seasons combined)
   */
  async getCareerStats(playerId: string): Promise<ApiResponse<{
    league: IPlayerStats['league'];
    friendly: IPlayerStats['friendly'];
    total: IPlayerStats['total'];
    rating: IPlayerStats['rating'];
    mvp: IPlayerStats['mvp'];
    attendance: IPlayerStats['attendance'];
  }>> {
    try {
      const statsResult = await this.getByPlayer(playerId);
      
      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: statsResult.error || {
            code: 'GET_STATS_ERROR',
            message: 'Failed to get player stats',
            statusCode: 500,
          },
        };
      }

      const allStats = statsResult.data;

      // Aggregate stats across all seasons
      const career = {
        league: {
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          points: 0,
          goalsPerMatch: 0,
          assistsPerMatch: 0,
          winRate: 0,
          cleanSheets: 0,
        },
        friendly: {
          matches: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          goalsPerMatch: 0,
          assistsPerMatch: 0,
          winRate: 0,
        },
        total: {
          matches: 0,
          goals: 0,
          assists: 0,
          points: 0,
        },
        rating: {
          average: 0,
          totalReceived: 0,
          lastFiveRatings: [] as number[],
          trend: 'stable' as const,
          fromTeammates: {
            average: 0,
            count: 0,
          },
          fromOpponents: {
            average: 0,
            count: 0,
          },
        },
        mvp: {
          count: 0,
          rate: 0,
        },
        attendance: {
          invited: 0,
          played: 0,
          rate: 0,
        },
      };

      let totalRating = 0;
      let ratingCount = 0;
      let teammateRatingTotal = 0;
      let teammateRatingCount = 0;
      let opponentRatingTotal = 0;
      let opponentRatingCount = 0;

      for (const stat of allStats) {
        // Aggregate league
        career.league.matches += stat.league.matches;
        career.league.wins += stat.league.wins;
        career.league.draws += stat.league.draws;
        career.league.losses += stat.league.losses;
        career.league.goals += stat.league.goals;
        career.league.assists += stat.league.assists;
        career.league.points += stat.league.points;
        career.league.cleanSheets! += stat.league.cleanSheets || 0;

        // Aggregate friendly
        career.friendly.matches += stat.friendly.matches;
        career.friendly.wins += stat.friendly.wins;
        career.friendly.draws += stat.friendly.draws;
        career.friendly.losses += stat.friendly.losses;
        career.friendly.goals += stat.friendly.goals;
        career.friendly.assists += stat.friendly.assists;

        // Aggregate total
        career.total.matches += stat.total.matches;
        career.total.goals += stat.total.goals;
        career.total.assists += stat.total.assists;
        career.total.points += stat.total.points;

        // Aggregate rating
        if (stat.rating.totalReceived > 0) {
          totalRating += stat.rating.average * stat.rating.totalReceived;
          ratingCount += stat.rating.totalReceived;
        }

        if (stat.rating.fromTeammates.count > 0) {
          teammateRatingTotal += stat.rating.fromTeammates.average * stat.rating.fromTeammates.count;
          teammateRatingCount += stat.rating.fromTeammates.count;
        }

        if (stat.rating.fromOpponents.count > 0) {
          opponentRatingTotal += stat.rating.fromOpponents.average * stat.rating.fromOpponents.count;
          opponentRatingCount += stat.rating.fromOpponents.count;
        }

        // Aggregate MVP
        career.mvp.count += stat.mvp.count;

        // Aggregate attendance
        career.attendance.invited += stat.attendance.invited;
        career.attendance.played += stat.attendance.played;
      }

      // Calculate averages
      career.league.goalsPerMatch = career.league.matches > 0 
        ? career.league.goals / career.league.matches 
        : 0;
      career.league.assistsPerMatch = career.league.matches > 0 
        ? career.league.assists / career.league.matches 
        : 0;
      career.league.winRate = career.league.matches > 0 
        ? (career.league.wins / career.league.matches) * 100 
        : 0;

      career.friendly.goalsPerMatch = career.friendly.matches > 0 
        ? career.friendly.goals / career.friendly.matches 
        : 0;
      career.friendly.assistsPerMatch = career.friendly.matches > 0 
        ? career.friendly.assists / career.friendly.matches 
        : 0;
      career.friendly.winRate = career.friendly.matches > 0 
        ? (career.friendly.wins / career.friendly.matches) * 100 
        : 0;

      career.rating.average = ratingCount > 0 
        ? totalRating / ratingCount 
        : 0;
      career.rating.totalReceived = ratingCount;
      career.rating.fromTeammates.average = teammateRatingCount > 0 
        ? teammateRatingTotal / teammateRatingCount 
        : 0;
      career.rating.fromTeammates.count = teammateRatingCount;
      career.rating.fromOpponents.average = opponentRatingCount > 0 
        ? opponentRatingTotal / opponentRatingCount 
        : 0;
      career.rating.fromOpponents.count = opponentRatingCount;

      career.mvp.rate = career.total.matches > 0 
        ? (career.mvp.count / career.total.matches) * 100 
        : 0;

      career.attendance.rate = career.attendance.invited > 0 
        ? (career.attendance.played / career.attendance.invited) * 100 
        : 100;

      return {
        success: true,
        data: career,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_CAREER_STATS_ERROR',
          message: error.message || 'Failed to get career stats',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reset stats for a season
   */
  async resetSeasonStats(seasonId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('playerStats', 'resetSeasonStats', { seasonId });

      const statsResult = await this.getBySeason(seasonId);
      
      if (!statsResult.success || !statsResult.data) {
        return {
          success: true,
          data: undefined,
        };
      }

      // Delete all stats for this season
      for (const stat of statsResult.data) {
        if (stat.id) {
          await this.delete(stat.id);
        }
      }

      ApiLogger.success('playerStats', 'resetSeasonStats', { seasonId });

      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      ApiLogger.error('playerStats', 'resetSeasonStats', error);
      return {
        success: false,
        error: {
          code: 'RESET_STATS_ERROR',
          message: error.message || 'Failed to reset season stats',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const playerStatsAPI = new PlayerStatsAPI();