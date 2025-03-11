import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { constPaymentMethodsIcons } from "@/app/contants/iconDictionary";

interface PaymentMethodSelectorProps {
  onSelect: (method: string) => void;
}

const paymentMethods = [
  { id: "Efectivo", label: "Efectivo" },
  { id: "Tarjeta", label: "Yape" },
  { id: "BCP", label: "Cuenta BCP" },
];

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ onSelect }) => {
  const [selectedMethod, setSelectedMethod] = useState("Efectivo");

  const handleSelect = (method: string) => {
    setSelectedMethod(method);
    onSelect(method);
  };

  return (
    <View>
      <Text style={styles.title}>¿Con qué pagaste?</Text>
      <View style={styles.methodContainer}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[styles.methodButton, selectedMethod === method.id && styles.selectedMethod]}
            onPress={() => handleSelect(method.id)}
          >
            <View style={styles.iconContainer}>{constPaymentMethodsIcons[method.id]}</View>
            <Text style={[styles.methodText, selectedMethod === method.id && styles.selectedMethodText]}>
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: { fontSize: 22, fontFamily: "Outfit_600SemiBold", color: "#000", marginBottom: 5 },
  methodContainer: { flexDirection: "row", justifyContent: "flex-start", backgroundColor: "#F8F8F8", borderRadius: 15, padding: 10 },
  methodButton: {
    width: 100,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  selectedMethod: { backgroundColor: "#E76F51", borderColor: "#E76F51" },
  iconContainer: { marginBottom: 5 },
  methodText: { fontSize: 14, color: "#777" },
  selectedMethodText: { color: "#FFF" },
});

export default PaymentMethodSelector;
