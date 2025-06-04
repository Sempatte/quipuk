// hooks/useStatusBar.ts - VERSIÓN COMPLETAMENTE MEJORADA PARA iOS
import { useEffect, useCallback } from 'react';
import { StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * Hook robusto para StatusBar que FUNCIONA correctamente en iOS
 * Soluciona el error UIViewControllerBasedStatusBarAppearance
 */
export const useBlackStatusBar = (): void => {
  const configureStatusBar = useCallback((): void => {
    try {
      if (Platform.OS === 'ios') {
        // 🔧 FIX: Para iOS, usar configuración más simple y compatible
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setHidden(false, 'none'); // Sin animación para evitar conflictos
      } else if (Platform.OS === 'android') {
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setBackgroundColor('#000000', true);
        StatusBar.setTranslucent(false);
        StatusBar.setHidden(false, 'fade');
      }
    } catch (error) {
      console.warn('[useBlackStatusBar] Error configurando StatusBar:', error);
      // Fallback ultra básico
      try {
        StatusBar.setBarStyle('light-content');
      } catch (fallbackError) {
        console.warn('[useBlackStatusBar] Fallback también falló:', fallbackError);
      }
    }
  }, []);

  // Configurar al montar el componente
  useEffect(() => {
    configureStatusBar();
  }, [configureStatusBar]);

  // 🔧 MEJORADO: Solo reconfigurar en focus si es necesario
  useFocusEffect(
    useCallback(() => {
      // Solo configurar si realmente es necesario
      const timeoutId = setTimeout(() => {
        configureStatusBar();
      }, 100); // Pequeño delay para evitar conflictos

      return () => clearTimeout(timeoutId);
    }, [configureStatusBar])
  );
};

/**
 * Hook mejorado para configuración global de StatusBar
 * Incluye configuración de Navigation Bar para Android
 */
export const useGlobalStatusBar = (): void => {
  useEffect(() => {
    const configureGlobal = async () => {
      try {
        if (Platform.OS === 'ios') {
          // 🎯 iOS: Configuración mínima pero efectiva
          StatusBar.setBarStyle('light-content', true);
        } else if (Platform.OS === 'android') {
          // 🎯 Android: Configuración completa
          StatusBar.setBarStyle('light-content', true);
          StatusBar.setBackgroundColor('#000000', true);
          StatusBar.setTranslucent(false);
          
          // 🆕 Configurar también la Navigation Bar
          try {
            await NavigationBar.setBackgroundColorAsync('#000000');
            await NavigationBar.setButtonStyleAsync('light');
          } catch (navError) {
            console.warn('Navigation Bar config failed:', navError);
          }
        }
      } catch (error) {
        console.warn('[useGlobalStatusBar] Error:', error);
      }
    };

    configureGlobal();
  }, []);
};

/**
 * Hook específico para pantallas modales
 * Evita conflictos con modales de React Native
 */
export const useModalStatusBar = (): void => {
  useEffect(() => {
    // Para modales, usar configuración más conservadora
    try {
      if (Platform.OS === 'ios') {
        // En iOS, los modales manejan su propio StatusBar
        StatusBar.setBarStyle('light-content', false); // No animado
      } else {
        StatusBar.setBarStyle('light-content', true);
        StatusBar.setBackgroundColor('#000000', false);
      }
    } catch (error) {
      console.warn('[useModalStatusBar] Error:', error);
    }
  }, []);
};

/**
 * Función utilitaria para configurar StatusBar directamente
 * Versión mejorada y compatible
 */
export const configureBlackStatusBar = (): void => {
  try {
    if (Platform.OS === 'ios') {
      // 🔧 FIX: Configuración simplificada para iOS
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setHidden(false);
    } else if (Platform.OS === 'android') {
      StatusBar.setBarStyle('light-content', true);
      StatusBar.setBackgroundColor('#000000', true);
      StatusBar.setTranslucent(false);
    }
  } catch (error) {
    console.warn('[configureBlackStatusBar] Error:', error);
  }
};

/**
 * 🆕 Hook especializado para layouts de autenticación
 * Diseñado específicamente para evitar errores en modales y transiciones
 */
export const useAuthStatusBar = (): void => {
  useEffect(() => {
    const configureAuth = () => {
      try {
        if (Platform.OS === 'ios') {
          // Para pantallas de auth en iOS, configuración muy básica
          StatusBar.setBarStyle('light-content');
        } else {
          // Android puede manejar configuración completa
          StatusBar.setBarStyle('light-content', true);
          StatusBar.setBackgroundColor('#000000', true);
          StatusBar.setTranslucent(false);
        }
      } catch (error) {
        console.warn('[useAuthStatusBar] Error:', error);
      }
    };

    configureAuth();

    // 🔧 Re-configurar periódicamente solo para auth
    const interval = setInterval(configureAuth, 3000);

    return () => clearInterval(interval);
  }, []);
};

// Hook por defecto para exportación (versión segura)
export default useBlackStatusBar;