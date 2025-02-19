import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet } from "react-native";

const AmountInput = () => {
  const [amount, setAmount] = useState("");

  const handleAmountChange = (text: string) => {
    const formattedText = text.replace(/[^0-9.]/g, "");
    setAmount(formattedText);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Cantidad</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.currency}>S/</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          onChangeText={handleAmountChange}
          placeholder="00.00"
          placeholderTextColor="#999"
          textAlign="left"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 22,
    fontFamily: "Outfit_600SemiBold",
    color: "#000",
    marginBottom: 5,
  },
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
  currency: {
    fontFamily: "Outfit_500Medium",
    fontSize: 36,
    color: "#000",
    marginRight: 5, // Pegado a la izquierda del número
  },
  input: {
    fontFamily: "Outfit_500Medium",
    fontSize: 36,
    color: "#000",
    flex: 1,
    textAlign: "left", // Alineado a la izquierda para que crezca hacia la derecha
  },
});

export default AmountInput;