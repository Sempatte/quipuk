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

  // Verificación de autenticación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 [AuthHandler] Verificando autenticación...");
        
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        
        const isAuth = !!(token && userId);
        console.log("🔍 [AuthHandler] Estado de auth:", { hasToken: !!token, hasUserId: !!userId, isAuth });
        
        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error("❌ [AuthHandler] Error verificando auth:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Navegación automática
  useEffect(() => {
    if (isAuthenticated === null) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const isPublicRoute = segments[0] === "LoginScreen" || 
                         segments[0] === "RegisterScreen" || 
                         segments[0] === "EmailVerificationScreen";

    console.log("🔍 [AuthHandler] Navegación:", {
      segments,
      inTabsGroup,
      isPublicRoute,
      isAuthenticated
    });

    // Redirigir si no está autenticado y está en tabs
    if (!isAuthenticated && inTabsGroup) {
      console.log("🔄 [AuthHandler] Redirigiendo a LoginScreen (no autenticado)");
      router.replace("/LoginScreen");
      return;
    }

    // Redirigir si está autenticado y está en pantalla pública
    if (isAuthenticated && isPublicRoute) {
      console.log("🔄 [AuthHandler] Redirigiendo a tabs (autenticado)");
      router.replace("/(tabs)");
      return;
    }

    // Navegación inicial
    if (segments[0]?.length === 0) {
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/LoginScreen");
      }
    }
  }, [isAuthenticated, segments, router]);

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

  useEffect(() => {
    if (Platform.OS === "android") {
      StatusBar.setBarStyle("light-content", true);
      StatusBar.setBackgroundColor("#000000", true);
      StatusBar.setTranslucent(false);
    }
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

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={Platform.OS === 'ios'}
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