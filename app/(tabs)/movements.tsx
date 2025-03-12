import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Image,
} from "react-native";
import { useQuery } from "@apollo/client";
import { useFocusEffect } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GET_TRANSACTIONS_BY_USER } from "../graphql/transaction.graphql";
import { format } from "date-fns";

// 📌 Componente de cada transacción
const TransactionItem = ({ transaction }: { transaction: any }) => {
  const isExpense = transaction.type === "gasto";
  const formattedDate = format(new Date(transaction.createdAt), "hh:mma dd MMM yyyy");

  return (
    <View style={styles.transactionContainer}>
      {/* Icono */}
      <View style={styles.iconContainer}>
        <Image
          source={require("../../assets/images/icons/more-up.png")} // ✅ Reemplaza con el ícono correcto
          style={styles.icon}
        />
      </View>

      {/* Detalles de la transacción */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{transaction.title}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
        <Text style={styles.paymentMethod}>{transaction.paymentMethod}</Text>
      </View>

      {/* Monto */}
      <Text style={[styles.amount, isExpense ? styles.expense : styles.income]}>
        {isExpense ? "-S/" : "+S/"} {transaction.amount.toFixed(2)}
      </Text>
    </View>
  );
};

export default function Movements() {
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS_BY_USER);

  // 📌 Refrescar datos cada vez que la pantalla se enfoque
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (loading) {
    return (
      <ThemedView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Text>Error: {error.message}</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Mis Movimientos
      </ThemedText>

      {/* 📌 Lista de transacciones */}
      <FlatList
        data={data?.getTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#FFF",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  transactionContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: "#888",
  },
  detailsContainer: {
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: "#888",
  },
  paymentMethod: {
    fontSize: 12,
    color: "#666",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  expense: {
    color: "#E86F51",
  },
  income: {
    color: "#65CE13",
  },
});
