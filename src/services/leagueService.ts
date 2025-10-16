import { leagueApi, ILeagueSettings } from "../api/leagueApi";
import { IResponseBase } from "../types/base/baseTypes";
import { ILeague, SportType } from "../types/types";

export const leagueService = {
  async add(leagueData: ILeague): Promise<IResponseBase> {
    const response = await leagueApi.add({
      ...leagueData,
      id: undefined,
      createdAt: new Date().toISOString(),
      playerIds: leagueData.playerIds || [],
      premiumPlayerIds: leagueData.premiumPlayerIds || [],
      directPlayerIds: leagueData.directPlayerIds || [],
      teamBuildingAuthorityPlayerIds: leagueData.teamBuildingAuthorityPlayerIds || [],
      matchFixtures: [],
      // Default friendly settings
      settings: leagueData.settings || {
        allowFriendlyMatches: false,
        friendlyMatchesAffectStats: false,
        friendlyMatchesAffectStandings: false,
        friendlyMatchesRequireApproval: false
      }
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
      
      return this.mapLeague(data);
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

  // ============================================
  // NEW: FRIENDLY MATCH SETTINGS
  // ============================================

  /**
   * Update friendly match settings
   */
  async updateFriendlySettings(
    leagueId: string,
    settings: ILeagueSettings
  ): Promise<boolean> {
    try {
      await leagueApi.updateFriendlySettings(leagueId, settings);
      return true;
    } catch (err) {
      console.error("updateFriendlySettings hatası:", err);
      return false;
    }
  },

  /**
   * Get friendly match settings
   */
  async getFriendlySettings(leagueId: string): Promise<ILeagueSettings | null> {
    try {
      return await leagueApi.getFriendlySettings(leagueId);
    } catch (err) {
      console.error("getFriendlySettings hatası:", err);
      return null;
    }
  },

  /**
   * Enable friendly matches for league
   */
  async enableFriendlyMatches(
    leagueId: string,
    options?: {
      affectStats?: boolean;
      affectStandings?: boolean;
      requireApproval?: boolean;
    }
  ): Promise<boolean> {
    try {
      await leagueApi.enableFriendlyMatches(
        leagueId,
        options?.affectStats ?? false,
        options?.affectStandings ?? false,
        options?.requireApproval ?? false
      );
      return true;
    } catch (err) {
      console.error("enableFriendlyMatches hatası:", err);
      return false;
    }
  },

  /**
   * Disable friendly matches for league
   */
  async disableFriendlyMatches(leagueId: string): Promise<boolean> {
    try {
      await leagueApi.disableFriendlyMatches(leagueId);
      return true;
    } catch (err) {
      console.error("disableFriendlyMatches hatası:", err);
      return false;
    }
  },

  /**
   * Check if friendly matches are allowed
   */
  async isFriendlyMatchesAllowed(leagueId: string): Promise<boolean> {
    try {
      return await leagueApi.isFriendlyMatchesAllowed(leagueId);
    } catch (err) {
      console.error("isFriendlyMatchesAllowed hatası:", err);
      return false;
    }
  },

  /**
   * Check if player can create friendly match in league
   */
  async canPlayerCreateFriendlyMatch(
    leagueId: string,
    playerId: string
  ): Promise<boolean> {
    try {
      return await leagueApi.canPlayerCreateFriendlyMatch(leagueId, playerId);
    } catch (err) {
      console.error("canPlayerCreateFriendlyMatch hatası:", err);
      return false;
    }
  },

  /**
   * Get player's leagues with friendly match permission
   */
  async getPlayerLeaguesWithFriendlyPermission(playerId: string): Promise<ILeague[]> {
    try {
      const leagues: any[] = await leagueApi.getPlayerLeaguesWithFriendlyPermission(playerId);
      return this.mapLeagueArray(leagues);
    } catch (err) {
      console.error("getPlayerLeaguesWithFriendlyPermission hatası:", err);
      return [];
    }
  },

  /**
   * Get leagues that allow friendly matches
   */
  async getLeaguesAllowingFriendlyMatches(): Promise<ILeague[]> {
    try {
      const leagues: any[] = await leagueApi.getLeaguesAllowingFriendlyMatches();
      return this.mapLeagueArray(leagues);
    } catch (err) {
      console.error("getLeaguesAllowingFriendlyMatches hatası:", err);
      return [];
    }
  },

  /**
   * Get league settings summary
   */
  async getLeagueSettingsSummary(leagueId: string) {
    try {
      return await leagueApi.getLeagueSettingsSummary(leagueId);
    } catch (err) {
      console.error("getLeagueSettingsSummary hatası:", err);
      return null;
    }
  },

  /**
   * Toggle friendly matches for league
   */
  async toggleFriendlyMatches(leagueId: string): Promise<boolean> {
    try {
      const settings = await this.getFriendlySettings(leagueId);
      const isCurrentlyAllowed = settings?.allowFriendlyMatches ?? false;

      if (isCurrentlyAllowed) {
        return await this.disableFriendlyMatches(leagueId);
      } else {
        return await this.enableFriendlyMatches(leagueId);
      }
    } catch (err) {
      console.error("toggleFriendlyMatches hatası:", err);
      return false;
    }
  },

  /**
   * Update specific friendly setting
   */
  async updateSpecificFriendlySetting(
    leagueId: string,
    settingKey: keyof ILeagueSettings,
    value: boolean
  ): Promise<boolean> {
    try {
      const currentSettings = await this.getFriendlySettings(leagueId) || {};
      const newSettings = {
        ...currentSettings,
        [settingKey]: value
      };
      
      return await this.updateFriendlySettings(leagueId, newSettings);
    } catch (err) {
      console.error("updateSpecificFriendlySetting hatası:", err);
      return false;
    }
  },

  /**
   * Get leagues grouped by friendly settings
   */
  async getLeaguesGroupedByFriendlySettings() {
    try {
      const grouped = await leagueApi.getLeaguesGroupedByFriendlySettings();
      
      return {
        allowsFriendly: this.mapLeagueArray(grouped.allowsFriendly),
        affectsStats: this.mapLeagueArray(grouped.affectsStats),
        affectsStandings: this.mapLeagueArray(grouped.affectsStandings),
        requiresApproval: this.mapLeagueArray(grouped.requiresApproval),
        noFriendly: this.mapLeagueArray(grouped.noFriendly)
      };
    } catch (err) {
      console.error("getLeaguesGroupedByFriendlySettings hatası:", err);
      return {
        allowsFriendly: [],
        affectsStats: [],
        affectsStandings: [],
        requiresApproval: [],
        noFriendly: []
      };
    }
  },

  /**
   * Validate friendly match creation
   */
  async validateFriendlyMatchCreation(
    leagueId: string,
    playerId: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
    settings?: ILeagueSettings;
  }> {
    try {
      // Check if league exists
      const league = await this.getById(leagueId);
      if (!league) {
        return { allowed: false, reason: 'Lig bulunamadı' };
      }

      // Check if player is in league
      if (!league.playerIds.includes(playerId)) {
        return { allowed: false, reason: 'Oyuncu lige kayıtlı değil' };
      }

      // Check if friendly matches are allowed
      const settings = await this.getFriendlySettings(leagueId);
      if (!settings?.allowFriendlyMatches) {
        return { 
          allowed: false, 
          reason: 'Bu ligde dostluk maçı oluşturma izni yok',
          settings: settings || undefined
        };
      }

      // Check if league season is active
      const isActive = new Date(league.seasonEndDate) > new Date();
      if (!isActive) {
        return { 
          allowed: false, 
          reason: 'Lig sezonu sona ermiş',
          settings
        };
      }

      return { allowed: true, settings };
    } catch (err) {
      console.error("validateFriendlyMatchCreation hatası:", err);
      return { 
        allowed: false, 
        reason: 'Doğrulama sırasında hata oluştu' 
      };
    }
  },

  // ============================================
  // HELPER METHODS
  // ============================================

  mapLeague(data: any): ILeague {
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
      settings: data.settings || {
        allowFriendlyMatches: false,
        friendlyMatchesAffectStats: false,
        friendlyMatchesAffectStandings: false,
        friendlyMatchesRequireApproval: false
      },
      createdAt: data.createdAt,
      createdBy: data.createdBy
    };
  },

  mapLeagueArray(leagues: any[]): ILeague[] {
    return leagues.map((data: any) => this.mapLeague(data));
  }
}