import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  runOnJS,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, RouteProp, useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

// Importaciones de componentes
import AgregarSlides from "@/components/ui/AddSlider";
import Carousel from "@/components/ui/Carousel";
import AmountInput from "@/components/ui/AmountInput";
import DescriptionInput from "@/components/ui/DescriptionInput";
import TransactionOptions from "@/components/ui/TransactionOptions";
import CategorySelector from "@/components/ui/CategorySelector";
import PaymentMethodSelector from "@/components/ui/PaymentMethodSelector";
import DateTimeSelector from "@/components/ui/DateTimeSelector";
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
import { getCategoryIcon } from "../contants/iconDictionary"; // 🔥 Usar nueva función
import { useToast } from "@/app/providers/ToastProvider";
import { RootStackParamList } from "../interfaces/navigation";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ExtractedReceiptData } from "../services/integratedOCRService";

// 🎯 INTERFACES MEJORADAS
interface AddTransactionRouteParams {
  forcePaymentStatus?: "pending" | "completed";
  statusReadOnly?: boolean;
  preselectedTab?: TransactionOption;
}

interface FormState {
  selectedOption: TransactionOption;
  amount: string;
  description: string;
  category: string;
  paymentmethod: string;
  date: string;
  dueDate: string;
  frequent: boolean;
  isPaid: boolean;
}

// 🎯 TIPOS MEJORADOS
type AddTransactionNavigationProp = NativeStackNavigationProp<RootStackParamList, "movements">;
type ColorIndexMap = Record<TransactionOption, number>;

// 🎯 CONSTANTES
const COLOR_INDEX_MAP: ColorIndexMap = {
  Gastos: 0,
  Ingresos: 1,
  Ahorros: 2,
};

const INITIAL_FORM_STATE: FormState = {
  selectedOption: "Gastos",
  amount: "",
  description: "",
  category: "",
  paymentmethod: "Efectivo",
  date: new Date().toISOString(),
  dueDate: new Date().toISOString(),
  frequent: false,
  isPaid: true,
};

const VALIDATION_RULES = {
  amount: (value: string) => value && parseFloat(value) > 0,
  category: (value: string) => value.length > 0,
  paymentmethod: (value: string) => value.length > 0,
} as const;

