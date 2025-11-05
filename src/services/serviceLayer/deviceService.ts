import { deviceApi } from "../api/deviceApi";
import { IResponseBase } from "../types/base/baseTypes";
import { IDevice } from "../types/types";

export const deviceService = {
  async add(deviceData: IDevice): Promise<IResponseBase> {
    const { id, ...dataWithoutId } = deviceData;
    
    const response = await deviceApi.add({
      ...dataWithoutId,
      addedAt: deviceData.addedAt || new Date().toISOString(),
      isActive: deviceData.isActive !== undefined ? deviceData.isActive : true,
      lastUsed: deviceData.lastUsed || new Date().toISOString(),
    });
    
    return response as IResponseBase;
  },

  async update(id: string, updates: Partial<IDevice>): Promise<IResponseBase> {
    const response = await deviceApi.update(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return response as IResponseBase;
  },

  async delete(id: string): Promise<boolean> {
    const response = await deviceApi.delete(id);
    return response.success;
  },

  async getById(id: string): Promise<IDevice | null> {
    try {
      const data: any = await deviceApi.getById(id);
      if (!data) return null;

      return this.mapDevice(data);
    } catch (err) {
      console.error("getById Device hatası:", err);
      return null;
    }
  },

  async getAll(): Promise<IDevice[]> {
    try {
      const devices: any[] = await deviceApi.getAll();
      return devices.map(this.mapDevice);
    } catch (err) {
      console.error("getAll Devices hatası:", err);
      return [];
    }
  },

  async getDevicesByPlayer(playerId: string): Promise<IDevice[]> {
    try {
      const devices: any[] = await deviceApi.getDevicesByPlayer(playerId);
      return devices.map(this.mapDevice);
    } catch (err) {
      console.error("getDevicesByPlayer hatası:", err);
      return [];
    }
  },

  async getActiveDevices(): Promise<IDevice[]> {
    try {
      const devices: any[] = await deviceApi.getActiveDevices();
      return devices.map(this.mapDevice);
    } catch (err) {
      console.error("getActiveDevices hatası:", err);
      return [];
    }
  },

  async getDeviceByDeviceId(deviceId: string): Promise<IDevice | null> {
    try {
      const data: any = await deviceApi.getDeviceByDeviceId(deviceId);
      if (!data) return null;

      return this.mapDevice(data);
    } catch (err) {
      console.error("getDeviceByDeviceId hatası:", err);
      return null;
    }
  },

  async activateDevice(id: string): Promise<boolean> {
    try {
      await this.update(id, { 
        isActive: true,
        lastUsed: new Date().toISOString()
      });
      return true;
    } catch (err) {
      console.error("activateDevice hatası:", err);
      return false;
    }
  },

  async deactivateDevice(id: string): Promise<boolean> {
    try {
      await this.update(id, { isActive: false });
      return true;
    } catch (err) {
      console.error("deactivateDevice hatası:", err);
      return false;
    }
  },

  async updateLastUsed(id: string): Promise<boolean> {
    try {
      await this.update(id, { 
        lastUsed: new Date().toISOString() 
      });
      return true;
    } catch (err) {
      console.error("updateLastUsed hatası:", err);
      return false;
    }
  },

  // Helper method
  mapDevice(data: any): IDevice {
    return {
      id: data.id,
      playerId: data.playerId,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
      platform: data.platform,
      addedAt: data.addedAt,
      lastUsed: data.lastUsed,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
  }
};