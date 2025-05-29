// components/ui/CustomInput.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  showPasswordToggle?: boolean;
  containerStyle?: object;
  inputStyle?: object;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  onBlur,
  error,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  iconName,
  editable = true,
  maxLength,
  showPasswordToggle = false,
  containerStyle,
  inputStyle,
  ...otherProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const actualSecureTextEntry = showPasswordToggle ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputWrapper,
        isFocused && styles.inputWrapperFocused,
        error && styles.inputWrapperError,
        !editable && styles.inputWrapperDisabled
      ]}>
        {iconName && (
          <Ionicons 
            name={iconName} 
            size={20} 
            color={error ? "#E74C3C" : isFocused ? "#00c450" : "#999"} 
            style={styles.inputIcon}
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            iconName && styles.inputWithIcon,
            showPasswordToggle && styles.inputWithToggle,
            inputStyle
          ]}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          keyboardType={keyboardType}
          secureTextEntry={actualSecureTextEntry}
          autoCapitalize={autoCapitalize}
          editable={editable}
          maxLength={maxLength}
          {...otherProps}
        />
        
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            disabled={!editable}
          >
            <Ionicons
              name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#999"
            />
          </TouchableOpacity>
        )}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E8EB",
    paddingHorizontal: 15,
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputWrapperFocused: {
    borderColor: "#00c450",
    shadowColor: "#00c450",
    shadowOpacity: 0.1,
  },
  inputWrapperError: {
    borderColor: "#E74C3C",
    backgroundColor: "#FEF5F5",
  },
  inputWrapperDisabled: {
    backgroundColor: "#F8F9FA",
    borderColor: "#E5E8EB",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#2C3E50",
    paddingVertical: 12,
    fontFamily: "Outfit_400Regular",
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  inputWithToggle: {
    paddingRight: 0,
  },
  passwordToggle: {
    padding: 8,
    marginLeft: 8,
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