export default function AddTransaction() {
  // 🎯 HOOKS BÁSICOS
  const { showToast } = useToast();
  const navigation = useNavigation<AddTransactionNavigationProp>();
  const route = useRoute<RouteProp<Record<string, AddTransactionRouteParams>, string>>();
  
  // 🎯 PARÁMETROS DE RUTA
  const { forcePaymentStatus, statusReadOnly, preselectedTab } = route.params || {};
  
  // 🎯 REFS PARA OPTIMIZACIONES
  const scrollRef = useRef<ScrollView>(null);
  const amountInputRef = useRef<any>(null);
  
  // 🎯 VALORES ANIMADOS
  const colorValue = useSharedValue(COLOR_INDEX_MAP[preselectedTab || "Gastos"]);
  const buttonScale = useSharedValue(1);
  
  // 🎯 ESTADO LOCAL
  const [formState, setFormState] = useState<FormState>(() => ({
    ...INITIAL_FORM_STATE,
    selectedOption: preselectedTab || "Gastos",
    isPaid: forcePaymentStatus !== "pending",
  }));
  
  const [showScanner, setShowScanner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 INICIALIZACIÓN DE ESTADO CON PARÁMETROS
  useEffect(() => {
    if (preselectedTab) {
      colorValue.value = withTiming(COLOR_INDEX_MAP[preselectedTab], { duration: 300 });
    }
  }, [preselectedTab]);

  useEffect(() => {
    if (forcePaymentStatus === "pending") {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      
      setFormState(prev => ({
        ...prev,
        isPaid: false,
        dueDate: defaultDueDate.toISOString(),
      }));
    }
  }, [forcePaymentStatus]);

  // 🎯 ACTUALIZACIÓN OPTIMIZADA DEL ESTADO
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => {
      const newState = { ...prev, ...updates };
      
      // 🎯 LOGGING CONDICIONAL (solo en desarrollo)
      if (__DEV__) {
        console.log("🔄 [AddTransaction] Estado actualizado:", updates);
      }
      
      return newState;
    });
  }, []);

  // 🎯 VALIDACIÓN MEJORADA DEL FORMULARIO
  const formValidation = useMemo(() => {
    const errors: string[] = [];
    const isAmountValid = VALIDATION_RULES.amount(formState.amount);
    const isCategoryValid = VALIDATION_RULES.category(formState.category);
    const isPaymentMethodValid = VALIDATION_RULES.paymentmethod(formState.paymentmethod);
    
    if (!isAmountValid) errors.push("Monto requerido");
    if (!isCategoryValid) errors.push("Categoría requerida");
    if (!isPaymentMethodValid) errors.push("Método de pago requerido");
    
    return {
      isValid: errors.length === 0,
      errors,
      fieldValidation: {
        amount: isAmountValid,
        category: isCategoryValid,
        paymentmethod: isPaymentMethodValid,
      }
    };
  }, [formState.amount, formState.category, formState.paymentmethod]);

  // 🎯 CAMBIO DE SLIDER CON ANIMACIÓN MEJORADA
  const handleSliderChange = useCallback((value: TransactionOption) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    updateFormState({ selectedOption: value });
    colorValue.value = withSpring(COLOR_INDEX_MAP[value], {
      damping: 15,
      stiffness: 150,
    });
  }, [updateFormState, colorValue]);

  // 🎯 ESTILOS ANIMADOS MEJORADOS
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorValue.value,
      [0, 1, 2],
      Object.values(TRANSACTION_COLORS)
    );
    return { backgroundColor };
  });

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // 🎯 CONSULTA OPTIMIZADA DE TRANSACCIONES FRECUENTES
  const { data: frequentData, loading: loadingFrequent } = useQuery<FrequentTransactionsData>(
    GET_FREQUENT_TRANSACTIONS,
    {
      variables: {
        type: TRANSACTION_MAPPING[formState.selectedOption],
        frequent: true,
      },
      fetchPolicy: "cache-first", // 🔥 Mejor rendimiento
      skip: !formState.selectedOption, // 🔥 Skip si no hay selección
    }
  );

  // 🎯 MUTACIÓN OPTIMIZADA
  const [createTransaction, { loading: creating }] = useMutation(CREATE_TRANSACTION, {
    refetchQueries: [
      { query: GET_TRANSACTIONS },
      {
        query: GET_FREQUENT_TRANSACTIONS,
        variables: {
          type: TRANSACTION_MAPPING[formState.selectedOption],
          frequent: true,
        },
      },
    ],
    onCompleted: () => {
      // 🎯 RESET OPTIMIZADO DEL FORMULARIO
      setFormState({
        ...INITIAL_FORM_STATE,
        selectedOption: formState.selectedOption, // Mantener la pestaña actual
      });
      
      // 🎯 HAPTIC FEEDBACK DE ÉXITO
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      navigation.navigate("movements");
      showToast("success", "¡Éxito!", "Transacción agregada correctamente");
    },
    onError: (error) => {
      // 🎯 HAPTIC FEEDBACK DE ERROR
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      showToast("error", "Error", error.message);
    },
  });

  // 🎯 TRANSFORMACIÓN OPTIMIZADA DE TRANSACCIONES FRECUENTES
  const frequentTransactions = useMemo(() => {
    if (!frequentData?.frequentTransactions) return [];

    return frequentData.frequentTransactions.map(transaction => ({
      id: transaction.id.toString(),
      title: transaction.title,
      description: transaction.description || "",
      type: transaction.type,
      amount: `S/ ${transaction.amount.toFixed(2)}`,
      icon: getCategoryIcon(transaction.category, transaction.type), // 🔥 Usar nueva función
      backgroundColor: transaction.type === "gasto" ? "#FCE4EC" : "#E3F2FD",
    }));
  }, [frequentData]);

  // 🎯 CREACIÓN DE TRANSACCIÓN MEJORADA
  const handleCreateTransaction = useCallback(async () => {
    if (!formValidation.isValid) {
      const errorMessage = formValidation.errors.join(", ");
      showToast("error", "Formulario incompleto", errorMessage);
      
      // 🎯 SCROLL TO ERROR Y FOCUS
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      if (!formValidation.fieldValidation.amount) {
        setTimeout(() => amountInputRef.current?.focus(), 300);
      }
      return;
    }

    setIsSubmitting(true);
    buttonScale.value = withSpring(0.95);

    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (!storedUserId) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      const userId = parseInt(storedUserId, 10);
      
      // 🎯 VALIDACIÓN ADICIONAL DE MONTO
      const amount = parseFloat(formState.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("El monto debe ser un número válido mayor a 0");
      }

      const transactionInput: CreateTransactionInput = {
        userId,
        title: formState.category,
        description: formState.description || `${formState.selectedOption} en ${formState.category}`,
        amount,
        type: TRANSACTION_MAPPING[formState.selectedOption],
        frequent: formState.frequent,
        paymentmethod: formState.paymentmethod,
        category: formState.category,
        status: formState.isPaid ? "completed" : "pending",
        dueDate: new Date(formState.isPaid ? formState.date : formState.dueDate),
      };

      await createTransaction({ variables: { input: transactionInput } });
      
    } catch (error: any) {
      console.error("❌ Error al crear transacción:", error);
      showToast("error", "Error", error.message || "Hubo un problema al agregar la transacción");
    } finally {
      setIsSubmitting(false);
      buttonScale.value = withSpring(1);
    }
  }, [formState, formValidation, createTransaction, showToast]);

  // 🎯 MANEJO OPTIMIZADO DE CAMBIO DE ESTADO
  const handleStatusChange = useCallback((isPaid: boolean) => {
    if (statusReadOnly) return;
    
    updateFormState({ isPaid });
    
    if (!isPaid && formState.date === new Date().toISOString()) {
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      updateFormState({ dueDate: defaultDueDate.toISOString() });
    }
  }, [formState.date, updateFormState, statusReadOnly]);

  // 🎯 SELECCIÓN OPTIMIZADA DE TRANSACCIÓN FRECUENTE
  const handleSelectFrequent = useCallback((item: any) => {
    const updates: Partial<FormState> = {
      amount: item.amount.replace("S/ ", ""),
      description: item.description || "",
      category: item.title,
      frequent: true,
    };
    
    updateFormState(updates);
    
    // 🎯 HAPTIC FEEDBACK
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [updateFormState]);

  // 🎯 MANEJO MEJORADO DE DATOS OCR
  const handleReceiptDataExtracted = useCallback((data: ExtractedReceiptData) => {
    if (__DEV__) {
      console.log("📄 [AddTransaction] Datos OCR recibidos:", data);
    }

    setShowScanner(false);
    
    const updates: Partial<FormState> = {};
    let fieldsUpdated = 0;

    // 🎯 VALIDACIÓN Y APLICACIÓN DE DATOS
    if (data.amount && data.amount > 0) {
      updates.amount = data.amount.toString();
      fieldsUpdated++;
    }

    if (data.description?.trim()) {
      updates.description = data.description.trim();
      fieldsUpdated++;
    }

    if (data.category?.trim()) {
      updates.category = data.category.trim();
      fieldsUpdated++;
    }

    if (data.paymentmethod?.trim()) {
      updates.paymentmethod = data.paymentmethod.trim();
      fieldsUpdated++;
    }

    // 🎯 MANEJO MEJORADO DE FECHAS
    if (data.date) {
      try {
        const extractedDate = new Date(data.date);
        if (!isNaN(extractedDate.getTime())) {
          const dateField = formState.isPaid ? 'date' : 'dueDate';
          updates[dateField] = extractedDate.toISOString();
          fieldsUpdated++;
        }
      } catch (error) {
        console.warn("Error procesando fecha OCR:", error);
      }
    }

    // 🎯 APLICAR MERCHANT NAME SI NO HAY DESCRIPCIÓN
    if (data.merchantName && !updates.description && !formState.description) {
      updates.description = `Compra en ${data.merchantName}`;
      fieldsUpdated++;
    }

    if (fieldsUpdated > 0) {
      updateFormState(updates);
      showToast(
        "success",
        "¡Datos extraídos!",
        `Se completaron ${fieldsUpdated} campos automáticamente`
      );
    } else {
      showToast(
        "info",
        "Comprobante procesado",
        "No se encontraron datos válidos para completar"
      );
    }
  }, [updateFormState, formState.isPaid, formState.description, showToast]);

  // 🎯 MANEJO DE SCANNER
  const handleOpenScanner = useCallback(() => {
    setShowScanner(true);
  }, []);

  const handleScannerClose = useCallback(() => {
    setShowScanner(false);
  }, []);

  // 🎯 RESET AL VOLVER A LA PANTALLA
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup si es necesario
      };
    }, [])
  );

  // 🎯 RENDER PRINCIPAL
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* 🎯 HEADER ANIMADO */}
            <Animated.View style={[styles.headerContainer, animatedHeaderStyle]}>
              <Text style={styles.title}>Agregar</Text>
              
              {/* 🎯 SLIDER DE TIPOS */}
              <View style={styles.sliderContainer}>
                <AgregarSlides
                  colors={TRANSACTION_COLORS}
                  onChange={handleSliderChange}
                />
              </View>

              {/* 🎯 BOTÓN DE SCANNER MEJORADO */}
              <View style={styles.scanButtonContainer}>
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={handleOpenScanner}
                  activeOpacity={0.8}
                >
                  <Ionicons name="scan" size={24} color="#FFF" />
                  <Text style={styles.scanButtonText}>Escanear Comprobante</Text>
                </TouchableOpacity>
                
                {__DEV__ && (
                  <View style={styles.ocrStatusContainer}>
                    <OCRStatusIndicator showDetails={false} />
                  </View>
                )}
              </View>

              {/* 🎯 CAROUSEL MEJORADO */}
              <View style={styles.carouselContainer}>
                <Carousel
                  title={`${formState.selectedOption} Frecuentes`}
                  items={frequentTransactions}
                  onSelectItem={handleSelectFrequent} // 🔥 Mejor prop name
                  emptyMessage={`No hay ${formState.selectedOption.toLowerCase()} frecuentes`}
                  hideIfEmpty={true}
                  loading={loadingFrequent}
                />
              </View>
            </Animated.View>

            {/* 🎯 FORMULARIO PRINCIPAL */}
            <View style={styles.formContainer}>
              
              {/* 🎯 INPUT DE MONTO */}
              <View style={styles.inputSection}>
                <AmountInput
                  ref={amountInputRef}
                  value={formState.amount}
                  onChangeText={(value) => updateFormState({ amount: value })}
                  isValid={formValidation.fieldValidation.amount}
                />
              </View>

              {/* 🎯 INPUT DE DESCRIPCIÓN */}
              <View style={styles.inputSection}>
                <DescriptionInput
                  value={formState.description}
                  onChangeText={(value) => updateFormState({ description: value })}
                  placeholder={`Describe tu ${formState.selectedOption.toLowerCase()}...`}
                />
              </View>

              {/* 🎯 OPCIONES DE TRANSACCIÓN */}
              <TransactionOptions
                type={TRANSACTION_MAPPING[formState.selectedOption]}
                onSelectFrequent={(frequent) => updateFormState({ frequent })}
                onSelectStatus={handleStatusChange}
                initialFrequent={formState.frequent}
                initialStatus={formState.isPaid}
                statusReadOnly={statusReadOnly}
              />

              {/* 🎯 SELECTOR DE CATEGORÍA */}
              <View style={styles.inputSection}>
                <CategorySelector
                  type={TRANSACTION_MAPPING[formState.selectedOption]}
                  onSelect={(category) => updateFormState({ category })}
                  selectedCategory={formState.category}
                  isValid={formValidation.fieldValidation.category}
                />
              </View>

              {/* 🎯 SELECTOR DE MÉTODO DE PAGO */}
              <View style={styles.inputSection}>
                <PaymentMethodSelector
                  type={TRANSACTION_MAPPING[formState.selectedOption]}
                  onSelect={(paymentmethod) => updateFormState({ paymentmethod })}
                  isPending={!formState.isPaid}
                  selectedPaymentMethod={formState.paymentmethod}
                />
              </View>

              {/* 🎯 SELECTOR DE FECHA */}
              <View style={styles.inputSection}>
                <DateTimeSelector
                  selectedDate={formState.isPaid ? formState.date : formState.dueDate}
                  onSelectDate={(date) => {
                    const field = formState.isPaid ? 'date' : 'dueDate';
                    updateFormState({ [field]: date });
                  }}
                  title={formState.isPaid ? "Fecha y hora" : "Fecha y hora de vencimiento"}
                  isPaid={formState.isPaid}
                  disabled={false}
                />
              </View>

              {/* 🎯 BOTÓN DE AGREGAR MEJORADO */}
              <Animated.View style={[styles.addButtonContainer, animatedButtonStyle]}>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: TRANSACTION_COLORS[formState.selectedOption],
                      opacity: (!formValidation.isValid || isSubmitting) ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleCreateTransaction}
                  disabled={creating || !formValidation.isValid || isSubmitting}
                  activeOpacity={0.8}
                >
                  <View style={styles.addButtonContent}>
                    <View style={styles.addIconContainer}>
                      <Ionicons 
                        name={creating ? "hourglass" : "add"} 
                        size={20} 
                        color="#FFF" 
                      />
                    </View>
                    <Text style={styles.addButtonText}>
                      {creating ? "Agregando..." : "Agregar"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* 🎯 SCANNER MODAL */}
      <ReceiptScanner
        visible={showScanner}
        onClose={handleScannerClose}
        onDataExtracted={handleReceiptDataExtracted}
      />
    </SafeAreaView>
  );
}

// 🎯 ESTILOS OPTIMIZADOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scrollContent: {
    backgroundColor: "#FFF",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: "Outfit_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  scanButtonContainer: {
    marginVertical: 16,
    alignItems: "center",
    position: "relative",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scanButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    marginLeft: 8,
  },
  ocrStatusContainer: {
    position: "absolute",
    top: -8,
    right: -8,
    zIndex: 10,
  },
  carouselContainer: {
    marginTop: 8,
    overflow: "visible",
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  inputSection: {
    marginBottom: 20,
  },
  addButtonContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  addButton: {
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  addIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addButtonText: {
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    color: "#FFF",
  },
});