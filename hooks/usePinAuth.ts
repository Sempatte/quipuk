// hooks/usePinAuth.ts
import { pinService } from '@/app/services/pinService';
import { PinConfig, PinCreationResult, PinVerificationResult, SecurityQuestion } from '@/app/types/pin.types';
import { useState, useEffect } from 'react';

export const usePinAuth = (userId?: number) => {
  const [pinConfig, setPinConfig] = useState<PinConfig>({
    hasPin: false,
    attempts: 0,
    isLocked: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      loadPinConfig();
    }
  }, [userId]);

  const loadPinConfig = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const config = await pinService.getPinConfig(userId);
      setPinConfig(config);
    } catch (error) {
      console.error('Error loading PIN config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createPin = async (pin: string, securityQuestions?: SecurityQuestion[]): Promise<PinCreationResult> => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    setIsLoading(true);
    try {
      const result = await pinService.createPin(userId, pin, securityQuestions);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPin = async (pin: string): Promise<PinVerificationResult> => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    setIsLoading(true);
    try {
      const result = await pinService.verifyPin(userId, pin);
      await loadPinConfig(); // Actualizar estado después de verificación
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const changePin = async (currentPin: string, newPin: string): Promise<PinCreationResult> => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    setIsLoading(true);
    try {
      const result = await pinService.changePin(userId, currentPin, newPin);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const removePin = async (currentPin: string): Promise<PinCreationResult> => {
    if (!userId) return { success: false, error: 'Usuario no válido' };
    
    setIsLoading(true);
    try {
      const result = await pinService.removePin(userId, currentPin);
      if (result.success) {
        await loadPinConfig();
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

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