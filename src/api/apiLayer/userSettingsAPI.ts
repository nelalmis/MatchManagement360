// ============================================
// api/UserSettingsAPI.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { ApiLogger } from '../base/ApiLogger';
import { IUserSettings, SportType } from '../../types/entity/types';

// ============================================
// API CLASS
// ============================================
export class UserSettingsAPI extends BaseAPI<IUserSettings> {
    constructor() {
        super('user_settings');
    }

    // ============================================
    // CORE METHODS
    // ============================================

    /**
     * Get user settings by user ID
     * Settings ID is same as user ID
     */
    async getByUserId(userId: string): Promise<ApiResponse<IUserSettings>> {
        return this.getById(userId);
    }

    /**
     * Initialize default settings for a new user
     */
    async initializeSettings(userId: string): Promise<ApiResponse<IUserSettings>> {
        try {
            // Check if settings already exist
            const existingResult = await this.exists(userId);

            if (existingResult.success && existingResult.data) {
                return this.getByUserId(userId);
            }

            // Create default settings
            const defaultSettings: Omit<IUserSettings, 'id'> = {
                userId,
                profile: {
                    showEmail: false,
                    showPhone: false,
                    showBirthDate: false,
                },
                notifications: {
                    email: {
                        matchInvitations: true,
                        matchReminders: true,
                        teamAssignments: true,
                        paymentReminders: true,
                        ratingRequests: true,
                        mvpAnnouncements: true,
                        seasonUpdates: true,
                        weeklyDigest: false,
                    },
                    push: {
                        matchInvitations: true,
                        matchReminders: true,
                        teamAssignments: true,
                        paymentReminders: true,
                        ratingRequests: true,
                        mvpAnnouncements: true,
                    },
                    sms: {
                        matchReminders: false,
                        urgentUpdates: false,
                    },
                },
                privacy: {
                    profileVisibility: 'public',
                    showStats: true,
                    showRating: true,
                    allowInvitations: true,
                    allowFriendRequests: true,
                },
                preferences: {
                    favoritePositions: {},
                    availableDays: [0, 1, 2, 3, 4, 5, 6],
                    preferredTimes: {
                        morning: true,
                        afternoon: true,
                        evening: true,
                    },
                },
                appearance: {
                    theme: 'auto',
                    language: 'tr',
                    dateFormat: 'DD/MM/YYYY',
                    timeFormat: '24h',
                },
                quickActions: {
                    favoriteLeagues: [],
                    recentMatches: [],
                    frequentPlayers: [],
                },
                createdAt: new Date().toISOString(),
            };

            return this.createWithId(userId, defaultSettings);
        } catch (error: any) {
            ApiLogger.error('user_settings', 'initializeSettings', error);
            return {
                success: false,
                error: {
                    code: 'INIT_SETTINGS_ERROR',
                    message: error.message || 'Failed to initialize user settings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update user settings
     */
    async updateSettings(
        userId: string,
        updates: Partial<Omit<IUserSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
    ): Promise<ApiResponse<IUserSettings>> {
        return this.update(userId, updates);
    }

    // ============================================
    // PROFILE METHODS
    // ============================================

    async updateProfile(
        userId: string,
        profile: Partial<IUserSettings['profile']>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(userId, {
                profile: {
                    ...settingsResult.data.profile,
                    ...profile,
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_PROFILE_ERROR',
                    message: error.message || 'Failed to update profile settings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // NOTIFICATION METHODS
    // ============================================

    async updateNotifications(
        userId: string,
        notifications: Partial<IUserSettings['notifications']>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(userId, {
                notifications: {
                    email: {
                        ...settingsResult.data.notifications.email,
                        ...(notifications.email || {}),
                    },
                    push: {
                        ...settingsResult.data.notifications.push,
                        ...(notifications.push || {}),
                    },
                    sms: {
                        ...settingsResult.data.notifications.sms,
                        ...(notifications.sms || {}),
                    },
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_NOTIFICATIONS_ERROR',
                    message: error.message || 'Failed to update notification settings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async updateEmailNotifications(
        userId: string,
        emailSettings: Partial<IUserSettings['notifications']['email']>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(userId, {
                notifications: {
                    ...settingsResult.data.notifications,
                    email: {
                        ...settingsResult.data.notifications.email,
                        ...emailSettings,
                    },
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_EMAIL_NOTIFICATIONS_ERROR',
                    message: error.message || 'Failed to update email notifications',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async updatePushNotifications(
        userId: string,
        pushSettings: Partial<IUserSettings['notifications']['push']>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(userId, {
                notifications: {
                    ...settingsResult.data.notifications,
                    push: {
                        ...settingsResult.data.notifications.push,
                        ...pushSettings,
                    },
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_PUSH_NOTIFICATIONS_ERROR',
                    message: error.message || 'Failed to update push notifications',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async disableAllNotifications(userId: string): Promise<ApiResponse<IUserSettings>> {
        const allDisabled = {
            email: {
                matchInvitations: false,
                matchReminders: false,
                teamAssignments: false,
                paymentReminders: false,
                ratingRequests: false,
                mvpAnnouncements: false,
                seasonUpdates: false,
                weeklyDigest: false,
            },
            push: {
                matchInvitations: false,
                matchReminders: false,
                teamAssignments: false,
                paymentReminders: false,
                ratingRequests: false,
                mvpAnnouncements: false,
            },
            sms: {
                matchReminders: false,
                urgentUpdates: false,
            },
        };

        return this.update(userId, { notifications: allDisabled });
    }

    // ============================================
    // PRIVACY METHODS
    // ============================================

    async updatePrivacy(
        userId: string,
        privacy: Partial<IUserSettings['privacy']>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(userId, {
                privacy: {
                    ...settingsResult.data.privacy,
                    ...privacy,
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_PRIVACY_ERROR',
                    message: error.message || 'Failed to update privacy settings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async setProfileVisibility(
        userId: string,
        visibility: 'public' | 'friends' | 'private'
    ): Promise<ApiResponse<IUserSettings>> {
        return this.updatePrivacy(userId, { profileVisibility: visibility });
    }

    // ============================================
    // PREFERENCES METHODS
    // ============================================

    async updatePreferences(
        userId: string,
        preferences: Partial<IUserSettings['preferences']>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            // Build the updated preferences object
            const basePreferences = { ...settingsResult.data.preferences };

            // Merge top-level properties
            if (preferences.availableDays !== undefined) {
                basePreferences.availableDays = preferences.availableDays;
            }

            if (preferences.maxDistanceKm !== undefined) {
                basePreferences.maxDistanceKm = preferences.maxDistanceKm;
            }

            // Deep merge for favoritePositions
            if (preferences.favoritePositions !== undefined) {
                basePreferences.favoritePositions = {
                    ...settingsResult.data.preferences.favoritePositions,
                    ...preferences.favoritePositions,
                };
            }

            // Deep merge for preferredTimes
            if (preferences.preferredTimes !== undefined) {
                basePreferences.preferredTimes = {
                    ...settingsResult.data.preferences.preferredTimes,
                    ...preferences.preferredTimes,
                };
            }

            return this.update(userId, { preferences: basePreferences });
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
    async setFavoritePositions(
        userId: string,
        sport: SportType,
        positions: string[]
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(userId, {
                preferences: {
                    ...settingsResult.data.preferences,
                    favoritePositions: {
                        ...settingsResult.data.preferences.favoritePositions,
                        [sport]: positions,
                    },
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'SET_POSITIONS_ERROR',
                    message: error.message || 'Failed to set favorite positions',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async setAvailableDays(
        userId: string,
        days: number[]
    ): Promise<ApiResponse<IUserSettings>> {
        return this.updatePreferences(userId, { availableDays: days });
    }

    async setPreferredTimes(
        userId: string,
        times: Partial<IUserSettings['preferences']['preferredTimes']>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            const updatedTimes = {
                ...settingsResult.data.preferences.preferredTimes,
                ...times,
            };

            return this.updatePreferences(userId, { preferredTimes: updatedTimes });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'SET_PREFERRED_TIMES_ERROR',
                    message: error.message || 'Failed to set preferred times',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // APPEARANCE METHODS
    // ============================================

    async updateAppearance(
        userId: string,
        appearance: Partial<IUserSettings['appearance']>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            return this.update(userId, {
                appearance: {
                    ...settingsResult.data.appearance,
                    ...appearance,
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_APPEARANCE_ERROR',
                    message: error.message || 'Failed to update appearance settings',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async setTheme(
        userId: string,
        theme: 'light' | 'dark' | 'auto'
    ): Promise<ApiResponse<IUserSettings>> {
        return this.updateAppearance(userId, { theme });
    }

    async setLanguage(
        userId: string,
        language: 'tr' | 'en'
    ): Promise<ApiResponse<IUserSettings>> {
        return this.updateAppearance(userId, { language });
    }

    // ============================================
    // QUICK ACTIONS METHODS (CACHE)
    // ============================================

    async updateQuickActions(
        userId: string,
        quickActions: Partial<NonNullable<IUserSettings['quickActions']>>
    ): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            const currentQuickActions = settingsResult.data.quickActions || {
                favoriteLeagues: [],
                recentMatches: [],
                frequentPlayers: [],
            };

            return this.update(userId, {
                quickActions: {
                    ...currentQuickActions,
                    ...quickActions,
                },
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'UPDATE_QUICK_ACTIONS_ERROR',
                    message: error.message || 'Failed to update quick actions',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async addFavoriteLeague(userId: string, leagueId: string): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            const currentFavorites = settingsResult.data.quickActions?.favoriteLeagues || [];

            if (currentFavorites.includes(leagueId)) {
                return {
                    success: true,
                    data: settingsResult.data,
                };
            }

            return this.updateQuickActions(userId, {
                favoriteLeagues: [...currentFavorites, leagueId],
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'ADD_FAVORITE_LEAGUE_ERROR',
                    message: error.message || 'Failed to add favorite league',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async removeFavoriteLeague(userId: string, leagueId: string): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            const currentFavorites = settingsResult.data.quickActions?.favoriteLeagues || [];
            const updatedFavorites = currentFavorites.filter((id) => id !== leagueId);

            return this.updateQuickActions(userId, {
                favoriteLeagues: updatedFavorites,
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'REMOVE_FAVORITE_LEAGUE_ERROR',
                    message: error.message || 'Failed to remove favorite league',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async addRecentMatch(userId: string, matchId: string): Promise<ApiResponse<IUserSettings>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            const currentRecent = settingsResult.data.quickActions?.recentMatches || [];
            const updatedRecent = [matchId, ...currentRecent.filter((id) => id !== matchId)].slice(0, 5);

            return this.updateQuickActions(userId, {
                recentMatches: updatedRecent,
            });
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'ADD_RECENT_MATCH_ERROR',
                    message: error.message || 'Failed to add recent match',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async updateFrequentPlayers(
        userId: string,
        playerIds: string[]
    ): Promise<ApiResponse<IUserSettings>> {
        return this.updateQuickActions(userId, { frequentPlayers: playerIds });
    }

    // ============================================
    // UTILITY METHODS
    // ============================================

    async canReceiveNotification(
        userId: string,
        type: 'email' | 'push' | 'sms',
        notificationName: string
    ): Promise<ApiResponse<boolean>> {
        try {
            const settingsResult = await this.getByUserId(userId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'SETTINGS_NOT_FOUND',
                        message: 'User settings not found',
                        statusCode: 404,
                    },
                };
            }

            const notifications = settingsResult.data.notifications[type];
            const canReceive = (notifications as any)[notificationName] || false;

            return {
                success: true,
                data: canReceive,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'CHECK_NOTIFICATION_ERROR',
                    message: error.message || 'Failed to check notification permission',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    async resetToDefaults(userId: string): Promise<ApiResponse<IUserSettings>> {
        try {
            // Delete existing settings
            await this.delete(userId);

            // Re-initialize with defaults
            return this.initializeSettings(userId);
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'RESET_SETTINGS_ERROR',
                    message: error.message || 'Failed to reset settings to defaults',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
}

// Export singleton instance
export const userSettingsAPI = new UserSettingsAPI();