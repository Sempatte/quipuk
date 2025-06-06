import { biometricService } from '@/app/services/biometricService';
import { AuthResult, User } from '@/app/interfaces/auth.interface';
import { useState, useEffect } from 'react';

export const useBiometricAuth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAvailability();
      await checkIfEnabled();
    };
    initializeAuth();
  }, []);

  const checkAvailability = async () => {
    const available = await biometricService.isBiometricAvailable();
    setIsAvailable(available);
  };

  const checkIfEnabled = async () => {
    const enabled = await biometricService.isBiometricEnabled();
    setIsEnabled(enabled);
  };

  const setupBiometric = async (user: User): Promise<boolean> => {
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
  };

  const authenticate = async (): Promise<AuthResult> => {
    setIsLoading(true);
    try {
      return await biometricService.authenticateWithBiometric();
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disable = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await biometricService.disableBiometric();
      setIsEnabled(false);
    } catch (error) {
      console.error('Disable biometric error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAvailable,
    isEnabled,
    isLoading,
    setupBiometric,
    authenticate,
    disable,
    refresh: () => {
      const refreshAuth = async () => {
        try {
          await checkAvailability();
          await checkIfEnabled();
        } catch (error) {
          console.error('Refresh error:', error);
        }
      };
      refreshAuth();
    }
  };
};
