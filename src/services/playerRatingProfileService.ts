// services/playerRatingProfileService.ts

import { playerRatingProfileApi } from "../api/playerRatingProfileApi";
import { matchRatingApi } from "../api/matchRatingApi";
import { matchApi } from "../api/matchApi"; // ✅ Direkt API kullan
import {
    IPlayerRatingProfile,
    IResponseBase,
    calculateRatingTrend,
    hasEnoughRatings
} from "../types/types";

export const playerRatingProfileService = {
    // ============================================
    // BASIC CRUD OPERATIONS
    // ============================================

    async add(profileData: IPlayerRatingProfile): Promise<IResponseBase> {
        try {
            const response = await playerRatingProfileApi.add({
                ...profileData,
                id: undefined,
                lastUpdated: new Date().toISOString()
            });
            return response as IResponseBase;
        } catch (err) {
            console.error("add PlayerRatingProfile hatası:", err);
            return { success: false, id: null };
        }
    },

    async update(id: string, updates: Partial<IPlayerRatingProfile>): Promise<IResponseBase> {
        try {
            const response = await playerRatingProfileApi.update(id, {
                ...updates,
                lastUpdated: new Date().toISOString()
            });
            return response as IResponseBase;
        } catch (err) {
            console.error("update PlayerRatingProfile hatası:", err);
            return { success: false, id: null };
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            const response = await playerRatingProfileApi.delete(id);
            return response.success;
        } catch (err) {
            console.error("delete PlayerRatingProfile hatası:", err);
            return false;
        }
    },

    async getById(id: string): Promise<IPlayerRatingProfile | null> {
        try {
            const data: any = await playerRatingProfileApi.getById(id);
            if (!data) return null;
            return this.mapProfile(data);
        } catch (err) {
            console.error("getById PlayerRatingProfile hatası:", err);
            return null;
        }
    },

    // ============================================
    // GET PROFILE METHODS
    // ============================================

    async getProfileByPlayerLeagueSeason(
        playerId: string, 
        leagueId: string, 
        seasonId: string
    ): Promise<IPlayerRatingProfile | null> {
        try {
            const data: any = await playerRatingProfileApi.getProfileByPlayerLeagueSeason(
                playerId,
                leagueId,
                seasonId
            );
            if (!data) return null;
            return this.mapProfile(data);
        } catch (err) {
            console.error("getProfileByPlayerLeagueSeason hatası:", err);
            return null;
        }
    },

    async getProfilesByPlayer(playerId: string): Promise<IPlayerRatingProfile[]> {
        try {
            const profiles = await playerRatingProfileApi.getProfilesByPlayer(playerId);
            return profiles.map(p => this.mapProfile(p));
        } catch (err) {
            console.error("getProfilesByPlayer hatası:", err);
            return [];
        }
    },

    async getProfilesByLeagueSeason(
        leagueId: string, 
        seasonId: string
    ): Promise<IPlayerRatingProfile[]> {
        try {
            const profiles = await playerRatingProfileApi.getProfilesByLeagueSeason(
                leagueId,
                seasonId
            );
            return profiles.map(p => this.mapProfile(p));
        } catch (err) {
            console.error("getProfilesByLeagueSeason hatası:", err);
            return [];
        }
    },

    // ============================================
    // INITIALIZE & UPDATE PROFILE
    // ============================================

    async initializeProfile(
        playerId: string,
        leagueId: string,
        seasonId: string
    ): Promise<IResponseBase | null> {
        try {
            // Check if profile already exists
            const existing = await this.getProfileByPlayerLeagueSeason(
                playerId,
                leagueId,
                seasonId
            );

            if (existing) {
                return { success: true, id: existing.id };
            }

            // Create new profile
            const profileData: IPlayerRatingProfile = {
                id: null,
                playerId,
                leagueId,
                seasonId,
                overallRating: 0,
                totalRatingsReceived: 0,
                categoryAverages: {
                    skill: 0,
                    teamwork: 0,
                    sportsmanship: 0,
                    effort: 0
                },
                mvpCount: 0,
                mvpRate: 0,
                ratingTrend: 'stable',
                lastFiveRatings: [],
                teammateRatings: {
                    average: 0,
                    count: 0
                },
                opponentRatings: {
                    average: 0,
                    count: 0
                },
                lastUpdated: new Date().toISOString()
            };

            return await this.add(profileData);
        } catch (err) {
            console.error("initializeProfile hatası:", err);
            return null;
        }
    },

    async updateProfileFromMatch(
        playerId: string,
        leagueId: string,
        seasonId: string,
        matchId: string
    ): Promise<boolean> {
        try {
            // Get or create profile
            let profile = await this.getProfileByPlayerLeagueSeason(playerId, leagueId, seasonId);
            
            if (!profile) {
                await this.initializeProfile(playerId, leagueId, seasonId);
                profile = await this.getProfileByPlayerLeagueSeason(playerId, leagueId, seasonId);
                if (!profile) return false;
            }

            // Get match ratings for this player
            const matchRatings = await matchRatingApi.getRatingsByMatch(matchId);
            const playerRatings = matchRatings.filter((r: any) => r.ratedPlayerId === playerId);

            if (playerRatings.length === 0) return false;

            // Calculate average rating for this match
            const matchAverage = playerRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / playerRatings.length;

            // Update totals
            const updatedProfile = { ...profile };
            updatedProfile.totalRatingsReceived += playerRatings.length;

            // Update overall rating (weighted average)
            const totalWeight = updatedProfile.totalRatingsReceived;
            const previousWeight = totalWeight - playerRatings.length;
            const previousTotal = updatedProfile.overallRating * previousWeight;
            const newTotal = previousTotal + (matchAverage * playerRatings.length);
            updatedProfile.overallRating = parseFloat((newTotal / totalWeight).toFixed(2));

            // Update last five ratings
            const lastFive = [...updatedProfile.lastFiveRatings, matchAverage];
            updatedProfile.lastFiveRatings = lastFive.slice(-5);

            // Update rating trend
            if (updatedProfile.lastFiveRatings.length >= 3) {
                updatedProfile.ratingTrend = calculateRatingTrend(updatedProfile.lastFiveRatings);
            }

            // Update category averages if available
            if (playerRatings.some((r: any) => r.categories)) {
                const categoryTotals = {
                    skill: 0,
                    teamwork: 0,
                    sportsmanship: 0,
                    effort: 0
                };
                let categoryCount = 0;

                playerRatings.forEach((r: any) => {
                    if (r.categories) {
                        categoryCount++;
                        if (r.categories.skill) categoryTotals.skill += r.categories.skill;
                        if (r.categories.teamwork) categoryTotals.teamwork += r.categories.teamwork;
                        if (r.categories.sportsmanship) categoryTotals.sportsmanship += r.categories.sportsmanship;
                        if (r.categories.effort) categoryTotals.effort += r.categories.effort;
                    }
                });

                if (categoryCount > 0) {
                    updatedProfile.categoryAverages = {
                        skill: parseFloat((categoryTotals.skill / categoryCount).toFixed(2)),
                        teamwork: parseFloat((categoryTotals.teamwork / categoryCount).toFixed(2)),
                        sportsmanship: parseFloat((categoryTotals.sportsmanship / categoryCount).toFixed(2)),
                        effort: parseFloat((categoryTotals.effort / categoryCount).toFixed(2))
                    };
                }
            }

            // ✅ Check if player was MVP in this match - Direkt API kullan
            const matchData: any = await matchApi.getById(matchId);
            if (matchData && matchData.playerIdOfMatchMVP === playerId) {
                updatedProfile.mvpCount += 1;
            }

            // Update MVP rate
            const totalMatches = await this.getPlayerMatchCount(playerId, leagueId, seasonId);
            if (totalMatches > 0) {
                updatedProfile.mvpRate = parseFloat(((updatedProfile.mvpCount / totalMatches) * 100).toFixed(2));
            }

            // Save updated profile
            const profileId = (profile as any).id;
            await this.update(profileId, updatedProfile);

            return true;
        } catch (err) {
            console.error("updateProfileFromMatch hatası:", err);
            return false;
        }
    },

    // ============================================
    // MVP MANAGEMENT
    // ============================================

    async updateMVPCount(
        playerId: string,
        leagueId: string,
        seasonId: string
    ): Promise<boolean> {
        try {
            const profile = await this.getProfileByPlayerLeagueSeason(playerId, leagueId, seasonId);
            if (!profile) return false;

            const updatedProfile = { ...profile };
            updatedProfile.mvpCount += 1;

            // Update MVP rate
            const totalMatches = await this.getPlayerMatchCount(playerId, leagueId, seasonId);
            if (totalMatches > 0) {
                updatedProfile.mvpRate = parseFloat(((updatedProfile.mvpCount / totalMatches) * 100).toFixed(2));
            }

            const profileId = (profile as any).id;
            await this.update(profileId, updatedProfile);

            return true;
        } catch (err) {
            console.error("updateMVPCount hatası:", err);
            return false;
        }
    },

    // ============================================
    // STATISTICS & RANKINGS
    // ============================================

    async getTopRatedPlayers(
        leagueId: string,
        seasonId: string,
        limit: number = 10
    ): Promise<IPlayerRatingProfile[]> {
        try {
            const profiles = await playerRatingProfileApi.getTopRatedPlayers(
                leagueId,
                seasonId,
                limit
            );
            return profiles.map(p => this.mapProfile(p));
        } catch (err) {
            console.error("getTopRatedPlayers hatası:", err);
            return [];
        }
    },

    async getMostImprovedPlayers(
        leagueId: string,
        seasonId: string,
        limit: number = 10
    ): Promise<IPlayerRatingProfile[]> {
        try {
            const profiles = await playerRatingProfileApi.getMostImprovedPlayers(
                leagueId,
                seasonId,
                limit
            );
            return profiles.map(p => this.mapProfile(p));
        } catch (err) {
            console.error("getMostImprovedPlayers hatası:", err);
            return [];
        }
    },

    async getMVPLeaders(
        leagueId: string,
        seasonId: string,
        limit: number = 10
    ): Promise<IPlayerRatingProfile[]> {
        try {
            const profiles = await playerRatingProfileApi.getMVPLeaders(
                leagueId,
                seasonId,
                limit
            );
            return profiles.map(p => this.mapProfile(p));
        } catch (err) {
            console.error("getMVPLeaders hatası:", err);
            return [];
        }
    },

    // ============================================
    // PLAYER COMPARISON
    // ============================================

    async comparePlayerRatings(
        player1Id: string,
        player2Id: string,
        leagueId: string,
        seasonId: string
    ) {
        try {
            const profile1 = await this.getProfileByPlayerLeagueSeason(player1Id, leagueId, seasonId);
            const profile2 = await this.getProfileByPlayerLeagueSeason(player2Id, leagueId, seasonId);

            if (!profile1 || !profile2) return null;

            return {
                player1: {
                    playerId: player1Id,
                    overallRating: profile1.overallRating,
                    totalRatings: profile1.totalRatingsReceived,
                    mvpCount: profile1.mvpCount,
                    trend: profile1.ratingTrend,
                    categories: profile1.categoryAverages
                },
                player2: {
                    playerId: player2Id,
                    overallRating: profile2.overallRating,
                    totalRatings: profile2.totalRatingsReceived,
                    mvpCount: profile2.mvpCount,
                    trend: profile2.ratingTrend,
                    categories: profile2.categoryAverages
                },
                comparison: {
                    ratingDifference: parseFloat((profile1.overallRating - profile2.overallRating).toFixed(2)),
                    mvpDifference: profile1.mvpCount - profile2.mvpCount,
                    betterPlayer: profile1.overallRating > profile2.overallRating ? player1Id : player2Id
                }
            };
        } catch (err) {
            console.error("comparePlayerRatings hatası:", err);
            return null;
        }
    },

    // ============================================
    // RATING ANALYSIS
    // ============================================

    async getPlayerRatingInsights(
        playerId: string,
        leagueId: string,
        seasonId: string
    ) {
        try {
            const profile = await this.getProfileByPlayerLeagueSeason(playerId, leagueId, seasonId);
            if (!profile) return null;

            const insights = {
                overallPerformance: this.getRatingLevel(profile.overallRating),
                consistency: this.getConsistencyLevel(profile.lastFiveRatings),
                trend: profile.ratingTrend,
                mvpStatus: this.getMVPStatus(profile.mvpRate),
                reliability: hasEnoughRatings(profile.totalRatingsReceived),
                strengths: this.getPlayerStrengths(profile.categoryAverages),
                improvements: this.getPlayerImprovements(profile.categoryAverages)
            };

            return insights;
        } catch (err) {
            console.error("getPlayerRatingInsights hatası:", err);
            return null;
        }
    },

    // ============================================
    // HELPER METHODS
    // ============================================

    async getPlayerMatchCount(
        playerId: string,
        leagueId: string,
        seasonId: string
    ): Promise<number> {
        try {
            // This would need to query matches collection
            // For now, we'll estimate based on ratings
            const ratings = await matchRatingApi.getRatingsByPlayerLeagueSeason(
                playerId,
                leagueId,
                seasonId
            );

            // Count unique matches
            const uniqueMatches = new Set(ratings.map((r: any) => r.matchId));
            return uniqueMatches.size;
        } catch (err) {
            console.error("getPlayerMatchCount hatası:", err);
            return 0;
        }
    },

    getRatingLevel(rating: number): string {
        if (rating >= 4.5) return 'Excellent';
        if (rating >= 4.0) return 'Very Good';
        if (rating >= 3.5) return 'Good';
        if (rating >= 3.0) return 'Average';
        if (rating >= 2.0) return 'Below Average';
        return 'Poor';
    },

    getConsistencyLevel(lastFiveRatings: number[]): string {
        if (lastFiveRatings.length < 3) return 'Insufficient Data';

        const variance = this.calculateVariance(lastFiveRatings);
        
        if (variance < 0.1) return 'Very Consistent';
        if (variance < 0.3) return 'Consistent';
        if (variance < 0.5) return 'Moderate';
        return 'Inconsistent';
    },

    getMVPStatus(mvpRate: number): string {
        if (mvpRate >= 30) return 'Elite';
        if (mvpRate >= 20) return 'Excellent';
        if (mvpRate >= 10) return 'Good';
        if (mvpRate >= 5) return 'Average';
        return 'Developing';
    },

    getPlayerStrengths(categories?: { skill?: number; teamwork?: number; sportsmanship?: number; effort?: number }): string[] {
        if (!categories) return [];

        const strengths: string[] = [];
        
        if (categories.skill && categories.skill >= 4.0) strengths.push('Technical Skill');
        if (categories.teamwork && categories.teamwork >= 4.0) strengths.push('Teamwork');
        if (categories.sportsmanship && categories.sportsmanship >= 4.0) strengths.push('Sportsmanship');
        if (categories.effort && categories.effort >= 4.0) strengths.push('Work Ethic');

        return strengths;
    },

    getPlayerImprovements(categories?: { skill?: number; teamwork?: number; sportsmanship?: number; effort?: number }): string[] {
        if (!categories) return [];

        const improvements: string[] = [];
        
        if (categories.skill && categories.skill < 3.5) improvements.push('Technical Skill');
        if (categories.teamwork && categories.teamwork < 3.5) improvements.push('Teamwork');
        if (categories.sportsmanship && categories.sportsmanship < 3.5) improvements.push('Sportsmanship');
        if (categories.effort && categories.effort < 3.5) improvements.push('Work Ethic');

        return improvements;
    },

    calculateVariance(numbers: number[]): number {
        if (numbers.length === 0) return 0;

        const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
        const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;

        return variance;
    },

    mapProfile(data: any): IPlayerRatingProfile {
        return {
            id: data.id,
            playerId: data.playerId,
            leagueId: data.leagueId,
            seasonId: data.seasonId,
            overallRating: data.overallRating || 0,
            totalRatingsReceived: data.totalRatingsReceived || 0,
            categoryAverages: data.categoryAverages || {},
            mvpCount: data.mvpCount || 0,
            mvpRate: data.mvpRate || 0,
            ratingTrend: data.ratingTrend || 'stable',
            lastFiveRatings: data.lastFiveRatings || [],
            teammateRatings: data.teammateRatings || { average: 0, count: 0 },
            opponentRatings: data.opponentRatings || { average: 0, count: 0 },
            lastUpdated: data.lastUpdated || new Date().toISOString()
        };
    }
};