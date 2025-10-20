// ============================================
// api/fixtureApi.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { IFixture, PlayerListConfig } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class FixtureAPI extends BaseAPI<IFixture> {
  constructor() {
    super('fixtures');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get fixtures by league
   */
  async getByLeague(leagueId: string): Promise<ApiResponse<IFixture[]>> {
    return this.getAll({
      where: [{ field: 'leagueId', operator: '==', value: leagueId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get active fixtures for a league
   */
  async getActiveFixtures(leagueId: string): Promise<ApiResponse<IFixture[]>> {
    return this.getAll({
      where: [
        { field: 'leagueId', operator: '==', value: leagueId },
        { field: 'status', operator: '==', value: 'active' },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get inactive fixtures for a league
   */
  async getInactiveFixtures(leagueId: string): Promise<ApiResponse<IFixture[]>> {
    return this.getAll({
      where: [
        { field: 'leagueId', operator: '==', value: leagueId },
        { field: 'status', operator: '==', value: 'inactive' },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get fixtures by status
   */
  async getByStatus(
    leagueId: string,
    status: 'active' | 'inactive'
  ): Promise<ApiResponse<IFixture[]>> {
    return this.getAll({
      where: [
        { field: 'leagueId', operator: '==', value: leagueId },
        { field: 'status', operator: '==', value: status },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  // ============================================
  // PLAYER LIST MANAGEMENT
  // ============================================

  /**
   * Update player list config (premium or direct)
   */
  async updatePlayerListConfig(
    fixtureId: string,
    listType: 'premium' | 'direct',
    config: PlayerListConfig
  ): Promise<ApiResponse<IFixture>> {
    try {
      ApiLogger.log('fixtures', 'updatePlayerListConfig', {
        fixtureId,
        listType
      });

      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const updatePath = `players.${listType}`;
      const docRef = doc(db, this.collectionName, fixtureId);

      await updateDoc(docRef, {
        [updatePath]: config,
        updatedAt: new Date().toISOString(),
      });

      const updatedFixture = await this.getById(fixtureId);

      ApiLogger.success('fixtures', 'updatePlayerListConfig', {
        fixtureId,
        listType
      });

      return updatedFixture;
    } catch (error: any) {
      ApiLogger.error('fixtures', 'updatePlayerListConfig', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PLAYER_LIST_ERROR',
          message: error.message || 'Failed to update player list',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Switch player list to auto mode
   */
  async switchToAutoMode(
    fixtureId: string,
    listType: 'premium' | 'direct'
  ): Promise<ApiResponse<IFixture>> {
    try {
      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const currentList = fixtureResult.data.players[listType];

      const newConfig: PlayerListConfig = {
        mode: 'auto',
        inherited: currentList.inherited,
      };

      return this.updatePlayerListConfig(fixtureId, listType, newConfig);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SWITCH_AUTO_ERROR',
          message: error.message || 'Failed to switch to auto mode',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Switch player list to custom mode
   */
  async switchToCustomMode(
    fixtureId: string,
    listType: 'premium' | 'direct',
    customPlayers: string[]
  ): Promise<ApiResponse<IFixture>> {
    try {
      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const currentList = fixtureResult.data.players[listType];

      const newConfig: PlayerListConfig = {
        mode: 'custom',
        inherited: currentList.inherited,
        overrides: customPlayers,
      };

      return this.updatePlayerListConfig(fixtureId, listType, newConfig);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SWITCH_CUSTOM_ERROR',
          message: error.message || 'Failed to switch to custom mode',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add player to custom list
   */
  async addPlayerToCustomList(
    fixtureId: string,
    listType: 'premium' | 'direct',
    playerId: string
  ): Promise<ApiResponse<IFixture>> {
    try {
      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
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
            message: 'Player list must be in custom mode',
            statusCode: 400,
          },
        };
      }

      const currentOverrides = currentList.overrides || [];

      if (currentOverrides.includes(playerId)) {
        // Already in list, return as is
        return fixtureResult;
      }

      const newConfig: PlayerListConfig = {
        mode: 'custom',
        inherited: currentList.inherited,
        overrides: [...currentOverrides, playerId],
      };

      return this.updatePlayerListConfig(fixtureId, listType, newConfig);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_PLAYER_ERROR',
          message: error.message || 'Failed to add player to custom list',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove player from custom list
   */
  async removePlayerFromCustomList(
    fixtureId: string,
    listType: 'premium' | 'direct',
    playerId: string
  ): Promise<ApiResponse<IFixture>> {
    try {
      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
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
            message: 'Player list must be in custom mode',
            statusCode: 400,
          },
        };
      }

      const currentOverrides = currentList.overrides || [];
      const newOverrides = currentOverrides.filter(id => id !== playerId);

      const newConfig: PlayerListConfig = {
        mode: 'custom',
        inherited: currentList.inherited,
        overrides: newOverrides,
      };

      return this.updatePlayerListConfig(fixtureId, listType, newConfig);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_PLAYER_ERROR',
          message: error.message || 'Failed to remove player from custom list',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SCHEDULE MANAGEMENT
  // ============================================

  /**
   * Update fixture schedule
   */
  async updateSchedule(
    fixtureId: string,
    schedule: Partial<IFixture['schedule']>
  ): Promise<ApiResponse<IFixture>> {
    try {
      ApiLogger.log('fixtures', 'updateSchedule', { fixtureId });

      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const updatedSchedule = {
        ...fixtureResult.data.schedule,
        ...schedule,
      };

      const result = await this.update(fixtureId, {
        schedule: updatedSchedule,
      } as Partial<Omit<IFixture, 'id'>>);

      ApiLogger.success('fixtures', 'updateSchedule', { fixtureId });

      return result;
    } catch (error: any) {
      ApiLogger.error('fixtures', 'updateSchedule', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SCHEDULE_ERROR',
          message: error.message || 'Failed to update schedule',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // VENUE MANAGEMENT
  // ============================================

  /**
   * Update fixture venue
   */
  async updateVenue(
    fixtureId: string,
    venue: Partial<IFixture['venue']>
  ): Promise<ApiResponse<IFixture>> {
    try {
      ApiLogger.log('fixtures', 'updateVenue', { fixtureId });

      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const updatedVenue = {
        ...fixtureResult.data.venue,
        ...venue,
      };

      const result = await this.update(fixtureId, {
        venue: updatedVenue,
      } as Partial<Omit<IFixture, 'id'>>);

      ApiLogger.success('fixtures', 'updateVenue', { fixtureId });

      return result;
    } catch (error: any) {
      ApiLogger.error('fixtures', 'updateVenue', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_VENUE_ERROR',
          message: error.message || 'Failed to update venue',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SQUAD MANAGEMENT
  // ============================================

  /**
   * Update squad settings
   */
  async updateSquad(
    fixtureId: string,
    squad: Partial<IFixture['squad']>
  ): Promise<ApiResponse<IFixture>> {
    try {
      ApiLogger.log('fixtures', 'updateSquad', { fixtureId });

      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const updatedSquad = {
        ...fixtureResult.data.squad,
        ...squad,
      };

      const result = await this.update(fixtureId, {
        squad: updatedSquad,
      } as Partial<Omit<IFixture, 'id'>>);

      ApiLogger.success('fixtures', 'updateSquad', { fixtureId });

      return result;
    } catch (error: any) {
      ApiLogger.error('fixtures', 'updateSquad', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_SQUAD_ERROR',
          message: error.message || 'Failed to update squad',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATUS MANAGEMENT
  // ============================================

  /**
   * Toggle fixture status (active/inactive)
   */
  async toggleStatus(fixtureId: string): Promise<ApiResponse<IFixture>> {
    try {
      ApiLogger.log('fixtures', 'toggleStatus', { fixtureId });

      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const newStatus = fixtureResult.data.status === 'active' ? 'inactive' : 'active';

      const result = await this.update(fixtureId, {
        status: newStatus,
      } as Partial<Omit<IFixture, 'id'>>);

      ApiLogger.success('fixtures', 'toggleStatus', { fixtureId, newStatus });

      return result;
    } catch (error: any) {
      ApiLogger.error('fixtures', 'toggleStatus', error);
      return {
        success: false,
        error: {
          code: 'TOGGLE_STATUS_ERROR',
          message: error.message || 'Failed to toggle status',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Activate fixture
   */
  async activate(fixtureId: string): Promise<ApiResponse<IFixture>> {
    return this.update(fixtureId, {
      status: 'active',
    } as Partial<Omit<IFixture, 'id'>>);
  }

  /**
   * Deactivate fixture
   */
  async deactivate(fixtureId: string): Promise<ApiResponse<IFixture>> {
    return this.update(fixtureId, {
      status: 'inactive',
    } as Partial<Omit<IFixture, 'id'>>);
  }

  // ============================================
  // PERMISSIONS MANAGEMENT
  // ============================================

  /**
   * Add organizer to fixture
   */
  async addOrganizer(fixtureId: string, organizerId: string): Promise<ApiResponse<IFixture>> {
    try {
      const docRef = doc(db, this.collectionName, fixtureId);

      await updateDoc(docRef, {
        'permissions.organizers': arrayUnion(organizerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(fixtureId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_ORGANIZER_ERROR',
          message: error.message || 'Failed to add organizer',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove organizer from fixture
   */
  async removeOrganizer(fixtureId: string, organizerId: string): Promise<ApiResponse<IFixture>> {
    try {
      const docRef = doc(db, this.collectionName, fixtureId);

      await updateDoc(docRef, {
        'permissions.organizers': arrayRemove(organizerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(fixtureId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_ORGANIZER_ERROR',
          message: error.message || 'Failed to remove organizer',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add team builder to fixture
   */
  async addTeamBuilder(fixtureId: string, teamBuilderId: string): Promise<ApiResponse<IFixture>> {
    try {
      const docRef = doc(db, this.collectionName, fixtureId);

      await updateDoc(docRef, {
        'permissions.teamBuilders': arrayUnion(teamBuilderId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(fixtureId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_TEAM_BUILDER_ERROR',
          message: error.message || 'Failed to add team builder',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove team builder from fixture
   */
  async removeTeamBuilder(fixtureId: string, teamBuilderId: string): Promise<ApiResponse<IFixture>> {
    try {
      const docRef = doc(db, this.collectionName, fixtureId);

      await updateDoc(docRef, {
        'permissions.teamBuilders': arrayRemove(teamBuilderId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(fixtureId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_TEAM_BUILDER_ERROR',
          message: error.message || 'Failed to remove team builder',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // CACHE MANAGEMENT
  // ============================================

  /**
   * Increment total matches
   */
  async incrementTotalMatches(fixtureId: string, count: number = 1): Promise<ApiResponse<IFixture>> {
    try {
      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return fixtureResult;
      }

      return this.update(fixtureId, {
        totalMatches: (fixtureResult.data.totalMatches || 0) + count,
      } as Partial<Omit<IFixture, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_MATCHES_ERROR',
          message: error.message || 'Failed to increment total matches',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update next match date
   */
  async updateNextMatchDate(fixtureId: string, date: string): Promise<ApiResponse<IFixture>> {
    return this.update(fixtureId, {
      nextMatchDate: date,
    } as Partial<Omit<IFixture, 'id'>>);
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Check if fixture is active
   */
  async isActive(fixtureId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getById(fixtureId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      return {
        success: true,
        data: result.data.status === 'active',
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_ACTIVE_ERROR',
          message: error.message || 'Failed to check if fixture is active',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if user is organizer
   */
  async isOrganizer(fixtureId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getById(fixtureId);

      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const isOrg = result.data.permissions.organizers.includes(userId);

      return {
        success: true,
        data: isOrg,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_ORGANIZER_ERROR',
          message: error.message || 'Failed to check organizer status',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Calculate next match date based on pattern
   */
  async calculateNextMatchDate(fixtureId: string): Promise<ApiResponse<string | null>> {
    try {
      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      const fixture = fixtureResult.data;

      if (!fixture.schedule.isRecurring || !fixture.schedule.pattern) {
        return {
          success: true,
          data: null,
        };
      }

      const now = new Date();
      let nextDate: Date | null = null;

      switch (fixture.schedule.pattern.type) {
        case 'weekly':
          nextDate = this.getNextWeeklyDate(now, fixture.schedule.pattern.dayOfWeek!);
          break;
        case 'biweekly':
          nextDate = this.getNextBiweeklyDate(now, fixture.schedule.pattern.dayOfWeek!);
          break;
        case 'monthly':
          nextDate = this.getNextMonthlyDate(now, fixture.schedule.pattern.dayOfMonth!);
          break;
        case 'custom':
          nextDate = this.getNextCustomDate(now, fixture.schedule.pattern.interval!);
          break;
      }

      // Check if pattern has ended
      if (fixture.schedule.pattern.endsAt) {
        const endsAt = new Date(fixture.schedule.pattern.endsAt);
        if (nextDate && nextDate > endsAt) {
          return {
            success: true,
            data: null,
          };
        }
      }

      return {
        success: true,
        data: nextDate?.toISOString() || null,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CALCULATE_DATE_ERROR',
          message: error.message || 'Failed to calculate next match date',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // Helper methods for date calculation
  private getNextWeeklyDate(from: Date, dayOfWeek: number): Date {
    const result = new Date(from);
    const currentDay = result.getDay();
    const daysUntilNext = (dayOfWeek + 7 - currentDay) % 7 || 7;
    result.setDate(result.getDate() + daysUntilNext);
    return result;
  }

  private getNextBiweeklyDate(from: Date, dayOfWeek: number): Date {
    const nextWeekly = this.getNextWeeklyDate(from, dayOfWeek);
    nextWeekly.setDate(nextWeekly.getDate() + 7); // Add one more week
    return nextWeekly;
  }

  private getNextMonthlyDate(from: Date, dayOfMonth: number): Date {
    const result = new Date(from);
    result.setDate(dayOfMonth);

    if (result <= from) {
      result.setMonth(result.getMonth() + 1);
    }

    return result;
  }

  private getNextCustomDate(from: Date, intervalDays: number): Date {
    const result = new Date(from);
    result.setDate(result.getDate() + intervalDays);
    return result;
  }

  /**
   * Update recurring pattern
   */
  async updatePattern(
    fixtureId: string,
    pattern: IFixture['schedule']['pattern']
  ): Promise<ApiResponse<IFixture>> {
    try {
      const fixtureResult = await this.getById(fixtureId);

      if (!fixtureResult.success || !fixtureResult.data) {
        return {
          success: false,
          error: fixtureResult.error || {
            code: 'NOT_FOUND',
            message: 'Fixture not found',
            statusCode: 404,
          },
        };
      }

      return this.update(fixtureId, {
        schedule: {
          ...fixtureResult.data.schedule,
          isRecurring: !!pattern,
          pattern,
        },
      } as Partial<Omit<IFixture, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PATTERN_ERROR',
          message: error.message || 'Failed to update pattern',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const fixtureAPI = new FixtureAPI();