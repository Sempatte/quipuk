import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useQuery } from "@apollo/client";
import { GET_TRANSACTIONS } from "@/app/graphql/transaction.graphql";
import { useFocusEffect } from "@react-navigation/native";
import { globalStyles } from "@/app/styles/globalStyles";
import { useSpendingHistory, PeriodFilter } from "@/hooks/useSpendingHistory";
import SpendingHistoryChart from "./ui/SpendingHistoryChart";

const { width } = Dimensions.get("window");

/**
 * Componente para mostrar el histórico de gastos
 * Muestra un gráfico de área y estadísticas de gastos en diferentes períodos
 */
const SpendingHistory: React.FC = () => {
  // Estado para el filtro de período seleccionado
  const [selectedFilter, setSelectedFilter] = useState<PeriodFilter>("Este mes");

  // Consulta GraphQL para obtener transacciones
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: "network-only",
  });

  // Refrescar datos cuando la pantalla reciba el foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Procesar datos para el gráfico utilizando el hook personalizado
  const { 
    chartData, 
    totalSpending, 
    averageSpending, 
    labels
  } = useSpendingHistory(
    data?.transactions || [],
    selectedFilter
  );

  // Obtener etiquetas para estadísticas según el periodo seleccionado
  const getStatLabels = useCallback((filter: PeriodFilter) => {
    switch (filter) {
      case "Semanal":
        return { left: "Gasto semana", right: "Gasto promedio diario" };
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

  // Manejar la selección del filtro
  const handleFilterChange = (filter: PeriodFilter) => {
    setSelectedFilter(filter);
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

  return (
    <View>
      <View style={globalStyles.titleContainer}>
        <Text style={globalStyles.sectionTitle}>Histórico de Gastos</Text>
      </View>
      
      <View style={globalStyles.sectionContainer}>
        {/* Filtros de período */}
        <View style={styles.filterContainer}>
          {(['Semanal', 'Este mes', 'Mes anterior', 'Anual'] as PeriodFilter[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.selectedFilterButton,
              ]}
              onPress={() => handleFilterChange(filter)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.selectedFilterText,
                ]}
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
            <Text style={styles.statValueTotal}>{formattedTotal}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={[styles.statLabel, styles.textRight]}>{statLabels.right}</Text>
            <Text style={styles.statValueAverage}>{formattedAverage}</Text>
          </View>
        </View>

        {/* Gráfico de gastos */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando datos...</Text>
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
    flexWrap: "wrap",
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#ECECEC",
    minWidth: 80,
    alignItems: "center",
  },
  selectedFilterButton: {
    backgroundColor: "#E57254",
  },
  filterText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#555555",
  },
  selectedFilterText: {
    color: "#FFFFFF",
    fontFamily: "Outfit_500Medium",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
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
    color: "#E57254",
  },
  statValueAverage: {
    fontSize: 28,
    fontFamily: "Outfit_700Bold",
    color: "#E57254",
    textAlign: "right",
  },
  chartContainer: {
    marginTop: 10,
    height: 220,
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
  },
});

export default SpendingHistory;