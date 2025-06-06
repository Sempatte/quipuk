import React, { useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import HearthIcon from "../../../assets/images/icons/hearth.svg";
import { TRANSACTION_COLORS, TransactionType } from "@/app/interfaces/transaction.interface";

interface TransactionOptionsProps {
  type: TransactionType;
  onSelectFrequent: (frequent: boolean) => void;
  onSelectStatus: (isPaid: boolean) => void;
  initialFrequent?: boolean;
  initialStatus?: boolean;
  statusReadOnly?: boolean; // Prop para indicar si el estado es de solo lectura
}

/**
 * Componente para opciones adicionales de transacción
 * Permite marcar una transacción como frecuente y como pagada/recibida
 * 
 * @param type - Tipo de transacción ("gasto", "ingreso" o "ahorro")
 * @param onSelectFrequent - Función para actualizar el estado de "frecuente"
 * @param onSelectStatus - Función para actualizar el estado de "pagado/recibido"
 * @param initialFrequent - Valor inicial para el estado "frecuente"
 * @param initialStatus - Valor inicial para el estado "pagado/recibido"
 * @param statusReadOnly - Indica si el estado de pago es de solo lectura
 */

// Corregido para incluir "ahorro"
const TYPE_TO_OPTION_MAP: Record<TransactionType, "Gastos" | "Ingresos" | "Ahorros"> = {
  "gasto": "Gastos",
  "ingreso": "Ingresos",
  "ahorro": "Ahorros"
};

const TransactionOptions: React.FC<TransactionOptionsProps> = ({ 
  type, 
  onSelectFrequent, 
  onSelectStatus,
  initialFrequent = false,
  initialStatus = true,
  statusReadOnly = false,
}) => {
  const [isFrequent, setIsFrequent] = useState(initialFrequent);
  const [isPaid, setIsPaid] = useState(initialStatus);

  // Actualizar estado local si cambian las props iniciales
  useEffect(() => {
    setIsFrequent(initialFrequent);
  }, [initialFrequent]);

  useEffect(() => {
    setIsPaid(initialStatus);
  }, [initialStatus]);

  // Obtener el color basado en el tipo de transacción
  const themeColor = useMemo(() => {
    const option = TYPE_TO_OPTION_MAP[type];
    return TRANSACTION_COLORS[option];
  }, [type]);

  // Textos dependientes del tipo de transacción
  const statusText = useMemo(() => ({
    active: type === "gasto" ? "Pagado" : type === "ingreso" ? "Recibido" : "Completado",
    inactive: "Pendiente"
  }), [type]);

  const handleSelectFrequent = (frequent: boolean) => {
    setIsFrequent(frequent);
    onSelectFrequent(frequent);
  };

  const handleSelectStatus = (status: boolean) => {
    // Si es de solo lectura, no permitir cambios
    if (statusReadOnly) return;
    
    setIsPaid(status);
    onSelectStatus(status);
  };

  return (
    <View style={styles.container}>
      {/* Botón Frecuente */}
      <TouchableOpacity
        style={[styles.optionContainer, isFrequent && styles.optionActive]}
        onPress={() => handleSelectFrequent(!isFrequent)}
        accessibilityLabel={isFrequent ? "Desmarcar como frecuente" : "Marcar como frecuente"}
        accessibilityRole="button"
      >
        <HearthIcon
          width={24}
          height={24}
          fill={isFrequent ? themeColor : "#BDBDBD"}
        />
        <Text
          style={[styles.optionText, isFrequent && styles.optionTextActive]}
        >
          Frecuente
        </Text>
      </TouchableOpacity>

      {/* Botón Pagado/Recibido con Switch */}
      <View style={styles.switchContainer}>
        <Switch
          value={isPaid}
          onValueChange={handleSelectStatus}
          trackColor={{ false: "#BDBDBD", true: "#BDBDBD" }}
          thumbColor={isPaid ? themeColor : "#FFF"}
          disabled={statusReadOnly} // Deshabilitar el switch si es de solo lectura
          style={statusReadOnly ? styles.switchDisabled : null}
          accessibilityLabel={isPaid ? statusText.active : statusText.inactive}
          testID="payment-status-switch"
        />
        <Text 
          style={[
            styles.optionText, 
            isPaid && styles.optionTextActive,
            statusReadOnly && styles.textReadOnly
          ]}
        >
          {isPaid ? statusText.active : statusText.inactive}
        </Text>
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
  switchDisabled: {
    opacity: 0.7,
  },
  textReadOnly: {
    fontWeight: "600", // Mayor peso visual para estado solo lectura
  }
});

export default TransactionOptions;