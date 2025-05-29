// app/(tabs)/board.tsx
import React, { useCallback, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery } from '@apollo/client';
import { ThemedView } from "@/components/ThemedView";
import QuipuBoardLogo from '@/assets/images/QuipuBoard.svg';
import { globalStyles } from '../styles/globalStyles';
import { GET_TRANSACTIONS } from '../graphql/transaction.graphql';

// Import all chart components
import FinancialSituation from '@/components/ui/FinancialSituation';
import UpcomingPayments from '@/components/ui/UpcomingPayments';
import ExpensesByCategory from '@/components/ExpensesByCategory';
import SpendingHeatmap from '@/components/SpendingHeatmap';
import SpendingHistory from '@/components/SpendingHistory';

export default function Board() {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const hasRefreshedRef = useRef(false);

  const { refetch, loading } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: 'network-only',
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

  // 🔧 MEJORAR useFocusEffect con mejor cleanup
  useFocusEffect(
    useCallback(() => {
      let isCancelled = false;
      
      if (!hasRefreshedRef.current) {
        hasRefreshedRef.current = true;
        
        refetch().then(() => {
          if (!isCancelled) {
            setRefreshTrigger(prev => prev + 1);
            if (__DEV__) console.log('Refresco único ejecutado al entrar a Board');
          }
        }).catch(error => {
          if (!isCancelled) {
            console.error('Error durante el refresco inicial:', error);
          }
        });
      }
      
      return () => {
        isCancelled = true;
        hasRefreshedRef.current = false;
      };
    }, [refetch])
  );

  return (
    <ThemedView style={styles.mainContainer}>
      <View style={globalStyles.header}>
        <QuipuBoardLogo width={400} height={60} />
      </View>
      
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