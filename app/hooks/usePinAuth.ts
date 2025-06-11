// hooks/usePinAuth.ts
import { pinService } from '@/app/services/pinService';
import { PinConfig, PinCreationResult, PinVerificationResult, SecurityQuestion } from '@/app/interfaces/pin.interface';
import { useState, useEffect, useCallback } from 'react';

export const usePinAuth = (userId?: number) => {
  const [pinConfig, setPinConfig] = useState<PinConfig>({
    hasPin: false,
    attempts: 0,
    isLocked: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Cargar configuración del PIN cuando el componente se monta o userId cambia
  useEffect(() => {
    if (userId) {
      loadPinConfig();
    }
  }, [userId]);

  const loadPinConfig = useCallback(async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      // getPinConfig no recibe parámetros según el pinService
      const config = await pinService.getPinConfig();
      setPinConfig(config);
    } catch (error) {
      console.error('Error loading PIN config:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createPin = useCallback(async (pin: string, securityQuestions?: SecurityQuestion[]): Promise<PinCreationResult> => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    setIsLoading(true);
    try {
      // createPin solo recibe userId y pin según el pinService
      const result = await pinService.createPin(userId, pin);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } catch (error) {
      console.error('Error creating PIN:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al crear PIN' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadPinConfig]);

  const verifyPin = useCallback(async (pin: string): Promise<PinVerificationResult> => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    setIsLoading(true);
    try {
      // verifyPin solo recibe el pin según el pinService
      const result = await pinService.verifyPin(pin);
      await loadPinConfig(); // Actualizar estado después de verificación
      return result;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al verificar PIN' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadPinConfig]);

  const changePin = useCallback(async (currentPin: string, newPin: string): Promise<PinCreationResult> => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    setIsLoading(true);
    try {
      // changePin recibe currentPin y newPin según el pinService
      const result = await pinService.changePin(currentPin, newPin);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } catch (error) {
      console.error('Error changing PIN:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al cambiar PIN' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadPinConfig]);

  const removePin = useCallback(async (currentPin: string): Promise<PinCreationResult> => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    setIsLoading(true);
    try {
      // removePin recibe currentPin según el pinService
      const result = await pinService.removePin(currentPin);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } catch (error) {
      console.error('Error removing PIN:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error al eliminar PIN' 
      };
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadPinConfig]);

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