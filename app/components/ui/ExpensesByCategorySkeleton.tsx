// components/ui/ExpensesByCategorySkeleton.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { globalStyles } from '@/app/styles/globalStyles';

const { width } = Dimensions.get('window');
const CHART_SIZE = width * 0.7;

/**
 * Skeleton loader para la sección de Gastos por Categoría
 * Muestra una versión simplificada del componente mientras se cargan los datos
 */
const ExpensesByCategorySkeleton: React.FC = () => {
  // Generar array de filtros para loopear sobre ellos de manera tipada
  const filterOptions: string[] = ['Este mes', '3 Meses', '6 Meses', '2025'];
  
  // Generar arrays tipados para los elementos de la leyenda
  const leftLegendItems: number[] = [1, 2, 3];
  const rightLegendItems: number[] = [1, 2, 3];

  return (
    <View style={globalStyles.sectionContainer}>
      {/* Filtros de período */}
      <View style={styles.filterContainer}>
        {filterOptions.map((option, index) => (
          <SkeletonLoader
            key={`filter-${index}`}
            width={80}
            height={36}
            borderRadius={20}
            style={[
              styles.filterSkeleton,
              // Hacer el primer filtro más destacado (como seleccionado)
              index === 0 && { opacity: 0.8 }
            ]}
          />
        ))}
      </View>

      {/* Gráfico circular y total */}
      <View style={styles.chartContainer}>
        {/* Círculo exterior */}
        <SkeletonLoader
          width={CHART_SIZE}
          height={CHART_SIZE}
          borderRadius={CHART_SIZE / 2}
          style={styles.outerCircle}
        />
        
        {/* Círculo interior (hueco central) */}
        <View style={styles.innerCircleContainer}>
          <View style={styles.innerCircle}>
            {/* Título "Gasto Total" */}
            <SkeletonLoader
              width={100}
              height={20}
              borderRadius={4}
              style={styles.titleSkeleton}
            />
            
            {/* Valor del gasto */}
            <SkeletonLoader
              width={150}
              height={30}
              borderRadius={4}
              style={styles.amountSkeleton}
            />
            
            {/* Mes */}
            <SkeletonLoader
              width={60}
              height={16}
              borderRadius={4}
              style={styles.monthSkeleton}
            />
          </View>
        </View>
      </View>

      {/* Leyenda de categorías */}
      <View style={styles.legendContainer}>
        <View style={styles.legendColumn}>
          {leftLegendItems.map((_, index) => (
            <View key={`legend-left-${index}`} style={styles.legendItem}>
              <SkeletonLoader
                width={16}
                height={16}
                borderRadius={8}
                style={styles.legendDot}
              />
              <SkeletonLoader
                width={120}
                height={16}
                borderRadius={4}
                style={styles.legendText}
              />
            </View>
          ))}
        </View>
        
        <View style={styles.legendColumn}>
          {rightLegendItems.map((_, index) => (
            <View key={`legend-right-${index}`} style={styles.legendItem}>
              <SkeletonLoader
                width={16}
                height={16}
                borderRadius={8}
                style={styles.legendDot}
              />
              <SkeletonLoader
                width={120}
                height={16}
                borderRadius={4}
                style={styles.legendText}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterSkeleton: {
    marginRight: 8,
    marginBottom: 8,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    height: CHART_SIZE,
    position: 'relative',
  },
  outerCircle: {
    position: 'relative',
    zIndex: 1,
  },
  innerCircleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  innerCircle: {
    width: CHART_SIZE * 0.6,
    height: CHART_SIZE * 0.6,
    borderRadius: (CHART_SIZE * 0.6) / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // Agregar sombra para dar efecto de elevación
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  titleSkeleton: {
    marginBottom: 12,
  },
  amountSkeleton: {
    marginBottom: 8,
  },
  monthSkeleton: {
    marginTop: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  legendColumn: {
    width: '48%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  legendDot: {
    marginRight: 10,
  },
  legendText: {
    flex: 1,
  },
});

export default ExpensesByCategorySkeleton;