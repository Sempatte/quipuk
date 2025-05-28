import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';

// Importaciones de componentes
import AgregarSlides from "@/components/ui/AddSlider";
import Carousel from "@/components/ui/Carousel";
import AmountInput from "@/components/ui/AmountInput";
import DescriptionInput from "@/components/ui/DescriptionInput";
import TransactionOptions from "@/components/ui/TransactionOptions";
import CategorySelector from "@/components/ui/CategorySelector";
import PaymentMethodSelector from "@/components/ui/PaymentMethodSelector";
import DateSelector from "@/components/ui/DateSelector";
import ReceiptScanner from "@/components/ui/ReceiptScanner";
import OCRStatusIndicator from "@/components/ui/OCRStatusIndicator";

// Importaciones de GraphQL
import {
  GET_TRANSACTIONS,
  CREATE_TRANSACTION,
  GET_FREQUENT_TRANSACTIONS,
} from "../graphql/transaction.graphql";

// Importaciones de Interfaces
import {
  TransactionOption,
  CreateTransactionInput,
  TRANSACTION_MAPPING,
  TRANSACTION_COLORS,
  FrequentTransactionsData,
} from "../interfaces/transaction.interface";

// Utilidades
import { getTransactionIcon } from "../contants/iconDictionary";
import { useToast } from "@/app/providers/ToastProvider";
import { RootStackParamList } from "../interfaces/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ExtractedReceiptData } from "../services/integratedOCRService";

// Definir la interfaz para los parámetros de la ruta
interface AddTransactionRouteParams {
  forcePaymentStatus?: "pending" | "completed";
  statusReadOnly?: boolean;
  preselectedTab?: TransactionOption;
}

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "movements"
>;

// Definir un tipo para los indexadores del colorIndex
type ColorIndexMap = {
  [key in TransactionOption]: number;
};

