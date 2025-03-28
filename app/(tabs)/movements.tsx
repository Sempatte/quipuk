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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar } from "react-native-calendars";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { capitalize } from "lodash";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedView } from "@/components/ThemedView";
import TransactionItem from "@/components/ui/TransactionItem";
import BalanceHeader from "@/components/ui/BalancerHeader";
import { GET_TRANSACTIONS_BY_USER } from "../graphql/transaction.graphql";
import { RootStackParamList } from "../interfaces/navigation";
import { Transaction } from "../interfaces/transaction.interface";
import Loader from "@/components/ui/Loader";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "LoginScreen"
>;

// Definimos un tipo para nuestro formato de datos agrupados
type GroupedTransactionItem = [string, Transaction[]];

const Movements = () => {
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS_BY_USER);
  const [referenceDay, setReferenceDay] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Array de transacciones
  const transactions: Transaction[] = data?.getTransactions || [];

  useFocusEffect(
    useCallback(() => {
      if (error?.message === "Token expired or invalid") {
        AsyncStorage.removeItem("token");
        navigation.navigate("LoginScreen");
      }
      refetch();
    }, [refetch, error, navigation])
  );

  // Obtiene los últimos 6 días basados en la fecha de referencia
  const getLastSixDays = useCallback(
    (date: Date) => Array.from({ length: 6 }, (_, index) => subDays(date, 5 - index)),
    []
  );

  // Verifica si hay transacciones en un día específico
  const hasTransactionsOnDay = useCallback(
    (day: Date) =>
      transactions.some(
        (transaction) =>
          new Date(transaction.createdAt).toDateString() === day.toDateString()
      ),
    [transactions]
  );

  // Agrupar las transacciones por día
  const groupTransactionsByDay = useCallback((transactions: Transaction[]) => {
    const groups = transactions.reduce((acc, transaction) => {
      const date = format(new Date(transaction.createdAt), "dd-MM-yyyy");
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as { [key: string]: Transaction[] });

    // Ordenamos las transacciones dentro de cada grupo por fecha descendente
    Object.keys(groups).forEach((date) => {
      groups[date].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return groups;
  }, []);

  const groupedTransactions = Array.isArray(transactions)
    ? groupTransactionsByDay(transactions)
    : {};

  // Obtiene el mes y año actual o seleccionado
  const selectedMonthYear = selectedDate
    ? format(selectedDate, "yyyy-MM")
    : format(new Date(), "yyyy-MM");

  const monthYear = selectedDate
    ? capitalize(format(selectedDate, "MMMM yyyy", { locale: es }))
    : capitalize(format(new Date(), "MMMM yyyy", { locale: es }));

  // Filtra transacciones por mes
  const monthlyTransactions = transactions.filter(
    (transaction) => format(new Date(transaction.createdAt), "yyyy-MM") === selectedMonthYear
  );

  // Calcula ingresos, gastos y balance
  const { income, expenses, balance } = monthlyTransactions.reduce(
    (acc, transaction) => {
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

  // Prepara los datos para el FlatList con el tipo correcto
  const getFilteredTransactionsForRender = useCallback((): GroupedTransactionItem[] => {
    if (selectedDate) {
      // Filtramos transacciones por día seleccionado
      const filteredItems = transactions.filter(
        (transaction) =>
          new Date(transaction.createdAt).toDateString() === selectedDate.toDateString()
      );

      const dateKey = format(selectedDate, "dd-MM-yyyy");
      
      // Siempre devolvemos un formato compatible con renderItem
      return [[dateKey, filteredItems.length > 0 ? filteredItems : []]];
    } else {
      // Convertimos el objeto de transacciones agrupadas a un array
      const entries = Object.entries(groupedTransactions) as GroupedTransactionItem[];

      // Ordenamos por fecha (más reciente primero)
      entries.sort(([dateA], [dateB]) => {
        const [dayA, monthA, yearA] = dateA.split("-").map(Number);
        const [dayB, monthB, yearB] = dateB.split("-").map(Number);

        // Comparamos por año, mes y día
        if (yearA !== yearB) return yearB - yearA;
        if (monthA !== monthB) return monthB - monthA;
        return dayB - dayA;
      });

      return entries;
    }
  }, [selectedDate, transactions, groupedTransactions]);

  const days = getLastSixDays(referenceDay);
  const filteredTransactionsForRender = getFilteredTransactionsForRender();

  const toggleDateSelection = (day: Date) => {
    if (selectedDate && day.toDateString() === selectedDate.toDateString()) {
      setSelectedDate(null); // Deseleccionamos si es el mismo día
    } else {
      setSelectedDate(day); // Seleccionamos el nuevo día
    }
  };

  const handleCalendarDayPress = (day: { dateString: string }) => {
    const newDate = new Date(day.dateString);
    setReferenceDay(newDate);
    setSelectedDate(newDate);
    setIsCalendarVisible(false);
  };

  if (loading) {
    return (
      <Loader visible={true} fullScreen text="Cargando movimientos..." />
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
          activeOpacity={0.8}
        >
          <Text style={styles.arrowText}>{"<"}</Text>
          <Text style={styles.monthYearText}>
            <Text style={styles.monthText}>{monthYear}</Text>
          </Text>
          <Text style={styles.arrowText}>{">"}</Text>
        </TouchableOpacity>

        <View style={styles.daysContainer}>
          {days.map((day, index) => {
            const isActive = selectedDate && day.toDateString() === selectedDate.toDateString();
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
                onPress={() => toggleDateSelection(day)}
                activeOpacity={0.8}
              >
                <Text style={styles.dayNumber}>
                  {format(day, "dd", { locale: es })}
                </Text>
                <Text style={styles.dayLabel}>
                  {format(day, "EEE", { locale: es })}
                </Text>

                {hasTransactions && (
                  <View style={[styles.greenDot, isActive && styles.whiteDot]} />
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

      <FlatList
        data={filteredTransactionsForRender}
        keyExtractor={(item: GroupedTransactionItem) => item[0]}
        renderItem={({ item }: { item: GroupedTransactionItem }) => {
          const [dateString, transactionList] = item;
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
              {transactionList.length > 0 ? (
                transactionList.map((transaction: Transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))
              ) : (
                <Text style={styles.noTransactionsText}>
                  No hay transacciones para este día.
                </Text>
              )}
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        transparent={true}
        visible={isCalendarVisible}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              maxDate={format(new Date(), "yyyy-MM-dd")}
              onDayPress={handleCalendarDayPress}
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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFF" 
  },
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
  headerTitle: {
    fontSize: 26,
    color: "#FFF",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Outfit_500Medium",
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
  arrowText: {
    color: "#FFF",
    fontSize: 24,
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
    borderColor: "#000",
    borderWidth: 1,
  },
  noTransactionsDay: {
    borderColor: "#FFF",
    borderWidth: 1,
  },
  dayNumber: { 
    color: "#FFF", 
    fontSize: 18,
    fontFamily: "Outfit_500Medium",
  },
  dayLabel: { 
    color: "#FFF", 
    fontSize: 14,
    fontFamily: "Outfit_500Medium",
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00DC5A",
    marginTop: 9,
  },
  whiteDot: {
    backgroundColor: "#FFF",
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
  noTransactionsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
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
  calendar: {
    width: "100%",
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
  listContent: { 
    paddingBottom: 20 
  },
});

export default Movements;

/* 
  TO DO: Scroll en los botones de dias

  FORMATO DEL MOVIMIENTO

                   DESCRIPCION 
  ICONO_CATEGORIA  HORA   FECHA        +- S/MONTO
                   METODO DE PAGO
*/