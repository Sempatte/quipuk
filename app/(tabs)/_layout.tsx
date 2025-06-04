import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StatusBar, Platform } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TabBar } from "@/components/TabBar";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const quickAuthCheck = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        
        if (!token || !userId) {
          console.log("❌ [TabLayout] No hay credenciales, redirigiendo...");
          router.replace("/LoginScreen"); // Ruta simple
          return;
        }
        
        console.log("✅ [TabLayout] Usuario autenticado en tabs");
      } catch (error) {
        console.error("❌ [TabLayout] Error en auth check:", error);
        router.replace("/LoginScreen");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    quickAuthCheck();
  }, [router]);

  if (isCheckingAuth) {
    return null;
  }

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={Platform.OS === 'ios'}
      />
      
      <Tabs 
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          lazy: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="movements"
          options={{
            title: "Movimientos",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Agregar",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="board"
          options={{
            title: "Board",
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            headerShown: false,
          }}
        />
      </Tabs>
    </>
  );
}