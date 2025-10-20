// ============================================
// services/MatchRatingService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { matchRatingAPI } from '../../api/apiLayer/matchRatingAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { playerStatsAPI } from '../../api/apiLayer/playerStatsAPI';
import { standingsAPI } from '../../api/apiLayer/standingsAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IMatchRating, MatchType } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class MatchRatingService {
  // ============================================
  // 1. RATING SUBMISSION
  // ============================================

  /**
   * Submit rating for a player
   */
  static async submitRating(data: {
    matchId: string;
    raterId: string;
    ratedPlayerId: string;
    rating: number;
    categories?: {
      skill?: number;
      teamwork?: number;
      sportsmanship?: number;
      effort?: number;
    };
    comment?: string;
    isAnonymous?: boolean;
  }): Promise<ApiResponse<IMatchRating>> {
    try {
      ApiLogger.log('MatchRatingService', 'submitRating', {
        matchId: data.matchId,
        raterId: data.raterId,
        ratedPlayerId: data.ratedPlayerId,
      });

      // Get match to validate
      const matchResult = await matchAPI.getById(data.matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if match is completed
      if (match.status !== 'completed') {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_COMPLETED',
            message: 'Sadece tamamlanmış maçlar için puanlama yapılabilir',
            statusCode: 400,
          },
        };
      }

      // Check if rater cannot rate themselves
      if (data.raterId === data.ratedPlayerId) {
        return {
          success: false,
          error: {
            code: 'CANNOT_RATE_SELF',
            message: 'Kendinizi puanlayamazsınız',
            statusCode: 400,
          },
        };
      }

      // Check if both players were in the match
      const allPlayerIds = match.players.teams
        ? [
            ...match.players.teams.team1.map(p => p.playerId),
            ...match.players.teams.team2.map(p => p.playerId),
          ]
        : [];

      if (!allPlayerIds.includes(data.raterId)) {
        return {
          success: false,
          error: {
            code: 'RATER_NOT_IN_MATCH',
            message: 'Sadece maçta oynayan oyuncular puanlama yapabilir',
            statusCode: 403,
          },
        };
      }

      if (!allPlayerIds.includes(data.ratedPlayerId)) {
        return {
          success: false,
          error: {
            code: 'RATED_PLAYER_NOT_IN_MATCH',
            message: 'Puanlanacak oyuncu maçta oynamadı',
            statusCode: 400,
          },
        };
      }

      // Submit rating
      const result = await matchRatingAPI.submitRating({
        matchId: data.matchId,
        matchType: match.type,
        leagueId: match.leagueId,
        seasonId: match.seasonId,
        raterId: data.raterId,
        ratedPlayerId: data.ratedPlayerId,
        rating: data.rating,
        categories: data.categories,
        comment: data.comment,
        isAnonymous: data.isAnonymous,
      });

      if (result.success) {
        ApiLogger.success('MatchRatingService', 'submitRating', {
          ratingId: result.data?.id,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchRatingService', 'submitRating', error);
      return {
        success: false,
        error: {
          code: 'SUBMIT_RATING_ERROR',
          message: error.message || 'Puanlama kaydedilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Bulk submit ratings (rate multiple players at once)
   */
  static async submitBulkRatings(data: {
    matchId: string;
    raterId: string;
    ratings: Array<{
      ratedPlayerId: string;
      rating: number;
      categories?: IMatchRating['categories'];
      comment?: string;
    }>;
    isAnonymous?: boolean;
  }): Promise<ApiResponse<{
    success: number;
    failed: number;
    results: Array<{
      ratedPlayerId: string;
      success: boolean;
      error?: string;
    }>;
  }>> {
    try {
      ApiLogger.log('MatchRatingService', 'submitBulkRatings', {
        matchId: data.matchId,
        raterId: data.raterId,
        count: data.ratings.length,
      });

      const results: Array<{
        ratedPlayerId: string;
        success: boolean;
        error?: string;
      }> = [];

      let successCount = 0;
      let failedCount = 0;

      for (const rating of data.ratings) {
        const result = await this.submitRating({
          matchId: data.matchId,
          raterId: data.raterId,
          ratedPlayerId: rating.ratedPlayerId,
          rating: rating.rating,
          categories: rating.categories,
          comment: rating.comment,
          isAnonymous: data.isAnonymous,
        });

        if (result.success) {
          successCount++;
          results.push({
            ratedPlayerId: rating.ratedPlayerId,
            success: true,
          });
        } else {
          failedCount++;
          results.push({
            ratedPlayerId: rating.ratedPlayerId,
            success: false,
            error: result.error?.message,
          });
        }
      }

      ApiLogger.success('MatchRatingService', 'submitBulkRatings', {
        success: successCount,
        failed: failedCount,
      });

      return {
        success: true,
        data: {
          success: successCount,
          failed: failedCount,
          results,
        },
      };
    } catch (error: any) {
      ApiLogger.error('MatchRatingService', 'submitBulkRatings', error);
      return {
        success: false,
        error: {
          code: 'BULK_RATING_ERROR',
          message: error.message || 'Toplu puanlama yapılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update rating
   */
  static async updateRating(
    ratingId: string,
    userId: string,
    updates: {
      rating?: number;
      categories?: IMatchRating['categories'];
      comment?: string;
      isAnonymous?: boolean;
    }
  ): Promise<ApiResponse<IMatchRating>> {
    try {
      ApiLogger.log('MatchRatingService', 'updateRating', {
        ratingId,
        userId,
      });

      // Get rating
      const ratingResult = await matchRatingAPI.getById(ratingId);

      if (!ratingResult.success || !ratingResult.data) {
        return {
          success: false,
          error: ratingResult.error || {
            code: 'RATING_NOT_FOUND',
            message: 'Puanlama bulunamadı',
            statusCode: 404,
          },
        };
      }

      const rating = ratingResult.data;

      // Check if user is the rater
      if (rating.raterId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Sadece kendi puanlamanızı düzenleyebilirsiniz',
            statusCode: 403,
          },
        };
      }

      // Validate new rating if provided
      if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
        return {
          success: false,
          error: {
            code: 'INVALID_RATING',
            message: 'Puanlama 1-5 arasında olmalıdır',
            statusCode: 400,
          },
        };
      }

      const updateData: Partial<Omit<IMatchRating, 'id'>> = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      const result = await matchRatingAPI.update(ratingId, updateData);

      if (result.success) {
        ApiLogger.success('MatchRatingService', 'updateRating', { ratingId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchRatingService', 'updateRating', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_RATING_ERROR',
          message: error.message || 'Puanlama güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete rating
   */
  static async deleteRating(
    ratingId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    return matchRatingAPI.deleteRating(ratingId, userId);
  }

  // ============================================
  // 2. QUERY OPERATIONS
  // ============================================

  /**
   * Get rating by ID
   */
  static async getRating(ratingId: string): Promise<ApiResponse<IMatchRating>> {
    return matchRatingAPI.getById(ratingId);
  }

  /**
   * Get all ratings for a match
   */
  static async getMatchRatings(matchId: string): Promise<ApiResponse<IMatchRating[]>> {
    return matchRatingAPI.getByMatch(matchId);
  }

  /**
   * Get ratings for specific player in a match
   */
  static async getPlayerRatingsInMatch(
    matchId: string,
    playerId: string
  ): Promise<ApiResponse<IMatchRating[]>> {
    return matchRatingAPI.getPlayerRatingsInMatch(matchId, playerId);
  }

  /**
   * Get ratings given by a rater in a match
   */
  static async getRaterRatings(
    matchId: string,
    raterId: string
  ): Promise<ApiResponse<IMatchRating[]>> {
    return matchRatingAPI.getRatingsByRater(matchId, raterId);
  }

  /**
   * Get all ratings received by a player
   */
  static async getAllPlayerRatings(playerId: string): Promise<ApiResponse<IMatchRating[]>> {
    return matchRatingAPI.getAllRatingsForPlayer(playerId);
  }

  /**
   * Get player rating history
   */
  static async getPlayerRatingHistory(
    playerId: string,
    limit: number = 20
  ): Promise<ApiResponse<IMatchRating[]>> {
    return matchRatingAPI.getPlayerRatingHistory(playerId, limit);
  }

  /**
   * Check if rater has completed ratings
   */
  static async checkRatingCompletion(
    matchId: string,
    raterId: string
  ): Promise<ApiResponse<{
    completed: boolean;
    ratedCount: number;
    expectedCount: number;
    missingPlayers: Array<{
      playerId: string;
      playerName: string;
    }>;
  }>> {
    try {
      // Get match
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Get all players except rater
      const allPlayerIds = match.players.teams
        ? [
            ...match.players.teams.team1.map(p => p.playerId),
            ...match.players.teams.team2.map(p => p.playerId),
          ]
        : [];

      const expectedPlayers = allPlayerIds.filter(id => id !== raterId);

      const completionResult = await matchRatingAPI.hasCompletedRatings(
        matchId,
        raterId,
        expectedPlayers
      );

      if (!completionResult.success || !completionResult.data) {
        return {
          success: false,
          error: completionResult.error || {
            code: 'CHECK_ERROR',
            message: 'Tamamlanma kontrolü yapılamadı',
            statusCode: 500,
          },
        };
      }

      // Get names for missing players
      const missingPlayers: Array<{ playerId: string; playerName: string }> = [];

      for (const playerId of completionResult.data.missingPlayers) {
        const playerResult = await playerAPI.getById(playerId);
        const playerName = playerResult.success && playerResult.data
          ? `${playerResult.data.name} ${playerResult.data.surname}`
          : 'Unknown Player';

        missingPlayers.push({ playerId, playerName });
      }

      return {
        success: true,
        data: {
          completed: completionResult.data.completed,
          ratedCount: completionResult.data.ratedCount,
          expectedCount: completionResult.data.expectedCount,
          missingPlayers,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_COMPLETION_ERROR',
          message: error.message || 'Tamamlanma kontrolü yapılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get player's average rating in a match
   */
  static async getPlayerAverageInMatch(
    matchId: string,
    playerId: string
  ): Promise<ApiResponse<{
    overallAverage: number;
    categoryAverages?: {
      skill: number;
      teamwork: number;
      sportsmanship: number;
      effort: number;
    };
    totalRatings: number;
    ratingBreakdown: {
      fiveStars: number;
      fourStars: number;
      threeStars: number;
      twoStars: number;
      oneStar: number;
    };
  }>> {
    try {
      const averageResult = await matchRatingAPI.getPlayerAverageInMatch(matchId, playerId);

      if (!averageResult.success || !averageResult.data) {
        return {
          success: false,
          error: averageResult.error || {
            code: 'CALCULATE_ERROR',
            message: 'Ortalama hesaplanamadı',
            statusCode: 500,
          },
        };
      }

      // Get all ratings for breakdown
      const ratingsResult = await matchRatingAPI.getPlayerRatingsInMatch(matchId, playerId);
      const ratings = ratingsResult.success && ratingsResult.data ? ratingsResult.data : [];

      const ratingBreakdown = {
        fiveStars: ratings.filter(r => r.rating === 5).length,
        fourStars: ratings.filter(r => r.rating === 4).length,
        threeStars: ratings.filter(r => r.rating === 3).length,
        twoStars: ratings.filter(r => r.rating === 2).length,
        oneStar: ratings.filter(r => r.rating === 1).length,
      };

      return {
        success: true,
        data: {
          ...averageResult.data,
          ratingBreakdown,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_AVERAGE_ERROR',
          message: error.message || 'Ortalama alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get match rating summary
   */
  static async getMatchRatingSummary(matchId: string): Promise<ApiResponse<{
    totalRatings: number;
    averageRating: number;
    participationRate: number;
    topRatedPlayers: Array<{
      playerId: string;
      playerName: string;
      averageRating: number;
      totalRatings: number;
    }>;
    ratingDistribution: {
      fiveStars: number;
      fourStars: number;
      threeStars: number;
      twoStars: number;
      oneStar: number;
    };
    completionStatus: {
      completed: number;
      pending: number;
      totalExpected: number;
    };
  }>> {
    try {
      ApiLogger.log('MatchRatingService', 'getMatchRatingSummary', { matchId });

      const summaryResult = await matchRatingAPI.getMatchRatingSummary(matchId);

      if (!summaryResult.success || !summaryResult.data) {
        return {
          success: false,
          error: summaryResult.error || {
            code: 'GET_SUMMARY_ERROR',
            message: 'Özet alınamadı',
            statusCode: 500,
          },
        };
      }

      // Get all ratings for distribution
      const ratingsResult = await matchRatingAPI.getByMatch(matchId);
      const ratings = ratingsResult.success && ratingsResult.data ? ratingsResult.data : [];

      const ratingDistribution = {
        fiveStars: ratings.filter(r => r.rating === 5).length,
        fourStars: ratings.filter(r => r.rating === 4).length,
        threeStars: ratings.filter(r => r.rating === 3).length,
        twoStars: ratings.filter(r => r.rating === 2).length,
        oneStar: ratings.filter(r => r.rating === 1).length,
      };

      // Enrich top rated players with names
      const topRatedPlayers: Array<{
        playerId: string;
        playerName: string;
        averageRating: number;
        totalRatings: number;
      }> = [];

      for (const player of summaryResult.data.topRatedPlayers) {
        const playerResult = await playerAPI.getById(player.playerId);
        const playerName = playerResult.success && playerResult.data
          ? `${playerResult.data.name} ${playerResult.data.surname}`
          : 'Unknown Player';

        topRatedPlayers.push({
          ...player,
          playerName,
        });
      }

      // Get match to calculate completion status
      const matchResult = await matchAPI.getById(matchId);
      let completionStatus = {
        completed: 0,
        pending: 0,
        totalExpected: 0,
      };

      if (matchResult.success && matchResult.data?.players.teams) {
        const allPlayerIds = [
          ...matchResult.data.players.teams.team1.map(p => p.playerId),
          ...matchResult.data.players.teams.team2.map(p => p.playerId),
        ];

        const uniqueRaters = new Set(ratings.map(r => r.raterId));
        
        completionStatus = {
          completed: uniqueRaters.size,
          pending: allPlayerIds.length - uniqueRaters.size,
          totalExpected: allPlayerIds.length,
        };
      }

      return {
        success: true,
        data: {
          ...summaryResult.data,
          topRatedPlayers,
          ratingDistribution,
          completionStatus,
        },
      };
    } catch (error: any) {
      ApiLogger.error('MatchRatingService', 'getMatchRatingSummary', error);
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

  /**
   * Get player's rating statistics
   */
  static async getPlayerRatingStats(playerId: string): Promise<ApiResponse<{
    totalRatingsReceived: number;
    averageRating: number;
    categoryAverages: {
      skill: number;
      teamwork: number;
      sportsmanship: number;
      effort: number;
    };
    ratingTrend: 'improving' | 'stable' | 'declining';
    lastFiveRatings: number[];
    bestRating: number;
    worstRating: number;
    ratingDistribution: {
      fiveStars: number;
      fourStars: number;
      threeStars: number;
      twoStars: number;
      oneStar: number;
    };
  }>> {
    try {
      const ratingsResult = await matchRatingAPI.getAllRatingsForPlayer(playerId);

      if (!ratingsResult.success || !ratingsResult.data) {
        return {
          success: false,
          error: ratingsResult.error || {
            code: 'GET_RATINGS_ERROR',
            message: 'Puanlamalar alınamadı',
            statusCode: 500,
          },
        };
      }

      const ratings = ratingsResult.data;

      if (ratings.length === 0) {
        return {
          success: true,
          data: {
            totalRatingsReceived: 0,
            averageRating: 0,
            categoryAverages: {
              skill: 0,
              teamwork: 0,
              sportsmanship: 0,
              effort: 0,
            },
            ratingTrend: 'stable',
            lastFiveRatings: [],
            bestRating: 0,
            worstRating: 0,
            ratingDistribution: {
              fiveStars: 0,
              fourStars: 0,
              threeStars: 0,
              twoStars: 0,
              oneStar: 0,
            },
          },
        };
      }

      // Calculate overall average
      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / ratings.length;

      // Calculate category averages
      const categoryAverages = this.calculateCategoryAverages(ratings);

      // Last five ratings
      const lastFiveRatings = ratings.slice(0, 5).map(r => r.rating);

      // Calculate trend
      let ratingTrend: 'improving' | 'stable' | 'declining' = 'stable';
      if (lastFiveRatings.length >= 3) {
        const recentAvg = lastFiveRatings.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
        const olderAvg = lastFiveRatings.slice(2).reduce((a, b) => a + b, 0) / (lastFiveRatings.length - 2);
        
        if (recentAvg > olderAvg + 0.5) ratingTrend = 'improving';
        else if (recentAvg < olderAvg - 0.5) ratingTrend = 'declining';
      }

      // Best and worst
      const bestRating = Math.max(...ratings.map(r => r.rating));
      const worstRating = Math.min(...ratings.map(r => r.rating));

      // Distribution
      const ratingDistribution = {
        fiveStars: ratings.filter(r => r.rating === 5).length,
        fourStars: ratings.filter(r => r.rating === 4).length,
        threeStars: ratings.filter(r => r.rating === 3).length,
        twoStars: ratings.filter(r => r.rating === 2).length,
        oneStar: ratings.filter(r => r.rating === 1).length,
      };

      return {
        success: true,
        data: {
          totalRatingsReceived: ratings.length,
          averageRating,
          categoryAverages,
          ratingTrend,
          lastFiveRatings,
          bestRating,
          worstRating,
          ratingDistribution,
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
  // 4. ADMIN OPERATIONS
  // ============================================

  /**
   * Delete all ratings for a match (admin only)
   */
  static async deleteMatchRatings(
    matchId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('MatchRatingService', 'deleteMatchRatings', {
        matchId,
        userId,
      });

      // Get match to check league
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if user is league admin
      if (match.leagueId) {
        const isAdminCheck = await leagueAPI.isAdmin(match.leagueId, userId);
        if (!isAdminCheck.success || !isAdminCheck.data) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Puanlamaları silme yetkiniz yok',
              statusCode: 403,
            },
          };
        }
      }

      const result = await matchRatingAPI.deleteMatchRatings(matchId);

      if (result.success) {
        ApiLogger.success('MatchRatingService', 'deleteMatchRatings', {
          matchId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchRatingService', 'deleteMatchRatings', error);
      return {
        success: false,
        error: {
          code: 'DELETE_RATINGS_ERROR',
          message: error.message || 'Puanlamalar silinirken hata oluştu',
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
   * Calculate category averages from ratings
   */
  private static calculateCategoryAverages(ratings: IMatchRating[]): {
    skill: number;
    teamwork: number;
    sportsmanship: number;
    effort: number;
  } {
    const skillRatings = ratings
      .filter(r => r.categories?.skill)
      .map(r => r.categories!.skill!);
    const teamworkRatings = ratings
      .filter(r => r.categories?.teamwork)
      .map(r => r.categories!.teamwork!);
    const sportsmanshipRatings = ratings
      .filter(r => r.categories?.sportsmanship)
      .map(r => r.categories!.sportsmanship!);
    const effortRatings = ratings
      .filter(r => r.categories?.effort)
      .map(r => r.categories!.effort!);

    return {
      skill: skillRatings.length > 0
        ? skillRatings.reduce((a, b) => a + b, 0) / skillRatings.length
        : 0,
      teamwork: teamworkRatings.length > 0
        ? teamworkRatings.reduce((a, b) => a + b, 0) / teamworkRatings.length
        : 0,
      sportsmanship: sportsmanshipRatings.length > 0
        ? sportsmanshipRatings.reduce((a, b) => a + b, 0) / sportsmanshipRatings.length
        : 0,
      effort: effortRatings.length > 0
        ? effortRatings.reduce((a, b) => a + b, 0) / effortRatings.length
        : 0,
    };
  }

  /**
   * Format rating for display
   */
  static formatRating(rating: number): string {
    return '⭐'.repeat(Math.round(rating));
  }

  /**
   * Get rating grade
   */
  static getRatingGrade(rating: number): {
    grade: string;
    color: string;
    description: string;
  } {
    if (rating >= 4.5) {
      return { grade: 'A+', color: 'green', description: 'Mükemmel' };
    } else if (rating >= 4.0) {
      return { grade: 'A', color: 'green', description: 'Çok İyi' };
    } else if (rating >= 3.5) {
      return { grade: 'B', color: 'blue', description: 'İyi' };
    } else if (rating >= 3.0) {
      return { grade: 'C', color: 'yellow', description: 'Orta' };
    } else if (rating >= 2.5) {
      return { grade: 'D', color: 'orange', description: 'Zayıf' };
    } else {
      return { grade: 'F', color: 'red', description: 'Çok Zayıf' };
    }
  }

  /**
   * Validate rating value
   */
  static validateRating(rating: number): boolean {
    return rating >= 1 && rating <= 5;
  }
}

export default MatchRatingService;