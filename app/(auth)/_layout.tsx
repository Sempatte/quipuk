// app/(auth)/_layout.tsx - Layout para pantallas de autenticación
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#000000" />
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
    </>
  );
}