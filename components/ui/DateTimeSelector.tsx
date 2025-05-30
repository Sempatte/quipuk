// components/ui/DateTimeSelector.tsx - Componente mejorado para fecha y hora
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import { es } from "date-fns/locale";

interface DateTimeSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  title: string;
  isPaid: boolean;
  type?: "gasto" | "ingreso" | "ahorro";
  initialDate?: string;
  disabled?: boolean;
}

export default function DateTimeSelector({
  selectedDate,
  onSelectDate,
  title,
  isPaid,
  type = "gasto",
  initialDate,
  disabled = false,
}: DateTimeSelectorProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(() => {
    const date = new Date(selectedDate || initialDate || new Date());
    // Si es una fecha futura para gastos completados, usar la fecha actual
    if (isPaid && date > new Date()) {
      return new Date();
    }
    return date;
  });

  // Convertir string ISO a objeto Date
  const currentDate = useMemo(() => {
    try {
      return new Date(selectedDate);
    } catch (error) {
      return new Date();
    }
  }, [selectedDate]);

  // Formatear fecha para mostrar
  const formatDisplayDate = useCallback((date: Date) => {
    if (isToday(date)) {
      return "Hoy";
    } else if (isYesterday(date)) {
      return "Ayer";
    } else if (isTomorrow(date)) {
      return "Mañana";
    } else {
      return format(date, "dd MMM yyyy", { locale: es });
    }
  }, []);

  // Formatear hora para mostrar
  const formatDisplayTime = useCallback((date: Date) => {
    return format(date, "HH:mm", { locale: es });
  }, []);

  // Validar fecha según el contexto
  const validateDate = useCallback((date: Date) => {
    const now = new Date();
    
    if (isPaid) {
      // Para transacciones completadas, no permitir fechas futuras
      if (date > now) {
        Alert.alert(
          "Fecha inválida",
          "No puedes seleccionar una fecha futura para una transacción completada.",
          [{ text: "Entendido" }]
        );
        return false;
      }
      
      // No permitir fechas muy antiguas (más de 2 años)
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      if (date < twoYearsAgo) {
        Alert.alert(
          "Fecha muy antigua",
          "No puedes seleccionar una fecha anterior a 2 años.",
          [{ text: "Entendido" }]
        );
        return false;
      }
    } else {
      // Para transacciones pendientes, no permitir fechas muy pasadas
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (date < oneWeekAgo) {
        Alert.alert(
          "Fecha muy antigua",
          "Para transacciones pendientes, la fecha de vencimiento no puede ser anterior a una semana.",
          [{ text: "Entendido" }]
        );
        return false;
      }
    }
    
    return true;
  }, [isPaid]);

  // Manejar cambio de fecha
  const handleDateChange = useCallback((event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate && validateDate(selectedDate)) {
      // Mantener la hora actual y solo cambiar la fecha
      const newDate = new Date(tempDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      
      setTempDate(newDate);
      
      if (Platform.OS === 'android') {
        onSelectDate(newDate.toISOString());
      }
    }
  }, [tempDate, validateDate, onSelectDate]);

  // Manejar cambio de hora
  const handleTimeChange = useCallback((event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (selectedTime) {
      // Mantener la fecha actual y solo cambiar la hora
      const newDate = new Date(tempDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      
      setTempDate(newDate);
      
      if (Platform.OS === 'android') {
        onSelectDate(newDate.toISOString());
      }
    }
  }, [tempDate, onSelectDate]);

  // Confirmar cambios en iOS
  const handleConfirm = useCallback(() => {
    onSelectDate(tempDate.toISOString());
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [tempDate, onSelectDate]);

  // Cancelar cambios en iOS
  const handleCancel = useCallback(() => {
    setTempDate(currentDate);
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [currentDate]);

  // Abrir selector de fecha
  const openDatePicker = useCallback(() => {
    if (disabled) return;
    setTempDate(currentDate);
    setShowDatePicker(true);
  }, [disabled, currentDate]);

  // Abrir selector de hora
  const openTimePicker = useCallback(() => {
    if (disabled) return;
    setTempDate(currentDate);
    setShowTimePicker(true);
  }, [disabled, currentDate]);

  // Obtener fecha máxima permitida
  const getMaximumDate = useCallback(() => {
    if (isPaid) {
      return new Date(); // No permitir fechas futuras para transacciones completadas
    }
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1); // Máximo 1 año en el futuro
    return maxDate;
  }, [isPaid]);

  // Obtener fecha mínima permitida
  const getMinimumDate = useCallback(() => {
    const minDate = new Date();
    if (isPaid) {
      minDate.setFullYear(minDate.getFullYear() - 2); // Máximo 2 años en el pasado
    } else {
      minDate.setDate(minDate.getDate() - 7); // Máximo 1 semana en el pasado para pendientes
    }
    return minDate;
  }, [isPaid]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <View style={styles.selectorContainer}>
        {/* Selector de Fecha */}
        <TouchableOpacity
          style={[
            styles.selectorButton,
            styles.dateButton,
            disabled && styles.disabledButton
          ]}
          onPress={openDatePicker}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="calendar-outline" size={20} color="#00DC5A" />
            <View style={styles.textContainer}>
              <Text style={styles.label}>Fecha</Text>
              <Text style={[styles.value, disabled && styles.disabledText]}>
                {formatDisplayDate(currentDate)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Selector de Hora */}
        <TouchableOpacity
          style={[
            styles.selectorButton,
            styles.timeButton,
            disabled && styles.disabledButton
          ]}
          onPress={openTimePicker}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <View style={styles.buttonContent}>
            <Ionicons name="time-outline" size={20} color="#00DC5A" />
            <View style={styles.textContainer}>
              <Text style={styles.label}>Hora</Text>
              <Text style={[styles.value, disabled && styles.disabledText]}>
                {formatDisplayTime(currentDate)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal para iOS */}
      {Platform.OS === 'ios' && (showDatePicker || showTimePicker) && (
        <Modal
          transparent
          animationType="slide"
          visible={showDatePicker || showTimePicker}
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCancel}>
                  <Text style={styles.cancelButton}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  {showDatePicker ? 'Seleccionar Fecha' : 'Seleccionar Hora'}
                </Text>
                <TouchableOpacity onPress={handleConfirm}>
                  <Text style={styles.confirmButton}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={tempDate}
                mode={showDatePicker ? 'date' : 'time'}
                display="spinner"
                onChange={showDatePicker ? handleDateChange : handleTimeChange}
                maximumDate={getMaximumDate()}
                minimumDate={getMinimumDate()}
                locale="es-ES"
                textColor="#000"
              />
            </View>
          </View>
        </Modal>
      )}

      {/* DateTimePicker para Android */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={getMaximumDate()}
          minimumDate={getMinimumDate()}
        />
      )}

      {Platform.OS === 'android' && showTimePicker && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          is24Hour={true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    fontFamily: "Outfit_600SemiBold",
  },
  selectorContainer: {
    flexDirection: "row",
    gap: 12,
  },
  selectorButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateButton: {
    marginRight: 6,
  },
  timeButton: {
    marginLeft: 6,
  },
  disabledButton: {
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
    fontFamily: "Outfit_400Regular",
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    fontFamily: "Outfit_600SemiBold",
  },
  disabledText: {
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    fontFamily: "Outfit_600SemiBold",
  },
  cancelButton: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },
  confirmButton: {
    fontSize: 16,
    color: "#00DC5A",
    fontWeight: "600",
    fontFamily: "Outfit_600SemiBold",
  },
});