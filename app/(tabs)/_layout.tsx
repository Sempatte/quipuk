import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { StatusBar, Platform } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TabBar } from "@/components/TabBar";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {

    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/LoginScreen"); // Redirige al login si no hay token
      }
    };
    checkAuth();
  }, []);

  

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={false}
      />
      <Tabs tabBar={(props) => <TabBar {...props} />}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            headerShown: false, // Oculta el encabezado en esta pantalla
          }}
        />
        <Tabs.Screen
          name="movements"
          options={{
            title: "Movimientos",
            headerShown: false, // Oculta el encabezado en esta pantalla
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: "Agregar",
            headerShown: false, // Oculta el encabezado en esta pantalla
          }}
        />
        <Tabs.Screen
          name="board"
          options={{
            title: "Board",
            headerShown: false, // Oculta el encabezado en esta pantalla
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            headerShown: false, // Oculta el encabezado en esta pantalla
          }}
        />
      </Tabs>
    </>
  );
}