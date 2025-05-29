// components/ui/PhoneInput.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CountryPicker } from './CountryPicker';
import { Country } from '@/app/contants/countries';

interface PhoneInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  selectedCountry: Country;
  onCountryChange: (country: Country) => void;
  containerStyle?: object;
  inputStyle?: object;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  placeholder = "Número de teléfono",
  value,
  onChangeText,
  onBlur,
  error,
  selectedCountry,
  onCountryChange,
  editable = true,
  maxLength = 15,
  containerStyle,
  inputStyle,
  ...otherProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handlePhoneChange = (text: string) => {
    // Solo permitir números, espacios, guiones y paréntesis
    const cleanText = text.replace(/[^0-9\s\-\(\)]/g, '');
    onChangeText?.(cleanText);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        error && styles.inputContainerError,
        !editable && styles.inputContainerDisabled
      ]}>
        {/* Country Picker */}
        <CountryPicker
          selectedCountry={selectedCountry}
          onSelect={onCountryChange}
          disabled={!editable}
        />
        
        {/* Separador */}
        <View style={styles.separator} />
        
        {/* Phone Input */}
        <View style={styles.phoneInputContainer}>
          <Ionicons 
            name="call-outline" 
            size={20} 
            color={error ? "#E74C3C" : isFocused ? "#00c450" : "#999"} 
            style={styles.phoneIcon}
          />
          <TextInput
            style={[styles.phoneInput, inputStyle]}
            placeholder={placeholder}
            placeholderTextColor="#999"
            value={value}
            onChangeText={handlePhoneChange}
            onFocus={() => setIsFocused(true)}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            keyboardType="phone-pad"
            editable={editable}
            maxLength={maxLength}
            {...otherProps}
          />
        </View>
      </View>
      
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color="#E74C3C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
    fontFamily: "Outfit_600SemiBold",
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E8EB",
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputContainerFocused: {
    borderColor: "#00c450",
    shadowColor: "#00c450",
    shadowOpacity: 0.1,
  },
  inputContainerError: {
    borderColor: "#E74C3C",
    backgroundColor: "#FEF5F5",
  },
  inputContainerDisabled: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E5E8EB",
  },
  separator: {
    width: 1,
    height: 30,
    backgroundColor: "#E5E8EB",
    marginHorizontal: 8,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 15,
  },
  phoneIcon: {
    marginRight: 12,
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
    paddingVertical: 12,
    fontFamily: "Outfit_400Regular",
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  errorText: {
    fontSize: 12,
    color: "#E74C3C",
    marginLeft: 5,
    fontFamily: "Outfit_400Regular",
  },
});