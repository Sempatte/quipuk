import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useQuery } from "@apollo/client";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ThemedView } from "@/components/ThemedView";
import { GET_TRANSACTIONS_BY_USER } from "../graphql/transaction.graphql";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import TransactionItem from "@/components/ui/TransactionItem";
import { capitalize } from "lodash";
import { Calendar } from "react-native-calendars";
import BalanceHeader from "@/components/ui/BalancerHeader";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../interfaces/navigation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction } from "../interfaces/transaction.interface";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

const Movements = () => {
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS_BY_USER);
  const [referenceDay, setReferenceDay] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  useFocusEffect(
    useCallback(() => {
      if (error && error.message === "Token expired or invalid") {
        AsyncStorage.removeItem("token");
        navigation.navigate("LoginScreen");
      }
      refetch();
    }, [refetch, error, navigation])
  );

  /** 📌 Obtiene los últimos 6 días basados en la fecha seleccionada */
  const getLastSixDays = (date: Date) =>
    Array.from({ length: 6 }, (_, index) => subDays(date, 5 - index));

  // Agrupar las transacciones por día
  const groupTransactionsByDay = (transactions: Transaction[]) => {
    const groups = transactions.reduce((groups, transaction) => {
      const date = format(new Date(transaction.createdAt), "dd-MM-yyyy");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as { [key: string]: Transaction[] });

    // Ordenamos las transacciones dentro de cada grupo por fecha descendente
    Object.keys(groups).forEach((date) => {
      groups[date].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return groups;
  };

  const transactions = data?.getTransactions || [];
  const groupedTransactions = Array.isArray(transactions)
    ? groupTransactionsByDay(transactions)
    : {};

  /** 📌 Verifica si hay transacciones en un día específico */
  const hasTransactionsOnDay = (day: Date) =>
    transactions.some(
      (transaction: Transaction) =>
        new Date(transaction.createdAt).toDateString() === day.toDateString()
    );

  const days = getLastSixDays(referenceDay);

  // Prepara los datos para el FlatList de manera que siempre sean renderizables
  const getFilteredTransactionsForRender = () => {
    if (selectedDate) {
      // Si hay fecha seleccionada, filtramos solo las transacciones de ese día
      const filteredItems = transactions.filter(
        (transaction: Transaction) =>
          new Date(transaction.createdAt).toDateString() ===
          selectedDate.toDateString()
      );

      if (filteredItems.length === 0) {
        // Si no hay transacciones para ese día, devolvemos un formato compatible con el renderItem
        return [
          [
            format(selectedDate, "dd-MM-yyyy"),
            [], // Array vacío de transacciones
          ],
        ];
      }

      // Si hay transacciones, las agrupamos por día (aunque será solo un día)
      const dateKey = format(selectedDate, "dd-MM-yyyy");
      return [[dateKey, filteredItems]];
    } else {
      // Si no hay fecha seleccionada, mostramos todas las transacciones agrupadas
      // Convertimos el objeto de transacciones agrupadas a un array de entradas
      const entries = Object.entries(groupedTransactions);

      // Ordenamos el array de entradas por fecha (más reciente primero)
      entries.sort((a, b) => {
        const [dateA] = a[0].split("-").map(Number);
        const [dateB] = b[0].split("-").map(Number);
        const [dayA, monthA, yearA] = a[0].split("-").map(Number);
        const [dayB, monthB, yearB] = b[0].split("-").map(Number);

        // Comparamos por año, luego por mes, luego por día
        if (yearA !== yearB) return yearB - yearA;
        if (monthA !== monthB) return monthB - monthA;
        return dateB - dateA; // Más reciente primero
      });

      return entries;
    }
  };

  const filteredTransactionsForRender = getFilteredTransactionsForRender();

  /** 📌 Calcula ingresos, gastos y balance dinámico */
  const selectedMonthYear = selectedDate
    ? format(selectedDate, "yyyy-MM")
    : format(new Date(), "yyyy-MM");

  const monthlyTransactions = transactions.filter(
    (transaction: Transaction) => {
      return (
        format(new Date(transaction.createdAt), "yyyy-MM") === selectedMonthYear
      );
    }
  );

  const { income, expenses, balance } = monthlyTransactions.reduce(
    (
      acc: { income: number; expenses: number; balance: number },
      transaction: Transaction
    ) => {
      if (transaction.type === "gasto") {
        acc.expenses += transaction.amount;
        acc.balance -= transaction.amount;
      } else {
        acc.income += transaction.amount;
        acc.balance += transaction.amount;
      }
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );

  /** 📌 Obtiene el mes y año para el balance */
  const monthYear = selectedDate
    ? capitalize(format(selectedDate, "MMMM yyyy", { locale: es }))
    : capitalize(format(new Date(), "MMMM yyyy", { locale: es }));

  if (loading) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <Text>Error: {error.message}</Text>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transacciones</Text>

        <TouchableOpacity
          onPress={() => setIsCalendarVisible(true)}
          style={styles.monthYearButton}
          activeOpacity={1}
        >
          <Text style={styles.arrowText}>{"<"}</Text>
          <Text style={styles.monthYearText}>
            <Text style={styles.monthText}>{monthYear}</Text>
          </Text>
          <Text style={styles.arrowText}>{">"}</Text>
        </TouchableOpacity>

        <View style={styles.daysContainer}>
          {days.map((day, index) => {
            const isActive =
              selectedDate &&
              day.toDateString() === selectedDate.toDateString();
            const hasTransactions = hasTransactionsOnDay(day);

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  isActive && styles.activeDaySelected,
                  !isActive && hasTransactions && styles.hasTransactionsDay,
                  !isActive && !hasTransactions && styles.noTransactionsDay,
                ]}
                onPress={() => {
                  if (
                    selectedDate &&
                    day.toDateString() === selectedDate.toDateString()
                  ) {
                    // Si es el mismo día, deseleccionamos
                    setSelectedDate(null);
                  } else {
                    // Si es otro día o no hay selección, seleccionamos este día
                    setSelectedDate(day);
                  }
                }}
                activeOpacity={1}
              >
                <Text style={[styles.dayNumber, styles.dayText]}>
                  {format(day, "dd", { locale: es })}
                </Text>
                <Text style={[styles.dayLabel, styles.dayText]}>
                  {format(day, "EEE", { locale: es })}
                </Text>

                {hasTransactions && (
                  <View
                    style={[styles.greenDot, isActive && styles.whiteDot]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <BalanceHeader
        balance={balance}
        income={income}
        expenses={expenses}
        monthYear={monthYear}
      />

      {/* FlatList con las transacciones agrupadas */}
      <FlatList
        data={filteredTransactionsForRender}
        keyExtractor={(item) => item[0]}
        // En el renderItem del FlatList, modifica esta parte:

        renderItem={({ item }) => {
          const [dateString, transactions] = item;

          // Parseamos correctamente la fecha
          // El formato original es "dd-MM-yyyy"
          const [day, month, year] = dateString.split("-");
          const dateObject = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          );

          return (
            <View style={styles.transactionGroup}>
              <Text style={styles.transactionDate}>
                {format(dateObject, "dd MMM yyyy", { locale: es })}
              </Text>
              {transactions.length > 0 ? (
                transactions.map((transaction: Transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              ) : (
                <Text>No hay transacciones para este día.</Text>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {/* Modal del calendario */}
      <Modal
        transparent={true}
        visible={isCalendarVisible}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <Calendar
              style={{ width: "100%" }}
              maxDate={format(new Date(), "yyyy-MM-dd")}
              onDayPress={(day: any) => {
                const newDate = new Date(day.dateString);
                setReferenceDay(newDate);
                setSelectedDate(newDate);
                setIsCalendarVisible(false);
              }}
              markedDates={{
                [format(selectedDate ?? new Date(), "yyyy-MM-dd")]: {
                  selected: true,
                  selectedColor: "#00DC5A",
                },
              }}
              theme={{
                todayTextColor: "#00DC5A",
                selectedDayBackgroundColor: "#00DC5A",
                arrowColor: "#00DC5A",
              }}
            />

            <TouchableOpacity
              onPress={() => setIsCalendarVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default Movements;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    padding: 16,
    backgroundColor: "#000",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  monthYearButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFF",
    alignSelf: "center",
    marginVertical: 10,
    width: "80%",
  },
  transactionGroup: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  transactionDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
  },

  monthText: {
    color: "#00DC5A",
  },

  yearText: {
    color: "#FFF",
  },

  arrowText: {
    color: "#FFF",
    fontSize: 24,
  },

  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
  },
  calendarContainer: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 5,
  },
  closeButton: {
    marginTop: 12,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: "#00DC5A",
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  changeMonthButton: {
    position: "absolute",
    right: 20,
    top: 15,
    backgroundColor: "#000",
    padding: 8,
    borderRadius: 8,
  },
  changeMonthButtonText: {
    color: "#00DC5A",
    fontSize: 20,
    fontWeight: "bold",
  },

  headerTitle: {
    fontSize: 26,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Outfit_500Medium",
  },
  monthButton: {
    color: "#00DC5A",
    textAlign: "center",
    fontSize: 18,
    marginVertical: 8,
    fontFamily: "Outfit_600SemiBold",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  dayButton: {
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    fontFamily: "Outfit_500Medium",
    width: "15%",
    height: 70,
  },
  activeDaySelected: {
    backgroundColor: "#00DC5A",
    borderColor: "#00DC5A",
    borderWidth: 1,
  },

  hasTransactionsDay: {
    borderColor: "#00DC5A",
    borderWidth: 1,
  },

  noTransactionsDay: {
    borderColor: "#FFF",
    borderWidth: 1,
  },
  dayText: {
    color: "#FFF",
    fontFamily: "Outfit_500Medium",
  },
  whiteDot: {
    backgroundColor: "#FFF",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00DC5A",
    marginTop: 9,
  },
  dayNumber: { color: "#FFF", fontSize: 18 },
  dayLabel: { color: "#FFF", fontSize: 14 },
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
