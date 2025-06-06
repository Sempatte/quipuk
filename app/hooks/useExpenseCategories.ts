import { useCallback, useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Transaction } from "@/app/interfaces/transaction.interface";

// Tipos para los filtros de período
export type PeriodFilter = "Este mes" | "3 Meses" | "6 Meses" | string;

// Definimos la interfaz para las categorías de gastos
export interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

// Colores para las categorías
export const CATEGORY_COLORS: Record<string, string> = {
  "Comida": "#92EF4A",
  "Servicios Básicos": "#01A081", 
  "Transporte": "#00DC5A",
  "Compras": "#0B4550",
  "Otros": "#33CCCC",
  "Barbero": "#000000",
  "Alquiler": "#01A081",
  "Salud": "#0B4550",
  "Teléfono": "#9C9C9C",
  "Super": "#D9D9D9",
  "Hogar": "#6511B4",
  "Deducibles": "#FFFFFF"
};

// Interface para el resultado del hook
export interface ExpenseCategoryResult {
  categories: CategoryData[];
  totalExpense: number;
  month: string;
  periodLabel: string; // Nuevo campo para mostrar el rango de meses
}

/**
 * Hook para procesar datos de gastos por categoría
 */
export const useExpenseCategories = (
  transactions: Transaction[] = [],
  selectedPeriod: PeriodFilter
): ExpenseCategoryResult => {
  
  // Función para calcular el rango de fechas según el período seleccionado
  const getDateRange = useCallback(() => {
    const now = new Date();
    const endDate = endOfMonth(now);
    let startDate: Date;

    switch (selectedPeriod) {
      case "Este mes":
        startDate = startOfMonth(now);
        break;
      case "3 Meses":
        startDate = startOfMonth(subMonths(now, 2));
        break;
      case "6 Meses":
        startDate = startOfMonth(subMonths(now, 5));
        break;
      default:
        // Si es un año (verificamos si es un número de 4 dígitos)
        if (/^\d{4}$/.test(selectedPeriod)) {
          startDate = new Date(parseInt(selectedPeriod), 0, 1); // 1 de enero del año
        } else {
          startDate = startOfMonth(now); // Default a este mes
        }
    }

    return { startDate, endDate };
  }, [selectedPeriod]);

  // Genera la etiqueta del período (Ej: "Ago - Oct" para 3 meses)
  const getPeriodLabel = useCallback(() => {
    const now = new Date();
    const currentMonth = format(now, "MMM", { locale: es });
    
    // Capitalizar la primera letra
    const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
    
    switch (selectedPeriod) {
      case "Este mes":
        return capitalize(currentMonth);
      case "3 Meses": {
        const startMonth = format(subMonths(now, 2), "MMM", { locale: es });
        return `${capitalize(startMonth)} - ${capitalize(currentMonth)}`;
      }
      case "6 Meses": {
        const startMonth = format(subMonths(now, 5), "MMM", { locale: es });
        return `${capitalize(startMonth)} - ${capitalize(currentMonth)}`;
      }
      default:
        // Si es un año (verificamos si es un número de 4 dígitos)
        if (/^\d{4}$/.test(selectedPeriod)) {
          return selectedPeriod; // Devuelve el año directamente
        } else {
          return capitalize(currentMonth); // Default a este mes
        }
    }
  }, [selectedPeriod]);

  // Procesar datos para obtener gastos por categoría
  return useMemo(() => {
    if (!transactions.length) {
      return { 
        categories: [], 
        totalExpense: 0, 
        month: format(new Date(), "MMMM", { locale: es }),
        periodLabel: getPeriodLabel() 
      };
    }

    const { startDate, endDate } = getDateRange();
    const currentMonth = format(new Date(), "MMMM", { locale: es });
    
    // Filtrar transacciones: solo gastos completados dentro del rango de fechas
    const filteredTransactions = transactions.filter((tx: Transaction) => {
      const txDate = new Date(tx.createdAt);
      return (
        tx.type === "gasto" &&
        tx.status !== "pending" &&
        txDate >= startDate &&
        txDate <= endDate
      );
    });

    // Si no hay transacciones filtradas, devolver datos vacíos
    if (filteredTransactions.length === 0) {
      return { 
        categories: [], 
        totalExpense: 0, 
        month: currentMonth,
        periodLabel: getPeriodLabel()
      };
    }

    // Calcular gasto total en el período
    const totalExpense = filteredTransactions.reduce(
      (sum: number, tx: Transaction) => sum + tx.amount,
      0
    );

    // Agrupar por categoría
    const categoryMap: Record<string, number> = {};
    filteredTransactions.forEach((tx: Transaction) => {
      const category = tx.category || "Otros";
      categoryMap[category] = (categoryMap[category] || 0) + tx.amount;
    });

    // Convertir a array con porcentajes exactos (sin redondeo aún)
    let categories = Object.entries(categoryMap)
      .map(([name, amount]) => ({
        name,
        amount,
        exactPercentage: (amount / totalExpense) * 100, // Porcentaje exacto sin redondear
        percentage: 0, // Se calculará después con ajuste
        color: CATEGORY_COLORS[name] || "#CCCCCC",
      }))
      .sort((a, b) => b.amount - a.amount); // Ordenar de mayor a menor

    // Calcular porcentajes redondeados
    const initialPercentages = categories.map(category => 
      Math.floor(category.exactPercentage) // Redondeamos hacia abajo para evitar superar el 100%
    );
    
    // Calculamos cuánto nos falta para llegar al 100%
    const sumInitialPercentages = initialPercentages.reduce((sum, p) => sum + p, 0);
    const remaining = 100 - sumInitialPercentages;
    
    // Distribuir el porcentaje restante entre las categorías
    if (remaining > 0) {
      // Ordenar por la parte decimal más alta (mayor a menor)
      const sortedByDecimal = [...categories]
        .map((category, index) => ({
          index,
          decimal: category.exactPercentage - Math.floor(category.exactPercentage)
        }))
        .sort((a, b) => b.decimal - a.decimal);
      
      // Distribuir los puntos porcentuales restantes
      for (let i = 0; i < remaining; i++) {
        const categoryIndex = sortedByDecimal[i % sortedByDecimal.length].index;
        initialPercentages[categoryIndex]++;
      }
    }
    
    // Asignar los porcentajes ajustados
    categories = categories.map((category, index) => ({
      ...category,
      percentage: initialPercentages[index]
    }));

    // Verificación final (para debugging)
    const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);
    if (totalPercentage !== 100 && categories.length > 0) {
      console.warn(`Advertencia: Los porcentajes suman ${totalPercentage}% en lugar de 100%`);
    }

    return {
      categories,
      totalExpense,
      month: currentMonth,
      periodLabel: getPeriodLabel()
    };
  }, [transactions, getDateRange, getPeriodLabel]);
};