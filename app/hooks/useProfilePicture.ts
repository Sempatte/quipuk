// hooks/useProfilePicture.ts - CON CACHE BUSTING
import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Alert } from 'react-native';
import { imageUploadService } from '@/app/services/imageUploadService';
import { GET_USER_PROFILE, DELETE_PROFILE_PICTURE } from '@/app/graphql/users.graphql';
import { useToast } from '@/app/providers/ToastProvider';
import { addCacheBuster, validateImageUrl } from '@/app/utils/imageUtils';

export interface ProfilePictureState {
  profilePictureUrl: string | null;
  isUploading: boolean;
  isDeleting: boolean;
  uploadProgress: number;
  hasInitiallyLoaded: boolean;
  isInitialLoading: boolean;
  lastUpdated: number;
  cacheBustedUrl: string | null; // 🆕 URL con cache busting
}

export interface UseProfilePictureReturn {
  state: ProfilePictureState;
  selectAndUploadImage: () => Promise<void>;
  deleteProfilePicture: () => Promise<void>;
  refetchProfile: () => Promise<void>;
  forceRefresh: () => void;
  retryImageLoad: () => void; // 🆕 Para reintentar carga de imagen
}

export const useProfilePicture = (): UseProfilePictureReturn => {
  const { showToast } = useToast();
  
  // Estados locales
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [cacheBusterCount, setCacheBusterCount] = useState(0); // 🆕 Para forzar cache busting
  
  const isMountedRef = useRef(true);

  // Query para obtener perfil del usuario
  const { data, refetch, loading, error } = useQuery(GET_USER_PROFILE, {
    fetchPolicy: 'cache-first',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    onCompleted: (data) => {
      if (isMountedRef.current) {
        const hasProfilePicture = !!data?.getUserProfile?.profilePictureUrl;
        const isValidUrl = validateImageUrl(data?.getUserProfile?.profilePictureUrl);
        setHasInitiallyLoaded(true);
        setLastUpdated(Date.now());
        if (hasProfilePicture && isValidUrl) {
          setCacheBusterCount(prev => prev + 1);
        }
      }
    },
    onError: (error) => {
      if (isMountedRef.current) {
        setHasInitiallyLoaded(true);
      }
    }
  });

  // Cleanup al desmontar
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Efecto para marcar como cargado
  useEffect(() => {
    if (!isMountedRef.current) return;
    if (data?.getUserProfile !== undefined || !loading || error) {
      if (!hasInitiallyLoaded) {
        setHasInitiallyLoaded(true);
        setLastUpdated(Date.now());
      }
    }
  }, [data, loading, error, hasInitiallyLoaded]);

  // 🆕 Calcular URL con cache busting
  const cacheBustedUrl = useCallback(() => {
    const originalUrl = data?.getUserProfile?.profilePictureUrl;
    
    // if (!originalUrl || !validateImageUrl(originalUrl)) { // Ya no se valida aquí para simplificar
    //   return null;
    // }
    
    // NO MODIFICAR LA URL FIRMADA DE S3
    // return addCacheBuster(originalUrl);
    return originalUrl || null; // Devolver la URL original tal cual, o null si es undefined

  }, [data?.getUserProfile?.profilePictureUrl]);

  // Mutation para eliminar foto de perfil
  const [deleteProfilePictureMutation] = useMutation(DELETE_PROFILE_PICTURE, {
    refetchQueries: [{ query: GET_USER_PROFILE }],
    onCompleted: () => {
      if (isMountedRef.current) {
        
        showToast('success', 'Éxito', 'Foto de perfil eliminada correctamente');
        setLastUpdated(Date.now());
        setCacheBusterCount(0); // Reset cache buster
      }
    },
    onError: (error) => {
      console.error('❌ [useProfilePicture] Error eliminando foto:', error);
      if (isMountedRef.current) {
        showToast('error', 'Error', 'No se pudo eliminar la foto de perfil');
      }
    }
  });

  // 🆕 Estado combinado con cache busting
  const state: ProfilePictureState = {
    profilePictureUrl: data?.getUserProfile?.profilePictureUrl || null,
    isUploading,
    isDeleting,
    uploadProgress,
    hasInitiallyLoaded,
    isInitialLoading: loading && !hasInitiallyLoaded,
    lastUpdated,
    cacheBustedUrl: cacheBustedUrl(),
  };

  /**
   * 📸 Seleccionar y subir imagen
   */
  const selectAndUploadImage = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadProgress(10);
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!isMountedRef.current) return;
      const result = await imageUploadService.selectAndUploadProfilePicture();
      if (!isMountedRef.current) return;
      setUploadProgress(80);
      await new Promise(resolve => setTimeout(resolve, 200));
      if (!isMountedRef.current) return;
      if (result.success) {
        setUploadProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!isMountedRef.current) return;
        try {
          await refetch();
          setCacheBusterCount(prev => prev + 1);
        } catch (refetchError) {}
        if (isMountedRef.current) {
          showToast('success', 'Éxito', 'Foto de perfil actualizada correctamente');
          setLastUpdated(Date.now());
        }
      } else {
        if (isMountedRef.current) {
          showToast('error', 'Error', result.error || 'No se pudo subir la imagen');
        }
      }
    } catch (error) {
      if (isMountedRef.current) {
        showToast('error', 'Error', 'Ocurrió un error inesperado');
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [refetch, showToast]);

  /**
   * 🗑️ Eliminar foto de perfil
   */
  const deleteProfilePicture = useCallback(async (): Promise<void> => {
    if (!isMountedRef.current) return;
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
            if (!isMountedRef.current) return;
            try {
              setIsDeleting(true);
              await deleteProfilePictureMutation();
              if (isMountedRef.current) {
                setLastUpdated(Date.now());
              }
            } catch (error) {} finally {
              if (isMountedRef.current) {
                setIsDeleting(false);
              }
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
    if (!isMountedRef.current) return;
    try {
      await refetch();
      if (isMountedRef.current) {
        setLastUpdated(Date.now());
        setCacheBusterCount(prev => prev + 1);
      }
    } catch (error) {}
  }, [refetch]);

  /**
   * 🆕 Forzar actualización
   */
  const forceRefresh = useCallback(() => {
    if (!isMountedRef.current) return;
    setLastUpdated(Date.now());
    setCacheBusterCount(prev => prev + 1);
  }, []);

  /**
   * 🆕 Reintentar carga de imagen
   */
  const retryImageLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    setCacheBusterCount(prev => prev + 1);
  }, []);

  return {
    state,
    selectAndUploadImage,
    deleteProfilePicture,
    refetchProfile,
    forceRefresh,
    retryImageLoad,
  };
};