// app/_layout.tsx - VERSION DEBUG
import React, { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, Platform, View } from "react-native";
import { ApolloProvider } from "@apollo/client";
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  console.log('🐛 [DEBUG] MainLayout renderizando...');
  
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
    console.log('🐛 [DEBUG] Configurando StatusBar...');
    StatusBar.setBarStyle("light-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#000000");
      StatusBar.setTranslucent(false);
    }
  }, []);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      console.log('🐛 [DEBUG] Ocultando SplashScreen...');
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
    console.log('🐛 [DEBUG] Mostrando loading...');
    return null;
  }

  if (!isBackendActive) {
    console.log('🐛 [DEBUG] Backend inactivo, mostrando OfflineMessage...');
    return <OfflineMessage />;
  }

  console.log('🐛 [DEBUG] Renderizando app principal...');
  
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={Platform.OS === 'ios'}
      />
      <Stack initialRouteName="LoginScreen">
        <Stack.Screen name="LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="RegisterScreen" options={{ headerShown: false }} />
        <Stack.Screen name="EmailVerificationScreen" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  console.log('🐛 [DEBUG] RootLayout renderizando...');
  
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