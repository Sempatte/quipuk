import { useState, useEffect } from 'react';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

export interface CameraPermissions {
  camera: boolean;
  mediaLibrary: boolean;
}

export interface CameraPermissionsHook {
  permissions: CameraPermissions;
  hasAllPermissions: boolean;
  isLoading: boolean;
  requestPermissions: () => Promise<boolean>;
}

/**
 * Hook personalizado para manejar permisos de cámara y galería
 * Sigue las mejores prácticas de UX para solicitud de permisos
 */
export const useCameraPermissions = (): CameraPermissionsHook => {
  const [permissions, setPermissions] = useState<CameraPermissions>({
    camera: false,
    mediaLibrary: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Verificar permisos existentes al montar el componente
  useEffect(() => {
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async (): Promise<void> => {
    try {
      const [cameraStatus, mediaLibraryStatus] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        MediaLibrary.getPermissionsAsync(),
      ]);

      setPermissions({
        camera: cameraStatus.status === 'granted',
        mediaLibrary: mediaLibraryStatus.status === 'granted',
      });
    } catch (error) {
      console.error('Error verificando permisos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Solicitar permisos secuencialmente para mejor UX
      const cameraResult = await Camera.requestCameraPermissionsAsync();
      
      if (cameraResult.status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a la cámara para escanear comprobantes. Por favor, habilita el permiso en la configuración de la aplicación.',
          [{ text: 'Entendido' }]
        );
        return false;
      }

      const mediaLibraryResult = await MediaLibrary.requestPermissionsAsync();
      
      const newPermissions: CameraPermissions = {
        camera: cameraResult.status === 'granted',
        mediaLibrary: mediaLibraryResult.status === 'granted',
      };

      setPermissions(newPermissions);

      // Mostrar mensaje si no se otorgaron todos los permisos
      if (!newPermissions.mediaLibrary) {
        Alert.alert(
          'Permiso opcional',
          'El acceso a la galería es opcional, pero te permitirá seleccionar comprobantes guardados.',
          [{ text: 'Entendido' }]
        );
      }

      return newPermissions.camera;
    } catch (error) {
      console.error('Error solicitando permisos:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al solicitar los permisos. Por favor, intenta nuevamente.',
        [{ text: 'Entendido' }]
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const hasAllPermissions = permissions.camera && permissions.mediaLibrary;

  return {
    permissions,
    hasAllPermissions,
    isLoading,
    requestPermissions,
  };
};