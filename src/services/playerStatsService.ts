import { playerStatsApi } from "../api/playerStatsApi";
import { IPlayerStats, IResponseBase, IMatch, calculatePoints } from "../types/types";

export const playerStatsService = {
  async add(statsData: IPlayerStats): Promise<IResponseBase> {
    const response = await playerStatsApi.add({
      ...statsData,
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

  async initializePlayerStats(
    playerId: string, 
    leagueId: string, 
    seasonId: string
  ): Promise<IResponseBase | null> {
    try {
      // Check if stats already exist
      const existing = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (existing) {
        return { success: true, id: existing.playerId };
      }

      const statsData: IPlayerStats = {
        playerId,
        leagueId,
        seasonId,
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalGoals: 0,
        totalAssists: 0,
        points: 0,
        rating: 0,
        mvpCount: 0,
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

  async updateStatsFromMatch(
    playerId: string, 
    leagueId: string, 
    seasonId: string, 
    match: IMatch
  ): Promise<boolean> {
    try {
      // Get or create player stats
      let stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (!stats) {
        await this.initializePlayerStats(playerId, leagueId, seasonId);
        stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
        if (!stats) return false;
      }

      // Check if player participated in the match
      const isInTeam1 = match.team1PlayerIds?.includes(playerId);
      const isInTeam2 = match.team2PlayerIds?.includes(playerId);
      if (!isInTeam1 && !isInTeam2) return false;

      const team1Score = match.team1Score || 0;
      const team2Score = match.team2Score || 0;

      // Update match results
      const updatedStats = { ...stats };
      updatedStats.totalMatches += 1;

      if (isInTeam1) {
        if (team1Score > team2Score) updatedStats.wins += 1;
        else if (team1Score === team2Score) updatedStats.draws += 1;
        else updatedStats.losses += 1;
      } else {
        if (team2Score > team1Score) updatedStats.wins += 1;
        else if (team1Score === team2Score) updatedStats.draws += 1;
        else updatedStats.losses += 1;
      }

      // Update goals and assists
      const playerGoals = match.goalScorers.find(g => g.playerId === playerId);
      if (playerGoals) {
        updatedStats.totalGoals += playerGoals.goals;
        updatedStats.totalAssists += playerGoals.assists;
      }

      // Update MVP count
      if (match.playerIdOfMatchMVP === playerId) {
        updatedStats.mvpCount += 1;
      }

      // Calculate averages
      updatedStats.averageGoalsPerMatch = updatedStats.totalMatches > 0 
        ? updatedStats.totalGoals / updatedStats.totalMatches 
        : 0;
      
      updatedStats.averageAssistsPerMatch = updatedStats.totalMatches > 0 
        ? updatedStats.totalAssists / updatedStats.totalMatches 
        : 0;

      // Calculate points
      updatedStats.points = calculatePoints(updatedStats.wins, updatedStats.draws);

      // Update in database
      const statsId = (stats as any).id;
      await this.update(statsId, updatedStats);
      return true;
    } catch (err) {
      console.error("updateStatsFromMatch hatası:", err);
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

  async updateRating(
    playerId: string, 
    leagueId: string, 
    seasonId: string, 
    rating: number
  ): Promise<boolean> {
    try {
      const stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (!stats) return false;

      const statsId = (stats as any).id;
      await this.update(statsId, { rating });
      return true;
    } catch (err) {
      console.error("updateRating hatası:", err);
      return false;
    }
  },

  async resetStats(playerId: string, leagueId: string, seasonId: string): Promise<boolean> {
    try {
      const stats = await this.getStatsByPlayerLeagueSeason(playerId, leagueId, seasonId);
      if (!stats) return false;

      const resetData: Partial<IPlayerStats> = {
        totalMatches: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        totalGoals: 0,
        totalAssists: 0,
        points: 0,
        rating: 0,
        mvpCount: 0,
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

  async getPlayerCareerStats(playerId: string): Promise<{
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    totalWins: number;
    totalMVPs: number;
    averageRating: number;
  }> {
    try {
      const allStats = await this.getStatsByPlayer(playerId);
      
      const career = {
        totalMatches: 0,
        totalGoals: 0,
        totalAssists: 0,
        totalWins: 0,
        totalMVPs: 0,
        averageRating: 0
      };

      allStats.forEach(stat => {
        career.totalMatches += stat.totalMatches;
        career.totalGoals += stat.totalGoals;
        career.totalAssists += stat.totalAssists;
        career.totalWins += stat.wins;
        career.totalMVPs += stat.mvpCount;
      });

      // Calculate average rating
      const ratingsSum = allStats.reduce((sum, stat) => sum + stat.rating, 0);
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
        averageRating: 0
      };
    }
  },

  // Helper method
  mapPlayerStats(data: any): IPlayerStats {
    return {
      playerId: data.playerId,
      leagueId: data.leagueId,
      seasonId: data.seasonId,
      totalMatches: data.totalMatches || 0,
      wins: data.wins || 0,
      draws: data.draws || 0,
      losses: data.losses || 0,
      totalGoals: data.totalGoals || 0,
      totalAssists: data.totalAssists || 0,
      points: data.points || 0,
      rating: data.rating || 0,
      mvpCount: data.mvpCount || 0,
      attendanceRate: data.attendanceRate || 0,
      averageGoalsPerMatch: data.averageGoalsPerMatch || 0,
      averageAssistsPerMatch: data.averageAssistsPerMatch || 0
    };
  }
}