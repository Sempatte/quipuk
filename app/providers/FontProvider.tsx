import React, { createContext, useContext, useEffect } from "react";
import { Text, ActivityIndicator } from "react-native";
import { useFonts, Outfit_400Regular, Outfit_700Bold } from "@expo-google-fonts/outfit";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync(); // Previene que la app se muestre antes de cargar las fuentes

// Crear un contexto para la fuente
const FontContext = createContext<{ fontsLoaded: boolean }>({ fontsLoaded: false });

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontsLoaded] = useFonts({
    Outfit_Regular: Outfit_400Regular,
    Outfit_Bold: Outfit_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" />;
  }


  return <FontContext.Provider value={{ fontsLoaded }}>{children}</FontContext.Provider>;
};

// Hook para acceder al estado de la fuente
export const useFont = () => useContext(FontContext);
