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
  base64: string; // 🆕 Agregamos base64 directamente
}

class ImageUploadService {
  private readonly MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
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
        base64: false, // No necesitamos base64 aquí, lo haremos después del procesamiento
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
   * ✂️ Procesa, optimiza la imagen y genera base64
   */
  async processImage(imageUri: string): Promise<ProcessedImage> {
    try {
      console.log('🔄 [ImageUpload] Procesando imagen para base64...');

      // Paso 1: Redimensionar y optimizar la imagen
      const MAX_SIZE = 800; // Tamaño máximo para fotos de perfil
      
      let processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: MAX_SIZE, height: MAX_SIZE } }],
        { 
          compress: 0.8, // Buena calidad pero tamaño reducido
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true // 🆕 Solicitar base64 directamente
        }
      );

      // Verificar que tenemos base64
      if (!processedImage.base64) {
        throw new Error('No se pudo generar base64 de la imagen');
      }

      // Paso 2: Verificar el tamaño del base64
      const base64Size = (processedImage.base64.length * 3) / 4; // Aproximación del tamaño real
      console.log(`📊 [ImageUpload] Tamaño base64: ${Math.round(base64Size / 1024)}KB`);

      // Paso 3: Si es muy grande, comprimir más agresivamente
      if (base64Size > this.MAX_IMAGE_SIZE) {
        console.log('🗜️ [ImageUpload] Imagen muy grande, comprimiendo más...');
        
        processedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 600, height: 600 } }], // Más pequeño
          { 
            compress: 0.6, // Compresión más agresiva
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          }
        );

        if (!processedImage.base64) {
          throw new Error('No se pudo generar base64 después de la compresión');
        }

        const newSize = (processedImage.base64.length * 3) / 4;
        console.log(`📊 [ImageUpload] Nuevo tamaño base64: ${Math.round(newSize / 1024)}KB`);
      }

      // Paso 4: Verificación final
      const finalSize = (processedImage.base64.length * 3) / 4;
      if (finalSize > this.MAX_IMAGE_SIZE) {
        // Último intento con máxima compresión
        console.log('🗜️ [ImageUpload] Aplicando compresión máxima...');
        
        processedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 400, height: 400 } }],
          { 
            compress: 0.4, // Compresión máxima
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          }
        );

        if (!processedImage.base64) {
          throw new Error('No se pudo generar base64 con compresión máxima');
        }
      }

      const result: ProcessedImage = {
        uri: processedImage.uri,
        width: processedImage.width,
        height: processedImage.height,
        size: (processedImage.base64.length * 3) / 4,
        base64: processedImage.base64,
      };

      console.log('✅ [ImageUpload] Imagen procesada exitosamente:', {
        width: result.width,
        height: result.height,
        sizeKB: Math.round(result.size / 1024),
        base64Length: result.base64.length,
      });
      
      return result;
    } catch (error) {
      console.error('💥 [ImageUpload] Error procesando imagen:', error);
      throw new Error('No se pudo procesar la imagen');
    }
  }

  /**
   * ⬆️ Sube la imagen usando base64
   */
  async uploadProfilePictureBase64(processedImage: ProcessedImage): Promise<ImageUploadResult> {
    try {
      console.log('⬆️ [ImageUpload] Iniciando subida con base64...');
      console.log('⬆️ [ImageUpload] Endpoint:', this.UPLOAD_BASE64_ENDPOINT);
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      console.log('📤 [ImageUpload] Enviando imagen base64...', {
        width: processedImage.width,
        height: processedImage.height,
        sizeKB: Math.round(processedImage.size / 1024),
        base64Length: processedImage.base64.length,
      });

      const response = await fetch(this.UPLOAD_BASE64_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          profilePicture: processedImage.base64,
          filename: 'profile-picture.jpg',
          mimetype: 'image/jpeg',
          width: processedImage.width,
          height: processedImage.height,
        }),
      });

      console.log('⬆️ [ImageUpload] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [ImageUpload] Error response:', errorText);
        
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        switch (response.status) {
          case 413:
            errorMessage = 'La imagen es demasiado grande. Intenta con una imagen más pequeña.';
            break;
          case 415:
            errorMessage = 'Formato de imagen no soportado. Usa JPG o PNG.';
            break;
          case 401:
            errorMessage = 'Sesión expirada. Inicia sesión nuevamente.';
            break;
          case 500:
            errorMessage = 'Error del servidor. Intenta nuevamente más tarde.';
            break;
          default:
            try {
              const errorData = JSON.parse(errorText);
              if (errorData.message) {
                errorMessage = errorData.message;
              }
            } catch (e) {
              // Mantener el mensaje por defecto
            }
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      
      console.log('✅ [ImageUpload] Upload successful:', {
        profilePictureUrl: responseData.profilePictureUrl,
        success: responseData.success || true,
      });

      return {
        success: true,
        profilePictureUrl: responseData.profilePictureUrl,
      };

    } catch (error) {
      console.error('💥 [ImageUpload] Error en subida base64:', error);
      
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 🔄 Flujo completo: seleccionar, procesar y subir imagen usando base64
   */
  async selectAndUploadProfilePicture(): Promise<ImageUploadResult> {
    try {
      console.log('🔄 [ImageUpload] Iniciando flujo completo con base64...');
      
      // 1. Seleccionar imagen
      const imageUri = await this.pickImageFromGallery();
      if (!imageUri) {
        return { success: false, error: 'No se seleccionó ninguna imagen' };
      }

      console.log('📷 [ImageUpload] Imagen seleccionada:', imageUri.substring(0, 50) + '...');

      // 2. Procesar imagen y generar base64
      const processedImage = await this.processImage(imageUri);
      console.log('✂️ [ImageUpload] Imagen procesada con base64:', {
        width: processedImage.width,
        height: processedImage.height,
        sizeKB: Math.round(processedImage.size / 1024),
      });

      // 3. Subir usando base64
      console.log('⬆️ [ImageUpload] Subiendo con base64...');
      const result = await this.uploadProfilePictureBase64(processedImage);

      return result;
    } catch (error) {
      console.error('💥 [ImageUpload] Error en flujo completo base64:', error);
      
      let errorMessage = 'Error procesando la imagen';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * 📊 Obtener información del servicio para debugging
   */
  getServiceInfo(): Record<string, any> {
    return {
      uploadMethod: 'base64',
      endpoint: this.UPLOAD_BASE64_ENDPOINT,
      maxSizeMB: this.MAX_IMAGE_SIZE / (1024 * 1024),
      environment: env.ENV,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🧪 Test del servicio
   */
  async testService(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const info = this.getServiceInfo();
      
      console.log('🧪 [ImageUpload] Service info:', info);
      
      // Verificar configuración básica
      if (!env.API_URL) {
        return {
          success: false,
          message: 'API_URL no configurada',
          details: info
        };
      }
      
      if (!this.UPLOAD_BASE64_ENDPOINT.includes('http')) {
        return {
          success: false,
          message: 'Endpoint inválido',
          details: info
        };
      }
      
      return {
        success: true,
        message: 'Servicio configurado correctamente (base64)',
        details: info
      };
      
    } catch (error) {
      console.error('💥 [ImageUpload] Error en test:', error);
      return {
        success: false,
        message: `Error en test: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        details: { error: error instanceof Error ? error.stack : error }
      };
    }
  }
}

// Exportar instancia singleton
export const imageUploadService = new ImageUploadService();