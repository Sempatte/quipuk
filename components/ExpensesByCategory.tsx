import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@apollo/client";
import { GET_TRANSACTIONS } from "@/app/graphql/transaction.graphql";
import { useFocusEffect } from "@react-navigation/native";
import { globalStyles } from "@/app/styles/globalStyles";
import { Colors } from "@/constants/Colors";
import { useExpenseCategories, PeriodFilter } from "@/hooks/useExpenseCategories";
import PieChart from "./ui/PieChart";
import Legend from "./ui/Legend";

// Componente principal
const ExpensesByCategory: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("Este mes");
  const currentYear = new Date().getFullYear().toString();
  
  // Consulta para obtener las transacciones
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: "network-only",
  });

  // Refrescar datos cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  
  // Usar el hook para procesar los datos de gastos por categoría
  const expenseData = useExpenseCategories(
    data?.transactions || [],
    selectedPeriod
  );

  // Gestionar la selección de período
  const handlePeriodChange = (period: PeriodFilter) => {
    setSelectedPeriod(period);
  };

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
        <Text style={globalStyles.sectionTitle}>Gastos por categoría</Text>
      </View>
      <View style={globalStyles.sectionContainer}>
        {/* Filtros de período */}
        <View style={styles.filterContainer}>
          {(["Este mes", "3 Meses", "6 Meses", currentYear] as PeriodFilter[]).map(
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

        {/* Gráfico circular y leyenda */}
        {loading ? (
          <View style={globalStyles.loadingContainer}>
            <Text style={globalStyles.loadingText}>Cargando datos...</Text>
          </View>
        ) : (
          <>
            <PieChart 
              categories={expenseData.categories} 
              totalExpense={expenseData.totalExpense}
              month={expenseData.month}
            />
            <Legend categories={expenseData.categories} />
          </>
        )}
      </View>
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
});

export default ExpensesByCategory;