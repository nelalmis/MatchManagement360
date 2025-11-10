import { ApiResponse } from "../../api/base/BaseAPI";
import { deviceAPI } from "../../api/deviceApi";
import { IDevice } from "../../types/entity/types";

export const deviceService = {
  // ============================================
  // DEVICE REGISTRATION & MANAGEMENT
  // ============================================

  /**
   * Register a new device
   */
  async registerDevice(data: {
    playerId: string;
    deviceId: string;
    deviceName?: string;
    platform?: string;
  }): Promise<ApiResponse<IDevice>> {
    return deviceAPI.registerDevice(data);
  },

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
    return deviceAPI.updateDevice(deviceId, data);
  },

  /**
   * Update last used timestamp
   */
  async updateLastUsed(deviceId: string): Promise<ApiResponse<IDevice>> {
    return deviceAPI.updateLastUsed(deviceId);
  },

  /**
   * Activate device
   */
  async activateDevice(deviceId: string): Promise<ApiResponse<IDevice>> {
    return deviceAPI.activateDevice(deviceId);
  },

  /**
   * Deactivate device
   */
  async deactivateDevice(deviceId: string): Promise<ApiResponse<IDevice>> {
    return deviceAPI.deactivateDevice(deviceId);
  },

  /**
   * Remove device (soft delete)
   */
  async removeDevice(deviceId: string): Promise<ApiResponse<void>> {
    return deviceAPI.removeDevice(deviceId);
  },

  /**
   * Delete device permanently
   */
  async deleteDevice(deviceId: string): Promise<ApiResponse<void>> {
    return deviceAPI.deleteDevice(deviceId);
  },

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get device by ID
   */
  async getById(deviceId: string): Promise<ApiResponse<IDevice>> {
    return deviceAPI.getById(deviceId);
  },

  /**
   * Get all devices for a player
   */
  async getByPlayerId(playerId: string): Promise<ApiResponse<IDevice[]>> {
    return deviceAPI.getByPlayerId(playerId);
  },

  /**
   * Get active devices for a player
   */
  async getActiveDevicesByPlayerId(playerId: string): Promise<ApiResponse<IDevice[]>> {
    return deviceAPI.getActiveDevicesByPlayerId(playerId);
  },

  /**
   * Get device by device ID
   */
  async getByDeviceId(deviceId: string): Promise<ApiResponse<IDevice | null>> {
    return deviceAPI.getByDeviceId(deviceId);
  },

  /**
   * Check if device exists for player
   */
  async checkDeviceExists(
    playerId: string,
    deviceId: string
  ): Promise<ApiResponse<{ exists: boolean; device: IDevice | null }>> {
    return deviceAPI.checkDeviceExists(playerId, deviceId);
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Deactivate all devices for a player
   */
  async deactivateAllDevices(playerId: string): Promise<ApiResponse<number>> {
    return deviceAPI.deactivateAllDevices(playerId);
  },

  /**
   * Delete all inactive devices for a player
   */
  async deleteInactiveDevices(playerId: string): Promise<ApiResponse<number>> {
    return deviceAPI.deleteInactiveDevices(playerId);
  },

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
    return deviceAPI.getPlayerDeviceStats(playerId);
  },

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get trusted devices for a player (active devices)
   */
  async getTrustedDevices(playerId: string): Promise<ApiResponse<IDevice[]>> {
    return this.getActiveDevicesByPlayerId(playerId);
  },

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(playerId: string, deviceId: string): Promise<boolean> {
    try {
      const result = await this.checkDeviceExists(playerId, deviceId);
      
      if (!result.success || !result.data) {
        return false;
      }

      return result.data.exists && result.data.device?.isActive === true;
    } catch (error) {
      console.error("isDeviceTrusted error:", error);
      return false;
    }
  },

  /**
   * Trust a device (register and activate)
   */
  async trustDevice(data: {
    playerId: string;
    deviceId: string;
    deviceName?: string;
    platform?: string;
  }): Promise<ApiResponse<IDevice>> {
    return this.registerDevice(data);
  },

  /**
   * Untrust a device (deactivate)
   */
  async untrustDevice(deviceId: string): Promise<ApiResponse<IDevice>> {
    return this.deactivateDevice(deviceId);
  },

  /**
   * Get device count for a player
   */
  async getDeviceCount(playerId: string): Promise<number> {
    try {
      const result = await this.getByPlayerId(playerId);
      
      if (!result.success || !result.data) {
        return 0;
      }

      return result.data.length;
    } catch (error) {
      console.error("getDeviceCount error:", error);
      return 0;
    }
  },

  /**
   * Get active device count for a player
   */
  async getActiveDeviceCount(playerId: string): Promise<number> {
    try {
      const result = await this.getActiveDevicesByPlayerId(playerId);
      
      if (!result.success || !result.data) {
        return 0;
      }

      return result.data.length;
    } catch (error) {
      console.error("getActiveDeviceCount error:", error);
      return 0;
    }
  },

  /**
   * Check if player has reached device limit
   */
  async hasReachedDeviceLimit(playerId: string, maxDevices: number = 5): Promise<boolean> {
    try {
      const count = await this.getActiveDeviceCount(playerId);
      return count >= maxDevices;
    } catch (error) {
      console.error("hasReachedDeviceLimit error:", error);
      return true; // Fail safe - assume limit reached on error
    }
  },

  /**
   * Verify device and update last used
   */
  async verifyAndUpdateDevice(playerId: string, deviceId: string): Promise<ApiResponse<IDevice>> {
    try {
      const checkResult = await this.checkDeviceExists(playerId, deviceId);

      if (!checkResult.success || !checkResult.data) {
        return {
          success: false,
          error: checkResult.error || {
            code: 'DEVICE_CHECK_ERROR',
            message: 'Cihaz kontrolü yapılamadı',
            statusCode: 500,
          },
        };
      }

      if (!checkResult.data.exists || !checkResult.data.device) {
        return {
          success: false,
          error: {
            code: 'DEVICE_NOT_FOUND',
            message: 'Cihaz bulunamadı',
            statusCode: 404,
          },
        };
      }

      // Update last used and ensure active
      return this.updateLastUsed(checkResult.data.device.id);
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VERIFY_DEVICE_ERROR',
          message: error.message || 'Cihaz doğrulaması yapılırken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  },

  /**
   * Clean up old inactive devices (older than specified days)
   */
  async cleanupOldDevices(playerId: string, daysInactive: number = 90): Promise<ApiResponse<number>> {
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

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
      const cutoffTimestamp = cutoffDate.toISOString();

      let deletedCount = 0;

      for (const device of devicesResult.data) {
        if (
          !device.isActive &&
          device.lastUsed &&
          device.lastUsed < cutoffTimestamp
        ) {
          const deleteResult = await this.deleteDevice(device.id);
          if (deleteResult.success) {
            deletedCount++;
          }
        }
      }

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: error.message || 'Eski cihazlar temizlenirken hata oluştu',
          details: error,
          statusCode: 500,
        },
      };
    }
  },
};