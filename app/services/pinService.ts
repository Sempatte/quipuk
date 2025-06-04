// app/services/pinService.ts
import * as SecureStore from 'expo-secure-store';
import { cryptoService } from './cryptoService';
import { deviceManagementService } from './deviceManagementService';
import { 
  PinConfig, 
  PinVerificationResult, 
  PinCreationResult, 
  AuthLog
} from '../types/pin.types';

interface StoredPinData {
  userId: number;
  pinHash: string;
  pinSalt: string;
  deviceId: string;
  pinCreatedAt: string;
  pinLastChanged: string;
  pinAttempts: number;
  pinLockedUntil: string | null;
}

class PinService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;
  private readonly PIN_STORAGE_KEY = 'quipuk_device_pin';
  private readonly AUTH_LOG_KEY = 'quipuk_pin_auth_log';

  /**
   * Crea PIN para el usuario vinculado al dispositivo
   */
  async createPin(userId: number, pin: string): Promise<PinCreationResult> {
    try {
      console.log('Creating PIN for user:', userId);

      // Verificar que el dispositivo esté vinculado a este usuario
      const canAccess = await deviceManagementService.canUserAccessDevice(userId);
      if (!canAccess) {
        return {
          success: false,
          error: 'Dispositivo no autorizado para este usuario'
        };
      }

      // Validar fuerza del PIN
      const validation = cryptoService.validatePinStrength(pin);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Verificar que no exista PIN previo
      const existingConfig = await this.getPinConfig();
      if (existingConfig.hasPin) {
        return {
          success: false,
          error: 'Ya tienes un PIN configurado en este dispositivo'
        };
      }

      // Generar salt y hash
      const salt = await cryptoService.generateSalt();
      const hash = await cryptoService.hashPin(pin, salt);
      const deviceId = await deviceManagementService.getDeviceId();

      const pinData: StoredPinData = {
        userId,
        pinHash: hash,
        pinSalt: salt,
        deviceId,
        pinCreatedAt: new Date().toISOString(),
        pinLastChanged: new Date().toISOString(),
        pinAttempts: 0,
        pinLockedUntil: null
      };

      await SecureStore.setItemAsync(this.PIN_STORAGE_KEY, JSON.stringify(pinData));

      await this.logAuthAttempt({
        userId,
        authType: 'PIN',
        status: 'SUCCESS',
        deviceInfo: { action: 'PIN_CREATED', timestamp: new Date().toISOString() }
      });

      console.log('PIN created successfully');
      return { success: true };

    } catch (error) {
      console.error('Error creating PIN:', error);
      return {
        success: false,
        error: 'Error al crear PIN: ' + (error instanceof Error ? error.message : 'Error desconocido')
      };
    }
  }

  /**
   * Verifica PIN del usuario vinculado
   */
  async verifyPin(pin: string): Promise<PinVerificationResult> {
    try {
      console.log('Verifying PIN');

      const config = await this.getPinConfig();
      
      if (!config.hasPin) {
        return {
          success: false,
          error: 'PIN no configurado en este dispositivo'
        };
      }

      if (config.isLocked) {
        await this.logAuthAttempt({
          userId: 0, // Se obtendrá del storage
          authType: 'PIN',
          status: 'LOCKED',
          failureReason: 'Device locked'
        });

        return {
          success: false,
          isLocked: true,
          lockDuration: this.LOCK_DURATION_MINUTES,
          error: `Dispositivo bloqueado. Intenta en ${this.LOCK_DURATION_MINUTES} minutos`
        };
      }

      const pinData = await this.getPinDataFromStorage();
      if (!pinData) {
        return {
          success: false,
          error: 'Error al verificar PIN'
        };
      }

      // Verificar que el dispositivo sigue siendo válido
      const currentDeviceId = await deviceManagementService.getDeviceId();
      if (pinData.deviceId !== currentDeviceId) {
        await this.clearPinData();
        return {
          success: false,
          error: 'Configuración de PIN inválida'
        };
      }

      // Verificar que el usuario sigue vinculado
      const linkedUserId = await deviceManagementService.getLinkedUser();
      if (!linkedUserId || linkedUserId !== pinData.userId) {
        await this.clearPinData();
        return {
          success: false,
          error: 'Usuario no autorizado en este dispositivo'
        };
      }

      const isValid = await cryptoService.verifyPin(pin, pinData.pinHash, pinData.pinSalt);

      if (isValid) {
        await this.resetPinAttempts();
        
        await this.logAuthAttempt({
          userId: pinData.userId,
          authType: 'PIN',
          status: 'SUCCESS'
        });

        console.log('PIN verification successful');
        return { success: true };
      } else {
        const newAttempts = config.attempts + 1;
        const remainingAttempts = this.MAX_ATTEMPTS - newAttempts;

        if (newAttempts >= this.MAX_ATTEMPTS) {
          await this.lockDevice();
          
          await this.logAuthAttempt({
            userId: pinData.userId,
            authType: 'PIN',
            status: 'LOCKED',
            failureReason: 'Too many failed attempts'
          });

          return {
            success: false,
            isLocked: true,
            lockDuration: this.LOCK_DURATION_MINUTES,
            error: `Demasiados intentos. Dispositivo bloqueado por ${this.LOCK_DURATION_MINUTES} minutos`
          };
        } else {
          await this.incrementPinAttempts();
          
          await this.logAuthAttempt({
            userId: pinData.userId,
            authType: 'PIN',
            status: 'FAILED',
            failureReason: 'Invalid PIN'
          });

          return {
            success: false,
            attemptsRemaining: remainingAttempts,
            error: `PIN incorrecto. Te quedan ${remainingAttempts} intentos`
          };
        }
      }

    } catch (error) {
      console.error('Error verifying PIN:', error);
      return {
        success: false,
        error: 'Error al verificar PIN'
      };
    }
  }

  /**
   * Cambia PIN existente
   */
  async changePin(currentPin: string, newPin: string): Promise<PinCreationResult> {
    try {
      console.log('Changing PIN');

      const verification = await this.verifyPin(currentPin);
      if (!verification.success) {
        return {
          success: false,
          error: verification.error || 'PIN actual incorrecto'
        };
      }

      const validation = cryptoService.validatePinStrength(newPin);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const salt = await cryptoService.generateSalt();
      const hash = await cryptoService.hashPin(newPin, salt);

      await this.updatePinInStorage(hash, salt);

      const pinData = await this.getPinDataFromStorage();
      if (pinData) {
        await this.logAuthAttempt({
          userId: pinData.userId,
          authType: 'PIN',
          status: 'SUCCESS',
          deviceInfo: { action: 'PIN_CHANGED', timestamp: new Date().toISOString() }
        });
      }

      console.log('PIN changed successfully');
      return { success: true };

    } catch (error) {
      console.error('Error changing PIN:', error);
      return {
        success: false,
        error: 'Error al cambiar PIN'
      };
    }
  }

  /**
   * Obtiene configuración del PIN para el dispositivo actual
   */
  async getPinConfig(): Promise<PinConfig> {
    try {
      const data = await this.getPinDataFromStorage();
      
      if (!data) {
        return {
          hasPin: false,
          attempts: 0,
          isLocked: false
        };
      }

      // Verificar validez del dispositivo y usuario
      const currentDeviceId = await deviceManagementService.getDeviceId();
      const linkedUserId = await deviceManagementService.getLinkedUser();
      
      if (data.deviceId !== currentDeviceId || !linkedUserId || linkedUserId !== data.userId) {
        await this.clearPinData();
        return {
          hasPin: false,
          attempts: 0,
          isLocked: false
        };
      }

      const isLocked = data.pinLockedUntil ? new Date(data.pinLockedUntil) > new Date() : false;

      return {
        hasPin: !!data.pinHash,
        attempts: data.pinAttempts || 0,
        isLocked,
        lockedUntil: data.pinLockedUntil ? new Date(data.pinLockedUntil) : undefined,
        createdAt: data.pinCreatedAt ? new Date(data.pinCreatedAt) : undefined,
        lastChanged: data.pinLastChanged ? new Date(data.pinLastChanged) : undefined
      };

    } catch (error) {
      console.error('Error getting PIN config:', error);
      return {
        hasPin: false,
        attempts: 0,
        isLocked: false
      };
    }
  }

  /**
   * Elimina PIN del dispositivo
   */
  async removePin(currentPin: string): Promise<PinCreationResult> {
    try {
      console.log('Removing PIN');

      const verification = await this.verifyPin(currentPin);
      if (!verification.success) {
        return {
          success: false,
          error: 'PIN incorrecto'
        };
      }

      const pinData = await this.getPinDataFromStorage();
      
      await this.clearPinData();

      if (pinData) {
        await this.logAuthAttempt({
          userId: pinData.userId,
          authType: 'PIN',
          status: 'SUCCESS',
          deviceInfo: { action: 'PIN_REMOVED', timestamp: new Date().toISOString() }
        });
      }

      console.log('PIN removed successfully');
      return { success: true };

    } catch (error) {
      console.error('Error removing PIN:', error);
      return {
        success: false,
        error: 'Error al eliminar PIN'
      };
    }
  }

  /**
   * Limpia todos los datos de PIN (al desvincular dispositivo)
   */
  async clearPinData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.PIN_STORAGE_KEY);
      console.log('PIN data cleared');
    } catch (error) {
      console.error('Error clearing PIN data:', error);
    }
  }

  // Métodos privados
  private async getPinDataFromStorage(): Promise<StoredPinData | null> {
    try {
      const data = await SecureStore.getItemAsync(this.PIN_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading PIN from storage:', error);
      return null;
    }
  }

  private async updatePinInStorage(hash: string, salt: string): Promise<void> {
    try {
      const existingData = await this.getPinDataFromStorage();
      if (!existingData) {
        throw new Error('PIN data not found');
      }

      const updatedData: StoredPinData = {
        ...existingData,
        pinHash: hash,
        pinSalt: salt,
        pinLastChanged: new Date().toISOString(),
        pinAttempts: 0,
        pinLockedUntil: null
      };

      await SecureStore.setItemAsync(this.PIN_STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error updating PIN:', error);
      throw error;
    }
  }

  private async resetPinAttempts(): Promise<void> {
    try {
      const data = await this.getPinDataFromStorage();
      if (data) {
        data.pinAttempts = 0;
        data.pinLockedUntil = null;
        await SecureStore.setItemAsync(this.PIN_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error resetting PIN attempts:', error);
    }
  }

  private async incrementPinAttempts(): Promise<void> {
    try {
      const data = await this.getPinDataFromStorage();
      if (data) {
        data.pinAttempts = (data.pinAttempts || 0) + 1;
        await SecureStore.setItemAsync(this.PIN_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error incrementing PIN attempts:', error);
    }
  }

  private async lockDevice(): Promise<void> {
    try {
      const data = await this.getPinDataFromStorage();
      if (data) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + this.LOCK_DURATION_MINUTES);
        
        data.pinLockedUntil = lockUntil.toISOString();
        await SecureStore.setItemAsync(this.PIN_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error locking device:', error);
    }
  }

  private async logAuthAttempt(log: AuthLog): Promise<void> {
    try {
      const existingLogs = await SecureStore.getItemAsync(this.AUTH_LOG_KEY);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push({
        ...log,
        timestamp: new Date().toISOString()
      });

      const trimmedLogs = logs.slice(-50);
      
      await SecureStore.setItemAsync(this.AUTH_LOG_KEY, JSON.stringify(trimmedLogs));
    } catch (error) {
      console.error('Error logging auth attempt:', error);
    }
  }
}

export const pinService = new PinService();