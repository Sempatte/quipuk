// _layout.tsx (o RootLayout.tsx)
import React, { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar, Platform } from "react-native";
import { ApolloProvider } from "@apollo/client";
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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded] = useFonts({
    Outfit_100Thin,
    Outfit_200ExtraLight,
    Outfit_400Regular,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_500Medium,
    Outfit_300Light
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
    StatusBar.setBarStyle("light-content", true);
    if (Platform.OS === "android") {
      StatusBar.setBackgroundColor("#000000");
      StatusBar.setTranslucent(true);
    }
  }, [fontsLoaded]);

  return (
    <ApolloProvider client={client}>
      <FontProvider>
        <ToastProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <Stack initialRouteName="LoginScreen">
              <Stack.Screen
                name="LoginScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="RegisterScreen"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="+not-found"
                options={{ headerShown: false }}
              />
            </Stack>
          </ThemeProvider>
        </ToastProvider>
      </FontProvider>
    </ApolloProvider>
  );
}
