// app/services/imageUploadService.ts
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '@/app/config/env';

export interface ImageUploadResult {
  success: boolean;
  profilePictureUrl?: string;
  error?: string;
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
}

class ImageUploadService {
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  // ✅ URLs para ambos endpoints
  private readonly UPLOAD_ENDPOINT = `${env.API_URL}/users/profile-picture`;
  private readonly UPLOAD_BASE64_ENDPOINT = `${env.API_URL}/users/profile-picture-base64`;

  /**
   * 🚀 Solicita permisos para acceder a la galería
   */
  async requestGalleryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('⚠️ [ImageUpload] Permisos de galería denegados');
        return false;
      }

      return true;
    } catch (error) {
      console.error('💥 [ImageUpload] Error solicitando permisos:', error);
      return false;
    }
  }

  /**
   * 🖼️ Permite al usuario seleccionar una imagen de la galería
   */
  async pickImageFromGallery(): Promise<string | null> {
    try {
      const hasPermission = await this.requestGalleryPermissions();
      if (!hasPermission) {
        throw new Error('Permisos de galería requeridos');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Aspecto cuadrado para foto de perfil
        quality: 0.8,
        base64: false,
      });

      if (result.canceled || !result.assets?.[0]) {
        console.log('📷 [ImageUpload] Selección de imagen cancelada');
        return null;
      }

      return result.assets[0].uri;
    } catch (error) {
      console.error('💥 [ImageUpload] Error seleccionando imagen:', error);
      throw error;
    }
  }

  /**
   * ✂️ Procesa y optimiza la imagen antes de subirla
   */
  async processImage(imageUri: string): Promise<ProcessedImage> {
    try {
      console.log('🔄 [ImageUpload] Procesando imagen...');

      // Obtener información de la imagen
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [], // Sin manipulaciones, solo para obtener info
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );

      let processedImage = imageInfo;

      // ✅ MEJORA: Redimensionar más agresivamente para reducir tamaño
      const MAX_SIZE = 800; // Reducido de 1024 a 800 para imágenes más pequeñas
      
      if (imageInfo.width > MAX_SIZE || imageInfo.height > MAX_SIZE) {
        console.log('📐 [ImageUpload] Redimensionando imagen...');
        
        processedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: MAX_SIZE, height: MAX_SIZE } }],
          { 
            compress: 0.7, // Reducido de 0.8 a 0.7 para mayor compresión
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
      }

      // Verificar tamaño del archivo
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();
      
      // ✅ MEJORA: Límite más estricto para evitar problemas
      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB en lugar de 5MB
      
      if (blob.size > MAX_FILE_SIZE) {
        console.log('🗜️ [ImageUpload] Comprimiendo imagen más agresivamente...');
        
        // Comprimir más agresivamente
        processedImage = await ImageManipulator.manipulateAsync(
          processedImage.uri,
          [{ resize: { width: 600, height: 600 } }], // Redimensionar más pequeño
          { 
            compress: 0.5, // Compresión más agresiva
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
        
        // Verificar nuevamente el tamaño
        const newResponse = await fetch(processedImage.uri);
        const newBlob = await newResponse.blob();
        
        console.log('🗜️ [ImageUpload] Tamaño después de compresión agresiva:', {
          originalSize: blob.size,
          newSize: newBlob.size,
          reduction: Math.round(((blob.size - newBlob.size) / blob.size) * 100) + '%'
        });
      }

      // Verificación final del tamaño
      const finalResponse = await fetch(processedImage.uri);
      const finalBlob = await finalResponse.blob();
      
      console.log('✅ [ImageUpload] Imagen procesada exitosamente:', {
        width: processedImage.width,
        height: processedImage.height,
        fileSizeKB: Math.round(finalBlob.size / 1024),
        fileSizeMB: Math.round(finalBlob.size / (1024 * 1024) * 100) / 100,
      });
      
      return {
        uri: processedImage.uri,
        width: processedImage.width,
        height: processedImage.height,
        size: finalBlob.size,
      };
    } catch (error) {
      console.error('💥 [ImageUpload] Error procesando imagen:', error);
      throw new Error('No se pudo procesar la imagen');
    }
  }

  /**
   * ⬆️ Sube la imagen procesada al servidor
   */
  async uploadProfilePicture(processedImage: ProcessedImage): Promise<ImageUploadResult> {
    try {
      console.log('⬆️ [ImageUpload] Iniciando subida de imagen...');
      console.log('⬆️ [ImageUpload] Endpoint:', this.UPLOAD_ENDPOINT);

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      console.log('⬆️ [ImageUpload] Imagen procesada:', {
        uri: processedImage.uri,
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size,
      });

      // ✅ NUEVA SOLUCIÓN: Usar un enfoque diferente - base64 o cambiar a multipart manual
      console.log('🔄 [ImageUpload] Probando con RNFetchBlob approach...');
      
      // ✅ Crear FormData usando una aproximación más directa para React Native
      const formData = new FormData();
      
      // ✅ CRÍTICO: Usar la estructura exacta que React Native espera
      const fileData = {
        uri: processedImage.uri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      };

      // ✅ Log detallado del objeto que vamos a enviar
      console.log('📤 [ImageUpload] Datos del archivo a enviar:', fileData);

      formData.append('profilePicture', fileData as any);

      // ✅ Log del FormData para debugging
      console.log('📤 [ImageUpload] FormData creado');

      // ✅ CAMBIO CRÍTICO: Usar fetch con configuración específica para React Native
      const response = await fetch(this.UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': '*/*',
          // ✅ IMPORTANTE: NO establecer Content-Type - dejar que React Native lo maneje
        },
        body: formData,
      });

      console.log('⬆️ [ImageUpload] Response status:', response.status);
      console.log('⬆️ [ImageUpload] Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('⬆️ [ImageUpload] Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ [ImageUpload] Error parsing JSON:', parseError);
        throw new Error(`Error parsing response: ${responseText}`);
      }

      console.log('✅ [ImageUpload] Upload successful:', responseData);

      return {
        success: true,
        profilePictureUrl: responseData.profilePictureUrl,
      };

    } catch (error) {
      console.error('💥 [ImageUpload] Error subiendo imagen:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * 🔄 MÉTODO ALTERNATIVO: Subida usando base64
   */
  async uploadProfilePictureBase64(processedImage: ProcessedImage): Promise<ImageUploadResult> {
    try {
      console.log('⬆️ [ImageUpload] Iniciando subida con base64...');
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      // ✅ Convertir imagen a base64
      console.log('🔄 [ImageUpload] Convirtiendo a base64...');
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Remover el prefijo data:image/jpeg;base64,
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      console.log('✅ [ImageUpload] Base64 creado, length:', base64.length);

      // ✅ Enviar como JSON con base64
      const jsonResponse = await fetch(this.UPLOAD_BASE64_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          profilePicture: base64,
          filename: 'profile-picture.jpg',
          mimetype: 'image/jpeg',
        }),
      });

      console.log('⬆️ [ImageUpload] JSON Response status:', jsonResponse.status);
      const jsonResponseText = await jsonResponse.text();
      console.log('⬆️ [ImageUpload] JSON Response:', jsonResponseText);

      if (!jsonResponse.ok) {
        throw new Error(`HTTP ${jsonResponse.status}: ${jsonResponseText}`);
      }

      const responseData = JSON.parse(jsonResponseText);
      return {
        success: true,
        profilePictureUrl: responseData.profilePictureUrl,
      };

    } catch (error) {
      console.error('💥 [ImageUpload] Error en subida base64:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * 🔄 Flujo completo: seleccionar, procesar y subir imagen
   */
  async selectAndUploadProfilePicture(): Promise<ImageUploadResult> {
    try {
      console.log('🔄 [ImageUpload] Iniciando flujo completo de subida...');
      
      // 1. Seleccionar imagen
      const imageUri = await this.pickImageFromGallery();
      if (!imageUri) {
        return { success: false, error: 'No se seleccionó ninguna imagen' };
      }

      console.log('📷 [ImageUpload] Imagen seleccionada:', imageUri.substring(0, 50) + '...');

      // 2. Procesar imagen
      const processedImage = await this.processImage(imageUri);
      console.log('✂️ [ImageUpload] Imagen procesada:', {
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size,
      });

      // 3. Intentar subida con FormData primero
      console.log('🔄 [ImageUpload] Intentando subida con FormData...');
      let result = await this.uploadProfilePicture(processedImage);
      
      // 4. Si FormData falla, intentar con base64
      if (!result.success && result.error?.includes('Multipart')) {
        console.log('🔄 [ImageUpload] FormData falló, intentando con base64...');
        result = await this.uploadProfilePictureBase64(processedImage);
      }

      return result;
    } catch (error) {
      console.error('💥 [ImageUpload] Error en flujo completo:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando la imagen',
      };
    }
  }
}

// Exportar instancia singleton
export const imageUploadService = new ImageUploadService();