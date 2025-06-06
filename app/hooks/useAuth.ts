// hooks/useAuth.ts - CORREGIDO Y MEJORADO
import { useState, useEffect, useCallback, useRef } from 'react';
import { deviceManagementService } from '@/app/services/deviceManagementService';
import { biometricService } from '@/app/services/biometricService';
import { pinService } from '@/app/services/pinService';
import { AuthResult, User } from '@/app/interfaces/auth.interface';
import { PinConfig, PinVerificationResult, PinCreationResult } from '@/app/interfaces/pin.interface';

export interface AuthState {
  isLoading: boolean;
  isLinkedDevice: boolean;
  linkedUserId: number | null;
  hasBiometric: boolean;
  hasPin: boolean;
  canUseBiometric: boolean;
  pinConfig: PinConfig;
}

// 🎯 CONSTANTES PARA MEJOR GESTIÓN
const INITIAL_AUTH_STATE: AuthState = {
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
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(INITIAL_AUTH_STATE);
  
  // 🔧 FIX: Usar useRef con valor inicial
  const mountedRef = useRef<boolean>(true);

  // 🔧 FIX: Cleanup effect para manejar el unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // 🎯 OPTIMIZACIÓN: Función helper para actualizaciones seguras del estado
  const safeSetAuthState = useCallback((updater: (prev: AuthState) => AuthState) => {
    // Log para ver cuándo se llama a safeSetAuthState y el estado anterior
    // console.log('[useAuth] safeSetAuthState called. Prev isLoading:', authState.isLoading);
    if (mountedRef.current) {
      setAuthState(prevState => {
        const nextState = updater(prevState);
        // Log para ver el nuevo estado, especialmente isLoading
        console.log('[useAuth] safeSetAuthState updated. New isLoading:', nextState.isLoading, 'Prev isLoading:', prevState.isLoading);
        return nextState;
      });
    } else {
      console.log('[useAuth] safeSetAuthState called but component unmounted.');
    }
  }, []);

  // Cargar estado inicial
  const loadAuthState = useCallback(async () => {
    console.log('[useAuth] loadAuthState: START');
    try {
      safeSetAuthState(prev => ({ ...prev, isLoading: true }));
      console.log('[useAuth] loadAuthState: Set isLoading to true');

      console.log('[useAuth] loadAuthState: Calling Promise.all for device/auth services...');
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
      
      console.log('[useAuth] loadAuthState: Promise.all results - linkedUserId:', linkedUserId, 'isBiometricAvailable:', isBiometricAvailable, 'isBiometricEnabled:', isBiometricEnabled, 'pinConfig:', JSON.stringify(pinConfig));

      // 🔧 Verificación adicional de que el componente sigue montado
      if (!mountedRef.current) {
        console.log('[useAuth] loadAuthState: Component unmounted after Promise.all. Aborting state update.');
        return;
      }

      console.log('[useAuth] loadAuthState: Preparing to set final auth state...');
      safeSetAuthState(prev => ({
        ...prev,
        isLoading: false,
        isLinkedDevice: linkedUserId !== null,
        linkedUserId,
        hasBiometric: isBiometricEnabled,
        hasPin: pinConfig.hasPin,
        canUseBiometric: isBiometricAvailable && isBiometricEnabled,
        pinConfig
      }));
      console.log('[useAuth] loadAuthState: Set final auth state, isLoading should be false.');

    } catch (error) {
      console.error('[useAuth] loadAuthState: ERROR', error);
      if (mountedRef.current) {
        console.log('[useAuth] loadAuthState: Setting isLoading to false due to error.');
        safeSetAuthState(prev => ({ ...prev, isLoading: false }));
      } else {
        console.log('[useAuth] loadAuthState: Component unmounted during error handling.');
      }
    }
    console.log('[useAuth] loadAuthState: END');
  }, [safeSetAuthState]);

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
      if (success && mountedRef.current) {
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
      if (result.success && mountedRef.current) {
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
      if (mountedRef.current) {
        await loadAuthState(); // Actualizar estado después de verificación
      }
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
      if (result.success && mountedRef.current) {
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
      if (result.success && mountedRef.current) {
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
      if (mountedRef.current) {
        await loadAuthState();
      }
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
      if (mountedRef.current) {
        await loadAuthState();
      }
    } catch (error) {
      console.error('Error resetting device:', error);
    }
  }, [loadAuthState]);

  // 🔧 FIX: Calcular propiedades computadas de forma correcta
  const computedProperties = {
    requiresSetup: authState.isLinkedDevice && !authState.hasPin && !authState.hasBiometric,
    isDeviceReady: authState.isLinkedDevice && (authState.hasPin || authState.hasBiometric),
    authMethod: authState.canUseBiometric ? 'biometric' as const : 
               authState.hasPin ? 'pin' as const : 
               'password' as const
  };

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
    
    // 🔧 FIX: Estado computado declarado correctamente
    ...computedProperties
  };
};

