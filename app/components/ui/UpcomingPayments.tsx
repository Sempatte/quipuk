import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ListRenderItemInfo,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useMutation, useQuery } from "@apollo/client";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";
import { GET_PENDING_TRANSACTIONS } from "@/app/graphql/transaction.graphql";
import { getTransactionIcon } from "@/app/constants/categoryIcons";
import { useFocusEffect } from "@react-navigation/native";
import UpcomingPaymentsSkeleton from "./UpcomingPaymentsSkeleton";
import PaymentConfirmationModal from "./PaymentConfirmationModal";
import NewPaymentCard from "./NewPaymentCard";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/app/interfaces/navigation.type";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = width - 80;
const ITEM_SPACING = 20;

interface PendingTransaction {
  id: number;
  title: string;
  description: string;
  amount: number;
  type: "gasto";
  category: string;
  status: "pending";
  dueDate: string;
  createdAt: string;
}

interface GetPendingTransactionsData {
  getTransactions: PendingTransaction[];
}

type AddTrxScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "add"
>;

// Props para recibir el refreshTrigger
interface UpcomingPaymentsProps {
  refreshTrigger?: number;
}

const UpcomingPayments: React.FC<UpcomingPaymentsProps> = ({ refreshTrigger }) => {
  const navigation = useNavigation<AddTrxScreenNavigationProp>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estado para el modal de confirmación
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<PendingTransaction | null>(null);

  const { data, loading, error, refetch } =
    useQuery<GetPendingTransactionsData>(GET_PENDING_TRANSACTIONS, {
      fetchPolicy: 'cache-first',
      notifyOnNetworkStatusChange: true,
    });

  // Refrescar datos cuando cambia el refreshTrigger
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setIsRefreshing(true);
      
      refetch().finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [refreshTrigger, refetch]);

  // Calcular el texto de vencimiento
  const getDueDateText = (date: string) => {
    if (!date) return "Fecha no disponible";

    try {
      const dueDate = new Date(date);

      if (isToday(dueDate)) {
        return "Vence hoy";
      } else if (isTomorrow(dueDate)) {
        return "Vence mañana";
      } else {
        const daysLeft = differenceInDays(dueDate, new Date());
        if (daysLeft < 0) {
          return `Vencido hace ${Math.abs(daysLeft)} días`;
        }
        return `Faltan ${daysLeft} días`;
      }
    } catch (e) {
      console.error("Error al procesar fecha:", e);
      return "Error en fecha";
    }
  };

  // Calcular días restantes para ordenamiento
  const calculateDaysLeft = (date: string): number => {
    if (!date) return Infinity; // Si no hay fecha, ponerlo al final

    try {
      const dueDate = new Date(date);
      return differenceInDays(dueDate, new Date());
    } catch {
      return Infinity; // En caso de error, ponerlo al final
    }
  };

  // Función para navegar a la pantalla de programar nuevo pago
  const handleNavigateToNewPayment = () => {
    // Navegamos a la pantalla de añadir transacción con parámetros específicos
    navigation.navigate("add", {
      forcePaymentStatus: "pending",
      statusReadOnly: true, // Indica que el estado no se puede cambiar
      preselectedTab: "Gastos", // Preseleccionar la pestaña de gastos
    });
  };

  // Ordenar transacciones por fecha de vencimiento (más cercanas primero)
  const sortedTransactions = useMemo(() => {
    if (!data?.getTransactions) return [];

    // Hacer una copia para no mutar los datos originales
    return [...data.getTransactions].sort((a, b) => {
      // Primero los vencidos (días negativos)
      const daysLeftA = calculateDaysLeft(a.dueDate);
      const daysLeftB = calculateDaysLeft(b.dueDate);

      // Si uno está vencido y el otro no
      const aIsOverdue = daysLeftA < 0;
      const bIsOverdue = daysLeftB < 0;

      if (aIsOverdue && !bIsOverdue) return -1; // A vencido va primero
      if (!aIsOverdue && bIsOverdue) return 1; // B vencido va primero

      // Si ambos están vencidos, el más vencido (número más negativo) va primero
      if (aIsOverdue && bIsOverdue) return daysLeftA - daysLeftB;

      // Si ninguno está vencido, el más cercano a vencer va primero
      return daysLeftA - daysLeftB;
    });
  }, [data?.getTransactions]);

  // Función para determinar el color del punto indicador según los días restantes
  const getDotColor = (daysLeft: number) => {
    // AJUSTE: Si faltan más de 5 días: verde, en caso contrario o vencido: rojo
    return daysLeft > 5 ? "#4CAF50" : "#FF0000";
  };

  // Función para marcar un pago como completado
  const handleMarkAsPaid = (payment: PendingTransaction) => {
    // Guardar el pago seleccionado y mostrar el modal
    setSelectedPayment(payment);
    setConfirmModalVisible(true);
  };

  // Función para procesar la confirmación de pago
  const handleConfirmPayment = () => {
    if (selectedPayment) {
      // Aquí iría la lógica para marcar el pago como completado en el backend
      

      // Cerrar el modal y refrescar datos
      setConfirmModalVisible(false);
      setSelectedPayment(null);
      refetch();
    }
  };

  // Renderizar cada pago pendiente
  const renderPayment = ({ item }: ListRenderItemInfo<PendingTransaction>) => {
    // Validar que dueDate existe antes de usarlo
    if (!item.dueDate) {
      console.warn(`Item ${item.id} no tiene dueDate definido:`, item);
    }

    // Usar dueDate en lugar de createdAt, con validación
    const formattedDate = item.dueDate
      ? format(new Date(item.dueDate), "d MMM", { locale: es })
      : "Fecha no disponible";

    const categoryIcon = getTransactionIcon(item.category, "gasto");
    const dueText = getDueDateText(item.dueDate);
    const dueDateText = `Vence: ${formattedDate}`;

    // Determinar color según si está vencido o próximo a vencer
    const daysLeft = calculateDaysLeft(item.dueDate);
    
    // AJUSTE: Color del texto - negro si faltan más de 5 días, rojo si no
    const dueDateColor = daysLeft > 5 ? "#000000" : "#FF0000";

    // Obtener color del punto indicador basado en los días restantes
    const dotColor = getDotColor(daysLeft);

    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View
            style={[
              styles.categoryIconContainer,
              { backgroundColor: getIconBackground(item.category) },
            ]}
          >
            {categoryIcon}
          </View>
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryTitle}>{item.description}</Text>
            <Text style={styles.categorySubtitle}>{item.category}</Text>
          </View>
        </View>

        <Text style={styles.amountText}>S/ {item.amount.toFixed(0)}</Text>

        <View style={styles.dueDateContainer}>
          <View style={[styles.dueDateDot, { backgroundColor: dotColor }]} />
          <Text style={[styles.dueDateText, { color: dueDateColor }]}>
            {dueDateText}
          </Text>
        </View>
        <Text style={[styles.dueSubtext, daysLeft <= 5 && styles.overdueText]}>
          {dueText}
        </Text>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.buttonPaid}
            onPress={() => handleMarkAsPaid(item)}
          >
            <Text style={styles.buttonPaidText}>Pagado</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonPending}
            onPress={() => {
              // Aquí iría la lógica para mantener como pendiente
              
            }}
          >
            <Text style={styles.buttonPendingText}>Pendiente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Obtener color de fondo para el ícono según la categoría
  const getIconBackground = (category: string) => {
    const categoryColors: Record<string, string> = {
      Alquiler: "#4CAF50",
      Transporte: "#2196F3",
      Deducibles: "#9C27B0",
      Otros: "#FF9800",
      Hogar: "#00BCD4",
      Comida: "#F44336",
      Salud: "#E91E63",
      Super: "#8BC34A",
      Teléfono: "#3F51B5",
      Deudas: "#9C27B0",
      "Servicios básicos": "#00BCD4",
    };

    return categoryColors[category] || "#00C1D5";
  };

  // Indicadores de página
  const renderDots = () => {
    // Si no hay transacciones, no mostrar puntos
    if (!sortedTransactions || sortedTransactions.length === 0) return null;

    // +1 para incluir el card de nuevo pago
    const totalItems = sortedTransactions.length + 1;
    if (totalItems <= 1) return null;

    const dots = [];
    for (let i = 0; i < totalItems; i++) {
      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            i === activeIndex ? styles.activeDot : styles.inactiveDot,
          ]}
        />
      );
    }

    return <View style={styles.dotsContainer}>{dots}</View>;
  };

  // Manejar cambio de slide
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (ITEM_WIDTH + ITEM_SPACING));
    setActiveIndex(index);
  };

  // Crear la lista completa de elementos para el FlatList
  const getCarouselItems = useCallback(() => {
    // Si no hay transacciones, mostrar solo el card de nuevo pago
    if (!sortedTransactions || sortedTransactions.length === 0) {
      return [{ id: "new-payment", type: "new-payment" }];
    }

    // Combinar las transacciones con el card de nuevo pago
    return [...sortedTransactions, { id: "new-payment", type: "new-payment" }];
  }, [sortedTransactions]);

  // Renderizar cada elemento del carousel (pagos o nuevo pago)
  const renderCarouselItem = useCallback(
    ({ item }: any) => {
      // Si es el card de nuevo pago
      if (item.type === "new-payment") {
        return <NewPaymentCard onPress={handleNavigateToNewPayment} />;
      }

      // Si es un pago pendiente normal
      return renderPayment({ item } as ListRenderItemInfo<PendingTransaction>);
    },
    [renderPayment, handleNavigateToNewPayment]
  );

  // Determinar si está cargando (carga inicial o refresco)
  const isLoading = loading || isRefreshing;

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error al cargar los pagos pendientes
        </Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  // Si no hay datos pero está cargando, mostrar skeleton
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Próximos pagos</Text>
        <View style={styles.skeletonContainer}>
          <UpcomingPaymentsSkeleton count={1} />
        </View>
      </View>
    );
  }

  // Obtenemos los elementos del carousel (pagos + nuevo pago)
  const carouselItems = getCarouselItems();

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Próximos pagos</Text>

      <FlatList
        ref={flatListRef}
        data={carouselItems}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        snapToInterval={ITEM_WIDTH + ITEM_SPACING}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: ITEM_SPACING }} />}
        getItemLayout={(data, index) => ({
          length: ITEM_WIDTH + ITEM_SPACING,
          offset: (ITEM_WIDTH + ITEM_SPACING) * index,
          index,
        })}
      />

      {renderDots()}

      {/* Modal de confirmación de pago */}
      {selectedPayment && (
        <PaymentConfirmationModal
          visible={confirmModalVisible}
          onClose={() => {
            setConfirmModalVisible(false);
            setSelectedPayment(null);
          }}
          onConfirm={handleConfirmPayment}
          amount={selectedPayment.amount}
          title={selectedPayment.title}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 25,
    marginBottom: 15,
    color: "#000",
    fontFamily: "Outfit_600SemiBold",
  },
  paymentCard: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    width: ITEM_WIDTH,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  categoryIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: "Outfit_600SemiBold",
    color: "#000",
  },
  categorySubtitle: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },
  amountText: {
    fontSize: 26,
    fontFamily: "Outfit_700Bold",
    color: "#000",
    marginBottom: 15,
  },
  dueDateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  dueDateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF5252",
    marginRight: 8,
  },
  dueDateText: {
    fontSize: 16,
    color: "#000",
    fontFamily: "Outfit_500Medium",
  },
  dueSubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    fontFamily: "Outfit_400Regular",
  },
  overdueText: {
    color: "#FF0000",
    fontWeight: "bold",
  },
  buttonsContainer: {
    flexDirection: "row",
    marginTop: 5,
  },
  buttonPaid: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#CCC",
    alignItems: "center",
    marginRight: 8,
  },
  buttonPending: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: "#FF5252",
    alignItems: "center",
  },
  buttonPaidText: {
    color: "#666",
    fontFamily: "Outfit_500Medium",
  },
  buttonPendingText: {
    color: "#FFF",
    fontFamily: "Outfit_500Medium",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: "#000",
  },
  inactiveDot: {
    backgroundColor: "#CCC",
  },
  listContent: {
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  skeletonContainer: {
    paddingVertical: 5,
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: "#FF5252",
    textAlign: "center",
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 15,
  },
  emptyText: {
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },
});

export default React.memo(UpcomingPayments);