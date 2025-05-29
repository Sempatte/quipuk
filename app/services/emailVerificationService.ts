// app/services/emailVerificationService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '@/app/config/env';

export interface VerificationResult {
  success: boolean;
  message: string;
  statusCode?: number;
}

export interface VerificationStatus {
  isVerified: boolean;
  hasPendingVerification: boolean;
  canResend: boolean;
  attemptsRemaining?: number;
}

class EmailVerificationService {
  private readonly API_URL = env.API_URL;

  /**
   * 📧 Enviar código de verificación
   */
  async sendVerificationCode(email: string): Promise<VerificationResult> {
    try {
      console.log('📧 [EmailVerification] Sending verification code to:', email);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.API_URL}/email/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      
      console.log('📧 [EmailVerification] Send verification response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to send verification code');
      }

      return {
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
      };
    } catch (error) {
      console.error('❌ [EmailVerification] Error sending verification code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error sending verification code',
      };
    }
  }

  /**
   * ✅ Verificar código
   */
  async verifyCode(code: string): Promise<VerificationResult> {
    try {
      console.log('✅ [EmailVerification] Verifying code:', code);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.API_URL}/email/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();
      
      console.log('✅ [EmailVerification] Verify code response:', result);
      
      return {
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
      };
    } catch (error) {
      console.error('❌ [EmailVerification] Error verifying code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error verifying code',
      };
    }
  }

  /**
   * 🔄 Reenviar código de verificación
   */
  async resendVerificationCode(): Promise<VerificationResult> {
    try {
      console.log('🔄 [EmailVerification] Resending verification code');
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.API_URL}/email/resend-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      console.log('🔄 [EmailVerification] Resend verification response:', result);
      
      return {
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
      };
    } catch (error) {
      console.error('❌ [EmailVerification] Error resending verification code:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Error resending verification code',
      };
    }
  }

  /**
   * 📊 Obtener estado de verificación
   */
  async getVerificationStatus(): Promise<VerificationStatus | null> {
    try {
      console.log('📊 [EmailVerification] Getting verification status');
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${this.API_URL}/email/verification-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      console.log('📊 [EmailVerification] Verification status response:', result);
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to get verification status');
      }

      return result.data;
    } catch (error) {
      console.error('❌ [EmailVerification] Error getting verification status:', error);
      return null;
    }
  }

  /**
   * 🆕 Registrar usuario con verificación de email
   */
  async registerWithEmailVerification(userData: {
    fullName: string;
    email: string;
    username: string;
    password: string;
    phoneNumber?: string;
  }): Promise<{
    success: boolean;
    message: string;
    userId?: number;
    needsVerification?: boolean;
    emailError?: boolean;
  }> {
    try {
      console.log('📝 [EmailVerification] Registering user:', userData.email);

      const response = await fetch(`${this.API_URL}/auth/register-with-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      
      console.log('📝 [EmailVerification] Register response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      return result;
    } catch (error) {
      console.error('❌ [EmailVerification] Error registering user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  }

  /**
   * 🔑 Login después de verificación
   */
  async loginAfterVerification(userId: number): Promise<{
    success: boolean;
    accessToken?: string;
    user?: any;
    message?: string;
  }> {
    try {
      console.log('🔑 [EmailVerification] Login after verification for user:', userId);

      const response = await fetch(`${this.API_URL}/auth/login-after-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      
      console.log('🔑 [EmailVerification] Login after verification response:', result);
      
      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }

      // Guardar token si el login fue exitoso
      if (result.accessToken) {
        await AsyncStorage.setItem('token', result.accessToken);
        await AsyncStorage.setItem('userId', result.user.id.toString());
      }

      return {
        success: true,
        accessToken: result.accessToken,
        user: result.user,
      };
    } catch (error) {
      console.error('❌ [EmailVerification] Error login after verification:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }
}

// Exportar instancia singleton
export const emailVerificationService = new EmailVerificationService();