// 🎯 MEJORADO: Hook específico para PIN con mejor gestión de estado
export const useEnhancedPin = () => {
  const [pinConfig, setPinConfig] = useState<PinConfig>({
    hasPin: false,
    attempts: 0,
    isLocked: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef<boolean>(true);

  // 🔧 Cleanup effect
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadPinConfig = useCallback(async () => {
    try {
      const config = await pinService.getPinConfig();
      if (mountedRef.current) {
        setPinConfig(config);
      }
    } catch (error) {
      console.error('Error loading PIN config:', error);
    }
  }, []);

  useEffect(() => {
    loadPinConfig();
  }, [loadPinConfig]);

  const createPin = useCallback(async (userId: number, pin: string): Promise<PinCreationResult> => {
    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      const result = await pinService.createPin(userId, pin);
      if (result.success && mountedRef.current) {
        await loadPinConfig();
      }
      return result;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [loadPinConfig]);

  const verifyPin = useCallback(async (pin: string): Promise<PinVerificationResult> => {
    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      const result = await pinService.verifyPin(pin);
      if (mountedRef.current) {
        await loadPinConfig();
      }
      return result;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [loadPinConfig]);

  const changePin = useCallback(async (currentPin: string, newPin: string): Promise<PinCreationResult> => {
    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      const result = await pinService.changePin(currentPin, newPin);
      if (result.success && mountedRef.current) {
        await loadPinConfig();
      }
      return result;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [loadPinConfig]);

  const removePin = useCallback(async (currentPin: string): Promise<PinCreationResult> => {
    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      const result = await pinService.removePin(currentPin);
      if (result.success && mountedRef.current) {
        await loadPinConfig();
      }
      return result;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
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

// 🎯 MEJORADO: Hook específico para biometría con mejor gestión de estado
export const useEnhancedBiometric = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef<boolean>(true);

  // 🔧 Cleanup effect
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const checkAvailability = useCallback(async () => {
    try {
      const available = await biometricService.isBiometricAvailable();
      if (mountedRef.current) {
        setIsAvailable(available);
      }
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      if (mountedRef.current) {
        setIsAvailable(false);
      }
    }
  }, []);

  const checkIfEnabled = useCallback(async () => {
    try {
      const enabled = await biometricService.isBiometricEnabled();
      if (mountedRef.current) {
        setIsEnabled(enabled);
      }
    } catch (error) {
      console.error('Error checking biometric status:', error);
      if (mountedRef.current) {
        setIsEnabled(false);
      }
    }
  }, []);

  useEffect(() => {
    checkAvailability();
    checkIfEnabled();
  }, [checkAvailability, checkIfEnabled]);

  const setupBiometric = useCallback(async (user: User): Promise<boolean> => {
    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      const success = await biometricService.setupBiometric(user);
      if (success && mountedRef.current) {
        setIsEnabled(true);
      }
      return success;
    } catch (error) {
      console.error('Setup biometric error:', error);
      throw error;
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const authenticate = useCallback(async (): Promise<AuthResult> => {
    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      return await biometricService.authenticateWithBiometric();
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const disable = useCallback(async (): Promise<void> => {
    if (mountedRef.current) {
      setIsLoading(true);
    }
    
    try {
      await biometricService.disableBiometric();
      if (mountedRef.current) {
        setIsEnabled(false);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
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