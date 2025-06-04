// app/_layout.tsx - ENHANCED WITH IMPROVED AUTH FLOW
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

// 🎯 ENHANCED: AuthHandler with better logic
function EnhancedAuthHandler() {
  const segments = useSegments();
  const router = useRouter();
  const [authState, setAuthState] = useState<{
    isChecking: boolean;
    isAuthenticated: boolean | null;
    isLinkedDevice: boolean | null;
    linkedUserId: number | null;
    shouldNavigate: boolean;
  }>({
    isChecking: true,
    isAuthenticated: null,
    isLinkedDevice: null,
    linkedUserId: null,
    shouldNavigate: false,
  });
  
  // 🎯 IMPROVED: Single source of truth for auth verification
  const checkCompleteAuthStatus = async () => {
    try {
      console.log("🔍 [Layout] Checking complete auth status");
      
      const [token, userId, linkedUserId] = await Promise.all([
        AsyncStorage.getItem("token"),
        AsyncStorage.getItem("userId"),
        deviceManagementService.getLinkedUser()
      ]);
      
      const isAuth = !!(token && userId);
      const isLinked = linkedUserId !== null;
      
      // 🎯 ENHANCED: Better validation logic
      let finalAuthState = {
        isAuthenticated: false,
        isLinkedDevice: isLinked,
        linkedUserId: linkedUserId,
      };

      if (isAuth && userId) {
        const userIdNum = parseInt(userId, 10);
        
        if (isLinked && linkedUserId !== userIdNum) {
          // 🔧 FIX: Wrong user on linked device
          console.log("❌ [Layout] Wrong user on linked device, clearing auth");
          await AsyncStorage.multiRemove(["token", "userId"]);
          finalAuthState.isAuthenticated = false;
        } else if (isLinked) {
          // ✅ Correct user on linked device
          const canAccess = await deviceManagementService.canUserAccessDevice(userIdNum);
          finalAuthState.isAuthenticated = canAccess;
          
          if (!canAccess) {
            console.log("❌ [Layout] Access denied, clearing auth");
            await AsyncStorage.multiRemove(["token", "userId"]);
          }
        } else {
          // ✅ User authenticated on unlinked device
          finalAuthState.isAuthenticated = true;
        }
      }
      
      console.log("✅ [Layout] Auth state determined:", finalAuthState);
      
      setAuthState(prev => ({
        ...prev,
        isChecking: false,
        ...finalAuthState,
        shouldNavigate: true
      }));
      
    } catch (error) {
      console.error("❌ [Layout] Error checking auth status:", error);
      setAuthState(prev => ({
        ...prev,
        isChecking: false,
        isAuthenticated: false,
        isLinkedDevice: false,
        linkedUserId: null,
        shouldNavigate: true
      }));
    }
  };

  // Initial auth check
  useEffect(() => {
    checkCompleteAuthStatus();
  }, []);

  // 🎯 ENHANCED: Smarter navigation logic
  useEffect(() => {
    if (!authState.shouldNavigate || authState.isChecking) {
      return; // Wait for initial check
    }
    
    const currentPath = `/${segments.join('/')}`;
    const isInTabsGroup = segments[0] === "(tabs)";
    const isInAuthRoute = currentPath.includes("LoginScreen") || 
                         currentPath.includes("RegisterScreen") || 
                         currentPath.includes("EmailVerificationScreen") ||
                         currentPath.includes("AuthenticationScreen");
    
    console.log("🧭 [Layout] Navigation evaluation:", {
      currentPath,
      isAuthenticated: authState.isAuthenticated,
      isLinkedDevice: authState.isLinkedDevice,
      linkedUserId: authState.linkedUserId,
      isInTabsGroup,
      isInAuthRoute
    });

    // 🎯 IMPROVED: Better navigation decisions
    if (!authState.isAuthenticated) {
      if (isInTabsGroup || (!isInAuthRoute && currentPath !== "/")) {
        console.log("🔄 [Layout] Not authenticated -> AuthenticationScreen");
        router.replace("/LoginScreen");
      }
    } else {
      // User is authenticated
      if (isInAuthRoute || (!isInTabsGroup && currentPath !== "/")) {
        console.log("🔄 [Layout] Authenticated -> tabs");
        router.replace("/(tabs)");
      }
    }
  }, [authState.shouldNavigate, authState.isChecking, authState.isAuthenticated, segments, router]);

  return null;
}

// 🎯 ENHANCED: MainLayout with better error handling
function EnhancedMainLayout() {
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

  // 🎯 ENHANCED: Global StatusBar configuration
  useEffect(() => {
    const configureGlobalStatusBar = () => {
      console.log("⚙️ [Layout] Configuring global StatusBar");
      
      try {
        if (Platform.OS === "android") {
          StatusBar.setBarStyle("light-content", true);
          StatusBar.setBackgroundColor("#000000", true);
          StatusBar.setTranslucent(false);
        } else if (Platform.OS === "ios") {
          StatusBar.setBarStyle("light-content", true);
        }
      } catch (error) {
        console.warn("⚠️ [Layout] StatusBar configuration failed:", error);
      }
    };

    configureGlobalStatusBar();

    // 🔧 FIX: Periodic enforcement for stubborn cases
    const interval = setInterval(configureGlobalStatusBar, 1000);

    return () => clearInterval(interval);
  }, []);

  // Hide splash screen when ready
  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      console.log("✅ [Layout] Ready to show app, hiding splash");
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  // Show loading states
  if (!fontsLoaded || isLoading) {
    console.log("⏳ [Layout] Showing loading state");
    return null; // SplashScreen is still visible
  }

  // Show offline message
  if (!isBackendActive) {
    console.log("📡 [Layout] Backend inactive, showing offline message");
    return <OfflineMessage />;
  }

  // 🎯 ENHANCED: Better theme configuration
  const enhancedTheme = {
    ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
    colors: {
      ...(colorScheme === "dark" ? DarkTheme.colors : DefaultTheme.colors),
      primary: "#00DC5A",
      background: "#F5F5F5",
      card: "#FFFFFF",
      text: "#000000",
      border: "#E5E8EB",
      notification: "#FF5252",
      // 🆕 Additional theme colors
      success: "#00DC5A",
      warning: "#FF9800", 
      error: "#FF5252",
      info: "#2196F3",
    },
  };

  return (
    <ThemeProvider value={enhancedTheme}>
      {/* 🎯 ENHANCED: More robust StatusBar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={false}
        hidden={false}
        animated={true}
        networkActivityIndicatorVisible={false}
        showHideTransition="fade"
      />
      
      <EnhancedAuthHandler />
      <Slot />
    </ThemeProvider>
  );
}

// 🎯 ENHANCED: Root component with better error boundaries
export default function EnhancedRootLayout() {
  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <FontProvider>
          <ToastProvider>
            <EnhancedMainLayout />
          </ToastProvider>
        </FontProvider>
      </ApolloProvider>
    </SafeAreaProvider>
  );
}