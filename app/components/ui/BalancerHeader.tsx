import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface BalanceHeaderProps {
  balance: number;
  income: number;
  expenses: number;
  monthYear: string;
}

const BalanceHeader: React.FC<BalanceHeaderProps> = ({ balance, income, expenses, monthYear }) => {
  // Función para formatear los números como moneda
  const formatCurrency = (amount: number) => {
    return `S/ ${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  return (
    <View style={styles.container}>
      {/* Sección de Balance */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>
          Balance <Text style={styles.dateHighlight}>{monthYear}</Text>
        </Text>
        <Text style={styles.balanceAmount}>{formatCurrency(balance)}</Text>
      </View>

      {/* Sección de Ingresos y Gastos */}
      <View style={styles.summaryContainer}>
        <View style={styles.incomeContainer}>
          <MaterialCommunityIcons name="arrow-top-right" size={20} color="#65CE13" />
          <Text style={styles.incomeText}>Ingresos</Text>
          <Text style={styles.amount}>{formatCurrency(income)}</Text>
        </View>

        {/* Separador entre ingresos y gastos */}
        <View style={styles.separator} />

        <View style={styles.expenseContainer}>
          <MaterialCommunityIcons name="arrow-bottom-left" size={20} color="#E86F51" />
          <Text style={styles.expenseText}>Gastos</Text>
          <Text style={styles.amount}>{formatCurrency(expenses)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  balanceContainer: {
    flex: 1.2, // Ajusta el tamaño de la sección de balance
  },
  balanceText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  dateHighlight: {
    color: '#00c450',
    fontWeight: 'bold',
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  summaryContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incomeContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: 80, // 📌 Establece un ancho mínimo
    maxWidth: 100, // 📌 Evita que el texto crezca demasiado
  },
  incomeText: {
    fontSize: 13,
    color: '#65CE13',
    fontWeight: '500',
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    flexWrap: "wrap", // 📌 Permite que el texto se divida en varias líneas si es necesario
    textAlign: "center", // 📌 Mantiene el texto centrado
  },
  separator: {
    width: 1,
    height: '60%',
    backgroundColor: '#000',
    opacity: 0.2,
  },
  expenseContainer: {
    alignItems: 'center',
    flex: 1,
    minWidth: 80, // 📌 Evita que el texto desborde
  },
  expenseText: {
    fontSize: 13,
    color: '#E86F51',
    fontWeight: '500',
  },
});

export default BalanceHeader;
