// app/_layout.tsx - Enhanced with device management
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
import { deviceManagementService } from "./services/deviceManagementService";

SplashScreen.preventAutoHideAsync();

function AuthHandler() {
  const segments = useSegments();
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean | null;
    isLinkedDevice: boolean | null;
    linkedUserId: number | null;
  }>({
    isAuthenticated: null,
    isLinkedDevice: null,
    linkedUserId: null,
  });
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // Verificación de autenticación mejorada
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("Checking enhanced auth status");
        
        const [token, userId, linkedUserId] = await Promise.all([
          AsyncStorage.getItem("token"),
          AsyncStorage.getItem("userId"),
          deviceManagementService.getLinkedUser()
        ]);
        
        const isAuth = !!(token && userId);
        const isLinked = linkedUserId !== null;
        
        // Verificar coherencia entre autenticación y vinculación
        if (isAuth && userId) {
          const userIdNum = parseInt(userId, 10);
          const canAccess = await deviceManagementService.canUserAccessDevice(userIdNum);
          
          if (!canAccess && isLinked) {
            // Usuario autenticado pero dispositivo vinculado a otra cuenta
            console.log("Device linked to different user, clearing auth");
            await AsyncStorage.multiRemove(["token", "userId"]);
            setAuthState({
              isAuthenticated: false,
              isLinkedDevice: true,
              linkedUserId: linkedUserId
            });
            return;
          }
        }
        
        console.log("Auth state:", {
          isAuth,
          isLinked,
          linkedUserId,
          userId: userId ? parseInt(userId, 10) : null
        });
        
        setAuthState({
          isAuthenticated: isAuth,
          isLinkedDevice: isLinked,
          linkedUserId: linkedUserId
        });
      } catch (error) {
        console.error("Error checking auth status:", error);
        setAuthState({
          isAuthenticated: false,
          isLinkedDevice: false,
          linkedUserId: null
        });
      }
    };

    checkAuthStatus();
  }, []);

  // Navegación inteligente basada en estado de dispositivo
  useEffect(() => {
    if (authState.isAuthenticated === null || authState.isLinkedDevice === null) {
      return; // Esperar verificación inicial
    }
    
    const currentPath = `/${segments.join('/')}`;
    const isInTabsGroup = segments[0] === "(tabs)";
    const isInAuthRoute = currentPath.includes("LoginScreen") || 
                         currentPath.includes("RegisterScreen") || 
                         currentPath.includes("EmailVerificationScreen");
    
    console.log("Evaluating enhanced navigation:", {
      currentPath,
      isAuthenticated: authState.isAuthenticated,
      isLinkedDevice: authState.isLinkedDevice,
      linkedUserId: authState.linkedUserId,
      isInTabsGroup,
      isInAuthRoute,
      hasNavigated
    });

    // Casos de redirección mejorados
    if (!authState.isAuthenticated) {
      if (isInTabsGroup || (!isInAuthRoute && !hasNavigated)) {
        console.log("User not authenticated -> LoginScreen");
        router.replace("/LoginScreen");
        setHasNavigated(true);
      }
    } else if (authState.isAuthenticated) {
      // Usuario autenticado
      if (authState.isLinkedDevice && authState.linkedUserId) {
        // Dispositivo vinculado - verificar si es el usuario correcto
        const storedUserId = AsyncStorage.getItem("userId").then(id => {
          if (id && parseInt(id, 10) === authState.linkedUserId) {
            // Usuario correcto en dispositivo vinculado
            if (isInAuthRoute || (!isInTabsGroup && !hasNavigated)) {
              console.log("Authenticated user on linked device -> tabs");
              router.replace("/(tabs)");
              setHasNavigated(true);
            }
          } else {
            // Usuario incorrecto en dispositivo vinculado
            console.log("Wrong user on linked device -> LoginScreen");
            AsyncStorage.multiRemove(["token", "userId"]);
            router.replace("/LoginScreen");
            setHasNavigated(true);
          }
        });
      } else {
        // Dispositivo no vinculado - proceder normalmente
        if (isInAuthRoute || (!isInTabsGroup && !hasNavigated)) {
          console.log("Authenticated user on unlinked device -> tabs");
          router.replace("/(tabs)");
          setHasNavigated(true);
        }
      }
    }
  }, [authState]);

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

  // Configuración global del StatusBar
  useEffect(() => {
    console.log("Configuring global StatusBar");
    
    if (Platform.OS === "android") {
      StatusBar.setBarStyle("light-content", true);
      StatusBar.setBackgroundColor("#000000", true);
      StatusBar.setTranslucent(false);
    } else if (Platform.OS === "ios") {
      StatusBar.setBarStyle("light-content", true);
    }
  }, []);

  // Forzar StatusBar negro en cada cambio de ruta
  useEffect(() => {
    const interval = setInterval(() => {
      if (Platform.OS === "android") {
        StatusBar.setBarStyle("light-content");
        StatusBar.setBackgroundColor("#000000");
      } else if (Platform.OS === "ios") {
        StatusBar.setBarStyle("light-content");
      }
    }, 500);

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

  const customTheme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
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