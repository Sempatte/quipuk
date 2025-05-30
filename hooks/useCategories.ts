// hooks/useCategories.ts
import { 
    Category, 
    CategoryGroup, 
    getCategoriesByType,
    getCategoryGroups,
    getCategoryByName,
    getCategoryColor,
    getAllCategories,
    CATEGORY_COLORS_MAP
  } from '../app/contants/categories'
  import { TransactionType } from '@/app/interfaces/transaction.interface';
  
  export interface UseCategoriesReturn {
    getAllCategories: () => Category[];
    getCategoriesByType: (type: TransactionType) => Category[];
    getCategoryGroups: (type: TransactionType) => CategoryGroup[];
    getCategoryByName: (name: string, type: TransactionType) => Category | undefined;
    getCategoryColor: (name: string, type: TransactionType) => string;
    getCategoryColorFast: (name: string) => string; // Acceso rápido sin tipo
    validateCategory: (name: string, type: TransactionType) => boolean;
  }
  
  export const useCategories = (): UseCategoriesReturn => {
    
    // 🎯 ACCESO RÁPIDO AL COLOR SIN ESPECIFICAR TIPO
    const getCategoryColorFast = (name: string): string => {
      return CATEGORY_COLORS_MAP.get(name) || '#CFD8DC';
    };
  
    // 🎯 VALIDAR SI UNA CATEGORÍA EXISTE PARA UN TIPO
    const validateCategory = (name: string, type: TransactionType): boolean => {
      const categories = getCategoriesByType(type);
      return categories.some(cat => cat.name === name);
    };
  
    return {
      getAllCategories,
      getCategoriesByType,
      getCategoryGroups,
      getCategoryByName,
      getCategoryColor,
      getCategoryColorFast,
      validateCategory,
    };
  };
  
  // 🎯 RE-EXPORTAR TIPOS PARA FACILITAR IMPORTACIÓN
  export type { Category, CategoryGroup };