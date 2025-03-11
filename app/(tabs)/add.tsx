import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import AgregarSlides from "@/components/ui/AddSlider";
import Carousel from "@/components/ui/Carousel";
import { useMutation, useQuery } from "@apollo/client";
import {
  GET_TRANSACTIONS,
  CREATE_TRANSACTION,
} from "../graphql/transaction.graphql";
import {
  GetTransactionsData,
  GetTransactionsVariables,
} from "../interfaces/transaction.interface";
import { getTransactionIcon } from "../contants/iconDictionary";
import AmountInput from "@/components/ui/AmountInput";
import DescriptionInput from "@/components/ui/DescriptionInput";
import TransactionOptions from "@/components/ui/TransactionOptions";
import CategorySelector from "@/components/ui/CategorySelector";
import PaymentMethodSelector from "@/components/ui/PaymentMethodSelector";
import DateSelector from "@/components/ui/DateSelector";

export default function AddTransaction() {
  const [selectedOption, setSelectedOption] = useState<
    "Gastos" | "Ingresos" | "Ahorros"
  >("Gastos");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [date, setDate] = useState(new Date().toISOString()); // Fecha actual por defecto

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

  const { data, loading, error } = useQuery<
    GetTransactionsData,
    GetTransactionsVariables
  >(GET_TRANSACTIONS, {
    variables: {
      user_id: 3,
      type: selectedOption === "Gastos" ? "gasto" : "ingreso",
    },
  });

  const [createTransaction, { loading: creating }] = useMutation(
    CREATE_TRANSACTION,
    {
      refetchQueries: [{ query: GET_TRANSACTIONS }], // Refresca la lista de transacciones
      onCompleted: () => {
        Alert.alert("Éxito", "Transacción agregada correctamente");
        // Resetear formulario
        setAmount("");
        setDescription("");
        setCategory("");
        setPaymentMethod("");
        setDate(new Date().toISOString());
      },
      onError: (error) => {
        console.log("Error al crear transacción:", error);
        Alert.alert("Error", error.message);
      },
    }
  );

  const handleCreateTransaction = async () => {
    if (!amount || !category || !paymentMethod) {
      Alert.alert("Error", "Por favor completa todos los campos requeridos.");
      return;
    }
  
    try {
      console.log("Enviando transacción...", {
        userId: 3, // ⚠ Asegúrate de tener el ID del usuario autenticado
        title: category,
        description,
        amount: parseFloat(amount),
        type: selectedOption === "Gastos" ? "gasto" : "ingreso",
        category,
      });
  
      await createTransaction({
        variables: {
          input: {
            userId: 3, // ⚠ Si usas autenticación, reemplázalo con el ID real del usuario
            title: category,
            description,
            amount: parseFloat(amount),
            type: selectedOption === "Gastos" ? "gasto" : "ingreso",
            category,
          },
        },
      });
  
      Alert.alert("Éxito", "Transacción agregada correctamente");
      setAmount("");
      setDescription("");
      setCategory("");
      setPaymentMethod("");
      setDate(new Date().toISOString());
    } catch (error : any) {
      console.error("Error al crear transacción:", error);
      Alert.alert(error);
    }
  };
  

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

  const transactions = data?.transactions.map((transaction) => ({
    id: transaction.id.toString(),
    title: transaction.title,
    description: transaction.description,
    type: transaction.type,
    amount: `S/ ${transaction.amount.toFixed(2)}`,
    icon: getTransactionIcon(transaction.category, transaction.type),
    backgroundColor: transaction.type === "gasto" ? "#FCE4EC" : "#E3F2FD",
  }));

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.animatedContainer, animatedStyle]}>
            <Text style={styles.title}>Agregar</Text>

            <View style={styles.sliderContainer}>
              <AgregarSlides colors={colors} onChange={handleSliderChange} />
            </View>
            <View style={styles.containerCarousel}>
              <Carousel
                title={`${selectedOption || "Gastos"} Frecuentes`}
                items={transactions || []}
              />
            </View>
          </Animated.View>

          <View style={styles.amountContainer}>
            <AmountInput value={amount} onChangeText={setAmount} />
          </View>

          <View style={styles.descriptionContainer}>
            <DescriptionInput
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TransactionOptions />

          <View style={styles.categoryContainer}>
            <CategorySelector
              type={selectedOption === "Gastos" ? "gasto" : "ingreso"}
              onSelect={setCategory}
            />
          </View>

          <View style={styles.paymentContainer}>
            <PaymentMethodSelector onSelect={setPaymentMethod} />
          </View>

          <View style={styles.dateSelectorContainer}>
            <DateSelector selectedDate={date} onSelectDate={setDate} />
          </View>

          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreateTransaction}
              disabled={creating}
            >
              <View style={styles.addButtonContent}>
                <View style={styles.addIconContainer}>
                  <Text style={styles.addIconText}>+</Text>
                </View>
                <Text style={styles.addButtonText}>
                  {creating ? "Agregando..." : "Agregar"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    paddingBottom: 50,
  },
  animatedContainer: {
    padding: 20,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontSize: 30,
    fontFamily: "Outfit_600SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 35,
    marginBottom: 10,
    alignSelf: "center",
  },
  sliderContainer: {
    marginBottom: 10,
  },
  containerCarousel: {
    marginVertical: 15,
    overflow: "visible",
  },
  amountContainer: {
    marginTop: 15,
    marginHorizontal: 20,
  },
  descriptionContainer: {
    width: "100%",
    marginTop: 15,
    paddingHorizontal: 20,
  },
  categoryContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  paymentContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  dateSelectorContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  addButtonContainer: {
    marginTop: 30,
    alignItems: "center",
    marginBottom: 30,
  },
  addButton: {
    backgroundColor: "#E86F51",
    width: "80%",
    height: 60,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, // Para sombra en Android
    marginBottom: 20,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  addIconText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  addButtonText: {
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    color: "#FFF",
  },
});


// TO DO:
/* EL default en  pagado debe estar encendido. Vista agregar mov.
Si esta apagado, deberia decir pendiente.

Categoria no deberia salir en ahora.

Para que sirve y porque utilizamos PERN Stack en QUIPUK?  */