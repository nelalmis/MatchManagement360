// services/matchRatingService.ts

import { matchRatingApi } from "../api/matchRatingApi";
import { matchApi } from "../api/matchApi";
import {
    IMatchRating,
    IResponseBase,
    calculateMVP,
    calculatePlayerAverageRating,
    calculateRatingTrend,
    hasEnoughRatings
} from "../types/types";

export const matchRatingService = {
    // ============================================
    // BASIC CRUD OPERATIONS
    // ============================================

    async add(ratingData: IMatchRating): Promise<IResponseBase> {
        try {
            // Check if rating already exists
            const existing = await matchRatingApi.getRatingByMatchRaterAndPlayer(
                ratingData.matchId,
                ratingData.raterId,
                ratingData.ratedPlayerId
            );

            if (existing) {
                return {
                    success: false,
                    id: null
                };
            }

            const response = await matchRatingApi.add({
                ...ratingData,
                id: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            return response as IResponseBase;
        } catch (err) {
            console.error("add Rating hatası:", err);
            return { success: false, id: null };
        }
    },

    async update(id: string, updates: Partial<IMatchRating>): Promise<IResponseBase> {
        try {
            const response = await matchRatingApi.update(id, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            return response as IResponseBase;
        } catch (err) {
            console.error("update Rating hatası:", err);
            return { success: false, id: null };
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            const response = await matchRatingApi.delete(id);
            return response.success;
        } catch (err) {
            console.error("delete Rating hatası:", err);
            return false;
        }
    },

    async getById(id: string): Promise<IMatchRating | null> {
        try {
            const data: any = await matchRatingApi.getById(id);
            if (!data) return null;
            return this.mapRating(data);
        } catch (err) {
            console.error("getById Rating hatası:", err);
            return null;
        }
    },

    // ============================================
    // RATING SUBMISSION (For Players)
    // ============================================

    async submitMatchRatings(
        matchId: string,
        raterId: string,
        ratings: Array<{ playerId: string; rating: number; comment?: string }>
    ): Promise<{ success: boolean; message: string }> {
        try {
            let successCount = 0;
            let errorCount = 0;

            for (const ratingData of ratings) {
                const ratingObj: IMatchRating = {
                    id: null,
                    matchId,
                    raterId,
                    ratedPlayerId: ratingData.playerId,
                    rating: ratingData.rating,
                    comment: ratingData.comment,
                    isAnonymous: true,
                    createdAt: new Date().toISOString()
                };

                const result = await this.add(ratingObj);
                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            }

            if (errorCount === 0) {
                return {
                    success: true,
                    message: `${successCount} oyuncu başarıyla puanlandı`
                };
            } else {
                return {
                    success: false,
                    message: `${successCount} başarılı, ${errorCount} başarısız`
                };
            }
        } catch (err) {
            console.error("submitMatchRatings hatası:", err);
            return {
                success: false,
                message: 'Puanlama kaydedilemedi'
            };
        }
    },

    // ============================================
    // MVP CALCULATION
    // ============================================

    async calculateAndSetMVP(matchId: string): Promise<string | null> {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            if (ratings.length === 0) return null;

            const mappedRatings = ratings.map(r => this.mapRating(r));
            const mvpPlayerId = calculateMVP(mappedRatings);

            if (mvpPlayerId) {
                // Update match with MVP
                await matchApi.update(matchId, {
                    playerIdOfMatchMVP: mvpPlayerId,
                    mvpCalculatedAt: new Date().toISOString(),
                    mvpAutoCalculated: true
                });
            }

            return mvpPlayerId;
        } catch (err) {
            console.error("calculateAndSetMVP hatası:", err);
            return null;
        }
    },

    // ============================================
    // RATING STATISTICS
    // ============================================

    async getMatchRatingsSummary(matchId: string) {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);

            if (ratings.length === 0) {
                return {
                    totalRatings: 0,
                    averageRating: 0,
                    participationRate: 0,
                    topRatedPlayers: []
                };
            }

            // Calculate player averages
            const playerRatings: Record<string, { total: number; count: number }> = {};

            ratings.forEach((rating: any) => {
                if (!playerRatings[rating.ratedPlayerId]) {
                    playerRatings[rating.ratedPlayerId] = { total: 0, count: 0 };
                }
                playerRatings[rating.ratedPlayerId].total += rating.rating;
                playerRatings[rating.ratedPlayerId].count += 1;
            });

            // Get top rated players
            const topRatedPlayers = Object.keys(playerRatings)
                .map(playerId => ({
                    playerId,
                    averageRating: playerRatings[playerId].total / playerRatings[playerId].count,
                    ratingsReceived: playerRatings[playerId].count
                }))
                .sort((a, b) => b.averageRating - a.averageRating)
                .slice(0, 5);

            // Calculate overall average
            const totalRatingSum = ratings.reduce((sum: number, r: any) => sum + r.rating, 0);
            const averageRating = totalRatingSum / ratings.length;

            // Get unique raters count
            const uniqueRaters = new Set(ratings.map((r: any) => r.raterId));

            return {
                totalRatings: ratings.length,
                averageRating: parseFloat(averageRating.toFixed(2)),
                participationRate: uniqueRaters.size,
                topRatedPlayers
            };
        } catch (err) {
            console.error("getMatchRatingsSummary hatası:", err);
            return {
                totalRatings: 0,
                averageRating: 0,
                participationRate: 0,
                topRatedPlayers: []
            };
        }
    },

    async updateMatchRatingsSummary(matchId: string): Promise<boolean> {
        try {
            const summary = await this.getMatchRatingsSummary(matchId);

            await matchApi.update(matchId, {
                ratingsSummary: summary
            });

            return true;
        } catch (err) {
            console.error("updateMatchRatingsSummary hatası:", err);
            return false;
        }
    },

    // ============================================
    // PLAYER RATING ANALYTICS
    // ============================================

    async getPlayerAverageRating(playerId: string, matchId: string): Promise<number> {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            const mappedRatings = ratings.map(r => this.mapRating(r));

            return calculatePlayerAverageRating(mappedRatings, playerId);
        } catch (err) {
            console.error("getPlayerAverageRating hatası:", err);
            return 0;
        }
    },

    async getPlayerRatingHistory(playerId: string, leagueId: string, seasonId: string) {
        try {
            const ratings = await matchRatingApi.getRatingsByPlayerLeagueSeason(
                playerId,
                leagueId,
                seasonId
            );

            // Group by match
            const matchRatings: Record<string, { ratings: number[]; date: string }> = {};

            ratings.forEach((rating: any) => {
                if (!matchRatings[rating.matchId]) {
                    matchRatings[rating.matchId] = {
                        ratings: [],
                        date: rating.createdAt
                    };
                }
                matchRatings[rating.matchId].ratings.push(rating.rating);
            });

            // Calculate averages
            const history = Object.keys(matchRatings).map(matchId => {
                const { ratings: matchRatingList, date } = matchRatings[matchId];
                const average = matchRatingList.reduce((a, b) => a + b, 0) / matchRatingList.length;

                return {
                    matchId,
                    averageRating: parseFloat(average.toFixed(2)),
                    ratingsCount: matchRatingList.length,
                    date
                };
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            return history;
        } catch (err) {
            console.error("getPlayerRatingHistory hatası:", err);
            return [];
        }
    },

    async calculatePlayerRatingTrend(playerId: string, leagueId: string, seasonId: string) {
        try {
            const history = await this.getPlayerRatingHistory(playerId, leagueId, seasonId);

            if (history.length < 3) {
                return 'stable';
            }

            // Get last 5 matches
            const lastFive = history.slice(-5).map(h => h.averageRating);

            return calculateRatingTrend(lastFive);
        } catch (err) {
            console.error("calculatePlayerRatingTrend hatası:", err);
            return 'stable';
        }
    },

    // ============================================
    // RATING VALIDATION & CHECKS
    // ============================================

    async hasPlayerRatedMatch(matchId: string, raterId: string): Promise<boolean> {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            return ratings.some((r: any) => r.raterId === raterId);
        } catch (err) {
            console.error("hasPlayerRatedMatch hatası:", err);
            return false;
        }
    },

    async getRatingProgress(matchId: string, totalPlayers: number) {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            const uniqueRaters = new Set(ratings.map((r: any) => r.raterId));

            return {
                ratedCount: uniqueRaters.size,
                totalCount: totalPlayers,
                percentage: totalPlayers > 0 ? (uniqueRaters.size / totalPlayers) * 100 : 0,
                isComplete: uniqueRaters.size === totalPlayers
            };
        } catch (err) {
            console.error("getRatingProgress hatası:", err);
            return {
                ratedCount: 0,
                totalCount: totalPlayers,
                percentage: 0,
                isComplete: false
            };
        }
    },

    // ============================================
    // CATEGORY RATINGS (Optional)
    // ============================================

    async getPlayerCategoryRatings(playerId: string, matchId: string) {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            const playerRatings = ratings
                .map(r => this.mapRating(r))
                .filter(r => r.ratedPlayerId === playerId);

            if (playerRatings.length === 0) {
                return null;
            }

            // Calculate category averages if categories exist
            const categories = {
                skill: 0,
                teamwork: 0,
                sportsmanship: 0,
                effort: 0
            };

            let hasCategories = false;
            let count = 0;

            playerRatings.forEach(rating => {
                if (rating.categories) {
                    hasCategories = true;
                    count++;
                    if (rating.categories.skill) categories.skill += rating.categories.skill;
                    if (rating.categories.teamwork) categories.teamwork += rating.categories.teamwork;
                    if (rating.categories.sportsmanship) categories.sportsmanship += rating.categories.sportsmanship;
                    if (rating.categories.effort) categories.effort += rating.categories.effort;
                }
            });

            if (!hasCategories) return null;

            return {
                skill: parseFloat((categories.skill / count).toFixed(2)),
                teamwork: parseFloat((categories.teamwork / count).toFixed(2)),
                sportsmanship: parseFloat((categories.sportsmanship / count).toFixed(2)),
                effort: parseFloat((categories.effort / count).toFixed(2))
            };
        } catch (err) {
            console.error("getPlayerCategoryRatings hatası:", err);
            return null;
        }
    },

    // ============================================
    // RATINGS BY MATCH
    // ============================================

    async getRatingsByMatch(matchId: string): Promise<IMatchRating[]> {
        try {
            const ratings = await matchRatingApi.getRatingsByMatch(matchId);
            return ratings.map(r => this.mapRating(r));
        } catch (err) {
            console.error("getRatingsByMatch hatası:", err);
            return [];
        }
    },

    async getRatingsByRater(raterId: string): Promise<IMatchRating[]> {
        try {
            const ratings = await matchRatingApi.getRatingsByRater(raterId);
            return ratings.map(r => this.mapRating(r));
        } catch (err) {
            console.error("getRatingsByRater hatası:", err);
            return [];
        }
    },

    async getRatingsByPlayer(playerId: string): Promise<IMatchRating[]> {
        try {
            const ratings = await matchRatingApi.getRatingsByRatedPlayer(playerId);
            return ratings.map(r => this.mapRating(r));
        } catch (err) {
            console.error("getRatingsByPlayer hatası:", err);
            return [];
        }
    },

    // ============================================
    // HELPER METHODS
    // ============================================

    mapRating(data: any): IMatchRating {
        return {
            id: data.id,
            matchId: data.matchId,
            raterId: data.raterId,
            ratedPlayerId: data.ratedPlayerId,
            rating: data.rating,
            categories: data.categories,
            comment: data.comment,
            isAnonymous: data.isAnonymous ?? true,
            leagueId: data.leagueId,
            seasonId: data.seasonId,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        };
    }
};