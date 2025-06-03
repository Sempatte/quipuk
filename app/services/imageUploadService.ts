// app/services/imageUploadService.ts - CON DEBUG MEJORADO
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
  base64: string;
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
        return false;
      }

      return true;
    } catch (error) {
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
        base64: false, // No necesitamos base64 aquí
      });

      if (result.canceled || !result.assets?.[0]) {
        return null;
      }

      const selectedImage = result.assets[0];

      return selectedImage.uri;
    } catch (error) {
      throw error;
    }
  }

  /**
   * ✂️ Procesa, optimiza la imagen y genera base64
   */
  async processImage(imageUri: string): Promise<ProcessedImage> {
    try {
      // Verificar que la URI sea válida
      if (!imageUri || typeof imageUri !== 'string') {
        throw new Error('URI de imagen inválida');
      }

      const MAX_SIZE = 800; // Tamaño máximo para fotos de perfil
      
      let processedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: MAX_SIZE, height: MAX_SIZE } }],
        { 
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true // Solicitar base64 directamente
        }
      );

      // Verificar que tenemos base64
      if (!processedImage.base64) {
        throw new Error('No se pudo generar base64 de la imagen');
      }

      // Calcular tamaño del base64
      const base64Size = (processedImage.base64.length * 3) / 4;

      // Si es muy grande, comprimir más agresivamente
      if (base64Size > this.MAX_IMAGE_SIZE) {
        processedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 600, height: 600 } }],
          { 
            compress: 0.6,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true
          }
        );

        if (!processedImage.base64) {
          throw new Error('No se pudo generar base64 después de la compresión');
        }

        const newSize = (processedImage.base64.length * 3) / 4;
        
        // Verificación final
        if (newSize > this.MAX_IMAGE_SIZE) {
          processedImage = await ImageManipulator.manipulateAsync(
            imageUri,
            [{ resize: { width: 400, height: 400 } }],
            { 
              compress: 0.4,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: true
            }
          );

          if (!processedImage.base64) {
            throw new Error('No se pudo generar base64 con compresión máxima');
          }
        }
      }

      const result: ProcessedImage = {
        uri: processedImage.uri,
        width: processedImage.width,
        height: processedImage.height,
        size: (processedImage.base64.length * 3) / 4,
        base64: processedImage.base64,
      };

      return result;
    } catch (error) {
      throw new Error(`Error procesando imagen: ${error instanceof Error ? error.message : 'Desconocido'}`);
    }
  }

  /**
   * ⬆️ Sube la imagen usando base64
   */
  async uploadProfilePictureBase64(processedImage: ProcessedImage): Promise<ImageUploadResult> {
    try {
      // Verificar configuración
      if (!env.API_URL) {
        throw new Error('API_URL no configurada');
      }

      if (!this.UPLOAD_BASE64_ENDPOINT.includes('http')) {
        throw new Error('Endpoint de upload inválido');
      }
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      const payload = {
        profilePicture: processedImage.base64,
        filename: 'profile-picture.jpg',
        mimetype: 'image/jpeg',
        width: processedImage.width,
        height: processedImage.height,
      };

      const response = await fetch(this.UPLOAD_BASE64_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        
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
      
      return {
        success: responseData.success,
        profilePictureUrl: responseData.data?.profilePictureUrl,
      };

    } catch (error) {
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
   * 🔄 Flujo completo: seleccionar, procesar y subir imagen
   */
  async selectAndUploadProfilePicture(): Promise<ImageUploadResult> {
    try {
      // 1. Seleccionar imagen
      const imageUri = await this.pickImageFromGallery();
      
      if (!imageUri) {
        return { success: false, error: 'No se seleccionó ninguna imagen' };
      }

      // 2. Procesar imagen
      const processedImage = await this.processImage(imageUri);
      
      // 3. Subir imagen
      const result = await this.uploadProfilePictureBase64(processedImage);

      return result;
    } catch (error) {
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
      apiUrl: env.API_URL,
      hasApiUrl: !!env.API_URL,
      endpointValid: this.UPLOAD_BASE64_ENDPOINT.includes('http'),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🧪 Test del servicio
   */
  async testService(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const info = this.getServiceInfo();
      
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

      // Verificar token
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'No hay token de autenticación',
          details: { ...info, hasToken: false }
        };
      }

      // Test de conectividad básica
      try {
        const testResponse = await fetch(`${env.API_URL}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        return {
          success: true,
          message: 'Servicio configurado correctamente',
          details: { 
            ...info, 
            hasToken: true,
            connectivityTest: {
              status: testResponse.status,
              ok: testResponse.ok,
            }
          }
        };
      } catch (connectivityError) {
        return {
          success: false,
          message: 'Error de conectividad con el servidor',
          details: { 
            ...info, 
            hasToken: true,
            connectivityError: connectivityError instanceof Error ? connectivityError.message : 'Error desconocido'
          }
        };
      }
      
    } catch (error) {
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