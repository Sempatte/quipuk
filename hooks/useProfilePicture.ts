// hooks/useProfilePicture.ts
import { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { Alert } from 'react-native';
import { imageUploadService, ImageUploadResult } from '@/app/services/imageUploadService';
import { DELETE_PROFILE_PICTURE, GET_USER_PROFILE } from '@/app/graphql/users.graphql';
import { useToast } from '@/app/providers/ToastProvider';

export interface UseProfilePictureReturn {
  isUploading: boolean;
  isDeleting: boolean;
  uploadProfilePicture: () => Promise<ImageUploadResult>;
  deleteProfilePicture: () => Promise<void>;
  showImageOptions: () => void;
}

export const useProfilePicture = (): UseProfilePictureReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  // Mutación para eliminar foto de perfil
  const [deleteProfilePictureMutation] = useMutation(DELETE_PROFILE_PICTURE, {
    refetchQueries: [{ query: GET_USER_PROFILE }],
  });

  /**
   * 📸 Subir nueva foto de perfil
   */
  const uploadProfilePicture = useCallback(async (): Promise<ImageUploadResult> => {
    if (isUploading) {
      console.log('⚠️ [useProfilePicture] Ya se está subiendo una imagen');
      return { success: false, error: 'Ya se está procesando una imagen' };
    }

    try {
      setIsUploading(true);
      console.log('🚀 [useProfilePicture] Iniciando subida de foto de perfil...');

      const result = await imageUploadService.selectAndUploadProfilePicture();

      if (result.success) {
        showToast('success', '¡Foto actualizada!', 'Tu foto de perfil se ha actualizado correctamente.');
        console.log('✅ [useProfilePicture] Foto subida exitosamente');
      } else {
        showToast('error', 'Error', result.error || 'No se pudo actualizar la foto de perfil.');
        console.error('❌ [useProfilePicture] Error subiendo foto:', result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('💥 [useProfilePicture] Error en uploadProfilePicture:', error);
      
      showToast('error', 'Error', errorMessage);
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, showToast]);

  /**
   * 🗑️ Eliminar foto de perfil
   */
  const deleteProfilePicture = useCallback(async (): Promise<void> => {
    if (isDeleting) {
      console.log('⚠️ [useProfilePicture] Ya se está eliminando la foto');
      return;
    }

    try {
      setIsDeleting(true);
      console.log('🗑️ [useProfilePicture] Eliminando foto de perfil...');

      await deleteProfilePictureMutation();
      
      showToast('success', 'Foto eliminada', 'Tu foto de perfil se ha eliminado correctamente.');
      console.log('✅ [useProfilePicture] Foto eliminada exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error eliminando foto';
      console.error('💥 [useProfilePicture] Error eliminando foto:', error);
      
      showToast('error', 'Error', errorMessage);
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting, deleteProfilePictureMutation, showToast]);

  /**
   * 📋 Mostrar opciones de imagen (subir/eliminar)
   */
  const showImageOptions = useCallback(() => {
    const options = [
      {
        text: 'Subir nueva foto',
        onPress: uploadProfilePicture,
      },
      {
        text: 'Eliminar foto actual',
        onPress: () => {
          Alert.alert(
            'Confirmar eliminación',
            '¿Estás seguro de que quieres eliminar tu foto de perfil?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Eliminar', 
                style: 'destructive',
                onPress: deleteProfilePicture 
              },
            ]
          );
        },
        style: 'destructive' as const,
      },
      {
        text: 'Cancelar',
        style: 'cancel' as const,
      },
    ];

    Alert.alert('Foto de perfil', 'Selecciona una opción:', options);
  }, [uploadProfilePicture, deleteProfilePicture]);

  return {
    isUploading,
    isDeleting,
    uploadProfilePicture,
    deleteProfilePicture,
    showImageOptions,
  };
};