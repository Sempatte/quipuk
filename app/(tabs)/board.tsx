// app/(tabs)/board.tsx
import React, { useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useApolloClient } from '@apollo/client';
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

/**
 * Board screen component that displays financial data visualizations
 * Enhanced with comprehensive data refresh when screen is focused
 */
export default function Board() {
  // State for pull-to-refresh functionality
  const [refreshing, setRefreshing] = useState(false);
  // Estado para forzar el refresco de componentes hijos
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Apollo Client para operaciones manuales de caché
  const apolloClient = useApolloClient();

  // Main query to fetch transaction data
  const { refetch: refetchTransactions, loading } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  // Función para realizar un refresco completo
  const performFullRefresh = useCallback(async () => {
    try {
      // 1. Refrescar datos principales
      await refetchTransactions();
      
      // 2. Limpiar caché específica para forzar nuevas consultas
      // Esto es crítico para el componente de histórico que podría estar usando diferentes variables
      await apolloClient.cache.evict({ 
        fieldName: 'transactions'
      });
      await apolloClient.cache.gc();
      
      // 3. Incrementar el trigger de refresco para los componentes hijos
      setRefreshTrigger(prev => prev + 1);
      
      if (__DEV__) console.log('Refresco completo ejecutado, trigger:', refreshTrigger + 1);
    } catch (error) {
      console.error('Error durante el refresco completo:', error);
    }
  }, [refetchTransactions, apolloClient, refreshTrigger]);

  // Function to handle manual pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await performFullRefresh();
    setRefreshing(false);
  }, [performFullRefresh]);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Ejecutar refresco completo cuando la pantalla obtiene foco
      performFullRefresh();
      
      return () => {
        // Cleanup si es necesario
      };
    }, [performFullRefresh])
  );

  return (
    <ThemedView style={styles.mainContainer}>
      {/* Header with the logo */}
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
          {/* Todos los componentes ahora reciben el refreshTrigger */}
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
