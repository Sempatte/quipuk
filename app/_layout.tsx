// app/_layout.tsx - STATUSBAR NEGRO GLOBAL FORZADO
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

function AuthHandler() {
  const segments = useSegments();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // 🎯 VERIFICACIÓN DE AUTENTICACIÓN (SOLO UNA VEZ AL INICIO)
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("🔍 [AuthHandler] Verificación inicial de autenticación");
        
        const [token, userId] = await Promise.all([
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("userId")
        ]);
        
        const isAuth = !!(token && userId);
        console.log("🔍 [AuthHandler] Estado:", isAuth ? "autenticado" : "no autenticado");
        
        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error("❌ [AuthHandler] Error:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
  }, []); // ✅ Solo al montar el componente

  // 🎯 NAVEGACIÓN INTELIGENTE (SOLO CUANDO CAMBIA EL ESTADO DE AUTH)
  useEffect(() => {
    if (isAuthenticated === null) return; // Esperamos la verificación inicial
    
    const currentPath = `/${segments.join('/')}`;
    const isInTabsGroup = segments[0] === "(tabs)";
    const isInAuthRoute = currentPath.includes("LoginScreen") || 
                         currentPath.includes("RegisterScreen") || 
                         currentPath.includes("EmailVerificationScreen");
    
    console.log("🧭 [AuthHandler] Evaluando navegación:", {
      currentPath,
      isAuthenticated,
      isInTabsGroup,
      isInAuthRoute,
      hasNavigated
    });

    // 🎯 CASOS DE REDIRECCIÓN (solo si es necesario)
    if (!isAuthenticated && (isInTabsGroup || (!isInAuthRoute && !hasNavigated))) {
      console.log("🔄 Usuario no autenticado -> LoginScreen");
      router.replace("/LoginScreen");
      setHasNavigated(true);
    } else if (isAuthenticated && (isInAuthRoute || (!isInTabsGroup && !hasNavigated))) {
      console.log("🔄 Usuario autenticado -> tabs");
      router.replace("/(tabs)");
      setHasNavigated(true);
    } else {
      console.log("✅ Navegación correcta - sin cambios");
    }
  }, [isAuthenticated]); // ✅ Solo cuando cambia el estado de autenticación

  return null;
}

function MainLayout() {
  const colorScheme = useColorScheme();
  const { isBackendActive, isLoading } = useBackendHealth({
    showErrorToast: false,
    retryInterval: 60000,
  });

  const [fontsLoaded] = useFonts({
    Outfit_100Thin,
    Outfit_200ExtraLight,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_500Medium,
    Outfit_300Light,
  });

  // 🖤 CONFIGURACIÓN GLOBAL DEL STATUSBAR - SIEMPRE NEGRO
  useEffect(() => {
    console.log("🖤 [StatusBar] Configurando StatusBar negro global");
    
    if (Platform.OS === "android") {
      // Android: Configuración completa
      StatusBar.setBarStyle("light-content", true);
      StatusBar.setBackgroundColor("#000000", true);
      StatusBar.setTranslucent(false);
      console.log("🖤 [StatusBar] Android configurado: light-content + fondo negro");
    } else if (Platform.OS === "ios") {
      // iOS: Solo el estilo (el fondo se maneja con SafeAreaView)
      StatusBar.setBarStyle("light-content", true);
      console.log("🖤 [StatusBar] iOS configurado: light-content");
    }
  }, []); // Solo una vez al cargar la app

  // 🖤 FORZAR STATUSBAR NEGRO EN CADA CAMBIO DE RUTA
  useEffect(() => {
    const interval = setInterval(() => {
      if (Platform.OS === "android") {
        StatusBar.setBarStyle("light-content");
        StatusBar.setBackgroundColor("#000000");
      } else if (Platform.OS === "ios") {
        StatusBar.setBarStyle("light-content");
      }
    }, 500); // Verificar cada 500ms

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    return null;
  }

  if (!isBackendActive) {
    return <OfflineMessage />;
  }

  // 🖤 THEME PERSONALIZADO CON STATUSBAR NEGRO FORZADO
  const customTheme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      // Forzar colores que mantengan el StatusBar negro
      primary: "#00DC5A",
      background: "#F5F5F5",
      card: "#FFFFFF",
      text: "#000000",
      border: "#E5E8EB",
      notification: "#FF5252",
    },
  };

  return (
    <ThemeProvider value={customTheme}>
      {/* 🖤 STATUSBAR GLOBAL FORZADO */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={false}
        hidden={false}
        animated={false}
        networkActivityIndicatorVisible={false}
        showHideTransition="none"
      />
      
      <AuthHandler />
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