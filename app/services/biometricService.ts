// app/services/BiometricService.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform, Alert } from 'react-native';
import { deviceManagementService } from './deviceManagementService';
import { BiometricConfig, AuthResult, BiometricError, User } from '../interfaces/auth.interface';

class BiometricService {
  private readonly BIOMETRIC_CONFIG_KEY = 'quipuk_biometric_config';
  private readonly MAX_ATTEMPTS = 3;
  private failedAttempts = 0;

  /**
   * Verifica disponibilidad de Face ID/TouchID
   */
  async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;

      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      return false;
    }
  }

  /**
   * Verifica si el usuario tiene biometría configurada en el dispositivo
   */
  async isBiometricEnrolled(): Promise<boolean> {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch (error) {
      console.error('Error checking biometric enrollment:', error);
      return false;
    }
  }

  /**
   * Configura biometría después del login exitoso (solo usuarios vinculados)
   */
  async setupBiometric(user: User): Promise<boolean> {
    try {
      // Verificar que el dispositivo esté vinculado a este usuario
      const canAccess = await deviceManagementService.canUserAccessDevice(user.id);
      if (!canAccess) {
        throw new Error('Dispositivo no autorizado para este usuario');
      }

      const isAvailable = await this.isBiometricAvailable();
      if (!isAvailable) {
        throw new Error('Face ID no está disponible en este dispositivo');
      }

      const isEnrolled = await this.isBiometricEnrolled();
      if (!isEnrolled) {
        throw new Error('Configura Face ID en Ajustes primero');
      }

      // Solicitar autenticación para configurar
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Configura Face ID para acceso rápido',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar PIN',
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        const deviceId = await deviceManagementService.getDeviceId();
        
        const config: BiometricConfig = {
          isEnabled: true,
          deviceId,
          userId: user.id.toString(),
          enrolledAt: new Date(),
        };

        await SecureStore.setItemAsync(this.BIOMETRIC_CONFIG_KEY, JSON.stringify(config));
        console.log('Biometric setup completed for user:', user.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error setting up biometric:', error);
      throw error;
    }
  }

  /**
   * Autentica con Face ID (solo para usuario vinculado)
   */
  async authenticateWithBiometric(): Promise<AuthResult> {
    try {
      const config = await this.getBiometricConfig();
      if (!config?.isEnabled) {
        return { success: false, error: 'Face ID no configurado' };
      }

      // Verificar que el dispositivo sigue vinculado al usuario correcto
      const linkedUserId = await deviceManagementService.getLinkedUser();
      if (!linkedUserId || linkedUserId.toString() !== config.userId) {
        await this.disableBiometric(); // Limpiar configuración inválida
        return { 
          success: false, 
          error: 'Configuración de Face ID inválida',
          requiresManualLogin: true 
        };
      }

      if (this.failedAttempts >= this.MAX_ATTEMPTS) {
        return { 
          success: false, 
          error: 'Demasiados intentos fallidos. Usa tu PIN.',
          requiresManualLogin: true 
        };
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Accede con Face ID',
        cancelLabel: 'Cancelar',
        fallbackLabel: `Intentos restantes: ${this.MAX_ATTEMPTS - this.failedAttempts}`,
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        this.resetFailedAttempts();
        console.log('Biometric authentication successful');
        return { success: true };
      } else {
        this.failedAttempts++;
        
        if (this.failedAttempts >= this.MAX_ATTEMPTS) {
          return { 
            success: false, 
            error: 'Demasiados intentos fallidos. Usa tu PIN.',
            requiresManualLogin: true 
          };
        }

        return { 
          success: false, 
          error: `Face ID falló. Intentos restantes: ${this.MAX_ATTEMPTS - this.failedAttempts}` 
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: 'Error de autenticación biométrica' };
    }
  }

  /**
   * Obtiene configuración de biometría
   */
  async getBiometricConfig(): Promise<BiometricConfig | null> {
    try {
      const configStr = await SecureStore.getItemAsync(this.BIOMETRIC_CONFIG_KEY);
      if (!configStr) return null;

      const config = JSON.parse(configStr);
      
      // Verificar que la configuración sigue siendo válida
      const linkedUserId = await deviceManagementService.getLinkedUser();
      if (!linkedUserId || linkedUserId.toString() !== config.userId) {
        await this.disableBiometric();
        return null;
      }

      return config;
    } catch (error) {
      console.error('Error getting biometric config:', error);
      return null;
    }
  }

  /**
   * Deshabilita biometría
   */
  async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_CONFIG_KEY);
      this.resetFailedAttempts();
      console.log('Biometric disabled');
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw new Error('No se pudo deshabilitar Face ID');
    }
  }

  /**
   * Verifica si biometría está habilitada para el usuario actual
   */
  async isBiometricEnabled(): Promise<boolean> {
    const config = await this.getBiometricConfig();
    if (!config) return false;

    // Verificar que el usuario vinculado coincida
    const linkedUserId = await deviceManagementService.getLinkedUser();
    return linkedUserId?.toString() === config.userId;
  }

  /**
   * Resetea intentos fallidos
   */
  resetFailedAttempts(): void {
    this.failedAttempts = 0;
  }

  /**
   * Limpia toda la configuración biométrica (al desvincular dispositivo)
   */
  async clearBiometricData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_CONFIG_KEY);
      this.resetFailedAttempts();
      console.log('Biometric data cleared');
    } catch (error) {
      console.error('Error clearing biometric data:', error);
    }
  }

  /**
   * Migra configuración existente para compatibilidad
   */
  async migrateLegacyConfig(): Promise<void> {
    try {
      const config = await this.getBiometricConfig();
      if (!config) return;

      // Verificar si necesita migración (verificar estructura)
      if (!config.deviceId) {
        const deviceId = await deviceManagementService.getDeviceId();
        config.deviceId = deviceId;
        
        await SecureStore.setItemAsync(this.BIOMETRIC_CONFIG_KEY, JSON.stringify(config));
        console.log('Biometric config migrated');
      }
    } catch (error) {
      console.error('Error migrating biometric config:', error);
    }
  }

  /**
   * Valida la integridad de la configuración biométrica
   */
  async validateBiometricIntegrity(): Promise<boolean> {
    try {
      const config = await this.getBiometricConfig();
      if (!config) return false;

      const linkedUserId = await deviceManagementService.getLinkedUser();
      const deviceId = await deviceManagementService.getDeviceId();

      return (
        linkedUserId?.toString() === config.userId &&
        deviceId === config.deviceId &&
        config.isEnabled
      );
    } catch (error) {
      console.error('Error validating biometric integrity:', error);
      return false;
    }
  }
}

export const biometricService = new BiometricService();