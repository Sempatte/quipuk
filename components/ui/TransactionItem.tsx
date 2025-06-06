// components/ui/TransactionItem.tsx - DISEÑO ORIGINAL CON COLORES DINÁMICOS
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaction } from '@/app/interfaces/transaction.interface';
import { getCategoryColor } from '@/app/interfaces/categories.interface';
import DynamicIcon from '@/components/ui/DynamicIcon';

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: (transaction: Transaction) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onPress 
}) => {
  // 🎯 OBTENER COLOR DINÁMICO DE LA CATEGORÍA
  const categoryColor = getCategoryColor(transaction.category, transaction.type);

  // 🎯 FUNCIÓN HELPER PARA PARSEAR FECHAS
  const parseDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  };

  // 🎯 FORMATEO DE FECHA
  const formatTransactionDate = (dateValue: any): string => {
    try {
      const date = parseDate(dateValue);
      if (!date) return '';
      // Mostrar hora con segundos
      return format(date, 'HH:mm', { locale: es });
    } catch (error) {
      return '';
    }
  };

  // 🎯 FORMATEO DE FECHA COMPLETA
  const formatFullDate = (dateValue: any): string => {
    try {
      const date = parseDate(dateValue);
      if (!date) return '';
      
      return format(date, 'dd MMM', { locale: es });
    } catch (error) {
      return '';
    }
  };

  // 🎯 FORMATEO DE MONTO
  const formatAmount = (amount: number, type: string): string => {
    const formattedAmount = `S/ ${Math.abs(amount).toFixed(2)}`;
    return type === 'gasto' ? `-${formattedAmount}` : `+${formattedAmount}`;
  };

  // 🎯 COLOR DEL MONTO
  const getAmountColor = (type: string): string => {
    switch (type) {
      case 'gasto':
        return '#FF5252';
      case 'ingreso':
        return '#4CAF50';
      case 'ahorro':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress?.(transaction)}
      activeOpacity={0.7}
    >
      {/* 🎯 ICONO EN CÍRCULO GRIS */}
      <View style={styles.iconContainer}>
        <DynamicIcon 
          category={transaction.category}
          type={transaction.type as any}
          color={categoryColor}
          size={24}
        />
      </View>

      {/* 🎯 INFORMACIÓN DE LA TRANSACCIÓN */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.description}
        </Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.time}>
            {formatTransactionDate(transaction.dueDate)}
          </Text>
          <Text style={styles.date}>
            {formatFullDate(transaction.dueDate)}
          </Text>
        </View>
        
        <Text style={styles.paymentMethod} numberOfLines={1}>
          {transaction.paymentmethod}
        </Text>
      </View>

      {/* 🎯 MONTO */}
      <View style={styles.amountContainer}>
        <Text 
          style={[
            styles.amount,
            { color: getAmountColor(transaction.type) }
          ]}
        >
          {formatAmount(transaction.amount, transaction.type)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E0E0E0',
  },
  
  // 🎯 CONTENEDOR DEL ICONO (CÍRCULO GRIS)
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  // 🎯 INFORMACIÓN
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Outfit_400Regular',
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Outfit_400Regular',
  },
  paymentMethod: {
    fontSize: 13,
    color: '#888',
    fontFamily: 'Outfit_400Regular',
  },
  
  // 🎯 MONTO
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
});

export default TransactionItem;