// hooks/useSimpleStatusBar.ts - SOLUCIÓN SIMPLE SIN CONFLICTOS
import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Hook ULTRA SIMPLE para StatusBar que NO causa conflictos en iOS
 * Solo usa expo-status-bar, nunca react-native StatusBar
 */
export const useSimpleStatusBar = () => {
  useEffect(() => {
    // Solo log para debug, NO configuración manual
    if (__DEV__) {
      console.log(`📱 [StatusBar] Platform: ${Platform.OS}`);
    }
    
    // NO hacer configuración manual aquí
    // Todo se maneja desde expo-status-bar en los componentes
  }, []);
};

// Hook para componentes específicos que necesitan StatusBar especial
export const useComponentStatusBar = (style: 'light' | 'dark' = 'light') => {
  useEffect(() => {
    // Solo logging, la configuración real se hace con <StatusBar /> component
    if (__DEV__) {
      console.log(`📱 [StatusBar] Component requesting: ${style}`);
    }
  }, [style]);

  // Retornar props para el componente StatusBar
  return {
    style,
    backgroundColor: style === 'light' ? '#000000' : '#FFFFFF',
    translucent: false,
  };
};

export default useSimpleStatusBar;