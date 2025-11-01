// ============================================
// services/LeagueService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { seasonAPI } from '../../api/apiLayer/seasonAPI';
import { fixtureAPI } from '../../api/apiLayer/fixtureAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { standingsAPI } from '../../api/apiLayer/standingsAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { ILeague, ISeason, SeasonStatus, SportType } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class LeagueService {
    // ============================================
    // 1. LEAGUE CREATION
    // ============================================

    /**
     * Create new league
     */
    static async createLeague(data: {
        creatorId: string;
        title: string;
        sportType: SportType;
        description?: string;
        logo?: string;
        seasonSettings?: Partial<ILeague['seasonSettings']>;
        defaultPremiumPlayers?: string[];
        defaultDirectPlayers?: string[];
        settings?: Partial<ILeague['settings']>;
        autoCreateFirstSeason?: boolean; // Default: true
    }): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'createLeague', {
                creatorId: data.creatorId,
                title: data.title,
                sportType: data.sportType,
            });

            // Validate creator exists
            const creatorCheck = await playerAPI.exists(data.creatorId);
            if (!creatorCheck.success || !creatorCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'CREATOR_NOT_FOUND',
                        message: 'Lig kurucusu bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            // Validate default players if provided
            if (data.defaultPremiumPlayers && data.defaultPremiumPlayers.length > 0) {
                const validatePremium = await this.validatePlayerIds(data.defaultPremiumPlayers);
                if (!validatePremium.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PREMIUM_PLAYERS',
                            message: validatePremium.error || 'Geçersiz premium oyuncular',
                            statusCode: 400,
                        },
                    };
                }
            }

            if (data.defaultDirectPlayers && data.defaultDirectPlayers.length > 0) {
                const validateDirect = await this.validatePlayerIds(data.defaultDirectPlayers);
                if (!validateDirect.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_DIRECT_PLAYERS',
                            message: validateDirect.error || 'Geçersiz direkt oyuncular',
                            statusCode: 400,
                        },
                    };
                }
            }

            // Prepare season settings with defaults
            const seasonSettings: ILeague['seasonSettings'] = {
                autoCreateNewSeason: data.seasonSettings?.autoCreateNewSeason ?? true,
                seasonDuration: data.seasonSettings?.seasonDuration ?? 365,
                autoArchiveOldSeasons: data.seasonSettings?.autoArchiveOldSeasons ?? true,
                archiveAfterMonths: data.seasonSettings?.archiveAfterMonths ?? 12,
            };

            // Prepare general settings with defaults
            const settings: ILeague['settings'] = {
                allowFriendlyMatches: data.settings?.allowFriendlyMatches ?? true,
                friendlyAffectsStats: data.settings?.friendlyAffectsStats ?? true,
                friendlyAffectsStandings: data.settings?.friendlyAffectsStandings ?? false,
            };

            // Collect all members (creator + default players)
            const allMembers = new Set<string>([data.creatorId]);
            if (data.defaultPremiumPlayers) {
                data.defaultPremiumPlayers.forEach(id => allMembers.add(id));
            }
            if (data.defaultDirectPlayers) {
                data.defaultDirectPlayers.forEach(id => allMembers.add(id));
            }

            // Create league data
            const leagueData: Omit<ILeague, 'id'> = {
                title: data.title.trim(),
                sportType: data.sportType,
                description: data.description?.trim(),
                logo: data.logo,
                currentSeasonId: undefined,
                seasonSettings,
                members: {
                    all: Array.from(allMembers),
                    admins: [data.creatorId],
                },
                defaultPlayers: {
                    premium: data.defaultPremiumPlayers || [],
                    direct: data.defaultDirectPlayers || [],
                },
                settings,
                totalSeasons: 0,
                totalMatches: 0,
                totalMembers: allMembers.size,
                createdBy: data.creatorId,
                createdAt: new Date().toISOString(),
            };

            // Create league
            const result = await leagueAPI.create(leagueData);

            if (result.success && result.data) {
                // Auto-create first season if requested
                if (data.autoCreateFirstSeason !== false) {
                    await this.createSeasonForLeague(
                        result.data.id!,
                        data.creatorId,
                        '1. Sezon',
                        seasonSettings.seasonDuration
                    );
                }

                ApiLogger.success('LeagueService', 'createLeague', {
                    leagueId: result.data.id,
                    autoCreatedSeason: data.autoCreateFirstSeason !== false,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'createLeague', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_LEAGUE_ERROR',
                    message: error.message || 'Lig oluşturulurken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 2. LEAGUE UPDATES
    // ============================================

    /**
     * Update league basic info
     */
    static async updateBasicInfo(
        leagueId: string,
        userId: string,
        updates: {
            title?: string;
            description?: string;
            logo?: string;
        }
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'updateBasicInfo', { leagueId, userId });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu ligi düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const updateData: Partial<Omit<ILeague, 'id'>> = {};

            if (updates.title) {
                updateData.title = updates.title.trim();
            }

            if (updates.description !== undefined) {
                updateData.description = updates.description.trim();
            }

            if (updates.logo !== undefined) {
                updateData.logo = updates.logo;
            }

            const result = await leagueAPI.update(leagueId, updateData);

            if (result.success) {
                ApiLogger.success('LeagueService', 'updateBasicInfo', { leagueId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'updateBasicInfo', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_INFO_ERROR',
                    message: error.message || 'Bilgiler güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update season settings
     */
    static async updateSeasonSettings(
        leagueId: string,
        userId: string,
        settings: Partial<ILeague['seasonSettings']>
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'updateSeasonSettings', { leagueId, userId });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu ligi düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get current league to merge settings
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const currentSettings = leagueResult.data.seasonSettings;
            const newSettings = {
                ...currentSettings,
                ...settings,
            };

            // Validate settings
            if (newSettings.seasonDuration < 1) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_SETTINGS',
                        message: 'Sezon süresi en az 1 gün olmalı',
                        statusCode: 400,
                    },
                };
            }

            if (newSettings.archiveAfterMonths < 1) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_SETTINGS',
                        message: 'Arşivleme süresi en az 1 ay olmalı',
                        statusCode: 400,
                    },
                };
            }

            const result = await leagueAPI.update(leagueId, {
                seasonSettings: newSettings,
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'updateSeasonSettings', { leagueId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'updateSeasonSettings', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_SEASON_SETTINGS_ERROR',
                    message: error.message || 'Sezon ayarları güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update general settings
     */
    static async updateGeneralSettings(
        leagueId: string,
        userId: string,
        settings: Partial<ILeague['settings']>
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'updateGeneralSettings', { leagueId, userId });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu ligi düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get current league to merge settings
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const currentSettings = leagueResult.data.settings;
            const newSettings = {
                ...currentSettings,
                ...settings,
            };

            const result = await leagueAPI.update(leagueId, {
                settings: newSettings,
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'updateGeneralSettings', { leagueId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'updateGeneralSettings', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_GENERAL_SETTINGS_ERROR',
                    message: error.message || 'Genel ayarlar güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 3. MEMBER MANAGEMENT
    // ============================================

    /**
     * Add member to league
     */
    static async addMember(
        leagueId: string,
        requesterId: string,
        memberId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'addMember', {
                leagueId,
                requesterId,
                memberId,
            });

            // Check if requester is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, requesterId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Üye ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate member exists
            const memberCheck = await playerAPI.exists(memberId);
            if (!memberCheck.success || !memberCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'MEMBER_NOT_FOUND',
                        message: 'Oyuncu bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const result = await leagueAPI.addMember(leagueId, memberId);

            if (result.success) {
                // Update total members cache
                const leagueResult = await leagueAPI.getById(leagueId);
                if (leagueResult.success && leagueResult.data) {
                    await leagueAPI.update(leagueId, {
                        totalMembers: leagueResult.data.members.all.length,
                    } as Partial<Omit<ILeague, 'id'>>);
                }

                ApiLogger.success('LeagueService', 'addMember', {
                    leagueId,
                    memberId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'addMember', error);
            return {
                success: false,
                error: {
                    code: 'ADD_MEMBER_ERROR',
                    message: error.message || 'Üye eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove member from league
     */
    static async removeMember(
        leagueId: string,
        requesterId: string,
        memberId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'removeMember', {
                leagueId,
                requesterId,
                memberId,
            });

            // Check if requester is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, requesterId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Üye çıkarma yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Cannot remove creator
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            if (leagueResult.data.createdBy === memberId) {
                return {
                    success: false,
                    error: {
                        code: 'CANNOT_REMOVE_CREATOR',
                        message: 'Lig kurucusu çıkarılamaz',
                        statusCode: 400,
                    },
                };
            }

            const result = await leagueAPI.removeMember(leagueId, memberId);

            if (result.success) {
                // Update total members cache
                const updatedLeague = await leagueAPI.getById(leagueId);
                if (updatedLeague.success && updatedLeague.data) {
                    await leagueAPI.update(leagueId, {
                        totalMembers: updatedLeague.data.members.all.length,
                    } as Partial<Omit<ILeague, 'id'>>);
                }

                ApiLogger.success('LeagueService', 'removeMember', {
                    leagueId,
                    memberId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'removeMember', error);
            return {
                success: false,
                error: {
                    code: 'REMOVE_MEMBER_ERROR',
                    message: error.message || 'Üye çıkarılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Add admin to league
     */
    static async addAdmin(
        leagueId: string,
        requesterId: string,
        adminId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'addAdmin', {
                leagueId,
                requesterId,
                adminId,
            });

            // Check if requester is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, requesterId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Admin ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate new admin exists
            const adminCheck = await playerAPI.exists(adminId);
            if (!adminCheck.success || !adminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'ADMIN_NOT_FOUND',
                        message: 'Oyuncu bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            // Must be a member first
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            if (!leagueResult.data.members.all.includes(adminId)) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_A_MEMBER',
                        message: 'Oyuncu lig üyesi değil',
                        statusCode: 400,
                    },
                };
            }

            const result = await leagueAPI.addAdmin(leagueId, adminId);

            if (result.success) {
                ApiLogger.success('LeagueService', 'addAdmin', {
                    leagueId,
                    adminId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'addAdmin', error);
            return {
                success: false,
                error: {
                    code: 'ADD_ADMIN_ERROR',
                    message: error.message || 'Admin eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove admin from league
     */
    static async removeAdmin(
        leagueId: string,
        requesterId: string,
        adminId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'removeAdmin', {
                leagueId,
                requesterId,
                adminId,
            });

            // Check if requester is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, requesterId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Admin çıkarma yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get league to check admin count and creator
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            // Cannot remove creator
            if (leagueResult.data.createdBy === adminId) {
                return {
                    success: false,
                    error: {
                        code: 'CANNOT_REMOVE_CREATOR',
                        message: 'Lig kurucusu admin listesinden çıkarılamaz',
                        statusCode: 400,
                    },
                };
            }

            // Cannot remove last admin
            if (leagueResult.data.members.admins.length <= 1) {
                return {
                    success: false,
                    error: {
                        code: 'LAST_ADMIN',
                        message: 'Son admin çıkarılamaz',
                        statusCode: 400,
                    },
                };
            }

            const result = await leagueAPI.removeAdmin(leagueId, adminId);

            if (result.success) {
                ApiLogger.success('LeagueService', 'removeAdmin', {
                    leagueId,
                    adminId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'removeAdmin', error);
            return {
                success: false,
                error: {
                    code: 'REMOVE_ADMIN_ERROR',
                    message: error.message || 'Admin çıkarılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Bulk add members
     */
    static async addMultipleMembers(
        leagueId: string,
        requesterId: string,
        memberIds: string[]
    ): Promise<ApiResponse<{
        success: number;
        failed: number;
        results: Array<{ memberId: string; success: boolean; error?: string }>;
    }>> {
        try {
            ApiLogger.log('LeagueService', 'addMultipleMembers', {
                leagueId,
                requesterId,
                count: memberIds.length,
            });

            // Check if requester is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, requesterId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Üye ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const results: Array<{ memberId: string; success: boolean; error?: string }> = [];
            let successCount = 0;
            let failedCount = 0;

            for (const memberId of memberIds) {
                try {
                    const result = await leagueAPI.addMember(leagueId, memberId);

                    if (result.success) {
                        results.push({ memberId, success: true });
                        successCount++;
                    } else {
                        results.push({
                            memberId,
                            success: false,
                            error: result.error?.message || 'Bilinmeyen hata',
                        });
                        failedCount++;
                    }
                } catch (error: any) {
                    results.push({
                        memberId,
                        success: false,
                        error: error.message || 'Bilinmeyen hata',
                    });
                    failedCount++;
                }
            }

            // Update total members cache
            const leagueResult = await leagueAPI.getById(leagueId);
            if (leagueResult.success && leagueResult.data) {
                await leagueAPI.update(leagueId, {
                    totalMembers: leagueResult.data.members.all.length,
                } as Partial<Omit<ILeague, 'id'>>);
            }

            ApiLogger.success('LeagueService', 'addMultipleMembers', {
                leagueId,
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
            ApiLogger.error('LeagueService', 'addMultipleMembers', error);
            return {
                success: false,
                error: {
                    code: 'ADD_MULTIPLE_MEMBERS_ERROR',
                    message: error.message || 'Üyeler eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 4. DEFAULT PLAYER LISTS
    // ============================================

    /**
     * Update default premium players
     */
    static async updateDefaultPremiumPlayers(
        leagueId: string,
        userId: string,
        playerIds: string[]
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'updateDefaultPremiumPlayers', {
                leagueId,
                userId,
                count: playerIds.length,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu ligi düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate players
            if (playerIds.length > 0) {
                const validatePlayers = await this.validatePlayerIds(playerIds);
                if (!validatePlayers.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PLAYERS',
                            message: validatePlayers.error || 'Geçersiz oyuncular',
                            statusCode: 400,
                        },
                    };
                }
            }

            // Get current league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const result = await leagueAPI.update(leagueId, {
                defaultPlayers: {
                    ...leagueResult.data.defaultPlayers,
                    premium: playerIds,
                },
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'updateDefaultPremiumPlayers', {
                    leagueId,
                    count: playerIds.length,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'updateDefaultPremiumPlayers', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_PREMIUM_ERROR',
                    message: error.message || 'Premium oyuncular güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update default direct players
     */
    static async updateDefaultDirectPlayers(
        leagueId: string,
        userId: string,
        playerIds: string[]
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'updateDefaultDirectPlayers', {
                leagueId,
                userId,
                count: playerIds.length,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu ligi düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate players
            if (playerIds.length > 0) {
                const validatePlayers = await this.validatePlayerIds(playerIds);
                if (!validatePlayers.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PLAYERS',
                            message: validatePlayers.error || 'Geçersiz oyuncular',
                            statusCode: 400,
                        },
                    };
                }
            }

            // Get current league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const result = await leagueAPI.update(leagueId, {
                defaultPlayers: {
                    ...leagueResult.data.defaultPlayers,
                    direct: playerIds,
                },
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'updateDefaultDirectPlayers', {
                    leagueId,
                    count: playerIds.length,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'updateDefaultDirectPlayers', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_DIRECT_ERROR',
                    message: error.message || 'Direkt oyuncular güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }


    /**
     * Add a single premium player to league
     */
    static async addPremiumPlayer(
        leagueId: string,
        userId: string,
        playerId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'addPremiumPlayer', {
                leagueId,
                userId,
                playerId,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Premium oyuncu ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate player exists
            const playerCheck = await playerAPI.exists(playerId);
            if (!playerCheck.success || !playerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'PLAYER_NOT_FOUND',
                        message: 'Oyuncu bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            // Get current league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Check if player is already premium
            if (league.defaultPlayers.premium.includes(playerId)) {
                return {
                    success: false,
                    error: {
                        code: 'ALREADY_PREMIUM',
                        message: 'Oyuncu zaten premium listesinde',
                        statusCode: 400,
                    },
                };
            }

            // Check if player is a member
            if (!league.members.all.includes(playerId)) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_A_MEMBER',
                        message: 'Oyuncu lig üyesi değil',
                        statusCode: 400,
                    },
                };
            }

            // Add to premium list
            const updatedPremiumPlayers = [...league.defaultPlayers.premium, playerId];

            const result = await leagueAPI.update(leagueId, {
                defaultPlayers: {
                    ...league.defaultPlayers,
                    premium: updatedPremiumPlayers,
                },
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'addPremiumPlayer', {
                    leagueId,
                    playerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'addPremiumPlayer', error);
            return {
                success: false,
                error: {
                    code: 'ADD_PREMIUM_PLAYER_ERROR',
                    message: error.message || 'Premium oyuncu eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove a single premium player from league
     */
    static async removePremiumPlayer(
        leagueId: string,
        userId: string,
        playerId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'removePremiumPlayer', {
                leagueId,
                userId,
                playerId,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Premium oyuncu çıkarma yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get current league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Check if player is in premium list
            if (!league.defaultPlayers.premium.includes(playerId)) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_PREMIUM',
                        message: 'Oyuncu premium listesinde değil',
                        statusCode: 400,
                    },
                };
            }

            // Remove from premium list
            const updatedPremiumPlayers = league.defaultPlayers.premium.filter(
                id => id !== playerId
            );

            const result = await leagueAPI.update(leagueId, {
                defaultPlayers: {
                    ...league.defaultPlayers,
                    premium: updatedPremiumPlayers,
                },
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'removePremiumPlayer', {
                    leagueId,
                    playerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'removePremiumPlayer', error);
            return {
                success: false,
                error: {
                    code: 'REMOVE_PREMIUM_PLAYER_ERROR',
                    message: error.message || 'Premium oyuncu çıkarılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Add a single direct player to league
     */
    static async addDirectPlayer(
        leagueId: string,
        userId: string,
        playerId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'addDirectPlayer', {
                leagueId,
                userId,
                playerId,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Direkt oyuncu ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate player exists
            const playerCheck = await playerAPI.exists(playerId);
            if (!playerCheck.success || !playerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'PLAYER_NOT_FOUND',
                        message: 'Oyuncu bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            // Get current league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Check if player is already direct
            if (league.defaultPlayers.direct.includes(playerId)) {
                return {
                    success: false,
                    error: {
                        code: 'ALREADY_DIRECT',
                        message: 'Oyuncu zaten direkt listesinde',
                        statusCode: 400,
                    },
                };
            }

            // Check if player is a member
            if (!league.members.all.includes(playerId)) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_A_MEMBER',
                        message: 'Oyuncu lig üyesi değil',
                        statusCode: 400,
                    },
                };
            }

            // Add to direct list
            const updatedDirectPlayers = [...league.defaultPlayers.direct, playerId];

            const result = await leagueAPI.update(leagueId, {
                defaultPlayers: {
                    ...league.defaultPlayers,
                    direct: updatedDirectPlayers,
                },
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'addDirectPlayer', {
                    leagueId,
                    playerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'addDirectPlayer', error);
            return {
                success: false,
                error: {
                    code: 'ADD_DIRECT_PLAYER_ERROR',
                    message: error.message || 'Direkt oyuncu eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove a single direct player from league
     */
    static async removeDirectPlayer(
        leagueId: string,
        userId: string,
        playerId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'removeDirectPlayer', {
                leagueId,
                userId,
                playerId,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Direkt oyuncu çıkarma yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get current league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Check if player is in direct list
            if (!league.defaultPlayers.direct.includes(playerId)) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_DIRECT',
                        message: 'Oyuncu direkt listesinde değil',
                        statusCode: 400,
                    },
                };
            }

            // Remove from direct list
            const updatedDirectPlayers = league.defaultPlayers.direct.filter(
                id => id !== playerId
            );

            const result = await leagueAPI.update(leagueId, {
                defaultPlayers: {
                    ...league.defaultPlayers,
                    direct: updatedDirectPlayers,
                },
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'removeDirectPlayer', {
                    leagueId,
                    playerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'removeDirectPlayer', error);
            return {
                success: false,
                error: {
                    code: 'REMOVE_DIRECT_PLAYER_ERROR',
                    message: error.message || 'Direkt oyuncu çıkarılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Toggle player's premium status (add if not premium, remove if premium)
     */
    static async togglePremiumPlayer(
        leagueId: string,
        userId: string,
        playerId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            // Get current league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;
            const isPremium = league.defaultPlayers.premium.includes(playerId);

            if (isPremium) {
                return this.removePremiumPlayer(leagueId, userId, playerId);
            } else {
                return this.addPremiumPlayer(leagueId, userId, playerId);
            }
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'togglePremiumPlayer', error);
            return {
                success: false,
                error: {
                    code: 'TOGGLE_PREMIUM_ERROR',
                    message: error.message || 'Premium durumu değiştirilirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Toggle player's direct status (add if not direct, remove if direct)
     */
    static async toggleDirectPlayer(
        leagueId: string,
        userId: string,
        playerId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            // Get current league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;
            const isDirect = league.defaultPlayers.direct.includes(playerId);

            if (isDirect) {
                return this.removeDirectPlayer(leagueId, userId, playerId);
            } else {
                return this.addDirectPlayer(leagueId, userId, playerId);
            }
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'toggleDirectPlayer', error);
            return {
                success: false,
                error: {
                    code: 'TOGGLE_DIRECT_ERROR',
                    message: error.message || 'Direkt durumu değiştirilirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Bulk add premium players
     */
    static async addMultiplePremiumPlayers(
        leagueId: string,
        userId: string,
        playerIds: string[]
    ): Promise<ApiResponse<{
        success: number;
        failed: number;
        results: Array<{ playerId: string; success: boolean; error?: string }>;
    }>> {
        try {
            ApiLogger.log('LeagueService', 'addMultiplePremiumPlayers', {
                leagueId,
                userId,
                count: playerIds.length,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Premium oyuncu ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const results: Array<{ playerId: string; success: boolean; error?: string }> = [];
            let successCount = 0;
            let failedCount = 0;

            for (const playerId of playerIds) {
                const result = await this.addPremiumPlayer(leagueId, userId, playerId);

                if (result.success) {
                    results.push({ playerId, success: true });
                    successCount++;
                } else {
                    results.push({
                        playerId,
                        success: false,
                        error: result.error?.message || 'Bilinmeyen hata',
                    });
                    failedCount++;
                }
            }

            ApiLogger.success('LeagueService', 'addMultiplePremiumPlayers', {
                leagueId,
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
            ApiLogger.error('LeagueService', 'addMultiplePremiumPlayers', error);
            return {
                success: false,
                error: {
                    code: 'ADD_MULTIPLE_PREMIUM_ERROR',
                    message: error.message || 'Premium oyuncular eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Bulk add direct players
     */
    static async addMultipleDirectPlayers(
        leagueId: string,
        userId: string,
        playerIds: string[]
    ): Promise<ApiResponse<{
        success: number;
        failed: number;
        results: Array<{ playerId: string; success: boolean; error?: string }>;
    }>> {
        try {
            ApiLogger.log('LeagueService', 'addMultipleDirectPlayers', {
                leagueId,
                userId,
                count: playerIds.length,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Direkt oyuncu ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const results: Array<{ playerId: string; success: boolean; error?: string }> = [];
            let successCount = 0;
            let failedCount = 0;

            for (const playerId of playerIds) {
                const result = await this.addDirectPlayer(leagueId, userId, playerId);

                if (result.success) {
                    results.push({ playerId, success: true });
                    successCount++;
                } else {
                    results.push({
                        playerId,
                        success: false,
                        error: result.error?.message || 'Bilinmeyen hata',
                    });
                    failedCount++;
                }
            }

            ApiLogger.success('LeagueService', 'addMultipleDirectPlayers', {
                leagueId,
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
            ApiLogger.error('LeagueService', 'addMultipleDirectPlayers', error);
            return {
                success: false,
                error: {
                    code: 'ADD_MULTIPLE_DIRECT_ERROR',
                    message: error.message || 'Direkt oyuncular eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
 * Leave league (member voluntarily leaves)
 */
    static async leaveLeague(
        leagueId: string,
        memberId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'leaveLeague', {
                leagueId,
                memberId,
            });

            // Get league data
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Cannot leave if creator
            if (league.createdBy === memberId) {
                return {
                    success: false,
                    error: {
                        code: 'CREATOR_CANNOT_LEAVE',
                        message: 'Lig kurucusu ligden ayrılamaz. Önce ligi başka birine devretmelisiniz.',
                        statusCode: 400,
                    },
                };
            }

            // Check if member exists in league
            if (!league.members.all.includes(memberId)) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_A_MEMBER',
                        message: 'Bu ligin üyesi değilsiniz',
                        statusCode: 400,
                    },
                };
            }

            // If last admin (and not creator), warn them
            const isAdmin = league.members.admins.includes(memberId);
            if (isAdmin && league.members.admins.length === 1 && league.createdBy !== memberId) {
                return {
                    success: false,
                    error: {
                        code: 'LAST_ADMIN',
                        message: 'Son admin olarak ligden ayrılamazsınız. Önce başka bir admin atamalısınız.',
                        statusCode: 400,
                    },
                };
            }

            // Remove member
            const result = await leagueAPI.removeMember(leagueId, memberId);

            if (result.success) {
                // Update total members cache
                const updatedLeague = await leagueAPI.getById(leagueId);
                if (updatedLeague.success && updatedLeague.data) {
                    await leagueAPI.update(leagueId, {
                        totalMembers: updatedLeague.data.members.all.length,
                    } as Partial<Omit<ILeague, 'id'>>);
                }

                ApiLogger.success('LeagueService', 'leaveLeague', {
                    leagueId,
                    memberId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'leaveLeague', error);
            return {
                success: false,
                error: {
                    code: 'LEAVE_LEAGUE_ERROR',
                    message: error.message || 'Ligden ayrılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // BONUS: Transfer Ownership Method
    // ============================================

    /**
     * Transfer league ownership to another admin
     * (Required before creator can leave)
     * Sadece lig sahibi sahipliği devredebilir
     */
    static async transferOwnership(
        leagueId: string,
        currentOwnerId: string,
        newOwnerId: string
    ): Promise<ApiResponse<ILeague>> {
        try {
            ApiLogger.log('LeagueService', 'transferOwnership', {
                leagueId,
                currentOwnerId,
                newOwnerId,
            });

            // Get league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Check if requester is current owner
            if (league.createdBy !== currentOwnerId) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_OWNER',
                        message: 'Sadece lig sahibi sahipliği devredebilir',
                        statusCode: 403,
                    },
                };
            }

            // Check if new owner is a member
            if (!league.members.all.includes(newOwnerId)) {
                return {
                    success: false,
                    error: {
                        code: 'NOT_A_MEMBER',
                        message: 'Yeni sahip lig üyesi olmalıdır',
                        statusCode: 400,
                    },
                };
            }

            // Make new owner an admin if not already
            if (!league.members.admins.includes(newOwnerId)) {
                await leagueAPI.addAdmin(leagueId, newOwnerId);
            }

            // Transfer ownership
            const result = await leagueAPI.update(leagueId, {
                createdBy: newOwnerId,
            } as Partial<Omit<ILeague, 'id'>>);

            if (result.success) {
                ApiLogger.success('LeagueService', 'transferOwnership', {
                    leagueId,
                    from: currentOwnerId,
                    to: newOwnerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'transferOwnership', error);
            return {
                success: false,
                error: {
                    code: 'TRANSFER_OWNERSHIP_ERROR',
                    message: error.message || 'Sahiplik devredilirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
    // ============================================
    // 5. SEASON MANAGEMENT
    // ============================================

    /**
     * Create new season for league
     */
    static async createSeasonForLeague(
        leagueId: string,
        userId: string,
        seasonName: string,
        durationDays?: number
    ): Promise<ApiResponse<ISeason>> {
        try {
            ApiLogger.log('LeagueService', 'createSeasonForLeague', {
                leagueId,
                userId,
                seasonName,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Sezon oluşturma yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Calculate season number
            const seasonsResult = await seasonAPI.getByLeague(leagueId);
            const seasonNumber = seasonsResult.success && seasonsResult.data
                ? seasonsResult.data.length + 1
                : 1;

            // Calculate dates
            const startDate = new Date();
            const duration = durationDays || league.seasonSettings.seasonDuration;
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);

            // Create season
            const seasonData: Omit<ISeason, 'id'> = {
                leagueId,
                name: seasonName.trim(),
                seasonNumber,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                status: SeasonStatus.ACTIVE,
                settings: {
                    pointsForWin: 3,
                    pointsForDraw: 1,
                    pointsForLoss: 0,
                },
                createdAt: new Date().toISOString(),
            };

            const seasonResult = await seasonAPI.create(seasonData);

            if (seasonResult.success && seasonResult.data) {
                // Create standings for this season
                const standingsResult = await standingsAPI.create({
                    leagueId,
                    seasonId: seasonResult.data.id!,
                    standings: [],
                    lastUpdated: new Date().toISOString(),
                });

                // Link standings to season
                if (standingsResult.success && standingsResult.data) {
                    await seasonAPI.update(seasonResult.data.id!, {
                        standingsId: standingsResult.data.id,
                    } as Partial<Omit<ISeason, 'id'>>);
                }

                // Set as current season
                await leagueAPI.update(leagueId, {
                    currentSeasonId: seasonResult.data.id,
                    totalSeasons: (league.totalSeasons || 0) + 1,
                } as Partial<Omit<ILeague, 'id'>>);

                ApiLogger.success('LeagueService', 'createSeasonForLeague', {
                    leagueId,
                    seasonId: seasonResult.data.id,
                });
            }

            return seasonResult;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'createSeasonForLeague', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_SEASON_ERROR',
                    message: error.message || 'Sezon oluşturulurken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
    /**
     * End current season and optionally start new one
     */
    static async endCurrentSeason(
        leagueId: string,
        userId: string,
        autoCreateNext: boolean = true
    ): Promise<ApiResponse<{
        endedSeason: ISeason;
        newSeason?: ISeason;
    }>> {
        try {
            ApiLogger.log('LeagueService', 'endCurrentSeason', {
                leagueId,
                userId,
                autoCreateNext,
            });

            // Check if user is admin
            const isAdminCheck = await leagueAPI.isAdmin(leagueId, userId);
            if (!isAdminCheck.success || !isAdminCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Sezon bitirme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            if (!league.currentSeasonId) {
                return {
                    success: false,
                    error: {
                        code: 'NO_ACTIVE_SEASON',
                        message: 'Aktif sezon bulunamadı',
                        statusCode: 400,
                    },
                };
            }

            // End current season
            const endSeasonResult = await seasonAPI.update(league.currentSeasonId, {
                status: 'completed',
                endDate: new Date().toISOString(),
            } as Partial<Omit<ISeason, 'id'>>);

            if (!endSeasonResult.success) {
                return {
                    success: false,
                    error: endSeasonResult.error || {
                        code: 'END_SEASON_ERROR',
                        message: 'Sezon bitirilemedi',
                        statusCode: 500,
                    },
                };
            }

            let newSeason: ISeason | undefined;

            // Create next season if requested
            if (autoCreateNext) {
                const currentSeasonResult = await seasonAPI.getById(league.currentSeasonId);

                if (currentSeasonResult.success && currentSeasonResult.data) {
                    const currentSeasonNumber = this.extractSeasonNumber(
                        currentSeasonResult.data.name
                    );
                    const nextSeasonName = `${currentSeasonNumber + 1}. Sezon`;

                    const newSeasonResult = await this.createSeasonForLeague(
                        leagueId,
                        userId,
                        nextSeasonName
                    );

                    if (newSeasonResult.success && newSeasonResult.data) {
                        newSeason = newSeasonResult.data;
                    }
                }
            } else {
                // Clear current season
                await leagueAPI.update(leagueId, {
                    currentSeasonId: undefined,
                } as Partial<Omit<ILeague, 'id'>>);
            }

            ApiLogger.success('LeagueService', 'endCurrentSeason', {
                leagueId,
                endedSeasonId: league.currentSeasonId,
                newSeasonId: newSeason?.id,
            });

            return {
                success: true,
                data: {
                    endedSeason: endSeasonResult.data!,
                    newSeason,
                },
            };
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'endCurrentSeason', error);
            return {
                success: false,
                error: {
                    code: 'END_SEASON_ERROR',
                    message: error.message || 'Sezon bitirirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 6. QUERY & READ OPERATIONS
    // ============================================

    static async getLeague(leagueId: string): Promise<ApiResponse<ILeague>> {
        return leagueAPI.getById(leagueId);
    }

    static async getPlayerLeagues(playerId: string): Promise<ApiResponse<ILeague[]>> {
        return leagueAPI.getByMember(playerId);
    }

    static async getAllLeagues(): Promise<ApiResponse<ILeague[]>> {
        return leagueAPI.getAll();
    }

    /**
     * Get league with full details
     */
    static async getLeagueDetails(leagueId: string): Promise<ApiResponse<{
        league: ILeague;
        currentSeason?: ISeason;
        totalFixtures: number;
        totalMembers: number;
        totalActiveMatches: number;
    }>> {
        try {
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Get current season
            let currentSeason: ISeason | undefined;
            if (league.currentSeasonId) {
                const seasonResult = await seasonAPI.getById(league.currentSeasonId);
                if (seasonResult.success && seasonResult.data) {
                    currentSeason = seasonResult.data;
                }
            }

            // Get fixtures count
            const fixturesResult = await fixtureAPI.getByLeague(leagueId);
            const totalFixtures = fixturesResult.success && fixturesResult.data
                ? fixturesResult.data.length
                : 0;

            // Get active matches count
            const matchesResult = await matchAPI.getByLeague(leagueId);
            const totalActiveMatches = matchesResult.success && matchesResult.data
                ? matchesResult.data.filter(m =>
                    m.status !== 'completed' && m.status !== 'cancelled'
                ).length
                : 0;

            return {
                success: true,
                data: {
                    league,
                    currentSeason,
                    totalFixtures,
                    totalMembers: league.members.all.length,
                    totalActiveMatches,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_DETAILS_ERROR',
                    message: error.message || 'Lig detayları alınırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 7. DELETE OPERATIONS
    // ============================================

    /**
     * Delete league (only if no seasons/matches exist)
     */
    static async deleteLeague(
        leagueId: string,
        userId: string
    ): Promise<ApiResponse<void>> {
        try {
            ApiLogger.log('LeagueService', 'deleteLeague', { leagueId, userId });

            // Get league
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const league = leagueResult.data;

            // Only creator can delete
            if (league.createdBy !== userId) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Sadece lig kurucusu ligi silebilir',
                        statusCode: 403,
                    },
                };
            }

            // Check if there are any seasons
            if (league.totalSeasons > 0) {
                return {
                    success: false,
                    error: {
                        code: 'HAS_SEASONS',
                        message: 'Sezonları olan lig silinemez',
                        statusCode: 400,
                    },
                };
            }

            // Check if there are any matches
            if (league.totalMatches > 0) {
                return {
                    success: false,
                    error: {
                        code: 'HAS_MATCHES',
                        message: 'Maçları olan lig silinemez',
                        statusCode: 400,
                    },
                };
            }

            const result = await leagueAPI.delete(leagueId);

            if (result.success) {
                ApiLogger.success('LeagueService', 'deleteLeague', { leagueId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueService', 'deleteLeague', error);
            return {
                success: false,
                error: {
                    code: 'DELETE_LEAGUE_ERROR',
                    message: error.message || 'Lig silinirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 8. HELPER METHODS
    // ============================================

    /**
     * Validate player IDs
     */
    private static async validatePlayerIds(
        playerIds: string[]
    ): Promise<{ valid: boolean; error?: string }> {
        if (playerIds.length === 0) {
            return { valid: true };
        }

        for (const playerId of playerIds) {
            const playerCheck = await playerAPI.exists(playerId);
            if (!playerCheck.success || !playerCheck.data) {
                return {
                    valid: false,
                    error: `Geçersiz oyuncu: ${playerId}`,
                };
            }
        }

        return { valid: true };
    }

    /**
     * Extract season number from season name
     */
    private static extractSeasonNumber(seasonName: string): number {
        const match = seasonName.match(/(\d+)/);
        return match ? parseInt(match[1]) : 1;
    }

    /**
     * Check if player is league member
     */
    static async isLeagueMember(
        leagueId: string,
        playerId: string
    ): Promise<ApiResponse<boolean>> {
        try {
            const leagueResult = await leagueAPI.getById(leagueId);

            if (!leagueResult.success || !leagueResult.data) {
                return {
                    success: false,
                    error: leagueResult.error || {
                        code: 'LEAGUE_NOT_FOUND',
                        message: 'Lig bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            return {
                success: true,
                data: leagueResult.data.members.all.includes(playerId),
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'CHECK_MEMBER_ERROR',
                    message: error.message || 'Üyelik kontrolü yapılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Check if player is league admin
     */
    static async isLeagueAdmin(
        leagueId: string,
        playerId: string
    ): Promise<ApiResponse<boolean>> {
        return leagueAPI.isAdmin(leagueId, playerId);
    }
}

export default LeagueService;