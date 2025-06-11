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
        gestureEnabled: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        presentation: 'card',
        orientation: 'portrait',
        statusBarStyle: 'light',
        statusBarAnimation: 'fade',
      }}
    >
      <Stack.Screen 
        name="LoginScreen" 
        options={{
          title: 'Iniciar Sesión',
          animation: 'fade',
          animationDuration: 200,
        }} 
      />
      <Stack.Screen 
        name="RegisterScreen" 
        options={{
          title: 'Registrarse',
          animation: 'slide_from_right',
          animationDuration: 250,
        }} 
      />
      <Stack.Screen 
        name="EmailVerificationScreen" 
        options={{
          title: 'Verificar Email',
          gestureEnabled: false,
          animation: 'slide_from_bottom',
          animationDuration: 300,
          headerBackVisible: false,
        }} 
      />
    </Stack>
  );
}