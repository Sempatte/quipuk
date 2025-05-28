import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useCameraPermissions } from '@/hooks/useCamaraPermissions';
import { ExtractedReceiptData, integratedOCRService } from '@/app/services/integratedOCRService';

const { width, height } = Dimensions.get('window');

interface ReceiptScannerProps {
  visible: boolean;
  onClose: () => void;
  onDataExtracted: (data: ExtractedReceiptData) => void;
}

/**
 * Componente de cámara para escanear comprobantes
 * Incluye funcionalidad de OCR y extracción de datos
 * Con debugging detallado para identificar problemas
 */
const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  visible,
  onClose,
  onDataExtracted,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
  const [debugMode, setDebugMode] = useState(__DEV__); // Solo en desarrollo
  const cameraRef = useRef<CameraView>(null);
  
  const {
    permissions,
    hasAllPermissions,
    isLoading: permissionsLoading,
    requestPermissions,
  } = useCameraPermissions();

  // Solicitar permisos cuando se abre el modal
  useEffect(() => {
    if (visible && !permissions.camera) {
      console.log('📷 [Scanner] Solicitando permisos de cámara...');
      requestPermissions();
    }
  }, [visible, permissions.camera, requestPermissions]);

  // Log inicial cuando se abre el modal
  useEffect(() => {
    if (visible) {
      console.log('📷 [Scanner] ============ MODAL ABIERTO ============');
      console.log('📷 [Scanner] Estado inicial:', {
        hasPermissions: hasAllPermissions,
        cameraPermission: permissions.camera,
        mediaLibraryPermission: permissions.mediaLibrary,
        isProcessing,
        flashMode
      });
      
      // Test del servicio OCR al abrir
      if (debugMode) {
        integratedOCRService.testOCRService().then(result => {
          console.log('🧪 [Scanner] Test OCR Service:', result);
        });
      }
    }
  }, [visible, hasAllPermissions, permissions, isProcessing, flashMode, debugMode]);

  /**
   * Toma una foto y procesa el comprobante
   */
  const takePicture = async (): Promise<void> => {
    console.log('📷 [Scanner] ============ INICIANDO CAPTURA ============');
    
    if (!cameraRef.current) {
      console.error('❌ [Scanner] Camera ref no disponible');
      Alert.alert('Error', 'Cámara no disponible');
      return;
    }

    if (isProcessing) {
      console.log('⚠️ [Scanner] Ya hay un procesamiento en curso');
      return;
    }

    try {
      console.log('📸 [Scanner] Iniciando captura de foto...');
      console.log('📸 [Scanner] Estado de la cámara:', {
        hasRef: !!cameraRef.current,
        flashMode,
        timestamp: new Date().toISOString()
      });
      
      setIsProcessing(true);

      // Tomar la foto con configuración optimizada
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
        exif: false,
      });

      console.log('📸 [Scanner] Foto capturada:', {
        hasPhoto: !!photo,
        hasUri: !!photo?.uri,
        uri: photo?.uri?.substring(0, 80) + '...',
        width: photo?.width,
        height: photo?.height,
        timestamp: new Date().toISOString()
      });

      if (!photo || !photo.uri) {
        throw new Error('No se pudo tomar la foto - URI vacía');
      }

      // Verificar que el archivo existe y es válido
      console.log('📸 [Scanner] Verificando archivo de imagen...');
      try {
        const response = await fetch(photo.uri);
        const contentLength = response.headers.get('content-length');
        const contentType = response.headers.get('content-type');
        
        console.log('📸 [Scanner] Verificación de archivo:', {
          status: response.status,
          ok: response.ok,
          size: contentLength,
          type: contentType,
          hasResponse: !!response
        });

        if (!response.ok) {
          throw new Error(`Error verificando archivo: ${response.status}`);
        }

        if (contentLength && parseInt(contentLength) === 0) {
          throw new Error('El archivo de imagen está vacío');
        }
      } catch (fetchError) {
        console.error('❌ [Scanner] Error verificando archivo:', fetchError);
        throw new Error(`No se pudo verificar el archivo de imagen: ${fetchError instanceof Error ? fetchError.message : 'Error desconocido'}`);
      }

      console.log('🔍 [Scanner] ============ INICIANDO OCR ============');
      console.log('🔍 [Scanner] Enviando a OCR service...');
      
      // Procesar la imagen con OCR
      const result = await integratedOCRService.processReceiptImage(photo.uri);

      console.log('🔍 [Scanner] ============ RESULTADO OCR ============');
      console.log('🔍 [Scanner] Resultado OCR completo:', {
        success: result.success,
        hasData: !!result.data,
        hasRawText: !!result.rawText,
        error: result.error,
        processingTime: result.processingTime,
        dataDetails: result.data ? {
          amount: result.data.amount,
          merchantName: result.data.merchantName,
          category: result.data.category,
          confidence: result.data.confidence,
          hasDescription: !!result.data.description,
          hasDate: !!result.data.date
        } : null,
        rawTextLength: result.rawText?.length || 0
      });

      if (result.success && result.data) {
        console.log('✅ [Scanner] OCR exitoso, mostrando confirmación...');
        
        // Validar que los datos son útiles
        const hasUsefulData = !!(
          result.data.amount || 
          result.data.merchantName || 
          (result.data.category && result.data.category !== 'Otros') ||
          (result.data.description && result.data.description !== 'Gasto escaneado desde comprobante')
        );

        if (!hasUsefulData) {
          console.log('⚠️ [Scanner] Datos extraídos no son útiles');
          Alert.alert(
            'Datos insuficientes',
            'Se detectó texto pero no se pudieron extraer datos útiles del comprobante. ¿Deseas intentar con otra imagen?',
            [
              { text: 'Reintentar' },
              { 
                text: 'Ver detalles', 
                onPress: () => showDebugInfo(result)
              },
              { text: 'Cancelar', onPress: onClose }
            ]
          );
        } else {
          console.log('✅ [Scanner] Datos útiles encontrados, mostrando confirmación');
          showExtractedDataConfirmation(result.data);
        }
      } else {
        console.error('❌ [Scanner] OCR falló:', result.error);
        
        // Mostrar información de debug en desarrollo
        if (debugMode && result.rawText) {
          Alert.alert(
            'Error de procesamiento',
            `${result.error || 'No se pudieron extraer datos del comprobante'}\n\n¿Deseas ver los detalles técnicos?`,
            [
              { text: 'Reintentar' },
              { 
                text: 'Ver detalles', 
                onPress: () => showDebugInfo(result)
              },
              { text: 'Cancelar', onPress: onClose }
            ]
          );
        } else {
          Alert.alert(
            'Error de procesamiento',
            result.error || 'No se pudieron extraer datos del comprobante. Intenta con mejor iluminación.',
            [
              { text: 'Reintentar' },
              { text: 'Cancelar', onPress: onClose }
            ]
          );
        }
      }
    } catch (error) {
      console.error('💥 [Scanner] Error general tomando foto:', error);
      console.error('💥 [Scanner] Stack trace:', error instanceof Error ? error.stack : 'No stack');
      
      Alert.alert(
        'Error',
        `Hubo un problema al procesar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        [{ text: 'Entendido' }]
      );
    } finally {
      console.log('🔄 [Scanner] ============ FINALIZANDO CAPTURA ============');
      setIsProcessing(false);
    }
  };

  /**
   * Permite seleccionar una imagen de la galería
   */
  const selectFromGallery = async (): Promise<void> => {
    console.log('📷 [Scanner] ============ SELECCIONANDO DE GALERÍA ============');
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('📷 [Scanner] Resultado de galería:', {
        canceled: result.canceled,
        hasAssets: !!(result.assets && result.assets.length > 0),
        firstAssetUri: result.assets?.[0]?.uri?.substring(0, 80) + '...'
      });

      if (!result.canceled && result.assets[0]) {
        console.log('🔍 [Scanner] Procesando imagen de galería...');
        setIsProcessing(true);
        
        const ocrResult = await integratedOCRService.processReceiptImage(result.assets[0].uri);

        console.log('🔍 [Scanner] Resultado OCR de galería:', {
          success: ocrResult.success,
          hasData: !!ocrResult.data,
          error: ocrResult.error
        });

        if (ocrResult.success && ocrResult.data) {
          showExtractedDataConfirmation(ocrResult.data);
        } else {
          Alert.alert(
            'Error de procesamiento',
            ocrResult.error || 'No se pudieron extraer datos de la imagen seleccionada.',
            [
              { text: 'Entendido' },
              debugMode ? { 
                text: 'Ver detalles', 
                onPress: () => showDebugInfo(ocrResult)
              } : null
            ].filter(Boolean) as any[]
          );
        }
      }
    } catch (error) {
      console.error('💥 [Scanner] Error seleccionando imagen:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al procesar la imagen seleccionada.',
        [{ text: 'Entendido' }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Muestra los datos extraídos para confirmación del usuario
   */
  const showExtractedDataConfirmation = (data: ExtractedReceiptData): void => {
    console.log('✅ [Scanner] Mostrando confirmación de datos:', data);
    
    const details = [
      data.amount && `Monto: S/ ${data.amount.toFixed(2)}`,
      data.merchantName && `Comercio: ${data.merchantName}`,
      data.category && `Categoría: ${data.category}`,
      data.date && `Fecha: ${new Date(data.date).toLocaleDateString('es-PE')}`,
    ].filter(Boolean).join('\n');

    const message = details.length > 0 
      ? `Se han extraído los siguientes datos:\n\n${details}\n\nConfianza: ${data.confidence}%\n\n¿Deseas usar estos datos?`
      : `Se detectaron algunos datos del comprobante.\n\nConfianza: ${data.confidence}%\n\n¿Deseas usar estos datos?`;

    Alert.alert(
      'Datos extraídos',
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Usar datos', 
          onPress: () => {
            console.log('✅ [Scanner] Usuario aceptó datos, enviando callback...');
            onDataExtracted(data);
            onClose();
          }
        },
        debugMode ? {
          text: 'Ver detalles',
          onPress: () => showDebugInfo({ success: true, data, processingTime: 0 })
        } : null
      ].filter(Boolean) as any[]
    );
  };

  /**
   * Muestra información de debug (solo en desarrollo)
   */
  const showDebugInfo = (result: any): void => {
    if (!debugMode) return;
    
    console.log('🔍 [Scanner] Mostrando debug info:', result);
    
    const debugText = [
      `Éxito: ${result.success ? 'Sí' : 'No'}`,
      result.error && `Error: ${result.error}`,
      result.processingTime && `Tiempo: ${result.processingTime}ms`,
      result.data && `Datos encontrados: ${Object.keys(result.data).length}`,
      result.data?.amount && `Monto: S/ ${result.data.amount}`,
      result.data?.merchantName && `Comercio: ${result.data.merchantName}`,
      result.data?.category && `Categoría: ${result.data.category}`,
      result.data?.confidence && `Confianza: ${result.data.confidence}%`,
      result.rawText && `Texto detectado: ${result.rawText.length} caracteres`,
      result.rawText && `Primeros 200 caracteres: ${result.rawText.substring(0, 200)}...`
    ].filter(Boolean).join('\n\n');

    Alert.alert(
      'Debug OCR',
      debugText,
      [{ text: 'Cerrar' }]
    );
  };

  /**
   * Alterna el flash de la cámara
   */
  const toggleFlash = (): void => {
    const newMode = flashMode === 'off' ? 'on' : 'off';
    console.log(`📷 [Scanner] Cambiando flash: ${flashMode} -> ${newMode}`);
    setFlashMode(newMode);
  };

  // Renderizar modal de carga de permisos
  if (permissionsLoading) {
    console.log('📷 [Scanner] Mostrando loader de permisos...');
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00DC5A" />
          <Text style={styles.loadingText}>Configurando cámara...</Text>
        </View>
      </Modal>
    );
  }

  // Renderizar modal de solicitud de permisos
  if (!permissions.camera) {
    console.log('📷 [Scanner] Mostrando solicitud de permisos...');
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

  console.log('📷 [Scanner] Renderizando cámara principal');

  return (
    <Modal visible={visible} animationType="slide">
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={onClose}>
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

        {/* Cámara */}
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            flash={flashMode}
          >
            {/* Overlay con guías para el comprobante */}
            <View style={styles.overlay}>
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
          </CameraView>
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
              <ActivityIndicator size="large" color="#FFF" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          {/* Botón de debug (solo en desarrollo) */}
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
                console.log('🧪 [Scanner] TEST: Simulando datos extraídos');
                showExtractedDataConfirmation(mockData);
              }}
            >
              <Ionicons name="bug" size={20} color="#FFF" />
              <Text style={styles.debugButtonText}>TEST</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.galleryButton}>
              {/* Espacio para equilibrar el layout */}
            </View>
          )}
        </View>
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
});

export default ReceiptScanner;