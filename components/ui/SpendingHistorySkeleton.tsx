// components/ui/SpendingHistorySkeleton.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { globalStyles } from '@/app/styles/globalStyles';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 200;

/**
 * Componente skeleton para SpendingHistory
 * Muestra una representación visual de carga mientras se obtienen los datos
 */
const SpendingHistorySkeleton: React.FC = () => {
  // Generar los filtros de período (4 filtros)
  const filterOptions = [1, 2, 3, 4];
  
  // Simular la opción "Este mes" como seleccionada por defecto
  const selectedFilterIndex = 1;

  return (
    <View style={globalStyles.sectionContainer}>
      {/* Filtros de período */}
      <View style={styles.filterContainer}>
        {filterOptions.map((_, index) => (
          <SkeletonLoader
            key={`filter-${index}`}
            width={width / 4.5}
            height={36}
            borderRadius={8}
            style={[
              styles.filterSkeleton,
              // Hacer el primer filtro más destacado (simulando "Este mes" seleccionado)
              index === selectedFilterIndex && { opacity: 0.8, backgroundColor: "#EF674A30" }
            ]}
          />
        ))}
      </View>

      {/* Estadísticas de gastos */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <SkeletonLoader
            width={120}
            height={16}
            borderRadius={4}
            style={styles.statLabelSkeleton}
          />
          <SkeletonLoader
            width={140}
            height={28}
            borderRadius={4}
            style={styles.statValueSkeleton}
          />
        </View>
        
        <View style={[styles.statItem, styles.rightAligned]}>
          <SkeletonLoader
            width={130}
            height={16}
            borderRadius={4}
            style={[styles.statLabelSkeleton, styles.rightAligned]}
          />
          <SkeletonLoader
            width={120}
            height={28}
            borderRadius={4}
            style={[styles.statValueSkeleton, styles.rightAligned]}
          />
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* Líneas de referencia horizontales */}
        <View style={styles.gridContainer}>
          {[0, 1, 2, 3].map((_, index) => (
            <View key={`grid-${index}`} style={[styles.gridLineContainer, { top: (CHART_HEIGHT / 4) * index }]}>
              <SkeletonLoader
                width={40}
                height={12}
                borderRadius={2}
                style={styles.yAxisLabel}
              />
              <SkeletonLoader
                width={width - 120}
                height={1}
                style={styles.gridLine}
              />
            </View>
          ))}
        </View>

        {/* Área coloreada bajo la línea */}
        <View style={styles.areaContainer}>
          <SkeletonLoader
            width={width - 100}
            height={CHART_HEIGHT - 50}
            style={styles.areaGradient}
          />
        </View>

        {/* Línea animada del gráfico */}
        <View style={styles.lineContainer}>
          {/* Simular línea con puntos */}
          <View style={styles.linePathContainer}>
            {/* Crear una "línea" conectando puntos con colores degradados */}
            <SkeletonLoader
              width={width - 130}
              height={3}
              style={[styles.linePath, { backgroundColor: '#EF674A80' }]}
            />
          </View>
          
          {/* Puntos del gráfico */}
          {Array.from({ length: 7 }).map((_, index) => {
            // Calcular posición Y aleatoria pero coherente para simular una línea ondulada
            const randomHeight = 20 + Math.sin(index) * 30 + (index % 3) * 15;
            return (
              <View 
                key={`point-${index}`} 
                style={[
                  styles.pointContainer,
                  { 
                    left: index * ((width - 130) / 6),
                    bottom: randomHeight
                  }
                ]}
              >
                <SkeletonLoader
                  width={8}
                  height={8}
                  borderRadius={4}
                  style={[styles.point, { backgroundColor: '#EF674A' }]}
                />
              </View>
            );
          })}
          
          {/* Etiquetas del eje X */}
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonLoader
              key={`label-${index}`}
              width={20}
              height={12}
              borderRadius={2}
              style={[
                styles.xAxisLabel,
                { left: index * ((width - 130) / 6) }
              ]}
            />
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
    width: '100%',
  },
  filterSkeleton: {
    marginRight: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
  },
  statLabelSkeleton: {
    marginBottom: 8,
  },
  statValueSkeleton: {
    marginBottom: 4,
  },
  rightAligned: {
    alignSelf: 'flex-end',
  },
  chartContainer: {
    height: CHART_HEIGHT,
    position: 'relative',
    marginTop: 10,
  },
  gridContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  gridLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  yAxisLabel: {
    marginRight: 10,
  },
  gridLine: {
    opacity: 0.3,
  },
  areaContainer: {
    position: 'absolute',
    left: 50,
    right: 20,
    bottom: 0,
    top: 40,
    alignItems: 'center',
  },
  areaGradient: {
    opacity: 0.2,
    backgroundColor: '#EF674A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  lineContainer: {
    position: 'absolute',
    left: 50,
    right: 20,
    bottom: 0,
    top: 10,
    height: CHART_HEIGHT - 40,
  },
  linePathContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  linePath: {
    height: 3,
    borderRadius: 2,
  },
  pointContainer: {
    position: 'absolute',
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  point: {
    opacity: 0.8,
  },
  xAxisLabel: {
    position: 'absolute',
    bottom: -20,
    alignSelf: 'center',
    opacity: 0.7,
  },
});

export default SpendingHistorySkeleton;