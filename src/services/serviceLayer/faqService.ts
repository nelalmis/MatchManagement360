// ============================================
// services/FAQService.ts - COMPLETE PRODUCTION VERSION
// ============================================
import { faqAPI } from '../../api/apiLayer/faqAPI';
import { ApiResponse } from '../../api/base/BaseAPI';
import { IFAQ } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';

export class FAQService {
  // ============================================
  // 1. QUERY OPERATIONS
  // ============================================

  /**
   * Get all published FAQs
   */
  static async getPublishedFAQs(): Promise<ApiResponse<IFAQ[]>> {
    return faqAPI.getPublished();
  }

  /**
   * Get FAQs by category
   */
  static async getFAQsByCategory(
    category: IFAQ['category']
  ): Promise<ApiResponse<IFAQ[]>> {
    return faqAPI.getByCategory(category);
  }

  /**
   * Get all FAQs (admin - including unpublished)
   */
  static async getAllFAQs(): Promise<ApiResponse<IFAQ[]>> {
    return faqAPI.getAllFAQs();
  }

  /**
   * Get FAQ by ID
   */
  static async getFAQ(faqId: string): Promise<ApiResponse<IFAQ>> {
    return faqAPI.getById(faqId);
  }

  /**
   * Get most viewed FAQs
   */
  static async getMostViewed(limit: number = 10): Promise<ApiResponse<IFAQ[]>> {
    return faqAPI.getMostViewed(limit);
  }

  /**
   * Get most helpful FAQs
   */
  static async getMostHelpful(limit: number = 10): Promise<ApiResponse<IFAQ[]>> {
    return faqAPI.getMostHelpful(limit);
  }

  /**
   * Search FAQs
   */
  static async searchFAQs(searchTerm: string): Promise<ApiResponse<IFAQ[]>> {
    return faqAPI.searchFAQs(searchTerm);
  }

  // ============================================
  // 2. FAQ MANAGEMENT
  // ============================================

