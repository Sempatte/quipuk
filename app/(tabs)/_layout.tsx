// app/(tabs)/_layout.tsx - VERIFICACIÓN DE AUTH MEJORADA
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StatusBar, Platform } from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { TabBar } from "@/components/TabBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 🔥 VERIFICACIÓN DE AUTH MEJORADA - Solo al montar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        
        
        const token = await AsyncStorage.getItem("token");
        const userId = await AsyncStorage.getItem("userId");
        
        if (!token || !userId) {
          
          router.replace("/LoginScreen");
          return;
        }
        
        
      } catch (error) {
        console.error("❌ [TabLayout] Error verificando auth:", error);
        router.replace("/LoginScreen");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []); // 🔥 Solo se ejecuta al montar

  // 🔥 VERIFICACIÓN ADICIONAL AL ENFOCAR - más ligera
  useFocusEffect(
    React.useCallback(() => {
      const quickAuthCheck = async () => {
        try {
          const token = await AsyncStorage.getItem("token");
          if (!token) {
            
            router.replace("/LoginScreen");
          }
        } catch (error) {
          console.error("❌ [TabLayout] Error en quick auth check:", error);
        }
      };

      // Solo hacer la verificación rápida si ya no estamos verificando
      if (!isCheckingAuth) {
        quickAuthCheck();
      }
    }, [router, isCheckingAuth])
  );

  // 🔥 NO RENDERIZAR NADA MIENTRAS SE VERIFICA
  if (isCheckingAuth) {
    return null; // Esto evitará el flasheo y problemas de navegación
  }

  return (
    <>
      {/* 🔥 StatusBar global para todas las tabs - solo una configuración */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={Platform.OS === 'ios'} // 🔥 Diferente para iOS
      />
      
      <Tabs 
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          // 🔥 OPCIONES ADICIONALES PARA PREVENIR BUGS
          headerShown: false,
          lazy: false, // Asegura que las pantallas se carguen correctamente
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