// app/services/deviceManagementService.ts
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export interface DeviceInfo {
  deviceId: string;
  userId: number;
  linkedAt: Date;
  deviceName: string;
  platform: string;
  deviceModel?: string;
  osVersion?: string;
}

export interface DeviceLinkResult {
  success: boolean;
  error?: string;
  isAlreadyLinked?: boolean;
  linkedUserId?: number;
}

class DeviceManagementService {
  private readonly DEVICE_ID_KEY = 'quipuk_device_id';
  private readonly DEVICE_LINK_KEY = 'quipuk_device_link';
  private readonly USER_DEVICE_KEY = 'quipuk_user_device_';

  /**
   * Genera un ID único para el dispositivo
   */
  private async generateDeviceId(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(16);
    const timestamp = Date.now().toString(36);
    const deviceInfo = `${Platform.OS}_${Device.modelName || 'unknown'}`;
    
    return `quipuk_${timestamp}_${this.bytesToHex(randomBytes)}_${deviceInfo}`.toLowerCase();
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Obtiene o genera el ID del dispositivo
   */
  async getDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync(this.DEVICE_ID_KEY);
      
      if (!deviceId) {
        deviceId = await this.generateDeviceId();
        await SecureStore.setItemAsync(this.DEVICE_ID_KEY, deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      throw new Error('No se pudo obtener el ID del dispositivo');
    }
  }

  /**
   * Verifica si el dispositivo está vinculado a algún usuario
   */
  async getLinkedUser(): Promise<number | null> {
    try {
      const linkData = await SecureStore.getItemAsync(this.DEVICE_LINK_KEY);
      
      if (!linkData) return null;
      
      const parsed = JSON.parse(linkData);
      return parsed.userId || null;
    } catch (error) {
      console.error('Error getting linked user:', error);
      return null;
    }
  }

  /**
   * Vincula el dispositivo a un usuario (solo después del registro exitoso)
   */
  async linkDeviceToUser(userId: number): Promise<DeviceLinkResult> {
    try {
      // Verificar si ya está vinculado
      const existingUserId = await this.getLinkedUser();
      if (existingUserId && existingUserId !== userId) {
        return {
          success: false,
          error: 'Este dispositivo ya está vinculado a otra cuenta',
          isAlreadyLinked: true,
          linkedUserId: existingUserId
        };
      }

      const deviceId = await this.getDeviceId();
      
      const deviceInfo: DeviceInfo = {
        deviceId,
        userId,
        linkedAt: new Date(),
        deviceName: Device.deviceName || 'Dispositivo desconocido',
        platform: Platform.OS,
        deviceModel: Device.modelName,
        osVersion: Device.osVersion,
      };

      // Guardar vinculación del dispositivo
      await SecureStore.setItemAsync(
        this.DEVICE_LINK_KEY, 
        JSON.stringify({
          userId,
          linkedAt: deviceInfo.linkedAt.toISOString(),
          deviceInfo
        })
      );

      // Guardar info del dispositivo para el usuario
      await SecureStore.setItemAsync(
        `${this.USER_DEVICE_KEY}${userId}`,
        JSON.stringify(deviceInfo)
      );

      console.log('Device linked successfully to user:', userId);
      return { success: true };

    } catch (error) {
      console.error('Error linking device:', error);
      return {
        success: false,
        error: 'Error al vincular dispositivo'
      };
    }
  }

  /**
   * Desvincula el dispositivo (solo al desinstalar)
   */
  async unlinkDevice(): Promise<void> {
    try {
      const userId = await this.getLinkedUser();
      
      // Eliminar todos los datos del dispositivo
      await Promise.all([
        SecureStore.deleteItemAsync(this.DEVICE_ID_KEY),
        SecureStore.deleteItemAsync(this.DEVICE_LINK_KEY),
        userId ? SecureStore.deleteItemAsync(`${this.USER_DEVICE_KEY}${userId}`) : Promise.resolve()
      ]);

      console.log('Device unlinked successfully');
    } catch (error) {
      console.error('Error unlinking device:', error);
    }
  }

  /**
   * Verifica si el dispositivo puede ser usado por un usuario específico
   */
  async canUserAccessDevice(userId: number): Promise<boolean> {
    try {
      const linkedUserId = await this.getLinkedUser();
      
      // Si no está vinculado, permitir el acceso (nuevo usuario)
      if (!linkedUserId) return true;
      
      // Si está vinculado al mismo usuario, permitir
      return linkedUserId === userId;
    } catch (error) {
      console.error('Error checking device access:', error);
      return false;
    }
  }

  /**
   * Obtiene información del dispositivo vinculado
   */
  async getDeviceInfo(): Promise<DeviceInfo | null> {
    try {
      const linkData = await SecureStore.getItemAsync(this.DEVICE_LINK_KEY);
      
      if (!linkData) return null;
      
      const parsed = JSON.parse(linkData);
      return parsed.deviceInfo || null;
    } catch (error) {
      console.error('Error getting device info:', error);
      return null;
    }
  }

  /**
   * Verifica si es el primer uso del dispositivo
   */
  async isFirstTimeDevice(): Promise<boolean> {
    try {
      const linkedUserId = await this.getLinkedUser();
      return linkedUserId === null;
    } catch (error) {
      console.error('Error checking first time device:', error);
      return true;
    }
  }

  /**
   * Limpia todos los datos de autenticación (para testing o reset completo)
   */
  async resetDevice(): Promise<void> {
    try {
      await this.unlinkDevice();
      
      // También limpiar otros datos relacionados con autenticación
      const allKeys = await SecureStore.getItemAsync('all_keys') || '[]';
      const keys = JSON.parse(allKeys).filter((key: string) => 
        key.startsWith('quipuk_')
      );
      
      await Promise.all(
        keys.map((key: string) => SecureStore.deleteItemAsync(key))
      );
      
      console.log('Device reset completed');
    } catch (error) {
      console.error('Error resetting device:', error);
    }
  }
}

export const deviceManagementService = new DeviceManagementService();