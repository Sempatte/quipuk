// hooks/useSpendingHistory.ts
import { useState, useCallback, useMemo, useEffect } from "react";
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
  addDays,
  endOfMonth
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
 * Hook completamente reescrito para procesar datos de gastos históricos
 * Solución robusta para problemas con fechas y transacciones nuevas
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
    // ========== PASO 1: PREPARACIÓN DE DATOS ==========
    
    // Si no hay transacciones, devolver datos vacíos
    if (!transactions || transactions.length === 0) {
      if (__DEV__) console.log('[useSpendingHistory] No hay transacciones para procesar');
      return {
        chartData: [],
        totalSpending: 0,
        averageSpending: 0,
        labels: [],
      };
    }

    // ========== PASO 2: CONFIGURAR FECHAS SEGÚN EL PERÍODO ==========
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now); // Crear una copia para no modificar la fecha original
    let intervalType: 'day' | 'week' | 'month' = "day";
    let formatString = "d";
    
    // Normalizar el filtro de período
    const normalizedFilter = periodFilter === "Mes ant." ? "Mes anterior" : periodFilter;
    
    // Determinar el rango de fechas según el filtro
    switch (normalizedFilter) {
      case "Semanal":
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Semana comienza el lunes
        // CRUCIAL: Para semana, el endDate debe incluir hasta hoy a las 23:59:59
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        intervalType = "day";
        formatString = "d";
        break;
      
      case "Este mes":
        startDate = startOfMonth(now);
        // CRUCIAL: Para mes actual, el endDate debe incluir hasta hoy a las 23:59:59
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        intervalType = "day";
        formatString = "d";
        break;
      
      case "Mes anterior":
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        intervalType = "day";
        formatString = "d";
        break;
      
      case "Anual":
        startDate = startOfYear(now);
        // CRUCIAL: Para año, el endDate debe incluir hasta hoy a las 23:59:59
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        intervalType = "month";
        formatString = "MMM";
        break;
      
      default:
        startDate = startOfMonth(now);
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        intervalType = "day";
        formatString = "d";
    }

    // Log de fechas para debug
    if (__DEV__) {
      console.log(`[useSpendingHistory] Período: ${normalizedFilter}`);
      console.log(`[useSpendingHistory] Rango: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
    }
    
    // ========== PASO 3: FILTRAR TRANSACCIONES VÁLIDAS ==========
    
    // Filtrar transacciones válidas
    const validTransactions = transactions.filter(tx => 
      tx && 
      typeof tx === 'object' && 
      tx.amount !== undefined && 
      !isNaN(tx.amount) && 
      tx.createdAt && 
      tx.type
    );

    // Filtrar solo gastos completados
    const expenseTransactions = validTransactions.filter(tx => {
      try {
        // Es un gasto
        const isExpense = tx.type === "gasto";
        
        // No es pendiente
        const isCompleted = tx.status !== "pending";
        
        // Tiene una fecha válida
        let hasValidDate = false;
        if (tx.createdAt) {
          const testDate = new Date(tx.createdAt);
          hasValidDate = !isNaN(testDate.getTime());
        }
        
        // Solo incluir si cumple todas las condiciones
        return isExpense && isCompleted && hasValidDate;
      } catch (error) {
        console.error('[useSpendingHistory] Error al filtrar transacción:', error);
        return false;
      }
    });
    
    if (__DEV__) {
      console.log(`[useSpendingHistory] Total transacciones: ${transactions.length}`);
      console.log(`[useSpendingHistory] Transacciones filtradas: ${validTransactions.length}`);
      console.log(`[useSpendingHistory] Gastos válidos: ${expenseTransactions.length}`);
    }
    
    // ========== PASO 4: GENERAR INTERVALOS DE FECHAS ==========
    
    // Generar los intervalos de fechas (días o meses)
    let intervals: Date[] = [];
    
    try {
      if (intervalType === "day") {
        // CLAVE: Asegurar que endDate es posterior a startDate
        if (startDate >= endDate) {
          console.warn('[useSpendingHistory] Ajustando fechas porque startDate >= endDate');
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
        }
        
        // Generar intervalos de días
        intervals = eachDayOfInterval({ start: startDate, end: endDate });
      } else if (intervalType === "month") {
        // Generar intervalos de meses
        intervals = eachMonthOfInterval({ start: startDate, end: endDate });
      }
    } catch (error) {
      console.error('[useSpendingHistory] Error al generar intervalos:', error);
      // Fallback: intervalos vacíos
      intervals = [];
    }
    
    // ========== PASO 5: PREPARAR ARRAYS PARA DATOS DEL GRÁFICO ==========
    
    // Si no hay intervalos, crear al menos uno para hoy
    if (intervals.length === 0) {
      console.warn('[useSpendingHistory] No se generaron intervalos, usando día actual');
      intervals = [new Date()];
    }
    
    // Inicializar arrays para datos del gráfico
    const chartData: number[] = Array(intervals.length).fill(0);
    const labels: string[] = intervals.map(date => 
      format(date, formatString, { locale: es })
    );
    
    // ========== PASO 6: PROCESAMIENTO DE TRANSACCIONES ==========
    
    // Contador para estadísticas
    let processedCount = 0;
    let skippedCount = 0;
    
    // CRUCIAL: Primera pasada - Agregar cada transacción en su día correspondiente
    expenseTransactions.forEach(tx => {
      try {
        // NUEVO: Crear un objeto fecha con hora fija (mediodía)
        // para evitar problemas con zonas horarias
        const rawDate = new Date(tx.createdAt);
        const txDate = new Date(
          rawDate.getFullYear(),
          rawDate.getMonth(),
          rawDate.getDate(),
          12, 0, 0
        );
        
        // Verificar fecha válida
        if (isNaN(txDate.getTime())) {
          if (__DEV__) console.warn(`[useSpendingHistory] Fecha inválida: ${tx.id}`);
          skippedCount++;
          return; // Saltar esta transacción
        }
        
        // Verificar si la fecha está dentro del rango
        // IMPORTANTE: También verificamos un día más tarde para incluir el día actual completo
        const adjustedEndDate = new Date(endDate);
        adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
        
        if (txDate < startDate || txDate > adjustedEndDate) {
          skippedCount++;
          return; // Fuera de rango
        }
        
        // CRUCIAL: Buscar el índice correspondiente según el tipo de intervalo
        // Usando comparación simple y directa
        let index = -1;
        
        if (intervalType === "day") {
          for (let i = 0; i < intervals.length; i++) {
            // Comparar año, mes y día explícitamente
            if (
              txDate.getDate() === intervals[i].getDate() &&
              txDate.getMonth() === intervals[i].getMonth() &&
              txDate.getFullYear() === intervals[i].getFullYear()
            ) {
              index = i;
              break;
            }
          }
        } else if (intervalType === "month") {
          for (let i = 0; i < intervals.length; i++) {
            // Comparar año y mes explícitamente
            if (
              txDate.getMonth() === intervals[i].getMonth() &&
              txDate.getFullYear() === intervals[i].getFullYear()
            ) {
              index = i;
              break;
            }
          }
        }
        
        // Si no se encontró índice pero la fecha está dentro del rango,
        // buscar el intervalo más cercano
        if (index === -1) {
          // Encontrar el intervalo más cercano (para fechas dentro del rango)
          let closestDiff = Infinity;
          let closestIndex = -1;
          
          for (let i = 0; i < intervals.length; i++) {
            const diff = Math.abs(txDate.getTime() - intervals[i].getTime());
            if (diff < closestDiff) {
              closestDiff = diff;
              closestIndex = i;
            }
          }
          
          if (closestIndex !== -1) {
            index = closestIndex;
          }
        }
        
        // Procesar si se encontró un índice válido
        if (index !== -1) {
          // Obtener el monto (validado)
          const amount = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0;
          
          // Sumar al gráfico
          chartData[index] += amount;
          processedCount++;
          
          // Log especial para transacciones recientes (últimos 5 días)
          const isRecent = (now.getTime() - txDate.getTime()) < 5 * 24 * 60 * 60 * 1000;
          if (__DEV__ && isRecent) {
            console.log(`[useSpendingHistory] Procesada transacción reciente:`, {
              id: tx.id,
              fecha: txDate.toLocaleDateString(),
              monto: amount,
              día: intervals[index].getDate(),
              índice: index
            });
          }
        } else {
          // No se pudo asignar a ningún intervalo
          skippedCount++;
          
          if (__DEV__) {
            console.warn(`[useSpendingHistory] No se pudo asignar transacción ${tx.id} a ningún intervalo`);
          }
        }
      } catch (error) {
        console.error('[useSpendingHistory] Error procesando transacción:', error);
        skippedCount++;
      }
    });
    
    // ========== PASO 7: VERIFICACIÓN ESPECIAL PARA TRANSACCIONES RECIENTES ==========
    
    // Segunda pasada: Verificación adicional para transacciones muy recientes
    // que podrían haberse perdido en la primera pasada
    if (normalizedFilter === "Este mes") {
      expenseTransactions.forEach(tx => {
        try {
          const txDate = new Date(tx.createdAt);
          
          // Verificar si es una transacción muy reciente (últimos 2 días)
          const isVeryRecent = (now.getTime() - txDate.getTime()) < 2 * 24 * 60 * 60 * 1000;
          
          if (isVeryRecent) {
            // Verificar si ya se procesó en la primera pasada
            let isAlreadyProcessed = false;
            
            // Buscar el índice correspondiente
            let index = -1;
            for (let i = 0; i < intervals.length; i++) {
              if (txDate.getDate() === intervals[i].getDate() &&
                  txDate.getMonth() === intervals[i].getMonth() &&
                  txDate.getFullYear() === intervals[i].getFullYear()) {
                index = i;
                
                // Si el valor en chartData ya es mayor que cero, probablemente ya se procesó
                if (chartData[index] > 0) {
                  isAlreadyProcessed = true;
                }
                
                break;
              }
            }
            
            // Si no se procesó y hay un índice válido, procesarla
            if (!isAlreadyProcessed && index !== -1) {
              const amount = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0;
              chartData[index] += amount;
              processedCount++;
              
              if (__DEV__) {
                console.log(`[useSpendingHistory] Procesada transacción reciente en segunda pasada:`, {
                  id: tx.id,
                  fecha: txDate.toLocaleDateString(),
                  monto: amount,
                  día: txDate.getDate(),
                  índice: index
                });
              }
            }
          }
        } catch (error) {
          console.error('[useSpendingHistory] Error en segunda pasada:', error);
        }
      });
    }
    
    // ========== PASO 8: VERIFICACIÓN PARA DÍA ACTUAL ==========
    
    // CRUCIAL: Asegurar que el día actual aparezca en el gráfico si hay transacciones hoy
    // (Incluso si no se encontró un índice exacto)
    if (normalizedFilter === "Este mes" || normalizedFilter === "Semanal") {
      const today = new Date();
      const todayTx = expenseTransactions.filter(tx => {
        try {
          const txDate = new Date(tx.createdAt);
          return txDate.getDate() === today.getDate() &&
                 txDate.getMonth() === today.getMonth() &&
                 txDate.getFullYear() === today.getFullYear();
        } catch (error) {
          return false;
        }
      });
      
      // Si hay transacciones de hoy, asegurar que estén en el gráfico
      if (todayTx.length > 0) {
        const todayAmount = todayTx.reduce((sum, tx) => sum + (typeof tx.amount === 'number' ? tx.amount : 0), 0);
        
        // Buscar índice para hoy
        let todayIndex = -1;
        for (let i = 0; i < intervals.length; i++) {
          if (intervals[i].getDate() === today.getDate() &&
              intervals[i].getMonth() === today.getMonth() &&
              intervals[i].getFullYear() === today.getFullYear()) {
            todayIndex = i;
            break;
          }
        }
        
        // Si no se encontró, usar el último índice
        if (todayIndex === -1 && intervals.length > 0) {
          todayIndex = intervals.length - 1;
        }
        
        // Actualizar datos si se encontró un índice
        if (todayIndex !== -1) {
          // Si ya hay un valor, verificar que sea al menos el monto total de hoy
          if (chartData[todayIndex] < todayAmount) {
            if (__DEV__) {
              console.log(`[useSpendingHistory] Actualizando día de hoy:`, {
                valorActual: chartData[todayIndex],
                valorNuevo: todayAmount,
                índice: todayIndex
              });
            }
            chartData[todayIndex] = todayAmount;
          }
        }
      }
    }
    
    // ========== PASO 9: CÁLCULOS FINALES ==========
    
    // Calcular gasto total
    const totalSpending = chartData.reduce((sum, amount) => sum + amount, 0);
    
    // Calcular promedio según el período
    let averageSpending = 0;
    if (normalizedFilter === "Anual") {
      // Promedio mensual para el año
      const activeMonths = chartData.filter(amount => amount > 0).length || 1;
      averageSpending = totalSpending / activeMonths;
    } else if (normalizedFilter === "Semanal") {
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
      console.log(`[useSpendingHistory] Procesadas ${processedCount} de ${expenseTransactions.length} transacciones (${skippedCount} omitidas)`);
      console.log(`[useSpendingHistory] Total: ${totalSpending}, Promedio: ${averageSpending}`);
    }
    
    return {
      chartData: chartData.length > 0 ? chartData : [0],
      totalSpending,
      averageSpending,
      labels,
    };
  }, [transactions, periodFilter]); // Dependencias minimizadas
};