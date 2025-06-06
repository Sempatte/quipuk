// app/constants/paymentMethods.ts
import { Ionicons } from '@expo/vector-icons';
import { Image, ImageSourcePropType, ImageStyle } from 'react-native';
import { SvgProps } from 'react-native-svg';
import FluentMoneyIcon from "@/assets/images/icons/payment_methods/fluent_money.svg";
import CardIcon from "@/assets/images/icons/payment_methods/card.svg";
import YapeIcon from "@/assets/images/icons/yape_bn.png";
import React from 'react';

// Enum tipado para métodos de pago
export enum PaymentMethod {
  Cash = 'Efectivo',
  Yape = 'Yape',
  Bank = 'Banco',
  CreditCard = 'Tarjeta de Crédito',
  DebitCard = 'Tarjeta de Débito',
}

// Tipo para los métodos de pago
export type PaymentMethodType = PaymentMethod;

// Configuración completa de métodos de pago
export interface PaymentMethodConfig {
  id: PaymentMethodType;
  label: string;
  shortLabel: string;
  icon: React.ReactElement;
  color: string;
  isDigital: boolean;
  requiresInternet: boolean;
  description: string;
}

const iconStyle: ImageStyle = {
  width: 30,
  height: 30,
};

// Helper function para crear iconos SVG
const createSvgIcon = (Icon: React.ComponentType<SvgProps>): React.ReactElement => {
  return React.createElement(Icon, { width: 30, height: 30 });
};

// Helper function para crear iconos de imagen
const createImageIcon = (source: ImageSourcePropType): React.ReactElement => {
  return React.createElement(Image, { source, style: iconStyle });
};

// Helper function para crear iconos de Ionicons
const createIonIcon = (name: keyof typeof Ionicons.glyphMap, color: string): React.ReactElement => {
  return React.createElement(Ionicons, { name, size: 30, color, style: iconStyle });
};

// Configuración de métodos de pago con metadatos
export const PAYMENT_METHODS_CONFIG: Record<PaymentMethodType, PaymentMethodConfig> = {
  [PaymentMethod.Cash]: {
    id: PaymentMethod.Cash,
    label: 'Efectivo',
    shortLabel: 'Efectivo',
    icon: createSvgIcon(FluentMoneyIcon),
    color: '#4CAF50',
    isDigital: false,
    requiresInternet: false,
    description: 'Pago en billetes y monedas',
  },
  [PaymentMethod.Yape]: {
    id: PaymentMethod.Yape,
    label: 'Yape',
    shortLabel: 'Yape',
    icon: createImageIcon(YapeIcon),
    color: '#722F8B',
    isDigital: true,
    requiresInternet: true,
    description: 'Billetera digital Yape',
  },
  [PaymentMethod.Bank]: {
    id: PaymentMethod.Bank,
    label: 'Cuenta Bancaria',
    shortLabel: 'Banco',
    icon: createSvgIcon(CardIcon),
    color: '#2196F3',
    isDigital: true,
    requiresInternet: true,
    description: 'Transferencia bancaria',
  },
  [PaymentMethod.CreditCard]: {
    id: PaymentMethod.CreditCard,
    label: 'Tarjeta de Crédito',
    shortLabel: 'T. Crédito',
    icon: createIonIcon('card-sharp', '#FF9800'),
    color: '#FF9800',
    isDigital: false,
    requiresInternet: false,
    description: 'Tarjeta de crédito Visa/Mastercard',
  },
  [PaymentMethod.DebitCard]: {
    id: PaymentMethod.DebitCard,
    label: 'Tarjeta de Débito',
    shortLabel: 'T. Débito',
    icon: createIonIcon('card-outline', '#4A90E2'),
    color: '#4A90E2',
    isDigital: false,
    requiresInternet: false,
    description: 'Tarjeta de débito bancaria',
  },
};

// Array ordenado de métodos de pago (por popularidad)
export const PAYMENT_METHODS_ORDERED: PaymentMethodConfig[] = [
  PAYMENT_METHODS_CONFIG[PaymentMethod.Cash],
  PAYMENT_METHODS_CONFIG[PaymentMethod.Yape],
  PAYMENT_METHODS_CONFIG[PaymentMethod.CreditCard],
  PAYMENT_METHODS_CONFIG[PaymentMethod.DebitCard],
  PAYMENT_METHODS_CONFIG[PaymentMethod.Bank],
];

// Helper functions
export const getPaymentMethodConfig = (method: PaymentMethodType): PaymentMethodConfig => {
  return PAYMENT_METHODS_CONFIG[method] || PAYMENT_METHODS_CONFIG[PaymentMethod.Cash];
};

export const getAllPaymentMethods = (): PaymentMethodConfig[] => {
  return PAYMENT_METHODS_ORDERED;
};

export const getDigitalPaymentMethods = (): PaymentMethodConfig[] => {
  return PAYMENT_METHODS_ORDERED.filter(method => method.isDigital);
};

export const getPhysicalPaymentMethods = (): PaymentMethodConfig[] => {
  return PAYMENT_METHODS_ORDERED.filter(method => !method.isDigital);
};

// Validación
export const isValidPaymentMethod = (method: string): method is PaymentMethodType => {
  return Object.values(PaymentMethod).includes(method as PaymentMethodType);
};

// Para compatibilidad con código existente
export const constPaymentMethodsIcons: Record<string, JSX.Element> = Object.fromEntries(
  Object.entries(PAYMENT_METHODS_CONFIG).map(([key, config]) => [key, config.icon])
);