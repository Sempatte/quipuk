// components/ui/Avatar.tsx
import React, { memo } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AvatarProps {
  /** URL de la imagen del avatar */
  imageUrl?: string | null;
  /** Nombre para mostrar iniciales si no hay imagen */
  name?: string;
  /** Tamaño del avatar */
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  /** Si el avatar es editable (muestra botón de cámara) */
  editable?: boolean;
  /** Callback cuando se presiona el avatar */
  onPress?: () => void;
  /** Callback para el botón de editar */
  onEdit?: () => void;
  /** Si está cargando */
  loading?: boolean;
  /** Progreso de carga (0-100) */
  progress?: number;
  /** Estilo personalizado del contenedor */
  style?: ViewStyle;
  /** Si debe mostrar un badge online */
  showOnlineStatus?: boolean;
  /** Estado online */
  isOnline?: boolean;
}

const SIZES = {
  small: { 
    container: 40, 
    text: 16, 
    editButton: 16,
    editIcon: 12,
    badge: 12,
  },
  medium: { 
    container: 60, 
    text: 24, 
    editButton: 24,
    editIcon: 16,
    badge: 16,
  },
  large: { 
    container: 80, 
    text: 32, 
    editButton: 32,
    editIcon: 20,
    badge: 20,
  },
  xlarge: { 
    container: 120, 
    text: 48, 
    editButton: 40,
    editIcon: 24,
    badge: 24,
  },
};

/**
 * Componente Avatar reutilizable con soporte para imágenes, iniciales,
 * estados de carga y funcionalidad de edición
 */
export const Avatar: React.FC<AvatarProps> = memo(({
  imageUrl,
  name = '',
  size = 'medium',
  editable = false,
  onPress,
  onEdit,
  loading = false,
  progress = 0,
  style,
  showOnlineStatus = false,
  isOnline = false,
}) => {
  const dimensions = SIZES[size];
  
  // Extraer iniciales del nombre
  const getInitials = (fullName: string): string => {
    if (!fullName?.trim()) return 'U';
    
    const names = fullName.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);

  // Estilos dinámicos
  const containerStyle: ViewStyle = {
    width: dimensions.container,
    height: dimensions.container,
    borderRadius: dimensions.container / 2,
  };

  const textStyle: TextStyle = {
    fontSize: dimensions.text,
  };

  // Renderizar contenido del avatar
  const renderAvatarContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, containerStyle, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="#00DC5A" />
          {progress > 0 && (
            <Text style={[styles.progressText, { fontSize: dimensions.text / 3 }]}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      );
    }

    if (imageUrl) {
      return (
        <View style={[styles.container, containerStyle]}>
          <Image 
            source={{ uri: imageUrl }}
            style={[styles.image, containerStyle] as ImageStyle}
            onError={(error) => {
              console.warn('Error loading avatar image:', error.nativeEvent.error);
            }}
          />
        </View>
      );
    }

    // Mostrar iniciales si no hay imagen
    return (
      <View style={[styles.container, styles.initialsContainer, containerStyle]}>
        <Text style={[styles.initialsText, textStyle]}>
          {initials}
        </Text>
      </View>
    );
  };

  // Renderizar badge de estado online
  const renderOnlineBadge = () => {
    if (!showOnlineStatus) return null;

    return (
      <View 
        style={[
          styles.onlineBadge, 
          {
            width: dimensions.badge,
            height: dimensions.badge,
            borderRadius: dimensions.badge / 2,
            backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E',
          }
        ]} 
      />
    );
  };

  // Renderizar botón de edición
  const renderEditButton = () => {
    if (!editable || loading) return null;

    return (
      <TouchableOpacity
        style={[
          styles.editButton,
          {
            width: dimensions.editButton,
            height: dimensions.editButton,
            borderRadius: dimensions.editButton / 2,
          }
        ]}
        onPress={onEdit}
        activeOpacity={0.8}
      >
        <Ionicons 
          name="camera" 
          size={dimensions.editIcon} 
          color="#FFF" 
        />
      </TouchableOpacity>
    );
  };

  const AvatarComponent = (
    <View style={[styles.avatarWrapper, style]}>
      {renderAvatarContent()}
      {renderOnlineBadge()}
      {renderEditButton()}
    </View>
  );

  // Si es presionable, envolver en TouchableOpacity
  if (onPress && !loading) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        activeOpacity={0.8}
        disabled={loading}
      >
        {AvatarComponent}
      </TouchableOpacity>
    );
  }

  return AvatarComponent;
});

Avatar.displayName = 'Avatar';

const styles = StyleSheet.create({
  avatarWrapper: {
    position: 'relative',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  loadingContainer: {
    backgroundColor: 'rgba(0, 220, 90, 0.1)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    backgroundColor: '#00DC5A',
  },
  initialsText: {
    color: '#FFF',
    fontFamily: 'Outfit_600SemiBold',
    textAlign: 'center',
  },
  progressText: {
    color: '#00DC5A',
    fontFamily: 'Outfit_500Medium',
    marginTop: 2,
  },
  editButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
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
  onlineBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderWidth: 2,
    borderColor: '#FFF',
  },
});

export default Avatar;