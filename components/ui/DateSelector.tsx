import { TRANSACTION_COLORS, TransactionType } from "@/app/interfaces/transaction.interface";
import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import { format, addYears, isToday, isYesterday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

interface DateSelectorProps {
  type: TransactionType;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  title?: string;
  isPaid?: boolean;
  initialDate?: string; // 🆕 Nueva prop para fecha inicial del OCR
}

const PAID_DATE_OPTIONS = ["Hoy", "Ayer", "Otros..."] as const;
const PENDING_DATE_OPTIONS = ["Hoy", "Mañana", "Otros..."] as const;

const TYPE_TO_OPTION_MAP = {
  "gasto": "Gastos",
  "ingreso": "Ingresos",
  "ahorro": "Ahorros"
} as const;

const DateSelector: React.FC<DateSelectorProps> = ({
  type,
  selectedDate,
  onSelectDate,
  title = "Fecha",
  isPaid = true,
  initialDate // 🆕 Recibir fecha inicial del OCR
}) => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("Hoy");
  const [customDate, setCustomDate] = useState<string | null>(null);
  
  const dateOptions = isPaid ? PAID_DATE_OPTIONS : PENDING_DATE_OPTIONS;
  
  // 🔧 CORRECCIÓN: Aplicar fecha inicial del OCR
  useEffect(() => {
    if (initialDate) {
      
      const ocrDate = new Date(initialDate);
      const today = new Date();
      
      // Determinar qué opción corresponde a la fecha del OCR
      if (isToday(ocrDate)) {
        setSelectedOption("Hoy");
        setCustomDate(null);
      } else if (isYesterday(ocrDate) && isPaid) {
        setSelectedOption("Ayer");
        setCustomDate(null);
      } else if (isTomorrow(ocrDate) && !isPaid) {
        setSelectedOption("Mañana");
        setCustomDate(null);
      } else {
        // Fecha personalizada
        const formattedDate = format(ocrDate, "dd MMM yyyy", { locale: es });
        setCustomDate(formattedDate);
        setSelectedOption("custom");
      }
      
      // Aplicar la fecha
      onSelectDate(initialDate);
    }
  }, [initialDate, isPaid, onSelectDate]);

  // Calcular las fechas máximas y mínimas
  const maxDate = useMemo(() => {
    if (isPaid) {
      return format(new Date(), "yyyy-MM-dd");
    } else {
      return format(addYears(new Date(), 1), "yyyy-MM-dd");
    }
  }, [isPaid]);

  // Obtener el color basado en el tipo de transacción
  const themeColor = useMemo(() => {
    const option = TYPE_TO_OPTION_MAP[type];
    return TRANSACTION_COLORS[option];
  }, [type]);

  // 🔧 CORRECCIÓN: Sincronizar cuando cambia selectedDate externamente
  useEffect(() => {
    if (selectedDate && !initialDate) {
      const date = new Date(selectedDate);
      const today = new Date();
      
      if (isToday(date)) {
        setSelectedOption("Hoy");
        setCustomDate(null);
      } else if (isYesterday(date) && isPaid) {
        setSelectedOption("Ayer");
        setCustomDate(null);
      } else if (isTomorrow(date) && !isPaid) {
        setSelectedOption("Mañana");
        setCustomDate(null);
      } else {
        const formattedDate = format(date, "dd MMM yyyy", { locale: es });
        setCustomDate(formattedDate);
        setSelectedOption("custom");
      }
    }
  }, [selectedDate, isPaid, initialDate]);

  // Actualizar la fecha seleccionada si cambia el estado de pago
  useEffect(() => {
    const today = new Date();
    const selectedDateObj = new Date(selectedDate);
    
    if (isPaid) {
      if (selectedDateObj > today) {
        onSelectDate(today.toISOString());
        setSelectedOption("Hoy");
        setCustomDate(null);
      } else if (isYesterday(selectedDateObj)) {
        setSelectedOption("Ayer");
        setCustomDate(null);
      }
    } else {
      if (isTomorrow(selectedDateObj)) {
        setSelectedOption("Mañana");
        setCustomDate(null);
      }
    }
  }, [isPaid, selectedDate, onSelectDate]);

  const handleSelectOption = (option: string) => {
    if (option === "Otros...") {
      setIsCalendarVisible(true);
      return;
    }
    
    setSelectedOption(option);
    setCustomDate(null);
    
    const date = new Date();
    if (option === "Ayer") {
      date.setDate(date.getDate() - 1);
    } else if (option === "Mañana") {
      date.setDate(date.getDate() + 1);
    }
    
    onSelectDate(date.toISOString());
  };

  const handleCalendarDayPress = (day: { dateString: string }) => {
    const newDate = new Date(day.dateString);
    const formattedDate = format(newDate, "dd MMM yyyy", { locale: es });
    
    setCustomDate(formattedDate);
    setSelectedOption("custom");
    setIsCalendarVisible(false);
    onSelectDate(newDate.toISOString());
  };

  const isOptionSelected = (option: string) => {
    if (customDate && option === "Otros...") {
      return true;
    }
    return selectedOption === option && !customDate;
  };

  return (
    <View>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.buttonContainer}>
        {dateOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.button,
              isOptionSelected(option) && { backgroundColor: themeColor }
            ]}
            onPress={() => handleSelectOption(option)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.buttonText,
                isOptionSelected(option) && styles.selectedText
              ]}
            >
              {option === "Otros..." && customDate ? customDate : option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal
        transparent={true}
        visible={isCalendarVisible}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <Calendar
              style={styles.calendar}
              maxDate={maxDate}
              onDayPress={handleCalendarDayPress}
              markedDates={{
                [format(new Date(selectedDate), "yyyy-MM-dd")]: {
                  selected: true,
                  selectedColor: themeColor,
                },
              }}
              theme={{
                todayTextColor: themeColor,
                selectedDayBackgroundColor: themeColor,
                arrowColor: themeColor,
              }}
            />

            <TouchableOpacity
              onPress={() => setIsCalendarVisible(false)}
              style={[styles.closeButton, { backgroundColor: themeColor }]}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 22,
    fontFamily: "Outfit_600SemiBold",
    color: "#000",
    marginBottom: 5,
  },
  buttonContainer: { 
    flexDirection: "row", 
    alignItems: "center",
    flexWrap: "wrap",
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 5,
    backgroundColor: "#E0E0E0"
  },
  buttonText: { 
    fontSize: 14, 
    fontFamily: "Outfit_400Regular",
    color: "#555"
  },
  selectedText: { 
    color: "#FFFFFF" 
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
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default DateSelector;