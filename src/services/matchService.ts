import { matchApi } from "../api/matchApi";
import { IMatch, IResponseBase, buildSquad } from "../types/types";

export const matchService = {
  async add(matchData: IMatch): Promise<IResponseBase> {
    const response = await matchApi.add({
      ...matchData,
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

  // PLAYER REGISTRATION
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

  // TEAM BUILDING
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

  // SCORE MANAGEMENT
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

  // PAYMENT MANAGEMENT
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
      
      // Check if all payments are complete
      if (paymentStatus.every(p => p.paid)) {
        await this.update(matchId, { status: 'Tamamlandı' });
      }
      
      return true;
    } catch (err) {
      console.error("markPaymentAsPaid hatası:", err);
      return false;
    }
  },

  // STATUS MANAGEMENT
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

  // Helper method
  mapMatch(data: any): IMatch {
    return {
      id: data.id,
      fixtureId: data.fixtureId,
      eventId: data.eventId,
      title: data.title,
      registrationTime: data.registrationTime?.toDate?.() || new Date(data.registrationTime),
      registrationEndTime: data.registrationEndTime?.toDate?.() || new Date(data.registrationEndTime),
      matchStartTime: data.matchStartTime?.toDate?.() || new Date(data.matchStartTime),
      matchEndTime: data.matchEndTime?.toDate?.() || new Date(data.matchEndTime),
      premiumPlayerIds: data.premiumPlayerIds || [],
      directPlayerIds: data.directPlayerIds || [],
      guestPlayerIds: data.guestPlayerIds || [],
      registeredPlayerIds: data.registeredPlayerIds || [],
      reservePlayerIds: data.reservePlayerIds || [],
      team1PlayerIds: data.team1PlayerIds,
      team2PlayerIds: data.team2PlayerIds,
      playerPositions: data.playerPositions || {},
      score: data.score,
      team1Score: data.team1Score,
      team2Score: data.team2Score,
      goalScorers: data.goalScorers || [],
      playerIdOfMatchMVP: data.playerIdOfMatchMVP,
      paymentStatus: data.paymentStatus || [],
      organizerPlayerIds: data.organizerPlayerIds || [],
      teamBuildingAuthorityPlayerIds: data.teamBuildingAuthorityPlayerIds || [],
      location: data.location,
      pricePerPlayer: data.pricePerPlayer,
      peterIban: data.peterIban,
      peterFullName: data.peterFullName,
      status: data.status,
      matchBoardSheetId: data.matchBoardSheetId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }
}