import { playerStatsApi } from "../api/playerStatsApi";
import { IResponseBase } from "../types/base/baseTypes";
import { IPlayerStats, IMatch, MatchType, calculatePoints } from "../types/types";

export const playerStatsService = {
  async add(statsData: IPlayerStats): Promise<IResponseBase> {
    const response = await playerStatsApi.add({
      ...statsData,
      id: undefined,
      createdAt: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async update(id: string, updates: Partial<IPlayerStats>): Promise<IResponseBase> {
    const response = await playerStatsApi.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async delete(id: string): Promise<boolean> {
    const response = await playerStatsApi.delete(id);
    return response.success;
  },

  async getById(id: string): Promise<IPlayerStats | null> {
    try {
      const data: any = await playerStatsApi.getById(id);
      if (!data) return null;
      
      return this.mapPlayerStats(data);
    } catch (err) {
      console.error("getById PlayerStats hatası:", err);
      return null;
    }
  },

  async getAll(): Promise<IPlayerStats[]> {
    try {
      const stats: any[] = await playerStatsApi.getAll();
      return stats.map(this.mapPlayerStats);
    } catch (err) {
      console.error("getAll PlayerStats hatası:", err);
      return [];
    }
  },

  async getStatsByPlayer(playerId: string): Promise<IPlayerStats[]> {
    try {
      const stats: any[] = await playerStatsApi.getStatsByPlayer(playerId);
      return stats.map(this.mapPlayerStats);
    } catch (err) {
      console.error("getStatsByPlayer hatası:", err);
      return [];
    }
  },

  async getStatsByLeague(leagueId: string): Promise<IPlayerStats[]> {
    try {
      const stats: any[] = await playerStatsApi.getStatsByLeague(leagueId);
      return stats.map(this.mapPlayerStats);
    } catch (err) {
      console.error("getStatsByLeague hatası:", err);
      return [];
    }
  },

  async getStatsByLeagueAndSeason(leagueId: string, seasonId: string): Promise<IPlayerStats[]> {
    try {
      const stats: any[] = await playerStatsApi.getStatsByLeagueAndSeason(leagueId, seasonId);
      return stats.map(this.mapPlayerStats);
    } catch (err) {
      console.error("getStatsByLeagueAndSeason hatası:", err);
      return [];
    }
  },

  async getStatsByPlayerLeagueSeason(
    playerId: string, 
    leagueId: string, 
    seasonId: string
  ): Promise<IPlayerStats | null> {
    try {
      const data: any = await playerStatsApi.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (!data) return null;
      
      return this.mapPlayerStats(data);
    } catch (err) {
      console.error("getStatsByPlayerLeagueSeason hatası:", err);
      return null;
    }
  },

  async getTopScorers(leagueId: string, seasonId: string, limit: number = 10): Promise<IPlayerStats[]> {
    try {
      const stats: any[] = await playerStatsApi.getTopScorers(leagueId, seasonId, limit);
      return stats.map(this.mapPlayerStats);
    } catch (err) {
      console.error("getTopScorers hatası:", err);
      return [];
    }
  },

  async getTopAssists(leagueId: string, seasonId: string, limit: number = 10): Promise<IPlayerStats[]> {
    try {
      const stats: any[] = await playerStatsApi.getTopAssists(leagueId, seasonId, limit);
      return stats.map(this.mapPlayerStats);
    } catch (err) {
      console.error("getTopAssists hatası:", err);
      return [];
    }
  },

  // ============================================
  // INITIALIZATION & BASIC OPERATIONS
  // ============================================

  /**
   * Initialize player stats with friendly match support
   */
  async initializePlayerStats(
    playerId: string, 
    leagueId: string, 
    seasonId: string
  ): Promise<IResponseBase | null> {
    try {
      const existing = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (existing) {
        return { success: true, id: existing.playerId };
      }

      const statsData: IPlayerStats = {
        playerId,
        leagueId,
        seasonId,
        // All matches (combined)
        allMatches: {
          total: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0
        },
        // League matches only
        leagueMatches: {
          total: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          points: 0
        },
        // Friendly matches only
        friendlyMatches: {
          total: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0
        },
        // Legacy fields
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalGoals: 0,
        totalAssists: 0,
        points: 0,
        // Rating
        rating: 0,
        totalRatingsReceived: 0,
        ratingHistory: [],
        mvpCount: 0,
        mvpRate: 0,
        // Other
        attendanceRate: 0,
        averageGoalsPerMatch: 0,
        averageAssistsPerMatch: 0
      };

      return await this.add(statsData);
    } catch (err) {
      console.error("initializePlayerStats hatası:", err);
      return null;
    }
  },

  /**
   * Update stats from match (supports League and Friendly)
   */
  async updateStatsFromMatch(
    playerId: string, 
    leagueId: string, 
    seasonId: string, 
    match: IMatch
  ): Promise<boolean> {
    try {
      let stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (!stats) {
        await this.initializePlayerStats(playerId, leagueId, seasonId);
        stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
        if (!stats) return false;
      }

      const isInTeam1 = match.team1PlayerIds?.includes(playerId);
      const isInTeam2 = match.team2PlayerIds?.includes(playerId);
      if (!isInTeam1 && !isInTeam2) return false;

      const team1Score = match.team1Score || 0;
      const team2Score = match.team2Score || 0;

      // Determine match result
      let won = 0, drawn = 0, lost = 0;
      
      if (isInTeam1) {
        if (team1Score > team2Score) won = 1;
        else if (team1Score === team2Score) drawn = 1;
        else lost = 1;
      } else {
        if (team2Score > team1Score) won = 1;
        else if (team1Score === team2Score) drawn = 1;
        else lost = 1;
      }

      // Get player's goals and assists
      const playerGoals = match.goalScorers.find(g => g.playerId === playerId);
      const goals = playerGoals?.goals || 0;
      const assists = playerGoals?.assists || 0;

      const updatedStats: any = { ...stats };

      // Initialize if needed
      if (!updatedStats.allMatches) {
        updatedStats.allMatches = { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0 };
      }
      if (!updatedStats.leagueMatches) {
        updatedStats.leagueMatches = { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, points: 0 };
      }
      if (!updatedStats.friendlyMatches) {
        updatedStats.friendlyMatches = { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0 };
      }

      const isFriendlyMatch = match.type === MatchType.FRIENDLY;
      const affectsLeagueStats = !isFriendlyMatch || match.affectsStandings === true;

      // Update friendly stats
      if (isFriendlyMatch) {
        updatedStats.friendlyMatches.total += 1;
        updatedStats.friendlyMatches.wins += won;
        updatedStats.friendlyMatches.draws += drawn;
        updatedStats.friendlyMatches.losses += lost;
        updatedStats.friendlyMatches.goals += goals;
        updatedStats.friendlyMatches.assists += assists;
      }

      // Update league stats
      if (affectsLeagueStats) {
        updatedStats.leagueMatches.total += 1;
        updatedStats.leagueMatches.wins += won;
        updatedStats.leagueMatches.draws += drawn;
        updatedStats.leagueMatches.losses += lost;
        updatedStats.leagueMatches.goals += goals;
        updatedStats.leagueMatches.assists += assists;
        updatedStats.leagueMatches.points = calculatePoints(
          updatedStats.leagueMatches.wins,
          updatedStats.leagueMatches.draws
        );

        // Update legacy fields
        updatedStats.totalMatches = updatedStats.leagueMatches.total;
        updatedStats.wins = updatedStats.leagueMatches.wins;
        updatedStats.draws = updatedStats.leagueMatches.draws;
        updatedStats.losses = updatedStats.leagueMatches.losses;
        updatedStats.totalGoals = updatedStats.leagueMatches.goals;
        updatedStats.totalAssists = updatedStats.leagueMatches.assists;
        updatedStats.points = updatedStats.leagueMatches.points;
      }

      // Always update allMatches
      updatedStats.allMatches.total += 1;
      updatedStats.allMatches.wins += won;
      updatedStats.allMatches.draws += drawn;
      updatedStats.allMatches.losses += lost;
      updatedStats.allMatches.goals += goals;
      updatedStats.allMatches.assists += assists;

      // Update MVP count
      if (match.playerIdOfMatchMVP === playerId) {
        updatedStats.mvpCount += 1;
        updatedStats.mvpRate = updatedStats.allMatches.total > 0 
          ? (updatedStats.mvpCount / updatedStats.allMatches.total) * 100 
          : 0;
      }

      // Calculate averages
      updatedStats.averageGoalsPerMatch = updatedStats.allMatches.total > 0 
        ? updatedStats.allMatches.goals / updatedStats.allMatches.total 
        : 0;
      
      updatedStats.averageAssistsPerMatch = updatedStats.allMatches.total > 0 
        ? updatedStats.allMatches.assists / updatedStats.allMatches.total 
        : 0;

      const statsId = (stats as any).id;
      await this.update(statsId, updatedStats);
      return true;
    } catch (err) {
      console.error("updateStatsFromMatch hatası:", err);
      return false;
    }
  },

  // ============================================
  // RATING MANAGEMENT
  // ============================================

  async addRating(
    playerId: string,
    leagueId: string,
    seasonId: string,
    matchId: string,
    matchType: MatchType,
    rating: number
  ): Promise<boolean> {
    try {
      const stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (!stats) return false;

      const statsId = (stats as any).id;
      await playerStatsApi.addRatingToHistory(statsId, matchId, matchType, rating);
      return true;
    } catch (err) {
      console.error("addRating hatası:", err);
      return false;
    }
  },

  async updateAttendanceRate(
    playerId: string, 
    leagueId: string, 
    seasonId: string, 
    totalFixtures: number, 
    attendedMatches: number
  ): Promise<boolean> {
    try {
      const stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (!stats) return false;

      const attendanceRate = totalFixtures > 0 ? (attendedMatches / totalFixtures) * 100 : 0;
      
      const statsId = (stats as any).id;
      await this.update(statsId, { attendanceRate });
      return true;
    } catch (err) {
      console.error("updateAttendanceRate hatası:", err);
      return false;
    }
  },

  async resetStats(playerId: string, leagueId: string, seasonId: string): Promise<boolean> {
    try {
      const stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (!stats) return false;

      const resetData: Partial<IPlayerStats> = {
        allMatches: { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0 },
        leagueMatches: { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, points: 0 },
        friendlyMatches: { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0 },
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalGoals: 0,
        totalAssists: 0,
        points: 0,
        rating: 0,
        totalRatingsReceived: 0,
        ratingHistory: [],
        mvpCount: 0,
        mvpRate: 0,
        attendanceRate: 0,
        averageGoalsPerMatch: 0,
        averageAssistsPerMatch: 0
      };

      const statsId = (stats as any).id;
      await this.update(statsId, resetData);
      return true;
    } catch (err) {
      console.error("resetStats hatası:", err);
      return false;
    }
  },

  // ============================================
  // FRIENDLY MATCH METHODS (Use API)
  // ============================================

  async getTopFriendlyScorers(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await playerStatsApi.getTopFriendlyScorers(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getTopFriendlyScorers hatası:", err);
      return [];
    }
  },

  async getTopFriendlyAssisters(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await playerStatsApi.getTopFriendlyAssisters(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getTopFriendlyAssisters hatası:", err);
      return [];
    }
  },

  async getTopFriendlyPlayers(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await playerStatsApi.getTopFriendlyPlayers(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getTopFriendlyPlayers hatası:", err);
      return [];
    }
  },

  async getPlayerStatsComparison(playerId: string, leagueId: string, seasonId: string) {
    try {
      return await playerStatsApi.getPlayerStatsComparison(playerId, leagueId, seasonId);
    } catch (err) {
      console.error("getPlayerStatsComparison hatası:", err);
      return null;
    }
  },

  async getMostActivePlayers(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await playerStatsApi.getMostActivePlayers(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getMostActivePlayers hatası:", err);
      return [];
    }
  },

  async getTopRatedPlayers(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await playerStatsApi.getTopRatedPlayers(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getTopRatedPlayers hatası:", err);
      return [];
    }
  },

  async getMVPLeaderboard(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await playerStatsApi.getMVPLeaderboard(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getMVPLeaderboard hatası:", err);
      return [];
    }
  },

  async getStatsSummary(leagueId: string, seasonId: string) {
    try {
      return await playerStatsApi.getStatsSummary(leagueId, seasonId);
    } catch (err) {
      console.error("getStatsSummary hatası:", err);
      return null;
    }
  },

  async getTopScorersByAllMatches(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await playerStatsApi.getTopScorersByAllMatches(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getTopScorersByAllMatches hatası:", err);
      return [];
    }
  },

  async getRatingTrend(playerId: string, leagueId: string, seasonId: string) {
    try {
      return await playerStatsApi.getRatingTrend(playerId, leagueId, seasonId);
    } catch (err) {
      console.error("getRatingTrend hatası:", err);
      return 'stable';
    }
  },

  // ============================================
  // CAREER STATISTICS
  // ============================================

  async getPlayerCareerStats(playerId: string): Promise<{
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    totalWins: number;
    totalMVPs: number;
    averageRating: number;
    leagueStats: { matches: number; goals: number; assists: number; };
    friendlyStats: { matches: number; goals: number; assists: number; };
  }> {
    try {
      const allStats = await this.getStatsByPlayer(playerId);
      
      const career = {
        totalMatches: 0,
        totalGoals: 0,
        totalAssists: 0,
        totalWins: 0,
        totalMVPs: 0,
        averageRating: 0,
        leagueStats: { matches: 0, goals: 0, assists: 0 },
        friendlyStats: { matches: 0, goals: 0, assists: 0 }
      };

      allStats.forEach(stat => {
        // All matches
        career.totalMatches += stat.allMatches?.total || 0;
        career.totalGoals += stat.allMatches?.goals || 0;
        career.totalAssists += stat.allMatches?.assists || 0;
        career.totalWins += stat.allMatches?.wins || 0;
        career.totalMVPs += stat.mvpCount || 0;
        
        // League stats
        career.leagueStats.matches += stat.leagueMatches?.total || 0;
        career.leagueStats.goals += stat.leagueMatches?.goals || 0;
        career.leagueStats.assists += stat.leagueMatches?.assists || 0;
        
        // Friendly stats
        career.friendlyStats.matches += stat.friendlyMatches?.total || 0;
        career.friendlyStats.goals += stat.friendlyMatches?.goals || 0;
        career.friendlyStats.assists += stat.friendlyMatches?.assists || 0;
      });

      // Calculate average rating
      const ratingsSum = allStats.reduce((sum, stat) => sum + (stat.rating || 0), 0);
      career.averageRating = allStats.length > 0 ? ratingsSum / allStats.length : 0;

      return career;
    } catch (err) {
      console.error("getPlayerCareerStats hatası:", err);
      return {
        totalMatches: 0,
        totalGoals: 0,
        totalAssists: 0,
        totalWins: 0,
        totalMVPs: 0,
        averageRating: 0,
        leagueStats: { matches: 0, goals: 0, assists: 0 },
        friendlyStats: { matches: 0, goals: 0, assists: 0 }
      };
    }
  },

  // ============================================
  // HELPER METHOD
  // ============================================

  mapPlayerStats(data: any): IPlayerStats {
    return {
      playerId: data.playerId,
      leagueId: data.leagueId,
      seasonId: data.seasonId,
      // New grouped stats
      allMatches: data.allMatches || { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0 },
      leagueMatches: data.leagueMatches || { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0, points: 0 },
      friendlyMatches: data.friendlyMatches || { total: 0, wins: 0, draws: 0, losses: 0, goals: 0, assists: 0 },
      // Legacy fields
      totalMatches: data.totalMatches || 0,
      wins: data.wins || 0,
      draws: data.draws || 0,
      losses: data.losses || 0,
      totalGoals: data.totalGoals || 0,
      totalAssists: data.totalAssists || 0,
      points: data.points || 0,
      // Rating
      rating: data.rating || 0,
      totalRatingsReceived: data.totalRatingsReceived || 0,
      ratingHistory: data.ratingHistory || [],
      mvpCount: data.mvpCount || 0,
      mvpRate: data.mvpRate || 0,
      categoryRatings: data.categoryRatings,
      // Other
      attendanceRate: data.attendanceRate || 0,
      averageGoalsPerMatch: data.averageGoalsPerMatch || 0,
      averageAssistsPerMatch: data.averageAssistsPerMatch || 0
    };
  }
};