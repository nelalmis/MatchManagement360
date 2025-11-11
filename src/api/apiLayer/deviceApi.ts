// ============================================
// api/deviceApi.ts
// ============================================
import { BaseAPI, ApiResponse } from '../../api/base/BaseAPI';
import { IDevice } from '../../types/entity/types';
import { ApiLogger } from '../../api/base/ApiLogger';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export class DeviceAPI extends BaseAPI<IDevice> {
  constructor() {
    super('devices');
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Get devices by player ID
   */
  async getByPlayerId(playerId: string): Promise<ApiResponse<IDevice[]>> {
    try {
      ApiLogger.log('devices', 'getByPlayerId', { playerId });

      const result = await this.getAll({
        where: [{ field: 'playerId', operator: '==', value: playerId }],
        orderBy: [{ field: 'lastUsed', direction: 'desc' }],
      });

      if (result.success) {
        ApiLogger.success('devices', 'getByPlayerId', {
          playerId,
          count: result.data?.length || 0,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('devices', 'getByPlayerId', error);
      return {
        success: false,
        error: {
          code: 'GET_PLAYER_DEVICES_ERROR',
          message: error.message || 'Cihazlar alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get active devices by player ID
   */
  async getActiveDevicesByPlayerId(playerId: string): Promise<ApiResponse<IDevice[]>> {
    try {
      ApiLogger.log('devices', 'getActiveDevicesByPlayerId', { playerId });

      const result = await this.getAll({
        where: [
          { field: 'playerId', operator: '==', value: playerId },
          { field: 'isActive', operator: '==', value: true },
        ],
        orderBy: [{ field: 'lastUsed', direction: 'desc' }],
      });

      if (result.success) {
        ApiLogger.success('devices', 'getActiveDevicesByPlayerId', {
          playerId,
          count: result.data?.length || 0,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('devices', 'getActiveDevicesByPlayerId', error);
      return {
        success: false,
        error: {
          code: 'GET_ACTIVE_DEVICES_ERROR',
          message: error.message || 'Aktif cihazlar alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Get device by device ID
   */
  async getByDeviceId(deviceId: string): Promise<ApiResponse<IDevice | null>> {
    try {
      ApiLogger.log('devices', 'getByDeviceId', { deviceId });

      const result = await this.getAll({
        where: [{ field: 'deviceId', operator: '==', value: deviceId }],
        limit: 1,
      });

      if (result.success) {
        const device = result.data && result.data.length > 0 ? result.data[0] : null;
        ApiLogger.success('devices', 'getByDeviceId', {
          deviceId,
          found: !!device,
        });

        return {
          success: true,
          data: device,
        };
      }

      return {
        success: false,
        error: result.error,
      };    
    } catch (error: any) {
      ApiLogger.error('devices', 'getByDeviceId', error);
      return {
        success: false,
        error: {
          code: 'GET_DEVICE_ERROR',
          message: error.message || 'Cihaz alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Check if device exists for player
   */
  async checkDeviceExists(
    playerId: string,
    deviceId: string
  ): Promise<ApiResponse<{ exists: boolean; device: IDevice | null }>> {
    try {
      ApiLogger.log('devices', 'checkDeviceExists', { playerId, deviceId });

      const result = await this.getAll({
        where: [
          { field: 'playerId', operator: '==', value: playerId },
          { field: 'deviceId', operator: '==', value: deviceId },
        ],
        limit: 1,
      });

      if (result.success) {
        const exists = result.data && result.data.length > 0 ? true : false;
        const device = exists ? result.data![0] : null;

        ApiLogger.success('devices', 'checkDeviceExists', {
          playerId,
          deviceId,
          exists,
        });

        return {
          success: true,
          data: {
            exists,
            device,
          },
        };
      }

      return {
        success: false,
        error: result.error,
      };
    } catch (error: any) {
      ApiLogger.error('devices', 'checkDeviceExists', error);
      return {
        success: false,
        error: {
          code: 'CHECK_DEVICE_ERROR',
          message: error.message || 'Cihaz kontrolü yapılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // DEVICE REGISTRATION & MANAGEMENT
  // ============================================

  /**
   * Register new device
   */
  async registerDevice(data: {
    playerId: string;
    deviceId: string;
    deviceName?: string;
    platform?: string;
  }): Promise<ApiResponse<IDevice>> {
    try {
      ApiLogger.log('devices', 'registerDevice', {
        playerId: data.playerId,
        deviceId: data.deviceId,
      });

      // Check if device already exists
      const existsResult = await this.checkDeviceExists(data.playerId, data.deviceId);

      if (existsResult.success && existsResult.data?.exists && existsResult.data.device) {
        // Device exists, update lastUsed and activate
        ApiLogger.log('devices', 'registerDevice', {
          message: 'Device already exists, updating...',
          deviceId: existsResult.data.device.id,
        });

        return this.updateLastUsed(existsResult.data.device.id);
      }

      // Create new device
      const deviceData: Omit<IDevice, 'id'> = {
        playerId: data.playerId,
        deviceId: data.deviceId,
        deviceName: data.deviceName || 'Unknown Device',
        platform: data.platform || 'unknown',
        addedAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        isActive: true,
      };

      const result = await this.create(deviceData);

      if (result.success) {
        ApiLogger.success('devices', 'registerDevice', {
          deviceId: result.data?.id,
          playerId: data.playerId,
        });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('devices', 'registerDevice', error);
      return {
        success: false,
        error: {
          code: 'REGISTER_DEVICE_ERROR',
          message: error.message || 'Cihaz kaydedilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update device information
   */
  async updateDevice(
    deviceId: string,
    data: {
      deviceName?: string;
      platform?: string;
    }
  ): Promise<ApiResponse<IDevice>> {
    try {
      ApiLogger.log('devices', 'updateDevice', { deviceId });

      const updateData: any = {};

      if (data.deviceName) updateData.deviceName = data.deviceName;
      if (data.platform) updateData.platform = data.platform;

      const result = await this.update(deviceId, updateData as Partial<Omit<IDevice, 'id'>>);

      if (result.success) {
        ApiLogger.success('devices', 'updateDevice', { deviceId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('devices', 'updateDevice', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_DEVICE_ERROR',
          message: error.message || 'Cihaz güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(deviceId: string): Promise<ApiResponse<IDevice>> {
    try {
      const docRef = doc(db, this.collectionName, deviceId);

      await updateDoc(docRef, {
        lastUsed: new Date().toISOString(),
        isActive: true,
      });

      const result = await this.getById(deviceId);

      if (result.success) {
        ApiLogger.success('devices', 'updateLastUsed', { deviceId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('devices', 'updateLastUsed', error);
      return {
        success: false,
        error: {
          code: 'UPDATE_LAST_USED_ERROR',
          message: error.message || 'Son kullanım zamanı güncellenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Activate device
   */
  async activateDevice(deviceId: string): Promise<ApiResponse<IDevice>> {
    try {
      ApiLogger.log('devices', 'activateDevice', { deviceId });

      const result = await this.update(deviceId, {
        isActive: true,
        lastUsed: new Date().toISOString(),
      } as Partial<Omit<IDevice, 'id'>>);

      if (result.success) {
        ApiLogger.success('devices', 'activateDevice', { deviceId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('devices', 'activateDevice', error);
      return {
        success: false,
        error: {
          code: 'ACTIVATE_DEVICE_ERROR',
          message: error.message || 'Cihaz aktif edilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Deactivate device
   */
  async deactivateDevice(deviceId: string): Promise<ApiResponse<IDevice>> {
    try {
      ApiLogger.log('devices', 'deactivateDevice', { deviceId });

      const result = await this.update(deviceId, {
        isActive: false,
      } as Partial<Omit<IDevice, 'id'>>);

      if (result.success) {
        ApiLogger.success('devices', 'deactivateDevice', { deviceId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('devices', 'deactivateDevice', error);
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_DEVICE_ERROR',
          message: error.message || 'Cihaz deaktif edilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Remove device (soft delete by deactivating)
   */
  async removeDevice(deviceId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('devices', 'removeDevice', { deviceId });

      // Deactivate instead of delete for audit trail
      const deactivateResult = await this.deactivateDevice(deviceId);

      if (!deactivateResult.success) {
        return {
          success: false,
          error: deactivateResult.error,
        };
      }

      ApiLogger.success('devices', 'removeDevice', { deviceId });

      return {
        success: true,
        data: undefined,
      };
    } catch (error: any) {
      ApiLogger.error('devices', 'removeDevice', error);
      return {
        success: false,
        error: {
          code: 'REMOVE_DEVICE_ERROR',
          message: error.message || 'Cihaz kaldırılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete device permanently (hard delete)
   */
  async deleteDevice(deviceId: string): Promise<ApiResponse<void>> {
    try {
      ApiLogger.log('devices', 'deleteDevice', { deviceId });

      const result = await this.delete(deviceId);

      if (result.success) {
        ApiLogger.success('devices', 'deleteDevice', { deviceId });
      }

      return result;
    } catch (error: any) {
      ApiLogger.error('devices', 'deleteDevice', error);
      return {
        success: false,
        error: {
          code: 'DELETE_DEVICE_ERROR',
          message: error.message || 'Cihaz silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Deactivate all devices for a player
   */
  async deactivateAllDevices(playerId: string): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('devices', 'deactivateAllDevices', { playerId });

      const devicesResult = await this.getByPlayerId(playerId);

      if (!devicesResult.success || !devicesResult.data) {
        return {
          success: false,
          error: devicesResult.error || {
            code: 'GET_DEVICES_ERROR',
            message: 'Cihazlar alınırken hata oluştu',
            statusCode: 500,
          },
        };
      }

      let deactivatedCount = 0;

      for (const device of devicesResult.data) {
        if (device.isActive) {
          const result = await this.deactivateDevice(device.id);
          if (result.success) {
            deactivatedCount++;
          }
        }
      }

      ApiLogger.success('devices', 'deactivateAllDevices', {
        playerId,
        count: deactivatedCount,
      });

      return {
        success: true,
        data: deactivatedCount,
      };
    } catch (error: any) {
      ApiLogger.error('devices', 'deactivateAllDevices', error);
      return {
        success: false,
        error: {
          code: 'DEACTIVATE_ALL_ERROR',
          message: error.message || 'Tüm cihazlar deaktif edilirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  /**
   * Delete all inactive devices for a player
   */
  async deleteInactiveDevices(playerId: string): Promise<ApiResponse<number>> {
    try {
      ApiLogger.log('devices', 'deleteInactiveDevices', { playerId });

      const devicesResult = await this.getByPlayerId(playerId);

      if (!devicesResult.success || !devicesResult.data) {
        return {
          success: false,
          error: devicesResult.error || {
            code: 'GET_DEVICES_ERROR',
            message: 'Cihazlar alınırken hata oluştu',
            statusCode: 500,
          },
        };
      }

      let deletedCount = 0;

      for (const device of devicesResult.data) {
        if (!device.isActive) {
          const result = await this.deleteDevice(device.id);
          if (result.success) {
            deletedCount++;
          }
        }
      }

      ApiLogger.success('devices', 'deleteInactiveDevices', {
        playerId,
        count: deletedCount,
      });

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error: any) {
      ApiLogger.error('devices', 'deleteInactiveDevices', error);
      return {
        success: false,
        error: {
          code: 'DELETE_INACTIVE_ERROR',
          message: error.message || 'Pasif cihazlar silinirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Get device statistics for a player
   */
  async getPlayerDeviceStats(playerId: string): Promise<ApiResponse<{
    totalDevices: number;
    activeDevices: number;
    inactiveDevices: number;
    byPlatform: Record<string, number>;
    lastUsedDevice: IDevice | null;
  }>> {
    try {
      const devicesResult = await this.getByPlayerId(playerId);

      if (!devicesResult.success || !devicesResult.data) {
        return {
          success: false,
          error: devicesResult.error || {
            code: 'GET_DEVICES_ERROR',
            message: 'Cihazlar alınırken hata oluştu',
            statusCode: 500,
          },
        };
      }

      const devices = devicesResult.data;
      const byPlatform: Record<string, number> = {};
      let activeCount = 0;
      let lastUsedDevice: IDevice | null = null;

      for (const device of devices) {
        // Platform stats
        const platform = device.platform || 'unknown';
        byPlatform[platform] = (byPlatform[platform] || 0) + 1;

        // Active count
        if (device.isActive) {
          activeCount++;
        }

        // Last used device
        if (!lastUsedDevice || (device.lastUsed && device.lastUsed > (lastUsedDevice.lastUsed || ''))) {
          lastUsedDevice = device;
        }
      }

      return {
        success: true,
        data: {
          totalDevices: devices.length,
          activeDevices: activeCount,
          inactiveDevices: devices.length - activeCount,
          byPlatform,
          lastUsedDevice,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'GET_STATS_ERROR',
          message: error.message || 'İstatistikler alınırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  }
}

// Export singleton instance
export const deviceAPI = new DeviceAPI();