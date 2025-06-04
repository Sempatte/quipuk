// app/services/deviceManagementService.ts - FIXED TYPES AND IMPROVED
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// 🎯 IMPROVED INTERFACES WITH BETTER TYPING
export interface DeviceInfo {
  deviceId: string;
  userId: number;
  linkedAt: Date;
  deviceName: string;
  platform: string;
  deviceModel?: string; // Opcional, puede ser undefined
  osVersion?: string;   // Opcional, puede ser undefined
  deviceBrand?: string; // Agregado para mejor identificación
  systemVersion?: string; // Version más específica del OS
}

export interface DeviceLinkResult {
  success: boolean;
  error?: string;
  isAlreadyLinked?: boolean;
  linkedUserId?: number;
}

// 🎯 NUEVO: Interface para metadatos del dispositivo
export interface DeviceMetadata {
  deviceId: string;
  fingerprint: string; // Hash único del dispositivo
  capabilities: {
    biometrics: boolean;
    secureStorage: boolean;
    platform: string;
  };
  createdAt: string;
  lastAccess: string;
}

class DeviceManagementService {
  private readonly DEVICE_ID_KEY = 'quipuk_device_id';
  private readonly DEVICE_LINK_KEY = 'quipuk_device_link';
  private readonly DEVICE_METADATA_KEY = 'quipuk_device_metadata';
  private readonly USER_DEVICE_KEY = 'quipuk_user_device_';

  /**
   * 🎯 IMPROVED: Genera un ID único y fingerprint del dispositivo
   */
  private async generateDeviceId(): Promise<string> {
    try {
      const randomBytes = await Crypto.getRandomBytesAsync(16);
      const timestamp = Date.now().toString(36);
      
      // 🔧 FIX: Manejar correctamente los valores null/undefined
      const deviceModel = Device.modelName ?? 'unknown';
      const deviceBrand = Device.brand ?? 'unknown';
      const osVersion = Device.osVersion ?? 'unknown';
      
      const deviceInfo = `${Platform.OS}_${deviceModel}_${deviceBrand}`.toLowerCase();
      
      return `quipuk_${timestamp}_${this.bytesToHex(randomBytes)}_${deviceInfo}`;
    } catch (error) {
      console.error('Error generating device ID:', error);
      // Fallback si falla la generación
      return `quipuk_fallback_${Date.now()}_${Math.random().toString(36)}`;
    }
  }

