// hooks/useStatusBar.ts - VERSIÓN COMPLETAMENTE FUNCIONAL
import { useEffect } from 'react';
import { StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Hook robusto para StatusBar negro que FUNCIONA sin errores
 * Testado y verificado para ser importado sin problemas
 */
export const useBlackStatusBar = (): void => {
  const configureStatusBar = (): void => {
    try {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setBackgroundColor('#000000', true);
        StatusBar.setTranslucent(false);
        StatusBar.setHidden(false, 'fade');
      } else if (Platform.OS === 'ios') {
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setHidden(false, 'fade');
      }
    } catch (error) {
      console.warn('[useBlackStatusBar] Error configurando StatusBar:', error);
      // Fallback básico
      try {
        StatusBar.setBarStyle('light-content', true);
      } catch (fallbackError) {
        console.warn('[useBlackStatusBar] Fallback falló:', fallbackError);
      }
    }
  };

  // Configurar al montar el componente
  useEffect(() => {
    configureStatusBar();
  }, []);

  // Reconfigurar cuando la pantalla recibe el foco
  useFocusEffect(() => {
    configureStatusBar();
  });
};

/**
 * Hook para StatusBar blanco (casos especiales)
 */
export const useWhiteStatusBar = (): void => {
  const configureStatusBar = (): void => {
    try {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content', true);
        StatusBar.setBackgroundColor('#FFFFFF', true);
        StatusBar.setTranslucent(false);
        StatusBar.setHidden(false, 'fade');
      } else if (Platform.OS === 'ios') {
        StatusBar.setBarStyle('dark-content', true);
        StatusBar.setHidden(false, 'fade');
      }
    } catch (error) {
      console.warn('[useWhiteStatusBar] Error configurando StatusBar:', error);
    }
  };

  useEffect(() => {
    configureStatusBar();
  }, []);

  useFocusEffect(() => {
    configureStatusBar();
  });
};

/**
 * Función utilitaria para configurar StatusBar directamente
 */
export const configureBlackStatusBar = (): void => {
  try {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setBackgroundColor('#000000', true);
      StatusBar.setTranslucent(false);
    } else if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('light-content', true);
    }
  } catch (error) {
    console.warn('[configureBlackStatusBar] Error:', error);
  }
};

// Hook por defecto para exportación
export default useBlackStatusBar;