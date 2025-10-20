// ============================================
// services/PlayerRatingProfileService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { playerRatingProfileAPI } from '../../api/apiLayer/playerRatingProfileAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IPlayerRatingProfile } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class PlayerRatingProfileService {
  // ============================================
  // 1. PROFILE RETRIEVAL
  // ============================================

  /**
   * Get global rating profile (all leagues, all seasons)
   */
  static async getGlobalProfile(playerId: string): Promise<ApiResponse<IPlayerRatingProfile | null>> {
    return playerRatingProfileAPI.getGlobalProfile(playerId);
  }

  /**
   * Get league-specific rating profile
   */
  static async getLeagueProfile(
    playerId: string,
    leagueId: string
  ): Promise<ApiResponse<IPlayerRatingProfile | null>> {
    return playerRatingProfileAPI.getLeagueProfile(playerId, leagueId);
  }

  /**
   * Get season-specific rating profile
   */
  static async getSeasonProfile(
    playerId: string,
    seasonId: string
  ): Promise<ApiResponse<IPlayerRatingProfile | null>> {
    return playerRatingProfileAPI.getSeasonProfile(playerId, seasonId);
  }

  /**
   * Get all rating profiles for a player
   */
  static async getAllPlayerProfiles(
    playerId: string
  ): Promise<ApiResponse<IPlayerRatingProfile[]>> {
    return playerRatingProfileAPI.getAllPlayerProfiles(playerId);
  }

  // ============================================
  // 2. PROFILE CREATION
  // ============================================

  /**
   * Create global profile
   */
  static async createGlobalProfile(playerId: string): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      ApiLogger.log('PlayerRatingProfileService', 'createGlobalProfile', {
        playerId,
      });

      const result = await playerRatingProfileAPI.createGlobalProfile(playerId);

      if (result.success) {
        ApiLogger.success('PlayerRatingProfileService', 'createGlobalProfile', {
          playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerRatingProfileService', 'createGlobalProfile', error);
      return {
        success: false,
        error: {
          code: 'CREATE_GLOBAL_PROFILE_ERROR',
          message: error.message || 'Global profil oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Create league profile
   */
  static async createLeagueProfile(
    playerId: string,
    leagueId: string
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      ApiLogger.log('PlayerRatingProfileService', 'createLeagueProfile', {
        playerId,
        leagueId,
      });

      const result = await playerRatingProfileAPI.createLeagueProfile(playerId, leagueId);

      if (result.success) {
        ApiLogger.success('PlayerRatingProfileService', 'createLeagueProfile', {
          playerId,
          leagueId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerRatingProfileService', 'createLeagueProfile', error);
      return {
        success: false,
        error: {
          code: 'CREATE_LEAGUE_PROFILE_ERROR',
          message: error.message || 'Lig profili oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Create season profile
   */
  static async createSeasonProfile(
    playerId: string,
    leagueId: string,
    seasonId: string
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      ApiLogger.log('PlayerRatingProfileService', 'createSeasonProfile', {
        playerId,
        seasonId,
      });

      const result = await playerRatingProfileAPI.createSeasonProfile(
        playerId,
        leagueId,
        seasonId
      );

      if (result.success) {
        ApiLogger.success('PlayerRatingProfileService', 'createSeasonProfile', {
          playerId,
          seasonId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerRatingProfileService', 'createSeasonProfile', error);
      return {
        success: false,
        error: {
          code: 'CREATE_SEASON_PROFILE_ERROR',
          message: error.message || 'Sezon profili oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get or create global profile
   */
  static async getOrCreateGlobalProfile(
    playerId: string
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      const profileResult = await this.getGlobalProfile(playerId);

      if (profileResult.success && profileResult.data) {
        return { success: true, data: profileResult.data };
      }

      return this.createGlobalProfile(playerId);
    } catch (error: any) {
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

  // ============================================
  // 3. STATS UPDATE
  // ============================================

  /**
   * Update overall stats
   */
  static async updateOverallStats(
    profileId: string,
    stats: Partial<IPlayerRatingProfile['overall']>
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      // Validate stats
      if (stats.overallRating !== undefined) {
        if (stats.overallRating < 0 || stats.overallRating > 10) {
          return {
            success: false,
            error: {
              code: 'INVALID_RATING',
              message: 'Rating 0-10 arasında olmalı',
              statusCode: 400,
            },
          };
        }
      }

      ApiLogger.log('PlayerRatingProfileService', 'updateOverallStats', {
        profileId,
      });

      const result = await playerRatingProfileAPI.updateOverallStats(profileId, stats);

      if (result.success) {
        ApiLogger.success('PlayerRatingProfileService', 'updateOverallStats', {
          profileId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('PlayerRatingProfileService', 'updateOverallStats', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_OVERALL_ERROR',
          message: error.message || 'Genel istatistikler güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update league stats
   */
  static async updateLeagueStats(
    profileId: string,
    stats: Partial<IPlayerRatingProfile['league']>
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    return playerRatingProfileAPI.updateLeagueStats(profileId, stats);
  }

  /**
   * Update friendly stats
   */
  static async updateFriendlyStats(
    profileId: string,
    stats: Partial<IPlayerRatingProfile['friendly']>
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    return playerRatingProfileAPI.updateFriendlyStats(profileId, stats);
  }

  /**
   * Update category averages
   */
  static async updateCategoryAverages(
    profileId: string,
    categories: IPlayerRatingProfile['categoryAverages']
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      // Validate categories (0-10 range)
      if (categories) {
        const values = Object.values(categories);
        if (values.some(v => v < 0 || v > 10)) {
          return {
            success: false,
            error: {
              code: 'INVALID_CATEGORIES',
              message: 'Kategori değerleri 0-10 arasında olmalı',
              statusCode: 400,
            },
          };
        }
      }

      return playerRatingProfileAPI.updateCategoryAverages(profileId, categories);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_CATEGORIES_ERROR',
          message: error.message || 'Kategoriler güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. TREND ANALYSIS
  // ============================================

  /**
   * Calculate and update rating trend
   */
  static async calculateRatingTrend(
    profileId: string,
    newRating: number
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      const profileResult = await playerRatingProfileAPI.getById(profileId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Rating profili bulunamadı',
            statusCode: 404,
          },
        };
      }

      const profile = profileResult.data;

      // Add new rating to the beginning of array, keep only last 5
      const updatedLastFive = [newRating, ...profile.lastFiveRatings].slice(0, 5);

      // Calculate trend only if we have at least 3 ratings
      let trend: IPlayerRatingProfile['ratingTrend'] = 'stable';

      if (updatedLastFive.length >= 3) {
        const recent = updatedLastFive.slice(0, 3);
        const older = updatedLastFive.slice(2, 5);

        if (older.length >= 2) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

          const difference = recentAvg - olderAvg;

          if (difference > 0.3) {
            trend = 'improving';
          } else if (difference < -0.3) {
            trend = 'declining';
          } else {
            trend = 'stable';
          }
        }
      }

      return playerRatingProfileAPI.updateRatingTrend(
        profileId,
        trend,
        updatedLastFive
      );
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CALCULATE_TREND_ERROR',
          message: error.message || 'Trend hesaplanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get trend description
   */
  static getTrendDescription(trend: IPlayerRatingProfile['ratingTrend']): {
    label: string;
    icon: string;
    color: string;
    description: string;
  } {
    const trendMap: Record<
      IPlayerRatingProfile['ratingTrend'],
      { label: string; icon: string; color: string; description: string }
    > = {
      improving: {
        label: 'Yükseliş',
        icon: '📈',
        color: 'green',
        description: 'Performans yükselişte',
      },
      stable: {
        label: 'Sabit',
        icon: '➡️',
        color: 'blue',
        description: 'Performans kararlı',
      },
      declining: {
        label: 'Düşüş',
        icon: '📉',
        color: 'red',
        description: 'Performans düşüşte',
      },
    };

    return trendMap[trend];
  }

  // ============================================
  // 5. TEAMMATE/OPPONENT RATINGS
  // ============================================

  /**
   * Update teammate ratings
   */
  static async updateTeammateRatings(
    profileId: string,
    newRating: number,
    currentAverage: number,
    currentCount: number
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      // Calculate new average
      const newCount = currentCount + 1;
      const newAverage = ((currentAverage * currentCount) + newRating) / newCount;

      return playerRatingProfileAPI.updateTeammateRatings(profileId, {
        average: parseFloat(newAverage.toFixed(2)),
        count: newCount,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_TEAMMATE_ERROR',
          message: error.message || 'Takım arkadaşı puanlaması güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update opponent ratings
   */
  static async updateOpponentRatings(
    profileId: string,
    newRating: number,
    currentAverage: number,
    currentCount: number
  ): Promise<ApiResponse<IPlayerRatingProfile>> {
    try {
      // Calculate new average
      const newCount = currentCount + 1;
      const newAverage = ((currentAverage * currentCount) + newRating) / newCount;

      return playerRatingProfileAPI.updateOpponentRatings(profileId, {
        average: parseFloat(newAverage.toFixed(2)),
        count: newCount,
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_OPPONENT_ERROR',
          message: error.message || 'Rakip puanlaması güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. LEADERBOARDS
  // ============================================

  /**
   * Get top rated players (global)
   */
  static async getTopRated(limit: number = 10): Promise<ApiResponse<IPlayerRatingProfile[]>> {
    return playerRatingProfileAPI.getTopRated(limit);
  }

  /**
   * Get top rated players in league
   */
  static async getTopRatedInLeague(
    leagueId: string,
    limit: number = 10
  ): Promise<ApiResponse<IPlayerRatingProfile[]>> {
    return playerRatingProfileAPI.getTopRatedInLeague(leagueId, limit);
  }

  /**
   * Get top rated players in season
   */
  static async getTopRatedInSeason(
    seasonId: string,
    limit: number = 10
  ): Promise<ApiResponse<IPlayerRatingProfile[]>> {
    return playerRatingProfileAPI.getTopRatedInSeason(seasonId, limit);
  }

  /**
   * Get most MVPs
   */
  static async getMostMVPs(limit: number = 10): Promise<ApiResponse<IPlayerRatingProfile[]>> {
    return playerRatingProfileAPI.getMostMVPs(limit);
  }

  /**
   * Get improving players (trending up)
   */
  static async getImprovingPlayers(
    limit: number = 10
  ): Promise<ApiResponse<IPlayerRatingProfile[]>> {
    return playerRatingProfileAPI.getImprovingPlayers(limit);
  }

  /**
   * Get complete rating leaderboard
   */
  static async getRatingLeaderboard(): Promise<ApiResponse<{
    topRated: IPlayerRatingProfile[];
    mostMVPs: IPlayerRatingProfile[];
    improving: IPlayerRatingProfile[];
  }>> {
    try {
      const [topRated, mostMVPs, improving] = await Promise.all([
        this.getTopRated(10),
        this.getMostMVPs(10),
        this.getImprovingPlayers(10),
      ]);

      if (!topRated.success || !mostMVPs.success || !improving.success) {
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
          topRated: topRated.data || [],
          mostMVPs: mostMVPs.data || [],
          improving: improving.data || [],
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
  // 7. COMPARISON
  // ============================================

  /**
   * Compare two players' rating profiles
   */
  static async comparePlayers(
    playerId1: string,
    playerId2: string
  ): Promise<ApiResponse<{
    player1: IPlayerRatingProfile | null;
    player2: IPlayerRatingProfile | null;
    comparison: {
      ratingDifference: number;
      mvpDifference: number;
      trendComparison: string;
      winner: {
        rating: string;
        mvp: string;
        trend: string;
      };
    };
  }>> {
    try {
      const comparisonResult = await playerRatingProfileAPI.comparePlayers(
        playerId1,
        playerId2
      );

      if (!comparisonResult.success || !comparisonResult.data) {
        return {
          success: false,
          error: comparisonResult.error || {
            code: 'COMPARISON_ERROR',
            message: 'Karşılaştırma yapılamadı',
            statusCode: 500,
          },
        };
      }

      const { player1, player2, comparison } = comparisonResult.data;

      // Determine winners
      const winner = {
        rating:
          !player1 || !player2
            ? 'tie'
            : player1.overall.overallRating > player2.overall.overallRating
            ? 'player1'
            : player1.overall.overallRating < player2.overall.overallRating
            ? 'player2'
            : 'tie',
        mvp:
          !player1 || !player2
            ? 'tie'
            : player1.overall.mvpCount > player2.overall.mvpCount
            ? 'player1'
            : player1.overall.mvpCount < player2.overall.mvpCount
            ? 'player2'
            : 'tie',
        trend:
          !player1 || !player2
            ? 'tie'
            : player1.ratingTrend === 'improving' && player2.ratingTrend !== 'improving'
            ? 'player1'
            : player2.ratingTrend === 'improving' && player1.ratingTrend !== 'improving'
            ? 'player2'
            : 'tie',
      };

      return {
        success: true,
        data: {
          player1,
          player2,
          comparison: {
            ...comparison,
            winner,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'COMPARE_ERROR',
          message: error.message || 'Karşılaştırma yapılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 8. ANALYTICS & INSIGHTS
  // ============================================

  /**
   * Get rating profile summary
   */
  static async getProfileSummary(playerId: string): Promise<ApiResponse<{
    globalRating: number;
    leagueRating: number;
    friendlyRating: number;
    totalMVPs: number;
    trend: ReturnType<typeof PlayerRatingProfileService.getTrendDescription>;
    teammateVsOpponent: {
      teammateRating: number;
      opponentRating: number;
      difference: number;
    };
    categoryBreakdown?: IPlayerRatingProfile['categoryAverages'];
  }>> {
    try {
      const profileResult = await this.getGlobalProfile(playerId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Rating profili bulunamadı',
            statusCode: 404,
          },
        };
      }

      const profile = profileResult.data;

      const difference =
        profile.teammateRatings.average - profile.opponentRatings.average;

      return {
        success: true,
        data: {
          globalRating: profile.overall.overallRating,
          leagueRating: profile.league.overallRating,
          friendlyRating: profile.friendly.overallRating,
          totalMVPs: profile.overall.mvpCount,
          trend: this.getTrendDescription(profile.ratingTrend),
          teammateVsOpponent: {
            teammateRating: profile.teammateRatings.average,
            opponentRating: profile.opponentRatings.average,
            difference: parseFloat(difference.toFixed(2)),
          },
          categoryBreakdown: profile.categoryAverages,
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
   * Get rating insights
   */
  static async getRatingInsights(playerId: string): Promise<ApiResponse<{
    strengths: string[];
    improvements: string[];
    highlights: string[];
  }>> {
    try {
      const profileResult = await this.getGlobalProfile(playerId);

      if (!profileResult.success || !profileResult.data) {
        return {
          success: false,
          error: profileResult.error || {
            code: 'PROFILE_NOT_FOUND',
            message: 'Rating profili bulunamadı',
            statusCode: 404,
          },
        };
      }

      const profile = profileResult.data;

      const strengths: string[] = [];
      const improvements: string[] = [];
      const highlights: string[] = [];

      // Analyze overall rating
      if (profile.overall.overallRating >= 8) {
        strengths.push('Yüksek genel performans (8+)');
      } else if (profile.overall.overallRating < 6) {
        improvements.push('Genel performansı artır (6 altı)');
      }

      // Analyze MVP rate
      if (profile.overall.mvpRate > 20) {
        strengths.push('Yüksek MVP oranı (%20+)');
      }

      // Analyze trend
      if (profile.ratingTrend === 'improving') {
        highlights.push('Performans yükseliş trendinde 📈');
      } else if (profile.ratingTrend === 'declining') {
        improvements.push('Son performans düşüşü - tekrar yükselmeli 📉');
      }

      // Analyze teammate vs opponent ratings
      const difference =
        profile.teammateRatings.average - profile.opponentRatings.average;
      if (difference > 1) {
        strengths.push('Takım arkadaşlarından yüksek puanlar alıyor');
      } else if (difference < -1) {
        improvements.push('Takım arkadaşlarıyla uyum geliştirmeli');
      }

      // Analyze category averages
      if (profile.categoryAverages) {
        const { skill, teamwork, sportsmanship, effort } = profile.categoryAverages;

        if (skill >= 8) strengths.push('Yüksek beceri seviyesi');
        if (teamwork >= 8) strengths.push('Mükemmel takım oyuncusu');
        if (sportsmanship >= 8) strengths.push('Örnek sportmenlik');
        if (effort >= 8) strengths.push('Yüksek çaba gösteriyor');

        if (skill < 6) improvements.push('Beceri geliştirmeli');
        if (teamwork < 6) improvements.push('Takım çalışması artırmalı');
        if (sportsmanship < 6) improvements.push('Sportmenlik iyileştirmeli');
        if (effort < 6) improvements.push('Çabayı artırmalı');
      }

      // Default messages if empty
      if (strengths.length === 0) {
        strengths.push('Performansını sürdürmeye devam et');
      }

      if (improvements.length === 0) {
        improvements.push('İyi gidiyorsun, böyle devam');
      }

      if (highlights.length === 0) {
        highlights.push('Daha fazla maç oyna ve gelişimini gör');
      }

      return {
        success: true,
        data: {
          strengths,
          improvements,
          highlights,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_INSIGHTS_ERROR',
          message: error.message || 'İçgörüler alınamadı',
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
   * Format rating profile for display
   */
  static formatProfile(profile: IPlayerRatingProfile): {
    overallRating: string;
    mvpCount: number;
    mvpRate: string;
    trend: ReturnType<typeof PlayerRatingProfileService.getTrendDescription>;
    recentPerformance: string;
    ratingSource: string;
  } {
    const trend = this.getTrendDescription(profile.ratingTrend);

    const recentPerformance =
      profile.lastFiveRatings.length > 0
        ? `Son ${profile.lastFiveRatings.length} maç: ${profile.lastFiveRatings.map(r => r.toFixed(1)).join(', ')}`
        : 'Henüz yeterli maç yok';

    const teammatePercent =
      profile.teammateRatings.count > 0
        ? Math.round(
            (profile.teammateRatings.count /
              profile.overall.totalRatingsReceived) *
              100
          )
        : 0;

    const ratingSource = `Takım arkadaşı: %${teammatePercent}, Rakip: %${100 - teammatePercent}`;

    return {
      overallRating: profile.overall.overallRating.toFixed(1),
      mvpCount: profile.overall.mvpCount,
      mvpRate: `%${profile.overall.mvpRate.toFixed(1)}`,
      trend,
      recentPerformance,
      ratingSource,
    };
  }

  /**
   * Get rating badge
   */
  static getRatingBadge(rating: number): {
    name: string;
    color: string;
    icon: string;
  } {
    if (rating >= 9) {
      return { name: 'Efsane', color: 'purple', icon: '👑' };
    } else if (rating >= 8) {
      return { name: 'Yıldız', color: 'gold', icon: '⭐' };
    } else if (rating >= 7) {
      return { name: 'Profesyonel', color: 'blue', icon: '🏅' };
    } else if (rating >= 6) {
      return { name: 'İyi', color: 'green', icon: '✅' };
    } else if (rating >= 5) {
      return { name: 'Orta', color: 'yellow', icon: '➖' };
    } else {
      return { name: 'Gelişiyor', color: 'red', icon: '📊' };
    }
  }

  /**
   * Calculate profile completeness
   */
  static async getProfileCompleteness(
    playerId: string
  ): Promise<ApiResponse<{
    percentage: number;
    missing: string[];
    complete: string[];
  }>> {
    try {
      const profileResult = await this.getGlobalProfile(playerId);

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

      const complete: string[] = [];
      const missing: string[] = [];

      // Check basic stats
      if (profile.overall.totalRatingsReceived > 0) {
        complete.push('Temel istatistikler');
      } else {
        missing.push('Henüz rating almadın');
      }

      // Check category averages
      if (profile.categoryAverages) {
        complete.push('Kategori puanları');
      } else {
        missing.push('Kategori puanları eksik');
      }

      // Check trend data
      if (profile.lastFiveRatings.length >= 5) {
        complete.push('Trend analizi');
      } else {
        missing.push(`Trend analizi için ${5 - profile.lastFiveRatings.length} maç daha gerek`);
      }

      // Check teammate/opponent data
      if (profile.teammateRatings.count > 0 && profile.opponentRatings.count > 0) {
        complete.push('Takım arkadaşı/Rakip karşılaştırması');
      } else {
        missing.push('Daha fazla rating gerek (takım arkadaşı + rakip)');
      }

      // Check MVP data
      if (profile.overall.mvpCount > 0) {
        complete.push('MVP istatistikleri');
      } else {
        missing.push('Henüz MVP olmadın');
      }

      const percentage = Math.round((complete.length / (complete.length + missing.length)) * 100);

      return {
        success: true,
        data: {
          percentage,
          complete,
          missing,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_COMPLETENESS_ERROR',
          message: error.message || 'Profil tamlığı hesaplanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

export default PlayerRatingProfileService;



/* 

// ✅ Get or create global profile
const profile = await PlayerRatingProfileService.getOrCreateGlobalProfile(playerId);

// ✅ After a match rating
await PlayerRatingProfileService.updateOverallStats(profileId, {
  overallRating: 8.5,
  totalRatingsReceived: profile.data!.overall.totalRatingsReceived + 1,
});

// ✅ Calculate trend after new rating
await PlayerRatingProfileService.calculateRatingTrend(profileId, 8.5);

// ✅ Update teammate rating (weighted average)
await PlayerRatingProfileService.updateTeammateRatings(
  profileId,
  8.5, // new rating
  profile.data!.teammateRatings.average,
  profile.data!.teammateRatings.count
);

// ✅ Update category averages
await PlayerRatingProfileService.updateCategoryAverages(profileId, {
  skill: 8.2,
  teamwork: 9.0,
  sportsmanship: 8.5,
  effort: 8.8,
});

// ✅ Get profile summary
const summary = await PlayerRatingProfileService.getProfileSummary(playerId);
console.log('Global rating:', summary.data?.globalRating);
console.log('Trend:', summary.data?.trend.label, summary.data?.trend.icon);
console.log('Teammate vs Opponent:', summary.data?.teammateVsOpponent.difference);

// ✅ Get AI insights
const insights = await PlayerRatingProfileService.getRatingInsights(playerId);
console.log('Strengths:', insights.data?.strengths);
console.log('Improvements:', insights.data?.improvements);
console.log('Highlights:', insights.data?.highlights);

// ✅ Get leaderboard
const leaderboard = await PlayerRatingProfileService.getRatingLeaderboard();
console.log('Top rated:', leaderboard.data?.topRated);
console.log('Improving players:', leaderboard.data?.improving);

// ✅ Compare two players
const comparison = await PlayerRatingProfileService.comparePlayers(player1Id, player2Id);
console.log('Rating winner:', comparison.data?.comparison.winner.rating);
console.log('MVP winner:', comparison.data?.comparison.winner.mvp);
console.log('Trend winner:', comparison.data?.comparison.winner.trend);

// ✅ Get rating badge
const badge = PlayerRatingProfileService.getRatingBadge(8.5);
console.log(`${badge.icon} ${badge.name}`); // ⭐ Yıldız

// ✅ Format profile for UI
const formatted = PlayerRatingProfileService.formatProfile(profile.data!);
console.log('Overall:', formatted.overallRating);
console.log('MVP rate:', formatted.mvpRate);
console.log('Trend:', formatted.trend.label);
console.log('Recent:', formatted.recentPerformance);

// ✅ Check profile completeness
const completeness = await PlayerRatingProfileService.getProfileCompleteness(playerId);
console.log(`Profile: ${completeness.data?.percentage}% complete`);
console.log('Missing:', completeness.data?.missing);
*/