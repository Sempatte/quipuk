// hooks/useStatusBar.ts - VERSIÓN FINAL SIN CONFLICTOS
import { useEffect, useCallback } from 'react';
import { StatusBar, Platform } from 'react-native';

/**
 * Hook que SOLO funciona después de cambiar UIViewControllerBasedStatusBarAppearance a false
 */
export const useGlobalStatusBar = () => {
  const configureStatusBar = useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        // Solo funciona si UIViewControllerBasedStatusBarAppearance = false
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setHidden(false, 'fade');
      } else if (Platform.OS === 'android') {
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setBackgroundColor('#000000', true);
        StatusBar.setTranslucent(false);
      }
    } catch (error) {
      // Si falla, significa que UIViewControllerBasedStatusBarAppearance sigue en true
      console.warn('StatusBar config failed - check Info.plist UIViewControllerBasedStatusBarAppearance');
    }
  }, []);

  useEffect(() => {
    // Configurar inmediatamente
    configureStatusBar();

    // Configurar después de un pequeño delay
    const timer = setTimeout(configureStatusBar, 100);

    return () => clearTimeout(timer);
  }, [configureStatusBar]);
};

/**
 * Hook alternativo usando solo expo-status-bar (NO requiere cambios en Info.plist)
 */
export const useExpoStatusBar = () => {
  // Este hook solo retorna las props que debes usar en el componente <StatusBar />
  return {
    style: 'light' as const,
    backgroundColor: '#000000',
    translucent: false,
  };
};

export default useGlobalStatusBar;