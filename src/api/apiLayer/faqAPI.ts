// ============================================
// api/faqApi.ts
// ============================================
import { BaseAPI, ApiResponse } from '../base/BaseAPI';
import { IFAQ } from '../../types/entity/types';
import { ApiLogger } from '../base/ApiLogger';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class FAQAPI extends BaseAPI<IFAQ> {
  constructor() {
    super('faqs');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get all published FAQs
   */
  async getPublished(): Promise<ApiResponse<IFAQ[]>> {
    return this.getAll({
      where: [{ field: 'isPublished', operator: '==', value: true }],
      orderBy: [{ field: 'priority', direction: 'desc' }],
    });
  }

  /**
   * Get FAQs by category
   */
  async getByCategory(category: IFAQ['category']): Promise<ApiResponse<IFAQ[]>> {
    return this.getAll({
      where: [
        { field: 'category', operator: '==', value: category },
        { field: 'isPublished', operator: '==', value: true },
      ],
      orderBy: [{ field: 'priority', direction: 'desc' }],
    });
  }

  /**
   * Get all FAQs (admin - including unpublished)
   */
  async getAllFAQs(): Promise<ApiResponse<IFAQ[]>> {
    return this.getAll({
      orderBy: [{ field: 'priority', direction: 'desc' }],
    });
  }

  /**
   * Get most viewed FAQs
   */
  async getMostViewed(limit: number = 10): Promise<ApiResponse<IFAQ[]>> {
    return this.getAll({
      where: [{ field: 'isPublished', operator: '==', value: true }],
      orderBy: [{ field: 'views', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Get most helpful FAQs
   */
  async getMostHelpful(limit: number = 10): Promise<ApiResponse<IFAQ[]>> {
    return this.getAll({
      where: [{ field: 'isPublished', operator: '==', value: true }],
      orderBy: [{ field: 'helpful', direction: 'desc' }],
      limit,
    });
  }

  /**
   * Search FAQs
   */
  async searchFAQs(searchTerm: string): Promise<ApiResponse<IFAQ[]>> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return {
          success: false,
          error: {
            code: 'INVALID_SEARCH',
            message: 'Arama için en az 2 karakter gerekli',
            statusCode: 400,
          },
        };
      }

      const allFAQsResult = await this.getPublished();

      if (!allFAQsResult.success || !allFAQsResult.data) {
        return allFAQsResult;
      }

      const normalizedSearch = searchTerm.toLowerCase().trim();

      // Search in question and answer
      const filtered = allFAQsResult.data.filter((faq) => {
        const question = faq.question.toLowerCase();
        const answer = faq.answer.toLowerCase();
        return question.includes(normalizedSearch) || answer.includes(normalizedSearch);
      });

      return {
        success: true,
        data: filtered,
      };
    } catch (error: any) {
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

  // ============================================
  // FAQ CREATION & MANAGEMENT
  // ============================================

  /**
   * Create FAQ
   */
  async createFAQ(data: {
    question: string;
    answer: string;
    category: IFAQ['category'];
    priority?: number;
    isPublished?: boolean;
    createdBy: string;
  }): Promise<ApiResponse<IFAQ>> {
    try {
      ApiLogger.log('faqs', 'createFAQ', { category: data.category });

      const faqData: Omit<IFAQ, 'id'> = {
        question: data.question.trim(),
        answer: data.answer.trim(),
        category: data.category,
        priority: data.priority || 50,
        isPublished: data.isPublished ?? false,
        views: 0,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date().toISOString(),
        createdBy: data.createdBy,
      };

      const result = await this.create(faqData);

      if (result.success) {
        ApiLogger.success('faqs', 'createFAQ', { faqId: result.data?.id });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('faqs', 'createFAQ', error);
      return {
        success: false,
        error: {
          code: 'CREATE_FAQ_ERROR',
          message: error.message || 'FAQ oluşturulurken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update FAQ
   */
  async updateFAQ(
    faqId: string,
    data: {
      question?: string;
      answer?: string;
      category?: IFAQ['category'];
      priority?: number;
    }
  ): Promise<ApiResponse<IFAQ>> {
    try {
      ApiLogger.log('faqs', 'updateFAQ', { faqId });

      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (data.question) updateData.question = data.question.trim();
      if (data.answer) updateData.answer = data.answer.trim();
      if (data.category) updateData.category = data.category;
      if (data.priority !== undefined) updateData.priority = data.priority;

      const result = await this.update(faqId, updateData as Partial<Omit<IFAQ, 'id'>>);

      if (result.success) {
        ApiLogger.success('faqs', 'updateFAQ', { faqId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('faqs', 'updateFAQ', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FAQ_ERROR',
          message: error.message || 'FAQ güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete FAQ
   */
  async deleteFAQ(faqId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('faqs', 'deleteFAQ', { faqId });

      const result = await this.delete(faqId);

      if (result.success) {
        ApiLogger.success('faqs', 'deleteFAQ', { faqId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('faqs', 'deleteFAQ', error);
      return {
        success: false,
        error: {
          code: 'DELETE_FAQ_ERROR',
          message: error.message || 'FAQ silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // PUBLISH/UNPUBLISH
  // ============================================

  /**
   * Publish FAQ
   */
  async publishFAQ(faqId: string): Promise<ApiResponse<IFAQ>> {
    try {
      ApiLogger.log('faqs', 'publishFAQ', { faqId });

      const result = await this.update(faqId, {
        isPublished: true,
        updatedAt: new Date().toISOString(),
      } as Partial<Omit<IFAQ, 'id'>>);

      if (result.success) {
        ApiLogger.success('faqs', 'publishFAQ', { faqId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('faqs', 'publishFAQ', error);
      return {
        success: false,
        error: {
          code: 'PUBLISH_FAQ_ERROR',
          message: error.message || 'FAQ yayınlanırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Unpublish FAQ
   */
  async unpublishFAQ(faqId: string): Promise<ApiResponse<IFAQ>> {
    try {
      ApiLogger.log('faqs', 'unpublishFAQ', { faqId });

      const result = await this.update(faqId, {
        isPublished: false,
        updatedAt: new Date().toISOString(),
      } as Partial<Omit<IFAQ, 'id'>>);

      if (result.success) {
        ApiLogger.success('faqs', 'unpublishFAQ', { faqId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('faqs', 'unpublishFAQ', error);
      return {
        success: false,
        error: {
          code: 'UNPUBLISH_FAQ_ERROR',
          message: error.message || 'FAQ yayından kaldırılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Toggle publish status
   */
  async togglePublish(faqId: string): Promise<ApiResponse<IFAQ>> {
    try {
      const faqResult = await this.getById(faqId);

      if (!faqResult.success || !faqResult.data) {
        return {
          success: false,
          error: faqResult.error || {
            code: 'NOT_FOUND',
            message: 'FAQ bulunamadı',
            statusCode: 404,
          },
        };
      }

      const newStatus = !faqResult.data.isPublished;

      return newStatus ? this.publishFAQ(faqId) : this.unpublishFAQ(faqId);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TOGGLE_PUBLISH_ERROR',
          message: error.message || 'Yayın durumu değiştirilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATISTICS & FEEDBACK
  // ============================================

  /**
   * Increment view count
   */
  async incrementViews(faqId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, this.collectionName, faqId);

      await updateDoc(docRef, {
        views: increment(1),
      });

      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INCREMENT_VIEWS_ERROR',
          message: error.message || 'Görüntülenme sayısı artırılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Mark as helpful
   */
  async markAsHelpful(faqId: string): Promise<ApiResponse<IFAQ>> {
    try {
      ApiLogger.log('faqs', 'markAsHelpful', { faqId });

      const docRef = doc(db, this.collectionName, faqId);

      await updateDoc(docRef, {
        helpful: increment(1),
      });

      const result = await this.getById(faqId);

      ApiLogger.success('faqs', 'markAsHelpful', { faqId });

      return result;
    } catch (error: any) {
      ApiLogger.error('faqs', 'markAsHelpful', error);
      return {
        success: false,
        error: {
          code: 'MARK_HELPFUL_ERROR',
          message: error.message || 'Faydalı işaretlenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Mark as not helpful
   */
  async markAsNotHelpful(faqId: string): Promise<ApiResponse<IFAQ>> {
    try {
      ApiLogger.log('faqs', 'markAsNotHelpful', { faqId });

      const docRef = doc(db, this.collectionName, faqId);

      await updateDoc(docRef, {
        notHelpful: increment(1),
      });

      const result = await this.getById(faqId);

      ApiLogger.success('faqs', 'markAsNotHelpful', { faqId });

      return result;
    } catch (error: any) {
      ApiLogger.error('faqs', 'markAsNotHelpful', error);
      return {
        success: false,
        error: {
          code: 'MARK_NOT_HELPFUL_ERROR',
          message: error.message || 'Faydalı değil işaretlenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get FAQ statistics
   */
  async getStatistics(faqId: string): Promise<ApiResponse<{
    views: number;
    helpful: number;
    notHelpful: number;
    helpfulRate: number;
  }>> {
    try {
      const faqResult = await this.getById(faqId);

      if (!faqResult.success || !faqResult.data) {
        return {
          success: false,
          error: faqResult.error || {
            code: 'NOT_FOUND',
            message: 'FAQ bulunamadı',
            statusCode: 404,
          },
        };
      }

      const faq = faqResult.data;
      const totalFeedback = faq.helpful + faq.notHelpful;
      const helpfulRate = totalFeedback > 0 ? (faq.helpful / totalFeedback) * 100 : 0;

      return {
        success: true,
        data: {
          views: faq.views,
          helpful: faq.helpful,
          notHelpful: faq.notHelpful,
          helpfulRate,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATISTICS_ERROR',
          message: error.message || 'İstatistikler alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get overall FAQ statistics (admin)
   */
  async getOverallStatistics(): Promise<ApiResponse<{
    totalFAQs: number;
    publishedFAQs: number;
    totalViews: number;
    totalFeedback: number;
    averageHelpfulRate: number;
    byCategory: Record<string, number>;
    topViewed: IFAQ[];
    topHelpful: IFAQ[];
  }>> {
    try {
      const allFAQsResult = await this.getAllFAQs();

      if (!allFAQsResult.success || !allFAQsResult.data) {
        return {
          success: false,
          error: allFAQsResult.error || {
            code: 'GET_FAQS_ERROR',
            message: 'FAQs alınırken hata oluştu',
            statusCode: 500,
          },
        };
      }

      const faqs = allFAQsResult.data;

      const byCategory: Record<string, number> = {};
      let totalViews = 0;
      let totalHelpful = 0;
      let totalFeedback = 0;

      for (const faq of faqs) {
        // By category
        if (!byCategory[faq.category]) {
          byCategory[faq.category] = 0;
        }
        byCategory[faq.category]++;

        // Views and feedback
        totalViews += faq.views;
        totalHelpful += faq.helpful;
        totalFeedback += faq.helpful + faq.notHelpful;
      }

      const averageHelpfulRate = totalFeedback > 0 ? (totalHelpful / totalFeedback) * 100 : 0;

      // Top viewed
      const topViewed = [...faqs]
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Top helpful
      const topHelpful = [...faqs]
        .sort((a, b) => b.helpful - a.helpful)
        .slice(0, 5);

      return {
        success: true,
        data: {
          totalFAQs: faqs.length,
          publishedFAQs: faqs.filter((f) => f.isPublished).length,
          totalViews,
          totalFeedback,
          averageHelpfulRate,
          byCategory,
          topViewed,
          topHelpful,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_OVERALL_STATS_ERROR',
          message: error.message || 'Genel istatistikler alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // PRIORITY MANAGEMENT
  // ============================================

  /**
   * Update priority
   */
  async updatePriority(faqId: string, priority: number): Promise<ApiResponse<IFAQ>> {
    try {
      if (priority < 1 || priority > 100) {
        return {
          success: false,
          error: {
            code: 'INVALID_PRIORITY',
            message: 'Öncelik 1-100 arasında olmalı',
            statusCode: 400,
          },
        };
      }

      return this.update(faqId, {
        priority,
        updatedAt: new Date().toISOString(),
      } as Partial<Omit<IFAQ, 'id'>>);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UPDATE_PRIORITY_ERROR',
          message: error.message || 'Öncelik güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Reorder FAQs (batch priority update)
   */
  async reorderFAQs(orderedIds: string[]): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('faqs', 'reorderFAQs', { count: orderedIds.length });

      for (let i = 0; i < orderedIds.length; i++) {
        const priority = 100 - i; // Higher index = lower priority
        await this.updatePriority(orderedIds[i], priority);
      }

      ApiLogger.success('faqs', 'reorderFAQs', { count: orderedIds.length });

      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      ApiLogger.error('faqs', 'reorderFAQs', error);
      return {
        success: false,
        error: {
          code: 'REORDER_ERROR',
          message: error.message || 'Sıralama güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const faqAPI = new FAQAPI();