import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface PinDotsProps {
  length: number;
  maxLength: number;
  hasError?: boolean;
}

export const PinDots: React.FC<PinDotsProps> = ({ length, maxLength, hasError = false }) => {
  const dots = Array.from({ length: maxLength }, (_, index) => {
    const isFilled = index < length;
    
    return (
      <View
        key={index}
        style={[
          styles.dot,
          isFilled && styles.dotFilled,
          hasError && styles.dotError,
        ]}
      />
    );
  });

  return <View style={styles.container}>{dots}</View>;
};

const dotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: 'transparent',
    marginHorizontal: 8,
  },
  dotFilled: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  dotError: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
});

const styles = { ...dotStyles };