// components/splash/splashStyles.ts
import { StyleSheet, Dimensions, ViewStyle } from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashStyles {
  container: ViewStyle;
  backgroundContainer: ViewStyle;
  gradient: ViewStyle;
  logoContainer: ViewStyle;
  logoWrapper: ViewStyle;
  logoBackground: ViewStyle;
  logoSvg: ViewStyle;
  loadingContainer: ViewStyle;
  dotsContainer: ViewStyle;
  dot: ViewStyle;
}

export const splashStyles = StyleSheet.create<SplashStyles>({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  logoWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBackground: {
    position: 'absolute',
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    backgroundColor: 'rgba(0, 220, 90, 0.1)',
    shadowColor: '#00DC5A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoSvg: {
    zIndex: 2,
    maxWidth: 250,
    maxHeight: 250,
    minWidth: 150,
    minHeight: 150,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    width: '100%',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00DC5A',
    shadowColor: '#00DC5A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
});