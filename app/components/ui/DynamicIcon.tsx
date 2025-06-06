// components/ui/DynamicIcon.tsx - ICONOS CON COLORES DINÁMICOS (SOLO BORDES)
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { TransactionType } from '@/app/interfaces/transaction.interface';

interface DynamicIconProps {
  category: string;
  type: TransactionType;
  color: string;
  size?: number;
}

// 🎯 MAPEO DE ICONOS IONICONS (SOLO OUTLINE VERSIONS)
const CATEGORY_ICONS: Record<string, Record<string, string>> = {
  // GASTOS
  gasto: {
    'Alquiler': 'home-outline',
    'Transporte': 'car-outline', 
    'Deducibles': 'cut-outline',
    'Otros': 'ellipsis-horizontal-outline',
    'Hogar': 'bed-outline',
    'Comida': 'restaurant-outline',
    'Salud': 'medical-outline',
    'Super': 'storefront-outline',
    'Teléfono': 'call-outline',
    'Suscripciones': 'card-outline',
    'Ropa': 'shirt-outline',
    'Cuidado personal': 'cut-outline',
    'Bienestar': 'heart-outline',
    'Fiestas': 'gift-outline',
    'Gasolina': 'car-sport-outline',
    'Tarjeta': 'card-outline',
    'Deudas': 'warning-outline',
    'Educación': 'school-outline',
    'Mascotas': 'paw-outline',
  },
  // INGRESOS
  ingreso: {
    'Empleo': 'briefcase-outline',
    'Trabajo Independiente': 'laptop-outline',
    'Alquiler': 'home-outline',
    'Intereses': 'trending-up-outline',
    'Director': 'business-outline',
    'Airbnb': 'airplane-outline',
    'Bolsa': 'stats-chart-outline',
    'Otros Ingresos': 'wallet-outline',
  },
  // AHORROS
  ahorro: {
    'Emergencia': 'shield-outline',
    'Meta': 'flag-outline',
    'Inversión': 'trending-up-outline',
    'Viaje': 'airplane-outline',
    'Educación': 'school-outline',
    'Otros': 'wallet-outline',
  }
};

// 🎯 ICONOS DEFAULT POR TIPO (TODOS OUTLINE)
const DEFAULT_ICONS: Record<string, string> = {
  gasto: 'remove-circle-outline',
  ingreso: 'add-circle-outline',
  ahorro: 'wallet-outline',
};

export const DynamicIcon: React.FC<DynamicIconProps> = ({ 
  category, 
  type, 
  color, 
  size = 24 
}) => {
  // Obtener el nombre del icono (todos outline)
  const iconName = CATEGORY_ICONS[type]?.[category] || DEFAULT_ICONS[type] || 'help-circle-outline';
  
  return (
    <Ionicons 
      name={iconName as any} 
      size={size} 
      color={color} // Solo el borde tendrá color
    />
  );
};

export default DynamicIcon;