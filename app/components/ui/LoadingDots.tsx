// components/ui/LoadingDots.tsx
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { splashStyles } from '../splash/splashStyles';

interface LoadingDotProps {
  delay: number;
}

const LoadingDot: React.FC<LoadingDotProps> = ({ delay }) => {
  const dotScale = useSharedValue(0.7);
  const dotOpacity = useSharedValue(0.4);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.3, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.7, { duration: 500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
      dotOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.4, { duration: 500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, [delay]);

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    width: splashStyles.dot.width,
    height: splashStyles.dot.height,
    borderRadius: splashStyles.dot.borderRadius,
    backgroundColor: splashStyles.dot.backgroundColor,
    shadowColor: splashStyles.dot.shadowColor,
    shadowOffset: splashStyles.dot.shadowOffset,
    shadowOpacity: splashStyles.dot.shadowOpacity,
    shadowRadius: splashStyles.dot.shadowRadius,
    elevation: splashStyles.dot.elevation,
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
  } as any));

  return <Animated.View style={dotAnimatedStyle} />;
};

export const LoadingDots: React.FC = () => {
  return (
    <View style={splashStyles.loadingContainer}>
      <View style={splashStyles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <LoadingDot key={index} delay={index * 150} />
        ))}
      </View>
    </View>
  );
};