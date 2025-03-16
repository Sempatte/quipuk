import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const BalanceHeader = () => {
  return (
    <View style={styles.container}>
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceText}>Balance <Text style={styles.dateHighlight}>Oct 2024</Text></Text>
        <Text style={styles.amount}>S/ 500<Text style={styles.decimal}>.00</Text></Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.incomeContainer}>
          <MaterialIcons name="trending-up" size={20} color="#65CE13" />
          <Text style={styles.incomeText}>Ingresos</Text>
          <Text style={styles.incomeAmount}>S/ 1,500<Text style={styles.decimal}>.00</Text></Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.expenseContainer}>
          <MaterialIcons name="trending-down" size={20} color="#E86F51" />
          <Text style={styles.expenseText}>Gastos</Text>
          <Text style={styles.expenseAmount}>S/ 1,000<Text style={styles.decimal}>.00</Text></Text>
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
    padding: 15,
    backgroundColor: '#fff',
  },
  balanceContainer: {
    flex: 1,
  },
  balanceText: {
    fontSize: 16,
    color: '#000',
  },
  dateHighlight: {
    color: '#00c450',
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
  },
  decimal: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  incomeContainer: {
    alignItems: 'center',
  },
  incomeText: {
    fontSize: 14,
    color: '#65CE13',
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  separator: {
    width: 1,
    height: '60%',
    backgroundColor: '#000',
    opacity: 0.2,
  },
  expenseContainer: {
    alignItems: 'center',
  },
  expenseText: {
    fontSize: 14,
    color: '#E86F51',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default BalanceHeader;