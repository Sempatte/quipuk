import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { constPaymentMethodsIcons } from "@/app/contants/iconDictionary";
import { TransactionType, TRANSACTION_COLORS, TransactionOption } from "@/app/interfaces/transaction.interface";

interface PaymentMethodSelectorProps {
  type: TransactionType;
  onSelect: (method: string) => void;
  isPending?: boolean; // Agregado para distinguir entre gastos pagados y pendientes
}

const paymentMethods = [
  { id: "Efectivo", label: "Efectivo" },
  { id: "Yape", label: "Yape" },
  { id: "Banco", label: "Cuenta Bancaria" },
];

// Mapeo de tipos de transacción a opciones de UI
const TYPE_TO_OPTION_MAP: Record<TransactionType, TransactionOption> = {
  "gasto": "Gastos",
  "ingreso": "Ingresos",
  "ahorro": "Ahorros"
};

// Función para obtener el título según el tipo y estado
const getTitleForType = (type: TransactionType, isPending: boolean): string => {
  if (type === "gasto") {
    return isPending ? "¿Con qué vas a pagar?" : "¿Con qué pagaste?";
  } else if (type === "ingreso") {
    return "¿Cómo recibiste el pago?";
  } else if (type === "ahorro") {
    return "¿Cómo guardaste el dinero?";
  }
  return "¿Qué método usaste?";
};

/**
 * Componente para seleccionar el método de pago
 * @param type - Tipo de transacción (gasto/ingreso/ahorro)
 * @param onSelect - Función para manejar la selección del método
 * @param isPending - Indica si el gasto está pendiente
 */
const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ 
  type, 
  onSelect, 
  isPending = false // Valor predeterminado: false (no pendiente)
}) => {
  const [selectedMethod, setSelectedMethod] = useState("Efectivo");
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Obtener el título según el tipo de transacción y estado pendiente
  const selectorTitle = getTitleForType(type, isPending);

  // Obtener el color basado en el tipo de transacción
  const themeColor = useMemo(() => {
    const option = TYPE_TO_OPTION_MAP[type] || "Gastos"; // Valor por defecto si el tipo no está en el mapeo
    return TRANSACTION_COLORS[option] || "#00C1D5"; // Color por defecto si la opción no tiene color
  }, [type]);

  // Estilos dinámicos basados en el tipo
  const dynamicStyles = useMemo(() => ({
    selectedMethod: {
      backgroundColor: themeColor,
      borderColor: themeColor
    },
    closeButton: {
      backgroundColor: themeColor
    }
  }), [themeColor]);

  const handleSelect = (method: string) => {
    setSelectedMethod(method);
    onSelect(method);
    if (showMoreOptions) {
      setShowMoreOptions(false);
    }
  };

  return (
    <View>
      <Text style={styles.title}>{selectorTitle}</Text>
      <View style={styles.methodContainer}>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            style={[
              styles.methodButton, 
              selectedMethod === method.id && dynamicStyles.selectedMethod
            ]}
            onPress={() => handleSelect(method.id)}
            accessibilityLabel={`Seleccionar método de pago: ${method.label}`}
            accessibilityRole="button"
          >
            <View style={styles.iconContainer}>
              {constPaymentMethodsIcons[method.id]}
            </View>
            <Text 
              style={[
                styles.methodText, 
                selectedMethod === method.id && styles.selectedMethodText
              ]}
            >
              {method.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal para opciones adicionales (si se requiere en el futuro) */}
      <Modal
        transparent={true}
        visible={showMoreOptions}
        animationType="fade"
        onRequestClose={() => setShowMoreOptions(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Métodos de pago adicionales</Text>
            
            {/* Aquí se pueden agregar más métodos de pago */}
            <View style={styles.modalMethodsList}>
              {/* Lista de métodos adicionales */}
            </View>
            
            <TouchableOpacity
              style={[styles.closeButton, dynamicStyles.closeButton]}
              onPress={() => setShowMoreOptions(false)}
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
  title: { 
    fontSize: 22, 
    fontFamily: "Outfit_600SemiBold", 
    color: "#000", 
    marginBottom: 5,
    lineHeight: 25
  },
  methodContainer: { 
    flexDirection: "row", 
    justifyContent: "flex-start", 
    backgroundColor: "#F8F8F8", 
    borderRadius: 15, 
    padding: 10,
    flexWrap: "wrap"
  },
  methodButton: {
    width: 100,
    height: 90,
    borderRadius: 12,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  iconContainer: { 
    marginBottom: 5 
  },
  methodText: { 
    fontSize: 14, 
    color: "#777",
    fontFamily: "Outfit_400Regular"
  },
  selectedMethodText: { 
    color: "#FFF",
    fontFamily: "Outfit_500Medium"
  },
  // Estilos para el modal
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    marginBottom: 15,
    textAlign: "center"
  },
  modalMethodsList: {
    marginBottom: 15
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
    fontFamily: "Outfit_500Medium"
  },
});

export default PaymentMethodSelector;