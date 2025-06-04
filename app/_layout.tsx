// app/_layout.tsx - EXPO ROUTER VERSION CORREGIDA
import React, { useEffect, useState } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Slot, useRouter, useSegments } from "expo-router";
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

  // 🔥 EXPO ROUTER: useSegments y useRouter para manejar navegación
  const segments = useSegments();
  const router = useRouter();
  
  // 🔥 Estados para autenticación
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
        console.log("🔍 [RootLayout] Verificando autenticación inicial...");
        
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        
        if (token && userId) {
          console.log("✅ [RootLayout] Usuario autenticado encontrado");
          setIsAuthenticated(true);
        } else {
          console.log("❌ [RootLayout] No hay usuario autenticado");
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

  // 🔥 EXPO ROUTER: Lógica de navegación automática
  useEffect(() => {
    if (isCheckingAuth || isLoading) return;

    // Determinar si estamos en una ruta protegida o pública
    const inAuthGroup = segments[0] === "(tabs)";
    const inPublicRoute = segments[0] === "LoginScreen" || 
                         segments[0] === "RegisterScreen" || 
                         segments[0] === "EmailVerificationScreen";

    console.log("🔍 [RootLayout] Navegación:", {
      segments,
      inAuthGroup,
      inPublicRoute,
      isAuthenticated
    });

    // Si no está autenticado y está en ruta protegida, redirigir a login
    if (!isAuthenticated && inAuthGroup) {
      console.log("🔄 [RootLayout] Redirigiendo a LoginScreen (no autenticado)");
      router.replace("LoginScreen" as any);
      return;
    }

    // Si está autenticado y está en ruta pública, redirigir a tabs
    if (isAuthenticated && inPublicRoute) {
      console.log("🔄 [RootLayout] Redirigiendo a (tabs) (autenticado)");
      router.replace("/(tabs)" as any);
      return;
    }

    // Si es la primera carga y no hay segmentos, navegar según autenticación
    if (segments.length < 1) {
      if (isAuthenticated) {
        console.log("🔄 [RootLayout] Navegación inicial a (tabs)");
        router.replace("/(tabs)" as any);
      } else {
        console.log("🔄 [RootLayout] Navegación inicial a LoginScreen");
        router.replace("/LoginScreen" as any);
      }
    }
  }, [isAuthenticated, segments, isCheckingAuth, isLoading, router]);

  // 🔥 Ocultar splash cuando todo esté listo
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
      
      {/* 🔥 EXPO ROUTER: Usar Slot en lugar de Stack */}
      <Slot />
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