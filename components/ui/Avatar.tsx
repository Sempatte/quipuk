// components/ui/Avatar.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  // Datos del usuario
  fullName?: string;
  profilePictureUrl?: string | null;
  
  // Configuración visual
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showEditButton?: boolean;
  onPress?: () => void;
  
  // Estados
  isLoading?: boolean;
  
  // Estilos personalizados
  containerStyle?: ViewStyle;
  
  // Accesibilidad
  accessibilityLabel?: string;
}

const SIZES = {
  small: 40,
  medium: 60,
  large: 80,
  xlarge: 120,
} as const;

const FONT_SIZES = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
} as const;

export const Avatar: React.FC<AvatarProps> = ({
  fullName = '',
  profilePictureUrl,
  size = 'medium',
  showEditButton = false,
  onPress,
  isLoading = false,
  containerStyle,
  accessibilityLabel,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Calcular las iniciales del nombre
  const getInitials = (name: string): string => {
    if (!name || name.trim().length === 0) return 'U';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(fullName);
  const avatarSize = SIZES[size];
  const fontSize = FONT_SIZES[size];
  const editButtonSize = Math.max(avatarSize * 0.3, 24);

  // Determinar si mostrar imagen o iniciales
  const shouldShowImage = profilePictureUrl && !imageError;
  const showActivityIndicator = isLoading || imageLoading;

  // Estilos dinámicos
  const containerStyles = [
    styles.container,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
    containerStyle,
  ];

  const textStyles = [
    styles.initialsText,
    { fontSize },
  ];

  const imageStyles = [
    styles.image,
    {
      width: avatarSize,
      height: avatarSize,
      borderRadius: avatarSize / 2,
    },
  ];

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.warn('⚠️ [Avatar] Error cargando imagen de perfil');
    setImageLoading(false);
    setImageError(true);
  };

  const handleImageLoadStart = () => {
    setImageLoading(true);
  };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={containerStyles}
        onPress={onPress}
        disabled={!onPress || isLoading}
        activeOpacity={onPress ? 0.8 : 1}
        accessibilityRole={onPress ? "button" : "image"}
        accessibilityLabel={
          accessibilityLabel || 
          (onPress ? `Cambiar foto de perfil de ${fullName}` : `Foto de perfil de ${fullName}`)
        }
      >
        {/* Mostrar imagen si está disponible */}
        {shouldShowImage && (
          <Image
            source={{ uri: profilePictureUrl }}
            style={imageStyles}
            onLoad={handleImageLoad}
            onError={handleImageError}
            onLoadStart={handleImageLoadStart}
            resizeMode="cover"
          />
        )}

        {/* Mostrar iniciales si no hay imagen */}
        {!shouldShowImage && !showActivityIndicator && (
          <Text style={textStyles}>{initials}</Text>
        )}

        {/* Indicador de carga */}
        {showActivityIndicator && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator 
              size={size === 'small' ? 'small' : 'large'} 
              color="#FFF" 
            />
          </View>
        )}

        {/* Botón de edición */}
        {showEditButton && !isLoading && (
          <View
            style={[
              styles.editButton,
              {
                width: editButtonSize,
                height: editButtonSize,
                borderRadius: editButtonSize / 2,
                bottom: -2,
                right: -2,
              },
            ]}
          >
            <Ionicons
              name="camera"
              size={editButtonSize * 0.5}
              color="#FFF"
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  container: {
    backgroundColor: '#00DC5A',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  image: {
    position: 'absolute',
  },
  initialsText: {
    color: '#FFF',
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    backgroundColor: '#00DC5A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

export default Avatar;