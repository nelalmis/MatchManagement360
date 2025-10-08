import { deviceApi } from "../api/deviceApi";
import { IDevice } from "../types/types";

export const deviceService = {
    async add(data: IDevice): Promise<any> {
        const response = await deviceApi.add(data);
        return response.id;
    },
    async update(id: string, updates: any): Promise<boolean> {
        const response = await deviceApi.update(id, updates);
        return response.success;
    },
    async delete(id: string): Promise<boolean> {
        const response = await deviceApi.delete(id);
        return response.success;
    },
    async getById(id: string): Promise<IDevice | null> {
        try {
            const m: any = await deviceApi.getById(id);
            return {
                id: m.id,
                deviceId: m.id,
                addedAt: m.addedAt,
                isActive: m.isActive,
                lastUsed: m.lastUsed,
                playerId: m.playerId,
                deviceName: m.deviceName,
                platform: m.platform
            };
        } catch (err) {
            console.error("getById Device bulunamadı:", err);
            return null;
        }
    },
}
