import { playerApi } from "../api/playerApi";
import { IPlayer, IResponseBase, SportType } from "../types/types";

export const playerService = {
  async add(playerData: IPlayer): Promise<IResponseBase> {
    const response = await playerApi.add({
      ...playerData,
      createdAt: new Date().toISOString(),
      lastLogin: playerData.lastLogin || new Date()
    });
    return response as IResponseBase;
  },

  async update(id: string, updates: Partial<IPlayer>): Promise<IResponseBase> {
    const response = await playerApi.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async delete(id: string): Promise<boolean> {
    const response = await playerApi.delete(id);
    return response.success;
  },

  async getById(id: string): Promise<IPlayer | null> {
    try {
      const m: any = await playerApi.getById(id);
      if (!m) return null;

      return {
        id: m.id,
        birthDate: m.birthDate,
        name: m.name,
        phone: m.phone,
        surname: m.surname,
        email: m.email,
        jerseyNumber: m.jerseyNumber,
        lastLogin: m.lastLogin,
        favoriteSports: m.favoriteSports || [],
        sportPositions: m.sportPositions || {},
        profilePhoto: m.profilePhoto
      };
    } catch (err) {
      console.error("getById Player bulunamadı:", err);
      return null;
    }
  },

  async getAll(): Promise<IPlayer[]> {
    try {
      const players: any[] = await playerApi.getAll();
      return players.map((m: any) => ({
        id: m.id,
        birthDate: m.birthDate,
        name: m.name,
        phone: m.phone,
        surname: m.surname,
        email: m.email,
        jerseyNumber: m.jerseyNumber,
        lastLogin: m.lastLogin,
        favoriteSports: m.favoriteSports || [],
        sportPositions: m.sportPositions || {},
        profilePhoto: m.profilePhoto
      }));
    } catch (err) {
      console.error("getAll Players hatası:", err);
      return [];
    }
  },

  async getPlayerByPhone(phone: string): Promise<IPlayer | null> {
    const response = await playerApi.getPlayerByPhone(phone);
    if (response.length === 0) return null;

    return response.map((m: any) => ({
      birthDate: m.birthDate,
      id: m.id,
      name: m.name,
      phone: m.phone,
      surname: m.surname,
      email: m.email,
      jerseyNumber: m.jerseyNumber,
      lastLogin: m.lastLogin,
      favoriteSports: m.favoriteSports || [],
      sportPositions: m.sportPositions || {},
      profilePhoto: m.profilePhoto
    }))[0];
  },

  async getPlayerByEmail(email: string): Promise<IPlayer | null> {
    const response = await playerApi.getPlayerByEmail(email);
    if (response.length === 0) return null;

    return response.map((m: any) => ({
      birthDate: m.birthDate,
      id: m.id,
      name: m.name,
      phone: m.phone,
      surname: m.surname,
      email: m.email,
      jerseyNumber: m.jerseyNumber,
      lastLogin: m.lastLogin,
      favoriteSports: m.favoriteSports || [],
      sportPositions: m.sportPositions || {},
      profilePhoto: m.profilePhoto
    }))[0];
  },

  async getPlayersByIds(playerIds: string[]): Promise<IPlayer[]> {
    try {
      const players: any[] = await playerApi.getPlayersByIds(playerIds);
      return players.map((m: any) => ({
        id: m.id,
        birthDate: m.birthDate,
        name: m.name,
        phone: m.phone,
        surname: m.surname,
        email: m.email,
        jerseyNumber: m.jerseyNumber,
        lastLogin: m.lastLogin,
        favoriteSports: m.favoriteSports || [],
        sportPositions: m.sportPositions || {},
        profilePhoto: m.profilePhoto
      }));
    } catch (err) {
      console.error("getPlayersByIds hatası:", err);
      return [];
    }
  },

  async getPlayersBySport(sportType: SportType): Promise<IPlayer[]> {
    try {
      const players: any[] = await playerApi.getPlayersBySport(sportType);
      return players.map((m: any) => ({
        id: m.id,
        birthDate: m.birthDate,
        name: m.name,
        phone: m.phone,
        surname: m.surname,
        email: m.email,
        jerseyNumber: m.jerseyNumber,
        lastLogin: m.lastLogin,
        favoriteSports: m.favoriteSports || [],
        sportPositions: m.sportPositions || {},
        profilePhoto: m.profilePhoto
      }));
    } catch (err) {
      console.error("getPlayersBySport hatası:", err);
      return [];
    }
  },

  async updateLastLogin(id: string): Promise<void> {
    try {
      await playerApi.update(id, {
        lastLogin: new Date()
      });
    } catch (err) {
      console.error("updateLastLogin hatası:", err);
    }
  },

  async addFavoriteSport(playerId: string, sportType: SportType): Promise<boolean> {
    try {
      const player = await this.getById(playerId);
      if (!player) return false;

      const favoriteSports = player.favoriteSports || [];
      if (!favoriteSports.includes(sportType)) {
        favoriteSports.push(sportType);
        await this.update(playerId, { favoriteSports });
      }
      return true;
    } catch (err) {
      console.error("addFavoriteSport hatası:", err);
      return false;
    }
  },

  async updateSportPositions(
    playerId: string,
    sportType: SportType,
    positions: string[]
  ): Promise<boolean> {
    try {
      const player = await this.getById(playerId);
      if (!player) return false;

      const sportPositions: any = player.sportPositions || {};
      sportPositions[sportType] = positions;

      await this.update(playerId, { sportPositions });
      return true;
    } catch (err) {
      console.error("updateSportPositions hatası:", err);
      return false;
    }
  }
}