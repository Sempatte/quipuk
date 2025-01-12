import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TabBar } from "@/components/TabBar";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />} // Usa tu TabBar personalizada
    >
      {/* Pantallas regulares */}
      <Tabs.Screen
        key="index"
        name="index"
        options={{
          title: "Inicio",
        }}
      />
      <Tabs.Screen
        key="movements"
        name="movements"
        options={{
          title: "Movimientos",
        }}
      />
      {/* Pantalla flotante (botón central) */}
      <Tabs.Screen
        key="add"
        name="add"
        options={{
          title: "Agregar" // Oculta la barra en esta pantalla si necesario
        }}
      />
      <Tabs.Screen
        key="graphics"
        name="graphics"
        options={{
          title: "Gráficos",
        }}
      />
      <Tabs.Screen
        key="profile"
        name="profile"
        options={{
          title: "Perfil",
        }}
      />
    </Tabs>
  );
}
