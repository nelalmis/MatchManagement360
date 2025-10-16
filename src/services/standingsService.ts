import { standingsApi } from "../api/standingsApi";
import { IResponseBase } from "../types/base/baseTypes";
import { IStandings, IMatch, MatchType, calculatePoints, calculateGoalDifference } from "../types/types";

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
        // Friendly stats
        friendlyPlayed: 0,
        friendlyWon: 0,
        friendlyDrawn: 0,
        friendlyLost: 0,
        // Goals
        goalsScored: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        assists: 0,
        points: 0,
        // Rating
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

  /**
   * Update standings from match (supports both League and Friendly)
   * UPDATED: Now handles friendly matches based on match.type
   */
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

      // Determine if this is a friendly match
      const isFriendlyMatch = match.type === MatchType.FRIENDLY;
      const affectsLeagueStandings = !isFriendlyMatch || match.affectsStandings === true;

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

        // Update appropriate stats based on match type
        if (isFriendlyMatch) {
          // Update friendly stats
          updated.friendlyPlayed = (updated.friendlyPlayed || 0) + 1;
          
          if (isInTeam1) {
            if (team1Result === 'won') updated.friendlyWon = (updated.friendlyWon || 0) + 1;
            else if (team1Result === 'drawn') updated.friendlyDrawn = (updated.friendlyDrawn || 0) + 1;
            else updated.friendlyLost = (updated.friendlyLost || 0) + 1;
          } else {
            if (team2Result === 'won') updated.friendlyWon = (updated.friendlyWon || 0) + 1;
            else if (team2Result === 'drawn') updated.friendlyDrawn = (updated.friendlyDrawn || 0) + 1;
            else updated.friendlyLost = (updated.friendlyLost || 0) + 1;
          }

          // If friendly match affects league standings, also update league stats
          if (affectsLeagueStandings) {
            updated.played += 1;
            if (isInTeam1) {
              if (team1Result === 'won') updated.won += 1;
              else if (team1Result === 'drawn') updated.drawn += 1;
              else updated.lost += 1;
            } else {
              if (team2Result === 'won') updated.won += 1;
              else if (team2Result === 'drawn') updated.drawn += 1;
              else updated.lost += 1;
            }
          }
        } else {
          // League match - update league stats
          updated.played += 1;
          if (isInTeam1) {
            if (team1Result === 'won') updated.won += 1;
            else if (team1Result === 'drawn') updated.drawn += 1;
            else updated.lost += 1;
          } else {
            if (team2Result === 'won') updated.won += 1;
            else if (team2Result === 'drawn') updated.drawn += 1;
            else updated.lost += 1;
          }
        }

        // Update goals/assists (always count these)
        if (isInTeam1) {
          updated.goalsScored += goals;
          updated.goalsAgainst += team2Score;
        } else {
          updated.goalsScored += goals;
          updated.goalsAgainst += team1Score;
        }

        updated.assists += assists;
        updated.goalDifference = calculateGoalDifference(updated.goalsScored, updated.goalsAgainst);
        
        // Update points (only for league matches or friendly matches that affect standings)
        if (affectsLeagueStandings) {
          updated.points = calculatePoints(updated.won, updated.drawn);
        }

        // MVP check
        if (match.playerIdOfMatchMVP === ps.playerId) {
          updated.mvpCount += 1;
          // Calculate MVP rate based on total matches
          const totalMatches = updated.played + (updated.friendlyPlayed || 0);
          updated.mvpRate = totalMatches > 0 ? (updated.mvpCount / totalMatches) * 100 : 0;
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
        friendlyPlayed: 0,
        friendlyWon: 0,
        friendlyDrawn: 0,
        friendlyLost: 0,
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
        friendlyPlayed: 0,
        friendlyWon: 0,
        friendlyDrawn: 0,
        friendlyLost: 0,
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
  // EXISTING ANALYSIS METHODS
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

  async getTopRatedPlayers(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      const standings = await this.getStandingsByLeagueAndSeason(leagueId, seasonId);
      if (!standings) return [];

      return standings.playerStandings
        .filter(p => p.totalRatingsReceived >= 3)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    } catch (err) {
      console.error("getTopRatedPlayers hatası:", err);
      return [];
    }
  },

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

  async getDecliningPlayers(leagueId: string, seasonId: string) {
    try {
      const standings = await this.getStandingsByLeagueAndSeason(leagueId, seasonId);
      if (!standings) return [];

      return standings.playerStandings
        .filter(p => p.ratingTrend === 'down' && p.totalRatingsReceived >= 3)
        .sort((a, b) => a.rating - b.rating);
    } catch (err) {
      console.error("getDecliningPlayers hatası:", err);
      return [];
    }
  },

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

  // ============================================
  // NEW: FRIENDLY MATCH METHODS (Use API layer)
  // ============================================

  /**
   * Get player's friendly match statistics
   */
  async getPlayerFriendlyStats(leagueId: string, seasonId: string, playerId: string) {
    try {
      return await standingsApi.getPlayerFriendlyStats(leagueId, seasonId, playerId);
    } catch (err) {
      console.error("getPlayerFriendlyStats hatası:", err);
      return null;
    }
  },

  /**
   * Get top friendly match players
   */
  async getTopFriendlyPlayers(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await standingsApi.getTopFriendlyPlayers(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getTopFriendlyPlayers hatası:", err);
      return [];
    }
  },

  /**
   * Get combined statistics (league + friendly)
   */
  async getPlayersCombinedStats(leagueId: string, seasonId: string) {
    try {
      return await standingsApi.getPlayersCombinedStats(leagueId, seasonId);
    } catch (err) {
      console.error("getPlayersCombinedStats hatası:", err);
      return [];
    }
  },

  /**
   * Get player standing detail with calculated metrics
   */
  async getPlayerStandingDetail(leagueId: string, seasonId: string, playerId: string) {
    try {
      return await standingsApi.getPlayerStandingDetail(leagueId, seasonId, playerId);
    } catch (err) {
      console.error("getPlayerStandingDetail hatası:", err);
      return null;
    }
  },

  /**
   * Compare two players
   */
  async comparePlayers(leagueId: string, seasonId: string, playerId1: string, playerId2: string) {
    try {
      return await standingsApi.comparePlayers(leagueId, seasonId, playerId1, playerId2);
    } catch (err) {
      console.error("comparePlayers hatası:", err);
      return null;
    }
  },

  /**
   * Get standings summary
   */
  async getStandingsSummary(leagueId: string, seasonId: string) {
    try {
      return await standingsApi.getStandingsSummary(leagueId, seasonId);
    } catch (err) {
      console.error("getStandingsSummary hatası:", err);
      return null;
    }
  },

  /**
   * Get MVP leaderboard
   */
  async getMVPLeaderboard(leagueId: string, seasonId: string, limit: number = 10) {
    try {
      return await standingsApi.getMVPLeaderboard(leagueId, seasonId, limit);
    } catch (err) {
      console.error("getMVPLeaderboard hatası:", err);
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