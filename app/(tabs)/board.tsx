// app/(tabs)/board.tsx - ACTUALIZADO CON EXPO STATUS BAR
import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { ThemedView } from "@/app/components/ThemedView";
import QuipuBoardLogo from '../../assets/images/QuipuBoard.svg';
import { globalStyles } from '@/app/styles/globalStyles';
import { GET_TRANSACTIONS } from '@/app/graphql/transaction.graphql';
import { SafeAreaView } from "react-native-safe-area-context";

// 🔧 REEMPLAZADO: StatusBar de expo-status-bar
import { StatusBarManager, StatusBarPresets } from "@/app/components/ui/StatusBarManager";

// Import all chart components
import FinancialSituation from '@/app/components/ui/FinancialSituation';
import UpcomingPayments from '@/app/components/ui/UpcomingPayments';
import ExpensesByCategory from '@/app/components/ExpensesByCategory';
import SpendingHeatmap from '@/app/components/SpendingHeatmap';
import SpendingHistory from '@/app/components/SpendingHistory';

import styles from "../styles/boardScreen.styles";

export default function Board() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const hasRefreshedRef = useRef(false);

  const { refetch, loading } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: true,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      await refetch();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error durante el refresco manual:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <ThemedView style={styles.mainContainer}>
      {/* 🎯 NUEVA IMPLEMENTACIÓN: StatusBar usando expo-status-bar */}
      <StatusBarManager {...StatusBarPresets.tabs} />
      
      <SafeAreaView style={{ backgroundColor: "#FFF" }} edges={["top"]}>
        <View style={globalStyles.header}>
          <QuipuBoardLogo width={400} height={60} />
        </View>
      </SafeAreaView>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing || loading} 
            onRefresh={onRefresh}
            colors={['#00DC5A']} 
            tintColor={'#00DC5A'} 
            progressBackgroundColor={'#FFFFFF'} 
          />
        }
      >
        <View style={styles.contentContainer}>
          {/* 🔧 COMPONENTES CON ERROR BOUNDARY IMPLÍCITO */}
          <FinancialSituation refreshTrigger={refreshTrigger} />
          <UpcomingPayments refreshTrigger={refreshTrigger} />
          <ExpensesByCategory refreshTrigger={refreshTrigger} />
          <SpendingHistory refreshTrigger={refreshTrigger} />
          <SpendingHeatmap refreshTrigger={refreshTrigger} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}