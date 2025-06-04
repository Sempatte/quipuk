// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { deviceManagementService } from '@/app/services/deviceManagementService';
import { biometricService } from '@/app/services/biometricService';
import { pinService } from '@/app/services/pinService';
import { AuthResult, User } from '@/app/types/auth.types';
import { PinConfig, PinVerificationResult, PinCreationResult } from '@/app/types/pin.types';

export interface AuthState {
  isLoading: boolean;
  isLinkedDevice: boolean;
  linkedUserId: number | null;
  hasBiometric: boolean;
  hasPin: boolean;
  canUseBiometric: boolean;
  pinConfig: PinConfig;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isLinkedDevice: false,
    linkedUserId: null,
    hasBiometric: false,
    hasPin: false,
    canUseBiometric: false,
    pinConfig: {
      hasPin: false,
      attempts: 0,
      isLocked: false
    }
  });

  // Cargar estado inicial
  const loadAuthState = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const [
        linkedUserId,
        isBiometricAvailable,
        isBiometricEnabled,
        pinConfig
      ] = await Promise.all([
        deviceManagementService.getLinkedUser(),
        biometricService.isBiometricAvailable(),
        biometricService.isBiometricEnabled(),
        pinService.getPinConfig()
      ]);

      setAuthState({
        isLoading: false,
        isLinkedDevice: linkedUserId !== null,
        linkedUserId,
        hasBiometric: isBiometricEnabled,
        hasPin: pinConfig.hasPin,
        canUseBiometric: isBiometricAvailable && isBiometricEnabled,
        pinConfig
      });

    } catch (error) {
      console.error('Error loading auth state:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Vincular dispositivo después del registro exitoso
  const linkDevice = useCallback(async (userId: number): Promise<boolean> => {
    try {
      const result = await deviceManagementService.linkDeviceToUser(userId);
      
      if (result.success) {
        await loadAuthState();
        return true;
      } else {
        console.error('Device linking failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error linking device:', error);
      return false;
    }
  }, [loadAuthState]);

  // Configurar biometría
  const setupBiometric = useCallback(async (user: User): Promise<boolean> => {
    try {
      const success = await biometricService.setupBiometric(user);
      if (success) {
        await loadAuthState();
      }
      return success;
    } catch (error) {
      console.error('Error setting up biometric:', error);
      throw error;
    }
  }, [loadAuthState]);

  // Autenticar con biometría
  const authenticateWithBiometric = useCallback(async (): Promise<AuthResult> => {
    try {
      return await biometricService.authenticateWithBiometric();
    } catch (error) {
      console.error('Error with biometric auth:', error);
      return { success: false, error: 'Error de autenticación biométrica' };
    }
  }, []);

  // Crear PIN
  const createPin = useCallback(async (userId: number, pin: string): Promise<PinCreationResult> => {
    try {
      const result = await pinService.createPin(userId, pin);
      if (result.success) {
        await loadAuthState();
      }
      return result;
    } catch (error) {
      console.error('Error creating PIN:', error);
      return { success: false, error: 'Error al crear PIN' };
    }
  }, [loadAuthState]);

  // Verificar PIN
  const verifyPin = useCallback(async (pin: string): Promise<PinVerificationResult> => {
    try {
      const result = await pinService.verifyPin(pin);
      await loadAuthState(); // Actualizar estado después de verificación
      return result;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return { success: false, error: 'Error al verificar PIN' };
    }
  }, [loadAuthState]);

  // Cambiar PIN
  const changePin = useCallback(async (currentPin: string, newPin: string): Promise<PinCreationResult> => {
    try {
      const result = await pinService.changePin(currentPin, newPin);
      if (result.success) {
        await loadAuthState();
      }
      return result;
    } catch (error) {
      console.error('Error changing PIN:', error);
      return { success: false, error: 'Error al cambiar PIN' };
    }
  }, [loadAuthState]);

  // Eliminar PIN
  const removePin = useCallback(async (currentPin: string): Promise<PinCreationResult> => {
    try {
      const result = await pinService.removePin(currentPin);
      if (result.success) {
        await loadAuthState();
      }
      return result;
    } catch (error) {
      console.error('Error removing PIN:', error);
      return { success: false, error: 'Error al eliminar PIN' };
    }
  }, [loadAuthState]);

  // Deshabilitar biometría
  const disableBiometric = useCallback(async (): Promise<void> => {
    try {
      await biometricService.disableBiometric();
      await loadAuthState();
    } catch (error) {
      console.error('Error disabling biometric:', error);
      throw error;
    }
  }, [loadAuthState]);

  // Verificar si puede acceder al dispositivo
  const canUserAccessDevice = useCallback(async (userId: number): Promise<boolean> => {
    try {
      return await deviceManagementService.canUserAccessDevice(userId);
    } catch (error) {
      console.error('Error checking device access:', error);
      return false;
    }
  }, []);

  // Limpiar todos los datos (solo para desarrollo/testing)
  const resetDevice = useCallback(async (): Promise<void> => {
    try {
      await Promise.all([
        deviceManagementService.resetDevice(),
        biometricService.clearBiometricData(),
        pinService.clearPinData()
      ]);
      await loadAuthState();
    } catch (error) {
      console.error('Error resetting device:', error);
    }
  }, [loadAuthState]);

  return {
    // Estado
    ...authState,
    
    // Acciones principales
    linkDevice,
    setupBiometric,
    authenticateWithBiometric,
    createPin,
    verifyPin,
    changePin,
    removePin,
    disableBiometric,
    
    // Utilidades
    canUserAccessDevice,
    loadAuthState,
    resetDevice, // Solo para desarrollo
    
    // Estado computado
    requiresSetup: authState.isLinkedDevice && !authState.hasPin && !authState.hasBiometric,
    isDeviceReady: authState.isLinkedDevice && (authState.hasPin || authState.hasBiometric),
    authMethod: authState.canUseBiometric ? 'biometric' : authState.hasPin ? 'pin' : 'password'
  };
};

// Hook específico para PIN
export const useEnhancedPin = () => {
  const [pinConfig, setPinConfig] = useState<PinConfig>({
    hasPin: false,
    attempts: 0,
    isLocked: false
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadPinConfig = useCallback(async () => {
    try {
      const config = await pinService.getPinConfig();
      setPinConfig(config);
    } catch (error) {
      console.error('Error loading PIN config:', error);
    }
  }, []);

  useEffect(() => {
    loadPinConfig();
  }, [loadPinConfig]);

  const createPin = useCallback(async (userId: number, pin: string): Promise<PinCreationResult> => {
    setIsLoading(true);
    try {
      const result = await pinService.createPin(userId, pin);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [loadPinConfig]);

  const verifyPin = useCallback(async (pin: string): Promise<PinVerificationResult> => {
    setIsLoading(true);
    try {
      const result = await pinService.verifyPin(pin);
      await loadPinConfig();
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [loadPinConfig]);

  const changePin = useCallback(async (currentPin: string, newPin: string): Promise<PinCreationResult> => {
    setIsLoading(true);
    try {
      const result = await pinService.changePin(currentPin, newPin);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [loadPinConfig]);

  const removePin = useCallback(async (currentPin: string): Promise<PinCreationResult> => {
    setIsLoading(true);
    try {
      const result = await pinService.removePin(currentPin);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [loadPinConfig]);

  return {
    pinConfig,
    isLoading,
    createPin,
    verifyPin,
    changePin,
    removePin,
    refresh: loadPinConfig
  };
};

// Hook específico para biometría
export const useEnhancedBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkAvailability = useCallback(async () => {
    try {
      const available = await biometricService.isBiometricAvailable();
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  }, []);

  const checkIfEnabled = useCallback(async () => {
    try {
      const enabled = await biometricService.isBiometricEnabled();
      setIsEnabled(enabled);
    } catch (error) {
      console.error('Error checking biometric status:', error);
      setIsEnabled(false);
    }
  }, []);

  useEffect(() => {
    checkAvailability();
    checkIfEnabled();
  }, [checkAvailability, checkIfEnabled]);

  const setupBiometric = useCallback(async (user: User): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await biometricService.setupBiometric(user);
      if (success) {
        setIsEnabled(true);
      }
      return success;
    } catch (error) {
      console.error('Setup biometric error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      return await biometricService.authenticateWithBiometric();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await biometricService.disableBiometric();
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isAvailable,
    isEnabled,
    isLoading,
    setupBiometric,
    authenticate,
    disable,
    refresh: () => {
      checkAvailability();
      checkIfEnabled();
    }
  };
};