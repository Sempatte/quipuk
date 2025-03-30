// hooks/useBackendHealth.ts
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/app/providers/ToastProvider';
import { checkBackendHealth } from '@/app/services/healthCheck';

interface UseBackendHealthOptions {
  showErrorToast?: boolean;
  retryInterval?: number | null; // null = no auto retry
}

/**
 * Hook para gestionar el estado de salud del backend
 */
export const useBackendHealth = (options: UseBackendHealthOptions = {}) => {
  const { 
    showErrorToast = true, 
    retryInterval = null 
  } = options;
  
  const [isBackendActive, setIsBackendActive] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const checkHealth = useCallback(async () => {
    setIsLoading(true);
    try {
      const isActive = await checkBackendHealth();
      setIsBackendActive(isActive);
      
      if (!isActive && showErrorToast) {
        showToast(
          'error',
          'Error de conexión',
          'No se pudo conectar con el servidor. Verifica tu conexión.'
        );
      }
      
      return isActive;
    } catch (error) {
      setIsBackendActive(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [showToast, showErrorToast]);

  useEffect(() => {
    // Verificar al cargar el componente
    checkHealth();
    
    // Configurar retry automático si se especificó un intervalo
    let intervalId: NodeJS.Timeout | null = null;
    
    if (retryInterval && retryInterval > 0) {
      intervalId = setInterval(() => {
        if (!isBackendActive) {
          checkHealth();
        }
      }, retryInterval);
    }
    
    // Limpiar intervalo al desmontar
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [checkHealth, retryInterval, isBackendActive]);

  return {
    isBackendActive,
    isLoading,
    checkHealth
  };
};