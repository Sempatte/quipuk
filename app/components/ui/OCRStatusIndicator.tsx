import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { integratedOCRService } from '@/app/services/integratedOCRService';

interface OCRStatusIndicatorProps {
  showDetails?: boolean;
}

/**
 * Componente que muestra el estado actual del servicio OCR
 * Útil para debugging y verificar configuración
 */
const OCRStatusIndicator: React.FC<OCRStatusIndicatorProps> = ({ 
  showDetails = false 
}) => {
  const status = integratedOCRService.getOCRServiceStatus();
  const debugInfo = integratedOCRService.getDebugInfo();

  const getStatusColor = (): string => {
    if (status.activeService === 'google-vision') return '#4CAF50';
    return '#FF9800';
  };

  const getStatusIcon = () => {
    if (status.activeService === 'google-vision') return 'cloud-outline';
    return 'settings-outline';
  };

  const getStatusText = (): string => {
    if (status.activeService === 'google-vision') return 'Google Vision API';
    return 'Simulador OCR';
  };

  const showDebugInfo = (): void => {
    const info = [
      `Servicio activo: ${getStatusText()}`,
      `Google Vision configurado: ${status.googleVisionConfigured ? 'Sí' : 'No'}`,
      `OCR habilitado: ${status.ocrEnabled ? 'Sí' : 'No'}`,
      `Entorno: ${debugInfo.environment}`,
      `API Key presente: ${debugInfo.hasApiKey ? 'Sí' : 'No'}`,
      debugInfo.hasApiKey && `Longitud API Key: ${debugInfo.apiKeyLength}`,
    ].filter(Boolean).join('\n');

    Alert.alert('Estado del OCR', info, [{ text: 'Entendido' }]);
  };

  if (!showDetails) {
    return (
      <View style={[styles.indicator, { backgroundColor: getStatusColor() }]}>
        <Ionicons name={getStatusIcon()} size={12} color="#FFF" />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.statusContainer} onPress={showDebugInfo}>
      <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]}>
        <Ionicons name={getStatusIcon()} size={16} color="#FFF" />
      </View>
      <View style={styles.statusText}>
        <Text style={styles.statusTitle}>OCR</Text>
        <Text style={styles.statusSubtitle}>{getStatusText()}</Text>
      </View>
      <Ionicons name="information-circle-outline" size={20} color="#666" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  indicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#000',
  },
  statusSubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
  },
});

export default OCRStatusIndicator;