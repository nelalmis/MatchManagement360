import { playerApi } from "../api/playerApi";
import { IPlayer, IResponseBase } from "../types/types";

export const playerService = {
  async add(matchData: IPlayer): Promise<IResponseBase> {
    const response = await playerApi.add(matchData);
    return response as IResponseBase;
  },
  async update(id: string, updates: any): Promise<IResponseBase> {
    const response = await playerApi.update(id, updates);
    return response as IResponseBase;
  },
  async delete(id: string): Promise<boolean> {
    const response = await playerApi.delete(id);
    return response.success;
  },
  async getById(id: string): Promise<IPlayer | null> {
    try {
      const m: any = await playerApi.getById(id);
      return {
        id: m.id,
        birthDate: m.birthDate,
        name: m.name,
        phone: m.phone,
        position: m.position,
        surname: m.surname,
        email: m.email,
        jerseyNumber: m.jerseyNumber,
        lastLogin: m.lastLogin,
      };
    } catch (err) {
      console.error("getById PLayer bulunamadı:", err);
      return null;
    }
  },
  async getPlayerByPhone(phone: string): Promise<IPlayer | null> {
    const response = await playerApi.getPlayerByPhone(phone);
    if (response.length == 0) return null;
    return response.map((m: any) => ({
      birthDate: m.birthDate,
      id: m.id,
      name: m.name,
      phone: m.phone,
      position: m.position,
      surname: m.surname,
      email: m.email,
      jerseyNumber: m.jerseyNumber,
      lastLogin: m.lastLogin,
      
    }))[0];
  }
}
