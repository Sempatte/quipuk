import { cryptoService } from './cryptoService';
import { biometricService } from './biometricService';
import { 
  PinConfig, 
  PinVerificationResult, 
  PinCreationResult, 
  PinError,
  AuthLog,
  SecurityQuestion 
} from '../types/pin.types';

class PinService {
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;
  private readonly PIN_STORAGE_KEY = 'quipuk_user_pin';
  private readonly RECOVERY_QUESTIONS_KEY = 'quipuk_recovery_questions';

  // Crear PIN por primera vez
  async createPin(userId: number, pin: string, securityQuestions?: SecurityQuestion[]): Promise<PinCreationResult> {
    try {
      // Validar fuerza del PIN
      const validation = cryptoService.validatePinStrength(pin);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // Verificar que no exista PIN previo
      const existingConfig = await this.getPinConfig(userId);
      if (existingConfig.hasPin) {
        return {
          success: false,
          error: 'Ya tienes un PIN configurado'
        };
      }

      // Generar salt y hash
      const salt = await cryptoService.generateSalt();
      const hash = await cryptoService.hashPin(pin, salt);

      // Preparar datos para DB
      const pinData = {
        userId,
        pinHash: hash,
        pinSalt: salt,
        pinCreatedAt: new Date(),
        pinLastChanged: new Date(),
        pinAttempts: 0,
        pinLockedUntil: null
      };

      // Guardar en base de datos (aquí integrarías con tu API)
      await this.savePinToDatabase(pinData);

      // Guardar preguntas de seguridad si se proporcionan
      if (securityQuestions && securityQuestions.length > 0) {
        await this.saveSecurityQuestions(userId, securityQuestions);
      }

      // Log del evento
      await this.logAuthAttempt({
        userId,
        authType: 'PIN',
        status: 'SUCCESS',
        deviceInfo: { action: 'PIN_CREATED' }
      });

      return { success: true };

    } catch (error) {
      console.error('Error creating PIN:', error);
      return {
        success: false,
        error: 'Error al crear PIN'
      };
    }
  }

  // Verificar PIN
  async verifyPin(userId: number, pin: string): Promise<PinVerificationResult> {
    try {
      const config = await this.getPinConfig(userId);
      
      // Verificar si tiene PIN configurado
      if (!config.hasPin) {
        return {
          success: false,
          error: 'PIN no configurado'
        };
      }

      // Verificar si está bloqueado
      if (config.isLocked) {
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

      // Obtener datos del PIN desde DB
      const pinData = await this.getPinDataFromDatabase(userId);
      if (!pinData) {
        return {
          success: false,
          error: 'Error al verificar PIN'
        };
      }

      // Verificar PIN
      const isValid = await cryptoService.verifyPin(pin, pinData.hash, pinData.salt);

      if (isValid) {
        // PIN correcto - resetear intentos
        await this.resetPinAttempts(userId);
        
        await this.logAuthAttempt({
          userId,
          authType: 'PIN',
          status: 'SUCCESS'
        });

        return { success: true };
      } else {
        // PIN incorrecto - incrementar intentos
        const newAttempts = config.attempts + 1;
        const remainingAttempts = this.MAX_ATTEMPTS - newAttempts;

        if (newAttempts >= this.MAX_ATTEMPTS) {
          // Bloquear usuario
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
      console.error('Error verifying PIN:', error);
      return {
        success: false,
        error: 'Error al verificar PIN'
      };
    }
  }

  // Cambiar PIN existente
  async changePin(userId: number, currentPin: string, newPin: string): Promise<PinCreationResult> {
    try {
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

      // Actualizar en base de datos
      await this.updatePinInDatabase(userId, hash, salt);

      await this.logAuthAttempt({
        userId,
        authType: 'PIN',
        status: 'SUCCESS',
        deviceInfo: { action: 'PIN_CHANGED' }
      });

      return { success: true };

    } catch (error) {
      console.error('Error changing PIN:', error);
      return {
        success: false,
        error: 'Error al cambiar PIN'
      };
    }
  }

  // Obtener configuración del PIN
  async getPinConfig(userId: number): Promise<PinConfig> {
    try {
      const data = await this.getPinDataFromDatabase(userId);
      
      if (!data) {
        return {
          hasPin: false,
          attempts: 0,
          isLocked: false
        };
      }

      const isLocked = data.lockedUntil ? new Date(data.lockedUntil) > new Date() : false;

      return {
        hasPin: !!data.hash,
        attempts: data.attempts || 0,
        isLocked,
        lockedUntil: data.lockedUntil ? new Date(data.lockedUntil) : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : undefined,
        lastChanged: data.lastChanged ? new Date(data.lastChanged) : undefined
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

  // Eliminar PIN
  async removePin(userId: number, currentPin: string): Promise<PinCreationResult> {
    try {
      // Verificar PIN actual
      const verification = await this.verifyPin(userId, currentPin);
      if (!verification.success) {
        return {
          success: false,
          error: 'PIN incorrecto'
        };
      }

      // Eliminar de base de datos
      await this.deletePinFromDatabase(userId);

      await this.logAuthAttempt({
        userId,
        authType: 'PIN',
        status: 'SUCCESS',
        deviceInfo: { action: 'PIN_REMOVED' }
      });

      return { success: true };

    } catch (error) {
      console.error('Error removing PIN:', error);
      return {
        success: false,
        error: 'Error al eliminar PIN'
      };
    }
  }

  // Métodos privados para interactuar con la base de datos
  private async savePinToDatabase(pinData: any): Promise<void> {
    // Aquí integrarías con tu API para guardar en NeonDB
    const response = await fetch('/api/users/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pinData)
    });

    if (!response.ok) {
      throw new Error('Failed to save PIN');
    }
  }

  private async getPinDataFromDatabase(userId: number): Promise<any> {
    // Aquí integrarías con tu API para obtener datos del PIN
    const response = await fetch(`/api/users/${userId}/pin`);
    
    if (!response.ok) {
      return null;
    }

    return await response.json();
  }

  private async updatePinInDatabase(userId: number, hash: string, salt: string): Promise<void> {
    const response = await fetch(`/api/users/${userId}/pin`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        pinHash: hash, 
        pinSalt: salt, 
        pinLastChanged: new Date() 
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update PIN');
    }
  }

  private async deletePinFromDatabase(userId: number): Promise<void> {
    const response = await fetch(`/api/users/${userId}/pin`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete PIN');
    }
  }

  private async resetPinAttempts(userId: number): Promise<void> {
    await fetch(`/api/users/${userId}/pin/reset-attempts`, {
      method: 'POST'
    });
  }

  private async incrementPinAttempts(userId: number): Promise<void> {
    await fetch(`/api/users/${userId}/pin/increment-attempts`, {
      method: 'POST'
    });
  }

  private async lockUser(userId: number): Promise<void> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + this.LOCK_DURATION_MINUTES);

    await fetch(`/api/users/${userId}/pin/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lockUntil })
    });
  }

  private async saveSecurityQuestions(userId: number, questions: SecurityQuestion[]): Promise<void> {
    // Hash de las respuestas de seguridad
    const hashedQuestions = questions.map(q => ({
      ...q,
      answer: cryptoService.hashPin(q.answer.toLowerCase().trim(), userId.toString())
    }));

    await fetch(`/api/users/${userId}/security-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: hashedQuestions })
    });
  }

  private async logAuthAttempt(log: AuthLog): Promise<void> {
    try {
      await fetch('/api/auth/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
    } catch (error) {
      console.error('Error logging auth attempt:', error);
    }
  }
}

export const pinService = new PinService();