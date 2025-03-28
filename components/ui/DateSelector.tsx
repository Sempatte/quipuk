import { TRANSACTION_COLORS, TransactionType } from "@/app/interfaces/transaction.interface";
import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Calendar } from "react-native-calendars";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DateSelectorProps {
  type: TransactionType;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  title?: string; // Título personalizable
}

const DATE_OPTIONS = ["Hoy", "Ayer", "Otros..."] as const;

// Mapeo de tipos de transacción a opciones de UI
const TYPE_TO_OPTION_MAP = {
  "gasto": "Gastos",
  "ingreso": "Ingresos",
} as const;

/**
 * Componente para seleccionar fecha de la transacción
 * Utiliza Calendar de react-native-calendars para selección de fechas personalizadas
 */
const DateSelector: React.FC<DateSelectorProps> = ({
  type,
  selectedDate,
  onSelectDate,
  title = "Fecha" // Valor por defecto
}) => {
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>("Hoy");
  const [customDate, setCustomDate] = useState<string | null>(null);
  
  // Obtener el color basado en el tipo de transacción
  const themeColor = useMemo(() => {
    const option = TYPE_TO_OPTION_MAP[type];
    return TRANSACTION_COLORS[option];
  }, [type]);

  // Manejador para cuando se selecciona una opción
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
    }
    
    onSelectDate(date.toISOString());
  };

  // Manejador para selección de fecha en el calendario
  const handleCalendarDayPress = (day: { dateString: string }) => {
    const newDate = new Date(day.dateString);
    const formattedDate = format(newDate, "dd MMM yyyy", { locale: es });
    
    setCustomDate(formattedDate);
    setSelectedOption("custom");
    setIsCalendarVisible(false);
    onSelectDate(newDate.toISOString());
  };

  // Determinar si un botón está seleccionado
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
        {DATE_OPTIONS.map((option) => (
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

      {/* Modal del Calendario */}
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
  // Estilos para el modal del calendario
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