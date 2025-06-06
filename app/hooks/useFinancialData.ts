import { useState, useCallback, useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Transaction } from "@/app/interfaces/transaction.interface";
import { PeriodFilter } from "@/app/components/ui/FinancialSituation";

// Interfaces para los datos financieros
export interface MonthData {
  date: Date;
  name: string;
  isActive: boolean;
  expenses: number;
  income: number;
}

/**
 * Hook personalizado para procesar datos financieros según el período seleccionado
 */
export const useFinancialData = (
  transactions: Transaction[],
  selectedPeriod: PeriodFilter
) => {
  // Función para obtener los meses a mostrar según el filtro
  const getMonthsToShow = useCallback((): MonthData[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const months: MonthData[] = [];

    switch (selectedPeriod) {
      case "Este mes":
        // Mostrar últimos 6 meses, incluyendo el actual
        for (let i = 5; i >= 0; i--) {
          const monthIndex = currentMonth - i;
          const year = currentYear + Math.floor(monthIndex / 12);
          const adjustedMonthIndex = ((monthIndex % 12) + 12) % 12; // Ajuste para meses negativos

          const date = new Date(year, adjustedMonthIndex, 1);
          months.push({
            date,
            name: format(date, "MMM", { locale: es }),
            isActive: i === 0, // Solo el mes actual está activo
            expenses: 0,
            income: 0,
          });
        }
        break;

      case "3 M":
        // Mostrar últimos 3 meses, incluyendo el actual
        for (let i = 2; i >= 0; i--) {
          const monthIndex = currentMonth - i;
          const year = currentYear + Math.floor(monthIndex / 12);
          const adjustedMonthIndex = ((monthIndex % 12) + 12) % 12;

          const date = new Date(year, adjustedMonthIndex, 1);
          months.push({
            date,
            name: format(date, "MMM", { locale: es }),
            isActive: true, // Todos los meses están activos en 3M
            expenses: 0,
            income: 0,
          });
        }
        break;

      case "6 M":
        // Mostrar últimos 6 meses, incluyendo el actual
        for (let i = 5; i >= 0; i--) {
          const monthIndex = currentMonth - i;
          const year = currentYear + Math.floor(monthIndex / 12);
          const adjustedMonthIndex = ((monthIndex % 12) + 12) % 12;

          const date = new Date(year, adjustedMonthIndex, 1);
          months.push({
            date,
            name: format(date, "MMM", { locale: es }),
            isActive: true, // Todos los meses están activos en 6M
            expenses: 0,
            income: 0,
          });
        }
        break;

      default:
        // Si es un año (verificamos si es un número de 4 dígitos)
        if (/^\d{4}$/.test(selectedPeriod)) {
          const selectedYear = parseInt(selectedPeriod);
          // Mostrar todos los meses del año seleccionado hasta el mes actual si es el año actual
          const endMonth = selectedYear === currentYear ? currentMonth : 11;
          
          for (let i = 0; i <= endMonth; i++) {
            const date = new Date(selectedYear, i, 1);
            months.push({
              date,
              name: format(date, "MMM", { locale: es }),
              isActive: true, // Todos los meses están activos en la vista anual
              expenses: 0,
              income: 0,
            });
          }
        } else {
          // Valor por defecto (Este mes)
          for (let i = 5; i >= 0; i--) {
            const monthIndex = currentMonth - i;
            const year = currentYear + Math.floor(monthIndex / 12);
            const adjustedMonthIndex = ((monthIndex % 12) + 12) % 12;
            
            const date = new Date(year, adjustedMonthIndex, 1);
            months.push({
              date,
              name: format(date, "MMM", { locale: es }),
              isActive: i === 0, // Solo el mes actual está activo
              expenses: 0,
              income: 0,
            });
          }
        }
    }

    return months;
  }, [selectedPeriod]);

  // Calcular datos financieros para cada mes
  const processTransactionData = useCallback(
    (transactions: Transaction[], months: MonthData[]): MonthData[] => {
      const processedData = [...months];

      // Procesar transacciones
      transactions.forEach((transaction) => {
        const txDate = new Date(transaction.createdAt);

        // Encontrar el mes correspondiente
        const monthData = processedData.find(
          (m) =>
            txDate.getMonth() === m.date.getMonth() &&
            txDate.getFullYear() === m.date.getFullYear()
        );

        if (monthData && transaction.status !== "pending") {
          if (transaction.type === "gasto") {
            monthData.expenses += transaction.amount;
          } else if (transaction.type === "ingreso") {
            monthData.income += transaction.amount;
          }
        }
      });

      return processedData;
    },
    []
  );

  // Calcular totales para el período seleccionado
  const calculateTotals = useCallback(
    (
      transactions: Transaction[]
    ): { totalExpenses: number; totalIncome: number } => {
      const now = new Date();
      let startDate: Date;
      const currentYear = now.getFullYear();

      switch (selectedPeriod) {
        case "Este mes":
          startDate = startOfMonth(now);
          break;
        case "3 M":
          startDate = startOfMonth(subMonths(now, 2));
          break;
        case "6 M":
          startDate = startOfMonth(subMonths(now, 5));
          break;
        default:
          // Si es un año (verificamos si es un número de 4 dígitos)
          if (/^\d{4}$/.test(selectedPeriod)) {
            startDate = new Date(parseInt(selectedPeriod), 0, 1); // 1 de enero del año seleccionado
          } else {
            startDate = startOfMonth(now); // Default a mes actual
          }
      }

      const endDate = endOfMonth(now);
      let totalExpenses = 0;
      let totalIncome = 0;

      transactions.forEach((transaction) => {
        const txDate = new Date(transaction.createdAt);

        if (
          txDate >= startDate &&
          txDate <= endDate &&
          transaction.status !== "pending"
        ) {
          if (transaction.type === "gasto") {
            totalExpenses += transaction.amount;
          } else if (transaction.type === "ingreso") {
            totalIncome += transaction.amount;
          }
        }
      });

      return { totalExpenses, totalIncome };
    },
    [selectedPeriod]
  );

  // Procesar datos y calcular totales
  const { chartData, totalExpenses, totalIncome } = useMemo(() => {
    const months = getMonthsToShow();
    const chartData = processTransactionData(transactions, months);
    const { totalExpenses, totalIncome } = calculateTotals(transactions);

    return { chartData, totalExpenses, totalIncome };
  }, [transactions, getMonthsToShow, processTransactionData, calculateTotals]);

  return { chartData, totalExpenses, totalIncome };
};