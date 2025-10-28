// ============================================
// api/matchCommentApi.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { IMatchComment, MatchType } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class MatchCommentAPI extends BaseAPI<IMatchComment> {
  constructor() {
    super('match_comments');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get all comments for a match
   */
  async getByMatch(matchId: string): Promise<ApiResponse<IMatchComment[]>> {
    return this.getAll({
      where: [{ field: 'matchId', operator: '==', value: matchId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get approved comments for a match
   */
  async getApprovedComments(matchId: string): Promise<ApiResponse<IMatchComment[]>> {
    return this.getAll({
      where: [
        { field: 'matchId', operator: '==', value: matchId },
        { field: 'isApproved', operator: '==', value: true },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get pending comments (awaiting approval)
   */
  async getPendingComments(matchId: string): Promise<ApiResponse<IMatchComment[]>> {
    return this.getAll({
      where: [
        { field: 'matchId', operator: '==', value: matchId },
        { field: 'isApproved', operator: '==', value: false },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get comments by player
   */
  async getByPlayer(playerId: string): Promise<ApiResponse<IMatchComment[]>> {
    return this.getAll({
      where: [{ field: 'playerId', operator: '==', value: playerId }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get comments by type
   */
  async getByType(
    matchId: string,
    type: 'general' | 'highlight' | 'improvement'
  ): Promise<ApiResponse<IMatchComment[]>> {
    return this.getAll({
      where: [
        { field: 'matchId', operator: '==', value: matchId },
        { field: 'type', operator: '==', value: type },
        { field: 'isApproved', operator: '==', value: true },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });
  }

  /**
   * Get comments by match type
   */
  async getByMatchType(matchType: MatchType): Promise<ApiResponse<IMatchComment[]>> {
    return this.getAll({
      where: [{ field: 'matchType', operator: '==', value: matchType }],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit: 50,
    });
  }

  /**
   * Get most liked comments for a match
   */
  async getMostLiked(matchId: string, limit: number = 10): Promise<ApiResponse<IMatchComment[]>> {
    try {
      const commentsResult = await this.getApprovedComments(matchId);
      
      if (!commentsResult.success || !commentsResult.data) {
        return commentsResult;
      }

      // Sort by likes count
      const sorted = commentsResult.data
        .sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
        .slice(0, limit);

      return {
        success: true,
        data: sorted,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_MOST_LIKED_ERROR',
          message: error.message || 'Failed to get most liked comments',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // COMMENT CREATION & MANAGEMENT
  // ============================================

  /**
   * Create comment
   */
  async createComment(data: {
    matchId: string;
    matchType: MatchType;
    playerId: string;
    playerName: string;
    playerPhoto?: string;
    comment: string;
    type?: 'general' | 'highlight' | 'improvement';
    autoApprove?: boolean;
  }): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('matchComments', 'createComment', { 
        matchId: data.matchId, 
        playerId: data.playerId 
      });

      // Validate comment length
      if (!data.comment || data.comment.trim().length === 0) {
        return {
          success: false,
          error: {
            code: 'EMPTY_COMMENT',
            message: 'Comment cannot be empty',
            statusCode: 400,
          },
        };
      }

      if (data.comment.length > 500) {
        return {
          success: false,
          error: {
            code: 'COMMENT_TOO_LONG',
            message: 'Comment must be 500 characters or less',
            statusCode: 400,
          },
        };
      }

      const commentData: Omit<IMatchComment, 'id'> = {
        matchId: data.matchId,
        matchType: data.matchType,
        playerId: data.playerId,
        playerName: data.playerName,
        playerPhoto: data.playerPhoto,
        comment: data.comment.trim(),
        type: data.type || 'general',
        isApproved: data.autoApprove ?? false,
        likes: [],
        createdAt: new Date().toISOString(),
      };

      const result = await this.create(commentData);

      if (result.success) {
        ApiLogger.success('matchComments', 'createComment', { 
          commentId: result.data?.id 
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('matchComments', 'createComment', error);
      return {
        success: false,
        error: {
          code: 'CREATE_COMMENT_ERROR',
          message: error.message || 'Failed to create comment',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update comment
   */
  async updateComment(
    commentId: string,
    userId: string,
    data: {
      comment?: string;
      type?: 'general' | 'highlight' | 'improvement';
    }
  ): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('matchComments', 'updateComment', { commentId, userId });

      // Get comment
      const commentResult = await this.getById(commentId);
      
      if (!commentResult.success || !commentResult.data) {
        return {
          success: false,
          error: commentResult.error || {
            code: 'NOT_FOUND',
            message: 'Comment not found',
            statusCode: 404,
          },
        };
      }

      // Check if user is the comment owner
      if (commentResult.data.playerId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You can only edit your own comments',
            statusCode: 403,
          },
        };
      }

      // Validate comment if updating
      if (data.comment !== undefined) {
        if (data.comment.trim().length === 0) {
          return {
            success: false,
            error: {
              code: 'EMPTY_COMMENT',
              message: 'Comment cannot be empty',
              statusCode: 400,
            },
          };
        }

        if (data.comment.length > 500) {
          return {
            success: false,
            error: {
              code: 'COMMENT_TOO_LONG',
              message: 'Comment must be 500 characters or less',
              statusCode: 400,
            },
          };
        }
      }

      const updateData: Partial<IMatchComment> = {
        updatedAt: new Date().toISOString(),
      };

      if (data.comment) updateData.comment = data.comment.trim();
      if (data.type) updateData.type = data.type;

      const result = await this.update(commentId, updateData as Partial<Omit<IMatchComment, 'id'>>);

      ApiLogger.success('matchComments', 'updateComment', { commentId });

      return result;
    } catch (error: any) {
      ApiLogger.error('matchComments', 'updateComment', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_COMMENT_ERROR',
          message: error.message || 'Failed to update comment',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('matchComments', 'deleteComment', { commentId, userId });

      // Get comment
      const commentResult = await this.getById(commentId);
      
      if (!commentResult.success || !commentResult.data) {
        return {
          success: false,
          error: commentResult.error || {
            code: 'NOT_FOUND',
            message: 'Comment not found',
            statusCode: 404,
          },
        };
      }

      // Check if user is the comment owner
      if (commentResult.data.playerId !== userId) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'You can only delete your own comments',
            statusCode: 403,
          },
        };
      }

      const result = await this.delete(commentId);

      ApiLogger.success('matchComments', 'deleteComment', { commentId });

      return result;
    } catch (error: any) {
      ApiLogger.error('matchComments', 'deleteComment', error);
      return {
        success: false,
        error: {
          code: 'DELETE_COMMENT_ERROR',
          message: error.message || 'Failed to delete comment',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // MODERATION
  // ============================================

  /**
   * Approve comment
   */
  async approveComment(
    commentId: string,
    approverId: string
  ): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('matchComments', 'approveComment', { commentId, approverId });

      const updateData: Partial<IMatchComment> = {
        isApproved: true,
        approvedBy: approverId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await this.update(commentId, updateData as Partial<Omit<IMatchComment, 'id'>>);

      ApiLogger.success('matchComments', 'approveComment', { commentId });

      return result;
    } catch (error: any) {
      ApiLogger.error('matchComments', 'approveComment', error);
      return {
        success: false,
        error: {
          code: 'APPROVE_COMMENT_ERROR',
          message: error.message || 'Failed to approve comment',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reject/Unapprove comment
   */
  async rejectComment(commentId: string): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('matchComments', 'rejectComment', { commentId });

      const updateData: Partial<IMatchComment> = {
        isApproved: false,
        approvedBy: undefined,
        approvedAt: undefined,
        updatedAt: new Date().toISOString(),
      };

      const result = await this.update(commentId, updateData as Partial<Omit<IMatchComment, 'id'>>);

      ApiLogger.success('matchComments', 'rejectComment', { commentId });

      return result;
    } catch (error: any) {
      ApiLogger.error('matchComments', 'rejectComment', error);
      return {
        success: false,
        error: {
          code: 'REJECT_COMMENT_ERROR',
          message: error.message || 'Failed to reject comment',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Approve all pending comments for a match
   */
  async approveAllPending(matchId: string, approverId: string): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('matchComments', 'approveAllPending', { matchId, approverId });

      const pendingResult = await this.getPendingComments(matchId);
      
      if (!pendingResult.success || !pendingResult.data) {
        return {
          success: false,
          error: pendingResult.error || {
            code: 'GET_PENDING_ERROR',
            message: 'Failed to get pending comments',
            statusCode: 500,
          },
        };
      }

      const pending = pendingResult.data;
      let approvedCount = 0;

      for (const comment of pending) {
        if (comment.id) {
          const result = await this.approveComment(comment.id, approverId);
          if (result.success) approvedCount++;
        }
      }

      ApiLogger.success('matchComments', 'approveAllPending', { 
        matchId, 
        count: approvedCount 
      });

      return {
        success: true,
        data: approvedCount,
      };
    } catch (error: any) {
      ApiLogger.error('matchComments', 'approveAllPending', error);
      return {
        success: false,
        error: {
          code: 'APPROVE_ALL_ERROR',
          message: error.message || 'Failed to approve all comments',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // LIKES MANAGEMENT
  // ============================================

  /**
   * Toggle like on comment
   */
  async toggleLike(commentId: string, playerId: string): Promise<ApiResponse<IMatchComment>> {
    try {
      ApiLogger.log('matchComments', 'toggleLike', { commentId, playerId });

      const commentResult = await this.getById(commentId);
      
      if (!commentResult.success || !commentResult.data) {
        return {
          success: false,
          error: commentResult.error || {
            code: 'NOT_FOUND',
            message: 'Comment not found',
            statusCode: 404,
          },
        };
      }

      const comment = commentResult.data;
      const likes = comment.likes || [];
      const hasLiked = likes.includes(playerId);

      const docRef = doc(db, this.collectionName, commentId);

      if (hasLiked) {
        // Unlike
        await updateDoc(docRef, {
          likes: arrayRemove(playerId),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Like
        await updateDoc(docRef, {
          likes: arrayUnion(playerId),
          updatedAt: new Date().toISOString(),
        });
      }

      const updatedComment = await this.getById(commentId);

      ApiLogger.success('matchComments', 'toggleLike', { commentId, hasLiked: !hasLiked });

      return updatedComment;
    } catch (error: any) {
      ApiLogger.error('matchComments', 'toggleLike', error);
      return {
        success: false,
        error: {
          code: 'TOGGLE_LIKE_ERROR',
          message: error.message || 'Failed to toggle like',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Add like to comment
   */
  async addLike(commentId: string, playerId: string): Promise<ApiResponse<IMatchComment>> {
    try {
      const docRef = doc(db, this.collectionName, commentId);
      
      await updateDoc(docRef, {
        likes: arrayUnion(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(commentId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ADD_LIKE_ERROR',
          message: error.message || 'Failed to add like',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove like from comment
   */
  async removeLike(commentId: string, playerId: string): Promise<ApiResponse<IMatchComment>> {
    try {
      const docRef = doc(db, this.collectionName, commentId);
      
      await updateDoc(docRef, {
        likes: arrayRemove(playerId),
        updatedAt: new Date().toISOString(),
      });

      return this.getById(commentId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'REMOVE_LIKE_ERROR',
          message: error.message || 'Failed to remove like',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if player liked a comment
   */
  async hasLiked(commentId: string, playerId: string): Promise<ApiResponse<boolean>> {
    try {
      const commentResult = await this.getById(commentId);
      
      if (!commentResult.success || !commentResult.data) {
        return {
          success: false,
          error: commentResult.error || {
            code: 'NOT_FOUND',
            message: 'Comment not found',
            statusCode: 404,
          },
        };
      }

      const likes = commentResult.data.likes || [];
      const hasLiked = likes.includes(playerId);

      return {
        success: true,
        data: hasLiked,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_LIKE_ERROR',
          message: error.message || 'Failed to check like status',
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
   * Get comment statistics for a match
   */
  async getMatchCommentStats(matchId: string): Promise<ApiResponse<{
    total: number;
    approved: number;
    pending: number;
    byType: {
      general: number;
      highlight: number;
      improvement: number;
    };
    totalLikes: number;
    mostLikedComment?: IMatchComment;
  }>> {
    try {
      const commentsResult = await this.getByMatch(matchId);
      
      if (!commentsResult.success || !commentsResult.data) {
        return {
          success: false,
          error: commentsResult.error || {
            code: 'GET_COMMENTS_ERROR',
            message: 'Failed to get comments',
            statusCode: 500,
          },
        };
      }

      const comments = commentsResult.data;

      const stats = {
        total: comments.length,
        approved: comments.filter(c => c.isApproved).length,
        pending: comments.filter(c => !c.isApproved).length,
        byType: {
          general: comments.filter(c => c.type === 'general').length,
          highlight: comments.filter(c => c.type === 'highlight').length,
          improvement: comments.filter(c => c.type === 'improvement').length,
        },
        totalLikes: comments.reduce((sum, c) => sum + (c.likes?.length || 0), 0),
        mostLikedComment: comments.length > 0 
          ? comments.reduce((prev, current) => 
              ((current.likes?.length || 0) > (prev.likes?.length || 0)) ? current : prev
            )
          : undefined,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATS_ERROR',
          message: error.message || 'Failed to get comment statistics',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete all comments for a match (admin action)
   */
  async deleteMatchComments(matchId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('matchComments', 'deleteMatchComments', { matchId });

      const commentsResult = await this.getByMatch(matchId);
      
      if (!commentsResult.success || !commentsResult.data) {
        return {
          success: true,
          data: undefined,
        };
      }

      // Delete all comments
      for (const comment of commentsResult.data) {
        if (comment.id) {
          await this.delete(comment.id);
        }
      }

      ApiLogger.success('matchComments', 'deleteMatchComments', { 
        matchId, 
        count: commentsResult.data.length 
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      ApiLogger.error('matchComments', 'deleteMatchComments', error);
      return {
        success: false,
        error: {
          code: 'DELETE_MATCH_COMMENTS_ERROR',
          message: error.message || 'Failed to delete match comments',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const matchCommentAPI = new MatchCommentAPI();