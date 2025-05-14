import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@apollo/client';
import { GET_TRANSACTIONS } from '@/app/graphql/transaction.graphql';
import { useFocusEffect } from '@react-navigation/native';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { globalStyles } from '@/app/styles/globalStyles';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { GetTransactionsData, Transaction } from '@/app/interfaces/transaction.interface';

// Interfaces y tipos
type PeriodFilter = '7 días' | '14 días' | '28 días';

interface HeatmapData {
  data: number[][];
  maxValue: number;
}

// Aumentamos la granularidad a 12 bloques por día (2 horas por bloque)
const HOURS_PER_BLOCK: number = 2;
const BLOCKS_PER_DAY: number = 24 / HOURS_PER_BLOCK;

// Componente principal para el mapa de calor
const SpendingHeatmap: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('28 días');
  
  // Consulta GraphQL para obtener transacciones
  const { data, loading, error, refetch } = useQuery<GetTransactionsData>(GET_TRANSACTIONS, {
    fetchPolicy: 'network-only',
  });

  // Refrescar datos cuando la pantalla recibe el foco
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Procesar datos para el mapa de calor
  const heatmapData: HeatmapData | null = useMemo(() => {
    if (!data?.transactions) return null;

    // Filtrar solo las transacciones de tipo "gasto"
    const expenses = data.transactions.filter(tx => tx.type === 'gasto' && tx.status !== 'pending');

    // Determinar el período de días a mostrar
    const days: number = selectedPeriod === '7 días' ? 7 : selectedPeriod === '14 días' ? 14 : 28;
    const startDate: Date = subDays(new Date(), days);

    // Filtrar por el período seleccionado
    const filteredExpenses: Transaction[] = expenses.filter(tx => {
      const txDate: Date = new Date(tx.createdAt);
      return txDate >= startDate;
    });

    // Inicializar matriz para el mapa de calor con mayor granularidad
    // Días de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
    // Horas del día divididas en bloques de 2 horas (12 bloques en total)
    const heatmap: number[][] = Array(7).fill(0).map(() => Array(BLOCKS_PER_DAY).fill(0));

    // Agrupar gastos por día de la semana y hora con mayor granularidad
    filteredExpenses.forEach(tx => {
      const txDate: Date = new Date(tx.createdAt);
      const dayOfWeek: number = txDate.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
      const hour: number = txDate.getHours();
      const hourIndex: number = Math.floor(hour / HOURS_PER_BLOCK); // 0-11 para bloques de 2 horas
      
      heatmap[dayOfWeek][hourIndex] += tx.amount;
    });

    // Calcular el valor máximo para normalizar los colores
    let maxValue: number = 0;
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < BLOCKS_PER_DAY; hour++) {
        maxValue = Math.max(maxValue, heatmap[day][hour]);
      }
    }

    return {
      data: heatmap,
      maxValue,
    };
  }, [data, selectedPeriod]);

  // Cambiar el período seleccionado
  const handlePeriodChange = (period: PeriodFilter): void => {
    setSelectedPeriod(period);
  };

  // Función para determinar el color basado en la intensidad
  const getHeatColor = (value: number, maxValue: number): string => {
    if (maxValue === 0) return '#FFE5E0'; // Color más claro si no hay datos
    
    // Normalizar el valor entre 0 y 1
    const intensity: number = Math.min(value / maxValue, 1);
    
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

  if (error) {
    return (
      <View style={globalStyles.sectionContainer}>
        <Text style={globalStyles.errorText}>Error al cargar datos</Text>
        <Text style={globalStyles.errorSubtext}>{error.message}</Text>
      </View>
    );
  }

  // Definir etiquetas para los días
  const dayLabels: string[] = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  
  // Definir etiquetas para las horas principales (cada 6 horas)
  const timeLabels: string[] = ['12:00 am', '6:00 am', '12:00 pm', '6:00 pm'];

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

        {/* Leyenda del período */}
        <Text style={styles.periodLabel}>
          Hora local (GMT -0500) | Últimos {selectedPeriod}
        </Text>

        {/* Mapa de calor */}
        {loading || !heatmapData ? (
          <View style={globalStyles.loadingContainer}>
            <Text style={globalStyles.loadingText}>Cargando datos...</Text>
          </View>
        ) : (
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
                    {/* Para cada día (7 días) */}
                    {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                      <View key={`day-${day}-slot-${timeSlot}`} style={styles.dayCells}>
                        {/* Para cada hora en la franja (3 horas por franja) */}
                        {[0, 1, 2].map((hourOffset) => {
                          const hourIndex: number = timeSlot * 3 + hourOffset;
                          const value: number = 
                            hourIndex < BLOCKS_PER_DAY 
                              ? heatmapData.data[day][hourIndex] 
                              : 0;
                          
                          return (
                            <View
                              key={`cell-${day}-${hourIndex}`}
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
    width: 75,
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
    height: 72, // Altura para acomodar 3 celdas de altura (3 * 24)
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 12,
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
  },
  heatCell: {
    height: 22,
    marginHorizontal: 1,
    marginVertical: 1,
    borderRadius: 2,
  },
});

export default SpendingHeatmap;