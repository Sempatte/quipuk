// app/services/emailVerificationService.ts - Corregido
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
   * ✅ Verificar código - CON TOKEN (para usuarios ya logueados)
   */
  async verifyCode(code: string): Promise<VerificationResult> {
    try {
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
   * ✅ Verificar código durante el registro - SIN TOKEN
   */
  async verifyCodeForRegistration(code: string, email: string, userId: number): Promise<VerificationResult> {
    try {
      console.log('📧 Verifying code for registration:', { code, email, userId });

      const response = await fetch(`${this.API_URL}/email/verify-code-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          email, 
          userId 
        }),
      });

      const result = await response.json();
      
      console.log('📧 Verification result:', result);

      return {
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
      };
    } catch (error) {
      console.error('❌ [EmailVerification] Error verifying code for registration:', error);
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
   * 🔄 Reenviar código durante el registro - SIN TOKEN
   */
  async resendVerificationCodeForRegistration(email: string, userId: number): Promise<VerificationResult> {
    try {
      console.log('📧 Resending code for registration:', { email, userId });

      const response = await fetch(`${this.API_URL}/email/resend-verification-code-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          userId 
        }),
      });

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message,
        statusCode: result.statusCode,
      };
    } catch (error) {
      console.error('❌ [EmailVerification] Error resending code for registration:', error);
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
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('📧 No authentication token found for verification status');
        return null;
      }

      const response = await fetch(`${this.API_URL}/email/verification-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (!response.ok || !result.success) {
        if (response.status === 401) {
          console.log('📧 Unauthorized access for verification status');
          return null;
        }
        throw new Error(result.message || 'Failed to get verification status');
      }

      return result.data;
    } catch (error) {
      console.log('📧 Info: Could not get verification status:', error instanceof Error ? error.message : error);
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
      const response = await fetch(`${this.API_URL}/auth/register-with-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();
      
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
      const response = await fetch(`${this.API_URL}/auth/login-after-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const result = await response.json();
      
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