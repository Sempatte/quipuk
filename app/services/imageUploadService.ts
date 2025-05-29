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
  private readonly UPLOAD_ENDPOINT = `${env.API_URL}/users/profile-picture`;

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

      // Redimensionar si es muy grande (máximo 1024x1024)
      if (imageInfo.width > 1024 || imageInfo.height > 1024) {
        console.log('📐 [ImageUpload] Redimensionando imagen...');
        
        processedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1024, height: 1024 } }],
          { 
            compress: 0.8, 
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
      }

      // Verificar tamaño del archivo
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();
      
      if (blob.size > this.MAX_IMAGE_SIZE) {
        console.log('🗜️ [ImageUpload] Comprimiendo imagen...');
        
        // Comprimir más agresivamente
        processedImage = await ImageManipulator.manipulateAsync(
          processedImage.uri,
          [],
          { 
            compress: 0.5, 
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
      }

      console.log('✅ [ImageUpload] Imagen procesada exitosamente');
      
      return {
        uri: processedImage.uri,
        width: processedImage.width,
        height: processedImage.height,
        size: blob.size,
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

      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      // Crear FormData
      const formData = new FormData();
      
      // Agregar la imagen al FormData
      const imageFile = {
        uri: processedImage.uri,
        type: 'image/jpeg',
        name: 'profile-picture.jpg',
      } as any;

      formData.append('profilePicture', imageFile);

      // Realizar la petición
      const response = await fetch(this.UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ [ImageUpload] Error del servidor:', responseData);
        throw new Error(responseData.message || 'Error subiendo imagen');
      }

      console.log('✅ [ImageUpload] Imagen subida exitosamente');

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
      return await this.uploadProfilePicture(processedImage);
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