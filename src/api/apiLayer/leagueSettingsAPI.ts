// ============================================
// api/leagueSettingsApi.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { ILeagueSettings } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';

export class LeagueSettingsAPI extends BaseAPI<ILeagueSettings> {
  constructor() {
    super('league_settings');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get settings by league ID
   */
  async getByLeague(leagueId: string): Promise<ApiResponse<ILeagueSettings | null>> {
    // Settings ID is same as league ID
    return this.getById(leagueId);
  }

  /**
   * Check if settings exist for a league
   */
  async exists(leagueId: string): Promise<ApiResponse<boolean>> {
    const result = await this.getByLeague(leagueId);
    return {
      success: true,
      data: result.success && !!result.data,
    };
  }

  // ============================================
  // SETTINGS CREATION
  // ============================================

  /**
   * Create default settings for a league
   */
  async createDefaultSettings(
    leagueId: string,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      ApiLogger.log('leagueSettings', 'createDefaultSettings', { leagueId });

      const defaultSettings: Omit<ILeagueSettings, 'id'> = {
        leagueId,
        rules: {
          lateArrivalPenalty: 0,
          absentWithoutNoticePenalty: 0,
          yellowCardFine: 0,
          redCardFine: 0,
          minAttendanceRate: 0,
        },
        matchRules: {
          allowGuestPlayers: true,
          maxGuestPlayersPerMatch: 2,
          guestPlayerPriceMultiplier: 1.5,
          autoAssignTeams: false,
          teamBalanceAlgorithm: 'random',
        },
        registration: {
          allowLateRegistration: true,
          lateRegistrationDeadlineHours: 2,
          requirePaymentForRegistration: false,
          autoConfirmPayment: false,
          cancellationDeadlineHours: 24,
          requireOrganizerApprovalForSquad: false,
        },
        scoring: {
          requireScoreConfirmation: false,
          scoreConfirmationTimeoutHours: 48,
          allowPlayerSelfReporting: false,
        },
        rating: {
          enabled: true,
          mandatory: false,
          anonymous: false,
          ratingDeadlineHours: 72,
          minRatingsForMVP: 3,
          allowCategoryRating: true,
        },
        comments: {
          enabled: true,
          requireApproval: false,
          allowLikes: true,
          maxLength: 500,
        },
        payment: {
          defaultPricePerPlayer: 0,
          currency: 'TRY',
          allowInstallment: false,
          paymentMethods: ['cash', 'bank_transfer'],
        },
        integrations: {
          googleCalendar: false,
          googleSheets: false,
          whatsapp: false,
          slack: false,
        },
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      };

      // Use league ID as settings ID
      const result = await this.createWithId(leagueId, defaultSettings);

      ApiLogger.success('leagueSettings', 'createDefaultSettings', { leagueId });

      return result;
    } catch (error: any) {
      ApiLogger.error('leagueSettings', 'createDefaultSettings', error);
      return {
        success: false,
        error: {
          code: 'CREATE_SETTINGS_ERROR',
          message: error.message || 'Failed to create default settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get or create settings (helper)
   */
  async getOrCreate(leagueId: string, userId: string): Promise<ApiResponse<ILeagueSettings>> {
    try {
      const existingResult = await this.getByLeague(leagueId);

      if (existingResult.success && existingResult.data) {
        return existingResult as ApiResponse<ILeagueSettings>;
      }

      // Create default settings if not exist
      return this.createDefaultSettings(leagueId, userId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_OR_CREATE_ERROR',
          message: error.message || 'Failed to get or create settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // UPDATE SPECIFIC SECTIONS
  // ============================================

  /**
   * Update rules
   */
  async updateRules(
    leagueId: string,
    rules: Partial<ILeagueSettings['rules']>,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      ApiLogger.log('leagueSettings', 'updateRules', { leagueId });

      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'League settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedRules = {
        ...settingsResult.data.rules,
        ...rules,
      };

      const result = await this.update(leagueId, {
        rules: updatedRules,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      } as Partial<Omit<ILeagueSettings, 'id'>>);

      ApiLogger.success('leagueSettings', 'updateRules', { leagueId });

      return result;
    } catch (error: any) {
      ApiLogger.error('leagueSettings', 'updateRules', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_RULES_ERROR',
          message: error.message || 'Failed to update rules',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update match rules
   */
  async updateMatchRules(
    leagueId: string,
    matchRules: Partial<ILeagueSettings['matchRules']>,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      ApiLogger.log('leagueSettings', 'updateMatchRules', { leagueId });

      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'League settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedMatchRules = {
        ...settingsResult.data.matchRules,
        ...matchRules,
      };

      const result = await this.update(leagueId, {
        matchRules: updatedMatchRules,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      } as Partial<Omit<ILeagueSettings, 'id'>>);

      ApiLogger.success('leagueSettings', 'updateMatchRules', { leagueId });

      return result;
    } catch (error: any) {
      ApiLogger.error('leagueSettings', 'updateMatchRules', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_MATCH_RULES_ERROR',
          message: error.message || 'Failed to update match rules',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update registration rules
   */
  async updateRegistrationRules(
    leagueId: string,
    registration: Partial<ILeagueSettings['registration']>,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'League settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedRegistration = {
        ...settingsResult.data.registration,
        ...registration,
      };

      return this.update(leagueId, {
        registration: updatedRegistration,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      } as Partial<Omit<ILeagueSettings, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_REGISTRATION_ERROR',
          message: error.message || 'Failed to update registration rules',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update scoring rules
   */
  async updateScoringRules(
    leagueId: string,
    scoring: Partial<ILeagueSettings['scoring']>,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'League settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedScoring = {
        ...settingsResult.data.scoring,
        ...scoring,
      };

      return this.update(leagueId, {
        scoring: updatedScoring,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      } as Partial<Omit<ILeagueSettings, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_SCORING_ERROR',
          message: error.message || 'Failed to update scoring rules',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update rating rules
   */
  async updateRatingRules(
    leagueId: string,
    rating: Partial<ILeagueSettings['rating']>,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'League settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedRating = {
        ...settingsResult.data.rating,
        ...rating,
      };

      return this.update(leagueId, {
        rating: updatedRating,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      } as Partial<Omit<ILeagueSettings, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_RATING_ERROR',
          message: error.message || 'Failed to update rating rules',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update comment rules
   */
  async updateCommentRules(
    leagueId: string,
    comments: Partial<ILeagueSettings['comments']>,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'League settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedComments = {
        ...settingsResult.data.comments,
        ...comments,
      };

      return this.update(leagueId, {
        comments: updatedComments,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      } as Partial<Omit<ILeagueSettings, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_COMMENTS_ERROR',
          message: error.message || 'Failed to update comment rules',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update payment settings
   */
  async updatePaymentSettings(
    leagueId: string,
    payment: Partial<ILeagueSettings['payment']>,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'League settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedPayment = {
        ...settingsResult.data.payment,
        ...payment,
      };

      return this.update(leagueId, {
        payment: updatedPayment,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      } as Partial<Omit<ILeagueSettings, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PAYMENT_ERROR',
          message: error.message || 'Failed to update payment settings',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update integrations
   */
  async updateIntegrations(
    leagueId: string,
    integrations: Partial<ILeagueSettings['integrations']>,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: false,
          error: settingsResult.error || {
            code: 'SETTINGS_NOT_FOUND',
            message: 'League settings not found',
            statusCode: 404,
          },
        };
      }

      const updatedIntegrations = {
        ...(settingsResult.data.integrations || {}),
        ...integrations,
      };

      return this.update(leagueId, {
        integrations: updatedIntegrations,
        updatedAt: new Date().toISOString(),
        updatedBy: userId,
      } as Partial<Omit<ILeagueSettings, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_INTEGRATIONS_ERROR',
          message: error.message || 'Failed to update integrations',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // TOGGLE SPECIFIC FEATURES
  // ============================================

  /**
   * Toggle rating system
   */
  async toggleRatingSystem(
    leagueId: string,
    enabled: boolean,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    return this.updateRatingRules(leagueId, { enabled }, userId);
  }

  /**
   * Toggle comments
   */
  async toggleComments(
    leagueId: string,
    enabled: boolean,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    return this.updateCommentRules(leagueId, { enabled }, userId);
  }

  /**
   * Toggle guest players
   */
  async toggleGuestPlayers(
    leagueId: string,
    allowed: boolean,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    return this.updateMatchRules(leagueId, { allowGuestPlayers: allowed }, userId);
  }

  /**
   * Toggle integration
   */
  async toggleIntegration(
    leagueId: string,
    integration: keyof ILeagueSettings['integrations'],
    enabled: boolean,
    userId: string
  ): Promise<ApiResponse<ILeagueSettings>> {
    return this.updateIntegrations(leagueId, { [integration]: enabled }, userId);
  }

  // ============================================
  // VALIDATION HELPERS
  // ============================================

  /**
   * Check if guest players are allowed
   */
  async areGuestPlayersAllowed(leagueId: string): Promise<ApiResponse<boolean>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: true,
          data: true, // Default to true if settings not found
        };
      }

      return {
        success: true,
        data: settingsResult.data.matchRules.allowGuestPlayers,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_GUEST_ERROR',
          message: error.message || 'Failed to check guest players setting',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if rating is enabled
   */
  async isRatingEnabled(leagueId: string): Promise<ApiResponse<boolean>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: true,
          data: true, // Default to true
        };
      }

      return {
        success: true,
        data: settingsResult.data.rating.enabled,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_RATING_ERROR',
          message: error.message || 'Failed to check rating setting',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if comments are enabled
   */
  async areCommentsEnabled(leagueId: string): Promise<ApiResponse<boolean>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: true,
          data: true, // Default to true
        };
      }

      return {
        success: true,
        data: settingsResult.data.comments.enabled,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_COMMENTS_ERROR',
          message: error.message || 'Failed to check comments setting',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get max guest players allowed
   */
  async getMaxGuestPlayers(leagueId: string): Promise<ApiResponse<number>> {
    try {
      const settingsResult = await this.getByLeague(leagueId);

      if (!settingsResult.success || !settingsResult.data) {
        return {
          success: true,
          data: 2, // Default
        };
      }

      return {
        success: true,
        data: settingsResult.data.matchRules.maxGuestPlayersPerMatch,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_MAX_GUEST_ERROR',
          message: error.message || 'Failed to get max guest players',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const leagueSettingsAPI = new LeagueSettingsAPI();