export default function AddTransaction() {
  const { showToast } = useToast();
  const colorValue = useSharedValue(0);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Utilizar RouteProp tipado correctamente
  const route =
    useRoute<RouteProp<Record<string, AddTransactionRouteParams>, string>>();

  // Obtener parámetros de la ruta de navegación con tipos seguros
  const params = route.params || {};
  const { forcePaymentStatus, statusReadOnly, preselectedTab } = params;

  // Estado para controlar el scanner de comprobantes
  const [showScanner, setShowScanner] = useState(false);

  // Estado del formulario
  const [formState, setFormState] = useState({
    selectedOption: (preselectedTab || "Gastos") as TransactionOption,
    amount: "",
    description: "",
    category: "",
    paymentMethod: "Efectivo",
    date: new Date().toISOString(), // Fecha de creación
    dueDate: new Date().toISOString(), // Fecha de vencimiento (misma por defecto)
    frequent: false,
    isPaid: forcePaymentStatus === "pending" ? false : true, // Usar el parámetro si existe
  });

  // Configurar el slider si viene preseleccionado
  useEffect(() => {
    if (preselectedTab) {
      const colorIndex: ColorIndexMap = {
        Gastos: 0,
        Ingresos: 1,
        Ahorros: 2,
      };
      colorValue.value = withTiming(colorIndex[preselectedTab], {
        duration: 300,
      });
    }
  }, [preselectedTab, colorValue]);

  useEffect(() => {
    if (forcePaymentStatus === "pending") {
      // Establecer fecha de vencimiento predeterminada (7 días después)
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);

      setFormState(prev => ({
        ...prev,
        isPaid: false,
        dueDate: defaultDueDate.toISOString(),
      }));
    }
  }, [forcePaymentStatus]);

  // Actualización del estado - MEJORADA para manejar múltiples updates
  const updateFormState = useCallback((updates: Partial<typeof formState>) => {
    console.log('🔄 [AddTransaction] Actualizando estado del formulario:', updates);
    setFormState((prev) => {
      const newState = { ...prev, ...updates };
      console.log('✅ [AddTransaction] Nuevo estado:', newState);
      return newState;
    });
  }, []);

  // Cambio de slider
  const handleSliderChange = useCallback(
    (value: TransactionOption) => {
      updateFormState({ selectedOption: value });
      const colorIndex: ColorIndexMap = {
        Gastos: 0,
        Ingresos: 1,
        Ahorros: 2,
      };
      colorValue.value = withTiming(colorIndex[value], { duration: 300 });
    },
    [updateFormState, colorValue]
  );

  // Estilo animado de color
  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorValue.value,
      [0, 1, 2],
      Object.values(TRANSACTION_COLORS)
    );
    return { backgroundColor };
  });

  // Consulta para transacciones frecuentes
  const { data: frequentData, loading: loadingFrequent } =
    useQuery<FrequentTransactionsData>(GET_FREQUENT_TRANSACTIONS, {
      variables: {
        type: TRANSACTION_MAPPING[formState.selectedOption],
        frequent: true,
      },
      fetchPolicy: "network-only", // Forzar que siempre busque del servidor
    });

  // Mutación de creación de transacción
  const [createTransaction, { loading: creating }] = useMutation(
    CREATE_TRANSACTION,
    {
      refetchQueries: [
        {
          query: GET_TRANSACTIONS,
        },
        {
          query: GET_FREQUENT_TRANSACTIONS,
          variables: {
            type: TRANSACTION_MAPPING[formState.selectedOption],
            frequent: true,
          },
        },
      ],
      onCompleted: () => {
        // Resetear formulario
        setFormState({
          selectedOption: "Gastos",
          amount: "",
          description: "",
          category: "",
          paymentMethod: "Efectivo",
          date: new Date().toISOString(),
          dueDate: new Date().toISOString(),
          frequent: false,
          isPaid: true,
        });
        navigation.navigate("movements");
        showToast("success", "Éxito", "Transacción agregada correctamente");
      },
      onError: (error) => {
        showToast("error", "Error", error.message);
      },
    }
  );

  // Validación de formulario
  const isFormValid = useMemo(
    () => formState.amount && formState.category && formState.paymentMethod,
    [formState]
  );

  // Transformación de transacciones frecuentes
  const frequentTransactions = useMemo(() => {
    if (!frequentData?.frequentTransactions) return [];

    return frequentData.frequentTransactions.map((transaction) => ({
      id: transaction.id.toString(),
      title: transaction.title,
      description: transaction.description || "",
      type: transaction.type,
      amount: `S/ ${transaction.amount.toFixed(2)}`,
      icon: getTransactionIcon(transaction.category, transaction.type),
      backgroundColor: transaction.type === "gasto" ? "#FCE4EC" : "#E3F2FD",
    }));
  }, [frequentData]);

  // Creación de transacción
  const handleCreateTransaction = useCallback(async () => {
    if (!isFormValid) {
      showToast(
        "error",
        "Error",
        "Por favor completa todos los campos requeridos."
      );
      return;
    }

    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (!storedUserId) {
        showToast("error", "Error", "No se pudo obtener el ID del usuario.");
        return;
      }

      const userId = parseInt(storedUserId, 10);

      // Crear objeto para la transacción
      const transactionInput: CreateTransactionInput = {
        userId,
        title: formState.category,
        description: formState.description,
        amount: parseFloat(formState.amount),
        type: TRANSACTION_MAPPING[formState.selectedOption],
        frequent: formState.frequent,
        category: formState.category,
        status: formState.isPaid ? "completed" : "pending",
        // Ajuste para manejar correctamente la zona horaria
        dueDate: formState.isPaid
          ? new Date()
          : adjustDateForTimezone(new Date(formState.dueDate)),
      };

      // Función para ajustar la fecha según la zona horaria
      function adjustDateForTimezone(date: Date): Date {
        // Obtenemos la diferencia de zona horaria en minutos
        const timezoneOffset = date.getTimezoneOffset();

        // Creamos una nueva fecha con el ajuste para compensar la conversión UTC
        const adjustedDate = new Date(date.getTime() + timezoneOffset * 60000);

        // Aseguramos que la hora sea mediodía para evitar problemas cerca de medianoche
        adjustedDate.setHours(12, 0, 0, 0);

        return adjustedDate;
      }

      await createTransaction({
        variables: { input: transactionInput },
      });
    } catch (error: any) {
      console.error("Error al crear transacción:", error);
      showToast(
        "error",
        "Error",
        "Hubo un problema al agregar la transacción."
      );
    }
  }, [formState, isFormValid, createTransaction, showToast]);

  // Manejo de cambio de estado de pago
  const handleStatusChange = useCallback(
    (isPaid: boolean) => {
      // Si el estado de pago es de solo lectura, no permitir cambios
      if (statusReadOnly) {
        return;
      }
      updateFormState({ isPaid });

      // Si cambia a pendiente, asegurarse de que haya una fecha de vencimiento seleccionada
      if (!isPaid && formState.date === new Date().toISOString()) {
        // Establecer fecha de vencimiento predeterminada (por ejemplo, 7 días después)
        const defaultDueDate = new Date();
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        updateFormState({ dueDate: defaultDueDate.toISOString() });
      }
    },
    [formState.date, updateFormState, statusReadOnly]
  );

  // Manejar selección de transacción frecuente
  const handleSelectFrequent = useCallback(
    (item: any) => {
      // Autollenar el formulario con los datos de la transacción seleccionada
      updateFormState({
        amount: item.amount.replace("S/ ", ""),
        description: item.description || "",
        category: item.title,
        frequent: true,
      });
    },
    [updateFormState]
  );

  /**
   * FUNCIÓN CORREGIDA - Maneja los datos extraídos del comprobante escaneado
   */
  const handleReceiptDataExtracted = useCallback(
    (data: ExtractedReceiptData) => {
      console.log('📄 [AddTransaction] ============ DATOS RECIBIDOS DEL OCR ============');
      console.log('📄 [AddTransaction] Datos extraídos:', data);

      // Crear objeto de actualizaciones de UNA SOLA VEZ
      const updates: Partial<typeof formState> = {};

      // Aplicar monto si está disponible
      if (data.amount && data.amount > 0) {
        updates.amount = data.amount.toString();
        console.log('💰 [AddTransaction] Monto aplicado:', data.amount);
      }

      // Aplicar descripción si está disponible
      if (data.description && data.description.trim().length > 0) {
        updates.description = data.description.trim();
        console.log('📝 [AddTransaction] Descripción aplicada:', data.description);
      }

      // Aplicar categoría si está disponible y es válida
      if (data.category && data.category.trim().length > 0) {
        updates.category = data.category.trim();
        console.log('🏷️ [AddTransaction] Categoría aplicada:', data.category);
      }

      // Aplicar fecha si está disponible
      if (data.date) {
        updates.date = data.date;
        console.log('📅 [AddTransaction] Fecha aplicada:', data.date);
        
        // Si es pendiente, también actualizar la fecha de vencimiento
        if (!formState.isPaid) {
          updates.dueDate = data.date;
          console.log('📅 [AddTransaction] Fecha de vencimiento aplicada:', data.date);
        }
      }

      // Aplicar nombre del comercio a la descripción si no hay descripción específica
      if (data.merchantName && !updates.description) {
        updates.description = `Compra en ${data.merchantName}`;
        console.log('🏪 [AddTransaction] Descripción desde comercio:', updates.description);
      }

      console.log('🔄 [AddTransaction] Actualizaciones a aplicar:', updates);

      // CRÍTICO: Actualizar el formulario con todos los datos de UNA SOLA VEZ
      if (Object.keys(updates).length > 0) {
        updateFormState(updates);
        
        // Mostrar mensaje de éxito
        showToast(
          "success",
          "Datos extraídos",
          `Se han completado automáticamente ${Object.keys(updates).length} campos del formulario.`
        );
        
        console.log('✅ [AddTransaction] Formulario actualizado exitosamente');
      } else {
        console.log('⚠️ [AddTransaction] No se encontraron datos válidos para aplicar');
        showToast(
          "info",
          "OCR completado",
          "Se procesó el comprobante pero no se encontraron datos válidos para llenar automáticamente."
        );
      }
    },
    [updateFormState, formState.isPaid, showToast]
  );

  /**
   * FUNCIÓN CORREGIDA - Cierra el scanner y procesa los datos
   */
  const handleScannerClose = useCallback(() => {
    console.log('📷 [AddTransaction] Cerrando scanner...');
    setShowScanner(false);
  }, []);

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
              <AgregarSlides
                colors={TRANSACTION_COLORS}
                onChange={handleSliderChange}
              />
            </View>

            {/* Botón de escaneo de comprobantes */}
            <View style={styles.scanButtonContainer}>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={() => {
                  console.log('📷 [AddTransaction] Abriendo scanner...');
                  setShowScanner(true);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="scan" size={24} color="#FFF" />
                <Text style={styles.scanButtonText}>Escanear Comprobante</Text>
              </TouchableOpacity>
              
              {/* Indicador de estado OCR (solo en desarrollo) */}
              {__DEV__ && (
                <View style={styles.ocrStatusContainer}>
                  <OCRStatusIndicator showDetails={false} />
                </View>
              )}
            </View>

            {/* Carrusel que ahora se oculta cuando está vacío */}
            <View style={styles.containerCarousel}>
              <Carousel
                title={`${formState.selectedOption} Frecuentes`}
                items={frequentTransactions}
                onAddPress={handleCreateTransaction}
                emptyMessage={`No hay ${formState.selectedOption.toLowerCase()} frecuentes`}
                hideIfEmpty={true} // Clave para ocultar completamente si no hay elementos
              />
            </View>
          </Animated.View>

          <View style={styles.amountContainer}>
            <AmountInput
              value={formState.amount}
              onChangeText={(value) => updateFormState({ amount: value })}
            />
          </View>

          <View style={styles.descriptionContainer}>
            <DescriptionInput
              value={formState.description}
              onChangeText={(value) => updateFormState({ description: value })}
            />
          </View>

          <TransactionOptions
            type={TRANSACTION_MAPPING[formState.selectedOption]}
            onSelectFrequent={(frequent) => updateFormState({ frequent })}
            onSelectStatus={handleStatusChange}
            initialFrequent={formState.frequent}
            initialStatus={formState.isPaid}
            statusReadOnly={statusReadOnly}
          />

          <View style={styles.categoryContainer}>
            <CategorySelector
              type={TRANSACTION_MAPPING[formState.selectedOption]}
              onSelect={(category) => updateFormState({ category })}
            />
          </View>

          <View style={styles.paymentContainer}>
            <PaymentMethodSelector
              type={TRANSACTION_MAPPING[formState.selectedOption]}
              onSelect={(paymentMethod) => updateFormState({ paymentMethod })}
              isPending={formState.isPaid}
            />
          </View>

          {/* Selector de fecha - ahora con título condicional según estado y limitación de fechas */}
          <View style={styles.dateSelectorContainer}>
            <DateSelector
              type={TRANSACTION_MAPPING[formState.selectedOption]}
              selectedDate={
                formState.isPaid ? formState.date : formState.dueDate
              }
              onSelectDate={(date) => {
                if (formState.isPaid) {
                  updateFormState({ date });
                } else {
                  updateFormState({ dueDate: date });
                }
              }}
              title={formState.isPaid ? "Fecha" : "Fecha de vencimiento"}
              isPaid={formState.isPaid} // Pasamos el estado de pago al selector de fecha
            />
          </View>

          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                {
                  backgroundColor: TRANSACTION_COLORS[formState.selectedOption],
                },
              ]}
              onPress={handleCreateTransaction}
              disabled={creating || !isFormValid}
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

      {/* Modal del scanner de comprobantes - CALLBACKS CORREGIDOS */}
      <ReceiptScanner
        visible={showScanner}
        onClose={handleScannerClose}
        onDataExtracted={handleReceiptDataExtracted}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  scanButtonContainer: {
    marginVertical: 15,
    alignItems: "center",
    position: "relative",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  scanButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    marginLeft: 8,
  },
  ocrStatusContainer: {
    position: "absolute",
    top: -5,
    right: -5,
    zIndex: 10,
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