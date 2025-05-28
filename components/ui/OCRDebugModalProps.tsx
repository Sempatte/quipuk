import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExtractedReceiptData } from '@/app/services/ocrService';

const { width } = Dimensions.get('window');

interface OCRDebugModalProps {
  visible: boolean;
  onClose: () => void;
  extractedData: ExtractedReceiptData | null;
  rawText: string | null;
  processingTime?: number;
}

/**
 * Modal de debug para mostrar información detallada del procesamiento OCR
 * Útil para desarrollo y testing
 */
const OCRDebugModal: React.FC<OCRDebugModalProps> = ({
  visible,
  onClose,
  extractedData,
  rawText,
  processingTime,
}) => {
  if (!extractedData && !rawText) {
    return null;
  }

  const formatConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return '#4CAF50'; // Verde
    if (confidence >= 60) return '#FF9800'; // Naranja
    if (confidence >= 40) return '#FF5722'; // Rojo claro
    return '#F44336'; // Rojo
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Debug OCR</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Estadísticas de procesamiento */}
          {processingTime && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⏱️ Estadísticas</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Tiempo de procesamiento:</Text>
                <Text style={styles.statValue}>{processingTime}ms</Text>
              </View>
            </View>
          )}

          {/* Datos extraídos */}
          {extractedData && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Datos Extraídos</Text>
              
              {/* Nivel de confianza */}
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceLabel}>Confianza:</Text>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceFill, 
                      { 
                        width: `${extractedData.confidence}%`,
                        backgroundColor: formatConfidenceColor(extractedData.confidence)
                      }
                    ]} 
                  />
                </View>
                <Text 
                  style={[
                    styles.confidenceText,
                    { color: formatConfidenceColor(extractedData.confidence) }
                  ]}
                >
                  {extractedData.confidence}%
                </Text>
              </View>

              {/* Campos extraídos */}
              <View style={styles.fieldsContainer}>
                {extractedData.amount && (
                  <View style={styles.fieldRow}>
                    <Ionicons name="cash" size={16} color="#4CAF50" />
                    <Text style={styles.fieldLabel}>Monto:</Text>
                    <Text style={styles.fieldValue}>S/ {extractedData.amount.toFixed(2)}</Text>
                  </View>
                )}

                {extractedData.merchantName && (
                  <View style={styles.fieldRow}>
                    <Ionicons name="storefront" size={16} color="#2196F3" />
                    <Text style={styles.fieldLabel}>Comercio:</Text>
                    <Text style={styles.fieldValue}>{extractedData.merchantName}</Text>
                  </View>
                )}

                {extractedData.category && (
                  <View style={styles.fieldRow}>
                    <Ionicons name="pricetag" size={16} color="#FF9800" />
                    <Text style={styles.fieldLabel}>Categoría:</Text>
                    <Text style={styles.fieldValue}>{extractedData.category}</Text>
                  </View>
                )}

                {extractedData.date && (
                  <View style={styles.fieldRow}>
                    <Ionicons name="calendar" size={16} color="#9C27B0" />
                    <Text style={styles.fieldLabel}>Fecha:</Text>
                    <Text style={styles.fieldValue}>
                      {new Date(extractedData.date).toLocaleDateString('es-PE')}
                    </Text>
                  </View>
                )}

                {extractedData.description && (
                  <View style={styles.fieldRow}>
                    <Ionicons name="document-text" size={16} color="#607D8B" />
                    <Text style={styles.fieldLabel}>Descripción:</Text>
                    <Text style={styles.fieldValue}>{extractedData.description}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Texto completo extraído */}
          {rawText && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📄 Texto Extraído</Text>
              <View style={styles.rawTextContainer}>
                <Text style={styles.rawText}>{rawText}</Text>
              </View>
              
              {/* Estadísticas del texto */}
              <View style={styles.textStats}>
                <Text style={styles.textStat}>Caracteres: {rawText.length}</Text>
                <Text style={styles.textStat}>Líneas: {rawText.split('\n').length}</Text>
                <Text style={styles.textStat}>
                  Palabras: {rawText.split(/\s+/).filter(word => word.length > 0).length}
                </Text>
              </View>
            </View>
          )}

          {/* Consejos para mejorar OCR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💡 Consejos</Text>
            <View style={styles.tipsContainer}>
              <Text style={styles.tip}>• Asegúrate de que haya buena iluminación</Text>
              <Text style={styles.tip}>• Mantén el comprobante plano y sin arrugas</Text>
              <Text style={styles.tip}>• Centra el comprobante en el marco</Text>
              <Text style={styles.tip}>• Evita sombras sobre el texto</Text>
              <Text style={styles.tip}>• Usa el flash si la imagen está muy oscura</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Outfit_600SemiBold',
    color: '#000',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#000',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#000',
  },
  confidenceContainer: {
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#000',
    marginBottom: 8,
  },
  confidenceBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'right',
  },
  fieldsContainer: {
    marginTop: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Outfit_500Medium',
    color: '#666',
    marginLeft: 8,
    minWidth: 80,
  },
  fieldValue: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#000',
    flex: 1,
    marginLeft: 8,
  },
  rawTextContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    maxHeight: 200,
  },
  rawText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#333',
    lineHeight: 16,
  },
  textStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  textStat: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
  },
  tipsContainer: {
    paddingLeft: 8,
  },
  tip: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#666',
    marginVertical: 2,
    lineHeight: 20,
  },
});

export default OCRDebugModal;