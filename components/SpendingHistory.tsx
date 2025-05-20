
// components/SpendingHistory.tsx
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

  // Definir los filtros con su versión mostrada
  const periodFilters: PeriodFilter[] = [
    "Semanal", 
    "Este mes", 
    "Mes ant.", // Abreviación de "Mes anterior" para que quepa
    "Anual"
  ];

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
        return { left: "Gasto del mes", right: "Gasto promedio semanal" };
      case "Este mes":
      case "Mes anterior":
      case "Mes ant.": // Agregamos el caso para la versión abreviada
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
    // Si se selecciona la versión abreviada, usar el nombre completo internamente
    const actualFilter = filter === "Mes ant." ? "Mes anterior" : filter;
    setSelectedFilter(actualFilter);
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