// ============================================
// services/MatchCommentService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { matchCommentAPI } from '../../api/apiLayer/matchCommentAPI';
import { matchAPI } from '../../api/apiLayer/matchAPI';
import { playerAPI } from '../../api/apiLayer/playerAPI';
import { leagueAPI } from '../../api/apiLayer/leagueAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IMatchComment, MatchType } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class MatchCommentService {
  // ============================================
  // 1. COMMENT CREATION & MANAGEMENT
  // ============================================

  /**
   * Create comment
   */
  static async createComment(data: {
    matchId: string;
    playerId: string;
    comment: string;
    type?: 'general' | 'highlight' | 'improvement';
    autoApprove?: boolean;
  }): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('MatchCommentService', 'createComment', {
        matchId: data.matchId,
        playerId: data.playerId,
      });

      // Get match to validate
      const matchResult = await matchAPI.getById(data.matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if match is completed
      if (match.status !== 'completed') {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_COMPLETED',
            message: 'Sadece tamamlanmış maçlar için yorum yapılabilir',
            statusCode: 400,
          },
        };
      }

      // Check if player was in the match
      const allPlayerIds = match.players.teams
        ? [
            ...match.players.teams.team1.map(p => p.playerId),
            ...match.players.teams.team2.map(p => p.playerId),
          ]
        : [];

      if (!allPlayerIds.includes(data.playerId)) {
        return {
          success: false,
          error: {
            code: 'PLAYER_NOT_IN_MATCH',
            message: 'Sadece maçta oynayan oyuncular yorum yapabilir',
            statusCode: 403,
          },
        };
      }

      // Get player info for cache
      const playerResult = await playerAPI.getById(data.playerId);
      const playerName = playerResult.success && playerResult.data
        ? `${playerResult.data.name} ${playerResult.data.surname}`
        : 'Unknown Player';
      const playerPhoto = playerResult.success && playerResult.data
        ? playerResult.data.profilePhoto
        : undefined;

      // Determine auto-approve (if player is organizer/admin or if specified)
      let shouldAutoApprove = data.autoApprove ?? false;

      if (match.leagueId) {
        const isAdminCheck = await leagueAPI.isAdmin(match.leagueId, data.playerId);
        if (isAdminCheck.success && isAdminCheck.data) {
          shouldAutoApprove = true;
        }
      }

      const result = await matchCommentAPI.createComment({
        matchId: data.matchId,
        matchType: match.type,
        playerId: data.playerId,
        playerName,
        playerPhoto,
        comment: data.comment,
        type: data.type,
        autoApprove: shouldAutoApprove,
      });

      if (result.success) {
        ApiLogger.success('MatchCommentService', 'createComment', {
          commentId: result.data?.id,
          autoApproved: shouldAutoApprove,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'createComment', error);
      return {
        success: false,
        error: {
          code: 'CREATE_COMMENT_ERROR',
          message: error.message || 'Yorum oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update comment
   */
  static async updateComment(
    commentId: string,
    userId: string,
    data: {
      comment?: string;
      type?: 'general' | 'highlight' | 'improvement';
    }
  ): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('MatchCommentService', 'updateComment', {
        commentId,
        userId,
      });

      const result = await matchCommentAPI.updateComment(commentId, userId, data);

      if (result.success) {
        ApiLogger.success('MatchCommentService', 'updateComment', { commentId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'updateComment', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_COMMENT_ERROR',
          message: error.message || 'Yorum güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete comment
   */
  static async deleteComment(
    commentId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    return matchCommentAPI.deleteComment(commentId, userId);
  }

  // ============================================
  // 2. QUERY OPERATIONS
  // ============================================

  /**
   * Get comment by ID
   */
  static async getComment(commentId: string): Promise<ApiResponse<IMatchComment>> {
    return matchCommentAPI.getById(commentId);
  }

  /**
   * Get all comments for a match
   */
  static async getMatchComments(
    matchId: string,
    includeUnapproved: boolean = false
  ): Promise<ApiResponse<IMatchComment[]>> {
    if (includeUnapproved) {
      return matchCommentAPI.getByMatch(matchId);
    } else {
      return matchCommentAPI.getApprovedComments(matchId);
    }
  }

  /**
   * Get pending comments for a match
   */
  static async getPendingComments(matchId: string): Promise<ApiResponse<IMatchComment[]>> {
    return matchCommentAPI.getPendingComments(matchId);
  }

  /**
   * Get comments by player
   */
  static async getPlayerComments(playerId: string): Promise<ApiResponse<IMatchComment[]>> {
    return matchCommentAPI.getByPlayer(playerId);
  }

  /**
   * Get comments by type
   */
  static async getCommentsByType(
    matchId: string,
    type: 'general' | 'highlight' | 'improvement'
  ): Promise<ApiResponse<IMatchComment[]>> {
    return matchCommentAPI.getByType(matchId, type);
  }

  /**
   * Get most liked comments for a match
   */
  static async getMostLikedComments(
    matchId: string,
    limit: number = 10
  ): Promise<ApiResponse<IMatchComment[]>> {
    return matchCommentAPI.getMostLiked(matchId, limit);
  }

  /**
   * Get match comments with categorization
   */
  static async getMatchCommentsWithCategories(
    matchId: string
  ): Promise<ApiResponse<{
    all: IMatchComment[];
    approved: IMatchComment[];
    pending: IMatchComment[];
    general: IMatchComment[];
    highlights: IMatchComment[];
    improvements: IMatchComment[];
    mostLiked: IMatchComment[];
  }>> {
    try {
      ApiLogger.log('MatchCommentService', 'getMatchCommentsWithCategories', {
        matchId,
      });

      const [all, pending, general, highlights, improvements, mostLiked] = await Promise.all([
        matchCommentAPI.getByMatch(matchId),
        matchCommentAPI.getPendingComments(matchId),
        matchCommentAPI.getByType(matchId, 'general'),
        matchCommentAPI.getByType(matchId, 'highlight'),
        matchCommentAPI.getByType(matchId, 'improvement'),
        matchCommentAPI.getMostLiked(matchId, 5),
      ]);

      const allComments = all.success && all.data ? all.data : [];
      const approved = allComments.filter(c => c.isApproved);

      return {
        success: true,
        data: {
          all: allComments,
          approved,
          pending: pending.success && pending.data ? pending.data : [],
          general: general.success && general.data ? general.data : [],
          highlights: highlights.success && highlights.data ? highlights.data : [],
          improvements: improvements.success && improvements.data ? improvements.data : [],
          mostLiked: mostLiked.success && mostLiked.data ? mostLiked.data : [],
        },
      };
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'getMatchCommentsWithCategories', error);
      return {
        success: false,
        error: {
          code: 'GET_CATEGORIZED_ERROR',
          message: error.message || 'Kategorize edilmiş yorumlar alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. MODERATION
  // ============================================

  /**
   * Approve comment
   */
  static async approveComment(
    commentId: string,
    approverId: string
  ): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('MatchCommentService', 'approveComment', {
        commentId,
        approverId,
      });

      // Get comment to check match
      const commentResult = await matchCommentAPI.getById(commentId);

      if (!commentResult.success || !commentResult.data) {
        return {
          success: false,
          error: commentResult.error || {
            code: 'COMMENT_NOT_FOUND',
            message: 'Yorum bulunamadı',
            statusCode: 404,
          },
        };
      }

      const comment = commentResult.data;

      // Get match to check league
      const matchResult = await matchAPI.getById(comment.matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if user is league admin
      if (match.leagueId) {
        const isAdminCheck = await leagueAPI.isAdmin(match.leagueId, approverId);
        if (!isAdminCheck.success || !isAdminCheck.data) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Yorum onaylama yetkiniz yok',
              statusCode: 403,
            },
          };
        }
      }

      const result = await matchCommentAPI.approveComment(commentId, approverId);

      if (result.success) {
        ApiLogger.success('MatchCommentService', 'approveComment', { commentId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'approveComment', error);
      return {
        success: false,
        error: {
          code: 'APPROVE_ERROR',
          message: error.message || 'Yorum onaylanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reject comment
   */
  static async rejectComment(
    commentId: string,
    userId: string
  ): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('MatchCommentService', 'rejectComment', {
        commentId,
        userId,
      });

      // Get comment to check match
      const commentResult = await matchCommentAPI.getById(commentId);

      if (!commentResult.success || !commentResult.data) {
        return {
          success: false,
          error: commentResult.error || {
            code: 'COMMENT_NOT_FOUND',
            message: 'Yorum bulunamadı',
            statusCode: 404,
          },
        };
      }

      const comment = commentResult.data;

      // Get match to check league
      const matchResult = await matchAPI.getById(comment.matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if user is league admin
      if (match.leagueId) {
        const isAdminCheck = await leagueAPI.isAdmin(match.leagueId, userId);
        if (!isAdminCheck.success || !isAdminCheck.data) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Yorum reddetme yetkiniz yok',
              statusCode: 403,
            },
          };
        }
      }

      const result = await matchCommentAPI.rejectComment(commentId);

      if (result.success) {
        ApiLogger.success('MatchCommentService', 'rejectComment', { commentId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'rejectComment', error);
      return {
        success: false,
        error: {
          code: 'REJECT_ERROR',
          message: error.message || 'Yorum reddedilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Approve all pending comments for a match
   */
  static async approveAllPending(
    matchId: string,
    approverId: string
  ): Promise<ApiResponse<{
    approved: number;
    failed: number;
  }>> {
    try {
      ApiLogger.log('MatchCommentService', 'approveAllPending', {
        matchId,
        approverId,
      });

      // Get match to check league
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if user is league admin
      if (match.leagueId) {
        const isAdminCheck = await leagueAPI.isAdmin(match.leagueId, approverId);
        if (!isAdminCheck.success || !isAdminCheck.data) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Toplu onaylama yetkiniz yok',
              statusCode: 403,
            },
          };
        }
      }

      const approvedResult = await matchCommentAPI.approveAllPending(matchId, approverId);

      if (approvedResult.success) {
        ApiLogger.success('MatchCommentService', 'approveAllPending', {
          matchId,
          approved: approvedResult.data,
        });

        return {
          success: true,
          data: {
            approved: approvedResult.data || 0,
            failed: 0,
          },
        };
      }

      return {
        success: false,
        error: approvedResult.error || {
          code: 'APPROVE_ALL_ERROR',
          message: 'Toplu onaylama başarısız',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'approveAllPending', error);
      return {
        success: false,
        error: {
          code: 'APPROVE_ALL_ERROR',
          message: error.message || 'Toplu onaylama sırasında hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 4. LIKES MANAGEMENT
  // ============================================

  /**
   * Toggle like on comment
   */
  static async toggleLike(
    commentId: string,
    playerId: string
  ): Promise<ApiResponse<{
    comment: IMatchComment;
    liked: boolean;
  }>> {
    try {
      ApiLogger.log('MatchCommentService', 'toggleLike', {
        commentId,
        playerId,
      });

      const result = await matchCommentAPI.toggleLike(commentId, playerId);

      if (result.success && result.data) {
        const liked = result.data.likes?.includes(playerId) || false;

        ApiLogger.success('MatchCommentService', 'toggleLike', {
          commentId,
          liked,
        });

        return {
          success: true,
          data: {
            comment: result.data,
            liked,
          },
        };
      }

      return {
        success: false,
        error: result.error || {
          code: 'TOGGLE_LIKE_ERROR',
          message: 'Like durumu değiştirilemedi',
          statusCode: 500,
        },
      };
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'toggleLike', error);
      return {
        success: false,
        error: {
          code: 'TOGGLE_LIKE_ERROR',
          message: error.message || 'Like durumu değiştirilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if player liked a comment
   */
  static async hasLiked(
    commentId: string,
    playerId: string
  ): Promise<ApiResponse<boolean>> {
    return matchCommentAPI.hasLiked(commentId, playerId);
  }

  // ============================================
  // 5. STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get match comment statistics
   */
  static async getMatchCommentStats(matchId: string): Promise<ApiResponse<{
    total: number;
    approved: number;
    pending: number;
    byType: {
      general: number;
      highlight: number;
      improvement: number;
    };
    totalLikes: number;
    averageLikesPerComment: number;
    mostLikedComment?: IMatchComment;
    topCommenters: Array<{
      playerId: string;
      playerName: string;
      commentCount: number;
    }>;
  }>> {
    try {
      ApiLogger.log('MatchCommentService', 'getMatchCommentStats', { matchId });

      const statsResult = await matchCommentAPI.getMatchCommentStats(matchId);

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: statsResult.error || {
            code: 'GET_STATS_ERROR',
            message: 'İstatistikler alınamadı',
            statusCode: 500,
          },
        };
      }

      const stats = statsResult.data;

      // Get all comments for additional stats
      const commentsResult = await matchCommentAPI.getByMatch(matchId);
      const comments = commentsResult.success && commentsResult.data ? commentsResult.data : [];

      // Calculate top commenters
      const commenterMap: Record<string, { playerName: string; count: number }> = {};

      for (const comment of comments) {
        if (!commenterMap[comment.playerId]) {
          commenterMap[comment.playerId] = {
            playerName: comment.playerName,
            count: 0,
          };
        }
        commenterMap[comment.playerId].count++;
      }

      const topCommenters = Object.entries(commenterMap)
        .map(([playerId, data]) => ({
          playerId,
          playerName: data.playerName,
          commentCount: data.count,
        }))
        .sort((a, b) => b.commentCount - a.commentCount)
        .slice(0, 5);

      const averageLikesPerComment = stats.total > 0
        ? stats.totalLikes / stats.total
        : 0;

      return {
        success: true,
        data: {
          ...stats,
          averageLikesPerComment,
          topCommenters,
        },
      };
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'getMatchCommentStats', error);
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

  /**
   * Get player comment statistics
   */
  static async getPlayerCommentStats(playerId: string): Promise<ApiResponse<{
    totalComments: number;
    approvedComments: number;
    pendingComments: number;
    totalLikesReceived: number;
    averageLikesPerComment: number;
    mostLikedComment?: IMatchComment;
    byType: {
      general: number;
      highlight: number;
      improvement: number;
    };
  }>> {
    try {
      const commentsResult = await matchCommentAPI.getByPlayer(playerId);

      if (!commentsResult.success || !commentsResult.data) {
        return {
          success: false,
          error: commentsResult.error || {
            code: 'GET_COMMENTS_ERROR',
            message: 'Yorumlar alınamadı',
            statusCode: 500,
          },
        };
      }

      const comments = commentsResult.data;

      const totalComments = comments.length;
      const approvedComments = comments.filter(c => c.isApproved).length;
      const pendingComments = comments.filter(c => !c.isApproved).length;
      const totalLikesReceived = comments.reduce((sum, c) => sum + (c.likes?.length || 0), 0);
      const averageLikesPerComment = totalComments > 0
        ? totalLikesReceived / totalComments
        : 0;

      let mostLikedComment: IMatchComment | undefined;
      if (comments.length > 0) {
        mostLikedComment = comments.reduce((prev, current) =>
          ((current.likes?.length || 0) > (prev.likes?.length || 0)) ? current : prev
        );
      }

      const byType = {
        general: comments.filter(c => c.type === 'general').length,
        highlight: comments.filter(c => c.type === 'highlight').length,
        improvement: comments.filter(c => c.type === 'improvement').length,
      };

      return {
        success: true,
        data: {
          totalComments,
          approvedComments,
          pendingComments,
          totalLikesReceived,
          averageLikesPerComment,
          mostLikedComment,
          byType,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_PLAYER_STATS_ERROR',
          message: error.message || 'Oyuncu istatistikleri alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. ADMIN OPERATIONS
  // ============================================

  /**
   * Delete all comments for a match (admin only)
   */
  static async deleteMatchComments(
    matchId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('MatchCommentService', 'deleteMatchComments', {
        matchId,
        userId,
      });

      // Get match to check league
      const matchResult = await matchAPI.getById(matchId);

      if (!matchResult.success || !matchResult.data) {
        return {
          success: false,
          error: matchResult.error || {
            code: 'MATCH_NOT_FOUND',
            message: 'Maç bulunamadı',
            statusCode: 404,
          },
        };
      }

      const match = matchResult.data;

      // Check if user is league admin
      if (match.leagueId) {
        const isAdminCheck = await leagueAPI.isAdmin(match.leagueId, userId);
        if (!isAdminCheck.success || !isAdminCheck.data) {
          return {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Yorumları silme yetkiniz yok',
              statusCode: 403,
            },
          };
        }
      }

      const result = await matchCommentAPI.deleteMatchComments(matchId);

      if (result.success) {
        ApiLogger.success('MatchCommentService', 'deleteMatchComments', {
          matchId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('MatchCommentService', 'deleteMatchComments', error);
      return {
        success: false,
        error: {
          code: 'DELETE_COMMENTS_ERROR',
          message: error.message || 'Yorumlar silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 7. HELPER METHODS
  // ============================================

  /**
   * Format comment type for display
   */
  static formatCommentType(type: 'general' | 'highlight' | 'improvement'): {
    label: string;
    icon: string;
    color: string;
  } {
    switch (type) {
      case 'general':
        return { label: 'Genel', icon: '💬', color: 'gray' };
      case 'highlight':
        return { label: 'Olumlu', icon: '⭐', color: 'green' };
      case 'improvement':
        return { label: 'Gelişim', icon: '💡', color: 'blue' };
    }
  }

  /**
   * Check if comment needs moderation
   */
  static needsModeration(comment: IMatchComment): boolean {
    return !comment.isApproved;
  }

  /**
   * Get comment age (time since creation)
   */
  static getCommentAge(comment: IMatchComment): string {
    const now = new Date();
    const created = new Date(comment.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    return `${diffDays} gün önce`;
  }

  /**
   * Validate comment content
   */
  static validateComment(comment: string): {
    valid: boolean;
    error?: string;
  } {
    if (!comment || comment.trim().length === 0) {
      return { valid: false, error: 'Yorum boş olamaz' };
    }

    if (comment.length > 500) {
      return { valid: false, error: 'Yorum 500 karakterden uzun olamaz' };
    }

    // Check for offensive content (basic check)
    const offensiveWords = ['küfür1', 'küfür2']; // Add actual offensive words
    const containsOffensive = offensiveWords.some(word =>
      comment.toLowerCase().includes(word)
    );

    if (containsOffensive) {
      return { valid: false, error: 'Yorum uygunsuz içerik içeriyor' };
    }

    return { valid: true };
  }
}

export default MatchCommentService;