import { useMemo } from "react";
import { 
  format, 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  subMonths, 
  eachDayOfInterval, 
  eachWeekOfInterval, 
  eachMonthOfInterval,
  isSameDay,
  isSameWeek,
  isSameMonth
} from "date-fns";
import { es } from "date-fns/locale";
import { Transaction } from "@/app/interfaces/transaction.interface";

// Tipos para los filtros de período
export type PeriodFilter = "Semanal" | "Este mes" | "Mes anterior" | "Anual";

// Interfaz para el resultado del hook
export interface SpendingHistoryResult {
  chartData: number[];
  totalSpending: number;
  averageSpending: number;
  labels: string[];
}

/**
 * Hook para procesar datos de gastos históricos
 * @param transactions - Las transacciones a procesar
 * @param periodFilter - El filtro de período seleccionado
 * @returns Datos procesados para el gráfico y estadísticas
 */
export const useSpendingHistory = (
  transactions: Transaction[] = [],
  periodFilter: PeriodFilter
): SpendingHistoryResult => {
  
  return useMemo(() => {
    // Si no hay transacciones, devolver datos vacíos
    if (!transactions.length) {
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
    // Usamos un valor literal para intervalType para evitar problemas de tipo
    let intervalType = "day";
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
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = subMonths(startOfMonth(now), 0);
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

    // Filtrar transacciones solo de tipo "gasto" y completadas
    const expenseTransactions = transactions.filter(
      tx => tx.type === "gasto" && tx.status !== "pending"
    );

    // Obtener los intervalos (días, semanas o meses)
    let intervals: Date[] = [];
    
    if (intervalType === "day") {
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

    // Sumar los gastos para cada intervalo
    expenseTransactions.forEach(tx => {
      const txDate = new Date(tx.createdAt);
      
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
        chartData[index] += tx.amount;
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
    } else {
      // Promedio semanal para los otros períodos
      const totalWeeks = Math.ceil(intervals.length / 7) || 1;
      averageSpending = totalSpending / totalWeeks;
    }

    return {
      chartData,
      totalSpending,
      averageSpending,
      labels,
    };
  }, [transactions, periodFilter]);
};