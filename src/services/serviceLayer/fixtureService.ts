// ============================================
// services/FixtureService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { fixtureAPI } from '../../api/apiLayer/fixtureAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IFixture, PlayerListConfig, ILeague } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class FixtureService {
    // ============================================
    // 1. FIXTURE CREATION
    // ============================================

    /**
     * Create new fixture
     */
    static async createFixture(data: {
        leagueId: string;
        organizerId: string;
        title: string;
        description?: string;
        schedule: {
            registrationStartTime: string;
            matchStartTime: string;
            matchDuration: number;
            isRecurring: boolean;
            pattern?: IFixture['schedule']['pattern'];
        };
        squad: {
            totalPlayers: number;
            reservePlayers: number;
            minPlayersToStart: number;
        };
        venue: IFixture['venue'];
        inheritPlayerLists?: boolean; // true = inherit from league, false = custom
        customPremiumPlayers?: string[];
        customDirectPlayers?: string[];
    }): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'createFixture', {
                leagueId: data.leagueId,
                title: data.title,
            });

            // Validate league exists
            const leagueResult = await leagueAPI.getById(data.leagueId);

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

            // Check if user is organizer
            const isOrganizerCheck = await leagueAPI.isAdmin(data.leagueId, data.organizerId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu ligde fixture oluşturma yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate schedule times
            const validateSchedule = this.validateScheduleTimes(
                data.schedule.registrationStartTime,
                data.schedule.matchStartTime
            );

            if (!validateSchedule.valid) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_SCHEDULE',
                        message: validateSchedule.error || 'Geçersiz zamanlama',
                        statusCode: 400,
                    },
                };
            }

            // Validate squad numbers
            if (data.squad.minPlayersToStart > data.squad.totalPlayers) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_SQUAD',
                        message: 'Minimum oyuncu sayısı toplam kadrodan fazla olamaz',
                        statusCode: 400,
                    },
                };
            }

            // Validate recurring pattern if provided
            if (data.schedule.isRecurring && data.schedule.pattern) {
                const validatePattern = this.validateRecurringPattern(data.schedule.pattern);
                if (!validatePattern.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PATTERN',
                            message: validatePattern.error || 'Geçersiz tekrar deseni',
                            statusCode: 400,
                        },
                    };
                }
            }

            // Calculate next match date if recurring
            let nextMatchDate: string | undefined;
            if (data.schedule.isRecurring && data.schedule.pattern) {
                const nextDate = this.calculateNextDate(new Date(), data.schedule.pattern);
                if (nextDate) {
                    nextMatchDate = nextDate.toISOString();
                }
            }

            // Prepare player lists
            const premiumConfig: PlayerListConfig = data.inheritPlayerLists !== false
                ? {
                    mode: 'auto',
                    inherited: league.defaultPlayers.premium || [],
                }
                : {
                    mode: 'custom',
                    inherited: league.defaultPlayers.premium || [],
                    overrides: data.customPremiumPlayers || [],
                };

            const directConfig: PlayerListConfig = data.inheritPlayerLists !== false
                ? {
                    mode: 'auto',
                    inherited: league.defaultPlayers.direct || [],
                }
                : {
                    mode: 'custom',
                    inherited: league.defaultPlayers.direct || [],
                    overrides: data.customDirectPlayers || [],
                };

            // Validate custom players if provided
            if (data.inheritPlayerLists === false) {
                if (data.customPremiumPlayers && data.customPremiumPlayers.length > 0) {
                    const validatePremium = await this.validatePlayerIds(data.customPremiumPlayers);
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

                if (data.customDirectPlayers && data.customDirectPlayers.length > 0) {
                    const validateDirect = await this.validatePlayerIds(data.customDirectPlayers);
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
            }

            // Create fixture data
            const fixtureData: Omit<IFixture, 'id'> = {
                leagueId: data.leagueId,
                title: data.title.trim(),
                description: data.description?.trim(),
                schedule: data.schedule,
                squad: data.squad,
                venue: data.venue,
                players: {
                    premium: premiumConfig,
                    direct: directConfig,
                },
                permissions: {
                    organizers: [data.organizerId],
                    teamBuilders: [data.organizerId],
                },
                totalMatches: 0,
                nextMatchDate,
                status: 'active',
                createdAt: new Date().toISOString(),
            };

            // Create fixture
            const result = await fixtureAPI.create(fixtureData);

            if (result.success) {
                ApiLogger.success('FixtureService', 'createFixture', {
                    fixtureId: result.data?.id,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'createFixture', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_FIXTURE_ERROR',
                    message: error.message || 'Fixture oluşturulurken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
    /**
     * Duplicate fixture
     */
    static async duplicateFixture(
        fixtureId: string,
        userId: string,
        newTitle?: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'duplicateFixture', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı kopyalama yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const fixtureResult = await fixtureAPI.getById(fixtureId);

            if (!fixtureResult.success || !fixtureResult.data) {
                return {
                    success: false,
                    error: fixtureResult.error || {
                        code: 'FIXTURE_NOT_FOUND',
                        message: 'Fixture bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const fixture = fixtureResult.data;

            // Create new fixture with same data
            const duplicateData: Omit<IFixture, 'id'> = {
                ...fixture,
                title: newTitle?.trim() || `${fixture.title} (Kopya)`,
                totalMatches: 0,
                nextMatchDate: fixture.nextMatchDate,
                createdAt: new Date().toISOString(),
                updatedAt: undefined,
            };

            const result = await fixtureAPI.create(duplicateData);

            if (result.success) {
                ApiLogger.success('FixtureService', 'duplicateFixture', {
                    originalId: fixtureId,
                    newId: result.data?.id,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'duplicateFixture', error);
            return {
                success: false,
                error: {
                    code: 'DUPLICATE_FIXTURE_ERROR',
                    message: error.message || 'Fixture kopyalanırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 2. FIXTURE UPDATES
    // ============================================

    /**
     * Update fixture basic info
     */
    static async updateBasicInfo(
        fixtureId: string,
        userId: string,
        updates: {
            title?: string;
            description?: string;
        }
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'updateBasicInfo', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const updateData: Partial<Omit<IFixture, 'id'>> = {};

            if (updates.title) {
                updateData.title = updates.title.trim();
            }

            if (updates.description !== undefined) {
                updateData.description = updates.description.trim();
            }

            const result = await fixtureAPI.update(fixtureId, updateData);

            if (result.success) {
                ApiLogger.success('FixtureService', 'updateBasicInfo', { fixtureId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'updateBasicInfo', error);
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
     * Update fixture schedule
     */
    static async updateSchedule(
        fixtureId: string,
        userId: string,
        schedule: {
            registrationStartTime?: string;
            matchStartTime?: string;
            matchDuration?: number;
            isRecurring?: boolean;
            pattern?: IFixture['schedule']['pattern'];
        }
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'updateSchedule', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get current fixture to merge schedule
            const fixtureResult = await fixtureAPI.getById(fixtureId);

            if (!fixtureResult.success || !fixtureResult.data) {
                return {
                    success: false,
                    error: fixtureResult.error || {
                        code: 'FIXTURE_NOT_FOUND',
                        message: 'Fixture bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const currentSchedule = fixtureResult.data.schedule;

            // Merge schedule updates
            const newSchedule = {
                ...currentSchedule,
                ...schedule,
            };

            // Validate schedule times if both are provided
            if (newSchedule.registrationStartTime && newSchedule.matchStartTime) {
                const validateSchedule = this.validateScheduleTimes(
                    newSchedule.registrationStartTime,
                    newSchedule.matchStartTime
                );

                if (!validateSchedule.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_SCHEDULE',
                            message: validateSchedule.error || 'Geçersiz zamanlama',
                            statusCode: 400,
                        },
                    };
                }
            }

            // Calculate next match date if recurring pattern changed
            let nextMatchDate: string | undefined = fixtureResult.data.nextMatchDate;
            if (schedule.isRecurring !== undefined || schedule.pattern !== undefined) {
                if (newSchedule.isRecurring && newSchedule.pattern) {
                    const nextDate = this.calculateNextDate(new Date(), newSchedule.pattern);
                    if (nextDate) {
                        nextMatchDate = nextDate.toISOString();
                    }
                } else if (schedule.isRecurring === false) {
                    nextMatchDate = undefined;
                }
            }

            const result = await fixtureAPI.update(fixtureId, {
                schedule: newSchedule,
                nextMatchDate,
            } as Partial<Omit<IFixture, 'id'>>);

            if (result.success) {
                ApiLogger.success('FixtureService', 'updateSchedule', { fixtureId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'updateSchedule', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_SCHEDULE_ERROR',
                    message: error.message || 'Zamanlama güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update fixture squad settings
     */
    static async updateSquad(
        fixtureId: string,
        userId: string,
        squad: Partial<IFixture['squad']>
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'updateSquad', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get current fixture to validate
            const fixtureResult = await fixtureAPI.getById(fixtureId);

            if (!fixtureResult.success || !fixtureResult.data) {
                return {
                    success: false,
                    error: fixtureResult.error || {
                        code: 'FIXTURE_NOT_FOUND',
                        message: 'Fixture bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const currentSquad = fixtureResult.data.squad;
            const newSquad = {
                ...currentSquad,
                ...squad,
            };

            // Validate squad numbers
            if (newSquad.minPlayersToStart > newSquad.totalPlayers) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_SQUAD',
                        message: 'Minimum oyuncu sayısı toplam kadrodan fazla olamaz',
                        statusCode: 400,
                    },
                };
            }

            if (newSquad.totalPlayers < 2) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_SQUAD',
                        message: 'Toplam oyuncu sayısı en az 2 olmalı',
                        statusCode: 400,
                    },
                };
            }

            const result = await fixtureAPI.updateSquad(fixtureId, newSquad);

            if (result.success) {
                ApiLogger.success('FixtureService', 'updateSquad', { fixtureId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'updateSquad', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_SQUAD_ERROR',
                    message: error.message || 'Kadro ayarları güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Update fixture venue
     */
    static async updateVenue(
        fixtureId: string,
        userId: string,
        venue: Partial<IFixture['venue']>
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'updateVenue', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const result = await fixtureAPI.updateVenue(fixtureId, venue);

            if (result.success) {
                ApiLogger.success('FixtureService', 'updateVenue', { fixtureId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'updateVenue', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_VENUE_ERROR',
                    message: error.message || 'Saha bilgileri güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 3. PLAYER LIST MANAGEMENT
    // ============================================

    /**
     * Switch player list to auto mode (inherit from league)
     */
    static async switchToAutoMode(
        fixtureId: string,
        userId: string,
        listType: 'premium' | 'direct'
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'switchToAutoMode', {
                fixtureId,
                userId,
                listType,
            });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const result = await fixtureAPI.switchToAutoMode(fixtureId, listType);

            if (result.success) {
                ApiLogger.success('FixtureService', 'switchToAutoMode', {
                    fixtureId,
                    listType,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'switchToAutoMode', error);
            return {
                success: false,
                error: {
                    code: 'SWITCH_AUTO_ERROR',
                    message: error.message || 'Otomatik moda geçilirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Switch player list to custom mode
     */
    static async switchToCustomMode(
        fixtureId: string,
        userId: string,
        listType: 'premium' | 'direct',
        customPlayers: string[]
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'switchToCustomMode', {
                fixtureId,
                userId,
                listType,
                playerCount: customPlayers.length,
            });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate all players exist
            const validatePlayers = await this.validatePlayerIds(customPlayers);
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

            const result = await fixtureAPI.switchToCustomMode(
                fixtureId,
                listType,
                customPlayers
            );

            if (result.success) {
                ApiLogger.success('FixtureService', 'switchToCustomMode', {
                    fixtureId,
                    listType,
                    playerCount: customPlayers.length,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'switchToCustomMode', error);
            return {
                success: false,
                error: {
                    code: 'SWITCH_CUSTOM_ERROR',
                    message: error.message || 'Özel moda geçilirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Add player to custom list
     */
    static async addPlayerToCustomList(
        fixtureId: string,
        userId: string,
        listType: 'premium' | 'direct',
        playerId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'addPlayerToCustomList', {
                fixtureId,
                userId,
                listType,
                playerId,
            });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
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

            const result = await fixtureAPI.addPlayerToCustomList(
                fixtureId,
                listType,
                playerId
            );

            if (result.success) {
                ApiLogger.success('FixtureService', 'addPlayerToCustomList', {
                    fixtureId,
                    listType,
                    playerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'addPlayerToCustomList', error);
            return {
                success: false,
                error: {
                    code: 'ADD_PLAYER_ERROR',
                    message: error.message || 'Oyuncu eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove player from custom list
     */
    static async removePlayerFromCustomList(
        fixtureId: string,
        userId: string,
        listType: 'premium' | 'direct',
        playerId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'removePlayerFromCustomList', {
                fixtureId,
                userId,
                listType,
                playerId,
            });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const result = await fixtureAPI.removePlayerFromCustomList(
                fixtureId,
                listType,
                playerId
            );

            if (result.success) {
                ApiLogger.success('FixtureService', 'removePlayerFromCustomList', {
                    fixtureId,
                    listType,
                    playerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'removePlayerFromCustomList', error);
            return {
                success: false,
                error: {
                    code: 'REMOVE_PLAYER_ERROR',
                    message: error.message || 'Oyuncu çıkarılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Bulk add players to custom list
     */
    static async addMultiplePlayersToCustomList(
        fixtureId: string,
        userId: string,
        listType: 'premium' | 'direct',
        playerIds: string[]
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'addMultiplePlayersToCustomList', {
                fixtureId,
                userId,
                listType,
                count: playerIds.length,
            });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate all players exist
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

            // Get current fixture
            const fixtureResult = await fixtureAPI.getById(fixtureId);

            if (!fixtureResult.success || !fixtureResult.data) {
                return {
                    success: false,
                    error: fixtureResult.error || {
                        code: 'FIXTURE_NOT_FOUND',
                        message: 'Fixture bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const currentList = fixtureResult.data.players[listType];

            if (currentList.mode !== 'custom') {
                return {
                    success: false,
                    error: {
                        code: 'NOT_CUSTOM_MODE',
                        message: 'Oyuncu listesi özel modda olmalı',
                        statusCode: 400,
                    },
                };
            }

            const currentOverrides = currentList.overrides || [];
            const newOverrides = [
                ...new Set([...currentOverrides, ...playerIds]),
            ];

            const newConfig: PlayerListConfig = {
                mode: 'custom',
                inherited: currentList.inherited,
                overrides: newOverrides,
            };

            const result = await fixtureAPI.updatePlayerListConfig(
                fixtureId,
                listType,
                newConfig
            );

            if (result.success) {
                ApiLogger.success('FixtureService', 'addMultiplePlayersToCustomList', {
                    fixtureId,
                    listType,
                    added: newOverrides.length - currentOverrides.length,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'addMultiplePlayersToCustomList', error);
            return {
                success: false,
                error: {
                    code: 'ADD_MULTIPLE_ERROR',
                    message: error.message || 'Oyuncular eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 4. PERMISSION MANAGEMENT
    // ============================================

    /**
     * Add organizer to fixture
     */
    static async addOrganizer(
        fixtureId: string,
        requesterId: string,
        organizerId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'addOrganizer', {
                fixtureId,
                requesterId,
                organizerId,
            });

            // Check if requester is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, requesterId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Organizatör ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate new organizer exists
            const playerCheck = await playerAPI.exists(organizerId);
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

            const result = await fixtureAPI.addOrganizer(fixtureId, organizerId);

            if (result.success) {
                ApiLogger.success('FixtureService', 'addOrganizer', {
                    fixtureId,
                    organizerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'addOrganizer', error);
            return {
                success: false,
                error: {
                    code: 'ADD_ORGANIZER_ERROR',
                    message: error.message || 'Organizatör eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove organizer from fixture
     */
    static async removeOrganizer(
        fixtureId: string,
        requesterId: string,
        organizerId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'removeOrganizer', {
                fixtureId,
                requesterId,
                organizerId,
            });

            // Check if requester is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, requesterId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Organizatör çıkarma yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Get fixture to check organizers count
            const fixtureResult = await fixtureAPI.getById(fixtureId);

            if (!fixtureResult.success || !fixtureResult.data) {
                return {
                    success: false,
                    error: fixtureResult.error || {
                        code: 'FIXTURE_NOT_FOUND',
                        message: 'Fixture bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            // Cannot remove last organizer
            if (fixtureResult.data.permissions.organizers.length <= 1) {
                return {
                    success: false,
                    error: {
                        code: 'LAST_ORGANIZER',
                        message: 'Son organizatör çıkarılamaz',
                        statusCode: 400,
                    },
                };
            }

            const result = await fixtureAPI.removeOrganizer(fixtureId, organizerId);

            if (result.success) {
                ApiLogger.success('FixtureService', 'removeOrganizer', {
                    fixtureId,
                    organizerId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'removeOrganizer', error);
            return {
                success: false,
                error: {
                    code: 'REMOVE_ORGANIZER_ERROR',
                    message: error.message || 'Organizatör çıkarılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Add team builder to fixture
     */
    static async addTeamBuilder(
        fixtureId: string,
        requesterId: string,
        teamBuilderId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'addTeamBuilder', {
                fixtureId,
                requesterId,
                teamBuilderId,
            });

            // Check if requester is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, requesterId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Takım kurucusu ekleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate team builder exists
            const playerCheck = await playerAPI.exists(teamBuilderId);
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

            const result = await fixtureAPI.addTeamBuilder(fixtureId, teamBuilderId);

            if (result.success) {
                ApiLogger.success('FixtureService', 'addTeamBuilder', {
                    fixtureId,
                    teamBuilderId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'addTeamBuilder', error);
            return {
                success: false,
                error: {
                    code: 'ADD_TEAM_BUILDER_ERROR',
                    message: error.message || 'Takım kurucusu eklenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Remove team builder from fixture
     */
    static async removeTeamBuilder(
        fixtureId: string,
        requesterId: string,
        teamBuilderId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'removeTeamBuilder', {
                fixtureId,
                requesterId,
                teamBuilderId,
            });

            // Check if requester is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, requesterId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Takım kurucusu çıkarma yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const result = await fixtureAPI.removeTeamBuilder(fixtureId, teamBuilderId);

            if (result.success) {
                ApiLogger.success('FixtureService', 'removeTeamBuilder', {
                    fixtureId,
                    teamBuilderId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'removeTeamBuilder', error);
            return {
                success: false,
                error: {
                    code: 'REMOVE_TEAM_BUILDER_ERROR',
                    message: error.message || 'Takım kurucusu çıkarılırken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 5. STATUS MANAGEMENT
    // ============================================

    /**
     * Activate fixture
     */
    static async activateFixture(
        fixtureId: string,
        userId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'activateFixture', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı aktifleştirme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const result = await fixtureAPI.activate(fixtureId);

            if (result.success) {
                ApiLogger.success('FixtureService', 'activateFixture', { fixtureId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'activateFixture', error);
            return {
                success: false,
                error: {
                    code: 'ACTIVATE_ERROR',
                    message: error.message || 'Fixture aktifleştirilirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Deactivate fixture
     */
    static async deactivateFixture(
        fixtureId: string,
        userId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'deactivateFixture', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı deaktifleştirme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const result = await fixtureAPI.deactivate(fixtureId);

            if (result.success) {
                ApiLogger.success('FixtureService', 'deactivateFixture', { fixtureId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'deactivateFixture', error);
            return {
                success: false,
                error: {
                    code: 'DEACTIVATE_ERROR',
                    message: error.message || 'Fixture deaktifleştirilirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Toggle fixture status
     */
    static async toggleStatus(
        fixtureId: string,
        userId: string
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'toggleStatus', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ın durumunu değiştirme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const result = await fixtureAPI.toggleStatus(fixtureId);

            if (result.success) {
                ApiLogger.success('FixtureService', 'toggleStatus', { fixtureId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'toggleStatus', error);
            return {
                success: false,
                error: {
                    code: 'TOGGLE_STATUS_ERROR',
                    message: error.message || 'Durum değiştirilirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 6. RECURRING PATTERN MANAGEMENT
    // ============================================

    /**
     * Update recurring pattern
     */
    static async updateRecurringPattern(
        fixtureId: string,
        userId: string,
        pattern: IFixture['schedule']['pattern'] | null
    ): Promise<ApiResponse<IFixture>> {
        try {
            ApiLogger.log('FixtureService', 'updateRecurringPattern', {
                fixtureId,
                userId,
                hasPattern: !!pattern,
            });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı düzenleme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            // Validate pattern
            if (pattern) {
                const validatePattern = this.validateRecurringPattern(pattern);
                if (!validatePattern.valid) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PATTERN',
                            message: validatePattern.error || 'Geçersiz tekrar deseni',
                            statusCode: 400,
                        },
                    };
                }
            }

            const result = await fixtureAPI.updatePattern(fixtureId, pattern || undefined);

            if (result.success && result.data) {
                // Calculate and update next match date
                if (pattern) {
                    const nextDate = this.calculateNextDate(new Date(), pattern);
                    if (nextDate) {
                        await fixtureAPI.updateNextMatchDate(
                            fixtureId,
                            nextDate.toISOString()
                        );
                    }
                } else {
                    await fixtureAPI.updateNextMatchDate(fixtureId, '');
                }

                ApiLogger.success('FixtureService', 'updateRecurringPattern', {
                    fixtureId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'updateRecurringPattern', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_PATTERN_ERROR',
                    message: error.message || 'Tekrar deseni güncellenirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Calculate next match date
     */
    static async calculateNextMatchDate(
        fixtureId: string
    ): Promise<ApiResponse<string | null>> {
        return fixtureAPI.calculateNextMatchDate(fixtureId);
    }

    // ============================================
    // 7. QUERY & READ OPERATIONS
    // ============================================

    static async getFixture(fixtureId: string): Promise<ApiResponse<IFixture>> {
        return fixtureAPI.getById(fixtureId);
    }

    static async getLeagueFixtures(leagueId: string): Promise<ApiResponse<IFixture[]>> {
        return fixtureAPI.getByLeague(leagueId);
    }

    static async getActiveFixtures(leagueId: string): Promise<ApiResponse<IFixture[]>> {
        return fixtureAPI.getActiveFixtures(leagueId);
    }

    static async getInactiveFixtures(leagueId: string): Promise<ApiResponse<IFixture[]>> {
        return fixtureAPI.getInactiveFixtures(leagueId);
    }

    /**
     * Get fixture with statistics
     */
    static async getFixtureWithStats(fixtureId: string): Promise<ApiResponse<{
        fixture: IFixture;
        totalMatches: number;
        upcomingMatches: number;
        completedMatches: number;
        nextMatchDate: string | null;
    }>> {
        try {
            const fixtureResult = await fixtureAPI.getById(fixtureId);

            if (!fixtureResult.success || !fixtureResult.data) {
                return {
                    success: false,
                    error: fixtureResult.error || {
                        code: 'FIXTURE_NOT_FOUND',
                        message: 'Fixture bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const fixture = fixtureResult.data;

            // Get matches for this fixture
            const matchesResult = await matchAPI.getByFixture(fixtureId);
            const matches = matchesResult.success && matchesResult.data ? matchesResult.data : [];

            const totalMatches = matches.length;
            const completedMatches = matches.filter(m => m.status === 'completed').length;
            const upcomingMatches = matches.filter(m =>
                m.status === 'created' ||
                m.status === 'registration_open' ||
                m.status === 'registration_closed' ||
                m.status === 'teams_set'
            ).length;

            return {
                success: true,
                data: {
                    fixture,
                    totalMatches,
                    upcomingMatches,
                    completedMatches,
                    nextMatchDate: fixture.nextMatchDate || null,
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
    // 8. DELETE OPERATIONS
    // ============================================

    /**
     * Delete fixture (only if no matches exist)
     */
    static async deleteFixture(
        fixtureId: string,
        userId: string
    ): Promise<ApiResponse<void>> {
        try {
            ApiLogger.log('FixtureService', 'deleteFixture', { fixtureId, userId });

            // Check if user is organizer
            const isOrganizerCheck = await fixtureAPI.isOrganizer(fixtureId, userId);
            if (!isOrganizerCheck.success || !isOrganizerCheck.data) {
                return {
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Bu fixture\'ı silme yetkiniz yok',
                        statusCode: 403,
                    },
                };
            }

            const fixtureResult = await fixtureAPI.getById(fixtureId);

            if (!fixtureResult.success || !fixtureResult.data) {
                return {
                    success: false,
                    error: fixtureResult.error || {
                        code: 'FIXTURE_NOT_FOUND',
                        message: 'Fixture bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            // Check if there are any matches
            if (fixtureResult.data.totalMatches > 0) {
                return {
                    success: false,
                    error: {
                        code: 'HAS_MATCHES',
                        message: 'Maçları olan fixture silinemez',
                        statusCode: 400,
                    },
                };
            }

            const result = await fixtureAPI.delete(fixtureId);

            if (result.success) {
                ApiLogger.success('FixtureService', 'deleteFixture', { fixtureId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('FixtureService', 'deleteFixture', error);
            return {
                success: false,
                error: {
                    code: 'DELETE_FIXTURE_ERROR',
                    message: error.message || 'Fixture silinirken hata oluştu',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 9. HELPER METHODS
    // ============================================

    /**
     * Validate schedule times
     */
    private static validateScheduleTimes(
        registrationStartTime: string,
        matchStartTime: string
    ): { valid: boolean; error?: string } {
        // Parse times (format: "HH:MM")
        const regParts = registrationStartTime.split(':');
        const matchParts = matchStartTime.split(':');

        if (regParts.length !== 2 || matchParts.length !== 2) {
            return {
                valid: false,
                error: 'Saat formatı geçersiz (HH:MM olmalı)',
            };
        }

        const regHour = parseInt(regParts[0]);
        const regMin = parseInt(regParts[1]);
        const matchHour = parseInt(matchParts[0]);
        const matchMin = parseInt(matchParts[1]);

        if (isNaN(regHour) || isNaN(regMin) || isNaN(matchHour) || isNaN(matchMin)) {
            return {
                valid: false,
                error: 'Saat değerleri sayı olmalı',
            };
        }

        if (regHour < 0 || regHour > 23 || matchHour < 0 || matchHour > 23) {
            return {
                valid: false,
                error: 'Saat 0-23 arasında olmalı',
            };
        }

        if (regMin < 0 || regMin > 59 || matchMin < 0 || matchMin > 59) {
            return {
                valid: false,
                error: 'Dakika 0-59 arasında olmalı',
            };
        }

        // Registration must be before match start
        const regTotalMin = regHour * 60 + regMin;
        const matchTotalMin = matchHour * 60 + matchMin;

        if (regTotalMin >= matchTotalMin) {
            return {
                valid: false,
                error: 'Kayıt başlangıç saati maç başlangıç saatinden önce olmalı',
            };
        }

        return { valid: true };
    }

    /**
     * Validate recurring pattern
     */
    private static validateRecurringPattern(
        pattern: IFixture['schedule']['pattern']
    ): { valid: boolean; error?: string } {
        if (!pattern) {
            return { valid: true };
        }

        switch (pattern.type) {
            case 'weekly':
            case 'biweekly':
                if (pattern.dayOfWeek === undefined) {
                    return {
                        valid: false,
                        error: 'Haftanın günü belirtilmeli',
                    };
                }
                if (pattern.dayOfWeek < 0 || pattern.dayOfWeek > 6) {
                    return {
                        valid: false,
                        error: 'Haftanın günü 0-6 arasında olmalı',
                    };
                }
                break;

            case 'monthly':
                if (pattern.dayOfMonth === undefined) {
                    return {
                        valid: false,
                        error: 'Ayın günü belirtilmeli',
                    };
                }
                if (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31) {
                    return {
                        valid: false,
                        error: 'Ayın günü 1-31 arasında olmalı',
                    };
                }
                break;

            case 'custom':
                if (pattern.interval === undefined) {
                    return {
                        valid: false,
                        error: 'Gün aralığı belirtilmeli',
                    };
                }
                if (pattern.interval < 1) {
                    return {
                        valid: false,
                        error: 'Gün aralığı en az 1 olmalı',
                    };
                }
                break;

            default:
                return {
                    valid: false,
                    error: 'Geçersiz tekrar tipi',
                };
        }

        // Validate endsAt if provided
        if (pattern.endsAt) {
            const endsAt = new Date(pattern.endsAt);
            if (isNaN(endsAt.getTime())) {
                return {
                    valid: false,
                    error: 'Bitiş tarihi geçersiz',
                };
            }
            if (endsAt < new Date()) {
                return {
                    valid: false,
                    error: 'Bitiş tarihi geçmişte olamaz',
                };
            }
        }

        return { valid: true };
    }

    /**
     * Calculate next date based on pattern
     */
    private static calculateNextDate(
        from: Date,
        pattern: IFixture['schedule']['pattern']
    ): Date | null {
        if (!pattern) return null;

        let nextDate: Date | null = null;

        switch (pattern.type) {
            case 'weekly':
                nextDate = this.getNextWeeklyDate(from, pattern.dayOfWeek!);
                break;
            case 'biweekly':
                nextDate = this.getNextBiweeklyDate(from, pattern.dayOfWeek!);
                break;
            case 'monthly':
                nextDate = this.getNextMonthlyDate(from, pattern.dayOfMonth!);
                break;
            case 'custom':
                nextDate = this.getNextCustomDate(from, pattern.interval!);
                break;
        }

        // Check if pattern has ended
        if (pattern.endsAt && nextDate) {
            const endsAt = new Date(pattern.endsAt);
            if (nextDate > endsAt) {
                return null;
            }
        }

        return nextDate;
    }

    private static getNextWeeklyDate(from: Date, dayOfWeek: number): Date {
        const result = new Date(from);
        const currentDay = result.getDay();
        const daysUntilNext = (dayOfWeek + 7 - currentDay) % 7 || 7;
        result.setDate(result.getDate() + daysUntilNext);
        return result;
    }

    private static getNextBiweeklyDate(from: Date, dayOfWeek: number): Date {
        const nextWeekly = this.getNextWeeklyDate(from, dayOfWeek);
        nextWeekly.setDate(nextWeekly.getDate() + 7);
        return nextWeekly;
    }

    private static getNextMonthlyDate(from: Date, dayOfMonth: number): Date {
        const result = new Date(from);
        result.setDate(dayOfMonth);

        if (result <= from) {
            result.setMonth(result.getMonth() + 1);
        }

        return result;
    }

    private static getNextCustomDate(from: Date, intervalDays: number): Date {
        const result = new Date(from);
        result.setDate(result.getDate() + intervalDays);
        return result;
    }

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
}

export default FixtureService;