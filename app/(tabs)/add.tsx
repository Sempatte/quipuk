import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
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
  ViewStyle,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@apollo/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

// Importaciones de componentes
import AgregarSlides from "@/app/components/ui/AddSlider";
import Carousel from "@/app/components/ui/Carousel";
import AmountInput from "@/app/components/ui/AmountInput";
import DescriptionInput from "@/app/components/ui/DescriptionInput";
import TransactionOptions from "@/app/components/ui/TransactionOptions";
import CategorySelector from "@/app/components/ui/CategorySelector";
import PaymentMethodSelector from "@/app/components/ui/PaymentMethodSelector";
import DateTimeSelector from "@/app/components/ui/DateTimeSelector";
import ReceiptScanner from "@/app/components/ui/ReceiptScanner";
import OCRStatusIndicator from "@/app/components/ui/OCRStatusIndicator";

// Importaciones de GraphQL
import {
  GET_TRANSACTIONS,
  CREATE_TRANSACTION,
  GET_FREQUENT_TRANSACTIONS,
} from "../graphql/transaction.graphql";

// Importaciones de Interfaces y Hooks
import {
  TransactionOption,
  TRANSACTION_COLORS,
  FrequentTransactionsData,
} from "../interfaces/transaction.interface";
import { useTransactionForm } from "@/app/hooks/useTransactionForm";
import { getCategoryIcon } from "../constants/categoryIcons";
import { RootStackParamList } from "../interfaces/navigation.type";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ExtractedReceiptData } from "../services/integratedOCRService";
import { useToast } from "../providers/ToastProvider";
import { StatusBarManager, StatusBarPresets } from "@/app/components/ui/StatusBarManager";
import styles from "../styles/addScreen.styles";

// 🎯 INTERFACES
interface AddTransactionRouteParams {
  forcePaymentStatus?: "pending" | "completed";
  statusReadOnly?: boolean;
  preselectedTab?: TransactionOption;
  openScanner?: boolean; // Nuevo
  timestamp?: number; // Nuevo
}

// ✅ Interfaz para los datos que usamos internamente
interface FrequentTransactionItem {
  amount: string;
  description?: string;
  title: string;
}

// ✅ Interfaz que coincide exactamente con lo que espera el Carousel
interface CarouselItemData {
  id: string;
  title: string;
  description: string;
  type: string;
  amount: string;
  icon: JSX.Element;
  backgroundColor: string;
}

type AddTransactionNavigationProp = NativeStackNavigationProp<RootStackParamList, "movements">;

// 🎯 CONSTANTES
const COLOR_INDEX_MAP: Record<TransactionOption, number> = {
  Gastos: 0,
  Ingresos: 1,
  Ahorros: 2,
};

