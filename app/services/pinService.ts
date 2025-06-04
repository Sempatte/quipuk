// app/services/pinService.ts - VERSIÓN CORREGIDA CON ALMACENAMIENTO LOCAL
import * as SecureStore from 'expo-secure-store';
import { cryptoService } from './cryptoService';
import { 
  PinConfig, 
  PinVerificationResult, 
  PinCreationResult, 
  AuthLog,
  SecurityQuestion 
} from '../types/pin.types';

interface StoredPinData {
  userId: number;
  pinHash: string;
  pinSalt: string;
  pinCreatedAt: string;
  pinLastChanged: string;
  pinAttempts: number;
  pinLockedUntil: string | null;
}

class PinService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;
  private readonly PIN_STORAGE_KEY = 'quipuk_user_pin_';
  private readonly RECOVERY_QUESTIONS_KEY = 'quipuk_recovery_questions_';
  private readonly AUTH_LOG_KEY = 'quipuk_auth_log_';

  // 🔧 MÉTODO AUXILIAR: Generar clave única por usuario
  private getPinKey(userId: number): string {
    return `${this.PIN_STORAGE_KEY}${userId}`;
  }

  private getRecoveryKey(userId: number): string {
    return `${this.RECOVERY_QUESTIONS_KEY}${userId}`;
  }

  private getAuthLogKey(userId: number): string {
    return `${this.AUTH_LOG_KEY}${userId}`;
  }

  // 🔧 CREAR PIN - VERSIÓN LOCAL
  async createPin(userId: number, pin: string, securityQuestions?: SecurityQuestion[]): Promise<PinCreationResult> {
    try {
      console.log('🔐 [PinService] Iniciando creación de PIN para usuario:', userId);

      // Validar fuerza del PIN
      const validation = cryptoService.validatePinStrength(pin);
      if (!validation.isValid) {
        console.log('❌ [PinService] PIN no válido:', validation.errors);
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Verificar que no exista PIN previo
      const existingConfig = await this.getPinConfig(userId);
      if (existingConfig.hasPin) {
        console.log('❌ [PinService] PIN ya existe para usuario:', userId);
        return {
          success: false,
          error: 'Ya tienes un PIN configurado'
        };
      }

      // Generar salt y hash
      console.log('🔐 [PinService] Generando hash del PIN...');
      const salt = await cryptoService.generateSalt();
      const hash = await cryptoService.hashPin(pin, salt);

      // Preparar datos para almacenamiento local
      const pinData: StoredPinData = {
        userId,
        pinHash: hash,
        pinSalt: salt,
        pinCreatedAt: new Date().toISOString(),
        pinLastChanged: new Date().toISOString(),
        pinAttempts: 0,
        pinLockedUntil: null
      };

      // Guardar en SecureStore
      console.log('💾 [PinService] Guardando PIN en SecureStore...');
      await SecureStore.setItemAsync(
        this.getPinKey(userId), 
        JSON.stringify(pinData)
      );

      // Guardar preguntas de seguridad si se proporcionan
      if (securityQuestions && securityQuestions.length > 0) {
        console.log('💾 [PinService] Guardando preguntas de seguridad...');
        await this.saveSecurityQuestions(userId, securityQuestions);
      }

      // Log del evento
      await this.logAuthAttempt({
        userId,
        authType: 'PIN',
        status: 'SUCCESS',
        deviceInfo: { action: 'PIN_CREATED', timestamp: new Date().toISOString() }
      });

      console.log('✅ [PinService] PIN creado exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ [PinService] Error creando PIN:', error);
      return {
        success: false,
        error: 'Error al crear PIN: ' + (error instanceof Error ? error.message : 'Error desconocido')
      };
    }
  }

  // 🔧 VERIFICAR PIN - VERSIÓN LOCAL
  async verifyPin(userId: number, pin: string): Promise<PinVerificationResult> {
    try {
      console.log('🔐 [PinService] Verificando PIN para usuario:', userId);

      const config = await this.getPinConfig(userId);
      
      // Verificar si tiene PIN configurado
      if (!config.hasPin) {
        console.log('❌ [PinService] PIN no configurado para usuario:', userId);
        return {
          success: false,
          error: 'PIN no configurado'
        };
      }

      // Verificar si está bloqueado
      if (config.isLocked) {
        console.log('🔒 [PinService] Usuario bloqueado:', userId);
        await this.logAuthAttempt({
          userId,
          authType: 'PIN',
          status: 'LOCKED',
          failureReason: 'User account locked'
        });

        return {
          success: false,
          isLocked: true,
          lockDuration: this.LOCK_DURATION_MINUTES,
          error: `Cuenta bloqueada. Intenta en ${this.LOCK_DURATION_MINUTES} minutos`
        };
      }

      // Obtener datos del PIN desde SecureStore
      const pinData = await this.getPinDataFromStorage(userId);
      if (!pinData) {
        console.log('❌ [PinService] No se pudo obtener datos del PIN');
        return {
          success: false,
          error: 'Error al verificar PIN'
        };
      }

      // Verificar PIN
      console.log('🔐 [PinService] Comparando PIN...');
      const isValid = await cryptoService.verifyPin(pin, pinData.pinHash, pinData.pinSalt);

      if (isValid) {
        // PIN correcto - resetear intentos
        console.log('✅ [PinService] PIN correcto');
        await this.resetPinAttempts(userId);
        
        await this.logAuthAttempt({
          userId,
          authType: 'PIN',
          status: 'SUCCESS'
        });

        return { success: true };
      } else {
        // PIN incorrecto - incrementar intentos
        console.log('❌ [PinService] PIN incorrecto');
        const newAttempts = config.attempts + 1;
        const remainingAttempts = this.MAX_ATTEMPTS - newAttempts;

        if (newAttempts >= this.MAX_ATTEMPTS) {
          // Bloquear usuario
          console.log('🔒 [PinService] Bloqueando usuario por intentos fallidos');
          await this.lockUser(userId);
          
          await this.logAuthAttempt({
            userId,
            authType: 'PIN',
            status: 'LOCKED',
            failureReason: 'Too many failed attempts'
          });

          return {
            success: false,
            isLocked: true,
            lockDuration: this.LOCK_DURATION_MINUTES,
            error: `Demasiados intentos. Cuenta bloqueada por ${this.LOCK_DURATION_MINUTES} minutos`
          };
        } else {
          // Incrementar intentos fallidos
          await this.incrementPinAttempts(userId);
          
          await this.logAuthAttempt({
            userId,
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
      console.error('❌ [PinService] Error verificando PIN:', error);
      return {
        success: false,
        error: 'Error al verificar PIN: ' + (error instanceof Error ? error.message : 'Error desconocido')
      };
    }
  }

  // 🔧 CAMBIAR PIN - VERSIÓN LOCAL
  async changePin(userId: number, currentPin: string, newPin: string): Promise<PinCreationResult> {
    try {
      console.log('🔐 [PinService] Cambiando PIN para usuario:', userId);

      // Verificar PIN actual
      const verification = await this.verifyPin(userId, currentPin);
      if (!verification.success) {
        return {
          success: false,
          error: verification.error || 'PIN actual incorrecto'
        };
      }

      // Validar nuevo PIN
      const validation = cryptoService.validatePinStrength(newPin);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Generar nuevo hash
      const salt = await cryptoService.generateSalt();
      const hash = await cryptoService.hashPin(newPin, salt);

      // Actualizar en storage
      await this.updatePinInStorage(userId, hash, salt);

      await this.logAuthAttempt({
        userId,
        authType: 'PIN',
        status: 'SUCCESS',
        deviceInfo: { action: 'PIN_CHANGED', timestamp: new Date().toISOString() }
      });

      console.log('✅ [PinService] PIN cambiado exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ [PinService] Error cambiando PIN:', error);
      return {
        success: false,
        error: 'Error al cambiar PIN: ' + (error instanceof Error ? error.message : 'Error desconocido')
      };
    }
  }

  // 🔧 OBTENER CONFIGURACIÓN DEL PIN
  async getPinConfig(userId: number): Promise<PinConfig> {
    try {
      const data = await this.getPinDataFromStorage(userId);
      
      if (!data) {
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
      console.error('❌ [PinService] Error obteniendo configuración PIN:', error);
      return {
        hasPin: false,
        attempts: 0,
        isLocked: false
      };
    }
  }

  // 🔧 ELIMINAR PIN
  async removePin(userId: number, currentPin: string): Promise<PinCreationResult> {
    try {
      console.log('🔐 [PinService] Eliminando PIN para usuario:', userId);

      // Verificar PIN actual
      const verification = await this.verifyPin(userId, currentPin);
      if (!verification.success) {
        return {
          success: false,
          error: 'PIN incorrecto'
        };
      }

      // Eliminar de storage
      await this.deletePinFromStorage(userId);

      await this.logAuthAttempt({
        userId,
        authType: 'PIN',
        status: 'SUCCESS',
        deviceInfo: { action: 'PIN_REMOVED', timestamp: new Date().toISOString() }
      });

      console.log('✅ [PinService] PIN eliminado exitosamente');
      return { success: true };

    } catch (error) {
      console.error('❌ [PinService] Error eliminando PIN:', error);
      return {
        success: false,
        error: 'Error al eliminar PIN: ' + (error instanceof Error ? error.message : 'Error desconocido')
      };
    }
  }

  // 🔧 MÉTODOS PRIVADOS PARA SECURESTORE
  private async getPinDataFromStorage(userId: number): Promise<StoredPinData | null> {
    try {
      const data = await SecureStore.getItemAsync(this.getPinKey(userId));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ [PinService] Error leyendo PIN desde storage:', error);
      return null;
    }
  }

  private async updatePinInStorage(userId: number, hash: string, salt: string): Promise<void> {
    try {
      const existingData = await this.getPinDataFromStorage(userId);
      if (!existingData) {
        throw new Error('PIN data not found');
      }

      const updatedData: StoredPinData = {
        ...existingData,
        pinHash: hash,
        pinSalt: salt,
        pinLastChanged: new Date().toISOString(),
        pinAttempts: 0, // Reset attempts
        pinLockedUntil: null // Remove lock
      };

      await SecureStore.setItemAsync(
        this.getPinKey(userId), 
        JSON.stringify(updatedData)
      );
    } catch (error) {
      console.error('❌ [PinService] Error actualizando PIN:', error);
      throw error;
    }
  }

  private async deletePinFromStorage(userId: number): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.getPinKey(userId));
      await SecureStore.deleteItemAsync(this.getRecoveryKey(userId));
    } catch (error) {
      console.error('❌ [PinService] Error eliminando PIN:', error);
      throw error;
    }
  }

  private async resetPinAttempts(userId: number): Promise<void> {
    try {
      const data = await this.getPinDataFromStorage(userId);
      if (data) {
        data.pinAttempts = 0;
        data.pinLockedUntil = null;
        await SecureStore.setItemAsync(
          this.getPinKey(userId), 
          JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error('❌ [PinService] Error reseteando intentos:', error);
    }
  }

  private async incrementPinAttempts(userId: number): Promise<void> {
    try {
      const data = await this.getPinDataFromStorage(userId);
      if (data) {
        data.pinAttempts = (data.pinAttempts || 0) + 1;
        await SecureStore.setItemAsync(
          this.getPinKey(userId), 
          JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error('❌ [PinService] Error incrementando intentos:', error);
    }
  }

  private async lockUser(userId: number): Promise<void> {
    try {
      const data = await this.getPinDataFromStorage(userId);
      if (data) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + this.LOCK_DURATION_MINUTES);
        
        data.pinLockedUntil = lockUntil.toISOString();
        await SecureStore.setItemAsync(
          this.getPinKey(userId), 
          JSON.stringify(data)
        );
      }
    } catch (error) {
      console.error('❌ [PinService] Error bloqueando usuario:', error);
    }
  }

  private async saveSecurityQuestions(userId: number, questions: SecurityQuestion[]): Promise<void> {
    try {
      // Hash de las respuestas de seguridad
      const hashedQuestions = await Promise.all(
        questions.map(async (q) => ({
          ...q,
          answer: await cryptoService.hashPin(q.answer.toLowerCase().trim(), userId.toString())
        }))
      );

      await SecureStore.setItemAsync(
        this.getRecoveryKey(userId),
        JSON.stringify(hashedQuestions)
      );
    } catch (error) {
      console.error('❌ [PinService] Error guardando preguntas de seguridad:', error);
    }
  }

  private async logAuthAttempt(log: AuthLog): Promise<void> {
    try {
      // Guardar log localmente (opcional)
      const existingLogs = await SecureStore.getItemAsync(this.getAuthLogKey(log.userId));
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push({
        ...log,
        timestamp: new Date().toISOString()
      });

      // Mantener solo los últimos 50 logs
      const trimmedLogs = logs.slice(-50);
      
      await SecureStore.setItemAsync(
        this.getAuthLogKey(log.userId),
        JSON.stringify(trimmedLogs)
      );
    } catch (error) {
      console.error('❌ [PinService] Error guardando log:', error);
    }
  }
}

export const pinService = new PinService();