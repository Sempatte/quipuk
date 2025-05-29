// hooks/useProfilePicture.ts
import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Alert } from 'react-native';
import { imageUploadService } from '@/app/services/imageUploadService';
import { GET_USER_PROFILE, DELETE_PROFILE_PICTURE } from '@/app/graphql/users.graphql';
import { useToast } from '@/app/providers/ToastProvider';

export interface ProfilePictureState {
  profilePictureUrl: string | null;
  isUploading: boolean;
  isDeleting: boolean;
  uploadProgress: number;
}

export interface UseProfilePictureReturn {
  state: ProfilePictureState;
  selectAndUploadImage: () => Promise<void>;
  deleteProfilePicture: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

export const useProfilePicture = (): UseProfilePictureReturn => {
  const { showToast } = useToast();
  
  // Estados locales
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Query para obtener perfil del usuario
  const { data, refetch } = useQuery(GET_USER_PROFILE, {
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all'
  });

  // Mutation para eliminar foto de perfil
  const [deleteProfilePictureMutation] = useMutation(DELETE_PROFILE_PICTURE, {
    refetchQueries: [{ query: GET_USER_PROFILE }],
    onCompleted: () => {
      showToast('success', 'Éxito', 'Foto de perfil eliminada correctamente');
    },
    onError: (error) => {
      console.error('Error deleting profile picture:', error);
      showToast('error', 'Error', 'No se pudo eliminar la foto de perfil');
    }
  });

  // Estado combinado
  const state: ProfilePictureState = {
    profilePictureUrl: data?.getUserProfile?.profilePictureUrl || null,
    isUploading,
    isDeleting,
    uploadProgress,
  };

  /**
   * 📸 Seleccionar y subir imagen
   */
  const selectAndUploadImage = useCallback(async (): Promise<void> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Simular progreso durante la selección
      setUploadProgress(20);

      console.log('🚀 [useProfilePicture] Iniciando selección y subida de imagen...');
      
      const result = await imageUploadService.selectAndUploadProfilePicture();

      setUploadProgress(80);

      if (result.success && result.profilePictureUrl) {
        console.log('✅ [useProfilePicture] Imagen subida exitosamente:', result.profilePictureUrl);
        
        setUploadProgress(100);
        
        // Refrescar los datos del perfil para obtener la nueva URL
        await refetch();
        
        showToast('success', 'Éxito', 'Foto de perfil actualizada correctamente');
      } else {
        console.error('❌ [useProfilePicture] Error en la subida:', result.error);
        showToast('error', 'Error', result.error || 'No se pudo subir la imagen');
      }
    } catch (error) {
      console.error('💥 [useProfilePicture] Error crítico:', error);
      showToast('error', 'Error', 'Ocurrió un error inesperado');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [refetch, showToast]);

  /**
   * 🗑️ Eliminar foto de perfil
   */
  const deleteProfilePicture = useCallback(async (): Promise<void> => {
    if (!state.profilePictureUrl) {
      showToast('info', 'Información', 'No hay foto de perfil para eliminar');
      return;
    }

    Alert.alert(
      'Eliminar foto de perfil',
      '¿Estás seguro de que deseas eliminar tu foto de perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              console.log('🗑️ [useProfilePicture] Eliminando foto de perfil...');
              
              await deleteProfilePictureMutation();
              
              console.log('✅ [useProfilePicture] Foto eliminada exitosamente');
            } catch (error) {
              console.error('💥 [useProfilePicture] Error eliminando foto:', error);
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  }, [state.profilePictureUrl, deleteProfilePictureMutation, showToast]);

  /**
   * 🔄 Refrescar perfil
   */
  const refetchProfile = useCallback(async (): Promise<void> => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refetching profile:', error);
    }
  }, [refetch]);

  return {
    state,
    selectAndUploadImage,
    deleteProfilePicture,
    refetchProfile,
  };
};