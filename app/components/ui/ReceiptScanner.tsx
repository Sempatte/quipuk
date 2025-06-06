import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from '@/app/hooks/useCamaraPermissions';
import { ExtractedReceiptData, integratedOCRService } from '@/app/services/integratedOCRService';
import { LoadingDots } from './LoadingDots';
import { useCustomToast } from '@/app/hooks/useCustomToast';

const { width, height } = Dimensions.get('window');

interface ReceiptScannerProps {
  visible: boolean;
  onClose: () => void;
  onDataExtracted: (data: ExtractedReceiptData) => void;
}

/**
 * Componente de cámara para escanear comprobantes - VERSIÓN CORREGIDA
 */
const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  visible,
  onClose,
  onDataExtracted,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [debugMode, setDebugMode] = useState(__DEV__);
  const cameraRef = useRef<CameraView>(null);
  const [selectedLens, setSelectedLens] = useState<string | undefined>("builtInWideAngleCamera");
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);

  const { showError } = useCustomToast();

  const {
    permissions,
    hasAllPermissions,
    isLoading: permissionsLoading,
    requestPermissions,
  } = useCameraPermissions();

  // Solicitar permisos cuando se abre el modal
  useEffect(() => {
    if (visible && !permissions.camera) {
      requestPermissions();
    }
  }, [visible, permissions.camera, requestPermissions]);

  // Limpiar imagen capturada al cerrar el modal
  useEffect(() => {
    if (!visible) {
      setCapturedImageUri(null);
    }
  }, [visible]);

  /**
   * FUNCIÓN CORREGIDA - Procesa los datos y cierra el modal
   */
  const handleDataProcessingComplete = useCallback(
    (data: ExtractedReceiptData) => {
      try {
        onDataExtracted(data);
        onClose();
      } catch (error) {
        console.error('💥 [Scanner] Error enviando datos:', error);
        onClose();
      }
    },
    [onDataExtracted, onClose]
  );

  /**
   * Procesa una imagen usando OCR
   */
  const processImage = async (imageUri: string): Promise<void> => {
    setCapturedImageUri(imageUri);
    try {
      setIsProcessing(true);
      const result = await integratedOCRService.processReceiptImage(imageUri);
      if (result.success && result.data) {
        const hasUsefulData = !!(
          result.data.amount ||
          result.data.merchantName ||
          (result.data.category && result.data.category !== 'Otros') ||
          (result.data.description && result.data.description !== 'Gasto escaneado desde comprobante')
        );
        if (hasUsefulData) {
          showExtractedDataConfirmation(result.data);
        } else {
          Alert.alert(
            'Datos insuficientes',
            'Se detectó texto pero no se pudieron extraer datos útiles del comprobante.',
            [
              { text: 'Reintentar' },
              { text: 'Cancelar', onPress: () => onClose() }
            ]
          );
        }
      } else {
        console.error('❌ [Scanner] OCR falló:', result.error);
        Alert.alert(
          'Error de procesamiento',
          result.error || 'No se pudieron extraer datos del comprobante.',
          [
            { text: 'Reintentar' },
            { text: 'Cancelar', onPress: () => onClose() }
          ]
        );
      }
    } catch (error) {
      console.error('💥 [Scanner] Error general:', error);
      Alert.alert(
        'Error',
        `Hubo un problema al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'Entendido', onPress: () => onClose() }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Toma una foto y procesa el comprobante - SIMPLIFICADO
   */
  const takePicture = async (): Promise<void> => {
    if (!cameraRef.current || isProcessing) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
        exif: false,
      });
      if (!photo || !photo.uri) {
        throw new Error('No se pudo tomar la foto');
      }
      setCapturedImageUri(photo.uri);
      await processImage(photo.uri);
    } catch (error) {
      console.error('💥 [Scanner] Error capturando foto:', error);
      Alert.alert(
        'Error',
        `Error al tomar la foto: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'Entendido' }]
      );
    }
  };

  /**
   * Selecciona imagen de galería - SIMPLIFICADO
   */
  const selectFromGallery = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImageUri(result.assets[0].uri);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('💥 [Scanner] Error seleccionando imagen:', error);
      showError('Error', 'Error al seleccionar imagen de la galería');
    }
  };

  /**
   * FUNCIÓN CORREGIDA - Muestra confirmación de datos extraídos
   */
  const showExtractedDataConfirmation = (data: ExtractedReceiptData): void => {
    const details = [
      data.amount && `Monto: S/ ${data.amount.toFixed(2)}`,
      data.merchantName && `Comercio: ${data.merchantName}`,
      data.category && `Categoría: ${data.category}`,
      data.date && `Fecha: ${new Date(data.date).toLocaleDateString('es-PE')}`,
    ].filter(Boolean).join('\n');

    const message = details.length > 0
      ? `Se extrajeron los siguientes datos:\n\n${details}\n\nConfianza: ${data.confidence}%\n\n¿Usar estos datos?`
      : `Se detectaron algunos datos.\nConfianza: ${data.confidence}%\n\n¿Usar estos datos?`;
    handleDataProcessingComplete(data);
  };

  /**
   * Alterna el flash
   */
  const toggleFlash = (): void => {
    const newMode = flashMode === 'off' ? 'on' : 'off';
    setFlashMode(newMode);
  };

  const handleAvailableLenses = (event: { lenses: string[] }) => {
    if (event.lenses.includes("builtInWideAngleCamera")) {
      setSelectedLens("builtInWideAngleCamera");
    } else {
      const normalLens = event.lenses.find(lens => lens !== "builtInUltraWideCamera");
      setSelectedLens(normalLens || event.lenses[0]);
    }
  };

  if (!visible) return null;

  // Renderizar estados de carga y permisos
  if (permissionsLoading) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00DC5A" />
          <Text style={styles.loadingText}>Configurando cámara...</Text>
        </View>
      </Modal>
    );
  }

  if (!permissions.camera) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#666" />
          <Text style={styles.permissionTitle}>Acceso a la cámara requerido</Text>
          <Text style={styles.permissionText}>
            Para escanear comprobantes necesitamos acceso a tu cámara.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
            <Text style={styles.permissionButtonText}>Permitir acceso</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            disabled={isProcessing}
          >
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Escanear Comprobante</Text>
          <TouchableOpacity style={styles.headerButton} onPress={toggleFlash}>
            <Ionicons
              name={flashMode === 'on' ? "flash" : "flash-off"}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>
        {/* Cámara o Imagen capturada */}
        <View style={styles.cameraContainer}>
          {capturedImageUri ? (
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.capturedImage}
              resizeMode="contain"
            />
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing="back"
              flash={flashMode}
              selectedLens={selectedLens}
              onAvailableLensesChanged={handleAvailableLenses}
            >
              {/* Overlay con guías */}
              <View style={styles.overlay}>
                <View style={styles.scanArea}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
              </View>
            </CameraView>
          )}
        </View>
        {/* Instrucciones */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsText}>
            Centra el comprobante dentro del marco
          </Text>
          <Text style={styles.instructionsSubtext}>
            Asegúrate de que haya buena iluminación y el texto sea legible
          </Text>
        </View>
        {/* Controles */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.galleryButton}
            onPress={selectFromGallery}
            disabled={isProcessing}
          >
            <Ionicons name="images" size={24} color="#FFF" />
            <Text style={styles.galleryButtonText}>Galería</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <View style={styles.captureButtonInner} />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {debugMode ? (
            <TouchableOpacity
              style={styles.debugButton}
              onPress={() => {
                const mockData: ExtractedReceiptData = {
                  amount: 25.50,
                  merchantName: 'TEST RESTAURANT',
                  category: 'Comida',
                  description: 'Compra en TEST RESTAURANT',
                  confidence: 85,
                  date: new Date().toISOString(),
                };

                showExtractedDataConfirmation(mockData);
              }}
              disabled={isProcessing}
            >
              <Ionicons name="bug" size={20} color="#FFF" />
              <Text style={styles.debugButtonText}>TEST</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.galleryButton} />
          )}
        </View>
        {/* Overlay de procesamiento: SIEMPRE AL FINAL para estar por encima de todo */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingContent}>
              <LoadingDots />
              <Text style={styles.processingText}>Procesando comprobante...</Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  scanArea: {
    width: width * 0.8,
    height: height * 0.4,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00DC5A',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  instructionsSubtext: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#CCC',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryButtonText: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
    marginTop: 4,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00DC5A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  captureButtonDisabled: {
    backgroundColor: '#666',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
  },
  debugButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 8,
  },
  debugButtonText: {
    fontSize: 10,
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
    marginTop: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#CCC',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: '#00DC5A',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_600SemiBold',
    color: '#FFF',
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
    color: '#FFF',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    backgroundColor: '#000',
    padding: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontFamily: 'Outfit_400Regular',
    color: '#FFF',
    marginTop: 10,
  },
  capturedImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: '#000',
  },
});

export default ReceiptScanner;