// app/(tabs)/_layout.tsx - LIMPIO SIN CONFIGURACIÓN STATUSBAR
import { Tabs } from "expo-router";
import React from "react";
import { TabBar } from "@/app/components/TabBar";

export default function TabLayout() {
  return (
    <Tabs 
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
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