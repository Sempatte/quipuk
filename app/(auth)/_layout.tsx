// app/(auth)/_layout.tsx - STATUSBAR NEGRO EN PANTALLAS DE AUTH
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, Platform } from 'react-native';

export default function AuthLayout() {
  
  // 🖤 FORZAR STATUSBAR NEGRO EN PANTALLAS DE AUTH
  useEffect(() => {
    console.log("🖤 [AuthLayout] Forzando StatusBar negro en auth");
    
    if (Platform.OS === "android") {
      StatusBar.setBarStyle("light-content", true);
      StatusBar.setBackgroundColor("#000000", true);
      StatusBar.setTranslucent(false);
    } else if (Platform.OS === "ios") {
      StatusBar.setBarStyle("light-content", true);
    }
  }, []);

  return (
    <>
      {/* 🖤 STATUSBAR NEGRO EXPLÍCITO EN AUTH */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={false}
        hidden={false}
        animated={false}
      />
      
      <Stack
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Deshabilitar gestos de regreso en auth
          animation: 'slide_from_right', // Animación suave
          // 🖤 FORZAR STATUSBAR EN OPCIONES DE PANTALLA
          statusBarStyle: 'light',
          statusBarBackgroundColor: '#000000',
        }}
      >
        <Stack.Screen 
          name="LoginScreen" 
          options={{
            title: 'Iniciar Sesión',
            statusBarStyle: 'light',
            statusBarBackgroundColor: '#000000',
          }} 
        />
        <Stack.Screen 
          name="RegisterScreen" 
          options={{
            title: 'Registrarse',
            statusBarStyle: 'light',
            statusBarBackgroundColor: '#000000',
          }} 
        />
        <Stack.Screen 
          name="EmailVerificationScreen" 
          options={{
            title: 'Verificar Email',
            gestureEnabled: false, // No permitir retroceso durante verificación
            statusBarStyle: 'light',
            statusBarBackgroundColor: '#000000',
          }} 
        />
      </Stack>
    </>
  );
}