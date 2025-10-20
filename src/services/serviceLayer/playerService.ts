// ============================================
// services/PlayerService.ts
// ============================================
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IPlayer, SportType } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class PlayerService {
  // ============================================
  // AUTHENTICATION & PROFILE
  // ============================================

  /**
   * Register new player
   */
  static async registerPlayer(data: {
    email: string;
    name: string;
    surname: string;
    phone?: string;
    favoriteSports?: SportType[];
    profilePhoto?: string;
  }): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerService', 'registerPlayer', { email: data.email });

      // Check if email already exists
      const emailCheck = await playerAPI.emailExists(data.email);
      
      if (emailCheck.success && emailCheck.data) {
        return {
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Bu email adresi zaten kullanılıyor',
            statusCode: 409,
          },
        };
      }

      // Check if phone exists (if provided)
      if (data.phone) {
        const phoneCheck = await playerAPI.phoneExists(data.phone);
        
        if (phoneCheck.success && phoneCheck.data) {
          return {
            success: false,
            error: {
              code: 'PHONE_EXISTS',
              message: 'Bu telefon numarası zaten kullanılıyor',
              statusCode: 409,
            },
          };
        }
      }

      // Create player
      const playerData: Omit<IPlayer, 'id'> = {
        email: data.email.toLowerCase().trim(),
        name: data.name.trim(),
        surname: data.surname.trim(),
        phone: data.phone?.trim(),
        profilePhoto: data.profilePhoto,
        favoriteSports: data.favoriteSports || [],
        sportPositions: {},
        lastLogin: new Date(),
        createdAt: new Date().toISOString(),
      };

      const result = await playerAPI.create(playerData);

      if (result.success) {
        ApiLogger.success('PlayerService', 'registerPlayer', { 
          playerId: result.data?.id 
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'registerPlayer', error);
      return {
        success: false,
        error: {
          code: 'REGISTER_ERROR',
          message: error.message || 'Kayıt sırasında hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get player by ID
   */
  static async getPlayer(playerId: string): Promise<ApiResponse<IPlayer>> {
    return playerAPI.getById(playerId);
  }

  /**
   * Get player by email
   */
  static async getPlayerByEmail(email: string): Promise<ApiResponse<IPlayer>> {
    return playerAPI.getByEmail(email);
  }

  /**
   * Update player profile
   */
  static async updateProfile(
    playerId: string,
    profileData: {
      name?: string;
      surname?: string;
      profilePhoto?: string;
      jerseyNumber?: string;
      birthDate?: string;
    }
  ): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerService', 'updateProfile', { playerId });

      // Sanitize data
      const sanitizedData: any = {};
      
      if (profileData.name) {
        sanitizedData.name = profileData.name.trim();
      }
      if (profileData.surname) {
        sanitizedData.surname = profileData.surname.trim();
      }
      if (profileData.profilePhoto !== undefined) {
        sanitizedData.profilePhoto = profileData.profilePhoto;
      }
      if (profileData.jerseyNumber !== undefined) {
        sanitizedData.jerseyNumber = profileData.jerseyNumber.trim();
      }
      if (profileData.birthDate !== undefined) {
        sanitizedData.birthDate = profileData.birthDate;
      }

      const result = await playerAPI.updateProfile(playerId, sanitizedData);

      if (result.success) {
        ApiLogger.success('PlayerService', 'updateProfile', { playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'updateProfile', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PROFILE_ERROR',
          message: error.message || 'Profil güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update last login timestamp
   */
  static async recordLogin(playerId: string): Promise<ApiResponse<IPlayer>> {
    return playerAPI.updateLastLogin(playerId);
  }

  // ============================================
  // SPORT PREFERENCES
  // ============================================

  /**
   * Add favorite sport
   */
  static async addFavoriteSport(
    playerId: string,
    sport: SportType
  ): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerService', 'addFavoriteSport', { playerId, sport });

      const result = await playerAPI.addFavoriteSport(playerId, sport);

      if (result.success) {
        ApiLogger.success('PlayerService', 'addFavoriteSport', { playerId, sport });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'addFavoriteSport', error);
      return {
        success: false,
        error: {
          code: 'ADD_SPORT_ERROR',
          message: error.message || 'Favori spor eklenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove favorite sport
   */
  static async removeFavoriteSport(
    playerId: string,
    sport: SportType
  ): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerService', 'removeFavoriteSport', { playerId, sport });

      const result = await playerAPI.removeFavoriteSport(playerId, sport);

      if (result.success) {
        ApiLogger.success('PlayerService', 'removeFavoriteSport', { playerId, sport });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'removeFavoriteSport', error);
      return {
        success: false,
        error: {
          code: 'REMOVE_SPORT_ERROR',
          message: error.message || 'Favori spor kaldırılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update sport positions
   */
  static async updateSportPositions(
    playerId: string,
    sport: SportType,
    positions: string[]
  ): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerService', 'updateSportPositions', { 
        playerId, 
        sport, 
        positions 
      });

      // Validate positions (trim and remove empty)
      const validPositions = positions
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const result = await playerAPI.setSportPositions(playerId, sport, validPositions);

      if (result.success) {
        ApiLogger.success('PlayerService', 'updateSportPositions', { 
          playerId, 
          sport 
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'updateSportPositions', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_POSITIONS_ERROR',
          message: error.message || 'Pozisyonlar güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update all sport preferences at once
   */
  static async updateSportPreferences(
    playerId: string,
    preferences: {
      favoriteSports?: SportType[];
      sportPositions?: Partial<Record<SportType, string[]>>;
    }
  ): Promise<ApiResponse<IPlayer>> {
    try {
      ApiLogger.log('PlayerService', 'updateSportPreferences', { playerId });

      const result = await playerAPI.updateSportPreferences(playerId, preferences);

      if (result.success) {
        ApiLogger.success('PlayerService', 'updateSportPreferences', { playerId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'updateSportPreferences', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PREFERENCES_ERROR',
          message: error.message || 'Tercihler güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // SEARCH & DISCOVERY
  // ============================================

  /**
   * Search players by name
   */
  static async searchPlayers(searchTerm: string): Promise<ApiResponse<IPlayer[]>> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        return { success: true, data: [] };
      }

      // Minimum 2 characters for search
      if (searchTerm.trim().length < 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_SEARCH',
            message: 'Arama için en az 2 karakter gerekli',
            statusCode: 400,
          },
        };
      }

      return playerAPI.searchPlayers(searchTerm);
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'searchPlayers', error);
      return {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: error.message || 'Arama sırasında hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get players by sport
   */
  static async getPlayersBySport(
    sport: SportType,
    limit?: number
  ): Promise<ApiResponse<IPlayer[]>> {
    return playerAPI.getByFavoriteSport(sport);
  }

  /**
   * Get recent players
   */
  static async getRecentPlayers(limit: number = 10): Promise<ApiResponse<IPlayer[]>> {
    return playerAPI.getRecentPlayers(limit);
  }

  /**
   * Get multiple players by IDs
   */
  static async getPlayersByIds(playerIds: string[]): Promise<ApiResponse<IPlayer[]>> {
    try {
      if (playerIds.length === 0) {
        return { success: true, data: [] };
      }

      return playerAPI.getByIds(playerIds);
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'getPlayersByIds', error);
      return {
        success: false,
        error: {
          code: 'GET_PLAYERS_ERROR',
          message: error.message || 'Oyuncular alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // VALIDATION
  // ============================================

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone format (Turkish)
   */
  static validatePhone(phone: string): boolean {
    // Turkish phone format: +90XXXXXXXXXX or 05XXXXXXXXX
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Check if email is available
   */
  static async isEmailAvailable(email: string): Promise<ApiResponse<boolean>> {
    try {
      if (!this.validateEmail(email)) {
        return {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Geçersiz email formatı',
            statusCode: 400,
          },
        };
      }

      const result = await playerAPI.emailExists(email);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: !result.data, // Available if NOT exists
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_EMAIL_ERROR',
          message: error.message || 'Email kontrolü sırasında hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if phone is available
   */
  static async isPhoneAvailable(phone: string): Promise<ApiResponse<boolean>> {
    try {
      if (!this.validatePhone(phone)) {
        return {
          success: false,
          error: {
            code: 'INVALID_PHONE',
            message: 'Geçersiz telefon formatı',
            statusCode: 400,
          },
        };
      }

      const result = await playerAPI.phoneExists(phone);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: !result.data, // Available if NOT exists
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_PHONE_ERROR',
          message: error.message || 'Telefon kontrolü sırasında hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get player summary statistics
   */
  static async getPlayerSummary(playerId: string): Promise<ApiResponse<{
    player: IPlayer;
    totalSports: number;
    hasProfilePhoto: boolean;
    isProfileComplete: boolean;
  }>> {
    try {
      const playerResult = await playerAPI.getById(playerId);

      if (!playerResult.success || !playerResult.data) {
        return {
          success: false,
          error: playerResult.error || {
            code: 'NOT_FOUND',
            message: 'Oyuncu bulunamadı',
            statusCode: 404,
          },
        };
      }

      const player = playerResult.data;
      
      const summary = {
        player,
        totalSports: player.favoriteSports?.length || 0,
        hasProfilePhoto: !!player.profilePhoto,
        isProfileComplete: !!(
          player.name &&
          player.surname &&
          player.email &&
          player.favoriteSports &&
          player.favoriteSports.length > 0
        ),
      };

      return {
        success: true,
        data: summary,
      };
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'getPlayerSummary', error);
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Özet bilgiler alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Batch update players
   */
  static async batchUpdatePlayers(
    updates: Array<{ id: string; data: Partial<IPlayer> }>
  ): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('PlayerService', 'batchUpdatePlayers', { 
        count: updates.length 
      });

      const result = await playerAPI.batchUpdatePlayers(updates);

      if (result.success) {
        ApiLogger.success('PlayerService', 'batchUpdatePlayers', { 
          count: updates.length 
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerService', 'batchUpdatePlayers', error);
      return {
        success: false,
        error: {
          code: 'BATCH_UPDATE_ERROR',
          message: error.message || 'Toplu güncelleme sırasında hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // UTILITIES
  // ============================================

  /**
   * Format player full name
   */
  static formatFullName(player: IPlayer): string {
    return `${player.name} ${player.surname}`.trim();
  }

  /**
   * Get player initials
   */
  static getInitials(player: IPlayer): string {
    const firstInitial = player.name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = player.surname?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Calculate player age
   */
  static calculateAge(birthDate: string): number | null {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Format phone number for display
   */
  static formatPhone(phone: string): string {
    if (!phone) return '';

    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');

    // Format as +90 XXX XXX XX XX
    if (cleaned.startsWith('90')) {
      const match = cleaned.match(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/);
      if (match) {
        return `+90 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
      }
    } else if (cleaned.startsWith('0')) {
      const match = cleaned.match(/^0(\d{3})(\d{3})(\d{2})(\d{2})$/);
      if (match) {
        return `0${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
      }
    }

    return phone;
  }
}

// Export for use
export default PlayerService;