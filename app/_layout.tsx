import 'react-native-gesture-handler';
import React, { useEffect } from "react";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Slot, useRouter, useSegments, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { ApolloProvider } from "@apollo/client";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import client from "./apolloClient";
import { FontProvider } from "./providers/FontProvider";
import { useColorScheme } from "@/app/hooks/useColorScheme";
import { useFonts, Outfit_100Thin, Outfit_200ExtraLight, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_500Medium, Outfit_300Light } from "@expo-google-fonts/outfit";
import { ToastProvider } from "./providers/ToastProvider";
import { useBackendHealth } from "@/app/hooks/useBackendHealth";
import { OfflineMessage } from "@/app/components/OfflineMessage";
import { useAuth } from "@/app/hooks/useAuth";
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { isLinkedDevice, isLoading: authLoading } = useAuth();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    const isNavReady = navigationState?.key;
    if (!isNavReady || authLoading) {
      return;
    }
    
    const inAuthGroup = segments[0] === '(auth)';

    if (!isLinkedDevice && !inAuthGroup) {
      router.replace('/LoginScreen');
    } else if (isLinkedDevice && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLinkedDevice, segments, authLoading, navigationState]);
}

// 🎯 Componente "cerebro" que maneja la lógica de navegación y estado.
function GuardedSlot() {
  const navigationState = useRootNavigationState();
  const { isBackendActive, isLoading: healthCheckLoading } = useBackendHealth();

  useProtectedRoute(); // Hook de protección de rutas.

  // Si la navegación o las comprobaciones de backend no están listas, muestra un loader.
  if (!navigationState?.key || healthCheckLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Una vez que todo está listo, muestra el contenido de la ruta actual.
  return (
    <>
       {!isBackendActive && <OfflineMessage />}
       <Slot />
    </>
  );
}

function InitialLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
       <StatusBar style="light" />
       <GuardedSlot />
    </ThemeProvider>
  );
}

// 👑 Componente raíz: Solo carga proveedores y assets.
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_100Thin,
    Outfit_200ExtraLight,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });
  const { isLoading: authLoading, loadAuthState } = useAuth();

  useEffect(() => {
    loadAuthState();
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && !authLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, authLoading]);

  if (!fontsLoaded || authLoading) {
    return null; // O un loader global muy simple si se prefiere.
  }

  return (
    <ApolloProvider client={client}>
      <FontProvider>
        <ToastProvider>
          <SafeAreaProvider>
            <Slot />
          </SafeAreaProvider>
        </ToastProvider>
      </FontProvider>
    </ApolloProvider>
  );
} 