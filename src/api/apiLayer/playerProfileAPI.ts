// ============================================
// api/playerProfileApi.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { IPlayerProfile } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class PlayerProfileAPI extends BaseAPI<IPlayerProfile> {
    constructor() {
        super('playerProfiles');
    }

    // ============================================
    // SPECIALIZED QUERIES
    // ============================================

    /**
     * Get profile by player ID
     */
    async getByPlayer(playerId: string): Promise<ApiResponse<IPlayerProfile | null>> {
        // Profile ID is same as player ID
        return this.getById(playerId);
    }

    /**
     * Check if profile exists
     */
    async exists(playerId: string): Promise<ApiResponse<boolean>> {
        const result = await this.getByPlayer(playerId);
        return {
            success: true,
            data: result.success && !!result.data,
        };
    }

    /**
     * Get top players by total goals
     */
    async getTopScorers(limit: number = 10): Promise<ApiResponse<IPlayerProfile[]>> {
        return this.getAll({
            orderBy: [{ field: 'overall.totalGoals', direction: 'desc' }],
            limit,
        });
    }

    /**
     * Get top players by average rating
     */
    async getTopRated(limit: number = 10): Promise<ApiResponse<IPlayerProfile[]>> {
        return this.getAll({
            orderBy: [{ field: 'overall.averageRating', direction: 'desc' }],
            limit,
        });
    }

    /**
     * Get players with most MVPs
     */
    async getMostMVPs(limit: number = 10): Promise<ApiResponse<IPlayerProfile[]>> {
        return this.getAll({
            orderBy: [{ field: 'overall.totalMVPs', direction: 'desc' }],
            limit,
        });
    }

    /**
     * Get most active players (by total matches)
     */
    async getMostActive(limit: number = 10): Promise<ApiResponse<IPlayerProfile[]>> {
        return this.getAll({
            orderBy: [{ field: 'overall.totalMatches', direction: 'desc' }],
            limit,
        });
    }

    // ============================================
    // PROFILE CREATION
    // ============================================

    /**
     * Create default profile for a player
     */
    async createDefaultProfile(playerId: string): Promise<ApiResponse<IPlayerProfile>> {
        try {
            ApiLogger.log('playerProfiles', 'createDefaultProfile', { playerId });

            const defaultProfile: Omit<IPlayerProfile, 'id'> = {
                playerId,
                overall: {
                    totalLeagues: 0,
                    totalMatches: 0,
                    totalGoals: 0,
                    totalAssists: 0,
                    totalMVPs: 0,
                    averageRating: 0,
                },
                leagueSummaries: [],
                achievements: [],
                preferences: {
                    favoriteSports: [],
                    preferredPositions: {},
                    availableDays: [],
                    preferredTimes: [],
                },
                social: {
                    friendIds: [],
                    blockedIds: [],
                    followersCount: 0,
                    followingCount: 0,
                },
                lastUpdated: new Date().toISOString(),
            };

            // Use player ID as profile ID
            const result = await this.create({
                ...defaultProfile,
                id: playerId,
            } as any);

            ApiLogger.success('playerProfiles', 'createDefaultProfile', { playerId });

            return result;
        } catch (error: any) {
            ApiLogger.error('playerProfiles', 'createDefaultProfile', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_PROFILE_ERROR',
                    message: error.message || 'Failed to create profile',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Get or create profile (helper)
     */
    async getOrCreate(playerId: string): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const existingResult = await this.getByPlayer(playerId);

            if (existingResult.success && existingResult.data) {
                return existingResult as ApiResponse<IPlayerProfile>;
            }

            // Create default profile if not exist
            return this.createDefaultProfile(playerId);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_OR_CREATE_ERROR',
                    message: error.message || 'Failed to get or create profile',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // UPDATE OVERALL STATS
    // ============================================

    /**
     * Update overall statistics
     */
    async updateOverallStats(
        playerId: string,
        stats: Partial<IPlayerProfile['overall']>
    ): Promise<ApiResponse<IPlayerProfile>> {
        try {
            ApiLogger.log('playerProfiles', 'updateOverallStats', { playerId });

            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const updatedOverall = {
                ...profileResult.data.overall,
                ...stats,
            };

            const result = await this.update(playerId, {
                overall: updatedOverall,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerProfile, 'id'>>);

            ApiLogger.success('playerProfiles', 'updateOverallStats', { playerId });

            return result;
        } catch (error: any) {
            ApiLogger.error('playerProfiles', 'updateOverallStats', error);
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

    // ============================================
    // LEAGUE SUMMARIES
    // ============================================

    /**
     * Update or add league summary
     */
    async updateLeagueSummary(
        playerId: string,
        leagueId: string,
        summary: IPlayerProfile['leagueSummaries'][0]
    ): Promise<ApiResponse<IPlayerProfile>> {
        try {
            ApiLogger.log('playerProfiles', 'updateLeagueSummary', { playerId, leagueId });

            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const summaries = profileResult.data.leagueSummaries || [];
            const existingIndex = summaries.findIndex((s) => s.leagueId === leagueId);

            let updatedSummaries: IPlayerProfile['leagueSummaries'];

            if (existingIndex >= 0) {
                // Update existing
                updatedSummaries = [...summaries];
                updatedSummaries[existingIndex] = summary;
            } else {
                // Add new
                updatedSummaries = [...summaries, summary];
            }

            const result = await this.update(playerId, {
                leagueSummaries: updatedSummaries,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerProfile, 'id'>>);

            ApiLogger.success('playerProfiles', 'updateLeagueSummary', { playerId, leagueId });

            return result;
        } catch (error: any) {
            ApiLogger.error('playerProfiles', 'updateLeagueSummary', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_LEAGUE_SUMMARY_ERROR',
                    message: error.message || 'Failed to update league summary',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove league summary
     */
    async removeLeagueSummary(playerId: string, leagueId: string): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const summaries = profileResult.data.leagueSummaries || [];
            const updatedSummaries = summaries.filter((s) => s.leagueId !== leagueId);

            return this.update(playerId, {
                leagueSummaries: updatedSummaries,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerProfile, 'id'>>);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_LEAGUE_SUMMARY_ERROR',
                    message: error.message || 'Failed to remove league summary',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // ACHIEVEMENTS
    // ============================================

    /**
   * Add achievement
   */
    async addAchievement(
        playerId: string,
        achievement: NonNullable<IPlayerProfile['achievements']>[0]
    ): Promise<ApiResponse<IPlayerProfile>> {
        try {
            ApiLogger.log('playerProfiles', 'addAchievement', { playerId, type: achievement.type });

            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const achievements = profileResult.data.achievements || [];

            // Check if achievement already exists
            const exists = achievements.some((a) => a.id === achievement.id);

            if (exists) {
                return {
                    success: true,
                    data: profileResult.data,
                };
            }

            const updatedAchievements = [...achievements, achievement];

            const result = await this.update(playerId, {
                achievements: updatedAchievements,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerProfile, 'id'>>);

            ApiLogger.success('playerProfiles', 'addAchievement', { playerId, type: achievement.type });

            return result;
        } catch (error: any) {
            ApiLogger.error('playerProfiles', 'addAchievement', error);
            return {
                success: false,
                error: {
                    code: 'ADD_ACHIEVEMENT_ERROR',
                    message: error.message || 'Failed to add achievement',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
    /**
     * Remove achievement
     */
    async removeAchievement(playerId: string, achievementId: string): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const achievements = profileResult.data.achievements || [];
            const updatedAchievements = achievements.filter((a) => a.id !== achievementId);

            return this.update(playerId, {
                achievements: updatedAchievements,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerProfile, 'id'>>);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_ACHIEVEMENT_ERROR',
                    message: error.message || 'Failed to remove achievement',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // PREFERENCES
    // ============================================

    /**
     * Update preferences
     */
    async updatePreferences(
        playerId: string,
        preferences: Partial<IPlayerProfile['preferences']>
    ): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const updatedPreferences = {
                ...profileResult.data.preferences,
                ...preferences,
            };

            return this.update(playerId, {
                preferences: updatedPreferences,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerProfile, 'id'>>);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_PREFERENCES_ERROR',
                    message: error.message || 'Failed to update preferences',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // PLAY STYLE
    // ============================================

    /**
     * Update play style
     */
    async updatePlayStyle(
        playerId: string,
        playStyle: IPlayerProfile['playStyle']
    ): Promise<ApiResponse<IPlayerProfile>> {
        try {
            return this.update(playerId, {
                playStyle,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerProfile, 'id'>>);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_PLAY_STYLE_ERROR',
                    message: error.message || 'Failed to update play style',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // SOCIAL
    // ============================================

    /**
     * Add friend
     */
    async addFriend(playerId: string, friendId: string): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const docRef = doc(db, this.collectionName, playerId);

            await updateDoc(docRef, {
                'social.friendIds': arrayUnion(friendId),
                lastUpdated: new Date().toISOString(),
            });

            return this.getByPlayer(playerId) as Promise<ApiResponse<IPlayerProfile>>;
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'ADD_FRIEND_ERROR',
                    message: error.message || 'Failed to add friend',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove friend
     */
    async removeFriend(playerId: string, friendId: string): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const docRef = doc(db, this.collectionName, playerId);

            await updateDoc(docRef, {
                'social.friendIds': arrayRemove(friendId),
                lastUpdated: new Date().toISOString(),
            });

            return this.getByPlayer(playerId) as Promise<ApiResponse<IPlayerProfile>>;
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_FRIEND_ERROR',
                    message: error.message || 'Failed to remove friend',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Block player
     */
    async blockPlayer(playerId: string, blockedId: string): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const docRef = doc(db, this.collectionName, playerId);

            await updateDoc(docRef, {
                'social.blockedIds': arrayUnion(blockedId),
                lastUpdated: new Date().toISOString(),
            });

            return this.getByPlayer(playerId) as Promise<ApiResponse<IPlayerProfile>>;
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'BLOCK_PLAYER_ERROR',
                    message: error.message || 'Failed to block player',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Unblock player
     */
    async unblockPlayer(playerId: string, blockedId: string): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const docRef = doc(db, this.collectionName, playerId);

            await updateDoc(docRef, {
                'social.blockedIds': arrayRemove(blockedId),
                lastUpdated: new Date().toISOString(),
            });

            return this.getByPlayer(playerId) as Promise<ApiResponse<IPlayerProfile>>;
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UNBLOCK_PLAYER_ERROR',
                    message: error.message || 'Failed to unblock player',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update follower/following counts
     */
    async updateSocialCounts(
        playerId: string,
        counts: {
            followersCount?: number;
            followingCount?: number;
        }
    ): Promise<ApiResponse<IPlayerProfile>> {
        try {
            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const updatedSocial = {
                ...profileResult.data.social,
                ...counts,
            };

            return this.update(playerId, {
                social: updatedSocial,
                lastUpdated: new Date().toISOString(),
            } as Partial<Omit<IPlayerProfile, 'id'>>);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_SOCIAL_COUNTS_ERROR',
                    message: error.message || 'Failed to update social counts',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // VALIDATION HELPERS
    // ============================================

    /**
     * Check if player is friend
     */
    async isFriend(playerId: string, friendId: string): Promise<ApiResponse<boolean>> {
        try {
            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const friendIds = profileResult.data.social?.friendIds || [];
            const isFriend = friendIds.includes(friendId);

            return {
                success: true,
                data: isFriend,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'CHECK_FRIEND_ERROR',
                    message: error.message || 'Failed to check friend status',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Check if player is blocked
     */
    async isBlocked(playerId: string, blockedId: string): Promise<ApiResponse<boolean>> {
        try {
            const profileResult = await this.getByPlayer(playerId);

            if (!profileResult.success || !profileResult.data) {
                return {
                    success: false,
                    error: profileResult.error || {
                        code: 'PROFILE_NOT_FOUND',
                        message: 'Player profile not found',
                        statusCode: 404,
                    },
                };
            }

            const blockedIds = profileResult.data.social?.blockedIds || [];
            const isBlocked = blockedIds.includes(blockedId);

            return {
                success: true,
                data: isBlocked,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'CHECK_BLOCKED_ERROR',
                    message: error.message || 'Failed to check blocked status',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
}

// Export singleton instance
export const playerProfileAPI = new PlayerProfileAPI();