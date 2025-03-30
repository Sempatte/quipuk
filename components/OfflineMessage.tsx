import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useBackendHealth } from '@/hooks/useBackendHealth';

interface OfflineMessageProps {
  message?: string;
  subMessage?: string;
  showRetryButton?: boolean;
}

export const OfflineMessage: React.FC<OfflineMessageProps> = ({
  message = 'Error Técnico',
  subMessage = 'No se pudo conectar con el servidor. Por favor, intente nuevamente.',
  showRetryButton = true
}) => {
  const { checkHealth } = useBackendHealth({ showErrorToast: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      await checkHealth();
    } finally {
      // Si la conexión sigue fallando, volveremos a mostrar el botón
      setTimeout(() => {
        setIsLoading(false);
      }, 2000); // Mínimo 2 segundos de feedback visual
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('@/assets/images/Logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{message}</Text>
          <Text style={styles.message}>{subMessage}</Text>
          
          {showRetryButton && (
            isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00C853" />
                <Text style={styles.loadingText}>Conectando...</Text>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.button} 
                onPress={handleRetry}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>Reintentar</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: width * 0.5,
    height: width * 0.5,
    maxWidth: 200,
    maxHeight: 200,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Outfit_700Bold',
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    fontFamily: 'Outfit_400Regular',
  },
  button: {
    backgroundColor: '#00C853',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Outfit_600SemiBold',
  },
  loadingContainer: {
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
  }
});