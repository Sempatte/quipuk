// app/(tabs)/_layout.tsx - LAYOUT SIMPLIFICADO SIN IMPORTS PROBLEMÁTICOS
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { TabBar } from "@/components/TabBar";
import { StatusBar, Platform } from "react-native";

export default function TabLayout() {
  // 🖤 CONFIGURACIÓN DIRECTA SIN HOOK EXTERNO
  useEffect(() => {
    const configureStatusBar = () => {
      try {
        if (Platform.OS === 'android') {
          StatusBar.setBarStyle('light-content', true);
          StatusBar.setBackgroundColor('#000000', true);
          StatusBar.setTranslucent(false);
        } else if (Platform.OS === 'ios') {
          StatusBar.setBarStyle('light-content', true);
        }
      } catch (error) {
        console.warn('Error configurando StatusBar:', error);
      }
    };

    configureStatusBar();
  }, []);

  return (
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
  );
}