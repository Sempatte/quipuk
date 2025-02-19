import React, { useState } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import HearthIcon from "@/assets/images/icons/hearth.svg"; // Importar el icono SVG

const TransactionOptions = () => {
  const [isFrequent, setIsFrequent] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  return (
    <View style={styles.container}>
      {/* Botón Frecuente */}
      <TouchableOpacity
        style={[styles.optionContainer, isFrequent && styles.optionActive]}
        onPress={() => setIsFrequent(!isFrequent)}
      >
        <HearthIcon width={24} height={24} fill={isFrequent ? "#EF674A" : "#BDBDBD"} />
        <Text style={[styles.optionText, isFrequent && styles.optionTextActive]}>
          Frecuente
        </Text>
      </TouchableOpacity>

      {/* Botón Pagado con Switch */}
      <View style={styles.switchContainer}>
        <Switch
          value={isPaid}
          onValueChange={setIsPaid}
          trackColor={{ false: "#BDBDBD", true: "#BDBDBD" }}
          thumbColor={isPaid ? "#EF674A" : "#FFF"}
        />
        <Text style={[styles.optionText, isPaid && styles.optionTextActive]}>Pagado</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 5,
    paddingHorizontal: 40,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    color: "#BDBDBD",
    marginLeft: 5,
  },
  optionTextActive: {
    color: "#000",
  },
  optionActive: {
    opacity: 1,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default TransactionOptions;
    