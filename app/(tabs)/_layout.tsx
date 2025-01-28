import { Tabs } from "expo-router";
import React from "react";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TabBar } from "@/components/TabBar";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
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
        name="graphics"
        options={{
          title: "Gráficos",
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
  );
}
