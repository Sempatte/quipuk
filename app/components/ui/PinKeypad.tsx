import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PinKeypadProps {
  onNumberPress: (number: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}

export const PinKeypad: React.FC<PinKeypadProps> = ({ 
  onNumberPress, 
  onBackspace, 
  disabled = false 
}) => {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'backspace'];

  const handlePress = (value: string) => {
    if (disabled) return;
    
    Vibration.vibrate(50);
    
    if (value === 'backspace') {
      onBackspace();
    } else if (value !== '') {
      onNumberPress(value);
    }
  };

  const renderKey = (value: string, index: number) => {
    if (value === '') {
      return <View key={index} style={styles.emptyKey} />;
    }

    if (value === 'backspace') {
      return (
        <TouchableOpacity
          key={index}
          style={[styles.key, disabled && styles.keyDisabled]}
          onPress={() => handlePress(value)}
          disabled={disabled}
        >
          <Ionicons name="backspace-outline" size={24} color={disabled ? '#ccc' : '#333'} />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={[styles.key, disabled && styles.keyDisabled]}
        onPress={() => handlePress(value)}
        disabled={disabled}
      >
        <Text style={[styles.keyText, disabled && styles.keyTextDisabled]}>
          {value}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {numbers.map((number, index) => renderKey(number, index))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 300,
    alignSelf: 'center',
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  keyDisabled: {
    backgroundColor: '#f0f0f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  emptyKey: {
    width: 80,
    height: 80,
    margin: 8,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  keyTextDisabled: {
    color: '#ccc',
  },
});