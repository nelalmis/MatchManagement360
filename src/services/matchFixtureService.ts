import { matchFixtureApi } from "../api/matchFixtureApi";
import { IMatchFixture, IResponseBase } from "../types/types";

export const matchFixtureService = {
  async add(fixtureData: IMatchFixture): Promise<IResponseBase> {
    const response = await matchFixtureApi.add({
      ...fixtureData,
      id: undefined, // id'yi undefined yap, null yerine
      createdAt: new Date().toISOString(),
      matchIds: [],
      organizerPlayerIds: fixtureData.organizerPlayerIds || [],
      premiumPlayerIds: fixtureData.premiumPlayerIds || [],
      directPlayerIds: fixtureData.directPlayerIds || [],
      teamBuildingAuthorityPlayerIds: fixtureData.teamBuildingAuthorityPlayerIds || []
    });
    return response as IResponseBase;
  },

  async update(id: string, updates: Partial<IMatchFixture>): Promise<IResponseBase> {
    const response = await matchFixtureApi.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async delete(id: string): Promise<boolean> {
    const response = await matchFixtureApi.delete(id);
    return response.success;
  },

  async getById(id: string): Promise<IMatchFixture | null> {
    try {
      const data: any = await matchFixtureApi.getById(id);
      if (!data) return null;
      
      return this.mapFixture(data);
    } catch (err) {
      console.error("getById MatchFixture hatası:", err);
      return null;
    }
  },

  async getAll(): Promise<IMatchFixture[]> {
    try {
      const fixtures: any[] = await matchFixtureApi.getAll();
      return fixtures.map(this.mapFixture);
    } catch (err) {
      console.error("getAll MatchFixtures hatası:", err);
      return [];
    }
  },

  async getFixturesByLeague(leagueId: string): Promise<IMatchFixture[]> {
    try {
      const fixtures: any[] = await matchFixtureApi.getFixturesByLeague(leagueId);
      return fixtures.map(this.mapFixture);
    } catch (err) {
      console.error("getFixturesByLeague hatası:", err);
      return [];
    }
  },

  async getActiveFixtures(): Promise<IMatchFixture[]> {
    try {
      const fixtures: any[] = await matchFixtureApi.getActiveFixtures();
      return fixtures.map(this.mapFixture);
    } catch (err) {
      console.error("getActiveFixtures hatası:", err);
      return [];
    }
  },

  async getPeriodicFixtures(): Promise<IMatchFixture[]> {
    try {
      const fixtures: any[] = await matchFixtureApi.getPeriodicFixtures();
      return fixtures.map(this.mapFixture);
    } catch (err) {
      console.error("getPeriodicFixtures hatası:", err);
      return [];
    }
  },

  async getFixturesByOrganizer(organizerId: string): Promise<IMatchFixture[]> {
    try {
      const fixtures: any[] = await matchFixtureApi.getFixturesByOrganizer(organizerId);
      return fixtures.map(this.mapFixture);
    } catch (err) {
      console.error("getFixturesByOrganizer hatası:", err);
      return [];
    }
  },

  async getUpcomingFixtures(daysAhead: number = 7): Promise<IMatchFixture[]> {
    try {
      const fixtures: any[] = await matchFixtureApi.getUpcomingFixtures(daysAhead);
      return fixtures.map(this.mapFixture);
    } catch (err) {
      console.error("getUpcomingFixtures hatası:", err);
      return [];
    }
  },

  async addOrganizer(fixtureId: string, organizerId: string): Promise<boolean> {
    try {
      const fixture = await this.getById(fixtureId);
      if (!fixture) return false;

      const organizerPlayerIds = fixture.organizerPlayerIds || [];
      if (!organizerPlayerIds.includes(organizerId)) {
        organizerPlayerIds.push(organizerId);
        await this.update(fixtureId, { organizerPlayerIds });
      }
      return true;
    } catch (err) {
      console.error("addOrganizer hatası:", err);
      return false;
    }
  },

  async toggleStatus(fixtureId: string): Promise<boolean> {
    try {
      const fixture = await this.getById(fixtureId);
      if (!fixture) return false;

      const newStatus = fixture.status === 'Aktif' ? 'Pasif' : 'Aktif';
      await this.update(fixtureId, { status: newStatus });
      return true;
    } catch (err) {
      console.error("toggleStatus hatası:", err);
      return false;
    }
  },

  async addMatchToFixture(fixtureId: string, matchId: string): Promise<boolean> {
    try {
      const fixture = await this.getById(fixtureId);
      if (!fixture) return false;

      const matchIds = fixture.matchIds || [];
      if (!matchIds.includes(matchId)) {
        matchIds.push(matchId);
        await this.update(fixtureId, { matchIds });
      }
      return true;
    } catch (err) {
      console.error("addMatchToFixture hatası:", err);
      return false;
    }
  },

  // Helper method
  mapFixture(data: any): IMatchFixture {
    return {
      id: data.id,
      leagueId: data.leagueId,
      title: data.title,
      sportType: data.sportType,
      registrationStartTime: data.registrationStartTime?.toDate?.() || new Date(data.registrationStartTime),
      matchStartTime: data.matchStartTime?.toDate?.() || new Date(data.matchStartTime),
      matchTotalTimeInMinute: data.matchTotalTimeInMinute,
      isPeriodic: data.isPeriodic,
      periodDayCount: data.periodDayCount,
      staffPlayerCount: data.staffPlayerCount,
      reservePlayerCount: data.reservePlayerCount,
      premiumPlayerIds: data.premiumPlayerIds || [],
      directPlayerIds: data.directPlayerIds || [],
      organizerPlayerIds: data.organizerPlayerIds || [],
      teamBuildingAuthorityPlayerIds: data.teamBuildingAuthorityPlayerIds || [],
      location: data.location,
      pricePerPlayer: data.pricePerPlayer,
      peterIban: data.peterIban,
      peterFullName: data.peterFullName,
      status: data.status,
      surveyFormId: data.surveyFormId,
      commentFormId: data.commentFormId,
      calendarId: data.calendarId,
      matchIds: data.matchIds || [],
      createdAt: data.createdAt
    };
  }
}