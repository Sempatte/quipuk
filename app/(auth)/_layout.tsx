// app/(auth)/_layout.tsx - CORREGIDO Y MEJORADO
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function AuthLayout() {
  // 🖤 CONFIGURACIÓN DIRECTA DEL STATUSBAR - MEJORADA
  useEffect(() => {
    const configureStatusBar = () => {
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
        console.warn('⚠️ [AuthLayout] Error configurando StatusBar:', error);
        // Fallback básico
        try {
          StatusBar.setBarStyle('light-content', true);
        } catch (fallbackError) {
          console.warn('⚠️ [AuthLayout] Fallback StatusBar falló:', fallbackError);
        }
      }
    };

    // Configurar inmediatamente
    configureStatusBar();

    // 🔧 PERSISTENCIA: Reconfigurar periódicamente para casos problemáticos
    const interval = setInterval(configureStatusBar, 2000);

    return () => clearInterval(interval);
  }, []);

  // 🎯 REFUERZO: Configurar StatusBar cuando las pantallas reciben foco
  useFocusEffect(
    React.useCallback(() => {
      try {
        if (Platform.OS === 'android') {
          StatusBar.setBarStyle('light-content', true);
          StatusBar.setBackgroundColor('#000000', true);
        } else if (Platform.OS === 'ios') {
          StatusBar.setBarStyle('light-content', true);
        }
      } catch (error) {
        console.warn('⚠️ [AuthLayout] Focus StatusBar error:', error);
      }
    }, [])
  );

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Deshabilitar gestos de regreso en auth
        animation: 'slide_from_right', // Animación suave
        
        // 🎯 OPCIONES ADICIONALES PARA MEJOR UX
        animationDuration: 250, // Animación más rápida
        presentation: 'card', // Presentación tipo tarjeta
        orientation: 'portrait', // Forzar orientación vertical
        
        // 🔧 CONFIGURACIÓN DE ESTADO
        statusBarStyle: 'light',
        statusBarBackgroundColor: '#000000',
        statusBarTranslucent: false,
      }}
    >
      <Stack.Screen 
        name="LoginScreen" 
        options={{
          title: 'Iniciar Sesión',
          // 🔧 FIX: Remover 'href' - no es válido para Stack.Screen
          gestureEnabled: false,
          
          // 🎯 OPCIONES ESPECÍFICAS PARA LOGIN
          animation: 'fade', // Animación suave para login
          animationDuration: 200,
        }} 
      />
      
      <Stack.Screen 
        name="RegisterScreen" 
        options={{
          title: 'Registrarse',
          // 🎯 TRANSICIÓN DESDE LOGIN
          animation: 'slide_from_right',
          animationDuration: 250,
        }} 
      />
      
      <Stack.Screen 
        name="EmailVerificationScreen" 
        options={{
          title: 'Verificar Email',
          gestureEnabled: false, // No permitir retroceso durante verificación
          
          // 🎯 PANTALLA CRÍTICA - Sin retroceso accidental
          animation: 'slide_from_bottom',
          animationDuration: 300,
          
          // 🔒 PREVENCIÓN DE NAVEGACIÓN ACCIDENTAL
          headerBackVisible: false,
        }} 
      />
    </Stack>
  );
}