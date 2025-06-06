// components/PaymentSkeleton.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width - 80;

interface SkeletonProps {
  count?: number;
}

const UpcomingPaymentsSkeleton: React.FC<SkeletonProps> = ({ count = 1 }) => {
  // Crear una animación de "respiración" para el efecto de carga
  const opacityValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Configurar la animación para que se repita indefinidamente
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityValue, {
          toValue: 0.7,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 0.3,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );

    // Iniciar la animación
    pulseAnimation.start();

    // Limpiar la animación cuando el componente se desmonte
    return () => {
      pulseAnimation.stop();
    };
  }, [opacityValue]);

  // Estilo base para los elementos del skeleton
  const skeletonStyle = {
    opacity: opacityValue,
    backgroundColor: '#E0E0E0',
  };

  const renderSkeletonCard = (index: number) => (
    <View key={`skeleton-${index}`} style={styles.paymentCard}>
         <View style={styles.paymentHeader}>
           {/* Skeleton para el icono de categoría */}
           <Animated.View style={[styles.categoryIconContainer, skeletonStyle]} />
           
           <View style={styles.categoryDetails}>
             {/* Skeleton para el título */}
             <Animated.View 
               style={[styles.titleSkeleton, skeletonStyle]} 
             />
             
             {/* Skeleton para el subtítulo */}
             <Animated.View 
               style={[styles.subtitleSkeleton, skeletonStyle]} 
             />
           </View>
         </View>
         
         {/* Skeleton para el monto */}
         <Animated.View 
           style={[styles.amountSkeleton, skeletonStyle]} 
         />
         
         {/* Skeleton para la fecha de vencimiento */}
         <View style={styles.dueDateContainer}>
           <Animated.View 
             style={[styles.dueDateDot, { backgroundColor: '#E0E0E0', opacity: opacityValue }]} 
           />
           <Animated.View 
             style={[styles.dueDateSkeleton, skeletonStyle]} 
           />
         </View>
         
         {/* Skeleton para el texto de vencimiento */}
         <Animated.View 
           style={[styles.dueSubtextSkeleton, skeletonStyle]} 
         />
         
         {/* Skeleton para los botones */}
         <View style={styles.buttonsContainer}>
           <Animated.View 
             style={[styles.buttonSkeleton, skeletonStyle, { marginRight: 8 }]} 
           />
           <Animated.View 
             style={[styles.buttonSkeleton, skeletonStyle]} 
           />
         </View>
    </View>
  );

   return (
     <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => renderSkeletonCard(index))}
     </View>
   );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 15,
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
    marginRight: 10,
  },
  categoryDetails: {
    flex: 1,
  },
  titleSkeleton: {
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
    width: '70%',
  },
  subtitleSkeleton: {
    height: 14,
    borderRadius: 4,
    width: '50%',
  },
  amountSkeleton: {
    height: 30,
    borderRadius: 4,
    marginBottom: 15,
    width: '40%',
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
    marginRight: 8,
  },
  dueDateSkeleton: {
    height: 16,
    borderRadius: 4,
    width: '60%',
  },
  dueSubtextSkeleton: {
    height: 14,
    borderRadius: 4,
    marginBottom: 15,
    width: '40%',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  buttonSkeleton: {
    flex: 1,
    height: 36,
    borderRadius: 20,
  },
});

export default UpcomingPaymentsSkeleton;