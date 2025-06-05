// app/(tabs)/movements.tsx - ACTUALIZADO CON EXPO STATUS BAR
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@apollo/client";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { format, startOfMonth, endOfMonth, isSameMonth, addDays, isLastDayOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { capitalize } from "lodash";

// 🔧 REEMPLAZADO: StatusBar de expo-status-bar
import { StatusBarManager, StatusBarPresets } from "@/components/ui/StatusBarManager";

import TransactionItem from "@/components/ui/TransactionItem";
import BalanceHeader from "@/components/ui/BalancerHeader";
import TransactionSkeleton from "@/components/ui/TransactionSkeleton";
import { GET_TRANSACTIONS_BY_USER } from "../graphql/transaction.graphql";
import { RootStackParamList } from "../interfaces/navigation";
import { Transaction } from "../interfaces/transaction.interface";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const { width } = Dimensions.get("window");
const DAY_WIDTH = width * 0.15;
const DAY_MARGIN = 8;

// ... (resto de las funciones helper permanecen igual) ...

function robustParseDateString(dueDateValue: any): Date | null {
  if (!dueDateValue) return null;
  if (dueDateValue instanceof Date && !isNaN(dueDateValue.getTime())) return dueDateValue;
  if (typeof dueDateValue === 'string') {
    const parts = dueDateValue.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (parts) {
      const year = parseInt(parts[1], 10);
      const month = parseInt(parts[2], 10) - 1;
      const day = parseInt(parts[3], 10);
      const hours = parseInt(parts[4], 10);
      const minutes = parseInt(parts[5], 10);
      const seconds = parseInt(parts[6], 10);
      const d = new Date(year, month, day, hours, minutes, seconds);
      return isNaN(d.getTime()) ? null : d;
    }
    const isoDateString = dueDateValue.includes(' ') ? dueDateValue.replace(' ', 'T') : dueDateValue;
    const dSafe = new Date(isoDateString);
    return isNaN(dSafe.getTime()) ? null : dSafe;
  }
  return null;
}

