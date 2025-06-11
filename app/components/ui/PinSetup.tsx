// components/ui/PinSetup.tsx - DISEÑO CORREGIDO Y CENTRADO
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePinAuth } from '@/app/hooks/usePinAuth';

const { width, height } = Dimensions.get('window');

interface PinSetupProps {
  userId: number;
  visible: boolean;
  onComplete: (success: boolean) => void;
  onSkip: () => void;
}

export const PinSetup: React.FC<PinSetupProps> = ({
  userId,
  visible,
  onComplete,
  onSkip,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [error, setError] = useState('');
  
  const { createPin, isLoading } = usePinAuth(userId);

  const handleNumberPress = useCallback((number: string) => {
    if (step === 'create') {
      if (pin.length < 6) {
        setPin(prev => prev + number);
        setError('');
      }
    } else {
      if (confirmPin.length < 6) {
        setConfirmPin(prev => prev + number);
        setError('');
      }
    }
  }, [step, pin.length, confirmPin.length]);

  const handleDelete = useCallback(() => {
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
    setError('');
  }, [step]);

  const handleStepComplete = useCallback(async () => {
    if (step === 'create' && pin.length === 6) {
      setStep('confirm');
      return;
    }
    
    if (step === 'confirm' && confirmPin.length === 6) {
      if (pin !== confirmPin) {
        setError('Los PIN no coinciden');
        setConfirmPin('');
        return;
      }
      
      try {
        const result = await createPin(pin);
        if (result.success) {
          onComplete(true);
        } else {
          setError(result.error || 'Error al crear PIN');
        }
      } catch (error) {
        setError('Error inesperado al crear PIN');
      }
    }
  }, [step, pin, confirmPin, createPin, onComplete]);

  const handleBack = useCallback(() => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin('');
      setError('');
    }
  }, [step]);

  const currentPin = step === 'create' ? pin : confirmPin;

  // Auto-advance cuando se complete el PIN
  React.useEffect(() => {
    if (currentPin.length === 6) {
      setTimeout(handleStepComplete, 300);
    }
  }, [currentPin.length, handleStepComplete]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* 🎯 HEADER MEJORADO CON MEJOR DISTRIBUCIÓN */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#000000', '#1a1a1a']}
              style={styles.headerGradient}
            >
              {/* Back button - solo en confirm */}
              {step === 'confirm' && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
              )}

              {/* Logo centrado */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="shield-checkmark" size={40} color="#00c450" />
                </View>
              </View>

              {/* Title y subtitle centrados */}
              <View style={styles.titleContainer}>
                <Text style={styles.title}>
                  {step === 'create' ? 'Crea tu PIN' : 'Confirma tu PIN'}
                </Text>
                <Text style={styles.subtitle}>
                  {step === 'create' 
                    ? 'Elige un PIN de 6 dígitos para proteger tu cuenta'
                    : 'Ingresa nuevamente tu PIN para confirmarlo'
                  }
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* 🎯 CONTENT PRINCIPAL CON MEJOR ESPACIADO */}
          <View style={styles.mainContent}>
            {/* PIN Dots */}
            <View style={styles.pinSection}>
              <View style={styles.dotsContainer}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.dot,
                      index < currentPin.length && styles.dotFilled,
                    ]}
                  />
                ))}
              </View>

              {/* Error message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#E74C3C" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : (
                <View style={styles.errorPlaceholder} />
              )}
            </View>

            {/* 🎯 KEYPAD CENTRADO Y MEJOR DISTRIBUIDO */}
            <View style={styles.keypadContainer}>
              {/* Numbers 1-9 */}
              <View style={styles.keypadGrid}>
                <View style={styles.keypadRow}>
                  {[1, 2, 3].map(number => (
                    <TouchableOpacity
                      key={number}
                      style={styles.keypadButton}
                      onPress={() => handleNumberPress(number.toString())}
                      activeOpacity={0.7}
                      disabled={isLoading}
                    >
                      <Text style={styles.keypadButtonText}>{number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.keypadRow}>
                  {[4, 5, 6].map(number => (
                    <TouchableOpacity
                      key={number}
                      style={styles.keypadButton}
                      onPress={() => handleNumberPress(number.toString())}
                      activeOpacity={0.7}
                      disabled={isLoading}
                    >
                      <Text style={styles.keypadButtonText}>{number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.keypadRow}>
                  {[7, 8, 9].map(number => (
                    <TouchableOpacity
                      key={number}
                      style={styles.keypadButton}
                      onPress={() => handleNumberPress(number.toString())}
                      activeOpacity={0.7}
                      disabled={isLoading}
                    >
                      <Text style={styles.keypadButtonText}>{number}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Bottom row: Skip, 0, Delete */}
                <View style={styles.keypadRow}>
                  <TouchableOpacity
                    style={styles.keypadButtonEmpty}
                    onPress={onSkip}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={styles.skipButtonText}>Configurar después</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.keypadButton}
                    onPress={() => handleNumberPress('0')}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={styles.keypadButtonText}>0</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.keypadButtonEmpty}
                    onPress={handleDelete}
                    activeOpacity={0.7}
                    disabled={isLoading || currentPin.length === 0}
                  >
                    <Ionicons 
                      name="backspace-outline" 
                      size={28} 
                      color={currentPin.length === 0 ? "#CCC" : "#666"} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  keyboardView: {
    flex: 1,
  },
  
  // 🎯 HEADER MEJORADO
  headerContainer: {
    height: height * 0.35, // Altura fija más controlada
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 20,
    zIndex: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 196, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0, 196, 80, 0.3)',
  },
  titleContainer: {
    alignItems: 'center',
    maxWidth: width - 60, // Limitar ancho para mejor lectura
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Outfit_700Bold',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Outfit_400Regular',
  },

  // 🎯 CONTENT PRINCIPAL MEJORADO
  mainContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
  },
  
  // 🎯 SECCIÓN PIN DOTS
  pinSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E8EB',
    borderWidth: 2,
    borderColor: '#E5E8EB',
  },
  dotFilled: {
    backgroundColor: '#00c450',
    borderColor: '#00c450',
    transform: [{ scale: 1.1 }], // Pequeña animación visual
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF5F5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
    minHeight: 44,
  },
  errorPlaceholder: {
    height: 44, // Mantener espacio para evitar saltos
  },
  errorText: {
    fontSize: 14,
    color: '#E74C3C',
    marginLeft: 8,
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
  },

  // 🎯 KEYPAD COMPLETAMENTE CENTRADO
  keypadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadGrid: {
    alignItems: 'center',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 25, // Espaciado uniforme entre botones
  },
  keypadButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E8EB',
  },
  keypadButtonEmpty: {
    width: 75,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadButtonText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: 'Outfit_600SemiBold',
  },
  skipButtonText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Outfit_500Medium',
    textAlign: 'center',
    lineHeight: 14,
  },
});