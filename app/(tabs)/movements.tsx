import React, { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@apollo/client";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { format, startOfMonth, endOfMonth, isSameMonth, addDays, isLastDayOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { capitalize } from "lodash";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, withSequence, interpolate, Extrapolate, runOnUI } from 'react-native-reanimated';

import TransactionItem from "@/components/ui/TransactionItem";
import BalanceHeader from "@/components/ui/BalancerHeader";
import { GET_TRANSACTIONS_BY_USER } from "../graphql/transaction.graphql";
import { RootStackParamList } from "../interfaces/navigation";
import { Transaction } from "../interfaces/transaction.interface";
import Loader from "@/components/ui/Loader";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width } = Dimensions.get("window");
const DAY_WIDTH = width * 0.15;
const DAY_MARGIN = 8;

// 🔥 CUSTOM HOOKS - Separar lógica compleja
const useScrollPosition = () => {
  const [position, setPosition] = useState<number | null>(null);
  const isRestoring = useRef(false);
  
  return {
    position,
    setPosition,
    isRestoring: isRestoring.current,
    setRestoring: (value: boolean) => { isRestoring.current = value; }
  };
};

const useMonthDays = (referenceDay: Date) => useMemo(() => {
  const start = startOfMonth(referenceDay);
  const end = endOfMonth(referenceDay);
  const today = new Date();
  const days: Date[] = [];
  
  for (let d = start; d <= end; d = addDays(d, 1)) {
    days.push(new Date(d));
  }

  if (!isSameMonth(today, referenceDay)) return days;
  
  const todayDate = today.getDate();
  return days.filter(day => {
    const dayDate = day.getDate();
    if (isLastDayOfMonth(today)) return dayDate <= todayDate;
    if (todayDate === end.getDate() - 1) return dayDate <= end.getDate();
    return dayDate <= Math.min(todayDate + 2, end.getDate());
  });
}, [referenceDay]);

const useTransactionData = (transactions: Transaction[], selectedDate: Date | null, referenceDay: Date) => useMemo(() => {
  // Mapa de días con transacciones para O(1) lookup
  const dayMap = new Map(transactions.map(t => [new Date(t.createdAt).toDateString(), true]));
  
  // Stats mensuales
  const monthKey = format(selectedDate || referenceDay, "yyyy-MM");
  const monthlyTxs = transactions.filter(t => format(new Date(t.createdAt), "yyyy-MM") === monthKey);
  const stats = monthlyTxs.reduce((acc, t) => {
    const amount = t.type === "gasto" ? -t.amount : t.amount;
    acc.balance += amount;
    if (t.type === "gasto") acc.expenses += t.amount;
    else acc.income += t.amount;
    return acc;
  }, { income: 0, expenses: 0, balance: 0 });

  // Transacciones agrupadas y filtradas
  const completed = transactions.filter(t => t.status === "completed");
  const filtered = selectedDate 
    ? completed.filter(t => new Date(t.createdAt).toDateString() === selectedDate.toDateString())
    : completed;

  const grouped = Object.entries(
    filtered.reduce((acc, t) => {
      const key = format(new Date(t.createdAt), "dd-MM-yyyy");
      (acc[key] = acc[key] || []).push(t);
      return acc;
    }, {} as Record<string, Transaction[]>)
  ).sort(([a], [b]) => {
    const [dayA, monthA, yearA] = a.split("-").map(Number);
    const [dayB, monthB, yearB] = b.split("-").map(Number);
    return yearB - yearA || monthB - monthA || dayB - dayA;
  });

  return { dayMap, stats, grouped };
}, [transactions, selectedDate, referenceDay]);

// 🔥 COMPONENTE OPTIMIZADO - Un solo componente sin sub-componentes
const DayButton = React.memo(({ day, isActive, hasTransactions, isToday, isFuture, onPress, pulseValue }: {
  day: Date; isActive: boolean; hasTransactions: boolean; isToday: boolean; isFuture: boolean;
  onPress: () => void; pulseValue: Animated.SharedValue<number>;
}) => {
  const todayStyle = useAnimatedStyle(() => isToday ? { transform: [{ scale: pulseValue.value }] } : {}, [isToday]);
  
  return (
    <View style={[styles.dayContainer, { width: DAY_WIDTH, marginHorizontal: DAY_MARGIN }]}>
      <TouchableOpacity
        style={[
          styles.dayButton,
          isActive && styles.dayActive,
          !isActive && hasTransactions && !isFuture && styles.dayWithTx,
          !isActive && !hasTransactions && !isFuture && styles.dayEmpty,
          isFuture && styles.dayFuture,
        ]}
        onPress={onPress}
        activeOpacity={isFuture ? 1 : 0.8}
        disabled={isFuture}
      >
        <Text style={[styles.dayNumber, isFuture && styles.futureText]}>
          {format(day, "dd", { locale: es })}
        </Text>
        <Text style={[styles.dayLabel, isFuture && styles.futureText]}>
          {format(day, "EEE", { locale: es })}
        </Text>
        {hasTransactions && !isFuture && <View style={[styles.dot, isActive && styles.dotActive]} />}
      </TouchableOpacity>
      {isToday && <Animated.Text style={[styles.todayText, todayStyle]}>Hoy</Animated.Text>}
    </View>
  );
});

