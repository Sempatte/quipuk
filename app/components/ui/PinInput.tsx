import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Vibration, TouchableOpacity } from 'react-native';
import { PinKeypad } from './PinKeypad';
import { PinDots } from './PinDots';

interface PinInputProps {
  title: string;
  subtitle?: string;
  maxLength?: number;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  showForgotPin?: boolean;
  onForgotPin?: () => void;
}

export const PinInput: React.FC<PinInputProps> = ({
  title,
  subtitle,
  maxLength = 6,
  onComplete,
  onCancel,
  disabled = false,
  hasError = false,
  errorMessage,
  showForgotPin = false,
  onForgotPin,
}) => {
  const [pin, setPin] = useState('');
  const [showError, setShowError] = useState(false);

useEffect(() => {
    if (hasError) {
      setShowError(true);
      Vibration.vibrate([0, 100, 50, 100]); // Patrón de vibración para error
      
      // Limpiar PIN después de error
     const timeoutId = setTimeout(() => {
       setPin('');
       setShowError(false);
     }, 1000);

     return () => clearTimeout(timeoutId);
    }
  }, [hasError]);

  const handleNumberPress = (number: string) => {
    if (pin.length < maxLength && !disabled) {
      const newPin = pin + number;
      setPin(newPin);
      
      if (newPin.length === maxLength) {
        setTimeout(() => onComplete(newPin), 100);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !disabled) {
      setPin(pin.slice(0, -1));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <PinDots 
        length={pin.length} 
        maxLength={maxLength} 
        hasError={showError}
      />

      {(hasError && errorMessage) && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}

      <PinKeypad
        onNumberPress={handleNumberPress}
        onBackspace={handleBackspace}
        disabled={disabled}
      />

      {showForgotPin && onForgotPin && (
        <TouchableOpacity style={styles.forgotButton} onPress={onForgotPin}>
          <Text style={styles.forgotButtonText}>¿Olvidaste tu PIN?</Text>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 0,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  forgotButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  forgotButtonText: {
    color: '#007AFF',
    fontSize: 16,
    textAlign: 'center',
  },
});