// ============================================
// api/PlayerAPI.ts
// ============================================
import { BaseAPI, ApiResponse, QueryOptions } from '../base/BaseAPI';
import { IPlayer } from '../../types/types';
import { ApiLogger } from '../base/ApiLogger';

export class PlayerAPI extends BaseAPI<IPlayer> {
  constructor() {
    super('users');
  }

  // ============================================
  // GET BY EMAIL
  // ============================================
  async getByEmail(email: string): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerAPI', 'getByEmail', { email });

      const result = await this.getAll({
        where: [{ field: 'email', operator: '==', value: email }],
        limit: 1,
      });

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Player not found',
          },
        };
      }

      ApiLogger.success('PlayerAPI', 'getByEmail', result.data[0]);
      return {
        success: true,
        data: result.data[0],
      };
    } catch (error: any) {
      ApiLogger.error('PlayerAPI', 'getByEmail', error);
      return {
        success: false,
        error: {
          code: error.code || 'GET_BY_EMAIL_ERROR',
          message: error.message,
          details: error,
        },
      };
    }
  }

  // ============================================
  // GET BY PHONE
  // ============================================
  async getByPhone(phone: string): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerAPI', 'getByPhone', { phone });

      const result = await this.getAll({
        where: [{ field: 'phone', operator: '==', value: phone }],
        limit: 1,
      });

      if (!result.success || !result.data || result.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Player not found',
          },
        };
      }

      return {
        success: true,
        data: result.data[0],
      };
    } catch (error: any) {
      ApiLogger.error('PlayerAPI', 'getByPhone', error);
      return {
        success: false,
        error: {
          code: error.code || 'GET_BY_PHONE_ERROR',
          message: error.message,
          details: error,
        },
      };
    }
  }

  // ============================================
  // SEARCH PLAYERS
  // ============================================
  async searchPlayers(searchTerm: string, limit: number = 10): Promise<ApiResponse<IPlayer[]>> {
    try {
      ApiLogger.log('PlayerAPI', 'searchPlayers', { searchTerm, limit });

      // Firestore doesn't support full-text search, so we get all and filter
      // In production, use Algolia or similar service
      const result = await this.getAll();

      if (!result.success || !result.data) {
        return result as ApiResponse<IPlayer[]>;
      }

      const searchLower = searchTerm.toLowerCase();
      const filtered = result.data.filter((player) => {
        const fullName = `${player.name} ${player.surname}`.toLowerCase();
        const email = player.email?.toLowerCase() || '';
        return fullName.includes(searchLower) || email.includes(searchLower);
      }).slice(0, limit);

      return {
        success: true,
        data: filtered,
      };
    } catch (error: any) {
      ApiLogger.error('PlayerAPI', 'searchPlayers', error);
      return {
        success: false,
        error: {
          code: error.code || 'SEARCH_ERROR',
          message: error.message,
          details: error,
        },
      };
    }
  }

  // ============================================
  // GET BY IDS (Bulk)
  // ============================================
  async getByIds(ids: string[]): Promise<ApiResponse<IPlayer[]>> {
    try {
      ApiLogger.log('PlayerAPI', 'getByIds', { ids });

      if (ids.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      // Firestore 'in' query supports max 10 items
      // Split into chunks if needed
      const chunks: string[][] = [];
      for (let i = 0; i < ids.length; i += 10) {
        chunks.push(ids.slice(i, i + 10));
      }

      const allPlayers: IPlayer[] = [];

      for (const chunk of chunks) {
        const result = await this.getAll({
          where: [{ field: '__name__', operator: 'in', value: chunk }],
        });

        if (result.success && result.data) {
          allPlayers.push(...result.data);
        }
      }

      return {
        success: true,
        data: allPlayers,
      };
    } catch (error: any) {
      ApiLogger.error('PlayerAPI', 'getByIds', error);
      return {
        success: false,
        error: {
          code: error.code || 'GET_BY_IDS_ERROR',
          message: error.message,
          details: error,
        },
      };
    }
  }

  // ============================================
  // UPDATE LAST LOGIN
  // ============================================
  async updateLastLogin(id: string): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerAPI', 'updateLastLogin', { id });

      return await this.update(id, {
        lastLogin: new Date(),
      } as Partial<IPlayer>);
    } catch (error: any) {
      ApiLogger.error('PlayerAPI', 'updateLastLogin', error);
      return {
        success: false,
        error: {
          code: error.code || 'UPDATE_LAST_LOGIN_ERROR',
          message: error.message,
          details: error,
        },
      };
    }
  }

  // ============================================
  // GET BY FAVORITE SPORT
  // ============================================
  async getByFavoriteSport(sportType: string): Promise<ApiResponse<IPlayer[]>> {
    try {
      ApiLogger.log('PlayerAPI', 'getByFavoriteSport', { sportType });

      return await this.getAll({
        where: [{ field: 'favoriteSports', operator: 'array-contains', value: sportType }],
      });
    } catch (error: any) {
      ApiLogger.error('PlayerAPI', 'getByFavoriteSport', error);
      return {
        success: false,
        error: {
          code: error.code || 'GET_BY_SPORT_ERROR',
          message: error.message,
          details: error,
        },
      };
    }
  }
}

// Export singleton instance
export const playerAPI = new PlayerAPI();