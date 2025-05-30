// hooks/useSplashScreen.ts
import { useState, useEffect, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';

interface UseSplashScreenOptions {
  minDisplayTime?: number;
  autoHide?: boolean;
}

export const useSplashScreen = (options: UseSplashScreenOptions = {}) => {
  const { minDisplayTime = 3000, autoHide = true } = options;
  const [isVisible, setIsVisible] = useState(true);
  const [canHide, setCanHide] = useState(false);

  useEffect(() => {
    // Prevenir que el splash nativo se oculte automáticamente
    SplashScreen.preventAutoHideAsync();

    // Configurar tiempo mínimo de visualización
    const timer = setTimeout(() => {
      setCanHide(true);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime]);

  const hideSplash = useCallback(async () => {
    if (canHide) {
      setIsVisible(false);
      if (autoHide) {
        await SplashScreen.hideAsync();
      }
    }
  }, [canHide, autoHide]);

  const forceHide = useCallback(async () => {
    setIsVisible(false);
    await SplashScreen.hideAsync();
  }, []);

  return {
    isVisible,
    canHide,
    hideSplash,
    forceHide,
  };
};