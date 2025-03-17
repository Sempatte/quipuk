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
import { useFocusEffect } from "@react-navigation/native";
import { ThemedView } from "@/components/ThemedView";
import { GET_TRANSACTIONS_BY_USER } from "../graphql/transaction.graphql";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import TransactionItem from "@/components/ui/TransactionItem";
import { capitalize } from "lodash";
import { Calendar } from "react-native-calendars";
import BalanceHeader from "@/components/ui/BalancerHeader";

const Movements = () => {
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS_BY_USER);
  const [referenceDay, setReferenceDay] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  /** 📌 Obtiene los últimos 6 días basados en la fecha seleccionada */
  const getLastSixDays = (date: Date) =>
    Array.from({ length: 6 }, (_, index) => subDays(date, 5 - index));

  /** 📌 Verifica si hay transacciones en un día específico */
  const hasTransactionsOnDay = (day: Date) =>
    data?.getTransactions?.some(
      (transaction: any) =>
        new Date(transaction.createdAt).toDateString() === day.toDateString()
    );

  const days = getLastSixDays(referenceDay);

  /** 📌 Filtra transacciones del día seleccionado */
  const filteredTransactions = data?.getTransactions?.filter(
    (transaction: any) =>
      new Date(transaction.createdAt).toDateString() ===
      selectedDate.toDateString()
  );

  /** 📌 Calcula ingresos, gastos y balance dinámico */
  const selectedMonthYear = format(selectedDate, "yyyy-MM"); // Obtiene "2024-03"

  const monthlyTransactions =
    data?.getTransactions?.filter((transaction: any) => {
      return (
        format(new Date(transaction.createdAt), "yyyy-MM") === selectedMonthYear
      );
    }) || []; // Si no hay transacciones, se usa un array vacío

  const { income, expenses, balance } = monthlyTransactions.reduce(
    (
      acc: { income: number; expenses: number; balance: number },
      transaction: any
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
    { income: 0, expenses: 0, balance: 0 } // Si no hay transacciones, los valores serán 0
  );

  /** 📌 Obtiene el mes y año para el balance */
  const monthYear = capitalize(
    format(selectedDate, "MMMM yyyy", { locale: es })
  );

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

        {/* 📌 Botón para abrir calendario */}
        <TouchableOpacity
          onPress={() => setIsCalendarVisible(true)}
          style={styles.monthYearButton}
          activeOpacity={1}
        >
          <Text style={styles.arrowText}>{"<"}</Text>
          <Text style={styles.monthYearText}>
            <Text style={styles.monthText}>
              {capitalize(format(selectedDate, "MMMM", { locale: es }))}{" "}
            </Text>
            <Text style={styles.yearText}>{format(selectedDate, "yyyy")}</Text>
          </Text>
          <Text style={styles.arrowText}>{">"}</Text>
        </TouchableOpacity>

        {/* 📌 Selector de últimos 6 días */}
        <View style={styles.daysContainer}>
          {days.map((day, index) => {
            const isActive = day.toDateString() === selectedDate.toDateString();
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
                onPress={() => setSelectedDate(day)}
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

      {/* 📌 Balance actualizado dinámicamente */}
      <BalanceHeader
        balance={balance}
        income={income}
        expenses={expenses}
        monthYear={monthYear}
      />

      {/* 📌 Lista de transacciones */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        contentContainerStyle={styles.listContent}
      />

      {/* 📌 Modal del calendario */}
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
                setReferenceDay(newDate); // 📌 Actualiza la referencia para los últimos 6 días
                setSelectedDate(newDate);
                setIsCalendarVisible(false);
              }}
              markedDates={{
                [format(selectedDate, "yyyy-MM-dd")]: {
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
    borderWidth: 1, // Asegúrate de tener borde blanco definido aquí
  },
  dayText: {
    color: "#FFF", // Letras blancas cuando está seleccionado
    fontFamily: "Outfit_500Medium",
  },
  whiteDot: {
    backgroundColor: "#FFF", // Punto blanco al estar seleccionado
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00DC5A",
    marginTop: 9,
  },
  activeDay: { borderColor: "#00DC5A", borderWidth: 1 },
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
