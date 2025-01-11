import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { TabBar } from '@/components/TabBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs tabBar={props => <TabBar {...props} />} >
      <Tabs.Screen key={1} name="index" options={{title: "Inicio"}} />
      <Tabs.Screen key={2} name="movements" options={{title: "Movimientos"}} />
      <Tabs.Screen key={3} name="graphics" options={{title: "Circulo"}} />
      <Tabs.Screen key={4} name="profile" options={{title: "Perfil"}} />
    </Tabs>
  )
}
