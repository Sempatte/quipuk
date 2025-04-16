import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { useQuery } from "@apollo/client";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar } from "react-native-calendars";
import {
  format,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  addDays,
  isLastDayOfMonth,
  isBefore,
} from "date-fns";
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

const { width } = Dimensions.get("window");
// Ancho del botón de día
const DAY_BUTTON_WIDTH = width * 0.15;
// Espacio entre botones
const DAY_BUTTON_MARGIN = 8;

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
  const [days, setDays] = useState<Date[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [didInitialScroll, setDidInitialScroll] = useState(false);

  // Array de transacciones
  const transactions: Transaction[] = data?.getTransactions || [];

  // Función para obtener los días del mes con la lógica actualizada
  const getDaysOfMonth = useCallback((referenceDate: Date) => {
    const start = startOfMonth(referenceDate);
    const end = endOfMonth(referenceDate);
    const today = new Date();

    const daysArray: Date[] = [];
    let currentDay = start;

    // Crear array con todos los días del mes hasta el final
    while (currentDay <= end) {
      daysArray.push(new Date(currentDay));
      currentDay = addDays(currentDay, 1);
    }

    // Verificar si es el mismo mes que el actual
    if (isSameMonth(today, referenceDate)) {
      // Obtener la fecha actual
      const todayDate = today.getDate();

      // Filtrar el array para incluir todos los días hasta hoy + 2 días adicionales o hasta fin de mes
      const filteredDaysArray = daysArray.filter((day) => {
        const dayDate = day.getDate();

        // Si es el último día del mes, no mostrar días adicionales
        if (isLastDayOfMonth(today)) {
          return dayDate <= todayDate;
        }

        // Si es el penúltimo día del mes, mostrar hasta el último día
        if (todayDate === end.getDate() - 1) {
          return dayDate <= end.getDate();
        }

        // Para otros casos, mostrar hasta hoy + 2 días o hasta el final del mes
        return dayDate <= Math.min(todayDate + 2, end.getDate());
      });

      return filteredDaysArray;
    }

    return daysArray;
  }, []);

  // Verificar si un día es futuro (después de hoy)
  const isFutureDay = useCallback((day: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return day > today;
  }, []);

  // Actualizar los días cuando cambie la fecha de referencia
  useEffect(() => {
    const allDaysOfMonth = getDaysOfMonth(referenceDay);
    setDays(allDaysOfMonth);
    setDidInitialScroll(false);
  }, [referenceDay, getDaysOfMonth]);

  // Inicializar y verificar errores
  useFocusEffect(
    useCallback(() => {
      if (error?.message === "Token expired or invalid") {
        AsyncStorage.removeItem("token");
        navigation.navigate("LoginScreen");
      }
      refetch();
    }, [refetch, error, navigation])
  );

  // Calcular la posición máxima de scroll
  const calculateMaxScrollPosition = useCallback(() => {
    if (days.length === 0) return 0;
    return Math.max(
      0,
      days.length * (DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2) - width
    );
  }, [days]);

  // Desplazar a un día específico, con más opciones para Android
  const scrollToDay = useCallback(
    (index: number) => {
      if (scrollViewRef.current && index >= 0 && index < days.length) {
        const position = index * (DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2);

        // En Android usamos un pequeño delay para asegurar que el scroll funcione
        if (Platform.OS === "android") {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              x: position,
              animated: true,
            });
          }, 100);
        } else {
          scrollViewRef.current.scrollTo({
            x: position,
            animated: true,
          });
        }
      }
    },
    [days]
  );

  // Desplazar al final para mostrar los días más recientes primero
  const scrollToEnd = useCallback(() => {
    if (scrollViewRef.current && days.length > 0) {
      const maxPosition = calculateMaxScrollPosition();

      // En Android usamos un pequeño delay para asegurar que el scroll funcione
      if (Platform.OS === "android") {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            x: maxPosition,
            animated: false, // Sin animación para el scroll inicial
          });
        }, 100);
      } else {
        scrollViewRef.current.scrollTo({
          x: maxPosition,
          animated: false, // Sin animación para el scroll inicial
        });
      }
    }
  }, [days, calculateMaxScrollPosition]);

  // Efecto para desplazar al final (días más recientes) al iniciar
  useEffect(() => {
    if (days.length > 0 && !didInitialScroll) {
      // Esperar un poco para asegurar que el ScrollView esté renderizado
      setTimeout(() => {
        if (selectedDate) {
          // Buscar el índice del día seleccionado
          const selectedIndex = days.findIndex(
            (day) => day.toDateString() === selectedDate.toDateString()
          );

          if (selectedIndex >= 0) {
            scrollToDay(selectedIndex);
          } else {
            // Si no encontramos el día seleccionado, ir al final (días más recientes)
            scrollToEnd();
          }
        } else {
          // Si no hay día seleccionado, ir al final (días más recientes)
          scrollToEnd();
        }

        setDidInitialScroll(true);
      }, 300);
    }
  }, [days, selectedDate, scrollToDay, scrollToEnd, didInitialScroll]);

  // Verifica si hay transacciones en un día específico, sin filtrar por status
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
    : format(referenceDay, "yyyy-MM");

  const monthYear = selectedDate
    ? capitalize(format(selectedDate, "MMMM yyyy", { locale: es }))
    : capitalize(format(referenceDay, "MMMM yyyy", { locale: es }));

  // Filtra transacciones por mes
  const monthlyTransactions = transactions.filter(
    (transaction) =>
      format(new Date(transaction.createdAt), "yyyy-MM") === selectedMonthYear
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

  // Prepara los datos para el FlatList con el tipo correcto y filtrando por status completed
  const getFilteredTransactionsForRender =
    useCallback((): GroupedTransactionItem[] => {
      // Filtramos solo las transacciones completadas, con algunas verificaciones adicionales
      const completedTransactions = transactions.filter((transaction) => {
        // Verificar que la transacción existe y tiene un campo status
        if (!transaction || typeof transaction.status === "undefined") {
          return false;
        }
        // Comprobar si el status es completed (o cualquier otro valor que indique "completado")
        return transaction.status === "completed";
      });



      if (selectedDate) {
        // Filtramos transacciones por día seleccionado
        const filteredItems = completedTransactions.filter(
          (transaction) =>
            new Date(transaction.createdAt).toDateString() ===
            selectedDate.toDateString()
        );

        const dateKey = format(selectedDate, "dd-MM-yyyy");


        // Siempre devolvemos un formato compatible con renderItem
        return [[dateKey, filteredItems.length > 0 ? filteredItems : []]];
      } else {
        // Agrupar las transacciones completadas por día
        const completedGroupedTransactions = groupTransactionsByDay(
          completedTransactions
        );

        // Convertimos el objeto de transacciones agrupadas a un array
        const entries = Object.entries(
          completedGroupedTransactions
        ) as GroupedTransactionItem[];

        // Log para debug
        console.log("Grouped transactions entries:", entries.length);

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
    }, [selectedDate, transactions, groupTransactionsByDay]);

  const filteredTransactionsForRender = getFilteredTransactionsForRender();

  // Maneja la selección de un día
  const toggleDateSelection = (day: Date) => {
    // Solo permitir seleccionar días que no son futuros
    if (!isFutureDay(day)) {
      if (selectedDate && day.toDateString() === selectedDate.toDateString()) {
        setSelectedDate(null); // Deseleccionamos si es el mismo día
      } else {
        setSelectedDate(day); // Seleccionamos el nuevo día

        // Si el día seleccionado no es del mes actual, actualizar referenceDay
        if (!isSameMonth(day, referenceDay)) {
          setReferenceDay(day);
        }
      }
    }
  };

  // Maneja la selección de día en el calendario
  const handleCalendarDayPress = (day: { dateString: string }) => {
    const newDate = new Date(day.dateString);
    setReferenceDay(newDate);
    setSelectedDate(newDate);
    setIsCalendarVisible(false);
    setDidInitialScroll(false); // Resetear el scroll inicial
  };

  // Navegación al mes anterior
  const goToPreviousMonth = () => {
    const newReference = new Date(referenceDay);
    newReference.setMonth(newReference.getMonth() - 1);
    setReferenceDay(newReference);
    setSelectedDate(null);
    setDidInitialScroll(false); // Resetear el scroll inicial
  };

  // Navegación al mes siguiente (hasta el mes actual)
  const goToNextMonth = () => {
    const newReference = new Date(referenceDay);
    newReference.setMonth(newReference.getMonth() + 1);

    // No permitir avanzar más allá del mes actual
    const today = new Date();
    if (
      newReference <= today ||
      (newReference.getMonth() === today.getMonth() &&
        newReference.getFullYear() === today.getFullYear())
    ) {
      setReferenceDay(newReference);
      setSelectedDate(null);
      setDidInitialScroll(false); // Resetear el scroll inicial
    }
  };

  if (loading) {
    return <Loader visible={true} fullScreen text="Cargando movimientos..." />;
  }

  if (error) {
    return (
      <ThemedView style={styles.centeredContainer}>
        <Text>Error: {error.message}</Text>
      </ThemedView>
    );
  }

  // Determinar si podemos avanzar al siguiente mes
  const today = new Date();
  const canGoNext =
    referenceDay.getMonth() < today.getMonth() ||
    referenceDay.getFullYear() < today.getFullYear();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transacciones</Text>

        <View style={styles.monthYearContainer}>
          <TouchableOpacity
            onPress={goToPreviousMonth}
            style={styles.monthArrowButton}
          >
            <Text style={styles.arrowText}>{"<"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsCalendarVisible(true)}
            style={styles.monthTextButton}
            activeOpacity={0.8}
          >
            <Text style={styles.monthYearText}>
              <Text style={styles.monthText}>{monthYear}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNextMonth}
            disabled={!canGoNext}
            style={styles.monthArrowButton}
          >
            <Text
              style={[styles.arrowText, !canGoNext && styles.disabledArrow]}
            >
              {">"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.daysScrollWrapper}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScrollContainer}
            decelerationRate="normal"
            snapToInterval={DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2}
            snapToAlignment="start"
          >
            {days.map((day, index) => {
              const isActive =
                selectedDate &&
                day.toDateString() === selectedDate.toDateString();
              const hasTransactions = hasTransactionsOnDay(day);
              const isCurrentDay =
                day.toDateString() === new Date().toDateString();
              const isFuture = isFutureDay(day);

              return (
                <View
                  key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                  style={styles.dayButtonContainer}
                >
                  <TouchableOpacity
                    style={[
                      styles.dayButton,
                      isActive && styles.activeDaySelected,
                      !isActive &&
                        hasTransactions &&
                        !isFuture &&
                        styles.hasTransactionsDay,
                      !isActive &&
                        !hasTransactions &&
                        !isFuture &&
                        styles.noTransactionsDay,
                      isFuture && styles.futureDayButton, // Estilo para días futuros
                    ]}
                    onPress={() => toggleDateSelection(day)}
                    activeOpacity={isFuture ? 1 : 0.8} // No mostrar feedback en días futuros
                    disabled={isFuture} // Deshabilitamos días futuros
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        isFuture && styles.futureDayText, // Texto gris para días futuros
                      ]}
                    >
                      {format(day, "dd", { locale: es })}
                    </Text>
                    <Text
                      style={[
                        styles.dayLabel,
                        isFuture && styles.futureDayText, // Texto gris para días futuros
                      ]}
                    >
                      {format(day, "EEE", { locale: es })}
                    </Text>

                    {hasTransactions && !isFuture && (
                      <View
                        style={[styles.greenDot, isActive && styles.whiteDot]}
                      />
                    )}
                  </TouchableOpacity>
                  {isCurrentDay && <View style={styles.todayIndicator}></View>}
                </View>
              );
            })}
          </ScrollView>
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
    backgroundColor: "#FFF",
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
  monthYearContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    width: "90%",
    alignSelf: "center",
  },
  monthTextButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFF",
    alignItems: "center",
  },
  monthArrowButton: {
    padding: 10,
    width: 44,
    alignItems: "center",
    justifyContent: "center",
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
  disabledArrow: {
    color: "#555", // Color más oscuro para indicar deshabilitado
  },
  daysScrollWrapper: {
    // Esto asegura que el ScrollView tenga un tamaño definido
    height: 90,
    marginTop: 8,
  },
  daysScrollContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    // Fijar un ancho mínimo para evitar problemas de scroll
    minWidth: width,
  },
  dayButtonContainer: {
    alignItems: "center",
    marginHorizontal: DAY_BUTTON_MARGIN,
    width: DAY_BUTTON_WIDTH,
  },
  dayButton: {
    alignItems: "center",
    padding: 8,
    borderRadius: 10,
    fontFamily: "Outfit_500Medium",
    width: DAY_BUTTON_WIDTH,
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
  futureDayButton: {
    borderColor: "#555", // Borde gris para días futuros
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
  futureDayText: {
    color: "#555", // Texto gris para días futuros
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
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFF",
    marginTop: 5,
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
    paddingBottom: 20,
  },
});

export default Movements;
