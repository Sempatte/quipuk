// components/ui/FinancialSituationSkeleton.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonLoader from './SkeletonLoader';
import { globalStyles } from '@/app/styles/globalStyles';

const { width } = Dimensions.get('window');

const FinancialSituationSkeleton: React.FC = () => {
  const filterOptions: string[] = ['Este mes', '3 M', '6 M', '2025'];
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
              index === 0 && { opacity: 0.8 }
            ]}
          />
        ))}
      </View>

      {/* Resumen */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <SkeletonLoader
            width={80}
            height={16}
            borderRadius={4}
            style={styles.labelSkeleton}
          />
          <SkeletonLoader
            width={120}
            height={24}
            borderRadius={4}
            style={styles.valueSkeleton}
          />
        </View>
        
        <View style={styles.summaryItem}>
          <SkeletonLoader
            width={80}
            height={16}
            borderRadius={4}
            style={[styles.labelSkeleton, styles.rightAligned]}
          />
          <SkeletonLoader
            width={120}
            height={24}
            borderRadius={4}
            style={[styles.valueSkeleton, styles.rightAligned]}
          />
        </View>
      </View>

      {/* Gráfico simplificado */}
      <View style={styles.chartContainer}>
        {[1, 2, 3, 4].map((_, index) => (
          <SkeletonLoader
            key={`line-${index}`}
            width="100%"
            height={1}
            style={{ 
              marginBottom: 40,
              opacity: 0.3 
            }}
          />
        ))}

        <View style={styles.barsContainer}>
          {[1, 2, 3].map((_, index) => (
            <View key={`bar-group-${index}`} style={styles.barGroup}>
              <SkeletonLoader
                width={20}
                height={60 + Math.random() * 60}
                borderRadius={4}
                style={styles.bar}
              />
              <SkeletonLoader
                width={20}
                height={40 + Math.random() * 80}
                borderRadius={4}
                style={styles.bar}
              />
              <SkeletonLoader
                width={30}
                height={12}
                borderRadius={2}
                style={styles.barLabel}
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
    marginBottom: 20,
    gap: 8,
  },
  filterSkeleton: {
    marginRight: 5,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
  },
  labelSkeleton: {
    marginBottom: 8,
  },
  valueSkeleton: {
    marginBottom: 4,
  },
  rightAligned: {
    alignSelf: 'flex-end',
  },
  chartContainer: {
    height: 180,
    justifyContent: 'flex-end',
    position: 'relative',
    marginTop: 10,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
  },
  barGroup: {
    alignItems: 'center',
    width: 70,
  },
  bar: {
    marginHorizontal: 2,
  },
  barLabel: {
    marginTop: 8,
  },
});

export default FinancialSituationSkeleton;