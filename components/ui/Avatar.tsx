// components/ui/Avatar.tsx
import React, { memo, useEffect } from 'react';
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
export const Avatar: React.FC<AvatarProps> = ({ imageUrl, name, size = 'medium' }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Reset error state when imageUrl changes
  useEffect(() => {
    if (imageUrl) {
      setImageError(false);
      setImageLoading(true);
    }
  }, [imageUrl]);

  const handleImageError = (error: any) => {
    console.log('🖼️ [Avatar] Image load error:', {
      url: imageUrl,
      error: error.nativeEvent?.error || error,
    });
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    console.log('✅ [Avatar] Image loaded successfully:', imageUrl);
    setImageLoading(false);
    setImageError(false);
  };

  // Si hay error o no hay URL, mostrar placeholder
  if (!imageUrl || imageError) {
    return (
      <View style={[styles.placeholder, styles[size]]}>
        <Text style={[styles.placeholderText, styles[`${size}Text`]]}>
          {name ? name.charAt(0).toUpperCase() : '?'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles[size]]}>
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, styles[size]]}
        onError={handleImageError}
        onLoad={handleImageLoad}
        onLoadStart={() => setImageLoading(true)}
      />
      {imageLoading && (
        <View style={[styles.loadingOverlay, styles[size]]}>
          <Text style={styles.loadingText}>...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    borderRadius: 999,
  },
  placeholder: {
    backgroundColor: '#00DC5A',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontFamily: 'Outfit_600SemiBold',
  },
  loadingOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 12,
  },
  // Sizes
  small: {
    width: 32,
    height: 32,
  },
  medium: {
    width: 48,
    height: 48,
  },
  large: {
    width: 64,
    height: 64,
  },
  xlarge: {
    width: 96,
    height: 96,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 18,
  },
  largeText: {
    fontSize: 24,
  },
  xlargeText: {
    fontSize: 36,
  },
});

function useState(arg0: boolean): [any, any] {
  throw new Error('Function not implemented.');
}