export default function AddTransactionWithHook() {
  // 🎯 HOOKS BÁSICOS
  const { showToast } = useToast();
  const navigation = useNavigation<AddTransactionNavigationProp>();
  const route = useRoute<RouteProp<Record<string, AddTransactionRouteParams>, string>>();

  // 🎯 PARÁMETROS DE RUTA
  const { forcePaymentStatus, statusReadOnly, preselectedTab } = route.params || {};

  // 🎯 HOOK PERSONALIZADO PARA EL FORMULARIO
  const {
    formState,
    validation,
    updateFormState,
    resetForm,
    applyOCRData,
    prepareTransactionData,
    handleSliderChange,
    handleStatusChange,
    handleFrequentSelection,
    transactionType,
  } = useTransactionForm({
    preselectedTab,
    forcePaymentStatus,
  });

  // 🎯 REFS Y ESTADO LOCAL
  const scrollRef = useRef<ScrollView>(null);
  const amountInputRef = useRef<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  // 🎯 VALORES ANIMADOS
  const colorValue = useSharedValue(COLOR_INDEX_MAP[formState.selectedOption]);
  const buttonScale = useSharedValue(1);

  // Efecto para abrir el scanner cuando se navega con el parámetro openScanner
  useEffect(() => {
    if (route.params?.openScanner && route.params?.timestamp) {
      setShowScanner(true);
      // Limpiar los parámetros para que no se vuelva a activar
      navigation.setParams({ openScanner: undefined, timestamp: undefined } as any);
    }
  }, [route.params?.openScanner, route.params?.timestamp, navigation]);

  // 🎯 CONSULTA DE TRANSACCIONES FRECUENTES
  const { data: frequentData, loading: loadingFrequent } = useQuery<FrequentTransactionsData>(
    GET_FREQUENT_TRANSACTIONS,
    {
      variables: {
        type: transactionType,
        frequent: true,
      },
      fetchPolicy: "cache-first",
      skip: !formState.selectedOption,
    }
  );

  // 🎯 MUTACIÓN DE CREACIÓN
  const [createTransaction, { loading: creating }] = useMutation(CREATE_TRANSACTION, {
    refetchQueries: [
      { query: GET_TRANSACTIONS },
      {
        query: GET_FREQUENT_TRANSACTIONS,
        variables: { type: transactionType, frequent: true },
      },
    ],
    onCompleted: () => {
      resetForm(true);

      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      navigation.navigate("movements", { shouldRefresh: true });
      showToast("success", "¡Éxito!", "Transacción agregada correctamente");
    },
    onError: (error) => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      showToast("error", "Error", error.message);
    },
  });

  // 🎯 TRANSFORMACIÓN DE TRANSACCIONES FRECUENTES
  const frequentTransactions = useMemo((): CarouselItemData[] => {
    if (!frequentData?.frequentTransactions) return [];

    return frequentData.frequentTransactions.map(transaction => ({
      id: transaction.id.toString(),
      title: transaction.title,
      description: transaction.description || "", // ✅ Siempre string
      type: transaction.type,
      amount: `S/ ${transaction.amount.toFixed(2)}`,
      icon: getCategoryIcon(transaction.category, transaction.type),
      backgroundColor: transaction.type === "gasto" ? "#FCE4EC" : "#E3F2FD",
    }));
  }, [frequentData]);

  // 🎯 MANEJO MEJORADO DEL SLIDER
  const handleSliderChangeWithAnimation = useCallback((value: TransactionOption) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    handleSliderChange(value);
    colorValue.value = withSpring(COLOR_INDEX_MAP[value], {
      damping: 15,
      stiffness: 150,
    });
  }, [handleSliderChange, colorValue]);

  // 🎯 ESTILOS ANIMADOS
  const animatedHeaderStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorValue.value,
      [0, 1, 2],
      Object.values(TRANSACTION_COLORS)
    );
    return { backgroundColor };
  });

  // ✅ CORRECTO - Solución 2: Usar el tipo correcto de Reanimated
  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: buttonScale.value }
      ]
    } as any; // Para Reanimated 2.17.0
  });



  // 🎯 CREACIÓN DE TRANSACCIÓN SIMPLIFICADA
  const handleCreateTransaction = useCallback(async () => {
    if (!validation.isValid) {
      const errorMessage = validation.errors.join(", ");
      showToast("error", "Formulario incompleto", errorMessage);

      scrollRef.current?.scrollTo({ y: 0, animated: true });
      if (!validation.fieldValidation.amount) {
        setTimeout(() => amountInputRef.current?.focus(), 300);
      }
      return;
    }

    buttonScale.value = withSpring(0.95);

    try {
      const storedUserId = await AsyncStorage.getItem("userId");
      if (!storedUserId) {
        throw new Error("No se pudo obtener el ID del usuario");
      }

      const userId = parseInt(storedUserId, 10);
      const transactionInput = prepareTransactionData(userId);

      await createTransaction({ variables: { input: transactionInput } });

    } catch (error: any) {
      console.error("❌ Error al crear transacción:", error);
      showToast("error", "Error", error.message || "Hubo un problema al agregar la transacción");
    } finally {
      buttonScale.value = withSpring(1);
    }
  }, [validation, showToast, prepareTransactionData, createTransaction, buttonScale]);

  // 🎯 MANEJO OPTIMIZADO DE DATOS OCR
  const handleReceiptDataExtracted = useCallback((data: ExtractedReceiptData) => {
    setShowScanner(false);

    const fieldsUpdated = applyOCRData(data);

    if (fieldsUpdated > 0) {
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
  }, [applyOCRData, showToast]);

  // 🎯 HANDLER PARA SELECCIÓN DEL CAROUSEL
  const handleCarouselSelect = useCallback((item: any) => {
    // ✅ Crear el objeto que espera handleFrequentSelection
    const frequentItem: FrequentTransactionItem = {
      amount: item.amount || "0.00",
      description: item.description || "",
      title: item.title,
    };

    handleFrequentSelection(frequentItem);

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [handleFrequentSelection]);

  // 🎯 HANDLERS DE SCANNER
  const handleOpenScanner = useCallback(() => setShowScanner(true), []);
  const handleScannerClose = useCallback(() => setShowScanner(false), []);

  // 🎯 RENDER PRINCIPAL
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBarManager {...StatusBarPresets.tabs} />
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

              <View style={styles.sliderContainer}>
                <AgregarSlides
                  colors={TRANSACTION_COLORS}
                  onChange={handleSliderChangeWithAnimation}
                />
              </View>



              {/* ✅ CAROUSEL CON HANDLER SIMPLIFICADO */}
              <View style={styles.carouselContainer}>
                <Carousel
                  title={`${formState.selectedOption} Frecuentes`}
                  items={frequentTransactions}
                  onSelectItem={handleCarouselSelect}
                  emptyMessage={`No hay ${formState.selectedOption.toLowerCase()} frecuentes`}
                  hideIfEmpty={true}
                />
              </View>
            </Animated.View>

            {/* 🎯 FORMULARIO PRINCIPAL */}
            <View style={styles.formContainer}>
              {/* <View style={styles.scanButtonContainer}>
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
              </View> */}
              <View style={styles.inputSection}>
                <AmountInput
                  value={formState.amount}
                  onChangeText={(value) => updateFormState({ amount: value })}
                />
              </View>

              <View style={styles.inputSection}>
                <DescriptionInput
                  value={formState.description}
                  onChangeText={(value) => updateFormState({ description: value })}
                />
              </View>

              <TransactionOptions
                type={transactionType}
                onSelectFrequent={(frequent) => updateFormState({ frequent })}
                onSelectStatus={(isPaid) => handleStatusChange(isPaid, statusReadOnly)}
                initialFrequent={formState.frequent}
                initialStatus={formState.isPaid}
                statusReadOnly={statusReadOnly}
              />

              <View style={styles.inputSection}>
                <CategorySelector
                  type={transactionType}
                  onSelect={(category) => updateFormState({ category })}
                  selectedCategory={formState.category}
                />
              </View>

              <View style={styles.inputSection}>
                <PaymentMethodSelector
                  type={transactionType}
                  onSelect={(paymentmethod) => updateFormState({ paymentmethod })}
                  isPending={!formState.isPaid}
                  selectedPaymentMethod={formState.paymentmethod}
                />
              </View>

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

              <Animated.View style={[styles.addButtonContainer, animatedButtonStyle]}>
                <TouchableOpacity
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: TRANSACTION_COLORS[formState.selectedOption],
                      opacity: (!validation.isValid || creating) ? 0.6 : 1,
                    },
                  ]}
                  onPress={handleCreateTransaction}
                  disabled={creating || !validation.isValid}
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

      <ReceiptScanner
        visible={showScanner}
        onClose={handleScannerClose}
        onDataExtracted={handleReceiptDataExtracted}
      />
    </SafeAreaView>
  );
}

// TODO: 1. Si la categoria se detecta en automatico, mostrar el icono de la categoria automaticamente (ya scrolleado). 2. Salga punto indicador de la categoria. 3. En ingresos, cuando se quiera escanear comprobante,debe permitir escanear documentos pdf, por si es un recibo de honorario u otro.