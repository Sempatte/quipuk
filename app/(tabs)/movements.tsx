// app/(tabs)/movements.tsx - ACTUALIZADO CON EXPO STATUS BAR
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@apollo/client";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import { format, startOfMonth, endOfMonth, isSameMonth, addDays, isLastDayOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { capitalize } from "lodash";

// 🔧 REEMPLAZADO: StatusBar de expo-status-bar
import { StatusBarManager, StatusBarPresets } from "@/app/components/ui/StatusBarManager";

import TransactionItem from "@/app/components/ui/TransactionItem";
import BalanceHeader from "@/app/components/ui/BalancerHeader";
import TransactionSkeleton from "@/app/components/ui/TransactionSkeleton";
import { GET_TRANSACTIONS_BY_USER } from "../graphql/transaction.graphql";
import { RootStackParamList } from "../interfaces/navigation.type";
import { Transaction } from "../interfaces/transaction.interface";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useMonthDays from "../hooks/useMonthDays";
import useTransactionData from "../hooks/useTransactionData";
import robustParseDateString from "../utils/robustParseDateString";
import DayButton from "../components/Movements/DayButton";
import styles from "../styles/movementsScreen.styles";

const { width } = Dimensions.get("window");
const DAY_WIDTH = width * 0.15;
const DAY_MARGIN = 8;

// ... (resto de las funciones helper permanecen igual) ...

type MovementsRouteProp = RouteProp<RootStackParamList, "movements">;

export default function Movements() {
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS_BY_USER, { 
    fetchPolicy: 'cache-first',
    errorPolicy: 'all'
  });
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "movements">>();
  const route = useRoute<MovementsRouteProp>();
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

  useEffect(() => {
    if (route.params?.shouldRefresh) {
      refetch();
      navigation.setParams({ shouldRefresh: false });
    }
  }, [route.params?.shouldRefresh, refetch]);

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
              renderItem={({ item: day }) => (
                <DayButton
                  day={day}
                  today={today}
                  selectedDate={selectedDate}
                  isFuture={isFuture}
                  hasTransactions={hasTransactions}
                  onPress={(d) => setSelectedDate(selectedDate?.toDateString() === d.toDateString() ? null : d)}
                  styles={styles}
                  DAY_WIDTH={DAY_WIDTH}
                  DAY_MARGIN={DAY_MARGIN}
                />
              )}
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