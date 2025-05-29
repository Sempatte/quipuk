// components/ui/Avatar.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tipos para las props del componente
export interface AvatarProps {
  imageUrl?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  editable?: boolean;
  onPress?: () => void;
  onEdit?: () => void;
  loading?: boolean;
  progress?: number;
  showBadge?: boolean;
  badgeContent?: React.ReactNode;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}

// Configuración de tamaños
const SIZES = {
  small: { container: 40, text: 14, icon: 16, edit: 20 },
  medium: { container: 60, text: 18, icon: 24, edit: 24 },
  large: { container: 80, text: 24, icon: 32, edit: 28 },
  xlarge: { container: 120, text: 32, icon: 48, edit: 36 },
} as const;

// Colores para avatares con iniciales
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
] as const;

const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  name,
  size = 'medium',
  editable = false,
  onPress,
  onEdit,
  loading = false,
  progress = 0,
  showBadge = false,
  badgeContent,
  fallbackIcon = 'person',
}) => {
  // Estado para manejo de errores en la carga de imágenes
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Configuración de tamaño actual
  const sizeConfig = SIZES[size];

  // Generar iniciales del nombre
  const initials = useMemo(() => {
    if (!name) return '';
    
    const words = name.trim().split(' ').filter(word => word.length > 0);
    if (words.length === 0) return '';
    
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }, [name]);

  // Color de fondo basado en el nombre
  const backgroundColor = useMemo(() => {
    if (!name) return COLORS[0];
    
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    return COLORS[Math.abs(hash) % COLORS.length];
  }, [name]);

  // Handlers para eventos de imagen
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    console.warn('[Avatar] Error cargando imagen:', imageUrl);
    setImageLoading(false);
    setImageError(true);
  }, [imageUrl]);

  const handleImageLoadStart = useCallback(() => {
    setImageLoading(true);
  }, []);

  // Handler para press del avatar
  const handlePress = useCallback(() => {
    if (onPress) {
      onPress();
    } else if (editable && onEdit) {
      onEdit();
    }
  }, [onPress, onEdit, editable]);

  // Handler para botón de edición
  const handleEditPress = useCallback(() => {
    if (onEdit) {
      onEdit();
    }
  }, [onEdit]);

  // Determinar si mostrar imagen, iniciales o ícono
  const shouldShowImage = imageUrl && !imageError;
  const shouldShowInitials = !shouldShowImage && initials;
  const shouldShowIcon = !shouldShowImage && !shouldShowInitials;

  // Estilos dinámicos
  const containerStyle = useMemo(() => [
    styles.container,
    {
      width: sizeConfig.container,
      height: sizeConfig.container,
      borderRadius: sizeConfig.container / 2,
      backgroundColor: shouldShowInitials ? backgroundColor : '#E5E5E5',
    },
    editable && styles.editable,
  ], [sizeConfig.container, shouldShowInitials, backgroundColor, editable]);

  const textStyle = useMemo(() => [
    styles.initialsText,
    {
      fontSize: sizeConfig.text,
      color: shouldShowInitials ? '#FFFFFF' : '#666666',
    }
  ], [sizeConfig.text, shouldShowInitials]);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={containerStyle}
        onPress={handlePress}
        disabled={loading || (!onPress && !editable)}
        activeOpacity={0.8}
      >
        {/* Imagen del avatar */}
        {shouldShowImage && (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.image,
                {
                  width: sizeConfig.container,
                  height: sizeConfig.container,
                  borderRadius: sizeConfig.container / 2,
                }
              ]}
              onLoad={handleImageLoad}
              onError={handleImageError}
              onLoadStart={handleImageLoadStart}
            />
            
            {/* Indicador de carga de imagen */}
            {imageLoading && (
              <View style={[styles.loadingOverlay, {
                width: sizeConfig.container,
                height: sizeConfig.container,
                borderRadius: sizeConfig.container / 2,
              }]}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </>
        )}

        {/* Iniciales */}
        {shouldShowInitials && (
          <Text style={textStyle} numberOfLines={1}>
            {initials}
          </Text>
        )}

        {/* Ícono por defecto */}
        {shouldShowIcon && (
          <Ionicons
            name={fallbackIcon}
            size={sizeConfig.icon}
            color="#666666"
          />
        )}

        {/* Overlay de carga */}
        {loading && (
          <View style={[styles.loadingOverlay, {
            width: sizeConfig.container,
            height: sizeConfig.container,
            borderRadius: sizeConfig.container / 2,
          }]}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            {progress > 0 && progress < 100 && (
              <Text style={styles.progressText}>
                {Math.round(progress)}%
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>

      {/* Botón de edición */}
      {editable && !loading && (
        <TouchableOpacity
          style={[styles.editButton, {
            width: sizeConfig.edit,
            height: sizeConfig.edit,
            borderRadius: sizeConfig.edit / 2,
            bottom: 0,
            right: 0,
          }]}
          onPress={handleEditPress}
          activeOpacity={0.8}
        >
          <Ionicons
            name="camera"
            size={sizeConfig.edit * 0.5}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      )}

      {/* Badge personalizado */}
      {showBadge && badgeContent && (
        <View style={[styles.badge, {
          top: 0,
          right: 0,
        }]}>
          {badgeContent}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editable: {
    borderColor: '#00DC5A',
    borderWidth: 3,
  },
  image: {
    position: 'absolute',
  },
  initialsText: {
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Outfit_500Medium',
    marginTop: 4,
  },
  editButton: {
    position: 'absolute',
    backgroundColor: '#00DC5A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default Avatar;