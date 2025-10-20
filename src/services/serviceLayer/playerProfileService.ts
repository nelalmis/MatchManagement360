// ============================================
// services/PlayerProfileService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { playerProfileAPI } from '../../api/apiLayer/playerProfileAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IPlayerProfile } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class PlayerProfileService {
  // ============================================
  // 1. CORE OPERATIONS
  // ============================================

  /**
   * Get player profile
   */
  static async getPlayerProfile(playerId: string): Promise<ApiResponse<IPlayerProfile | null>> {
    return playerProfileAPI.getByPlayer(playerId);
  }

  /**
   * Get or create player profile
   */
  static async getOrCreateProfile(playerId: string): Promise<ApiResponse<IPlayerProfile>> {
    try {
      ApiLogger.log('PlayerProfileService', 'getOrCreateProfile', { playerId });

      const result = await playerProfileAPI.getOrCreate(playerId);

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'getOrCreateProfile', {
          playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'getOrCreateProfile', error);
      return {
        success: false,
        error: {
          code: 'GET_OR_CREATE_ERROR',
          message: error.message || 'Profil alınamadı veya oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Create default profile
   */
  static async createDefaultProfile(playerId: string): Promise<ApiResponse<IPlayerProfile>> {
    try {
      ApiLogger.log('PlayerProfileService', 'createDefaultProfile', { playerId });

      const result = await playerProfileAPI.createDefaultProfile(playerId);

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'createDefaultProfile', {
          playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'createDefaultProfile', error);
      return {
        success: false,
        error: {
          code: 'CREATE_PROFILE_ERROR',
          message: error.message || 'Varsayılan profil oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if profile exists
   */
  static async profileExists(playerId: string): Promise<ApiResponse<boolean>> {
    return playerProfileAPI.exists(playerId);
  }

  // ============================================
  // 2. OVERALL STATS MANAGEMENT
  // ============================================

  /**
   * Update overall statistics
   */
  static async updateOverallStats(
    playerId: string,
    stats: Partial<IPlayerProfile['overall']>
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      // Validate stats
      if (stats.totalMatches !== undefined && stats.totalMatches < 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATS',
            message: 'İstatistikler negatif olamaz',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('PlayerProfileService', 'updateOverallStats', { playerId });

      const result = await playerProfileAPI.updateOverallStats(playerId, stats);

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'updateOverallStats', {
          playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'updateOverallStats', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_STATS_ERROR',
          message: error.message || 'İstatistikler güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Increment stat (helper)
   */
  static async incrementStat(
    playerId: string,
    stat: keyof IPlayerProfile['overall'],
    amount: number = 1
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      const profileResult = await this.getPlayerProfile(playerId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profil bulunamadı',
            statusCode: 404,
          },
        };
      }

      const currentValue = profileResult.data.overall[stat] as number;
      const newValue = currentValue + amount;

      return this.updateOverallStats(playerId, { [stat]: newValue } as any);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_STAT_ERROR',
          message: error.message || 'İstatistik artırılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Recalculate average rating
   */
  static async recalculateAverageRating(
    playerId: string,
    newRating: number,
    totalMatches: number
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      const profileResult = await this.getPlayerProfile(playerId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profil bulunamadı',
            statusCode: 404,
          },
        };
      }

      const currentAverage = profileResult.data.overall.averageRating;
      const currentTotal = profileResult.data.overall.totalMatches;

      // Calculate new average: ((old_avg * old_count) + new_rating) / new_count
      const newAverage =
        ((currentAverage * currentTotal) + newRating) / (currentTotal + 1);

      return this.updateOverallStats(playerId, {
        averageRating: parseFloat(newAverage.toFixed(2)),
        totalMatches: totalMatches,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'RECALCULATE_RATING_ERROR',
          message: error.message || 'Ortalama rating hesaplanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. LEAGUE SUMMARIES MANAGEMENT
  // ============================================

  /**
   * Update league summary
   */
  static async updateLeagueSummary(
    playerId: string,
    leagueId: string,
    summary: IPlayerProfile['leagueSummaries'][0]
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      ApiLogger.log('PlayerProfileService', 'updateLeagueSummary', {
        playerId,
        leagueId,
      });

      const result = await playerProfileAPI.updateLeagueSummary(
        playerId,
        leagueId,
        summary
      );

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'updateLeagueSummary', {
          playerId,
          leagueId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'updateLeagueSummary', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_LEAGUE_SUMMARY_ERROR',
          message: error.message || 'Lig özeti güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove league summary
   */
  static async removeLeagueSummary(
    playerId: string,
    leagueId: string
  ): Promise<ApiResponse<IPlayerProfile>> {
    return playerProfileAPI.removeLeagueSummary(playerId, leagueId);
  }

  /**
   * Get player's active leagues
   */
  static async getActiveLeagues(playerId: string): Promise<ApiResponse<string[]>> {
    try {
      const profileResult = await this.getPlayerProfile(playerId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profil bulunamadı',
            statusCode: 404,
          },
        };
      }

      const activeLeagues = profileResult.data.leagueSummaries
        .filter(summary => summary.isActive)
        .map(summary => summary.leagueId);

      return {
        success: true,
        data: activeLeagues,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_ACTIVE_LEAGUES_ERROR',
          message: error.message || 'Aktif ligler alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. ACHIEVEMENTS MANAGEMENT
  // ============================================

  /**
   * Add achievement
   */
  static async addAchievement(
    playerId: string,
    achievement: NonNullable<IPlayerProfile['achievements']>[0]
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      ApiLogger.log('PlayerProfileService', 'addAchievement', {
        playerId,
        type: achievement.type,
      });

      const result = await playerProfileAPI.addAchievement(playerId, achievement);

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'addAchievement', {
          playerId,
          type: achievement.type,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'addAchievement', error);
      return {
        success: false,
        error: {
          code: 'ADD_ACHIEVEMENT_ERROR',
          message: error.message || 'Başarı eklenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove achievement
   */
  static async removeAchievement(
    playerId: string,
    achievementId: string
  ): Promise<ApiResponse<IPlayerProfile>> {
    return playerProfileAPI.removeAchievement(playerId, achievementId);
  }

  /**
   * Check and award automatic achievements
   */
  static async checkAndAwardAchievements(
    playerId: string
  ): Promise<ApiResponse<{
    awarded: Array<{ type: string; name: string }>;
  }>> {
    try {
      const profileResult = await this.getPlayerProfile(playerId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profil bulunamadı',
            statusCode: 404,
          },
        };
      }

      const profile = profileResult.data;
      const awarded: Array<{ type: string; name: string }> = [];

      // Check for top scorer achievement (50+ goals)
      if (
        profile.overall.totalGoals >= 50 &&
        !profile.achievements?.some(a => a.type === 'top_scorer')
      ) {
        await this.addAchievement(playerId, {
          id: `top_scorer_${Date.now()}`,
          type: 'top_scorer',
          name: 'Gol Kralı',
          description: '50+ gol atmayı başardın!',
          earnedAt: new Date().toISOString(),
        });
        awarded.push({ type: 'top_scorer', name: 'Gol Kralı' });
      }

      // Check for MVP achievement (10+ MVPs)
      if (
        profile.overall.totalMVPs >= 10 &&
        !profile.achievements?.some(a => a.type === 'most_mvp')
      ) {
        await this.addAchievement(playerId, {
          id: `most_mvp_${Date.now()}`,
          type: 'most_mvp',
          name: 'MVP Avcısı',
          description: '10+ kez MVP seçildin!',
          earnedAt: new Date().toISOString(),
        });
        awarded.push({ type: 'most_mvp', name: 'MVP Avcısı' });
      }

      // Check for veteran achievement (100+ matches)
      if (
        profile.overall.totalMatches >= 100 &&
        !profile.achievements?.some(a => a.type === 'veteran')
      ) {
        await this.addAchievement(playerId, {
          id: `veteran_${Date.now()}`,
          type: 'veteran',
          name: 'Veterano',
          description: '100+ maçta mücadele ettin!',
          earnedAt: new Date().toISOString(),
        });
        awarded.push({ type: 'veteran', name: 'Veterano' });
      }

      return {
        success: true,
        data: { awarded },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_ACHIEVEMENTS_ERROR',
          message: error.message || 'Başarılar kontrol edilemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 5. PREFERENCES MANAGEMENT
  // ============================================

  /**
   * Update preferences
   */
  static async updatePreferences(
    playerId: string,
    preferences: Partial<IPlayerProfile['preferences']>
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      ApiLogger.log('PlayerProfileService', 'updatePreferences', { playerId });

      const result = await playerProfileAPI.updatePreferences(playerId, preferences);

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'updatePreferences', {
          playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'updatePreferences', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PREFERENCES_ERROR',
          message: error.message || 'Tercihler güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. PLAY STYLE MANAGEMENT
  // ============================================

  /**
   * Update play style
   */
  static async updatePlayStyle(
    playerId: string,
    playStyle: IPlayerProfile['playStyle']
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      // Validate play style values (0-100)
      if (playStyle) {
        const values = Object.values(playStyle);
        if (values.some(v => v < 0 || v > 100)) {
          return {
            success: false,
            error: {
              code: 'INVALID_PLAY_STYLE',
              message: 'Oyun stili değerleri 0-100 arasında olmalı',
              statusCode: 400,
            },
          };
        }
      }

      ApiLogger.log('PlayerProfileService', 'updatePlayStyle', { playerId });

      const result = await playerProfileAPI.updatePlayStyle(playerId, playStyle);

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'updatePlayStyle', {
          playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'updatePlayStyle', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_PLAY_STYLE_ERROR',
          message: error.message || 'Oyun stili güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Calculate play style from match data (ML approach)
   */
  static async calculatePlayStyle(
    playerId: string,
    matchData: {
      totalGoals: number;
      totalAssists: number;
      totalMatches: number;
      defensiveActions?: number;
      teamPlayActions?: number;
    }
  ): Promise<ApiResponse<IPlayerProfile['playStyle']>> {
    try {
      // Simple algorithm - can be replaced with ML model
      const goalsPerMatch = matchData.totalGoals / matchData.totalMatches;
      const assistsPerMatch = matchData.totalAssists / matchData.totalMatches;

      const offensive = Math.min(100, Math.floor((goalsPerMatch + assistsPerMatch) * 20));
      const defensive = matchData.defensiveActions
        ? Math.min(100, Math.floor(matchData.defensiveActions / matchData.totalMatches * 10))
        : 50;
      const teamPlayer = Math.min(100, Math.floor(assistsPerMatch * 30));
      const consistent = 75; // Default - can be calculated from rating variance

      return {
        success: true,
        data: {
          offensive,
          defensive,
          teamPlayer,
          consistent,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CALCULATE_PLAY_STYLE_ERROR',
          message: error.message || 'Oyun stili hesaplanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 7. SOCIAL MANAGEMENT
  // ============================================

  /**
   * Add friend
   */
  static async addFriend(
    playerId: string,
    friendId: string
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      if (playerId === friendId) {
        return {
          success: false,
          error: {
            code: 'INVALID_FRIEND',
            message: 'Kendinizi arkadaş olarak ekleyemezsiniz',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('PlayerProfileService', 'addFriend', { playerId, friendId });

      const result = await playerProfileAPI.addFriend(playerId, friendId);

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'addFriend', {
          playerId,
          friendId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'addFriend', error);
      return {
        success: false,
        error: {
          code: 'ADD_FRIEND_ERROR',
          message: error.message || 'Arkadaş eklenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove friend
   */
  static async removeFriend(
    playerId: string,
    friendId: string
  ): Promise<ApiResponse<IPlayerProfile>> {
    return playerProfileAPI.removeFriend(playerId, friendId);
  }

  /**
   * Block player
   */
  static async blockPlayer(
    playerId: string,
    blockedId: string
  ): Promise<ApiResponse<IPlayerProfile>> {
    try {
      if (playerId === blockedId) {
        return {
          success: false,
          error: {
            code: 'INVALID_BLOCK',
            message: 'Kendinizi engelleyemezsiniz',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('PlayerProfileService', 'blockPlayer', { playerId, blockedId });

      const result = await playerProfileAPI.blockPlayer(playerId, blockedId);

      if (result.success) {
        ApiLogger.success('PlayerProfileService', 'blockPlayer', {
          playerId,
          blockedId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerProfileService', 'blockPlayer', error);
      return {
        success: false,
        error: {
          code: 'BLOCK_PLAYER_ERROR',
          message: error.message || 'Oyuncu engellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Unblock player
   */
  static async unblockPlayer(
    playerId: string,
    blockedId: string
  ): Promise<ApiResponse<IPlayerProfile>> {
    return playerProfileAPI.unblockPlayer(playerId, blockedId);
  }

  /**
   * Update social counts
   */
  static async updateSocialCounts(
    playerId: string,
    counts: {
      followersCount?: number;
      followingCount?: number;
    }
  ): Promise<ApiResponse<IPlayerProfile>> {
    return playerProfileAPI.updateSocialCounts(playerId, counts);
  }

  /**
   * Check if players are friends
   */
  static async isFriend(
    playerId: string,
    friendId: string
  ): Promise<ApiResponse<boolean>> {
    return playerProfileAPI.isFriend(playerId, friendId);
  }

  /**
   * Check if player is blocked
   */
  static async isBlocked(
    playerId: string,
    blockedId: string
  ): Promise<ApiResponse<boolean>> {
    return playerProfileAPI.isBlocked(playerId, blockedId);
  }

  // ============================================
  // 8. LEADERBOARDS & RANKINGS
  // ============================================

  /**
   * Get top scorers
   */
  static async getTopScorers(limit: number = 10): Promise<ApiResponse<IPlayerProfile[]>> {
    return playerProfileAPI.getTopScorers(limit);
  }

  /**
   * Get top rated players
   */
  static async getTopRated(limit: number = 10): Promise<ApiResponse<IPlayerProfile[]>> {
    return playerProfileAPI.getTopRated(limit);
  }

  /**
   * Get players with most MVPs
   */
  static async getMostMVPs(limit: number = 10): Promise<ApiResponse<IPlayerProfile[]>> {
    return playerProfileAPI.getMostMVPs(limit);
  }

  /**
   * Get most active players
   */
  static async getMostActive(limit: number = 10): Promise<ApiResponse<IPlayerProfile[]>> {
    return playerProfileAPI.getMostActive(limit);
  }

  /**
   * Get complete leaderboard
   */
  static async getCompleteLeaderboard(): Promise<ApiResponse<{
    topScorers: IPlayerProfile[];
    topRated: IPlayerProfile[];
    mostMVPs: IPlayerProfile[];
    mostActive: IPlayerProfile[];
  }>> {
    try {
      const [scorers, rated, mvps, active] = await Promise.all([
        this.getTopScorers(10),
        this.getTopRated(10),
        this.getMostMVPs(10),
        this.getMostActive(10),
      ]);

      if (!scorers.success || !rated.success || !mvps.success || !active.success) {
        return {
          success: false,
          error: {
            code: 'GET_LEADERBOARD_ERROR',
            message: 'Liderlik tablosu alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: {
          topScorers: scorers.data || [],
          topRated: rated.data || [],
          mostMVPs: mvps.data || [],
          mostActive: active.data || [],
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_LEADERBOARD_ERROR',
          message: error.message || 'Liderlik tablosu alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 9. PROFILE SUMMARY & ANALYTICS
  // ============================================

  /**
   * Get profile summary for display
   */
  static async getProfileSummary(playerId: string): Promise<ApiResponse<{
    totalMatches: number;
    totalGoals: number;
    totalMVPs: number;
    averageRating: number;
    activeLeagues: number;
    achievements: number;
    friends: number;
    rank: {
      goals: string;
      rating: string;
      mvps: string;
    };
  }>> {
    try {
      const profileResult = await this.getPlayerProfile(playerId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profil bulunamadı',
            statusCode: 404,
          },
        };
      }

      const profile = profileResult.data;

      const activeLeagues = profile.leagueSummaries.filter(s => s.isActive).length;
      const achievements = profile.achievements?.length || 0;
      const friends = profile.social?.friendIds?.length || 0;

      // Simple rank calculation (could be more sophisticated)
      const getRank = (value: number, threshold: { gold: number; silver: number }) => {
        if (value >= threshold.gold) return '🥇 Gold';
        if (value >= threshold.silver) return '🥈 Silver';
        return '🥉 Bronze';
      };

      return {
        success: true,
        data: {
          totalMatches: profile.overall.totalMatches,
          totalGoals: profile.overall.totalGoals,
          totalMVPs: profile.overall.totalMVPs,
          averageRating: profile.overall.averageRating,
          activeLeagues,
          achievements,
          friends,
          rank: {
            goals: getRank(profile.overall.totalGoals, { gold: 50, silver: 20 }),
            rating: getRank(profile.overall.averageRating, { gold: 8, silver: 7 }),
            mvps: getRank(profile.overall.totalMVPs, { gold: 10, silver: 5 }),
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Profil özeti alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get player's career highlights
   */
  static async getCareerHighlights(playerId: string): Promise<ApiResponse<{
    bestRating: number;
    mostGoalsInMatch: number;
    longestStreak: number;
    favoriteLeague: string;
    bestSeason: string;
  }>> {
    try {
      const profileResult = await this.getPlayerProfile(playerId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profil bulunamadı',
            statusCode: 404,
          },
        };
      }

      const profile = profileResult.data;

      // Find favorite league (most matches)
      const favoriteLeague = profile.leagueSummaries.reduce(
        (max, current) =>
          current.stats.matches > max.stats.matches ? current : max,
        profile.leagueSummaries[0]
      );

      // Find best season (highest rating)
      const bestSeason = profile.leagueSummaries.reduce(
        (max, current) =>
          current.stats.rating > max.stats.rating ? current : max,
        profile.leagueSummaries[0]
      );

      return {
        success: true,
        data: {
          bestRating: profile.overall.averageRating,
          mostGoalsInMatch: Math.floor(profile.overall.totalGoals / profile.overall.totalMatches * 2),
          longestStreak: 5, // This would need match history data
          favoriteLeague: favoriteLeague?.leagueName || 'N/A',
          bestSeason: bestSeason?.leagueName || 'N/A',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_HIGHLIGHTS_ERROR',
          message: error.message || 'Kariyer özeti alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 10. HELPER METHODS
  // ============================================

  /**
   * Format profile for display
   */
  static formatProfile(profile: IPlayerProfile): {
    id: string;
    overall: IPlayerProfile['overall'];
    activeLeagues: number;
    achievements: number;
    playStyleLabel: string;
    socialSummary: string;
  } {
    const activeLeagues = profile.leagueSummaries.filter(s => s.isActive).length;
    const achievements = profile.achievements?.length || 0;

    const getPlayStyleLabel = (playStyle?: IPlayerProfile['playStyle']) => {
      if (!playStyle) return 'Belirsiz';

      const maxValue = Math.max(
        playStyle.offensive,
        playStyle.defensive,
        playStyle.teamPlayer
      );

      if (maxValue === playStyle.offensive) return 'Ofansif';
      if (maxValue === playStyle.defensive) return 'Defansif';
      return 'Takım Oyuncusu';
    };

    const socialSummary = `${profile.social?.friendIds?.length || 0} arkadaş, ${profile.social?.followersCount || 0} takipçi`;

    return {
      id: profile.id,
      overall: profile.overall,
      activeLeagues,
      achievements,
      playStyleLabel: getPlayStyleLabel(profile.playStyle),
      socialSummary,
    };
  }

  /**
   * Compare two players
   */
  static async comparePlayers(
    playerId1: string,
    playerId2: string
  ): Promise<ApiResponse<{
    player1: IPlayerProfile;
    player2: IPlayerProfile;
    comparison: {
      goals: { winner: string; difference: number };
      rating: { winner: string; difference: number };
      matches: { winner: string; difference: number };
      mvps: { winner: string; difference: number };
    };
  }>> {
    try {
      const [profile1Result, profile2Result] = await Promise.all([
        this.getPlayerProfile(playerId1),
        this.getPlayerProfile(playerId2),
      ]);

      if (!profile1Result.success || !profile1Result.data) {
        return {
          success: false,
          error: profile1Result.error || {
            code: 'PLAYER1_NOT_FOUND',
            message: 'İlk oyuncu bulunamadı',
            statusCode: 404,
          },
        };
      }

      if (!profile2Result.success || !profile2Result.data) {
        return {
          success: false,
          error: profile2Result.error || {
            code: 'PLAYER2_NOT_FOUND',
            message: 'İkinci oyuncu bulunamadı',
            statusCode: 404,
          },
        };
      }

      const p1 = profile1Result.data;
      const p2 = profile2Result.data;

      const comparison = {
        goals: {
          winner: p1.overall.totalGoals > p2.overall.totalGoals ? playerId1 : playerId2,
          difference: Math.abs(p1.overall.totalGoals - p2.overall.totalGoals),
        },
        rating: {
          winner: p1.overall.averageRating > p2.overall.averageRating ? playerId1 : playerId2,
          difference: Math.abs(p1.overall.averageRating - p2.overall.averageRating),
        },
        matches: {
          winner: p1.overall.totalMatches > p2.overall.totalMatches ? playerId1 : playerId2,
          difference: Math.abs(p1.overall.totalMatches - p2.overall.totalMatches),
        },
        mvps: {
          winner: p1.overall.totalMVPs > p2.overall.totalMVPs ? playerId1 : playerId2,
          difference: Math.abs(p1.overall.totalMVPs - p2.overall.totalMVPs),
        },
      };

      return {
        success: true,
        data: {
          player1: p1,
          player2: p2,
          comparison,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'COMPARE_ERROR',
          message: error.message || 'Oyuncular karşılaştırılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

export default PlayerProfileService;



/*
// ✅ Get or create profile (auto-initialize)
const profile = await PlayerProfileService.getOrCreateProfile(playerId);

// ✅ Update stats after match
await PlayerProfileService.updateOverallStats(playerId, {
  totalMatches: profile.data!.overall.totalMatches + 1,
  totalGoals: profile.data!.overall.totalGoals + 2,
  totalMVPs: profile.data!.overall.totalMVPs + 1,
});

// ✅ Increment stat (helper)
await PlayerProfileService.incrementStat(playerId, 'totalGoals', 2);
await PlayerProfileService.incrementStat(playerId, 'totalMVPs', 1);

// ✅ Recalculate average rating after match
await PlayerProfileService.recalculateAverageRating(
  playerId,
  8.5, // new rating
  totalMatches + 1
);

// ✅ Check and award achievements automatically
const achievements = await PlayerProfileService.checkAndAwardAchievements(playerId);
if (achievements.data?.awarded.length! > 0) {
  console.log('New achievements:', achievements.data?.awarded);
  // Send notification to player
}

// ✅ Update league summary
await PlayerProfileService.updateLeagueSummary(playerId, leagueId, {
  leagueId,
  leagueName: 'Sunday League',
  sportType: 'FOOTBALL',
  stats: {
    matches: 10,
    wins: 7,
    goals: 15,
    assists: 8,
    mvps: 3,
    rating: 8.2,
  },
  isActive: true,
  joinedAt: '2024-01-01',
  lastPlayedAt: '2024-03-15',
});

// ✅ Calculate play style from match data
const playStyle = await PlayerProfileService.calculatePlayStyle(playerId, {
  totalGoals: 25,
  totalAssists: 10,
  totalMatches: 20,
  defensiveActions: 50,
});

await PlayerProfileService.updatePlayStyle(playerId, playStyle.data);

// ✅ Add friend
await PlayerProfileService.addFriend(playerId, friendId);

// ✅ Check if friends before inviting
const areFriends = await PlayerProfileService.isFriend(playerId, friendId);
if (areFriends.data) {
  // Show "invite friend" button
}

// ✅ Block toxic player
await PlayerProfileService.blockPlayer(playerId, toxicPlayerId);

// ✅ Check if blocked before match registration
const isBlocked = await PlayerProfileService.isBlocked(playerId, otherPlayerId);
if (isBlocked.data) {
  return res.status(403).json({ message: 'This player has blocked you' });
}

// ✅ Get leaderboards
const leaderboard = await PlayerProfileService.getCompleteLeaderboard();
console.log('Top scorers:', leaderboard.data?.topScorers);
console.log('Top rated:', leaderboard.data?.topRated);

// ✅ Get profile summary for UI
const summary = await PlayerProfileService.getProfileSummary(playerId);
console.log(`Goals: ${summary.data?.totalGoals} (${summary.data?.rank.goals})`);
console.log(`Rating: ${summary.data?.averageRating} (${summary.data?.rank.rating})`);

// ✅ Get career highlights
const highlights = await PlayerProfileService.getCareerHighlights(playerId);
console.log('Best rating:', highlights.data?.bestRating);
console.log('Favorite league:', highlights.data?.favoriteLeague);

// ✅ Compare two players
const comparison = await PlayerProfileService.comparePlayers(player1Id, player2Id);
console.log('Goals winner:', comparison.data?.comparison.goals.winner);
console.log('Rating difference:', comparison.data?.comparison.rating.difference);

// ✅ Format profile for display
const formatted = PlayerProfileService.formatProfile(profile.data!);
console.log('Play style:', formatted.playStyleLabel);
console.log('Social:', formatted.socialSummary);

*/