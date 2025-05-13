import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Easing,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@apollo/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { GET_TRANSACTIONS_BY_USER } from "@/app/graphql/transaction.graphql";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/app/interfaces/navigation";
import { Transaction } from "@/app/interfaces/transaction.interface";
import { getTransactionIcon } from "@/app/contants/iconDictionary";
import EyeIcon from "@/assets/images/icons/eye.svg";
import EyeOffIcon from "@/assets/images/icons/eye-off.svg";
import ChevronDownIcon from "@/assets/images/icons/chevron-down.svg";
import ChevronUpIcon from "@/assets/images/icons/chevron-up.svg";
import TransactionSkeleton from "@/components/ui/TransactionSkeleton";
import { globalStyles } from "@/app/styles/globalStyles";
import { Colors } from "@/constants/Colors";

type MovementsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "movements"
>;

// Tipo para la respuesta de la consulta
interface TransactionsData {
  getTransactions: Transaction[];
}

const MAX_HEIGHT = 300; // Altura máxima del contenedor expandido

const RecentTransactions: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<MovementsNavigationProp>();

  const { data, loading, error, refetch } = useQuery<TransactionsData>(
    GET_TRANSACTIONS_BY_USER,
    { 
      fetchPolicy: 'network-only' // Siempre consultar desde la red
    }
  );

  // Actualizar datos cuando la pantalla gana foco
  useFocusEffect(
    useCallback(() => {
      // Refrescar los datos al entrar a la pantalla
      refetch();
    }, [refetch])
  );

  const toggleExpand = useCallback(() => {
    // Si estamos expandiendo, refrescar los datos
    if (!isExpanded) {
      refetch();
    }

    Animated.timing(animation, {
      toValue: isExpanded ? 0 : 1,
      duration: 300,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    setIsExpanded(!isExpanded);
  }, [isExpanded, animation, refetch]);

  const navigateToAllTransactions = useCallback(() => {
    navigation.navigate("movements");
  }, [navigation]);

  // Transformar transacciones para mostrar solo las últimas 3
  const recentTransactions = useMemo(() => {
    if (!data?.getTransactions || data.getTransactions.length === 0) {
      return [];
    }
    
    // Hacer una copia para no mutar el array original
    const sortedTransactions = [...data.getTransactions];
    
    // Ordenar por fecha (más reciente primero)
    sortedTransactions.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // Orden descendente por fecha
    });
    
    // Tomar los 3 más recientes
    return sortedTransactions.slice(0, 3);
  }, [data]);

  // Altura animada
  const height = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, MAX_HEIGHT],
  });

  const renderTransaction = ({ item }: { item: Transaction }) => {
    // Verificar si el item existe
    if (!item) {
      return (
        <View style={styles.transactionItem}>
          <Text style={globalStyles.errorText}>Datos no disponibles</Text>
        </View>
      );
    }

    // Desestructurar con valores por defecto
    const { 
      description = "", 
      amount = 0, 
      type = "gasto", 
      category = "", 
      createdAt = new Date().toISOString(),
      title = "",
      paymentMethod = "Tarjeta"
    } = item;
    
    // Formato de hora y fecha
    const transactionDate = new Date(createdAt);
    const timeString = format(transactionDate, "hh:mm a", { locale: es }).toLowerCase();
    const dateString = format(transactionDate, "dd MMM yyyy", { locale: es });
    
    // Obtener el ícono correcto según la categoría y tipo
    const categoryIcon = getTransactionIcon(category, type);
    
    // Color y prefijo basado en el tipo
    const isExpense = type === "gasto";
    const amountColor = isExpense ? "#E86F51" : "#000";
    const amountPrefix = isExpense ? "-" : "+";
    const displayText = description || title || "Sin descripción";

    return (
      <View style={styles.transactionItem}>
        <View style={styles.leftContent}>
          <View style={styles.iconContainer}>
            {categoryIcon}
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.transactionTitle} numberOfLines={1}>{displayText}</Text>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{timeString}</Text>
              <Text style={styles.dotSeparator}>·</Text>
              <Text style={styles.dateText}>{dateString}</Text>
            </View>
            <Text style={styles.paymentMethod}>{paymentMethod}</Text>
          </View>
        </View>
        
        <Text style={[styles.transactionAmount, { color: amountColor }]}>
          {amountPrefix} S/{amount.toFixed(2)}
        </Text>
      </View>
    );
  };

  // Renderizar el contenido interno
  const renderContent = () => {
    if (loading) {
      return <TransactionSkeleton count={3} />;
    }

    if (error) {
      return (
        <Text style={globalStyles.errorText}>
          Error al cargar transacciones
        </Text>
      );
    }

    if (recentTransactions.length === 0) {
      return (
        <Text style={styles.noTransactionsText}>
          No hay transacciones recientes
        </Text>
      );
    }

    return (
      <>
        <FlatList
          data={recentTransactions}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          contentContainerStyle={styles.transactionsList}
        />
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={navigateToAllTransactions}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllText}>VER TODOS</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View>
      <View style={globalStyles.titleContainer}>
        <Text style={globalStyles.sectionTitle}>Últimos Movimientos</Text>
      </View>
      <View style={[globalStyles.sectionContainer, { padding: 0 }]}>
        <TouchableOpacity
          style={[
            styles.expandButton,
            isExpanded && styles.expandedButtonContainer,
          ]}
          onPress={toggleExpand}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.expandButtonContent,
              isExpanded && styles.expandedButton,
            ]}
          >
            <View style={styles.expandButtonLeftContent}>
              {isExpanded ? (
                <>
                  <EyeOffIcon width={20} height={20} fill={Colors.chart.income} />
                  <Text style={styles.expandButtonTextActive}>
                    Ocultar movimientos
                  </Text>
                </>
              ) : (
                <>
                  <EyeIcon width={20} height={20} fill="#666" />
                  <Text style={styles.expandButtonText}>
                    Mostrar movimientos
                  </Text>
                </>
              )}
            </View>

            {isExpanded ? (
              <ChevronUpIcon width={18} height={18} fill={Colors.chart.income} />
            ) : (
              <ChevronDownIcon width={18} height={18} fill="#666" />
            )}
          </View>
        </TouchableOpacity>

        <Animated.View style={[styles.animatedContainer, { height }]}>
          <View style={styles.transactionsContainer}>
            {renderContent()}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  expandButton: {
    width: "100%",
    borderRadius: 12,
  },
  expandedButtonContainer: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  expandButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    width: "100%",
  },
  expandButtonLeftContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandedButton: {
    backgroundColor: "#000",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  expandButtonText: {
    fontSize: 20,
    fontFamily: "Outfit_400Regular",
    color: "#000",
    marginLeft: 8,
  },
  expandButtonTextActive: {
    fontSize: 20,
    fontFamily: "Outfit_500Medium",
    color: Colors.chart.income,
    marginLeft: 8,
  },
  animatedContainer: {
    overflow: "hidden",
    backgroundColor: "#FFF",
  },
  transactionsContainer: {
    paddingTop: 15,
    paddingBottom: 15,
  },
  transactionsList: {
    paddingHorizontal: 15,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontFamily: "Outfit_500Medium",
    color: "#000",
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },
  dotSeparator: {
    fontSize: 12,
    color: "#666",
    marginHorizontal: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },
  paymentMethod: {
    fontSize: 12,
    color: "#666",
    fontFamily: "Outfit_400Regular",
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: "Outfit_600SemiBold",
    alignSelf: "center",
  },
  viewAllButton: {
    alignSelf: "center",
    marginTop: 15,
    marginBottom: 5,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: "Outfit_600SemiBold",
    color: "#000",
  },
  noTransactionsText: {
    textAlign: "center",
    color: "#666",
    padding: 15,
    fontStyle: "italic",
  }
});

export default RecentTransactions;