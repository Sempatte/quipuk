import React from 'react';
import { View, StyleSheet } from 'react-native';
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import FinancialSituation from '@/components/ui/FinancialSituation';



export default function Board() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
    >
      <ThemedView style={styles.container}>
        <FinancialSituation />
        {/* Aquí puedes agregar más componentes para tu viñeta */}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 20,
  },
});