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
  // State for pull-to-refresh functionality
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para forzar el refresco de componentes hijos
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Ref para controlar si ya se refrescó en esta sesión de enfoque
  const hasRefreshedRef = useRef(false);

  // Main query to fetch transaction data
  const { refetch, loading } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  // Function to handle manual pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      // Refrescar datos principales
      await refetch();
      
      // Actualizar trigger para refrescar componentes hijos
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error durante el refresco manual:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Solución simplificada: un solo useEffect que se activa cuando la pantalla obtiene foco
  useFocusEffect(
    useCallback(() => {
      // Solo refrescar una vez al entrar a la pantalla
      if (!hasRefreshedRef.current) {
        // Indicar que ya se refrescó
        hasRefreshedRef.current = true;
        
        // Realizar refresco
        refetch().then(() => {
          // Incrementar trigger para actualizar componentes hijos
          setRefreshTrigger(prev => prev + 1);
          if (__DEV__) console.log('Refresco único ejecutado al entrar a Board');
        }).catch(error => {
          console.error('Error durante el refresco inicial:', error);
        });
      }
      
      // Cleanup: reiniciar la bandera cuando la pantalla pierde foco
      return () => {
        hasRefreshedRef.current = false;
      };
    }, [refetch])
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
          {/* Componentes con refreshTrigger */}
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