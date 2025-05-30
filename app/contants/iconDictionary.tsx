// app/contants/iconDictionary.tsx - CON SOPORTE PARA COLORES DINÁMICOS
import React from 'react';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 🎯 IMPORTACIONES DE ICONOS SVG
import AlquilerIcon from "@/assets/images/icons/categories/gastos/alquiler.svg";
import BusIcon from "@/assets/images/icons/categories/gastos/bus.svg";
import TijeraIcon from "@/assets/images/icons/categories/gastos/tijera.svg";
import GraficaAbajoIcon from "@/assets/images/icons/categories/gastos/graficaabajo.svg";
import HogarIcon from "@/assets/images/icons/categories/gastos/hogar.svg";
import EnsaladaIcon from "@/assets/images/icons/categories/gastos/ensalada.svg";
import SaludIcon from "@/assets/images/icons/categories/gastos/salud.svg";
import SuperIcon from "@/assets/images/icons/categories/gastos/super.svg";
import TelefonoIcon from "@/assets/images/icons/categories/gastos/telefono.svg";
import EmpleoIcon from "@/assets/images/icons/categories/ingresos/empleo.svg";
import TrabajoIndepIcon from "@/assets/images/icons/categories/ingresos/trabajoindependiente.svg";
import DirectorIcon from "@/assets/images/icons/categories/ingresos/director.svg";
import AirbnbIcon from "@/assets/images/icons/categories/ingresos/airbnb.svg";
import BolsaIcon from "@/assets/images/icons/categories/ingresos/bolsa.svg";
import OtrosIngresosIcon from "@/assets/images/icons/categories/ingresos/otrosingresos.svg";
import SavingMoneyIcon from "@/assets/images/icons/categories/ingresos/savingmoney.svg";
import AddIcon from "@/assets/images/icons/Add.svg";
import FluentMoneyIcon from "@/assets/images/icons/payment_methods/fluent_money.svg";
import CardIcon from "@/assets/images/icons/payment_methods/card.svg";
import YapeIcon from "@/assets/images/icons/yape_bn.png";

// 🎯 INTERFACES PARA MEJOR TIPADO
interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

interface CategoryIconMapping {
  [key: string]: (props: IconProps) => JSX.Element;
}

// 🎯 TAMAÑO POR DEFECTO
const DEFAULT_SIZE = 30;

// 🎯 ICONOS DE GASTOS CON SOPORTE PARA COLOR DINÁMICO
const gastosIconsWithColor: CategoryIconMapping = {
  Alquiler: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <AlquilerIcon width={width} height={height} fill={color} />,
  
  Transporte: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <BusIcon width={width} height={height} fill={color} />,
  
  Deducibles: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <TijeraIcon width={width} height={height} fill={color} />,
  
  Otros: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <GraficaAbajoIcon width={width} height={height} fill={color} />,
  
  Hogar: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <HogarIcon width={width} height={height} fill={color} />,
  
  Comida: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <EnsaladaIcon width={width} height={height} fill={color} />,
  
  Salud: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <SaludIcon width={width} height={height} fill={color} />,
  
  Super: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <SuperIcon width={width} height={height} fill={color} />,
  
  Teléfono: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <TelefonoIcon width={width} height={height} fill={color} />,
  
  // 🎯 CATEGORÍAS ADICIONALES CON ICONOS GENÉRICOS
  Suscripciones: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="card-outline" size={width} color={color || '#666'} />,
  
  Ropa: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="shirt-outline" size={width} color={color || '#666'} />,
  
  "Cuidado personal": ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="cut-outline" size={width} color={color || '#666'} />,
  
  Bienestar: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="heart-outline" size={width} color={color || '#666'} />,
  
  Fiestas: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="gift-outline" size={width} color={color || '#666'} />,
  
  Gasolina: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="car-outline" size={width} color={color || '#666'} />,
  
  Tarjeta: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <CardIcon width={width} height={height} fill={color} />,
  
  Deudas: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="warning-outline" size={width} color={color || '#666'} />,
  
  Educación: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="school-outline" size={width} color={color || '#666'} />,
  
  Mascotas: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="paw-outline" size={width} color={color || '#666'} />,
};

