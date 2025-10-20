// ============================================
// services/LeagueSettingsService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { leagueSettingsAPI } from '../../api/apiLayer/leagueSettingsAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { ILeagueSettings } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class LeagueSettingsService {
    // ============================================
    // 1. CORE OPERATIONS
    // ============================================

    /**
     * Get league settings
     */
    static async getLeagueSettings(leagueId: string): Promise<ApiResponse<ILeagueSettings | null>> {
        return leagueSettingsAPI.getByLeague(leagueId);
    }

    /**
     * Get or create league settings
     */
    static async getOrCreateSettings(
        leagueId: string,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            ApiLogger.log('LeagueSettingsService', 'getOrCreateSettings', { leagueId });

            const result = await leagueSettingsAPI.getOrCreate(leagueId, userId);

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'getOrCreateSettings', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'getOrCreateSettings', error);
            return {
                success: false,
                error: {
                    code: 'GET_OR_CREATE_ERROR',
                    message: error.message || 'Ayarlar alınamadı veya oluşturulamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Create default settings for league
     */
    static async createDefaultSettings(
        leagueId: string,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            ApiLogger.log('LeagueSettingsService', 'createDefaultSettings', { leagueId });

            const result = await leagueSettingsAPI.createDefaultSettings(leagueId, userId);

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'createDefaultSettings', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'createDefaultSettings', error);
            return {
                success: false,
                error: {
                    code: 'CREATE_SETTINGS_ERROR',
                    message: error.message || 'Varsayılan ayarlar oluşturulamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Check if settings exist
     */
    static async settingsExist(leagueId: string): Promise<ApiResponse<boolean>> {
        return leagueSettingsAPI.exists(leagueId);
    }

    // ============================================
    // 2. RULES MANAGEMENT
    // ============================================

    /**
     * Update general rules
     */
    static async updateRules(
        leagueId: string,
        rules: Partial<ILeagueSettings['rules']>,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            // Validate rules
            if (rules.lateArrivalPenalty !== undefined && rules.lateArrivalPenalty < 0) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_PENALTY',
                        message: 'Ceza miktarı negatif olamaz',
                        statusCode: 400,
                    },
                };
            }

            if (rules.minAttendanceRate !== undefined) {
                if (rules.minAttendanceRate < 0 || rules.minAttendanceRate > 100) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_ATTENDANCE_RATE',
                            message: 'Katılım oranı 0-100 arasında olmalı',
                            statusCode: 400,
                        },
                    };
                }
            }

            ApiLogger.log('LeagueSettingsService', 'updateRules', { leagueId });

            const result = await leagueSettingsAPI.updateRules(leagueId, rules, userId);

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'updateRules', { leagueId });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'updateRules', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_RULES_ERROR',
                    message: error.message || 'Kurallar güncellenemedi',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Set penalty amounts
     */
    static async setPenalties(
        leagueId: string,
        penalties: {
            lateArrival?: number;
            absentWithoutNotice?: number;
            yellowCard?: number;
            redCard?: number;
        },
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        const rules: Partial<ILeagueSettings['rules']> = {};

        if (penalties.lateArrival !== undefined) {
            rules.lateArrivalPenalty = penalties.lateArrival;
        }
        if (penalties.absentWithoutNotice !== undefined) {
            rules.absentWithoutNoticePenalty = penalties.absentWithoutNotice;
        }
        if (penalties.yellowCard !== undefined) {
            rules.yellowCardFine = penalties.yellowCard;
        }
        if (penalties.redCard !== undefined) {
            rules.redCardFine = penalties.redCard;
        }

        return this.updateRules(leagueId, rules, userId);
    }

    // ============================================
    // 3. MATCH RULES MANAGEMENT
    // ============================================

    /**
     * Update match rules
     */
    static async updateMatchRules(
        leagueId: string,
        matchRules: Partial<ILeagueSettings['matchRules']>,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            // Validate match rules
            if (matchRules.maxGuestPlayersPerMatch !== undefined) {
                if (matchRules.maxGuestPlayersPerMatch < 0) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_MAX_GUEST',
                            message: 'Maksimum misafir oyuncu sayısı negatif olamaz',
                            statusCode: 400,
                        },
                    };
                }
            }

            if (matchRules.guestPlayerPriceMultiplier !== undefined) {
                if (matchRules.guestPlayerPriceMultiplier < 0) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PRICE_MULTIPLIER',
                            message: 'Fiyat çarpanı negatif olamaz',
                            statusCode: 400,
                        },
                    };
                }
            }

            ApiLogger.log('LeagueSettingsService', 'updateMatchRules', { leagueId });

            const result = await leagueSettingsAPI.updateMatchRules(
                leagueId,
                matchRules,
                userId
            );

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'updateMatchRules', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'updateMatchRules', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_MATCH_RULES_ERROR',
                    message: error.message || 'Maç kuralları güncellenemedi',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Toggle guest players
     */
    static async toggleGuestPlayers(
        leagueId: string,
        allowed: boolean,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        return leagueSettingsAPI.toggleGuestPlayers(leagueId, allowed, userId);
    }

    /**
     * Set team balance algorithm
     */
    static async setTeamBalanceAlgorithm(
        leagueId: string,
        algorithm: 'random' | 'rating' | 'position',
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        return this.updateMatchRules(
            leagueId,
            { teamBalanceAlgorithm: algorithm },
            userId
        );
    }

    /**
     * Check if guest players are allowed
     */
    static async areGuestPlayersAllowed(leagueId: string): Promise<ApiResponse<boolean>> {
        return leagueSettingsAPI.areGuestPlayersAllowed(leagueId);
    }

    /**
     * Get max guest players allowed
     */
    static async getMaxGuestPlayers(leagueId: string): Promise<ApiResponse<number>> {
        return leagueSettingsAPI.getMaxGuestPlayers(leagueId);
    }

    // ============================================
    // 4. REGISTRATION RULES MANAGEMENT
    // ============================================

    /**
     * Update registration rules
     */
    static async updateRegistrationRules(
        leagueId: string,
        registration: Partial<ILeagueSettings['registration']>,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            // Validate registration rules
            if (registration.lateRegistrationDeadlineHours !== undefined) {
                if (registration.lateRegistrationDeadlineHours < 0) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_DEADLINE',
                            message: 'Kayıt son tarihi negatif olamaz',
                            statusCode: 400,
                        },
                    };
                }
            }

            if (registration.cancellationDeadlineHours !== undefined) {
                if (registration.cancellationDeadlineHours < 0) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_CANCELLATION',
                            message: 'İptal son tarihi negatif olamaz',
                            statusCode: 400,
                        },
                    };
                }
            }

            ApiLogger.log('LeagueSettingsService', 'updateRegistrationRules', {
                leagueId,
            });

            const result = await leagueSettingsAPI.updateRegistrationRules(
                leagueId,
                registration,
                userId
            );

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'updateRegistrationRules', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'updateRegistrationRules', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_REGISTRATION_ERROR',
                    message: error.message || 'Kayıt kuralları güncellenemedi',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Check if late registration is allowed
     */
    static async isLateRegistrationAllowed(
        leagueId: string
    ): Promise<ApiResponse<boolean>> {
        try {
            const settingsResult = await this.getLeagueSettings(leagueId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: true,
                    data: true, // Default to true
                };
            }

            return {
                success: true,
                data: settingsResult.data.registration.allowLateRegistration,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'CHECK_LATE_REGISTRATION_ERROR',
                    message: error.message || 'Geç kayıt kontrolü yapılamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 5. SCORING RULES MANAGEMENT
    // ============================================

    /**
     * Update scoring rules
     */
    static async updateScoringRules(
        leagueId: string,
        scoring: Partial<ILeagueSettings['scoring']>,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            // Validate scoring rules
            if (scoring.scoreConfirmationTimeoutHours !== undefined) {
                if (scoring.scoreConfirmationTimeoutHours < 0) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_TIMEOUT',
                            message: 'Onay süresi negatif olamaz',
                            statusCode: 400,
                        },
                    };
                }
            }

            ApiLogger.log('LeagueSettingsService', 'updateScoringRules', { leagueId });

            const result = await leagueSettingsAPI.updateScoringRules(
                leagueId,
                scoring,
                userId
            );

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'updateScoringRules', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'updateScoringRules', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_SCORING_ERROR',
                    message: error.message || 'Skor kuralları güncellenemedi',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 6. RATING RULES MANAGEMENT
    // ============================================

    /**
     * Update rating rules
     */
    static async updateRatingRules(
        leagueId: string,
        rating: Partial<ILeagueSettings['rating']>,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            // Validate rating rules
            if (rating.ratingDeadlineHours !== undefined && rating.ratingDeadlineHours < 0) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_DEADLINE',
                        message: 'Puanlama son tarihi negatif olamaz',
                        statusCode: 400,
                    },
                };
            }

            if (rating.minRatingsForMVP !== undefined && rating.minRatingsForMVP < 1) {
                return {
                    success: false,
                    error: {
                        code: 'INVALID_MIN_RATINGS',
                        message: 'Minimum puanlama sayısı en az 1 olmalı',
                        statusCode: 400,
                    },
                };
            }

            ApiLogger.log('LeagueSettingsService', 'updateRatingRules', { leagueId });

            const result = await leagueSettingsAPI.updateRatingRules(
                leagueId,
                rating,
                userId
            );

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'updateRatingRules', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'updateRatingRules', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_RATING_ERROR',
                    message: error.message || 'Puanlama kuralları güncellenemedi',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Toggle rating system
     */
    static async toggleRatingSystem(
        leagueId: string,
        enabled: boolean,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        return leagueSettingsAPI.toggleRatingSystem(leagueId, enabled, userId);
    }

    /**
     * Check if rating is enabled
     */
    static async isRatingEnabled(leagueId: string): Promise<ApiResponse<boolean>> {
        return leagueSettingsAPI.isRatingEnabled(leagueId);
    }

    // ============================================
    // 7. COMMENT RULES MANAGEMENT
    // ============================================

    /**
     * Update comment rules
     */
    static async updateCommentRules(
        leagueId: string,
        comments: Partial<ILeagueSettings['comments']>,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            // Validate comment rules
            if (comments.maxLength !== undefined) {
                if (comments.maxLength < 10 || comments.maxLength > 5000) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_MAX_LENGTH',
                            message: 'Maksimum uzunluk 10-5000 arasında olmalı',
                            statusCode: 400,
                        },
                    };
                }
            }

            ApiLogger.log('LeagueSettingsService', 'updateCommentRules', { leagueId });

            const result = await leagueSettingsAPI.updateCommentRules(
                leagueId,
                comments,
                userId
            );

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'updateCommentRules', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'updateCommentRules', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_COMMENTS_ERROR',
                    message: error.message || 'Yorum kuralları güncellenemedi',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Toggle comments
     */
    static async toggleComments(
        leagueId: string,
        enabled: boolean,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        return leagueSettingsAPI.toggleComments(leagueId, enabled, userId);
    }

    /**
     * Check if comments are enabled
     */
    static async areCommentsEnabled(leagueId: string): Promise<ApiResponse<boolean>> {
        return leagueSettingsAPI.areCommentsEnabled(leagueId);
    }

    // ============================================
    // 8. PAYMENT SETTINGS MANAGEMENT
    // ============================================

    /**
     * Update payment settings
     */
    static async updatePaymentSettings(
        leagueId: string,
        payment: Partial<ILeagueSettings['payment']>,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            // Validate payment settings
            if (payment.defaultPricePerPlayer !== undefined) {
                if (payment.defaultPricePerPlayer < 0) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_PRICE',
                            message: 'Fiyat negatif olamaz',
                            statusCode: 400,
                        },
                    };
                }
            }

            ApiLogger.log('LeagueSettingsService', 'updatePaymentSettings', {
                leagueId,
            });

            const result = await leagueSettingsAPI.updatePaymentSettings(
                leagueId,
                payment,
                userId
            );

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'updatePaymentSettings', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'updatePaymentSettings', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_PAYMENT_ERROR',
                    message: error.message || 'Ödeme ayarları güncellenemedi',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Set default payment info
     */
    static async setDefaultPaymentInfo(
        leagueId: string,
        iban: string,
        accountName: string,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        return this.updatePaymentSettings(
            leagueId,
            {
                defaultIban: iban,
                defaultAccountName: accountName,
            },
            userId
        );
    }

    /**
     * Get default price per player
     */
    static async getDefaultPrice(leagueId: string): Promise<ApiResponse<number>> {
        try {
            const settingsResult = await this.getLeagueSettings(leagueId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: true,
                    data: 0, // Default
                };
            }

            return {
                success: true,
                data: settingsResult.data.payment.defaultPricePerPlayer,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_DEFAULT_PRICE_ERROR',
                    message: error.message || 'Varsayılan fiyat alınamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 9. INTEGRATIONS MANAGEMENT
    // ============================================

    /**
     * Update integrations
     */
    static async updateIntegrations(
        leagueId: string,
        integrations: Partial<ILeagueSettings['integrations']>,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            ApiLogger.log('LeagueSettingsService', 'updateIntegrations', { leagueId });

            const result = await leagueSettingsAPI.updateIntegrations(
                leagueId,
                integrations,
                userId
            );

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'updateIntegrations', {
                    leagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'updateIntegrations', error);
            return {
                success: false,
                error: {
                    code: 'UPDATE_INTEGRATIONS_ERROR',
                    message: error.message || 'Entegrasyonlar güncellenemedi',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Toggle integration
     */
    static async toggleIntegration(
        leagueId: string,
        integration: keyof ILeagueSettings['integrations'],
        enabled: boolean,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        return leagueSettingsAPI.toggleIntegration(leagueId, integration, enabled, userId);
    }

    /**
     * Check if integration is enabled
     */
    static async isIntegrationEnabled(
        leagueId: string,
        integration: keyof ILeagueSettings['integrations']
    ): Promise<ApiResponse<boolean>> {
        try {
            const settingsResult = await this.getLeagueSettings(leagueId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: true,
                    data: false, // Default to false
                };
            }

            return {
                success: true,
                data: settingsResult.data.integrations?.[integration] || false,
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'CHECK_INTEGRATION_ERROR',
                    message: error.message || 'Entegrasyon kontrolü yapılamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    // ============================================
    // 10. SETTINGS SUMMARY & HELPERS
    // ============================================

    /**
     * Get settings summary for display
     */
    static async getSettingsSummary(leagueId: string): Promise<ApiResponse<{
        guestPlayersAllowed: boolean;
        ratingEnabled: boolean;
        commentsEnabled: boolean;
        autoAssignTeams: boolean;
        defaultPrice: number;
        currency: string;
        activeIntegrations: string[];
    }>> {
        try {
            const settingsResult = await this.getLeagueSettings(leagueId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'GET_SETTINGS_ERROR',
                        message: 'Ayarlar alınamadı',
                        statusCode: 500,
                    },
                };
            }

            const settings = settingsResult.data;

            const activeIntegrations = settings.integrations
                ? Object.entries(settings.integrations)
                    .filter(([_, enabled]) => enabled)
                    .map(([integration, _]) => integration)
                : [];

            return {
                success: true,
                data: {
                    guestPlayersAllowed: settings.matchRules.allowGuestPlayers,
                    ratingEnabled: settings.rating.enabled,
                    commentsEnabled: settings.comments.enabled,
                    autoAssignTeams: settings.matchRules.autoAssignTeams,
                    defaultPrice: settings.payment.defaultPricePerPlayer,
                    currency: settings.payment.currency,
                    activeIntegrations,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_SUMMARY_ERROR',
                    message: error.message || 'Özet alınamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Validate league settings
     */
    static async validateSettings(leagueId: string): Promise<ApiResponse<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>> {
        try {
            const settingsResult = await this.getLeagueSettings(leagueId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: false,
                    error: settingsResult.error || {
                        code: 'GET_SETTINGS_ERROR',
                        message: 'Ayarlar alınamadı',
                        statusCode: 500,
                    },
                };
            }

            const settings = settingsResult.data;
            const errors: string[] = [];
            const warnings: string[] = [];

            // Validate penalties
            if (settings.rules.lateArrivalPenalty && settings.rules.lateArrivalPenalty < 0) {
                errors.push('Geç gelme cezası negatif olamaz');
            }

            // Validate max guest players
            if (settings.matchRules.maxGuestPlayersPerMatch < 0) {
                errors.push('Maksimum misafir oyuncu sayısı negatif olamaz');
            }

            // Validate price multiplier
            if (settings.matchRules.guestPlayerPriceMultiplier < 0) {
                errors.push('Fiyat çarpanı negatif olamaz');
            }

            // Validate registration deadlines
            if (settings.registration.lateRegistrationDeadlineHours < 0) {
                errors.push('Kayıt son tarihi negatif olamaz');
            }

            // Validate rating settings
            if (settings.rating.enabled && settings.rating.minRatingsForMVP < 1) {
                errors.push('Minimum puanlama sayısı en az 1 olmalı');
            }

            // Validate comment settings
            if (settings.comments.enabled && settings.comments.maxLength < 10) {
                errors.push('Maksimum yorum uzunluğu en az 10 karakter olmalı');
            }

            // Validate payment
            if (settings.payment.defaultPricePerPlayer < 0) {
                errors.push('Varsayılan fiyat negatif olamaz');
            }

            // Warnings
            if (settings.matchRules.allowGuestPlayers && settings.matchRules.maxGuestPlayersPerMatch === 0) {
                warnings.push('Misafir oyunculara izin var ama maksimum sayı 0');
            }

            if (settings.rating.enabled && settings.rating.minRatingsForMVP > 10) {
                warnings.push('MVP için gereken minimum puanlama sayısı çok yüksek (>10)');
            }

            if (!settings.payment.defaultIban && settings.payment.paymentMethods.includes('bank_transfer')) {
                warnings.push('Banka transferi aktif ama IBAN bilgisi eksik');
            }

            const valid = errors.length === 0;

            return {
                success: true,
                data: {
                    valid,
                    errors,
                    warnings,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'VALIDATE_ERROR',
                    message: error.message || 'Doğrulama yapılamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Get feature availability
     */
    static async getFeatureAvailability(leagueId: string): Promise<ApiResponse<{
        guestPlayers: boolean;
        rating: boolean;
        comments: boolean;
        lateRegistration: boolean;
        installment: boolean;
    }>> {
        try {
            const settingsResult = await this.getLeagueSettings(leagueId);

            if (!settingsResult.success || !settingsResult.data) {
                return {
                    success: true,
                    data: {
                        guestPlayers: true,
                        rating: true,
                        comments: true,
                        lateRegistration: true,
                        installment: false,
                    },
                };
            }

            const settings = settingsResult.data;

            return {
                success: true,
                data: {
                    guestPlayers: settings.matchRules.allowGuestPlayers,
                    rating: settings.rating.enabled,
                    comments: settings.comments.enabled,
                    lateRegistration: settings.registration.allowLateRegistration,
                    installment: settings.payment.allowInstallment,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                error: {
                    code: 'GET_FEATURES_ERROR',
                    message: error.message || 'Özellikler alınamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }

    /**
     * Clone settings from another league
     */
    static async cloneSettings(
        sourceLeagueId: string,
        targetLeagueId: string,
        userId: string
    ): Promise<ApiResponse<ILeagueSettings>> {
        try {
            ApiLogger.log('LeagueSettingsService', 'cloneSettings', {
                sourceLeagueId,
                targetLeagueId,
            });

            const sourceResult = await this.getLeagueSettings(sourceLeagueId);

            if (!sourceResult.success || !sourceResult.data) {
                return {
                    success: false,
                    error: sourceResult.error || {
                        code: 'SOURCE_NOT_FOUND',
                        message: 'Kaynak lig ayarları bulunamadı',
                        statusCode: 404,
                    },
                };
            }

            const source = sourceResult.data;

            // Create new settings with same configuration
            const newSettings: Omit<ILeagueSettings, 'id'> = {
                leagueId: targetLeagueId,
                rules: { ...source.rules },
                matchRules: { ...source.matchRules },
                registration: { ...source.registration },
                scoring: { ...source.scoring },
                rating: { ...source.rating },
                comments: { ...source.comments },
                payment: { ...source.payment },
                integrations: source.integrations ? { ...source.integrations } : undefined,
                updatedAt: new Date().toISOString(),
                updatedBy: userId,
            };

            const result = await leagueSettingsAPI.create({
                ...newSettings,
                id: targetLeagueId,
            } as any);

            if (result.success) {
                ApiLogger.success('LeagueSettingsService', 'cloneSettings', {
                    targetLeagueId,
                });
            }

            return result;
        } catch (error: any) {
            ApiLogger.error('LeagueSettingsService', 'cloneSettings', error);
            return {
                success: false,
                error: {
                    code: 'CLONE_SETTINGS_ERROR',
                    message: error.message || 'Ayarlar klonlanamadı',
                    details: error,
                    statusCode: 500,
                },
            };
        }
    }
}

export default LeagueSettingsService;



/*

// ✅ Get or create settings (auto-initialize)
const settings = await LeagueSettingsService.getOrCreateSettings(leagueId, userId);

// ✅ Check if guest players allowed (before registration)
const allowGuests = await LeagueSettingsService.areGuestPlayersAllowed(leagueId);
if (!allowGuests.data) {
  return res.status(403).json({ message: 'Guest players not allowed' });
}

// ✅ Check max guest players
const maxGuests = await LeagueSettingsService.getMaxGuestPlayers(leagueId);
if (currentGuestCount >= maxGuests.data!) {
  return res.status(400).json({ message: `Max ${maxGuests.data} guests allowed` });
}

// ✅ Check if rating is enabled
const ratingEnabled = await LeagueSettingsService.isRatingEnabled(leagueId);
if (!ratingEnabled.data) {
  return res.status(403).json({ message: 'Rating system disabled' });
}

// ✅ Set penalties
await LeagueSettingsService.setPenalties(
  leagueId,
  {
    lateArrival: 50,
    absentWithoutNotice: 100,
    yellowCard: 25,
    redCard: 50,
  },
  userId
);

// ✅ Set team balance algorithm
await LeagueSettingsService.setTeamBalanceAlgorithm(
  leagueId,
  'rating',
  userId
);

// ✅ Toggle rating system
await LeagueSettingsService.toggleRatingSystem(leagueId, true, userId);

// ✅ Set payment info
await LeagueSettingsService.setDefaultPaymentInfo(
  leagueId,
  'TR123456789012345678901234',
  'John Doe',
  userId
);

// ✅ Get default price
const defaultPrice = await LeagueSettingsService.getDefaultPrice(leagueId);
// Use in match creation

// ✅ Toggle integration
await LeagueSettingsService.toggleIntegration(
  leagueId,
  'whatsapp',
  true,
  userId
);

// ✅ Get feature availability (for UI)
const features = await LeagueSettingsService.getFeatureAvailability(leagueId);
// Show/hide features based on settings

// ✅ Settings summary for dashboard
const summary = await LeagueSettingsService.getSettingsSummary(leagueId);
console.log(summary.data.activeIntegrations);
console.log(summary.data.defaultPrice);

// ✅ Validate settings
const validation = await LeagueSettingsService.validateSettings(leagueId);
if (!validation.data?.valid) {
  console.error('Errors:', validation.data?.errors);
}
console.log('Warnings:', validation.data?.warnings);

// ✅ Clone settings from another league
await LeagueSettingsService.cloneSettings(
  sourceLeagueId,
  newLeagueId,
  userId
);

// ✅ Check late registration (before allowing registration)
const allowLate = await LeagueSettingsService.isLateRegistrationAllowed(leagueId);
const hoursUntilMatch = calculateHoursUntilMatch(match);
if (!allowLate.data && hoursUntilMatch < 2) {
  return res.status(403).json({ message: 'Late registration not allowed' });
}
*/