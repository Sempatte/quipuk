import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_TRANSACTIONS } from '@/app/graphql/transaction.graphql';
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart } from "react-native-chart-kit";
import { Transaction, TRANSACTION_COLORS } from '@/app/interfaces/transaction.interface';

// Tipos para los filtros de período
type PeriodFilter = 'Este mes' | '3 M' | '6 M' | string;

// Ajustar ancho para que quede dentro del contenedor
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

// Colores constantes para el gráfico
const EXPENSE_COLOR = TRANSACTION_COLORS.Gastos;
const INCOME_COLOR = TRANSACTION_COLORS.Ingresos;
const GRAY_COLOR = '#DDDDDD';

const FinancialSituation: React.FC = () => {
  const currentYear = new Date().getFullYear().toString();
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('Este mes');
  
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: 'network-only'
  });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  
  // Función para obtener los meses a mostrar según el filtro
  const getMonthsToShow = useCallback(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const months = [];
    
    switch (selectedPeriod) {
      case 'Este mes':
        // Mostrar últimos 6 meses, incluyendo el actual
        for (let i = 5; i >= 0; i--) {
          const monthIndex = currentMonth - i;
          const year = currentYear + Math.floor((currentMonth - i) / 12);
          const adjustedMonthIndex = ((monthIndex % 12) + 12) % 12; // Ajuste para meses negativos
          
          const date = new Date(year, adjustedMonthIndex, 1);
          months.push({
            date,
            name: format(date, 'MMM', { locale: es }),
            isActive: i === 0 // Solo el mes actual está activo
          });
        }
        break;
        
      case '3 M':
        // Mostrar últimos 3 meses, incluyendo el actual
        for (let i = 2; i >= 0; i--) {
          const monthIndex = currentMonth - i;
          const year = currentYear + Math.floor((currentMonth - i) / 12);
          const adjustedMonthIndex = ((monthIndex % 12) + 12) % 12;
          
          const date = new Date(year, adjustedMonthIndex, 1);
          months.push({
            date,
            name: format(date, 'MMM', { locale: es }),
            isActive: true // Todos los meses están activos en 3M
          });
        }
        break;
        
      case '6 M':
        // Mostrar últimos 6 meses, incluyendo el actual
        for (let i = 5; i >= 0; i--) {
          const monthIndex = currentMonth - i;
          const year = currentYear + Math.floor((currentMonth - i) / 12);
          const adjustedMonthIndex = ((monthIndex % 12) + 12) % 12;
          
          const date = new Date(year, adjustedMonthIndex, 1);
          months.push({
            date,
            name: format(date, 'MMM', { locale: es }),
            isActive: true // Todos los meses están activos en 6M
          });
        }
        break;
        
      default:
        // Mostrar todos los meses del año actual hasta el mes actual
        for (let i = 0; i <= currentMonth; i++) {
          const date = new Date(currentYear, i, 1);
          months.push({
            date,
            name: format(date, 'MMM', { locale: es }),
            isActive: true // Todos los meses están activos en el año actual
          });
        }
        break;
    }
    
    return months;
  }, [selectedPeriod]);
  
  // Calcular datos financieros para cada mes
  const processTransactionData = useCallback((transactions: Transaction[], months: any[]) => {
    const processedData = [...months];
    
    // Inicializar valores
    processedData.forEach(month => {
      month.expenses = 0;
      month.income = 0;
    });
    
    // Procesar transacciones
    transactions.forEach(transaction => {
      const txDate = new Date(transaction.createdAt);
      
      // Encontrar el mes correspondiente
      const monthData = processedData.find(m => 
        txDate.getMonth() === m.date.getMonth() && 
        txDate.getFullYear() === m.date.getFullYear()
      );
      
      if (monthData && transaction.status !== 'pending') {
        if (transaction.type === 'gasto') {
          monthData.expenses += transaction.amount;
        } else if (transaction.type === 'ingreso') {
          monthData.income += transaction.amount;
        }
      }
    });
    
    return processedData;
  }, []);
  
  // Calcular totales para el período seleccionado
  const calculateTotals = useCallback((transactions: Transaction[]) => {
    const now = new Date();
    let startDate;
    
    switch (selectedPeriod) {
      case 'Este mes':
        startDate = startOfMonth(now);
        break;
      case '3 M':
        startDate = startOfMonth(subMonths(now, 2));
        break;
      case '6 M':
        startDate = startOfMonth(subMonths(now, 5));
        break;
      default:
        startDate = new Date(parseInt(selectedPeriod), 0, 1);
        break;
    }
    
    const endDate = endOfMonth(now);
    let totalExpenses = 0;
    let totalIncome = 0;
    
    transactions.forEach(transaction => {
      const txDate = new Date(transaction.createdAt);
      
      if (txDate >= startDate && txDate <= endDate && transaction.status !== 'pending') {
        if (transaction.type === 'gasto') {
          totalExpenses += transaction.amount;
        } else if (transaction.type === 'ingreso') {
          totalIncome += transaction.amount;
        }
      }
    });
    
    return { totalExpenses, totalIncome };
  }, [selectedPeriod]);
  
  // Preparar datos para el gráfico y calcular totales
  const { chartData, totalExpenses, totalIncome } = useMemo(() => {
    const transactions: Transaction[] = data?.transactions || [];
    const months = getMonthsToShow();
    const chartData = processTransactionData(transactions, months);
    const { totalExpenses, totalIncome } = calculateTotals(transactions);
    
    return { chartData, totalExpenses, totalIncome };
  }, [data, getMonthsToShow, processTransactionData, calculateTotals]);
  
  // Renderizar gráfico de barras
  const renderBarChart = () => {
    if (loading || chartData.length === 0) {
      return (
        <View style={styles.loadingChart}>
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      );
    }
    
    // Evitar valores cero que pueden no mostrar barras
    const ensureMinValue = (value: number) => value === 0 ? 0.1 : value;
    
    // Preparar datos para el gráfico
    const barData = {
      labels: chartData.map(item => item.name),
      datasets: [
        {
          data: chartData.map(item => ensureMinValue(item.expenses)),
          color: (opacity = 1, index: number = 0) => {
            if (index >= 0 && index < chartData.length) {
              return chartData[index].isActive ? EXPENSE_COLOR : GRAY_COLOR;
            }
            return GRAY_COLOR;
          }
        },
        {
          data: chartData.map(item => ensureMinValue(item.income)),
          color: (opacity = 1, index: number = 0) => {
            if (index >= 0 && index < chartData.length) {
              return chartData[index].isActive ? INCOME_COLOR : GRAY_COLOR;
            }
            return GRAY_COLOR;
          }
        }
      ],
      legend: ["Gastos", "Ingresos"]
    };
    
    return (
      <View style={styles.chartContainer}>
        <BarChart
          data={barData}
          width={CHART_WIDTH}
          height={180}
          yAxisLabel="S/ "
          yAxisSuffix=""
          chartConfig={{
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            barPercentage: 0.6,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForLabels: {
              fontSize: 10,
            },
          }}
          verticalLabelRotation={0}
          fromZero={true}
          showBarTops={false}
          withInnerLines={true}
          segments={4}
          style={{
            borderRadius: 16,
            paddingRight: 0,
            paddingLeft: 0,
            marginLeft: -10,
          }}
        />
      </View>
    );
  };
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al cargar datos financieros</Text>
        <Text style={styles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Situación Financiera</Text>
      
      {/* Filtros de período */}
      <View style={styles.filterContainer}>
        {(['Este mes', '3 M', '6 M', currentYear] as PeriodFilter[]).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.filterButton,
              selectedPeriod === period && styles.selectedFilterButton
            ]}
            onPress={() => setSelectedPeriod(period)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                selectedPeriod === period && styles.selectedFilterText
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Resumen de gastos e ingresos */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Gastos</Text>
          <Text style={[styles.summaryValue, styles.expensesText]}>
            -S/{totalExpenses.toLocaleString('es-PE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, styles.rightAligned]}>Ingresos</Text>
          <Text style={[styles.summaryValue, styles.incomeText, styles.rightAligned]}>
            +S/{totalIncome.toLocaleString('es-PE', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </Text>
        </View>
      </View>
      
      {/* Gráfico de barras */}
      {renderBarChart()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#000000',
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  selectedFilterButton: {
    backgroundColor: '#00DC5A',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666666',
  },
  selectedFilterText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_500Medium',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#666666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'Outfit_700Bold',
  },
  expensesText: {
    color: '#FF5252',
  },
  incomeText: {
    color: '#00DC5A',
  },
  rightAligned: {
    textAlign: 'right',
  },
  chartContainer: {
    height: 180,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  loadingChart: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FF5252',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666666',
    textAlign: 'center',
  },
});

export default FinancialSituation;