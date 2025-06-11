// app/(auth)/_layout.tsx - CORREGIDO Y MEJORADO
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default async function AuthLayout() {


  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          animation: 'slide_from_right',
          animationDuration: 250,
          presentation: 'card',
          orientation: 'portrait',
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
    </>
  );
}