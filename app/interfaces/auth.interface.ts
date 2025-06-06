export interface BiometricConfig {
  isEnabled: boolean;
  deviceId: string;
  userId: string; // Mantenemos como string para almacenamiento en SecureStore
  enrolledAt: Date;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  requiresManualLogin?: boolean;
}

export enum BiometricError {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  NOT_ENROLLED = 'NOT_ENROLLED',
  USER_CANCELLED = 'USER_CANCELLED',
  SYSTEM_CANCELLED = 'SYSTEM_CANCELLED',
  LOCKOUT = 'LOCKOUT',
  LOCKOUT_PERMANENT = 'LOCKOUT_PERMANENT',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  UNKNOWN = 'UNKNOWN'
}

export interface User {
  id: number; // Cambiado de string a number para coincidir con la DB
  email: string;
  deviceId?: string;
}