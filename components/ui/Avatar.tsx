// components/ui/Avatar.tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageErrorEventData,
  NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AvatarProps {
  imageUrl?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  editable?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  loading?: boolean; // Loading externo (subida/eliminación)
  progress?: number;
  showEditIcon?: boolean;
}

const SIZES = {
  small: 40,
  medium: 60,
  large: 80,
  xlarge: 120,
};

const EDIT_ICON_SIZES = {
  small: 16,
  medium: 20,
  large: 24,
  xlarge: 28,
};

export default function Avatar({
  imageUrl,
  name,
  size = 'medium',
  editable = false,
  onPress,
  onEdit,
  loading = false, // Loading externo
  progress = 0,
  showEditIcon = true,
}: AvatarProps) {
  // Estados internos para el manejo de la imagen
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const avatarSize = SIZES[size];
  const editIconSize = EDIT_ICON_SIZES[size];

  // 🔧 CLAVE: Resetear estados cuando cambia la URL
  useEffect(() => {
    if (imageUrl) {
      setImageError(false);
      setImageLoading(false); // 🆕 Comenzar en false, no en true
    } else {
      setImageError(false);
      setImageLoading(false);
    }
  }, [imageUrl]);

  // Manejar inicio de carga de imagen
  const handleLoadStart = useCallback(() => {
    console.log('🖼️ [Avatar] Iniciando carga de imagen');
    setImageLoading(true);
    setImageError(false);
  }, []);

  // Manejar carga exitosa de imagen
  const handleLoadEnd = useCallback(() => {
    console.log('🖼️ [Avatar] Imagen cargada exitosamente');
    setImageLoading(false);
  }, []);

  // Manejar error de carga de imagen
  const handleError = useCallback((error: NativeSyntheticEvent<ImageErrorEventData>) => {
    console.log('❌ [Avatar] Error cargando imagen:', error.nativeEvent.error);
    setImageLoading(false);
    setImageError(true);
  }, []);

  // Obtener iniciales del nombre
  const getInitials = useCallback((fullName?: string): string => {
    if (!fullName) return '?';
    
    const words = fullName.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }, []);

  // 🔧 CLAVE: Solo mostrar loading externo, no el interno de la imagen
  const shouldShowLoading = loading; // Solo loading externo

  // Determinar qué contenido mostrar
  const renderAvatarContent = () => {
    // Si hay loading externo (subida/eliminación), mostrar loading
    if (shouldShowLoading) {
      return (
        <View style={[styles.loadingContainer, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
          <ActivityIndicator size="large" color="#00DC5A" />
          {progress > 0 && progress < 100 && (
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          )}
        </View>
      );
    }

    // Si hay URL de imagen y no hay error
    if (imageUrl && !imageError) {
      return (
        <View style={{ position: 'relative' }}>
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.avatar,
              { 
                width: avatarSize, 
                height: avatarSize, 
                borderRadius: avatarSize / 2,
                // 🔧 CLAVE: No cambiar opacidad, dejar que la imagen se muestre normalmente
                opacity: 1,
              }
            ]}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            // Configuraciones para mejorar la carga
            resizeMode="cover"
          />
          
          {/* 🔧 CLAVE: Solo mostrar loading overlay si realmente está cargando Y es la primera vez */}
          {imageLoading && (
            <View style={[
              styles.imageLoadingOverlay,
              { 
                width: avatarSize, 
                height: avatarSize, 
                borderRadius: avatarSize / 2 
              }
            ]}>
              <ActivityIndicator size="small" color="#00DC5A" />
            </View>
          )}
        </View>
      );
    }

    // Mostrar iniciales si no hay imagen o hay error
    return (
      <View style={[
        styles.initialsContainer,
        { 
          width: avatarSize, 
          height: avatarSize, 
          borderRadius: avatarSize / 2 
        }
      ]}>
        <Text style={[
          styles.initialsText,
          { fontSize: avatarSize * 0.4 }
        ]}>
          {getInitials(name)}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress || loading}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={styles.avatarWrapper}>
        {renderAvatarContent()}
        
        {/* Ícono de edición */}
        {editable && showEditIcon && !loading && (
          <TouchableOpacity
            style={[
              styles.editButton,
              { 
                width: editIconSize + 8, 
                height: editIconSize + 8,
                borderRadius: (editIconSize + 8) / 2 
              }
            ]}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="camera" 
              size={editIconSize} 
              color="#FFF" 
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    borderWidth: 3,
    borderColor: '#FFF',
    // Sombra para darle profundidad
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    marginTop: 4,
    fontSize: 10,
    color: '#00DC5A',
    fontFamily: 'Outfit_500Medium',
  },
  initialsContainer: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  initialsText: {
    color: '#666',
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#00DC5A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
});