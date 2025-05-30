import React, { useCallback, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  Platform
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
  interpolate,
  Extrapolate,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';

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
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [didInitialScroll, setDidInitialScroll] = useState(false);
  
  // 🚀 NUEVO: Estado para guardar la posición del scroll
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null);
  // 🚀 NUEVO: Ref para evitar bucles infinitos
  const isInitialMount = useRef(true);
  const isRestoringPosition = useRef(false);

  // 🚀 NUEVOS VALORES ANIMADOS
  const scrollProgress = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const dayButtonsScale = useSharedValue(0);
  const todayIndicatorPulse = useSharedValue(1);

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

  // 🚀 ANIMACIÓN DE ENTRADA DEL HEADER
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [
        {
          translateY: interpolate(
            headerOpacity.value,
            [0, 1],
            [-20, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  // 🚀 ANIMACIÓN DE LOS BOTONES DE DÍAS
  const animatedDayButtonsStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: dayButtonsScale.value,
        },
      ],
    };
  });

  // 🚀 FUNCIÓN MEJORADA PARA SCROLL AUTOMÁTICO AL DÍA ACTUAL
  const scrollToTodayAnimated = useCallback(() => {
    if (!scrollViewRef.current || days.length === 0) return;

    const today = new Date();
    const todayIndex = days.findIndex(
      (day) => day.toDateString() === today.toDateString()
    );

    if (todayIndex === -1) {
      // Si no se encuentra hoy, scroll al final
      const maxPosition = Math.max(
        0,
        days.length * (DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2) - width
      );
      
      scrollViewRef.current.scrollTo({
        x: maxPosition,
        animated: true,
      });
      return;
    }

    // Calcular posición centrada para el día actual
    const position = todayIndex * (DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2);
    const screenWidth = Dimensions.get('window').width;
    const centerOffset = (screenWidth - DAY_BUTTON_WIDTH) / 2;
    const adjustedPosition = Math.max(0, position - centerOffset);

    // Animar el progreso del scroll
    scrollProgress.value = withSequence(
      withTiming(0.3, { duration: 200 }),
      withTiming(0.7, { duration: 400 }),
      withTiming(1, { duration: 300 })
    );

    // Ejecutar el scroll con una animación suave
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: adjustedPosition,
        animated: true,
      });

      // Activar la animación de pulso en el indicador "Hoy"
      todayIndicatorPulse.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    }, 100);

  }, [days, scrollProgress, todayIndicatorPulse]);

  // 🚀 FUNCIÓN PARA GUARDAR LA POSICIÓN ACTUAL DEL SCROLL
  const saveScrollPosition = useCallback((x: number) => {
    setSavedScrollPosition(x);
    console.log('💾 Posición de scroll guardada:', x);
  }, []);

  // 🚀 FUNCIÓN PARA SCROLL AUTOMÁTICO AL DÍA ACTUAL (solo primera vez)
  const performInitialScroll = useCallback(() => {
    if (!scrollViewRef.current || days.length === 0 || isRestoringPosition.current) return;

    console.log('🔄 Ejecutando scroll inicial al día actual...');

    const today = new Date();
    const todayIndex = days.findIndex(
      (day) => day.toDateString() === today.toDateString()
    );

    let targetPosition: number;

    if (todayIndex === -1) {
      // Si no se encuentra hoy, scroll al final (días más recientes)
      targetPosition = Math.max(
        0,
        days.length * (DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2) - width
      );
      console.log('📍 Scrolleando al final, posición:', targetPosition);
    } else {
      // Calcular posición centrada para el día actual
      const position = todayIndex * (DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2);
      const screenWidth = Dimensions.get('window').width;
      const centerOffset = (screenWidth - DAY_BUTTON_WIDTH) / 2;
      targetPosition = Math.max(0, position - centerOffset);
      console.log('📍 Scrolleando al día actual, posición:', targetPosition);
    }

    // Ejecutar el scroll
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: targetPosition,
        animated: true,
      });
      
      // Guardar la posición
      saveScrollPosition(targetPosition);

      // Activar animación de pulso solo si es el día actual
      if (todayIndex !== -1) {
        todayIndicatorPulse.value = withSequence(
          withSpring(1.3, { damping: 8, stiffness: 200 }),
          withSpring(1, { damping: 8, stiffness: 200 })
        );
      }
    }, 300);

  }, [days, todayIndicatorPulse, saveScrollPosition]);

  // 🚀 FUNCIÓN PARA RESTAURAR LA POSICIÓN DEL SCROLL
  const restoreScrollPosition = useCallback(() => {
    if (!scrollViewRef.current || savedScrollPosition === null || isRestoringPosition.current) return;

    console.log('🔄 Restaurando posición de scroll:', savedScrollPosition);
    isRestoringPosition.current = true;
    
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        x: savedScrollPosition,
        animated: true,
      });
      
      // Resetear flag después del scroll
      setTimeout(() => {
        isRestoringPosition.current = false;
      }, 1000);
    }, 300);
  }, [savedScrollPosition]);

  // Actualizar los días cuando cambie la fecha de referencia
  useEffect(() => {
    const allDaysOfMonth = getDaysOfMonth(referenceDay);
    setDays(allDaysOfMonth);
    setDidInitialScroll(false);
    // 🚀 NUEVO: Resetear refs cuando cambia el mes
    isInitialMount.current = false;
    isRestoringPosition.current = false;
  }, [referenceDay, getDaysOfMonth]);

  // 🚀 EFECTO SIMPLIFICADO PARA SCROLL INICIAL
  useEffect(() => {
    if (days.length === 0 || didInitialScroll) return;

    console.log('🚀 Days disponibles, ejecutando scroll inicial...');

    const timeoutId = setTimeout(() => {
      if (savedScrollPosition === null) {
        // Primera vez - scroll al día actual
        performInitialScroll();
      } else {
        // Hay posición guardada - restaurar
        restoreScrollPosition();
      }
      setDidInitialScroll(true);
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [days, didInitialScroll, savedScrollPosition, performInitialScroll, restoreScrollPosition]);

  // 🚀 INICIALIZAR ANIMACIONES UNA SOLA VEZ AL MONTAR
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    dayButtonsScale.value = withTiming(1, { duration: 800 });
  }, []);

  // 🚀 MANEJO SIMPLIFICADO DE FOCUS - SOLO PARA RESTAURAR CUANDO VIENE DE OTRA TAB
  useFocusEffect(
    useCallback(() => {
      // Solo actuar si no es el montaje inicial y hay una posición guardada
      if (isInitialMount.current || savedScrollPosition === null || isRestoringPosition.current) {
        isInitialMount.current = false;
        return;
      }

      console.log('👁️ Regresando de otra tab - restaurando posición');
      
      // Pequeño delay para asegurar que la pantalla esté lista
      const timeoutId = setTimeout(() => {
        restoreScrollPosition();
      }, 200);

      return () => clearTimeout(timeoutId);
    }, [savedScrollPosition, restoreScrollPosition])
  );

  // Verificar errores de autenticación
  useFocusEffect(
    useCallback(() => {
      if (error?.message === "Token expired or invalid") {
        AsyncStorage.removeItem("token");
        navigation.navigate("LoginScreen");
      }
      refetch();
    }, [refetch, error, navigation])
  );

  // 🚀 COMPONENTE ANIMADO PARA EL BOTÓN DE DÍA
  const AnimatedDayButton = ({ day, index }: { day: Date; index: number }) => {
    const isActive = selectedDate && day.toDateString() === selectedDate.toDateString();
    const hasTransactions = hasTransactionsOnDay(day);
    const isCurrentDay = day.toDateString() === new Date().toDateString();
    const isFuture = isFutureDay(day);

    // Animación especial para el indicador "Hoy"
    const todayIndicatorStyle = useAnimatedStyle(() => {
      if (!isCurrentDay) return {};
      
      return {
        transform: [{ scale: todayIndicatorPulse.value }],
      };
    });

    return (
      <View style={styles.dayButtonContainer}>
        <TouchableOpacity
          style={[
            styles.dayButton,
            isActive && styles.activeDaySelected,
            !isActive && hasTransactions && !isFuture && styles.hasTransactionsDay,
            !isActive && !hasTransactions && !isFuture && styles.noTransactionsDay,
            isFuture && styles.futureDayButton,
          ]}
          onPress={() => toggleDateSelection(day)}
          activeOpacity={isFuture ? 1 : 0.8}
          disabled={isFuture}
        >
          <Text
            style={[
              styles.dayNumber,
              isFuture && styles.futureDayText,
            ]}
          >
            {format(day, "dd", { locale: es })}
          </Text>
          <Text
            style={[
              styles.dayLabel,
              isFuture && styles.futureDayText,
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
        {isCurrentDay && (
          <Animated.Text 
            style={[styles.todayIndicator, todayIndicatorStyle]}
          >
            Hoy
          </Animated.Text>
        )}
      </View>
    );
  };

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
  const getFilteredTransactionsForRender = useCallback((): GroupedTransactionItem[] => {
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
    setDidInitialScroll(false);
  };

  // Navegación al mes anterior
  const goToPreviousMonth = () => {
    const newReference = new Date(referenceDay);
    newReference.setMonth(newReference.getMonth() - 1);
    setReferenceDay(newReference);
    setSelectedDate(null);
    setDidInitialScroll(false);
    // 🚀 NUEVO: Limpiar posición guardada al cambiar de mes
    setSavedScrollPosition(null);
    isRestoringPosition.current = false;
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
      setDidInitialScroll(false);
      // 🚀 NUEVO: Limpiar posición guardada al cambiar de mes
      setSavedScrollPosition(null);
      isRestoringPosition.current = false;
    }
  };

  if (loading) {
    return <Loader visible={true} fullScreen text="Cargando movimientos..." />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.centeredContainer}>
          <Text>Error: {error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Determinar si podemos avanzar al siguiente mes
  const today = new Date();
  const canGoNext =
    referenceDay.getMonth() < today.getMonth() ||
    referenceDay.getFullYear() < today.getFullYear();

  return (
    <>
      <SafeAreaView style={{ backgroundColor: "#000" }} edges={["top"]}>
        <Animated.View style={[styles.header, animatedHeaderStyle]}>
          <Text style={styles.headerTitle}>
            Transacciones
          </Text>

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

          <Animated.View style={[styles.daysScrollWrapper, animatedDayButtonsStyle]}>
            <Animated.ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContainer}
              decelerationRate="normal"
              snapToInterval={DAY_BUTTON_WIDTH + DAY_BUTTON_MARGIN * 2}
              snapToAlignment="start"
              onScroll={(event) => {
                // 🚀 NUEVO: Guardar posición del scroll en tiempo real (solo si no estamos restaurando)
                if (!isRestoringPosition.current) {
                  const currentX = event.nativeEvent.contentOffset.x;
                  saveScrollPosition(currentX);
                }
              }}
              scrollEventThrottle={200} // Aumentado para mejor performance
            >
              {days.map((day, index) => (
                <AnimatedDayButton 
                  key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                  day={day} 
                  index={index} 
                />
              ))}
            </Animated.ScrollView>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
      
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
        ListHeaderComponent={
          <BalanceHeader
            balance={balance}
            income={income}
            expenses={expenses}
            monthYear={monthYear}
          />
        }
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
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 16,
    paddingBottom: 16,
    backgroundColor: "#000",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    minHeight: Platform.OS === 'ios' ? 180 : 200,
  },
  headerTitle: {
    fontSize: 26,
    color: "#F5F5F5",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "Outfit_500Medium",
    marginBottom: 10,
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
    color: "#555",
  },
  daysScrollWrapper: {
    height: 90,
    marginTop: 8,
  },
  daysScrollContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    borderColor: "#555",
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
    color: "#555",
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
    color: "#FFF",
    fontSize: 7.5,
    marginTop: 2,
    fontWeight: "bold",
    lineHeight: 10,
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