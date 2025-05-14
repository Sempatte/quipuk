import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import FinancialSituation from '@/components/ui/FinancialSituation';
import RecentTransactions from '@/components/ui/RecentTransactions';
import QuipuBoardLogo from '@/assets/images/QuipuBoard.svg';
import { globalStyles } from '../styles/globalStyles';
import UpcomingPayments from '@/components/ui/UpcomingPayments';
import ExpensesByCategory from '@/components/ExpensesByCategory';
import SpendingHeatmap from '@/components/SpendingHeatmap';
import SpendingHistory from '@/components/SpendingHistory';
import SpendingHistoryChart from '@/components/ui/SpendingHistoryChart';

export default function Board() {
  return (
    <ThemedView style={styles.mainContainer}>
      {/* Header con la imagen del logo */}
      <View style={globalStyles.header}>
        <QuipuBoardLogo width={400} height={60} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <FinancialSituation />
          <UpcomingPayments />
          <ExpensesByCategory />
          <SpendingHistory />
          <SpendingHeatmap />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
    flex: 1,
    paddingTop: 10,
    paddingBottom: 50,
  },
});

// TO DO: En la leyenda de los gastos por categoria, deben ser botones los cuales deben filtrar el PieChart. Guiarse del figma de la app de Quipuk. Darle el mismo diseño de los botones de la parte superior de la pantalla. Agregar borde blanco a las barritas que componen el PieChart. En los filtro superiores la letra es negra y el fondo verde.