// 🎯 ICONOS DE INGRESOS CON SOPORTE PARA COLOR DINÁMICO
const ingresosIconsWithColor: CategoryIconMapping = {
  Empleo: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <EmpleoIcon width={width} height={height} fill={color} />,
  
  "Trabajo Independiente": ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <TrabajoIndepIcon width={width} height={height} fill={color} />,
  
  Alquiler: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <AlquilerIcon width={width} height={height} fill={color} />,
  
  Intereses: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <SavingMoneyIcon width={width} height={height} fill={color} />,
  
  Director: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <DirectorIcon width={width} height={height} fill={color} />,
  
  Airbnb: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <AirbnbIcon width={width} height={height} fill={color} />,
  
  Bolsa: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <BolsaIcon width={width} height={height} fill={color} />,
  
  "Otros Ingresos": ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <OtrosIngresosIcon width={width} height={height} fill={color} />,
};

// 🎯 ICONOS DE AHORRO CON SOPORTE PARA COLOR DINÁMICO
const ahorrosIconsWithColor: CategoryIconMapping = {
  Emergencia: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="shield-outline" size={width} color={color || '#666'} />,
  
  Meta: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="flag-outline" size={width} color={color || '#666'} />,
  
  Inversión: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="trending-up-outline" size={width} color={color || '#666'} />,
  
  Viaje: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="airplane-outline" size={width} color={color || '#666'} />,
  
  Educación: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="school-outline" size={width} color={color || '#666'} />,
  
  Otros: ({ width = DEFAULT_SIZE, height = DEFAULT_SIZE, color }) => 
    <Ionicons name="wallet-outline" size={width} color={color || '#666'} />,
};

// 🎯 MÉTODOS DE PAGO (estos mantienen su color original)
export const constPaymentMethodsIcons: Record<string, JSX.Element> = {
  Efectivo: <FluentMoneyIcon width={30} height={30} />,
  Yape: <Image source={YapeIcon} style={{ width: 30, height: 30 }} />,
  Banco: <CardIcon width={30} height={30} />,
  "Tarjeta de Crédito": <Ionicons name="card" size={30} color="#FF9800" />,
  "Tarjeta de Débito": <Ionicons name="card-outline" size={30} color="#4A90E2" />,
};

// 🎯 FUNCIÓN PRINCIPAL PARA OBTENER ICONO CON COLOR DINÁMICO
export const getTransactionIconWithColor = (
  category: string, 
  type: string, 
  color?: string,
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
      const gastoIconFunction = gastosIconsWithColor[category];
      iconComponent = gastoIconFunction 
        ? gastoIconFunction(iconProps)
        : gastosIconsWithColor.Otros(iconProps);
      break;
      
    case "ingreso":
      const ingresoIconFunction = ingresosIconsWithColor[category];
      iconComponent = ingresoIconFunction 
        ? ingresoIconFunction(iconProps)
        : ingresosIconsWithColor["Otros Ingresos"](iconProps);
      break;
      
    case "ahorro":
      const ahorroIconFunction = ahorrosIconsWithColor[category];
      iconComponent = ahorroIconFunction 
        ? ahorroIconFunction(iconProps)
        : ahorrosIconsWithColor.Otros(iconProps);
      break;
      
    default:
      iconComponent = <Ionicons name="help-circle-outline" size={size} color={color || '#666'} />;
  }

  return iconComponent;
};

// 🎯 FUNCIÓN LEGACY PARA COMPATIBILIDAD (sin color)
export const getTransactionIcon = (category: string, type: string): JSX.Element => {
  return getTransactionIconWithColor(category, type, undefined, DEFAULT_SIZE);
};

// 🎯 ICONOS ESTÁTICOS LEGACY (mantenidos para compatibilidad)
export const gastosIcons: Record<string, JSX.Element> = Object.fromEntries(
  Object.entries(gastosIconsWithColor).map(([key, iconFunc]) => [
    key, 
    iconFunc({ width: DEFAULT_SIZE, height: DEFAULT_SIZE })
  ])
);

export const ingresosIcons: Record<string, JSX.Element> = Object.fromEntries(
  Object.entries(ingresosIconsWithColor).map(([key, iconFunc]) => [
    key, 
    iconFunc({ width: DEFAULT_SIZE, height: DEFAULT_SIZE })
  ])
);

export const addIcon = <AddIcon width={30} height={30} />;