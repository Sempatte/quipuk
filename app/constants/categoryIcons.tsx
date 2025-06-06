// app/constants/iconDictionary.tsx - CORREGIDO para mostrar bordes
import React from 'react';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 🎯 IMPORTACIONES DE ICONOS SVG
import AlquilerIcon from "../../assets/images/icons/categories/gastos/alquiler.svg";
import BusIcon from "../../assets/images/icons/categories/gastos/bus.svg";
import TijeraIcon from "../../assets/images/icons/categories/gastos/tijera.svg";
import GraficaAbajoIcon from "../../assets/images/icons/categories/gastos/graficaabajo.svg";
import HogarIcon from "../../assets/images/icons/categories/gastos/hogar.svg";
import EnsaladaIcon from "../../assets/images/icons/categories/gastos/ensalada.svg";
import SaludIcon from "../../assets/images/icons/categories/gastos/salud.svg";
import SuperIcon from "../../assets/images/icons/categories/gastos/super.svg";
import TelefonoIcon from "../../assets/images/icons/categories/gastos/telefono.svg";
import EmpleoIcon from "../../assets/images/icons/categories/ingresos/empleo.svg";
import TrabajoIndepIcon from "../../assets/images/icons/categories/ingresos/trabajoindependiente.svg";
import DirectorIcon from "../../assets/images/icons/categories/ingresos/director.svg";
import AirbnbIcon from "../../assets/images/icons/categories/ingresos/airbnb.svg";
import BolsaIcon from "../../assets/images/icons/categories/ingresos/bolsa.svg";
import OtrosIngresosIcon from "../../assets/images/icons/categories/ingresos/otrosingresos.svg";
import SavingMoneyIcon from "../../assets/images/icons/categories/ingresos/savingmoney.svg";
import AddIcon from "../../assets/images/icons/Add.svg";
import FluentMoneyIcon from "../../assets/images/icons/payment_methods/fluent_money.svg";
import CardIcon from "../../assets/images/icons/payment_methods/card.svg";
import YapeIcon from "../../assets/images/icons/yape_bn.png";

// 🎯 INTERFACES PARA MEJOR TIPADO
interface IconProps {
  width?: number;
  height?: number;
  color?: string;
  stroke?: string;
  fill?: string;
}

interface CategoryIconMapping {
  [key: string]: (props: IconProps) => JSX.Element;
}

// 🎯 TAMAÑO Y COLORES POR DEFECTO
const DEFAULT_SIZE = 24;
const DEFAULT_STROKE_COLOR = '#666';
const DEFAULT_FILL = 'none'; // 🔥 CLAVE: Sin relleno por defecto

// 🎯 ICONOS DE GASTOS CON STROKE (SOLO BORDES)
const gastosIconsWithStroke: CategoryIconMapping = {
  Alquiler: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <AlquilerIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Transporte: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <BusIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Deducibles: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <TijeraIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Otros: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <GraficaAbajoIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Hogar: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <HogarIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Comida: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <EnsaladaIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Salud: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <SaludIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Super: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <SuperIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Teléfono: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <TelefonoIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  // 🎯 CATEGORÍAS CON IONICONS (YA TIENEN STROKE POR DEFECTO)
  Suscripciones: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="card-outline" size={width} color={color} />,
  
  Ropa: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="shirt-outline" size={width} color={color} />,
  
  "Cuidado personal": ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="cut-outline" size={width} color={color} />,
  
  Bienestar: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="heart-outline" size={width} color={color} />,
  
  Fiestas: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="gift-outline" size={width} color={color} />,
  
  Gasolina: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="car-outline" size={width} color={color} />,
  
  Tarjeta: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <CardIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Deudas: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="warning-outline" size={width} color={color} />,
  
  Educación: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="school-outline" size={width} color={color} />,
  
  Mascotas: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="paw-outline" size={width} color={color} />,
};

