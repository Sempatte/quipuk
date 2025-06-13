// app/constants/iconDictionary.tsx - CORREGIDO para mostrar bordes
import React from "react";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// 🎯 IMPORTACIÓN DE ICONO PNG (Yape)
import YapeIcon from "../../assets/images/icons/yape_bn.png"; // Aseguramos que YapeIcon esté importado

// 🎯 INTERFACES PARA MEJOR TIPADO
interface IconProps {
  width?: number;
  height?: number; // Aunque Ionicons usa 'size', mantenemos height por consistencia si se mezcla con otros tipos de iconos
  color?: string;
  stroke?: string; // Mantenido por si acaso, aunque Ionicons no lo usa directamente así
  fill?: string;   // Mantenido por si acaso, aunque Ionicons no lo usa directamente así
}

interface CategoryIconMapping {
  [key: string]: (props: IconProps) => JSX.Element;
}

// 🎯 TAMAÑO Y COLORES POR DEFECTO
const DEFAULT_SIZE = 24;
const DEFAULT_STROKE_COLOR = "#666";

// 🎯 ICONOS DE GASTOS CON IONICONS
const gastosIconsWithStroke: CategoryIconMapping = {
  Alquiler: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="home-outline" size={width} color={color} />
  ),
  Transporte: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="bus-outline" size={width} color={color} />
  ),
  Deducibles: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="cut-outline" size={width} color={color} />
  ),
  Otros: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="analytics-outline" size={width} color={color} />
  ),
  Hogar: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="hammer-outline" size={width} color={color} />
  ),
  Comida: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="restaurant-outline" size={width} color={color} />
  ),
  Salud: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="medkit-outline" size={width} color={color} />
  ),
  Super: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="cart-outline" size={width} color={color} />
  ),
  Teléfono: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="call-outline" size={width} color={color} />
  ),
  Suscripciones: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="card-outline" size={width} color={color} />
  ),
  Ropa: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="shirt-outline" size={width} color={color} />
  ),
  "Cuidado personal": ({
    width = DEFAULT_SIZE,
    color = DEFAULT_STROKE_COLOR,
  }) => <Ionicons name="cut-outline" size={width} color={color} />,
  Bienestar: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="heart-outline" size={width} color={color} />
  ),
  Fiestas: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="gift-outline" size={width} color={color} />
  ),
  Gasolina: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="car-sport-outline" size={width} color={color} />
  ),
  Tarjeta: ({ 
    width = DEFAULT_SIZE,
    color = DEFAULT_STROKE_COLOR,
  }) => (
    <Ionicons name="card-outline" size={width} color={color} />
  ),
  Deudas: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="warning-outline" size={width} color={color} />
  ),
  Educación: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="school-outline" size={width} color={color} />
  ),
  Mascotas: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="paw-outline" size={width} color={color} />
  ),
};

// 🎯 ICONOS DE INGRESOS CON IONICONS
const ingresosIconsWithStroke: CategoryIconMapping = {
  Empleo: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="briefcase-outline" size={width} color={color} />
  ),
  "Trabajo Independiente": ({
    width = DEFAULT_SIZE,
    color = DEFAULT_STROKE_COLOR,
  }) => <Ionicons name="laptop-outline" size={width} color={color} />,
  Alquiler: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="cash-outline" size={width} color={color} />
  ),
  Intereses: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="trending-up-outline" size={width} color={color} />
  ),
  Director: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="person-circle-outline" size={width} color={color} />
  ),
  Airbnb: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="business-outline" size={width} color={color} />
  ),
  Bolsa: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="stats-chart-outline" size={width} color={color} />
  ),
  "Otros Ingresos": ({
    width = DEFAULT_SIZE,
    color = DEFAULT_STROKE_COLOR,
  }) => <Ionicons name="add-circle-outline" size={width} color={color} />,
};

