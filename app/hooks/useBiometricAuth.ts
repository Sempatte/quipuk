import { useState, useEffect, useCallback } from 'react';
import { biometricService } from '@/app/services/biometricService';
import { User } from '@/app/interfaces/auth.interface';

export function useBiometricAuthManager(user: User | null) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshState = useCallback(async () => {
    setIsLoading(true);
    const available = await biometricService.isBiometricAvailable();
    setIsAvailable(available);
    if (available) {
      const enabled = await biometricService.isBiometricEnabled();
      setIsEnabled(enabled);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const toggleBiometrics = useCallback(async () => {
    if (!isAvailable) return;

    // User is required to enable biometrics.
    if (!isEnabled && !user) {
        console.error("User object is required to enable biometrics.");
        return;
    }

    setIsLoading(true);
    try {
      if (isEnabled) {
        await biometricService.disableBiometric();
        setIsEnabled(false);
      } else if (user) {
        const success = await biometricService.setupBiometric(user);
        if (success) {
          setIsEnabled(true);
        }
      }
    } catch (error) {
      console.error("Error toggling biometrics", error);
    } finally {
      setIsLoading(false);
      await refreshState();
    }
  }, [isEnabled, isAvailable, user, refreshState]);

  return {
    isLoading,
    isAvailable,
    isEnabled,
    toggleBiometrics,
    refreshState,
  };
}