// 🎯 ICONOS DE INGRESOS CON STROKE
const ingresosIconsWithStroke: CategoryIconMapping = {
  Empleo: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <EmpleoIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  "Trabajo Independiente": ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <TrabajoIndepIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Alquiler: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <AlquilerIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Intereses: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <SavingMoneyIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Director: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <DirectorIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Airbnb: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <AirbnbIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  Bolsa: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <BolsaIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
  
  "Otros Ingresos": ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <OtrosIngresosIcon 
      width={width} 
      height={height} 
      stroke={color} 
      fill="none"
      strokeWidth="1.5"
    />,
};

// 🎯 ICONOS DE AHORRO CON STROKE
const ahorrosIconsWithStroke: CategoryIconMapping = {
  Emergencia: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="shield-outline" size={width} color={color} />,
  
  Meta: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="flag-outline" size={width} color={color} />,
  
  Inversión: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="trending-up-outline" size={width} color={color} />,
  
  Viaje: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="airplane-outline" size={width} color={color} />,
  
  Educación: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="school-outline" size={width} color={color} />,
  
  Otros: ({ width = DEFAULT_SIZE, color = DEFAULT_STROKE_COLOR }) => 
    <Ionicons name="wallet-outline" size={width} color={color} />,
};

// 🎯 MÉTODOS DE PAGO (mantienen colores originales)
export const constPaymentMethodsIcons: Record<string, JSX.Element> = {
  Efectivo: <FluentMoneyIcon width={30} height={30} />,
  Yape: <Image source={YapeIcon} style={{ width: 30, height: 30 }} />,
  Banco: <CardIcon width={30} height={30} />,
  "Tarjeta de Crédito": <Ionicons name="card" size={30} color="#FF9800" />,
  "Tarjeta de Débito": <Ionicons name="card-outline" size={30} color="#4A90E2" />,
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
    height: size,
    color: color,
  };

  let iconComponent: JSX.Element;

  switch (type) {
    case "gasto":
      const gastoIconFunction = gastosIconsWithStroke[category];
      iconComponent = gastoIconFunction 
        ? gastoIconFunction(iconProps)
        : gastosIconsWithStroke.Otros(iconProps);
      break;
      
    case "ingreso":
      const ingresoIconFunction = ingresosIconsWithStroke[category];
      iconComponent = ingresoIconFunction 
        ? ingresoIconFunction(iconProps)
        : ingresosIconsWithStroke["Otros Ingresos"](iconProps);
      break;
      
    case "ahorro":
      const ahorroIconFunction = ahorrosIconsWithStroke[category];
      iconComponent = ahorroIconFunction 
        ? ahorroIconFunction(iconProps)
        : ahorrosIconsWithStroke.Otros(iconProps);
      break;
      
    default:
      iconComponent = <Ionicons name="help-circle-outline" size={size} color={color} />;
  }

  return iconComponent;
};

// 🎯 FUNCIÓN LEGACY CORREGIDA
export const getTransactionIcon = (category: string, type: string): JSX.Element => {
  return getTransactionIconWithColor(category, type, DEFAULT_STROKE_COLOR, DEFAULT_SIZE);
};

// 🎯 FUNCIÓN ESPECÍFICA PARA CATEGORÍAS (con color de categoría)
export const getCategoryIcon = (category: string, type: string, categoryColor?: string): JSX.Element => {
  const iconColor = categoryColor || DEFAULT_STROKE_COLOR;
  return getTransactionIconWithColor(category, type, iconColor, DEFAULT_SIZE);
};

// 🎯 ICONOS ESTÁTICOS LEGACY (actualizados con stroke)
export const gastosIcons: Record<string, JSX.Element> = Object.fromEntries(
  Object.entries(gastosIconsWithStroke).map(([key, iconFunc]) => [
    key, 
    iconFunc({ width: DEFAULT_SIZE, height: DEFAULT_SIZE, color: DEFAULT_STROKE_COLOR })
  ])
);

export const ingresosIcons: Record<string, JSX.Element> = Object.fromEntries(
  Object.entries(ingresosIconsWithStroke).map(([key, iconFunc]) => [
    key, 
    iconFunc({ width: DEFAULT_SIZE, height: DEFAULT_SIZE, color: DEFAULT_STROKE_COLOR })
  ])
);

export const addIcon = <AddIcon width={30} height={30} />;