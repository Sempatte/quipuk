import React from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

const AmountInput: React.FC<AmountInputProps> = ({ value, onChangeText }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cantidad</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.currency}>S/</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={value}
          onChangeText={onChangeText}
          placeholder="00.00"
          placeholderTextColor="#999"
          textAlign="left"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: "100%" },
  label: { fontSize: 22, fontFamily: "Outfit_600SemiBold", color: "#000", marginBottom: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  currency: { fontFamily: "Outfit_500Medium", fontSize: 36, color: "#000", marginRight: 5 },
  input: { fontFamily: "Outfit_500Medium", fontSize: 36, color: "#000", flex: 1, textAlign: "left" },
});

export default AmountInput;
