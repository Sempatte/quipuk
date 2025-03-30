import React, { useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Dimensions,
  ListRenderItemInfo,
  NativeSyntheticEvent,
  NativeScrollEvent
} from 'react-native';
import { useMutation, useQuery } from '@apollo/client';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import { GET_PENDING_TRANSACTIONS } from '@/app/graphql/transaction.graphql';
import { getTransactionIcon } from '@/app/contants/iconDictionary';
import { useFocusEffect } from '@react-navigation/native';
import UpcomingPaymentsSkeleton from './UpcomingPaymentsSkeleton';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 80;
const ITEM_SPACING = 20;

interface PendingTransaction {
  id: number;
  title: string;
  description: string;
  amount: number;
  type: 'gasto';
  category: string;
  status: 'pending';
  dueDate: string;
  createdAt: string;
}

interface GetPendingTransactionsData {
  getTransactions: PendingTransaction[];
}

const UpcomingPayments = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  const { data, loading, error, refetch } = useQuery<GetPendingTransactionsData>(GET_PENDING_TRANSACTIONS, {
    fetchPolicy: 'network-only' // Forzar que siempre busque del servidor
  });
  
  // Usar useFocusEffect para refrescar datos cuando la pantalla reciba el foco
  useFocusEffect(
    useCallback(() => {
      // Refrescar datos cada vez que la pantalla reciba el foco
      refetch();
      
      return () => {
        // Código de limpieza si es necesario
      };
    }, [refetch])
  );
  
  // Calcular el texto de vencimiento
  const getDueDateText = (date: string) => {
    if (!date) return 'Fecha no disponible';
    
    try {
      const dueDate = new Date(date);
      
      if (isToday(dueDate)) {
        return 'Vence hoy';
      } else if (isTomorrow(dueDate)) {
        return 'Vence mañana';
      } else {
        const daysLeft = differenceInDays(dueDate, new Date());
        if (daysLeft < 0) {
          return `Vencido hace ${Math.abs(daysLeft)} días`;
        }
        return `Faltan ${daysLeft} días`;
      }
    } catch (e) {
      console.error('Error al procesar fecha:', e);
      return 'Error en fecha';
    }
  };

  // Renderizar cada pago pendiente
  const renderPayment = ({ item }: ListRenderItemInfo<PendingTransaction>) => {
    // Validar que dueDate existe antes de usarlo
    if (!item.dueDate) {
      console.warn(`Item ${item.id} no tiene dueDate definido:`, item);
    }
    
    // Usar dueDate en lugar de createdAt, con validación
    const formattedDate = item.dueDate ? 
      format(new Date(item.dueDate), 'd MMM', { locale: es }) : 
      'Fecha no disponible';
      
    const categoryIcon = getTransactionIcon(item.category, 'gasto');
    const dueText = getDueDateText(item.dueDate);
    const dueDateText = `Vence: ${formattedDate}`;
    
    return (
      <View style={styles.paymentCard}>
        <View style={styles.paymentHeader}>
          <View style={[styles.categoryIconContainer, { backgroundColor: getIconBackground(item.category) }]}>
            {categoryIcon}
          </View>
          <View style={styles.categoryDetails}>
            <Text style={styles.categoryTitle}>{item.title}</Text>
            <Text style={styles.categorySubtitle}>{item.category}</Text>
          </View>
        </View>
        
        <Text style={styles.amountText}>S/ {item.amount.toFixed(0)}</Text>
        
        <View style={styles.dueDateContainer}>
          <View style={styles.dueDateDot} />
          <Text style={styles.dueDateText}>{dueDateText}</Text>
        </View>
        <Text style={styles.dueSubtext}>{dueText}</Text>
        
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={styles.buttonPaid}
            onPress={() => {
              // Aquí iría la lógica para marcar como pagado
              console.log('Marcar como pagado:', item.id);
            }}
          >
            <Text style={styles.buttonPaidText}>Pagado</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.buttonPending}
            onPress={() => {
              // Aquí iría la lógica para mantener como pendiente
              console.log('Mantener como pendiente:', item.id);
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
      'Alquiler': '#4CAF50',
      'Transporte': '#2196F3',
      'Deducibles': '#9C27B0',
      'Otros': '#FF9800',
      'Hogar': '#00BCD4',
      'Comida': '#F44336',
      'Salud': '#E91E63',
      'Super': '#8BC34A',
      'Teléfono': '#3F51B5',
      'Deudas': '#9C27B0',
      'Servicios básicos': '#00BCD4',
    };
    
    return categoryColors[category] || '#00C1D5';
  };

  // Indicadores de página
  const renderDots = () => {
    if (!data?.getTransactions || data.getTransactions.length <= 1) return null;
    
    const dots = [];
    for (let i = 0; i < data.getTransactions.length; i++) {
      dots.push(
        <View 
          key={i} 
          style={[
            styles.dot, 
            i === activeIndex ? styles.activeDot : styles.inactiveDot
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

  // Navegar a un índice específico
  const goToIndex = (index: number) => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5
      });
    }
  };

  // Navegar al siguiente o anterior
  const goToNext = () => {
    if (data?.getTransactions && activeIndex < data.getTransactions.length - 1) {
      goToIndex(activeIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (activeIndex > 0) {
      goToIndex(activeIndex - 1);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error al cargar los pagos pendientes</Text>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  if (!data?.getTransactions && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Próximos pagos</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No hay pagos pendientes</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Próximos pagos</Text>
      
      {loading ? (
        // Mostrar skeleton mientras se cargan los datos
        <View style={styles.skeletonContainer}>
          <UpcomingPaymentsSkeleton count={1} />
        </View>
      ) : (
        // Mostrar los datos reales cuando estén disponibles
        <>
          <FlatList
            ref={flatListRef}
            data={data?.getTransactions || []}
            renderItem={renderPayment}
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
        </>
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
    color: '#000',
    fontFamily: 'Outfit_600SemiBold',
  },
  paymentCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    width: ITEM_WIDTH,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#000',
  },
  categorySubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Outfit_400Regular',
  },
  amountText: {
    fontSize: 26,
    fontFamily: 'Outfit_700Bold',
    color: '#000',
    marginBottom: 15,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  dueDateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5252',
    marginRight: 8,
  },
  dueDateText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Outfit_500Medium',
  },
  dueSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontFamily: 'Outfit_400Regular',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  buttonPaid: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCC',
    alignItems: 'center',
    marginRight: 8,
  },
  buttonPending: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#FF5252',
    alignItems: 'center',
  },
  buttonPaidText: {
    color: '#666',
    fontFamily: 'Outfit_500Medium',
  },
  buttonPendingText: {
    color: '#FFF',
    fontFamily: 'Outfit_500Medium',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#000',
  },
  inactiveDot: {
    backgroundColor: '#CCC',
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
    color: '#FF5252',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
  },
  emptyText: {
    color: '#666',
    fontFamily: 'Outfit_400Regular',
  },
});

export default UpcomingPayments;