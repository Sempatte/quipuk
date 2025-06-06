// components/TransactionSkeleton.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import SkeletonLoader from './SkeletonLoader';

interface TransactionSkeletonProps {
  count?: number;
}

const TransactionSkeleton: React.FC<TransactionSkeletonProps> = ({ count = 3 }) => {
  const skeletons = Array(count).fill(0);

  return (
    <View style={styles.container}>
      {skeletons.map((_, index) => (
        <View key={index} style={styles.transactionItem}>
          <View style={styles.leftContent}>
            {/* Icono */}
            <SkeletonLoader 
              width={45} 
              height={45} 
              borderRadius={10} 
              style={styles.iconSkeleton}
            />
            
            <View style={styles.detailsContainer}>
              {/* Título */}
              <SkeletonLoader 
                width={150} 
                height={18} 
                borderRadius={4} 
                style={styles.titleSkeleton}
              />
              
              {/* Hora y fecha */}
              <SkeletonLoader 
                width={120} 
                height={14} 
                borderRadius={4} 
                style={styles.timeSkeleton}
              />
              
              {/* Método de pago */}
              <SkeletonLoader 
                width={80} 
                height={14} 
                borderRadius={4} 
                style={styles.methodSkeleton}
              />
            </View>
          </View>
          
          {/* Monto */}
          <SkeletonLoader 
            width={70} 
            height={18} 
            borderRadius={4} 
          />
        </View>
      ))}
      
      {/* Botón Ver todos */}
      <View style={styles.viewAllContainer}>
        <SkeletonLoader 
          width={100} 
          height={16} 
          borderRadius={4} 
          style={styles.viewAllSkeleton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  iconSkeleton: {
    marginRight: 0,
  },
  titleSkeleton: {
    marginBottom: 8,
  },
  timeSkeleton: {
    marginBottom: 8,
  },
  methodSkeleton: {
    marginBottom: 0,
  },
  viewAllContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  viewAllSkeleton: {
    alignSelf: 'center',
  },
});

export default TransactionSkeleton;