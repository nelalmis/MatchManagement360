import { playerRatingProfileApi } from "../api/playerRatingProfileApi";
import { matchRatingApi } from "../api/matchRatingApi";
import { matchApi } from "../api/matchApi";
import {
    IPlayerRatingProfile,
    MatchType,
    calculateRatingTrend,
    hasEnoughRatings
} from "../types/types";
import { IResponseBase } from "../types/base/baseTypes";

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

    /**
     * Initialize profile with friendly support
     * UPDATED: Now includes overall, league, and friendly objects
     */
    async initializeProfile(
        playerId: string,
        leagueId: string,
        seasonId: string
    ): Promise<IResponseBase | null> {
        try {
            const existing = await this.getProfileByPlayerLeagueSeason(
                playerId,
                leagueId,
                seasonId
            );

            if (existing) {
                return { success: true, id: existing.id };
            }

            const profileData: IPlayerRatingProfile = {
                id: null,
                playerId,
                leagueId,
                seasonId,
                // Overall stats (all matches combined)
                overall: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0
                },
                // League match stats
                league: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0
                },
                // Friendly match stats
                friendly: {
                    overallRating: 0,
                    totalRatingsReceived: 0,
                    mvpCount: 0,
                    mvpRate: 0
                },
                // Legacy fields (overall stats)
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

    /**
     * Update profile from match (supports League and Friendly)
     * UPDATED: Now updates appropriate stats based on match type
     */
    async updateProfileFromMatch(
        playerId: string,
        leagueId: string,
        seasonId: string,
        matchId: string
    ): Promise<boolean> {
        try {
            let profile = await this.getProfileByPlayerLeagueSeason(playerId, leagueId, seasonId);
            
            if (!profile) {
                await this.initializeProfile(playerId, leagueId, seasonId);
                profile = await this.getProfileByPlayerLeagueSeason(playerId, leagueId, seasonId);
                if (!profile) return false;
            }

            // Get match data to determine type
            const matchData: any = await matchApi.getById(matchId);
            if (!matchData) return false;

            const matchType = matchData.type || MatchType.LEAGUE;
            const isFriendlyMatch = matchType === MatchType.FRIENDLY;

            // Get match ratings for this player
            const matchRatings = await matchRatingApi.getRatingsByMatch(matchId);
            const playerRatings = matchRatings.filter((r: any) => r.ratedPlayerId === playerId);

            if (playerRatings.length === 0) return false;

            // Calculate average rating for this match
            const matchAverage = playerRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / playerRatings.length;

            const updatedProfile: any = { ...profile };

            // Initialize objects if needed
            if (!updatedProfile.overall) {
                updatedProfile.overall = { overallRating: 0, totalRatingsReceived: 0, mvpCount: 0, mvpRate: 0 };
            }
            if (!updatedProfile.league) {
                updatedProfile.league = { overallRating: 0, totalRatingsReceived: 0, mvpCount: 0, mvpRate: 0 };
            }
            if (!updatedProfile.friendly) {
                updatedProfile.friendly = { overallRating: 0, totalRatingsReceived: 0, mvpCount: 0, mvpRate: 0 };
            }

            // Update appropriate stats based on match type
            if (isFriendlyMatch) {
                // Update friendly stats
                const friendlyTotal = updatedProfile.friendly.totalRatingsReceived + playerRatings.length;
                const friendlyPreviousTotal = updatedProfile.friendly.overallRating * updatedProfile.friendly.totalRatingsReceived;
                const friendlyNewTotal = friendlyPreviousTotal + (matchAverage * playerRatings.length);
                
                updatedProfile.friendly.overallRating = parseFloat((friendlyNewTotal / friendlyTotal).toFixed(2));
                updatedProfile.friendly.totalRatingsReceived = friendlyTotal;
            } else {
                // Update league stats
                const leagueTotal = updatedProfile.league.totalRatingsReceived + playerRatings.length;
                const leaguePreviousTotal = updatedProfile.league.overallRating * updatedProfile.league.totalRatingsReceived;
                const leagueNewTotal = leaguePreviousTotal + (matchAverage * playerRatings.length);
                
                updatedProfile.league.overallRating = parseFloat((leagueNewTotal / leagueTotal).toFixed(2));
                updatedProfile.league.totalRatingsReceived = leagueTotal;
            }

            // Always update overall stats
            const overallTotal = updatedProfile.overall.totalRatingsReceived + playerRatings.length;
            const overallPreviousTotal = updatedProfile.overall.overallRating * updatedProfile.overall.totalRatingsReceived;
            const overallNewTotal = overallPreviousTotal + (matchAverage * playerRatings.length);
            
            updatedProfile.overall.overallRating = parseFloat((overallNewTotal / overallTotal).toFixed(2));
            updatedProfile.overall.totalRatingsReceived = overallTotal;

            // Update legacy fields (overall stats)
            updatedProfile.overallRating = updatedProfile.overall.overallRating;
            updatedProfile.totalRatingsReceived = updatedProfile.overall.totalRatingsReceived;

            // Update last five ratings
            const lastFive = [...updatedProfile.lastFiveRatings, matchAverage];
            updatedProfile.lastFiveRatings = lastFive.slice(-5);

            // Update rating trend
            if (updatedProfile.lastFiveRatings.length >= 3) {
                updatedProfile.ratingTrend = calculateRatingTrend(updatedProfile.lastFiveRatings);
            }

            // Update category averages
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

            // Check if player was MVP
            if (matchData.playerIdOfMatchMVP === playerId) {
                if (isFriendlyMatch) {
                    updatedProfile.friendly.mvpCount += 1;
                } else {
                    updatedProfile.league.mvpCount += 1;
                }
                updatedProfile.overall.mvpCount += 1;
                updatedProfile.mvpCount = updatedProfile.overall.mvpCount; // Legacy field
            }

            // Update MVP rates
            const totalMatches = await this.getPlayerMatchCount(playerId, leagueId, seasonId);
            if (totalMatches > 0) {
                updatedProfile.overall.mvpRate = parseFloat(((updatedProfile.overall.mvpCount / totalMatches) * 100).toFixed(2));
                updatedProfile.mvpRate = updatedProfile.overall.mvpRate; // Legacy field
            }

            // Calculate league/friendly specific MVP rates
            const leagueMatches = await this.getPlayerMatchCountByType(playerId, leagueId, seasonId, MatchType.LEAGUE);
            if (leagueMatches > 0) {
                updatedProfile.league.mvpRate = parseFloat(((updatedProfile.league.mvpCount / leagueMatches) * 100).toFixed(2));
            }

            const friendlyMatches = await this.getPlayerMatchCountByType(playerId, leagueId, seasonId, MatchType.FRIENDLY);
            if (friendlyMatches > 0) {
                updatedProfile.friendly.mvpRate = parseFloat(((updatedProfile.friendly.mvpCount / friendlyMatches) * 100).toFixed(2));
            }

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
        seasonId: string,
        matchType: MatchType = MatchType.LEAGUE
    ): Promise<boolean> {
        try {
            const profile = await this.getProfileByPlayerLeagueSeason(playerId, leagueId, seasonId);
            if (!profile) return false;

            const updatedProfile: any = { ...profile };

            // Initialize if needed
            if (!updatedProfile.overall) {
                updatedProfile.overall = { overallRating: 0, totalRatingsReceived: 0, mvpCount: 0, mvpRate: 0 };
            }
            if (!updatedProfile.league) {
                updatedProfile.league = { overallRating: 0, totalRatingsReceived: 0, mvpCount: 0, mvpRate: 0 };
            }
            if (!updatedProfile.friendly) {
                updatedProfile.friendly = { overallRating: 0, totalRatingsReceived: 0, mvpCount: 0, mvpRate: 0 };
            }

            // Update MVP count
            if (matchType === MatchType.FRIENDLY) {
                updatedProfile.friendly.mvpCount += 1;
            } else {
                updatedProfile.league.mvpCount += 1;
            }
            updatedProfile.overall.mvpCount += 1;
            updatedProfile.mvpCount = updatedProfile.overall.mvpCount;

            // Update MVP rates
            const totalMatches = await this.getPlayerMatchCount(playerId, leagueId, seasonId);
            if (totalMatches > 0) {
                updatedProfile.overall.mvpRate = parseFloat(((updatedProfile.overall.mvpCount / totalMatches) * 100).toFixed(2));
                updatedProfile.mvpRate = updatedProfile.overall.mvpRate;
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
    // NEW: FRIENDLY MATCH METHODS (Use API)
    // ============================================

    async getTopFriendlyRatedPlayers(leagueId: string, seasonId: string, limit: number = 10) {
        try {
            return await playerRatingProfileApi.getTopFriendlyRatedPlayers(leagueId, seasonId, limit);
        } catch (err) {
            console.error("getTopFriendlyRatedPlayers hatası:", err);
            return [];
        }
    },

    async getTopLeagueRatedPlayers(leagueId: string, seasonId: string, limit: number = 10) {
        try {
            return await playerRatingProfileApi.getTopLeagueRatedPlayers(leagueId, seasonId, limit);
        } catch (err) {
            console.error("getTopLeagueRatedPlayers hatası:", err);
            return [];
        }
    },

    async getPlayerRatingComparison(playerId: string, leagueId: string, seasonId: string) {
        try {
            return await playerRatingProfileApi.getPlayerRatingComparison(playerId, leagueId, seasonId);
        } catch (err) {
            console.error("getPlayerRatingComparison hatası:", err);
            return null;
        }
    },

    async getMVPLeadersByType(
        leagueId: string,
        seasonId: string,
        matchType: 'overall' | 'league' | 'friendly',
        limit: number = 10
    ) {
        try {
            return await playerRatingProfileApi.getMVPLeadersByType(leagueId, seasonId, matchType, limit);
        } catch (err) {
            console.error("getMVPLeadersByType hatası:", err);
            return [];
        }
    },

    async getRatingSummary(leagueId: string, seasonId: string) {
        try {
            return await playerRatingProfileApi.getRatingSummary(leagueId, seasonId);
        } catch (err) {
            console.error("getRatingSummary hatası:", err);
            return null;
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
                    overall: profile1.overall,
                    league: profile1.league,
                    friendly: profile1.friendly,
                    trend: profile1.ratingTrend,
                    categories: profile1.categoryAverages
                },
                player2: {
                    playerId: player2Id,
                    overall: profile2.overall,
                    league: profile2.league,
                    friendly: profile2.friendly,
                    trend: profile2.ratingTrend,
                    categories: profile2.categoryAverages
                },
                comparison: {
                    overallRatingDiff: parseFloat(((profile1.overall?.overallRating || 0) - (profile2.overall?.overallRating || 0)).toFixed(2)),
                    leagueRatingDiff: parseFloat(((profile1.league?.overallRating || 0) - (profile2.league?.overallRating || 0)).toFixed(2)),
                    friendlyRatingDiff: parseFloat(((profile1.friendly?.overallRating || 0) - (profile2.friendly?.overallRating || 0)).toFixed(2)),
                    mvpDiff: (profile1.mvpCount || 0) - (profile2.mvpCount || 0),
                    betterOverall: (profile1.overall?.overallRating || 0) > (profile2.overall?.overallRating || 0) ? player1Id : player2Id
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
                leaguePerformance: this.getRatingLevel(profile.league?.overallRating || 0),
                friendlyPerformance: this.getRatingLevel(profile.friendly?.overallRating || 0),
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
            const ratings = await matchRatingApi.getRatingsByPlayerLeagueSeason(
                playerId,
                leagueId,
                seasonId
            );

            const uniqueMatches = new Set(ratings.map((r: any) => r.matchId));
            return uniqueMatches.size;
        } catch (err) {
            console.error("getPlayerMatchCount hatası:", err);
            return 0;
        }
    },

    async getPlayerMatchCountByType(
        playerId: string,
        leagueId: string,
        seasonId: string,
        matchType: MatchType
    ): Promise<number> {
        try {
            const ratings = await matchRatingApi.getRatingsByPlayerLeagueSeason(
                playerId,
                leagueId,
                seasonId
            );

            // Filter by match type
            const filteredRatings = ratings.filter((r: any) => r.matchType === matchType);
            const uniqueMatches = new Set(filteredRatings.map((r: any) => r.matchId));
            return uniqueMatches.size;
        } catch (err) {
            console.error("getPlayerMatchCountByType hatası:", err);
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
            // New grouped stats
            overall: data.overall || {
                overallRating: data.overallRating || 0,
                totalRatingsReceived: data.totalRatingsReceived || 0,
                mvpCount: data.mvpCount || 0,
                mvpRate: data.mvpRate || 0
            },
            league: data.league || {
                overallRating: 0,
                totalRatingsReceived: 0,
                mvpCount: 0,
                mvpRate: 0
            },
            friendly: data.friendly || {
                overallRating: 0,
                totalRatingsReceived: 0,
                mvpCount: 0,
                mvpRate: 0
            },
            // Legacy fields
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