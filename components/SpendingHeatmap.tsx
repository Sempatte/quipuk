import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_TRANSACTIONS } from '@/app/graphql/transaction.graphql';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { globalStyles } from '@/app/styles/globalStyles';

// Tipos para los filtros de período
type PeriodFilter = '7 días' | '14 días' | '28 días';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  createdAt: string;
  status?: string;
}

// Props para recibir el refreshTrigger
interface SpendingHeatmapProps {
  refreshTrigger?: number;
}

const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({ refreshTrigger }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('28 días');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Consulta GraphQL para obtener transacciones
  const { data, loading, error, refetch } = useQuery(GET_TRANSACTIONS, {
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  });

  // Refrescar datos cuando cambia el refreshTrigger
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      setIsRefreshing(true);
      
      refetch().finally(() => {
        setIsRefreshing(false);
        if (__DEV__) console.log('SpendingHeatmap refrescado por trigger:', refreshTrigger);
      });
    }
  }, [refreshTrigger, refetch]);

  // Refrescar datos cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Procesar datos para el mapa de calor
  const heatmapData = useMemo(() => {
    if (!data?.transactions) return null;

    // Filtrar solo las transacciones de tipo "gasto"
    const expenses = data.transactions.filter((tx: Transaction) => 
      tx.type === 'gasto' && tx.status !== 'pending'
    );

    // Determinar el período de días a mostrar
    const days = selectedPeriod === '7 días' ? 7 : selectedPeriod === '14 días' ? 14 : 28;
    const startDate = subDays(new Date(), days);

    // Filtrar por el período seleccionado
    const filteredExpenses = expenses.filter((tx: Transaction) => {
      const txDate = new Date(tx.createdAt);
      return txDate >= startDate;
    });

    // Inicializar matriz para el mapa de calor - 7 días x 24 horas
    const heatmap = Array(7).fill(0).map(() => Array(24).fill(0));

    // Agrupar gastos por día de la semana y hora
    filteredExpenses.forEach((tx: Transaction) => {
      const txDate = new Date(tx.createdAt);
      const dayOfWeek = txDate.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
      const hour = txDate.getHours(); // 0-23
      
      heatmap[dayOfWeek][hour] += tx.amount;
    });

    // Calcular el valor máximo para normalizar los colores
    let maxValue = 0;
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        maxValue = Math.max(maxValue, heatmap[day][hour]);
      }
    }

    return {
      data: heatmap,
      maxValue,
    };
  }, [data, selectedPeriod]);

  // Cambiar el período seleccionado
  const handlePeriodChange = (period: PeriodFilter) => {
    setSelectedPeriod(period);
  };

  // Función para determinar el color basado en la intensidad
  const getHeatColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return '#FFE5E0'; // Color más claro si no hay datos
    
    // Normalizar el valor entre 0 y 1
    const intensity = Math.min(value / maxValue, 1);
    
    // Definir colores para los diferentes niveles de intensidad con más granularidad
    if (intensity < 0.1) return '#FFE5E0';
    if (intensity < 0.2) return '#FFD7D0';
    if (intensity < 0.3) return '#FFCEC5';
    if (intensity < 0.4) return '#FFBFB5';
    if (intensity < 0.5) return '#FFB0A0';
    if (intensity < 0.6) return '#FF9F90';
    if (intensity < 0.7) return '#FF8F80';
    if (intensity < 0.8) return '#FF7F6A';
    if (intensity < 0.9) return '#FF6F5A';
    return '#E86F51';
  };

  // Determinar si está cargando (carga inicial o refresco)
  const isLoading = loading || isRefreshing;

  if (error) {
    return (
      <View style={globalStyles.sectionContainer}>
        <Text style={globalStyles.errorText}>Error al cargar datos</Text>
        <Text style={globalStyles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  // Para representar los datos agrupados en la UI, los agrupamos en 4 franjas principales
  // pero mantenemos los 24 bloques por día en los datos para mayor precisión
  const renderHeatmap = () => {
    if (!heatmapData) return null;

    // Cambiar el orden de los días: Lunes (1) a Domingo (0) en lugar de Domingo (0) a Sábado (6)
    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    // Índices ajustados para el nuevo orden (1=Lunes, 2=Martes, ..., 0=Domingo)
    const dayIndices = [1, 2, 3, 4, 5, 6, 0];
    
    const timeLabels = ['00:00 am', '06:00 am', '12:00 pm', '06:00 pm'];
    
    return (
      <View style={styles.heatmapContainer}>
        {/* Cabecera con días */}
        <View style={styles.headerRow}>
          <View style={styles.timeColumn}>
            {/* Celda vacía en la esquina superior izquierda */}
          </View>
          <View style={styles.daysRow}>
            {dayLabels.map((day, index) => (
              <Text key={`day-${index}`} style={styles.dayLabel}>
                {day}
              </Text>
            ))}
          </View>
        </View>
        
        {/* Contenido del mapa de calor */}
        <View style={styles.heatmapContent}>
          {/* Columna de etiquetas de tiempo */}
          <View style={styles.timeColumn}>
            {timeLabels.map((label, index) => (
              <View key={`time-${index}`} style={styles.timeRow}>
                <Text style={styles.timeLabel}>{label}</Text>
              </View>
            ))}
          </View>
          
          {/* Rejilla del mapa de calor */}
          <View style={styles.heatmapGrid}>
            {/* Para cada franja horaria principal (4 franjas de 6 horas) */}
            {[0, 1, 2, 3].map((timeSlot) => (
              <View key={`timeslot-${timeSlot}`} style={styles.timeSlotRow}>
                {/* Para cada día (7 días), ahora en orden de lunes a domingo */}
                {dayIndices.map((dayIndex, displayIndex) => (
                  <View key={`day-${displayIndex}-slot-${timeSlot}`} style={styles.dayCells}>
                    {/* Para cada hora en la franja (6 horas por franja) */}
                    {[0, 1, 2, 3, 4, 5].map((hourOffset) => {
                      const hourIndex = timeSlot * 6 + hourOffset;
                      // Usar dayIndex para obtener los datos correctos del día
                      const value = hourIndex < 24 ? heatmapData.data[dayIndex][hourIndex] : 0;
                      
                      return (
                        <View
                          key={`cell-${displayIndex}-${hourIndex}`}
                          style={[
                            styles.heatCell,
                            {
                              backgroundColor: getHeatColor(
                                value,
                                heatmapData.maxValue
                              ),
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View>
      <View style={globalStyles.titleContainer}>
        <Text style={globalStyles.sectionTitle}>¿Cuándo gastas más?</Text>
      </View>
      <View style={globalStyles.sectionContainer}>
        {/* Filtros de período */}
        <View style={styles.filterContainer}>
          {(['7 días', '14 días', '28 días'] as PeriodFilter[]).map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.filterButton,
                selectedPeriod === period && styles.selectedFilterButton,
              ]}
              onPress={() => handlePeriodChange(period)}
              activeOpacity={0.7}
              disabled={isLoading} // Deshabilitar durante carga
            >
              <Text
                style={[
                  styles.filterText,
                  selectedPeriod === period && styles.selectedFilterText,
                ]}
              >
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Mapa de calor */}
        {isLoading ? (
          <View style={globalStyles.loadingContainer}>
            <Text style={globalStyles.loadingText}>Cargando datos...</Text>
          </View>
        ) : (
          renderHeatmap()
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    gap: 10,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedFilterButton: {
    backgroundColor: '#00DC5A',
  },
  filterText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666666',
  },
  selectedFilterText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_500Medium',
  },
  periodLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
    fontFamily: 'Outfit_400Regular',
  },
  heatmapContainer: {
    marginTop: 5,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeColumn: {
    width: 60,
  },
  daysRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#333',
    textAlign: 'center',
    width: 30,
  },
  heatmapContent: {
    flexDirection: 'row',
  },
  timeRow: {
    height: 72, // Altura para acomodar 6 celdas de altura (6 * 12)
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    textAlign: 'right',
    paddingRight: 10,
  },
  heatmapGrid: {
    flex: 1,
  },
  timeSlotRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  dayCells: {
    flex: 1,
    justifyContent: 'space-between',
  },
  heatCell: {
    height: 10,
    marginHorizontal: 1,
    marginVertical: 1,
    borderRadius: 1,
  },
});

export default SpendingHeatmap;