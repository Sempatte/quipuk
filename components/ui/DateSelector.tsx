import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const dateOptions = ["Hoy", "Ayer", "Otros..."];

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  return (
    <View>
      <Text style={styles.label}>Fecha</Text>
      <View style={styles.buttonContainer}>
        {dateOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.button, selectedDate === option ? styles.selectedButton : styles.unselectedButton]}
            onPress={() => onSelectDate(option)}
          >
            <Text style={[styles.buttonText, selectedDate === option ? styles.selectedText : styles.unselectedText]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: { fontSize: 22, fontFamily: "Outfit_600SemiBold", color: "#000", marginBottom: 5 },
  buttonContainer: { flexDirection: "row", alignItems: "center" },
  button: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  selectedButton: { backgroundColor: "#E86F51" },
  unselectedButton: { backgroundColor: "#E0E0E0" },
  buttonText: { fontSize: 14, fontFamily: "Outfit_400Regular" },
  selectedText: { color: "#FFFFFF" },
  unselectedText: { color: "#555" },
});

export default DateSelector;
