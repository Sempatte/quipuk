// components/ui/SkeletonLoader.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  Easing 
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

const SkeletonLoader: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  // 🔧 USAR useSharedValue en lugar de useRef(new Animated.Value)
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // 🔧 CORREGIR: Usar withRepeat con Reanimated 3
    opacity.value = withRepeat(
      withTiming(0.7, {
        duration: 800,
        easing: Easing.ease,
      }),
      -1, // Infinito
      true // Reverse
    );
    
    // 🔧 CLEANUP CORRECTO
    return () => {
      opacity.value = 0.3;
    };
  }, [opacity]);

  // 🔧 USAR useAnimatedStyle
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        animatedStyle, // 🔧 Aplicar estilo animado correctamente
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
});

export default SkeletonLoader;