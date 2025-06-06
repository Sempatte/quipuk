// components/ExpensesByCategory.tsx
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
import { globalStyles } from "@/app/styles/globalStyles";
import { useExpenseCategories, PeriodFilter } from "@/app/hooks/useExpenseCategories";
import PieChart from "./ui/PieChart";
import Legend from "./ui/Legend";
import ExpensesByCategorySkeleton from "./ui/ExpensesByCategorySkeleton";
import { Transaction } from "@/app/interfaces/transaction.interface";

// Props para el componente con soporte de refreshTrigger
interface ExpensesByCategoryProps {
  refreshTrigger?: number;
}

// Componente principal
const ExpensesByCategory: React.FC<ExpensesByCategoryProps> = ({ refreshTrigger }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>("Este mes");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const currentYear = new Date().getFullYear().toString();
  
  // Consulta para obtener las transacciones con tipo adecuado
  const { data, loading, error, refetch } = useQuery<{ transactions: Transaction[] }>(GET_TRANSACTIONS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
  });

  // Refrescar datos cuando cambia el refreshTrigger
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setIsRefreshing(true);
      
      refetch().finally(() => {
        setIsRefreshing(false);
    
      });
    }
  }, [refreshTrigger, refetch]);

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
  const handlePeriodChange = (period: PeriodFilter): void => {
    setSelectedPeriod(period);
    // Resetear la categoría activa al cambiar el periodo
    setActiveCategory(null);
  };

  // Gestionar la selección de categoría
  const handleCategorySelect = (categoryName: string | null): void => {
    setActiveCategory(categoryName);
  };

  if (error) {
    return (
      <View>
        <View style={globalStyles.titleContainer}>
          <Text style={globalStyles.sectionTitle}>Gastos por categoría</Text>
        </View>
        <View style={globalStyles.sectionContainer}>
          <Text style={globalStyles.errorText}>Error al cargar datos</Text>
          <Text style={globalStyles.errorSubtext}>{error.message}</Text>
        </View>
      </View>
    );
  }

  // Determinar si está cargando, ya sea por carga inicial o refresco
  const isLoading = loading || isRefreshing;

  if (isLoading) {
    return <ExpensesByCategorySkeleton />;
  }

  // Crear array tipado para los filtros
  const periodFilters: PeriodFilter[] = ["Este mes", "3 Meses", "6 Meses", currentYear as PeriodFilter];

  return (
    <View>
      <View style={globalStyles.titleContainer}>
        <Text style={globalStyles.sectionTitle}>Gastos por categoría</Text>
      </View>
      <View style={globalStyles.sectionContainer}>
        {/* Filtros de período */}
        <View style={styles.filterContainer}>
          {periodFilters.map((period) => (
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
          ))}
        </View>

        {/* Gráfico circular */}
        <PieChart 
          categories={expenseData.categories} 
          totalExpense={expenseData.totalExpense}
          month={expenseData.month}
          periodLabel={expenseData.periodLabel}
          activeCategory={activeCategory}
        />
        
        {/* Leyenda interactiva */}
        <Legend 
          categories={expenseData.categories}
          activeCategory={activeCategory}
          onSelectCategory={handleCategorySelect}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    minWidth: 75,
    alignItems: "center",
  },
  selectedFilterButton: {
    backgroundColor: "#00DC5A",
  },
  filterText: {
    fontSize: 14,
    fontFamily: "Outfit_400Regular",
    color: "#000000", 
  },
  selectedFilterText: {
    color: "#000000", 
    fontFamily: "Outfit_500Medium",
  },
});

export default React.memo(ExpensesByCategory);