const useMonthDays = (referenceDay: Date) => useMemo(() => {
  const start = startOfMonth(referenceDay);
  const end = endOfMonth(referenceDay);
  const today = new Date();
  const days: Date[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(new Date(d));
  if (!isSameMonth(today, referenceDay)) return days;
  const todayDate = today.getDate();
  return days.filter(day => {
    const dayDate = day.getDate();
    if (isLastDayOfMonth(today)) return dayDate <= todayDate;
    if (todayDate === end.getDate() - 1) return dayDate <= end.getDate();
    return dayDate <= Math.min(todayDate + 2, end.getDate());
  });
}, [referenceDay]);

function useTransactionData(transactions: Transaction[], selectedDate: Date | null, referenceDay: Date) {
  const monthKey = format(selectedDate || referenceDay, "yyyy-MM");
  const completed = transactions.filter(
    t => t.status === "completed" && robustParseDateString(t.dueDate)
  );
  const monthlyTxs = completed.filter(t => {
    const d = robustParseDateString(t.dueDate);
    return d && format(d, "yyyy-MM") === monthKey;
  });
  const stats = monthlyTxs.reduce((acc, t) => {
    const amount = t.type === "gasto" ? -t.amount : t.amount;
    acc.balance += amount;
    if (t.type === "gasto") acc.expenses += t.amount;
    else acc.income += t.amount;
    return acc;
  }, { income: 0, expenses: 0, balance: 0 });
  const filtered = selectedDate
    ? completed.filter(t => {
        const d = robustParseDateString(t.dueDate);
        return d && selectedDate && d.toDateString() === selectedDate.toDateString();
      })
    : completed;
  const grouped = Object.entries(
    filtered.reduce((acc, t) => {
      const d = robustParseDateString(t.dueDate);
      if (!d) return acc;
      const key = format(d, "dd-MM-yyyy");
      (acc[key] = acc[key] || []).push(t);
      return acc;
    }, {} as Record<string, Transaction[]>)
  )
  .map(([date, txs]: [string, Transaction[]]) => [date, txs.sort((a, b) => {
    const da = robustParseDateString(b.dueDate);
    const db = robustParseDateString(a.dueDate);
    return (da?.getTime() || 0) - (db?.getTime() || 0);
  })])
  .filter((entry): entry is [string, Transaction[]] => Array.isArray(entry) && entry.length === 2 && typeof entry[0] === 'string' && Array.isArray(entry[1]))
  .sort(([a], [b]) => {
    const [dayA, monthA, yearA] = (a as string).split("-").map(Number);
    const [dayB, monthB, yearB] = (b as string).split("-").map(Number);
    return yearB - yearA || monthB - monthA || dayB - dayA;
  });
  const dayMap = new Map(completed.map(t => {
    const d = robustParseDateString(t.dueDate);
    return [d ? d.toDateString() : 'invalid_date_key', true];
  }));
  return { dayMap, stats, grouped };
}

export default function Movements() {
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS_BY_USER, { 
    fetchPolicy: 'cache-first',
    errorPolicy: 'all'
  });
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "LoginScreen">>();
  const [referenceDay, setReferenceDay] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const daysListRef = useRef<FlatList<Date>>(null);

  const transactions = useMemo(() => {
    const arr = data?.getTransactions || [];
    return arr.map((t: any) => ({
      ...t,
      dueDate: t.dueDate || t.duedate || t.due_date
    }));
  }, [data]);
  
  const days = useMonthDays(referenceDay);
  const { dayMap, stats, grouped } = useTransactionData(transactions, selectedDate, referenceDay);
  const monthYear = useMemo(() => capitalize(format(selectedDate || referenceDay, "MMMM yyyy", { locale: es })), [selectedDate, referenceDay]);

  const isFuture = useCallback((day: Date) => {
    const t = new Date(); t.setHours(0,0,0,0); return day > t;
  }, []);
  const hasTransactions = useCallback((day: Date) => dayMap.has(day.toDateString()), [dayMap]);

  const changeMonth = useCallback((delta: number) => {
    const newDate = new Date(referenceDay);
    newDate.setMonth(newDate.getMonth() + delta);
    const today = new Date();
    if (delta > 0 && (newDate > today && !(newDate.getMonth() === today.getMonth() && newDate.getFullYear() === today.getFullYear()))) return;
    setReferenceDay(newDate);
    setSelectedDate(null);
  }, [referenceDay]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing transactions:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  useEffect(() => {
    if (!daysListRef.current || !days.length) return;
    const today = new Date();
    const idx = days.findIndex(d => d.toDateString() === today.toDateString());
    if (idx !== -1) {
      setTimeout(() => {
        daysListRef.current?.scrollToIndex({ index: idx, animated: true });
      }, 300);
    }
  }, [days, referenceDay]);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (error) {
    return (
      <View style={styles.container}>
        {/* 🎯 NUEVA IMPLEMENTACIÓN: StatusBar usando expo-status-bar */}
        <StatusBarManager {...StatusBarPresets.tabs} />
        
        <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
          <View style={styles.header}>
            <Text style={styles.title}>Transacciones</Text>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Error al cargar las transacciones</Text>
              <Text style={styles.errorSubtext}>{error.message}</Text>
              <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (loading && !data) {
    return (
      <View style={styles.container}>
        {/* 🎯 NUEVA IMPLEMENTACIÓN: StatusBar usando expo-status-bar */}
        <StatusBarManager {...StatusBarPresets.tabs} />
        
        <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
          <View style={styles.header}>
            <Text style={styles.title}>Transacciones</Text>
            <View style={styles.monthContainer}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrow}>
                <Text style={styles.arrowText}>{"<"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setCalendarVisible(true)} style={styles.monthButton}>
                <Text style={styles.monthText}>{monthYear}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrow}>
                <Text style={styles.arrowText}>{">"}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.daysWrapper}>
              <View style={styles.daysSkeletonContainer}>
                {Array.from({ length: 7 }).map((_, index) => (
                  <View key={index} style={styles.daySkeletonItem}>
                    <View style={styles.daySkeletonBox} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
        
        <View style={styles.listContainer}>
          <View style={styles.balanceHeaderSkeleton}>
            <View style={styles.balanceSkeletonRow}>
              <View style={styles.balanceSkeletonBox} />
              <View style={styles.balanceSkeletonBox} />
              <View style={styles.balanceSkeletonBox} />
            </View>
          </View>
          
          <TransactionSkeleton count={8} />
        </View>
      </View>
    );
  }

  const today = new Date();
  const canNext = referenceDay.getMonth() < today.getMonth() || referenceDay.getFullYear() < today.getFullYear();

  return (
    <View style={styles.container}>
      {/* 🎯 NUEVA IMPLEMENTACIÓN: StatusBar usando expo-status-bar */}
      <StatusBarManager {...StatusBarPresets.tabs} />
      
      <SafeAreaView style={styles.headerSafeArea} edges={["top"]}>
        <View style={styles.header}>
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
          <View style={styles.daysWrapper}>
            <FlatList
              ref={daysListRef}
              data={days}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysContainer}
              keyExtractor={d => d.toISOString()}
              renderItem={({ item: day }) => {
                const dayStr = day.toDateString();
                const todayStr = new Date().toDateString();
                return (
                  <View style={[styles.dayContainer, { width: DAY_WIDTH, marginHorizontal: DAY_MARGIN }]}> 
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        selectedDate?.toDateString() === dayStr && styles.dayActive,
                        selectedDate?.toDateString() !== dayStr && hasTransactions(day) && !isFuture(day) && styles.dayWithTx,
                        selectedDate?.toDateString() !== dayStr && !hasTransactions(day) && !isFuture(day) && styles.dayEmpty,
                        isFuture(day) && styles.dayFuture,
                      ]}
                      onPress={() => {
                        if (!isFuture(day)) setSelectedDate(selectedDate?.toDateString() === dayStr ? null : day);
                      }}
                      activeOpacity={isFuture(day) ? 1 : 0.8}
                      disabled={isFuture(day)}
                    >
                      <Text style={[styles.dayNumber, isFuture(day) && styles.futureText]}>
                        {format(day, "dd", { locale: es })}
                      </Text>
                      <Text style={[styles.dayLabel, isFuture(day) && styles.futureText]}>
                        {format(day, "EEE", { locale: es })}
                      </Text>
                      {hasTransactions(day) && !isFuture(day) && <View style={[styles.dot, selectedDate?.toDateString() === dayStr && styles.dotActive]} />}
                    </TouchableOpacity>
                    {dayStr === todayStr && <Text style={styles.todayText}>Hoy</Text>}
                  </View>
                );
              }}
              getItemLayout={(_, index) => ({
                length: DAY_WIDTH + DAY_MARGIN * 2,
                offset: (DAY_WIDTH + DAY_MARGIN * 2) * index,
                index,
              })}
            />
          </View>
        </View>
      </SafeAreaView>
      
      <View style={styles.listContainer}>
        <FlatList
          data={grouped}
          keyExtractor={item => item[0]}
          renderItem={({ item }) => {
            const [dateStr, txs]: [string, Transaction[]] = item;
            const [day, month, year] = dateStr.split("-").map(Number);
            const date = new Date(year, month - 1, day);
            return (
              <View style={styles.group}>
                <Text style={styles.groupDate}>{format(date, "dd MMM yyyy", { locale: es })}</Text>
                {txs.map((tx: Transaction) => <TransactionItem key={tx.id} transaction={tx} />)}
              </View>
            );
          }}
          ListHeaderComponent={<BalanceHeader {...stats} monthYear={monthYear} />}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          windowSize={8}
          initialNumToRender={4}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
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
};


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F5F5F5" 
  },
  
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
  
  // 🎨 ESTILOS PARA ERROR MEJORADOS
  errorContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  
  errorText: {
    fontSize: 18,
    color: "#E74C3C",
    textAlign: "center",
    fontFamily: "Outfit_600SemiBold",
    marginBottom: 8,
  },
  
  errorSubtext: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    fontFamily: "Outfit_400Regular",
    marginBottom: 20,
    lineHeight: 20,
  },
  
  retryButton: {
    backgroundColor: "#00DC5A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
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
    backgroundColor: "#F5F5F5"
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
  
  // 🎨 ESTILOS PARA SKELETON LOADING
  daysSkeletonContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'space-around',
  },
  
  daySkeletonItem: {
    alignItems: 'center',
  },
  
  daySkeletonBox: {
    width: DAY_WIDTH,
    height: 70,
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    opacity: 0.7,
  },
  
  balanceHeaderSkeleton: {
    backgroundColor: '#FFF',
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  balanceSkeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  balanceSkeletonBox: {
    width: 80,
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    opacity: 0.7,
  },
});