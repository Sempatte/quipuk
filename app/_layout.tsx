// app/_layout.tsx - SOLUCIÓN NUCLEAR SIN STATUSBAR MANUAL
import React, { useEffect, useState } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { ApolloProvider } from "@apollo/client";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from "./apolloClient";
import { FontProvider } from "./providers/FontProvider";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useFonts, Outfit_100Thin, Outfit_200ExtraLight, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_500Medium, Outfit_300Light } from "@expo-google-fonts/outfit";
import { ToastProvider } from "./providers/ToastProvider";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { OfflineMessage } from "@/components/OfflineMessage";
import { deviceManagementService } from "./services/deviceManagementService";

SplashScreen.preventAutoHideAsync();

function AuthHandler() {
  const segments = useSegments();
  const router = useRouter();
  const [authState, setAuthState] = useState({
    isChecking: true,
    isAuthenticated: false,
    shouldNavigate: false,
  });
  
  const checkAuth = async () => {
    try {
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem("token"),
        AsyncStorage.getItem("userId")
      ]);
      
      const isAuth = !!(token && userId);
      setAuthState({
        isChecking: false,
        isAuthenticated: isAuth,
        shouldNavigate: true
      });
    } catch (error) {
      setAuthState({
        isChecking: false,
        isAuthenticated: false,
        shouldNavigate: true
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!authState.shouldNavigate || authState.isChecking) return;
    
    const isInTabs = segments[0] === "(tabs)";
    const isInAuth = segments.some(s => s.includes("Login") || s.includes("Register"));
    
    if (!authState.isAuthenticated && isInTabs) {
      router.replace("/LoginScreen");
    } else if (authState.isAuthenticated && !isInTabs && !isInAuth) {
      router.replace("/(tabs)");
    }
  }, [authState, segments, router]);

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

  const theme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: "#00DC5A",
      background: "#F5F5F5",
    },
  };

  return (
    <ThemeProvider value={theme}>
      {/* NO StatusBar configuration at all - let iOS handle it naturally */}
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