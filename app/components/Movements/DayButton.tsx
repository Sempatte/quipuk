import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DayButtonProps {
  day: Date;
  today: Date;
  selectedDate: Date | null;
  isFuture: (day: Date) => boolean;
  hasTransactions: (day: Date) => boolean;
  onPress: (day: Date) => void;
  styles: any;
  DAY_WIDTH: number;
  DAY_MARGIN: number;
}

const DayButton: React.FC<DayButtonProps> = ({
  day,
  today,
  selectedDate,
  isFuture,
  hasTransactions,
  onPress,
  styles,
  DAY_WIDTH,
  DAY_MARGIN,
}) => {
  const dayStr = day.toDateString();
  const todayStr = today.toDateString();
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
          if (!isFuture(day)) onPress(day);
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
};

export default DayButton; 