// app/_layout.tsx - VERSION CORREGIDA COMPLETA
import React, { useEffect, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, Platform } from "react-native";
import { ApolloProvider } from "@apollo/client";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from "./apolloClient";
import { FontProvider } from "./providers/FontProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  useFonts,
  Outfit_100Thin,
  Outfit_200ExtraLight,
  Outfit_400Regular,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_500Medium,
  Outfit_300Light,
} from "@expo-google-fonts/outfit";
import { ToastProvider } from "./providers/ToastProvider";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { OfflineMessage } from "@/components/OfflineMessage";

SplashScreen.preventAutoHideAsync();

function MainLayout() {
  const colorScheme = useColorScheme();
  const { isBackendActive, isLoading } = useBackendHealth({
    showErrorToast: false,
    retryInterval: 60000,
  });

  // 🔥 NUEVO ESTADO PARA MANEJAR AUTENTICACIÓN INICIAL
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [fontsLoaded] = useFonts({
    Outfit_100Thin,
    Outfit_200ExtraLight,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_500Medium,
    Outfit_300Light,
  });

  // 🔥 Configuración del StatusBar una sola vez al inicio
  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setBarStyle("light-content", true);
      StatusBar.setBackgroundColor("#000000", true);
      StatusBar.setTranslucent(false);
    }
  }, []);

  // 🔥 VERIFICACIÓN DE AUTENTICACIÓN INICIAL
  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        
        
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        
        if (token && userId) {
          
          setIsAuthenticated(true);
        } else {
          
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("❌ [RootLayout] Error verificando auth inicial:", error);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkInitialAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isLoading && !isCheckingAuth) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading, isCheckingAuth]);

  // 🔥 NO RENDERIZAR HASTA QUE TODO ESTÉ LISTO
  if (!fontsLoaded || isLoading || isCheckingAuth) {
    return null;
  }

  if (!isBackendActive) {
    return <OfflineMessage />;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      {/* 🔥 StatusBar global - configuración principal */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={Platform.OS === 'ios'}
      />
      
      <Stack 
        // 🔥 SOLUCIÓN: Configuración inicial basada en autenticación
        initialRouteName={isAuthenticated ? "(tabs)" : "LoginScreen"}
        screenOptions={{
          headerShown: false,
          // 🔥 PREVENIR ANIMACIONES CONFLICTIVAS
          animation: 'slide_from_right',
          gestureEnabled: false, // Deshabilitar gestos para evitar navegación accidental
        }}
      >
        <Stack.Screen 
          name="LoginScreen" 
          options={{ 
            headerShown: false,
            // 🔥 IMPORTANTE: No permitir ir atrás desde login
            gestureEnabled: false,
            // 🔥 ADICIONAL: Reset del stack al llegar aquí
            animationTypeForReplace: 'pop',
          }} 
        />
        <Stack.Screen 
          name="RegisterScreen" 
          options={{ 
            headerShown: false,
            gestureEnabled: true, // Permitir volver atrás desde registro
          }} 
        />
        <Stack.Screen 
          name="EmailVerificationScreen" 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // No permitir ir atrás desde verificación
          }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            // 🔥 IMPORTANTE: No permitir ir atrás desde tabs (evita volver a login)
            gestureEnabled: false,
            // 🔥 ADICIONAL: Reset del stack al llegar aquí
            animationTypeForReplace: 'pop',
          }} 
        />
        <Stack.Screen 
          name="+not-found" 
          options={{ 
            headerShown: false 
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <FontProvider>
          <ToastProvider>
            <MainLayout />
          </ToastProvider>
        </FontProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}