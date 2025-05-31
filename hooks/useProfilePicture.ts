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
        
        console.log('✅ [useProfilePicture] Perfil cargado:', {
          hasProfilePicture,
          isValidUrl,
          url: data?.getUserProfile?.profilePictureUrl?.substring(0, 50) + '...'
        });
        
        setHasInitiallyLoaded(true);
        setLastUpdated(Date.now());
        
        // 🆕 Incrementar cache buster si hay nueva imagen
        if (hasProfilePicture && isValidUrl) {
          setCacheBusterCount(prev => prev + 1);
        }
      }
    },
    onError: (error) => {
      console.error('❌ [useProfilePicture] Error cargando perfil:', error);
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
        console.log('🔄 [useProfilePicture] Marcando como inicialmente cargado');
        setHasInitiallyLoaded(true);
        setLastUpdated(Date.now());
      }
    }
  }, [data, loading, error, hasInitiallyLoaded]);

  // 🆕 Calcular URL con cache busting
  const cacheBustedUrl = useCallback(() => {
    const originalUrl = data?.getUserProfile?.profilePictureUrl;
    
    if (!originalUrl || !validateImageUrl(originalUrl)) {
      return null;
    }
    
    // Agregar cache buster solo cuando sea necesario
    return addCacheBuster(originalUrl);
  }, [data?.getUserProfile?.profilePictureUrl, cacheBusterCount]);

  // Mutation para eliminar foto de perfil
  const [deleteProfilePictureMutation] = useMutation(DELETE_PROFILE_PICTURE, {
    refetchQueries: [{ query: GET_USER_PROFILE }],
    onCompleted: () => {
      if (isMountedRef.current) {
        console.log('✅ [useProfilePicture] Foto eliminada exitosamente');
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

      console.log('🚀 [useProfilePicture] Iniciando selección y subida de imagen...');
      
      setUploadProgress(10);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMountedRef.current) return;

      const result = await imageUploadService.selectAndUploadProfilePicture();

      if (!isMountedRef.current) return;

      setUploadProgress(80);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (!isMountedRef.current) return;

      console.log('📤 [useProfilePicture] Resultado de la subida:', {
        success: result.success,
        hasUrl: !!result.profilePictureUrl,
        error: result.error
      });

      if (result.success) {
        console.log('✅ [useProfilePicture] Imagen subida exitosamente');
        
        setUploadProgress(100);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!isMountedRef.current) return;
        
        // Refrescar y forzar cache busting
        try {
          await refetch();
          setCacheBusterCount(prev => prev + 1); // 🆕 Forzar nuevo cache buster
          console.log('🔄 [useProfilePicture] Perfil refrescado exitosamente');
        } catch (refetchError) {
          console.error('❌ [useProfilePicture] Error refrescando perfil:', refetchError);
        }
        
        if (isMountedRef.current) {
          showToast('success', 'Éxito', 'Foto de perfil actualizada correctamente');
          setLastUpdated(Date.now());
        }
      } else {
        console.error('❌ [useProfilePicture] Error en la subida:', result.error);
        if (isMountedRef.current) {
          showToast('error', 'Error', result.error || 'No se pudo subir la imagen');
        }
      }
    } catch (error) {
      console.error('💥 [useProfilePicture] Error crítico:', error);
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
              console.log('🗑️ [useProfilePicture] Eliminando foto de perfil...');
              
              await deleteProfilePictureMutation();
              
              if (isMountedRef.current) {
                console.log('✅ [useProfilePicture] Foto eliminada exitosamente');
                setLastUpdated(Date.now());
              }
            } catch (error) {
              console.error('💥 [useProfilePicture] Error eliminando foto:', error);
            } finally {
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
      console.log('🔄 [useProfilePicture] Refrescando perfil manualmente...');
      await refetch();
      
      if (isMountedRef.current) {
        setLastUpdated(Date.now());
        setCacheBusterCount(prev => prev + 1); // 🆕 Nuevo cache buster
        console.log('✅ [useProfilePicture] Perfil refrescado exitosamente');
      }
    } catch (error) {
      console.error('❌ [useProfilePicture] Error refrescando perfil:', error);
    }
  }, [refetch]);

  /**
   * 🆕 Forzar actualización
   */
  const forceRefresh = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log('🔄 [useProfilePicture] Forzando actualización...');
    setLastUpdated(Date.now());
    setCacheBusterCount(prev => prev + 1);
  }, []);

  /**
   * 🆕 Reintentar carga de imagen
   */
  const retryImageLoad = useCallback(() => {
    if (!isMountedRef.current) return;
    
    console.log('🔄 [useProfilePicture] Reintentando carga de imagen...');
    setCacheBusterCount(prev => prev + 1);
  }, []);

  // Log de estado para debugging
  if (__DEV__) {
    console.log('🖼️ [useProfilePicture] Estado actual:', {
      hasUrl: !!state.profilePictureUrl,
      hasCacheBustedUrl: !!state.cacheBustedUrl,
      isUploading: state.isUploading,
      isDeleting: state.isDeleting,
      hasInitiallyLoaded: state.hasInitiallyLoaded,
      isInitialLoading: state.isInitialLoading,
      cacheBusterCount,
      lastUpdated: new Date(state.lastUpdated).toLocaleTimeString(),
    });
  }

  return {
    state,
    selectAndUploadImage,
    deleteProfilePicture,
    refetchProfile,
    forceRefresh,
    retryImageLoad,
  };
};