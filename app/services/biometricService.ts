import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { BiometricConfig, AuthResult, BiometricError, User } from '../types/auth.types';

class BiometricService {
  private readonly BIOMETRIC_CONFIG_KEY = 'quipuk_biometric_config';
  private readonly USER_CREDENTIALS_KEY = 'quipuk_user_credentials';
  private readonly DEVICE_USER_KEY = 'quipuk_device_user';
  private failedAttempts = 0;
  private readonly MAX_ATTEMPTS = 3;

  // Verificar disponibilidad de Face ID
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

  // Verificar si el usuario tiene Face ID configurado en el dispositivo
  async isBiometricEnrolled(): Promise<boolean> {
    try {
      return await LocalAuthentication.isEnrolledAsync();
    } catch (error) {
      console.error('Error checking biometric enrollment:', error);
      return false;
    }
  }

  // Verificar si el dispositivo ya está vinculado a un usuario
  async getDeviceUser(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.DEVICE_USER_KEY);
    } catch (error) {
      console.error('Error getting device user:', error);
      return null;
    }
  }

  // Vincular dispositivo a usuario (como Yape)
  async linkDeviceToUser(userId: number): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.DEVICE_USER_KEY, userId.toString());
    } catch (error) {
      console.error('Error linking device to user:', error);
      throw new Error('No se pudo vincular el dispositivo');
    }
  }

  // Desvincular dispositivo
  async unlinkDevice(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.DEVICE_USER_KEY);
      await SecureStore.deleteItemAsync(this.BIOMETRIC_CONFIG_KEY);
      await SecureStore.deleteItemAsync(this.USER_CREDENTIALS_KEY);
    } catch (error) {
      console.error('Error unlinking device:', error);
    }
  }

  // Configurar biometría después del registro
  async setupBiometric(user: User): Promise<boolean> {
    try {
      // Verificar que el dispositivo no esté vinculado a otro usuario
      const existingUser = await this.getDeviceUser();
      if (existingUser && existingUser !== user.id.toString()) {
        throw new Error('Este dispositivo ya está vinculado a otra cuenta');
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
        promptMessage: 'Configura Face ID para Quipuk',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar contraseña',
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        const config: BiometricConfig = {
          isEnabled: true,
          deviceId: user.deviceId || 'unknown',
          userId: user.id.toString(), // Convertir a string para almacenamiento
          enrolledAt: new Date(),
        };

        await SecureStore.setItemAsync(this.BIOMETRIC_CONFIG_KEY, JSON.stringify(config));
        await this.linkDeviceToUser(user.id);
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error setting up biometric:', error);
      throw error;
    }
  }

  // Autenticar con Face ID
  async authenticateWithBiometric(): Promise<AuthResult> {
    try {
      const config = await this.getBiometricConfig();
      if (!config?.isEnabled) {
        return { success: false, error: 'Biometría no configurada' };
      }

      // Verificar usuario del dispositivo
      const deviceUser = await this.getDeviceUser();
      if (!deviceUser || deviceUser !== config.userId) {
        return { success: false, error: 'Dispositivo no autorizado' };
      }

      if (this.failedAttempts >= this.MAX_ATTEMPTS) {
        return { 
          success: false, 
          error: 'Demasiados intentos fallidos',
          requiresManualLogin: true 
        };
      }

      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Accede a Quipuk',
        cancelLabel: 'Cancelar',
        fallbackLabel: `Intentos restantes: ${this.MAX_ATTEMPTS - this.failedAttempts}`,
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        this.resetFailedAttempts();
        return { success: true };
      } else {
        this.failedAttempts++;
        
        if (this.failedAttempts >= this.MAX_ATTEMPTS) {
          return { 
            success: false, 
            error: 'Demasiados intentos fallidos. Ingresa tu contraseña.',
            requiresManualLogin: true 
          };
        }

        const error = this.mapBiometricError(authResult.error);
        return { 
          success: false, 
          error: `Face ID falló. Intentos restantes: ${this.MAX_ATTEMPTS - this.failedAttempts}` 
        };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return { success: false, error: 'Error de autenticación' };
    }
  }

  // Obtener configuración de biometría
  async getBiometricConfig(): Promise<BiometricConfig | null> {
    try {
      const configStr = await SecureStore.getItemAsync(this.BIOMETRIC_CONFIG_KEY);
      return configStr ? JSON.parse(configStr) : null;
    } catch (error) {
      console.error('Error getting biometric config:', error);
      return null;
    }
  }

  // Deshabilitar biometría
  async disableBiometric(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.BIOMETRIC_CONFIG_KEY);
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw new Error('No se pudo deshabilitar Face ID');
    }
  }

  // Resetear intentos fallidos
  resetFailedAttempts(): void {
    this.failedAttempts = 0;
  }

  // Mapear errores de biometría
  private mapBiometricError(error?: string): BiometricError {
    if (!error) return BiometricError.UNKNOWN;
    
    switch (error) {
      case 'UserCancel':
        return BiometricError.USER_CANCELLED;
      case 'SystemCancel':
        return BiometricError.SYSTEM_CANCELLED;
      case 'BiometryLockout':
        return BiometricError.LOCKOUT;
      case 'BiometryNotAvailable':
        return BiometricError.NOT_AVAILABLE;
      case 'BiometryNotEnrolled':
        return BiometricError.NOT_ENROLLED;
      default:
        return BiometricError.UNKNOWN;
    }
  }

  // Verificar si biometría está habilitada
  async isBiometricEnabled(): Promise<boolean> {
    const config = await this.getBiometricConfig();
    return config?.isEnabled || false;
  }
}

export const biometricService = new BiometricService();
