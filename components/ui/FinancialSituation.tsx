// components/ui/FinancialSituation.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@apollo/client";
import { GET_TRANSACTIONS } from "@/app/graphql/transaction.graphql";
import { useFocusEffect } from "@react-navigation/native";
import { FinancialChart } from "./FinancialChart";
import { useFinancialData } from "@/hooks/useFinancialData";
import { Colors } from "@/app/constants/colors";
import { globalStyles } from "@/app/styles/globalStyles";
import FinancialSituationSkeleton from "./FinancialSituationSkeleton";

// Tipos para los filtros de período
export type PeriodFilter = "Este mes" | "3 M" | "6 M" | string;

// Props con soporte para refreshTrigger
interface FinancialSituationProps {
  refreshTrigger?: number;
}

const FinancialSituation: React.FC<FinancialSituationProps> = ({ refreshTrigger }) => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("3 M");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Obtener los datos financieros utilizando nuestro hook personalizado
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  // Procesar datos con el hook personalizado
  const { chartData, totalExpenses, totalIncome } = useFinancialData(
    data?.transactions || [],
    selectedPeriod
  );

  // Refrescar datos cuando cambia el refreshTrigger
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setIsRefreshing(true);
      
      refetch().finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [refreshTrigger, refetch]);

  // Refrescar datos cuando la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Gestionar selección de período
  const handlePeriodChange = useCallback((period: PeriodFilter) => {
    setSelectedPeriod(period);
  }, []);

  // Renderizar mensaje de error
  if (error) {
    return (
      <View>
        <View style={globalStyles.titleContainer}>
          <Text style={globalStyles.sectionTitle}>Situación Financiera</Text>
        </View>
        <View style={globalStyles.sectionContainer}>
          <Text style={globalStyles.errorText}>Error al cargar datos financieros</Text>
          <Text style={globalStyles.errorSubtext}>{error.message}</Text>
        </View>
      </View>
    );
  }

  // Determinar si está cargando (carga inicial o refresco)
  const isLoading = loading || isRefreshing;

  return (
    <View>
      <View style={globalStyles.titleContainer}>
        <Text style={globalStyles.sectionTitle}>Situación Financiera</Text>
      </View>
      
      {isLoading ? (
        <FinancialSituationSkeleton />
      ) : (
        <View style={globalStyles.sectionContainer}>
          {/* Filtros de período */}
          <View style={styles.filterContainer}>
            {(["Este mes", "3 M", "6 M", currentYear] as PeriodFilter[]).map(
              (period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.filterButton,
                    selectedPeriod === period && styles.selectedFilterButton,
                  ]}
                  onPress={() => handlePeriodChange(period)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterText,
                      selectedPeriod === period && styles.selectedFilterText,
                    ]}
                  >
                    {period}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Resumen de gastos e ingresos */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={[styles.summaryValue, styles.expensesText]}>
                -S/{" "}
                {totalExpenses.toLocaleString("es-PE", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, styles.rightAligned]}>
                Ingresos
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  styles.incomeText,
                  styles.rightAligned,
                ]}
              >
                +S/{" "}
                {totalIncome.toLocaleString("es-PE", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>
          </View>

          {/* Gráfico de barras animado */}
          <FinancialChart data={chartData} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  selectedFilterButton: {
    backgroundColor: Colors.chart.income,
  },
  filterText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#666666",
  },
  selectedFilterText: {
    color: "#FFFFFF",
    fontFamily: "Outfit_500Medium",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
    color: "#666666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: "Outfit_700Bold",
  },
  expensesText: {
    color: Colors.chart.expense,
  },
  incomeText: {
    color: Colors.chart.income,
  },
  rightAligned: {
    textAlign: "right",
  },
});

export default FinancialSituation;