// 🎯 ICONOS DE AHORRO CON IONICONS (Restaurado y actualizado)
const ahorrosIconsWithStroke: CategoryIconMapping = {
  Emergencia: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="shield-outline" size={width} color={color} />
  ),
  Meta: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="flag-outline" size={width} color={color} />
  ),
  Inversión: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="trending-up-outline" size={width} color={color} />
  ),
  Viaje: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="airplane-outline" size={width} color={color} />
  ),
  Educación: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="school-outline" size={width} color={color} />
  ),
  Otros: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => (
    <Ionicons name="wallet-outline" size={width} color={color} />
  ),
};

// 🎯 MÉTODOS DE PAGO (actualizados para usar Ionicons donde sea posible)
export const constPaymentMethodsIcons: Record<string, JSX.Element> = {
  Efectivo: <Ionicons name="cash-outline" size={30} color="#4CAF50" />,
  Yape: <Image source={YapeIcon} style={{ width: 30, height: 30 }} />, // Mantenido como PNG
  Banco: <Ionicons name="card-outline" size={30} color="#2196F3" />,
  "Tarjeta de Crédito": <Ionicons name="card" size={30} color="#FF9800" />,
  "Tarjeta de Débito": (
    <Ionicons name="card-outline" size={30} color="#4A90E2" />
  ),
};

// 🎯 FUNCIÓN PRINCIPAL MEJORADA - SOLO BORDES
export const getTransactionIconWithColor = (
  category: string,
  type: string,
  color: string = DEFAULT_STROKE_COLOR,
  size: number = DEFAULT_SIZE
): JSX.Element => {
  const iconProps: IconProps = {
    width: size,
    height: size, // Ionicons usa 'size', pero mantenemos height para consistencia con IconProps
    color: color,
  };

  let iconComponent: JSX.Element;

  switch (type) {
    case "gasto":
      const gastoIconFunction = gastosIconsWithStroke[category];
      iconComponent = gastoIconFunction
        ? gastoIconFunction(iconProps)
        : gastosIconsWithStroke.Otros(iconProps); // Fallback a Otros de gastos
      break;

    case "ingreso":
      const ingresoIconFunction = ingresosIconsWithStroke[category];
      iconComponent = ingresoIconFunction
        ? ingresoIconFunction(iconProps)
        : ingresosIconsWithStroke["Otros Ingresos"](iconProps); // Fallback a Otros Ingresos
      break;

    case "ahorro":
      const ahorroIconFunction = ahorrosIconsWithStroke[category];
      iconComponent = ahorroIconFunction
        ? ahorroIconFunction(iconProps)
        : ahorrosIconsWithStroke.Otros(iconProps); // Fallback a Otros de ahorros
      break;

    default:
      iconComponent = (
        <Ionicons name="help-circle-outline" size={size} color={color} />
      );
  }

  return iconComponent;
};

// 🎯 FUNCIÓN LEGACY CORREGIDA
export const getTransactionIcon = (
  category: string,
  type: string
): JSX.Element => {
  return getTransactionIconWithColor(
    category,
    type,
    DEFAULT_STROKE_COLOR,
    DEFAULT_SIZE
  );
};

// 🎯 FUNCIÓN ESPECÍFICA PARA CATEGORÍAS (con color de categoría)
export const getCategoryIcon = (
  category: string,
  type: string,
  categoryColor?: string
): JSX.Element => {
  const iconColor = categoryColor || DEFAULT_STROKE_COLOR;
  return getTransactionIconWithColor(category, type, iconColor, DEFAULT_SIZE);
};

// 🎯 ICONOS ESTÁTICOS LEGACY (actualizados con Ionicons)
export const gastosIcons: Record<string, JSX.Element> = Object.fromEntries(
  Object.entries(gastosIconsWithStroke).map(([key, iconFunc]) => [
    key,
    iconFunc({
      width: DEFAULT_SIZE,
      color: DEFAULT_STROKE_COLOR,
    }),
  ])
);

export const ingresosIcons: Record<string, JSX.Element> = Object.fromEntries(
  Object.entries(ingresosIconsWithStroke).map(([key, iconFunc]) => [
    key,
    iconFunc({
      width: DEFAULT_SIZE,
      color: DEFAULT_STROKE_COLOR,
    }),
  ])
);

export const addIcon = <Ionicons name="add-circle-outline" size={30} color={DEFAULT_STROKE_COLOR} />;
