import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import client from "./apolloClient"; // Importa tu configuración de Apollo Client
import { ApolloProvider } from "@apollo/client";

import { useColorScheme } from "@/hooks/useColorScheme";
import {FontProvider} from "./providers/FontProvider";
import {useFonts, Outfit_100Thin, Outfit_200ExtraLight, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_500Medium, Outfit_300Light } from "@expo-google-fonts/outfit"

// Prevent the splash screen from auto-hiding before asset loading is complete.
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
  }, [fontsLoaded]);
  return (
    <ApolloProvider client={client}>
      <FontProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" hidden={false} />
        </ThemeProvider>
      </FontProvider>
    </ApolloProvider>
  );
}
