import { standingsApi } from "../api/standingsApi";
import { IStandings, IResponseBase, IMatch, calculatePoints, calculateGoalDifference } from "../types/types";

export const standingsService = {
  async add(standingsData: IStandings): Promise<IResponseBase> {
    const response = await standingsApi.add({
      ...standingsData,
      id: undefined,
      lastUpdated: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async update(id: string, updates: Partial<IStandings>): Promise<IResponseBase> {
    const response = await standingsApi.update(id, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async delete(id: string): Promise<boolean> {
    const response = await standingsApi.delete(id);
    return response.success;
  },

  async getById(id: string): Promise<IStandings | null> {
    try {
      const data: any = await standingsApi.getById(id);
      if (!data) return null;
      
      return this.mapStandings(data);
    } catch (err) {
      console.error("getById Standings hatası:", err);
      return null;
    }
  },

  async getAll(): Promise<IStandings[]> {
    try {
      const standings: any[] = await standingsApi.getAll();
      return standings.map(this.mapStandings);
    } catch (err) {
      console.error("getAll Standings hatası:", err);
      return [];
    }
  },

  async getStandingsByLeague(leagueId: string): Promise<IStandings[]> {
    try {
      const standings: any[] = await standingsApi.getStandingsByLeague(leagueId);
      return standings.map(this.mapStandings);
    } catch (err) {
      console.error("getStandingsByLeague hatası:", err);
      return [];
    }
  },

  async getStandingsByLeagueAndSeason(leagueId: string, seasonId: string): Promise<IStandings | null> {
    try {
      const data: any = await standingsApi.getStandingsByLeagueAndSeason(leagueId, seasonId);
      if (!data) return null;
      
      return this.mapStandings(data);
    } catch (err) {
      console.error("getStandingsByLeagueAndSeason hatası:", err);
      return null;
    }
  },

  async initializeStandings(leagueId: string, seasonId: string, playerIds: string[]): Promise<IResponseBase | null> {
    try {
      const playerStandings = playerIds.map(playerId => ({
        playerId,
        playerName: '',
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsScored: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        assists: 0,
        points: 0,
        rating: 0,
        totalRatingsReceived: 0,
        ratingTrend: 'stable' as 'up' | 'stable' | 'down',
        mvpCount: 0,
        mvpRate: 0,
        attendanceRate: 0
      }));

      const standingsData: IStandings = {
        id: null,
        leagueId,
        seasonId,
        playerStandings,
        lastUpdated: new Date().toISOString()
      };

      return await this.add(standingsData);
    } catch (err) {
      console.error("initializeStandings hatası:", err);
      return null;
    }
  },

  async updateStandingsFromMatch(standingsId: string, match: IMatch): Promise<boolean> {
    try {
      const standings = await this.getById(standingsId);
      if (!standings || !match.team1PlayerIds || !match.team2PlayerIds) return false;

      const team1Score = match.team1Score || 0;
      const team2Score = match.team2Score || 0;

      // Determine match result
      let team1Result: 'won' | 'drawn' | 'lost';
      let team2Result: 'won' | 'drawn' | 'lost';

      if (team1Score > team2Score) {
        team1Result = 'won';
        team2Result = 'lost';
      } else if (team1Score < team2Score) {
        team1Result = 'lost';
        team2Result = 'won';
      } else {
        team1Result = 'drawn';
        team2Result = 'drawn';
      }

      // Update player standings
      const updatedPlayerStandings = standings.playerStandings.map(ps => {
        const isInTeam1 = match.team1PlayerIds!.includes(ps.playerId);
        const isInTeam2 = match.team2PlayerIds!.includes(ps.playerId);

        if (!isInTeam1 && !isInTeam2) return ps;

        // Get player's goals and assists
        const playerGoals = match.goalScorers.find(g => g.playerId === ps.playerId);
        const goals = playerGoals?.goals || 0;
        const assists = playerGoals?.assists || 0;

        // Update stats
        const updated = { ...ps };
        updated.played += 1;

        if (isInTeam1) {
          if (team1Result === 'won') updated.won += 1;
          else if (team1Result === 'drawn') updated.drawn += 1;
          else updated.lost += 1;

          updated.goalsScored += goals;
          updated.goalsAgainst += team2Score;
        } else {
          if (team2Result === 'won') updated.won += 1;
          else if (team2Result === 'drawn') updated.drawn += 1;
          else updated.lost += 1;

          updated.goalsScored += goals;
          updated.goalsAgainst += team1Score;
        }

        updated.assists += assists;
        updated.goalDifference = calculateGoalDifference(updated.goalsScored, updated.goalsAgainst);
        updated.points = calculatePoints(updated.won, updated.drawn);

        // MVP check
        if (match.playerIdOfMatchMVP === ps.playerId) {
          updated.mvpCount += 1;
          // Calculate MVP rate
          updated.mvpRate = updated.played > 0 ? (updated.mvpCount / updated.played) * 100 : 0;
        }

        return updated;
      });

      // Sort by points, then goal difference
      updatedPlayerStandings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsScored - a.goalsScored;
      });

      await this.update(standingsId, { playerStandings: updatedPlayerStandings });
      return true;
    } catch (err) {
      console.error("updateStandingsFromMatch hatası:", err);
      return false;
    }
  },

  async updatePlayerAttendanceRate(
    standingsId: string, 
    playerId: string, 
    totalFixtures: number, 
    attendedMatches: number
  ): Promise<boolean> {
    try {
      const standings = await this.getById(standingsId);
      if (!standings) return false;

      const updatedPlayerStandings = standings.playerStandings.map(ps => {
        if (ps.playerId === playerId) {
          return {
            ...ps,
            attendanceRate: totalFixtures > 0 ? (attendedMatches / totalFixtures) * 100 : 0
          };
        }
        return ps;
      });

      await this.update(standingsId, { playerStandings: updatedPlayerStandings });
      return true;
    } catch (err) {
      console.error("updatePlayerAttendanceRate hatası:", err);
      return false;
    }
  },

  // NEW: Update player rating and related stats from rating profile
  async updatePlayerRatingFromProfile(
    standingsId: string, 
    playerId: string, 
    rating: number,
    totalRatingsReceived: number,
    ratingTrend: 'up' | 'stable' | 'down'
  ): Promise<boolean> {
    try {
      const standings = await this.getById(standingsId);
      if (!standings) return false;

      const updatedPlayerStandings = standings.playerStandings.map(ps => {
        if (ps.playerId === playerId) {
          return {
            ...ps,
            rating,
            totalRatingsReceived,
            ratingTrend
          };
        }
        return ps;
      });

      await this.update(standingsId, { playerStandings: updatedPlayerStandings });
      return true;
    } catch (err) {
      console.error("updatePlayerRatingFromProfile hatası:", err);
      return false;
    }
  },

  async resetStandings(standingsId: string): Promise<boolean> {
    try {
      const standings = await this.getById(standingsId);
      if (!standings) return false;

      const resetPlayerStandings = standings.playerStandings.map(ps => ({
        ...ps,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsScored: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        assists: 0,
        points: 0,
        rating: 0,
        totalRatingsReceived: 0,
        ratingTrend: 'stable' as 'up' | 'stable' | 'down',
        mvpCount: 0,
        mvpRate: 0,
        attendanceRate: 0
      }));

      await this.update(standingsId, { playerStandings: resetPlayerStandings });
      return true;
    } catch (err) {
      console.error("resetStandings hatası:", err);
      return false;
    }
  },

  async addPlayerToStandings(
    standingsId: string, 
    playerId: string, 
    playerName: string
  ): Promise<boolean> {
    try {
      const standings = await this.getById(standingsId);
      if (!standings) return false;

      // Check if player already exists
      if (standings.playerStandings.some(ps => ps.playerId === playerId)) {
        return false;
      }

      const newPlayerStanding = {
        playerId,
        playerName,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsScored: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        assists: 0,
        points: 0,
        rating: 0,
        totalRatingsReceived: 0,
        ratingTrend: 'stable' as 'up' | 'stable' | 'down',
        mvpCount: 0,
        mvpRate: 0,
        attendanceRate: 0
      };

      const updatedPlayerStandings = [...standings.playerStandings, newPlayerStanding];
      await this.update(standingsId, { playerStandings: updatedPlayerStandings });
      return true;
    } catch (err) {
      console.error("addPlayerToStandings hatası:", err);
      return false;
    }
  },

  async removePlayerFromStandings(standingsId: string, playerId: string): Promise<boolean> {
    try {
      const standings = await this.getById(standingsId);
      if (!standings) return false;

      const updatedPlayerStandings = standings.playerStandings.filter(
        ps => ps.playerId !== playerId
      );

      await this.update(standingsId, { playerStandings: updatedPlayerStandings });
      return true;
    } catch (err) {
      console.error("removePlayerFromStandings hatası:", err);
      return false;
    }
  },

  // ============================================
  // NEW: Rating & Analysis Methods (Business Logic in Service)
  // ============================================

  async getTopScorers(standingsId: string, limit: number = 10) {
    try {
      const standings = await this.getById(standingsId);
      if (!standings) return [];

      return standings.playerStandings
        .sort((a, b) => b.goalsScored - a.goalsScored)
        .slice(0, limit);
    } catch (err) {
      console.error("getTopScorers hatası:", err);
      return [];
    }
  },

  async getTopAssists(standingsId: string, limit: number = 10) {
    try {
      const standings = await this.getById(standingsId);
      if (!standings) return [];

      return standings.playerStandings
        .sort((a, b) => b.assists - a.assists)
        .slice(0, limit);
    } catch (err) {
      console.error("getTopAssists hatası:", err);
      return [];
    }
  },

  async getMVPs(standingsId: string, limit: number = 10) {
    try {
      const standings = await this.getById(standingsId);
      if (!standings) return [];

      return standings.playerStandings
        .sort((a, b) => {
          if (b.mvpCount !== a.mvpCount) return b.mvpCount - a.mvpCount;
          return b.mvpRate - a.mvpRate;
        })
        .slice(0, limit);
    } catch (err) {
      console.error("getMVPs hatası:", err);
      return [];
    }
  },

  // Get top rated players
  async getTopRatedPlayers(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      const standings = await this.getStandingsByLeagueAndSeason(leagueId, seasonId);
      if (!standings) return [];

      return standings.playerStandings
        .filter(p => p.totalRatingsReceived >= 3) // Minimum 3 ratings
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    } catch (err) {
      console.error("getTopRatedPlayers hatası:", err);
      return [];
    }
  },

  // Get improving players
  async getImprovingPlayers(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      const standings = await this.getStandingsByLeagueAndSeason(leagueId, seasonId);
      if (!standings) return [];

      return standings.playerStandings
        .filter(p => p.ratingTrend === 'up' && p.totalRatingsReceived >= 3)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    } catch (err) {
      console.error("getImprovingPlayers hatası:", err);
      return [];
    }
  },

  // Get declining players
  async getDecliningPlayers(leagueId: string, seasonId: string) {
    try {
      const standings = await this.getStandingsByLeagueAndSeason(leagueId, seasonId);
      if (!standings) return [];

      return standings.playerStandings
        .filter(p => p.ratingTrend === 'down' && p.totalRatingsReceived >= 3)
        .sort((a, b) => a.rating - b.rating); // Ascending
    } catch (err) {
      console.error("getDecliningPlayers hatası:", err);
      return [];
    }
  },

  // Get qualified standings (minimum matches)
  async getQualifiedStandings(leagueId: string, seasonId: string, minMatches: number = 3) {
    try {
      const standings = await this.getStandingsByLeagueAndSeason(leagueId, seasonId);
      if (!standings) return [];

      return standings.playerStandings
        .filter(p => p.played >= minMatches)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
          return b.goalsScored - a.goalsScored;
        });
    } catch (err) {
      console.error("getQualifiedStandings hatası:", err);
      return [];
    }
  },

  // Get player season comparison
  async getPlayerSeasonComparison(leagueId: string, playerId: string) {
    try {
      const allStandings = await this.getStandingsByLeague(leagueId);
      
      const playerSeasonStats = allStandings.map(standing => {
        const playerData = standing.playerStandings.find(p => p.playerId === playerId);
        if (!playerData) return null;

        return {
          seasonId: standing.seasonId,
          lastUpdated: standing.lastUpdated,
          stats: playerData
        };
      }).filter(s => s !== null);

      return playerSeasonStats;
    } catch (err) {
      console.error("getPlayerSeasonComparison hatası:", err);
      return [];
    }
  },

  // Helper method
  mapStandings(data: any): IStandings {
    return {
      id: data.id,
      leagueId: data.leagueId,
      seasonId: data.seasonId,
      playerStandings: data.playerStandings || [],
      lastUpdated: data.lastUpdated
    };
  }
};