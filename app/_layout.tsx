// app/_layout.tsx - STATUSBAR NEGRO GLOBAL FORZADO
import React, { useEffect, useState, useRef } from "react";
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
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigationInProgress = useRef(false);

  // 🔥 VERIFICACIÓN DE AUTENTICACIÓN UNA SOLA VEZ
  useEffect(() => {
    if (initialCheckDone) return;

    const checkAuth = async () => {
      try {
        console.log("🔍 [AuthHandler] Verificación inicial de autenticación...");
        
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        
        const isAuth = !!(token && userId);
        console.log("🔍 [AuthHandler] Estado inicial:", { 
          hasToken: !!token, 
          hasUserId: !!userId, 
          isAuth 
        });
        
        setIsAuthenticated(isAuth);
        setInitialCheckDone(true);
      } catch (error) {
        console.error("❌ [AuthHandler] Error verificando auth:", error);
        setIsAuthenticated(false);
        setInitialCheckDone(true);
      }
    };

    checkAuth();
  }, [initialCheckDone]);

  // 🔥 NAVEGACIÓN CONTROLADA CON PROTECCIÓN CONTRA BUCLES
  useEffect(() => {
    if (isAuthenticated === null || !initialCheckDone || navigationInProgress.current) {
      return;
    }

    const currentPath = segments.join('/') || 'root';
    console.log("🔍 [AuthHandler] Evaluando navegación:", {
      segments,
      currentPath,
      isAuthenticated,
      navigationInProgress: navigationInProgress.current
    });

    // Determinar si está en ruta protegida o pública
    const isInTabsGroup = segments[0] === "(tabs)";
    const isInAuthRoute = segments[0] === "LoginScreen" || 
                         segments[0] === "RegisterScreen" || 
                         segments[0] === "EmailVerificationScreen" ||
                         currentPath.includes("Login") ||
                         currentPath.includes("Register") ||
                         currentPath.includes("EmailVerification");

    // CASO 1: Usuario NO autenticado en ruta protegida -> Redirigir a Login
    if (!isAuthenticated && isInTabsGroup) {
      console.log("🔄 [AuthHandler] Usuario no autenticado en tabs -> LoginScreen");
      navigationInProgress.current = true;
      
      router.replace("/LoginScreen");
      
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 1000);
      return;
    }

    // CASO 2: Usuario autenticado en ruta pública -> Redirigir a tabs
    if (isAuthenticated && isInAuthRoute) {
      console.log("🔄 [AuthHandler] Usuario autenticado en auth -> tabs");
      navigationInProgress.current = true;
      
      router.replace("/(tabs)");
      
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 1000);
      return;
    }

    // CASO 3: Primera carga - determinar ruta inicial
    if (!segments.length || currentPath === 'root') {
      console.log("🔄 [AuthHandler] Primera carga - determinando ruta inicial");
      navigationInProgress.current = true;
      
      if (isAuthenticated) {
        console.log("🔄 [AuthHandler] Primera carga -> tabs (autenticado)");
        router.replace("/(tabs)");
      } else {
        console.log("🔄 [AuthHandler] Primera carga -> LoginScreen (no autenticado)");
        router.replace("/LoginScreen");
      }
      
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 1000);
      return;
    }

    console.log("✅ [AuthHandler] Navegación ya es correcta - no se requiere acción");
  }, [isAuthenticated, segments, router, initialCheckDone]);

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