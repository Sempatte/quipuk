// app/(tabs)/_layout.tsx - STATUSBAR NEGRO FORZADO EN TABS
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { StatusBar, Platform } from "react-native";
import { TabBar } from "@/components/TabBar";

export default function TabLayout() {
  
  // 🖤 FORZAR STATUSBAR NEGRO EN TABS
  useEffect(() => {
    console.log("🖤 [TabLayout] Forzando StatusBar negro en tabs");
    
    if (Platform.OS === "android") {
      StatusBar.setBarStyle("light-content", true);
      StatusBar.setBackgroundColor("#000000", true);
      StatusBar.setTranslucent(false);
    } else if (Platform.OS === "ios") {
      StatusBar.setBarStyle("light-content", true);
    }
  }, []);

  return (
    <>
      {/* 🖤 STATUSBAR NEGRO EXPLÍCITO EN TABS */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="#000000" 
        translucent={false}
        hidden={false}
        animated={false}
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