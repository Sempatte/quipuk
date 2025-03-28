import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Transaction } from '@/app/interfaces/transaction.interface';
import { getTransactionIcon } from '@/app/contants/iconDictionary';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  // Verificar si transaction es undefined o null
  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No hay datos de transacción disponibles</Text>
      </View>
    );
  }

  // Ahora que sabemos que transaction existe, podemos desestructurar con seguridad
  const { 
    description = "", 
    amount = 0, 
    type = "gasto", 
    category = "", 
    createdAt = new Date().toISOString(),
    title = "",
    paymentMethod = "Efectivo"
  } = transaction;
  
  // Formato de hora y fecha
  const transactionDate = new Date(createdAt);
  const timeString = format(transactionDate, 'hh:mm a', { locale: es }).toLowerCase();
  const dateString = format(transactionDate, 'dd MMM yyyy', { locale: es });
  
  // Obtener el ícono correcto según la categoría y tipo
  const categoryIcon = getTransactionIcon(category, type);
  
  // Color y prefijo basado en el tipo
  const isExpense = type === 'gasto';
  const amountColor = isExpense ? '#E86F51' : '#000';
  const amountPrefix = isExpense ? '-' : '+';
  const displayText = description || title || "Sin descripción";
  
  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.iconContainer}>
          {categoryIcon}
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.title} numberOfLines={1}>{displayText}</Text>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{timeString}</Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>
          <Text style={styles.paymentMethod}>{paymentMethod}</Text>
        </View>
      </View>
      
      <Text style={[styles.amount, { color: amountColor }]}>
        {amountPrefix} S/{amount.toFixed(2)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#000',
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Outfit_400Regular',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Outfit_400Regular',
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Outfit_400Regular',
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  errorText: {
    color: '#E86F51',
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  }
});

export default TransactionItem;