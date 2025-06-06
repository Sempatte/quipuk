export interface PinConfig {
    hasPin: boolean;
    attempts: number;
    isLocked: boolean;
    lockedUntil?: Date;
    createdAt?: Date;
    lastChanged?: Date;
  }
  
  export interface PinVerificationResult {
    success: boolean;
    attemptsRemaining?: number;
    isLocked?: boolean;
    lockDuration?: number; // minutes
    error?: string;
    token?: string;
    user?: any;
  }
  
  export interface PinCreationResult {
    success: boolean;
    error?: string;
  }
  
  export enum PinError {
    INVALID_PIN = 'INVALID_PIN',
    PIN_TOO_WEAK = 'PIN_TOO_WEAK',
    USER_LOCKED = 'USER_LOCKED',
    PIN_REQUIRED = 'PIN_REQUIRED',
    PIN_ALREADY_EXISTS = 'PIN_ALREADY_EXISTS',
    DATABASE_ERROR = 'DATABASE_ERROR',
    RATE_LIMITED = 'RATE_LIMITED'
  }
  
  export interface SecurityQuestion {
    id: string;
    question: string;
    answer: string; // Será hasheado
  }
  
  export interface AuthLog {
    userId: number;
    authType: 'PIN' | 'BIOMETRIC' | 'PASSWORD';
    status: 'SUCCESS' | 'FAILED' | 'LOCKED';
    ipAddress?: string;
    deviceInfo?: any;
    failureReason?: string;
  }