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
   */
  const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
    visible,
    onClose,
    onDataExtracted,
  }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [flashMode, setFlashMode] = useState<'off' | 'on'>('off');
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
        requestPermissions();
      }
    }, [visible, permissions.camera, requestPermissions]);

    /**
     * Toma una foto y procesa el comprobante
     */
    const takePicture = async (): Promise<void> => {
      if (!cameraRef.current || isProcessing) return;

      try {
        setIsProcessing(true);

        // Tomar la foto
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: false
        })
        


        if (!photo || !photo.uri) {
          throw new Error('No se pudo tomar la foto');
        }

        // Procesar la imagen con OCR
        const result = await integratedOCRService.processReceiptImage(photo.uri);

        if (result.success && result.data) {
          // Mostrar los datos extraídos al usuario
          showExtractedDataConfirmation(result.data);
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
      } catch (error) {
        console.error('Error tomando foto:', error);
        Alert.alert(
          'Error',
          'Hubo un problema al procesar la imagen. Por favor, intenta nuevamente.',
          [{ text: 'Entendido' }]
        );
      } finally {
        setIsProcessing(false);
      }
    };

    /**
     * Permite seleccionar una imagen de la galería
     */
    const selectFromGallery = async (): Promise<void> => {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          setIsProcessing(true);
          
          const ocrResult = await integratedOCRService.processReceiptImage(result.assets[0].uri);

          if (ocrResult.success && ocrResult.data) {
            showExtractedDataConfirmation(ocrResult.data);
          } else {
            Alert.alert(
              'Error de procesamiento',
              ocrResult.error || 'No se pudieron extraer datos de la imagen seleccionada.',
              [{ text: 'Entendido' }]
            );
          }
        }
      } catch (error) {
        console.error('Error seleccionando imagen:', error);
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
      const details = [
        data.amount && `Monto: S/ ${data.amount.toFixed(2)}`,
        data.merchantName && `Comercio: ${data.merchantName}`,
        data.category && `Categoría: ${data.category}`,
        data.date && `Fecha: ${new Date(data.date).toLocaleDateString('es-PE')}`,
      ].filter(Boolean).join('\n');

      Alert.alert(
        'Datos extraídos',
        `Se han extraído los siguientes datos:\n\n${details}\n\nConfianza: ${data.confidence}%\n\n¿Deseas usar estos datos?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Usar datos', 
            onPress: () => {
              onDataExtracted(data);
              onClose();
            }
          },
        ]
      );
    };

    /**
     * Alterna el flash de la cámara
     */
    const toggleFlash = (): void => {
      setFlashMode(flashMode === 'off' ? 'on' : 'off');
    };

    // Renderizar modal de carga de permisos
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

    // Renderizar modal de solicitud de permisos
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

            <View style={styles.galleryButton}>
              {/* Espacio para equilibrar el layout */}
            </View>
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