import { matchApi } from "../api/matchApi";
import { matchFixtureApi } from "../api/matchFixtureApi";
import { matchInvitationService } from "./matchInvitationService";
import { IMatch, buildSquad, SportType, MatchType } from "../types/types";
import { friendlyMatchConfigService } from "./friendlyMatchConfigService";
import { IResponseBase } from "../types/base/baseTypes";

export const matchService = {
  // ============================================
  // EXISTING METHODS (kept as is)
  // ============================================
  
  async add(matchData: IMatch): Promise<IResponseBase> {
    const response = await matchApi.add({
      ...matchData,
      id: undefined,
      createdAt: new Date().toISOString(),
      premiumPlayerIds: matchData.premiumPlayerIds || [],
      directPlayerIds: matchData.directPlayerIds || [],
      guestPlayerIds: matchData.guestPlayerIds || [],
      registeredPlayerIds: matchData.registeredPlayerIds || [],
      reservePlayerIds: matchData.reservePlayerIds || [],
      organizerPlayerIds: matchData.organizerPlayerIds || [],
      teamBuildingAuthorityPlayerIds: matchData.teamBuildingAuthorityPlayerIds || [],
      goalScorers: [],
      paymentStatus: [],
      status: 'Oluşturuldu'
    });
    return response as IResponseBase;
  },

  async update(id: string, updates: Partial<IMatch>): Promise<IResponseBase> {
    const response = await matchApi.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async delete(id: string): Promise<boolean> {
    const response = await matchApi.delete(id);
    
    // Clean up invitations when match is deleted
    if (response.success) {
      await matchInvitationService.cancelAllMatchInvitations(id);
    }
    
    return response.success;
  },

  async getById(id: string): Promise<IMatch | null> {
    try {
      const data: any = await matchApi.getById(id);
      if (!data) return null;
      return this.mapMatch(data);
    } catch (err) {
      console.error("getById Match hatası:", err);
      return null;
    }
  },

  async getAll(): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getAll();
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getAll Matches hatası:", err);
      return [];
    }
  },

  async getMatchesByLeague(leagueId: string): Promise<IMatch[]> {
    try {
      if (!leagueId) {
        console.error("League ID gerekli");
        return [];
      }

      const fixtures = await matchFixtureApi.getFixturesByLeague(leagueId);
      if (fixtures.length === 0) return [];

      const matchPromises = fixtures.map((fixture: any) =>
        matchApi.getMatchesByFixture(fixture.id!)
      );

      const matchesArrays = await Promise.all(matchPromises);
      const allMatches = matchesArrays.flat();
      const mappedMatches = allMatches.map(this.mapMatch);

      const uniqueMatches = mappedMatches.filter((match: any, index: number, self: any[]) =>
        index === self.findIndex((m) => m.id === match.id)
      );

      uniqueMatches.sort((a, b) =>
        new Date(b.matchStartTime).getTime() - new Date(a.matchStartTime).getTime()
      );

      return uniqueMatches;
    } catch (err) {
      console.error("getMatchesByLeague hatası:", err);
      return [];
    }
  },

  async getMatchesByFixture(fixtureId: string): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getMatchesByFixture(fixtureId);
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getMatchesByFixture hatası:", err);
      return [];
    }
  },

  async getMatchesByStatus(status: IMatch['status']): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getMatchesByStatus(status);
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getMatchesByStatus hatası:", err);
      return [];
    }
  },

  async getUpcomingMatches(daysAhead: number = 7): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getUpcomingMatches(daysAhead);
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getUpcomingMatches hatası:", err);
      return [];
    }
  },

  async getMatchesByPlayer(playerId: string): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getMatchesByPlayer(playerId);
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getMatchesByPlayer hatası:", err);
      return [];
    }
  },

  async getMatchesByOrganizer(organizerId: string): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getMatchesByOrganizer(organizerId);
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getMatchesByOrganizer hatası:", err);
      return [];
    }
  },

  async getActiveRegistrationMatches(): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getActiveRegistrationMatches();
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getActiveRegistrationMatches hatası:", err);
      return [];
    }
  },

  // ============================================
  // NEW: FRIENDLY MATCH METHODS
  // ============================================

  /**
   * Create a friendly match
   */
  async createFriendlyMatch(data: {
    organizerId: string;
    sportType: SportType;
    title: string;
    matchStartTime: Date;
    location: string;
    staffPlayerCount: number;
    reservePlayerCount: number;
    isPublic: boolean;
    affectsStats: boolean;
    affectsStandings: boolean;
    invitedPlayerIds?: string[];
    linkedLeagueId?: string;
    pricePerPlayer?: number;
    peterIban?: string;
    peterFullName?: string;
    useDefaults?: boolean;
  }): Promise<IResponseBase> {
    try {
      // Get defaults if requested
      let defaults: any = {};
      if (data.useDefaults) {
        const config = await friendlyMatchConfigService.getDefaultSettings(data.organizerId);
        if (config) {
          defaults = {
            location: config.location || data.location,
            staffPlayerCount: config.staffCount || data.staffPlayerCount,
            reservePlayerCount: config.reserveCount || data.reservePlayerCount,
            pricePerPlayer: config.price || data.pricePerPlayer,
            peterIban: config.peterIban || data.peterIban,
            peterFullName: config.peterFullName || data.peterFullName
          };
        }
      }

      const matchData: any = {
        type: MatchType.FRIENDLY,              // 'type' not 'matchType'
        sportType: data.sportType,
        title: data.title,
        matchStartTime: data.matchStartTime,
        registrationTime: new Date(),
        registrationEndTime: data.matchStartTime,
        matchEndTime: new Date(data.matchStartTime.getTime() + 2 * 60 * 60 * 1000), // +2 hours
        
        // Friendly specific
        organizerId: data.organizerId,
        isPublic: data.isPublic,
        invitedPlayerIds: data.invitedPlayerIds || [],
        linkedLeagueId: data.linkedLeagueId,
        
        // Stats settings
        affectsStats: data.affectsStats,
        affectsStandings: data.affectsStandings,
        
        // Authorities
        organizerPlayerIds: [data.organizerId],
        teamBuildingAuthorityPlayerIds: [data.organizerId],
        
        // Settings with defaults
        ...defaults,
        location: defaults.location || data.location,
        staffPlayerCount: defaults.staffPlayerCount || data.staffPlayerCount,
        reservePlayerCount: defaults.reservePlayerCount || data.reservePlayerCount,
        pricePerPlayer: defaults.pricePerPlayer || data.pricePerPlayer,
        peterIban: defaults.peterIban || data.peterIban,
        peterFullName: defaults.peterFullName || data.peterFullName,
        
        status: 'Kayıt Açık'
      };

      return await this.add(matchData);
    } catch (err) {
      console.error("createFriendlyMatch hatası:", err);
      throw err;
    }
  },

  /**
   * Create friendly match from template
   */
  async createFromTemplate(
    organizerId: string,
    templateId: string,
    overrides?: Partial<IMatch>
  ): Promise<IResponseBase> {
    try {
      const templateData = await friendlyMatchConfigService.applyTemplateToMatch(
        organizerId,
        templateId,
        overrides
      );

      return await this.add({
        ...templateData,
        type: MatchType.FRIENDLY,              // 'type' not 'matchType'
        organizerPlayerIds: [organizerId],
        teamBuildingAuthorityPlayerIds: [organizerId],
        status: 'Kayıt Açık'
      });
    } catch (err) {
      console.error("createFromTemplate hatası:", err);
      throw err;
    }
  },

  /**
   * Save match as template
   */
  async saveMatchAsTemplate(
    matchId: string,
    organizerId: string,
    templateName: string
  ): Promise<string> {
    try {
      const match = await this.getById(matchId);
      if (!match) throw new Error('Maç bulunamadı');

      // Extract template-worthy settings
      const settings = {
        sportType: match.sportType,
        location: match.location,
        staffPlayerCount: match.staffPlayerCount,
        reservePlayerCount: match.reservePlayerCount,
        pricePerPlayer: match.pricePerPlayer,
        peterIban: match.peterIban,
        peterFullName: match.peterFullName,
        isPublic: match.isPublic,
        affectsStats: match.affectsStats,
        affectsStandings: match.affectsStandings
      };

      return await friendlyMatchConfigService.saveTemplate(
        organizerId,
        templateName,
        settings
      );
    } catch (err) {
      console.error("saveMatchAsTemplate hatası:", err);
      throw err;
    }
  },

  /**
   * Get public friendly matches
   */
  async getPublicFriendlyMatches(filters?: {
    sportType?: string;
    location?: string;
    minDate?: Date;
    maxDate?: Date;
  }): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getPublicFriendlyMatches(filters);
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getPublicFriendlyMatches hatası:", err);
      return [];
    }
  },

  /**
   * Get matches by type
   */
  async getMatchesByType(type: MatchType): Promise<IMatch[]> {
    try {
      const matches: any[] = await matchApi.getMatchesByType(type);
      return matches.map(this.mapMatch);
    } catch (err) {
      console.error("getMatchesByType hatası:", err);
      return [];
    }
  },

  /**
   * Get player matches grouped by type
   */
  async getPlayerMatchesGrouped(playerId: string) {
    try {
      const grouped = await matchApi.getPlayerMatchesGrouped(playerId);
      return {
        all: grouped.all.map(this.mapMatch),
        league: grouped.league.map(this.mapMatch),
        friendly: grouped.friendly.map(this.mapMatch)
      };
    } catch (err) {
      console.error("getPlayerMatchesGrouped hatası:", err);
      return { all: [], league: [], friendly: [] };
    }
  },

  /**
   * Calculate player statistics
   */
  async calculatePlayerStats(playerId: string, options?: {
    includeLeague?: boolean;
    includeFriendly?: boolean;
  }) {
    try {
      const matches: any[] = await matchApi.getMatchesForStats(playerId, {
        includeLeague: options?.includeLeague ?? true,
        includeFriendly: options?.includeFriendly ?? true,
        onlyCompleted: true
      });

      const stats = {
        totalMatches: matches.length,
        wins: 0,
        losses: 0,
        draws: 0,
        goalsScored: 0,
        assists: 0,
        mvpCount: 0,
        cleanSheets: 0
      };

      matches.forEach((match: any) => {
        // Calculate wins/losses/draws
        const isTeam1 = match.team1PlayerIds?.includes(playerId);
        const isTeam2 = match.team2PlayerIds?.includes(playerId);

        if (match.team1Score > match.team2Score) {
          if (isTeam1) stats.wins++;
          else if (isTeam2) stats.losses++;
        } else if (match.team2Score > match.team1Score) {
          if (isTeam2) stats.wins++;
          else if (isTeam1) stats.losses++;
        } else {
          stats.draws++;
        }

        // Calculate goals and assists
        const playerGoals = match.goalScorers?.find((g: any) => g.playerId === playerId);
        if (playerGoals) {
          stats.goalsScored += playerGoals.goals || 0;
          stats.assists += playerGoals.assists || 0;
        }

        // MVP count
        if (match.playerIdOfMatchMVP === playerId) {
          stats.mvpCount++;
        }

        // Clean sheets (for goalkeepers)
        if (isTeam1 && match.team2Score === 0) stats.cleanSheets++;
        if (isTeam2 && match.team1Score === 0) stats.cleanSheets++;
      });

      // Separate stats by type
      const leagueMatches = matches.filter((m: any) => m.type === MatchType.LEAGUE);
      const friendlyMatches = matches.filter((m: any) => m.type === MatchType.FRIENDLY);

      return {
        all: stats,
        league: this.calculateStatsForMatches(leagueMatches, playerId),
        friendly: this.calculateStatsForMatches(friendlyMatches, playerId)
      };
    } catch (err) {
      console.error("calculatePlayerStats hatası:", err);
      return {
        all: { totalMatches: 0, wins: 0, losses: 0, draws: 0, goalsScored: 0, assists: 0, mvpCount: 0, cleanSheets: 0 },
        league: { totalMatches: 0, wins: 0, losses: 0, draws: 0, goalsScored: 0, assists: 0, mvpCount: 0, cleanSheets: 0 },
        friendly: { totalMatches: 0, wins: 0, losses: 0, draws: 0, goalsScored: 0, assists: 0, mvpCount: 0, cleanSheets: 0 }
      };
    }
  },

  calculateStatsForMatches(matches: any[], playerId: string) {
    const stats = {
      totalMatches: matches.length,
      wins: 0,
      losses: 0,
      draws: 0,
      goalsScored: 0,
      assists: 0,
      mvpCount: 0,
      cleanSheets: 0
    };

    matches.forEach((match: any) => {
      const isTeam1 = match.team1PlayerIds?.includes(playerId);
      const isTeam2 = match.team2PlayerIds?.includes(playerId);

      if (match.team1Score > match.team2Score) {
        if (isTeam1) stats.wins++;
        else if (isTeam2) stats.losses++;
      } else if (match.team2Score > match.team1Score) {
        if (isTeam2) stats.wins++;
        else if (isTeam1) stats.losses++;
      } else {
        stats.draws++;
      }

      const playerGoals = match.goalScorers?.find((g: any) => g.playerId === playerId);
      if (playerGoals) {
        stats.goalsScored += playerGoals.goals || 0;
        stats.assists += playerGoals.assists || 0;
      }

      if (match.playerIdOfMatchMVP === playerId) {
        stats.mvpCount++;
      }

      if (isTeam1 && match.team2Score === 0) stats.cleanSheets++;
      if (isTeam2 && match.team1Score === 0) stats.cleanSheets++;
    });

    return stats;
  },

  // ============================================
  // INVITATION INTEGRATION
  // ============================================

  /**
   * Invite players to match
   */
  async invitePlayersToMatch(
    matchId: string,
    inviterId: string,
    playerIds: string[],
    message?: string,
    expiresInHours?: number
  ) {
    try {
      const match = await this.getById(matchId);
      if (!match) throw new Error('Maç bulunamadı');

      return await matchInvitationService.sendBulkInvitations({
        matchId,
        matchType: match.type || MatchType.FRIENDLY,  // Use 'type' field
        inviterId,
        inviteeIds: playerIds,
        message,
        expiresInHours
      });
    } catch (err) {
      console.error("invitePlayersToMatch hatası:", err);
      throw err;
    }
  },

  /**
   * Accept match invitation and register
   */
  async acceptInvitationAndRegister(invitationId: string, playerId: string): Promise<boolean> {
    try {
      // Accept invitation
      await matchInvitationService.acceptInvitation(invitationId);

      // Get invitation to find match
      const invitation = await matchInvitationService.getPendingInvitations(playerId);
      const acceptedInvitation = invitation.find(inv => inv.id === invitationId);

      if (!acceptedInvitation) {
        throw new Error('Davet bulunamadı');
      }

      // Register to match
      return await this.registerPlayer(acceptedInvitation.matchId, playerId);
    } catch (err) {
      console.error("acceptInvitationAndRegister hatası:", err);
      return false;
    }
  },

  // ============================================
  // EXISTING METHODS (continued)
  // ============================================

  async registerPlayer(matchId: string, playerId: string): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match || match.status !== 'Kayıt Açık') return false;

      const registeredPlayerIds = match.registeredPlayerIds || [];
      if (!registeredPlayerIds.includes(playerId)) {
        registeredPlayerIds.push(playerId);
        await this.update(matchId, { registeredPlayerIds });
      }
      return true;
    } catch (err) {
      console.error("registerPlayer hatası:", err);
      return false;
    }
  },

  async unregisterPlayer(matchId: string, playerId: string): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match) return false;

      const registeredPlayerIds = (match.registeredPlayerIds || []).filter(id => id !== playerId);
      await this.update(matchId, { registeredPlayerIds });
      return true;
    } catch (err) {
      console.error("unregisterPlayer hatası:", err);
      return false;
    }
  },

  async addGuestPlayer(matchId: string, playerId: string): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match) return false;

      const guestPlayerIds = match.guestPlayerIds || [];
      if (!guestPlayerIds.includes(playerId)) {
        guestPlayerIds.push(playerId);
        await this.update(matchId, { guestPlayerIds });
      }
      return true;
    } catch (err) {
      console.error("addGuestPlayer hatası:", err);
      return false;
    }
  },

  async buildTeams(matchId: string, staffPlayerCount: number, reservePlayerCount: number): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match) return false;

      const { squad, reserves } = buildSquad(match, staffPlayerCount, reservePlayerCount);

      await this.update(matchId, {
        status: 'Takımlar Oluşturuldu'
      });

      return true;
    } catch (err) {
      console.error("buildTeams hatası:", err);
      return false;
    }
  },

  async assignTeams(
    matchId: string,
    team1PlayerIds: string[],
    team2PlayerIds: string[],
    playerPositions?: Record<string, string>
  ): Promise<boolean> {
    try {
      await this.update(matchId, {
        team1PlayerIds,
        team2PlayerIds,
        playerPositions: playerPositions || {},
        status: 'Takımlar Oluşturuldu'
      });
      return true;
    } catch (err) {
      console.error("assignTeams hatası:", err);
      return false;
    }
  },

  async updatePlayerPosition(
    matchId: string,
    playerId: string,
    position: string
  ): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match) return false;

      const playerPositions = match.playerPositions || {};
      playerPositions[playerId] = position;

      await this.update(matchId, { playerPositions });
      return true;
    } catch (err) {
      console.error("updatePlayerPosition hatası:", err);
      return false;
    }
  },

  async updateScore(
    matchId: string,
    team1Score: number,
    team2Score: number
  ): Promise<boolean> {
    try {
      const score = `${team1Score}-${team2Score}`;
      await this.update(matchId, {
        team1Score,
        team2Score,
        score,
        status: 'Skor Onay Bekliyor'
      });
      return true;
    } catch (err) {
      console.error("updateScore hatası:", err);
      return false;
    }
  },

  async addGoalScorer(
    matchId: string,
    playerId: string,
    goals: number = 1,
    assists: number = 0
  ): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match) return false;

      const goalScorers = match.goalScorers || [];
      const existingScorer = goalScorers.find(g => g.playerId === playerId);

      if (existingScorer) {
        existingScorer.goals += goals;
        existingScorer.assists += assists;
      } else {
        goalScorers.push({
          playerId,
          goals,
          assists,
          confirmed: false,
          submittedAt: new Date().toISOString()
        });
      }

      await this.update(matchId, { goalScorers });
      return true;
    } catch (err) {
      console.error("addGoalScorer hatası:", err);
      return false;
    }
  },

  async confirmGoalScorers(matchId: string): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match) return false;

      const goalScorers = (match.goalScorers || []).map(g => ({
        ...g,
        confirmed: true
      }));

      await this.update(matchId, {
        goalScorers,
        status: 'Ödeme Bekliyor'
      });
      return true;
    } catch (err) {
      console.error("confirmGoalScorers hatası:", err);
      return false;
    }
  },

  async setMVP(matchId: string, playerId: string): Promise<boolean> {
    try {
      await this.update(matchId, { playerIdOfMatchMVP: playerId });
      return true;
    } catch (err) {
      console.error("setMVP hatası:", err);
      return false;
    }
  },

  async initializePayments(matchId: string, amount: number): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match) return false;

      const allPlayerIds = [
        ...(match.team1PlayerIds || []),
        ...(match.team2PlayerIds || [])
      ];

      const paymentStatus = allPlayerIds.map(playerId => ({
        playerId,
        paid: false,
        amount
      }));

      await this.update(matchId, { paymentStatus });
      return true;
    } catch (err) {
      console.error("initializePayments hatası:", err);
      return false;
    }
  },

  async markPaymentAsPaid(
    matchId: string,
    playerId: string,
    confirmedBy: string
  ): Promise<boolean> {
    try {
      const match = await this.getById(matchId);
      if (!match) return false;

      const paymentStatus = match.paymentStatus.map(p => {
        if (p.playerId === playerId) {
          return {
            ...p,
            paid: true,
            paidAt: new Date().toISOString(),
            confirmedBy
          };
        }
        return p;
      });

      await this.update(matchId, { paymentStatus });

      if (paymentStatus.every(p => p.paid)) {
        await this.update(matchId, { status: 'Tamamlandı' });
      }

      return true;
    } catch (err) {
      console.error("markPaymentAsPaid hatası:", err);
      return false;
    }
  },

  async updateMatchStatus(matchId: string, status: IMatch['status']): Promise<boolean> {
    try {
      await this.update(matchId, { status });
      return true;
    } catch (err) {
      console.error("updateMatchStatus hatası:", err);
      return false;
    }
  },

  async startMatch(matchId: string): Promise<boolean> {
    return this.updateMatchStatus(matchId, 'Oynanıyor');
  },

  async cancelMatch(matchId: string): Promise<boolean> {
    return this.updateMatchStatus(matchId, 'İptal Edildi');
  },

  async completeMatch(matchId: string): Promise<boolean> {
    return this.updateMatchStatus(matchId, 'Tamamlandı');
  },

  mapMatch(data: any): IMatch {
    return {
      id: data.id,
      type: data.type || data.matchType || MatchType.LEAGUE, // 'type' field in interface
      sportType: data.sportType,
      
      // League Match fields
      fixtureId: data.fixtureId,
      leagueId: data.leagueId,
      tournamentId: data.tournamentId,
      seasonId: data.seasonId,
      
      // Friendly Match fields
      organizerId: data.organizerId,
      isPublic: data.isPublic,
      invitedPlayerIds: data.invitedPlayerIds || [],
      linkedLeagueId: data.linkedLeagueId,
      
      // Common fields
      eventId: data.eventId,
      title: data.title,
      registrationTime: data.registrationTime?.toDate?.() || new Date(data.registrationTime),
      registrationEndTime: data.registrationEndTime?.toDate?.() || new Date(data.registrationEndTime),
      matchStartTime: data.matchStartTime?.toDate?.() || new Date(data.matchStartTime),
      matchEndTime: data.matchEndTime?.toDate?.() || new Date(data.matchEndTime),
      
      // Player lists
      premiumPlayerIds: data.premiumPlayerIds || [],
      directPlayerIds: data.directPlayerIds || [],
      guestPlayerIds: data.guestPlayerIds || [],
      registeredPlayerIds: data.registeredPlayerIds || [],
      reservePlayerIds: data.reservePlayerIds || [],
      
      // Squad settings
      staffPlayerCount: data.staffPlayerCount,
      reservePlayerCount: data.reservePlayerCount,
      minPlayersToStartMatch: data.minPlayersToStartMatch,
      maxPlayersAllowed: data.maxPlayersAllowed,
      
      // Teams
      team1PlayerIds: data.team1PlayerIds,
      team2PlayerIds: data.team2PlayerIds,
      playerPositions: data.playerPositions || {},
      
      // Score
      score: data.score,
      team1Score: data.team1Score,
      team2Score: data.team2Score,
      goalScorers: data.goalScorers || [],
      
      // Rating & MVP
      playerIdOfMatchMVP: data.playerIdOfMatchMVP,
      mvpCalculatedAt: data.mvpCalculatedAt,
      mvpAutoCalculated: data.mvpAutoCalculated || false,
      ratingsSummary: data.ratingsSummary,
      
      // Comments
      commentsEnabled: data.commentsEnabled || false,
      totalComments: data.totalComments,
      
      // Payment
      paymentStatus: data.paymentStatus || [],
      
      // Authorities
      organizerPlayerIds: data.organizerPlayerIds || [],
      teamBuildingAuthorityPlayerIds: data.teamBuildingAuthorityPlayerIds || [],
      
      // Match specific settings
      location: data.location,
      pricePerPlayer: data.pricePerPlayer,
      peterIban: data.peterIban,
      peterFullName: data.peterFullName,
      
      // Status
      status: data.status,
      
      // Friendly match stats settings
      affectsStats: data.affectsStats,
      affectsStandings: data.affectsStandings,
      requiresApproval: data.requiresApproval,
      isApproved: data.isApproved,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt,
      
      // Meta
      matchBoardSheetId: data.matchBoardSheetId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }
};


/*

// 1. Friendly maç oluştur
const match = await matchService.createFriendlyMatch({
  organizerId: 'user123',
  sportType: 'Futbol',
  title: 'Cumartesi Maçı',
  matchStartTime: new Date('2025-10-18T15:00:00'),
  location: 'Beşiktaş Halı Saha',
  staffPlayerCount: 10,
  reservePlayerCount: 2,
  isPublic: true,
  affectsStats: true,
  affectsStandings: false,
  useDefaults: true
});

// 2. Oyunculara davet gönder
await matchService.invitePlayersToMatch(
  match.id,
  'user123',
  ['player1', 'player2', 'player3'],
  'Cumartesi maçına gelir misin?',
  48
);

// 3. İstatistikleri hesapla
const stats = await matchService.calculatePlayerStats('player1', {
  includeLeague: true,
  includeFriendly: true
});
*/