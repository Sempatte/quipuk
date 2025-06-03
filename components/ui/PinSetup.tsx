import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { PinInput } from './PinInput';
import { usePinAuth } from '@/hooks/usePinAuth';

interface PinSetupProps {
  userId: number;
  onComplete: (success: boolean) => void;
  onSkip?: () => void;
}

export const PinSetup: React.FC<PinSetupProps> = ({ userId, onComplete, onSkip }) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createPin } = usePinAuth(userId);

  const handleFirstPinComplete = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
  };

  const handleConfirmPinComplete = async (pin: string) => {
    if (pin !== firstPin) {
      Alert.alert('Error', 'Los PIN no coinciden. Intenta nuevamente.');
      setStep('create');
      setFirstPin('');
      return;
    }

    setIsLoading(true);
    try {
      const result = await createPin(pin);
      if (result.success) {
        Alert.alert(
          '¡PIN creado!', 
          'Tu PIN ha sido configurado exitosamente.',
          [{ text: 'Continuar', onPress: () => onComplete(true) }]
        );
      } else {
        Alert.alert('Error', result.error || 'No se pudo crear el PIN');
        setStep('create');
        setFirstPin('');
      }
    } catch (error) {
      Alert.alert('Error', 'Error inesperado al crear PIN');
      setStep('create');
      setFirstPin('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {step === 'create' ? (
        <PinInput
          title="Crea tu PIN"
          subtitle="Elige un PIN de 6 dígitos para proteger tu cuenta"
          maxLength={6}
          onComplete={handleFirstPinComplete}
          disabled={isLoading}
        />
      ) : (
        <PinInput
          title="Confirma tu PIN"
          subtitle="Ingresa nuevamente tu PIN para confirmarlo"
          maxLength={6}
          onComplete={handleConfirmPinComplete}
          disabled={isLoading}
        />
      )}

      {onSkip && step === 'create' && (
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Configurar después</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  skipButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

