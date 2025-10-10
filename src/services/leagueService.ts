import { leagueApi } from "../api/leagueApi";
import { ILeague, IResponseBase, SportType } from "../types/types";

export const leagueService = {
  async add(leagueData: ILeague): Promise<IResponseBase> {
    const response = await leagueApi.add({
      ...leagueData,
      createdAt: new Date().toISOString(),
      playerIds: leagueData.playerIds || [],
      premiumPlayerIds: leagueData.premiumPlayerIds || [],
      directPlayerIds: leagueData.directPlayerIds || [],
      teamBuildingAuthorityPlayerIds: leagueData.teamBuildingAuthorityPlayerIds || [],
      matchFixtures: []
    });
    return response as IResponseBase;
  },

  async update(id: string, updates: Partial<ILeague>): Promise<IResponseBase> {
    const response = await leagueApi.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async delete(id: string): Promise<boolean> {
    const response = await leagueApi.delete(id);
    return response.success;
  },

  async getById(id: string): Promise<ILeague | null> {
    try {
      const data: any = await leagueApi.getById(id);
      if (!data) return null;
      
      return {
        id: data.id,
        title: data.title,
        sportType: data.sportType,
        spreadSheetId: data.spreadSheetId,
        seasonDuration: data.seasonDuration,
        seasonStartDate: data.seasonStartDate,
        seasonEndDate: data.seasonEndDate,
        autoResetStandings: data.autoResetStandings,
        canChangeSeason: data.canChangeSeason,
        playerIds: data.playerIds || [],
        premiumPlayerIds: data.premiumPlayerIds || [],
        directPlayerIds: data.directPlayerIds || [],
        teamBuildingAuthorityPlayerIds: data.teamBuildingAuthorityPlayerIds || [],
        matchFixtures: data.matchFixtures || [],
        createdAt: data.createdAt,
        createdBy: data.createdBy
      };
    } catch (err) {
      console.error("getById League hatası:", err);
      return null;
    }
  },

  async getAll(): Promise<ILeague[]> {
    try {
      const leagues: any[] = await leagueApi.getAll();
      return this.mapLeagueArray(leagues);
    } catch (err) {
      console.error("getAll Leagues hatası:", err);
      return [];
    }
  },

  async getLeaguesBySportType(sportType: SportType): Promise<ILeague[]> {
    try {
      const leagues: any[] = await leagueApi.getLeaguesBySportType(sportType);
      return this.mapLeagueArray(leagues);
    } catch (err) {
      console.error("getLeaguesBySportType hatası:", err);
      return [];
    }
  },

  async getLeaguesByCreator(creatorId: string): Promise<ILeague[]> {
    try {
      const leagues: any[] = await leagueApi.getLeaguesByCreator(creatorId);
      return this.mapLeagueArray(leagues);
    } catch (err) {
      console.error("getLeaguesByCreator hatası:", err);
      return [];
    }
  },

  async getActiveLeagues(): Promise<ILeague[]> {
    try {
      const leagues: any[] = await leagueApi.getActiveLeagues();
      return this.mapLeagueArray(leagues);
    } catch (err) {
      console.error("getActiveLeagues hatası:", err);
      return [];
    }
  },

  async getLeaguesByPlayer(playerId: string): Promise<ILeague[]> {
    try {
      const leagues: any[] = await leagueApi.getLeaguesByPlayer(playerId);
      return this.mapLeagueArray(leagues);
    } catch (err) {
      console.error("getLeaguesByPlayer hatası:", err);
      return [];
    }
  },

  async addPlayerToLeague(leagueId: string, playerId: string): Promise<boolean> {
    try {
      const league = await this.getById(leagueId);
      if (!league) return false;

      const playerIds = league.playerIds || [];
      if (!playerIds.includes(playerId)) {
        playerIds.push(playerId);
        await this.update(leagueId, { playerIds });
      }
      return true;
    } catch (err) {
      console.error("addPlayerToLeague hatası:", err);
      return false;
    }
  },

  async removePlayerFromLeague(leagueId: string, playerId: string): Promise<boolean> {
    try {
      const league = await this.getById(leagueId);
      if (!league) return false;

      const playerIds = (league.playerIds || []).filter(id => id !== playerId);
      await this.update(leagueId, { playerIds });
      return true;
    } catch (err) {
      console.error("removePlayerFromLeague hatası:", err);
      return false;
    }
  },

  async addPremiumPlayer(leagueId: string, playerId: string): Promise<boolean> {
    try {
      const league = await this.getById(leagueId);
      if (!league) return false;

      const premiumPlayerIds = league.premiumPlayerIds || [];
      if (!premiumPlayerIds.includes(playerId)) {
        premiumPlayerIds.push(playerId);
        await this.update(leagueId, { premiumPlayerIds });
      }
      return true;
    } catch (err) {
      console.error("addPremiumPlayer hatası:", err);
      return false;
    }
  },

  async addDirectPlayer(leagueId: string, playerId: string): Promise<boolean> {
    try {
      const league = await this.getById(leagueId);
      if (!league) return false;

      const directPlayerIds = league.directPlayerIds || [];
      if (!directPlayerIds.includes(playerId)) {
        directPlayerIds.push(playerId);
        await this.update(leagueId, { directPlayerIds });
      }
      return true;
    } catch (err) {
      console.error("addDirectPlayer hatası:", err);
      return false;
    }
  },

  async grantTeamBuildingAuthority(leagueId: string, playerId: string): Promise<boolean> {
    try {
      const league = await this.getById(leagueId);
      if (!league) return false;

      const authorityPlayerIds = league.teamBuildingAuthorityPlayerIds || [];
      if (!authorityPlayerIds.includes(playerId)) {
        authorityPlayerIds.push(playerId);
        await this.update(leagueId, { teamBuildingAuthorityPlayerIds: authorityPlayerIds });
      }
      return true;
    } catch (err) {
      console.error("grantTeamBuildingAuthority hatası:", err);
      return false;
    }
  },

  async updateSeasonDates(
    leagueId: string, 
    startDate: string, 
    endDate: string
  ): Promise<boolean> {
    try {
      await this.update(leagueId, {
        seasonStartDate: startDate,
        seasonEndDate: endDate
      });
      return true;
    } catch (err) {
      console.error("updateSeasonDates hatası:", err);
      return false;
    }
  },

  // Helper method
  mapLeagueArray(leagues: any[]): ILeague[] {
    return leagues.map((data: any) => ({
      id: data.id,
      title: data.title,
      sportType: data.sportType,
      spreadSheetId: data.spreadSheetId,
      seasonDuration: data.seasonDuration,
      seasonStartDate: data.seasonStartDate,
      seasonEndDate: data.seasonEndDate,
      autoResetStandings: data.autoResetStandings,
      canChangeSeason: data.canChangeSeason,
      playerIds: data.playerIds || [],
      premiumPlayerIds: data.premiumPlayerIds || [],
      directPlayerIds: data.directPlayerIds || [],
      teamBuildingAuthorityPlayerIds: data.teamBuildingAuthorityPlayerIds || [],
      matchFixtures: data.matchFixtures || [],
      createdAt: data.createdAt,
      createdBy: data.createdBy
    }));
  }
}