export default function Movements() {
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS_BY_USER, { 
    fetchPolicy: 'cache-first', notifyOnNetworkStatusChange: false 
  });
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "LoginScreen">>();
  
  const [referenceDay, setReferenceDay] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [didScroll, setDidScroll] = useState(false);
  
  const scrollRef = useRef<Animated.ScrollView>(null);
  const { position, setPosition, isRestoring, setRestoring } = useScrollPosition();
  
  // Valores animados
  const headerOpacity = useSharedValue(0);
  const dayScale = useSharedValue(0);
  const todayPulse = useSharedValue(1);

  const transactions = useMemo(() => data?.getTransactions || [], [data]);
  const days = useMonthDays(referenceDay);
  const { dayMap, stats, grouped } = useTransactionData(transactions, selectedDate, referenceDay);
  const monthYear = useMemo(() => capitalize(format(selectedDate || referenceDay, "MMMM yyyy", { locale: es })), [selectedDate, referenceDay]);

  // 🔥 HANDLERS ULTRA-COMPACTOS
  const isFuture = useCallback((day: Date) => { const t = new Date(); t.setHours(0,0,0,0); return day > t; }, []);
  const hasTransactions = useCallback((day: Date) => dayMap.has(day.toDateString()), [dayMap]);
  
  const toggleDate = useCallback((day: Date) => {
    if (isFuture(day)) return;
    if (selectedDate?.toDateString() === day.toDateString()) {
      setSelectedDate(null);
    } else {
      setSelectedDate(day);
      if (!isSameMonth(day, referenceDay)) setReferenceDay(day);
    }
  }, [selectedDate, referenceDay, isFuture]);

  const scrollToToday = useCallback(() => {
    if (!scrollRef.current || !days.length || isRestoring) return;
    
    const today = new Date();
    const idx = days.findIndex(d => d.toDateString() === today.toDateString());
    const pos = idx === -1 
      ? Math.max(0, days.length * (DAY_WIDTH + DAY_MARGIN * 2) - width)
      : Math.max(0, idx * (DAY_WIDTH + DAY_MARGIN * 2) - (width - DAY_WIDTH) / 2);
    
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: pos, animated: true });
      setPosition(pos);
      if (idx !== -1) runOnUI(() => {
        'worklet';
        todayPulse.value = withSequence(withSpring(1.3), withSpring(1));
      })();
    }, 300);
  }, [days, isRestoring, setPosition, todayPulse]);

  const restorePosition = useCallback(() => {
    if (!scrollRef.current || position === null || isRestoring) return;
    setRestoring(true);
    setTimeout(() => {
      scrollRef.current?.scrollTo({ x: position, animated: true });
      setTimeout(() => setRestoring(false), 1000);
    }, 300);
  }, [position, isRestoring, setRestoring]);

  const changeMonth = useCallback((delta: number) => {
    const newDate = new Date(referenceDay);
    newDate.setMonth(newDate.getMonth() + delta);
    const today = new Date();
    
    if (delta > 0 && (newDate > today && !(newDate.getMonth() === today.getMonth() && newDate.getFullYear() === today.getFullYear()))) return;
    
    setReferenceDay(newDate);
    setSelectedDate(null);
    setDidScroll(false);
    setPosition(null);
    setRestoring(false);
  }, [referenceDay, setPosition, setRestoring]);

  // 🔥 RENDERIZADO OPTIMIZADO
  const renderItem = useCallback(({ item }: { item: [string, Transaction[]] }) => {
    const [dateStr, txs] = item;
    const [day, month, year] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    
    return (
      <View style={styles.group}>
        <Text style={styles.groupDate}>{format(date, "dd MMM yyyy", { locale: es })}</Text>
        {txs.length ? txs.map(tx => <TransactionItem key={tx.id} transaction={tx} />) : 
         <Text style={styles.empty}>No hay transacciones para este día.</Text>}
      </View>
    );
  }, []);

  const animatedHeader = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0], Extrapolate.CLAMP) }]
  }), []);

  const animatedDays = useAnimatedStyle(() => ({ transform: [{ scale: dayScale.value }] }), []);

  // Effects
  useEffect(() => { setDidScroll(false); }, [referenceDay]);
  
  useEffect(() => {
    if (!days.length || didScroll) return;
    const timer = setTimeout(() => {
      position === null ? scrollToToday() : restorePosition();
      setDidScroll(true);
    }, 600);
    return () => clearTimeout(timer);
  }, [days, didScroll, position, scrollToToday, restorePosition]);

  useEffect(() => {
    runOnUI(() => {
      'worklet';
      headerOpacity.value = withTiming(1, { duration: 600 });
      dayScale.value = withTiming(1, { duration: 800 });
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    if (!position || isRestoring) return;
    const timer = setTimeout(restorePosition, 200);
    return () => clearTimeout(timer);
  }, [position, isRestoring, restorePosition]));

  useFocusEffect(useCallback(() => {
    if (error?.message === "Token expired or invalid") {
      AsyncStorage.removeItem("token");
      navigation.navigate("LoginScreen");
    }
    refetch();
  }, [error, navigation, refetch]));

  if (loading) return <Loader visible fullScreen text="Cargando movimientos..." />;
  if (error) return (
    <View style={styles.errorContainer}>
      {/* 🔧 StatusBar siempre negro */}
      <StatusBar style="light" backgroundColor="#000000" />
      <Text style={styles.errorText}>Error: {error.message}</Text>
    </View>
  );

  const today = new Date();
  const canNext = referenceDay.getMonth() < today.getMonth() || referenceDay.getFullYear() < today.getFullYear();

  return (
    <View style={styles.container}>
      {/* 🔧 SOLUCIÓN: StatusBar siempre negro */}
      <StatusBar style="light" backgroundColor="#000000" />
      
      {/* 🔧 SOLUCIÓN: Header negro con SafeAreaView */}
      <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
        <Animated.View style={[styles.header, animatedHeader]}>
          <Text style={styles.title}>Transacciones</Text>
          
          <View style={styles.monthContainer}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrow}>
              <Text style={styles.arrowText}>{"<"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setCalendarVisible(true)} style={styles.monthButton}>
              <Text style={styles.monthText}>{monthYear}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => changeMonth(1)} disabled={!canNext} style={styles.arrow}>
              <Text style={[styles.arrowText, !canNext && styles.disabled]}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.daysWrapper, animatedDays]}>
            <Animated.ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysContainer}
              snapToInterval={DAY_WIDTH + DAY_MARGIN * 2}
              onScroll={e => !isRestoring && setPosition(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={100}
            >
              {days.map(day => {
                const dayStr = day.toDateString();
                const todayStr = new Date().toDateString();
                return (
                  <DayButton
                    key={`${day.getTime()}`}
                    day={day}
                    isActive={selectedDate?.toDateString() === dayStr}
                    hasTransactions={hasTransactions(day)}
                    isToday={dayStr === todayStr}
                    isFuture={isFuture(day)}
                    onPress={() => toggleDate(day)}
                    pulseValue={todayPulse}
                  />
                );
              })}
            </Animated.ScrollView>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
      
      {/* 🔧 SOLUCIÓN: Lista con fondo blanco */}
      <View style={styles.listContainer}>
        <FlatList
          data={grouped}
          keyExtractor={item => item[0]}
          renderItem={renderItem}
          ListHeaderComponent={<BalanceHeader {...stats} monthYear={monthYear} />}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={8}
          initialNumToRender={4}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
        />
      </View>
      
      <Modal visible={calendarVisible} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.calendarBox}>
            <Calendar
              maxDate={format(new Date(), "yyyy-MM-dd")}
              onDayPress={day => {
                const date = new Date(day.dateString);
                setReferenceDay(date);
                setSelectedDate(date);
                setCalendarVisible(false);
                setDidScroll(false);
              }}
              markedDates={{
                [format(selectedDate ?? new Date(), "yyyy-MM-dd")]: {
                  selected: true, selectedColor: "#00DC5A"
                }
              }}
              theme={{
                todayTextColor: "#00DC5A",
                selectedDayBackgroundColor: "#00DC5A",
                arrowColor: "#00DC5A"
              }}
            />
            <TouchableOpacity onPress={() => setCalendarVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🔧 SOLUCIÓN: Estructura de contenedores corregida
  container: { 
    flex: 1, 
    backgroundColor: "#F5F5F5" 
  },
  
  // 🔧 SOLUCIÓN: SafeArea para el header negro
  headerSafeArea: {
    backgroundColor: "#000000"
  },
  
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    backgroundColor: "#000000",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    minHeight: Platform.OS === 'ios' ? 160 : 180,
  },
  
  // 🔧 SOLUCIÓN: Contenedor para la lista con fondo blanco
  listContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5"
  },
  
  flatList: {
    flex: 1,
    backgroundColor: "#F5F5F5"
  },
  
  flatListContent: {
    backgroundColor: "#F5F5F5",
    paddingBottom: 20
  },
  
  // 🔧 SOLUCIÓN: Container de error con fondo claro
  errorContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    padding: 20
  },
  
  errorText: {
    fontSize: 16,
    color: "#E74C3C",
    textAlign: "center",
    fontFamily: "Outfit_500Medium"
  },

  title: { 
    fontSize: 26, 
    color: "#F5F5F5", 
    fontWeight: "bold", 
    textAlign: "center", 
    fontFamily: "Outfit_500Medium", 
    marginBottom: 10 
  },
  
  monthContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginVertical: 10, 
    width: "90%", 
    alignSelf: "center" 
  },
  
  monthButton: { 
    flex: 1, 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: "#FFF", 
    alignItems: "center" 
  },
  
  arrow: { 
    padding: 10, 
    width: 44, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  
  monthText: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#00DC5A" 
  },
  
  arrowText: { 
    color: "#FFF", 
    fontSize: 24 
  },
  
  disabled: { 
    color: "#555" 
  },
  
  daysWrapper: { 
    height: 90, 
    marginTop: 8 
  },
  
  daysContainer: { 
    paddingVertical: 8, 
    paddingHorizontal: 10, 
    minWidth: width 
  },
  
  dayContainer: { 
    alignItems: "center" 
  },
  
  dayButton: { 
    alignItems: "center", 
    padding: 8, 
    borderRadius: 10, 
    width: DAY_WIDTH, 
    height: 70 
  },
  
  dayActive: { 
    backgroundColor: "#00DC5A", 
    borderColor: "#00DC5A", 
    borderWidth: 1 
  },
  
  dayWithTx: { 
    borderColor: "#00DC5A", 
    borderWidth: 1 
  },
  
  dayEmpty: { 
    borderColor: "#FFF", 
    borderWidth: 1 
  },
  
  dayFuture: { 
    borderColor: "#555", 
    borderWidth: 1 
  },
  
  dayNumber: { 
    color: "#FFF", 
    fontSize: 18, 
    fontFamily: "Outfit_500Medium" 
  },
  
  dayLabel: { 
    color: "#FFF", 
    fontSize: 14, 
    fontFamily: "Outfit_500Medium" 
  },
  
  futureText: { 
    color: "#555" 
  },
  
  dot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: "#00DC5A", 
    marginTop: 9 
  },
  
  dotActive: { 
    backgroundColor: "#FFF" 
  },
  
  todayText: { 
    color: "#FFF", 
    fontSize: 7.5, 
    marginTop: 2, 
    fontWeight: "bold", 
    lineHeight: 10 
  },
  
  group: { 
    marginBottom: 20, 
    paddingHorizontal: 15,
    backgroundColor: "#F5F5F5" // 🔧 Asegurar fondo claro
  },
  
  groupDate: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#000", 
    marginBottom: 8,
    fontFamily: "Outfit_600SemiBold"
  },
  
  empty: { 
    fontSize: 14, 
    color: "#666", 
    fontStyle: "italic", 
    textAlign: "center", 
    paddingVertical: 10 
  },
  
  modal: { 
    flex: 1, 
    justifyContent: "center", 
    backgroundColor: "rgba(0,0,0,0.6)", 
    alignItems: "center" 
  },
  
  calendarBox: { 
    width: "90%", 
    backgroundColor: "#fff", 
    padding: 16, 
    borderRadius: 16, 
    elevation: 5 
  },
  
  closeBtn: { 
    marginTop: 12, 
    alignSelf: "center", 
    paddingVertical: 8, 
    paddingHorizontal: 20, 
    backgroundColor: "#00DC5A", 
    borderRadius: 8 
  },
  
  closeBtnText: { 
    color: "#fff", 
    fontWeight: "bold" 
  },
});