// components/splash/ProfessionalSplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Dimensions, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { splashStyles } from './splash/splashStyles';
import { LoadingDots } from './ui/LoadingDots';
import QuipukLogo from '@/assets/images/Logo.svg';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onFinish 
}) => {
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    // Solo fade in simple del logo
    logoOpacity.value = withTiming(1, { 
      duration: 600, 
      easing: Easing.out(Easing.cubic) 
    });

    // Auto-hide después de 3 segundos
    setTimeout(() => {
      runOnJS(onFinish)();
    }, 3000);
  }, [onFinish]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));

  return (
    <View style={splashStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      
      {/* Logo estático centrado */}
      <Animated.View style={[splashStyles.logoContainer, logoAnimatedStyle]}>
        <QuipukLogo 
          width={width * 0.6} 
          height={width * 0.6} 
          style={splashStyles.logoSvg}
        />
      </Animated.View>

      {/* Loading dots */}
      <LoadingDots />
    </View>
  );
};