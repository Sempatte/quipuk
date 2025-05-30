// constants/categories.ts
export interface Category {
    name: string;
    color: string;
    icon: string;
  }
  
  export interface CategoryGroup {
    title: string;
    categories: Category[];
  }
  
  export interface CategoriesConfig {
    gasto: Record<string, CategoryGroup>;
    ingreso: Record<string, CategoryGroup>;
    ahorro: Record<string, CategoryGroup>;
  }
  
  export const CATEGORIES_CONFIG: CategoriesConfig = {
    gasto: {
      gastosFixosHogar: {
        title: "Gastos fijos y hogar",
        categories: [
          {
            name: "Alquiler",
            color: "#B39DDB",
            icon: "alquiler"
          },
          {
            name: "Hogar",
            color: "#81D4FA",
            icon: "hogar"
          },
          {
            name: "Teléfono",
            color: "#A5D6A7",
            icon: "telefono"
          },
          {
            name: "Super",
            color: "#FFCC80",
            icon: "super"
          }
        ]
      },
      consumoEstiloVida: {
        title: "Consumo y estilo de vida",
        categories: [
          {
            name: "Comida",
            color: "#FF8A80",
            icon: "comida"
          },
          {
            name: "Suscripciones",
            color: "#BCAAA4",
            icon: "suscripciones"
          },
          {
            name: "Ropa",
            color: "#90CAF9",
            icon: "ropa"
          },
          {
            name: "Cuidado personal",
            color: "#F8BBD0",
            icon: "cuidadoPersonal"
          },
          {
            name: "Bienestar",
            color: "#AED581",
            icon: "bienestar"
          },
          {
            name: "Fiestas",
            color: "#FFF176",
            icon: "fiestas"
          }
        ]
      },
      movilidad: {
        title: "Movilidad",
        categories: [
          {
            name: "Transporte",
            color: "#CE93D8",
            icon: "transporte"
          },
          {
            name: "Gasolina",
            color: "#FFB74D",
            icon: "gasolina"
          }
        ]
      },
      finanzas: {
        title: "Finanzas",
        categories: [
          {
            name: "Tarjeta",
            color: "#4FC3F7",
            icon: "tarjeta"
          },
          {
            name: "Deudas",
            color: "#E57373",
            icon: "deudas"
          }
        ]
      },
      otrosRelevantes: {
        title: "Otros relevantes",
        categories: [
          {
            name: "Educación",
            color: "#FFF59D",
            icon: "educacion"
          },
          {
            name: "Mascotas",
            color: "#D7CCC8",
            icon: "mascotas"
          },
          {
            name: "Salud",
            color: "#A5D6A7",
            icon: "salud"
          },
          {
            name: "Deducibles",
            color: "#B0BEC5",
            icon: "deducibles"
          },
          {
            name: "Otros",
            color: "#CFD8DC",
            icon: "otros"
          }
        ]
      }
    },
    ingreso: {
      ingresosLaborales: {
        title: "Ingresos Laborales",
        categories: [
          {
            name: "Empleo",
            color: "#4FC3F7",
            icon: "empleo"
          },
          {
            name: "Trabajo Independiente",
            color: "#FFB74D",
            icon: "trabajoIndependiente"
          },
          {
            name: "Director",
            color: "#BA68C8",
            icon: "director"
          }
        ]
      },
      ingresosPorPropiedad: {
        title: "Ingresos por propiedad",
        categories: [
          {
            name: "Alquiler",
            color: "#A1887F",
            icon: "alquiler"
          },
          {
            name: "Airbnb",
            color: "#FF8A65",
            icon: "airbnb"
          }
        ]
      },
      inversiones: {
        title: "Inversiones",
        categories: [
          {
            name: "Bolsa",
            color: "#1976D2",
            icon: "bolsa"
          },
          {
            name: "Intereses",
            color: "#81C784",
            icon: "intereses"
          }
        ]
      },
      otros: {
        title: "Otros",
        categories: [
          {
            name: "Otros Ingresos",
            color: "#76FF03",
            icon: "otrosIngresos"
          }
        ]
      }
    },
    ahorro: {
      tiposAhorro: {
        title: "Tipos de Ahorro",
        categories: [
          {
            name: "Emergencia",
            color: "#FF5722",
            icon: "emergencia"
          },
          {
            name: "Meta",
            color: "#9C27B0",
            icon: "meta"
          },
          {
            name: "Inversión",
            color: "#3F51B5",
            icon: "inversion"
          },
          {
            name: "Viaje",
            color: "#00BCD4",
            icon: "viaje"
          },
          {
            name: "Educación",
            color: "#4CAF50",
            icon: "educacion"
          },
          {
            name: "Otros",
            color: "#607D8B",
            icon: "otros"
          }
        ]
      }
    }
  } as const;
  
  // 🎯 IMPORTAR TIPO EXISTENTE
  import { TransactionType } from '@/app/interfaces/transaction.interface';
  
  // 🎯 TIPOS DERIVADOS PARA MAYOR SEGURIDAD
  export type GastosCategoryName = typeof CATEGORIES_CONFIG.gasto[keyof typeof CATEGORIES_CONFIG.gasto]['categories'][number]['name'];
  export type IngresosCategoryName = typeof CATEGORIES_CONFIG.ingreso[keyof typeof CATEGORIES_CONFIG.ingreso]['categories'][number]['name'];
  export type AhorrosCategoryName = typeof CATEGORIES_CONFIG.ahorro[keyof typeof CATEGORIES_CONFIG.ahorro]['categories'][number]['name'];
  
  // 🎯 FUNCIONES HELPER
  export const getCategoriesByType = (type: TransactionType): Category[] => {
    const typeData = CATEGORIES_CONFIG[type];
    if (!typeData) return [];
  
    const allCategories: Category[] = [];
    Object.values(typeData).forEach((group) => {
      allCategories.push(...group.categories);
    });
  
    return allCategories;
  };
  
  export const getCategoryGroups = (type: TransactionType): CategoryGroup[] => {
    const typeData = CATEGORIES_CONFIG[type];
    if (!typeData) return [];
  
    return Object.values(typeData);
  };
  
  export const getCategoryByName = (name: string, type: TransactionType): Category | undefined => {
    const categories = getCategoriesByType(type);
    return categories.find(cat => cat.name === name);
  };
  
  export const getCategoryColor = (name: string, type: TransactionType): string => {
    const category = getCategoryByName(name, type);
    return category?.color || '#CFD8DC'; // Color por defecto
  };
  
  export const getAllCategories = (): Category[] => {
    const allCategories: Category[] = [];
    
    (['gasto', 'ingreso', 'ahorro'] as const).forEach(type => {
      allCategories.push(...getCategoriesByType(type));
    });
  
    return allCategories;
  };
  
  // 🎯 MAPAS PARA ACCESO RÁPIDO
  export const CATEGORY_NAMES_BY_TYPE = {
    gasto: getCategoriesByType('gasto').map(cat => cat.name),
    ingreso: getCategoriesByType('ingreso').map(cat => cat.name),
    ahorro: getCategoriesByType('ahorro').map(cat => cat.name),
  } as const;
  
  export const CATEGORY_COLORS_MAP = new Map<string, string>();
  getAllCategories().forEach(cat => {
    CATEGORY_COLORS_MAP.set(cat.name, cat.color);
  });