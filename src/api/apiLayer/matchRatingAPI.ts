// ============================================
// api/matchRatingAPI.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { IMatchRating, MatchType } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';

export class MatchRatingAPI extends BaseAPI<IMatchRating> {
  constructor() {
    super('ratings');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get all ratings for a match
   */
  async getByMatch(matchId: string): Promise<ApiResponse<IMatchRating[]>> {
    return this.getAll({
      where: [{ field: 'matchId', operator: '==', value: matchId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get ratings for a specific player in a match
   */
  async getPlayerRatingsInMatch(
    matchId: string,
    ratedPlayerId: string
  ): Promise<ApiResponse<IMatchRating[]>> {
    return this.getAll({
      where: [
        { field: 'matchId', operator: '==', value: matchId },
        { field: 'ratedPlayerId', operator: '==', value: ratedPlayerId },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get rating by rater and rated player (check if rating exists)
   */
  async getRatingByRaterAndPlayer(
    matchId: string,
    raterId: string,
    ratedPlayerId: string
  ): Promise<ApiResponse<IMatchRating | null>> {
    const result = await this.getAll({
      where: [
        { field: 'matchId', operator: '==', value: matchId },
        { field: 'raterId', operator: '==', value: raterId },
        { field: 'ratedPlayerId', operator: '==', value: ratedPlayerId },
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
   * Get all ratings given by a rater in a match
   */
  async getRatingsByRater(
    matchId: string,
    raterId: string
  ): Promise<ApiResponse<IMatchRating[]>> {
    return this.getAll({
      where: [
        { field: 'matchId', operator: '==', value: matchId },
        { field: 'raterId', operator: '==', value: raterId },
      ],
    });
  }

  /**
   * Get all ratings received by a player across all matches
   */
  async getAllRatingsForPlayer(ratedPlayerId: string): Promise<ApiResponse<IMatchRating[]>> {
    return this.getAll({
      where: [{ field: 'ratedPlayerId', operator: '==', value: ratedPlayerId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get ratings by season
   */
  async getBySeason(seasonId: string): Promise<ApiResponse<IMatchRating[]>> {
    return this.getAll({
      where: [{ field: 'seasonId', operator: '==', value: seasonId }],
    });
  }

  /**
   * Get ratings by league
   */
  async getByLeague(leagueId: string): Promise<ApiResponse<IMatchRating[]>> {
    return this.getAll({
      where: [{ field: 'leagueId', operator: '==', value: leagueId }],
    });
  }

  /**
   * Get ratings by match type
   */
  async getByMatchType(matchType: MatchType): Promise<ApiResponse<IMatchRating[]>> {
    return this.getAll({
      where: [{ field: 'matchType', operator: '==', value: matchType }],
      limit: 100,
    });
  }

  // ============================================
  // RATING SUBMISSION
  // ============================================

  /**
   * Submit or update rating
   */
  async submitRating(data: {
    matchId: string;
    matchType: MatchType;
    leagueId?: string;
    seasonId?: string;
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
      ApiLogger.log('matchRatings', 'submitRating', {
        matchId: data.matchId,
        raterId: data.raterId,
        ratedPlayerId: data.ratedPlayerId,
      });

      // Validate rating value
      if (data.rating < 1 || data.rating > 5) {
        return {
          success: false,
          error: {
            code: 'INVALID_RATING',
            message: 'Rating must be between 1 and 5',
            statusCode: 400,
          },
        };
      }

      // Validate category ratings if provided
      if (data.categories) {
        const categories = Object.values(data.categories).filter(v => v !== undefined);
        const invalidCategory = categories.some(v => v! < 1 || v! > 5);
        
        if (invalidCategory) {
          return {
            success: false,
            error: {
              code: 'INVALID_CATEGORY',
              message: 'Category ratings must be between 1 and 5',
              statusCode: 400,
            },
          };
        }
      }

      // Check if rating already exists
      const existingRatingResult = await this.getRatingByRaterAndPlayer(
        data.matchId,
        data.raterId,
        data.ratedPlayerId
      );

      if (existingRatingResult.success && existingRatingResult.data) {
        // Update existing rating
        const ratingId = existingRatingResult.data.id!;
        
        const updateData: Partial<IMatchRating> = {
          rating: data.rating,
          categories: data.categories,
          comment: data.comment,
          isAnonymous: data.isAnonymous ?? false,
          updatedAt: new Date().toISOString(),
        };

        const result = await this.update(ratingId, updateData as Partial<Omit<IMatchRating, 'id'>>);

        ApiLogger.success('matchRatings', 'updateRating', { ratingId });

        return result;
      } else {
        // Create new rating
        const ratingData: Omit<IMatchRating, 'id'> = {
          matchId: data.matchId,
          matchType: data.matchType,
          leagueId: data.leagueId,
          seasonId: data.seasonId,
          raterId: data.raterId,
          ratedPlayerId: data.ratedPlayerId,
          rating: data.rating,
          categories: data.categories,
          comment: data.comment,
          isAnonymous: data.isAnonymous ?? false,
          createdAt: new Date().toISOString(),
        };

        const result = await this.create(ratingData);

        ApiLogger.success('matchRatings', 'createRating', { ratingId: result.data?.id });

        return result;
      }
    } catch (error: any) {
      ApiLogger.error('matchRatings', 'submitRating', error);
      return {
        success: false,
        error: {
          code: 'SUBMIT_RATING_ERROR',
          message: error.message || 'Failed to submit rating',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete rating
   */
  async deleteRating(ratingId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('matchRatings', 'deleteRating', { ratingId, userId });

      // Get rating
      const ratingResult = await this.getById(ratingId);
      
      if (!ratingResult.success || !ratingResult.data) {
        return {
          success: false,
          error: ratingResult.error || {
            code: 'NOT_FOUND',
            message: 'Rating not found',
            statusCode: 404,
          },
        };
      }

      // Check if user is the rater
      if (ratingResult.data.raterId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You can only delete your own ratings',
            statusCode: 403,
          },
        };
      }

      const result = await this.delete(ratingId);

      ApiLogger.success('matchRatings', 'deleteRating', { ratingId });

      return result;
    } catch (error: any) {
      ApiLogger.error('matchRatings', 'deleteRating', error);
      return {
        success: false,
        error: {
          code: 'DELETE_RATING_ERROR',
          message: error.message || 'Failed to delete rating',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * Calculate average rating for a player in a match
   */
  async getPlayerAverageInMatch(
    matchId: string,
    ratedPlayerId: string
  ): Promise<ApiResponse<{
    overallAverage: number;
    categoryAverages?: {
      skill: number;
      teamwork: number;
      sportsmanship: number;
      effort: number;
    };
    totalRatings: number;
  }>> {
    try {
      const ratingsResult = await this.getPlayerRatingsInMatch(matchId, ratedPlayerId);
      
      if (!ratingsResult.success || !ratingsResult.data) {
        return {
          success: false,
          error: ratingsResult.error || {
            code: 'GET_RATINGS_ERROR',
            message: 'Failed to get player ratings',
            statusCode: 500,
          },
        };
      }

      const ratings = ratingsResult.data;

      if (ratings.length === 0) {
        return {
          success: true,
          data: {
            overallAverage: 0,
            totalRatings: 0,
          },
        };
      }

      // Calculate overall average
      const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
      const overallAverage = totalRating / ratings.length;

      // Calculate category averages
      let categoryAverages: any = undefined;
      const hasCategories = ratings.some(r => r.categories);

      if (hasCategories) {
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

        categoryAverages = {
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

      return {
        success: true,
        data: {
          overallAverage,
          categoryAverages,
          totalRatings: ratings.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CALCULATE_AVERAGE_ERROR',
          message: error.message || 'Failed to calculate average rating',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get match rating summary
   */
  async getMatchRatingSummary(matchId: string): Promise<ApiResponse<{
    totalRatings: number;
    averageRating: number;
    participationRate: number;
    topRatedPlayers: Array<{
      playerId: string;
      averageRating: number;
      totalRatings: number;
    }>;
  }>> {
    try {
      const ratingsResult = await this.getByMatch(matchId);
      
      if (!ratingsResult.success || !ratingsResult.data) {
        return {
          success: false,
          error: ratingsResult.error || {
            code: 'GET_RATINGS_ERROR',
            message: 'Failed to get match ratings',
            statusCode: 500,
          },
        };
      }

      const ratings = ratingsResult.data;

      if (ratings.length === 0) {
        return {
          success: true,
          data: {
            totalRatings: 0,
            averageRating: 0,
            participationRate: 0,
            topRatedPlayers: [],
          },
        };
      }

      // Calculate overall stats
      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

      // Count unique raters for participation rate
      const uniqueRaters = new Set(ratings.map(r => r.raterId));
      const uniqueRatedPlayers = new Set(ratings.map(r => r.ratedPlayerId));
      
      const totalPlayers = new Set([...uniqueRaters, ...uniqueRatedPlayers]).size;
      const participationRate = totalPlayers > 0 
        ? (uniqueRaters.size / totalPlayers) * 100 
        : 0;

      // Calculate top rated players
      const playerRatings: Record<string, { total: number; count: number }> = {};
      
      for (const rating of ratings) {
        if (!playerRatings[rating.ratedPlayerId]) {
          playerRatings[rating.ratedPlayerId] = { total: 0, count: 0 };
        }
        playerRatings[rating.ratedPlayerId].total += rating.rating;
        playerRatings[rating.ratedPlayerId].count += 1;
      }

      const topRatedPlayers = Object.entries(playerRatings)
        .map(([playerId, data]) => ({
          playerId,
          averageRating: data.total / data.count,
          totalRatings: data.count,
        }))
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      return {
        success: true,
        data: {
          totalRatings,
          averageRating,
          participationRate,
          topRatedPlayers,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Failed to get match rating summary',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if rater has completed ratings for match
   */
  async hasCompletedRatings(
    matchId: string,
    raterId: string,
    expectedRatedPlayers: string[]
  ): Promise<ApiResponse<{
    completed: boolean;
    ratedCount: number;
    expectedCount: number;
    missingPlayers: string[];
  }>> {
    try {
      const ratingsResult = await this.getRatingsByRater(matchId, raterId);
      
      if (!ratingsResult.success || !ratingsResult.data) {
        return {
          success: false,
          error: ratingsResult.error || {
            code: 'GET_RATINGS_ERROR',
            message: 'Failed to get rater ratings',
            statusCode: 500,
          },
        };
      }

      const ratings = ratingsResult.data;
      const ratedPlayerIds = new Set(ratings.map(r => r.ratedPlayerId));
      
      const missingPlayers = expectedRatedPlayers.filter(
        playerId => !ratedPlayerIds.has(playerId)
      );

      return {
        success: true,
        data: {
          completed: missingPlayers.length === 0,
          ratedCount: ratings.length,
          expectedCount: expectedRatedPlayers.length,
          missingPlayers,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_COMPLETED_ERROR',
          message: error.message || 'Failed to check if ratings completed',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get player's rating history (last N ratings received)
   */
  async getPlayerRatingHistory(
    ratedPlayerId: string,
    limit: number = 20
  ): Promise<ApiResponse<IMatchRating[]>> {
    return this.getAll({
      where: [{ field: 'ratedPlayerId', operator: '==', value: ratedPlayerId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Delete all ratings for a match (admin action)
   */
  async deleteMatchRatings(matchId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('matchRatings', 'deleteMatchRatings', { matchId });

      const ratingsResult = await this.getByMatch(matchId);
      
      if (!ratingsResult.success || !ratingsResult.data) {
        return {
          success: true,
          data: undefined,
        };
      }

      // Delete all ratings
      for (const rating of ratingsResult.data) {
        if (rating.id) {
          await this.delete(rating.id);
        }
      }

      ApiLogger.success('matchRatings', 'deleteMatchRatings', { 
        matchId, 
        count: ratingsResult.data.length 
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      ApiLogger.error('matchRatings', 'deleteMatchRatings', error);
      return {
        success: false,
        error: {
          code: 'DELETE_MATCH_RATINGS_ERROR',
          message: error.message || 'Failed to delete match ratings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const matchRatingAPI = new MatchRatingAPI();