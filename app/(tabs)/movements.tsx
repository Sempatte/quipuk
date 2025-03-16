import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useQuery } from "@apollo/client";
import { useFocusEffect } from "@react-navigation/native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { GET_TRANSACTIONS_BY_USER } from "../graphql/transaction.graphql";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import BalanceHeader from "@/components/ui/BalancerHeader";
import TransactionItem from "@/components/ui/TransactionItem";
import { capitalize } from "lodash";

export default function Movements() {
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS_BY_USER);
  const [selectedDay, setSelectedDay] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const getLastSixDays = () => {
    return Array.from({ length: 6 }).map((_, index) =>
      subDays(new Date(), 5 - index)
    );
  };

  const days = getLastSixDays();

  const filteredTransactions = data?.getTransactions?.filter((t: any) => {
    const transDate = new Date(t.createdAt).toDateString();
    return transDate === selectedDay.toDateString();
  });

  const balance = data?.getTransactions?.reduce(
    (acc: number, transaction: any) => {
      return transaction.type === "gasto"
        ? acc - transaction.amount
        : acc + transaction.amount;
    },
    0
  );

  if (loading)
    return (
      <ThemedView style={styles.loaderContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  if (error)
    return (
      <ThemedView style={styles.errorContainer}>
        <Text>Error: {error.message}</Text>
      </ThemedView>
    );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transacciones</Text>
        <Text style={styles.monthButton}>
          {capitalize(format(new Date(), "MMMM yyyy", { locale: es }))}
        </Text>
        <View style={styles.daysContainer}>
          {days.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                day.toDateString() === selectedDay.toDateString() ? styles.activeDay : styles.inactiveDay,
              ]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={styles.dayNumber}>
                {format(day, "dd", { locale: es })}
              </Text>
              <Text style={styles.dayLabel}>
                {format(day, "EEE", { locale: es })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <BalanceHeader />
      <FlatList
        data={filteredTransactions} // ✅ Usa transacciones filtradas por día
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    padding: 16,
    backgroundColor: "#000",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 26,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Outfit_500Medium"
  },
  monthButton: {
    color: "#0c0",
    textAlign: "center",
    fontSize: 18,
    marginVertical: 8,
    fontFamily: "Outfit_600SemiBold"
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
    
  },
  dayButton: {alignItems: "center", padding: 8, borderRadius: 10,  fontFamily: "Outfit_500Medium", width: "15%"},
  activeDay: { borderColor: "#0c0", borderWidth: 1 },
  inactiveDay: { borderColor: "#F8F8F8", borderWidth: 1 },
  dayNumber: { color: "#FFF", fontSize: 16 },
  dayLabel: { color: "#FFF", fontSize: 12 },
  balanceText: { fontSize: 16, color: "#FFF", textAlign: "center" },
  balanceAmount: {
    fontSize: 24,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  transactionContainer: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    marginRight: 10,
  },
  detailsContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: "bold" },
  date: { fontSize: 12, color: "#888" },
  paymentMethod: { fontSize: 12, color: "#666" },
  amount: { fontSize: 16, fontWeight: "bold" },
  expense: { color: "#E86F51" },
  income: { color: "#65CE13" },
  listContent: { paddingBottom: 20 },
});
