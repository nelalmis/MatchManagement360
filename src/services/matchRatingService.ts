// services/matchRatingService.ts

import { matchRatingApi } from '../api/matchRatingApi';
import { matchService } from './matchService';
import { IMatchRating, IResponseBase } from '../types/types';

export const matchRatingService = {
  // ============================================
  // BASIC CRUD OPERATIONS
  // ============================================

  async add(ratingData: Partial<IMatchRating>): Promise<IResponseBase> {
    try {
      const response = await matchRatingApi.add({
        ...ratingData,
        createdAt: new Date().toISOString()
      });
      return response as IResponseBase;
    } catch (err) {
      console.error('add MatchRating hatası:', err);
      return { success: false, id: null };
    }
  },

  async update(id: string, updates: Partial<IMatchRating>): Promise<IResponseBase> {
    try {
      const response = await matchRatingApi.update(id, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      return response as IResponseBase;
    } catch (err) {
      console.error('update MatchRating hatası:', err);
      return { success: false, id: null };
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      const response = await matchRatingApi.delete(id);
      return response.success;
    } catch (err) {
      console.error('delete MatchRating hatası:', err);
      return false;
    }
  },

  async getById(id: string): Promise<IMatchRating | null> {
    try {
      const data: any = await matchRatingApi.getById(id);
      if (!data) return null;
      return this.mapRating(data);
    } catch (err) {
      console.error('getById MatchRating hatası:', err);
      return null;
    }
  },

  // ============================================
  // QUERY METHODS
  // ============================================

  async getRatingsByMatch(matchId: string): Promise<IMatchRating[]> {
    try {
      const ratings = await matchRatingApi.getRatingsByMatch(matchId);
      return ratings.map((r: any) => this.mapRating(r));
    } catch (err) {
      console.error('getRatingsByMatch hatası:', err);
      return [];
    }
  },

  async getRatingsByRater(raterPlayerId: string): Promise<IMatchRating[]> {
    try {
      const ratings = await matchRatingApi.getRatingsByRater(raterPlayerId);
      return ratings.map((r: any) => this.mapRating(r));
    } catch (err) {
      console.error('getRatingsByRater hatası:', err);
      return [];
    }
  },

  async getRatingsByRatedPlayer(ratedPlayerId: string): Promise<IMatchRating[]> {
    try {
      const ratings = await matchRatingApi.getRatingsByRatedPlayer(ratedPlayerId);
      return ratings.map((r: any) => this.mapRating(r));
    } catch (err) {
      console.error('getRatingsByRatedPlayer hatası:', err);
      return [];
    }
  },

  async getByRaterMatch(raterPlayerId: string, matchId: string): Promise<IMatchRating[]> {
    try {
      const ratings = await matchRatingApi.getRatingsByRaterAndMatch(raterPlayerId, matchId);
      return ratings.map((r: any) => this.mapRating(r));
    } catch (error) {
      console.error('Error getting rater ratings:', error);
      return [];
    }
  },

  async countRatersByMatch(matchId: string): Promise<number> {
    try {
      return await matchRatingApi.countUniqueRatersByMatch(matchId);
    } catch (error) {
      console.error('Error counting raters:', error);
      return 0;
    }
  },

  async getRatingsByLeague(leagueId: string): Promise<IMatchRating[]> {
    try {
      const ratings = await matchRatingApi.getRatingsByLeague(leagueId);
      return ratings.map((r: any) => this.mapRating(r));
    } catch (err) {
      console.error('getRatingsByLeague hatası:', err);
      return [];
    }
  },

  async getRatingsBySeason(leagueId: string, seasonId: string): Promise<IMatchRating[]> {
    try {
      const ratings = await matchRatingApi.getRatingsBySeason(leagueId, seasonId);
      return ratings.map((r: any) => this.mapRating(r));
    } catch (err) {
      console.error('getRatingsBySeason hatası:', err);
      return [];
    }
  },

  async getRatingsByPlayerLeagueSeason(
    playerId: string,
    leagueId: string,
    seasonId: string
  ): Promise<IMatchRating[]> {
    try {
      const ratings = await matchRatingApi.getRatingsByPlayerLeagueSeason(
        playerId,
        leagueId,
        seasonId
      );
      return ratings.map((r: any) => this.mapRating(r));
    } catch (err) {
      console.error('getRatingsByPlayerLeagueSeason hatası:', err);
      return [];
    }
  },

  // ============================================
  // RATING CALCULATIONS
  // ============================================

  async getPlayerAverageInMatch(playerId: string, matchId: string): Promise<number> {
    try {
      return await matchRatingApi.getPlayerAverageInMatch(playerId, matchId);
    } catch (err) {
      console.error('getPlayerAverageInMatch hatası:', err);
      return 0;
    }
  },

  async recalculateMatchMVP(matchId: string): Promise<boolean> {
    try {
      const mvpId = await matchRatingApi.calculateMatchMVP(matchId);
      
      if (!mvpId) return false;

      // Update match with MVP
      await matchService.update(matchId, {
        playerIdOfMatchMVP: mvpId,
        mvpCalculatedAt: new Date().toISOString(),
        mvpAutoCalculated: true
      });
      
      return true;
    } catch (error) {
      console.error('Error recalculating MVP:', error);
      return false;
    }
  },

  async calculateMatchRatingSummary(matchId: string) {
    try {
      return await matchRatingApi.getMatchRatingSummary(matchId);
    } catch (err) {
      console.error('calculateMatchRatingSummary hatası:', err);
      return {
        totalRatings: 0,
        averageRating: 0,
        uniqueRaters: 0,
        topRatedPlayers: []
      };
    }
  },

  // ============================================
  // VALIDATION
  // ============================================

  async hasRated(raterPlayerId: string, ratedPlayerId: string, matchId: string): Promise<boolean> {
    try {
      const rating = await matchRatingApi.getRatingByMatchRaterAndPlayer(
        matchId,
        raterPlayerId,
        ratedPlayerId
      );
      return rating !== null;
    } catch (err) {
      console.error('hasRated hatası:', err);
      return false;
    }
  },

  validateRating(raterPlayerId: string, ratedPlayerId: string): boolean {
    // Oyuncu kendini puanlayamaz
    return raterPlayerId !== ratedPlayerId;
  },

  // ============================================
  // HELPER METHODS
  // ============================================

  mapRating(data: any): IMatchRating {
    return {
      id: data.id,
      matchId: data.matchId,
      raterId: data.raterId,
      ratedPlayerId: data.ratedPlayerId,
      rating: data.rating || 0,
      categories: data.categories,
      comment: data.comment,
      isAnonymous: data.isAnonymous || false,
      leagueId: data.leagueId,
      seasonId: data.seasonId,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt
    };
  }
};