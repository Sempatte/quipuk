// hooks/useEnhancedPinAuth.ts
import { pinService } from '@/app/services/pinService';
import { 
  PinConfig, 
  PinCreationResult, 
  PinVerificationResult, 
  SecurityQuestion 
} from '@/app/interfaces/pin.interface';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';

// Tipos mejorados para mejor type safety
interface PinAuthState extends PinConfig {
  isLoading: boolean;
  error: string | null;
  lastActionTimestamp?: number;
}

interface PinAuthActions {
  createPin: (pin: string, securityQuestions?: SecurityQuestion[]) => Promise<PinCreationResult>;
  verifyPin: (pin: string) => Promise<PinVerificationResult>;
  changePin: (currentPin: string, newPin: string) => Promise<PinCreationResult>;
  removePin: (currentPin: string) => Promise<PinCreationResult>;
  refresh: () => Promise<void>;
  clearError: () => void;
}

// Hook mejorado con mejores prácticas
export const useEnhancedPinAuth = (userId?: number): [PinAuthState, PinAuthActions] => {
  // Estado inicial más robusto
  const [state, setState] = useState<PinAuthState>({
    hasPin: false,
    attempts: 0,
    isLocked: false,
    isLoading: true,
    error: null
  });

  // Referencias para evitar memory leaks
  const mountedRef = useRef<boolean>(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();

  // Función helper para actualizaciones seguras del estado
  const safeSetState = useCallback((updater: (prev: PinAuthState) => PinAuthState) => {
    if (mountedRef.current) {
      setState(updater);
    }
  }, []);

  // Cargar configuración del PIN con manejo de errores mejorado
  const loadPinConfig = useCallback(async () => {
    if (!userId) {
      safeSetState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Usuario no especificado' 
      }));
      return;
    }
    
    safeSetState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const config = await pinService.getPinConfig();
      
      safeSetState(prev => ({
        ...prev,
        ...config,
        isLoading: false,
        error: null,
        lastActionTimestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error loading PIN config:', error);
      safeSetState(prev => ({
        ...prev,
        isLoading: false,
        error: 'No se pudo cargar la configuración del PIN'
      }));
    }
  }, [userId, safeSetState]);

  // Efecto para cargar configuración inicial y cuando cambia el userId
  useEffect(() => {
    if (userId) {
      loadPinConfig();
    }
  }, [userId, loadPinConfig]);

  // Manejo del ciclo de vida de la app para refrescar cuando vuelve al primer plano
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        userId
      ) {
        // Refrescar después de un pequeño delay para evitar problemas de rendimiento
        refreshTimeoutRef.current = setTimeout(() => {
          loadPinConfig();
        }, 500);
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [userId, loadPinConfig]);

  // Cleanup effect
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Acciones con mejor manejo de errores y feedback
  const createPin = useCallback(async (
    pin: string, 
    securityQuestions?: SecurityQuestion[]
  ): Promise<PinCreationResult> => {
    if (!userId) {
      return { 
        success: false, 
        error: 'Debes iniciar sesión para crear un PIN' 
      };
    }

    // Validación básica del PIN en el cliente
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      return { 
        success: false, 
        error: 'El PIN debe contener exactamente 6 dígitos' 
      };
    }
    
    safeSetState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await pinService.createPin(userId, pin);
      
      if (result.success) {
        await loadPinConfig();
      } else {
        safeSetState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error || 'Error al crear PIN' 
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      safeSetState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }, [userId, loadPinConfig, safeSetState]);

  const verifyPin = useCallback(async (pin: string): Promise<PinVerificationResult> => {
    if (!userId) {
      return { 
        success: false, 
        error: 'Debes iniciar sesión para verificar el PIN' 
      };
    }

    // Validación básica
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      return { 
        success: false, 
        error: 'PIN inválido' 
      };
    }
    
    safeSetState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await pinService.verifyPin(pin);
      
      // Siempre actualizar el estado después de verificación
      await loadPinConfig();
      
      if (!result.success) {
        safeSetState(prev => ({ 
          ...prev, 
          error: result.error || 'PIN incorrecto' 
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al verificar PIN';
      safeSetState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }, [userId, loadPinConfig, safeSetState]);

  const changePin = useCallback(async (
    currentPin: string, 
    newPin: string
  ): Promise<PinCreationResult> => {
    if (!userId) {
      return { 
        success: false, 
        error: 'Debes iniciar sesión para cambiar el PIN' 
      };
    }

    // Validaciones
    if (currentPin === newPin) {
      return { 
        success: false, 
        error: 'El nuevo PIN debe ser diferente al actual' 
      };
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      return { 
        success: false, 
        error: 'El nuevo PIN debe contener exactamente 6 dígitos' 
      };
    }
    
    safeSetState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await pinService.changePin(currentPin, newPin);
      
      if (result.success) {
        await loadPinConfig();
      } else {
        safeSetState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error || 'Error al cambiar PIN' 
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar PIN';
      safeSetState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }, [userId, loadPinConfig, safeSetState]);

  const removePin = useCallback(async (currentPin: string): Promise<PinCreationResult> => {
    if (!userId) {
      return { 
        success: false, 
        error: 'Debes iniciar sesión para eliminar el PIN' 
      };
    }
    
    safeSetState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await pinService.removePin(currentPin);
      
      if (result.success) {
        await loadPinConfig();
      } else {
        safeSetState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: result.error || 'Error al eliminar PIN' 
        }));
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar PIN';
      safeSetState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }, [userId, loadPinConfig, safeSetState]);

  const clearError = useCallback(() => {
    safeSetState(prev => ({ ...prev, error: null }));
  }, [safeSetState]);

  // Memorizar las acciones para evitar re-renders innecesarios
  const actions = useMemo<PinAuthActions>(() => ({
    createPin,
    verifyPin,
    changePin,
    removePin,
    refresh: loadPinConfig,
    clearError
  }), [createPin, verifyPin, changePin, removePin, loadPinConfig, clearError]);

  return [state, actions];
};

// Hook helper para formatear el tiempo restante del bloqueo
export const usePinLockTimer = (lockedUntil?: Date) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!lockedUntil) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = lockedUntil.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil]);

  return timeRemaining;
};

// Hook para validación de PIN en tiempo real
export const usePinValidation = () => {
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const validatePin = useCallback((value: string) => {
    const newErrors: string[] = [];

    if (value.length > 0) {
      if (!/^\d*$/.test(value)) {
        newErrors.push('Solo se permiten números');
      }
      if (value.length > 6) {
        newErrors.push('Máximo 6 dígitos');
      }
      // Validar patrones débiles
      if (value.length === 6) {
        if (/^(\d)\1+$/.test(value)) {
          newErrors.push('No uses el mismo dígito repetido');
        }
        if (/^(012345|123456|234567|345678|456789|567890|098765|987654|876543|765432|654321|543210)$/.test(value)) {
          newErrors.push('No uses secuencias consecutivas');
        }
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  }, []);

  const handlePinChange = useCallback((value: string) => {
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setPin(value);
      validatePin(value);
    }
  }, [validatePin]);

  return {
    pin,
    errors,
    isValid: errors.length === 0 && pin.length === 6,
    handlePinChange,
    clearPin: () => {
      setPin('');
      setErrors([]);
    }
  };
};