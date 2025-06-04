// app/(auth)/_layout.tsx - LAYOUT SIMPLIFICADO SIN IMPORTS PROBLEMÁTICOS
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, Platform } from 'react-native';

export default function AuthLayout() {
  // 🖤 CONFIGURACIÓN DIRECTA SIN HOOK EXTERNO
  useEffect(() => {
    const configureStatusBar = () => {
      try {
        if (Platform.OS === 'android') {
          StatusBar.setBarStyle('light-content', true);
          StatusBar.setBackgroundColor('#000000', true);
          StatusBar.setTranslucent(false);
        } else if (Platform.OS === 'ios') {
          StatusBar.setBarStyle('light-content', true);
        }
      } catch (error) {
        console.warn('Error configurando StatusBar:', error);
      }
    };

    configureStatusBar();
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Deshabilitar gestos de regreso en auth
        animation: 'slide_from_right', // Animación suave
      }}
    >
      <Stack.Screen 
        name="LoginScreen" 
        options={{
          title: 'Iniciar Sesión',
        }} 
      />
      <Stack.Screen 
        name="RegisterScreen" 
        options={{
          title: 'Registrarse',
        }} 
      />
      <Stack.Screen 
        name="EmailVerificationScreen" 
        options={{
          title: 'Verificar Email',
          gestureEnabled: false, // No permitir retroceso durante verificación
        }} 
      />
    </Stack>
  );
}