// ============================================
// api/PlayerAPI.ts - Updated for IPlayer Interface
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { IPlayer, SportType } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';

export class PlayerAPI extends BaseAPI<IPlayer> {
  constructor() {
    super('users');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  async getByEmail(email: string): Promise<ApiResponse<IPlayer>> {
    const result = await this.getAll({
      where: [{ field: 'email', operator: '==', value: email.toLowerCase() }],
      limit: 1,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Player not found with email: ${email}`,
          statusCode: 404,
        },
      };
    }

    return {
      success: true,
      data: result.data[0],
    };
  }

  async getByPhone(phone: string): Promise<ApiResponse<IPlayer>> {
    const result = await this.getAll({
      where: [{ field: 'phone', operator: '==', value: phone }],
      limit: 1,
    });

    if (!result.success || !result.data || result.data.length === 0) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Player not found with phone: ${phone}`,
          statusCode: 404,
        },
      };
    }

    return {
      success: true,
      data: result.data[0],
    };
  }

  async searchPlayers(searchTerm: string): Promise<ApiResponse<IPlayer[]>> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return { success: true, data: [] };
    }

    const normalized = searchTerm.trim().toLowerCase();

    // Search by name, surname, displayName, or email
    const results = await this.getAll({
      where: [
        { field: 'name', operator: '>=', value: normalized },
        { field: 'name', operator: '<=', value: normalized + '\uf8ff' },
      ],
      orderBy: [{ field: 'name', direction: 'asc' }],
      limit: 20,
    });

    return results;
  }

  async getByIds(ids: string[]): Promise<ApiResponse<IPlayer[]>> {
    try {
      if (ids.length === 0) {
        return { success: true, data: [] };
      }

      const uniqueIds = [...new Set(ids)];
      const chunks: string[][] = [];
      
      // Firestore 'in' operator max 10 items
      for (let i = 0; i < uniqueIds.length; i += 10) {
        chunks.push(uniqueIds.slice(i, i + 10));
      }

      const allPlayers: IPlayer[] = [];

      for (const chunk of chunks) {
        const result = await this.getAll({
          where: [{ field: '__name__', operator: 'in', value: chunk }],
        });

        if (result.success && result.data) {
          allPlayers.push(...result.data);
        } else if (!result.success) {
          return result;
        }
      }

      return {
        success: true,
        data: allPlayers,
      };
    } catch (error: any) {
      ApiLogger.error('users', 'getByIds', error);
      return {
        success: false,
        error: {
          code: 'GET_BY_IDS_ERROR',
          message: error.message || 'Failed to get players by IDs',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async updateLastLogin(id: string): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      lastLogin: new Date(),
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  async getByFavoriteSport(sport: SportType): Promise<ApiResponse<IPlayer[]>> {
    return this.getAll({
      where: [
        { field: 'favoriteSports', operator: 'array-contains', value: sport },
        { field: 'isActive', operator: '==', value: true },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 50,
    });
  }

  async getRecentPlayers(limitCount: number = 10): Promise<ApiResponse<IPlayer[]>> {
    return this.getAll({
      where: [{ field: 'isActive', operator: '==', value: true }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: limitCount,
    });
  }

  async emailExists(email: string): Promise<ApiResponse<boolean>> {
    const result = await this.getByEmail(email);
    return {
      success: true,
      data: result.success && !!result.data,
    };
  }

  async phoneExists(phone: string): Promise<ApiResponse<boolean>> {
    const result = await this.getByPhone(phone);
    return {
      success: true,
      data: result.success && !!result.data,
    };
  }

  async updateProfile(
    id: string,
    profileData: Partial<Pick<IPlayer, 
      'name' | 
      'surname' | 
      'displayName' | 
      'profilePhoto' | 
      'jerseyNumber' | 
      'birthDate' |
      'phone' |
      'language' |
      'timezone'
    >>
  ): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      ...profileData,
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  async updateSportPreferences(
    id: string,
    preferences: {
      favoriteSports?: SportType[];
      sportPositions?: Partial<Record<SportType, string[]>>;
    }
  ): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      ...preferences,
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  async batchUpdatePlayers(
    updates: Array<{ id: string; data: Partial<IPlayer> }>
  ): Promise<ApiResponse<void>> {
    // Add updatedAt to each update
    const updatesWithTimestamp = updates.map(update => ({
      id: update.id,
      data: {
        ...update.data,
        updatedAt: new Date().toISOString(),
      },
    }));
    
    return this.updateBatch(updatesWithTimestamp);
  }

  // ============================================
  // ADDITIONAL HELPER METHODS
  // ============================================

  async getPlayersFiltered(filters: {
    favoriteSport?: SportType;
    isActive?: boolean;
    emailVerified?: boolean;
    language?: string;
    limit?: number;
  }): Promise<ApiResponse<IPlayer[]>> {
    const queryOptions: QueryOptions = {
      limit: filters.limit || 50,
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      where: [],
    };

    if (filters.favoriteSport) {
      queryOptions.where!.push({
        field: 'favoriteSports',
        operator: 'array-contains',
        value: filters.favoriteSport,
      });
    }

    if (filters.isActive !== undefined) {
      queryOptions.where!.push({
        field: 'isActive',
        operator: '==',
        value: filters.isActive,
      });
    }

    if (filters.emailVerified !== undefined) {
      queryOptions.where!.push({
        field: 'emailVerified',
        operator: '==',
        value: filters.emailVerified,
      });
    }

    if (filters.language) {
      queryOptions.where!.push({
        field: 'language',
        operator: '==',
        value: filters.language,
      });
    }

    return this.getAll(queryOptions);
  }

  async hasFavoriteSport(id: string, sport: SportType): Promise<ApiResponse<boolean>> {
    try {
      const result = await this.getById(id);
      
      if (!result.success || !result.data) {
        return {
          success: false,
          error: result.error || {
            code: 'NOT_FOUND',
            message: 'Player not found',
            statusCode: 404,
          },
        };
      }

      const hasSport = result.data.favoriteSports?.includes(sport) || false;

      return {
        success: true,
        data: hasSport,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_ERROR',
          message: error.message || 'Failed to check favorite sport',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async addFavoriteSport(id: string, sport: SportType): Promise<ApiResponse<IPlayer>> {
    try {
      const playerResult = await this.getById(id);
      
      if (!playerResult.success || !playerResult.data) {
        return {
          success: false,
          error: playerResult.error || {
            code: 'NOT_FOUND',
            message: 'Player not found',
            statusCode: 404,
          },
        };
      }

      const currentSports = playerResult.data.favoriteSports || [];
      
      if (currentSports.includes(sport)) {
        return {
          success: true,
          data: playerResult.data,
        };
      }

      return this.update(id, {
        favoriteSports: [...currentSports, sport],
        updatedAt: new Date().toISOString(),
      } as Partial<Omit<IPlayer, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to add favorite sport',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async removeFavoriteSport(id: string, sport: SportType): Promise<ApiResponse<IPlayer>> {
    try {
      const playerResult = await this.getById(id);
      
      if (!playerResult.success || !playerResult.data) {
        return {
          success: false,
          error: playerResult.error || {
            code: 'NOT_FOUND',
            message: 'Player not found',
            statusCode: 404,
          },
        };
      }

      const currentSports = playerResult.data.favoriteSports || [];
      const updatedSports = currentSports.filter((s) => s !== sport);

      return this.update(id, {
        favoriteSports: updatedSports,
        updatedAt: new Date().toISOString(),
      } as Partial<Omit<IPlayer, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to remove favorite sport',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setSportPositions(
    id: string,
    sport: SportType,
    positions: string[]
  ): Promise<ApiResponse<IPlayer>> {
    try {
      const playerResult = await this.getById(id);
      
      if (!playerResult.success || !playerResult.data) {
        return {
          success: false,
          error: playerResult.error || {
            code: 'NOT_FOUND',
            message: 'Player not found',
            statusCode: 404,
          },
        };
      }

      const currentPositions = playerResult.data.sportPositions || {};
      
      return this.update(id, {
        sportPositions: {
          ...currentPositions,
          [sport]: positions,
        },
        updatedAt: new Date().toISOString(),
      } as Partial<Omit<IPlayer, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to set sport positions',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // AUTH & SECURITY RELATED METHODS
  // ============================================

  async updateEmailVerification(id: string, verified: boolean): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      emailVerified: verified,
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  async updatePhoneVerification(id: string, verified: boolean): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      phoneVerified: verified,
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  async addAuthProvider(
    id: string, 
    provider: 'email' | 'google' | 'apple' | 'facebook'
  ): Promise<ApiResponse<IPlayer>> {
    try {
      const playerResult = await this.getById(id);
      
      if (!playerResult.success || !playerResult.data) {
        return {
          success: false,
          error: playerResult.error || {
            code: 'NOT_FOUND',
            message: 'Player not found',
            statusCode: 404,
          },
        };
      }

      const currentProviders = playerResult.data.authProviders || [];
      
      if (currentProviders.includes(provider)) {
        return {
          success: true,
          data: playerResult.data,
        };
      }

      return this.update(id, {
        authProviders: [...currentProviders, provider],
        updatedAt: new Date().toISOString(),
      } as Partial<Omit<IPlayer, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_ERROR',
          message: error.message || 'Failed to add auth provider',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  async setActiveStatus(id: string, isActive: boolean): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      isActive,
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  async setBannedStatus(id: string, isBanned: boolean): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      isBanned,
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  async enable2FA(id: string): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      twoFactorEnabled: true,
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  async disable2FA(id: string): Promise<ApiResponse<IPlayer>> {
    return this.update(id, {
      twoFactorEnabled: false,
      updatedAt: new Date().toISOString(),
    } as Partial<Omit<IPlayer, 'id'>>);
  }

  // ============================================
  // QUERY HELPERS
  // ============================================

  async getActivePlayers(limit?: number): Promise<ApiResponse<IPlayer[]>> {
    return this.getAll({
      where: [
        { field: 'isActive', operator: '==', value: true },
        { field: 'isBanned', operator: '==', value: false },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: limit || 50,
    });
  }

  async getBannedPlayers(): Promise<ApiResponse<IPlayer[]>> {
    return this.getAll({
      where: [{ field: 'isBanned', operator: '==', value: true }],
      orderBy: [{ field: 'updatedAt', direction: 'desc' }],
    });
  }

  async getUnverifiedEmails(): Promise<ApiResponse<IPlayer[]>> {
    return this.getAll({
      where: [{ field: 'emailVerified', operator: '==', value: false }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 100,
    });
  }

  async getPlayersByLanguage(language: string): Promise<ApiResponse<IPlayer[]>> {
    return this.getAll({
      where: [{ field: 'language', operator: '==', value: language }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  // ============================================
  // STATS & ANALYTICS
  // ============================================

  async getPlayerStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    banned: number;
    emailVerified: number;
    bySport: Record<SportType, number>;
  }>> {
    try {
      const allPlayers = await this.getAll({ limit: 10000 });
      
      if (!allPlayers.success || !allPlayers.data) {
        return {
          success: false,
          error: allPlayers.error || {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch players',
            statusCode: 500,
          },
        };
      }

      const players = allPlayers.data;
      const bySport: Record<string, number> = {};

      const stats = {
        total: players.length,
        active: players.filter(p => p.isActive && !p.isBanned).length,
        banned: players.filter(p => p.isBanned).length,
        emailVerified: players.filter(p => p.emailVerified).length,
        bySport: {} as Record<SportType, number>,
      };

      players.forEach(player => {
        player.favoriteSports?.forEach(sport => {
          bySport[sport] = (bySport[sport] || 0) + 1;
        });
      });

      stats.bySport = bySport as Record<SportType, number>;

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: error.message || 'Failed to get player stats',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const playerAPI = new PlayerAPI();