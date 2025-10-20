// ============================================
// api/standingsApi.ts - UPDATED FOR YOUR TYPE
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { IStandings } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';

export class StandingsAPI extends BaseAPI<IStandings> {
    constructor() {
        super('standings');
    }

    // ============================================
    // SPECIALIZED QUERIES
    // ============================================

    /**
     * Get standings by season
     */
    async getBySeason(seasonId: string): Promise<ApiResponse<IStandings | null>> {
        const result = await this.getAll({
            where: [{ field: 'seasonId', operator: '==', value: seasonId }],
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
     * Get standings by league
     */
    async getByLeague(leagueId: string): Promise<ApiResponse<IStandings[]>> {
        return this.getAll({
            where: [{ field: 'leagueId', operator: '==', value: leagueId }],
            orderBy: [{ field: 'lastUpdated', direction: 'desc' }],
        });
    }

    // ============================================
    // STANDINGS MANAGEMENT
    // ============================================

    /**
     * Update player standing (league stats)
     */
    async updatePlayerStanding(
        standingsId: string,
        playerId: string,
        playerName: string,
        updates: {
            league?: Partial<IStandings['standings'][0]['league']>;
            friendly?: Partial<IStandings['standings'][0]['friendly']>;
            performance?: Partial<IStandings['standings'][0]['performance']>;
        }
    ): Promise<ApiResponse<IStandings>> {
        try {
            ApiLogger.log('standings', 'updatePlayerStanding', { standingsId, playerId });

            const standingsResult = await this.getById(standingsId);

            if (!standingsResult.success || !standingsResult.data) {
                return {
                    success: false,
                    error: standingsResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Standings not found',
                        statusCode: 404,
                    },
                };
            }

            const standings = standingsResult.data;
            const entries = standings.standings || [];

            // Find player entry
            const playerIndex = entries.findIndex(e => e.playerId === playerId);

            let updatedEntries: IStandings['standings'];

            if (playerIndex >= 0) {
                // Update existing entry
                updatedEntries = [...entries];
                const currentEntry = updatedEntries[playerIndex];

                // Helper to ensure friendly exists
                const ensureFriendly = (friendly?: IStandings['standings'][0]['friendly']) => {
                    return friendly || {
                        played: 0,
                        won: 0,
                        drawn: 0,
                        lost: 0,
                        goals: 0,
                        assists: 0,
                    };
                };

                // Then use it:
                updatedEntries[playerIndex] = {
                    ...currentEntry,
                    playerName, // Update cached name
                    league: updates.league ? { ...currentEntry.league, ...updates.league } : currentEntry.league,
                    friendly: updates.friendly
                        ? { ...ensureFriendly(currentEntry.friendly), ...updates.friendly }
                        : ensureFriendly(currentEntry.friendly),
                    performance: updates.performance ? { ...currentEntry.performance, ...updates.performance } : currentEntry.performance,
                };
            } else {
                // Create new entry
                const newEntry: IStandings['standings'][0] = {
                    playerId,
                    playerName,
                    league: {
                        played: 0,
                        won: 0,
                        drawn: 0,
                        lost: 0,
                        goals: 0,
                        goalsAgainst: 0,
                        goalDifference: 0,
                        assists: 0,
                        points: 0,
                        ...updates.league,
                    },
                    friendly: {  // ✅ Always set friendly as object, not undefined
                        played: 0,
                        won: 0,
                        drawn: 0,
                        lost: 0,
                        goals: 0,
                        assists: 0,
                        ...(updates.friendly || {}),
                    },
                    performance: {
                        rating: 0,
                        totalRatingsReceived: 0,
                        mvpCount: 0,
                        mvpRate: 0,
                        attendanceRate: 0,
                        form: '',
                        ratingTrend: 'stable',
                        ...updates.performance,
                    },
                };
                updatedEntries = [...entries, newEntry];
            }

            // Sort by league points, then goal difference
            updatedEntries.sort((a, b) => {
                if (b.league.points !== a.league.points) {
                    return b.league.points - a.league.points;
                }
                if (b.league.goalDifference !== a.league.goalDifference) {
                    return b.league.goalDifference - a.league.goalDifference;
                }
                return b.league.goals - a.league.goals;
            });

            const result = await this.update(standingsId, {
                standings: updatedEntries,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IStandings, 'id'>>);

            ApiLogger.success('standings', 'updatePlayerStanding', { standingsId, playerId });

            return result;
        } catch (error: any) {
            ApiLogger.error('standings', 'updatePlayerStanding', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_STANDING_ERROR',
                    message: error.message || 'Failed to update player standing',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update standings after league match
     */
    async updateAfterLeagueMatch(
        standingsId: string,
        matchUpdates: Array<{
            playerId: string;
            playerName: string;
            won: boolean;
            drawn: boolean;
            lost: boolean;
            goals: number;
            goalsAgainst: number;
            assists: number;
            points: number; // Based on win/draw/loss
            form: 'W' | 'D' | 'L';
            rating?: number;
            isMVP?: boolean;
        }>
    ): Promise<ApiResponse<IStandings>> {
        try {
            ApiLogger.log('standings', 'updateAfterLeagueMatch', { standingsId, count: matchUpdates.length });

            const standingsResult = await this.getById(standingsId);

            if (!standingsResult.success || !standingsResult.data) {
                return {
                    success: false,
                    error: standingsResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Standings not found',
                        statusCode: 404,
                    },
                };
            }

            const standings = standingsResult.data;
            let entries = standings.standings || [];

            // Update each player
            for (const update of matchUpdates) {
                const playerIndex = entries.findIndex(e => e.playerId === update.playerId);

                if (playerIndex >= 0) {
                    const entry = entries[playerIndex];

                    // Update league stats
                    const updatedLeague = {
                        ...entry.league,
                        played: entry.league.played + 1,
                        won: entry.league.won + (update.won ? 1 : 0),
                        drawn: entry.league.drawn + (update.drawn ? 1 : 0),
                        lost: entry.league.lost + (update.lost ? 1 : 0),
                        goals: entry.league.goals + update.goals,
                        goalsAgainst: entry.league.goalsAgainst + update.goalsAgainst,
                        goalDifference: (entry.league.goals + update.goals) - (entry.league.goalsAgainst + update.goalsAgainst),
                        assists: entry.league.assists + update.assists,
                        points: entry.league.points + update.points,
                    };

                    // Update form (keep last 5)
                    const newForm = (entry.performance.form + update.form).slice(-5);

                    // Calculate rating trend
                    let ratingTrend: 'up' | 'stable' | 'down' = 'stable';
                    if (update.rating) {
                        if (update.rating > entry.performance.rating) ratingTrend = 'up';
                        else if (update.rating < entry.performance.rating) ratingTrend = 'down';
                    }

                    // Update performance
                    const updatedPerformance = {
                        ...entry.performance,
                        rating: update.rating !== undefined
                            ? ((entry.performance.rating * entry.performance.totalRatingsReceived) + update.rating) / (entry.performance.totalRatingsReceived + 1)
                            : entry.performance.rating,
                        totalRatingsReceived: update.rating !== undefined
                            ? entry.performance.totalRatingsReceived + 1
                            : entry.performance.totalRatingsReceived,
                        mvpCount: entry.performance.mvpCount + (update.isMVP ? 1 : 0),
                        mvpRate: updatedLeague.played > 0
                            ? ((entry.performance.mvpCount + (update.isMVP ? 1 : 0)) / updatedLeague.played) * 100
                            : 0,
                        attendanceRate: 100, // Will be calculated properly in service
                        form: newForm,
                        ratingTrend,
                    };

                    entries[playerIndex] = {
                        ...entry,
                        playerName: update.playerName, // Update cached name
                        league: updatedLeague,
                        performance: updatedPerformance,
                    };
                } else {
                    const newEntry: IStandings['standings'][0] = {
                        playerId: update.playerId,
                        playerName: update.playerName,
                        league: {
                            played: 0,
                            won: 0,
                            drawn: 0,
                            lost: 0,
                            goals: 0,
                            goalsAgainst: 0,
                            goalDifference: 0,
                            assists: 0,
                            points: 0,
                        },
                        friendly: {  // ✅ Remove undefined, always set an object
                            played: 1,
                            won: update.won ? 1 : 0,
                            drawn: update.drawn ? 1 : 0,
                            lost: update.lost ? 1 : 0,
                            goals: update.goals,
                            assists: update.assists,
                        },
                        performance: {
                            rating: update.rating || 0,
                            totalRatingsReceived: update.rating ? 1 : 0,
                            mvpCount: update.isMVP ? 1 : 0,
                            mvpRate: update.isMVP ? 100 : 0,
                            attendanceRate: 100,
                            form: '',
                            ratingTrend: 'stable',
                        },
                    };
                    entries.push(newEntry);
                }
            }

            // Sort by league points, then goal difference
            entries.sort((a, b) => {
                if (b.league.points !== a.league.points) {
                    return b.league.points - a.league.points;
                }
                if (b.league.goalDifference !== a.league.goalDifference) {
                    return b.league.goalDifference - a.league.goalDifference;
                }
                return b.league.goals - a.league.goals;
            });

            const result = await this.update(standingsId, {
                standings: entries,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IStandings, 'id'>>);

            ApiLogger.success('standings', 'updateAfterLeagueMatch', { standingsId });

            return result;
        } catch (error: any) {
            ApiLogger.error('standings', 'updateAfterLeagueMatch', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_AFTER_MATCH_ERROR',
                    message: error.message || 'Failed to update standings after match',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update standings after friendly match (only updates friendly stats)
     */
    async updateAfterFriendlyMatch(
        standingsId: string,
        matchUpdates: Array<{
            playerId: string;
            playerName: string;
            won: boolean;
            drawn: boolean;
            lost: boolean;
            goals: number;
            assists: number;
            rating?: number;
            isMVP?: boolean;
        }>
    ): Promise<ApiResponse<IStandings>> {
        try {
            ApiLogger.log('standings', 'updateAfterFriendlyMatch', { standingsId, count: matchUpdates.length });

            const standingsResult = await this.getById(standingsId);

            if (!standingsResult.success || !standingsResult.data) {
                return {
                    success: false,
                    error: standingsResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Standings not found',
                        statusCode: 404,
                    },
                };
            }

            const standings = standingsResult.data;
            let entries = standings.standings || [];

            // Update each player's friendly stats
            for (const update of matchUpdates) {
                const playerIndex = entries.findIndex(e => e.playerId === update.playerId);

                if (playerIndex >= 0) {
                    const entry = entries[playerIndex];

                    // Update only friendly stats
                    const updatedFriendly = {
                        played: (entry.friendly?.played || 0) + 1,
                        won: (entry.friendly?.won || 0) + (update.won ? 1 : 0),
                        drawn: (entry.friendly?.drawn || 0) + (update.drawn ? 1 : 0),
                        lost: (entry.friendly?.lost || 0) + (update.lost ? 1 : 0),
                        goals: (entry.friendly?.goals || 0) + update.goals,
                        assists: (entry.friendly?.assists || 0) + update.assists,
                    };

                    // Update performance (rating and MVP can still affect performance)
                    let updatedPerformance = { ...entry.performance };

                    if (update.rating !== undefined) {
                        updatedPerformance.rating = ((entry.performance.rating * entry.performance.totalRatingsReceived) + update.rating) / (entry.performance.totalRatingsReceived + 1);
                        updatedPerformance.totalRatingsReceived += 1;
                    }

                    if (update.isMVP) {
                        updatedPerformance.mvpCount += 1;
                        const totalPlayed = entry.league.played + updatedFriendly.played;
                        updatedPerformance.mvpRate = totalPlayed > 0
                            ? (updatedPerformance.mvpCount / totalPlayed) * 100
                            : 0;
                    }

                    entries[playerIndex] = {
                        ...entry,
                        playerName: update.playerName,
                        friendly: updatedFriendly,
                        performance: updatedPerformance,
                    };
                } else {
                    // Create new entry (shouldn't happen often for friendly matches)
                    const newEntry: IStandings['standings'][0] = {
                        playerId: update.playerId,
                        playerName: update.playerName,
                        league: {
                            played: 0,
                            won: 0,
                            drawn: 0,
                            lost: 0,
                            goals: 0,
                            goalsAgainst: 0,
                            goalDifference: 0,
                            assists: 0,
                            points: 0,
                        },
                        friendly: {
                            played: 1,
                            won: update.won ? 1 : 0,
                            drawn: update.drawn ? 1 : 0,
                            lost: update.lost ? 1 : 0,
                            goals: update.goals,
                            assists: update.assists,
                        },
                        performance: {
                            rating: update.rating || 0,
                            totalRatingsReceived: update.rating ? 1 : 0,
                            mvpCount: update.isMVP ? 1 : 0,
                            mvpRate: update.isMVP ? 100 : 0,
                            attendanceRate: 100,
                            form: '',
                            ratingTrend: 'stable',
                        },
                    };
                    entries.push(newEntry);
                }
            }

            // Re-sort (order shouldn't change for friendly, but just in case)
            entries.sort((a, b) => {
                if (b.league.points !== a.league.points) {
                    return b.league.points - a.league.points;
                }
                if (b.league.goalDifference !== a.league.goalDifference) {
                    return b.league.goalDifference - a.league.goalDifference;
                }
                return b.league.goals - a.league.goals;
            });

            const result = await this.update(standingsId, {
                standings: entries,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IStandings, 'id'>>);

            ApiLogger.success('standings', 'updateAfterFriendlyMatch', { standingsId });

            return result;
        } catch (error: any) {
            ApiLogger.error('standings', 'updateAfterFriendlyMatch', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_AFTER_FRIENDLY_ERROR',
                    message: error.message || 'Failed to update standings after friendly match',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Reset all standings
     */
    async resetStandings(standingsId: string): Promise<ApiResponse<IStandings>> {
        try {
            ApiLogger.log('standings', 'resetStandings', { standingsId });

            const result = await this.update(standingsId, {
                standings: [],
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IStandings, 'id'>>);

            ApiLogger.success('standings', 'resetStandings', { standingsId });

            return result;
        } catch (error: any) {
            ApiLogger.error('standings', 'resetStandings', error);
            return {
                success: false,
                error: {
                    code: 'RESET_STANDINGS_ERROR',
                    message: error.message || 'Failed to reset standings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Get player position in standings
     */
    async getPlayerPosition(standingsId: string, playerId: string): Promise<ApiResponse<{
        entry: IStandings['standings'][0] | null;
        rank: number | null;
        totalPlayers: number;
    }>> {
        try {
            const standingsResult = await this.getById(standingsId);

            if (!standingsResult.success || !standingsResult.data) {
                return {
                    success: false,
                    error: standingsResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Standings not found',
                        statusCode: 404,
                    },
                };
            }

            const standings = standingsResult.data;
            const entries = standings.standings || [];
            const playerIndex = entries.findIndex(e => e.playerId === playerId);
            const entry = playerIndex >= 0 ? entries[playerIndex] : null;

            return {
                success: true,
                data: {
                    entry,
                    rank: playerIndex >= 0 ? playerIndex + 1 : null,
                    totalPlayers: entries.length,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_POSITION_ERROR',
                    message: error.message || 'Failed to get player position',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Get top N players by league points
     */
    async getTopPlayers(standingsId: string, limit: number = 10): Promise<ApiResponse<IStandings['standings']>> {
        try {
            const standingsResult = await this.getById(standingsId);

            if (!standingsResult.success || !standingsResult.data) {
                return {
                    success: false,
                    error: standingsResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Standings not found',
                        statusCode: 404,
                    },
                };
            }

            const standings = standingsResult.data;
            const entries = standings.standings || [];
            const topPlayers = entries.slice(0, limit);

            return {
                success: true,
                data: topPlayers,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_TOP_PLAYERS_ERROR',
                    message: error.message || 'Failed to get top players',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Get top scorers
     */
    async getTopScorers(standingsId: string, limit: number = 10): Promise<ApiResponse<IStandings['standings']>> {
        try {
            const standingsResult = await this.getById(standingsId);

            if (!standingsResult.success || !standingsResult.data) {
                return {
                    success: false,
                    error: standingsResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Standings not found',
                        statusCode: 404,
                    },
                };
            }

            const standings = standingsResult.data;
            const entries = standings.standings || [];

            // Sort by goals
            const topScorers = [...entries].sort((a, b) => b.league.goals - a.league.goals).slice(0, limit);

            return {
                success: true,
                data: topScorers,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_TOP_SCORERS_ERROR',
                    message: error.message || 'Failed to get top scorers',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Get players with highest rating
     */
    async getTopRatings(standingsId: string, limit: number = 10): Promise<ApiResponse<IStandings['standings']>> {
        try {
            const standingsResult = await this.getById(standingsId);

            if (!standingsResult.success || !standingsResult.data) {
                return {
                    success: false,
                    error: standingsResult.error || {
                        code: 'NOT_FOUND',
                        message: 'Standings not found',
                        statusCode: 404,
                    },
                };
            }

            const standings = standingsResult.data;
            const entries = standings.standings || [];

            // Sort by rating
            const topRatings = [...entries].sort((a, b) => b.performance.rating - a.performance.rating).slice(0, limit);

            return {
                success: true,
                data: topRatings,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_TOP_RATINGS_ERROR',
                    message: error.message || 'Failed to get top ratings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
}

// Export singleton instance
export const standingsAPI = new StandingsAPI();