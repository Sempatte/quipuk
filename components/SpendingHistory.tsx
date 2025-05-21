// components/SpendingHistory.tsx
import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert
} from "react-native";
import { useQuery, useApolloClient } from "@apollo/client";
import { GET_TRANSACTIONS } from "@/app/graphql/transaction.graphql";
import { useFocusEffect } from "@react-navigation/native";
import { globalStyles } from "@/app/styles/globalStyles";
import { useSpendingHistory, PeriodFilter } from "@/hooks/useSpendingHistory";
import SpendingHistoryChart from "./ui/SpendingHistoryChart";
import { Transaction } from "@/app/interfaces/transaction.interface";
import SpendingHistorySkeleton from "./ui/SpendingHistorySkeleton";

const { width } = Dimensions.get("window");

/**
 * Props interface for SpendingHistory component
 */
interface SpendingHistoryProps {
  refreshTrigger?: number; // Optional prop to force refresh
}

/**
 * Componente para mostrar el histórico de gastos
 * Solución completa para problemas de refresco y visualización de nuevas transacciones
 */
const SpendingHistory: React.FC<SpendingHistoryProps> = ({ refreshTrigger }) => {
  // Estado para el filtro de período seleccionado
  const [selectedFilter, setSelectedFilter] = useState<PeriodFilter>("Este mes");
  // Estado para manejar animación de refresco
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Estado para seguimiento de refrescos
  const refreshCountRef = React.useRef(0);
  // Acceso al cliente Apollo para manipulación directa de caché
  const apolloClient = useApolloClient();

  // Definir los filtros con su versión mostrada
  const periodFilters: PeriodFilter[] = [
    "Semanal", 
    "Este mes", 
    "Mes ant.", // Abreviación de "Mes anterior" para que quepa
    "Anual"
  ];

  // SOLUCIÓN CLAVE: Consulta con política de no caché para forzar consulta a la red SIEMPRE
  const { data, loading, error, refetch } = useQuery<{ transactions: Transaction[] }>(GET_TRANSACTIONS, {
      fetchPolicy: "no-cache", // Forzar consulta a la red siempre
      notifyOnNetworkStatusChange: true,
    });

  // SOLUCIÓN CRÍTICA 1: Efecto para manejar el refreshTrigger desde componente padre
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      // Incrementar contador de refrescos
      refreshCountRef.current += 1;
      
      // Mostrar indicador de refresco
      setIsRefreshing(true);
      
      // Limpiar caché completamente
      apolloClient.cache.reset().then(() => {
        // Luego refrescar con política de no-cache
        refetch({
          fetchPolicy: 'no-cache'
        }).finally(() => {
          setIsRefreshing(false);
          
          if (__DEV__) {
            console.log(`[SpendingHistory] Refrescado #${refreshCountRef.current}, transacciones: ${data?.transactions?.length || 0}`);
          }
        });
      });
    }
  }, [refreshTrigger, refetch, apolloClient, data?.transactions?.length]);

  // SOLUCIÓN CRÍTICA 2: Refrescar también al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      // Resetear caché completamente
      apolloClient.cache.reset().then(() => {
        // Refrescar con política de no-cache
        refetch({
          fetchPolicy: 'no-cache'
        });
      });
      
      return () => {
        // Al salir de la pantalla, podemos hacer alguna limpieza si es necesario
      };
    }, [refetch, apolloClient])
  );

  // SOLUCIÓN CRÍTICA 3: Verificación de datos antes de procesarlos
  const verifiedTransactions = useMemo(() => {
    const transactions = data?.transactions || [];
    
    // Verificar y filtrar transacciones
    const filteredTransactions = transactions.filter(tx => 
      tx && 
      tx.id && 
      typeof tx.amount === 'number' && 
      !isNaN(tx.amount) &&
      tx.createdAt && 
      new Date(tx.createdAt).toString() !== 'Invalid Date'
    );
    
    // En modo desarrollo, mostrar información de diagnóstico
    if (__DEV__) {
      // Si hay transacciones, mostrar algunas estadísticas
      if (transactions.length > 0) {
        console.log(`[SpendingHistory] Recibidas ${transactions.length} transacciones, válidas: ${filteredTransactions.length}`);
        
        // Ver las transacciones más recientes (ordenadas por fecha)
        const recentTransactions = [...filteredTransactions]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 3);
        
        if (recentTransactions.length > 0) {
          console.log('[SpendingHistory] Transacciones más recientes:');
          recentTransactions.forEach((tx, i) => {
            console.log(`  ${i+1}. ID: ${tx.id}, Fecha: ${new Date(tx.createdAt).toLocaleDateString()}, Tipo: ${tx.type}, Monto: ${tx.amount}`);
          });
        }
      }
    }
    
    return filteredTransactions;
  }, [data?.transactions]);

  // SOLUCIÓN CRÍTICA 4: Usar el hook mejorado para procesar datos
  const { 
    chartData, 
    totalSpending, 
    averageSpending, 
    labels
  } = useSpendingHistory(
    verifiedTransactions,
    selectedFilter
  );

  // Obtener etiquetas para estadísticas según el periodo seleccionado
  const getStatLabels = useCallback((filter: PeriodFilter) => {
    const normalizedFilter = filter === "Mes ant." ? "Mes anterior" : filter;
    
    switch (normalizedFilter) {
      case "Semanal":
        return { left: "Gasto de la semana", right: "Gasto promedio diario" };
      case "Este mes":
      case "Mes anterior":
        return { left: "Gasto del mes", right: "Gasto promedio semanal" };
      case "Anual":
        return { left: "Gasto del año", right: "Gasto promedio mensual" };
      default:
        return { left: "Gasto total", right: "Gasto promedio" };
    }
  }, []);

  const statLabels = getStatLabels(selectedFilter);

  // Formatear montos para mostrar
  const formattedTotal = useMemo(() => 
    `S/ ${Math.round(totalSpending).toLocaleString()}`, 
    [totalSpending]
  );
  
  const formattedAverage = useMemo(() => 
    `S/ ${Math.round(averageSpending).toLocaleString()}`, 
    [averageSpending]
  );

  // SOLUCIÓN CRÍTICA 5: Manejar el cambio de filtro sin refrescar datos
  const handleFilterChange = (filter: PeriodFilter) => {
    // Normalizar el filtro si es necesario
    const actualFilter = filter === "Mes ant." ? "Mes anterior" : filter;
    setSelectedFilter(actualFilter);
    
    // Ya no hacemos refetch ni reset del caché al cambiar filtros
    // Solo cambiamos el filtro y el hook useSpendingHistory se encargará
    // de procesar los datos con el nuevo filtro
  };

  

  // Renderizar mensaje de error
  if (error) {
    return (
      <View style={globalStyles.sectionContainer}>
        <Text style={globalStyles.errorText}>Error al cargar datos</Text>
        <Text style={globalStyles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  if (loading) {
    <SpendingHistorySkeleton />
  }

  // Determinar si está cargando, ya sea por carga inicial o refresco
  const isLoading = loading || isRefreshing;

  return (
    <View>
      <View style={globalStyles.titleContainer}>
        <Text style={globalStyles.sectionTitle}>Histórico de Gastos</Text>
        
      </View>
      
      <View style={globalStyles.sectionContainer}>
        {/* Filtros de período */}
        <View style={styles.filterContainer}>
          {periodFilters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                // Modificar la comparación para aceptar tanto "Mes ant." como "Mes anterior"
                (selectedFilter === filter || 
                 (filter === "Mes ant." && selectedFilter === "Mes anterior") ||
                 (filter === "Mes anterior" && selectedFilter === "Mes ant.")) 
                && styles.selectedFilterButton,
              ]}
              onPress={() => handleFilterChange(filter)}
              activeOpacity={0.7}
              disabled={isLoading} // Deshabilitar durante carga
            >
              <Text
                style={[
                  styles.filterText,
                  (selectedFilter === filter || 
                   (filter === "Mes ant." && selectedFilter === "Mes anterior") ||
                   (filter === "Mes anterior" && selectedFilter === "Mes ant."))
                  && styles.selectedFilterText,
                ]}
                numberOfLines={1}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Estadísticas de gastos */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>{statLabels.left}</Text>
            <Text style={styles.statValueTotal}>
              {isLoading ? "-" : formattedTotal}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, styles.textRight]}>{statLabels.right}</Text>
            <Text style={styles.statValueAverage}>
              {isLoading ? "-" : formattedAverage}
            </Text>
          </View>
        </View>

        {/* Gráfico de gastos */}
        {chartData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay datos para mostrar</Text>
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <SpendingHistoryChart 
              data={chartData} 
              labels={labels}
              period={selectedFilter}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    width: "100%",
    flexWrap: "nowrap", // Asegura que los elementos no se envuelvan a la siguiente línea
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 6, // Reducido para acomodar los 4 filtros
    borderRadius: 8,
    backgroundColor: "#ECECEC",
    flex: 1, // Distribuye el espacio equitativamente
    marginHorizontal: 2, // Pequeño espacio horizontal entre botones
    alignItems: "center",
    justifyContent: "center",
  },
  selectedFilterButton: {
    backgroundColor: "#EF674A",
  },
  filterText: {
    fontSize: 13, // Ligeramente más pequeño para asegurar que quepa
    fontFamily: "Outfit_400Regular",
    color: "#000000",
    textAlign: "center",
  },
  selectedFilterText: {
    color: "#000000",
    fontFamily: "Outfit_500Medium",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    marginTop: 5,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
    fontFamily: "Outfit_400Regular",
  },
  textRight: {
    textAlign: "right",
  },
  statValueTotal: {
    fontSize: 28,
    fontFamily: "Outfit_700Bold",
    color: "#EF674A",
  },
  statValueAverage: {
    fontSize: 28,
    fontFamily: "Outfit_700Bold",
    color: "#EF674A",
    textAlign: "right",
  },
  chartContainer: {
    marginTop: 5,
    height: 240, // Aumentado para dar espacio al contador de transacciones
  },
  loadingContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#666666",
    fontFamily: "Outfit_400Regular",
    marginTop: 10,
  },
  transactionCountText: {
    fontSize: 12, 
    color: "#777",
    textAlign: "center",
    marginTop: 5,
  },
  emptyContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
    fontFamily: "Outfit_400Regular",
  },
  debugButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: 'rgba(239, 103, 74, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  debugButtonText: {
    fontSize: 10,
    color: '#EF674A',
    fontFamily: "Outfit_400Regular",
  }
});

export default SpendingHistory;