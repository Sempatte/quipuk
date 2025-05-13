import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_TRANSACTIONS } from '@/app/graphql/transaction.graphql';
import { format, subMonths, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

// Tipos para los filtros de período
type PeriodFilter = 'Este mes' | '3 M' | '6 M' | '2024';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Transaction {
  id: number;
  userId: number;
  title: string;
  description: string;
  amount: number;
  type: 'gasto' | 'ingreso' | 'ahorro';
  frequent: boolean;
  category: string;
  status?: 'pending' | 'completed';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

const FinancialSituation: React.FC = () => {
  // Estado para el filtro de período seleccionado
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('Este mes');
  
  // Consulta GraphQL para obtener todas las transacciones
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: 'network-only' // Forzar que siempre busque del servidor
  });

  // Refrescar datos cuando la pantalla reciba el foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );
  
  // Calcular fecha de inicio según el filtro seleccionado
  const getDateRange = useCallback(() => {
    const now = new Date();
    const endDate = now;
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
      case '2024':
        startDate = new Date(2024, 0, 1); // 1 de enero de 2024
        break;
      default:
        startDate = startOfMonth(now);
    }
    
    return { startDate, endDate };
  }, [selectedPeriod]);

  // Función para calcular datos financieros mensuales
  const calculateMonthlyFinancialData = useCallback((transactions: Transaction[], startDate: Date, endDate: Date) => {
    // Crear un objeto para almacenar los datos por mes
    const monthlyData: Record<string, { 
      expenses: number; 
      income: number; 
      displayName: string;
      current: boolean;
    }> = {};
    
    // Inicializar los meses desde startDate hasta endDate
    let currentDate = new Date(startDate);
    const currentMonthKey = format(new Date(), 'MMM-yyyy', { locale: es });
    
    while (currentDate <= endDate) {
      const monthKey = format(currentDate, 'MMM-yyyy', { locale: es });
      const monthDisplay = format(currentDate, 'MMM', { locale: es });
      
      monthlyData[monthKey] = {
        expenses: 0,
        income: 0,
        displayName: monthDisplay,
        current: monthKey === currentMonthKey
      };
      
      // Avanzar al siguiente mes
      currentDate = addMonths(currentDate, 1);
    }
    
    // Clasificar transacciones por mes
    transactions.forEach(transaction => {
      const txDate = new Date(transaction.createdAt);
      
      // Verificar si la fecha está dentro del rango y la transacción es válida
      if (txDate >= startDate && txDate <= endDate && transaction.status !== 'pending') {
        const monthKey = format(txDate, 'MMM-yyyy', { locale: es });
        
        // Asegurarse de que el mes existe en nuestro objeto
        if (monthlyData[monthKey]) {
          // Sumar al monto correspondiente según el tipo
          if (transaction.type === 'gasto') {
            monthlyData[monthKey].expenses += transaction.amount;
          } else if (transaction.type === 'ingreso') {
            monthlyData[monthKey].income += transaction.amount;
          }
        }
      }
    });
    
    // Convertir el objeto a un array para el gráfico
    return Object.entries(monthlyData).map(([_, data]) => ({
      name: data.displayName,
      expenses: data.expenses,
      income: data.income,
      current: data.current
    }));
  }, []);

  // Calcular totales actuales para el período seleccionado
  const calculateTotals = useCallback((transactions: Transaction[]) => {
    const { startDate, endDate } = getDateRange();
    let totalExpenses = 0;
    let totalIncome = 0;
    
    transactions.forEach(transaction => {
      const txDate = new Date(transaction.createdAt);
      
      // Solo considerar transacciones dentro del rango de fechas y completadas
      if (txDate >= startDate && txDate <= endDate && transaction.status !== 'pending') {
        if (transaction.type === 'gasto') {
          totalExpenses += transaction.amount;
        } else if (transaction.type === 'ingreso') {
          totalIncome += transaction.amount;
        }
      }
    });
    
    return { totalExpenses, totalIncome };
  }, [getDateRange]);

  // Obtener transacciones y calcular datos para el gráfico
  const { chartData, totalExpenses, totalIncome } = useMemo(() => {
    // Obtener las transacciones
    const transactions: Transaction[] = data?.transactions || [];
    const { startDate, endDate } = getDateRange();
    
    // Calcular totales para el período seleccionado
    const { totalExpenses, totalIncome } = calculateTotals(transactions);
    
    // Generar datos para el gráfico
    let chartData = calculateMonthlyFinancialData(transactions, startDate, endDate);
    
    // Para "Este mes", mostrar solo el mes actual (como en la imagen de referencia)
    if (selectedPeriod === 'Este mes') {
      chartData = chartData.filter(item => item.current);
    }

    return { 
      chartData, 
      totalExpenses, 
      totalIncome
    };
  }, [data, getDateRange, calculateTotals, calculateMonthlyFinancialData, selectedPeriod]);

  // Renderizar gráfico de barras usando Recharts
  const renderBarChart = () => {
    if (loading || chartData.length === 0) {
      return (
        <View style={styles.loadingChart}>
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
            barSize={selectedPeriod === 'Este mes' ? 60 : 20}
            barGap={5}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12, fill: '#666666' }}
              tickLine={false}
              axisLine={{ stroke: '#E0E0E0' }}
            />
            <YAxis 
              tickFormatter={(value) => `S/ ${value}`}
              tick={{ fontSize: 10, fill: '#666666' }}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Bar 
              dataKey="expenses" 
              fill="#FF5252" 
              radius={[4, 4, 0, 0]} 
              name="Gastos"
            />
            <Bar 
              dataKey="income" 
              fill="#00DC5A" 
              radius={[4, 4, 0, 0]} 
              name="Ingresos"
            />
          </BarChart>
        </ResponsiveContainer>
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
        {(['Este mes', '3 M', '6 M', '2024'] as PeriodFilter[]).map((period) => (
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
    marginTop: 10,
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