// services/matchCommentService.ts

import { matchCommentApi } from "../api/matchCommentApi";
import { matchApi } from "../api/matchApi";
import {
    IMatchComment,
    IResponseBase
} from "../types/types";

export const matchCommentService = {
    // ============================================
    // BASIC CRUD OPERATIONS
    // ============================================

    async add(commentData: IMatchComment): Promise<IResponseBase> {
        try {
            const response = await matchCommentApi.add({
                ...commentData,
                id: undefined,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isApproved: false, // Default: needs approval
                likes: commentData.likes || []
            });
            return response as IResponseBase;
        } catch (err) {
            console.error("add MatchComment hatası:", err);
            return { success: false, id: null };
        }
    },

    async update(id: string, updates: Partial<IMatchComment>): Promise<IResponseBase> {
        try {
            const response = await matchCommentApi.update(id, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            return response as IResponseBase;
        } catch (err) {
            console.error("update MatchComment hatası:", err);
            return { success: false, id: null };
        }
    },

    async delete(id: string): Promise<boolean> {
        try {
            const response = await matchCommentApi.delete(id);
            return response.success;
        } catch (err) {
            console.error("delete MatchComment hatası:", err);
            return false;
        }
    },

    async getById(id: string): Promise<IMatchComment | null> {
        try {
            const data: any = await matchCommentApi.getById(id);
            if (!data) return null;
            return this.mapComment(data);
        } catch (err) {
            console.error("getById MatchComment hatası:", err);
            return null;
        }
    },

    // ============================================
    // COMMENT SUBMISSION
    // ============================================

    async submitComment(
        matchId: string,
        playerId: string,
        comment: string,
        type: 'general' | 'highlight' | 'improvement'
    ): Promise<IResponseBase> {
        try {
            const commentData: IMatchComment = {
                id: null,
                matchId,
                playerId,
                comment: comment.trim(),
                type,
                isApproved: false,
                likes: [],
                createdAt: new Date().toISOString()
            };

            const result = await this.add(commentData);
            
            // Update match total comments count
            if (result.success) {
                await this.updateMatchCommentCount(matchId);
            }

            return result;
        } catch (err) {
            console.error("submitComment hatası:", err);
            return { success: false, id: null };
        }
    },

    // ============================================
    // GET COMMENTS
    // ============================================

    async getCommentsByMatch(matchId: string): Promise<IMatchComment[]> {
        try {
            const comments = await matchCommentApi.getCommentsByMatch(matchId);
            return comments.map(c => this.mapComment(c));
        } catch (err) {
            console.error("getCommentsByMatch hatası:", err);
            return [];
        }
    },

    async getApprovedCommentsByMatch(matchId: string): Promise<IMatchComment[]> {
        try {
            const comments = await matchCommentApi.getApprovedCommentsByMatch(matchId);
            return comments.map(c => this.mapComment(c));
        } catch (err) {
            console.error("getApprovedCommentsByMatch hatası:", err);
            return [];
        }
    },

    async getPendingCommentsByMatch(matchId: string): Promise<IMatchComment[]> {
        try {
            const comments = await matchCommentApi.getPendingCommentsByMatch(matchId);
            return comments.map(c => this.mapComment(c));
        } catch (err) {
            console.error("getPendingCommentsByMatch hatası:", err);
            return [];
        }
    },

    async getCommentsByPlayer(playerId: string): Promise<IMatchComment[]> {
        try {
            const comments = await matchCommentApi.getCommentsByPlayer(playerId);
            return comments.map(c => this.mapComment(c));
        } catch (err) {
            console.error("getCommentsByPlayer hatası:", err);
            return [];
        }
    },

    async getCommentsByType(
        matchId: string,
        type: 'general' | 'highlight' | 'improvement'
    ): Promise<IMatchComment[]> {
        try {
            const comments = await matchCommentApi.getCommentsByType(matchId, type);
            return comments.map(c => this.mapComment(c));
        } catch (err) {
            console.error("getCommentsByType hatası:", err);
            return [];
        }
    },

    // ============================================
    // COMMENT MODERATION (Organizer)
    // ============================================

    async approveComment(
        commentId: string,
        approverId: string
    ): Promise<boolean> {
        try {
            await this.update(commentId, {
                isApproved: true,
                approvedBy: approverId
            });
            return true;
        } catch (err) {
            console.error("approveComment hatası:", err);
            return false;
        }
    },

    async rejectComment(commentId: string): Promise<boolean> {
        try {
            // Option 1: Delete the comment
            return await this.delete(commentId);
            
            // Option 2: Mark as rejected (if you want to keep history)
            // await this.update(commentId, { isApproved: false });
            // return true;
        } catch (err) {
            console.error("rejectComment hatası:", err);
            return false;
        }
    },

    async approveAllComments(
        matchId: string,
        approverId: string
    ): Promise<{ success: number; failed: number }> {
        try {
            const pendingComments = await this.getPendingCommentsByMatch(matchId);
            
            let success = 0;
            let failed = 0;

            for (const comment of pendingComments) {
                const commentId = (comment as any).id;
                const result = await this.approveComment(commentId, approverId);
                if (result) {
                    success++;
                } else {
                    failed++;
                }
            }

            return { success, failed };
        } catch (err) {
            console.error("approveAllComments hatası:", err);
            return { success: 0, failed: 0 };
        }
    },

    // ============================================
    // LIKE SYSTEM
    // ============================================

    async likeComment(commentId: string, playerId: string): Promise<boolean> {
        try {
            const comment = await this.getById(commentId);
            if (!comment) return false;

            const likes = comment.likes || [];
            
            // Check if already liked
            if (likes.includes(playerId)) {
                return false; // Already liked
            }

            // Add like
            likes.push(playerId);
            await this.update(commentId, { likes });
            
            return true;
        } catch (err) {
            console.error("likeComment hatası:", err);
            return false;
        }
    },

    async unlikeComment(commentId: string, playerId: string): Promise<boolean> {
        try {
            const comment = await this.getById(commentId);
            if (!comment) return false;

            const likes = (comment.likes || []).filter(id => id !== playerId);
            await this.update(commentId, { likes });
            
            return true;
        } catch (err) {
            console.error("unlikeComment hatası:", err);
            return false;
        }
    },

    async toggleLike(commentId: string, playerId: string): Promise<boolean> {
        try {
            const comment = await this.getById(commentId);
            if (!comment) return false;

            const likes = comment.likes || [];
            
            if (likes.includes(playerId)) {
                // Unlike
                return await this.unlikeComment(commentId, playerId);
            } else {
                // Like
                return await this.likeComment(commentId, playerId);
            }
        } catch (err) {
            console.error("toggleLike hatası:", err);
            return false;
        }
    },

    async getLikeCount(commentId: string): Promise<number> {
        try {
            const comment = await this.getById(commentId);
            if (!comment) return 0;
            return (comment.likes || []).length;
        } catch (err) {
            console.error("getLikeCount hatası:", err);
            return 0;
        }
    },

    async hasPlayerLiked(commentId: string, playerId: string): Promise<boolean> {
        try {
            const comment = await this.getById(commentId);
            if (!comment) return false;
            return (comment.likes || []).includes(playerId);
        } catch (err) {
            console.error("hasPlayerLiked hatası:", err);
            return false;
        }
    },

    // ============================================
    // COMMENT STATISTICS
    // ============================================

    async getCommentStatsByMatch(matchId: string) {
        try {
            const allComments = await this.getCommentsByMatch(matchId);
            const approvedComments = allComments.filter(c => c.isApproved);
            const pendingComments = allComments.filter(c => !c.isApproved);

            // Count by type
            const highlightComments = approvedComments.filter(c => c.type === 'highlight');
            const improvementComments = approvedComments.filter(c => c.type === 'improvement');
            const generalComments = approvedComments.filter(c => c.type === 'general');

            // Calculate total likes
            const totalLikes = approvedComments.reduce((sum, c) => sum + (c.likes?.length || 0), 0);

            // Get most liked comment
            const mostLiked = approvedComments.length > 0
                ? approvedComments.reduce((prev, current) => 
                    ((current.likes?.length || 0) > (prev.likes?.length || 0)) ? current : prev
                  )
                : null;

            return {
                total: allComments.length,
                approved: approvedComments.length,
                pending: pendingComments.length,
                byType: {
                    highlight: highlightComments.length,
                    improvement: improvementComments.length,
                    general: generalComments.length
                },
                totalLikes,
                mostLikedComment: mostLiked ? {
                    id: (mostLiked as any).id,
                    comment: mostLiked.comment.substring(0, 50) + '...',
                    likes: mostLiked.likes?.length || 0
                } : null
            };
        } catch (err) {
            console.error("getCommentStatsByMatch hatası:", err);
            return {
                total: 0,
                approved: 0,
                pending: 0,
                byType: { highlight: 0, improvement: 0, general: 0 },
                totalLikes: 0,
                mostLikedComment: null
            };
        }
    },

    async getPlayerCommentStats(playerId: string) {
        try {
            const comments = await this.getCommentsByPlayer(playerId);
            const approvedComments = comments.filter(c => c.isApproved);

            const totalLikesReceived = approvedComments.reduce(
                (sum, c) => sum + (c.likes?.length || 0), 
                0
            );

            return {
                totalComments: comments.length,
                approvedComments: approvedComments.length,
                pendingComments: comments.length - approvedComments.length,
                totalLikesReceived,
                averageLikesPerComment: approvedComments.length > 0 
                    ? (totalLikesReceived / approvedComments.length).toFixed(1)
                    : 0
            };
        } catch (err) {
            console.error("getPlayerCommentStats hatası:", err);
            return {
                totalComments: 0,
                approvedComments: 0,
                pendingComments: 0,
                totalLikesReceived: 0,
                averageLikesPerComment: 0
            };
        }
    },

    // ============================================
    // MATCH INTEGRATION
    // ============================================

    async updateMatchCommentCount(matchId: string): Promise<boolean> {
        try {
            const comments = await this.getApprovedCommentsByMatch(matchId);
            
            await matchApi.update(matchId, {
                totalComments: comments.length
            });

            return true;
        } catch (err) {
            console.error("updateMatchCommentCount hatası:", err);
            return false;
        }
    },

    async enableCommentsForMatch(matchId: string): Promise<boolean> {
        try {
            await matchApi.update(matchId, {
                commentsEnabled: true
            });
            return true;
        } catch (err) {
            console.error("enableCommentsForMatch hatası:", err);
            return false;
        }
    },

    async disableCommentsForMatch(matchId: string): Promise<boolean> {
        try {
            await matchApi.update(matchId, {
                commentsEnabled: false
            });
            return true;
        } catch (err) {
            console.error("disableCommentsForMatch hatası:", err);
            return false;
        }
    },

    // ============================================
    // COMMENT VALIDATION
    // ============================================

    async canPlayerComment(matchId: string, playerId: string): Promise<boolean> {
        try {
            // Get match data
            const matchData: any = await matchApi.getById(matchId);
            if (!matchData) return false;

            // Check if comments are enabled
            if (!matchData.commentsEnabled) return false;

            // Check if match is completed
            if (matchData.status !== 'Tamamlandı') return false;

            // Check if player participated
            const team1 = matchData.team1PlayerIds || [];
            const team2 = matchData.team2PlayerIds || [];
            const participated = team1.includes(playerId) || team2.includes(playerId);

            return participated;
        } catch (err) {
            console.error("canPlayerComment hatası:", err);
            return false;
        }
    },

    validateComment(comment: string): { valid: boolean; error?: string } {
        const trimmedComment = comment.trim();

        if (!trimmedComment) {
            return { valid: false, error: 'Yorum boş olamaz' };
        }

        if (trimmedComment.length < 10) {
            return { valid: false, error: 'Yorum en az 10 karakter olmalıdır' };
        }

        if (trimmedComment.length > 500) {
            return { valid: false, error: 'Yorum en fazla 500 karakter olabilir' };
        }

        // Check for inappropriate content (basic)
        const inappropriateWords = ['spam', 'test123']; // Add more as needed
        const hasInappropriate = inappropriateWords.some(word => 
            trimmedComment.toLowerCase().includes(word)
        );

        if (hasInappropriate) {
            return { valid: false, error: 'Yorum uygunsuz içerik içeriyor' };
        }

        return { valid: true };
    },

    // ============================================
    // HELPER METHODS
    // ============================================

    mapComment(data: any): IMatchComment {
        return {
            id: data.id,
            matchId: data.matchId,
            playerId: data.playerId,
            comment: data.comment,
            type: data.type,
            isApproved: data.isApproved ?? false,
            approvedBy: data.approvedBy,
            likes: data.likes || [],
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        };
    }
};