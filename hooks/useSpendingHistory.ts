// hooks/useSpendingHistory.ts
import { useState, useCallback, useMemo } from "react";
import { 
  format, 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  subMonths, 
  eachDayOfInterval, 
  eachMonthOfInterval,
  isSameDay,
  isSameMonth,
  addDays
} from "date-fns";
import { es } from "date-fns/locale";
import { Transaction } from "@/app/interfaces/transaction.interface";

// Tipos para los filtros de período
export type PeriodFilter = "Semanal" | "Este mes" | "Mes anterior" | "Mes ant." | "Anual";

// Interfaz para el resultado del hook
export interface SpendingHistoryResult {
  chartData: number[];
  totalSpending: number;
  averageSpending: number;
  labels: string[];
}

/**
 * Hook mejorado para procesar datos de gastos históricos
 * - Verificación mejorada de datos
 * - Filtrado más robusto
 * - Mejor manejo de casos bordes
 * 
 * @param transactions - Las transacciones a procesar
 * @param periodFilter - El filtro de período seleccionado
 * @returns Datos procesados para el gráfico y estadísticas
 */
export const useSpendingHistory = (
  transactions: Transaction[] = [],
  periodFilter: PeriodFilter
): SpendingHistoryResult => {
  
  return useMemo(() => {
    // Log para verificación en desarrollo
    if (__DEV__) {
      console.log(`useSpendingHistory procesando ${transactions.length} transacciones para período ${periodFilter}`);
    }
    
    // Si no hay transacciones, devolver datos vacíos
    if (!transactions || transactions.length === 0) {
      if (__DEV__) console.log('No hay transacciones para procesar');
      return {
        chartData: [],
        totalSpending: 0,
        averageSpending: 0,
        labels: [],
      };
    }

    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let intervalType: 'day' | 'week' | 'month' = "day";
    let formatString = "d";
    
    // Determinar el rango de fechas según el filtro
    switch (periodFilter) {
      case "Semanal":
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Semana comienza el lunes
        intervalType = "day";
        formatString = "d";
        break;
      
      case "Este mes":
        startDate = startOfMonth(now);
        intervalType = "day";
        formatString = "d";
        break;
      
      case "Mes anterior":
      case "Mes ant.": // Manejar también la versión abreviada
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = addDays(startOfMonth(now), -1); // Hasta el último día del mes anterior
        intervalType = "day";
        formatString = "d";
        break;
      
      case "Anual":
        startDate = startOfYear(now);
        intervalType = "month";
        formatString = "MMM";
        break;
      
      default:
        startDate = startOfMonth(now);
        intervalType = "day";
        formatString = "d";
    }

    // MEJORA: Verificación explícita de que las transacciones son objetos válidos
    const validTransactions = transactions.filter(tx => 
      tx && typeof tx === 'object' && tx.type && tx.amount !== undefined && tx.createdAt
    );
    
    // MEJORA: Filtrar transacciones solo de tipo "gasto" y completadas, con verificación adicional
    const expenseTransactions = validTransactions.filter(tx => {
      const isExpense = tx.type === "gasto";
      const isCompleted = tx.status !== "pending";
      const hasTxDate = Boolean(tx.createdAt);
      
      return isExpense && isCompleted && hasTxDate;
    });
    
    if (__DEV__) {
      console.log(`Filtrado: ${validTransactions.length} transacciones válidas, ${expenseTransactions.length} gastos`);
    }

    // Obtener los intervalos (días, semanas o meses)
    let intervals: Date[] = [];
    
    if (intervalType === "day") {
      // MEJORA: Verificación para asegurarse que endDate es después de startDate
      if (startDate > endDate) {
        console.warn('startDate es después de endDate, usando fechas por defecto');
        startDate = startOfMonth(now);
        endDate = now;
      }
      
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
    } else if (intervalType === "month") {
      intervals = eachMonthOfInterval({ start: startDate, end: endDate });
    } else {
      // Valores fallback por si acaso
      intervals = eachDayOfInterval({ start: startDate, end: endDate });
    }

    // Inicializar array para datos del gráfico
    const chartData: number[] = Array(intervals.length).fill(0);
    const labels: string[] = intervals.map(date => 
      format(date, formatString, { locale: es })
    );

    // MEJORA: Verificar que haya intervalos
    if (intervals.length === 0) {
      console.warn('No se pudieron generar intervalos de tiempo');
      return {
        chartData: [],
        totalSpending: 0,
        averageSpending: 0,
        labels: [],
      };
    }

    // Sumar los gastos para cada intervalo, con mejor manejo de errores
    expenseTransactions.forEach(tx => {
      try {
        const txDate = new Date(tx.createdAt);
        
        // Saltar transacciones con fechas inválidas
        if (isNaN(txDate.getTime())) {
          console.warn('Fecha inválida para transacción:', tx.id);
          return;
        }
        
        // Saltar transacciones fuera del rango de fechas
        if (txDate < startDate || txDate > endDate) return;

        // Encontrar el índice correspondiente según el tipo de intervalo
        let index = -1;
        
        if (intervalType === "day") {
          index = intervals.findIndex(date => isSameDay(date, txDate));
        } else if (intervalType === "month") {
          index = intervals.findIndex(date => isSameMonth(date, txDate));
        } else {
          // Fallback
          index = intervals.findIndex(date => isSameDay(date, txDate));
        }

        // Si encontramos el intervalo, sumar el gasto
        if (index !== -1) {
          // MEJORA: Verificar que amount es un número válido
          const amount = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0;
          chartData[index] += amount;
        }
      } catch (error) {
        console.error('Error procesando transacción:', error);
      }
    });

    // Calcular gasto total
    const totalSpending = chartData.reduce((sum, amount) => sum + amount, 0);
    
    // Calcular promedio según el período
    let averageSpending = 0;
    if (periodFilter === "Anual") {
      // Promedio mensual para el año
      const activeMonths = chartData.filter(amount => amount > 0).length || 1;
      averageSpending = totalSpending / activeMonths;
    } else if (periodFilter === "Semanal") {
      // Promedio diario para la semana
      const activeDays = chartData.filter(amount => amount > 0).length || 1;
      averageSpending = totalSpending / activeDays;
    } else {
      // Promedio semanal para los otros períodos
      const totalWeeks = Math.ceil(intervals.length / 7) || 1;
      averageSpending = totalSpending / totalWeeks;
    }

    // Log para verificación en desarrollo
    if (__DEV__) {
      console.log(`Resultado: Total=${totalSpending}, Promedio=${averageSpending}, Puntos=${chartData.length}`);
    }

    return {
      chartData: chartData.length > 0 ? chartData : [0],
      totalSpending,
      averageSpending,
      labels,
    };
  }, [transactions, periodFilter]); // Dependencias correctas y minimizadas
};