  /**
   * 🎯 NUEVO: Genera fingerprint único del dispositivo
   */
  private async generateDeviceFingerprint(): Promise<string> {
    try {
      const components = [
        Platform.OS,
        Device.modelName ?? 'unknown',
        Device.brand ?? 'unknown', 
        Device.osVersion ?? 'unknown',
        Device.platformApiLevel?.toString() ?? 'unknown',
        Platform.Version.toString(),
      ];
      
      const fingerprintString = components.join('|');
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        fingerprintString
      );
      
      return hash;
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
      return 'fallback_fingerprint';
    }
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
        console.log('✅ New device ID generated:', deviceId.substring(0, 20) + '...');
      }
      
      return deviceId;
    } catch (error) {
      console.error('❌ Error getting device ID:', error);
      throw new Error('No se pudo obtener el ID del dispositivo');
    }
  }

  /**
   * 🎯 IMPROVED: Verifica si el dispositivo está vinculado a algún usuario
   */
  async getLinkedUser(): Promise<number | null> {
    try {
      const linkData = await SecureStore.getItemAsync(this.DEVICE_LINK_KEY);
      
      if (!linkData) {
        console.log('📱 Device not linked to any user');
        return null;
      }
      
      const parsed = JSON.parse(linkData);
      const userId = parsed.userId || null;
      
      if (userId) {
        console.log('📱 Device linked to user:', userId);
        // Actualizar último acceso
        await this.updateLastAccess();
      }
      
      return userId;
    } catch (error) {
      console.error('❌ Error getting linked user:', error);
      return null;
    }
  }

  /**
   * 🎯 IMPROVED: Vincula el dispositivo a un usuario con mejor validación
   */
  async linkDeviceToUser(userId: number): Promise<DeviceLinkResult> {
    try {
      console.log('🔗 Attempting to link device to user:', userId);

      // Verificar si ya está vinculado
      const existingUserId = await this.getLinkedUser();
      if (existingUserId && existingUserId !== userId) {
        console.warn('⚠️ Device already linked to different user:', existingUserId);
        return {
          success: false,
          error: 'Este dispositivo ya está vinculado a otra cuenta',
          isAlreadyLinked: true,
          linkedUserId: existingUserId
        };
      }

      if (existingUserId === userId) {
        console.log('✅ Device already linked to same user');
        return { success: true };
      }

      const deviceId = await this.getDeviceId();
      const fingerprint = await this.generateDeviceFingerprint();
      
      // 🔧 FIX: Convertir correctamente null a undefined
      const deviceInfo: DeviceInfo = {
        deviceId,
        userId,
        linkedAt: new Date(),
        deviceName: Device.deviceName ?? `Dispositivo ${Platform.OS}`,
        platform: Platform.OS,
        deviceModel: Device.modelName ?? undefined, // null -> undefined
        osVersion: Device.osVersion ?? undefined,   // null -> undefined
        deviceBrand: Device.brand ?? undefined,
        systemVersion: Platform.Version.toString(),
      };

      // Crear metadatos del dispositivo
      const metadata: DeviceMetadata = {
        deviceId,
        fingerprint,
        capabilities: {
          biometrics: Platform.OS === 'ios', // Solo iOS por ahora
          secureStorage: true,
          platform: Platform.OS,
        },
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
      };

      // Guardar vinculación del dispositivo
      await SecureStore.setItemAsync(
        this.DEVICE_LINK_KEY, 
        JSON.stringify({
          userId,
          linkedAt: deviceInfo.linkedAt.toISOString(),
          deviceInfo,
          fingerprint,
        })
      );

      // Guardar metadatos
      await SecureStore.setItemAsync(
        this.DEVICE_METADATA_KEY,
        JSON.stringify(metadata)
      );

      // Guardar info del dispositivo para el usuario
      await SecureStore.setItemAsync(
        `${this.USER_DEVICE_KEY}${userId}`,
        JSON.stringify(deviceInfo)
      );

      console.log('✅ Device linked successfully to user:', userId);
      return { success: true };

    } catch (error) {
      console.error('❌ Error linking device:', error);
      return {
        success: false,
        error: 'Error al vincular dispositivo: ' + (error instanceof Error ? error.message : 'Error desconocido')
      };
    }
  }

  /**
   * 🎯 IMPROVED: Desvincula el dispositivo con limpieza completa
   */
  async unlinkDevice(): Promise<void> {
    try {
      const userId = await this.getLinkedUser();
      console.log('🔓 Unlinking device from user:', userId);
      
      // Lista de todas las claves a eliminar
      const keysToDelete = [
        this.DEVICE_ID_KEY,
        this.DEVICE_LINK_KEY,
        this.DEVICE_METADATA_KEY,
      ];

      // Agregar clave específica del usuario si existe
      if (userId) {
        keysToDelete.push(`${this.USER_DEVICE_KEY}${userId}`);
      }

      // Eliminar todas las claves en paralelo
      await Promise.allSettled(
        keysToDelete.map(key => SecureStore.deleteItemAsync(key))
      );

      console.log('✅ Device unlinked successfully');
    } catch (error) {
      console.error('❌ Error unlinking device:', error);
      throw new Error('Error al desvincular dispositivo');
    }
  }

  /**
   * 🎯 IMPROVED: Verifica acceso con validación de fingerprint
   */
  async canUserAccessDevice(userId: number): Promise<boolean> {
    try {
      const linkedUserId = await this.getLinkedUser();
      
      // Si no está vinculado, permitir el acceso (primer uso)
      if (!linkedUserId) {
        console.log('📱 Device not linked, allowing access for new user');
        return true;
      }
      
      // Si está vinculado al mismo usuario, verificar integridad
      if (linkedUserId === userId) {
        const isIntegrityValid = await this.validateDeviceIntegrity();
        if (!isIntegrityValid) {
          console.warn('⚠️ Device integrity validation failed');
          return false;
        }
        
        console.log('✅ User can access device');
        return true;
      }

      console.warn('❌ User cannot access device - linked to different user');
      return false;
    } catch (error) {
      console.error('❌ Error checking device access:', error);
      return false;
    }
  }

  /**
   * 🎯 NUEVO: Valida la integridad del dispositivo
   */
  async validateDeviceIntegrity(): Promise<boolean> {
    try {
      const metadata = await this.getDeviceMetadata();
      if (!metadata) return false;

      const currentFingerprint = await this.generateDeviceFingerprint();
      
      if (metadata.fingerprint !== currentFingerprint) {
        console.warn('⚠️ Device fingerprint mismatch');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Error validating device integrity:', error);
      return false;
    }
  }

  /**
   * 🎯 NUEVO: Obtiene metadatos del dispositivo
   */
  async getDeviceMetadata(): Promise<DeviceMetadata | null> {
    try {
      const metadataStr = await SecureStore.getItemAsync(this.DEVICE_METADATA_KEY);
      return metadataStr ? JSON.parse(metadataStr) : null;
    } catch (error) {
      console.error('❌ Error getting device metadata:', error);
      return null;
    }
  }

  /**
   * 🎯 NUEVO: Actualiza último acceso
   */
  private async updateLastAccess(): Promise<void> {
    try {
      const metadata = await this.getDeviceMetadata();
      if (metadata) {
        metadata.lastAccess = new Date().toISOString();
        await SecureStore.setItemAsync(
          this.DEVICE_METADATA_KEY,
          JSON.stringify(metadata)
        );
      }
    } catch (error) {
      console.error('❌ Error updating last access:', error);
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
      console.error('❌ Error getting device info:', error);
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
      console.error('❌ Error checking first time device:', error);
      return true;
    }
  }

  /**
   * 🎯 IMPROVED: Reset completo con logs
   */
  async resetDevice(): Promise<void> {
    try {
      console.log('🔄 Starting complete device reset...');
      
      await this.unlinkDevice();
      
      // Limpiar cualquier otra clave relacionada con Quipuk
      const allPossibleKeys = [
        'quipuk_biometric_config',
        'quipuk_device_pin',
        'quipuk_pin_auth_log',
        'quipuk_master_key_v1',
      ];
      
      await Promise.allSettled(
        allPossibleKeys.map(key => SecureStore.deleteItemAsync(key))
      );
      
      console.log('✅ Complete device reset completed');
    } catch (error) {
      console.error('❌ Error resetting device:', error);
      throw new Error('Error al resetear dispositivo');
    }
  }

  /**
   * 🎯 NUEVO: Obtiene estadísticas del dispositivo para debugging
   */
  async getDeviceStats(): Promise<{
    deviceId: string;
    isLinked: boolean;
    linkedUserId?: number;
    linkDate?: string;
    lastAccess?: string;
    hasMetadata: boolean;
    fingerprint?: string;
  }> {
    try {
      const deviceId = await this.getDeviceId();
      const linkedUserId = await this.getLinkedUser();
      const metadata = await this.getDeviceMetadata();
      const deviceInfo = await this.getDeviceInfo();

      return {
        deviceId: deviceId.substring(0, 20) + '...', // Truncar para seguridad
        isLinked: linkedUserId !== null,
        linkedUserId: linkedUserId ?? undefined,
        linkDate: deviceInfo?.linkedAt.toISOString(),
        lastAccess: metadata?.lastAccess,
        hasMetadata: metadata !== null,
        fingerprint: metadata?.fingerprint?.substring(0, 16) + '...', // 🔧 FIX: Optional chaining
      };
    } catch (error) {
      console.error('❌ Error getting device stats:', error);
      return {
        deviceId: 'error',
        isLinked: false,
        hasMetadata: false,
      };
    }
  }
}

export const deviceManagementService = new DeviceManagementService();