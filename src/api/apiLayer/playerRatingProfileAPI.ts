// ============================================
// api/playerRatingProfileApi.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { IPlayerRatingProfile } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';

export class PlayerRatingProfileAPI extends BaseAPI<IPlayerRatingProfile> {
    constructor() {
        super('playerRatingProfiles');
    }

    // ============================================
    // SPECIALIZED QUERIES
    // ============================================

    /**
     * Get global rating profile (all leagues, all seasons)
     */
    async getGlobalProfile(playerId: string): Promise<ApiResponse<IPlayerRatingProfile | null>> {
        const result = await this.getAll({
            where: [
                { field: 'playerId', operator: '==', value: playerId },
                { field: 'leagueId', operator: '==', value: null },
                { field: 'seasonId', operator: '==', value: null },
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
     * Get league-specific rating profile
     */
    async getLeagueProfile(
        playerId: string,
        leagueId: string
    ): Promise<ApiResponse<IPlayerRatingProfile | null>> {
        const result = await this.getAll({
            where: [
                { field: 'playerId', operator: '==', value: playerId },
                { field: 'leagueId', operator: '==', value: leagueId },
                { field: 'seasonId', operator: '==', value: null },
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
     * Get season-specific rating profile
     */
    async getSeasonProfile(
        playerId: string,
        seasonId: string
    ): Promise<ApiResponse<IPlayerRatingProfile | null>> {
        const result = await this.getAll({
            where: [
                { field: 'playerId', operator: '==', value: playerId },
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
     * Get all rating profiles for a player
     */
    async getAllPlayerProfiles(playerId: string): Promise<ApiResponse<IPlayerRatingProfile[]>> {
        return this.getAll({
            where: [{ field: 'playerId', operator: '==', value: playerId }],
        });
    }

    /**
     * Get top rated players (global)
     */
    async getTopRated(limit: number = 10): Promise<ApiResponse<IPlayerRatingProfile[]>> {
        return this.getAll({
            where: [
                { field: 'leagueId', operator: '==', value: null },
                { field: 'seasonId', operator: '==', value: null },
            ],
            orderBy: [{ field: 'overall.overallRating', direction: 'desc' }],
            limit,
        });
    }

    /**
     * Get top rated players in a league
     */
    async getTopRatedInLeague(leagueId: string, limit: number = 10): Promise<ApiResponse<IPlayerRatingProfile[]>> {
        return this.getAll({
            where: [
                { field: 'leagueId', operator: '==', value: leagueId },
                { field: 'seasonId', operator: '==', value: null },
            ],
            orderBy: [{ field: 'league.overallRating', direction: 'desc' }],
            limit,
        });
    }

    /**
     * Get top rated players in a season
     */
    async getTopRatedInSeason(seasonId: string, limit: number = 10): Promise<ApiResponse<IPlayerRatingProfile[]>> {
        return this.getAll({
            where: [{ field: 'seasonId', operator: '==', value: seasonId }],
            orderBy: [{ field: 'league.overallRating', direction: 'desc' }],
            limit,
        });
    }

    /**
     * Get most MVPs (global)
     */
    async getMostMVPs(limit: number = 10): Promise<ApiResponse<IPlayerRatingProfile[]>> {
        return this.getAll({
            where: [
                { field: 'leagueId', operator: '==', value: null },
                { field: 'seasonId', operator: '==', value: null },
            ],
            orderBy: [{ field: 'overall.mvpCount', direction: 'desc' }],
            limit,
        });
    }

    /**
     * Get improving players (trending up)
     */
    async getImprovingPlayers(limit: number = 10): Promise<ApiResponse<IPlayerRatingProfile[]>> {
        try {
            const allProfilesResult = await this.getAll({
                where: [
                    { field: 'leagueId', operator: '==', value: null },
                    { field: 'seasonId', operator: '==', value: null },
                ],
                limit: 100,
            });

            if (!allProfilesResult.success || !allProfilesResult.data) {
                return allProfilesResult;
            }

            const improvingPlayers = allProfilesResult.data
                .filter((profile) => profile.ratingTrend === 'improving')
                .sort((a, b) => b.overall.overallRating - a.overall.overallRating)
                .slice(0, limit);

            return {
                success: true,
                data: improvingPlayers,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_IMPROVING_ERROR',
                    message: error.message || 'Failed to get improving players',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // PROFILE CREATION
    // ============================================

    /**
     * Create default global profile
     */
    async createGlobalProfile(playerId: string): Promise<ApiResponse<IPlayerRatingProfile>> {
        try {
            ApiLogger.log('playerRatingProfiles', 'createGlobalProfile', { playerId });

            const defaultProfile: Omit<IPlayerRatingProfile, 'id'> = {
                playerId,
                leagueId: undefined,
                seasonId: undefined,
                overall: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                league: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                friendly: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                ratingTrend: 'stable',
                lastFiveRatings: [],
                teammateRatings: {
                    average: 0,
                    count: 0,
                },
                opponentRatings: {
                    average: 0,
                    count: 0,
                },
                lastUpdated: new Date().toISOString(),
            };

            const result = await this.create(defaultProfile);

            ApiLogger.success('playerRatingProfiles', 'createGlobalProfile', { playerId });

            return result;
        } catch (error: any) {
            ApiLogger.error('playerRatingProfiles', 'createGlobalProfile', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_PROFILE_ERROR',
                    message: error.message || 'Failed to create global profile',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Create league profile
     */
    async createLeagueProfile(playerId: string, leagueId: string): Promise<ApiResponse<IPlayerRatingProfile>> {
        try {
            ApiLogger.log('playerRatingProfiles', 'createLeagueProfile', { playerId, leagueId });

            const defaultProfile: Omit<IPlayerRatingProfile, 'id'> = {
                playerId,
                leagueId,
                seasonId: undefined,
                overall: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                league: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                friendly: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                ratingTrend: 'stable',
                lastFiveRatings: [],
                teammateRatings: {
                    average: 0,
                    count: 0,
                },
                opponentRatings: {
                    average: 0,
                    count: 0,
                },
                lastUpdated: new Date().toISOString(),
            };

            const result = await this.create(defaultProfile);

            ApiLogger.success('playerRatingProfiles', 'createLeagueProfile', { playerId, leagueId });

            return result;
        } catch (error: any) {
            ApiLogger.error('playerRatingProfiles', 'createLeagueProfile', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_LEAGUE_PROFILE_ERROR',
                    message: error.message || 'Failed to create league profile',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Create season profile
     */
    async createSeasonProfile(
        playerId: string,
        leagueId: string,
        seasonId: string
    ): Promise<ApiResponse<IPlayerRatingProfile>> {
        try {
            ApiLogger.log('playerRatingProfiles', 'createSeasonProfile', { playerId, seasonId });

            const defaultProfile: Omit<IPlayerRatingProfile, 'id'> = {
                playerId,
                leagueId,
                seasonId,
                overall: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                league: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                friendly: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0,
                },
                ratingTrend: 'stable',
                lastFiveRatings: [],
                teammateRatings: {
                    average: 0,
                    count: 0,
                },
                opponentRatings: {
                    average: 0,
                    count: 0,
                },
                lastUpdated: new Date().toISOString(),
            };

            const result = await this.create(defaultProfile);

            ApiLogger.success('playerRatingProfiles', 'createSeasonProfile', { playerId, seasonId });

            return result;
        } catch (error: any) {
            ApiLogger.error('playerRatingProfiles', 'createSeasonProfile', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_SEASON_PROFILE_ERROR',
                    message: error.message || 'Failed to create season profile',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // UPDATE METHODS
    // ============================================

    /**
     * Update overall stats
     */
    async updateOverallStats(
        profileId: string,
        stats: Partial<IPlayerRatingProfile['overall']>
    ): Promise<ApiResponse<IPlayerRatingProfile>> {
        try {
            const profileResult = await this.getById(profileId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Rating profile not found',
                        statusCode: 404,
                    },
                };
            }

            const updatedOverall = {
                ...profileResult.data.overall,
                ...stats,
            };

            return this.update(profileId, {
                overall: updatedOverall,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerRatingProfile, 'id'>>);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_OVERALL_ERROR',
                    message: error.message || 'Failed to update overall stats',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update league stats
     */
    async updateLeagueStats(
        profileId: string,
        stats: Partial<IPlayerRatingProfile['league']>
    ): Promise<ApiResponse<IPlayerRatingProfile>> {
        try {
            const profileResult = await this.getById(profileId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Rating profile not found',
                        statusCode: 404,
                    },
                };
            }

            const updatedLeague = {
                ...profileResult.data.league,
                ...stats,
            };

            return this.update(profileId, {
                league: updatedLeague,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerRatingProfile, 'id'>>);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_LEAGUE_ERROR',
                    message: error.message || 'Failed to update league stats',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update friendly stats
     */
    async updateFriendlyStats(
        profileId: string,
        stats: Partial<IPlayerRatingProfile['friendly']>
    ): Promise<ApiResponse<IPlayerRatingProfile>> {
        try {
            const profileResult = await this.getById(profileId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Rating profile not found',
                        statusCode: 404,
                    },
                };
            }

            const updatedFriendly = {
                ...profileResult.data.friendly,
                ...stats,
            };

            return this.update(profileId, {
                friendly: updatedFriendly,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerRatingProfile, 'id'>>);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_FRIENDLY_ERROR',
                    message: error.message || 'Failed to update friendly stats',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update category averages
     */
    async updateCategoryAverages(
        profileId: string,
        categories: IPlayerRatingProfile['categoryAverages']
    ): Promise<ApiResponse<IPlayerRatingProfile>> {
        return this.update(profileId, {
            categoryAverages: categories,
            lastUpdated: new Date().toISOString(),
        } as Partial<Omit<IPlayerRatingProfile, 'id'>>);
    }

    /**
     * Update rating trend and last five ratings
     */
    async updateRatingTrend(
        profileId: string,
        trend: IPlayerRatingProfile['ratingTrend'],
        lastFiveRatings: number[]
    ): Promise<ApiResponse<IPlayerRatingProfile>> {
        return this.update(profileId, {
            ratingTrend: trend,
            lastFiveRatings: lastFiveRatings.slice(0, 5),
            lastUpdated: new Date().toISOString(),
        } as Partial<Omit<IPlayerRatingProfile, 'id'>>);
    }

    /**
     * Update teammate ratings
     */
    async updateTeammateRatings(
        profileId: string,
        ratings: IPlayerRatingProfile['teammateRatings']
    ): Promise<ApiResponse<IPlayerRatingProfile>> {
        return this.update(profileId, {
            teammateRatings: ratings,
            lastUpdated: new Date().toISOString(),
        } as Partial<Omit<IPlayerRatingProfile, 'id'>>);
    }

    /**
     * Update opponent ratings
     */
    async updateOpponentRatings(
        profileId: string,
        ratings: IPlayerRatingProfile['opponentRatings']
    ): Promise<ApiResponse<IPlayerRatingProfile>> {
        return this.update(profileId, {
            opponentRatings: ratings,
            lastUpdated: new Date().toISOString(),
        } as Partial<Omit<IPlayerRatingProfile, 'id'>>);
    }

    // ============================================
    // COMPARISON
    // ============================================

    /**
   * Compare two players' rating profiles
   */
    async comparePlayers(
        playerId1: string,
        playerId2: string
    ): Promise<ApiResponse<{
        player1: IPlayerRatingProfile | null;
        player2: IPlayerRatingProfile | null;
        comparison: {
            ratingDifference: number;
            mvpDifference: number;
            trendComparison: string;
        };
    }>> {
        try {
            const profile1Result = await this.getGlobalProfile(playerId1);
            const profile2Result = await this.getGlobalProfile(playerId2);

            if (!profile1Result.success || !profile2Result.success) {
                return {
                    success: false,
                    error: {
                        code: 'COMPARISON_ERROR',
                        message: 'Failed to get player profiles',
                        statusCode: 500,
                    },
                };
            }

            const player1 = profile1Result.data ?? null; // undefined'ı null'a çevir
            const player2 = profile2Result.data ?? null; // undefined'ı null'a çevir

            const comparison = {
                ratingDifference: player1 && player2
                    ? player1.overall.overallRating - player2.overall.overallRating
                    : 0,
                mvpDifference: player1 && player2
                    ? player1.overall.mvpCount - player2.overall.mvpCount
                    : 0,
                trendComparison: player1 && player2
                    ? `${player1.ratingTrend} vs ${player2.ratingTrend}`
                    : 'N/A',
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
                    message: error.message || 'Failed to compare players',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
}

// Export singleton instance
export const playerRatingProfileAPI = new PlayerRatingProfileAPI();