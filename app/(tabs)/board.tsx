import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedView } from "@/components/ThemedView";
import FinancialSituation from '@/components/ui/FinancialSituation';
import RecentTransactions from '@/components/ui/RecentTransactions';
import QuipuBoardLogo from '@/assets/images/QuipuBoard.svg';
import { globalStyles } from '../styles/globalStyles';
import UpcomingPayments from '@/components/ui/UpcomingPayments';

export default function Board() {
  return (
    <ThemedView style={styles.mainContainer}>
      {/* Header con la imagen del logo */}
      <View style={globalStyles.header}>
        <QuipuBoardLogo width={200} height={60} />
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <FinancialSituation />
          <UpcomingPayments />
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