  /**
   * Create FAQ
   */
  static async createFAQ(data: {
    question: string;
    answer: string;
    category: IFAQ['category'];
    priority?: number;
    isPublished?: boolean;
    createdBy: string;
  }): Promise<ApiResponse<IFAQ>> {
    try {
      // Validate input
      if (!data.question || data.question.trim().length < 5) {
        return {
          success: false,
          error: {
            code: 'INVALID_QUESTION',
            message: 'Soru en az 5 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      if (!data.answer || data.answer.trim().length < 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_ANSWER',
            message: 'Cevap en az 10 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      if (data.priority !== undefined && (data.priority < 1 || data.priority > 100)) {
        return {
          success: false,
          error: {
            code: 'INVALID_PRIORITY',
            message: 'Öncelik 1-100 arasında olmalı',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FAQService', 'createFAQ', { category: data.category });

      const result = await faqAPI.createFAQ(data);

      if (result.success) {
        ApiLogger.success('FAQService', 'createFAQ', {
          faqId: result.data?.id,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FAQService', 'createFAQ', error);
      return {
        success: false,
        error: {
          code: 'CREATE_FAQ_ERROR',
          message: error.message || 'FAQ oluşturulamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update FAQ
   */
  static async updateFAQ(
    faqId: string,
    data: {
      question?: string;
      answer?: string;
      category?: IFAQ['category'];
      priority?: number;
    }
  ): Promise<ApiResponse<IFAQ>> {
    try {
      // Validate input
      if (data.question && data.question.trim().length < 5) {
        return {
          success: false,
          error: {
            code: 'INVALID_QUESTION',
            message: 'Soru en az 5 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      if (data.answer && data.answer.trim().length < 10) {
        return {
          success: false,
          error: {
            code: 'INVALID_ANSWER',
            message: 'Cevap en az 10 karakter olmalı',
            statusCode: 400,
          },
        };
      }

      if (data.priority !== undefined && (data.priority < 1 || data.priority > 100)) {
        return {
          success: false,
          error: {
            code: 'INVALID_PRIORITY',
            message: 'Öncelik 1-100 arasında olmalı',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FAQService', 'updateFAQ', { faqId });

      const result = await faqAPI.updateFAQ(faqId, data);

      if (result.success) {
        ApiLogger.success('FAQService', 'updateFAQ', { faqId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FAQService', 'updateFAQ', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_FAQ_ERROR',
          message: error.message || 'FAQ güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete FAQ
   */
  static async deleteFAQ(faqId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('FAQService', 'deleteFAQ', { faqId });

      const result = await faqAPI.deleteFAQ(faqId);

      if (result.success) {
        ApiLogger.success('FAQService', 'deleteFAQ', { faqId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FAQService', 'deleteFAQ', error);
      return {
        success: false,
        error: {
          code: 'DELETE_FAQ_ERROR',
          message: error.message || 'FAQ silinemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 3. PUBLISH MANAGEMENT
  // ============================================

  /**
   * Publish FAQ
   */
  static async publishFAQ(faqId: string): Promise<ApiResponse<IFAQ>> {
    try {
      ApiLogger.log('FAQService', 'publishFAQ', { faqId });

      const result = await faqAPI.publishFAQ(faqId);

      if (result.success) {
        ApiLogger.success('FAQService', 'publishFAQ', { faqId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FAQService', 'publishFAQ', error);
      return {
        success: false,
        error: {
          code: 'PUBLISH_FAQ_ERROR',
          message: error.message || 'FAQ yayınlanamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Unpublish FAQ
   */
  static async unpublishFAQ(faqId: string): Promise<ApiResponse<IFAQ>> {
    try {
      ApiLogger.log('FAQService', 'unpublishFAQ', { faqId });

      const result = await faqAPI.unpublishFAQ(faqId);

      if (result.success) {
        ApiLogger.success('FAQService', 'unpublishFAQ', { faqId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FAQService', 'unpublishFAQ', error);
      return {
        success: false,
        error: {
          code: 'UNPUBLISH_FAQ_ERROR',
          message: error.message || 'FAQ yayından kaldırılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Toggle publish status
   */
  static async togglePublish(faqId: string): Promise<ApiResponse<IFAQ>> {
    return faqAPI.togglePublish(faqId);
  }

  // ============================================
  // 4. STATISTICS & FEEDBACK
  // ============================================

  /**
   * Increment view count (when FAQ is viewed)
   */
  static async incrementViews(faqId: string): Promise<ApiResponse<void>> {
    return faqAPI.incrementViews(faqId);
  }

  /**
   * Mark as helpful
   */
  static async markAsHelpful(faqId: string): Promise<ApiResponse<IFAQ>> {
    return faqAPI.markAsHelpful(faqId);
  }

  /**
   * Mark as not helpful
   */
  static async markAsNotHelpful(faqId: string): Promise<ApiResponse<IFAQ>> {
    return faqAPI.markAsNotHelpful(faqId);
  }

  /**
   * Get FAQ statistics
   */
  static async getFAQStatistics(faqId: string): Promise<ApiResponse<{
    views: number;
    helpful: number;
    notHelpful: number;
    helpfulRate: number;
  }>> {
    return faqAPI.getStatistics(faqId);
  }

  /**
   * Get overall FAQ statistics (admin)
   */
  static async getOverallStatistics(): Promise<ApiResponse<{
    totalFAQs: number;
    publishedFAQs: number;
    totalViews: number;
    totalFeedback: number;
    averageHelpfulRate: number;
    byCategory: Record<string, number>;
    topViewed: IFAQ[];
    topHelpful: IFAQ[];
  }>> {
    return faqAPI.getOverallStatistics();
  }

  // ============================================
  // 5. PRIORITY MANAGEMENT
  // ============================================

  /**
   * Update priority
   */
  static async updatePriority(
    faqId: string,
    priority: number
  ): Promise<ApiResponse<IFAQ>> {
    return faqAPI.updatePriority(faqId, priority);
  }

  /**
   * Reorder FAQs (batch priority update)
   */
  static async reorderFAQs(orderedIds: string[]): Promise<ApiResponse<void>> {
    try {
      if (orderedIds.length === 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_ORDER',
            message: 'Sıralama listesi boş olamaz',
            statusCode: 400,
          },
        };
      }

      ApiLogger.log('FAQService', 'reorderFAQs', { count: orderedIds.length });

      const result = await faqAPI.reorderFAQs(orderedIds);

      if (result.success) {
        ApiLogger.success('FAQService', 'reorderFAQs', {
          count: orderedIds.length,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('FAQService', 'reorderFAQs', error);
      return {
        success: false,
        error: {
          code: 'REORDER_ERROR',
          message: error.message || 'Sıralama güncellenemedi',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // 6. GROUPED & ORGANIZED FAQS
  // ============================================

  /**
   * Get FAQs grouped by category
   */
  static async getFAQsGroupedByCategory(): Promise<ApiResponse<
    Record<IFAQ['category'], IFAQ[]>
  >> {
    try {
      const faqsResult = await this.getPublishedFAQs();

      if (!faqsResult.success || !faqsResult.data) {
        return {
          success: false,
          error: faqsResult.error || {
            code: 'GET_FAQS_ERROR',
            message: 'FAQs alınamadı',
            statusCode: 500,
          },
        };
      }

      const grouped: Record<IFAQ['category'], IFAQ[]> = {
        general: [],
        league: [],
        match: [],
        payment: [],
        rating: [],
        account: [],
      };

      for (const faq of faqsResult.data) {
        grouped[faq.category].push(faq);
      }

      return {
        success: true,
        data: grouped,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GROUP_FAQS_ERROR',
          message: error.message || 'FAQs gruplandırılamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get popular FAQs (most viewed + most helpful)
   */
  static async getPopularFAQs(limit: number = 5): Promise<ApiResponse<{
    mostViewed: IFAQ[];
    mostHelpful: IFAQ[];
  }>> {
    try {
      const [viewedResult, helpfulResult] = await Promise.all([
        this.getMostViewed(limit),
        this.getMostHelpful(limit),
      ]);

      if (!viewedResult.success || !helpfulResult.success) {
        return {
          success: false,
          error: {
            code: 'GET_POPULAR_ERROR',
            message: 'Popüler FAQs alınamadı',
            statusCode: 500,
          },
        };
      }

      return {
        success: true,
        data: {
          mostViewed: viewedResult.data || [],
          mostHelpful: helpfulResult.data || [],
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_POPULAR_ERROR',
          message: error.message || 'Popüler FAQs alınamadı',
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
   * Get category display info
   */
  static getCategoryDisplay(category: IFAQ['category']): {
    label: string;
    icon: string;
    color: string;
  } {
    const categoryMap: Record<
      IFAQ['category'],
      { label: string; icon: string; color: string }
    > = {
      general: { label: 'Genel', icon: '❓', color: 'blue' },
      league: { label: 'Lig', icon: '🏆', color: 'gold' },
      match: { label: 'Maç', icon: '⚽', color: 'green' },
      payment: { label: 'Ödeme', icon: '💰', color: 'yellow' },
      rating: { label: 'Puanlama', icon: '⭐', color: 'purple' },
      account: { label: 'Hesap', icon: '👤', color: 'gray' },
    };

    return categoryMap[category];
  }

  /**
   * Format FAQ for display
   */
  static formatFAQ(faq: IFAQ): {
    id?: string;
    question: string;
    answer: string;
    category: ReturnType<typeof FAQService.getCategoryDisplay>;
    priority: number;
    isPublished: boolean;
    views: number;
    helpfulRate: string;
    feedbackCount: number;
  } {
    const totalFeedback = faq.helpful + faq.notHelpful;
    const helpfulRate =
      totalFeedback > 0 ? ((faq.helpful / totalFeedback) * 100).toFixed(1) : '0.0';

    return {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: this.getCategoryDisplay(faq.category),
      priority: faq.priority,
      isPublished: faq.isPublished,
      views: faq.views,
      helpfulRate: `${helpfulRate}%`,
      feedbackCount: totalFeedback,
    };
  }

  /**
   * Get FAQ summary
   */
  static async getFAQSummary(): Promise<ApiResponse<{
    total: number;
    published: number;
    unpublished: number;
    byCategory: Record<string, number>;
    totalViews: number;
    avgHelpfulRate: number;
  }>> {
    try {
      const statsResult = await this.getOverallStatistics();

      if (!statsResult.success || !statsResult.data) {
        return {
          success: false,
          error: statsResult.error || {
            code: 'GET_SUMMARY_ERROR',
            message: 'Özet alınamadı',
            statusCode: 500,
          },
        };
      }

      const stats = statsResult.data;

      return {
        success: true,
        data: {
          total: stats.totalFAQs,
          published: stats.publishedFAQs,
          unpublished: stats.totalFAQs - stats.publishedFAQs,
          byCategory: stats.byCategory,
          totalViews: stats.totalViews,
          avgHelpfulRate: stats.averageHelpfulRate,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_SUMMARY_ERROR',
          message: error.message || 'Özet alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Validate FAQ data
   */
  static validateFAQ(data: {
    question: string;
    answer: string;
    priority?: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.question || data.question.trim().length < 5) {
      errors.push('Soru en az 5 karakter olmalı');
    }

    if (data.question && data.question.length > 500) {
      errors.push('Soru en fazla 500 karakter olabilir');
    }

    if (!data.answer || data.answer.trim().length < 10) {
      errors.push('Cevap en az 10 karakter olmalı');
    }

    if (data.answer && data.answer.length > 5000) {
      errors.push('Cevap en fazla 5000 karakter olabilir');
    }

    if (data.priority !== undefined && (data.priority < 1 || data.priority > 100)) {
      errors.push('Öncelik 1-100 arasında olmalı');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Suggest FAQs based on search term
   */
  static async suggestFAQs(searchTerm: string): Promise<ApiResponse<IFAQ[]>> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        // Return popular FAQs if no search term
        const popularResult = await this.getMostViewed(5);
        return popularResult;
      }

      const searchResult = await this.searchFAQs(searchTerm);

      if (!searchResult.success) {
        return searchResult;
      }

      // Limit suggestions to 5
      return {
        success: true,
        data: (searchResult.data || []).slice(0, 5),
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SUGGEST_ERROR',
          message: error.message || 'Öneri alınamadı',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

export default FAQService;


/* 
// ✅ Get published FAQs grouped by category
const grouped = await FAQService.getFAQsGroupedByCategory();
// Display in accordion: General, League, Match, Payment, etc.

// ✅ Create FAQ (with validation)
const newFAQ = await FAQService.createFAQ({
  question: 'Nasıl maç oluşturabilirim?',
  answer: 'Maç oluşturmak için ana sayfadan "Yeni Maç" butonuna tıklayın...',
  category: 'match',
  priority: 80,
  isPublished: false, // Draft mode
  createdBy: adminId,
});

// ✅ Publish FAQ
await FAQService.publishFAQ(faqId);

// ✅ When user views FAQ, track view
await FAQService.incrementViews(faqId);

// ✅ User feedback
await FAQService.markAsHelpful(faqId);
// or
await FAQService.markAsNotHelpful(faqId);

// ✅ Get FAQ statistics
const stats = await FAQService.getFAQStatistics(faqId);
console.log(`Views: ${stats.data?.views}`);
console.log(`Helpful rate: ${stats.data?.helpfulRate}%`);

// ✅ Search FAQs
const results = await FAQService.searchFAQs('ödeme nasıl');
// Returns FAQs with 'ödeme' or 'nasıl' in question/answer

// ✅ Get popular FAQs for homepage
const popular = await FAQService.getPopularFAQs(5);
console.log('Most viewed:', popular.data?.mostViewed);
console.log('Most helpful:', popular.data?.mostHelpful);

// ✅ Reorder FAQs (drag & drop)
await FAQService.reorderFAQs([faq3Id, faq1Id, faq2Id]);
// Priority: faq3=100, faq1=99, faq2=98

// ✅ Admin dashboard - overall stats
const overall = await FAQService.getOverallStatistics();
console.log(`Total: ${overall.data?.totalFAQs}`);
console.log(`Published: ${overall.data?.publishedFAQs}`);
console.log(`Avg helpful rate: ${overall.data?.averageHelpfulRate}%`);
console.log('By category:', overall.data?.byCategory);

// ✅ Format FAQ for display
const formatted = FAQService.formatFAQ(faq);
console.log(`${formatted.category.icon} ${formatted.category.label}`);
console.log(`Priority: ${formatted.priority}`);
console.log(`Helpful: ${formatted.helpfulRate}`);

// ✅ Validate before create/update
const validation = FAQService.validateFAQ({
  question: 'Test?',
  answer: 'Short',
  priority: 150,
});
if (!validation.valid) {
  console.error('Errors:', validation.errors);
}

// ✅ Smart suggestions (search-as-you-type)
const suggestions = await FAQService.suggestFAQs('ödeme');
// Returns top 5 matching FAQs

// ✅ Get FAQ summary for admin dashboard
const summary = await FAQService.getFAQSummary();
console.log(`Published: ${summary.data?.published}/${summary.data?.total}`);
console.log(`Total views: ${summary.data?.totalViews}`);

*/