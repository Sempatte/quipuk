import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import AgregarSlides from "@/components/ui/AddSlider";
import Carousel from "@/components/ui/Carousel";
import { useQuery } from "@apollo/client";
import { GET_TRANSACTIONS } from "../graphql/transaction.graphql";
import { GetTransactionsData, GetTransactionsVariables } from "../interfaces/transaction.interface";
import { getTransactionIcon } from "../contants/iconDictionary";

// 📌 Importar la lógica de iconos


export default function Add() {
  const [selectedOption, setSelectedOption] = useState<"Gastos" | "Ingresos" | "Ahorros">("Gastos");
  const colorValue = useSharedValue(0);

  const colors = {
    Gastos: "#EF674A",
    Ingresos: "#65CE13",
    Ahorros: "#00C1D5",
  };

  const handleSliderChange = (value: "Gastos" | "Ingresos" | "Ahorros") => {
    setSelectedOption(value);
    const colorIndex = value === "Gastos" ? 0 : value === "Ingresos" ? 1 : 2;
    colorValue.value = withTiming(colorIndex, { duration: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorValue.value,
      [0, 1, 2],
      [colors.Gastos, colors.Ingresos, colors.Ahorros]
    );
    return { backgroundColor };
  });

  // 📌 Consulta GraphQL para obtener transacciones
  const { data, loading, error } = useQuery<GetTransactionsData, GetTransactionsVariables>(GET_TRANSACTIONS, {
    variables: {
      user_id: 3,
      type: selectedOption === "Gastos" ? "gasto" : "ingreso",
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Cargando...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Error al cargar los datos: {error.message}</Text>
      </SafeAreaView>
    );
  }

  // 📌 Mapeo de transacciones con asignación de icono según `type` y `category`
  const transactions = data?.transactions.map((transaction) => ({
    id: transaction.id.toString(),
    title: transaction.title,
    description: transaction.description,
    type: transaction.type,
    amount: `S/ ${transaction.amount.toFixed(2)}`,
    icon: getTransactionIcon(transaction.category, transaction.type), // 🔥 Asigna icono según categoría y tipo
    backgroundColor: transaction.type === "gasto" ? "#FCE4EC" : "#E3F2FD",
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.animatedContainer, animatedStyle]}>
        <Text style={styles.title}>Agregar</Text>
        <View style={styles.sliderContainer}>
          <AgregarSlides
            colors={colors}
            onChange={handleSliderChange}
          />
        </View>
        <View style={styles.containerCarousel}>
          <Carousel title={`${selectedOption} Frecuentes`} items={transactions || []} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  animatedContainer: {
    padding: 20,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  sliderContainer: {
    marginBottom: 10,
  },
  containerCarousel: {
    marginVertical: 15,
    overflow: "visible",
  },
});
